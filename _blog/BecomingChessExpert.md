---
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"

layout: collection
title: "Becoming a chess expert: How long does it take?"
excerpt: "How fast can a chess player reach Grandmaster title? What is the average pace in gaining elo rating?"
header:
  teaser: /assets/images/becomingchessexpert/chess.png
---

How long does it take to become an expert in chess? Simon and colleagues (Simon & Chase, 1973; Simon & Gilmartin, 1973)
proposed a ‘10-year rule’ for the development of chess expertise based on theoretical arguments about
information processing efficiency and computer simulations of pattern recognition in
chess. Accordingly, a chess player needs about a decade of study to acquire the necessary knowledge base to perform at 
very high levels of tournament play (Charness et al, 2005).

Following subsequent investigations across various populations, from elite musicians to marathon runners, 
significant empirical evidence emerged to support extending the application of the ten-year rule to other 
skill domains (Ericsson, Krampe, & Tesch-Römer, 1993). 

If we take an assumption that at least 10 years is necessary for a chess player to enter the realm of Grandmasters, how
does the function looks like? Do chess players progress linearly throughout the years? Can we define common trajectory?
How does it help us understand expertise development?


## Unveiling the Path to Grandmaster: Analyzing Chess Player Progression from 2015 to 2024


Analyzing data spanning from 2015 to 2024, I tracked the progress of chess players and their standard ratings in chess
using data found on FIDE website. My focus honed in on individuals who began with ratings below 2000 in 2015 and rose 
to the esteemed rank of Grandmaster by 2024. Through this thorough examination, I aimed to unveil the trajectory and 
pace of advancement towards expertise in chess. By filtering out those with lower initial ratings, I aimed to discern 
patterns and insights into the journey of becoming a Grandmaster within this timeframe. I used data available at 
[Fide](https://ratings.fide.com/download_lists.phtml)

### Elo ratings over 10 years

From total of 3284637 chess players, only 39 players began with ratings below 2000 in 2015 and rose 
to the esteemed rank of Grandmaster by 2024. Only those players are taken into further analysis.

The following graph present 39 chess players' rating progression over 10 years period.

![png](/assets/images/becomingchessexpert/ratingtrend.png)

This observation suggests that the function follows a logarithmic pattern, characterized by rapid growth in elo rating 
initially, followed by a stabilization phase once a certain threshold is reached. In this specific instance, 
the elo rating exhibits accelerated progression initially and then levels off after approximately reaching 2400.

Typical progression onset when previous variability in function is averaged throughout every year, 
the following pattern emerge:

![png](/assets/images/becomingchessexpert/mean_rating_plot.png)

Typical rating in first year would be 1780, with a significant variance, and it would progress each year for a certain 
amount to 2550 at last year (after 10 years), but variance is progressively much smaller. 

How much rating increases over years depends on the differences between consecutive years progress, which forms a shame 
of negative potential function: 

![png](/assets/images/becomingchessexpert/meanratingdifftrend.png)

First couple of years, difference in elo rating is much bigger in respect to the later years of chess playing. 

This insights could be attributed to several factors:

**Diminishing Returns**: As a player improves in skill, it becomes increasingly challenging to make significant gains in elo
rating. Initially, when a player is less skilled, there may be relatively easy improvements to make, resulting in rapid 
elo growth. However, as the player becomes more proficient, the rate of improvement slows down due to the diminishing 
returns of additional practice and learning.

**Increased Difficulty**: Advancing beyond a certain elo threshold typically requires a higher level of skill and expertise. 
As players reach higher elo ratings, they face tougher competition, making it more difficult to achieve further gains.
This increased difficulty contributes to the stabilization of elo ratings once a certain level is reached.

**Plateau Effect**: In many skill-based activities, individuals may experience plateaus in their progress, where they reach 
a temporary ceiling in performance despite continued effort. This plateau effect can lead to the observed stabilization 
of elo ratings as players encounter challenges in further improving their skills.

**Skill Saturation**: After attaining a certain level of proficiency, players may reach a point where they have acquired 
most of the fundamental skills and strategies necessary for the game. At this stage, additional improvements may be 
more incremental, resulting in the leveling off of elo ratings.

According to chess expertise theory, expertise is defined at least as 10 years of development and additionally 
the analysis show converging results. The stable elo rating progression start to emerge 10 years after being 
a nearly average player.

Neverthless, a conducted meta-analysis (Macnamara, Hambrick and Oswald, 2014) revealed that deliberate 
practice accounted for 26% of the variance in game performance, 21% in music, 18% in sports, 4% in education, and 
less than 1% in professions. Other factors can influence the development, differences in problem-solving abilities and
intelligence can play a major part if someone reach the point of expertise quite early. Especially if one reaches the 
same point with less experience in general.

![png](/assets/images/becomingchessexpert/oneplayertrend.png)

This player in 2022 achieved Grandmaster title, in only 8 years, almost 1200 elo rating difference. One in many, but
for sure an example of human abilites.

## References

Charness, N., Tuffiash, M., Krampe, R., Reingold, E., & Vasyukova, E. (2005). The Role of Deliberate Practice in Chess Expertise. Applied Cognitive Psychology, 19(2), 151–165. https://doi.org/10.1002/acp.1106

Ericsson, K. A., Krampe, R. Th., & Tesch-Ro¨mer, C. (1993). The role of deliberate practice in the acquisition of expert performance. Psychological Review, 100, 363–406.

Macnamara, B. N., Hambrick, D. Z., & Oswald, F. L. (2014). Deliberate Practice and Performance in Music, Games, Sports, Education, and Professions: A Meta-Analysis. Psychological Science, 25(8), 1608–1618. doi:10.1177/0956797614535810