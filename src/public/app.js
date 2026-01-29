/**
 * Norwegian Tax Calculator - Frontend Application
 * 
 * Handles user input, API communication, and result display.
 */

// DOM Elements
const form = document.getElementById('calculatorForm');
const resultsSection = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');
const errorMessages = document.getElementById('errorMessages');
const salaryRatioSlider = document.getElementById('salaryRatio');
const salaryLabel = document.getElementById('salaryLabel');
const dividendLabel = document.getElementById('dividendLabel');
const pensionCheckbox = document.getElementById('pensionEnabled');
const pensionRateContainer = document.getElementById('pensionRateContainer');
const retentionCheckbox = document.getElementById('retentionEnabled');
const retentionContainer = document.getElementById('retentionContainer');

// State
let currentResults = null;

// Format number as Norwegian currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('nb-NO', {
        style: 'currency',
        currency: 'NOK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format percentage
function formatPercent(value) {
    return new Intl.NumberFormat('nb-NO', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Update slider labels
function updateSliderLabels() {
    const value = parseInt(salaryRatioSlider.value);
    salaryLabel.textContent = `Lønn: ${value}%`;
    dividendLabel.textContent = `Utbytte: ${100 - value}%`;
}

// Toggle pension rate visibility
function togglePensionRate() {
    pensionRateContainer.style.display = pensionCheckbox.checked ? 'block' : 'none';
}

// Toggle retention visibility
function toggleRetention() {
    retentionContainer.style.display = retentionCheckbox.checked ? 'block' : 'none';
}

// Show error messages
function showErrors(errors) {
    errorMessages.innerHTML = errors.map(err => 
        `<div class="error-message">⚠️ ${err}</div>`
    ).join('');
}

// Clear error messages
function clearErrors() {
    errorMessages.innerHTML = '';
}

// Show loading state
function setLoading(loading) {
    loadingIndicator.classList.toggle('visible', loading);
    document.getElementById('calculateBtn').disabled = loading;
}

// Collect form data
function getFormData() {
    const profit = parseFloat(document.getElementById('profit').value);
    const employerZone = document.getElementById('employerZone').value;
    const salaryRatio = parseInt(salaryRatioSlider.value);
    const pensionEnabled = pensionCheckbox.checked;
    const pensionRate = parseFloat(document.getElementById('pensionRate').value) / 100;
    const retentionEnabled = retentionCheckbox.checked;
    const retentionPercentage = parseFloat(document.getElementById('retentionPercentage').value) / 100;
    const shareCostBasis = parseFloat(document.getElementById('shareCostBasis').value) || 0;

    return {
        profit,
        employerZone,
        withdrawalStrategy: {
            type: 'combination',
            salaryRatio
        },
        pension: {
            enabled: pensionEnabled,
            rate: pensionRate
        },
        retention: {
            enabled: retentionEnabled,
            percentage: retentionEnabled ? retentionPercentage : 0
        },
        shareCostBasis
    };
}

// Validate form data
function validateForm() {
    const errors = [];
    const profit = document.getElementById('profit').value;
    const zone = document.getElementById('employerZone').value;

    if (!profit || parseFloat(profit) <= 0) {
        errors.push('Overskudd må være et positivt tall');
        document.getElementById('profit').classList.add('error');
    } else {
        document.getElementById('profit').classList.remove('error');
    }

    if (!zone) {
        errors.push('Velg en arbeidsgiveravgiftssone');
    }

    return errors;
}

// Calculate scenarios
async function calculateScenarios() {
    clearErrors();
    
    const errors = validateForm();
    if (errors.length > 0) {
        showErrors(errors);
        return;
    }

    setLoading(true);
    resultsSection.classList.remove('visible');

    try {
        const formData = getFormData();
        
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!result.success) {
            showErrors(result.errors);
            return;
        }

        currentResults = result.data;
        displayResults(result.data);
        resultsSection.classList.add('visible');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showErrors([`Nettverksfeil: ${error.message}`]);
    } finally {
        setLoading(false);
    }
}

// Display results
function displayResults(data) {
    displaySummaryStats(data);
    displayComparisonTable(data.comparison);
    displayRecommendations(data.recommendations);
    displayDetailedBreakdown(data.scenarios);
}

// Display summary statistics
function displaySummaryStats(data) {
    const stats = document.getElementById('summaryStats');
    const best = data.comparison.rows[0];
    const worst = data.comparison.rows[data.comparison.rows.length - 1];
    const optimized = data.scenarios.optimized;

    stats.innerHTML = `
        <div class="stat-card">
            <div class="value text-success">${formatCurrency(best.netPayout)}</div>
            <div class="label">Beste netto utbetaling</div>
            <div class="text-muted">${best.name}</div>
        </div>
        <div class="stat-card">
            <div class="value">${formatPercent(best.effectiveRate)}</div>
            <div class="label">Laveste effektive skattesats</div>
        </div>
        <div class="stat-card">
            <div class="value text-error">${formatCurrency(data.comparison.maxDifference)}</div>
            <div class="label">Maksimal forskjell</div>
            <div class="text-muted">Mellom beste og dårligste</div>
        </div>
    `;
}

// Display comparison table
function displayComparisonTable(comparison) {
    const table = document.getElementById('comparisonTable');
    
    let html = `
        <thead>
            <tr>
                <th>Rang</th>
                <th>Scenario</th>
                <th>Netto utbetaling</th>
                <th>Total skatt</th>
                <th>Effektiv sats</th>
                <th>Beholdt i selskapet</th>
                <th>Forskjell fra beste</th>
            </tr>
        </thead>
        <tbody>
    `;

    comparison.rows.forEach((row, index) => {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
        const bestClass = index === 0 ? 'best' : '';
        
        html += `
            <tr class="${bestClass}">
                <td><span class="rank-badge ${rankClass}">${row.rank}</span></td>
                <td><strong>${row.name}</strong></td>
                <td>${formatCurrency(row.netPayout)}</td>
                <td>${formatCurrency(row.totalTax)}</td>
                <td>${formatPercent(row.effectiveRate)}</td>
                <td>${formatCurrency(row.retained)}</td>
                <td>${index === 0 ? '-' : formatCurrency(row.differenceFromBest)}</td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;
}

// Display recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations');
    
    let html = '';
    
    if (recommendations.primary) {
        html += `
            <div class="recommendation-card">
                <h3>🎯 Anbefalt strategi: ${recommendations.primary.scenario}</h3>
                <p>${recommendations.primary.reason}</p>
                <p class="mt-20">
                    <strong>Forventet netto utbetaling:</strong> ${formatCurrency(recommendations.primary.netPayout)}<br>
                    <strong>Effektiv skattesats:</strong> ${formatPercent(recommendations.primary.effectiveRate)}
                </p>
            </div>
        `;
    }

    if (recommendations.alternatives && recommendations.alternatives.length > 0) {
        html += '<h3 class="mt-20">🔄 Alternative strategier</h3><ul class="considerations-list">';
        recommendations.alternatives.forEach(alt => {
            html += `
                <li>
                    <span class="icon">📌</span>
                    <div>
                        <strong>${alt.scenario}</strong><br>
                        ${alt.reason}<br>
                        <small class="text-muted">Forskjell: ${formatCurrency(alt.difference)} mindre</small>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }

    if (recommendations.considerations && recommendations.considerations.length > 0) {
        html += '<h3 class="mt-20">⚖️ Viktige vurderinger</h3><ul class="considerations-list">';
        recommendations.considerations.forEach(con => {
            const icon = con.relevance === 'high' ? '⚠️' : 'ℹ️';
            html += `
                <li>
                    <span class="icon">${icon}</span>
                    <div>
                        <strong>${con.topic}</strong><br>
                        ${con.description}
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }

    container.innerHTML = html;
}

// Display detailed breakdown
function displayDetailedBreakdown(scenarios) {
    const container = document.getElementById('detailedBreakdown');
    
    const tabs = {
        salary: scenarios.allSalary,
        dividend: scenarios.allDividend,
        optimized: scenarios.optimized
    };

    let html = '';
    for (const [key, scenario] of Object.entries(tabs)) {
        if (!scenario || scenario.error) continue;
        
        const isActive = key === 'salary' ? 'active' : '';
        html += `<div class="tab-content ${isActive}" data-tab="${key}">`;
        
        // Summary
        html += `
            <div class="grid grid-2 mb-20">
                <div>
                    <h4>Selskapsnivå</h4>
                    <table class="comparison-table">
                        <tr><td>Overskudd</td><td>${formatCurrency(scenario.company?.profit || scenario.input?.profit)}</td></tr>
                        ${scenario.company?.grossSalaryPaid ? `<tr><td>Bruttolønn utbetalt</td><td>${formatCurrency(scenario.company.grossSalaryPaid)}</td></tr>` : ''}
                        ${scenario.company?.employerAGA ? `<tr><td>Arbeidsgiveravgift</td><td>${formatCurrency(scenario.company.employerAGA)}</td></tr>` : ''}
                        ${scenario.company?.corporateTax ? `<tr><td>Selskapsskatt</td><td>${formatCurrency(scenario.company.corporateTax)}</td></tr>` : ''}
                        ${scenario.company?.dividendDistributed ? `<tr><td>Utbytte utdelt</td><td>${formatCurrency(scenario.company.dividendDistributed)}</td></tr>` : ''}
                    </table>
                </div>
                <div>
                    <h4>Personlig nivå</h4>
                    <table class="comparison-table">
                        ${scenario.personal?.grossSalary ? `<tr><td>Bruttolønn</td><td>${formatCurrency(scenario.personal.grossSalary)}</td></tr>` : ''}
                        ${scenario.personal?.trygdeavgift ? `<tr><td>Trygdeavgift</td><td>${formatCurrency(scenario.personal.trygdeavgift)}</td></tr>` : ''}
                        ${scenario.personal?.trinnskatt ? `<tr><td>Trinnskatt</td><td>${formatCurrency(scenario.personal.trinnskatt)}</td></tr>` : ''}
                        ${scenario.personal?.inntektsskatt ? `<tr><td>Inntektsskatt</td><td>${formatCurrency(scenario.personal.inntektsskatt)}</td></tr>` : ''}
                        ${scenario.personal?.netSalary ? `<tr><td>Netto lønn</td><td>${formatCurrency(scenario.personal.netSalary)}</td></tr>` : ''}
                        ${scenario.personal?.dividendReceived ? `<tr><td>Utbytte mottatt</td><td>${formatCurrency(scenario.personal.dividendReceived)}</td></tr>` : ''}
                        ${scenario.personal?.dividendTax ? `<tr><td>Utbytteskatt</td><td>${formatCurrency(scenario.personal.dividendTax)}</td></tr>` : ''}
                        ${scenario.personal?.netDividend ? `<tr><td>Netto utbytte</td><td>${formatCurrency(scenario.personal.netDividend)}</td></tr>` : ''}
                    </table>
                </div>
            </div>
        `;
        
        // Calculation steps
        if (scenario.calculationSteps) {
            html += '<h4>Beregningssteg</h4><div class="calculation-steps">';
            scenario.calculationSteps.forEach((step, index) => {
                const stepTitle = step.step || `Steg ${index + 1}`;
                const stepDetails = step.details || [step.description] || [];
                
                html += `
                    <div class="step-item">
                        <div class="step-header" onclick="toggleStep(this)">
                            <span>${stepTitle}</span>
                            <span class="arrow">▼</span>
                        </div>
                        <div class="step-content">${Array.isArray(stepDetails) ? stepDetails.join('\n') : stepDetails}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Assumptions
        if (scenario.assumptions) {
            html += '<h4 class="mt-20">Forutsetninger</h4><ul>';
            scenario.assumptions.forEach(assumption => {
                html += `<li>${assumption}</li>`;
            });
            html += '</ul>';
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// Toggle calculation step
function toggleStep(element) {
    element.parentElement.classList.toggle('open');
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.tab === tabName);
    });
}

// Export to Excel
async function exportToExcel() {
    if (!currentResults) return;
    
    try {
        const response = await fetch('/api/export/excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentResults.input)
        });

        const result = await response.json();
        
        if (!result.success) {
            showErrors(result.errors);
            return;
        }

        // Create a simple CSV for download (full Excel would require library on frontend)
        const csvContent = createCSV(result.data);
        downloadFile(csvContent, 'skatteberegning.csv', 'text/csv');
        
    } catch (error) {
        showErrors([`Eksportfeil: ${error.message}`]);
    }
}

// Create CSV from data
function createCSV(data) {
    let csv = 'Scenario,Netto utbetaling,Total skatt,Effektiv skattesats,Forskjell fra beste\n';
    
    data.summary.rows.forEach(row => {
        csv += `"${row[0]}",${row[1]},${row[2]},${(row[3] * 100).toFixed(2)}%,${row[4]}\n`;
    });
    
    return csv;
}

// Download file
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Print results
function printResults() {
    window.print();
}

// Reset form
function resetForm() {
    form.reset();
    salaryRatioSlider.value = 50;
    updateSliderLabels();
    pensionRateContainer.style.display = 'none';
    retentionContainer.style.display = 'none';
    resultsSection.classList.remove('visible');
    clearErrors();
    currentResults = null;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Slider
    salaryRatioSlider.addEventListener('input', updateSliderLabels);
    
    // Checkboxes
    pensionCheckbox.addEventListener('change', togglePensionRate);
    retentionCheckbox.addEventListener('change', toggleRetention);
    
    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateScenarios();
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Export buttons
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('printResults').addEventListener('click', printResults);
    
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Initialize
    updateSliderLabels();
});

// Make toggleStep available globally
window.toggleStep = toggleStep;
