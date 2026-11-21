// Requirements Verifier engine (no DOM, so it also runs in Node for tests).
//
// A rule base is a set of requirements about one entity (e.g. a transaction):
//   rule         for every record: if all `conditions` hold, all `consequences` hold
//   possibility  some record where all `conditions` hold must be allowed to exist
// Atoms: { kind: "bool", attr, value } or { kind: "num", attr, op, value }.
//
// Numbers only appear in threshold comparisons, so testing n-1, n, n+1 around every
// threshold (plus 0) covers every case: the search below is complete, not a sample.
// Every finding is also written as a Lean 4 theorem that can be checked independently.

(function (global) {
  "use strict";

  // ============================================================ pattern parser
  // Offline fallback for turning English into atoms (the LLM is the main path).

  const ENTITIES = {
    customer: "age", client: "age", user: "age", applicant: "age",
    transaction: "amount", payment: "amount", order: "amount",
    merchant: "volume", account: "balance",
  };
  const LEAN_KEYWORDS = new Set(["abbrev", "at", "by", "class", "def", "deriving", "do", "else", "end",
    "example", "false", "from", "fun", "have", "if", "import", "in", "instance", "let", "match",
    "namespace", "open", "section", "show", "structure", "then", "theorem", "true", "variable", "where", "with", "x"]);

  const PHRASE_OPS = {
    "at least": ">=", "no less than": ">=", "at most": "<=", "no more than": "<=",
    over: ">", above: ">", "more than": ">", "older than": ">",
    under: "<", below: "<", "less than": "<", "younger than": "<", exactly: "==",
  };
  const COMP = "(?<op>at least|at most|no more than|no less than|over|above|more than|older than|under|below|less than|younger than|exactly)";
  const CUR = "(?:dkk |eur |usd |\\$|€)?";
  const NUM = CUR + "(?<n>\\d[\\d,]*)";
  const YEARS = "(?: years?(?: old)?)?";
  const ENT = "(?<ent>" + Object.keys(ENTITIES).join("|") + ")s?";
  const SUBJ = "^(?:all |every |any |an? |the )?(?:(?<group>[a-z][a-z-]*(?: [a-z][a-z-]*)?) )?" + ENT +
    "(?: (?:who are |that are |aged |with an? (?:amount|value) )?" +
    "(?<sop>under|below|younger than|over|above|more than|less than|older than|at least|at most) " +
    CUR + "(?<sn>\\d[\\d,]*)" + YEARS + ")?";
  const GET = "(?:receive|get|obtain|be eligible for|be approved for|be granted|qualify for)";
  const NOT = "(?:cannot|can't|can not|must not|may not|shall not|should not|will not|won't)";
  const STATE = "(?<state>held|approved|authori[sz]ed|flagged|blocked|rejected|reviewed|escalated|settled|refunded|verified|suspended|cancell?ed)(?: for (?:manual )?review)?";
  const PURPOSE = "(?: (?:to|in order to|before they can|to be able to) (?<purpose>.+))?";
  const AUTO = "(?:always |automatically )?";

  // [regex, kind, builder]. Order matters: negative patterns come before positive ones.
  const PATTERNS = [
    [SUBJ + " (?:must|should|shall|needs? to) be " + COMP + " " + NUM + YEARS + PURPOSE + "$", "rule", "num_default"],
    [SUBJ + " (?:must|should|shall|needs? to) have an? (?<attr>[a-z][a-z ]*?) (?:of )?" + COMP + " " + NUM + PURPOSE + "$", "rule", "num_attr"],
    [SUBJ + " " + NOT + " " + GET + " (?<obj>.+)$", "rule", "obj_false"],
    [SUBJ + " (?:are|is) (?:never |not )(?:eligible for|entitled to|approved for|granted) (?<obj>.+)$", "rule", "obj_false"],
    [SUBJ + " " + NOT + " (?:be )?" + AUTO + STATE + "$", "rule", "state_false"],
    [SUBJ + " (?:are|is) (?:never|not) " + AUTO + STATE + "$", "rule", "state_false"],
    [SUBJ + " (?:are|is) " + AUTO + "(?:eligible for|entitled to|approved for|granted) (?<obj>.+)$", "rule", "obj_true"],
    [SUBJ + " (?:must|will|shall) " + AUTO + GET + " (?<obj>.+)$", "rule", "obj_true"],
    [SUBJ + " (?:must|will|shall|should) " + AUTO + "be " + AUTO + STATE + "$", "rule", "state_true"],
    [SUBJ + " (?:are|is) " + AUTO + STATE + "$", "rule", "state_true"],
    [SUBJ + " (?:can|may|might) be " + COMP + " " + NUM + YEARS + "$", "possibility", "num_default"],
    [SUBJ + " (?:can|may|might) have an? (?<attr>[a-z][a-z ]*?) (?:of )?" + COMP + " " + NUM + "$", "possibility", "num_attr"],
    [SUBJ + " (?:can|may|might) be " + STATE + "$", "possibility", "state_true"],
    [SUBJ + " (?:can|may|might) " + GET + " (?<obj>.+)$", "possibility", "obj_true"],
  ].map(([src, kind, builder]) => ({ re: new RegExp(src), kind, builder }));

  function ident(words) {
    const parts = words.toLowerCase().match(/[a-z0-9]+/g) || ["x"];
    let name = parts[0] + parts.slice(1).map((p) => p[0].toUpperCase() + p.slice(1)).join("");
    if (/^\d/.test(name)) name = "x" + name;
    return LEAN_KEYWORDS.has(name) ? name + "_" : name;
  }

  function objectAttr(phrase) {
    let p = phrase.trim();
    p = p.replace(/^(?:be )?(?:receive|get|obtain|eligible for|approved for|granted|qualify for|apply for|open|have)\s+/, "");
    p = p.replace(/^(?:a|an|the|any)\s+/, "");
    return ident(p) + "Eligible";
  }

  const stateAttr = (state) => state.replace(/^authorized$/, "authorised").replace(/^canceled$/, "cancelled");
  const toInt = (s) => parseInt(s.replace(/,/g, ""), 10);

  function splitSentences(text) {
    const out = [];
    text.split(/\r?\n/).forEach((line, i) => {
      line.split(/(?<=[.!?;])\s+/).forEach((s) => { if (s.trim()) out.push([i + 1, s.trim()]); });
    });
    return out;
  }

  const normalize = (sentence) =>
    sentence.toLowerCase().trim().replace(/[.!;]+$/, "").replace(/’/g, "'").replace(/\s+/g, " ");

  /** Parses one or more controlled-English sentences into requirements. */
  function parse(text) {
    const model = { entity: null, attributes: {}, requirements: [], unparsed: [] };
    let counter = 0;
    for (const [line, sentence] of splitSentences(text)) {
      const s = normalize(sentence);
      let matched = null;
      for (const p of PATTERNS) {
        const m = s.match(p.re);
        if (m) { matched = { p, g: m.groups }; break; }
      }
      if (!matched) { model.unparsed.push({ line, text: sentence, reason: "pattern not recognised" }); continue; }

      const { p, g } = matched;
      if (model.entity && g.ent !== model.entity) {
        model.unparsed.push({ line, text: sentence, reason: `talks about ${g.ent}s, but the set is about ${model.entity}s` });
        continue;
      }
      model.entity = g.ent;
      const defNum = ENTITIES[g.ent];

      const subj = [];
      if (g.group && !["the", "all", "every", "any", "a", "an"].includes(g.group)) subj.push({ kind: "bool", attr: ident(g.group), value: true });
      if (g.sop) subj.push({ kind: "num", attr: defNum, op: PHRASE_OPS[g.sop], value: toInt(g.sn) });

      let main;
      if (p.builder === "num_default") main = { kind: "num", attr: defNum, op: PHRASE_OPS[g.op], value: toInt(g.n) };
      else if (p.builder === "num_attr") main = { kind: "num", attr: ident(g.attr), op: PHRASE_OPS[g.op], value: toInt(g.n) };
      else if (p.builder.startsWith("state")) main = { kind: "bool", attr: stateAttr(g.state), value: p.builder === "state_true" };
      else main = { kind: "bool", attr: objectAttr(g.obj), value: p.builder === "obj_true" };

      const id = "R" + ++counter;
      if (p.kind === "possibility") {
        model.requirements.push({ id, text: sentence, kind: "possibility", conditions: [...subj, main], consequences: [] });
      } else {
        const conds = [...subj];
        if (g.purpose) conds.push({ kind: "bool", attr: objectAttr(g.purpose), value: true });
        model.requirements.push({ id, text: sentence, kind: "rule", conditions: conds, consequences: [main] });
      }
    }
    for (const r of model.requirements) {
      for (const a of [...r.conditions, ...r.consequences]) {
        if (!model.attributes[a.attr]) model.attributes[a.attr] = a.kind;
      }
    }
    model.entity = model.entity || "customer";
    return model;
  }

  // ============================================================ formatting

  const SYM = { ">=": "≥", "<=": "≤", ">": ">", "<": "<", "==": "=" };
  const fmtNum = (n) => Number(n).toLocaleString("en-US");
  const atomKey = (a) => (a.kind === "bool" ? `${a.attr}=${a.value}` : `${a.attr}${a.op}${a.value}`);
  const describeAtom = (a) => (a.kind === "bool" ? (a.value ? a.attr : "¬" + a.attr) : `${a.attr} ${SYM[a.op]} ${fmtNum(a.value)}`);
  const conj = (atoms) => atoms.map(describeAtom).join(" ∧ ");

  function formal(r) {
    if (r.kind === "possibility") return `∃ x, ${conj(r.conditions) || "True"}`;
    return r.conditions.length ? `∀ x, ${conj(r.conditions)} → ${conj(r.consequences)}` : `∀ x, ${conj(r.consequences)}`;
  }

  /** Plain reading of a translated requirement, e.g. "IF thresholdUsage > 95 THEN rejected". */
  function interpretation(r) {
    if (r.kind === "possibility") return `THERE CAN BE a record with ${conj(r.conditions)}`;
    return r.conditions.length ? `IF ${conj(r.conditions)} THEN ${conj(r.consequences)}` : `ALWAYS ${conj(r.consequences)}`;
  }

  function describeRecord(entity, rec) {
    const parts = Object.entries(rec).map(([k, v]) => (typeof v === "boolean" ? (v ? k : "not " + k) : `${k} ${fmtNum(v)}`));
    return `a ${entity} with ${parts.join(", ")}`;
  }

  // ============================================================ model finder

  function holds(a, w) {
    const v = w[a.attr];
    if (a.kind === "bool") return v === a.value;
    return { ">=": v >= a.value, "<=": v <= a.value, ">": v > a.value, "<": v < a.value, "==": v === a.value }[a.op];
  }
  const ruleOk = (r, w) => !r.conditions.every((a) => holds(a, w)) || r.consequences.every((a) => holds(a, w));
  const rulesOf = (reqs) => reqs.filter((r) => r.kind === "rule");
  const allAtoms = (reqs) => reqs.flatMap((r) => [...r.conditions, ...(r.consequences || [])]);

  /** The opposite of an atom, as a list of alternatives (x == n becomes x < n or x > n). */
  function negateAtom(a) {
    if (a.kind === "bool") return [{ ...a, value: !a.value }];
    const flip = { ">": "<=", ">=": "<", "<": ">=", "<=": ">" };
    if (a.op === "==") return [{ ...a, op: "<" }, { ...a, op: ">" }];
    return [{ ...a, op: flip[a.op] }];
  }

  function candidateValues(model) {
    const values = {};
    const atoms = allAtoms(model.requirements);
    for (const [attr, kind] of Object.entries(model.attributes)) {
      if (kind === "bool") { values[attr] = [true, false]; continue; }
      const pts = new Set([0]);
      for (const a of atoms) {
        if (a.attr === attr) [a.value - 1, a.value, a.value + 1].forEach((x) => x >= 0 && pts.add(x));
      }
      values[attr] = [...pts].sort((x, y) => y - x); // prefer realistic values (96 over 0)
    }
    return values;
  }

  const MAX_WORLDS = 300000;
  const worldCache = new WeakMap();

  /** Every relevant record for this model (cached per model object). */
  function allWorlds(model) {
    if (worldCache.has(model)) return worldCache.get(model);
    const values = candidateValues(model);
    const attrs = Object.keys(values);
    const out = [];
    const idx = attrs.map(() => 0);
    while (out.length < MAX_WORLDS) {
      const w = {};
      attrs.forEach((a, i) => { w[a] = values[a][idx[i]]; });
      out.push(w);
      let i = attrs.length - 1;
      while (i >= 0 && ++idx[i] === values[attrs[i]].length) { idx[i] = 0; i--; }
      if (i < 0) break;
    }
    worldCache.set(model, out);
    return out;
  }

  const satisfies = (w, scenario, rules) => scenario.every((a) => holds(a, w)) && rules.every((r) => ruleOk(r, w));

  function findWorld(model, scenario, rules) {
    return allWorlds(model).find((w) => satisfies(w, scenario, rules)) || null;
  }

  /** Smallest subset of `rules` that still makes `scenario` impossible (deletion-based). */
  function minimalConflict(model, scenario, rules) {
    let core = [...rules];
    for (const r of [...core]) {
      const trial = core.filter((x) => x !== r);
      if (!findWorld(model, scenario, trial)) core = trial;
    }
    return core;
  }

  function project(w, attrs) {
    return Object.fromEntries(Object.entries(w).filter(([k]) => attrs.has(k)));
  }

  function attrsOf(scenario, rules) {
    return new Set([...scenario.map((a) => a.attr), ...allAtoms(rules).map((a) => a.attr)]);
  }

  // ============================================================ rule base

  const BOOL_OPS = new Set(["=="]);
  const NUM_OPS = new Set([">=", "<=", ">", "<", "=="]);
  const NAME_RE = /^[a-z][A-Za-z0-9]{0,39}$/;

  /** Builds the checkable model of a rule base (+ an optional extra requirement). */
  function buildModel(base, extra = null, extraTerms = []) {
    const attributes = {};
    for (const v of base.vocabulary) attributes[v.name] = v.type;
    for (const t of extraTerms) if (!attributes[t.name]) attributes[t.name] = t.type;
    const requirements = extra ? [...base.requirements, extra] : [...base.requirements];
    for (const a of allAtoms(requirements)) if (!attributes[a.attr]) attributes[a.attr] = a.kind;
    return { entity: base.entity, attributes, requirements };
  }

  /** Health check of the rule base on its own: satisfiable, possibilities allowed, no dead rules. */
  function checkBase(base) {
    const model = buildModel(base);
    const rules = rulesOf(model.requirements);
    const issues = [];
    if (!findWorld(model, [], rules)) issues.push({ type: "contradiction", ids: rules.map((r) => r.id), summary: "The rules contradict each other." });
    for (const r of model.requirements) {
      if (r.kind === "possibility" && !findWorld(model, r.conditions, rules)) {
        issues.push({ type: "contradiction", ids: [r.id, ...minimalConflict(model, r.conditions, rules).map((x) => x.id)], summary: `${r.id} is impossible under the rules.` });
      }
      if (r.kind === "rule" && r.conditions.length && !findWorld(model, r.conditions, rules)) {
        issues.push({ type: "dead", ids: [r.id], summary: `${r.id} can never apply.` });
      }
    }
    return {
      ok: issues.length === 0,
      issues,
      ruleCount: rules.length,
      possibilityCount: model.requirements.length - rules.length,
    };
  }

  /**
   * Checks whether a new requirement fits the rule base.
   * Returns { verdict, findings, model } where verdict is the most serious finding type:
   *   contradiction > dead > redundant > side-effect > fits
   * Each finding carries the rule IDs involved and the Lean proofs that back it.
   */
  function checkNewRule(base, newReq, newTerms = []) {
    const nr = { ...newReq, id: newReq.id || "NEW" };
    const model = buildModel(base, nr, newTerms);
    const E = model.entity;
    const baseReqs = base.requirements;
    const before = rulesOf(baseReqs);
    const after = nr.kind === "rule" ? [...before, nr] : before;
    const worlds = allWorlds(model);
    const validBefore = worlds.filter((w) => before.every((r) => ruleOk(r, w)));
    const validAfter = nr.kind === "rule" ? validBefore.filter((w) => ruleOk(nr, w)) : validBefore;
    const possible = (set, scenario) => set.find((w) => scenario.every((a) => holds(a, w))) || null;
    const ids = (rules) => rules.map((r) => r.id);
    const findings = [];

    const impossibleProof = (name, scenario, rules) => ({ name, mode: "impossible", scenario, rules: ids(rules) });
    const witnessProof = (name, scenario, ruleSet, world) => ({ name, mode: "witness", scenario, ruleSet, world });

    // 1. Contradictions -------------------------------------------------------
    if (!validAfter.length) {
      const core = minimalConflict(model, [], after);
      findings.push({
        type: "contradiction", ids: ids(core),
        title: "The rules contradict each other",
        summary: `With ${nr.id}, no ${E} can satisfy all rules at once.`,
        proofs: [impossibleProof("rules_contradict", [], core)],
      });
    } else {
      for (const p of baseReqs.filter((r) => r.kind === "possibility")) {
        if (possible(validAfter, p.conditions)) continue;
        const core = minimalConflict(model, p.conditions, after);
        const example = possible(validBefore, p.conditions);
        findings.push({
          type: "contradiction", ids: [p.id, ...ids(core)],
          title: `${p.id} becomes impossible`,
          summary: `“${p.text}” can no longer happen: it clashes with ${ids(core).join(" + ")}.` +
            (example ? ` Before, ${describeRecord(E, project(example, attrsOf(p.conditions, core)))} was allowed; now it breaks ${ids(core.filter((r) => !ruleOk(r, example))).join(", ")}.` : ""),
          proofs: [impossibleProof(`${leanId(p.id)}_broken`, p.conditions, core)],
        });
      }
      if (nr.kind === "possibility" && !possible(validBefore, nr.conditions)) {
        const core = minimalConflict(model, nr.conditions, before);
        findings.push({
          type: "contradiction", ids: [nr.id, ...ids(core)],
          title: `${nr.id} is impossible under the rule base`,
          summary: `No ${E} with ${conj(nr.conditions)} can exist, because of ${ids(core).join(" + ")}.`,
          proofs: [impossibleProof(`${leanId(nr.id)}_impossible`, nr.conditions, core)],
        });
      }
    }
    const hasContradiction = findings.length > 0;

    // 2. Dead rules ----------------------------------------------------------
    if (!hasContradiction && nr.kind === "rule" && nr.conditions.length && !possible(validAfter, nr.conditions)) {
      const core = minimalConflict(model, nr.conditions, after);
      const others = ids(core).filter((x) => x !== nr.id);
      findings.push({
        type: "dead", ids: [nr.id, ...others],
        title: `${nr.id} can never apply`,
        summary: `No ${E} can ever have ${conj(nr.conditions)}` + (others.length ? `, because of ${others.join(" + ")}.` : ".") +
          " The rule would never be triggered.",
        proofs: [impossibleProof(`${leanId(nr.id)}_never_applies`, nr.conditions, core)],
      });
    }
    if (!hasContradiction && nr.kind === "rule") {
      for (const r of before.filter((x) => x.conditions.length)) {
        if (!possible(validBefore, r.conditions) || possible(validAfter, r.conditions)) continue;
        const core = minimalConflict(model, r.conditions, after);
        findings.push({
          type: "dead", ids: [r.id, ...ids(core).filter((x) => x !== r.id)],
          title: `${r.id} can no longer apply`,
          summary: `After adding ${nr.id}, no ${E} can trigger ${r.id} (“${r.text}”).`,
          proofs: [impossibleProof(`${leanId(r.id)}_now_dead`, r.conditions, core)],
        });
      }
    }
    const hasDead = findings.some((f) => f.type === "dead");

    // 3. Redundant: the base already implies the new rule ---------------------
    if (!hasContradiction && !hasDead && nr.kind === "rule") {
      const breaks = nr.consequences.flatMap((c) => negateAtom(c).map((n) => [...nr.conditions, n]));
      if (breaks.every((s) => !possible(validBefore, s))) {
        const cores = breaks.map((s) => minimalConflict(model, s, before));
        const implied = [...new Set(cores.flatMap(ids))];
        findings.push({
          type: "redundant", ids: [nr.id, ...implied],
          title: `${nr.id} is already covered`,
          summary: `The rule base already guarantees this: ${implied.join(" + ")} imply it. Adding it changes nothing.`,
          proofs: breaks.map((s, i) => impossibleProof(`${leanId(nr.id)}_implied${breaks.length > 1 ? "_" + (i + 1) : ""}`, s, cores[i])),
        });
      }
    }

    // 4. Side effects: combinations that were allowed before but are now impossible
    //    for a reason other than the new rule alone.
    if (!findings.length && nr.kind === "rule") {
      const validNewOnly = worlds.filter((w) => ruleOk(nr, w));
      const uniq = (atoms) => [...new Map(atoms.map((a) => [atomKey(a), a])).values()];
      const withNeg = (atoms) => uniq(atoms.flatMap((a) => [a, ...negateAtom(a)]));
      const newAtoms = withNeg([...nr.conditions, ...nr.consequences]);
      const baseAtoms = withNeg(allAtoms(baseReqs));
      const lost = [];
      const isLost = (s) => possible(validBefore, s) && !possible(validAfter, s) && possible(validNewOnly, s);
      for (const a of baseAtoms) if (isLost([a])) lost.push([a]);
      const lostSingles = new Set(lost.map((s) => atomKey(s[0])));
      const seen = new Set();
      for (const a of newAtoms) {
        for (const b of baseAtoms) {
          if (a.attr === b.attr || lostSingles.has(atomKey(a)) || lostSingles.has(atomKey(b))) continue;
          const key = [atomKey(a), atomKey(b)].sort().join("|");
          if (seen.has(key)) continue;
          seen.add(key);
          if (isLost([a, b])) lost.push([a, b]);
        }
      }
      if (lost.length) {
        const items = lost.slice(0, 5).map((s) => ({ scenario: s, core: minimalConflict(model, s, after), before: possible(validBefore, s) }));
        findings.push({
          type: "side-effect", ids: [...new Set(items.flatMap((it) => ids(it.core)))],
          title: `${nr.id} has side effects`,
          summary: `The rule is consistent, but it also rules out ${items.length === 1 ? "a case" : items.length + " cases"} that the rule base allowed before:`,
          items: items.map((it) => ({ text: conj(it.scenario), ids: ids(it.core) })),
          proofs: items.flatMap((it, i) => [
            witnessProof(`side_effect_${i + 1}_before`, it.scenario, "before", it.before),
            impossibleProof(`side_effect_${i + 1}_after`, it.scenario, it.core),
          ]),
        });
      }
    }

    // 5. Fits ------------------------------------------------------------------
    if (!findings.length) {
      const scenario = nr.kind === "rule" ? nr.conditions : nr.conditions;
      const w = possible(validAfter, scenario) || validAfter[0];
      findings.push({
        type: "fits", ids: [nr.id],
        title: `${nr.id} fits the rule base`,
        summary: `No contradictions, dead rules or side effects. Every possibility in the rule base is still allowed${nr.kind === "rule" && nr.conditions.length ? `, and the rule can apply, e.g. to ${describeRecord(E, project(w, attrsOf(nr.conditions, [nr])))}` : ""}.`,
        proofs: [witnessProof(`${leanId(nr.id)}_fits`, scenario, "after", w)],
      });
    }

    const order = ["contradiction", "dead", "redundant", "side-effect", "fits"];
    const verdict = order.find((t) => findings.some((f) => f.type === t));
    return { verdict, findings, model, newReq: nr };
  }

  // ============================================================ LLM output validation

  /**
   * Validates the JSON an LLM returned for one rule, against the vocabulary.
   * Returns { ok: true, req, newTerms, notes } or { ok: false, error }.
   */
  function validateTranslation(obj, vocabulary) {
    const fail = (error) => ({ ok: false, error });
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return fail("The translation is not a JSON object.");
    if (obj.unsupported) return fail(`This rule cannot be expressed yet: ${String(obj.unsupported).slice(0, 240)}`);
    if (obj.kind !== "rule" && obj.kind !== "possibility") return fail("Missing or unknown rule kind.");

    const types = Object.fromEntries(vocabulary.map((v) => [v.name, v.type]));
    const newTerms = [];
    for (const t of Array.isArray(obj.newTerms) ? obj.newTerms : []) {
      if (!t || !NAME_RE.test(t.name || "") || LEAN_KEYWORDS.has(t.name)) return fail(`Invalid new term name: ${String(t && t.name).slice(0, 40)}`);
      if (t.type !== "bool" && t.type !== "num") return fail(`Invalid type for new term ${t.name}.`);
      if (types[t.name]) continue; // already known: just reuse it
      types[t.name] = t.type;
      newTerms.push({ name: t.name, type: t.type, description: String(t.description || "").slice(0, 160) });
    }
    if (newTerms.length > 4) return fail("Too many new terms.");

    function atom(a) {
      if (!a || typeof a !== "object") throw new Error("An atom is not an object.");
      const type = types[a.attr];
      if (!type) throw new Error(`Unknown term “${String(a.attr).slice(0, 40)}”.`);
      if (type === "bool") {
        if (a.op !== undefined && !BOOL_OPS.has(a.op)) throw new Error(`Invalid operator for ${a.attr}.`);
        if (typeof a.value !== "boolean") throw new Error(`${a.attr} needs true or false.`);
        return { kind: "bool", attr: a.attr, value: a.value };
      }
      if (!NUM_OPS.has(a.op)) throw new Error(`Invalid operator for ${a.attr}.`);
      if (!Number.isInteger(a.value) || a.value < 0 || a.value > 1e9) throw new Error(`${a.attr} needs a whole number ≥ 0.`);
      return { kind: "num", attr: a.attr, op: a.op, value: a.value };
    }

    try {
      const conditions = (Array.isArray(obj.conditions) ? obj.conditions : []).map(atom);
      const consequences = (Array.isArray(obj.consequences) ? obj.consequences : []).map(atom);
      if (conditions.length > 6 || consequences.length > 6) return fail("The rule has too many parts.");
      if (obj.kind === "rule" && !consequences.length) return fail("A rule needs at least one consequence.");
      if (obj.kind === "possibility" && (!conditions.length || consequences.length)) return fail("A possibility needs conditions and no consequences.");
      return {
        ok: true,
        req: { kind: obj.kind, conditions, consequences },
        newTerms: newTerms.filter((t) => [...conditions, ...consequences].some((a) => a.attr === t.name)),
        notes: typeof obj.notes === "string" ? obj.notes.slice(0, 300) : "",
      };
    } catch (e) {
      return fail(e.message);
    }
  }

  /** Offline fallback: the pattern parser, mapped onto the same shape as an LLM translation. */
  function translateWithPatterns(text, vocabulary) {
    const parsed = parse(text);
    if (!parsed.requirements.length) return { ok: false, error: "The offline parser did not recognise this sentence pattern." };
    const r = parsed.requirements[0];
    const known = new Set(vocabulary.map((v) => v.name));
    const newTerms = [...new Map([...r.conditions, ...r.consequences]
      .filter((a) => !known.has(a.attr))
      .map((a) => [a.attr, { name: a.attr, type: a.kind, description: "Added by the offline pattern parser" }])).values()];
    return validateTranslation({ kind: r.kind, conditions: r.conditions, consequences: r.consequences, newTerms }, vocabulary);
  }

  // ============================================================ Lean generation

  const leanId = (id) => String(id).replace(/[^A-Za-z0-9_]/g, "") || "R";
  const leanAtom = (a) => (a.kind === "bool" ? `x.${a.attr} = ${a.value}` : `x.${a.attr} ${SYM[a.op]} ${a.value}`);
  const leanConj = (atoms) => (atoms.length ? atoms.map(leanAtom).join(" ∧ ") : "True");
  const doc = (t) => String(t).replace(/-\//g, "- /").replace(/\/-/g, "/ -"); // user text must not close the comment
  const leanValue = (v) => (typeof v === "boolean" ? String(v) : String(v));

  /** Lean 4 file for a rule base + new requirement + the proofs behind each finding. */
  function generateLean(result, baseName = "rule base") {
    const { model, findings, newReq } = result;
    const E = model.entity[0].toUpperCase() + model.entity.slice(1);
    const attrs = Object.entries(model.attributes);
    const byId = Object.fromEntries(model.requirements.map((r) => [r.id, r]));
    const baseRules = rulesOf(model.requirements).filter((r) => r !== newReq && r.id !== newReq.id);

    const L = [
      `-- ${baseName}: checking a new requirement.`,
      "-- Generated by the Requirements Verifier (mkillah.github.io). Plain Lean 4, no Mathlib needed.",
      "",
      `structure ${E} where`,
      ...attrs.map(([a, k]) => `  ${a} : ${k === "bool" ? "Bool" : "Nat"}`),
      "deriving Repr",
      "",
    ];
    for (const r of model.requirements) {
      let body = leanConj(r.kind === "rule" ? r.consequences : r.conditions);
      if (r.kind === "rule" && r.conditions.length) body = `${leanConj(r.conditions)} → ${body}`;
      const label = r === newReq ? "New requirement" : r.kind === "possibility" ? "Possibility" : "Rule";
      L.push(`/-- ${label} ${r.id}: ${doc(r.text || "")} -/`, `abbrev ${leanId(r.id)} (x : ${E}) : Prop :=`, `  ${body}`, "");
    }
    const conjOf = (rules) => (rules.length ? rules.map((r) => `${leanId(r.id)} x`).join(" ∧ ") : "True");
    L.push("/-- The rule base before the new requirement. -/", `abbrev RulesBefore (${baseRules.length ? "x" : "_x"} : ${E}) : Prop :=`, `  ${conjOf(baseRules)}`, "");
    const afterRules = newReq.kind === "rule" ? [...baseRules, newReq] : baseRules;
    L.push("/-- The rule base with the new requirement. -/", `abbrev RulesAfter (${afterRules.length ? "x" : "_x"} : ${E}) : Prop :=`, `  ${conjOf(afterRules)}`, "");

    const fields = attrs.map(([a]) => a);
    for (const f of findings) {
      L.push(`-- ${f.title}`);
      for (const p of f.proofs) {
        if (p.mode === "witness") {
          const rec = attrs.map(([a]) => `${a} := ${leanValue(p.world[a])}`).join(", ");
          const set = p.ruleSet === "before" ? "RulesBefore" : "RulesAfter";
          L.push(`theorem ${p.name} : ∃ x : ${E}, (${leanConj(p.scenario)}) ∧ ${set} x :=`, `  ⟨{ ${rec} }, by decide⟩`, "");
        } else {
          // Only the rules in the minimal conflict are needed, which keeps the case split small.
          const rules = p.rules.map((id) => byId[id]);
          const used = new Set([...p.scenario.map((a) => a.attr), ...allAtoms(rules).map((a) => a.attr)]);
          const bools = fields.filter((a) => model.attributes[a] === "bool" && used.has(a));
          const unfold = rules.map((r) => leanId(r.id));
          // Unfold, move the hypotheses back into the goal, split on each Bool, then let
          // simp settle the Bool cases and omega the numbers. (simp_all can hit Lean's
          // recursion limit here, and that error is not caught by `try`.)
          L.push(
            `theorem ${p.name} : ¬ ∃ x : ${E}, (${leanConj(p.scenario)}) ∧ (${conjOf(rules)}) := by`,
            `  rintro ⟨⟨${fields.join(", ")}⟩, hs, hr⟩`,
            `  try simp only [${unfold.join(", ")}] at hs hr`,
            "  revert hs hr",
            `  ${bools.map((b) => `cases ${b} <;> `).join("")}(try simp) <;> omega`,
            "");
        }
      }
    }
    return L.join("\n");
  }

  global.ReqVerifierEngine = {
    parse, formal, interpretation, describeAtom, describeRecord, conj,
    holds, ruleOk, negateAtom, allWorlds, findWorld, minimalConflict,
    buildModel, checkBase, checkNewRule, validateTranslation, translateWithPatterns,
    generateLean, leanId,
  };
})(typeof window !== "undefined" ? window : globalThis);
