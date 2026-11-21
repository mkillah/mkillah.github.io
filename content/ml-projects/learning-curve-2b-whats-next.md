# Learning Curve 2b: What's next

## In short

Chess players often ask: **am I improving, am I stuck, and what happens next?** This project answers that for Lichess blitz players. It looks at your last 100 games and gives three chances for your next 100:

- **Climb:** you gain 75 rating points or more.
- **Hold:** you stay within 75 points of where you are.
- **Drop:** you lose 75 points or more.

You can try it with any Lichess or chess.com username in the [NeuralGambit Learning Curve tab](https://www.neuralgambit.com/stats/learning-curve). All the code, tables and charts are in the [notebook](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-2b-whats-next.ipynb).

**The main findings:**

1. **Most of the time, nothing big happens.** In about 84 of 100 stretches, the rating stayed within 75 points.
2. **Climbing gets harder as you get better.** A big climb happens about 18% of the time below 1200, and about 3% of the time above 2000.
3. **Long breaks and rare play make ratings swing.** Players who come back from a long break are more likely to climb *and* more likely to drop.
4. **Above 2000, drops are about twice as common** as at lower ratings.
5. **The forecast helps, but it isn't a crystal ball.** Luck still decides a lot over 100 games.

## How it works

Think of it as asking: *"What happened next to players who were in a position like mine?"*

1. **Collect games.** 3.4 million rated blitz games from 1,554 Lichess players whose accounts were created in late 2020.
2. **Cut them into stretches.** Each career is cut into stretches of 100 games, starting a new one every 25 games. That gives **123,662 examples**.
3. **Describe each stretch.** 17 simple measurements, such as rating, recent trend, games per week, longest break and distance from the player's best rating.
4. **Record what happened next.** Did the player climb, hold or drop over the following 100 games?
5. **Train a model.** A machine-learning method called *gradient boosting* learns which patterns tend to come before each outcome.
6. **Test it fairly.** The model is always tested on players it has never seen.

The page does the same measurements on your last 100 games, in your browser, and nothing is stored.

## What usually happens next

![Chance of climbing and dropping over the next 100 games, by rating](assets/img/lichess-plateaus/next100-by-band.png)

| Your rating | Climb | Hold | Drop |
|---|---|---|---|
| Below 1200 | 18% | 79% | 4% |
| 1200–1400 | 14% | 82% | 5% |
| 1400–1600 | 11% | 84% | 5% |
| 1600–1800 | 10% | 86% | 5% |
| 1800–2000 | 6% | 89% | 5% |
| 2000+ | 3% | 88% | 9% |

These are the thin marks on the bars in the tab, so you can see whether your own chances are better or worse than usual for your rating.

## What goes with bigger swings

![Climbs and drops by pace, longest break and games decided on time](assets/img/lichess-plateaus/next100-habits.png)

- **Playing rarely.** Players with fewer than 5 games a week dropped in 12.5% of stretches. From 15 games a week upward, it was under 5%.
- **Long breaks.** With a break of 6 months or more inside the last 100 games, 15% of stretches ended in a drop and 21% in a climb. With no break longer than 3 days, it was 4.5% and 9%.
- **Why both directions?** After a break, your rating may no longer match your strength, so it moves more until it catches up.

This shows what *goes together*, not what *causes* what. Playing more often won't automatically protect your rating.

**One example.** A player rated 2,040 plays about 2 games a week and took a 299-day break. The model gives them a **38%** chance to drop. With a typical pace and no long break, the same player would get **18%**. Among real players with a similar pattern, about 30% dropped.

## Life after 2000

Reaching 2000 doesn't end the ups and downs. To check this, I followed the 338 players who held 2000 for 30 days for up to 3,000 more games each.

![What the next 100 games did for players rated 2000+](assets/img/lichess-plateaus/next100-after-2000.png)

| Players rated 2000+ | Chance of a drop in the next 100 games |
|---|---|
| Before they held 2000 for 30 days | 8% |
| After they held it | 8% |
| Touched 2000 but never held it | 13% |

## How good is the forecast?

Two simple checks, both on players the model had never seen:

**Does it rank players well?** The score below (called *AUC*) is 0.5 for a coin flip and 1.0 for a perfect forecast.

| Using | Climb | Drop |
|---|---|---|
| Rating only | 0.64 | 0.55 |
| **All 17 measurements** | **0.69** | **0.65** |

So the model does better than rating alone, but it's far from perfect.

**Can you trust the percentages?** Mostly yes. When the model said about 20%, about 20 in 100 players really did it.

![Predicted chances compared with what really happened](assets/img/lichess-plateaus/next100-calibration.png)

## What to keep in mind

- **It's a forecast, not a promise.** A 10% chance still happens 1 time in 10.
- **One group of players.** Lichess accounts from late 2020, blitz only.
- **Very low or high ratings.** The model mostly saw ratings from about 900 to 2,170. Outside that range, the page warns that the result is a rough guess.
- **chess.com is approximate.** The model learned from Lichess, so chess.com ratings are converted first.

## Want the details?

- **Full analysis and code:** [learning-curve-2b-whats-next.ipynb](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/learning-curve-2b-whats-next.ipynb)
- **Try it:** [NeuralGambit Learning Curve](https://www.neuralgambit.com/stats/learning-curve)
- **How the whole tab works:** [notebooks README](https://github.com/mkillah/mkillah.github.io/blob/main/notebooks/README.md)
- **Previous:** [Part 2a: Where you are now](ml-project.html?id=learning-curve-2a-where-you-are-now)
- **Next:** [Part 3: Reaching 2000](ml-project.html?id=learning-curve-3-reaching-2000)
