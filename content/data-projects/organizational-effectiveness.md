# Organizational effectiveness through HR analytics

*Professional · HR analytics · Python*

## Overview

### Question

What does the organization's workforce look like, and where are the risks to performance, satisfaction, and workplace behavior concentrated?

### At a glance

- **Data:** a full HR dataset covering demographics, employment history, pay, and performance.
- **Approach:** four areas (people, performance, satisfaction, behavior) compared department by department.
- **Main finding:** Sales and Production carry the most performance and behavior risk, and satisfaction is about more than pay: the best-paid team is the least satisfied.

### Business problem

People leaders wanted one clear view of organizational health to guide where to focus. The analysis was built around four questions:

- Who works here, and how is the organization structured?
- How well is the organization performing?
- How satisfied are employees?
- Where do problem behaviors (absences, lateness) show up?

## Data

- **Source:** HR dataset built for teaching by Dr. Carla Patalano, used by 200+ HR students.
- **Size:** 311 employees across 6 departments.
- **Variables:** age, gender, marital status, hire and exit dates, reasons for leaving, department, role, manager, salary, performance score, engagement, satisfaction, special projects, absences, and days late.

## Methods

#### Exploratory data analysis

Mapping headcount, gender mix, ethnicity, location, and manager span of control to set a baseline.

#### Descriptive statistics

Department averages for pay, satisfaction, absences, and lateness.

#### Within-group proportions

Performance scores were measured as a **share within each department** rather than raw counts, so the largest departments do not dominate every comparison by size alone.

#### Data visualization

Simple bar charts and cross-tabulations designed for non-technical HR audiences.

## Results

### 1. Who works here

<figure>
  <img src="assets/img/hr-organization/headcount-by-sex.png" alt="Bar chart of headcount by sex: about 135 men and 176 women">
  <figcaption>Headcount by sex.</figcaption>
</figure>

The workforce is 311 people, with more women (176) than men (135). Headcount, ethnicity, location, and reports per manager were mapped first, to set a baseline before looking at performance or satisfaction.

### 2. Performance

<figure>
  <img src="assets/img/hr-organization/performance-by-department.png" alt="Table of performance score percentages within each department">
  <figcaption>Performance scores as a percentage of each department.</figcaption>
</figure>

<figure>
  <img src="assets/img/hr-organization/special-projects.png" alt="Bar chart of special projects count by department">
  <figcaption>Number of special projects per employee, by department.</figcaption>
</figure>

Sales has the largest share of employees on a performance improvement plan (PIP, 12.9%). It also has **no special projects at all**, and Production has very few, which suggests a possible link between fewer growth opportunities and lower performance.

### 3. Satisfaction

<figure>
  <img src="assets/img/hr-organization/satisfaction-by-department.png" alt="Bar chart of average employee satisfaction by department">
  <figcaption>Average employee satisfaction (1–5) by department.</figcaption>
</figure>

<figure>
  <img src="assets/img/hr-organization/salary-by-department.png" alt="Bar chart of average salary by department">
  <figcaption>Average salary by department.</figcaption>
</figure>

Satisfaction is similar across most departments, so pay alone does not explain the differences. The **Executive Office stands out**: it has by far the highest average pay (about $250,000), yet the lowest satisfaction (3.0). Something other than money, such as workload or pressure, may be driving this.

<figure>
  <img src="assets/img/hr-organization/satisfaction-by-performance.png" alt="Bar chart of average satisfaction by performance score">
  <figcaption>Average satisfaction by performance score.</figcaption>
</figure>

Employees on a PIP have much lower satisfaction (about 2.5) than those who meet or exceed expectations (about 4). This does not show which causes which, but it is a pattern worth following up.

### 4. Workplace behavior

<figure>
  <img src="assets/img/hr-organization/absences-by-department.png" alt="Bar chart of average absences by department">
  <figcaption>Average absences by department.</figcaption>
</figure>

<figure>
  <img src="assets/img/hr-organization/lateness-by-department.png" alt="Bar chart of average days late in the last 30 days by department">
  <figcaption>Average days late in the last 30 days, by department.</figcaption>
</figure>

Sales has the most absences and the most lateness, with Production close behind on lateness. These are the same departments with the weakest performance, which reinforces that the biggest risks are concentrated there.

## Recommendations

- **Focus on Sales and Production first:** they show the clearest overlap of low performance, few growth opportunities, and problem behaviors.
- **Look into the Executive Office satisfaction dip** with surveys or interviews, since pay is clearly not the issue.
- **Run a follow-up study** on how performance, satisfaction, and pay relate, to understand which drives the others.
- **Give underperforming departments more access to special projects** as a way to support both performance and engagement.
