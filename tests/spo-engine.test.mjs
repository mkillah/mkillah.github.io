// node --test tests/spo-engine.test.mjs
// The JavaScript port must give the same facts as the notebook's Python code
// on the same spaCy parses (fixtures made with spaCy 3.8, en_core_web_sm).
// Set COMPROMISE=<path to compromise> to also smoke-test the simplified parser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { extract, parseText } = require("../assets/js/spo-engine.js");
const examples = JSON.parse(readFileSync(new URL("../content/nlp-projects/spo-examples.json", import.meta.url))).examples;
const expected = JSON.parse(readFileSync(new URL("./fixtures/spo-expected.json", import.meta.url)));

for (const ex of examples) {
  test(`port matches the notebook: ${ex.id}`, () => {
    const got = extract(ex.tokens).map(({ subject, predicate, objects }) => ({ subject, predicate, objects }));
    assert.deepEqual(got, expected.find((e) => e.id === ex.id).facts);
  });
}

test("highlight ids point at the right tokens", () => {
  const ex = examples.find((e) => e.id === "curie");
  const [first] = extract(ex.tokens);
  assert.equal(first.ids.p.map((i) => ex.tokens[i].t).join(" "), "discovered");
  assert.deepEqual(first.ids.o.map((i) => ex.tokens[i].t), ["polonium", "radium"]);
});

if (process.env.COMPROMISE) {
  const mod = require(process.env.COMPROMISE);
  const nlp = mod.default || mod;
  test("simplified parser: every token has a valid head, and facts come out", () => {
    for (const ex of examples) {
      const { tokens, sentences } = parseText(ex.text, nlp);
      tokens.forEach((t, i) => {
        assert.ok(t.d, `token ${i} (${t.t}) has no dep`);
        assert.ok(t.h >= 0 && t.h < tokens.length, `token ${i} head out of range`);
      });
      assert.equal(sentences.at(-1)[1], tokens.length);
      const facts = extract(tokens);
      assert.ok(facts.length > 0, `no facts for ${ex.id}`);
      if (process.env.VERBOSE) {
        console.log(`== ${ex.id}`);
        for (const f of facts) console.log(`  ${f.subject} | ${f.predicate} | ${JSON.stringify(f.objects)}`);
      }
    }
  });
}
