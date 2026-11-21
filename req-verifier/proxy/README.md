# Requirements Verifier: translation proxy

A Cloudflare Worker that turns one plain-English business rule into the verifier's JSON
format, using an LLM. The API key stays in the Worker. The website only ever sees the
translated JSON, and validates it before checking it.

- One endpoint: `POST /translate` with `{ "text": "...", "vocabulary": [...] }`.
- The system prompt is fixed on the server, so the endpoint can't be used as a general chat proxy.
- Only the origins in `ALLOWED_ORIGINS` are accepted, input is limited to 300 characters,
  and each IP gets 10 requests per minute.

## Deploy (about 5 minutes)

1. Create a free Cloudflare account at <https://dash.cloudflare.com/sign-up>.
2. Get an API key from Groq (<https://console.groq.com/keys>) or Mistral (<https://console.mistral.ai/api-keys>).
3. From this folder, run:

   ```bash
   npx wrangler login
   npx wrangler secret put GROQ_API_KEY
   npx wrangler deploy
   ```

   The deploy prints a URL such as `https://req-verifier-proxy.<your-subdomain>.workers.dev`.
4. Put that URL in `data-rv-endpoint` on the widget, in both places:
   - `business-analysis.html` (the `data-rv-widget` element)
   - `content/nlp-projects/requirements-verifier.md` (the `data-rv-widget` element)

Until the endpoint is set, the widget still works: the demo rules are pre-translated, and
typed rules use the built-in pattern parser.

## Switching to Mistral

In `wrangler.toml`, set `PROVIDER = "mistral"` and `MODEL = "ministral-8b-latest"`, then run:

```bash
npx wrangler secret put MISTRAL_API_KEY
npx wrangler deploy
```

(Groq returned 403 when called from the development machine, while Mistral worked. Groq
is expected to work from Cloudflare's network. If it doesn't, switch to Mistral.)

## Test locally without Cloudflare

```bash
node test-local.mjs <path-to-.env-with-the-key> mistral
```

This runs the Worker code in Node, translates three sample rules, checks them with the
site's validator, and confirms that other origins and over-long input are refused.
