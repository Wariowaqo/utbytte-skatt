# Worked Example - Norwegian Tax Calculator

This document provides a detailed worked example with actual numbers to demonstrate how the calculator works.

## Scenario

**Company Profile:**
- Annual profit before tax: **1,000,000 NOK**
- Location: Oslo (Employer zone 1 - 14.1% AGA)
- Single shareholder who is also the only employee
- Share cost basis: 30,000 NOK (for skjermingsfradrag)
- No profit retention (full extraction)

Let's compare three strategies: 100% salary, 100% dividends, and optimized combination.

---

## Strategy 1: 100% Salary

### Step 1: Calculate maximum gross salary

The company has 1,000,000 NOK to spend. This must cover both salary AND employer's social security (AGA).

```
Available: 1,000,000 NOK
AGA rate (Zone 1): 14.1%

Formula: Gross Salary = Available / (1 + AGA rate)
Gross Salary = 1,000,000 / 1.141 = 876,424 NOK
```

### Step 2: Calculate employer costs

```
Gross Salary: 876,424 NOK
Employer's AGA: 876,424 × 14.1% = 123,576 NOK
Total employer cost: 876,424 + 123,576 = 1,000,000 NOK ✓
```

### Step 3: Calculate employee social security (trygdeavgift)

```
Rate: 7.8%
Trygdeavgift: 876,424 × 7.8% = 68,361 NOK
```

### Step 4: Calculate bracket tax (trinnskatt)

Progressive tax on gross salary:

| Bracket | Threshold | Rate | Taxable Amount | Tax |
|---------|-----------|------|----------------|-----|
| Trinn 1 | 217,400 | 1.7% | 88,650 (306,050 - 217,400) | 1,507 |
| Trinn 2 | 306,050 | 4.0% | 391,100 (697,150 - 306,050) | 15,644 |
| Trinn 3 | 697,150 | 13.7% | 179,274 (876,424 - 697,150) | 24,561 |

```
Total trinnskatt: 1,507 + 15,644 + 24,561 = 41,712 NOK
```

### Step 5: Calculate income tax (skatt på alminnelig inntekt)

```
Gross salary: 876,424 NOK
Minstefradrag (46%, max 114,950): 114,950 NOK
Personfradrag: 73,150 NOK

Taxable income = 876,424 - 114,950 - 73,150 = 688,324 NOK
Income tax = 688,324 × 22% = 151,431 NOK
```

### Step 6: Calculate totals

```
Total personal tax = 68,361 + 41,712 + 151,431 = 261,504 NOK
Net salary = 876,424 - 261,504 = 614,920 NOK

Total tax paid:
- Employer's AGA: 123,576 NOK
- Personal taxes: 261,504 NOK
Total: 385,080 NOK

Effective tax rate: 385,080 / 1,000,000 = 38.51%
```

### Summary: 100% Salary

| Item | Amount (NOK) |
|------|-------------|
| Gross salary | 876,424 |
| Employer's AGA | 123,576 |
| Trygdeavgift | 68,361 |
| Trinnskatt | 41,712 |
| Inntektsskatt | 151,431 |
| **Total tax** | **385,080** |
| **Net payout** | **614,920** |
| **Effective rate** | **38.51%** |

---

## Strategy 2: 100% Dividends

### Step 1: Calculate corporate tax

```
Profit before tax: 1,000,000 NOK
Corporate tax rate: 22%

Corporate tax: 1,000,000 × 22% = 220,000 NOK
Profit after tax: 1,000,000 - 220,000 = 780,000 NOK
```

### Step 2: Calculate skjermingsfradrag

```
Share cost basis: 30,000 NOK
Skjermingsrente 2025: ~5.0%

Skjermingsfradrag: 30,000 × 5.0% = 1,500 NOK
```

### Step 3: Calculate dividend tax

```
Dividend distributed: 780,000 NOK
Skjermingsfradrag: 1,500 NOK
Taxable dividend: 780,000 - 1,500 = 778,500 NOK

Gross-up factor: 1.72
Grossed-up amount: 778,500 × 1.72 = 1,339,020 NOK

Tax rate: 22%
Dividend tax: 1,339,020 × 22% = 294,584 NOK
```

### Step 4: Calculate totals

```
Net dividend = 780,000 - 294,584 = 485,416 NOK

Total tax paid:
- Corporate tax: 220,000 NOK
- Dividend tax: 294,584 NOK
Total: 514,584 NOK

Effective tax rate: 514,584 / 1,000,000 = 51.46%
```

### Summary: 100% Dividends

| Item | Amount (NOK) |
|------|-------------|
| Profit before tax | 1,000,000 |
| Corporate tax (22%) | 220,000 |
| Dividend distributed | 780,000 |
| Skjermingsfradrag | 1,500 |
| Dividend tax | 294,584 |
| **Total tax** | **514,584** |
| **Net payout** | **485,416** |
| **Effective rate** | **51.46%** |

---

## Strategy 3: Optimized Combination

The optimizer finds that allocating ~100% to salary is optimal for this profit level in Zone 1.

However, let's also show a 50/50 split for comparison:

### 50/50 Split Calculation

**Salary portion: 500,000 NOK**

```
Gross salary: 500,000 / 1.141 = 438,212 NOK
Employer's AGA: 438,212 × 14.1% = 61,788 NOK

Trygdeavgift: 438,212 × 7.8% = 34,180 NOK

Trinnskatt:
- Trinn 1: (306,050 - 217,400) × 1.7% = 1,507 NOK
- Trinn 2: (438,212 - 306,050) × 4.0% = 5,286 NOK
Total trinnskatt: 6,793 NOK

Minstefradrag: 114,950 NOK (capped)
Taxable income: 438,212 - 114,950 - 73,150 = 250,112 NOK
Inntektsskatt: 250,112 × 22% = 55,025 NOK

Total salary tax: 34,180 + 6,793 + 55,025 = 95,998 NOK
Net salary: 438,212 - 95,998 = 342,214 NOK
```

**Dividend portion: 500,000 NOK**

```
Corporate tax: 500,000 × 22% = 110,000 NOK
Dividend available: 500,000 - 110,000 = 390,000 NOK

Grossed-up: 390,000 × 1.72 = 670,800 NOK
Dividend tax: 670,800 × 22% = 147,576 NOK

Net dividend: 390,000 - 147,576 = 242,424 NOK
```

**Combined totals:**

```
Total tax = 61,788 (AGA) + 95,998 (personal) + 110,000 (corp) + 147,576 (div) = 415,362 NOK
Net payout = 342,214 + 242,424 = 584,638 NOK
Effective rate = 41.54%
```

### Summary: 50/50 Split

| Item | Amount (NOK) |
|------|-------------|
| Net salary | 342,214 |
| Net dividend | 242,424 |
| **Total tax** | **415,362** |
| **Net payout** | **584,638** |
| **Effective rate** | **41.54%** |

---

## Final Comparison

| Strategy | Net Payout (NOK) | Total Tax (NOK) | Effective Rate | Rank |
|----------|------------------|-----------------|----------------|------|
| **100% Salary** | **614,920** | **385,080** | **38.51%** | **1** 🥇 |
| 50/50 Split | 584,638 | 415,362 | 41.54% | 2 |
| 100% Dividends | 485,416 | 514,584 | 51.46% | 3 |

### Key Insights

1. **100% Salary wins** for this profit level (1 million NOK) in Zone 1
   - Difference from worst: 129,504 NOK more in pocket
   - That's almost 27% more money!

2. **Why salary wins at this level:**
   - Minstefradrag and personfradrag reduce taxable base
   - Trinnskatt brackets haven't escalated to punishing levels yet
   - No double taxation (unlike dividends: corporate + personal)

3. **When dividends become competitive:**
   - Higher profit levels (2+ million NOK)
   - When bracket tax reaches Trinn 4-5 (16.7% and 17.6%)
   - In zone 5 (0% AGA), salary advantage is even larger

4. **Trade-offs to consider:**
   - Salary provides pension accrual and social benefits
   - Dividends are simpler to administer
   - Retention in company defers taxes and preserves capital

---

## Zone Comparison

Same calculation for Zone 5 (Finnmark/Nord-Troms - 0% AGA):

| Strategy | Zone 1 Net | Zone 5 Net | Difference |
|----------|------------|------------|------------|
| 100% Salary | 614,920 | 680,000* | +65,080 |
| 100% Dividend | 485,416 | 485,416 | 0 |

*Zone 5 salary: With 0% AGA, full 1,000,000 can go to salary, resulting in significantly higher net payout.

**Conclusion:** The location of your AS matters significantly for salary-based strategies.

---

## Notes and Assumptions

This example assumes:
- Single shareholder/employee
- No other income sources
- Person aged 17-69
- Standard employment relationship
- Tax year 2025 rates
- No unused skjermingsfradrag from previous years

All rates sourced from:
- Skatteetaten (skatteetaten.no)
- Lovdata (lovdata.no)

---

*Generated by Norwegian Tax Calculator - Utbytte vs Lønn*
*January 2025*
