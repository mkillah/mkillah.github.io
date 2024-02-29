---
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"

layout: collection
title: "Capacity of a expert's chess memory"
excerpt: "Foo Bar design system including logo mark, website design, and branding applications."
header:
  image: /assets/images/foo-bar-identity.jpg
  teaser: /assets/images/foo-bar-identity-th.jpg
sidebar:
  - title: "Role"
    image: http://placehold.it/350x250
    image_alt: "logo"
    text: "Designer, Front-End Developer"
  - title: "Responsibilities"
    text: "Reuters try PR stupid commenters should isn't a business model"
gallery:
  - url: /assets/images/unsplash-gallery-image-1.jpg
    image_path: assets/images/unsplash-gallery-image-1-th.jpg
    alt: "placeholder image 1"
  - url: /assets/images/unsplash-gallery-image-2.jpg
    image_path: assets/images/unsplash-gallery-image-2-th.jpg
    alt: "placeholder image 2"
  - url: /assets/images/unsplash-gallery-image-3.jpg
    image_path: assets/images/unsplash-gallery-image-3-th.jpg
    alt: "placeholder image 3"
---

# Iconic memory

Iconic memory denotes the transitory repository of visual sensory information. 
Positioned as a swiftly dissipating reservoir, it constitutes a facet of the comprehensive visual memory system, 
coalescing with visual short-term memory (VSTM) and long-term memory (LTM). Iconic memory is delineated by its fleeting 
nature, typically lasting less than a second, its pre-categorical character, and its capacity to accommodate a vast
amount of visual data. Functionally, it contributes to VSTM by furnishing a coherent representation of the entirety 
of visual perception for an ephemeral temporal span. Iconic memory comprises two primary constituents: visible persistence and informational persistence. 


## Visible persistence

Visible persistence encapsulates a relatively brief (approximately 150 milliseconds) pre-categorical 
visual portrayal of the physical image engendered by the sensory apparatus. Essentially, it corresponds 
to the instantaneous snapshot of the visual stimulus being observed and apprehended by the individual. 

In vision, iconic memory maintains a detailed visual representation for up to about 300 ms,
but it is eliminated by new visual stimulation. Meaning plays little or no role (Potter, 2012). 

## Informational persistence


Informational persistence, constituting a longer-lasting memory store, encodes visual images into post-categorical 
information, representing the "raw data" processed by the brain beyond initial sensory input. 
Memory system named conceptual short-term memory (CSTM) operates with rapid categorization 
of new stimuli at a meaningful level, swift activation of associated material in long-term memory (LTM), 
rapid structuring of information, and prompt forgetting or lack of awareness of unstructured or 
unconsolidated data (Potter, 2012).

Accessing conceptual (semantic) information regarding a stimulus and its associations occurs rapidly. 
Experimental evidence, including semantic priming studies such as masked priming and fast priming, eye tracking 
investigations during reading or picture viewing, event-related potentials analysis during reading, and target 
detection experiments utilizing rapid serial visual presentation (RSVP) with letters, digits, pictures, or words, 
demonstrates that conceptual information about a word or picture becomes available within 
a timeframe of 100–300 milliseconds (Potter, 2012).


# Visual short-term memory

 Given that recognizing a complex pattern demands at least 0.5 seconds or more 
(Woodworth & Schlossberg, 1961, pp. 32–35), it's probable that individuals, subsequent to initially recognizing
a pattern, allocate time to scanning the board in search of additional familiar patterns. Less experienced
participants likely require more time to discern patterns compared to seasoned experts.

## Acquiring chunks

It's crucial to examine whether EPAM's learning assumptions, notably the notion that 8 seconds are necessary to acquire
a new chunk, yield accurate predictions concerning the memory capabilities of chess experts (Gobet and Simon, 2000). 
Contemporary evidence suggests that short-term memory (STM) visual capacity typically ranges from 3 to 4 chunks 
(Zhang & Simon, 1985).

Masters’ numbers of chunks increase from 2.9, at 1 s, to 4.2 at 4 s, and then decrease to
3.3 at 10 s. Experts start with 2.2 chunks at a presentation time of 1 s, show a maximum
with 4.5 chunks at 10 s, and then decrease to 2.9 at 60 s. Class A players increase the
number of chunks from 2.2 at 1 s to 5.4 at 60 s. N


chrest
During the presentation of a position to be recalled, the program fixates squares
following the saccades specified by the eye movement module. Each fixation delineates a
visual field (all squares within 1/- two squares from the square fixated), and the pieces
belonging to this visual field are sorted through the discrimination net. If a chunk (a
pattern already familiar to the discrimination net) is found, a pointer to it is placed in STM,
or, when possible, the chunk is used to fill one slot of a template. Given enough time, the
program learns in three different ways. First, it can either add a new branch to access a
node by a novel path or create a new node (and a branch leading to it) in the discrimination
net; this discrimination process takes 8 s. Second, it can add information to an already
existing chunk; this familiarization process takes 2 s. Third, it can fill in a template slot;
this process takes 250 ms.

# Analysis

**Elo rating change** over 10 years:

elo = [1600, 1626, 2106, 2223, 2299, 2424, 2449, 2521, 2586, 2600]

Estimation for **seconds spent on a position** (correcpond in change every one year):

sec_pos = [27.15, 24.15, 21.15, 18.15, 15.15, 12.15, 9.15, 6.15, 3.15, 0.15] 

**Average number of hours spend** over 10 years:

h = [1460, 1460, 1460, 1460, 1460, 1460, 1460, 1460, 1460, 1460]

| secondsPerPosition | engagingHours | elo  |
|--------------------|---------------|------|
| 27.15                  |   1460       | 1600|
| 24.15                  |   1460       | 1626|
| 21.15                  |   1460       | 2106|
| 18.15                  |   1460       | 2223|
| 15.15                  |   1460       | 2299|
| 12.15                  |   1460       | 2424|
| 9.15                   |   1460       | 2449|
| 6.15                   |   1460       | 2521|
| 3.15                   |   1460       | 2586|
| 0.15                   |   1460       | 2600|


totalExHours = 4*365*10 # 4 hours in 10 years

Experts spend 14600 hours in total, in 10 years for 39866483.41701415 positions, i.e. 463563.7606629553 games

![png](/assets/images/eloprocessedpositions.png)


# References

Gobet, F. i Simon, H. A. (2000). Five seconds or sixty? Presentation time in expert memory. Cognitive Science, 24, 651-682. Doi: 10.1016/S0364-0213(00)00031-8

Potter, M. (2012). Conceptual Short Term Memory in Perception and Thought. Frontiers In Psychology, 3. doi: 10.3389/fpsyg.2012.00113


