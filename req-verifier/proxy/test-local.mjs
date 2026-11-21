// Runs the Worker locally in Node (no Cloudflare account needed) against the real LLM API.
// The key is read from a .env file and never printed.
//
//   node test-local.mjs <path-to-.env> [groq|mistral] [model]
//
// Checks: three sample rules translate and pass the site's validator; other origins
// are refused; over-long input is refused.

import { readFileSync } from "node:fs";
import vm from "node:vm";
import worker from "./worker.js";

const [envFile, provider = "groq", model] = process.argv.slice(2);
if (!envFile) { console.error("Usage: node test-local.mjs <path-to-.env> [groq|mistral] [model]"); process.exit(1); }

const env = { PROVIDER: provider, ALLOWED_ORIGINS: "https://mkillah.github.io" };
if (model) env.MODEL = model;
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*(GROQ_API_KEY|MISTRAL_API_KEY)\s*=\s*"?([^"\s]+)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

// The site's validator, so we test exactly what the browser would accept.
const ctx = vm.createContext({});
vm.runInContext(readFileSync(new URL("../../assets/js/req-verifier-engine.js", import.meta.url), "utf8"), ctx);
const engine = ctx.ReqVerifierEngine;
const base = JSON.parse(readFileSync(new URL("../../content/req-verifier/nordpay-rules.json", import.meta.url), "utf8"));

const call = (body, origin = "https://mkillah.github.io") => worker.fetch(new Request("https://proxy.test/translate", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body),
}), env);

const samples = [
  "Transactions above 95% of the fraud threshold are rejected automatically.",
  "A transaction that is authorised automatically must not be held.",
  "Payments from merchants that failed KYC may still be reviewed by an analyst.",
];

let failures = 0;
for (const text of samples) {
  const res = await call({ text, vocabulary: base.vocabulary });
  const data = await res.json();
  if (res.status !== 200) { failures++; console.log(`FAIL ${res.status} ${text}\n     ${data.error}`); continue; }
  const v = engine.validateTranslation(data.translation, base.vocabulary);
  if (!v.ok) { failures++; console.log(`FAIL invalid: ${text}\n     ${v.error}\n     ${JSON.stringify(data.translation)}`); continue; }
  const verdict = engine.checkNewRule(base, { ...v.req, text }, v.newTerms).verdict;
  console.log(`ok   ${text}\n     ${engine.interpretation(v.req)}  [${verdict}]${v.newTerms.length ? "  new: " + v.newTerms.map((t) => t.name).join(", ") : ""}`);
}

const bad = await call({ text: "x", vocabulary: [] }, "https://evil.example");
console.log(`${bad.status === 403 ? "ok  " : "FAIL"} other origin refused (${bad.status})`);
if (bad.status !== 403) failures++;

const long = await call({ text: "a".repeat(301), vocabulary: [] });
console.log(`${long.status === 400 ? "ok  " : "FAIL"} long input refused (${long.status})`);
if (long.status !== 400) failures++;

process.exit(failures ? 1 : 0);
