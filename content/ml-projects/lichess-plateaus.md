# Rating plateaus on Lichess

## Overview

### Question

A player rated 1600 for three months asks: *am I stuck, or about to break through?* A flat rating can mean a real ceiling, ordinary noise, or improvement that the rating hasn't caught up with yet. **Can machine learning tell these apart, and predict who escapes a plateau?**

This project separates two problems:

- **Detection.** Is the rating flat right now? This is a *change-point* problem.
- **Prediction.** Will the player gain at least **+75 rating points in the next 100 games**? This is a *supervised learning* problem.

The trained model powers the [NeuralGambit Plateau Detector](https://www.neuralgambit.com/stats/plateau). Enter a Lichess username: it downloads your last 200 blitz games, and the model reads the most recent 100.

### At a glance

- **Data:** the first 700 rated blitz games of **581 Lichess players** whose accounts were created in late 2020. That's **385,840 games**, cut into **10,242** windows of 100 games.
- **Plateaus are common:** 36% of all 100-game stretches are flat. A typical plateau lasts about **185 games**, at every rating level.
- **Prediction is hard:** the best model reaches an **AUC of 0.63** on players it never saw, only a little better than knowing the player's rating (0.60). Over the next 100 games, rating mostly moves at random.
- **Pace matters, but not linearly:** within the same player, plateaus are escaped best at about **35 games per week**. Playing much less or much more both do worse.
- **Breaks help, up to a point:** a break of 3 to 30 days comes before bigger *net* gains. Breaks over a month mostly raise the chance of a drop.
- **No hidden improvement:** Stockfish accuracy stays flat during plateaus. An accuracy gain does come slightly before a rating gain, but the effect is small.

## The data

Players were sampled from the [Lichess open database](https://database.lichess.org) dump of January 2021. I kept accounts created between July 2020 and January 2021 that went on to play at least 300 rated blitz games, and removed closed accounts and accounts flagged for cheating. Sampling from a 2021 dump, not a current one, keeps players who later quit. Each player's first 700 rated blitz games came from the Lichess API, with ratings, opponents, results, openings, moves and clock times.

| Step | Script | Output |
|---|---|---|
| Sample players | `s01_sample_players.py` | 800 players from 6,238 eligible |
| Download games | `s02_fetch_games.py` | 581 players, 385,840 games |
| Build windows | `s03_build_dataset.py` | 10,242 windows with 17 features and the outcome |
| Engine analysis | `s04_stockfish.py` | Accuracy, mistakes and blunders for every 4th game of 250 players |

Lichess uses Glicko-2, not Elo, so "rating" means the Lichess blitz rating.

![Final ratings in the sample, and the rating change over the next 100 games](assets/img/lichess-plateaus/cohort.png)

## Problem 1: detecting a plateau

A blitz rating moves about 6 points per game even when the player's strength isn't changing, so "flat" needs a definition that ignores noise. I compared two detectors:

- **Window rule.** Fit a straight line through the last 100 ratings. The window is a plateau if the line moves less than ±30 points. This works live, so the dashboard uses it.
- **Change-point segmentation.** Binary segmentation splits a player's whole history wherever two straight lines fit much better than one (at least 50 games per segment). Each segment is then labelled climbing, plateau or falling with the same ±30 rule.

![Change-point segmentation of four players' rating histories](assets/img/lichess-plateaus/segment-examples.png)

*Each line is one segment. A history usually alternates between climbs, plateaus and falls, rather than rising smoothly.*

The two detectors agree most of the time. 69% of windows the window rule calls flat fall inside a flat segment. The window rule reacts faster, so it also flags the flat tops of short climbs. Across all players the segmentation found **2,312 segments**: 38% climbing, 37% plateaus and 25% falling.

## Q1. Are plateaus more common at certain rating levels?

Somewhat. The share of flat 100-game stretches is 35 to 37% below 1800 and 39 to 41% above it (likelihood-ratio test, p = 0.006, with standard errors clustered by player). How long a plateau lasts barely changes: about **185 games** at every level.

What changes much more is what comes *after* a plateau. Below 1200, 16% of plateaus are followed by a +75 gain. Above 2000, only 4% are.

![Share of flat windows and average rating change, by rating band](assets/img/lichess-plateaus/q1-plateau-by-band.png)

## Problem 2: predicting improvement

Each 100-game window has 17 features, all computable from a player's recent games: rating, trend (last 100 and last 25 games), per-game swings, streakiness, results, opponent strength, games per week, breaks, distance below the peak, games played so far, opening variety, game length, losses on time and clock use.

Models were tested with **5-fold cross-validation grouped by player**, so no player appears in both training and testing.

| Model | AUC, all windows | AUC, plateau windows |
|---|---|---|
| Rating only (logistic regression) | 0.597 | 0.600 |
| All features (logistic regression) | 0.628 | 0.619 |
| All features (gradient boosting) | 0.627 | 0.608 |

![ROC curves and calibration on held-out players](assets/img/lichess-plateaus/model-evaluation.png)

The honest result: **the next 100 games are hard to predict.** The full model adds only a little over rating alone. Its probabilities are well calibrated, though, so a "25%" means about one in four. That's what the dashboard needs.

![Permutation importance of each feature](assets/img/lichess-plateaus/feature-importance.png)

The strongest predictors are the **longest break** in the window, **rating** (lower-rated players have more room to grow) and the **recent trend**.

### Why do breaks matter?

Glicko-2 becomes less certain about a player who hasn't played, so after a break each game moves the rating more, in both directions. So I checked gains and drops separately:

| Longest break in the window | +75 or more | −75 or worse | Average change |
|---|---|---|---|
| Under 1 day | 9% | 4% | +10 |
| 1–3 days | 13% | 4% | +17 |
| 3–7 days | 16% | 5% | +21 |
| 1–4 weeks | 20% | 6% | +25 |
| Over 4 weeks | 18% | 11% | +14 |

Breaks of up to a month come before larger **net** gains. Breaks longer than a month mostly add risk: drops double.

## Q2. Does rating volatility predict improvement?

It depends on which volatility. Within plateau windows, and controlling for rating, trend, distance below peak and games played:

- **Per-game swings** (mostly Glicko's uncertainty) have no effect: odds ratio 0.99 per standard deviation, p = 0.89.
- **Streakiness** (scatter around the trend line) does: odds ratio **1.15** per standard deviation, p = 0.016. Players whose results come in hot and cold runs are more likely to break out.

![Share of plateaus followed by +75, by quintile of volatility](assets/img/lichess-plateaus/q2-volatility.png)

## Q3. Does playing more games help players escape plateaus?

Not in a simple way. Comparing players, those who play more games per week are *less* likely to gain +75 per 100 games (odds ratio 0.85 per doubling). Comparing the same player's busy and quiet plateaus gives the same result (0.83, p = 0.015).

But fewer games per week also means more breaks, and breaks make the rating swing more. So I also modelled the **average** rating change, which bigger swings in both directions do not inflate, with a fixed effect for every player. Within a player, the effect of pace is an **inverted U**: the average gain peaks at about **35 games per week** (both terms p < 0.01). There's no straight-line "more is better" effect.

![Plateaus followed by +75, by games per week](assets/img/lichess-plateaus/q3-frequency.png)

**Takeaway:** about five games a day, with short breaks, does better than binge sessions or rare play.

## Q4. Do changes in playing style come before plateaus?

No. I compared 235 climbs that turned into plateaus with 329 climbs that kept going or fell. Opening variety, game length, losses on time and clock use all changed by the same small amount in both groups (all p > 0.1).

![Style measures around the end of a climb](assets/img/lichess-plateaus/q4-style-event-study.png)

These are only the style measures visible in game records. Changes in *what* players study or how they think can't be seen here.

## Q5. Can play improve while the rating stays flat?

Rating measures results against opponents of similar strength. So a player could, in principle, play better without the rating moving. To test this, Stockfish analysed every 4th game of 250 players: **41,126 games** at 10,000 nodes per move. Accuracy uses the Lichess formula, and a mistake or blunder is a move that loses 10 or more win-percentage points.

The engine measure works: average accuracy rises steadily with rating, from 84% below 1200 to 89% above 2000.

![Stockfish accuracy by rating band](assets/img/lichess-plateaus/accuracy-by-band.png)

**During plateaus, accuracy doesn't rise.** In 270 plateau segments of at least 150 games, accuracy changed by −0.06 points per 100 games on average (t-test p = 0.38). It rose in exactly half of them, and rose significantly in only 3%, about what chance alone would give. Mistakes and blunders didn't change either. Hidden improvement during a plateau is the exception, not the rule.

![Accuracy change per 100 games during plateaus](assets/img/lichess-plateaus/q5-accuracy-during-plateaus.png)

**Does accuracy improve before the rating does?** Slightly. I split each history into 50-game blocks and compared, within each player, the change in accuracy with the change in rating:

- An accuracy gain comes before a rating gain in the **next** block (p < 0.001, controlling for the current block's rating change). The within-player correlation is higher one block ahead (0.08) than in the same block (0.04).
- The reverse doesn't happen: after a rating gain, accuracy drops slightly, because the player now faces stronger opponents.
- The effect is **small**. A typical accuracy gain (2.3 points) comes before about +2.5 rating points over the next 50 games, while a typical 50-game rating swing is ±35.

![Within-player correlation of an accuracy gain with rating change in the same and later blocks](assets/img/lichess-plateaus/q5-lead-lag.png)

**Takeaway:** accuracy is a real but weak early signal. It doesn't show a hidden breakthrough during most plateaus. One caveat is that only about 12 games per block were analysed, so block averages are noisy, and that noise weakens every correlation in this section.

## From research to product

The final gradient-boosted model (200 shallow trees) is exported to a 67 KB JSON file. The [Plateau Detector](https://www.neuralgambit.com/stats/plateau) runs it in the browser:

- It downloads the player's last 200 rated blitz games from the Lichess or chess.com API.
- It computes the same 17 features in JavaScript. On the same games, the browser and the Python pipeline give identical features.
- It shows plateau status, the probability of +75 compared with the typical rate at the player's level, and the last 200 games with change-point segments.
- A link opens the **Learning Curve** tab for the same player, which shows their first 300 games; that analysis is written up in [Learning curves on Lichess](ml-project.html?id=lichess-learning-curves).

Players with fewer than 102 games see their trend so far and how many games remain until the prediction unlocks.

### Chess.com players (approximate)

Chess.com ratings sit on a different scale: a chess.com 1000 is roughly a Lichess 1425, and the gap closes near 2200. Chess.com players can still use the detector. Every rating in their games (their own and their opponents') is converted to the Lichess blitz scale with the [ChessGoals rating comparison](https://chessgoals.com/rating-comparison/) (July 2026, 1,935 players; for half of them the true value is within ±70), using linear interpolation between its rows. Two details differ from Lichess:

- Chess.com stores each game's rating **after** the game, so the rating change is taken from consecutive games. A check on two accounts confirmed this: the change correlates 0.89 to 0.92 with that game's result, and close to zero with the previous game's.
- The page labels the result **approximate**. The model never saw chess.com players, and the conversion adds its own error.

For any player whose rating is outside the range the model learned from (Lichess 750 to 2290), the page warns that the probability is a rough guess.

## Limitations

- **One cohort.** Accounts created in late 2020, during the post-*Queen's Gambit* chess boom, and only their first 700 blitz games. Predictions for players with thousands of games are extrapolations.
- **Glicko-2, not skill.** Rating is a lagging, noisy measure of results against similar opponents. Part of what looks like "plateau escape" is the rating system reacting to breaks.
- **Associations, not causes.** The within-player models remove stable differences between players, but not everything that changes over time, such as studying or life events.

## Next steps

- **Learning-curve types:** done in [Learning curves on Lichess](ml-project.html?id=lichess-learning-curves). A next step is testing whether a player's curve type improves this model.
- **Rapid, and a real chess.com model:** add a rapid model, and replace the chess.com conversion with a model trained on a chess.com cohort.
- **Accuracy as a feature:** Q5 found a small lead of accuracy over rating. Analysing every game, not every 4th, would show whether adding accuracy to the model improves its AUC enough to be worth the engine time.
