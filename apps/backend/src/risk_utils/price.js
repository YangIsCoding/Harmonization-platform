class PriceFeedService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10000;
    }
    async getUSDTPrice() {
        const cacheKey = 'usdt_price';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        
        try {
            const url = `${process.env.COINGECKO_BASE_URL}/simple/price?ids=tether&vs_currencies=usd`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const price = data.tether.usd;
                this.setCached(cacheKey, price);
                return price;
            } else {
                throw new Error(`CoinGecko API returned ${response.status}`);
            }
        } catch (error) {
            console.error('USDT price fetch failed:', error);
            throw new Error('Failed to fetch USDT price from CoinGecko');
        }
    }

    async getUSDCPrice() {
        const cacheKey = 'usdc_price';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `${process.env.COINGECKO_BASE_URL}/simple/price?ids=usd-coin&vs_currencies=usd`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const price = data['usd-coin'].usd;
                this.setCached(cacheKey, price);
                return price;
            } else {
                throw new Error(`CoinGecko API returned ${response.status}`);
            }
        } catch (error) {
            console.error('USDC price fetch failed:', error);
            throw new Error('Failed to fetch USDC price from CoinGecko');
        }
    }

    async getETHPrice() {
        const cacheKey = 'eth_price';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `${process.env.COINGECKO_BASE_URL}/simple/price?ids=ethereum&vs_currencies=usd`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const price = data.ethereum.usd;
                this.setCached(cacheKey, price);
                return price;
            } else {
                throw new Error(`CoinGecko API returned ${response.status}`);
            }
        } catch (error) {
            console.error('ETH price fetch failed:', error);
            throw new Error('Failed to fetch ETH price from CoinGecko');
        }
    }

    async getSOLPrice() {
        const cacheKey = 'sol_price';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `${process.env.COINGECKO_BASE_URL}/simple/price?ids=solana&vs_currencies=usd`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                const price = data.solana.usd;
                this.setCached(cacheKey, price);
                return price;
            } else {
                throw new Error(`CoinGecko API returned ${response.status}`);
            }
        } catch (error) {
            console.error('SOL price fetch failed:', error);
            throw new Error('Failed to fetch SOL price from CoinGecko');
        }
    }

    async getDepegRisk(threshold = 0.005) {
        const price = await this.getUSDTPrice();
        const deviation = Math.abs(price - 1.0);
        return {
            oraclePrice: price,
            isAtRisk: deviation > threshold,
            deviation: deviation
        };
    }

    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
        }
        return null;
    }

    setCached(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
}

module.exports = new PriceFeedService(); 

// async function test() {
//     const priceFeeds = new PriceFeedService();
//     const usdtPrice = await priceFeeds.getUSDTPrice();
//     const ethPrice = await priceFeeds.getETHPrice();
//     const solPrice = await priceFeeds.getSOLPrice();
//     console.log('USDT price:', usdtPrice);
//     console.log('ETH price:', ethPrice);
//     console.log('SOL price:', solPrice);
//     const depegRisk = await priceFeeds.getDepegRisk();
//     console.log('Depeg risk:', depegRisk);
// }

// test();