# Funeral services market in Croatia

*Professional · Market analysis · Web scraping and Python*

## Overview

### Question

How big is the funeral services market in Croatia, where is demand concentrated, and who are the competitors?

### At a glance

- **Data:** collected mostly by web scraping: 2,349 cemeteries, 1,981 parishes, burial schedules, obituary portals, and price lists, combined with official mortality statistics.
- **Market:** about 57,000 deaths a year, an indicative EUR 72 million a year for the core burial service alone.
- **Main finding:** demand is highly concentrated. Four counties account for 41% of deaths, and a few large urban cemeteries handle most burials.
- **Data quality:** checking the scraped data showed that one obituary dataset kept capturing the same page, which changed how it could be used.

### Business problem

The analysis supported a business entering the funeral services space with digital obituaries and related services. There was no ready-made dataset, so the first task was to build one. The goals were to:

- map the market's infrastructure (cemeteries and religious communities)
- measure demand by region and check it against real burial activity
- understand the existing competitors and price levels

## Data

- **Cemeteries:** 2,349 records scraped page by page from an online cemetery directory (2,304 after review).
- **Parishes and religious communities:** 1,981 records scraped from an online parish directory.
- **Settlements:** the official list of 7,010 settlements, municipalities, and counties, used to assign each cemetery to a county.
- **Deaths by county:** 2022 figures from the Croatian Bureau of Statistics.
- **Burial schedules:** 146 ceremonies scraped from cemetery operators in Zagreb, Rijeka, Split, and Osijek (4–11 March 2024).
- **Obituaries:** 579 listings scraped daily from the Slobodna Dalmacija obituary portal over 30 days.
- **Competitors and prices:** a review of 13 obituary portals and published burial price lists from 7 cities.

The burial and obituary data contain names of deceased people. Names were used only to remove duplicates and are never shown.

## Methods

#### Web scraping

Collecting cemetery, parish, burial schedule, and obituary data from public websites, including paginated directories.

#### Data cleaning

Splitting combined text fields (name, place, type of local unit), parsing labelled contact blocks with regular expressions, and standardising column names that changed between scrapes.

#### Data enrichment

Matching each cemetery to a county using the official settlements list, recovering missing coordinates from map links, and filling missing addresses by reverse geocoding with the Google Maps API.

#### Descriptive statistics

Counts, rates, and shares per county, city, and cemetery, such as deaths per cemetery per year.

#### Data validation

Checking scraped data against an independent source (official statistics) and de-duplicating repeated records.

#### Data visualization

Maps and bar charts for a business audience.

## Results

### Infrastructure

<figure>
  <img src="assets/img/funeral-market/cemetery-map.png" alt="Scatter map of 2,188 cemetery locations tracing the outline of Croatia">
  <figcaption>Scraped cemetery locations (one record with swapped coordinates removed).</figcaption>
</figure>

The scraped coordinates trace the outline of Croatia. Cemeteries are dense along the coast and islands, around Zagreb, and in Slavonia. Fewer than 6% of cemeteries publish any contact details, while about 80% of parishes list a phone number and 38% an email address.

<figure>
  <img src="assets/img/funeral-market/cemeteries-by-county.png" alt="Bar chart of the number of cemeteries per county">
  <figcaption>Number of cemeteries per county.</figcaption>
</figure>

Split-Dalmatia has by far the most cemeteries (347). The City of Zagreb has only 31, even though it is the largest market.

### Demand

<figure>
  <img src="assets/img/funeral-market/deaths-by-county.png" alt="Bar chart of deaths per county in 2022">
  <figcaption>Deaths per county in 2022 (Croatian Bureau of Statistics).</figcaption>
</figure>

Croatia recorded 56,979 deaths in 2022, about 156 a day. Four counties (City of Zagreb, Split-Dalmatia, Primorje-Gorski Kotar, and Osijek-Baranja) account for 41% of them.

<figure>
  <img src="assets/img/funeral-market/deaths-per-cemetery.png" alt="Bar chart of average burials per cemetery per year by county">
  <figcaption>Average burials per cemetery per year, by county.</figcaption>
</figure>

Demand per cemetery is extremely uneven. An average cemetery in Zagreb handles about **311 burials a year**, almost one a day. In counties with many small cemeteries, such as Dubrovnik-Neretva, Lika-Senj, and Šibenik-Knin, the average is 10 or fewer.

### Burial activity

<figure>
  <img src="assets/img/funeral-market/zagreb-burials.png" alt="Bar chart of scheduled burials per working day in Zagreb compared with the official daily average">
  <figcaption>Scheduled burials per working day in Zagreb, 4–11 March 2024.</figcaption>
</figure>

Zagreb's published schedules showed an average of **25 burials per working day**, close to the official average of 26.4 deaths per calendar day. Since most burials happen on working days, the scrape probably missed some ceremonies (7 March looks partial), but it gets the order of magnitude right. Almost half of Zagreb's ceremonies (46%) took place at the crematorium, and three locations handled 77% of the volume.

### Competition

<figure>
  <img src="assets/img/funeral-market/competitor-portals.png" alt="Bar chart of obituaries per day for seven obituary portals">
  <figcaption>Estimated obituaries per day for the portals where data was available.</figcaption>
</figure>

The largest portals publish an estimated 15–31 obituaries a day. For six of the 13 portals no volume could be measured.

**Validating the data.** The Slobodna Dalmacija figure of 19 a day came from the daily scrapes. De-duplicating by name showed only **34 different obituaries across 30 days**: the scraper kept capturing the same first page instead of new posts. So 19 is the size of one listing page, not a daily volume, and the figure cannot be used to compare this portal with the others.

### Prices

<figure>
  <img src="assets/img/funeral-market/prices-by-city.png" alt="Bar chart of average burial and cremation prices by city">
  <figcaption>Average burial and cremation prices by city (EUR).</figcaption>
</figure>

A traditional burial costs EUR 1,000–2,000 on average. Zagreb is the most expensive (EUR 2,000 on average, up to about EUR 12,000). Cremation is much cheaper (EUR 300–400). Multiplying deaths by the average burial price (EUR 1,260) gives an **indicative market of about EUR 72 million a year**. This is a rough estimate: it assumes every death leads to a traditional burial and leaves out flowers, stonework, and other related services.

## Recommendations

- **Launch in Zagreb, then follow the largest counties.** Demand is concentrated in a few regions and a few large cemeteries.
- **Partner with parishes rather than cemeteries.** There are almost 2,000 parishes, and most can be contacted directly. Cemeteries rarely publish contact details.
- **Differentiate from existing obituary portals**, for example with national coverage or by integrating obituaries with cemetery and funeral services.
- **Use operator schedules as a live demand signal**, after closing the coverage gaps found in the scrape.
- **Fix the obituary scraper** so it follows pagination and keeps only new posts, and only then compare portal volumes.
