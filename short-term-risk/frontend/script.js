// API base URL
const API_BASE = '/api';

// DOM elements
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContainer = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const quoteActions = document.getElementById('quoteActions');
const acceptQuoteBtn = document.getElementById('acceptQuote');
const newQuoteBtn = document.getElementById('newQuote');
const amountInput = document.getElementById('amountIn');

function formatCurrency(value, decimals = 6, currency = 'USD') {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

function formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '-';
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`;
    return `${(seconds / 3600).toFixed(2)}h`;
}

function formatPercentage(value, decimals = 6) {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `${(value * 100).toFixed(decimals)}%`;
}

function formatNumber(value, decimals = 4) {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    loadingIndicator.classList.add('hidden');
    hideQuoteResults();
}

function showLoading() {
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    hideQuoteResults();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Calculating...';
}

function hideLoading() {
    loadingIndicator.classList.add('hidden');
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Generate Final Quote';
}

function hideQuoteResults() {
    const existingCards = resultsContainer.querySelectorAll('.result-card');
    existingCards.forEach(card => card.remove());
    quoteActions.classList.add('hidden');
}

async function getQuoteCost(amountIn) {
    const response = await fetch(`${API_BASE}/quote/cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountIn })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    console.log('response', response);
    return await response.json();
}

function createResultCard(title, content, isRisk = false) {
    const card = document.createElement('div');
    card.className = 'result-card bg-gray-700/60 p-4 rounded-lg border border-gray-600';
    let titleColor = isRisk ? 'text-yellow-400' : 'text-cyan-400';
    card.innerHTML = `
        <h3 class="font-semibold text-lg ${titleColor} mb-2">${title}</h3>
        <div class="space-y-1 text-gray-300">${content}</div>
    `;
    resultsContainer.appendChild(card);
    setTimeout(() => card.classList.add('visible'), 10);
    return card;
}

function formatDataRow(label, value, isSub = false) {
    const labelClass = isSub ? 'text-gray-500 pl-4' : 'text-gray-400';
    return `
        <div class="flex justify-between items-center">
            <span class="${labelClass}">${label}:</span>
            <span class="font-mono text-gray-100">${value}</span>
        </div>
    `;
}

function displayQuoteResults(quote) {
    hideQuoteResults();
    
    // Main section - always visible
    const mainContent = `
        <div class="bg-gray-900/50 p-3 rounded-md text-center my-2">
            <div class="text-gray-400 text-sm">Output Amount (after Raydium fee)</div>
            <div class="text-2xl font-bold text-cyan-300 tracking-wider">
                ${formatNumber(quote.amountOut)} USDT
            </div>
        </div>
        <div class="bg-gray-900/50 p-3 rounded-md text-center my-2">
            <div class="text-gray-400 text-sm">Price Range (95% Confidence)</div>
            <div class="text-lg font-bold text-yellow-300 tracking-wider">
                [${formatNumber(quote.priceRange.lower)} ... ${formatNumber(quote.priceRange.upper)}]
            </div>
        </div>
        <div class="bg-gray-900/50 p-3 rounded-md text-center my-2">
            <div class="text-gray-400 text-sm">USDT Depeg Risk (0.5%)</div>
            <div class="text-lg font-bold ${quote.depegRisk.isAtRisk ? 'text-red-300' : 'text-green-300'} tracking-wider">
                ${quote.depegRisk.isAtRisk ? 'At Risk' : 'Not At Risk'}
            </div>
            <div class="text-xs text-gray-500 mt-1">
                Oracle Price: ${quote.depegRisk.oraclePrice} | Deviation: ${formatPercentage(quote.depegRisk.deviation)}
            </div>
        </div>
        <div class="bg-gray-900/50 p-3 rounded-md text-center my-2">
            <div class="text-gray-400 text-sm">Wormhole Bridge Status</div>
            <div class="text-lg font-bold ${quote.bridgeStatus.status === 'operational' ? 'text-green-300' : 'text-red-300'} tracking-wider">
                ${quote.bridgeStatus.status.toUpperCase()}
            </div>
            <div class="text-xs text-gray-500 mt-1">
                ${quote.bridgeStatus.message}
            </div>
        </div>
        <hr class="border-gray-700 my-2">
        ${formatDataRow('Total Cost (USDT)', `<strong>${formatCurrency(quote.totalCostUSDT)}</strong>`)}
        ${formatDataRow('└ ETH Gas Cost', formatCurrency(quote.gasCostUSDT), true)}
        ${formatDataRow('└ SOL Fee', formatCurrency(quote.solanaFeeUSDT), true)}
        ${formatDataRow('└ Raydium Fee (0.1%)', formatNumber(quote.raydiumFee), true)}
        <hr class="border-gray-700 my-2">
        ${formatDataRow('Min Received After Slippage', `<strong>${formatCurrency(quote.minReceivedAfterSlippage)}</strong>`)}
        ${formatDataRow('└ Slippage Cost (50 bps)', formatCurrency(quote.slippageCost), true)}
        <hr class="border-gray-700 my-2">
        ${formatDataRow('Total Time', `<strong>~${formatTime(quote.timeHorizon)}</strong>`)}
        ${formatDataRow('└ ETH Transaction', formatTime(quote.ethTxTime), true)}
        ${formatDataRow('└ Bridge Transfer(estimated)', formatTime(quote.bridgeTime), true)}
        ${formatDataRow('└ SOL Settlement', formatTime(quote.solTxTime), true)}
        <hr class="border-gray-700 my-2">
        <div class="mt-2 pt-2 border-t border-gray-700">
            <h4 class="font-medium text-yellow-400 mb-1">Risk Metrics</h4>
            ${formatDataRow('Volatility', formatPercentage(quote.adjustedVolatility))}
            ${formatDataRow('Price Impact', formatPercentage(quote.priceImpactManual))}
            ${formatDataRow('Required Margin', formatNumber(quote.zScore * quote.adjustedVolatility * quote.priceEff))}
        </div>
    `;
    createResultCard('Quote Summary', mainContent);

    // Advanced section - collapsible
    const advancedContent = `
        <div class="space-y-2 text-sm">
            <h4 class="font-medium text-gray-300 mb-2">Pricing Details</h4>
            ${formatDataRow('Initial Price(%)', formatNumber(quote.priceInit, 6))}
            ${formatDataRow('Effective Price(%)', formatNumber(quote.priceEff, 6))}
            
            <h4 class="font-medium text-gray-300 mb-2 mt-4">Gas Details</h4>
            ${formatDataRow('ETH Gas Price', `${formatNumber(quote.ethGasPrice)} Gwei`)}
            ${formatDataRow('ETH Gas Limit', formatNumber(quote.ethGasLimit))}
            ${formatDataRow('Gas Cost (ETH)', formatNumber(quote.gasCostETH, 6))}
            
            <h4 class="font-medium text-gray-300 mb-2 mt-4">Risk Parameters</h4>
            ${formatDataRow('Z-Score', formatNumber(quote.zScore))}
            ${formatDataRow('Raw Volatility', formatPercentage(quote.volatility))}
            ${formatDataRow('Adjusted Volatility', formatPercentage(quote.adjustedVolatility))}
            
        </div>
    `;
    
    const advancedCard = createResultCard('Advanced Details', advancedContent);
    advancedCard.classList.add('advanced-details');
    
    // Add toggle functionality
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'w-full mt-2 text-center text-cyan-400 hover:text-cyan-300 text-sm font-medium';
    toggleBtn.textContent = 'Show Advanced Details';
    toggleBtn.onclick = () => {
        const isHidden = advancedCard.classList.contains('hidden');
        advancedCard.classList.toggle('hidden');
        toggleBtn.textContent = isHidden ? 'Hide Advanced Details' : 'Show Advanced Details';
    };
    
    const mainCard = resultsContainer.querySelector('.result-card');
    mainCard.appendChild(toggleBtn);
    
    // Hide advanced section by default
    advancedCard.classList.add('hidden');
    
    quoteActions.classList.remove('hidden');
}

analyzeBtn.addEventListener('click', async () => {
    const amountIn = parseFloat(amountInput.value);
    if (amountIn <= 0) {
        showError('Amount must be greater than 0');
        return;
    }
    showLoading();
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const quote = await getQuoteCost(amountIn); // USDT 6 decimals
        displayQuoteResults(quote);
    } catch (error) {
        showError(`Failed to calculate quote: ${error.message}`);
    } finally {
        hideLoading();
    }
});

newQuoteBtn.addEventListener('click', () => {
    hideQuoteResults();
    errorMessage.classList.add('hidden');
});

acceptQuoteBtn.addEventListener('click', () => {
    // You can add logic here for accepting the quote
    alert('Quote accepted!');
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cross-chain quote frontend initialized with Tailwind CSS');
}); 