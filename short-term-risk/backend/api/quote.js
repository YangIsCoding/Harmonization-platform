import poolTracker from './pool.js';
import gasTracker from './gas.js';
import priceFeeds from './price.js';
import txTimeService from './txTime.js';
import volatilityService from './volatility.js';
import bridgeTracker from './bridge.js';

export async function getQuoteCost({ amountIn }) {
    console.log('amountIn', amountIn);

    // 1. Get real quote from Raydium Trade API
    const raydiumQuote = await poolTracker.getUSDCetUSDCRaydiumQuote(amountIn);
    const amountOut = Number(raydiumQuote.amountOut);
    const priceImpact = Number(raydiumQuote.priceImpact);
    const raydiumFee = Number(raydiumQuote.fee);
    const slippageBps = Number(raydiumQuote.slippageBps);
    const slippageCost = amountIn * slippageBps / 10000; // in USDC
    const priceEff = amountOut / amountIn;
    const priceInit = await poolTracker.getUSDCetUSDCRaydiumPriceInit();
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

    // 4. Get live ETH and SOL prices (USDC)
    const [usdcPriceUSD, ethPriceUSD, solPriceUSD] = await Promise.all([
        priceFeeds.getUSDCPrice(),
        priceFeeds.getETHPrice(),
        priceFeeds.getSOLPrice()
    ]);
    console.log('usdcPriceUSD', usdcPriceUSD);
    console.log('ethPriceUSD', ethPriceUSD);
    console.log('solPriceUSD', solPriceUSD);
    // 5. Gas cost in USDC
    const gasCostUSDC = gasCostETH * ethPriceUSD * usdcPriceUSD;
    console.log('gasCostUSDC', gasCostUSDC);
    // 6. Solana fee in USDC
    const solanaFeeUSDC = solanaFee * solPriceUSD * usdcPriceUSD;
    console.log('solanaFeeUSDC', solanaFeeUSDC);
    // 7. Total cost in USDC
    const totalCostUSDC = gasCostUSDC + solanaFeeUSDC + raydiumFee;
    console.log('totalCostUSDC', totalCostUSDC);
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
    const volatility = await volatilityService.getGARCHVolatility('usd-coin', totalTimeSec);
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
        gasCostUSDC,
        solanaFeeUSDC,
        totalCostUSDC,
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

// --- Example: Integration usage ---

// async function testQuoteCost() {
//   // 1. Get real pool reserves
//   const quote = await getQuoteCost({ amountIn: 1000000});
//   console.log(quote);
// }
// testQuoteCost().catch(err => {
//   console.error('Test failed:', err);
// });
