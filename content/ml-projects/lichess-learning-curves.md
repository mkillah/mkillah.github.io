# Learning curves on Lichess

## Overview

### Question

Two new players both reach game 300. One shot up early and then levelled off; the other spent months going nowhere and then climbed. **Are there distinct types of learning curve, and can a player's first 100 games tell which one they are on?**

This is the companion to [Rating plateaus on Lichess](ml-project.html?id=lichess-plateaus). That study looked at 100-game windows; this one looks at the whole start of a career. It runs in the [NeuralGambit Learning Curve](https://www.neuralgambit.com/stats/learning-curve) tab, next to the Plateau Detector.

### At a glance

- **Data:** the first 300 rated blitz games of **581 new Lichess players** (accounts created in late 2020). That's the same cohort as the plateau study.
- **One continuum, not separate types:** 89% of the variation between curves is *how much* the rating moved; a further 5% is *when*. Four types (fast starter, late climber, holding steady, declining) are useful labels for regions of that continuum, with moderate stability.
- **The first 100 games predict the type 60% of the time**, against 36% for always guessing the most common type. Almost all of that comes from the early trend and the starting rating.
- **The type doesn't predict the future:** from game 300 to game 700, all four types gained about the same (+46 to +61).

## The data and the curves

The players, games and sampling are described in the [plateau study](ml-project.html?id=lichess-plateaus). Every player has at least 300 rated blitz games, so the curve covers **games 30 to 300**. The first 30 games are skipped: a new rating jumps by 100 or more points per game while it is provisional.

Each curve is the average rating in blocks of 10 games (27 points), **relative to the first block**. Every curve starts at 0, and its end is the gain since the rating settled.

![Rating change since the rating settled, for 60 random players](assets/img/lichess-plateaus/curves-overview.png)

*Grey lines are individual players; the blue line is the median and the band the middle 50%. The median player gained about 40 points by game 300.*

## Q1. Are there distinct types of learning curve?

Three checks:

- **Principal components** of the curves. The first component, an overall rise or fall that is steepest early (a classic learning curve), explains **89%** of the variation. The second, **5%**, is timing: early rise versus late rise.
- **Gaussian mixtures** on the first three components. The fit (BIC) improves only slightly with more groups.
- **k-means** on two numbers per curve: **gain** (change by game 300) and **bend** (whether the middle of the curve sits above a straight line, an early rise, or below it, a late rise). A **bootstrap** refit the clustering on resampled players 50 times and measured how often players landed in the same group (adjusted Rand index, 1 = identical).

![Main curve shapes, and stability of k groups](assets/img/lichess-plateaus/curves-q1-structure.png)

The answer is **mostly one continuum**. Two groups are the most stable (ARI 0.90), but only split "went up" from "didn't". **Four groups** are the most informative choice that stays reasonably stable (ARI 0.71): they separate timing as well as size.

![Each player's gain and bend, and the average curve of each type](assets/img/lichess-plateaus/curves-types.png)

| Type | Players | Gain by game 300 | What it looks like |
|---|---|---|---|
| Fast starter | 18% | +158 | Big gains soon after the rating settles, then levelling off |
| Late climber | 19% | +114 | A slow or dipping start, then a steady climb |
| Holding steady | 36% | +27 | Little net change |
| Declining | 27% | −74 | The rating drifts down after settling |

*Gains are medians.*

## Q2. How do the types differ?

| Type | Starting rating | Games per week (first 100) | Time on a plateau (games 130–300) | Change from game 300 to 700 |
|---|---|---|---|---|
| Fast starter | 1353 | 50 | 24% | +46 |
| Late climber | 1149 | 45 | 26% | +46 |
| Holding steady | 1431 | 50 | 42% | +61 |
| Declining | 1415 | 53 | 32% | +51 |

- **Late climbers start lowest.** Part of their slow start is the rating still finding its level.
- **Decliners start high.** Their provisional rating overshot and then corrected.
- **Players holding steady spend the most time on plateaus** (42% of 100-game windows), as expected.
- **What happens next doesn't depend on the type.** From game 300 to 700, all four gained a similar median amount (Kruskal–Wallis p = 0.55). The early curve describes how a career started, not a lasting trait.

![Rating change from game 300 to 700, by type](assets/img/lichess-plateaus/curves-q2-after.png)

## Q3. Can the first 100 games predict the type?

Thirteen features from each player's first 100 games: settled starting rating, how far the provisional games moved the rating, trend and streakiness over games 30–100, results, opponent strength, pace, breaks, opening variety, game length, losses on time and clock use. Models were tested with **5-fold cross-validation, repeated 5 times**.

| Model | Accuracy | Macro-F1 | Log loss |
|---|---|---|---|
| Always the most common type | 0.36 | 0.13 | 1.35 |
| Starting rating + early trend (logistic) | **0.60** | **0.55** | **0.92** |
| All 13 features (logistic) | 0.60 | 0.56 | 0.93 |
| All 13 features (gradient boosting) | 0.58 | 0.55 | 1.01 |

The two-feature model is as good as the full ones, so it is the one the dashboard uses. Its probabilities are well calibrated: it is 60% confident on average and right 61% of the time.

A caveat: the type depends on the curve up to game 300, and games 30–100 are its first quarter. So part of the early trend's power is mechanical. That's also why the other eleven features add so little.

![Held-out predictions by actual type](assets/img/lichess-plateaus/curves-q3-confusion.png)

Decliners (78%) and fast starters (67%) are recognised well. **Late climbers are the hard case** (12%): at game 100 they look like players holding steady or declining, and nothing in the first 100 games reveals the climb to come.

## Q4. Which early signals matter?

![Logistic coefficients for each type](assets/img/lichess-plateaus/curves-q4-coefficients.png)

Beyond the trend, a higher **win rate** and **stronger opponents** point to a fast start, and using more of the clock points away from decline. These effects are small next to the trend itself.

## Q5. Does early engine accuracy add anything?

Stockfish analysed every 4th game of 250 players (see the plateau study). Fast starters played more accurately from the start: 86.8% over their first 100 games, against 84.7% for late climbers (p < 0.001). But adding accuracy to the model doesn't improve it (macro-F1 0.54 with and without). A player who plays accurately is already gaining rating, so the early trend already contains that signal.

## Robustness: a longer horizon

The same method on games 30–700, for the 478 players who reached 700 games, only partly agrees with the 300-game types (adjusted Rand index 0.26). Decliners and fast starters mostly keep their label. Many late climbers become fast starters over the longer view, and many players holding steady become late climbers. That fits the continuum picture: a type describes a stretch of games, not a fixed category.

## In the dashboard

The [Learning Curve](https://www.neuralgambit.com/stats/learning-curve) tab downloads the player's first 300 blitz games, about 40 seconds on Lichess and a few seconds on chess.com. The Plateau Detector links to it with the same player filled in. What it shows depends on how many games the player has:

- **300 games or more:** the player's actual curve type (nearest of the four type centres) and their curve against the four average curves. It also shows what the model would have predicted from their first 100 games.
- **100 to 299 games:** the predicted type with probabilities, and the curve so far.
- **Under 100 games:** how many games until it unlocks.

The browser reproduces the Python curve, type and probabilities exactly; this was checked on a player from the cohort. For chess.com players, ratings are first converted to the Lichess scale, as in the plateau section.

## Limitations

- **Survivorship.** Only players who reached 300 blitz games are included. Players who quit early, perhaps because they weren't improving, are missing.
- **One cohort.** New accounts from the late-2020 chess boom.
- **Rating, not skill.** The curve partly reflects how Glicko-2 settles a new rating. Decliners in particular are often players whose provisional rating started too high.
- **Small sample for clustering.** 581 players. The rating-history API could add thousands more cheaply, which would make the types (and their instability) clearer.

## Next steps

- **Scale up** to several thousand players using the Lichess rating-history endpoint.
- **Time instead of games:** compare curves by calendar time, which mixes in how often people play.
- **Link the two studies:** test whether a player's curve type improves the plateau model's predictions.
