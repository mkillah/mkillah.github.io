// Requirements Verifier widget: a rule base (table) + "add a rule" + check.
//
// Any element with data-rv-widget becomes a verifier. Options on that element:
//   data-rv-base      URL of the rule base JSON (default: the NordPay rules)
//   data-rv-endpoint  URL of the translation proxy (req-verifier/proxy). Without it,
//                     typed rules use the built-in pattern parser, and the demo
//                     rules use their stored translations.
//
// Needs assets/js/req-verifier-engine.js (window.ReqVerifierEngine).

(() => {
  "use strict";

  const DEFAULT_BASE = "content/req-verifier/nordpay-rules.json";
  const TIMEOUT_MS = 20000;

  const TYPES = {
    contradiction: { label: "Contradiction", sev: "contradiction", verdict: "Does not fit: it contradicts the rule base." },
    dead: { label: "Dead rule", sev: "warning", verdict: "Does not fit: a rule can never apply." },
    redundant: { label: "Redundant", sev: "info", verdict: "Not needed: the rule base already covers it." },
    "side-effect": { label: "Side effect", sev: "warning", verdict: "Fits, but review the side effects first." },
    fits: { label: "Fits", sev: "ok", verdict: "Fits the rule base." },
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let widgetCount = 0;

  async function mount(root) {
    if (root.dataset.rvMounted) return;
    root.dataset.rvMounted = "true";
    root.classList.add("rv-widget");
    const E = window.ReqVerifierEngine;
    if (!E) { root.innerHTML = `<p class="rv-empty">The verifier engine did not load.</p>`; return; }

    const p = `rv${++widgetCount}`;
    const endpoint = (root.dataset.rvEndpoint || "").replace(/\/+$/, "");
    root.innerHTML = `<p class="rv-empty">Loading the rule base…</p>`;

    let original;
    try {
      const res = await fetch(root.dataset.rvBase || DEFAULT_BASE, { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      original = await res.json();
    } catch {
      root.innerHTML = `<p class="rv-empty">The rule base could not be loaded. Run the site from a web server.</p>`;
      return;
    }

    let base = clone(original);
    let pendingDemo = null; // stored translation of a demo chip, used while its text is unchanged
    let lastResult = null;

    root.innerHTML = `
      <div class="rv-input-card rv-base">
        <div class="rv-base-head">
          <div>
            <span class="rv-kicker">Rule base</span>
            <span class="rv-base-name">${esc(original.name || "Business rules")}</span>
          </div>
          <div class="rv-base-meta">
            <span class="rv-health"></span>
            <label class="rv-toggle"><input type="checkbox" class="rv-logic-toggle"> Show logic</label>
          </div>
        </div>
        <div class="table-wrap">
          <table class="ba-table rv-rules">
            <thead><tr><th>ID</th><th>Business rule</th><th class="rv-logic">Logic</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
        <p class="rv-legend"><b>BR</b> rules apply to every ${esc(original.entity)}. <b>P</b> possibilities are cases the business must keep allowed.</p>
      </div>

      <div class="rv-input-card rv-add">
        <label for="${p}-new">Add a business rule</label>
        <textarea id="${p}-new" class="rv-new" rows="2" maxlength="300" spellcheck="true"
          placeholder="e.g. Transactions above 75% of the fraud threshold are flagged for monitoring."></textarea>
        <div class="rv-chips"><span class="rv-muted">Try:</span>
          ${(original.demos || []).map((d, i) => `<button type="button" class="rv-chip" data-demo="${i}">${esc(d.label)}</button>`).join("")}
        </div>
        <div class="rv-actions">
          <button type="button" class="rv-run">Check against rule base</button>
          <span class="rv-muted rv-mode">${endpoint
            ? "Typed rules are translated by an LLM, then validated before checking."
            : "LLM translation is not connected here: typed rules use the built-in pattern parser."}</span>
        </div>
      </div>

      <div class="rv-input-card rv-result" hidden aria-live="polite">
        <div class="rv-interp"></div>
        <div class="rv-verdict"></div>
        <div class="wf-tabs rv-tabs" role="tablist" aria-label="Check results">
          <button type="button" role="tab" id="${p}-tab-verify" aria-controls="${p}-panel-verify" aria-selected="true">Findings</button>
          <button type="button" role="tab" id="${p}-tab-lean" aria-controls="${p}-panel-lean" aria-selected="false" tabindex="-1">Lean proof</button>
        </div>
        <div role="tabpanel" id="${p}-panel-verify" aria-labelledby="${p}-tab-verify"></div>
        <div role="tabpanel" id="${p}-panel-lean" aria-labelledby="${p}-tab-lean" hidden></div>
      </div>`;

    const q = (sel) => root.querySelector(sel);
    const input = q(".rv-new");
    const runBtn = q(".rv-run");
    const resultBox = q(".rv-result");
    const vocabulary = () => base.vocabulary;

    // ---------------------------------------------------------------- rule table

    function renderTable(highlight = {}, newReq = null) {
      const rows = base.requirements.map((r) => {
        const added = !original.requirements.some((o) => o.id === r.id);
        const hit = highlight[r.id] ? ` rv-hit-${highlight[r.id]}` : "";
        return `<tr class="${r.kind === "possibility" ? "rv-poss" : ""}${added ? " rv-added" : ""}${hit}">
          <td>${esc(r.id)}</td>
          <td>${esc(r.text)}${added ? ' <span class="rv-tag">added</span>' : ""}</td>
          <td class="rv-logic"><code>${esc(E.formal(r))}</code></td></tr>`;
      });
      if (newReq) {
        const hit = highlight[newReq.id] ? ` rv-hit-${highlight[newReq.id]}` : "";
        rows.push(`<tr class="rv-new-row${hit}"><td>NEW</td><td>${esc(newReq.text)}</td><td class="rv-logic"><code>${esc(E.formal(newReq))}</code></td></tr>`);
      }
      q(".rv-rules tbody").innerHTML = rows.join("");

      const h = E.checkBase(base);
      const health = q(".rv-health");
      health.className = `rv-health ${h.ok ? "ok" : "bad"}`;
      health.textContent = `${h.ruleCount} rules · ${h.possibilityCount} possibilities · ${h.ok ? "consistent ✓" : h.issues.length + " issue(s)"}`;
    }

    q(".rv-logic-toggle").addEventListener("change", (e) => root.classList.toggle("rv-show-logic", e.target.checked));

    // ---------------------------------------------------------------- demos

    root.querySelectorAll(".rv-chip").forEach((chip) => chip.addEventListener("click", () => {
      const demo = original.demos[Number(chip.dataset.demo)];
      input.value = demo.text;
      pendingDemo = demo;
      check();
    }));
    input.addEventListener("input", () => { if (pendingDemo && input.value.trim() !== pendingDemo.text) pendingDemo = null; });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) check(); });

    // ---------------------------------------------------------------- translation

    async function translate(text) {
      if (pendingDemo && pendingDemo.text === text) {
        return { ...E.validateTranslation(pendingDemo.translation, vocabulary()), source: "Pre-translated example" };
      }
      if (!endpoint) return { ...E.translateWithPatterns(text, vocabulary()), source: "Pattern parser (offline)" };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`${endpoint}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, vocabulary: vocabulary() }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return { ...E.validateTranslation(data.translation, vocabulary()), source: `LLM translation (${data.model || "LLM"}), validated` };
      } catch (err) {
        const reason = err.name === "AbortError" ? "timed out" : err.message;
        return { ...E.translateWithPatterns(text, vocabulary()), source: `Pattern parser (LLM unavailable: ${reason})` };
      } finally {
        clearTimeout(timer);
      }
    }

    // ---------------------------------------------------------------- check

    async function check() {
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      runBtn.disabled = true;
      runBtn.textContent = "Checking…";
      try {
        const t = await translate(text);
        resultBox.hidden = false;
        if (!t.ok) {
          lastResult = null;
          renderTable();
          q(".rv-interp").innerHTML = `<span class="rv-kicker">Could not translate</span><p>${esc(t.error)}</p><p class="rv-muted">${esc(t.source)}</p>`;
          q(".rv-verdict").innerHTML = "";
          q(`#${p}-panel-verify`).innerHTML = `<p class="rv-muted">Try rephrasing, or use one of the examples. Rules work best as one sentence about one transaction, such as “Transactions above 90% of the fraud threshold are held for review.”</p>`;
          q(`#${p}-panel-lean`).innerHTML = "";
          return;
        }
        const result = E.checkNewRule(base, { ...t.req, id: "NEW", text }, t.newTerms);
        lastResult = { result, newTerms: t.newTerms };
        renderResult(result, t);
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = "Check against rule base";
      }
    }

    function renderResult(result, t) {
      const order = ["contradiction", "dead", "side-effect", "redundant", "fits"];
      const highlight = {};
      for (const type of [...order].reverse()) {
        for (const f of result.findings.filter((x) => x.type === type)) for (const id of f.ids) highlight[id] = TYPES[type].sev;
      }
      renderTable(highlight, result.newReq);

      const terms = vocabulary().map((v) => v.name);
      q(".rv-interp").innerHTML = `
        <span class="rv-kicker">Read as</span>
        <code class="rv-reading">${esc(E.interpretation(result.newReq))}</code>
        ${t.newTerms.length ? `<p class="rv-newterms">New term${t.newTerms.length > 1 ? "s" : ""} not in the glossary: ${t.newTerms
          .map((n) => `<code>${esc(n.name)}</code>${n.description ? ` (${esc(n.description)})` : ""}`).join(", ")}</p>` : ""}
        ${t.notes ? `<p class="rv-muted">${esc(t.notes)}</p>` : ""}
        <p class="rv-muted rv-source">${esc(t.source)} · vocabulary: ${terms.length} terms</p>`;

      const v = TYPES[result.verdict];
      const canAdd = result.verdict === "fits" || result.verdict === "side-effect";
      const addedCount = base.requirements.length - original.requirements.length;
      q(".rv-verdict").innerHTML = `
        <div class="rv-verdict-box ${v.sev}">
          <span class="rv-badge ${v.sev}">${v.label}</span>
          <strong>${esc(v.verdict)}</strong>
          <span class="rv-verdict-actions">
            ${canAdd ? `<button type="button" class="rv-ghost rv-add-btn">Add to rule base as ${esc(nextId())}</button>` : ""}
            ${addedCount ? `<button type="button" class="rv-ghost rv-reset-btn">Reset rule base</button>` : ""}
          </span>
        </div>`;
      q(".rv-add-btn")?.addEventListener("click", addToBase);
      q(".rv-reset-btn")?.addEventListener("click", resetBase);

      q(`#${p}-panel-verify`).innerHTML = result.findings.map((f) => {
        const type = TYPES[f.type];
        return `<div class="rv-card ${type.sev}">
          <h4><span class="rv-badge ${type.sev}">${type.label}</span> ${esc(f.title)}</h4>
          <p>${esc(f.summary)}</p>
          ${f.items ? `<ul>${f.items.map((it) => `<li><code>${esc(it.text)}</code>, because of ${esc(it.ids.join(" + "))}</li>`).join("")}</ul>` : ""}
          <p class="rv-proof">Rules involved: ${f.ids.map((id) => `<span class="rv-id">${esc(id)}</span>`).join(" ")}
            · Lean: ${f.proofs.map((pr) => `<code>${esc(pr.name)}</code>`).join(", ")}</p>
        </div>`;
      }).join("");

      const lean = E.generateLean(result, base.name || "Rule base");
      const url = "https://live.lean-lang.org/#code=" + encodeURIComponent(lean);
      q(`#${p}-panel-lean`).innerHTML = `
        <div class="rv-lean-bar"><span class="rv-muted">Every finding above is a theorem in this file.</span>
          <span><button type="button" class="rv-ghost rv-copy">Copy</button>
          <a class="rv-ghost" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Check in Lean web editor ↗</a></span></div>
        <pre class="rv-lean">${esc(lean)}</pre>`;
      const copy = q(".rv-copy");
      copy.addEventListener("click", () => navigator.clipboard.writeText(lean).then(() => { copy.textContent = "Copied"; }));
    }

    // ---------------------------------------------------------------- session edits

    function nextId() {
      const nums = base.requirements.map((r) => /^BR-(\d+)$/.exec(r.id)).filter(Boolean).map((m) => Number(m[1]));
      return `BR-${String(Math.max(0, ...nums) + 1).padStart(2, "0")}`;
    }

    function addToBase() {
      if (!lastResult) return;
      const { result, newTerms } = lastResult;
      const req = { ...clone(result.newReq), id: nextId() };
      const lastRule = base.requirements.map((r) => r.kind).lastIndexOf("rule");
      base.requirements.splice(lastRule + 1, 0, req);
      for (const t of newTerms) if (!base.vocabulary.some((v) => v.name === t.name)) base.vocabulary.push(t);
      input.value = "";
      pendingDemo = null;
      lastResult = null;
      resultBox.hidden = true;
      renderTable();
    }

    function resetBase() {
      base = clone(original);
      lastResult = null;
      resultBox.hidden = true;
      renderTable();
    }

    // ---------------------------------------------------------------- result tabs

    const tabs = [...root.querySelectorAll('[role="tab"]')];
    function selectTab(tab, focus = false) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        root.querySelector("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }
    const tablist = q(".rv-tabs");
    tablist.addEventListener("click", (e) => { const t = e.target.closest('[role="tab"]'); if (t) selectTab(t); });
    tablist.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      if (e.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length], true);
      if (e.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });

    runBtn.addEventListener("click", check);
    renderTable();
  }

  function mountAll(scope = document) {
    scope.querySelectorAll("[data-rv-widget]").forEach(mount);
  }

  window.ReqVerifier = { mount };
  document.addEventListener("DOMContentLoaded", () => mountAll());
  // Project reports are rendered after page load (see data-project.js).
  document.addEventListener("report:rendered", (e) => mountAll(e.detail?.container || document));
})();
