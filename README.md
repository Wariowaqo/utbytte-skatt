# Norwegian Tax Calculator - Utbytte vs Lønn

A comprehensive tax planning and comparison tool for Norwegian AS (limited company) owners to evaluate different profit extraction strategies.

## 🎯 Purpose

This application helps Norwegian business owners understand and compare the tax implications of different profit extraction methods:

- **Salary (Lønn)** - Regular employment income
- **Dividends (Utbytte)** - Distribution of profits to shareholders
- **Combination strategies** - Optimized mix of both

## ⚠️ Important Disclaimer

> **This calculator is a planning and comparison tool only.**
> It does NOT constitute legal or tax advice.
> Users are responsible for all decisions made based on the results.
> Always consult a certified accountant (autorisert regnskapsfører) or tax advisor for professional guidance.

## 📊 Features

- Compare multiple extraction scenarios automatically
- Find the optimal salary/dividend ratio for your situation
- Support for different employer social security zones (1-5)
- Optional pension contributions (OTP)
- Profit retention strategies
- Skjermingsfradrag calculations
- Detailed step-by-step calculation breakdowns
- Export results to CSV/Excel
- All calculations traceable to official Norwegian sources

## 🏗️ Architecture

```
utbytte-skatt/
├── src/
│   ├── config/
│   │   └── taxRates.js       # Tax rates with source documentation
│   ├── calculations/
│   │   ├── salaryCalculations.js     # Salary tax calculations
│   │   ├── dividendCalculations.js   # Dividend tax calculations
│   │   ├── combinationCalculations.js # Mixed strategies & optimization
│   │   └── scenarioComparison.js     # Scenario comparison engine
│   ├── validation/
│   │   └── inputValidation.js  # Input validation & sanitization
│   ├── public/
│   │   ├── index.html         # Web UI
│   │   └── app.js             # Frontend JavaScript
│   └── server.js              # Express API server
├── tests/
│   └── taxCalculations.test.js # Unit tests
├── package.json
└── README.md
```

### Separation of Concerns

1. **Configuration Layer** (`src/config/`) 
   - All tax rates centralized in one file
   - Each rate documented with source, year, and URL
   - Easy to update annually

2. **Calculation Layer** (`src/calculations/`)
   - Pure functions for each calculation type
   - Step-by-step calculation logging
   - No side effects

3. **Validation Layer** (`src/validation/`)
   - Input validation and sanitization
   - Detailed error messages
   - Stops calculation if data is missing

4. **API Layer** (`src/server.js`)
   - RESTful API endpoints
   - Serves web UI

5. **Presentation Layer** (`src/public/`)
   - Web-based user interface
   - Results visualization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
# Clone or download the project
cd utbytte-skatt

# Install dependencies
npm install

# Start the server
npm start
```

### Running Tests

```bash
npm test
```

## 📖 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calculate` | Full scenario comparison |
| POST | `/api/calculate/salary` | Salary-only calculation |
| POST | `/api/calculate/dividend` | Dividend-only calculation |
| POST | `/api/calculate/combination` | Custom ratio calculation |
| POST | `/api/optimize` | Find optimal ratio |
| GET | `/api/config` | Tax configuration info |
| GET | `/api/breakpoints/:zone` | Tax breakpoints for zone |
| POST | `/api/export/excel` | Export data for Excel |

### Example API Request

```bash
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "profit": 1000000,
    "employerZone": "1",
    "withdrawalStrategy": {"type": "combination", "salaryRatio": 50}
  }'
```

## 💡 How Calculations Work

### Salary Extraction Path

1. **Company pays salary** from pre-tax profit
2. **Employer's AGA** is added on top (varies by zone: 0-14.1%)
3. **Employee pays**:
   - Trygdeavgift (7.8% social security)
   - Trinnskatt (progressive bracket tax: 1.7% - 17.6%)
   - Skatt på alminnelig inntekt (22% after deductions)

### Dividend Extraction Path

1. **Company pays corporate tax** (22%)
2. **Remaining profit distributed** as dividend
3. **Shareholder pays dividend tax**:
   - Dividend × 1.72 (gross-up factor)
   - × 22% tax rate
   - = 37.84% effective dividend tax
4. **Combined effective rate**: ~51.5%

### Optimization Logic

The optimizer searches for the salary ratio that maximizes net private payout by:
1. Testing ratios from 0% to 100% in 1% increments
2. Calculating total tax for each ratio
3. Identifying the ratio with lowest total tax

## 📋 Tax Rates (2025)

| Tax Type | Rate | Source |
|----------|------|--------|
| Corporate tax | 22% | Skatteetaten |
| Personal income tax | 22% | Skatteetaten |
| Trygdeavgift (salary) | 7.8% | Skatteetaten |
| Dividend gross-up | 1.72 | Skatteetaten |
| AGA Zone 1 | 14.1% | Skatteetaten |
| AGA Zone 5 | 0% | Skatteetaten |

All rates are from official sources. See `src/config/taxRates.js` for complete documentation.

## 🔄 Annual Updates

To update tax rates for a new year:

1. Open `src/config/taxRates.js`
2. Update rate values based on new tax law
3. Update source URLs and year references
4. Run tests to verify calculations
5. Update this README if needed

Tax rates are typically announced in October (statsbudsjettet) and confirmed in December.

## 🧪 Testing

Tests cover:
- ✅ Salary calculations (all components)
- ✅ Dividend calculations (corporate + personal)
- ✅ Combination scenarios
- ✅ Optimization algorithm
- ✅ Input validation
- ✅ Edge cases (low/high profit, zone differences)
- ✅ Consistency checks

## 🔮 Future Extensions

Potential improvements for future versions:

1. **Spouse income consideration** - Optimize for couples
2. **Holding company structures** - AS holding AS scenarios
3. **Multi-year planning** - Tax optimization over time
4. **Real estate investment** - Property through AS
5. **International aspects** - Cross-border considerations
6. **PDF report generation** - Professional reports
7. **Historical comparison** - Compare with previous tax years
8. **What-if scenarios** - Test different profit levels

## 📚 Sources

All calculations are based on official Norwegian sources:

- [Skatteetaten](https://www.skatteetaten.no) - Norwegian Tax Administration
- [Lovdata](https://lovdata.no) - Norwegian legal database
- [NAV](https://www.nav.no) - Grunnbeløpet (G)

Professional firm guides consulted:
- BDO Norway
- EY Norway
- PwC Norway
- Deloitte Norway

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All tax calculations are traceable to official sources
- Assumptions are documented
- Tests are included for new features

---

**Tax Year**: 2025  
**Last Updated**: January 2025
