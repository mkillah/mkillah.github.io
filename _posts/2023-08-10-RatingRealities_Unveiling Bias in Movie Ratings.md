---
author_profile: false
title:  "RatingRealities: Unveiling Bias in Movie Ratings"
date:   2024-02-15
categories:
  - Data Analysis
---

**The story about a method for attracting more users to watch movies on a movie platform.**

## Overview

If you are planning on going out to see a movie, how well can you trust online reviews and ratings? *Especially* if the same company showing the rating *also* makes money by selling movie tickets. Do they have a bias towards rating movies higher than they should be rated?

### Goal:

**Goal is to analyse movie data based on the 538 article ([Be Suspicious Of Online Movie Ratings, Especially Fandango’s](http://fivethirtyeight.com/features/fandango-movies-ratings/)**) **and see if concnclusions are similar. I am going to use pandas and visualization skills to determine if Fandango's ratings in 2015 had a bias towards rating movies better to sell more tickets.**

---
---

## Part One: Understanding the Background and Data



----
### The Data

This is the data behind the story [Be Suspicious Of Online Movie Ratings, Especially Fandango’s](http://fivethirtyeight.com/features/fandango-movies-ratings/) openly available on 538's github: https://github.com/fivethirtyeight/data. There are two csv files, one with Fandango Stars and Displayed Ratings, and the other with aggregate data for movie ratings from other sites, like Metacritic,IMDB, and Rotten Tomatoes.

#### all_sites_scores.csv

-----

`all_sites_scores.csv` contains every film that has a Rotten Tomatoes rating, a RT User rating, a Metacritic score, a Metacritic User score, and IMDb score, and at least 30 fan reviews on Fandango. The data from Fandango was pulled on Aug. 24, 2015.

Column | Definition
--- | -----------
FILM | The film in question
RottenTomatoes | The Rotten Tomatoes Tomatometer score  for the film
RottenTomatoes_User | The Rotten Tomatoes user score for the film
Metacritic | The Metacritic critic score for the film
Metacritic_User | The Metacritic user score for the film
IMDB | The IMDb user score for the film
Metacritic_user_vote_count | The number of user votes the film had on Metacritic
IMDB_user_vote_count | The number of user votes the film had on IMDb

----
----

#### fandango_scape.csv

`fandango_scrape.csv` contains every film 538 pulled from Fandango.

Column | Definiton
--- | ---------
FILM | The movie
STARS | Number of stars presented on Fandango.com
RATING |  The Fandango ratingValue for the film, as pulled from the HTML of each page. This is the actual average score the movie obtained.
VOTES | number of people who had reviewed the film at the time we pulled it.

## Part Two: Exploring Fandango Displayed Scores versus True User Ratings

**Checkpoint 1.** Let's first explore the Fandango ratings to see if our analysis agrees with the article's conclusion.


```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
```


```python
fandango = pd.read_csv("fandango_scrape.csv")
```

Fandango's table structure 


```python
fandango.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>STARS</th>
      <th>RATING</th>
      <th>VOTES</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Fifty Shades of Grey (2015)</td>
      <td>4.0</td>
      <td>3.9</td>
      <td>34846</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Jurassic World (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>34390</td>
    </tr>
    <tr>
      <th>2</th>
      <td>American Sniper (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>34085</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Furious 7 (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>33538</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Inside Out (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>15749</td>
    </tr>
  </tbody>
</table>
</div>



Fandango's table information


```python
fandango.info()
```

    <class 'pandas.core.frame.DataFrame'>
    RangeIndex: 504 entries, 0 to 503
    Data columns (total 4 columns):
     #   Column  Non-Null Count  Dtype  
    ---  ------  --------------  -----  
     0   FILM    504 non-null    object 
     1   STARS   504 non-null    float64
     2   RATING  504 non-null    float64
     3   VOTES   504 non-null    int64  
    dtypes: float64(2), int64(1), object(1)
    memory usage: 15.9+ KB
    

Fandango descriptive statistics


```python
fandango.describe().transpose()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>count</th>
      <th>mean</th>
      <th>std</th>
      <th>min</th>
      <th>25%</th>
      <th>50%</th>
      <th>75%</th>
      <th>max</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>STARS</th>
      <td>504.0</td>
      <td>3.558532</td>
      <td>1.563133</td>
      <td>0.0</td>
      <td>3.5</td>
      <td>4.0</td>
      <td>4.50</td>
      <td>5.0</td>
    </tr>
    <tr>
      <th>RATING</th>
      <td>504.0</td>
      <td>3.375794</td>
      <td>1.491223</td>
      <td>0.0</td>
      <td>3.1</td>
      <td>3.8</td>
      <td>4.30</td>
      <td>5.0</td>
    </tr>
    <tr>
      <th>VOTES</th>
      <td>504.0</td>
      <td>1147.863095</td>
      <td>3830.583136</td>
      <td>0.0</td>
      <td>3.0</td>
      <td>18.5</td>
      <td>189.75</td>
      <td>34846.0</td>
    </tr>
  </tbody>
</table>
</div>



**Checkpoint 2.** Exploring the relationship between popularity of a film and its rating.


```python
plt.figure(figsize=(12,4))
sns.scatterplot(data=fandango, x="RATING", y="VOTES")
plt.title("Relationship between popularity and films' rating")
```




    Text(0.5, 1.0, "Relationship between popularity and films' rating")




    
![png](/assets/images/RatingRealitiesProject/output_16_1.png)
    


Correlation matrix


```python
fandango[["STARS","RATING","VOTES"]].corr()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>STARS</th>
      <th>RATING</th>
      <th>VOTES</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>STARS</th>
      <td>1.000000</td>
      <td>0.994696</td>
      <td>0.164218</td>
    </tr>
    <tr>
      <th>RATING</th>
      <td>0.994696</td>
      <td>1.000000</td>
      <td>0.163764</td>
    </tr>
    <tr>
      <th>VOTES</th>
      <td>0.164218</td>
      <td>0.163764</td>
      <td>1.000000</td>
    </tr>
  </tbody>
</table>
</div>



**Checkpoint 3.** Frequency analysis.


```python
# Separating the column that contains the name and film year into a column with the year of the film
fandango['Year'] = fandango['FILM'].apply(lambda title:title.split('(')[-1].replace(')',''))
```

Number of movies per year


```python
# Checking the frequency of the "Year" column
fandango["Year"].value_counts()
```




    2015    478
    2014     23
    2016      1
    1964      1
    2012      1
    Name: Year, dtype: int64




```python
# Ploting the "Year" column
sns.countplot(data=fandango,x="Year")
plt.title("Number of movies per year")
```




    Text(0.5, 1.0, 'Number of movies per year')




    
![png](/assets/images/RatingRealitiesProject/output_23_1.png)
    


10 movies with highest number of votes


```python
# 10 movies with highest number of votes
fandango.sort_values(by=["VOTES"], ascending=False)[:10]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>STARS</th>
      <th>RATING</th>
      <th>VOTES</th>
      <th>Year</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Fifty Shades of Grey (2015)</td>
      <td>4.0</td>
      <td>3.9</td>
      <td>34846</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Jurassic World (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>34390</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>2</th>
      <td>American Sniper (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>34085</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Furious 7 (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>33538</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Inside Out (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>15749</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>5</th>
      <td>The Hobbit: The Battle of the Five Armies (2014)</td>
      <td>4.5</td>
      <td>4.3</td>
      <td>15337</td>
      <td>2014</td>
    </tr>
    <tr>
      <th>6</th>
      <td>Kingsman: The Secret Service (2015)</td>
      <td>4.5</td>
      <td>4.2</td>
      <td>15205</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>7</th>
      <td>Minions (2015)</td>
      <td>4.0</td>
      <td>4.0</td>
      <td>14998</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>8</th>
      <td>Avengers: Age of Ultron (2015)</td>
      <td>5.0</td>
      <td>4.5</td>
      <td>14846</td>
      <td>2015</td>
    </tr>
    <tr>
      <th>9</th>
      <td>Into the Woods (2014)</td>
      <td>3.5</td>
      <td>3.4</td>
      <td>13055</td>
      <td>2014</td>
    </tr>
  </tbody>
</table>
</div>



Number of movies with zero votes


```python
# Number of movies with zero votes
fandango[fandango["VOTES"] == 0].count()["VOTES"]
```




    69



Number of movies that have votes


```python
# Updating DataFrame of only reviewed films
fandango = fandango[fandango["VOTES"] != 0]
len(fandango)
```




    435




```python
# The distributions of ratings that are dispayed (STARS) versus what the true rating was from votes (RATING)
plt.figure(figsize=(12,4), dpi=150)
sns.kdeplot(data=fandango, x="RATING", clip=(0,5), label="True Rating", fill=True)
sns.kdeplot(data=fandango, x="STARS", clip=(0,5), label="Stars Displayed", fill=True)
plt.legend(loc=(1.05,0.5))
plt.title("Rating distribution by true and displayed movie scores")
```




    Text(0.5, 1.0, 'Rating distribution by true and displayed movie scores')




    
![png](/assets/images/RatingRealitiesProject/output_30_1.png)
    


The discepancy between STARS and RATING - STARS_DIFF


```python
# Quantifing the discepancy between STARS and RATING
fandango["STARS_DIFF"] = fandango["STARS"] - fandango["RATING"]
fandango.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>STARS</th>
      <th>RATING</th>
      <th>VOTES</th>
      <th>Year</th>
      <th>STARS_DIFF</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Fifty Shades of Grey (2015)</td>
      <td>4.0</td>
      <td>3.9</td>
      <td>34846</td>
      <td>2015</td>
      <td>0.1</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Jurassic World (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>34390</td>
      <td>2015</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>2</th>
      <td>American Sniper (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>34085</td>
      <td>2015</td>
      <td>0.2</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Furious 7 (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>33538</td>
      <td>2015</td>
      <td>0.2</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Inside Out (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>15749</td>
      <td>2015</td>
      <td>0.0</td>
    </tr>
  </tbody>
</table>
</div>




```python
# Displaying the number of times a certain difference occurs
plt.figure(figsize=(12,4), dpi=150)
sns.histplot(data=fandango, x="STARS_DIFF", bins=7)
plt.title("Number of times a certain difference occurs")
```




    Text(0.5, 1.0, 'Number of times a certain difference occurs')




    
![png](/assets/images/RatingRealitiesProject/output_33_1.png)
    


Movie that is close to 1 star differential


```python
# Movie that is close to 1 star differential
fandango[fandango["STARS_DIFF"] == 1]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>STARS</th>
      <th>RATING</th>
      <th>VOTES</th>
      <th>Year</th>
      <th>STARS_DIFF</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>381</th>
      <td>Turbo Kid (2015)</td>
      <td>5.0</td>
      <td>4.0</td>
      <td>2</td>
      <td>2015</td>
      <td>1.0</td>
    </tr>
  </tbody>
</table>
</div>



## Part Three: Comparison of Fandango Ratings to Other Sites

Let's now compare the scores from Fandango to other movies sites and see how they compare.


```python
all_sites = pd.read_csv("all_sites_scores.csv")
```

All sites table structure


```python
all_sites.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>RottenTomatoes</th>
      <th>RottenTomatoes_User</th>
      <th>Metacritic</th>
      <th>Metacritic_User</th>
      <th>IMDB</th>
      <th>Metacritic_user_vote_count</th>
      <th>IMDB_user_vote_count</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Avengers: Age of Ultron (2015)</td>
      <td>74</td>
      <td>86</td>
      <td>66</td>
      <td>7.1</td>
      <td>7.8</td>
      <td>1330</td>
      <td>271107</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Cinderella (2015)</td>
      <td>85</td>
      <td>80</td>
      <td>67</td>
      <td>7.5</td>
      <td>7.1</td>
      <td>249</td>
      <td>65709</td>
    </tr>
    <tr>
      <th>2</th>
      <td>Ant-Man (2015)</td>
      <td>80</td>
      <td>90</td>
      <td>64</td>
      <td>8.1</td>
      <td>7.8</td>
      <td>627</td>
      <td>103660</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Do You Believe? (2015)</td>
      <td>18</td>
      <td>84</td>
      <td>22</td>
      <td>4.7</td>
      <td>5.4</td>
      <td>31</td>
      <td>3136</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Hot Tub Time Machine 2 (2015)</td>
      <td>14</td>
      <td>28</td>
      <td>29</td>
      <td>3.4</td>
      <td>5.1</td>
      <td>88</td>
      <td>19560</td>
    </tr>
  </tbody>
</table>
</div>



All sites table info


```python
all_sites.info()
```

    <class 'pandas.core.frame.DataFrame'>
    RangeIndex: 146 entries, 0 to 145
    Data columns (total 8 columns):
     #   Column                      Non-Null Count  Dtype  
    ---  ------                      --------------  -----  
     0   FILM                        146 non-null    object 
     1   RottenTomatoes              146 non-null    int64  
     2   RottenTomatoes_User         146 non-null    int64  
     3   Metacritic                  146 non-null    int64  
     4   Metacritic_User             146 non-null    float64
     5   IMDB                        146 non-null    float64
     6   Metacritic_user_vote_count  146 non-null    int64  
     7   IMDB_user_vote_count        146 non-null    int64  
    dtypes: float64(2), int64(5), object(1)
    memory usage: 9.2+ KB
    

All sites descriptive statistics


```python
all_sites.describe().transpose()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>count</th>
      <th>mean</th>
      <th>std</th>
      <th>min</th>
      <th>25%</th>
      <th>50%</th>
      <th>75%</th>
      <th>max</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>RottenTomatoes</th>
      <td>146.0</td>
      <td>60.849315</td>
      <td>30.168799</td>
      <td>5.0</td>
      <td>31.25</td>
      <td>63.50</td>
      <td>89.00</td>
      <td>100.0</td>
    </tr>
    <tr>
      <th>RottenTomatoes_User</th>
      <td>146.0</td>
      <td>63.876712</td>
      <td>20.024430</td>
      <td>20.0</td>
      <td>50.00</td>
      <td>66.50</td>
      <td>81.00</td>
      <td>94.0</td>
    </tr>
    <tr>
      <th>Metacritic</th>
      <td>146.0</td>
      <td>58.808219</td>
      <td>19.517389</td>
      <td>13.0</td>
      <td>43.50</td>
      <td>59.00</td>
      <td>75.00</td>
      <td>94.0</td>
    </tr>
    <tr>
      <th>Metacritic_User</th>
      <td>146.0</td>
      <td>6.519178</td>
      <td>1.510712</td>
      <td>2.4</td>
      <td>5.70</td>
      <td>6.85</td>
      <td>7.50</td>
      <td>9.6</td>
    </tr>
    <tr>
      <th>IMDB</th>
      <td>146.0</td>
      <td>6.736986</td>
      <td>0.958736</td>
      <td>4.0</td>
      <td>6.30</td>
      <td>6.90</td>
      <td>7.40</td>
      <td>8.6</td>
    </tr>
    <tr>
      <th>Metacritic_user_vote_count</th>
      <td>146.0</td>
      <td>185.705479</td>
      <td>316.606515</td>
      <td>4.0</td>
      <td>33.25</td>
      <td>72.50</td>
      <td>168.50</td>
      <td>2375.0</td>
    </tr>
    <tr>
      <th>IMDB_user_vote_count</th>
      <td>146.0</td>
      <td>42846.205479</td>
      <td>67406.509171</td>
      <td>243.0</td>
      <td>5627.00</td>
      <td>19103.00</td>
      <td>45185.75</td>
      <td>334164.0</td>
    </tr>
  </tbody>
</table>
</div>



### Rotten Tomatoes

Let's first take a look at Rotten Tomatoes. RT has two sets of reviews, their critics reviews (ratings published by official critics) and user reviews. 


```python
#  a scatterplot exploring the relationship between RT Critic reviews and RT User reviews
plt.figure(figsize=(12,5))
sns.scatterplot(data=all_sites, x="RottenTomatoes", y="RottenTomatoes_User")
plt.xlim(0,100)
plt.ylim(0,100)
plt.title("The relationship between RT Critic reviews and RT User reviews")
```




    Text(0.5, 1.0, 'The relationship between RT Critic reviews and RT User reviews')




    
![png](/assets/images/RatingRealitiesProject/output_45_1.png)
    


Difference between critics rating and users rating for Rotten Tomatoes - Rotten_Diff


```python
# Difference between critics rating and users rating for Rotten Tomatoes
all_sites["Rotten_Diff"] = all_sites["RottenTomatoes"] - all_sites["RottenTomatoes_User"]
all_sites.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>RottenTomatoes</th>
      <th>RottenTomatoes_User</th>
      <th>Metacritic</th>
      <th>Metacritic_User</th>
      <th>IMDB</th>
      <th>Metacritic_user_vote_count</th>
      <th>IMDB_user_vote_count</th>
      <th>Rotten_Diff</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Avengers: Age of Ultron (2015)</td>
      <td>74</td>
      <td>86</td>
      <td>66</td>
      <td>7.1</td>
      <td>7.8</td>
      <td>1330</td>
      <td>271107</td>
      <td>-12</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Cinderella (2015)</td>
      <td>85</td>
      <td>80</td>
      <td>67</td>
      <td>7.5</td>
      <td>7.1</td>
      <td>249</td>
      <td>65709</td>
      <td>5</td>
    </tr>
    <tr>
      <th>2</th>
      <td>Ant-Man (2015)</td>
      <td>80</td>
      <td>90</td>
      <td>64</td>
      <td>8.1</td>
      <td>7.8</td>
      <td>627</td>
      <td>103660</td>
      <td>-10</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Do You Believe? (2015)</td>
      <td>18</td>
      <td>84</td>
      <td>22</td>
      <td>4.7</td>
      <td>5.4</td>
      <td>31</td>
      <td>3136</td>
      <td>-66</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Hot Tub Time Machine 2 (2015)</td>
      <td>14</td>
      <td>28</td>
      <td>29</td>
      <td>3.4</td>
      <td>5.1</td>
      <td>88</td>
      <td>19560</td>
      <td>-14</td>
    </tr>
  </tbody>
</table>
</div>



Absolute mean difference between the critics rating versus the user rating


```python
# absolute mean difference between the critics rating versus the user rating
all_sites["Rotten_Diff"].abs().mean()
```




    15.095890410958905




```python
# The distribution of the differences between RT Critics Score and RT User Score
plt.figure(figsize=(12,5),dpi=200)
sns.histplot(x=all_sites["Rotten_Diff"], kde=True)
plt.title("Difference between RT Critics Score and RT User Score")
```




    Text(0.5, 1.0, 'Difference between RT Critics Score and RT User Score')




    
![png](/assets/images/RatingRealitiesProject/output_50_1.png)
    



```python
# a distribution showing the absolute value difference between Critics and Users on Rotten Tomatoes
plt.figure(figsize=(12,5),dpi=200)
sns.histplot(x=all_sites["Rotten_Diff"].abs(), kde=True)
plt.title("Absolute Difference between RT Critics Score and RT User Score")
```




    Text(0.5, 1.0, 'Absolute Difference between RT Critics Score and RT User Score')




    
![png](/assets/images/RatingRealitiesProject/output_51_1.png)
    


Top 5 movies users rated higher than critics on average (Users Love but Critics Hate)


```python
# Top 5 movies users rated higher than critics on average
# Users Love but Critics Hate
all_sites.sort_values(by=["Rotten_Diff"])[:5][["FILM", "Rotten_Diff"]]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>Rotten_Diff</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>3</th>
      <td>Do You Believe? (2015)</td>
      <td>-66</td>
    </tr>
    <tr>
      <th>85</th>
      <td>Little Boy (2015)</td>
      <td>-61</td>
    </tr>
    <tr>
      <th>134</th>
      <td>The Longest Ride (2015)</td>
      <td>-42</td>
    </tr>
    <tr>
      <th>105</th>
      <td>Hitman: Agent 47 (2015)</td>
      <td>-42</td>
    </tr>
    <tr>
      <th>125</th>
      <td>The Wedding Ringer (2015)</td>
      <td>-39</td>
    </tr>
  </tbody>
</table>
</div>



The top 5 movies critics scores higher than users on average (Critics love, but Users Hate)


```python
# The top 5 movies critics scores higher than users on average
# Critics love, but Users Hate
all_sites.sort_values(by=["Rotten_Diff"], ascending=False)[:5][["FILM", "Rotten_Diff"]]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>Rotten_Diff</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>69</th>
      <td>Mr. Turner (2014)</td>
      <td>42</td>
    </tr>
    <tr>
      <th>112</th>
      <td>It Follows (2015)</td>
      <td>31</td>
    </tr>
    <tr>
      <th>115</th>
      <td>While We're Young (2015)</td>
      <td>31</td>
    </tr>
    <tr>
      <th>145</th>
      <td>Kumiko, The Treasure Hunter (2015)</td>
      <td>24</td>
    </tr>
    <tr>
      <th>37</th>
      <td>Welcome to Me (2015)</td>
      <td>24</td>
    </tr>
  </tbody>
</table>
</div>



## MetaCritic

Now let's take a quick look at the ratings from MetaCritic. Metacritic also shows an average user rating versus their official displayed rating.


```python
# Metacritic Rating versus the Metacritic User rating
plt.figure(figsize=(12,5),dpi=200)
sns.scatterplot(data=all_sites, x="Metacritic",y="Metacritic_User")
plt.xlim(0,100)
plt.ylim(0,10)
plt.title("Relationship between Metacritic and Metacritic user rating")
```




    Text(0.5, 1.0, 'Relationship between Metacritic and Metacritic user rating')




    
![png](/assets/images/RatingRealitiesProject/output_57_1.png)
    


## IMDB

Finally let's explore IMDB. Notice that both Metacritic and IMDB report back vote counts. Let's analyze the most popular movies.


```python
# The relationship between vote counts on MetaCritic versus vote counts on IMDB
plt.figure(figsize=(12,5),dpi=200)
sns.scatterplot(data=all_sites, x="Metacritic_user_vote_count",y="IMDB_user_vote_count")
plt.title("The relationship between vote counts on MetaCritic and vote counts on IMDB")
```




    Text(0.5, 1.0, 'The relationship between vote counts on MetaCritic and vote counts on IMDB')




    
![png](/assets/images/RatingRealitiesProject/output_59_1.png)
    


Movie that has the highest IMDB user vote count


```python
# Movie that has the highest IMDB user vote count
all_sites[all_sites["IMDB_user_vote_count"] == all_sites["IMDB_user_vote_count"].max()]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>RottenTomatoes</th>
      <th>RottenTomatoes_User</th>
      <th>Metacritic</th>
      <th>Metacritic_User</th>
      <th>IMDB</th>
      <th>Metacritic_user_vote_count</th>
      <th>IMDB_user_vote_count</th>
      <th>Rotten_Diff</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>14</th>
      <td>The Imitation Game (2014)</td>
      <td>90</td>
      <td>92</td>
      <td>73</td>
      <td>8.2</td>
      <td>8.1</td>
      <td>566</td>
      <td>334164</td>
      <td>-2</td>
    </tr>
  </tbody>
</table>
</div>



 Movie has the highest Metacritic User Vote count


```python
# Movie has the highest Metacritic User Vote count
all_sites[all_sites["Metacritic_user_vote_count"] == all_sites["Metacritic_user_vote_count"].max()]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>RottenTomatoes</th>
      <th>RottenTomatoes_User</th>
      <th>Metacritic</th>
      <th>Metacritic_User</th>
      <th>IMDB</th>
      <th>Metacritic_user_vote_count</th>
      <th>IMDB_user_vote_count</th>
      <th>Rotten_Diff</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>88</th>
      <td>Mad Max: Fury Road (2015)</td>
      <td>97</td>
      <td>88</td>
      <td>89</td>
      <td>8.7</td>
      <td>8.3</td>
      <td>2375</td>
      <td>292023</td>
      <td>9</td>
    </tr>
  </tbody>
</table>
</div>



## Fandago Scores vs. All Sites

Finally let's begin to explore whether or not Fandango artificially displays higher ratings than warranted to boost ticket sales.


```python
# Inner join to merge together both DataFrames based on the FILM column
df = pd.merge(fandango, all_sites, on="FILM", how="inner")
```

Merged table structure (all_sites and fandango)


```python
df.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>STARS</th>
      <th>RATING</th>
      <th>VOTES</th>
      <th>Year</th>
      <th>STARS_DIFF</th>
      <th>RottenTomatoes</th>
      <th>RottenTomatoes_User</th>
      <th>Metacritic</th>
      <th>Metacritic_User</th>
      <th>IMDB</th>
      <th>Metacritic_user_vote_count</th>
      <th>IMDB_user_vote_count</th>
      <th>Rotten_Diff</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Fifty Shades of Grey (2015)</td>
      <td>4.0</td>
      <td>3.9</td>
      <td>34846</td>
      <td>2015</td>
      <td>0.1</td>
      <td>25</td>
      <td>42</td>
      <td>46</td>
      <td>3.2</td>
      <td>4.2</td>
      <td>778</td>
      <td>179506</td>
      <td>-17</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Jurassic World (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>34390</td>
      <td>2015</td>
      <td>0.0</td>
      <td>71</td>
      <td>81</td>
      <td>59</td>
      <td>7.0</td>
      <td>7.3</td>
      <td>1281</td>
      <td>241807</td>
      <td>-10</td>
    </tr>
    <tr>
      <th>2</th>
      <td>American Sniper (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>34085</td>
      <td>2015</td>
      <td>0.2</td>
      <td>72</td>
      <td>85</td>
      <td>72</td>
      <td>6.6</td>
      <td>7.4</td>
      <td>850</td>
      <td>251856</td>
      <td>-13</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Furious 7 (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>33538</td>
      <td>2015</td>
      <td>0.2</td>
      <td>81</td>
      <td>84</td>
      <td>67</td>
      <td>6.8</td>
      <td>7.4</td>
      <td>764</td>
      <td>207211</td>
      <td>-3</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Inside Out (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>15749</td>
      <td>2015</td>
      <td>0.0</td>
      <td>98</td>
      <td>90</td>
      <td>94</td>
      <td>8.9</td>
      <td>8.6</td>
      <td>807</td>
      <td>96252</td>
      <td>8</td>
    </tr>
  </tbody>
</table>
</div>



Table info


```python
df.info()
```

    <class 'pandas.core.frame.DataFrame'>
    Int64Index: 145 entries, 0 to 144
    Data columns (total 14 columns):
     #   Column                      Non-Null Count  Dtype  
    ---  ------                      --------------  -----  
     0   FILM                        145 non-null    object 
     1   STARS                       145 non-null    float64
     2   RATING                      145 non-null    float64
     3   VOTES                       145 non-null    int64  
     4   Year                        145 non-null    object 
     5   STARS_DIFF                  145 non-null    float64
     6   RottenTomatoes              145 non-null    int64  
     7   RottenTomatoes_User         145 non-null    int64  
     8   Metacritic                  145 non-null    int64  
     9   Metacritic_User             145 non-null    float64
     10  IMDB                        145 non-null    float64
     11  Metacritic_user_vote_count  145 non-null    int64  
     12  IMDB_user_vote_count        145 non-null    int64  
     13  Rotten_Diff                 145 non-null    int64  
    dtypes: float64(5), int64(7), object(2)
    memory usage: 17.0+ KB
    

### Normalizing columns to Fandango STARS and RATINGS 0-5 

Notice that RT, Metacritic, and IMDB don't use a score between 0-5 stars like Fandango does. In order to do a fair comparison, we need to *normalize* these values so they all fall between 0-5 stars and the relationship between reviews stays the same.


```python
# Normalizing by the current scale level
df["RT_norm"] = df["RottenTomatoes"] / 20
df["RTUser_norm"] = df["RottenTomatoes_User"] / 20
df["Meta_norm"] = df["Metacritic"] / 20
df["MetaUser_norm"] = df["Metacritic_User"] / 2
df["Imdb_norm"] = df["IMDB"] / 2
```

Merged table with normalized ratings


```python
df = df[["FILM", "STARS","RATING","RT_norm","RTUser_norm","Meta_norm","MetaUser_norm","Imdb_norm"]]
df.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>STARS</th>
      <th>RATING</th>
      <th>RT_norm</th>
      <th>RTUser_norm</th>
      <th>Meta_norm</th>
      <th>MetaUser_norm</th>
      <th>Imdb_norm</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Fifty Shades of Grey (2015)</td>
      <td>4.0</td>
      <td>3.9</td>
      <td>1.25</td>
      <td>2.10</td>
      <td>2.30</td>
      <td>1.60</td>
      <td>2.10</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Jurassic World (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>3.55</td>
      <td>4.05</td>
      <td>2.95</td>
      <td>3.50</td>
      <td>3.65</td>
    </tr>
    <tr>
      <th>2</th>
      <td>American Sniper (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>3.60</td>
      <td>4.25</td>
      <td>3.60</td>
      <td>3.30</td>
      <td>3.70</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Furious 7 (2015)</td>
      <td>5.0</td>
      <td>4.8</td>
      <td>4.05</td>
      <td>4.20</td>
      <td>3.35</td>
      <td>3.40</td>
      <td>3.70</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Inside Out (2015)</td>
      <td>4.5</td>
      <td>4.5</td>
      <td>4.90</td>
      <td>4.50</td>
      <td>4.70</td>
      <td>4.45</td>
      <td>4.30</td>
    </tr>
  </tbody>
</table>
</div>



### Comparing Distribution of Scores Across Sites


Now the moment of truth! Does Fandango display abnormally high ratings? We already know it pushs displayed RATING higher than STARS, but are the ratings themselves higher than average?


```python
def move_legend(ax, new_loc, **kws):
    old_legend = ax.legend_
    handles = old_legend.legend_handles
    labels = [t.get_text() for t in old_legend.get_texts()]
    title = old_legend.get_title().get_text()
    ax.legend(handles, labels, loc=new_loc, title=title, **kws)
```


```python
fig, ax = plt.subplots(figsize=(15,6),dpi=150)
sns.kdeplot(data=df,clip=[0,5],fill=True,palette='Set1',ax=ax)
move_legend(ax, "upper left")
plt.title("Various rating distributions")
```




    Text(0.5, 1.0, 'Various rating distributions')




    
![png](/assets/images/RatingRealitiesProject/output_76_1.png)
    


**Clearly Fandango has an uneven distribution. We can also see that RT critics have the most uniform distribution. Let's directly compare these two.** 


```python
#CODE HERE
plt.figure(figsize=(12,5))
sns.kdeplot(data=df, x="STARS", label="STARS", fill=True)
sns.kdeplot(data=df, x="RT_norm", label="RT_norm", fill=True)
plt.legend(loc='upper left')
plt.title("Distributions of STARS and RottenTomatoes ratings")
```




    Text(0.5, 1.0, 'Distributions of STARS and RottenTomatoes ratings')




    
![png](/assets/images/RatingRealitiesProject/output_78_1.png)
    



```python
# Histogram plot comparig all normalized scores
plt.subplots(figsize=(15,6),dpi=150)
sns.histplot(df,bins=50)
plt.title("Various rating distributions")
```




    Text(0.5, 1.0, 'Various rating distributions')




    
![png](/assets/images/RatingRealitiesProject/output_79_1.png)
    



```python
# Clustermap visialzation of all normalized scores
sns.clustermap(df[["STARS","RATING","RT_norm","RTUser_norm","Meta_norm","MetaUser_norm","Imdb_norm"]],cmap='magma',col_cluster=False)
plt.title("Clustermap visialzation of all normalized scores")
```




    Text(0.5, 1.0, 'Clustermap visialzation of all normalized scores')




    
![png](/assets/images/RatingRealitiesProject/output_80_1.png)
    


**Clearly Fandango is rating movies much higher than other sites, especially considering that it is then displaying a rounded up version of the rating. Let's examine the top 10 worst movies based off the Rotten Tomatoes Critic Ratings.**

The top 10 worst movies based of the Rotten Tomatoes Critics Ratings


```python
df.nsmallest(10,'RT_norm')
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>FILM</th>
      <th>STARS</th>
      <th>RATING</th>
      <th>RT_norm</th>
      <th>RTUser_norm</th>
      <th>Meta_norm</th>
      <th>MetaUser_norm</th>
      <th>Imdb_norm</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>49</th>
      <td>Paul Blart: Mall Cop 2 (2015)</td>
      <td>3.5</td>
      <td>3.5</td>
      <td>0.25</td>
      <td>1.80</td>
      <td>0.65</td>
      <td>1.20</td>
      <td>2.15</td>
    </tr>
    <tr>
      <th>84</th>
      <td>Hitman: Agent 47 (2015)</td>
      <td>4.0</td>
      <td>3.9</td>
      <td>0.35</td>
      <td>2.45</td>
      <td>1.40</td>
      <td>1.65</td>
      <td>2.95</td>
    </tr>
    <tr>
      <th>54</th>
      <td>Hot Pursuit (2015)</td>
      <td>4.0</td>
      <td>3.7</td>
      <td>0.40</td>
      <td>1.85</td>
      <td>1.55</td>
      <td>1.85</td>
      <td>2.45</td>
    </tr>
    <tr>
      <th>25</th>
      <td>Taken 3 (2015)</td>
      <td>4.5</td>
      <td>4.1</td>
      <td>0.45</td>
      <td>2.30</td>
      <td>1.30</td>
      <td>2.30</td>
      <td>3.05</td>
    </tr>
    <tr>
      <th>28</th>
      <td>Fantastic Four (2015)</td>
      <td>3.0</td>
      <td>2.7</td>
      <td>0.45</td>
      <td>1.00</td>
      <td>1.35</td>
      <td>1.25</td>
      <td>2.00</td>
    </tr>
    <tr>
      <th>50</th>
      <td>The Boy Next Door (2015)</td>
      <td>4.0</td>
      <td>3.6</td>
      <td>0.50</td>
      <td>1.75</td>
      <td>1.50</td>
      <td>2.75</td>
      <td>2.30</td>
    </tr>
    <tr>
      <th>87</th>
      <td>Unfinished Business (2015)</td>
      <td>3.5</td>
      <td>3.2</td>
      <td>0.55</td>
      <td>1.35</td>
      <td>1.60</td>
      <td>1.90</td>
      <td>2.70</td>
    </tr>
    <tr>
      <th>88</th>
      <td>The Loft (2015)</td>
      <td>4.0</td>
      <td>3.6</td>
      <td>0.55</td>
      <td>2.00</td>
      <td>1.20</td>
      <td>1.20</td>
      <td>3.15</td>
    </tr>
    <tr>
      <th>77</th>
      <td>Seventh Son (2015)</td>
      <td>3.5</td>
      <td>3.2</td>
      <td>0.60</td>
      <td>1.75</td>
      <td>1.50</td>
      <td>1.95</td>
      <td>2.75</td>
    </tr>
    <tr>
      <th>78</th>
      <td>Mortdecai (2015)</td>
      <td>3.5</td>
      <td>3.2</td>
      <td>0.60</td>
      <td>1.50</td>
      <td>1.35</td>
      <td>1.60</td>
      <td>2.75</td>
    </tr>
  </tbody>
</table>
</div>



**Visualization the distribution of ratings across all sites for the top 10 worst movies.**


```python
plt.figure(figsize=(15,6),dpi=150)
worst_films = df.nsmallest(10,'RT_norm').drop('FILM',axis=1)
sns.kdeplot(data=worst_films,clip=[0,5],fill=True,palette='Set1')
plt.title("Ratings for RT Critic's 10 Worst Reviewed Films");
```


    
![png](/assets/images/RatingRealitiesProject/output_85_0.png)
    


---
----

<img src="https://upload.wikimedia.org/wikipedia/en/6/6f/Taken_3_poster.jpg">

**Final thoughts: Wow! Fandango is showing around 3-4 star ratings for films that are clearly bad! Notice the biggest offender, [Taken 3!](https://www.youtube.com/watch?v=tJrfImRCHJ0). Fandango is displaying 4.5 stars on their site for a film with an [average rating of 1.86](https://en.wikipedia.org/wiki/Taken_3#Critical_response) across the other platforms!**

Taken 3 rating across platforms


```python
# Taken 3 rating across platforms
df.iloc[25]
```




    FILM             Taken 3 (2015)
    STARS                       4.5
    RATING                      4.1
    RT_norm                    0.45
    RTUser_norm                 2.3
    Meta_norm                   1.3
    MetaUser_norm               2.3
    Imdb_norm                  3.05
    Name: 25, dtype: object




```python
# Comparison between fandango scores and average scores from all sites
taken3_stars = df.iloc[25]["STARS"]
take3_all_sites_avg = df.iloc[25][["RT_norm", "RTUser_norm", "Meta_norm", "MetaUser_norm", "Imdb_norm"]].mean().round(1)
taken3_all_sites = df.iloc[25][["RT_norm", "RTUser_norm", "Meta_norm", "MetaUser_norm", "Imdb_norm"]]
f"Fandango score for movie 'Taken 3': {taken3_stars}, all sites average score: {take3_all_sites_avg}"
```




    "Fandango score for movie 'Taken 3': 4.5, all sites average score: 1.9"




```python
dfhelper = pd.concat([df['RT_norm'], df['RTUser_norm'], df['Meta_norm'], df['MetaUser_norm'], df['Imdb_norm']], axis=1)
dfhelper = dfhelper.stack().reset_index()
dfhelper = dfhelper.rename(columns={0: 'OtherScores'})
```


```python
x=dfhelper["OtherScores"]
y=df["STARS"]

df_for_ttest = pd.concat([x,y], axis=1)
```


```python
fig, axes = plt.subplots(nrows=1, ncols=2)

sns.kdeplot(x=x, ax=axes[0], fill=True)
sns.kdeplot(x=y, ax=axes[1], fill=True)

axes[0].set_title("Other Scores distribution", loc="center")
axes[1].set_title("STARS distribution", loc="center")

axes[0].set_xlim(0,5)
axes[1].set_xlim(0,5)
plt.tight_layout()
plt.show()
```


    
![png](/assets/images/RatingRealitiesProject/output_92_0.png)
    



```python
plt.figure(figsize=(12,4),dpi=150)

x=dfhelper["OtherScores"]
y=df["STARS"]

sns.kdeplot(x=x, fill=True)
sns.kdeplot(x=y, fill=True)

plt.xlim(0,5)
plt.title("Distributions of STARS and Other Scores", loc="center")
```




    Text(0.5, 1.0, 'Distributions of STARS and Other Scores')




    
![png](/assets/images/RatingRealitiesProject/output_93_1.png)
    



```python
# Import the library
import scipy.stats as stats

# Perform the two sample t-test with equal variances
t, p = stats.ttest_ind(a=dfhelper["OtherScores"], b=df["STARS"], equal_var=False)
m_Stars = x.mean()
m_OtherScores = y.mean()

f"Average Stars = {m_Stars.round(2)}, Average OtherScores = {m_OtherScores.round(2)}, t-value = {t.round(2)}, p < {p.round(2)}"
```




    'Average Stars = 3.15, Average OtherScores = 4.09, t-value = -15.91, p < 0.0'




```python
"almost 1 whole point away of each other"
```




    'almost 1 whole point away of each other'



## What have we learned? 
The difference of 1 point in the rating score can play a big role in the perception of the quality against the common rating standard (on a scale 1-5). One point of difference in the rating score obviously made people suspicious of investigating the data quality. 

This analysis made clear how questioning can discover interesting trends in data.   

Bottom line - Do not be too obvious when biasing information in your direction!

### Remaining questions
1. What is the differential threshold when people will notice the trend between the distributions? 
2. In other words, when people will notice that Fendango rates the moves more favourably towards (certain) movies than the other platforms?
3. What is the optimal rate to manipulate movie (or other) ratings over time so the manipulations stay disguised, but effective?

