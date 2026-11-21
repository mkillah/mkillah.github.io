# Requirements Verifier

*Professional · LLM structured output · Semantic parsing · Lean 4*

## Overview

### Question

Business rules are written in plain English, and plain English hides conflicts. A new rule can sound perfectly reasonable while quietly contradicting the rules already agreed. When someone proposes a rule, can a program read it, turn it into logic, and **prove** whether it fits the existing rule base?

### At a glance

- **Input:** a rule base of agreed business rules (here NordPay's transaction rules) and one new rule in plain English.
- **Output:** a verdict (fits, contradiction, dead rule, redundant, or side effect), the rules involved, a concrete example, and a Lean 4 proof for each finding.
- **Approach:** an LLM translates the sentence into a small, validated JSON form. A complete logical search then checks it against every relevant case, and the findings are written as Lean theorems.

**Try it live** in the *Try it* section below, or on the [business analysis page](business-analysis.html#verifier).

## Why it matters

In analysis work, conflicting rules are usually found late: by a developer, a tester, or a customer. In the [NordPay case study](business-analysis.html#business-rules), agreeing 17 business rules before the schema was designed prevented 3 architecture debates later. This tool makes the "does this new rule fit what we already agreed?" question explicit and repeatable.

## How it works

#### 1. Translate with an LLM

The new sentence is sent to an LLM (Groq, via a small proxy that keeps the API key off the website) together with the rule base's vocabulary: terms such as *held*, *autoApproved* or *thresholdUsage*. The model returns JSON only: conditions, consequences, and any new terms it had to introduce. Reusing the vocabulary means "authorised automatically" and "approved without review" both map to the same term.

#### 2. Validate before trusting

The LLM output is never used as is. Every term must exist in the vocabulary or be declared as new, every operator and number is checked, and malformed output is rejected. New terms are shown to the user as "not in the glossary", which is often a finding in itself.

#### 3. Check against the rule base

The rule base and the new rule are checked over every relevant transaction. Numbers only appear in threshold comparisons, so testing the values around each threshold covers every case, and a finding is a guarantee, not a sample. The checker reports five outcomes:

| Outcome | Meaning |
| --- | --- |
| Contradiction | A case the business must allow (a P-rule) becomes impossible, or no transaction can satisfy all rules |
| Dead rule | The new rule, or an existing one, can never apply |
| Redundant | The rule base already implies the new rule |
| Side effect | Consistent, but it rules out cases that were allowed before |
| Fits | None of the above |

Each finding is shrunk to the smallest set of rules that causes it, so the explanation points at the real cause.

#### 4. Prove it in Lean

Every finding is written as a Lean 4 theorem: a concrete example when something is possible, and an impossibility proof when it is not. The proofs can be checked in the Lean web editor, independently of this tool.

## Example

NordPay's rule base has 11 rules and 3 possibilities (cases the business must keep allowed). A selection:

| ID | Business rule |
| --- | --- |
| BR-01 | A transaction above 90% of the merchant's fraud threshold is held for review. |
| BR-06 | A rejected transaction cannot be approved. |
| BR-10 | A transaction can only be settled once it is approved. |
| P-03 | A transaction above the merchant's fraud threshold can still be settled after review. |

**New rule:** *Transactions above 95% of the fraud threshold are rejected automatically.*

The LLM reads it as **IF thresholdUsage > 95 THEN rejected**. The verdict is a **contradiction**: P-03 becomes impossible. A transaction above the threshold would now be rejected (new rule), so it cannot be approved (BR-06), so it can never be settled (BR-10). Lean proves that no such transaction can exist.

A softer version, *"Transactions with unusual activity are always rejected"*, is consistent, but has a **side effect**: analysts could then never approve a transaction with unusual activity, which defeats the purpose of the review queue.

## Try it

Pick an example or write your own rule, then select *Check against rule base*. A rule that fits can be added to the rule base for this session.

<div class="rv-widget" data-rv-widget data-rv-endpoint=""></div>

## Results and next steps

The engine and all five example rules are covered by automated tests, and the generated Lean proofs compile. In tests through the proxy, the LLM translated free-form rules correctly. It mapped paraphrases onto existing terms, recognised a rule that only restated BR-03, and introduced a new term when none fitted.

Current limits and planned improvements:

- **One record at a time:** rules that compare two records, such as a merchant's threshold applied to all its transactions, are not supported yet.
- **No time or order:** rules about sequences ("after 24 hours") are reported as unsupported.
- **Process rules:** checking the order of steps in a BPMN workflow, not only the rules for single records.
