/**
 * Salary Tax Calculation Module
 * 
 * Calculates all taxes related to salary extraction from a Norwegian AS.
 * Each calculation step is documented with sources and assumptions.
 * 
 * Tax components for salary:
 * 1. Employer's social security contribution (arbeidsgiveravgift) - paid by company
 * 2. Employee's social security contribution (trygdeavgift) - deducted from salary
 * 3. Bracket tax (trinnskatt) - progressive tax on gross salary
 * 4. Income tax (skatt på alminnelig inntekt) - flat rate after deductions
 * 
 * Sources:
 * - Skatteetaten: https://www.skatteetaten.no
 * - Lovdata: https://lovdata.no
 */

import {
  CORPORATE_TAX_RATE,
  EMPLOYER_SOCIAL_SECURITY_RATES,
  PERSONAL_TAX_RATE,
  BRACKET_TAX_2025,
  SOCIAL_SECURITY_RATES,
  SOCIAL_SECURITY_THRESHOLD,
  MINSTEFRADRAG,
  PERSONFRADRAG,
  OTP_MIN_RATE,
  GRUNNBELOPET
} from '../config/taxRates.js';

/**
 * Calculates the maximum gross salary that can be paid from a given profit.
 * 
 * The company must pay employer's social security contribution on top of the salary.
 * Formula: Profit = Gross Salary + Employer's AGA
 *          Profit = Gross Salary × (1 + AGA rate)
 *          Gross Salary = Profit / (1 + AGA rate)
 * 
 * @param {number} availableAmount - Amount available for salary extraction
 * @param {string} zone - Employer zone for social security calculation
 * @param {boolean} includePension - Whether to include OTP contribution
 * @param {number} pensionRate - OTP rate (default 2%)
 * @returns {Object} Calculation breakdown
 */
export function calculateMaxGrossSalary(availableAmount, zone, includePension = false, pensionRate = OTP_MIN_RATE) {
  // Step 1: Get the employer's social security rate for the zone
  const agaRate = EMPLOYER_SOCIAL_SECURITY_RATES[zone];
  
  if (agaRate === undefined) {
    throw new Error(`Invalid employer zone: ${zone}. Cannot calculate without valid zone.`);
  }
  
  // Step 2: Calculate pension contribution factor if applicable
  // Pension is calculated on salary between 1G and 12G
  const pensionFactor = includePension ? pensionRate : 0;
  
  // Step 3: Calculate the divisor
  // Total cost = Salary × (1 + AGA rate + pension rate)
  // Note: Pension contribution also attracts employer's AGA
  const totalCostFactor = 1 + agaRate + pensionFactor * (1 + agaRate);
  
  // Step 4: Calculate maximum gross salary
  const grossSalary = availableAmount / totalCostFactor;
  
  // Step 5: Calculate employer costs
  const employerAGA = grossSalary * agaRate;
  const pensionContribution = includePension ? grossSalary * pensionRate : 0;
  const pensionAGA = pensionContribution * agaRate;
  
  return {
    grossSalary: Math.round(grossSalary),
    employerAGA: Math.round(employerAGA),
    pensionContribution: Math.round(pensionContribution),
    pensionAGA: Math.round(pensionAGA),
    totalEmployerCost: Math.round(grossSalary + employerAGA + pensionContribution + pensionAGA),
    calculationSteps: [
      `1. Arbeidsgiveravgiftssats for sone ${zone}: ${(agaRate * 100).toFixed(1)}%`,
      `2. Pensjonssats: ${(pensionFactor * 100).toFixed(1)}%`,
      `3. Total kostnadsfaktor: ${totalCostFactor.toFixed(4)}`,
      `4. Maksimal bruttolønn: ${availableAmount.toLocaleString('nb-NO')} / ${totalCostFactor.toFixed(4)} = ${Math.round(grossSalary).toLocaleString('nb-NO')} kr`,
      `5. Arbeidsgiveravgift: ${Math.round(grossSalary).toLocaleString('nb-NO')} × ${(agaRate * 100).toFixed(1)}% = ${Math.round(employerAGA).toLocaleString('nb-NO')} kr`
    ]
  };
}

/**
 * Calculates bracket tax (trinnskatt) on gross salary.
 * 
 * Trinnskatt is a progressive tax on gross personal income (personinntekt).
 * Each bracket only applies to income above the threshold.
 * 
 * Source: Skatteetaten - "Trinnskatt"
 * URL: https://www.skatteetaten.no/satser/trinnskatt/
 * Year: 2025
 * 
 * @param {number} grossSalary - Gross salary amount
 * @returns {Object} Bracket tax breakdown by step
 */
export function calculateBracketTax(grossSalary) {
  const brackets = BRACKET_TAX_2025;
  const breakdown = [];
  let totalBracketTax = 0;
  let previousThreshold = 0;
  
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const nextThreshold = i < brackets.length - 1 ? brackets[i + 1].threshold : Infinity;
    
    if (grossSalary > bracket.threshold) {
      // Calculate taxable amount in this bracket
      const taxableInBracket = Math.min(grossSalary, nextThreshold) - bracket.threshold;
      const taxInBracket = taxableInBracket * bracket.rate;
      
      totalBracketTax += taxInBracket;
      
      breakdown.push({
        step: i + 1,
        threshold: bracket.threshold,
        rate: bracket.rate,
        taxableAmount: Math.round(taxableInBracket),
        tax: Math.round(taxInBracket),
        description: `Trinn ${i + 1}: (${Math.round(taxableInBracket).toLocaleString('nb-NO')} kr) × ${(bracket.rate * 100).toFixed(1)}% = ${Math.round(taxInBracket).toLocaleString('nb-NO')} kr`
      });
    }
    
    previousThreshold = bracket.threshold;
  }
  
  return {
    totalBracketTax: Math.round(totalBracketTax),
    breakdown,
    calculationSteps: breakdown.map(b => b.description)
  };
}

/**
 * Calculates social security contribution (trygdeavgift) on salary.
 * 
 * Trygdeavgift is deducted from the employee's gross salary.
 * Rate for salary income: 7.8%
 * No contribution on income below the threshold.
 * 
 * Source: Skatteetaten - "Trygdeavgift"
 * URL: https://www.skatteetaten.no/satser/trygdeavgift/
 * Year: 2025
 * 
 * @param {number} grossSalary - Gross salary amount
 * @returns {Object} Social security contribution breakdown
 */
export function calculateSocialSecurityContribution(grossSalary) {
  const rate = SOCIAL_SECURITY_RATES.salary;
  const threshold = SOCIAL_SECURITY_THRESHOLD;
  
  // No contribution on income below threshold
  if (grossSalary <= threshold) {
    return {
      contribution: 0,
      rate: rate,
      taxableBase: 0,
      calculationSteps: [
        `Bruttoinntekt (${grossSalary.toLocaleString('nb-NO')} kr) er under terskelverdi (${threshold.toLocaleString('nb-NO')} kr)`,
        `Trygdeavgift: 0 kr`
      ]
    };
  }
  
  // Full contribution on entire salary (not just amount above threshold)
  const contribution = grossSalary * rate;
  
  return {
    contribution: Math.round(contribution),
    rate: rate,
    taxableBase: grossSalary,
    calculationSteps: [
      `Trygdeavgiftssats for lønn: ${(rate * 100).toFixed(1)}%`,
      `Trygdeavgift: ${grossSalary.toLocaleString('nb-NO')} × ${(rate * 100).toFixed(1)}% = ${Math.round(contribution).toLocaleString('nb-NO')} kr`
    ]
  };
}

/**
 * Calculates minimum standard deduction (minstefradrag) on salary.
 * 
 * Automatic deduction from salary income for all employees.
 * Cannot exceed the maximum or be below the minimum.
 * 
 * Source: Skatteetaten - "Minstefradrag"
 * URL: https://www.skatteetaten.no/satser/minstefradrag/
 * Year: 2025
 * 
 * @param {number} grossSalary - Gross salary amount
 * @returns {Object} Minstefradrag calculation
 */
export function calculateMinstefradrag(grossSalary) {
  const { rate, minimum, maximum } = MINSTEFRADRAG;
  
  // Calculate standard deduction
  let minstefradrag = grossSalary * rate;
  
  // Apply minimum and maximum limits
  minstefradrag = Math.max(minstefradrag, minimum);
  minstefradrag = Math.min(minstefradrag, maximum);
  minstefradrag = Math.min(minstefradrag, grossSalary); // Cannot exceed salary
  
  return {
    minstefradrag: Math.round(minstefradrag),
    rate: rate,
    minimum: minimum,
    maximum: maximum,
    calculationSteps: [
      `Minstefradragssats: ${(rate * 100)}%`,
      `Beregnet minstefradrag: ${grossSalary.toLocaleString('nb-NO')} × ${(rate * 100)}% = ${Math.round(grossSalary * rate).toLocaleString('nb-NO')} kr`,
      `Minimum: ${minimum.toLocaleString('nb-NO')} kr, Maksimum: ${maximum.toLocaleString('nb-NO')} kr`,
      `Endelig minstefradrag: ${Math.round(minstefradrag).toLocaleString('nb-NO')} kr`
    ]
  };
}

/**
 * Calculates income tax (skatt på alminnelig inntekt) on salary.
 * 
 * Tax is calculated on net income after deductions:
 * - Minstefradrag (minimum standard deduction)
 * - Personfradrag (personal allowance)
 * 
 * Source: Skatteetaten - "Skatt på alminnelig inntekt"
 * URL: https://www.skatteetaten.no/satser/skatt-pa-alminnelig-inntekt/
 * Year: 2025
 * 
 * @param {number} grossSalary - Gross salary amount
 * @returns {Object} Income tax calculation
 */
export function calculateIncomeTax(grossSalary) {
  // Step 1: Calculate minstefradrag
  const minstefradragResult = calculateMinstefradrag(grossSalary);
  const minstefradrag = minstefradragResult.minstefradrag;
  
  // Step 2: Calculate taxable income (alminnelig inntekt)
  const taxableIncome = Math.max(0, grossSalary - minstefradrag - PERSONFRADRAG);
  
  // Step 3: Calculate income tax
  const incomeTax = taxableIncome * PERSONAL_TAX_RATE;
  
  return {
    incomeTax: Math.round(incomeTax),
    taxableIncome: Math.round(taxableIncome),
    minstefradrag: minstefradrag,
    personfradrag: PERSONFRADRAG,
    rate: PERSONAL_TAX_RATE,
    calculationSteps: [
      `Bruttolønn: ${grossSalary.toLocaleString('nb-NO')} kr`,
      `Minstefradrag: ${minstefradrag.toLocaleString('nb-NO')} kr`,
      `Personfradrag: ${PERSONFRADRAG.toLocaleString('nb-NO')} kr`,
      `Alminnelig inntekt: ${grossSalary.toLocaleString('nb-NO')} - ${minstefradrag.toLocaleString('nb-NO')} - ${PERSONFRADRAG.toLocaleString('nb-NO')} = ${Math.round(taxableIncome).toLocaleString('nb-NO')} kr`,
      `Inntektsskatt: ${Math.round(taxableIncome).toLocaleString('nb-NO')} × ${(PERSONAL_TAX_RATE * 100)}% = ${Math.round(incomeTax).toLocaleString('nb-NO')} kr`
    ]
  };
}

/**
 * Calculates complete salary tax scenario.
 * 
 * This function orchestrates all salary-related tax calculations
 * and provides a complete breakdown of taxes and net payout.
 * 
 * Assumptions:
 * - Single shareholder/employee
 * - No other income sources
 * - Standard employment situation
 * - Person is between 17 and 69 years old
 * 
 * @param {number} profit - Company profit before tax
 * @param {string} zone - Employer zone (1, 1a, 2, 3, 4, 4a, or 5)
 * @param {Object} options - Optional settings (pension, retention)
 * @returns {Object} Complete salary scenario calculation
 */
export function calculateSalaryScenario(profit, zone, options = {}) {
  const {
    includePension = false,
    pensionRate = OTP_MIN_RATE,
    retentionPercentage = 0
  } = options;
  
  const calculationSteps = [];
  
  // Step 1: Calculate amount available for extraction
  // If retaining profits, reduce the available amount
  const retainedAmount = profit * retentionPercentage;
  const availableForExtraction = profit - retainedAmount;
  
  calculationSteps.push({
    step: 'Tilgjengelig for uttak',
    description: `Overskudd: ${profit.toLocaleString('nb-NO')} kr - Tilbakeholdt: ${Math.round(retainedAmount).toLocaleString('nb-NO')} kr = ${Math.round(availableForExtraction).toLocaleString('nb-NO')} kr`
  });
  
  // Step 2: Calculate maximum gross salary from available amount
  const salaryCalc = calculateMaxGrossSalary(
    availableForExtraction, 
    zone, 
    includePension, 
    pensionRate
  );
  const grossSalary = salaryCalc.grossSalary;
  const employerAGA = salaryCalc.employerAGA;
  const pensionContribution = salaryCalc.pensionContribution;
  
  calculationSteps.push({
    step: 'Bruttolønn beregning',
    details: salaryCalc.calculationSteps
  });
  
  // Step 3: Calculate employee social security contribution
  const socialSecurityCalc = calculateSocialSecurityContribution(grossSalary);
  const trygdeavgift = socialSecurityCalc.contribution;
  
  calculationSteps.push({
    step: 'Trygdeavgift',
    details: socialSecurityCalc.calculationSteps
  });
  
  // Step 4: Calculate bracket tax
  const bracketTaxCalc = calculateBracketTax(grossSalary);
  const trinnskatt = bracketTaxCalc.totalBracketTax;
  
  calculationSteps.push({
    step: 'Trinnskatt',
    details: bracketTaxCalc.calculationSteps
  });
  
  // Step 5: Calculate income tax
  const incomeTaxCalc = calculateIncomeTax(grossSalary);
  const inntektsskatt = incomeTaxCalc.incomeTax;
  
  calculationSteps.push({
    step: 'Inntektsskatt',
    details: incomeTaxCalc.calculationSteps
  });
  
  // Step 6: Calculate corporate tax on retained earnings
  const corporateTaxOnRetained = retainedAmount * CORPORATE_TAX_RATE;
  
  if (retainedAmount > 0) {
    calculationSteps.push({
      step: 'Selskapsskatt på tilbakeholdt overskudd',
      description: `${Math.round(retainedAmount).toLocaleString('nb-NO')} × ${(CORPORATE_TAX_RATE * 100)}% = ${Math.round(corporateTaxOnRetained).toLocaleString('nb-NO')} kr`
    });
  }
  
  // Step 7: Calculate totals
  const totalPersonalTax = trygdeavgift + trinnskatt + inntektsskatt;
  const totalTax = employerAGA + totalPersonalTax + corporateTaxOnRetained;
  const netSalary = grossSalary - totalPersonalTax;
  
  // Step 8: Calculate effective tax rate
  const effectiveTaxRate = profit > 0 ? totalTax / profit : 0;
  const effectivePersonalTaxRate = grossSalary > 0 ? totalPersonalTax / grossSalary : 0;
  
  calculationSteps.push({
    step: 'Oppsummering',
    details: [
      `Total personskatt: ${trygdeavgift.toLocaleString('nb-NO')} + ${trinnskatt.toLocaleString('nb-NO')} + ${inntektsskatt.toLocaleString('nb-NO')} = ${totalPersonalTax.toLocaleString('nb-NO')} kr`,
      `Netto lønn: ${grossSalary.toLocaleString('nb-NO')} - ${totalPersonalTax.toLocaleString('nb-NO')} = ${netSalary.toLocaleString('nb-NO')} kr`,
      `Total skatt: ${totalTax.toLocaleString('nb-NO')} kr`,
      `Effektiv skattesats: ${(effectiveTaxRate * 100).toFixed(2)}%`
    ]
  });
  
  return {
    scenarioType: 'salary',
    scenarioName: '100% Lønn',
    
    // Input values
    input: {
      profit,
      zone,
      includePension,
      pensionRate,
      retentionPercentage
    },
    
    // Company level
    company: {
      profit: profit,
      retainedEarnings: Math.round(retainedAmount),
      retainedAfterTax: Math.round(retainedAmount - corporateTaxOnRetained),
      availableForExtraction: Math.round(availableForExtraction),
      grossSalaryPaid: grossSalary,
      employerAGA: employerAGA,
      pensionContribution: Math.round(pensionContribution),
      totalEmployerCost: Math.round(grossSalary + employerAGA + pensionContribution),
      corporateTaxOnRetained: Math.round(corporateTaxOnRetained)
    },
    
    // Personal level
    personal: {
      grossSalary: grossSalary,
      trygdeavgift: trygdeavgift,
      trinnskatt: trinnskatt,
      inntektsskatt: inntektsskatt,
      totalPersonalTax: totalPersonalTax,
      netSalary: netSalary,
      pensionAccrued: Math.round(pensionContribution)
    },
    
    // Tax summary
    taxSummary: {
      employerAGA: employerAGA,
      corporateTax: Math.round(corporateTaxOnRetained),
      personalTax: totalPersonalTax,
      totalTax: Math.round(totalTax),
      effectiveTaxRate: effectiveTaxRate,
      effectivePersonalTaxRate: effectivePersonalTaxRate
    },
    
    // Final results
    results: {
      netPrivatePayout: netSalary,
      totalTaxPaid: Math.round(totalTax),
      effectiveTaxRate: effectiveTaxRate,
      retainedInCompany: Math.round(retainedAmount - corporateTaxOnRetained)
    },
    
    // Calculation breakdown for transparency
    calculationSteps,
    
    // Assumptions documented
    assumptions: [
      'Personen er mellom 17 og 69 år',
      'Ingen andre inntektskilder',
      'Standard ansettelsesforhold',
      'Én aksjonær/ansatt',
      'Minstefradrag beregnes automatisk',
      'Personfradrag trekkes fra'
    ]
  };
}

export default {
  calculateMaxGrossSalary,
  calculateBracketTax,
  calculateSocialSecurityContribution,
  calculateMinstefradrag,
  calculateIncomeTax,
  calculateSalaryScenario
};
