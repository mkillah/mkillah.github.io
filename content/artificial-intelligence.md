# Artificial intelligence

*Connectionist and symbolic AI · Cognitive architectures · Natural language processing · Pattern recognition*

## What I have been researching

My interest in artificial intelligence comes from cognitive science: I want to understand human thinking well enough to build working models of it. The question I care about is not only whether a system can solve a problem, but whether it solves it *the way people do*, including the way people make mistakes.

I have been researching the two main streams of AI side by side:

- **Connectionist AI**: deep neural networks, which learn distributed representations directly from data.
- **Symbolic AI**: explicit rules, structures, and reasoning over representations that can be inspected and explained.

Within the symbolic stream, my starting point is **knowledge representation**: how knowledge is structured, stored, and retrieved, and how that structure supports or limits reasoning. Chess is a natural test case. Decades of research show that experts do not simply calculate more; they recognise meaningful patterns and draw on large, well-organised memories of positions.

This leads me to **cognitive architectures**, which turn theories of the mind into running programs:

- **CHREST** (Chunk Hierarchy and REtrieval STructures), a model of expertise in which knowledge is learned as "chunks" and larger "templates" that link perception, memory, and problem solving. CHREST has been used to simulate how chess players perceive and remember positions, which makes it a strong bridge between my experimental work and computational modelling.
- **ACT-R**, which models cognition as the interaction of declarative memory (facts) and procedural memory (production rules), with timing that can be compared directly to human data.
- **Soar**, a general architecture for problem solving and learning, built around goals, problem spaces, and the automatic learning of new rules.

I have also been working with **natural language processing**, from classic toolkits such as **spaCy** and **NLTK** to **large language models (LLMs)**, as another window on how meaning is represented and processed.

## Where I am heading

The directions below are my research interests within **artificial intelligence**. My interests in psychology, neuroscience, and linguistics have their own focus, but a cognitive science approach unites them all in one goal: **investigating the human mind by bringing together skills and knowledge from different fields.**

Within AI, my next step is **computational modelling of pattern recognition**: building working models of how perceptual information is transformed into abstract knowledge, and using them to explain how people do it.

### From perception to abstraction

Pattern recognition happens at two levels: **perceptual patterns**, what a system or a person actually sees, as in visual machine learning, and **abstract patterns**, meanings, concepts, and relations, as in semantic learning. I am most interested in where the two meet. Chess is a good example: an expert looks at pieces on squares and sees plans, threats, and ideas. I want to model that transformation step by step, so that each stage can be tested against human data.

### Learning more from less data

People learn new patterns and concepts from a handful of examples, while most deep learning systems need enormous datasets. I want to build models that **get more information out of less data**, by using prior knowledge and structure to guide learning instead of relying on scale alone. Human experts are a strong reference point: their knowledge lets them see far more in a single position than a novice does.

### Neurosymbolic models

Neither stream is enough on its own. Neural networks are good at learning from raw perception but are hard to interpret and data-hungry; symbolic models and cognitive architectures represent abstract knowledge explicitly but struggle to learn it from raw input. I want to combine them in a **neurosymbolic approach**, where neural components learn perceptual patterns and symbolic components represent, reason over, and reuse what was learned. This builds on my work with a symbolic logic engine, inductive logic programming, CHREST, and the neural chess model MAIA (see [AI projects](ai.html)).

## Methods

### Methods I have used

#### Computational modelling

Working with CHREST to represent chess knowledge as chunks and templates, and to compare model behaviour with human data on perception, memory, and problem solving.

#### Symbolic AI and logic programming

Building a rule-based logic engine that recognises chess motifs, and using inductive logic programming to learn rules from examples and background knowledge.

#### Neural networks

Training and testing MAIA, a human-like neural chess model, and comparing its decisions with those of human players of the same rating.

#### Linking models to experiments

Using behavioural data from my chess studies, such as accuracy, optimal-solution rates, and response times, as targets that a model should reproduce.

#### NLP and LLM augmentation tools

Text processing with spaCy and NLTK, and modern tools that extend what large language models can do, such as **retrieval-augmented generation (RAG)**, which grounds a model's answers in a searchable knowledge base, along with embeddings and vector search, tool use, and agent workflows.

#### Python

Data handling, model building, and analysis.

### Methods I want to develop

#### Neurosymbolic architectures

Combining neural networks for perception with symbolic representations for abstract knowledge and reasoning, in a single model.

#### Data-efficient learning

Few-shot learning, transfer learning, and the use of prior knowledge and structure, so that models learn more from fewer examples.

#### Visual machine learning

Computer vision models for perceptual pattern recognition, as the first stage of models that move from what is seen to what it means.

#### Cognitive architectures beyond CHREST

Building models in ACT-R and Soar, and comparing how different architectures account for the same human data.
