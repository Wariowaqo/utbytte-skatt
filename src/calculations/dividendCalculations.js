/**
 * Dividend Tax Calculation Module
 * 
 * Calculates all taxes related to dividend extraction from a Norwegian AS.
 * Each calculation step is documented with sources and assumptions.
 * 
 * Tax components for dividends:
 * 1. Corporate tax (selskapsskatt) - 22% on profits before distribution
 * 2. Dividend tax with gross-up factor (utbytteskatt med oppjustering)
 * 
 * The shareholder model (aksjonærmodellen) applies:
 * - Company pays corporate tax first (22%)
 * - Remaining profit can be distributed as dividends
 * - Dividends are grossed up by 1.72 (2025) before applying 22% tax
 * - Effective dividend tax rate: 22% × 1.72 = 37.84%
 * - Skjermingsfradrag can reduce the taxable dividend
 * 
 * Sources:
 * - Skatteetaten: https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/aksjer-og-verdipapirer/utbytte/
 * - Lovdata: Skatteloven § 10-11, § 10-12
 */

import {
  CORPORATE_TAX_RATE,
  PERSONAL_TAX_RATE,
  DIVIDEND_GROSS_UP_FACTOR,
  EFFECTIVE_DIVIDEND_TAX_RATE,
  SKJERMING_RATE_2025
} from '../config/taxRates.js';

/**
 * Calculates corporate tax on profits.
 * 
 * Source: Skatteetaten - "Skatt på alminnelig inntekt for selskap"
 * URL: https://www.skatteetaten.no/satser/skatt-pa-alminnelig-inntekt/
 * Year: 2025
 * 
 * @param {number} profit - Profit before tax
 * @returns {Object} Corporate tax calculation
 */
export function calculateCorporateTax(profit) {
  const corporateTax = profit * CORPORATE_TAX_RATE;
  const profitAfterTax = profit - corporateTax;
  
  return {
    profit: profit,
    corporateTax: Math.round(corporateTax),
    profitAfterTax: Math.round(profitAfterTax),
    rate: CORPORATE_TAX_RATE,
    calculationSteps: [
      `Overskudd før skatt: ${profit.toLocaleString('nb-NO')} kr`,
      `Selskapsskattesats: ${(CORPORATE_TAX_RATE * 100)}%`,
      `Selskapsskatt: ${profit.toLocaleString('nb-NO')} × ${(CORPORATE_TAX_RATE * 100)}% = ${Math.round(corporateTax).toLocaleString('nb-NO')} kr`,
      `Overskudd etter skatt: ${profit.toLocaleString('nb-NO')} - ${Math.round(corporateTax).toLocaleString('nb-NO')} = ${Math.round(profitAfterTax).toLocaleString('nb-NO')} kr`
    ]
  };
}

/**
 * Calculates skjermingsfradrag (tax-free allowance on shares).
 * 
 * Skjermingsfradrag reduces the taxable dividend amount.
 * It is calculated as: Cost basis × Skjermingsrente
 * 
 * Source: Skatteetaten - "Skjermingsfradrag"
 * URL: https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/aksjer-og-verdipapirer/skjermingsfradrag/
 * Year: 2025
 * 
 * Assumptions:
 * - Shares owned at year end
 * - No unused skjermingsfradrag from previous years
 * 
 * @param {number} costBasis - The cost basis (inngangsverdi) of shares
 * @param {number} skjermingRate - The skjermingsrente for the year
 * @returns {Object} Skjermingsfradrag calculation
 */
export function calculateSkjermingsfradrag(costBasis, skjermingRate = SKJERMING_RATE_2025) {
  if (!costBasis || costBasis <= 0) {
    return {
      costBasis: 0,
      skjermingRate: skjermingRate,
      skjermingsfradrag: 0,
      calculationSteps: [
        'Inngangsverdi ikke oppgitt - skjermingsfradrag beregnes ikke'
      ]
    };
  }
  
  const skjermingsfradrag = costBasis * skjermingRate;
  
  return {
    costBasis: costBasis,
    skjermingRate: skjermingRate,
    skjermingsfradrag: Math.round(skjermingsfradrag),
    calculationSteps: [
      `Inngangsverdi (kostpris): ${costBasis.toLocaleString('nb-NO')} kr`,
      `Skjermingsrente: ${(skjermingRate * 100).toFixed(2)}%`,
      `Skjermingsfradrag: ${costBasis.toLocaleString('nb-NO')} × ${(skjermingRate * 100).toFixed(2)}% = ${Math.round(skjermingsfradrag).toLocaleString('nb-NO')} kr`
    ]
  };
}

/**
 * Calculates dividend tax using the shareholder model (aksjonærmodellen).
 * 
 * The shareholder model:
 * 1. Dividend is grossed up by oppjusteringsfaktor (1.72 in 2025)
 * 2. 22% tax is applied to the grossed-up amount
 * 3. Skjermingsfradrag can reduce the taxable amount
 * 
 * Formula:
 * Taxable amount = (Dividend - Skjermingsfradrag) × Gross-up factor
 * Tax = Taxable amount × 22%
 * Effective rate = 22% × 1.72 = 37.84%
 * 
 * Source: Skatteetaten - "Aksjer og utbytte"
 * URL: https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/aksjer-og-verdipapirer/utbytte/
 * Year: 2025
 * 
 * @param {number} dividendAmount - The dividend amount before personal tax
 * @param {number} skjermingsfradrag - Tax-free allowance (default 0)
 * @returns {Object} Dividend tax calculation
 */
export function calculateDividendTax(dividendAmount, skjermingsfradrag = 0) {
  // Step 1: Calculate taxable dividend after skjermingsfradrag
  const taxableDividend = Math.max(0, dividendAmount - skjermingsfradrag);
  
  // Step 2: Apply gross-up factor
  const grossedUpDividend = taxableDividend * DIVIDEND_GROSS_UP_FACTOR;
  
  // Step 3: Calculate tax at personal rate
  const dividendTax = grossedUpDividend * PERSONAL_TAX_RATE;
  
  // Step 4: Calculate effective rate on original dividend
  const effectiveRate = dividendAmount > 0 ? dividendTax / dividendAmount : 0;
  
  // Step 5: Net dividend after tax
  const netDividend = dividendAmount - dividendTax;
  
  return {
    dividendAmount: dividendAmount,
    skjermingsfradrag: skjermingsfradrag,
    taxableDividend: Math.round(taxableDividend),
    grossUpFactor: DIVIDEND_GROSS_UP_FACTOR,
    grossedUpDividend: Math.round(grossedUpDividend),
    personalTaxRate: PERSONAL_TAX_RATE,
    dividendTax: Math.round(dividendTax),
    netDividend: Math.round(netDividend),
    effectiveRate: effectiveRate,
    theoreticalMaxRate: EFFECTIVE_DIVIDEND_TAX_RATE,
    calculationSteps: [
      `Utbytte: ${dividendAmount.toLocaleString('nb-NO')} kr`,
      `Skjermingsfradrag: ${skjermingsfradrag.toLocaleString('nb-NO')} kr`,
      `Skattepliktig utbytte: ${dividendAmount.toLocaleString('nb-NO')} - ${skjermingsfradrag.toLocaleString('nb-NO')} = ${Math.round(taxableDividend).toLocaleString('nb-NO')} kr`,
      `Oppjusteringsfaktor: ${DIVIDEND_GROSS_UP_FACTOR}`,
      `Oppjustert utbytte: ${Math.round(taxableDividend).toLocaleString('nb-NO')} × ${DIVIDEND_GROSS_UP_FACTOR} = ${Math.round(grossedUpDividend).toLocaleString('nb-NO')} kr`,
      `Utbytteskatt: ${Math.round(grossedUpDividend).toLocaleString('nb-NO')} × ${(PERSONAL_TAX_RATE * 100)}% = ${Math.round(dividendTax).toLocaleString('nb-NO')} kr`,
      `Effektiv skattesats på utbytte: ${(effectiveRate * 100).toFixed(2)}%`,
      `Netto utbytte: ${dividendAmount.toLocaleString('nb-NO')} - ${Math.round(dividendTax).toLocaleString('nb-NO')} = ${Math.round(netDividend).toLocaleString('nb-NO')} kr`
    ]
  };
}

/**
 * Calculates combined tax burden for dividend extraction.
 * 
 * Total tax consists of:
 * 1. Corporate tax on profits (22%)
 * 2. Personal tax on dividends (effective ~37.84%)
 * 
 * Combined effective rate (ignoring skjermingsfradrag):
 * 1 - (1 - 0.22) × (1 - 0.3784) = 1 - 0.78 × 0.6216 = 1 - 0.4848 = 51.52%
 * 
 * @param {number} profit - Profit before corporate tax
 * @param {number} skjermingsfradrag - Tax-free allowance (optional)
 * @returns {Object} Combined tax calculation
 */
export function calculateCombinedDividendTax(profit, skjermingsfradrag = 0) {
  // Step 1: Calculate corporate tax
  const corporateTaxResult = calculateCorporateTax(profit);
  const profitAfterCorporateTax = corporateTaxResult.profitAfterTax;
  
  // Step 2: The remaining amount is available for dividend distribution
  const dividendAvailable = profitAfterCorporateTax;
  
  // Step 3: Calculate dividend tax
  const dividendTaxResult = calculateDividendTax(dividendAvailable, skjermingsfradrag);
  
  // Step 4: Calculate combined totals
  const totalTax = corporateTaxResult.corporateTax + dividendTaxResult.dividendTax;
  const netPrivatePayout = dividendTaxResult.netDividend;
  const combinedEffectiveRate = profit > 0 ? totalTax / profit : 0;
  
  return {
    profit: profit,
    corporateTax: corporateTaxResult.corporateTax,
    profitAfterCorporateTax: profitAfterCorporateTax,
    dividendDistributed: dividendAvailable,
    skjermingsfradrag: skjermingsfradrag,
    dividendTax: dividendTaxResult.dividendTax,
    totalTax: Math.round(totalTax),
    netPrivatePayout: Math.round(netPrivatePayout),
    combinedEffectiveRate: combinedEffectiveRate,
    corporateTaxResult: corporateTaxResult,
    dividendTaxResult: dividendTaxResult,
    calculationSteps: [
      '--- SELSKAPSNIVÅ ---',
      ...corporateTaxResult.calculationSteps,
      '',
      '--- PERSONLIG NIVÅ ---',
      ...dividendTaxResult.calculationSteps,
      '',
      '--- TOTALT ---',
      `Total skatt: ${corporateTaxResult.corporateTax.toLocaleString('nb-NO')} + ${dividendTaxResult.dividendTax.toLocaleString('nb-NO')} = ${Math.round(totalTax).toLocaleString('nb-NO')} kr`,
      `Netto privat utbetaling: ${Math.round(netPrivatePayout).toLocaleString('nb-NO')} kr`,
      `Kombinert effektiv skattesats: ${(combinedEffectiveRate * 100).toFixed(2)}%`
    ]
  };
}

/**
 * Calculates complete dividend tax scenario.
 * 
 * This function orchestrates all dividend-related tax calculations
 * and provides a complete breakdown of taxes and net payout.
 * 
 * Assumptions:
 * - Single shareholder
 * - No other dividend income
 * - Shares held at end of year (for skjermingsfradrag)
 * - All profit after corporate tax is distributed as dividend
 * 
 * @param {number} profit - Company profit before tax
 * @param {Object} options - Optional settings
 * @param {number} options.retentionPercentage - Percentage of profit to retain (0-1)
 * @param {number} options.shareCostBasis - Cost basis for skjermingsfradrag calculation
 * @returns {Object} Complete dividend scenario calculation
 */
export function calculateDividendScenario(profit, options = {}) {
  const {
    retentionPercentage = 0,
    shareCostBasis = 0
  } = options;
  
  const calculationSteps = [];
  
  // Step 1: Calculate retention
  const retainedBeforeTax = profit * retentionPercentage;
  const availableForDividend = profit - retainedBeforeTax;
  
  calculationSteps.push({
    step: 'Tilbakeholdt overskudd',
    description: retentionPercentage > 0 
      ? `${(retentionPercentage * 100).toFixed(0)}% av overskuddet (${Math.round(retainedBeforeTax).toLocaleString('nb-NO')} kr) beholdes i selskapet`
      : 'Alt overskudd tas ut som utbytte'
  });
  
  // Step 2: Calculate corporate tax on entire profit
  const corporateTaxResult = calculateCorporateTax(profit);
  const totalCorporateTax = corporateTaxResult.corporateTax;
  
  // Corporate tax on retained portion
  const corporateTaxOnRetained = retainedBeforeTax * CORPORATE_TAX_RATE;
  const retainedAfterTax = retainedBeforeTax - corporateTaxOnRetained;
  
  // Corporate tax on distributed portion
  const corporateTaxOnDistributed = availableForDividend * CORPORATE_TAX_RATE;
  const dividendAvailable = availableForDividend - corporateTaxOnDistributed;
  
  calculationSteps.push({
    step: 'Selskapsskatt',
    details: [
      `Total selskapsskatt: ${Math.round(totalCorporateTax).toLocaleString('nb-NO')} kr`,
      `- På tilbakeholdt: ${Math.round(corporateTaxOnRetained).toLocaleString('nb-NO')} kr`,
      `- På utdelt: ${Math.round(corporateTaxOnDistributed).toLocaleString('nb-NO')} kr`,
      `Disponibelt for utbytte: ${Math.round(dividendAvailable).toLocaleString('nb-NO')} kr`
    ]
  });
  
  // Step 3: Calculate skjermingsfradrag
  const skjermingResult = calculateSkjermingsfradrag(shareCostBasis);
  const skjermingsfradrag = Math.min(skjermingResult.skjermingsfradrag, dividendAvailable);
  
  calculationSteps.push({
    step: 'Skjermingsfradrag',
    details: skjermingResult.calculationSteps
  });
  
  // Step 4: Calculate dividend tax
  const dividendTaxResult = calculateDividendTax(dividendAvailable, skjermingsfradrag);
  
  calculationSteps.push({
    step: 'Utbytteskatt',
    details: dividendTaxResult.calculationSteps
  });
  
  // Step 5: Calculate totals
  const totalTax = totalCorporateTax + dividendTaxResult.dividendTax;
  const netPrivatePayout = dividendTaxResult.netDividend;
  const effectiveTaxRate = profit > 0 ? totalTax / profit : 0;
  
  calculationSteps.push({
    step: 'Oppsummering',
    details: [
      `Total selskapsskatt: ${Math.round(totalCorporateTax).toLocaleString('nb-NO')} kr`,
      `Total utbytteskatt: ${Math.round(dividendTaxResult.dividendTax).toLocaleString('nb-NO')} kr`,
      `Total skatt: ${Math.round(totalTax).toLocaleString('nb-NO')} kr`,
      `Netto privat utbetaling: ${Math.round(netPrivatePayout).toLocaleString('nb-NO')} kr`,
      `Effektiv skattesats: ${(effectiveTaxRate * 100).toFixed(2)}%`
    ]
  });
  
  return {
    scenarioType: 'dividend',
    scenarioName: '100% Utbytte',
    
    // Input values
    input: {
      profit,
      retentionPercentage,
      shareCostBasis
    },
    
    // Company level
    company: {
      profit: profit,
      corporateTax: Math.round(totalCorporateTax),
      profitAfterTax: Math.round(profit - totalCorporateTax),
      retainedBeforeTax: Math.round(retainedBeforeTax),
      retainedAfterTax: Math.round(retainedAfterTax),
      dividendDistributed: Math.round(dividendAvailable)
    },
    
    // Personal level
    personal: {
      dividendReceived: Math.round(dividendAvailable),
      skjermingsfradrag: Math.round(skjermingsfradrag),
      taxableDividend: dividendTaxResult.taxableDividend,
      dividendTax: Math.round(dividendTaxResult.dividendTax),
      netDividend: Math.round(netPrivatePayout)
    },
    
    // Tax summary
    taxSummary: {
      corporateTax: Math.round(totalCorporateTax),
      dividendTax: Math.round(dividendTaxResult.dividendTax),
      totalTax: Math.round(totalTax),
      effectiveTaxRate: effectiveTaxRate,
      effectiveDividendTaxRate: dividendTaxResult.effectiveRate
    },
    
    // Final results
    results: {
      netPrivatePayout: Math.round(netPrivatePayout),
      totalTaxPaid: Math.round(totalTax),
      effectiveTaxRate: effectiveTaxRate,
      retainedInCompany: Math.round(retainedAfterTax)
    },
    
    // Calculation breakdown
    calculationSteps,
    
    // Assumptions documented
    assumptions: [
      'Én aksjonær',
      'Ingen andre utbytteinntekter dette året',
      'Aksjene eies ved årsslutt (for skjermingsfradrag)',
      'Alt overskudd etter skatt distribueres som utbytte (med mindre tilbakeholdt)',
      'Ingen ubenyttet skjermingsfradrag fra tidligere år'
    ]
  };
}

export default {
  calculateCorporateTax,
  calculateSkjermingsfradrag,
  calculateDividendTax,
  calculateCombinedDividendTax,
  calculateDividendScenario
};
