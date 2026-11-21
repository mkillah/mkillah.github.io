# Learning Curve 1: Your start

## In short

Two players both reach game 300. One shot up early and then levelled off. The other went nowhere for months and then climbed. **What kind of start did you have, and does it matter later?**

This is the first section of the [NeuralGambit Learning Curve tab](https://www.neuralgambit.com/stats/learning-curve). The code, tables and charts are in the [notebook](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-1-your-start.ipynb).

**The main findings:**

1. **Starts can be sorted into four useful types:** fast starter, late climber, holding steady and declining.
2. **The types are labels, not strict groups.** Players blend gradually from one type into the next.
3. **Your first 100 games give a fair early guess.** They point to the right type about 60% of the time.
4. **Your start doesn't decide your future.** From game 300 to 700, all four types gained about the same.
5. **A good start helps a little with reaching 2000.** Your starting rating and early progress matter far more than your type.

## How it works

1. **Collect games.** The first 300 rated blitz games of **581 new Lichess players** whose accounts were created in late 2020.
2. **Skip the first 30 games.** A new rating jumps around while the site is still finding your level.
3. **Draw a smooth curve.** The rating is averaged over every 10 games, from game 30 to game 300.
4. **Describe it with two numbers:** *how much* the player gained, and *when* (early or late).
5. **Group similar players.** A method called *k-means clustering* sorts players into four groups based on those two numbers.

![Rating change since the rating settled, for 60 random players](assets/img/lichess-plateaus/curves-overview.png)

*Grey lines are individual players. The blue line is the typical player, who gained about 40 points by game 300.*

## The four types

![Each player's gain and when it happened, and the average curve of each type](assets/img/lichess-plateaus/curves-types.png)

| Type | Share of players | Typical gain by game 300 | What it looks like |
|---|---|---|---|
| **Fast starter** | 18% | +158 | Big gains early, then levelling off |
| **Late climber** | 19% | +114 | A slow or dipping start, then a steady climb |
| **Holding steady** | 36% | +27 | The rating stays close to where it settled |
| **Declining** | 27% | −74 | The rating drifts down after settling |

Declining doesn't mean getting worse at chess. These players often started with a rating that was too high, and it corrected itself.

## Does your type predict what happens next?

Not really. From game 300 to game 700, every type kept improving by a similar amount:

| Type | Change from game 300 to 700 |
|---|---|
| Fast starter | +46 |
| Late climber | +46 |
| Holding steady | +61 |
| Declining | +51 |

![Rating change from game 300 to 700, by type](assets/img/lichess-plateaus/curves-q2-after.png)

So your type describes **how your start went**, not where you will end up.

## Can we guess your type early?

If you have fewer than 300 games, the page predicts your type from your first 100.

- It's right about **60%** of the time. Always guessing the most common type would be right 36% of the time.
- Almost all of the signal comes from two things: **your starting rating** and **your early trend**. Pace, openings and clock use added almost nothing.
- **Late climbers are the hardest to spot** (only 12% are recognized), because at game 100 their climb hasn't started yet.

![How often each type was predicted correctly](assets/img/lichess-plateaus/curves-q3-confusion.png)

## Does your type help you reach 2000?

A little. Among players with the same start and early progress, fast starters and late climbers had about **twice the odds** of reaching 2000 compared with players holding steady.

![Share who later reached 2000, by starting rating and curve type](assets/img/lichess-plateaus/curves-reach-types.png)

The starting rating matters much more:

| Rating after the first games | Reached and held 2000 |
|---|---|
| Below 1300 | 1.1% |
| 1300–1500 | 5.1% |
| 1500–1700 | 6.6% |
| 1700–1900 | 37.1% |

The full answer is in [Part 3: Reaching 2000](ml-project.html?id=learning-curve-3-reaching-2000).

## What to keep in mind

- **Only players who stayed.** The types are based on players who reached 300 games, so people who quit early aren't included.
- **One group of players.** New Lichess accounts from the late-2020 chess boom, blitz only.
- **Rating isn't the same as skill.** Part of an early curve is simply the rating system settling.
- **A fairly small group.** The types come from 581 players.

## Want the details?

- **Full analysis and code:** [learning-curve-1-your-start.ipynb](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-1-your-start.ipynb)
- **How the whole tab works:** [notebooks README](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/README.md)
- **Try it:** [NeuralGambit Learning Curve](https://www.neuralgambit.com/stats/learning-curve)
- **Next:** [Part 2a: Where you are now](ml-project.html?id=learning-curve-2a-where-you-are-now)
