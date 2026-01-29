/**
 * Input Validation Module
 * 
 * Validates all user inputs before calculations.
 * All inputs are treated as untrusted.
 * Returns detailed error messages explaining validation failures.
 */

import { 
  EMPLOYER_SOCIAL_SECURITY_RATES, 
  VALIDATION_LIMITS 
} from '../config/taxRates.js';

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the input passed validation
 * @property {string[]} errors - Array of error messages
 * @property {Object} sanitizedInput - Cleaned and typed input values
 */

/**
 * Validates the profit amount
 * 
 * @param {any} profit - The profit value to validate
 * @returns {Object} Validation result with sanitized value or error
 */
export function validateProfit(profit) {
  const errors = [];
  
  if (profit === undefined || profit === null || profit === '') {
    errors.push('Overskudd før skatt er påkrevd (Annual profit before tax is required)');
    return { isValid: false, errors, value: null };
  }
  
  const numericProfit = Number(profit);
  
  if (isNaN(numericProfit)) {
    errors.push('Overskudd må være et tall (Profit must be a number)');
    return { isValid: false, errors, value: null };
  }
  
  if (numericProfit < VALIDATION_LIMITS.MIN_PROFIT) {
    errors.push(`Overskudd kan ikke være negativt (Profit cannot be negative)`);
    return { isValid: false, errors, value: null };
  }
  
  if (numericProfit > VALIDATION_LIMITS.MAX_PROFIT) {
    errors.push(`Overskudd overstiger maksimalt tillatt beløp på ${VALIDATION_LIMITS.MAX_PROFIT.toLocaleString('nb-NO')} kr`);
    return { isValid: false, errors, value: null };
  }
  
  return { isValid: true, errors: [], value: numericProfit };
}

/**
 * Validates the employer zone
 * 
 * @param {any} zone - The zone value to validate
 * @returns {Object} Validation result with sanitized value or error
 */
export function validateEmployerZone(zone) {
  const errors = [];
  const validZones = Object.keys(EMPLOYER_SOCIAL_SECURITY_RATES);
  
  if (zone === undefined || zone === null || zone === '') {
    errors.push('Arbeidsgiveravgiftssone er påkrevd (Employer social security zone is required)');
    return { isValid: false, errors, value: null };
  }
  
  const zoneStr = String(zone);
  
  if (!validZones.includes(zoneStr)) {
    errors.push(`Ugyldig sone. Gyldige verdier er: ${validZones.join(', ')} (Invalid zone. Valid values are: ${validZones.join(', ')})`);
    return { isValid: false, errors, value: null };
  }
  
  return { isValid: true, errors: [], value: zoneStr };
}

/**
 * Validates a percentage value (0-100)
 * 
 * @param {any} percentage - The percentage to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Object} Validation result
 */
export function validatePercentage(percentage, fieldName) {
  const errors = [];
  
  if (percentage === undefined || percentage === null || percentage === '') {
    errors.push(`${fieldName} er påkrevd (${fieldName} is required)`);
    return { isValid: false, errors, value: null };
  }
  
  const numericPercentage = Number(percentage);
  
  if (isNaN(numericPercentage)) {
    errors.push(`${fieldName} må være et tall (${fieldName} must be a number)`);
    return { isValid: false, errors, value: null };
  }
  
  if (numericPercentage < VALIDATION_LIMITS.MIN_PERCENTAGE || 
      numericPercentage > VALIDATION_LIMITS.MAX_PERCENTAGE) {
    errors.push(`${fieldName} må være mellom 0 og 100 (${fieldName} must be between 0 and 100)`);
    return { isValid: false, errors, value: null };
  }
  
  return { isValid: true, errors: [], value: numericPercentage };
}

/**
 * Validates the withdrawal strategy
 * 
 * @param {Object} strategy - The withdrawal strategy object
 * @returns {Object} Validation result
 */
export function validateWithdrawalStrategy(strategy) {
  const errors = [];
  
  if (!strategy || typeof strategy !== 'object') {
    errors.push('Uttaksstrategi er påkrevd (Withdrawal strategy is required)');
    return { isValid: false, errors, value: null };
  }
  
  const validTypes = ['salary', 'dividend', 'combination'];
  
  if (!validTypes.includes(strategy.type)) {
    errors.push(`Ugyldig strategitype. Gyldige verdier er: ${validTypes.join(', ')}`);
    return { isValid: false, errors, value: null };
  }
  
  if (strategy.type === 'combination') {
    const salaryRatioResult = validatePercentage(strategy.salaryRatio, 'Lønnsandel');
    if (!salaryRatioResult.isValid) {
      return salaryRatioResult;
    }
    
    // The dividend ratio is implicitly 100 - salaryRatio
    const dividendRatio = 100 - salaryRatioResult.value;
    
    return {
      isValid: true,
      errors: [],
      value: {
        type: 'combination',
        salaryRatio: salaryRatioResult.value,
        dividendRatio: dividendRatio
      }
    };
  }
  
  return {
    isValid: true,
    errors: [],
    value: {
      type: strategy.type,
      salaryRatio: strategy.type === 'salary' ? 100 : 0,
      dividendRatio: strategy.type === 'dividend' ? 100 : 0
    }
  };
}

/**
 * Validates optional pension contribution settings
 * 
 * @param {Object} pensionSettings - Pension contribution settings
 * @returns {Object} Validation result
 */
export function validatePensionSettings(pensionSettings) {
  const errors = [];
  
  // Pension settings are optional
  if (!pensionSettings || pensionSettings.enabled === false) {
    return {
      isValid: true,
      errors: [],
      value: { enabled: false, rate: 0 }
    };
  }
  
  if (pensionSettings.enabled === true) {
    // Rate can be passed as decimal (0.02-0.07) or percentage (2-7)
    let rate = pensionSettings.rate;
    
    // If rate is already a decimal (less than 1), convert to percentage for validation
    const isDecimal = rate > 0 && rate < 1;
    const rateAsPercentage = isDecimal ? rate * 100 : rate;
    
    if (isNaN(rateAsPercentage)) {
      errors.push('Pensjonssats må være et tall (Pension rate must be a number)');
      return { isValid: false, errors, value: null };
    }
    
    // OTP rate must be between 2% and 7% for tax-deductible contributions
    if (rateAsPercentage < 2) {
      errors.push('Pensjonssats må være minst 2% (OTP minimum) (Pension rate must be at least 2%)');
      return { isValid: false, errors, value: null };
    }
    
    if (rateAsPercentage > 7) {
      errors.push('Pensjonssats over 7% er ikke fradragsberettiget (Pension rate above 7% is not tax-deductible)');
      return { isValid: false, errors, value: null };
    }
    
    // Always return as decimal for calculations
    const rateAsDecimal = isDecimal ? rate : rate / 100;
    
    return {
      isValid: true,
      errors: [],
      value: { enabled: true, rate: rateAsDecimal }
    };
  }
  
  errors.push('Ugyldig pensjonsinnstilling (Invalid pension setting)');
  return { isValid: false, errors, value: null };
}

/**
 * Validates retention settings (keeping profits in the company)
 * 
 * @param {Object} retentionSettings - Retention settings
 * @returns {Object} Validation result
 */
export function validateRetentionSettings(retentionSettings) {
  const errors = [];
  
  // Retention settings are optional
  if (!retentionSettings || retentionSettings.enabled === false) {
    return {
      isValid: true,
      errors: [],
      value: { enabled: false, percentage: 0 }
    };
  }
  
  if (retentionSettings.enabled === true) {
    const percentageResult = validatePercentage(
      retentionSettings.percentage, 
      'Tilbakeholdelsesprosent'
    );
    
    if (!percentageResult.isValid) {
      return percentageResult;
    }
    
    return {
      isValid: true,
      errors: [],
      value: { enabled: true, percentage: percentageResult.value / 100 }
    };
  }
  
  errors.push('Ugyldig tilbakeholdelsesinnstilling (Invalid retention setting)');
  return { isValid: false, errors, value: null };
}

/**
 * Validates share cost basis for skjermingsfradrag calculation
 * 
 * @param {any} costBasis - The cost basis of shares
 * @returns {Object} Validation result
 */
export function validateShareCostBasis(costBasis) {
  const errors = [];
  
  // Cost basis is optional - if not provided, skjermingsfradrag is not calculated
  if (costBasis === undefined || costBasis === null || costBasis === '') {
    return {
      isValid: true,
      errors: [],
      value: null,
      warning: 'Inngangsverdi ikke oppgitt - skjermingsfradrag beregnes ikke'
    };
  }
  
  const numericCostBasis = Number(costBasis);
  
  if (isNaN(numericCostBasis)) {
    errors.push('Inngangsverdi må være et tall (Cost basis must be a number)');
    return { isValid: false, errors, value: null };
  }
  
  if (numericCostBasis < 0) {
    errors.push('Inngangsverdi kan ikke være negativ (Cost basis cannot be negative)');
    return { isValid: false, errors, value: null };
  }
  
  return { isValid: true, errors: [], value: numericCostBasis };
}

/**
 * Validates all calculation inputs
 * 
 * @param {Object} input - All input values
 * @returns {ValidationResult} Complete validation result
 */
export function validateCalculationInput(input) {
  const errors = [];
  const warnings = [];
  const sanitizedInput = {};
  
  // Validate required fields
  const profitResult = validateProfit(input.profit);
  if (!profitResult.isValid) {
    errors.push(...profitResult.errors);
  } else {
    sanitizedInput.profit = profitResult.value;
  }
  
  const zoneResult = validateEmployerZone(input.employerZone);
  if (!zoneResult.isValid) {
    errors.push(...zoneResult.errors);
  } else {
    sanitizedInput.employerZone = zoneResult.value;
  }
  
  const strategyResult = validateWithdrawalStrategy(input.withdrawalStrategy);
  if (!strategyResult.isValid) {
    errors.push(...strategyResult.errors);
  } else {
    sanitizedInput.withdrawalStrategy = strategyResult.value;
  }
  
  // Validate optional fields
  const pensionResult = validatePensionSettings(input.pension);
  if (!pensionResult.isValid) {
    errors.push(...pensionResult.errors);
  } else {
    sanitizedInput.pension = pensionResult.value;
  }
  
  const retentionResult = validateRetentionSettings(input.retention);
  if (!retentionResult.isValid) {
    errors.push(...retentionResult.errors);
  } else {
    sanitizedInput.retention = retentionResult.value;
  }
  
  const costBasisResult = validateShareCostBasis(input.shareCostBasis);
  if (!costBasisResult.isValid) {
    errors.push(...costBasisResult.errors);
  } else {
    sanitizedInput.shareCostBasis = costBasisResult.value;
    if (costBasisResult.warning) {
      warnings.push(costBasisResult.warning);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedInput: errors.length === 0 ? sanitizedInput : null
  };
}

export default {
  validateProfit,
  validateEmployerZone,
  validatePercentage,
  validateWithdrawalStrategy,
  validatePensionSettings,
  validateRetentionSettings,
  validateShareCostBasis,
  validateCalculationInput
};
