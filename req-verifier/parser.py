"""Turns controlled-English requirements into a RequirementModel.

This is a deterministic, pattern-based stand-in for the LLM step. In a full system an
LLM would fill the same Pydantic schema (structured output); everything downstream
(Lean generation, checking) stays the same.
"""
from __future__ import annotations

import re

from model import Atom, BoolAtom, NumAtom, Requirement, RequirementModel, Unparsed

LEAN_KEYWORDS = {
    "abbrev", "at", "by", "class", "def", "deriving", "do", "else", "end", "example",
    "false", "from", "fun", "have", "if", "import", "in", "instance", "let", "match",
    "namespace", "open", "section", "show", "structure", "then", "theorem", "true",
    "variable", "where", "with",
}

COMP = (r"(?P<op>at least|at most|no more than|no less than|over|above|more than|older than|"
        r"under|below|less than|younger than|exactly)")
OPS = {
    "at least": ">=", "no less than": ">=", "at most": "<=", "no more than": "<=",
    "over": ">", "above": ">", "more than": ">", "older than": ">",
    "under": "<", "below": "<", "less than": "<", "younger than": "<", "exactly": "==",
}
YEARS = r"(?: years?(?: old)?)?"
SUBJ = (r"^(?:all |every |any |an? |the )?(?:(?P<group>[a-z][a-z-]*(?: [a-z][a-z-]*)?) )?"
        r"customers?(?: (?:who are |aged )?(?P<sop>under|below|younger than|over|older than|"
        r"at least|at most) (?P<sn>\d+)" + YEARS + r")?")
GET = r"(?:receive|get|obtain|be eligible for|be approved for|be granted|qualify for)"
NOT = r"(?:cannot|can't|can not|must not|may not|shall not|should not|will not|won't)"
PURPOSE = r"(?: (?:to|in order to|before they can|to be able to) (?P<purpose>.+))?"

# (regex, kind, builder-key). Order matters: negative patterns before positive ones.
PATTERNS = [
    (SUBJ + r" (?:must|should|shall|needs? to) be " + COMP + r" (?P<n>\d+)" + YEARS + PURPOSE + "$",
     "rule", "num_age"),
    (SUBJ + r" (?:must|should|shall|needs? to) have an? (?P<attr>[a-z][a-z ]*?) (?:of )?" + COMP
     + r" (?P<n>\d+)" + PURPOSE + "$", "rule", "num_attr"),
    (SUBJ + " " + NOT + " " + GET + r" (?P<obj>.+)$", "rule", "obj_false"),
    (SUBJ + r" (?:are|is) (?:never |not )(?:eligible for|entitled to|approved for|granted) (?P<obj>.+)$",
     "rule", "obj_false"),
    (SUBJ + r" (?:are|is) (?:automatically |always )?(?:eligible for|entitled to|approved for|granted) "
     r"(?P<obj>.+)$", "rule", "obj_true"),
    (SUBJ + r" (?:must|will|shall) (?:always |automatically )?" + GET + r" (?P<obj>.+)$", "rule", "obj_true"),
    (SUBJ + r" (?:can|may|might) be " + COMP + r" (?P<n>\d+)" + YEARS + "$", "possibility", "num_age"),
    (SUBJ + r" (?:can|may|might) have an? (?P<attr>[a-z][a-z ]*?) (?:of )?" + COMP + r" (?P<n>\d+)$",
     "possibility", "num_attr"),
    (SUBJ + r" (?:can|may|might) " + GET + r" (?P<obj>.+)$", "possibility", "obj_true"),
]

SUPPORTED_EXAMPLES = [
    "Customers must be at least 18 to receive a loan.",
    "Premium customers are automatically eligible for a loan.",
    "Premium customers can be under 18.",
    "Customers under 21 cannot receive a credit card.",
    "Customers must have a credit score of at least 650 to receive a mortgage.",
    "Student customers can receive a credit card.",
]


def ident(words: str) -> str:
    """'credit score' -> 'creditScore' (a safe Lean identifier)."""
    parts = re.findall(r"[a-z0-9]+", words.lower())
    if not parts:
        return "x"
    name = parts[0] + "".join(p.capitalize() for p in parts[1:])
    if name[0].isdigit():
        name = "x" + name
    return name + "_" if name in LEAN_KEYWORDS else name


def object_attr(phrase: str) -> str:
    """'receive a loan' / 'a loan' / 'eligible for a loan' -> 'loanEligible'."""
    p = phrase.strip()
    p = re.sub(r"^(?:be )?(?:receive|get|obtain|eligible for|approved for|granted|qualify for|"
               r"apply for|open|have)\s+", "", p)
    p = re.sub(r"^(?:a|an|the|any)\s+", "", p)
    return ident(p) + "Eligible"


def split_sentences(text: str) -> list[tuple[int, str]]:
    out = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for sentence in re.split(r"(?<=[.!?;])\s+", line):
            s = sentence.strip()
            if s:
                out.append((lineno, s))
    return out


def normalize(sentence: str) -> str:
    s = sentence.lower().strip().rstrip(".!;")
    s = s.replace("’", "'")
    return re.sub(r"\s+", " ", s)


def subject_atoms(m: re.Match) -> list[Atom]:
    atoms: list[Atom] = []
    group = m.group("group")
    if group and group not in {"the", "all", "every", "any", "a", "an"}:
        atoms.append(BoolAtom(attr=ident(group)))
    if m.group("sop"):
        atoms.append(NumAtom(attr="age", op=OPS[m.group("sop")], value=int(m.group("sn"))))
    return atoms


def parse(text: str) -> RequirementModel:
    model = RequirementModel()
    counter = 0
    for lineno, sentence in split_sentences(text):
        s = normalize(sentence)
        for pattern, kind, builder in PATTERNS:
            m = re.match(pattern, s)
            if not m:
                continue
            subj = subject_atoms(m)
            if builder in ("num_age", "num_attr"):
                attr = "age" if builder == "num_age" else ident(m.group("attr"))
                main = NumAtom(attr=attr, op=OPS[m.group("op")], value=int(m.group("n")))
            else:
                main = BoolAtom(attr=object_attr(m.group("obj")), value=builder == "obj_true")

            counter += 1
            rid = f"R{counter}"
            if kind == "possibility":
                req = Requirement(id=rid, text=sentence, kind=kind, conditions=subj + [main])
            else:
                conds = list(subj)
                purpose = m.groupdict().get("purpose")
                if purpose:  # "must be at least 18 to receive a loan": loan -> age >= 18
                    conds.append(BoolAtom(attr=object_attr(purpose)))
                req = Requirement(id=rid, text=sentence, kind=kind, conditions=conds, consequences=[main])
            model.requirements.append(req)
            break
        else:
            model.unparsed.append(Unparsed(line=lineno, text=sentence))

    # Collect attribute types; "age" first so the Lean structure reads naturally.
    for req in model.requirements:
        for atom in req.conditions + req.consequences:
            existing = model.attributes.get(atom.attr)
            if existing and existing != atom.kind:
                atom.attr = atom.attr + ("Flag" if atom.kind == "bool" else "Value")
            model.attributes.setdefault(atom.attr, atom.kind)
    model.attributes = dict(sorted(model.attributes.items(), key=lambda kv: (kv[1] != "num", kv[0] != "age")))
    return model
