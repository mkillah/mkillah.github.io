"""Usage: python tests/spo_make_fixtures.py content/nlp-projects tests/fixtures/spo-expected.json <project-factextraction.ipynb>
Needs spacy + en_core_web_sm. Edit EXAMPLES to change the widget examples.

Run the notebook's SPO extractor on example texts and dump
(1) the spaCy parses the widget needs and (2) the facts, as test fixtures."""
import json, sys
from pathlib import Path

HERE = Path(__file__).parent
nb = json.load(open(sys.argv[3], encoding="utf-8"))
ns = {}
exec("".join(nb["cells"][1]["source"]), ns)   # loads nlp + merge_noun_chunks
exec("".join(nb["cells"][2]["source"]), ns)   # the extractor functions
nlp = ns["nlp"]

EXAMPLES = [
    ("chess", "Chess expertise",
     "Chess experts recognise familiar patterns quickly. They remember positions from real games and find good moves in seconds. Weaker players search through many more moves."),
    ("memory", "Memory",
     "The hippocampus forms new memories. Damage to the hippocampus does not erase old memories. Patients with this damage can still learn new motor skills."),
    ("curie", "Marie Curie",
     "Marie Curie discovered polonium and radium. She won the Nobel Prize in Physics in 1903. Her research was continued by her daughter."),
    ("language", "Language",
     "Children acquire their first language without formal instruction. Linguists study how grammar is represented in the mind."),
    ("cogsci", "Cognitive science",
     "Cognitive science is the study of the human mind and brain, focusing on how the mind represents and manipulates knowledge and how mental representations and processes are realized in the brain. Cognitive scientists study intelligence and behavior, with a focus on how nervous systems represent, process, and transform information."),
]


def demlimit(tokens):
    return list(ns["demlimiter"](tokens).values())


def facts(doc):
    out = []
    for sent in doc.sents:
        for tok in sent:
            if tok.dep_ in ("nsubj", "nsubjpass"):
                spo = ns["getSPO"](tok)
                for pred, (subj, objs) in spo.items():
                    if objs and not isinstance(objs[0], str):
                        objs = demlimit(objs)   # conj facts return raw tokens
                    out.append({"subject": subj, "predicate": pred, "objects": objs})
    return out


def parse(doc):
    return {
        "sentences": [[s.start, s.end] for s in doc.sents],
        "tokens": [{"t": t.text, "ws": t.whitespace_, "l": t.lemma_, "p": t.pos_,
                    "d": t.dep_, "h": t.head.i} for t in doc],
    }


examples, fixtures = [], []
for ex_id, label, text in EXAMPLES:
    doc = nlp(text)
    examples.append({"id": ex_id, "label": label, "text": text, **parse(doc)})
    fixtures.append({"id": ex_id, "facts": facts(doc)})

import spacy
meta = {"parser": f"spaCy {spacy.__version__}, {nlp.meta['name']} {nlp.meta['version']}, merge_noun_chunks"}
out_dir = Path(sys.argv[1])
(out_dir / "spo-examples.json").write_text(json.dumps({**meta, "examples": examples}, ensure_ascii=False), encoding="utf-8")
(Path(sys.argv[2])).write_text(json.dumps(fixtures, ensure_ascii=False, indent=1), encoding="utf-8")
for f in fixtures:
    print("==", f["id"])
    for x in f["facts"]:
        print(f"  {x['subject']!r} | {x['predicate']!r} | {x['objects']}")
