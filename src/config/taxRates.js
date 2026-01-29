/**
 * Norwegian Tax Rates and Constants - Tax Year 2025
 * 
 * All rates are sourced from official Norwegian sources and documented with:
 * - Source name and URL
 * - Year of applicability
 * - Any assumptions or conditions
 * 
 * IMPORTANT: This file should be reviewed and updated annually when new tax rates are published.
 * New rates are typically announced in the national budget (statsbudsjettet) in October
 * and confirmed in December for the following year.
 * 
 * Last updated: January 2025 for tax year 2025
 */

// ============================================================================
// CORPORATE TAX (SELSKAPSSKATT)
// ============================================================================

/**
 * Corporate Income Tax Rate
 * 
 * Source: Skatteetaten - "Skatt på alminnelig inntekt for selskap"
 * URL: https://www.skatteetaten.no/satser/skatt-pa-alminnelig-inntekt/
 * Year: 2025
 * 
 * The corporate tax rate in Norway has been 22% since 2019.
 * This applies to all Norwegian limited companies (AS).
 */
export const CORPORATE_TAX_RATE = 0.22;

// ============================================================================
// EMPLOYER'S SOCIAL SECURITY CONTRIBUTIONS (ARBEIDSGIVERAVGIFT)
// ============================================================================

/**
 * Employer's Social Security Contribution Rates by Zone
 * 
 * Source: Skatteetaten - "Arbeidsgiveravgift"
 * URL: https://www.skatteetaten.no/satser/arbeidsgiveravgift/
 * Year: 2025
 * 
 * Norway uses a differentiated system with 5 geographical zones.
 * The rate depends on where the company is registered.
 * 
 * Assumptions:
 * - Standard rates (not reduced rates for certain industries)
 * - Company does not exceed state aid limits (fribeløp)
 */
export const EMPLOYER_SOCIAL_SECURITY_RATES = {
  1: 0.141,   // Zone 1: Major cities and surrounding areas (14.1%)
  '1a': 0.141, // Zone 1a: Same as zone 1 (14.1%)
  2: 0.106,   // Zone 2: (10.6%)
  3: 0.064,   // Zone 3: (6.4%)
  4: 0.054,   // Zone 4: (5.4%)
  '4a': 0.079, // Zone 4a: (7.9%)
  5: 0.00,    // Zone 5: Finnmark and Nord-Troms (0%)
};

/**
 * Zone descriptions for UI display
 */
export const EMPLOYER_ZONE_DESCRIPTIONS = {
  1: 'Sone 1 - Storbyområder (Oslo, Bergen, Trondheim, Stavanger m.fl.)',
  '1a': 'Sone 1a - Tilsvarende sone 1',
  2: 'Sone 2 - Mellomstore byer og tettsteder',
  3: 'Sone 3 - Distriktskommuner',
  4: 'Sone 4 - Tynne distrikter',
  '4a': 'Sone 4a - Spesielle områder',
  5: 'Sone 5 - Finnmark og Nord-Troms (0% avgift)',
};

// ============================================================================
// PERSONAL INCOME TAX (SKATT PÅ ALMINNELIG INNTEKT)
// ============================================================================

/**
 * Personal Income Tax Rate (Alminnelig inntekt)
 * 
 * Source: Skatteetaten - "Skatt på alminnelig inntekt"
 * URL: https://www.skatteetaten.no/satser/skatt-pa-alminnelig-inntekt/
 * Year: 2025
 * 
 * This rate applies to net income after deductions.
 * Split between municipality (kommuneskatt) and common tax (fellesskatt).
 */
export const PERSONAL_TAX_RATE = 0.22;

// ============================================================================
// BRACKET TAX (TRINNSKATT)
// ============================================================================

/**
 * Bracket Tax Thresholds and Rates
 * 
 * Source: Skatteetaten - "Trinnskatt"
 * URL: https://www.skatteetaten.no/satser/trinnskatt/
 * Year: 2025
 * 
 * Progressive tax on gross personal income (personinntekt).
 * Applies to salary, but NOT to dividends or capital income.
 * 
 * Thresholds are adjusted annually for inflation.
 */
export const BRACKET_TAX_2025 = [
  { 
    threshold: 217_400, 
    rate: 0.017,
    description: 'Trinn 1: 1,7% av inntekt over 217 400 kr'
  },
  { 
    threshold: 306_050, 
    rate: 0.04,
    description: 'Trinn 2: 4,0% av inntekt over 306 050 kr'
  },
  { 
    threshold: 697_150, 
    rate: 0.137,
    description: 'Trinn 3: 13,7% av inntekt over 697 150 kr'
  },
  { 
    threshold: 942_400, 
    rate: 0.167,
    description: 'Trinn 4: 16,7% av inntekt over 942 400 kr'
  },
  { 
    threshold: 1_410_750, 
    rate: 0.176,
    description: 'Trinn 5: 17,6% av inntekt over 1 410 750 kr'
  },
];

// ============================================================================
// SOCIAL SECURITY CONTRIBUTION (TRYGDEAVGIFT)
// ============================================================================

/**
 * Social Security Contribution Rates (Employee)
 * 
 * Source: Skatteetaten - "Trygdeavgift"
 * URL: https://www.skatteetaten.no/satser/trygdeavgift/
 * Year: 2025
 * 
 * Deducted from gross salary. Different rates for different income types.
 * 
 * Assumptions:
 * - Person is between 17 and 69 years old
 * - Standard employment income (not self-employment)
 */
export const SOCIAL_SECURITY_RATES = {
  salary: 0.078,        // Lønnsinntekt: 7.8%
  selfEmployed: 0.111,  // Næringsinntekt: 11.1%
  pension: 0.054,       // Pensjonsinntekt: 5.4%
};

/**
 * Social Security Contribution Thresholds
 * 
 * Source: Skatteetaten - "Trygdeavgift"
 * Year: 2025
 * 
 * No social security contribution on income below this threshold.
 */
export const SOCIAL_SECURITY_THRESHOLD = 69_650;

// ============================================================================
// DIVIDEND TAX (UTBYTTESKATT)
// ============================================================================

/**
 * Dividend Gross-Up Factor (Oppjusteringsfaktor)
 * 
 * Source: Skatteetaten - "Aksjer og utbytte"
 * URL: https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/aksjer-og-verdipapirer/utbytte/
 * Year: 2025
 * 
 * Dividends are grossed up by this factor before taxation.
 * This results in an effective dividend tax rate higher than the nominal 22%.
 * 
 * Calculation: Effective rate = 22% × 1.72 = 37.84%
 * 
 * History:
 * - 2022: 1.44 (effective ~31.68%)
 * - 2023: 1.60 (effective ~35.2%)
 * - 2024: 1.72 (effective ~37.84%)
 * - 2025: 1.72 (effective ~37.84%)
 */
export const DIVIDEND_GROSS_UP_FACTOR = 1.72;

/**
 * Effective dividend tax rate after gross-up
 * This is a derived value for convenience
 */
export const EFFECTIVE_DIVIDEND_TAX_RATE = PERSONAL_TAX_RATE * DIVIDEND_GROSS_UP_FACTOR;

/**
 * Skjermingsfradrag (Tax-Free Allowance on Shares)
 * 
 * Source: Skatteetaten - "Skjermingsfradrag"
 * URL: https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/aksjer-og-verdipapirer/skjermingsfradrag/
 * Year: 2025
 * 
 * Shareholders receive a tax-free allowance (skjermingsfradrag) based on
 * their cost basis (inngangsverdi) multiplied by a risk-free interest rate.
 * 
 * The rate is set annually based on average 3-month treasury bill rate + 0.5%.
 * 
 * Assumption: We use a placeholder rate. Actual rate should be obtained from
 * Skatteetaten when available for the specific year.
 */
export const SKJERMING_RATE_2024 = 0.046; // 4.6% for 2024 (example)
export const SKJERMING_RATE_2025 = 0.05;  // Estimated - verify with Skatteetaten

// ============================================================================
// STANDARD DEDUCTIONS (FRADRAG)
// ============================================================================

/**
 * Minimum Standard Deduction (Minstefradrag)
 * 
 * Source: Skatteetaten - "Minstefradrag"
 * URL: https://www.skatteetaten.no/satser/minstefradrag/
 * Year: 2025
 * 
 * Automatic deduction from salary income.
 */
export const MINSTEFRADRAG = {
  rate: 0.46,           // 46% of gross salary
  minimum: 4_000,       // Minimum deduction
  maximum: 114_950,     // Maximum deduction for 2025
};

/**
 * Personal Allowance (Personfradrag)
 * 
 * Source: Skatteetaten - "Personfradrag"
 * URL: https://www.skatteetaten.no/satser/personfradrag/
 * Year: 2025
 * 
 * Standard deduction from taxable income for all taxpayers.
 */
export const PERSONFRADRAG = 73_150;

// ============================================================================
// PENSION CONTRIBUTIONS (OTP - Obligatorisk Tjenestepensjon)
// ============================================================================

/**
 * Mandatory Occupational Pension (OTP)
 * 
 * Source: Lovdata - Lov om obligatorisk tjenestepensjon
 * URL: https://lovdata.no/dokument/NL/lov/2005-12-21-124
 * Year: 2025
 * 
 * Companies must contribute minimum 2% of salary between 1G and 12G.
 * 
 * Assumptions:
 * - Using minimum required contribution (2%)
 * - Salary is between 1G and 12G
 */
export const OTP_MIN_RATE = 0.02;
export const OTP_MAX_RATE = 0.07; // Maximum tax-deductible contribution

/**
 * National Insurance Base Amount (Grunnbeløpet - G)
 * 
 * Source: NAV - "Grunnbeløpet i folketrygden"
 * URL: https://www.nav.no/grunnbelopet
 * Year: 2025 (as of May 1, 2024 - updated annually in May)
 * 
 * The G is adjusted annually on May 1st.
 */
export const GRUNNBELOPET = 124_028; // As of May 1, 2024

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/**
 * Reasonable limits for input validation
 */
export const VALIDATION_LIMITS = {
  MIN_PROFIT: 0,
  MAX_PROFIT: 100_000_000_000, // 100 billion NOK
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
};

// ============================================================================
// METADATA AND VERSION INFO
// ============================================================================

export const TAX_RATES_METADATA = {
  taxYear: 2025,
  lastUpdated: '2025-01-29',
  nextUpdateDue: '2025-10-15', // When new budget is typically released
  sources: [
    {
      name: 'Skatteetaten',
      url: 'https://www.skatteetaten.no',
      description: 'Norwegian Tax Administration - Official tax rates and rules'
    },
    {
      name: 'Lovdata',
      url: 'https://lovdata.no',
      description: 'Norwegian legal database - Tax laws and regulations'
    },
    {
      name: 'NAV',
      url: 'https://www.nav.no',
      description: 'Norwegian Labour and Welfare Administration - G and benefits'
    }
  ],
  notes: [
    'All rates apply to tax year 2025',
    'Bracket tax thresholds are adjusted annually for inflation',
    'Skjermingsrente is published by Skatteetaten in January for the previous year',
    'G (grunnbeløpet) is adjusted annually on May 1st'
  ]
};

export default {
  CORPORATE_TAX_RATE,
  EMPLOYER_SOCIAL_SECURITY_RATES,
  EMPLOYER_ZONE_DESCRIPTIONS,
  PERSONAL_TAX_RATE,
  BRACKET_TAX_2025,
  SOCIAL_SECURITY_RATES,
  SOCIAL_SECURITY_THRESHOLD,
  DIVIDEND_GROSS_UP_FACTOR,
  EFFECTIVE_DIVIDEND_TAX_RATE,
  SKJERMING_RATE_2024,
  SKJERMING_RATE_2025,
  MINSTEFRADRAG,
  PERSONFRADRAG,
  OTP_MIN_RATE,
  OTP_MAX_RATE,
  GRUNNBELOPET,
  VALIDATION_LIMITS,
  TAX_RATES_METADATA
};
