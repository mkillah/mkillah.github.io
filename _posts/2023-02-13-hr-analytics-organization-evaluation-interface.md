---
author_profile: false
title:  "Human Resource Analytics: Enhancing Organizational Effectiveness through HR Analytics"
date:   2024-02-15
categories:
  - HR Analytics
---

This HR Analytics project is designed to provide a holistic understanding of the organization by focusing on key areas.

## Objectives

Objectives include analyzing current demographics and management structures, evaluating organizational performance, assessing employee satisfaction levels, and identifying and addressing counterproductive work behaviors. Through a combination of quantitative and qualitative methods, the project aims to deliver actionable insights to enhance overall organizational effectiveness and employee well-being.

1. Determine the current demographic and management structure of the organisation
2. Determine the level of organization performance
3. Determine the level of organization satisfaction
4. Determine the level of organization counterproductive work behaviour

## Part One: Understanding the Background and Data


**Content**

The CSV revolves around a fictitious company and the core data set contains names, DOBs, age, gender, marital status, date of hire, reasons for termination, department, whether they are active or terminated, position title, pay rate, manager name, and performance score.

Recent additions to the data include:

Absences

Most Recent Performance Review Date

Employee Engagement Score


**Acknowledgements**

Dr. Carla Patalano provided the baseline idea for creating this synthetic data set, which has been used now by over 200 Human Resource Management students at the college. Students in the course learn data visualization techniques with Tableau Desktop and use this data set to complete a series of assignments.


```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
```


```python
df = pd.read_csv("/kaggle/input/human-resources-data-set/HRDataset_v14.csv")
```

**Information about the data and table example**


```python
df.info()
```

    <class 'pandas.core.frame.DataFrame'>
    RangeIndex: 311 entries, 0 to 310
    Data columns (total 36 columns):
     #   Column                      Non-Null Count  Dtype  
    ---  ------                      --------------  -----  
     0   Employee_Name               311 non-null    object 
     1   EmpID                       311 non-null    int64  
     2   MarriedID                   311 non-null    int64  
     3   MaritalStatusID             311 non-null    int64  
     4   GenderID                    311 non-null    int64  
     5   EmpStatusID                 311 non-null    int64  
     6   DeptID                      311 non-null    int64  
     7   PerfScoreID                 311 non-null    int64  
     8   FromDiversityJobFairID      311 non-null    int64  
     9   Salary                      311 non-null    int64  
     10  Termd                       311 non-null    int64  
     11  PositionID                  311 non-null    int64  
     12  Position                    311 non-null    object 
     13  State                       311 non-null    object 
     14  Zip                         311 non-null    int64  
     15  DOB                         311 non-null    object 
     16  Sex                         311 non-null    object 
     17  MaritalDesc                 311 non-null    object 
     18  CitizenDesc                 311 non-null    object 
     19  HispanicLatino              311 non-null    object 
     20  RaceDesc                    311 non-null    object 
     21  DateofHire                  311 non-null    object 
     22  DateofTermination           104 non-null    object 
     23  TermReason                  311 non-null    object 
     24  EmploymentStatus            311 non-null    object 
     25  Department                  311 non-null    object 
     26  ManagerName                 311 non-null    object 
     27  ManagerID                   303 non-null    float64
     28  RecruitmentSource           311 non-null    object 
     29  PerformanceScore            311 non-null    object 
     30  EngagementSurvey            311 non-null    float64
     31  EmpSatisfaction             311 non-null    int64  
     32  SpecialProjectsCount        311 non-null    int64  
     33  LastPerformanceReview_Date  311 non-null    object 
     34  DaysLateLast30              311 non-null    int64  
     35  Absences                    311 non-null    int64  
    dtypes: float64(2), int64(16), object(18)
    memory usage: 87.6+ KB
    


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
      <th>Employee_Name</th>
      <th>EmpID</th>
      <th>MarriedID</th>
      <th>MaritalStatusID</th>
      <th>GenderID</th>
      <th>EmpStatusID</th>
      <th>DeptID</th>
      <th>PerfScoreID</th>
      <th>FromDiversityJobFairID</th>
      <th>Salary</th>
      <th>...</th>
      <th>ManagerName</th>
      <th>ManagerID</th>
      <th>RecruitmentSource</th>
      <th>PerformanceScore</th>
      <th>EngagementSurvey</th>
      <th>EmpSatisfaction</th>
      <th>SpecialProjectsCount</th>
      <th>LastPerformanceReview_Date</th>
      <th>DaysLateLast30</th>
      <th>Absences</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Adinolfi, Wilson  K</td>
      <td>10026</td>
      <td>0</td>
      <td>0</td>
      <td>1</td>
      <td>1</td>
      <td>5</td>
      <td>4</td>
      <td>0</td>
      <td>62506</td>
      <td>...</td>
      <td>Michael Albert</td>
      <td>22.0</td>
      <td>LinkedIn</td>
      <td>Exceeds</td>
      <td>4.60</td>
      <td>5</td>
      <td>0</td>
      <td>1/17/2019</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Ait Sidi, Karthikeyan</td>
      <td>10084</td>
      <td>1</td>
      <td>1</td>
      <td>1</td>
      <td>5</td>
      <td>3</td>
      <td>3</td>
      <td>0</td>
      <td>104437</td>
      <td>...</td>
      <td>Simon Roup</td>
      <td>4.0</td>
      <td>Indeed</td>
      <td>Fully Meets</td>
      <td>4.96</td>
      <td>3</td>
      <td>6</td>
      <td>2/24/2016</td>
      <td>0</td>
      <td>17</td>
    </tr>
    <tr>
      <th>2</th>
      <td>Akinkuolie, Sarah</td>
      <td>10196</td>
      <td>1</td>
      <td>1</td>
      <td>0</td>
      <td>5</td>
      <td>5</td>
      <td>3</td>
      <td>0</td>
      <td>64955</td>
      <td>...</td>
      <td>Kissy Sullivan</td>
      <td>20.0</td>
      <td>LinkedIn</td>
      <td>Fully Meets</td>
      <td>3.02</td>
      <td>3</td>
      <td>0</td>
      <td>5/15/2012</td>
      <td>0</td>
      <td>3</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Alagbe,Trina</td>
      <td>10088</td>
      <td>1</td>
      <td>1</td>
      <td>0</td>
      <td>1</td>
      <td>5</td>
      <td>3</td>
      <td>0</td>
      <td>64991</td>
      <td>...</td>
      <td>Elijiah Gray</td>
      <td>16.0</td>
      <td>Indeed</td>
      <td>Fully Meets</td>
      <td>4.84</td>
      <td>5</td>
      <td>0</td>
      <td>1/3/2019</td>
      <td>0</td>
      <td>15</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Anderson, Carol</td>
      <td>10069</td>
      <td>0</td>
      <td>2</td>
      <td>0</td>
      <td>5</td>
      <td>5</td>
      <td>3</td>
      <td>0</td>
      <td>50825</td>
      <td>...</td>
      <td>Webster Butler</td>
      <td>39.0</td>
      <td>Google Search</td>
      <td>Fully Meets</td>
      <td>5.00</td>
      <td>4</td>
      <td>0</td>
      <td>2/1/2016</td>
      <td>0</td>
      <td>2</td>
    </tr>
  </tbody>
</table>
<p>5 rows × 36 columns</p>
</div>



## Part Two: Exploratory Data Analysis

## Demographics

**Sex distribution in the organisation**


```python
sns.catplot(x='Sex',kind='count',data=df)
```




    <seaborn.axisgrid.FacetGrid at 0x7b6614918970>




    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_9_1.png)
    


**Ethnicity distribution in the organisation**


```python
plt.figure(figsize=(14,10), dpi=200)
sns.catplot(x='RaceDesc',kind='count', data=df)
plt.xticks(rotation=90)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_11_2.png)
    


**Location-Based Distribution**


```python
sns.histplot(data=df, x="State")
plt.xticks(rotation=90)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_13_1.png)
    


## Organisation structure

**Position Distribution Overview**


```python
pd.DataFrame(df["Position"].value_counts())
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
    </tr>
    <tr>
      <th>Position</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Production Technician I</th>
      <td>137</td>
    </tr>
    <tr>
      <th>Production Technician II</th>
      <td>57</td>
    </tr>
    <tr>
      <th>Area Sales Manager</th>
      <td>27</td>
    </tr>
    <tr>
      <th>Production Manager</th>
      <td>14</td>
    </tr>
    <tr>
      <th>Software Engineer</th>
      <td>10</td>
    </tr>
    <tr>
      <th>IT Support</th>
      <td>8</td>
    </tr>
    <tr>
      <th>Data Analyst</th>
      <td>7</td>
    </tr>
    <tr>
      <th>Sr. Network Engineer</th>
      <td>5</td>
    </tr>
    <tr>
      <th>Database Administrator</th>
      <td>5</td>
    </tr>
    <tr>
      <th>Network Engineer</th>
      <td>5</td>
    </tr>
    <tr>
      <th>BI Developer</th>
      <td>4</td>
    </tr>
    <tr>
      <th>Senior BI Developer</th>
      <td>3</td>
    </tr>
    <tr>
      <th>Administrative Assistant</th>
      <td>3</td>
    </tr>
    <tr>
      <th>Sales Manager</th>
      <td>3</td>
    </tr>
    <tr>
      <th>Accountant I</th>
      <td>3</td>
    </tr>
    <tr>
      <th>Sr. DBA</th>
      <td>2</td>
    </tr>
    <tr>
      <th>IT Manager - DB</th>
      <td>2</td>
    </tr>
    <tr>
      <th>Sr. Accountant</th>
      <td>2</td>
    </tr>
    <tr>
      <th>Director of Operations</th>
      <td>1</td>
    </tr>
    <tr>
      <th>Shared Services Manager</th>
      <td>1</td>
    </tr>
    <tr>
      <th>Data Analyst</th>
      <td>1</td>
    </tr>
    <tr>
      <th>Data Architect</th>
      <td>1</td>
    </tr>
    <tr>
      <th>Principal Data Architect</th>
      <td>1</td>
    </tr>
    <tr>
      <th>IT Manager - Infra</th>
      <td>1</td>
    </tr>
    <tr>
      <th>President &amp; CEO</th>
      <td>1</td>
    </tr>
    <tr>
      <th>Enterprise Architect</th>
      <td>1</td>
    </tr>
    <tr>
      <th>BI Director</th>
      <td>1</td>
    </tr>
    <tr>
      <th>Director of Sales</th>
      <td>1</td>
    </tr>
    <tr>
      <th>IT Director</th>
      <td>1</td>
    </tr>
    <tr>
      <th>IT Manager - Support</th>
      <td>1</td>
    </tr>
    <tr>
      <th>Software Engineering Manager</th>
      <td>1</td>
    </tr>
    <tr>
      <th>CIO</th>
      <td>1</td>
    </tr>
  </tbody>
</table>
</div>



**How many managers organization have? How many subordinates does a manager have?**


```python
managersN = len(df["ManagerID"].unique())
employee_counts = df['ManagerID'].value_counts()
print(f"There is {managersN} managers in total. Every manager have to manage {round(employee_counts.mean(), 2)} employees in average.")
```

There is 24 managers in total. Every manager have to manage 13.17 employees in average.
    

**How many managers are per department?**


```python
managers_per_department = df.groupby('Department')['ManagerID'].nunique()
managers_per_department
```




    Department
    Admin Offices            4
    Executive Office         1
    IT/IS                    6
    Production              11
    Sales                    4
    Software Engineering     3
    Name: ManagerID, dtype: int64



**What is employees distribution across departments?**


```python
sns.catplot(x= 'Department',kind='count',data=df, hue="Sex")
plt.xticks(rotation=45)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_22_1.png)
    


## Organisation Performance

**What is the distribution of Performance Score in the organization?**


```python
color_palette = sns.color_palette("flare")
sns.set_palette(color_palette)
sns.catplot(x = "PerformanceScore",kind='count', data = df)
plt.xticks(rotation=45)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_25_1.png)
    



```python
sns.catplot(x= 'PerformanceScore',kind='count',data=df, hue="Department")
plt.xticks(rotation=45)
```


    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_26_1.png)
    


Due to absolute count and unequal distributions of employees per depertment, performance score among departments can't be compared. Therefore, relative proportion, taking into account the relative number of employee per depertment, is calculated for better comparison.


```python
# Calculate the percentage of each category within each department
percentages = df.groupby(['Department', 'PerformanceScore']).size().div(df.groupby('Department').size()).mul(100).reset_index(name='Percentage')
# Create a pivot table for better organization
pivot_table = pd.pivot_table(percentages, values='Percentage', index='PerformanceScore', columns='Department')
pivot_table

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
      <th>Department</th>
      <th>Admin Offices</th>
      <th>Executive Office</th>
      <th>IT/IS</th>
      <th>Production</th>
      <th>Sales</th>
      <th>Software Engineering</th>
    </tr>
    <tr>
      <th>PerformanceScore</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Exceeds</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>12.0</td>
      <td>12.918660</td>
      <td>6.451613</td>
      <td>18.181818</td>
    </tr>
    <tr>
      <th>Fully Meets</th>
      <td>100.0</td>
      <td>100.0</td>
      <td>84.0</td>
      <td>76.076555</td>
      <td>77.419355</td>
      <td>72.727273</td>
    </tr>
    <tr>
      <th>Needs Improvement</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>2.0</td>
      <td>7.177033</td>
      <td>3.225806</td>
      <td>9.090909</td>
    </tr>
    <tr>
      <th>PIP</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>2.0</td>
      <td>3.827751</td>
      <td>12.903226</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>



**How many special projects does each department have?**


```python
sns.catplot(x= 'SpecialProjectsCount',kind='count',data=df[(df["SpecialProjectsCount"]> 0)] , hue="Department")
plt.xticks(rotation=45)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_30_1.png)
    


**Interpretation**
The data shows that the Sales Department has the highest relative proportion for more improvement (Needs Improvement and PIP). In general, the organisation seems to have a good performance review. Also, the interesting highlight is that Sales does not have any Special projects, and the Production Department has only a couple of them. This highlight might indicate the origin of a lack of satisfying evaluation due to motivation levels. This relationship should be further explored.

## Organisation Satisfaction

**What is employees satisfaction and salary across departments?**


```python
dep_sat = df.groupby('Department')['EmpSatisfaction'].mean().reset_index()
sns.barplot(x='Department',y='EmpSatisfaction',data=dep_sat)
plt.xticks(rotation=45)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_34_1.png)
    



```python
dep_sal = df.groupby('Department')['Salary'].mean().reset_index()
sns.barplot(x='Department',y='Salary',data=dep_sal)
plt.xticks(rotation=45)
```


    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_35_1.png)
    


**Interpretation** It seems that there is no huge differences in employee satisfaction among departments. Although, Executive Office shows significant drop in satisfaction, in spite of the highest level of salary. Such insight indicates that origin of lower level of satisfaction in Executive Office can be attributed to other factors (for example, higher level of stress, etc.).

**What is the level of employee satisfaction in respect to their performance score and salary?**


```python
per_sat = df.groupby('PerformanceScore')['EmpSatisfaction'].mean().reset_index()
sns.barplot(x='PerformanceScore',y='EmpSatisfaction',data=per_sat)
plt.xticks(rotation=45)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_38_1.png)
    



```python
dep_sal = df.groupby('PerformanceScore')['Salary'].mean().reset_index()
sns.barplot(x='PerformanceScore',y='Salary',data=dep_sal)
plt.xticks(rotation=45)
```


    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_39_1.png)
    


**Interpretation** Evidently, the employees that had lowest performance score also had lowest satisfaction and salary. Such a finding requires a deeper analysis, to seek the casual relation - is low satisfaction and salary causes low performance score or vice versa.

## Counterproductive work behavior

**What is the degree of absenteeism across departments and performance score level?**


```python
dep_sal = df.groupby('Department')['Absences'].mean().reset_index()
sns.barplot(x='Department',y='Absences',data=dep_sal)
plt.xticks(rotation=45)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_43_1.png)
    



```python
dep_sal = df.groupby('PerformanceScore')['Absences'].mean().reset_index()
sns.barplot(x='PerformanceScore',y='Absences',data=dep_sal)
plt.xticks(rotation=45)
```

    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_44_1.png)
    


**What is the degree of tardiness across departments and performance score level?**


```python
dep_sal = df.groupby('Department')['DaysLateLast30'].mean().reset_index()
sns.barplot(x='Department',y='DaysLateLast30',data=dep_sal)
plt.xticks(rotation=45)
```


    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_46_1.png)
    



```python
dep_sal = df.groupby('PerformanceScore')['DaysLateLast30'].mean().reset_index()
sns.barplot(x='PerformanceScore',y='DaysLateLast30',data=dep_sal)
plt.xticks(rotation=45)
```


    
![png](/assets/images/HRanalytcsOrganisationEvaluation/output_47_1.png)
    


**Interpretation** Data show that Sales and Production Departments have highest level of counterproductive working behaviour, as well group that have lowest performance score (both departments are highly represented in those groups).

## Conclusion


The analysis of organizational data reveals key insights. The Sales Department shows a notable need for improvement, suggesting potential areas for management attention and motivation enhancement. Conversely, the Executive Office experiences a significant drop in satisfaction despite having the highest salary, indicating the influence of non-monetary factors on job satisfaction. The correlation between low performance scores, lower satisfaction, and salary levels prompts further investigation into causal relationships. Additionally, Sales and Production Departments exhibit higher levels of counterproductive behavior, particularly in groups with lower performance scores, emphasizing the need for targeted strategies to mitigate such behaviors. Overall, these findings provide a foundation for focused interventions to improve organizational performance, employee satisfaction, and well-being.

