const poolTracker = require('./pool.js');
const gasTracker = require('./gas.js');
const priceFeeds = require('./price.js');
const txTimeService = require('./txTime.js');
const volatilityService = require('./volatility.js');
const bridgeTracker = require('./bridge.js');

async function getQuoteCost(amountIn) {
    console.log('quote amountIn', amountIn);

    // 1. Get real quote from Raydium Trade API
    const raydiumQuote = await poolTracker.getUSDTetUSDTRaydiumQuote(amountIn);
    const amountOut = Number(raydiumQuote.amountOut);
    const priceImpact = Number(raydiumQuote.priceImpact);
    const raydiumFee = Number(raydiumQuote.fee);
    const slippageBps = Number(raydiumQuote.slippageBps);
    const slippageCost = amountIn * slippageBps / 10000; // in USDT
    const priceEff = amountOut / amountIn;
    const priceInit = await poolTracker.getUSDTetUSDTRaydiumPriceInit();
    const priceImpactManual = (priceEff - priceInit) / priceInit;
    const minReceivedAfterSlippage = amountOut - slippageCost;
    console.log('amountIn', amountIn);
    console.log('amountOut', amountOut);
    console.log('priceInit', priceInit);
    console.log('priceEff', priceEff);
    console.log('priceImpactManual', priceImpactManual);
    console.log('priceImpact', priceImpact);
    console.log('raydiumFee', raydiumFee);
    console.log('slippageBps', slippageBps);
    console.log('slippageCost', slippageCost);

    // 2. Fetch live gas data
    const [ethGasPrice, ethGasLimit, solanaFee] = await Promise.all([
        gasTracker.getETHGasPrice(),    // Gwei
        gasTracker.estimateGasForAmount(amountIn),    // units
        gasTracker.getSolanaFee()       // SOL
    ]);

    console.log('ethGasPrice', ethGasPrice);
    console.log('ethGasLimit', ethGasLimit);
    console.log('solanaFee', solanaFee);

    // 3. Gas cost (ETH)
    const gasCostETH = (ethGasPrice * ethGasLimit) / 1e9; // ETH
    console.log('gasCostETH', gasCostETH);

    // 4. Get live ETH and SOL prices (USDT)
    const [usdtPriceUSD, ethPriceUSD, solPriceUSD] = await Promise.all([
        priceFeeds.getUSDTPrice(),
        priceFeeds.getETHPrice(),
        priceFeeds.getSOLPrice()
    ]);
    console.log('usdtPriceUSD', usdtPriceUSD);
    console.log('ethPriceUSD', ethPriceUSD);
    console.log('solPriceUSD', solPriceUSD);
    // 5. Gas cost in USDT
    const gasCostUSDT = gasCostETH * ethPriceUSD * usdtPriceUSD;
    console.log('gasCostUSDT', gasCostUSDT);
    // 6. Solana fee in USDT
    const solanaFeeUSDT = solanaFee * solPriceUSD * usdtPriceUSD;
    console.log('solanaFeeUSDT', solanaFeeUSDT);
    // 7. Total cost in USDT
    const totalCostUSDT = gasCostUSDT + solanaFeeUSDT + raydiumFee;
    console.log('totalCostUSDT', totalCostUSDT);
    // 8. Use actual tx time services
    const [ethTxTime, solTxTime] = await Promise.all([
        txTimeService.estimateETHTxTime(ethGasPrice),
        txTimeService.estimateSolanaTxTime()
    ]);
    console.log('ethTxTime', ethTxTime);
    console.log('solTxTime', solTxTime);
    const bridgeTime = 20 * 60; // 20 minutes in seconds
    const totalTimeSec = ethTxTime + bridgeTime + solTxTime;
    console.log('bridgeTime', bridgeTime);
    console.log('totalTimeSec', totalTimeSec);
    // 9. Volatility and price range (no fallback)
    const volatility = await volatilityService.getGARCHVolatility('tether', totalTimeSec);
    const zScore = 2;
    const adjustedVolatility = volatility * priceEff;
    console.log('totalTimeSec', totalTimeSec);
    console.log('volatility', volatility);
    console.log('adjustedVolatility', adjustedVolatility);
    // Final amount range (what user receives)
    const priceRange = {
        lower: amountOut * (1 - zScore * adjustedVolatility),
        upper: amountOut * (1 + zScore * adjustedVolatility)
    };
    console.log('priceRange', priceRange);
    // 10. Get Wormhole bridge status
    const bridgeStatus = await bridgeTracker.getWormholeStatus();
    console.log('bridgeStatus', bridgeStatus);
    // 11. Get depeg risk
    const depegRisk = await priceFeeds.getDepegRisk();
    console.log('depegRisk', depegRisk);
    return {
        priceEff,
        priceInit,
        slippageCost,
        minReceivedAfterSlippage,
        gasCostUSDT,
        solanaFeeUSDT,
        totalCostUSDT,
        gasCostETH,
        priceImpact,
        priceImpactManual,
        volatility,
        adjustedVolatility,
        amountOut,
        raydiumFee,
        priceRange,
        zScore,
        timeHorizon: totalTimeSec,
        ethTxTime,
        solTxTime,
        bridgeTime,
        ethGasPrice,
        ethGasLimit,
        bridgeStatus,
        slippageBps,
        depegRisk,
    };
}

module.exports = {
    getQuoteCost,
};
// --- Example: Integration usage ---

// async function testQuoteCost() {
//   // 1. Get real pool reserves
//   const quote = await getQuoteCost({ amountIn: 1000});
//   console.log(quote);
// }
// testQuoteCost().catch(err => {
//   console.error('Test failed:', err);
// });
