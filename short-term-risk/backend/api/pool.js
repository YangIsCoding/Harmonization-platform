async function getUSDCetUSDCRaydiumQuote(amountIn, slippageBps = 50) {
    try {
        const url = `${process.env.RAYDIUM_TRADE_API_BASE_URL}/compute/swap-base-in?inputMint=${process.env.USDCET_MINT}&outputMint=${process.env.USDC_MINT}&amount=${amountIn}&slippageBps=${slippageBps}&txVersion=V0`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Raydium API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(`Raydium API failed: ${data.error || 'Unknown error'}`);
        }
        quote = data.data;
    } catch (error) {
        console.error('Failed to get Raydium quote:', error);
        throw new Error('Failed to get Raydium quote');
    }
    return {
        amountIn: quote.inputAmount,
        amountOut: quote.outputAmount,
        priceImpact: quote.priceImpactPct,
        fee: quote.routePlan[0].feeAmount,
        slippageBps: quote.slippageBps,
    };
    
}

async function getUSDCetUSDCRaydiumPriceInit() {
    const inputMint = process.env.USDCET_MINT;
    const outputMint = process.env.USDC_MINT;
    try {
        const url = `${process.env.RAYDIUM_API_BASE_URL}/pools/info/mint?mint1=${inputMint}&mint2=${outputMint}&poolType=concentrated&poolSortField=default&sortType=desc&pageSize=1&page=1`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        if (!response.ok) {
            throw new Error(`Raydium API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(`Raydium API failed: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Failed to get Raydium quote:', error);
        throw new Error('Failed to get Raydium quote');
    }
    return data.data.data[0].price;
}

export default {
    getUSDCetUSDCRaydiumQuote,
    getUSDCetUSDCRaydiumPriceInit,
};


(async () => {
  const quote = await getUSDCetUSDCRaydiumQuote(1_000_000);
  const priceInit = await getUSDCetUSDCRaydiumPriceInit();
  console.log('Quote:', quote);
  console.log('Price Init:', priceInit);
})();


