// SPO extractor engine: subject-predicate-object facts from a dependency parse.
//
// extract(tokens) is a line-by-line port of the rules in the notebook
// (NLP_Projects/project-factextraction.ipynb). Tokens look like spaCy's after
// merge_noun_chunks: { t: text, ws: trailing space, l: lemma, p: POS, d: dep, h: head index }.
//
// parseText(text, nlp) is a simplified dependency parser for text typed in the
// browser, where spaCy cannot run. It uses compromise (nlp) for sentences, word
// tags and lemmas, then attaches words with a few clause-level rules. It covers
// plain declarative sentences; spaCy's parser is much more accurate.
//
// Works in the browser (window.SpoEngine) and in Node (module.exports).

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SpoEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ================================================================ extraction

  const OBJ_DEPS = ["pobj", "dobj", "obj", "conj"];
  const text = (toks) => toks.map((t) => t.t).join(" ");

  function extract(tokens) {
    const toks = tokens.map((t, i) => ({ ...t, i }));
    const kids = toks.map(() => []);
    toks.forEach((t) => { if (t.h !== t.i) kids[t.h].push(t); });
    const children = (t) => kids[t.i];

    function subtree(t) {
      const out = [t];
      for (const c of children(t)) out.push(...subtree(c));
      return out.sort((a, b) => a.i - b.i);
    }

    // mergeTokensUponSideRelativity: union of two token lists, in sentence order
    function merge(a, b) {
      const byIndex = new Map();
      for (const t of [...a, ...b]) byIndex.set(t.i, t);
      return [...byIndex.keys()].sort((x, y) => x - y).map((i) => byIndex.get(i));
    }

    // demlimiter: an object sequence ends with the object itself.
    // Keyed by the object's text, like the Python dict.
    function delimit(seq) {
      const result = new Map();
      let run = [];
      for (const t of seq) {
        run.push(t);
        if (OBJ_DEPS.includes(t.d)) { result.set(t.t, run); run = []; }
      }
      return [...result.values()];
    }

    // getVerbComplementation: the verb and the words that complete it
    function complement(verb) {
      let out = [verb];
      for (const c of children(verb)) {
        if (["neg", "aux", "auxpass", "advmod", "attr", "prt"].includes(c.d)) out = merge([c], out);
        else if ((c.d === "acomp" || c.d === "xcomp") && ["VERB", "AUX", "ADJ", "NOUN"].includes(c.p)) out = merge(complement(c), out);
      }
      return out;
    }

    // getVerbObject: the objects the verb refers to
    function objectsOf(verb) {
      let out = [];
      for (const c of children(verb)) {
        if (OBJ_DEPS.includes(c.d) && c.p !== "VERB") out = merge([...objectsOf(c), c], out);
        else if (["prep", "pcomp", "agent", "acl"].includes(c.d)) out = merge([...objectsOf(c), c], out);
        else if (verb.p === "AUX" && c.d === "attr") out = merge(objectsOf(c), out);
      }
      return out;
    }

    // getVerbConj: verbs joined by "and", with their complementation
    function conjuncts(verb) {
      const conjs = [], compls = [];
      for (const c of children(verb)) {
        if (c.d !== "conj") continue;
        conjs.push(c);
        compls.push(complement(c));
        const [c2, cc2] = conjuncts(c);
        compls.push(...cc2);
        conjs.push(...c2);
      }
      return [conjs, compls];
    }

    function fact(sTokens, pTokens, objectRuns) {
      return {
        subject: sTokens.map((t) => t.l.toLowerCase()).join(" "),
        predicate: text(pTokens),
        objects: objectRuns.map(text),
        ids: { s: sTokens.map((t) => t.i), p: pTokens.map((t) => t.i), o: objectRuns.flat().map((t) => t.i) },
      };
    }

    // getSPO: facts for one subject. Keyed by predicate text, like the Python dict.
    function spoFor(subj) {
      const spo = new Map();
      const head = toks[subj.h];
      const sTokens = subtree(subj);
      const pTokens = ["VERB", "AUX"].includes(head.p) ? complement(head) : [];
      spo.set(text(pTokens), fact(sTokens, pTokens, delimit(objectsOf(head))));
      const [conjs, compls] = conjuncts(head);
      conjs.forEach((c, k) => {
        // The notebook keeps conj objects as raw tokens; here they are delimited like the others.
        if (k < compls.length) spo.set(text(compls[k]), fact(sTokens, compls[k], delimit(objectsOf(c))));
      });
      return [...spo.values()];
    }

    // getSPODependecy: every nominal subject starts a fact
    const facts = [];
    for (const t of toks) if (t.d === "nsubj" || t.d === "nsubjpass") facts.push(...spoFor(t));
    return facts;
  }

  // ================================================================ simplified parser

  const POSS = new Set(["my", "your", "his", "her", "its", "our", "their"]);
  const CCONJ_WORDS = new Set(["and", "or", "but", "nor"]);
  const ADVMOD_SCONJ = new Set(["how", "when", "where", "why"]);
  const REL = new Set(["who", "which", "whom"]);
  const PREPS = new Set(["in", "on", "at", "from", "with", "by", "of", "for", "through", "without", "into", "about",
    "under", "over", "after", "before", "during", "between", "among", "across", "against", "within", "towards"]);
  const BE = new Set(["be", "is", "am", "are", "was", "were", "been", "being"]);
  const NOMINAL = new Set(["NOUN", "PROPN", "PRON", "NUM"]);
  const VERBAL = new Set(["VERB", "AUX"]);

  function posOf(tags, word) {
    if (tags.has("Pronoun")) return POSS.has(word) ? "DET" : "PRON";
    if (tags.has("Determiner")) return "DET";
    if (tags.has("Preposition")) return "ADP";
    if (tags.has("Conjunction")) return CCONJ_WORDS.has(word) ? "CCONJ" : "SCONJ";
    if (tags.has("QuestionWord")) return "SCONJ";
    if (tags.has("Negative")) return "PART";
    if (tags.has("Copula") || tags.has("Auxiliary") || tags.has("Modal")) return "AUX";
    if (tags.has("Verb")) return "VERB";
    if (tags.has("Adjective")) return "ADJ";
    if (tags.has("Adverb")) return "ADV";
    if (tags.has("Value") || tags.has("Cardinal")) return "NUM";
    if (tags.has("ProperNoun")) return "PROPN";
    if (tags.has("Noun")) return "NOUN";
    if (tags.has("Particle")) return "PART";
    return "X";
  }

  // compromise terms -> words and punctuation tokens
  function wordsOf(terms) {
    const out = [];
    for (const term of terms) {
      const pre = (term.pre || "").replace(/\s+/g, "");
      if (pre) out.push({ t: pre, ws: "", l: pre, p: "PUNCT", tags: new Set() });
      const post = term.post || "";
      const punct = post.replace(/\s+/g, "");
      const space = /\s$/.test(post) ? " " : "";
      const tags = new Set(term.tags);
      const word = term.normal || term.text.toLowerCase();
      // like spaCy, only nouns and verbs get a base form ("players" -> "player"); compromise also turns adverbs into adjectives
      const lemma = (tags.has("Noun") || tags.has("Verb")) && !tags.has("Pronoun") ? term.root || term.machine || word : word;
      out.push({ t: term.text, ws: punct ? "" : space, l: lemma, p: posOf(tags, word), tags });
      if (punct) out.push({ t: punct, ws: space, l: punct, p: "PUNCT", tags: new Set() });
    }
    return out;
  }

  function fixTags(words) {
    const hasLaterVerb = (k) => words.slice(k + 1).some((w) => VERBAL.has(w.p));
    words.forEach((w, k) => {
      const prev = words[k - 1], next = words[k + 1];
      const lower = w.t.toLowerCase();
      if (PREPS.has(lower)) w.p = "ADP";
      if (REL.has(lower)) w.p = "SCONJ";
      // "believe that ...", "the theory that explains ...": "that" introduces a clause
      if (lower === "that" && prev && (VERBAL.has(prev.p) || (NOMINAL.has(prev.p) && next && VERBAL.has(next.p)))) w.p = "SCONJ";
      // "good moves": a "verb" right after an adjective is a noun
      if (w.p === "VERB" && prev && prev.p === "ADJ") w.p = "NOUN";
      // "Damage to the hippocampus does ...": a sentence-initial "verb" before a preposition is a noun
      if (k === 0 && w.p === "VERB" && next && ["ADP", "DET"].includes(next.p) && hasLaterVerb(k)) w.p = "NOUN";
      // "the study", "a focus"
      if (w.p === "VERB" && prev && prev.p === "DET") w.p = "NOUN";
      // possessive "her" without a noun after it is an object pronoun: "taught her"
      if (w.p === "DET" && POSS.has(w.t.toLowerCase()) && !(next && ["NOUN", "PROPN", "ADJ", "NUM"].includes(next.p))) w.p = "PRON";
    });
    return words;
  }

  // merge_noun_chunks: determiners, adjectives and numbers + nouns become one token
  function chunk(words) {
    const out = [];
    for (let k = 0; k < words.length; ) {
      let e = k;
      while (e < words.length && (["DET", "ADJ", "NUM", "NOUN", "PROPN"].includes(words[e].p)
        || (words[e].p === "ADV" && words[e + 1] && words[e + 1].p === "ADJ"))) e++;
      let last = e - 1;
      while (last >= k && !["NOUN", "PROPN"].includes(words[last].p)) last--;
      if (last > k) {
        const span = words.slice(k, last + 1);
        out.push({
          t: span.map((w, j) => w.t + (j < span.length - 1 ? (w.ws || " ") : "")).join(""),
          ws: span[span.length - 1].ws,
          l: span.map((w) => w.l).join(" "),
          p: span[span.length - 1].p,
          tags: span[span.length - 1].tags,
        });
        k = last + 1;
      } else {
        out.push(words[k]);
        k++;
      }
    }
    return out;
  }

  // Attach the tokens of one sentence (local indices).
  function attach(sent) {
    const n = sent.length;
    const set = (k, d, h) => { sent[k].d = d; sent[k].h = h; };
    const free = (k) => k >= 0 && k < n && !sent[k].d;
    const isNP = (k) => k >= 0 && k < n && NOMINAL.has(sent[k].p);
    const isTo = (k) => k >= 0 && k < n && sent[k].t.toLowerCase() === "to" && sent[k + 1] && sent[k + 1].p === "VERB";
    const isComma = (k) => k >= 0 && k < n && sent[k].p === "PUNCT" && sent[k].t === ",";

    // 1. Verb groups: auxiliaries, negation, adverbs and the main verb ("can still learn", "does not erase")
    const groups = [];
    for (let k = 0; k < n; k++) {
      if (!VERBAL.has(sent[k].p)) continue;
      let e = k;
      let hasVerb = sent[k].p === "VERB";
      // Auxiliaries, negation and adverbs join until the main verb; after it only "to" + verb ("want to learn")
      const joins = (j) => j < n && (isTo(j) || (j > 0 && isTo(j - 1)) || (!hasVerb && (VERBAL.has(sent[j].p)
        || (sent[j].p === "PART" && sent[j].tags.has("Negative")) || (sent[j].p === "ADV" && j + 1 < n && VERBAL.has(sent[j + 1].p)))));
      while (joins(e + 1)) { e++; if (sent[e].p === "VERB") hasVerb = true; }
      groups.push({ s: k, e });
      k = e;
    }

    for (const g of groups) {
      const idx = [];
      for (let k = g.s; k <= g.e; k++) idx.push(k);
      const verbs = idx.filter((k) => sent[k].p === "VERB");
      const to = idx.find(isTo);
      g.head = verbs.length ? (to !== undefined && verbs[0] < to ? verbs[0] : verbs[verbs.length - 1]) : idx.filter((k) => sent[k].p === "AUX").pop();
      const xcomp = to !== undefined && g.head < to ? verbs.find((k) => k > to) : undefined;
      g.passive = idx.some((k) => k < g.head && BE.has(sent[k].t.toLowerCase())) && (sent[g.head].tags.has("PastTense") || sent[g.head].tags.has("Passive"));
      for (const k of idx) {
        if (k === g.head) continue;
        const w = sent[k];
        if (k === xcomp) set(k, "xcomp", g.head);
        else if (k === to) set(k, "aux", xcomp !== undefined ? xcomp : g.head);
        else if (w.p === "PART") set(k, "neg", g.head);
        else if (w.p === "ADV") set(k, "advmod", g.head);
        else set(k, g.passive && BE.has(w.t.toLowerCase()) ? "auxpass" : "aux", g.head);
      }
    }

    // Nominal phrase inside [from, to]: the first NP takes firstDep, the rest hang off it.
    function parseArgs(from, to, gov, firstDep, mode, passive) {
      let first = -1, last = -1, adp = -1, cc = -1, list = false;
      const coordRoot = {};
      for (let k = from; k <= to; k++) {
        if (!free(k)) continue;
        const w = sent[k];
        if (isNP(k)) {
          if (adp >= 0) { set(k, "pobj", adp); adp = -1; }
          else if ((cc >= 0 || list) && last >= 0) {
            const r = coordRoot[last] !== undefined ? coordRoot[last] : last;
            set(k, "conj", r);
            coordRoot[k] = r;
            if (cc >= 0) set(cc, "cc", r);
          } else if (first < 0) { set(k, firstDep, gov); first = k; }
          else set(k, "dep", gov);
          last = k; cc = -1; list = false;
        } else if (w.p === "ADP") {
          const h = last >= 0 && (mode === "subj" || w.t.toLowerCase() === "of") ? last : gov;
          set(k, passive && w.t.toLowerCase() === "by" && h === gov ? "agent" : "prep", h);
          adp = k;
        } else if (w.p === "CCONJ") cc = k;
        else if (isComma(k)) { set(k, "punct", gov); list = last >= 0; }
        else if (w.p === "ADJ") set(k, mode === "obj" && sent[gov].p === "AUX" && first < 0 ? "acomp" : "dep", gov);
        else if (w.p === "ADV") set(k, "advmod", gov);
        else if (w.p === "PART" && k === from) set(k, "prt", gov);
      }
    }

    // 2. Clauses: subject (if any) and how each verb group attaches
    let rootHead = -1, prevEnd = -1, prev = null;
    groups.forEach((g, gi) => {
      let b = prevEnd + 1, sconj = -1;
      for (let k = g.s - 1; k >= b; k--) if (sent[k].p === "SCONJ") { sconj = k; break; }
      const fresh = !prev || sconj >= 0;
      if (sconj >= 0) b = sconj + 1;

      // subject: the nominal phrase right before the verb group
      let k = g.s - 1;
      while (k >= b && sent[k].p === "ADV") k--;
      let subjStart = -1;
      if (isNP(k)) {
        subjStart = k;
        let j = k - 1;
        while (j >= b) {
          const coordOk = fresh && (sent[j].p === "CCONJ" || isComma(j));
          if ((sent[j].p === "ADP" || coordOk) && isNP(j - 1) && j - 1 >= b) { subjStart = j - 1; j -= 2; }
          else if (coordOk && isComma(j - 1) && isNP(j - 2) && j - 2 >= b) { subjStart = j - 2; j -= 3; }
          else break;
        }
        parseArgs(subjStart, k, g.head, g.passive ? "nsubjpass" : "nsubj", "subj", false);
      }

      // what links this clause to the previous one
      let link = (subjStart >= 0 ? subjStart : g.s) - 1;
      while (link > prevEnd && sent[link].p === "ADV") link--;
      const cconj = link > prevEnd && sent[link].p === "CCONJ" ? link : -1;
      const comma = isComma(cconj >= 0 ? cconj - 1 : link) ? (cconj >= 0 ? cconj - 1 : link) : -1;
      g.clauseStart = Math.min(...[sconj, cconj, comma, subjStart, g.s].filter((x) => x >= 0));

      const coordHead = prev ? prev.coordHead : -1;
      const word = (j) => sent[j].t.toLowerCase();
      if (sconj >= 0 && (REL.has(word(sconj)) || word(sconj) === "that") && isNP(sconj - 1)) {
        // relative clause: "students who practise ...", "the theory that Einstein developed"
        set(sconj, subjStart < 0 ? (g.passive ? "nsubjpass" : "nsubj") : "mark", g.head);
        set(g.head, "relcl", sconj - 1);
        g.antecedent = sconj - 1;
      } else if (prev && prev.antecedent >= 0 && free(prev.antecedent) && subjStart < 0 && cconj < 0 && comma < 0) {
        // "Students who practise regularly | learn faster": the noun before the relative clause is the subject
        set(prev.antecedent, g.passive ? "nsubjpass" : "nsubj", g.head);
        if (rootHead < 0) { set(g.head, "ROOT", g.head); rootHead = g.head; }
        else set(g.head, "ccomp", prev.head);
      } else if (sconj >= 0) {
        set(sconj, ADVMOD_SCONJ.has(sent[sconj].t.toLowerCase()) ? "advmod" : "mark", g.head);
        if (prev) set(g.head, "ccomp", prev.head);
      } else if (prev && subjStart < 0 && sent[g.head].tags.has("Gerund") && comma >= 0 && cconj < 0) {
        set(g.head, "advcl", prev.head);
      } else if (prev && (cconj >= 0 || (comma >= 0 && subjStart < 0))) {
        set(g.head, "conj", subjStart < 0 ? coordHead : prev.head);
        if (cconj >= 0) set(cconj, "cc", subjStart < 0 ? coordHead : prev.head);
      } else if (rootHead >= 0) {
        set(g.head, "ccomp", prev.head);
      }
      if (!sent[g.head].d && rootHead < 0) { set(g.head, "ROOT", g.head); rootHead = g.head; }
      if (comma >= 0 && free(comma)) set(comma, "punct", g.head);
      g.coordHead = subjStart < 0 && sent[g.head].d === "conj" ? coordHead : g.head;
      prevEnd = g.e;
      prev = g;
    });

    // A clause that starts with "when/how ..." before any main clause hangs off the root
    if (rootHead < 0 && groups.length) { const g = groups[groups.length - 1]; set(g.head, "ROOT", g.head); rootHead = g.head; }
    groups.forEach((g) => { if (!sent[g.head].d) set(g.head, "advcl", rootHead); });

    // 3. Objects: what follows each verb group, up to the next clause
    groups.forEach((g, gi) => {
      const end = gi + 1 < groups.length ? groups[gi + 1].clauseStart - 1 : n - 1;
      parseArgs(g.e + 1, end, g.head, sent[g.head].p === "AUX" ? "attr" : "dobj", "obj", g.passive);
    });

    // 4. No verb: the first noun is the root. Everything left hangs off the root.
    if (rootHead < 0) {
      rootHead = Math.max(0, sent.findIndex((w) => NOMINAL.has(w.p)));
      if (free(rootHead)) set(rootHead, "ROOT", rootHead);
    }
    for (let k = 0; k < n; k++) if (free(k)) set(k, sent[k].p === "PUNCT" ? "punct" : "dep", rootHead);
  }

  function parseText(input, nlp) {
    const doc = nlp(input);
    doc.compute("root");
    const tokens = [], sentences = [];
    for (const s of doc.json()) {
      const sent = chunk(fixTags(wordsOf(s.terms)));
      if (!sent.length) continue;
      attach(sent);
      const offset = tokens.length;
      for (const w of sent) tokens.push({ t: w.t, ws: w.ws, l: w.l, p: w.p, d: w.d, h: w.h + offset });
      sentences.push([offset, tokens.length]);
    }
    return { tokens, sentences };
  }

  return { extract, parseText };
});
