/**
 * Express Server for Norwegian Tax Calculator
 * 
 * Provides both API endpoints and serves the web UI.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAllScenarios, prepareExcelExport } from './calculations/scenarioComparison.js';
import { calculateSalaryScenario } from './calculations/salaryCalculations.js';
import { calculateDividendScenario } from './calculations/dividendCalculations.js';
import { calculateCombinationScenario, findOptimalRatio, calculateBreakpoints } from './calculations/combinationCalculations.js';
import { TAX_RATES_METADATA, EMPLOYER_ZONE_DESCRIPTIONS } from './config/taxRates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

/**
 * GET /api/config
 * Returns tax configuration and metadata
 */
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      taxYear: TAX_RATES_METADATA.taxYear,
      lastUpdated: TAX_RATES_METADATA.lastUpdated,
      zones: EMPLOYER_ZONE_DESCRIPTIONS,
      sources: TAX_RATES_METADATA.sources
    }
  });
});

/**
 * POST /api/calculate
 * Main calculation endpoint - generates all scenarios
 */
app.post('/api/calculate', (req, res) => {
  try {
    const { profit, employerZone, pension, retention, shareCostBasis, withdrawalStrategy } = req.body;
    
    const input = {
      profit,
      employerZone,
      pension: pension || { enabled: false },
      retention: retention || { enabled: false, percentage: 0 },
      shareCostBasis: shareCostBasis || 0,
      withdrawalStrategy: withdrawalStrategy || { type: 'combination', salaryRatio: 50 }
    };
    
    const result = generateAllScenarios(input);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({
      success: false,
      errors: [`Server error: ${error.message}`]
    });
  }
});

/**
 * POST /api/calculate/salary
 * Calculate salary-only scenario
 */
app.post('/api/calculate/salary', (req, res) => {
  try {
    const { profit, employerZone, includePension, pensionRate, retentionPercentage } = req.body;
    
    if (!profit || !employerZone) {
      return res.status(400).json({
        success: false,
        errors: ['Profit and employer zone are required']
      });
    }
    
    const result = calculateSalaryScenario(profit, employerZone, {
      includePension,
      pensionRate,
      retentionPercentage
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: [error.message]
    });
  }
});

/**
 * POST /api/calculate/dividend
 * Calculate dividend-only scenario
 */
app.post('/api/calculate/dividend', (req, res) => {
  try {
    const { profit, retentionPercentage, shareCostBasis } = req.body;
    
    if (!profit) {
      return res.status(400).json({
        success: false,
        errors: ['Profit is required']
      });
    }
    
    const result = calculateDividendScenario(profit, {
      retentionPercentage,
      shareCostBasis
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: [error.message]
    });
  }
});

/**
 * POST /api/calculate/combination
 * Calculate combination scenario with specific ratio
 */
app.post('/api/calculate/combination', (req, res) => {
  try {
    const { profit, employerZone, salaryRatio, options } = req.body;
    
    if (!profit || !employerZone || salaryRatio === undefined) {
      return res.status(400).json({
        success: false,
        errors: ['Profit, employer zone, and salary ratio are required']
      });
    }
    
    const result = calculateCombinationScenario(profit, employerZone, salaryRatio, options || {});
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: [error.message]
    });
  }
});

/**
 * POST /api/optimize
 * Find optimal salary/dividend ratio
 */
app.post('/api/optimize', (req, res) => {
  try {
    const { profit, employerZone, options } = req.body;
    
    if (!profit || !employerZone) {
      return res.status(400).json({
        success: false,
        errors: ['Profit and employer zone are required']
      });
    }
    
    const result = findOptimalRatio(profit, employerZone, options || {});
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: [error.message]
    });
  }
});

/**
 * GET /api/breakpoints/:zone
 * Get tax breakpoints for a zone
 */
app.get('/api/breakpoints/:zone', (req, res) => {
  try {
    const { zone } = req.params;
    const result = calculateBreakpoints(zone);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: [error.message]
    });
  }
});

/**
 * POST /api/export/excel
 * Prepare data for Excel export
 */
app.post('/api/export/excel', (req, res) => {
  try {
    const input = req.body;
    const calculationResult = generateAllScenarios(input);
    
    if (!calculationResult.success) {
      return res.status(400).json({
        success: false,
        errors: calculationResult.errors
      });
    }
    
    const excelData = prepareExcelExport(calculationResult);
    
    res.json({
      success: true,
      data: excelData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: [error.message]
    });
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Norwegian Tax Calculator - Utbytte vs Lønn                  ║
║                                                               ║
║   Server running at: http://localhost:${PORT}                    ║
║                                                               ║
║   Tax Year: ${TAX_RATES_METADATA.taxYear}                                           ║
║   Last Updated: ${TAX_RATES_METADATA.lastUpdated}                                  ║
║                                                               ║
║   API Endpoints:                                              ║
║   - POST /api/calculate      - Full scenario comparison       ║
║   - POST /api/calculate/salary - Salary-only calculation      ║
║   - POST /api/calculate/dividend - Dividend-only calculation  ║
║   - POST /api/calculate/combination - Custom ratio            ║
║   - POST /api/optimize       - Find optimal ratio             ║
║   - GET  /api/config         - Tax configuration              ║
║   - GET  /api/breakpoints/:zone - Tax breakpoints             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
