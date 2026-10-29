// Requirements Verifier: runs fully in the browser.
//
// 1. A pattern-based parser turns controlled-English requirements into a small
//    formal model (rules = "for every X", possibilities = "there may be an X").
// 2. A model finder checks every relevant record. Numbers only appear in threshold
//    comparisons, so testing n-1, n, n+1 around each threshold (plus 0) covers
//    every case: the search is complete, not a sample.
// 3. Each finding becomes a Lean 4 theorem: a concrete witness (`by decide`) or an
//    impossibility proof (case split + simp_all + omega), checkable in Lean.

(() => {
  "use strict";

  // ------------------------------------------------------------ vocabulary

  // Entity noun -> the numeric attribute a bare number refers to ("under 18", "above 150,000").
  const ENTITIES = {
    customer: "age", client: "age", user: "age", applicant: "age",
    transaction: "amount", payment: "amount", order: "amount",
    merchant: "volume", account: "balance",
  };
  const LEAN_KEYWORDS = new Set(["abbrev", "at", "by", "class", "def", "deriving", "do", "else", "end",
    "example", "false", "from", "fun", "have", "if", "import", "in", "instance", "let", "match",
    "namespace", "open", "section", "show", "structure", "then", "theorem", "true", "variable", "where", "with"]);

  const OPS = {
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

  const SUPPORTED = [
    "Transactions above 150,000 must be held for review.",
    "Held transactions cannot be authorised.",
    "Priority transactions can be above 150,000.",
    "Customers must be at least 18 to receive a loan.",
    "Premium customers are automatically eligible for a loan.",
    "Customers must have a credit score of at least 650 to receive a mortgage.",
  ];

  const EXAMPLES = {
    "NordPay fraud threshold (contradiction)":
      "Transactions above 150,000 must be held for review.\n" +
      "Held transactions cannot be authorised.\n" +
      "Priority transactions are always authorised.\n" +
      "Priority transactions can be above 150,000.",
    "NordPay fraud threshold (fixed)":
      "Transactions above 150,000 must be held for review.\n" +
      "Held transactions cannot be authorised.\n" +
      "Priority transactions under 150,001 are always authorised.\n" +
      "Priority transactions can be above 150,000.",
    "Loan eligibility (contradiction)":
      "Customers must be at least 18 to receive a loan.\n" +
      "Premium customers are automatically eligible for a loan.\n" +
      "Premium customers can be under 18.",
    "Credit cards (dead rule)":
      "Customers under 21 cannot receive a credit card.\n" +
      "Customers must be at least 25 to receive a mortgage.\n" +
      "Student customers under 20 are automatically eligible for a credit card.\n" +
      "Customers must have a credit score of at least 650 to receive a mortgage.\n" +
      "Student customers can receive a mortgage.",
  };

  // ------------------------------------------------------------ parsing

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

  function stateAttr(state) {
    return state.replace(/^authorized$/, "authorised").replace(/^canceled$/, "cancelled");
  }

  const num = (s) => parseInt(s.replace(/,/g, ""), 10);

  function splitSentences(text) {
    const out = [];
    text.split(/\r?\n/).forEach((line, i) => {
      line.split(/(?<=[.!?;])\s+/).forEach((s) => { if (s.trim()) out.push([i + 1, s.trim()]); });
    });
    return out;
  }

  function normalize(sentence) {
    return sentence.toLowerCase().trim().replace(/[.!;]+$/, "").replace(/’/g, "'").replace(/\s+/g, " ");
  }

  function parse(text) {
    const model = { entity: null, numAttr: null, attributes: {}, requirements: [], unparsed: [] };
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
      const ent = g.ent;
      if (model.entity && ent !== model.entity) {
        model.unparsed.push({ line, text: sentence, reason: `talks about ${ent}s, but the set is about ${model.entity}s` });
        continue;
      }
      model.entity = ent;
      const defNum = ENTITIES[ent];

      const subj = [];
      if (g.group && !["the", "all", "every", "any", "a", "an"].includes(g.group)) subj.push({ kind: "bool", attr: ident(g.group), value: true });
      if (g.sop) subj.push({ kind: "num", attr: defNum, op: OPS[g.sop], value: num(g.sn) });

      let main;
      if (p.builder === "num_default") main = { kind: "num", attr: defNum, op: OPS[g.op], value: num(g.n) };
      else if (p.builder === "num_attr") main = { kind: "num", attr: ident(g.attr), op: OPS[g.op], value: num(g.n) };
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

    // Attribute types, numeric first.
    for (const r of model.requirements) {
      for (const a of [...r.conditions, ...r.consequences]) {
        const existing = model.attributes[a.attr];
        if (existing && existing !== a.kind) a.attr += a.kind === "bool" ? "Flag" : "Value";
        if (!model.attributes[a.attr]) model.attributes[a.attr] = a.kind;
      }
    }
    const sorted = Object.entries(model.attributes).sort((x, y) => (x[1] === "num" ? 0 : 1) - (y[1] === "num" ? 0 : 1));
    model.attributes = Object.fromEntries(sorted);
    model.entity = model.entity || "customer";
    return model;
  }

  // ------------------------------------------------------------ logic helpers

  const SYM = { ">=": "≥", "<=": "≤", ">": ">", "<": "<", "==": "=" };
  const fmtNum = (n) => n.toLocaleString("en-US");
  const describeAtom = (a) => (a.kind === "bool" ? (a.value ? a.attr : "¬" + a.attr) : `${a.attr} ${SYM[a.op]} ${fmtNum(a.value)}`);
  const conj = (atoms) => atoms.map(describeAtom).join(" ∧ ");

  function formal(r) {
    if (r.kind === "possibility") return `∃ x, ${conj(r.conditions) || "True"}`;
    return r.conditions.length ? `∀ x, ${conj(r.conditions)} → ${conj(r.consequences)}` : `∀ x, ${conj(r.consequences)}`;
  }

  function holds(a, w) {
    const v = w[a.attr];
    if (a.kind === "bool") return v === a.value;
    return { ">=": v >= a.value, "<=": v <= a.value, ">": v > a.value, "<": v < a.value, "==": v === a.value }[a.op];
  }
  const ruleOk = (r, w) => !r.conditions.every((a) => holds(a, w)) || r.consequences.every((a) => holds(a, w));

  function candidateValues(model) {
    const values = {};
    for (const [attr, kind] of Object.entries(model.attributes)) {
      if (kind === "bool") { values[attr] = [true, false]; continue; }
      const pts = new Set([0]);
      for (const r of model.requirements) {
        for (const a of [...r.conditions, ...r.consequences]) {
          if (a.attr === attr) [a.value - 1, a.value, a.value + 1].forEach((x) => x >= 0 && pts.add(x));
        }
      }
      values[attr] = [...pts].sort((x, y) => y - x); // prefer realistic values (17 over 0)
    }
    return values;
  }

  function* worlds(model, limit = 200000) {
    const values = candidateValues(model);
    const attrs = Object.keys(values);
    const idx = attrs.map(() => 0);
    for (let n = 0; n < limit; n++) {
      const w = {};
      attrs.forEach((a, i) => { w[a] = values[a][idx[i]]; });
      yield w;
      let i = attrs.length - 1;
      while (i >= 0 && ++idx[i] === values[attrs[i]].length) { idx[i] = 0; i--; }
      if (i < 0) return;
    }
  }

  function findWorld(model, scenario, rules) {
    for (const w of worlds(model)) {
      if (scenario.every((a) => holds(a, w)) && rules.every((r) => ruleOk(r, w))) return w;
    }
    return null;
  }

  function minimalConflict(model, scenario, rules) {
    let core = [...rules];
    for (const r of [...core]) {
      const trial = core.filter((x) => x !== r);
      if (!findWorld(model, scenario, trial)) core = trial;
    }
    return core;
  }

  function counterexamples(model, scenario, core, limit = 4) {
    const relevant = new Set([...scenario.map((a) => a.attr), ...core.flatMap((r) => [...r.conditions, ...r.consequences].map((a) => a.attr))]);
    const seen = new Set();
    const out = [];
    for (const w of worlds(model)) {
      if (!scenario.every((a) => holds(a, w))) continue;
      const breaks = core.filter((r) => !ruleOk(r, w)).map((r) => r.id);
      const record = Object.fromEntries(Object.entries(w).filter(([k]) => relevant.has(k)));
      const key = JSON.stringify([Object.entries(record).filter(([, v]) => typeof v === "boolean"), breaks]);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ record, breaks });
      if (out.length >= limit) break;
    }
    return out;
  }

  function describeRecord(entity, rec) {
    const parts = Object.entries(rec).map(([k, v]) => (typeof v === "boolean" ? (v ? k : "not " + k) : `${k} ${fmtNum(v)}`));
    return `a ${entity} with ${parts.join(", ")}`;
  }

  // ------------------------------------------------------------ checks

  function buildChecks(model) {
    const rules = model.requirements.filter((r) => r.kind === "rule");
    const E = model.entity;
    const checks = [{ id: "rules_satisfiable", title: "Rules are satisfiable", question: `Can any ${E} satisfy all rules at once?`, scenario: [] }];
    for (const p of model.requirements.filter((r) => r.kind === "possibility")) {
      checks.push({ id: `${p.id}_consistent`, req: p.id, title: `${p.id} is consistent with the rules`, question: `Can a ${E} with ${conj(p.conditions)} exist?`, scenario: p.conditions });
    }
    for (const r of rules) {
      if (r.conditions.length) {
        checks.push({ id: `${r.id}_can_apply`, req: r.id, title: `${r.id} can apply`, question: `Can a ${E} with ${conj(r.conditions)} exist?`, scenario: r.conditions });
      }
    }
    const byId = Object.fromEntries(model.requirements.map((r) => [r.id, r]));

    for (const c of checks) {
      c.severity = "ok";
      c.conflict = [];
      c.examples = [];
      const w = findWorld(model, c.scenario, rules);
      if (w) {
        c.witness = w;
        c.theorem = c.id;
        c.summary = `Yes, e.g. ${describeRecord(E, w)}.`;
        continue;
      }
      const core = minimalConflict(model, c.scenario, rules);
      c.conflict = core.map((r) => r.id);
      c.examples = counterexamples(model, c.scenario, core);
      c.title = c.id.endsWith("_can_apply") ? `${c.req} can never apply`
        : c.req ? `${c.req} contradicts the rules` : "The rules contradict each other";
      if (c.id.endsWith("_can_apply")) {
        const others = c.conflict.filter((x) => x !== c.req);
        c.severity = "warning";
        c.theorem = `${c.req}_never_applies`;
        c.summary = `Dead rule: no ${E} can ever trigger ${c.req}` +
          (others.length ? `, because it clashes with ${others.join(" + ")}.` : ", because its own conditions clash.");
      } else if (c.req) {
        c.severity = "contradiction";
        c.theorem = `${c.req}_contradicts_rules`;
        c.summary = `Potential contradiction: “${byId[c.req].text}” cannot hold together with ${c.conflict.join(" + ")}.`;
      } else {
        c.severity = "contradiction";
        c.theorem = "rules_contradict";
        c.summary = `The rules contradict each other: no ${E} can satisfy all of them.`;
      }
      if (c.examples.length) {
        const ex = c.examples[0];
        c.summary += ` For example, ${describeRecord(E, ex.record)} breaks ${ex.breaks.join(", ")}.`;
      }
    }
    return checks;
  }

  // ------------------------------------------------------------ Lean generation

  const leanAtom = (a) => (a.kind === "bool" ? `x.${a.attr} = ${a.value}` : `x.${a.attr} ${SYM[a.op]} ${a.value}`);
  const leanConj = (atoms) => (atoms.length ? atoms.map(leanAtom).join(" ∧ ") : "True");
  const doc = (t) => t.replace(/-\//g, "- /").replace(/\/-/g, "/ -"); // user text must not close the comment

  function generateLean(model, checks) {
    const E = model.entity[0].toUpperCase() + model.entity.slice(1);
    const attrs = Object.entries(model.attributes);
    const L = [
      "-- Generated by the Requirements Verifier (mkillah.github.io).",
      "-- Plain Lean 4, no Mathlib needed.",
      "",
      `structure ${E} where`,
      ...(attrs.length ? attrs.map(([a, k]) => `  ${a} : ${k === "bool" ? "Bool" : "Nat"}`) : ["  id : Nat"]),
      "deriving Repr",
      "",
    ];
    for (const r of model.requirements) {
      let body = leanConj(r.kind === "rule" ? r.consequences : r.conditions);
      if (r.kind === "rule" && r.conditions.length) body = `${leanConj(r.conditions)} → ${body}`;
      L.push(`/-- ${r.id}: ${doc(r.text)} -/`, `abbrev ${r.id} (x : ${E}) : Prop :=`, `  ${body}`, "");
    }
    const ruleIds = model.requirements.filter((r) => r.kind === "rule").map((r) => r.id);
    L.push("/-- Every rule, applied to one record. -/", `abbrev Rules (${ruleIds.length ? "x" : "_x"} : ${E}) : Prop :=`,
      "  " + (ruleIds.length ? ruleIds.map((i) => `${i} x`).join(" ∧ ") : "True"), "");

    const fields = attrs.length ? attrs.map(([a]) => a) : ["id"];
    const bools = attrs.filter(([, k]) => k === "bool").map(([a]) => a);
    for (const c of checks) {
      const scen = `Scenario_${c.id}`;
      L.push(`/-- ${doc(c.question)} -/`, `abbrev ${scen} (${c.scenario.length ? "x" : "_x"} : ${E}) : Prop :=`, `  ${leanConj(c.scenario)}`, "");
      if (c.witness) {
        const rec = attrs.length ? attrs.map(([a]) => `${a} := ${c.witness[a]}`).join(", ") : "id := 0";
        L.push(`theorem ${c.theorem} : ∃ x : ${E}, ${scen} x ∧ Rules x :=`, `  ⟨{ ${rec} }, by decide⟩`);
      } else {
        // simp_all does not unfold abbrevs on its own, so unfold them first, then split on every Bool.
        L.push(`theorem ${c.theorem} : ¬ ∃ x : ${E}, ${scen} x ∧ Rules x := by`,
          `  rintro ⟨⟨${fields.join(", ")}⟩, hs, hr⟩`,
          `  simp only [${[scen, "Rules", ...ruleIds].join(", ")}] at hs hr`,
          "  all_goals (" + bools.map((b) => `cases ${b} <;> `).join("") + "(try simp_all) <;> omega)");
      }
      L.push("");
    }
    return L.join("\n");
  }

  function analyze(text) {
    const model = parse(text);
    if (!model.requirements.length) return { model, checks: [], lean: "" };
    const checks = buildChecks(model);
    return { model, checks, lean: generateLean(model, checks) };
  }

  // ------------------------------------------------------------ UI

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LABEL = { contradiction: "Contradiction", warning: "Dead rule", ok: "OK" };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const recordText = (rec) => Object.entries(rec).map(([k, v]) => (typeof v === "boolean" ? (v ? k : "not " + k) : `${k} = ${fmtNum(v)}`)).join(", ");

  function unparsedBox(model) {
    if (!model.unparsed.length) return "";
    return `<div class="rv-note"><strong>Not understood, ignored:</strong><ul>` +
      model.unparsed.map((u) => `<li>Line ${u.line}: ${esc(u.text)} <span class="rv-muted">(${esc(u.reason)})</span></li>`).join("") +
      `</ul></div>`;
  }

  function renderVerify({ model, checks }) {
    if (!checks.length) return `<p class="rv-empty">No requirements were recognised.</p>` + unparsedBox(model);
    const n = (s) => checks.filter((c) => c.severity === s).length;
    const order = { contradiction: 0, warning: 1, ok: 2 };
    let html = `<div class="rv-summary">
      <span class="rv-badge contradiction">${plural(n("contradiction"), "contradiction")}</span>
      <span class="rv-badge warning">${plural(n("warning"), "dead rule")}</span>
      <span class="rv-badge ok">${n("ok")} passed</span></div>`;
    for (const c of [...checks].sort((a, b) => order[a.severity] - order[b.severity])) {
      html += `<div class="rv-card ${c.severity}">
        <h4><span class="rv-badge ${c.severity}">${LABEL[c.severity]}</span> ${esc(c.title)}</h4>
        <p class="rv-muted">${esc(c.question)}</p>
        <p>${esc(c.summary)}</p>`;
      if (c.examples.length > 1) {
        html += `<p class="rv-muted">Every way to satisfy it breaks a rule:</p><ul>` +
          c.examples.map((e) => `<li>${esc(recordText(e.record))} → breaks ${esc(e.breaks.join(", "))}</li>`).join("") + `</ul>`;
      }
      html += `<p class="rv-proof">Lean theorem <code>${esc(c.theorem)}</code></p></div>`;
    }
    return html + unparsedBox(model);
  }

  function renderReqs({ model }) {
    let html = `<div class="table-wrap"><table class="ba-table rv-table"><thead><tr><th>ID</th><th>Requirement</th><th>Type</th><th>Formal meaning</th></tr></thead><tbody>`;
    for (const r of model.requirements) {
      html += `<tr><td>${r.id}</td><td>${esc(r.text)}</td><td>${r.kind}</td><td><code>${esc(formal(r))}</code></td></tr>`;
    }
    html += `</tbody></table></div><p class="rv-muted rv-attrs">Attributes of each ${esc(model.entity)}: ` +
      Object.entries(model.attributes).map(([k, t]) => `<code>${esc(k)} : ${t === "bool" ? "Bool" : "Nat"}</code>`).join(" ") + `</p>`;
    return html + unparsedBox(model);
  }

  function renderLean({ lean }) {
    if (!lean) return `<p class="rv-empty">Nothing to generate.</p>`;
    const url = "https://live.lean-lang.org/#code=" + encodeURIComponent(lean);
    return `<div class="rv-lean-bar"><span class="rv-muted">requirements.lean</span>
        <span><button type="button" class="rv-ghost" id="rv-copy">Copy</button>
        <a class="rv-ghost" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Check in Lean web editor ↗</a></span></div>
      <pre class="rv-lean">${esc(lean)}</pre>`;
  }

  function init() {
    const root = document.getElementById("rv-app");
    if (!root) return;
    const $ = (id) => document.getElementById(id);

    const select = $("rv-example");
    select.innerHTML = Object.keys(EXAMPLES).map((k) => `<option>${esc(k)}</option>`).join("");
    select.value = Object.keys(EXAMPLES)[0];
    $("rv-input").value = EXAMPLES[select.value];
    select.addEventListener("change", () => { $("rv-input").value = EXAMPLES[select.value]; run(); });
    $("rv-supported").innerHTML = SUPPORTED.map((s) => `<li>${esc(s)}</li>`).join("");

    function run() {
      const text = $("rv-input").value.slice(0, 5000);
      const result = analyze(text);
      $("rv-panel-verify").innerHTML = renderVerify(result);
      $("rv-panel-reqs").innerHTML = renderReqs(result);
      $("rv-panel-lean").innerHTML = renderLean(result);
      const copy = $("rv-copy");
      if (copy) copy.addEventListener("click", () => navigator.clipboard.writeText(result.lean).then(() => { copy.textContent = "Copied"; }));
    }

    $("rv-run").addEventListener("click", run);
    run();
  }

  window.ReqVerifier = { analyze, parse };
  document.addEventListener("DOMContentLoaded", init);
})();
