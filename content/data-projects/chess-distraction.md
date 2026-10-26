# Background distraction in chess problem-solving

*Academic · Cognitive psychology · Python and statsmodels*

## Overview

### Question

Do irrelevant pieces in the background of a chess position make tactical problems harder to solve, and are stronger players less affected than weaker ones?

### At a glance

- **Based on:** my master's thesis, [*The influence of perceptual and functional background distraction on solving tactical chess problems*](https://urn.nsk.hr/urn:nbn:hr:162:140286) (University of Zagreb, 2021).
- **Design:** 48 rated players in two groups (weaker vs stronger), each solving "mate in two" problems in four versions.
- **Main finding:** stronger players were more accurate and faster. A random background slowed everyone down, and an extra tempting move led to more mistakes.
- **Showcase:** a notebook that rebuilds the study from its published results, and analyses it with ANOVA and linear regression.

> The original data is not public. The notebook **simulates** a dataset from the means and standard deviations published in the thesis, so the numbers below are close to, but not the same as, the original results.

## Data

| | Weaker players | Stronger players |
| --- | --- | --- |
| Players | 24 | 24 |
| Rating (mean) | 1756 (below 1900) | 2046 (1900 and above) |

Every player solved each problem in one of four versions, made by crossing two kinds of distraction:

- **Perceptual distraction:** the background pieces are arranged randomly (present) or as in a typical game (absent). The pieces needed for the mate never change.
- **Functional distraction:** an extra piece near the opponent's king adds a tempting but wrong candidate move (present) or not (absent).

**Measures:** accuracy (proportion of problems solved) and solving time in seconds. That gives 192 rows: 48 players × 4 conditions.

## Methods

#### Simulation

Each player gets a rating drawn from their group's published mean and SD. Their accuracy and time in each condition are drawn from the thesis's Table 1. Players with higher ratings within their group are slightly better, which links rating to performance.

#### Descriptive statistics and visualisation

Means and SDs per group and condition, and plots of how each distraction changes accuracy and time in both groups.

#### Three-way ANOVA

Group × perceptual distraction × functional distraction, run separately for accuracy and for solving time, with partial eta squared (ηp²) as the effect size.

#### Linear regression

Rating as a continuous predictor of each player's average accuracy and time. A second model adds both distractions to estimate their cost while holding rating constant.

## Results

### Accuracy

<figure>
  <img src="assets/img/chess-distraction/accuracy-by-distraction.png" alt="Accuracy for stronger and weaker players with and without perceptual and functional distraction">
  <figcaption>Accuracy by group and distraction (mean ± SE).</figcaption>
</figure>

| Effect | F(1, 184) | *p* | ηp² |
| --- | --- | --- | --- |
| **Group** | **61.49** | **< .001** | **.25** |
| **Perceptual distraction** | **6.66** | **.011** | **.04** |
| **Functional distraction** | **12.22** | **.001** | **.06** |
| Interactions | all < 3.1 | all > .08 | ≤ .02 |

Stronger players solved more problems in every condition. Both distractions lowered accuracy, and functional distraction had about twice the effect of perceptual distraction. Neither interacted with group, so both groups lost accuracy at a similar rate.

### Solving time

<figure>
  <img src="assets/img/chess-distraction/time-by-distraction.png" alt="Solving time for stronger and weaker players with and without perceptual and functional distraction">
  <figcaption>Solving time by group and distraction (mean ± SE).</figcaption>
</figure>

| Effect | F(1, 184) | *p* | ηp² |
| --- | --- | --- | --- |
| **Group** | **42.46** | **< .001** | **.19** |
| **Perceptual distraction** | **7.39** | **.007** | **.04** |
| Functional distraction | 1.12 | .29 | .01 |
| Interactions | all < 1.3 | all > .25 | ≤ .01 |

Stronger players were about 20 seconds faster. A random background slowed players down, but the extra candidate move did not.

### Does rating predict performance?

<figure>
  <img src="assets/img/chess-distraction/rating-regression.png" alt="Scatter plots of rating against average accuracy and solving time, with regression lines">
  <figcaption>Each player's rating against their average accuracy and solving time. The dashed line marks the 1900 group cut-off.</figcaption>
</figure>

| Outcome | Change per 100 rating points | *p* | R² |
| --- | --- | --- | --- |
| Accuracy | +8 percentage points | < .001 | .47 |
| Solving time | −7.2 seconds | < .001 | .42 |

Rating alone explains almost half of the differences between players. Holding rating constant, perceptual distraction lowered accuracy by about 8 percentage points (*p* = .007) and functional distraction by about 11 (*p* < .001).

## Conclusions

- **Expertise matters most:** stronger players were more accurate and faster in every condition.
- **The two distractions work differently:** a random background mainly *slows players down*, while an extra tempting move mainly causes *mistakes*.
- **No interactions:** distraction affected stronger and weaker players to a similar degree.
- These match the main conclusions of the thesis.
