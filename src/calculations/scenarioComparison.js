/**
 * Scenario Comparison Engine
 * 
 * Generates and compares multiple extraction scenarios automatically.
 * Provides comprehensive comparison tables and recommendations.
 */

import { calculateSalaryScenario } from './salaryCalculations.js';
import { calculateDividendScenario } from './dividendCalculations.js';
import { calculateCombinationScenario, findOptimalRatio, calculateBreakpoints } from './combinationCalculations.js';
import { validateCalculationInput } from '../validation/inputValidation.js';

/**
 * Generates all standard scenarios for comparison.
 * 
 * @param {Object} input - Validated input parameters
 * @returns {Object} All scenarios with comparisons
 */
export function generateAllScenarios(input) {
  // Validate input first
  const validation = validateCalculationInput(input);
  
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      scenarios: null
    };
  }
  
  const { profit, employerZone, pension, retention, shareCostBasis } = validation.sanitizedInput;
  
  const options = {
    includePension: pension?.enabled || false,
    pensionRate: pension?.rate || 0.02,
    retentionPercentage: retention?.percentage || 0,
    shareCostBasis: shareCostBasis || 0
  };
  
  const scenarios = {};
  
  // Scenario 1: 100% Salary
  try {
    scenarios.allSalary = calculateSalaryScenario(profit, employerZone, {
      includePension: options.includePension,
      pensionRate: options.pensionRate,
      retentionPercentage: options.retentionPercentage
    });
  } catch (error) {
    scenarios.allSalary = { error: error.message };
  }
  
  // Scenario 2: 100% Dividend
  try {
    scenarios.allDividend = calculateDividendScenario(profit, {
      retentionPercentage: options.retentionPercentage,
      shareCostBasis: options.shareCostBasis
    });
  } catch (error) {
    scenarios.allDividend = { error: error.message };
  }
  
  // Scenario 3: 50/50 Split
  try {
    scenarios.split5050 = calculateCombinationScenario(profit, employerZone, 50, options);
  } catch (error) {
    scenarios.split5050 = { error: error.message };
  }
  
  // Scenario 4: Optimized combination
  try {
    const optimizationResult = findOptimalRatio(profit, employerZone, options);
    scenarios.optimized = optimizationResult.optimalScenario;
    scenarios.optimizationDetails = {
      optimalRatio: optimizationResult.optimalRatio,
      comparison: optimizationResult.comparison,
      savings: optimizationResult.savings,
      analysis: optimizationResult.analysis
    };
  } catch (error) {
    scenarios.optimized = { error: error.message };
  }
  
  // Scenario 5: Retention strategy (if not already applied)
  if (options.retentionPercentage === 0) {
    try {
      scenarios.withRetention = calculateCombinationScenario(profit, employerZone, 
        scenarios.optimizationDetails?.optimalRatio || 50, 
        { ...options, retentionPercentage: 0.3 } // 30% retention
      );
    } catch (error) {
      scenarios.withRetention = { error: error.message };
    }
  }
  
  return {
    success: true,
    input: validation.sanitizedInput,
    warnings: validation.warnings,
    scenarios,
    comparison: generateComparisonTable(scenarios),
    recommendations: generateRecommendations(scenarios, profit, employerZone)
  };
}

/**
 * Generates a comparison table from scenarios.
 * 
 * @param {Object} scenarios - All calculated scenarios
 * @returns {Object} Comparison table data
 */
function generateComparisonTable(scenarios) {
  const rows = [];
  
  const scenarioList = [
    { key: 'allSalary', name: '100% Lønn' },
    { key: 'allDividend', name: '100% Utbytte' },
    { key: 'split5050', name: '50/50 Fordeling' },
    { key: 'optimized', name: 'Optimalisert' },
    { key: 'withRetention', name: 'Med tilbakeholdelse (30%)' }
  ];
  
  for (const { key, name } of scenarioList) {
    const scenario = scenarios[key];
    if (scenario && !scenario.error) {
      rows.push({
        name: scenario.scenarioName || name,
        grossPayout: scenario.results?.netPrivatePayout + scenario.results?.totalTaxPaid,
        totalTax: scenario.results?.totalTaxPaid,
        netPayout: scenario.results?.netPrivatePayout,
        effectiveRate: scenario.results?.effectiveTaxRate,
        retained: scenario.results?.retainedInCompany || 0
      });
    }
  }
  
  // Sort by net payout (descending)
  rows.sort((a, b) => b.netPayout - a.netPayout);
  
  // Calculate differences from best option
  const best = rows[0];
  rows.forEach((row, index) => {
    row.rank = index + 1;
    row.differenceFromBest = best.netPayout - row.netPayout;
    row.percentDifferenceFromBest = best.netPayout > 0 
      ? (row.differenceFromBest / best.netPayout) * 100 
      : 0;
  });
  
  return {
    headers: [
      { key: 'rank', label: 'Rang' },
      { key: 'name', label: 'Scenario' },
      { key: 'netPayout', label: 'Netto utbetaling', format: 'currency' },
      { key: 'totalTax', label: 'Total skatt', format: 'currency' },
      { key: 'effectiveRate', label: 'Effektiv skattesats', format: 'percent' },
      { key: 'retained', label: 'Beholdt i selskapet', format: 'currency' },
      { key: 'differenceFromBest', label: 'Forskjell fra beste', format: 'currency' }
    ],
    rows,
    bestScenario: best?.name,
    worstScenario: rows[rows.length - 1]?.name,
    maxDifference: rows[rows.length - 1]?.differenceFromBest
  };
}

/**
 * Generates personalized recommendations based on scenarios.
 * 
 * @param {Object} scenarios - All calculated scenarios
 * @param {number} profit - The profit amount
 * @param {string} zone - The employer zone
 * @returns {Object} Recommendations
 */
function generateRecommendations(scenarios, profit, zone) {
  const recommendations = {
    primary: null,
    alternatives: [],
    considerations: [],
    tradeoffs: []
  };
  
  // Determine best option
  const allResults = [];
  ['allSalary', 'allDividend', 'split5050', 'optimized'].forEach(key => {
    const s = scenarios[key];
    if (s && !s.error && s.results) {
      allResults.push({
        key,
        name: s.scenarioName,
        netPayout: s.results.netPrivatePayout,
        effectiveRate: s.results.effectiveTaxRate,
        scenario: s
      });
    }
  });
  
  allResults.sort((a, b) => b.netPayout - a.netPayout);
  
  if (allResults.length > 0) {
    const best = allResults[0];
    
    // Primary recommendation
    recommendations.primary = {
      scenario: best.name,
      reason: generateReasonForRecommendation(best.key, profit, zone),
      netPayout: best.netPayout,
      effectiveRate: best.effectiveRate
    };
    
    // Alternatives
    if (allResults.length > 1) {
      recommendations.alternatives = allResults.slice(1, 3).map(alt => ({
        scenario: alt.name,
        netPayout: alt.netPayout,
        difference: best.netPayout - alt.netPayout,
        reason: generateReasonForAlternative(alt.key)
      }));
    }
  }
  
  // General considerations
  recommendations.considerations = [
    {
      topic: 'Pensjonsopptjening',
      description: 'Lønn gir opptjening i folketrygden og pensjonsordninger. Utbytte gir ingen slik opptjening.',
      relevance: 'high'
    },
    {
      topic: 'Sykepenger',
      description: 'Sykepenger beregnes ut fra lønnsinntekt. Ren utbyttestrategi gir ingen sykepengegrunnlag.',
      relevance: 'high'
    },
    {
      topic: 'Fleksibilitet',
      description: 'Tilbakeholdt overskudd kan investeres i selskapet eller tas ut senere som utbytte.',
      relevance: 'medium'
    },
    {
      topic: 'Fremtidige regelendringer',
      description: 'Skatteregler kan endres. Diversifisering mellom lønn og utbytte gir risikospredning.',
      relevance: 'medium'
    }
  ];
  
  // Tradeoffs
  recommendations.tradeoffs = [
    {
      option: 'Høy lønn',
      pros: ['Pensjonsopptjening', 'Sykepengegrunnlag', 'Arbeidsledighetstrygd'],
      cons: ['Høyere marginalskatt ved høy inntekt', 'Arbeidsgiveravgift']
    },
    {
      option: 'Høyt utbytte',
      pros: ['Lavere skatt ved høy inntekt', 'Ingen arbeidsgiveravgift'],
      cons: ['Ingen trygdeopptjening', 'Dobbeltbeskatning (selskap + person)']
    },
    {
      option: 'Tilbakeholdelse',
      pros: ['Investeringsmuligheter', 'Skatteplanlegging over tid', 'Buffer for dårlige år'],
      cons: ['Penger bundet i selskapet', 'Fremtidig utbytteskatt']
    }
  ];
  
  return recommendations;
}

/**
 * Generates reason text for the primary recommendation.
 */
function generateReasonForRecommendation(key, profit, zone) {
  const reasons = {
    allSalary: `Med overskudd på ${profit.toLocaleString('nb-NO')} kr og arbeidsgiveravgiftssone ${zone}, gir ren lønnsstrategi best netto utbetaling. Trinnskatten er fortsatt lavere enn kombinert selskaps- og utbytteskatt.`,
    allDividend: `Med overskudd på ${profit.toLocaleString('nb-NO')} kr er ren utbyttestrategi mest effektiv. Den høye arbeidsgiveravgiften og trinnskatten gjør lønn mindre attraktivt.`,
    split5050: `En 50/50 fordeling gir god balanse mellom skatteeffektivitet og trygderettigheter.`,
    optimized: `Den optimaliserte fordelingen balanserer trinnskattens terskelgrenser mot utbytteskattens faste sats for å minimere total skatt.`
  };
  
  return reasons[key] || 'Basert på beregningene er dette den mest skatteeffektive strategien.';
}

/**
 * Generates reason text for alternative options.
 */
function generateReasonForAlternative(key) {
  const reasons = {
    allSalary: 'Gir pensjons- og trygdeopptjening',
    allDividend: 'Enklere å administrere, ingen lønnsutbetalinger',
    split5050: 'Balansert tilnærming med diversifisering',
    optimized: 'Mest skatteeffektiv basert på gjeldende regler'
  };
  
  return reasons[key] || '';
}

/**
 * Generates a detailed report for a specific scenario.
 * 
 * @param {Object} scenario - The scenario to report on
 * @returns {Object} Detailed report
 */
export function generateDetailedReport(scenario) {
  if (!scenario || scenario.error) {
    return { error: 'Invalid scenario' };
  }
  
  return {
    summary: {
      scenarioName: scenario.scenarioName,
      netPrivatePayout: scenario.results.netPrivatePayout,
      totalTaxPaid: scenario.results.totalTaxPaid,
      effectiveTaxRate: scenario.results.effectiveTaxRate,
      retainedInCompany: scenario.results.retainedInCompany
    },
    companyLevel: scenario.company,
    personalLevel: scenario.personal,
    taxBreakdown: scenario.taxSummary,
    calculationSteps: scenario.calculationSteps,
    assumptions: scenario.assumptions,
    metadata: {
      generatedAt: new Date().toISOString(),
      taxYear: 2025,
      disclaimer: 'Dette er en beregning for planleggingsformål. Konsulter en skatterådgiver for profesjonell rådgivning.'
    }
  };
}

/**
 * Exports comparison data in a format suitable for Excel.
 * 
 * @param {Object} comparisonResult - Result from generateAllScenarios
 * @returns {Object} Data structured for Excel export
 */
export function prepareExcelExport(comparisonResult) {
  if (!comparisonResult.success) {
    return { error: comparisonResult.errors };
  }
  
  const workbookData = {
    summary: {
      name: 'Sammendrag',
      columns: ['Scenario', 'Netto utbetaling', 'Total skatt', 'Effektiv skattesats', 'Forskjell fra beste'],
      rows: comparisonResult.comparison.rows.map(row => [
        row.name,
        row.netPayout,
        row.totalTax,
        row.effectiveRate,
        row.differenceFromBest
      ])
    },
    scenarios: {},
    metadata: {
      name: 'Forutsetninger',
      data: [
        ['Overskudd før skatt', comparisonResult.input.profit],
        ['Arbeidsgiveravgiftssone', comparisonResult.input.employerZone],
        ['Pensjon inkludert', comparisonResult.input.pension?.enabled ? 'Ja' : 'Nei'],
        ['Tilbakeholdelse', `${(comparisonResult.input.retention?.percentage || 0) * 100}%`],
        ['Beregningsdato', new Date().toLocaleDateString('nb-NO')],
        ['Skatteår', 2025]
      ]
    }
  };
  
  // Add individual scenario details
  for (const [key, scenario] of Object.entries(comparisonResult.scenarios)) {
    if (scenario && !scenario.error && scenario.calculationSteps) {
      workbookData.scenarios[key] = {
        name: scenario.scenarioName,
        steps: scenario.calculationSteps
      };
    }
  }
  
  return workbookData;
}

export default {
  generateAllScenarios,
  generateDetailedReport,
  prepareExcelExport
};
