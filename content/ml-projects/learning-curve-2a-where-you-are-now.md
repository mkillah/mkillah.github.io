# Learning Curve 2a: Where you are now

## In short

Your rating has been around 1600 for three months. **Are you stuck, or about to break through?** This part works out whether a player is climbing, on a plateau or sliding, and looks at what tends to end a plateau.

It powers the "Right now" part of the [NeuralGambit Learning Curve tab](https://www.neuralgambit.com/stats/learning-curve). The code, tables and charts are in the [notebook](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-2a-where-you-are-now.ipynb).

**The main findings:**

1. **Plateaus are normal.** About 36% of all 100-game stretches are flat, and a typical plateau lasts about **185 games**.
2. **They last about as long at every level.** What changes is what comes after: big gains after a plateau get rarer as your rating rises.
3. **Breaks of a few days to a month went with better results.** Longer breaks mostly made big drops more likely.
4. **More games isn't simply better.** Players did best at about **35 games a week**, or five a day.
5. **Hidden improvement is rare.** During most plateaus, the quality of play measured by a chess engine didn't rise either.

## How we decide where you are

A blitz rating moves about 6 points per game even when your strength stays the same, so we need a rule that ignores normal ups and downs.

**Climbing, plateau or sliding.** Draw a straight line through your last 100 games. If it moves less than 30 points, you're on a **plateau**. Otherwise you're **climbing** or **sliding**.

**The coloured parts of the chart.** A method called *change-point detection* finds where your rating changed direction:

1. Draw one straight line through the games.
2. Try splitting them in two at many points, with a separate line for each part.
3. Keep the best split only if two lines fit **much** better than one.
4. Repeat inside each part. Every part must have at least 50 games.

![Rating histories of four players, split into climbs, plateaus and falls](assets/img/lichess-plateaus/segment-examples.png)

*Each line is one phase. Ratings usually alternate between climbs, plateaus and falls instead of rising smoothly.*

Across all players, about 38% of phases were climbs, 37% plateaus and 25% falls.

## The data

The first 700 rated blitz games of **581 Lichess players** whose accounts were created in late 2020: **385,840 games** in total. A chess engine (Stockfish) also analysed every 4th game for 250 of these players.

## Does your level matter?

Plateaus are only slightly more common above 1800 (about 40% of stretches, compared with 36% below). What changes more is the way out: **below 1200, 16%** of plateaus were followed by a gain of 75 points. **Above 2000, only 4%** were.

![Share of flat stretches and average rating change, by rating](assets/img/lichess-plateaus/q1-plateau-by-band.png)

## Do breaks help?

After a break, the rating system is less sure about you, so each game moves your rating more, in both directions.

| Longest break in the last 100 games | Gained 75+ | Lost 75+ | Average change |
|---|---|---|---|
| Under 1 day | 9% | 4% | +10 |
| 1–3 days | 13% | 4% | +17 |
| 3–7 days | 16% | 5% | +21 |
| 1–4 weeks | 20% | 6% | +25 |
| Over 4 weeks | 18% | 11% | +14 |

Breaks of up to a month went with bigger gains. Beyond a month, the chance of a big drop roughly doubled.

## Does playing more help?

Not in a simple way. When each player was compared with themselves, the average gain was highest at about **35 games a week**. Playing much less or much more did worse.

![Plateaus followed by a gain of 75, by games per week](assets/img/lichess-plateaus/q3-frequency.png)

## Can you improve while your rating stays flat?

Sometimes, but it's uncommon. The engine scored how accurately players moved:

- **During plateaus, accuracy usually stayed flat.** It rose in half of them and fell in the other half.
- **Better accuracy does come slightly before a better rating,** but the effect is tiny: about +2.5 rating points over the next 50 games.

![Stockfish accuracy by rating](assets/img/lichess-plateaus/accuracy-by-band.png)

## What came before a plateau?

We compared climbs that turned into plateaus with climbs that kept going. Openings, game length, clock use and losses on time changed the same way in both. So nothing in these game records warned that a plateau was coming. What players studied away from the board isn't visible in this data.

## What to keep in mind

- **These are patterns, not causes.** Taking a week off won't guarantee a rating gain.
- **Part of a "breakthrough" is the rating system.** Ratings move more after a break, which can look like progress.
- **One group of players.** Lichess accounts from late 2020, their first 700 blitz games.
- **The forecast has moved.** The first model here only predicted a gain of 75 and was only a little better than using the rating alone. The tab now uses the newer model in [Part 2b: What's next](ml-project.html?id=learning-curve-2b-whats-next).

## Want the details?

- **Full analysis and code:** [learning-curve-2a-where-you-are-now.ipynb](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-2a-where-you-are-now.ipynb)
- **How the whole tab works:** [notebooks README](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/README.md)
- **Try it:** [NeuralGambit Learning Curve](https://www.neuralgambit.com/stats/learning-curve)
- **Previous:** [Part 1: Your start](ml-project.html?id=learning-curve-1-your-start)
- **Next:** [Part 2b: What's next](ml-project.html?id=learning-curve-2b-whats-next)
