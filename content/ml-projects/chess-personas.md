# Part 1: Chess personas

## Overview

### Question

A 2000-rated player didn't learn chess from 2000-rated games alone. They spent years playing and studying games at many levels, mostly weaker games early on and stronger games later. **If we want a model to play like a human of a given strength, what collection of games should it learn from?**

This first part of *Human vs. Machine · Round 2* builds those collections: **chess personas**. Each persona is a set of games whose size and rating mix match the experience a real player would have at that level.

### At a glance

- **Personas:** seven levels, from 1000 to 2800 Elo.
- **Size:** each persona's game count comes from an estimate of practice hours, from about 8,000 games (1000 Elo) to about 500,000 games (2800 Elo).
- **Mix:** each persona's games are spread across rating bands with a skewed distribution. Weak personas mostly see weak games, strong personas mostly see strong games.
- **Next:** the personas become training data for human-like chess models, in the spirit of [Maia](https://maiachess.com/) (Part 2).

## Assumptions

How much chess does it take to reach a given rating? The estimates start from the classic idea in expertise research that mastery takes about **10,000 hours over about 10 years** (Simon & Chase, 1973; Ericsson et al., 1993), and from the idea that experts store tens of thousands of familiar patterns, or **chunks**, in memory.

| Assumption | Value |
| --- | --- |
| Moves per game | ~40 (about 75% of positions unique within a game) |
| Study pace | 10 games, or 400 positions, per hour |
| Time per position | 10 seconds |
| Time to form one chunk | 8 seconds |
| Reference level | 2000 Elo = 10,000 hours over 10 years |
| Reference pace | 1,000 hours per year, 2.7 hours per day, 27 games per day |

### A reference point: Magnus Carlsen

At 36, Magnus Carlsen has been playing for about 28 years and has a classical rating around **2840**. His rating history shows the shape every persona tries to capture: a steep climb in the early years, then a long plateau where each extra point costs much more practice.

![Magnus Carlsen's FIDE rating history (classical, rapid, blitz), 2003 to 2026](assets/img/chess-personas/carlsen-rating-history.png)

*Magnus Carlsen's FIDE rating history, 2003 to 2026. Classical rating in blue, rapid in pink, blitz in orange.*

## From rating to experience

Each persona gets a **practice factor**, relative to the 2000 Elo reference. The factor sets the hours per year, and the number of years grows with the target rating. Together they give the total practice time and the number of games studied.

| Elo | Factor | Hours / day | Hours / year | Years | Total hours | Games studied | Positions processed | Unique positions | Chunks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1000 | 0.4 | 1.10 | 400 | 2 | 800 | ~8,000 | 766,389 | 710,904 | ~8,000 |
| 1400 | 0.6 | 1.64 | 600 | 4 | 2,400 | ~24,000 | ~2,299,000 | ~2,133,000 | ~24,000 |
| 1800 | 0.8 | 2.19 | 800 | 8 | 6,400 | ~64,800 | ~6,208,000 | ~5,758,000 | ~65,000 |
| 2000 | 1.0 | 2.74 | 1,000 | 10 | 10,000 | ~100,000 | ~9,580,000 | ~8,886,000 | ~100,000 |
| 2200 | 1.2 | 3.29 | 1,200 | 15 | 18,000 | ~180,000 | ~17,244,000 | ~15,995,000 | ~180,000 |
| 2500 | 1.4 | 3.84 | 1,400 | 22 | 30,800 | ~300,800 | ~28,816,000 | ~26,730,000 | ~300,000 |
| **2800** | 1.8 | 4.93 | 1,800 | 28 | 50,400 | ~500,400 | ~47,938,000 | ~44,467,000 | ~500,000 |

How the last three columns are filled in:

- **Positions processed:** the 1000 Elo persona is measured from the built dataset: about **95.8 positions per game**. The other rows apply the same rate to their game counts.
- **Unique positions:** in the 1000 Elo dataset, **92.8%** of positions are unique. The other rows use the same share. This is an upper bound: larger collections repeat more openings and common endgames, so their real share will be lower.
- **Chunks:** about **one new chunk per seriously studied game**. This matches estimates from expertise research: tens of thousands of chunks for a strong club player or master (Simon & Gilmartin, 1973) and around 300,000 for a grandmaster (Gobet & Simon, 2000).

## Which games each persona sees

A persona's games are not all at its own level. The mix shifts as the target rating rises:

- **Low Elo (1000):** most games sit at the bottom of the scale (600 to 800), with a long tail towards stronger games. This is a **positively skewed** distribution.
- **Middle Elo (1800):** the anchor point. Games follow a **normal distribution** (a bell curve) centred on 1800.
- **High Elo (2800):** most games sit at the top (2600 to 2800), with a long tail back towards weaker games. This is a **negatively skewed** distribution.

![Negatively skewed, symmetric, and positively skewed distributions](assets/img/chess-personas/skew-shapes.png)

Moving from the 1000 to the 2800 persona, the bulk of the games slides up the rating scale, much like a player's own games do over a career.

![Distribution of game volume across rating categories, one curve per persona](assets/img/chess-personas/persona-distributions.png)

### The persona matrix

Each column is one persona and adds up to its total game count. Each row is a rating band. The last two columns show how many games each band must supply (the largest need of any persona, since personas can share games) and how many games the actual dataset has.

| Game rating | 1000 (N=8k) | 1400 (N=24k) | 1800 (N=64.8k) | 2000 (N=100k) | 2200 (N=180k) | 2500 (N=300.8k) | 2800 (N=500.4k) | Games needed | Dataset |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 600 | 2,800 | 1,200 | 200 | 100 | 0 | 0 | 0 | 2,800 | 0 |
| 800 | 3,500 | 3,000 | 800 | 400 | 100 | 0 | 0 | 3,500 | 450 |
| 1000 | 1,200 | 5,500 | 2,500 | 1,500 | 400 | 200 | 100 | 5,500 | 5,500 |
| 1200 | 350 | 6,500 | 6,500 | 4,000 | 1,500 | 600 | 300 | 6,500 | 6,500 |
| 1400 | 100 | 4,500 | 10,000 | 8,000 | 5,000 | 2,000 | 1,000 | 10,000 | 10,000 |
| 1600 | 50 | 2,000 | 14,000 | 14,000 | 12,000 | 7,000 | 4,000 | 14,000 | 14,000 |
| 1800 | 0 | 800 | 16,800 | 20,000 | 25,000 | 20,000 | 15,000 | 25,000 | 25,000 |
| 2000 | 0 | 300 | 10,000 | 24,000 | 35,000 | 45,000 | 35,000 | 45,000 | 45,000 |
| 2200 | 0 | 200 | 3,000 | 18,000 | 45,000 | 65,000 | 65,000 | 65,000 | 65,000 |
| 2400 | 0 | 0 | 800 | 7,000 | 35,000 | 85,000 | 110,000 | 110,000 | 20,367 |
| 2600 | 0 | 0 | 200 | 2,500 | 16,000 | 55,000 | 125,000 | 125,000 | 1,333 |
| 2800 | 0 | 0 | 0 | 500 | 5,000 | 20,000 | 130,000 | 130,000 | 59 |
| 3000 | 0 | 0 | 0 | 0 | 0 | 1,000 | 15,000 | 15,000 | 0 |

> **Data note:** some rating bands did not have enough games. To reach the required count, the missing games were taken from the next rating band. This mostly affects the lowest band (600 to 800) and the elite bands (2400 and above), where very few games exist.

## Open questions

- **Should the curves follow a formula?** The persona sizes are set by hand. A logarithmic or power-law curve (practice time growing faster and faster as rating rises) may fit better, and would make the design easier to defend and extend.
- **How long do players stay in each rating band?** The average number of years a player spends at each level would let the persona mix be based on real career data instead of assumptions.
- **Elite data is scarce.** Only a few thousand games exist above 2400, far fewer than the 2500 and 2800 personas need.

## Next: Part 2

The personas are the training data for the next part of *Human vs. Machine · Round 2*: models that learn to play like humans of a given strength, building on **Maia**, a chess engine trained to predict human moves rather than the best ones.

## References

- Simon, H. A., & Chase, W. G. (1973). Skill in chess. *American Scientist, 61*(4), 394–403.
- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. *Psychological Review, 100*(3), 363–406.
- Simon, H. A., & Gilmartin, K. (1973). A simulation of memory for chess positions. *Cognitive Psychology, 5*(1), 29–46.
- Gobet, F., & Simon, H. A. (2000). Five seconds or sixty? Presentation time in expert memory. *Cognitive Science, 24*(4), 651–682.
- McIlroy-Young, R., Sen, S., Kleinberg, J., & Anderson, A. (2020). Aligning superhuman AI with human behavior: Chess as a model system. *KDD 2020*.
