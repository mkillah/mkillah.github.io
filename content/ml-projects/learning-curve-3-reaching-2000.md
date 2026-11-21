# Learning Curve 3: Reaching 2000

## In short

If you're below 2000, you probably wonder: **Will I get there? When? And what helps?** This part follows real players game by game, for up to six years, to answer all three.

It powers the last section of the [NeuralGambit Learning Curve tab](https://www.neuralgambit.com/stats/learning-curve). The code, tables and charts are in the [notebook](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-3-reaching-2000.ipynb).

**The main findings:**

1. **Few players get there.** About **6.5%** of players in the study reached and held 2000.
2. **Your current rating is the best clue.** Together with where you started, it predicts reaching 2000 well.
3. **It takes a long time.** Players who made it typically needed about **2,200 games**.
4. **Playing a lot is a sign, not a method.** Players who reach 2000 play a lot, but cramming in more games than usual was followed by slightly worse results.
5. **Puzzles and studies go with success,** but this data can't prove that they cause it.

## What counts as "reaching 2000"?

A blitz rating of **2000 or more, held for 30 days in a row**. Days without games count, because your rating doesn't change between games. Touching 2000 for one evening doesn't count.

## The data

**2.6 million rated blitz games** from **1,117 Lichess players** whose accounts were created in late 2020. They all started below 1900.

The study includes all 338 players who reached 2000, plus a random sample of the others. Since only about 1 in 9 of the others were sampled, each of them counts about 8.7 times in the percentages, so the results reflect all players.

## Will I reach 2000?

Your chances look different at game 100 than at game 1,000, so there is **one simple model for each checkpoint**: game 100, 200, 300, 500 and 1,000. The page uses the last checkpoint you have passed.

**Why separate models?**

- **A fair comparison.** A player at game 500 is compared only with players who were also at game 500, still playing and not yet at 2000.
- **What matters changes.** Early on, your starting rating says a lot. Later, your current rating says more.

Each model uses four things: your **starting rating**, your **early trend**, your **current rating** and your **recent trend**.

| Checkpoint | Players | Accuracy score (AUC) |
|---|---|---|
| Game 100 | 1,115 | 0.87 |
| Game 200 | 1,039 | 0.89 |
| Game 300 | 984 | 0.90 |
| Game 500 | 896 | 0.92 |
| Game 1,000 | 737 | 0.92 |

*AUC is 0.5 for a coin flip and 1.0 for a perfect forecast. All scores are on players the model hadn't seen.*

The percentages are mostly reliable. Players given a 25–50% chance reached 2000 about as often as predicted. Above 50% the model is a little too careful: when it said 61%, 70% got there.

![Predicted chances compared with what really happened, at each checkpoint](assets/img/lichess-plateaus/reach-calibration-landmarks.png)

## When will I get there?

Half of the players who made it held 2000 from somewhere between game **980** and game **4,220**. They first touched 2000 at about game 1,010, so it often took around a thousand more games to stay there.

Where you start makes a big difference:

![Share of players who reached 2000 by each game, by starting rating](assets/img/lichess-plateaus/reach-when-incidence.png)

| Starting rating | By game 1,000 | By game 2,000 | By game 5,000 | By game 10,000 |
|---|---|---|---|---|
| Below 1300 | 0.1% | 0.4% | 1.0% | 1.0% |
| 1300–1500 | 1.2% | 2.1% | 2.7% | 4.7% |
| 1500–1700 | 1.2% | 2.7% | 5.1% | 6.1% |
| 1700–1900 | 10.7% | 19.1% | 29.4% | 35.1% |

**How the page estimates "when".** It uses a *Weibull model*, a type of waiting-time model. It learned how many more games successful players needed, based on how far they were from 2000 and on their recent and early trends.

The result is a range, because a typical estimate can be off by about a factor of two. It also only answers "*if* you get there, how long?", so read it together with your chance.

## What helps?

We looked at two different questions.

**What do players who reach 2000 do differently?**

- They **play more**, often in **long sessions**. At game 1,000 they played about 120 games a week, compared with 59 for the others.
- They do **more puzzles and studies**, and play more bullet, rapid and classical.
- How they scored after a loss, their openings, their clock use and their endgames showed no difference.

**When a player changes their habits, what happens next?**

- Playing **more than your own usual** was followed by slightly **worse** results.
- **Longer games** were followed by slightly better ones.
- All these effects were small: a few rating points per 100 games.

![When a player changes a habit, how the next 100 games go](assets/img/lichess-plateaus/reach-how-within.png)

So playing a lot marks the players who get there, but cramming in extra games doesn't seem to be what moves the rating.

## Your path and theirs

The tab shows the study players most similar to you at your checkpoint: three who reached 2000 and three who didn't. They are matched on starting rating, early trend, current rating and recent trend. There are two lists because the study has every player who reached 2000 but only a sample of the others.

## If you already got there

If you're rated 2000+ or already held 2000 for 30 days, this section is hidden and you see only [Where you are now and what's next](ml-project.html?id=learning-curve-2b-whats-next). To check, the page finds your best rating, reads back to where that run began, and reads forward to see if it lasted 30 days. It can miss a 30-day hold from a different period than your peak.

## What to keep in mind

- **It's a chance, not a verdict.** Plenty of players beat their odds, and plenty miss them.
- **One group of players.** Lichess accounts from the late-2020 chess boom, blitz only.
- **Very long careers.** The last checkpoint is game 1,000, so for players with many more games the chance may be too optimistic.
- **Patterns, not causes.** The puzzle and study numbers were collected years later, after players had already reached 2000 or not.

## Want the details?

- **Full analysis and code:** [learning-curve-3-reaching-2000.ipynb](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-3-reaching-2000.ipynb)
- **How the whole tab works:** [notebooks README](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/README.md)
- **Try it:** [NeuralGambit Learning Curve](https://www.neuralgambit.com/stats/learning-curve)
- **Previous:** [Part 2b: What's next](ml-project.html?id=learning-curve-2b-whats-next)
