# Schizophrenic and non-schizophrenic homicide offenders

*Academic · Forensic psychiatry · Python and SciPy*

## Overview

### Question

Do offenders with schizophrenia who committed homicide or attempted homicide differ from offenders without schizophrenia in their background, the way the crime was committed, and their forensic-psychiatric profile?

### At a glance

- **Data:** 103 offenders who underwent a forensic-psychiatric evaluation (24 with schizophrenia, 79 without).
- **Comparison:** two groups, compared on about 20 characteristics.
- **Main finding:** the groups differ less in *how* the crime was committed and more in *who* the offender is: alcohol and drug use, personality disorders, and the assessment of criminal responsibility.

## Data

Anonymised case records, one row per offender, identified only by a code.

| Area | Variables |
| --- | --- |
| Sociodemographic | age, sex, education, marital status |
| Criminological | offence, weapon, time and place, co-offenders, relationship with the victim, number of victims, prior conflict, aggressiveness, impulsivity, alcohol or drugs at the time |
| Forensic-psychiatric | addiction, prior treatment, personality disorder, intellectual ability, low frustration tolerance, assessment of criminal responsibility |

Answers recorded as "no data" were left out of the test for that variable.

## Methods

#### Descriptive statistics

Medians and frequency tables for each group.

#### Normality check and Mann–Whitney U test

Age was not normally distributed in either group (Shapiro–Wilk, *p* < .05), so the groups were compared with the non-parametric Mann–Whitney U test.

#### Chi-square tests

All categorical characteristics were compared between the groups with chi-square tests of independence.

## Results

### Background

| Characteristic | Test | *p* |
| --- | --- | --- |
| Age (median 36 vs 38) | U = 1090 | .27 |
| Sex | χ²(1) = 0.84 | .36 |
| Education | χ²(3) = 3.82 | .28 |
| **Marital status** | **χ²(4) = 10.92** | **.03** |

The groups were similar in age, sex, and education. The one difference was marital status: 22 of 24 offenders with schizophrenia (92%) were single, compared with 44 of 79 (56%) without schizophrenia.

### The crime

| Characteristic | Test | *p* |
| --- | --- | --- |
| Weapon | χ²(5) = 4.85 | .43 |
| Relationship with the victim | χ²(6) = 10.68 | .10 |
| Time | χ²(5) = 3.80 | .58 |
| Place (public or private) | χ²(1) = 1.20 | .27 |
| Co-offenders | χ²(1) = 2.42 | .12 |
| Aggressiveness | χ²(1) = 1.37 | .24 |
| Impulsivity | χ²(1) = 0.03 | .86 |
| **Prior conflict with the victim** | **χ²(1) = 5.22** | **.02** |
| **Alcohol or drugs at the time** | **χ²(3) = 15.34** | **< .01** |

How, when, and where the crime was committed did not differ between the groups. The clearest difference was substance use: 42 of 75 offenders without schizophrenia (56%) were under the influence of alcohol or drugs, compared with 2 of 22 (9%) with schizophrenia. A prior conflict or argument with the victim also differed between the groups.

The type of offence (homicide or attempted homicide), the number of victims, and whether the victim had been abused did not differ (all *p* > .50).

### Forensic-psychiatric profile

| Characteristic | Test | *p* |
| --- | --- | --- |
| **Addiction** | **χ²(1) = 8.89** | **< .01** |
| Prior treatment | χ²(1) = 2.63 | .11 |
| **Personality disorder** | **χ²(1) = 17.83** | **< .001** |
| Intellectual ability | χ²(3) = 5.34 | .15 |
| Low frustration tolerance | χ²(1) = 0.32 | .57 |
| **Criminal responsibility** | **χ²(3) = 87.54** | **< .001** |

- **Criminal responsibility:** 23 of 24 offenders with schizophrenia were found not criminally responsible, compared with 2 of 79 without schizophrenia. Most offenders without schizophrenia were found to have diminished responsibility.
- **Personality disorder:** diagnosed in 44 of 79 offenders without schizophrenia (56%), but only 1 of 24 with schizophrenia. Most were cluster B disorders (37 of 46).
- **Addiction** was also more common in one group, while prior treatment and intellectual ability did not differ.

## Conclusions

- Offenders with and without schizophrenia look alike in age, sex, education, and how the crime was carried out.
- They differ in the factors around the crime: offenders without schizophrenia were far more often under the influence of alcohol or drugs and more often had a personality disorder, while offenders with schizophrenia were almost always single.
- As expected, schizophrenia was closely tied to being found not criminally responsible.

### Limitations

- The schizophrenia group is small (24 people), so some tables have very few cases per cell and the chi-square results should be read with care. Fisher's exact test would be a stricter check.
- Many tests were run without correcting for multiple comparisons, so borderline results (such as marital status, *p* = .03) may not hold up.
