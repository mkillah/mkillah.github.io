# Linguistics

*Meaning · Structure · Logic · Computation*

## What I have been researching

My interest in language starts from a cognitive science question: **how does the mind turn words and sentences into meaning?** I have approached it from three directions that each say something different about how language is structured and understood.

### Research themes

- **Cognitive semantics.** How meaning is grounded in experience and conceptual structure: categories, prototypes, metaphor, and the mental frames that let us understand a word or sentence in context.
- **Generative grammar.** How sentences are built from abstract syntactic rules, and what that says about the structure of language and the knowledge speakers carry in their heads.
- **Language and logic.** How the meaning of a sentence can be expressed in a precise, formal way, and how sentences relate to each other through entailment, contradiction, and inference.

### From theory to practice

These questions also became practical. In my project [Extracting facts from text](nlp-project.html?id=fact-extraction), I use the grammatical structure of a sentence to pull out its core facts as simple *who, does what, to what* statements. The project sits where my interests meet: syntax tells the program which words belong together, and the output is a logical, structured representation of what the sentence says.

## Where I am heading

My next step is to move into **computational linguistics and natural language processing**, with a focus on **semantics**: how meaning can be represented, computed, and evaluated, both in people and in language models.

### Meaning, ambiguity, and interpretation

Language is rarely fully explicit. The same sentence can have several plausible readings, and choosing between them takes context, background knowledge, and often cultural and historical understanding. I want to study how language models deal with this: what knowledge and interpretive strategies they rely on, where their readings diverge from those of human readers, and whether they recognise when a text is genuinely ambiguous rather than settling on one answer with false confidence.

### Grounding interpretations in evidence

A good interpretation points back to the text. I am interested in methods that make the reasoning of language models explicit and checkable: linking a claim to the passages and context that support it, and representing uncertainty and multiple readings instead of hiding them. This builds directly on my work on extracting structured facts from sentences.

### Evaluating language models like a cognitive scientist

My background in psychology shapes how I think about evaluation. Comparing models with human readers, designing careful tests, and asking *why* a system answers as it does, not only whether it is right, are as important to me in NLP as they are in the study of human cognition (see [Psychology](psychology.html)).

## Methods

### Methods I have used

#### Text processing with spaCy

Tokenisation, part-of-speech tagging, dependency parsing, and noun phrase chunking, used to analyse sentence structure and build rule-based extraction on top of it.

#### NLTK

Classic NLP tools for working with corpora, tokenising and tagging text, and exploring grammars and linguistic structure.

#### Rule-based information extraction

Turning linguistic knowledge into explicit rules that extract structured facts from text.

### Methods I want to develop

#### Advanced NLP methods

Moving beyond rule-based pipelines to modern approaches such as transformer models, semantic parsing, coreference resolution, and fine-tuning models for specific tasks.

#### Large language models

Using LLMs both as tools and as objects of study: probing and evaluating how they interpret meaning, ambiguity, and context, and comparing their reasoning with that of human readers.

#### Knowledge graphs

Representing facts, concepts, and context in a structured, connected form, so that interpretations can be grounded in explicit knowledge and checked against it.

#### Retrieval-augmented generation

Connecting language models to sources of text and background knowledge, so that their answers rest on evidence that can be traced.

#### Annotation and human-centred evaluation

Building datasets with human interpretations and testing models against expert and everyday readers, not only against automatic scores.
