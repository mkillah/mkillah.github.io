// Tests for the Requirements Verifier engine.
// Run:  node --test tests/
// Set LEAN_OUT=<file> to also write the generated Lean for every demo into one file
// (paste it into https://live.lean-lang.org to check the proofs).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const context = vm.createContext({});
vm.runInContext(readFileSync(new URL("assets/js/req-verifier-engine.js", root), "utf8"), context);
const E = context.ReqVerifierEngine;
const base = JSON.parse(readFileSync(new URL("content/req-verifier/nordpay-rules.json", root), "utf8"));

test("NordPay rule base is consistent, with no dead rules", () => {
  const health = E.checkBase(base);
  assert.equal(health.issues.length, 0, JSON.stringify(health.issues));
  assert.equal(health.ok, true);
  assert.equal(health.ruleCount, 11);
  assert.equal(health.possibilityCount, 3);
});

const leanParts = [];
for (const demo of base.demos) {
  test(`demo "${demo.label}" gives verdict ${demo.expect}`, () => {
    const t = E.validateTranslation(demo.translation, base.vocabulary);
    assert.equal(t.ok, true, t.error);
    const result = E.checkNewRule(base, { ...t.req, id: "NEW", text: demo.text }, t.newTerms);
    assert.equal(result.verdict, demo.expect, JSON.stringify(result.findings.map((f) => f.title)));
    const lean = E.generateLean(result, "NordPay");
    assert.match(lean, /theorem /);
    leanParts.push(`namespace Demo${leanParts.length + 1}\n${lean}\nend Demo${leanParts.length + 1}\n`);
  });
}

test("contradiction demo names the broken possibility and the rules behind it", () => {
  const demo = base.demos.find((d) => d.expect === "contradiction");
  const t = E.validateTranslation(demo.translation, base.vocabulary);
  const f = E.checkNewRule(base, { ...t.req, text: demo.text }, t.newTerms).findings[0];
  assert.ok(f.ids.includes("P-03"));
  assert.ok(f.ids.includes("NEW"));
  assert.ok(f.ids.includes("BR-10"));
});

test("validator rejects malformed LLM output", () => {
  const v = base.vocabulary;
  assert.equal(E.validateTranslation(null, v).ok, false);
  assert.equal(E.validateTranslation({ kind: "rule", conditions: [], consequences: [] }, v).ok, false);
  assert.equal(E.validateTranslation({ kind: "rule", conditions: [{ attr: "unknownThing", value: true }], consequences: [{ attr: "held", value: true }] }, v).ok, false);
  assert.equal(E.validateTranslation({ kind: "rule", conditions: [{ attr: "thresholdUsage", op: ">", value: 9.5 }], consequences: [{ attr: "held", value: true }] }, v).ok, false);
  assert.equal(E.validateTranslation({ kind: "rule", conditions: [{ attr: "held", value: "yes" }], consequences: [{ attr: "held", value: true }] }, v).ok, false);
  assert.equal(E.validateTranslation({ kind: "rule", conditions: [], consequences: [{ attr: "held", value: true }], newTerms: [{ name: "Bad Name", type: "bool" }] }, v).ok, false);
  assert.equal(E.validateTranslation({ unsupported: "mentions time" }, v).ok, false);
  const ok = E.validateTranslation({ kind: "possibility", conditions: [{ attr: "held", value: true }], consequences: [] }, v);
  assert.equal(ok.ok, true);
});

test("offline pattern parser translates a simple rule", () => {
  const t = E.translateWithPatterns("Held transactions cannot be settled.", base.vocabulary);
  assert.equal(t.ok, true, t.error);
  assert.equal(JSON.stringify(t.req.conditions), JSON.stringify([{ kind: "bool", attr: "held", value: true }]));
  assert.equal(JSON.stringify(t.req.consequences), JSON.stringify([{ kind: "bool", attr: "settled", value: false }]));
});

test("write Lean for all demos (optional)", () => {
  if (process.env.LEAN_OUT) writeFileSync(process.env.LEAN_OUT, leanParts.join("\n"));
});
