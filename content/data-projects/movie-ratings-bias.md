# Unveiling bias in movie ratings

*Professional · Consumer ratings · Python, pandas, and Seaborn*

## Overview

### Question

Fandango sells movie tickets *and* shows movie ratings. Did it display inflated ratings in 2015 to sell more tickets?

### At a glance

- **Data:** 504 films scraped from Fandango, and 146 films with scores from Rotten Tomatoes, Metacritic, and IMDb (2015).
- **Comparison:** Fandango's displayed stars against its own hidden average rating, and against four other rating sources.
- **Main finding:** Fandango always rounded ratings *up*, never down, and rated films almost a full star higher than other sites (4.09 vs 3.15 out of 5).
- **Result:** the analysis reproduces the conclusion of FiveThirtyEight's article [Be Suspicious Of Online Movie Ratings, Especially Fandango's](https://fivethirtyeight.com/features/fandango-movies-ratings/).

### Business problem

Online ratings shape which films people go to see. When the same company shows the rating and sells the ticket, there is an incentive to make films look better than they are. The goals were to:

- check whether the stars Fandango shows match the ratings users actually gave
- compare Fandango's ratings with independent critic and user ratings on other sites
- measure how big the gap is, and whether it is large enough to matter to a moviegoer

## Data

The data behind the FiveThirtyEight story, openly available on [FiveThirtyEight's GitHub](https://github.com/fivethirtyeight/data).

- **`fandango_scrape.csv`:** 504 films pulled from Fandango, with the displayed stars, the true average rating (taken from each page's HTML), and the number of votes.
- **`all_sites_scores.csv`:** 146 films that have a Rotten Tomatoes critic and user score, a Metacritic critic and user score, an IMDb score, and at least 30 fan reviews on Fandango (pulled on 24 August 2015).

Films with no votes on Fandango (69 of them) were removed, leaving 435. Joining the two files on film title gave 145 films with scores from every source.

## Methods

#### Data cleaning

Extracting the release year from the film title, removing films with zero votes, and joining the two datasets by film.

#### Normalisation

The sites use different scales (0–100 and 0–10), so every score was rescaled to Fandango's 0–5 stars, keeping the relationships between films the same.

#### Descriptive statistics and exploratory data analysis

Distributions, vote counts, and the gap between displayed stars and the true rating, plus comparisons of critic and user scores within each site.

#### Correlation

Checking how closely displayed stars follow the true rating, and whether more popular films get higher ratings.

#### Welch's t-test

Comparing Fandango's displayed stars with the scores from all other sources, without assuming equal variances.

#### Data visualisation

Density plots, histograms, scatter plots, and a clustermap to make the differences between sites visible.

## Results

### Do the displayed stars match the real rating?

<figure>
  <img src="assets/img/movie-ratings/true-vs-displayed.png" alt="Density plot of Fandango's true rating and displayed stars, with the stars shifted to the right">
  <figcaption>Fandango's true average rating compared with the stars it displayed.</figcaption>
</figure>

Displayed stars and true ratings are almost perfectly correlated (r = 0.99), but the stars distribution is shifted to the right: displayed scores are consistently a little higher.

<figure>
  <img src="assets/img/movie-ratings/stars-difference.png" alt="Histogram of the difference between displayed stars and true rating, all values between 0 and 1">
  <figcaption>Displayed stars minus true rating, per film.</figcaption>
</figure>

The difference is **never negative**. A film rated 4.1 is shown as 4.5 stars, not 4.0. Most gaps are between 0 and 0.5 stars, and one film, *Turbo Kid*, was shown 5 stars for a true rating of 4.0 (based on just 2 votes).

Popularity has only a weak link with rating (r = 0.16): heavily reviewed films are not rated noticeably higher.

### How do other sites compare?

<figure>
  <img src="assets/img/movie-ratings/rt-critics-vs-users.png" alt="Scatter plot of Rotten Tomatoes critic scores against user scores">
  <figcaption>Rotten Tomatoes critic scores against user scores (0–100).</figcaption>
</figure>

Critics and users broadly agree on Rotten Tomatoes, but not always: on average they differ by 15 points out of 100. Users loved *Do You Believe?* far more than critics did (a 66-point gap), while critics rated *Mr. Turner* 42 points higher than users.

<figure>
  <img src="assets/img/movie-ratings/all-sites-distributions.png" alt="Density plots of normalised ratings from Fandango, Rotten Tomatoes, Metacritic, and IMDb">
  <figcaption>All ratings rescaled to 0–5 stars.</figcaption>
</figure>

After rescaling, Fandango's stars (red) and true rating (blue) sit at the far right of every other source. Rotten Tomatoes critics (green) spread their scores across the whole scale; Fandango almost never shows a film below 3 stars.

### What about bad films?

<figure>
  <img src="assets/img/movie-ratings/worst-films.png" alt="Density plots of ratings for the 10 films with the lowest Rotten Tomatoes critic scores">
  <figcaption>Ratings across sites for the 10 films Rotten Tomatoes critics rated lowest.</figcaption>
</figure>

For the films critics rated worst, Fandango still showed 3 to 4.5 stars. The clearest case is *Taken 3*:

| Source | Score (0–5) |
| --- | --- |
| Fandango displayed stars | 4.5 |
| Fandango true rating | 4.1 |
| IMDb | 3.05 |
| Rotten Tomatoes users | 2.3 |
| Metacritic users | 2.3 |
| Metacritic critics | 1.3 |
| Rotten Tomatoes critics | 0.45 |
| **Average of other sites** | **1.9** |

### Is the difference significant?

<figure>
  <img src="assets/img/movie-ratings/fandango-vs-other-sites.png" alt="Density plots of Fandango stars compared with the pooled scores of all other sites">
  <figcaption>Fandango's displayed stars compared with all other sources combined.</figcaption>
</figure>

- **Fandango displayed stars:** mean 4.09 out of 5.
- **All other sources:** mean 3.15 out of 5.
- **Welch's t-test:** t = 15.91, p < .001.

Fandango rated films almost **one whole star higher** than the other sites, and the difference is far too large to be chance.

## Conclusions

- Fandango **rounded every rating up**, so the stars on the page were always at least as high as what users actually gave.
- Even its true ratings were **much higher than any other site's**, and bad films were still shown as worth watching.
- On a five-star scale, a one-star gap changes how good a film looks. It was large enough to make people suspicious, which is how FiveThirtyEight came to investigate it.

### Limitations

- Only 145 films had scores on every site, and almost all were from 2015.
- The t-test pools the five other sources together, so it treats scores for the same film as independent. A paired comparison per film would be a stricter test.

### Open questions

- How large does a gap between platforms need to be before users notice it?
- Do some kinds of films (genre, studio, box office) get inflated more than others?
