async function getUSDTetUSDTRaydiumQuote(amountIn, slippageBps = 50) {
    try {
        const url = `${process.env.RAYDIUM_TRADE_API_BASE_URL}/compute/swap-base-in?inputMint=${process.env.USDTET_MINT}&outputMint=${process.env.USDT_MINT}&amount=${amountIn}&slippageBps=${slippageBps}&txVersion=V0`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Raydium API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(`Raydium API failed: ${data.error || 'Unknown error'}`);
        }
        return {
            amountIn: data.data.inputAmount,
            amountOut: data.data.outputAmount,
            priceImpact: data.data.priceImpactPct,
            fee: data.data.routePlan[0].feeAmount,
            slippageBps: data.data.slippageBps,
        };
    } catch (error) {
        console.error('Failed to get Raydium quote:', error);
        throw new Error('Failed to get Raydium quote');
    }

    
}

async function getUSDTetUSDTRaydiumPriceInit() {
    const inputMint = process.env.USDTET_MINT;
    const outputMint = process.env.USDT_MINT;
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
        console.log('data', data);
        return data.data.data[0].price;
    } catch (error) {
        console.error('Failed to get Raydium quote:', error);
        throw new Error('Failed to get Raydium quote');
    }

}

module.exports = {
    getUSDTetUSDTRaydiumQuote,
    getUSDTetUSDTRaydiumPriceInit,
};


// (async () => {
//   const quote = await getUSDTetUSDTRaydiumQuote(1_000_000);
//   const priceInit = await getUSDTetUSDTRaydiumPriceInit();
//   console.log('Quote:', quote);
//   console.log('Price Init:', priceInit);
// })();


