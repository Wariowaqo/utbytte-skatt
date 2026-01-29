/**
 * Unit Tests for Norwegian Tax Calculator
 * 
 * Tests cover:
 * - Salary calculations
 * - Dividend calculations
 * - Combination scenarios
 * - Edge cases
 * - Input validation
 */

import {
  calculateMaxGrossSalary,
  calculateBracketTax,
  calculateSocialSecurityContribution,
  calculateMinstefradrag,
  calculateIncomeTax,
  calculateSalaryScenario
} from '../src/calculations/salaryCalculations.js';

import {
  calculateCorporateTax,
  calculateSkjermingsfradrag,
  calculateDividendTax,
  calculateCombinedDividendTax,
  calculateDividendScenario
} from '../src/calculations/dividendCalculations.js';

import {
  calculateCombinationScenario,
  findOptimalRatio,
  calculateBreakpoints
} from '../src/calculations/combinationCalculations.js';

import {
  validateProfit,
  validateEmployerZone,
  validatePercentage,
  validateCalculationInput
} from '../src/validation/inputValidation.js';

import {
  CORPORATE_TAX_RATE,
  EMPLOYER_SOCIAL_SECURITY_RATES,
  BRACKET_TAX_2025,
  DIVIDEND_GROSS_UP_FACTOR
} from '../src/config/taxRates.js';

// ============================================================================
// SALARY CALCULATION TESTS
// ============================================================================

describe('Salary Calculations', () => {
  
  describe('calculateMaxGrossSalary', () => {
    test('correctly calculates gross salary for zone 1', () => {
      const result = calculateMaxGrossSalary(1000000, '1');
      
      // With 14.1% AGA: Salary = 1000000 / 1.141 ≈ 876,424
      expect(result.grossSalary).toBeCloseTo(876424, -2);
      expect(result.employerAGA).toBeCloseTo(123576, -2);
      expect(result.totalEmployerCost).toBeCloseTo(1000000, -2);
    });

    test('correctly calculates gross salary for zone 5 (0% AGA)', () => {
      const result = calculateMaxGrossSalary(1000000, '5');
      
      // With 0% AGA: Salary = 1000000
      expect(result.grossSalary).toBe(1000000);
      expect(result.employerAGA).toBe(0);
    });

    test('includes pension contribution when requested', () => {
      const withPension = calculateMaxGrossSalary(1000000, '1', true, 0.02);
      const withoutPension = calculateMaxGrossSalary(1000000, '1', false);
      
      // With pension, gross salary should be lower
      expect(withPension.grossSalary).toBeLessThan(withoutPension.grossSalary);
      expect(withPension.pensionContribution).toBeGreaterThan(0);
    });

    test('throws error for invalid zone', () => {
      expect(() => calculateMaxGrossSalary(1000000, 'invalid')).toThrow();
    });
  });

  describe('calculateBracketTax', () => {
    test('returns zero for income below first threshold', () => {
      const result = calculateBracketTax(200000);
      expect(result.totalBracketTax).toBe(0);
    });

    test('calculates correctly for income in first bracket', () => {
      // Income of 250,000 - threshold 217,400 = 32,600 taxable at 1.7%
      const result = calculateBracketTax(250000);
      const expectedTax = (250000 - 217400) * 0.017;
      expect(result.totalBracketTax).toBeCloseTo(expectedTax, 0);
    });

    test('calculates correctly for income across multiple brackets', () => {
      const result = calculateBracketTax(800000);
      
      // Should have entries for brackets 1, 2, and 3
      expect(result.breakdown.length).toBeGreaterThanOrEqual(3);
      expect(result.totalBracketTax).toBeGreaterThan(0);
    });

    test('handles very high income correctly', () => {
      const result = calculateBracketTax(2000000);
      
      // Should hit all 5 brackets
      expect(result.breakdown.length).toBe(5);
    });
  });

  describe('calculateSocialSecurityContribution', () => {
    test('returns zero for income below threshold', () => {
      const result = calculateSocialSecurityContribution(50000);
      expect(result.contribution).toBe(0);
    });

    test('calculates 7.8% for income above threshold', () => {
      const result = calculateSocialSecurityContribution(500000);
      expect(result.contribution).toBeCloseTo(500000 * 0.078, 0);
    });
  });

  describe('calculateMinstefradrag', () => {
    test('calculates 46% of salary', () => {
      const result = calculateMinstefradrag(200000);
      expect(result.minstefradrag).toBeCloseTo(200000 * 0.46, 0);
    });

    test('caps at maximum limit', () => {
      const result = calculateMinstefradrag(500000);
      expect(result.minstefradrag).toBe(114950); // 2025 maximum
    });

    test('applies minimum for very low income', () => {
      const result = calculateMinstefradrag(5000);
      expect(result.minstefradrag).toBe(4000); // 2025 minimum
    });
  });

  describe('calculateSalaryScenario', () => {
    test('produces valid complete scenario', () => {
      const result = calculateSalaryScenario(1000000, '1');
      
      expect(result.scenarioType).toBe('salary');
      expect(result.results.netPrivatePayout).toBeGreaterThan(0);
      expect(result.results.totalTaxPaid).toBeGreaterThan(0);
      expect(result.results.effectiveTaxRate).toBeGreaterThan(0);
      expect(result.results.effectiveTaxRate).toBeLessThan(1);
    });

    test('respects retention percentage', () => {
      const noRetention = calculateSalaryScenario(1000000, '1', { retentionPercentage: 0 });
      const withRetention = calculateSalaryScenario(1000000, '1', { retentionPercentage: 0.3 });
      
      expect(withRetention.results.netPrivatePayout).toBeLessThan(noRetention.results.netPrivatePayout);
      expect(withRetention.results.retainedInCompany).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// DIVIDEND CALCULATION TESTS
// ============================================================================

describe('Dividend Calculations', () => {

  describe('calculateCorporateTax', () => {
    test('calculates 22% corporate tax', () => {
      const result = calculateCorporateTax(1000000);
      
      expect(result.corporateTax).toBe(220000);
      expect(result.profitAfterTax).toBe(780000);
    });

    test('handles zero profit', () => {
      const result = calculateCorporateTax(0);
      
      expect(result.corporateTax).toBe(0);
      expect(result.profitAfterTax).toBe(0);
    });
  });

  describe('calculateSkjermingsfradrag', () => {
    test('calculates based on cost basis and rate', () => {
      const result = calculateSkjermingsfradrag(100000, 0.05);
      
      expect(result.skjermingsfradrag).toBe(5000);
    });

    test('returns zero for no cost basis', () => {
      const result = calculateSkjermingsfradrag(0);
      
      expect(result.skjermingsfradrag).toBe(0);
    });
  });

  describe('calculateDividendTax', () => {
    test('applies gross-up factor correctly', () => {
      const dividend = 100000;
      const result = calculateDividendTax(dividend, 0);
      
      // Grossed up: 100,000 × 1.72 = 172,000
      // Tax: 172,000 × 0.22 = 37,840
      const expectedTax = dividend * DIVIDEND_GROSS_UP_FACTOR * 0.22;
      expect(result.dividendTax).toBeCloseTo(expectedTax, 0);
    });

    test('respects skjermingsfradrag', () => {
      const withSkjerming = calculateDividendTax(100000, 10000);
      const withoutSkjerming = calculateDividendTax(100000, 0);
      
      expect(withSkjerming.dividendTax).toBeLessThan(withoutSkjerming.dividendTax);
    });

    test('calculates effective rate correctly', () => {
      const result = calculateDividendTax(100000, 0);
      
      // Effective rate should be approximately 37.84%
      expect(result.effectiveRate).toBeCloseTo(0.3784, 2);
    });
  });

  describe('calculateDividendScenario', () => {
    test('produces valid complete scenario', () => {
      const result = calculateDividendScenario(1000000);
      
      expect(result.scenarioType).toBe('dividend');
      expect(result.results.netPrivatePayout).toBeGreaterThan(0);
      expect(result.results.totalTaxPaid).toBeGreaterThan(0);
    });

    test('combined effective rate is approximately 51.5%', () => {
      const result = calculateDividendScenario(1000000);
      
      // Corporate 22% + Dividend ~37.84% on remainder
      // 1 - (1-0.22) × (1-0.3784) ≈ 0.5152
      expect(result.results.effectiveTaxRate).toBeCloseTo(0.515, 1);
    });
  });
});

// ============================================================================
// COMBINATION CALCULATION TESTS
// ============================================================================

describe('Combination Calculations', () => {

  describe('calculateCombinationScenario', () => {
    test('100% salary equals salary scenario', () => {
      const combination = calculateCombinationScenario(1000000, '1', 100);
      const salary = calculateSalaryScenario(1000000, '1');
      
      // Should be very close (minor rounding differences possible)
      expect(combination.results.netPrivatePayout).toBeCloseTo(salary.results.netPrivatePayout, -2);
    });

    test('0% salary equals dividend scenario', () => {
      const combination = calculateCombinationScenario(1000000, '1', 0);
      const dividend = calculateDividendScenario(1000000);
      
      // Should be very close
      expect(combination.results.netPrivatePayout).toBeCloseTo(dividend.results.netPrivatePayout, -2);
    });

    test('50/50 split is between extremes', () => {
      const allSalary = calculateCombinationScenario(1000000, '1', 100);
      const allDividend = calculateCombinationScenario(1000000, '1', 0);
      const split = calculateCombinationScenario(1000000, '1', 50);
      
      const minPayout = Math.min(allSalary.results.netPrivatePayout, allDividend.results.netPrivatePayout);
      const maxPayout = Math.max(allSalary.results.netPrivatePayout, allDividend.results.netPrivatePayout);
      
      // 50/50 should be somewhere in between (or possibly better)
      expect(split.results.netPrivatePayout).toBeGreaterThanOrEqual(minPayout * 0.95);
    });

    test('throws error for invalid ratio', () => {
      expect(() => calculateCombinationScenario(1000000, '1', 150)).toThrow();
      expect(() => calculateCombinationScenario(1000000, '1', -10)).toThrow();
    });
  });

  describe('findOptimalRatio', () => {
    test('finds optimal ratio between 0 and 100', () => {
      const result = findOptimalRatio(1000000, '1');
      
      expect(result.optimalRatio).toBeGreaterThanOrEqual(0);
      expect(result.optimalRatio).toBeLessThanOrEqual(100);
    });

    test('optimal gives highest net payout', () => {
      const result = findOptimalRatio(1000000, '1');
      
      // Verify that optimal is better than or equal to extremes
      expect(result.comparison.optimal.netPayout).toBeGreaterThanOrEqual(
        result.comparison.allSalary.netPayout
      );
      expect(result.comparison.optimal.netPayout).toBeGreaterThanOrEqual(
        result.comparison.allDividend.netPayout
      );
    });

    test('includes comparison data', () => {
      const result = findOptimalRatio(1000000, '1');
      
      expect(result.comparison).toBeDefined();
      expect(result.comparison.allSalary).toBeDefined();
      expect(result.comparison.allDividend).toBeDefined();
      expect(result.savings).toBeDefined();
    });
  });

  describe('calculateBreakpoints', () => {
    test('returns bracket tax breakpoints', () => {
      const result = calculateBreakpoints('1');
      
      expect(result.breakpoints.length).toBe(5);
      expect(result.breakpoints[0].threshold).toBe(BRACKET_TAX_2025[0].threshold);
    });

    test('includes AGA rate for zone', () => {
      const result = calculateBreakpoints('1');
      
      expect(result.agaRate).toBe(EMPLOYER_SOCIAL_SECURITY_RATES['1']);
    });
  });
});

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

describe('Input Validation', () => {

  describe('validateProfit', () => {
    test('accepts valid positive numbers', () => {
      expect(validateProfit(1000000).isValid).toBe(true);
      expect(validateProfit('500000').isValid).toBe(true);
    });

    test('rejects negative numbers', () => {
      expect(validateProfit(-1000).isValid).toBe(false);
    });

    test('rejects non-numeric values', () => {
      expect(validateProfit('abc').isValid).toBe(false);
      expect(validateProfit(null).isValid).toBe(false);
      expect(validateProfit(undefined).isValid).toBe(false);
    });

    test('rejects values above maximum', () => {
      expect(validateProfit(999999999999999).isValid).toBe(false);
    });
  });

  describe('validateEmployerZone', () => {
    test('accepts valid zones', () => {
      expect(validateEmployerZone('1').isValid).toBe(true);
      expect(validateEmployerZone('1a').isValid).toBe(true);
      expect(validateEmployerZone('5').isValid).toBe(true);
    });

    test('rejects invalid zones', () => {
      expect(validateEmployerZone('6').isValid).toBe(false);
      expect(validateEmployerZone('invalid').isValid).toBe(false);
    });
  });

  describe('validatePercentage', () => {
    test('accepts valid percentages', () => {
      expect(validatePercentage(0, 'test').isValid).toBe(true);
      expect(validatePercentage(50, 'test').isValid).toBe(true);
      expect(validatePercentage(100, 'test').isValid).toBe(true);
    });

    test('rejects out of range values', () => {
      expect(validatePercentage(-1, 'test').isValid).toBe(false);
      expect(validatePercentage(101, 'test').isValid).toBe(false);
    });
  });

  describe('validateCalculationInput', () => {
    test('validates complete valid input', () => {
      const input = {
        profit: 1000000,
        employerZone: '1',
        withdrawalStrategy: { type: 'combination', salaryRatio: 50 }
      };
      
      const result = validateCalculationInput(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedInput).toBeDefined();
    });

    test('collects all errors for invalid input', () => {
      const input = {
        profit: -1000,
        employerZone: 'invalid',
        withdrawalStrategy: { type: 'invalid' }
      };
      
      const result = validateCalculationInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {

  test('handles very low profit', () => {
    const result = calculateSalaryScenario(10000, '1');
    expect(result.results.netPrivatePayout).toBeGreaterThan(0);
  });

  test('handles very high profit', () => {
    const result = calculateSalaryScenario(100000000, '1');
    expect(result.results.effectiveTaxRate).toBeLessThan(1);
  });

  test('handles zero cost basis for dividends', () => {
    const result = calculateDividendScenario(1000000, { shareCostBasis: 0 });
    expect(result).toBeDefined();
  });

  test('handles maximum retention', () => {
    const result = calculateSalaryScenario(1000000, '1', { retentionPercentage: 1 });
    expect(result.results.netPrivatePayout).toBe(0);
    expect(result.results.retainedInCompany).toBeGreaterThan(0);
  });

  test('different zones produce different results', () => {
    const zone1 = calculateSalaryScenario(1000000, '1');
    const zone5 = calculateSalaryScenario(1000000, '5');
    
    // Zone 5 has 0% AGA, so should result in higher net payout
    expect(zone5.results.netPrivatePayout).toBeGreaterThan(zone1.results.netPrivatePayout);
  });
});

// ============================================================================
// CONSISTENCY CHECKS
// ============================================================================

describe('Consistency Checks', () => {

  test('total taxes plus net equals gross', () => {
    const result = calculateSalaryScenario(1000000, '1');
    
    const totalOut = result.results.netPrivatePayout + 
                     result.results.totalTaxPaid + 
                     result.results.retainedInCompany;
    
    // Should approximately equal original profit (within rounding)
    expect(totalOut).toBeCloseTo(1000000, -2);
  });

  test('effective tax rate is consistent', () => {
    const result = calculateSalaryScenario(1000000, '1');
    
    const calculatedRate = result.results.totalTaxPaid / 1000000;
    expect(result.results.effectiveTaxRate).toBeCloseTo(calculatedRate, 4);
  });
});
