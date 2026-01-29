/**
 * Combination and Optimization Calculation Module
 * 
 * Calculates tax scenarios for mixed salary/dividend strategies
 * and provides optimization algorithms to find the best ratio.
 * 
 * Strategy: Combine salary and dividends to minimize total tax:
 * - Salary benefits from lower marginal rates up to certain thresholds
 * - Dividends become more efficient at higher income levels
 * - The optimal point depends on:
 *   - Employer social security zone
 *   - Bracket tax thresholds
 *   - Dividend tax rates
 * 
 * Sources:
 * - Skatteetaten: All tax rates and rules
 * - Professional analysis: BDO, EY, PwC, Deloitte guides on optimal extraction
 */

import { calculateSalaryScenario, calculateMaxGrossSalary } from './salaryCalculations.js';
import { calculateDividendScenario, calculateCorporateTax, calculateDividendTax } from './dividendCalculations.js';
import {
  CORPORATE_TAX_RATE,
  EMPLOYER_SOCIAL_SECURITY_RATES,
  BRACKET_TAX_2025,
  EFFECTIVE_DIVIDEND_TAX_RATE,
  SOCIAL_SECURITY_RATES,
  PERSONAL_TAX_RATE,
  MINSTEFRADRAG,
  PERSONFRADRAG
} from '../config/taxRates.js';

/**
 * Calculates a combination scenario with specific salary/dividend ratio.
 * 
 * The combination works as follows:
 * 1. Allocate portion of profit to salary (including employer AGA)
 * 2. Remaining profit goes through corporate tax, then dividend distribution
 * 
 * @param {number} profit - Total company profit before tax
 * @param {string} zone - Employer zone for AGA calculation
 * @param {number} salaryRatio - Percentage of profit allocated to salary (0-100)
 * @param {Object} options - Additional options
 * @returns {Object} Complete combination scenario
 */
export function calculateCombinationScenario(profit, zone, salaryRatio, options = {}) {
  const {
    includePension = false,
    pensionRate = 0.02,
    retentionPercentage = 0,
    shareCostBasis = 0
  } = options;
  
  const calculationSteps = [];
  
  // Validate inputs
  if (salaryRatio < 0 || salaryRatio > 100) {
    throw new Error('Salary ratio must be between 0 and 100');
  }
  
  // Step 1: Calculate retention
  const retainedAmount = profit * retentionPercentage;
  const availableForExtraction = profit - retainedAmount;
  
  calculationSteps.push({
    step: 'Fordeling av overskudd',
    details: [
      `Totalt overskudd: ${profit.toLocaleString('nb-NO')} kr`,
      `Tilbakeholdt: ${Math.round(retainedAmount).toLocaleString('nb-NO')} kr (${(retentionPercentage * 100).toFixed(0)}%)`,
      `Tilgjengelig for uttak: ${Math.round(availableForExtraction).toLocaleString('nb-NO')} kr`
    ]
  });
  
  // Step 2: Allocate between salary and dividend
  const salaryPortion = availableForExtraction * (salaryRatio / 100);
  const dividendPortion = availableForExtraction - salaryPortion;
  
  calculationSteps.push({
    step: 'Fordeling mellom lønn og utbytte',
    details: [
      `Lønnsandel: ${salaryRatio.toFixed(0)}% = ${Math.round(salaryPortion).toLocaleString('nb-NO')} kr`,
      `Utbytteandel: ${(100 - salaryRatio).toFixed(0)}% = ${Math.round(dividendPortion).toLocaleString('nb-NO')} kr`
    ]
  });
  
  // Step 3: Calculate salary component
  // The salary portion includes employer AGA, so we need to calculate backwards
  const agaRate = EMPLOYER_SOCIAL_SECURITY_RATES[zone];
  const salaryCalc = calculateMaxGrossSalary(salaryPortion, zone, includePension, pensionRate);
  const grossSalary = salaryCalc.grossSalary;
  const employerAGA = salaryCalc.employerAGA;
  const pensionContribution = salaryCalc.pensionContribution || 0;
  
  // Calculate personal taxes on salary
  const socialSecurityRate = SOCIAL_SECURITY_RATES.salary;
  const trygdeavgift = grossSalary * socialSecurityRate;
  
  // Bracket tax
  let trinnskatt = 0;
  let prevThreshold = 0;
  for (const bracket of BRACKET_TAX_2025) {
    if (grossSalary > bracket.threshold) {
      const nextThreshold = BRACKET_TAX_2025[BRACKET_TAX_2025.indexOf(bracket) + 1]?.threshold || Infinity;
      const taxableInBracket = Math.min(grossSalary, nextThreshold) - bracket.threshold;
      trinnskatt += taxableInBracket * bracket.rate;
    }
  }
  
  // Income tax on salary
  const minstefradrag = Math.min(
    Math.max(grossSalary * MINSTEFRADRAG.rate, MINSTEFRADRAG.minimum),
    MINSTEFRADRAG.maximum,
    grossSalary
  );
  const taxableIncome = Math.max(0, grossSalary - minstefradrag - PERSONFRADRAG);
  const inntektsskatt = taxableIncome * PERSONAL_TAX_RATE;
  
  const totalSalaryTax = trygdeavgift + trinnskatt + inntektsskatt;
  const netSalary = grossSalary - totalSalaryTax;
  
  calculationSteps.push({
    step: 'Lønnsberegning',
    details: [
      `Bruttolønn: ${grossSalary.toLocaleString('nb-NO')} kr`,
      `Arbeidsgiveravgift: ${Math.round(employerAGA).toLocaleString('nb-NO')} kr`,
      `Trygdeavgift: ${Math.round(trygdeavgift).toLocaleString('nb-NO')} kr`,
      `Trinnskatt: ${Math.round(trinnskatt).toLocaleString('nb-NO')} kr`,
      `Inntektsskatt: ${Math.round(inntektsskatt).toLocaleString('nb-NO')} kr`,
      `Netto lønn: ${Math.round(netSalary).toLocaleString('nb-NO')} kr`
    ]
  });
  
  // Step 4: Calculate dividend component
  // Corporate tax on dividend portion
  const corporateTaxOnDividend = dividendPortion * CORPORATE_TAX_RATE;
  const dividendAvailable = dividendPortion - corporateTaxOnDividend;
  
  // Corporate tax on retained amount
  const corporateTaxOnRetained = retainedAmount * CORPORATE_TAX_RATE;
  
  // Total corporate tax
  const totalCorporateTax = corporateTaxOnDividend + corporateTaxOnRetained;
  
  // Dividend tax (no skjermingsfradrag applied proportionally for simplicity)
  // In reality, skjermingsfradrag would be applied to total dividends
  const dividendTaxResult = calculateDividendTax(dividendAvailable, 0);
  const dividendTax = dividendTaxResult.dividendTax;
  const netDividend = dividendTaxResult.netDividend;
  
  calculationSteps.push({
    step: 'Utbytteberegning',
    details: [
      `Overskudd til utbytte: ${Math.round(dividendPortion).toLocaleString('nb-NO')} kr`,
      `Selskapsskatt (22%): ${Math.round(corporateTaxOnDividend).toLocaleString('nb-NO')} kr`,
      `Utbytte før personskatt: ${Math.round(dividendAvailable).toLocaleString('nb-NO')} kr`,
      `Utbytteskatt (37.84%): ${Math.round(dividendTax).toLocaleString('nb-NO')} kr`,
      `Netto utbytte: ${Math.round(netDividend).toLocaleString('nb-NO')} kr`
    ]
  });
  
  // Step 5: Calculate totals
  const totalTax = employerAGA + totalSalaryTax + totalCorporateTax + dividendTax;
  const netPrivatePayout = netSalary + netDividend;
  const effectiveTaxRate = profit > 0 ? totalTax / profit : 0;
  const retainedAfterTax = retainedAmount - corporateTaxOnRetained;
  
  calculationSteps.push({
    step: 'Totalt',
    details: [
      `Arbeidsgiveravgift: ${Math.round(employerAGA).toLocaleString('nb-NO')} kr`,
      `Personskatt på lønn: ${Math.round(totalSalaryTax).toLocaleString('nb-NO')} kr`,
      `Selskapsskatt: ${Math.round(totalCorporateTax).toLocaleString('nb-NO')} kr`,
      `Utbytteskatt: ${Math.round(dividendTax).toLocaleString('nb-NO')} kr`,
      `Total skatt: ${Math.round(totalTax).toLocaleString('nb-NO')} kr`,
      `Netto privat utbetaling: ${Math.round(netPrivatePayout).toLocaleString('nb-NO')} kr`,
      `Effektiv skattesats: ${(effectiveTaxRate * 100).toFixed(2)}%`
    ]
  });
  
  return {
    scenarioType: 'combination',
    scenarioName: `Kombinasjon (${salaryRatio.toFixed(0)}% lønn / ${(100-salaryRatio).toFixed(0)}% utbytte)`,
    
    input: {
      profit,
      zone,
      salaryRatio,
      dividendRatio: 100 - salaryRatio,
      includePension,
      pensionRate,
      retentionPercentage,
      shareCostBasis
    },
    
    company: {
      profit,
      retainedAmount: Math.round(retainedAmount),
      retainedAfterTax: Math.round(retainedAfterTax),
      salaryPortion: Math.round(salaryPortion),
      dividendPortion: Math.round(dividendPortion),
      grossSalaryPaid: grossSalary,
      employerAGA: Math.round(employerAGA),
      pensionContribution: Math.round(pensionContribution),
      corporateTax: Math.round(totalCorporateTax),
      dividendDistributed: Math.round(dividendAvailable)
    },
    
    personal: {
      grossSalary: grossSalary,
      trygdeavgift: Math.round(trygdeavgift),
      trinnskatt: Math.round(trinnskatt),
      inntektsskatt: Math.round(inntektsskatt),
      totalSalaryTax: Math.round(totalSalaryTax),
      netSalary: Math.round(netSalary),
      dividendReceived: Math.round(dividendAvailable),
      dividendTax: Math.round(dividendTax),
      netDividend: Math.round(netDividend),
      pensionAccrued: Math.round(pensionContribution)
    },
    
    taxSummary: {
      employerAGA: Math.round(employerAGA),
      corporateTax: Math.round(totalCorporateTax),
      salaryTax: Math.round(totalSalaryTax),
      dividendTax: Math.round(dividendTax),
      totalTax: Math.round(totalTax),
      effectiveTaxRate: effectiveTaxRate
    },
    
    results: {
      netPrivatePayout: Math.round(netPrivatePayout),
      totalTaxPaid: Math.round(totalTax),
      effectiveTaxRate: effectiveTaxRate,
      retainedInCompany: Math.round(retainedAfterTax)
    },
    
    calculationSteps,
    
    assumptions: [
      'Én aksjonær/ansatt',
      'Ingen andre inntektskilder',
      'Standard ansettelsesforhold',
      'Skjermingsfradrag ikke medregnet i kombinasjonsscenario',
      'Pensjonsbidrag beregnes kun på lønnsandelen'
    ]
  };
}

/**
 * Finds the optimal salary/dividend ratio that minimizes total tax.
 * 
 * Uses a simple search algorithm to find the ratio that gives
 * the highest net private payout (lowest total tax).
 * 
 * @param {number} profit - Total company profit
 * @param {string} zone - Employer zone
 * @param {Object} options - Additional options
 * @returns {Object} Optimal scenario with comparison data
 */
export function findOptimalRatio(profit, zone, options = {}) {
  const {
    searchStep = 1, // Search in 1% increments
    includePension = false,
    pensionRate = 0.02,
    retentionPercentage = 0,
    shareCostBasis = 0
  } = options;
  
  let optimalRatio = 0;
  let optimalNetPayout = 0;
  let optimalTax = Infinity;
  const searchResults = [];
  
  // Search through all ratios
  for (let ratio = 0; ratio <= 100; ratio += searchStep) {
    try {
      const scenario = calculateCombinationScenario(profit, zone, ratio, {
        includePension,
        pensionRate,
        retentionPercentage,
        shareCostBasis
      });
      
      searchResults.push({
        salaryRatio: ratio,
        netPayout: scenario.results.netPrivatePayout,
        totalTax: scenario.results.totalTaxPaid,
        effectiveRate: scenario.results.effectiveTaxRate
      });
      
      if (scenario.results.netPrivatePayout > optimalNetPayout) {
        optimalNetPayout = scenario.results.netPrivatePayout;
        optimalRatio = ratio;
        optimalTax = scenario.results.totalTaxPaid;
      }
    } catch (e) {
      // Skip invalid combinations
      continue;
    }
  }
  
  // Get the full optimal scenario
  const optimalScenario = calculateCombinationScenario(profit, zone, optimalRatio, {
    includePension,
    pensionRate,
    retentionPercentage,
    shareCostBasis
  });
  
  // Find comparison points
  const scenario100Salary = calculateCombinationScenario(profit, zone, 100, options);
  const scenario100Dividend = calculateCombinationScenario(profit, zone, 0, options);
  const scenario5050 = calculateCombinationScenario(profit, zone, 50, options);
  
  return {
    optimalRatio,
    optimalScenario: {
      ...optimalScenario,
      scenarioName: `Optimalisert (${optimalRatio}% lønn / ${100-optimalRatio}% utbytte)`
    },
    searchResults,
    comparison: {
      optimal: {
        ratio: optimalRatio,
        netPayout: optimalNetPayout,
        totalTax: optimalTax,
        effectiveRate: optimalTax / profit
      },
      allSalary: {
        ratio: 100,
        netPayout: scenario100Salary.results.netPrivatePayout,
        totalTax: scenario100Salary.results.totalTaxPaid,
        effectiveRate: scenario100Salary.results.effectiveTaxRate
      },
      allDividend: {
        ratio: 0,
        netPayout: scenario100Dividend.results.netPrivatePayout,
        totalTax: scenario100Dividend.results.totalTaxPaid,
        effectiveRate: scenario100Dividend.results.effectiveTaxRate
      },
      split5050: {
        ratio: 50,
        netPayout: scenario5050.results.netPrivatePayout,
        totalTax: scenario5050.results.totalTaxPaid,
        effectiveRate: scenario5050.results.effectiveTaxRate
      }
    },
    savings: {
      vsAllSalary: optimalNetPayout - scenario100Salary.results.netPrivatePayout,
      vsAllDividend: optimalNetPayout - scenario100Dividend.results.netPrivatePayout,
      vsSplit5050: optimalNetPayout - scenario5050.results.netPrivatePayout
    },
    analysis: generateOptimizationAnalysis(optimalRatio, profit, zone)
  };
}

/**
 * Generates analysis text explaining the optimization result.
 * 
 * @param {number} optimalRatio - The optimal salary ratio found
 * @param {number} profit - The profit amount
 * @param {string} zone - The employer zone
 * @returns {Object} Analysis with explanations
 */
function generateOptimizationAnalysis(optimalRatio, profit, zone) {
  const agaRate = EMPLOYER_SOCIAL_SECURITY_RATES[zone];
  
  const analysis = {
    summary: '',
    factors: [],
    recommendations: []
  };
  
  if (optimalRatio >= 90) {
    analysis.summary = 'Høy lønnsandel er optimalt for dette overskuddsnivået.';
    analysis.factors.push('Lavere trinnskatt enn utbytteskatt på dette inntektsnivået');
    analysis.factors.push('Minstefradrag og personfradrag reduserer skattegrunnlaget');
    analysis.recommendations.push('Vurder å øke pensjonsbidrag for ytterligere skattebesparelse');
    analysis.recommendations.push('Husk at lønn gir opptjening i folketrygden');
  } else if (optimalRatio <= 10) {
    analysis.summary = 'Utbytte er mest skatteeffektivt for dette overskuddsnivået.';
    analysis.factors.push('Høy arbeidsgiveravgift gjør lønn kostbart');
    analysis.factors.push('Høy trinnskatt på store lønnsuttak');
    analysis.recommendations.push('Vurder om pensjonsopptjening er viktig (krever lønn)');
    analysis.recommendations.push('Skjermingsfradrag kan redusere utbytteskatten');
  } else {
    analysis.summary = `En kombinasjon med ${optimalRatio}% lønn gir best resultat.`;
    analysis.factors.push('Lønn opp til et visst nivå er skattemessig gunstig');
    analysis.factors.push('Utbytte er gunstigere for beløp over trinnskattgrensene');
    analysis.factors.push(`Arbeidsgiveravgiftssats i sone ${zone}: ${(agaRate * 100).toFixed(1)}%`);
    analysis.recommendations.push('Juster fordelingen basert på dine personlige behov');
    analysis.recommendations.push('Vurder pensjon, sykepenger og andre trygderettigheter');
  }
  
  // Add zone-specific advice
  if (zone === '5') {
    analysis.factors.push('Ingen arbeidsgiveravgift i sone 5 gjør lønn mer attraktivt');
  } else if (zone === '1' || zone === '1a') {
    analysis.factors.push('Høy arbeidsgiveravgift (14.1%) øker kostnaden ved lønn');
  }
  
  return analysis;
}

/**
 * Calculates key breakpoints where tax efficiency changes.
 * 
 * Useful for understanding at what salary levels the tax situation changes.
 * 
 * @param {string} zone - Employer zone
 * @returns {Object} Key breakpoints with explanations
 */
export function calculateBreakpoints(zone) {
  const agaRate = EMPLOYER_SOCIAL_SECURITY_RATES[zone];
  const brackets = BRACKET_TAX_2025;
  
  const breakpoints = [
    {
      name: 'Trinnskatt trinn 1',
      threshold: brackets[0].threshold,
      description: `Over ${brackets[0].threshold.toLocaleString('nb-NO')} kr: ${(brackets[0].rate * 100).toFixed(1)}% ekstra skatt`
    },
    {
      name: 'Trinnskatt trinn 2',
      threshold: brackets[1].threshold,
      description: `Over ${brackets[1].threshold.toLocaleString('nb-NO')} kr: ${(brackets[1].rate * 100).toFixed(1)}% ekstra skatt`
    },
    {
      name: 'Trinnskatt trinn 3',
      threshold: brackets[2].threshold,
      description: `Over ${brackets[2].threshold.toLocaleString('nb-NO')} kr: ${(brackets[2].rate * 100).toFixed(1)}% ekstra skatt`
    },
    {
      name: 'Trinnskatt trinn 4',
      threshold: brackets[3].threshold,
      description: `Over ${brackets[3].threshold.toLocaleString('nb-NO')} kr: ${(brackets[3].rate * 100).toFixed(1)}% ekstra skatt`
    },
    {
      name: 'Trinnskatt trinn 5',
      threshold: brackets[4].threshold,
      description: `Over ${brackets[4].threshold.toLocaleString('nb-NO')} kr: ${(brackets[4].rate * 100).toFixed(1)}% ekstra skatt`
    }
  ];
  
  // Calculate marginal tax rates at each level
  breakpoints.forEach((bp, index) => {
    const baseMarginalRate = PERSONAL_TAX_RATE + SOCIAL_SECURITY_RATES.salary;
    const bracketRate = brackets[index].rate;
    bp.marginalTaxRate = baseMarginalRate + bracketRate;
    bp.totalCostWithAGA = bp.marginalTaxRate + agaRate * (1 - bp.marginalTaxRate);
  });
  
  return {
    zone,
    agaRate,
    breakpoints,
    dividendEffectiveRate: EFFECTIVE_DIVIDEND_TAX_RATE,
    combinedDividendRate: 1 - (1 - CORPORATE_TAX_RATE) * (1 - EFFECTIVE_DIVIDEND_TAX_RATE),
    analysis: `Med ${(agaRate * 100).toFixed(1)}% arbeidsgiveravgift i sone ${zone}`
  };
}

export default {
  calculateCombinationScenario,
  findOptimalRatio,
  calculateBreakpoints
};
