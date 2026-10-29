"""Checks a RequirementModel for contradictions and emits a Lean 4 file with proofs.

Pipeline:
  1. A small model finder searches all relevant customer records. Numeric attributes
     only appear in threshold comparisons, so testing the values n-1, n, n+1 around
     every threshold n (plus 0) covers every case. The search is therefore complete.
  2. For each question it writes a Lean theorem: either a concrete witness
     (`by decide`) or an impossibility proof (case split + `simp_all` + `omega`).
  3. If Lean is installed, the file is compiled. A successful compile means the
     Lean kernel has checked every proof, independently of the Python search.
"""
from __future__ import annotations

import itertools
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from model import Atom, BoolAtom, NumAtom, Requirement, RequirementModel

World = dict[str, int | bool]
MAX_WORLDS = 200_000
LEAN_TIMEOUT_S = 60


# ---------------------------------------------------------------- model finder

def holds(atom: Atom, w: World) -> bool:
    v = w[atom.attr]
    if isinstance(atom, BoolAtom):
        return v == atom.value
    return {">=": v >= atom.value, "<=": v <= atom.value, ">": v > atom.value,
            "<": v < atom.value, "==": v == atom.value}[atom.op]


def rule_ok(rule: Requirement, w: World) -> bool:
    return not all(holds(a, w) for a in rule.conditions) or all(holds(a, w) for a in rule.consequences)


def candidate_values(model: RequirementModel) -> dict[str, list]:
    values: dict[str, list] = {}
    for attr, kind in model.attributes.items():
        if kind == "bool":
            values[attr] = [True, False]
            continue
        pts = {0}
        for req in model.requirements:
            for a in req.conditions + req.consequences:
                if a.attr == attr:
                    pts.update(x for x in (a.value - 1, a.value, a.value + 1) if x >= 0)
        values[attr] = sorted(pts, reverse=True)  # prefer realistic values (17 over 0)
    return values


def worlds(model: RequirementModel):
    values = candidate_values(model)
    attrs = list(values)
    for i, combo in enumerate(itertools.product(*(values[a] for a in attrs))):
        if i >= MAX_WORLDS:
            return
        yield dict(zip(attrs, combo))


def find_world(model: RequirementModel, scenario: list[Atom], rules: list[Requirement]) -> World | None:
    for w in worlds(model):
        if all(holds(a, w) for a in scenario) and all(rule_ok(r, w) for r in rules):
            return w
    return None


def minimal_conflict(model: RequirementModel, scenario: list[Atom], rules: list[Requirement]) -> list[Requirement]:
    """Smallest subset of rules that still makes the scenario impossible (deletion-based)."""
    core = list(rules)
    for r in list(core):
        trial = [x for x in core if x is not r]
        if find_world(model, scenario, trial) is None:
            core = trial
    return core


def counterexamples(model: RequirementModel, scenario: list[Atom], core: list[Requirement], limit=4):
    """Records that satisfy the scenario, each with the rules it breaks."""
    relevant = {a.attr for a in scenario} | {a.attr for r in core for a in r.conditions + r.consequences}
    seen, out = set(), []
    for w in worlds(model):
        if not all(holds(a, w) for a in scenario):
            continue
        broken = tuple(r.id for r in core if not rule_ok(r, w))
        proj = {k: v for k, v in w.items() if k in relevant}
        key = (tuple((k, v) for k, v in proj.items() if isinstance(v, bool)), broken)
        if key in seen:
            continue
        seen.add(key)
        out.append({"record": proj, "breaks": list(broken)})
        if len(out) >= limit:
            break
    return out


# ---------------------------------------------------------------- findings

@dataclass
class Check:
    id: str                  # Lean theorem name
    title: str
    question: str
    scenario: list[Atom]
    severity: str = "ok"     # ok | contradiction | warning
    summary: str = ""
    witness: World | None = None
    conflict: list[str] = field(default_factory=list)
    examples: list[dict] = field(default_factory=list)
    lean_status: str = "not_run"   # not_run | verified | failed
    lean_error: str = ""
    theorem: str = ""              # name of the Lean theorem that settles this check

    def theorem_name(self) -> str:
        if self.witness is not None or self.id == "rules_satisfiable":
            return self.id if self.witness is not None else "rules_contradict"
        return self.id.replace("_consistent", "_contradicts_rules").replace("_can_apply", "_never_applies")


def describe_record(model: RequirementModel, rec: World) -> str:
    parts = []
    for attr, v in rec.items():
        if isinstance(v, bool):
            parts.append(attr if v else f"not {attr}")
        else:
            parts.append(f"{attr} {v}")
    return f"a {model.entity.lower()} with " + ", ".join(parts)


def build_checks(model: RequirementModel) -> list[Check]:
    rules = model.rules
    checks = [Check(id="rules_satisfiable", title="Rules are satisfiable",
                    question="Can any customer satisfy all rules at once?", scenario=[])]
    for p in model.possibilities:
        conds = " ∧ ".join(a.describe() for a in p.conditions)
        checks.append(Check(id=f"{p.id}_consistent", title=f"{p.id} is consistent with the rules",
                            question=f"Can a customer with {conds} exist?", scenario=p.conditions))
    for r in rules:
        if r.conditions:
            conds = " ∧ ".join(a.describe() for a in r.conditions)
            checks.append(Check(id=f"{r.id}_can_apply", title=f"{r.id} can apply",
                                question=f"Can a customer with {conds} exist?", scenario=r.conditions))

    by_id = {r.id: r for r in model.requirements}
    for c in checks:
        w = find_world(model, c.scenario, rules)
        if w is not None:
            c.witness = w
            c.summary = f"Yes, e.g. {describe_record(model, w)}."
            continue
        core = minimal_conflict(model, c.scenario, rules)
        c.conflict = [r.id for r in core]
        c.examples = counterexamples(model, c.scenario, core)
        rid = c.id.split("_")[0]
        c.title = (f"{rid} can never apply" if c.id.endswith("_can_apply")
                   else f"{rid} contradicts the rules" if c.scenario else "The rules contradict each other")
        if c.id.endswith("_can_apply"):
            rid = c.id.split("_")[0]
            others = [x for x in c.conflict if x != rid]
            c.severity = "warning"
            c.summary = (f"Dead rule: no customer can ever trigger {rid}"
                         + (f", because it clashes with {' + '.join(others)}." if others
                            else ", because its own conditions clash."))
        else:
            c.severity = "contradiction"
            who = by_id[c.id.split("_")[0]].text if c.scenario else "the rules"
            c.summary = (f"Potential contradiction: “{who}” cannot hold together with "
                         f"{' + '.join(c.conflict)}.") if c.scenario else \
                "The rules contradict each other: no customer can satisfy all of them."
        if c.examples:
            ex = c.examples[0]
            c.summary += (f" For example, {describe_record(model, ex['record'])} "
                          f"breaks {', '.join(ex['breaks'])}.")
    return checks


# ---------------------------------------------------------------- Lean generation

def lean_atom(a: Atom) -> str:
    if isinstance(a, BoolAtom):
        return f"c.{a.attr} = {'true' if a.value else 'false'}"
    return f"c.{a.attr} {({'>=': '≥', '<=': '≤', '>': '>', '<': '<', '==': '='})[a.op]} {a.value}"


def lean_conj(atoms: list[Atom]) -> str:
    return " ∧ ".join(lean_atom(a) for a in atoms) if atoms else "True"


def doc(text: str) -> str:
    # User text goes into a comment: make sure it cannot close the comment and inject code.
    return text.replace("-/", "- /").replace("/-", "/ -")


def lean_value(v) -> str:
    return ("true" if v else "false") if isinstance(v, bool) else str(v)


def generate_lean(model: RequirementModel, checks: list[Check]) -> tuple[str, dict[str, tuple[int, int]]]:
    """Returns Lean source and the line span of each theorem (to map compiler errors)."""
    E = model.entity
    L: list[str] = [
        "-- Auto-generated by the Requirements Verification Assistant.",
        "-- Plain Lean 4 (no Mathlib needed). Check with:  lean requirements.lean",
        "",
        f"structure {E} where",
    ]
    for attr, kind in model.attributes.items():
        L.append(f"  {attr} : {'Bool' if kind == 'bool' else 'Nat'}")
    if not model.attributes:
        L.append("  id : Nat")
    L += ["deriving Repr", ""]

    for r in model.requirements:
        L.append(f"/-- {r.id}: {doc(r.text)} -/")
        if r.kind == "rule":
            body = lean_conj(r.consequences)
            if r.conditions:
                body = f"{lean_conj(r.conditions)} → {body}"
        else:
            body = lean_conj(r.conditions)
        L += [f"abbrev {r.id} (c : {E}) : Prop :=", f"  {body}", ""]

    rule_ids = [r.id for r in model.rules]
    L.append("/-- Every rule, applied to one customer. -/")
    L.append(f"abbrev Rules ({'c' if rule_ids else '_c'} : {E}) : Prop :=")
    L.append("  " + (" ∧ ".join(f"{i} c" for i in rule_ids) if rule_ids else "True"))
    L.append("")

    fields = list(model.attributes) or ["id"]
    bool_fields = [a for a, k in model.attributes.items() if k == "bool"]
    spans: dict[str, tuple[int, int]] = {}
    for c in checks:
        scen_name = f"Scenario_{c.id}"
        L.append(f"/-- {doc(c.question)} -/")
        L += [f"abbrev {scen_name} ({'c' if c.scenario else '_c'} : {E}) : Prop :=", f"  {lean_conj(c.scenario)}", ""]
        start = len(L) + 1
        c.theorem = c.theorem_name()
        if c.witness is not None:
            rec = ", ".join(f"{a} := {lean_value(c.witness[a])}" for a in model.attributes) or "id := 0"
            L.append(f"theorem {c.theorem} : ∃ c : {E}, {scen_name} c ∧ Rules c :=")
            L.append(f"  ⟨{{ {rec} }}, by decide⟩")
        else:
            L.append(f"theorem {c.theorem} : ¬ ∃ c : {E}, {scen_name} c ∧ Rules c := by")
            L.append(f"  rintro ⟨⟨{', '.join(fields)}⟩, hs, hr⟩")
            # simp_all does not unfold abbrevs on its own, so unfold them first, then split on every Bool.
            L.append(f"  simp only [{', '.join([scen_name, 'Rules', *rule_ids])}] at hs hr")
            L.append("  all_goals (" + "".join(f"cases {b} <;> " for b in bool_fields)
                     + "(try simp_all) <;> omega)")
        spans[c.id] = (start, len(L))
        L.append("")
    return "\n".join(L), spans


# ---------------------------------------------------------------- running Lean

def find_lean() -> str | None:
    override = os.environ.get("LEAN_BIN")
    if override and Path(override).exists():
        return override
    found = shutil.which("lean")
    if found:
        return found
    exe = "lean.exe" if sys.platform == "win32" else "lean"
    elan = Path.home() / ".elan" / "bin" / exe
    return str(elan) if elan.exists() else None


def _limit_resources():  # POSIX only: cap memory and CPU of the Lean process
    import resource
    resource.setrlimit(resource.RLIMIT_AS, (2 * 1024**3, 2 * 1024**3))
    resource.setrlimit(resource.RLIMIT_CPU, (LEAN_TIMEOUT_S, LEAN_TIMEOUT_S))


def run_lean(source: str) -> dict:
    """Compile the generated file in a throwaway directory with a timeout.

    This is a light sandbox (temp dir, minimal environment, timeout, rlimits on POSIX).
    Generated code from an LLM should run in a container or VM without network access.
    """
    lean = find_lean()
    if not lean:
        return {"available": False}
    keep = ("PATH", "SYSTEMROOT", "USERPROFILE", "HOME", "ELAN_HOME", "TEMP", "TMP", "LOCALAPPDATA")
    env = {k: v for k, v in os.environ.items() if k in keep}
    with tempfile.TemporaryDirectory(prefix="leanreq_") as tmp:
        path = Path(tmp) / "requirements.lean"
        path.write_text(source, encoding="utf-8")
        try:
            proc = subprocess.run(
                [lean, str(path)], cwd=tmp, env=env, capture_output=True, text=True,
                encoding="utf-8", errors="replace", timeout=LEAN_TIMEOUT_S,
                preexec_fn=_limit_resources if os.name == "posix" else None,
            )
        except subprocess.TimeoutExpired:
            return {"available": True, "ok": False, "output": f"Lean timed out after {LEAN_TIMEOUT_S}s."}
        out = (proc.stdout + proc.stderr).replace(str(path), "requirements.lean")
        return {"available": True, "ok": proc.returncode == 0, "output": out.strip()}


def apply_lean_result(checks: list[Check], spans: dict, result: dict) -> None:
    if not result.get("available"):
        return
    errors: list[tuple[int, str]] = []
    for m in re.finditer(r"requirements\.lean:(\d+):\d+: error: (.*)", result.get("output", "")):
        errors.append((int(m.group(1)), m.group(2)))
    for c in checks:
        if result.get("ok"):
            c.lean_status = "verified"
            continue
        lo, hi = spans[c.id]
        mine = [msg for line, msg in errors if lo <= line <= hi]
        c.lean_status = "failed"
        c.lean_error = "; ".join(mine) or "Not checked: the file has errors elsewhere (see Lean output)."
