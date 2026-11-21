// Cloudflare Worker: translates one business rule from English into the
// Requirements Verifier's JSON format, using Groq (default) or Mistral.
//
// The API key stays here (a Worker secret); the browser never sees it.
// Only one fixed task is exposed: the system prompt lives on the server, so the
// endpoint cannot be used as a general-purpose chat proxy.
//
// POST /translate   { "text": "...", "vocabulary": [{ "name", "type", "description" }] }
//   -> 200 { "translation": { kind, conditions, consequences, newTerms, notes } }
//
// Settings (wrangler.toml [vars]): PROVIDER = "groq" | "mistral", MODEL, ALLOWED_ORIGINS
// Secrets: GROQ_API_KEY or MISTRAL_API_KEY

const PROVIDERS = {
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", keyName: "GROQ_API_KEY", model: "llama-3.3-70b-versatile" },
  mistral: { url: "https://api.mistral.ai/v1/chat/completions", keyName: "MISTRAL_API_KEY", model: "ministral-8b-latest" },
};

const MAX_TEXT = 300;
const MAX_TERMS = 40;

const SYSTEM_PROMPT = `You translate ONE business rule about a single kind of record into JSON for a logic checker.

Output a single JSON object, nothing else:
{
  "kind": "rule" | "possibility",
  "conditions":   [atom, ...],
  "consequences": [atom, ...],
  "newTerms":     [{ "name": "camelCase", "type": "bool" | "num", "description": "short plain English" }],
  "notes": "one short sentence on how you read the rule"
}
An atom is either { "attr": "<bool term>", "value": true | false }
or { "attr": "<num term>", "op": ">" | ">=" | "<" | "<=" | "==", "value": <whole number> }.

How to read the rule:
- "must", "is", "are", "always", "cannot", "only if" describe a RULE: for every record, if all conditions hold then all consequences hold.
- "X only if Y" / "X only once Y" means: condition X, consequence Y.
- "can", "may", "is allowed to" describe a POSSIBILITY: such a record must be allowed to exist. Put everything in "conditions" and leave "consequences" empty.
- "cannot X" or "is never X" means X = false.
- Use the given vocabulary terms whenever the meaning matches, even if the wording differs (e.g. "authorised automatically" = autoApproved).
- Percentages of the merchant's fraud threshold use thresholdUsage (e.g. "above 90% of the fraud threshold" = thresholdUsage > 90, "above the threshold" = thresholdUsage > 100).
- Only if no vocabulary term fits, add a new term to "newTerms" (camelCase, starts with a lowercase letter, letters and digits only) and use it.
- Numbers must be whole numbers.

If the rule cannot be expressed this way (it is about time or order of events, compares two records, needs "or" in the consequences, or is not a business rule at all), return { "unsupported": "<short reason>" } instead.`;

const FEW_SHOT = [
  {
    user: { rule: "Held transactions cannot be settled automatically.", vocabulary: ["held", "settled", "autoApproved"] },
    assistant: { kind: "rule", conditions: [{ attr: "held", value: true }], consequences: [{ attr: "settled", value: false }], newTerms: [], notes: "Held transactions are never settled." },
  },
  {
    user: { rule: "Transactions above 120% of the fraud threshold may come from verified merchants.", vocabulary: ["thresholdUsage", "merchantKycVerified"] },
    assistant: { kind: "possibility", conditions: [{ attr: "thresholdUsage", op: ">", value: 120 }, { attr: "merchantKycVerified", value: true }], consequences: [], newTerms: [], notes: "Such a transaction must be allowed to exist." },
  },
  {
    user: { rule: "Refunded transactions must be reported to Finance.", vocabulary: ["settled"] },
    assistant: { kind: "rule", conditions: [{ attr: "refunded", value: true }], consequences: [{ attr: "reportedToFinance", value: true }], newTerms: [{ name: "refunded", type: "bool", description: "The transaction was refunded" }, { name: "reportedToFinance", type: "bool", description: "Reported to the Finance team" }], notes: "Two new terms were needed." },
  },
];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

function cleanVocabulary(vocabulary) {
  if (!Array.isArray(vocabulary)) return [];
  return vocabulary.slice(0, MAX_TERMS)
    .filter((v) => v && /^[a-z][A-Za-z0-9]{0,39}$/.test(v.name) && (v.type === "bool" || v.type === "num"))
    .map((v) => ({ name: v.name, type: v.type, description: String(v.description || "").slice(0, 160) }));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "https://mkillah.github.io").split(",").map((s) => s.trim());
    const originOk = allowed.includes(origin);
    const cors = originOk ? corsHeaders(origin) : {};

    if (request.method === "OPTIONS") return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    const url = new URL(request.url);
    if (url.pathname !== "/translate" || request.method !== "POST") return json({ error: "Not found" }, 404, cors);
    if (!originOk) return json({ error: "Origin not allowed" }, 403);

    // Optional per-IP rate limit (see wrangler.toml)
    if (env.RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: "Too many requests, please wait a minute." }, 429, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, cors); }
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return json({ error: "Missing rule text" }, 400, cors);
    if (text.length > MAX_TEXT) return json({ error: `Rule is longer than ${MAX_TEXT} characters` }, 400, cors);
    const vocabulary = cleanVocabulary(body.vocabulary);

    const provider = PROVIDERS[env.PROVIDER || "groq"];
    if (!provider) return json({ error: "Unknown provider" }, 500, cors);
    const key = env[provider.keyName];
    if (!key) return json({ error: "Translation service is not configured" }, 503, cors);

    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const ex of FEW_SHOT) {
      messages.push({ role: "user", content: JSON.stringify(ex.user) });
      messages.push({ role: "assistant", content: JSON.stringify(ex.assistant) });
    }
    messages.push({ role: "user", content: JSON.stringify({ rule: text, vocabulary }) });

    let upstream;
    try {
      upstream = await fetch(provider.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: env.MODEL || provider.model,
          messages,
          temperature: 0,
          max_tokens: 600,
          response_format: { type: "json_object" },
        }),
      });
    } catch {
      return json({ error: "Translation service unreachable" }, 502, cors);
    }
    if (!upstream.ok) return json({ error: `Translation service error (${upstream.status})` }, 502, cors);

    try {
      const data = await upstream.json();
      const translation = JSON.parse(data.choices[0].message.content);
      return json({ translation, model: env.MODEL || provider.model }, 200, cors);
    } catch {
      return json({ error: "The model did not return valid JSON" }, 502, cors);
    }
  },
};
