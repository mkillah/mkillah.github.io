# Notebooks

- [Kettle Logic](kettle-logic.ipynb)
- [Lichess: the Learning Curve tab](#lichess-the-learning-curve-tab) (below)

# Lichess: the Learning Curve tab

How each part of the [NeuralGambit Learning Curve tab](https://www.neuralgambit.com/stats/learning-curve) works, and where to find the full analysis.

## Where each section is documented

| Section of the tab | Notebook | Report |
|---|---|---|
| **1. Your start** (curve type and chart) | [learning-curve-1-your-start](learning-curve-1-your-start.ipynb) | [Learning Curve 1: Your start](https://mkillah.github.io/ml-project.html?id=learning-curve-1-your-start) |
| **2a. Where you are now** (climbing, plateau or sliding) | [learning-curve-2a-where-you-are-now](learning-curve-2a-where-you-are-now.ipynb) | [Learning Curve 2a: Where you are now](https://mkillah.github.io/ml-project.html?id=learning-curve-2a-where-you-are-now) |
| **2b. What's next** (climb, hold or drop) | [learning-curve-2b-whats-next](learning-curve-2b-whats-next.ipynb) | [Learning Curve 2b: What's next](https://mkillah.github.io/ml-project.html?id=learning-curve-2b-whats-next) |
| **3. Reaching 2000** (chance, when, your path and theirs) | [learning-curve-3-reaching-2000](learning-curve-3-reaching-2000.ipynb) | [Learning Curve 3: Reaching 2000](https://mkillah.github.io/ml-project.html?id=learning-curve-3-reaching-2000) |

## Who sees what

| Player | Sees |
|---|---|
| Under 100 rated blitz games | A message saying when the page unlocks |
| 100+ games, below 2000 | All three sections |
| Rated 2000+ now, or already held 2000 for 30 days | Only "Where you are now and what's next" |

## Which data each section uses

| Section | Data |
|---|---|
| Your start | 581 players, games 30–300 |
| What's next | 3.4 million games from 1,554 players, cut into 123,662 overlapping stretches of 100 games (a new one every 25 games). Each stretch is one training example, not one game. |
| Reaching 2000 | 2.6 million games from 1,117 players, up to the point they held 2000 or their last downloaded game. Games after the hold can't help predict reaching it. |

All players have Lichess accounts created in late 2020, and all games are rated blitz.

## 1. Your start: how the curve type is worked out

**Which games count?** Only games **30 to 300**. The first 30 are skipped because a new rating jumps around while the site is still finding the player's level. Games after 300 don't change the type.

Players with fewer than 300 games don't have a settled type yet, so the page predicts it from their first 100 games.

**How the types were found:**

1. The rating is averaged over every 10 games, which gives a smooth curve.
2. The curve is reduced to two numbers: **how much** the player gained by game 300, and **when** (early or late).
3. A clustering method (k-means) sorts 581 new Lichess players into four groups: Fast starter, Late climber, Holding steady and Declining. A player gets the group they are closest to.

The types are useful labels, not strict categories: players blend from one type into the next.

## 2. Where you are now and what's next

**Climbing, plateau or sliding.** A straight line is drawn through the last 100 games. If it moves less than 30 points, the player is on a plateau. More than that is climbing or sliding.

**Change-point detection (the coloured parts of the chart).** This finds where the rating changed direction in the last 200 games:

1. Draw one straight line through all the games.
2. Try splitting the games in two at many points, with a separate line for each part.
3. Keep the best split only if two lines fit **much** better than one, so normal ups and downs don't count.
4. Repeat inside each part. Every part must have at least 50 games.

The status label reads the last 100 games, while a coloured part can be longer. If they disagree, the player may be at a turning point.

**The next 100 games.** A gradient boosting model looks at 17 measurements of the last 100 games, such as rating, trend, pace, breaks and distance from the player's best rating. **Climb** means +75 or more, **drop** means −75 or more, and **hold** is anything between.

It was tested on players it had never seen: AUC 0.69 for climbs and 0.65 for drops (0.5 is a coin flip, 1 is perfect). When it said 20%, about 20 in 100 did it. It improves the odds, but it can't say what will happen.

## 3. Reaching 2000

**"Reached" means** a blitz rating of 2000+ held for 30 days in a row. Days without games count.

**Why five separate models for the chance?** There is one logistic regression for each checkpoint: game **100, 200, 300, 500 and 1,000**. A player gets the last checkpoint they have passed.

- **A fair comparison.** A player at game 500 is compared only with players who were also at game 500, still playing and not yet at 2000. Players who had already quit or succeeded are left out.
- **What matters changes.** Early on, the starting rating says a lot. Later, the current rating says more. Each model sets its own balance.
- **It gets sharper.** AUC rises from 0.87 at game 100 to 0.92 at game 1,000.

**"When": the Weibull model.** This is a waiting-time model, used for questions like "how long until this happens?". It learned from the players who did hold 2000 how many more games they needed, based on three things: **distance from 2000**, **recent trend** and **early trend**.

It gives a range: half of similar players needed between the two numbers shown. It only answers "*if* you get there, how long?", so it should be read together with the chance. Time in months is the number of games divided by the player's recent pace.

**Your path and theirs.** These are the study players closest to the user at the same checkpoint, on starting rating, early trend, current rating and recent trend.

## Behind the scenes: has this player already held 2000?

This check decides who gets the 2000+ view:

1. Find the player's best rating. If it is below 2000, they haven't held it.
2. Read backwards from that game to where the run at 2000+ began.
3. Read forwards. If no game ended below 2000 for 30 days, they held it.

**Known limit:** it only checks the run around the best rating, so it can miss a 30-day hold from a different period.
