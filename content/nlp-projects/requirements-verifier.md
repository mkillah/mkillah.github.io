# Requirements Verifier

*Professional · Semantic parsing · JavaScript, Python, Lean 4*

## Overview

### Question

Business rules are written in plain English, and plain English hides conflicts. Two rules can each sound reasonable while together making a third one impossible. Can a program read the rules, turn them into logic, and **prove** whether they can all be true at once?

### At a glance

- **Input:** business requirements in plain English, one per line.
- **Output:** contradictions and "dead rules" (rules that can never apply), each with a concrete counterexample and a Lean 4 proof.
- **Approach:** a controlled natural language parsed into a structured model, a complete search over every relevant case, and generated proofs that the Lean theorem prover can check.

**Try it live:** the verifier runs in your browser on the [business analysis page](business-analysis.html#verifier).

## Why it matters

In analysis work, conflicting rules are usually found late: by a developer, a tester, or a customer. Each late discovery means rework. In the [NordPay case study](business-analysis.html#business-rules), agreeing 17 business rules before the schema was designed prevented 3 architecture debates later. This tool makes the "check the rules for conflicts" step explicit and repeatable.

## How it works

#### 1. Read the rules

Each sentence is matched against a controlled grammar: a restricted form of English where every sentence has exactly one meaning. *"Must"*, *"cannot"* and *"are always"* become rules for every record; *"can"* and *"may"* describe records that must be allowed to exist. Unrecognised sentences are flagged instead of guessed.

#### 2. Turn them into logic

Every sentence becomes a formula over one entity, such as a transaction or a customer, with yes/no attributes (*held*, *authorised*) and numbers (*amount*, *age*).

#### 3. Search every relevant case

Numbers only appear in threshold comparisons, so checking the values just below, at and above each threshold covers every possible record. A finding is a guarantee, not a sample. When a rule set fails, the tool shrinks it to the smallest set of rules that still conflicts, so the explanation points at the real cause.

#### 4. Prove it in Lean

Each finding is written as a Lean 4 theorem: a concrete example when something is possible, and an impossibility proof when it is not. The proofs can be checked independently in the Lean web editor.

## Example

Four requirements in plain English, and the logic the parser turns them into:

| ID | Requirement | Logic |
| --- | --- | --- |
| R1 | Transactions above 150,000 must be held for review. | ∀ x, amount > 150,000 → held |
| R2 | Held transactions cannot be authorised. | ∀ x, held → ¬authorised |
| R3 | Priority transactions are always authorised. | ∀ x, priority → authorised |
| R4 | Priority transactions can be above 150,000. | ∃ x, priority ∧ amount > 150,000 |

**Finding:** R4 contradicts R1 + R2 + R3. A priority transaction above 150,000 must be held (R1), so it cannot be authorised (R2), yet priority transactions are always authorised (R3). Lean proves that no such transaction can exist.

## Results and next steps

The prototype handles rules about one entity at a time, with yes/no attributes and numeric thresholds, and every proof it generates for the built-in examples is accepted by Lean.

Planned improvements:

- **LLM-assisted parsing,** so free-form requirements are translated into the same structured model, with the controlled grammar kept as a check.
- **Rules across several entities,** such as a merchant's threshold applying to its transactions.
- **Process rules,** checking the order of steps in a workflow, not only the rules for single records.
