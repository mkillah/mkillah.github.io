# Extracting facts from text

*Research & personal · Information extraction · Python, spaCy*

## Overview

### Question

Text is full of facts, but they are hidden inside sentences. Can a program read a sentence and pull out its core facts in a simple, structured form: **who** (subject), **does what** (predicate), **to what** (object)?

### At a glance

- **Input:** plain English text, one or many sentences.
- **Output:** a list of facts, each as a subject–predicate–object triple.
- **Approach:** linguistic rules built on top of spaCy's sentence analysis, with no training data needed.

## Why it matters

Facts in a structured form are much easier to search, compare, and analyse than free text. This kind of extraction is a first step towards knowledge graphs, smarter search, and automatic summaries of large text collections.

## How it works

#### 1. Read the sentence

spaCy splits the text into sentences and words, labels each word (noun, verb, adjective, ...), and works out how the words depend on each other. Multi-word phrases such as *"the human mind"* are kept together as one unit.

#### 2. Find the subject

For every sentence, the extractor looks for the words acting as the subject: the "who" or "what" the sentence is about.

#### 3. Build the predicate

From the subject it moves to the verb, and collects the words that complete its meaning, such as negations (*not*), helper verbs (*are realized*), and particles. Verbs joined by *and* are treated as separate facts that share the same subject.

#### 4. Collect the objects

Finally, it gathers what the verb refers to, including objects introduced by prepositions (*in the brain*, *of the human mind*), and returns everything as a structured fact.

## Example

**Input text:**

> Cognitive science is the study of the human mind and brain, focusing on how the mind represents and manipulates knowledge and how mental representations and processes are realized in the brain. Cognitive scientists study intelligence and behavior, with a focus on how nervous systems represent, process, and transform information.

**Extracted facts (selection):**

| Subject | Predicate | Object(s) |
| --- | --- | --- |
| cognitive science | is the study | of the human mind · brain |
| the mind | manipulates | knowledge |
| mental representations and processes | are realized | in the brain |
| cognitive scientists | study | intelligence · behavior |
| cognitive scientists | transform | information |

## Results and next steps

The extractor reliably captures the main facts in clear, well-formed sentences. Long sentences with nested clauses are harder: some objects get attached to the wrong verb, and words like *how* slip into the predicate.

Planned improvements:

- **Coreference resolution,** so that *"it"* or *"they"* are linked back to the right subject.
- **Better handling of nested clauses** and lists of verbs.
- **Evaluation on a labelled dataset** to measure accuracy, not just inspect examples.

> This is a work in progress. The full code and the latest version are in the [notebook on GitHub](https://github.com/mkillah/Portfolio/blob/main/NLP_Projects/project-factextraction.ipynb).
