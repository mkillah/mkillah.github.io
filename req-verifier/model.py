"""Structured representation of business requirements (the "knowledge layer").

Every requirement is about one entity type (here: Customer). A customer is a record
of attributes: booleans (premium, loanEligible, ...) and natural numbers (age, ...).

Two kinds of requirement:
  rule         for every customer: if all `conditions` hold, all `consequences` hold
  possibility  there may exist a customer for whom all `conditions` hold
"""
from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

NumOp = Literal[">=", "<=", ">", "<", "=="]


class BoolAtom(BaseModel):
    kind: Literal["bool"] = "bool"
    attr: str
    value: bool = True

    def describe(self) -> str:
        return self.attr if self.value else f"¬{self.attr}"


class NumAtom(BaseModel):
    kind: Literal["num"] = "num"
    attr: str
    op: NumOp
    value: int = Field(ge=0)

    def describe(self) -> str:
        symbol = {">=": "≥", "<=": "≤", ">": ">", "<": "<", "==": "="}[self.op]
        return f"{self.attr} {symbol} {self.value}"


Atom = Annotated[Union[BoolAtom, NumAtom], Field(discriminator="kind")]


class Requirement(BaseModel):
    id: str
    text: str
    kind: Literal["rule", "possibility"]
    conditions: list[Atom] = []
    consequences: list[Atom] = []

    def formal(self) -> str:
        conds = " ∧ ".join(a.describe() for a in self.conditions)
        if self.kind == "possibility":
            return f"∃ c, {conds or 'True'}"
        cons = " ∧ ".join(a.describe() for a in self.consequences)
        return f"∀ c, {conds} → {cons}" if conds else f"∀ c, {cons}"


class Unparsed(BaseModel):
    line: int
    text: str


class RequirementModel(BaseModel):
    entity: str = "Customer"
    attributes: dict[str, Literal["bool", "num"]] = {}
    requirements: list[Requirement] = []
    unparsed: list[Unparsed] = []

    @property
    def rules(self) -> list[Requirement]:
        return [r for r in self.requirements if r.kind == "rule"]

    @property
    def possibilities(self) -> list[Requirement]:
        return [r for r in self.requirements if r.kind == "possibility"]
