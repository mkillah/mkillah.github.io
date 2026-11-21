// Serves the Worker locally on http://localhost:8787 for testing the website end to end.
// The key is read from a .env file and never printed.
//
//   node serve-local.mjs <path-to-.env> [groq|mistral] [model]
//
// Then set data-rv-endpoint="http://localhost:8787" on the widget (local testing only).

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import worker from "./worker.js";

const [envFile, provider = "groq", model] = process.argv.slice(2);
if (!envFile) { console.error("Usage: node serve-local.mjs <path-to-.env> [groq|mistral] [model]"); process.exit(1); }

const env = {
  PROVIDER: provider,
  ALLOWED_ORIGINS: "http://localhost:8123,http://localhost:8124,http://localhost:8125,http://127.0.0.1:8125",
};
if (model) env.MODEL = model;
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*(GROQ_API_KEY|MISTRAL_API_KEY)\s*=\s*"?([^"\s]+)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const PORT = Number(process.env.PORT || 8787);
createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await worker.fetch(request, env);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
  console.log(`${req.method} ${req.url} -> ${response.status}`);
}).listen(PORT, () => console.log(`Translation proxy (${provider}) on http://localhost:${PORT}`));
