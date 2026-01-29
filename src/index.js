/**
 * Norwegian Tax Calculator - Main Entry Point
 * 
 * This module exports all calculation functions for use as a library.
 * For the web server, use: npm start (runs server.js)
 */

// Tax Rates Configuration
export * from './config/taxRates.js';

// Salary Calculations
export {
  calculateMaxGrossSalary,
  calculateBracketTax,
  calculateSocialSecurityContribution,
  calculateMinstefradrag,
  calculateIncomeTax,
  calculateSalaryScenario
} from './calculations/salaryCalculations.js';

// Dividend Calculations
export {
  calculateCorporateTax,
  calculateSkjermingsfradrag,
  calculateDividendTax,
  calculateCombinedDividendTax,
  calculateDividendScenario
} from './calculations/dividendCalculations.js';

// Combination Calculations
export {
  calculateCombinationScenario,
  findOptimalRatio,
  calculateBreakpoints
} from './calculations/combinationCalculations.js';

// Scenario Comparison
export {
  generateAllScenarios,
  generateDetailedReport,
  prepareExcelExport
} from './calculations/scenarioComparison.js';

// Input Validation
export {
  validateProfit,
  validateEmployerZone,
  validatePercentage,
  validateWithdrawalStrategy,
  validatePensionSettings,
  validateRetentionSettings,
  validateShareCostBasis,
  validateCalculationInput
} from './validation/inputValidation.js';

/**
 * Quick calculation function for common use cases
 * 
 * @param {number} profit - Annual profit before tax
 * @param {string} zone - Employer zone (1, 1a, 2, 3, 4, 4a, 5)
 * @param {Object} options - Optional settings
 * @returns {Object} Comparison of all scenarios
 */
export function quickCalculate(profit, zone, options = {}) {
  const input = {
    profit,
    employerZone: zone,
    withdrawalStrategy: { type: 'combination', salaryRatio: 50 },
    pension: options.pension || { enabled: false },
    retention: options.retention || { enabled: false, percentage: 0 },
    shareCostBasis: options.shareCostBasis || 0
  };
  
  const { generateAllScenarios } = require('./calculations/scenarioComparison.js');
  return generateAllScenarios(input);
}
