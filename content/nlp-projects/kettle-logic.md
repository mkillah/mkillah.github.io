# Kettle Logic: fallacy or irony?

*Research & personal · LLM evaluation · Python, Mistral API, JavaScript*

## Overview

### Question

Language models give fluent interpretations of texts. But do they notice when a passage supports more than one reading, can they point to the sentences that back their answer, and do they admit it when none of the offered readings fits? This project tests that on a small set of passages about one kind of faulty reasoning: **kettle logic**.

### At a glance

- **Data:** 31 short passages, from Aesop and Shakespeare to everyday arguments. Each has five answer options, an annotated answer, the key evidence sentences and an ambiguity rating. On 10 passages the correct statement was removed, so the right answer is "none of the above".
- **Protocol:** each model answers in three steps in one conversation: a first answer with probabilities and quotes, a search for an alternative reading, and a final answer.
- **Models:** Ministral 3B, 8B and 14B, three sizes of Mistral's open-weight model family, one run each on Mistral's free API tier (4 November 2026).
- **Finding:** When a correct statement is listed, the two larger models are right 95–100% of the time. When none is, they drop to 60–70%, and they often pick a wrong statement with 75–90% confidence instead of saying that nothing fits. Alternative readings are offered on almost every passage but almost never change the answer.

## What is kettle logic?

The name comes from a joke that Freud retells. A man returns a borrowed kettle with a hole in it and defends himself with three arguments: he returned it undamaged, it already had a hole when he borrowed it, and he never borrowed it at all. Each excuse would clear him on its own, but together they contradict each other.

Spotting the contradiction is easy. The harder part, and the reason literary texts are a good test, is that the same pattern can be a character's mistake, an author's joke, a satire, or not a fallacy at all.

## The passages

| Type | Items | What it tests |
| --- | --- | --- |
| Everyday cases | 9 | Clear kettle logic and related errors, such as a landlord keeping a deposit "that was never paid" |
| Literary passages | 15 | Fallacies that authors use on purpose, and one valid argument: Freud, Aesop, Carroll, Shakespeare, Cervantes, Conan Doyle, Austen, Swift, Plato |
| Retellings | 3 | The borrowed-kettle argument in a new setting (a sewing machine, a village cart, a car with the excuses in reverse order) |
| Look-alikes and controls | 4 | Passages that are **not** kettle logic: Chekhov's "The Chameleon", a lawyer arguing "even if…", a scientist listing hypotheses, a valid-reasoning control |

Each passage has an ambiguity rating (17 low, 11 medium, 3 high) and weighted "plausible readings". For example, Antony's funeral speech is rated 45% legitimate counter-evidence, 40% appeal to emotion and 15% manipulation.

### When none of the options is right

Every passage has the same fifth option: **"E. None of the statements above gives a correct description of the reasoning in this passage."** On 10 of the 31 passages the correct statement was taken out and replaced with a new, plausible-sounding wrong one, so E is the right answer. These 10 cover every type of passage, from the broken window to Holmes, the gravediggers and the sewing-machine retelling.

This tests something a normal multiple-choice question cannot: whether a model will say that nothing fits, or will always pick the best-sounding option it is given.

### Making the test hard to game

The first draft had a flaw that is common in multiple-choice tests: the correct option was the longest one on **every** item, so "pick the longest answer" scored 31 out of 31. All options were rewritten to 80–100 characters, including the new wrong statements and option E, and the correct answers are spread across all five letters. "Pick the longest" now scores 4 of 31 and "pick the shortest" 4.3, both below the chance level of 6.2.

## The protocol

Every passage is one conversation with three turns. Every reply is a JSON object.

1. **First answer.** The model picks an option, gives a probability for each of the five options, and quotes one to three sentences from the passage that support its choice.
2. **Another reading?** The model is asked whether a different option could be defended. If so, it names the option, quotes the evidence, and says how likely that reading is.
3. **Final answer.** Taking both readings into account, the model chooses again and gives new probabilities.

Every quoted sentence is checked automatically against the passage: is it word for word, a near match (at least 90% the same), or not in the passage at all?

The free APIs used here do not return token probabilities, so "certainty" is the probability each model **writes down**. That is still informative: it is what a reader of the answer would see.

## Results

| Model | Correct, option listed (21) | Correct, no option fits (10) | Wrongly chose "none" | Answers changed in step 3 | Offered an alternative | Quotes found word for word |
| --- | --- | --- | --- | --- | --- | --- |
| Ministral 14B | 21 (100%) | 7 (70%) | 0 | 0 | 31 of 31 | 96% |
| Ministral 8B | 20 (95%) | 6 (60%) | 0 | 0 | 31 of 31 | 89% |
| Ministral 3B | 16 (76%) | 7 (70%) | 3 | 2 | 28 of 31 | 16% |

### 1. When no option fits, the models still pick one

With a correct statement among the options, Ministral 14B gets all 21 passages right and 8B gets 20. Remove that statement, and they find "none of the above" on only 7 and 6 of the 10 passages.

![Share of final answers that match the annotation, with and without a correct option](assets/img/kettle-logic/accuracy-by-answer.png)

The misses are often confident:

- **Holmes, "You have been in Afghanistan"** (high ambiguity). No model chose E. Ministral 8B picked "a strict logical deduction" at 90% and 14B at 85%, although the passage presents Holmes's conclusion as a probable guess.
- **The borrowed sewing machine.** 14B and 8B recognise kettle logic in the three other retellings of the same argument. Here, with that statement removed, both chose "the answers are consistent, because each covers a different moment in time", at 70–75%, rather than "none of the above".
- **The mysterious disappearance.** Ministral 3B chose the new statement "the curator reasons soundly" with 82% confidence.

### 2. Confidence drops a little, but not enough

When nothing fits, the first answer gets somewhat less confidence: 14B drops from 75% to 64% and 8B from 82% to 72%. That is a real signal, but a weak one. When 8B picked a wrong statement on these passages, it still gave it 78% on average, almost as much as its correct answers elsewhere.

![Mean probability given to the first choice, with and without a correct option](assets/img/kettle-logic/confidence-by-answer.png)

### 3. Alternatives are offered everywhere, and almost never acted on

Asked whether another reading is possible, 14B and 8B said yes on **all 31** passages and 3B on 28. They then rated that alternative as unlikely: 10–15% for the two larger models, with no rise on high-ambiguity passages, and 18–35% for 3B.

![Mean likelihood each model gave its alternative reading, by ambiguity](assets/img/kettle-logic/alternative-probability.png)

The second step rarely helps:

- **The larger models never changed an answer.** On 14B's Holmes answer and 8B's sewing-machine answer, the alternative they named in step 2 was the correct E. Both kept their wrong first answers in step 3.
- **The smallest model changed twice, both times for the worse.** On the late essay and the cancelled concert, Ministral 3B first gave the correct answer, named E as an alternative, and then switched to E. Together with Alice and the Pigeon, it said "none of the above" on 3 passages where a correct statement was listed.

So the "none" option helps the larger models a little and the smallest model not at all: it becomes one more place to drift to.

### 4. The smallest model's "quotes" are mostly not quotes

Each model was asked to copy one to three sentences from the passage word for word. Ministral 14B and 8B mostly do: 96% and 89% of their quotes are in the passage. Ministral 3B does not: **84% of its 85 "quotes" are not in the passage**. They are summaries and paraphrases inside quotation marks, sometimes with added emphasis.

![Share of quoted sentences found word for word, as near matches, or not at all](assets/img/kettle-logic/evidence-grounding.png)

### What this means

A standard multiple-choice test rewards a model for picking the best of the options it is given. That hides the behaviour this project is about: when every offered interpretation is wrong, these models usually pick the most plausible-sounding one with only slightly lower confidence, instead of saying that none fits. Asking for an alternative reading does not fix it, because the alternative is produced by reflex and rarely changes the decision. For culturally grounded interpretation, where the right reading may not be among the obvious candidates, "none of these" and calibrated uncertainty need to be measured directly.

### Compared with the first version

A first run used the same passages with only four options and a correct answer always listed. There the three models were right on 31, 30 and 29 of 31 passages, which made the test look almost solved. Adding "none of the above", and making it correct on a third of the passages, is what separated the models and exposed the failures above.

## Explore every answer

Pick a passage to see each model's three steps: its probabilities, its quotes (marked green if they are in the passage), the alternative it offered, and whether it changed its mind. The annotated answer is hidden until you click to show it, so you can try the passage yourself first. Use **"No correct option listed"** to see the 10 passages where the answer is E.

<iframe class="kettle-explorer" src="assets/kettle-logic/explorer.html" title="Kettle Logic item browser" loading="lazy" style="width:100%;height:1080px;border:1px solid #e4e6df;border-radius:8px;"></iframe>

[Open the item browser full screen](assets/kettle-logic/explorer.html)

## Limitations

- **Small, single-annotator dataset.** 31 passages, labelled by one person. With only 10 no-answer passages, differences of one or two answers between models are not meaningful.
- **One run per model.** Answers vary between runs; repeated runs would show how stable each answer is.
- **Stated, not measured, probabilities.** Certainty is what the model writes, not its internal token probabilities.
- **Memorisation.** Famous passages may be recalled rather than read. The retellings partly test this.
- **Paraphrases.** The literary passages are short paraphrases of public-domain works, not the original wording.
- **Free-tier models.** Three sizes of one model family. Larger models (Claude, Mistral Medium) were not available on the accounts used at run time; the script supports them, so they can be added with one command.

## Next steps

- **Paired versions.** Run every passage both with and without its correct statement, so each model can be compared with itself on the same text.
- **More ambiguous passages.** Only 3 of 31 are rated high ambiguity, and Holmes, one of them, produced the most confident mistakes.
- **A second annotator,** to measure agreement on the plausible readings.
- **Larger models and repeated runs.** The script already supports Claude, Mistral Medium and Groq-hosted models.
