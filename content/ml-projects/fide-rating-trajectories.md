# Predicting FIDE rating trajectories

## Overview

### Question

A player rated 1500 asks: *how far can I still go, and when will I stop improving?* Coaches answer this from experience. **Can 25 years of official FIDE ratings answer it with data instead?**

This project turns the full FIDE rating history into the [Rating Predictor](https://www.neuralgambit.com/stats) on NeuralGambit. A player enters their rating, age, sex, title, and years active, and gets a 15-year rating forecast, the chance of plateauing, and how likely they are to break through their first ceiling.

### At a glance

- **Data:** 5.0 million yearly rating entries for **547,677 players**, 2001 to 2025. After cleaning, **497,818 players** were grouped by their first FIDE rating.
- **Main finding:** where you *start* matters most. Players who debut at 1000 to 1200 gain about **+280 Elo** on average over 9 years. Players who debut above 1800 drift slightly *down*.
- **Plateaus come early:** by their second year, 40 to 50% of players who debuted below 1800 and three quarters of those who debuted at 2200 to 2400 have already had a 3-year stretch without real change.
- **Age matters:** players under 14 gain about **+65 Elo per year** on average. Players over 50 gain about **+5**.

## The data

Each row in the dataset is one player in one year, taken from FIDE's official rating lists.

| Field | Used for |
| --- | --- |
| FIDE ID | Following a player across years |
| Rating | The value being predicted |
| Year | Career year (years since first rating) |
| Birth year | Age at each rating |
| Sex | Separate title effects for men and women |
| Titles (4 columns) | Combined into one "best title" (GM, IM, FM, CM, WGM, WIM, WFM, WCM) |
| Games | Checking how active a player was |

Cleaning removed ratings below 1000, impossible ages (under 5), and unknown sex values.

## Approach

### 1. Follow each player from their debut

Players start in different years, so calendar years are not comparable. Every player is re-aligned to their own **career year**: year 1 is their first FIDE rating, year 2 is one year later, and so on. Each player is then placed in a **debut group** (200-Elo bands from 1000 to 2400+) based on their *first* rating, and stays in that group for their whole career. This keeps the growth curves clean: a player who starts at 1900 and reaches 2300 is still counted with the other 1900 starters.

### 2. Growth curves per debut group

For each group and career year, I computed the mean, median, and spread of the **cumulative rating change since debut**.

![Mean cumulative rating change by career year, one line per debut group](assets/img/fide-trajectories/growth-by-group.png)

*Lower-rated debutants keep climbing for over a decade. Around 1800 to 2000, the lines cross zero: stronger debutants hold their level or slowly decline.*

| Debut rating | Players | After 1 year | After 4 years | After 9 years |
| --- | --- | --- | --- | --- |
| 1000–1200 | 79,968 | +84 | +92 | +280 |
| 1200–1400 | 78,970 | +54 | +63 | +174 |
| 1400–1600 | 106,567 | +30 | +40 | +98 |
| 1600–1800 | 90,166 | +11 | +19 | +39 |
| 1800–2000 | 67,451 | 0 | +1 | −5 |
| 2000–2200 | 53,109 | −4 | −9 | −24 |
| 2200–2400 | 19,122 | −2 | −7 | −21 |
| 2400+ | 2,465 | 0 | +1 | −8 |

### 3. Plateau detection

A **plateau** is defined as **3 yearly ratings in a row that differ by no more than 15 Elo** (highest minus lowest). Normal yearly noise for an active player is about 10 to 20 Elo, so three years inside such a narrow band points to a ceiling. Only the first plateau is recorded. The detection uses a forward-looking rolling window per player, vectorised in pandas so it runs on all 500k players in seconds rather than minutes.

From this, each group gets a **cumulative distribution**: the share of players who have plateaued by year 2, 3, 5, 8, 10, 12, and 15.

![Share of players who have plateaued by career year, one line per debut group](assets/img/fide-trajectories/plateau-cdf.png)

| Debut rating | Plateaued by year 2 | By year 5 | Ever (in the data) |
| --- | --- | --- | --- |
| 1000–1200 | 47% | 53% | 54% |
| 1400–1600 | 39% | 49% | 52% |
| 1800–2000 | 57% | 75% | 85% |
| 2000–2200 | 68% | 85% | 97% |
| 2200–2400 | 74% | 87% | 98% |

The predictor uses this to answer a **conditional** question: *given that I've been active 4 years and have not plateaued yet, what's the chance I plateau in the next 5?*

P(plateau in next h years | active a years) = (F(a + h) − F(a)) / (1 − F(a))

where F is the group's plateau curve, linearly interpolated between the measured years.

### 4. Age and title effects

Yearly rating change falls steadily with age:

![Mean yearly rating change by age group](assets/img/fide-trajectories/gain-by-age.png)

Titles matter mostly at **low ratings**. Compared to untitled players in the same debut group, titled players who debuted at 1000 to 1200 gain much more per year (median): **+110** for WFMs, **+83** for CMs, **+59** for IMs, **+58** for FMs. Above 1800 the title effect is close to zero. A titled player with a low rating is usually a young, fast-rising player whose rating has not caught up yet.

### 5. The prediction

For a player in debut group *g*, with age factor *a* (their age group's mean yearly gain divided by the best age group's) and title bonus *b*:

- **Predicted rating in year t** = current rating + mean group gain at t + age adjustment + title adjustment
- **80% band** = ±15 × √(t + 1) Elo, widening with the forecast horizon
- **First ceiling** = the first year the group's growth curve stops rising
- **Breakout chance** = combines how many players in the group never plateau with how much the group still grows late in their careers (year 13 vs. year 5)

Everything is precomputed into six small JSON files (about 30 KB in total), so the web page makes its forecast in the browser instantly, with no server round trip.

## What went wrong, and what it taught me

- **Two-thirds of the rows are inactive years.** About **65%** of yearly entries record zero rated games. An inactive player's rating doesn't move, so it looks like a "plateau" even though the player simply stopped playing. This is why the median yearly gain is 0 in almost every age group, and why the means are the more useful summary here.
- **The first parametric model failed.** The plan was a compact formula: yearly gain = group base gain × exp(−k × years past peak age) + title bonus, fitted on each player's first career year. But cumulative gain in year 1 is zero by definition, so the fit came back with every base gain at 0 and a peak age of 8. The predictor now uses the empirical growth curves directly. The formula is worth refitting on year 1 → year 2 changes.
- **Survivorship bias.** Later career years only include players who are still on the rating list. The 1000–1200 group shrinks from 80k players to 10k by year 10, and those who stayed are likely the ones who were improving. The late-career gains for low groups are therefore optimistic.
- **Hand-set heuristics.** The "breakout" and "fast improver" scores combine real signals (plateau survival, late growth, age, title) with weights I set by hand. They are useful rankings, not calibrated probabilities.

## Next steps

- **Filter on activity:** only count years with rated games, so plateaus reflect skill ceilings rather than breaks from chess.
- **Proper survival analysis:** treat players who leave the rating list as *censored* (Kaplan–Meier or a Cox model) instead of counting them as "never plateaued".
- **Train a real model:** a gradient-boosted regressor or a mixed-effects growth model on individual trajectories, evaluated on a held-out set of players, to replace the group averages and the hand-set weights.
- **Link with chess personas:** the growth curves here give the real number of years players spend in each rating band, which is one of the open questions in [Part 1: Chess personas](ml-project.html?id=chess-personas).
