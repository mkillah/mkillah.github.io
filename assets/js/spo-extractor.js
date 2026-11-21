// SPO extractor widget: type or pick a text, get subject-predicate-object facts.
//
// Any element with data-spo-widget becomes an extractor. Options on that element:
//   data-spo-examples  URL of the example parses (default: content/nlp-projects/spo-examples.json)
//
// Examples use spaCy parses made offline, so they match the notebook. Typed text is
// parsed in the browser by SpoEngine.parseText on top of compromise (loaded on first use).
// Needs assets/js/spo-engine.js (window.SpoEngine).

(() => {
  "use strict";

  const DEFAULT_EXAMPLES = "content/nlp-projects/spo-examples.json";
  const COMPROMISE_URL = "https://cdn.jsdelivr.net/npm/compromise@14.18.0/builds/compromise.js";
  const MAX_CHARS = 1500;
  const ROLE_NAMES = { s: "Subject", p: "Predicate", o: "Object" };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let widgetCount = 0;
  let compromiseLoading = null;

  function loadCompromise() {
    if (window.nlp) return Promise.resolve(window.nlp);
    if (!compromiseLoading) {
      compromiseLoading = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = COMPROMISE_URL;
        script.onload = () => (window.nlp ? resolve(window.nlp) : reject(new Error("compromise did not load")));
        script.onerror = () => { compromiseLoading = null; reject(new Error("compromise could not be downloaded")); };
        document.head.appendChild(script);
      });
    }
    return compromiseLoading;
  }

  // ---------------------------------------------------------------- dependency arcs (SVG)

  function arcsSvg(tokens, start, end) {
    const words = [];
    for (let i = start; i < end; i++) if (tokens[i].p !== "PUNCT") words.push(i);
    if (!words.length) return "";
    const charW = 7.4, gap = 18;
    const x = {}, w = {};
    let cursor = 8;
    for (const i of words) {
      w[i] = Math.max(tokens[i].t.length, tokens[i].p.length) * charW + gap;
      x[i] = cursor + w[i] / 2;
      cursor += w[i];
    }
    const arcs = words.filter((i) => tokens[i].h !== i && x[tokens[i].h] !== undefined)
      .map((i) => ({ from: tokens[i].h, to: i, label: tokens[i].d, span: Math.abs(tokens[i].h - i) }));
    const spans = [...new Set(arcs.map((a) => a.span))].sort((a, b) => a - b);
    const levelH = 26, maxLevel = spans.length;
    const base = maxLevel * levelH + 18;
    const height = base + 44;

    const paths = arcs.map((a) => {
      const level = spans.indexOf(a.span) + 1;
      const top = base - level * levelH;
      const dir = a.to > a.from ? 1 : -1;
      const x1 = x[a.from] + dir * 4, x2 = x[a.to] - dir * 4;
      const r = Math.min(8, Math.abs(x2 - x1) / 2);
      const d = `M${x1},${base - 4} L${x1},${top + r} Q${x1},${top} ${x1 + dir * r},${top} L${x2 - dir * r},${top} Q${x2},${top} ${x2},${top + r} L${x2},${base - 4}`;
      const mid = (x1 + x2) / 2;
      return `<path d="${d}" class="spo-arc"/>
        <path d="M${x2 - 4},${base - 10} L${x2},${base - 3} L${x2 + 4},${base - 10}" class="spo-arrow"/>
        <rect x="${mid - a.label.length * 3.4 - 4}" y="${top - 8}" width="${a.label.length * 6.8 + 8}" height="15" rx="3" class="spo-arc-bg"/>
        <text x="${mid}" y="${top + 3}" class="spo-arc-label">${esc(a.label)}</text>`;
    }).join("");

    const labels = words.map((i) => `
      <text x="${x[i]}" y="${base + 16}" class="spo-word">${esc(tokens[i].t)}</text>
      <text x="${x[i]}" y="${base + 33}" class="spo-pos">${esc(tokens[i].p)}</text>`).join("");

    const width = Math.ceil(cursor + 8);
    return `<svg class="spo-arcs" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"
      aria-label="Dependency parse: ${esc(words.map((i) => `${tokens[i].t} (${tokens[i].d})`).join(", "))}">${paths}${labels}</svg>`;
  }

  // ---------------------------------------------------------------- widget

  async function mount(root) {
    if (root.dataset.spoMounted) return;
    root.dataset.spoMounted = "true";
    root.classList.add("spo-widget");
    const E = window.SpoEngine;
    if (!E) { root.innerHTML = `<p class="spo-muted">The extractor engine did not load.</p>`; return; }

    const p = `spo${++widgetCount}`;
    root.innerHTML = `<p class="spo-muted">Loading examples…</p>`;
    let data;
    try {
      const res = await fetch(root.dataset.spoExamples || DEFAULT_EXAMPLES, { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch {
      root.innerHTML = `<p class="spo-muted">The examples could not be loaded. Run the site from a web server.</p>`;
      return;
    }
    const examples = data.examples || [];

    root.innerHTML = `
      <div class="spo-card">
        <label for="${p}-text" class="spo-kicker">Try the extractor</label>
        <textarea id="${p}-text" class="spo-text" rows="4" maxlength="${MAX_CHARS}" spellcheck="true"
          placeholder="Type or paste a few English sentences."></textarea>
        <div class="spo-chips"><span class="spo-muted">Examples:</span>
          ${examples.map((ex, k) => `<button type="button" class="spo-chip" data-example="${k}" aria-pressed="false">${esc(ex.label)}</button>`).join("")}
        </div>
        <div class="spo-actions">
          <button type="button" class="spo-run">Extract facts</button>
          <span class="spo-muted spo-count"></span>
        </div>
      </div>

      <div class="spo-card spo-result" hidden aria-live="polite">
        <div class="spo-result-head">
          <span class="spo-kicker">Sentence analysis</span>
          <span class="spo-source"></span>
        </div>
        <div class="spo-legend" aria-hidden="true">
          <span><i class="spo-swatch is-s"></i>Subject</span>
          <span><i class="spo-swatch is-p"></i>Predicate</span>
          <span><i class="spo-swatch is-o"></i>Object</span>
          <span class="spo-muted">Select a fact to see where it comes from.</span>
        </div>
        <div class="spo-sentences"></div>

        <span class="spo-kicker spo-facts-title">Extracted facts</span>
        <div class="spo-facts"></div>

        <details class="spo-parse">
          <summary>Show the dependency parse</summary>
          <p class="spo-muted">Arrows go from each word to the words that depend on it. The rules read these labels: <code>nsubj</code> starts a fact, <code>aux</code>, <code>neg</code> and <code>advmod</code> join the predicate, and <code>dobj</code>, <code>prep</code> and <code>pobj</code> lead to the objects.</p>
          <div class="spo-parse-body"></div>
        </details>
      </div>

      <p class="spo-muted spo-note">The examples use spaCy parses made with the same settings as the notebook, so their facts match it exactly. Text you type is parsed in your browser by a simplified parser (spaCy cannot run on a static page), so expect rougher results for long or complex sentences.</p>`;

    const q = (sel) => root.querySelector(sel);
    const input = q(".spo-text");
    const runBtn = q(".spo-run");
    const resultBox = q(".spo-result");
    const chips = [...root.querySelectorAll(".spo-chip")];
    let current = null;     // { parse, facts }
    let selected = -1;      // fact index, -1 = all
    let activeExample = -1; // example whose stored parse is used while its text is unchanged

    function setExample(k) {
      activeExample = k;
      chips.forEach((c, j) => c.setAttribute("aria-pressed", String(j === k)));
    }

    const updateCount = () => { q(".spo-count").textContent = `${input.value.length} / ${MAX_CHARS}`; };

    // -------------------------------------------------------------- rendering

    function roleMap() {
      const roles = {};
      const facts = selected >= 0 ? [current.facts[selected]] : current.facts;
      // predicate wins over subject, subject over object, when a word plays several roles
      for (const role of ["o", "s", "p"]) for (const f of facts) for (const i of f.ids[role]) roles[i] = role;
      return roles;
    }

    function renderSentences() {
      const { tokens, sentences } = current.parse;
      const roles = roleMap();
      q(".spo-sentences").innerHTML = sentences.map(([s, e]) => {
        let html = "";
        for (let i = s; i < e; i++) {
          const t = tokens[i];
          const role = roles[i];
          const tip = t.p === "PUNCT" ? "" : ` title="${esc(`${t.p} · ${t.d}${t.h !== i ? ` → ${tokens[t.h].t}` : ""}`)}"`;
          html += role ? `<span class="spo-tok is-${role}"${tip}><span class="visually-hidden">[${ROLE_NAMES[role]}: </span>${esc(t.t)}<span class="visually-hidden">]</span></span>` : `<span class="spo-tok"${tip}>${esc(t.t)}</span>`;
          if (t.ws) html += " ";
        }
        return `<p class="spo-sentence">${html}</p>`;
      }).join("");
    }

    function renderFacts() {
      const facts = current.facts;
      if (!facts.length) {
        q(".spo-facts").innerHTML = `<p class="spo-muted spo-empty">No facts found. The extractor needs a sentence with a subject and a verb, such as “Bees communicate through a dance.”</p>`;
        return;
      }
      q(".spo-facts").innerHTML = `
        <div class="table-wrap">
          <table class="spo-table">
            <thead><tr><th scope="col">#</th><th scope="col">Subject</th><th scope="col">Predicate</th><th scope="col">Object(s)</th></tr></thead>
            <tbody>${facts.map((f, k) => `
              <tr class="${k === selected ? "is-selected" : ""}" data-fact="${k}" tabindex="0" aria-current="${k === selected}">
                <td>${k + 1}</td>
                <td><span class="spo-val is-s">${esc(f.subject)}</span></td>
                <td><span class="spo-val is-p">${esc(f.predicate || "–")}</span></td>
                <td>${f.objects.length ? f.objects.map((o) => `<span class="spo-val is-o">${esc(o)}</span>`).join(" ") : `<span class="spo-muted">none</span>`}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>`;
    }

    function renderParse() {
      const body = q(".spo-parse-body");
      if (!q(".spo-parse").open) { body.innerHTML = ""; return; }
      const { tokens, sentences } = current.parse;
      body.innerHTML = sentences.map(([s, e]) => `<div class="spo-arcs-wrap">${arcsSvg(tokens, s, e)}</div>`).join("");
    }

    function select(k) {
      selected = selected === k ? -1 : k;
      renderSentences();
      root.querySelectorAll(".spo-table tbody tr").forEach((tr) => {
        const on = Number(tr.dataset.fact) === selected;
        tr.classList.toggle("is-selected", on);
        tr.setAttribute("aria-current", String(on));
      });
    }

    // -------------------------------------------------------------- extraction

    async function run() {
      const textValue = input.value.trim();
      if (!textValue) { input.focus(); return; }
      runBtn.disabled = true;
      runBtn.textContent = "Extracting…";
      try {
        let parse, source;
        const ex = examples[activeExample];
        if (ex && ex.text === textValue) {
          parse = { tokens: ex.tokens, sentences: ex.sentences };
          source = "spaCy parse, made offline";
        } else {
          let nlp;
          try {
            nlp = await loadCompromise();
          } catch {
            resultBox.hidden = false;
            q(".spo-source").textContent = "";
            q(".spo-sentences").innerHTML = "";
            q(".spo-facts").innerHTML = `<p class="spo-muted spo-empty">The in-browser parser could not be downloaded. Check your connection, or try one of the examples.</p>`;
            return;
          }
          parse = E.parseText(textValue, nlp);
          source = "Simplified parser in your browser (compromise + rules)";
        }
        current = { parse, facts: E.extract(parse.tokens) };
        selected = -1;
        resultBox.hidden = false;
        q(".spo-source").textContent = source;
        q(".spo-source").title = source.startsWith("spaCy") ? (data.parser || "") : "Runs in your browser; less accurate than spaCy";
        q(".spo-source").classList.toggle("is-approx", !source.startsWith("spaCy"));
        renderSentences();
        renderFacts();
        renderParse();
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = "Extract facts";
      }
    }

    // -------------------------------------------------------------- events

    chips.forEach((chip) => chip.addEventListener("click", () => {
      const k = Number(chip.dataset.example);
      input.value = examples[k].text;
      setExample(k);
      updateCount();
      run();
    }));
    input.addEventListener("input", () => {
      updateCount();
      if (activeExample >= 0 && input.value.trim() !== examples[activeExample].text) setExample(-1);
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); });
    runBtn.addEventListener("click", run);

    const facts = q(".spo-facts");
    facts.addEventListener("click", (e) => { const tr = e.target.closest("tr[data-fact]"); if (tr) select(Number(tr.dataset.fact)); });
    facts.addEventListener("keydown", (e) => {
      const tr = e.target.closest("tr[data-fact]");
      if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(Number(tr.dataset.fact)); }
    });
    q(".spo-parse").addEventListener("toggle", () => { if (current) renderParse(); });

    // Start with the first example already extracted
    if (examples.length) {
      input.value = examples[0].text;
      setExample(0);
      updateCount();
      run();
    }
  }

  function mountAll(scope = document) {
    scope.querySelectorAll("[data-spo-widget]").forEach(mount);
  }

  window.SpoExtractor = { mount };
  document.addEventListener("DOMContentLoaded", () => mountAll());
  // Project reports are rendered after page load (see data-project.js).
  document.addEventListener("report:rendered", (e) => mountAll(e.detail?.container || document));
})();
