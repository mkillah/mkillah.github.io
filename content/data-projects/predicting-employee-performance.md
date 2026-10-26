# Predicting employee performance

*Professional · HR analytics · Python and scikit-learn*

## Overview

### Question

Which employee traits are linked to hitting performance targets (KPIs), and can we predict this ahead of time?

### At a glance

- **Data:** about 48,600 employee records after cleaning.
- **Outcome:** whether an employee met more than 80% of their KPIs.
- **Main finding:** last year's performance rating is by far the strongest signal that an employee will keep performing well.
- **Result:** a logistic regression model that is right 72% of the time and gives a probability for any individual employee.

### Business problem

Organisations want to move from gut-feel performance decisions to decisions backed by data. The goals were to:

- understand which employee traits go along with strong performance
- build a simple tool that flags employees likely to hit their targets, to support coaching, training, and promotion decisions
- turn the analysis into something HR teams can use, not just a statistics exercise

## Data

- **Source:** Analytics Vidhya HR practice dataset.
- **Size:** 54,808 employee records (48,660 after cleaning).
- **Variables:** department, region, education, gender, recruitment channel, trainings completed, age, previous year's rating, length of service, KPI attainment, awards won, average training score, and promotion history.

The data files were combined and incomplete records removed before analysis.

## Methods

#### Data cleaning

Combining the source files and removing records with missing values.

#### Exploratory data analysis

Looking at how age, tenure, training scores, and past ratings are distributed and how they relate to hitting KPI targets.

#### Correlation

Checking whether the predictors overlap, so each one adds its own information to the model.

#### Logistic regression

A well-established, easy-to-explain model for yes/no outcomes. Predictors: age, previous year's rating, length of service, average training score, and number of trainings.

#### Model evaluation

Confusion matrix, precision and recall, ROC curve, and precision-recall curve on a held-out test set.

## Results

### Are the traits independent?

<figure>
  <img src="assets/img/hr-performance/correlation-heatmap.png" alt="Correlation heatmap of age, previous year rating, length of service, and average training score">
  <figcaption>Correlations between the numeric predictors.</figcaption>
</figure>

The traits are largely independent. The only notable link is between age and length of service (r = 0.62), which is expected. Every other pair is close to zero, so each trait adds its own information rather than repeating another.

### How are the traits distributed?

<figure>
  <img src="assets/img/hr-performance/feature-distributions.png" alt="Histograms of age, previous year rating, length of service, and average training score">
  <figcaption>Distributions of the four numeric predictors.</figcaption>
</figure>

Most employees are in their late 20s to late 30s and have been with the company under 10 years. A rating of 3 is by far the most common, and training scores cluster in three bands around 50, 60, and 80.

### Which traits matter most?

<figure>
  <img src="assets/img/hr-performance/coefficients.png" alt="Bar chart of logistic regression coefficients by feature">
  <figcaption>Logistic regression coefficients for each predictor.</figcaption>
</figure>

Last year's performance rating carries far more weight than anything else. Training score and age have small positive effects; longer service and more trainings have small negative effects.

### How accurate is the model?

<figure>
  <img src="assets/img/hr-performance/confusion-matrix.png" alt="Confusion matrix showing 2661 true negatives, 456 false positives, 923 false negatives, 826 true positives">
  <figcaption>Confusion matrix on the test set (0 = missed target, 1 = hit target).</figcaption>
</figure>

The model correctly identified 2,661 employees who missed their target and 826 who hit it. It was wrong for 1,379 employees (456 + 923).

|  | Missed target | Hit target |
| --- | --- | --- |
| Precision (how often a prediction was right) | 74% | 64% |
| Recall (how many real cases it caught) | 85% | 47% |

- **Overall accuracy is 72%.**
- The model is better at spotting who will *miss* their target than who will *hit* it, which matters if it is used to flag top performers.

### How well does it separate the two groups?

<figure>
  <img src="assets/img/hr-performance/roc-curve.png" alt="ROC curve with an AUC of 0.66">
  <figcaption>ROC curve (AUC = 0.66).</figcaption>
</figure>

An AUC of 0.66 (where 0.5 is a coin flip and 1.0 is perfect) means the model has a real, moderate ability to tell high and low performers apart: useful, but not a substitute for human judgment.

<figure>
  <img src="assets/img/hr-performance/precision-recall.png" alt="Precision-recall curve">
  <figcaption>Precision-recall curve: the trade-off between catching more top performers and raising more false alarms.</figcaption>
</figure>

### Using it for one employee

For a sample profile (age 45, previous rating 3 out of 5, 7 years of service, training score 89), the model gave a ~99.9% chance of hitting the target. This is the kind of number a manager could use as one input in a coaching or promotion conversation.

## Recommendations

- Treat **last year's rating** as an early signal in performance conversations, rather than waiting for a full review cycle.
- Use the model to **support, not replace**, manager judgment: it is noticeably less reliable at catching top performers than at catching those likely to struggle.
- For high-stakes decisions such as promotions, pair the model's flag with a manager's review, especially for borderline cases.
- Add more data, such as engagement scores or project complexity, to improve how well the model spots top performers.
