import { spawn } from 'child_process';

class VolatilityService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    async getGARCHVolatility(symbol, timeHorizon) {
        const cacheKey = `garch_${symbol}_${timeHorizon}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const historicalData = await this.getHistoricalPrices(symbol, 30);
            const predictedVol = await this.runPythonGarch(historicalData);

            // Adjust for time horizon (seconds)
            const adjustedVolatility = predictedVol * Math.sqrt(timeHorizon / 86400)

            this.setCached(cacheKey, adjustedVolatility);
            return adjustedVolatility;
        } catch (error) {
            console.warn('GARCH calculation failed:', error);
            throw new Error('Failed to fetch GARCH volatility');
        }
    }

    async getHistoricalPrices(symbol, days) {
        const response = await fetch(`${process.env.COINGECKO_BASE_URL}/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`);
        const data = await response.json();
        return data.prices.map(p => p[1]);
    }

    async runPythonGarch(prices) {
        return new Promise((resolve, reject) => {
            const py = spawn('python3', ['backend/utils/garch_vol.py']);
            let output = '';
            let error = '';

            py.stdout.on('data', (data) => { output += data; });
            py.stderr.on('data', (data) => { error += data; });

            py.on('close', (code) => {
                if (code !== 0) return reject(new Error(error || 'Python script failed'));
                try {
                    const result = JSON.parse(output);
                    resolve(result.volatility);
                } catch (e) {
                    reject(new Error('Failed to parse Python output: ' + output));
                }
            });

            py.stdin.write(JSON.stringify(prices));
            py.stdin.end();
        });
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

export default new VolatilityService();


// async function test() {
//     // Use a real symbol or a test symbol
//     const symbol = 'usd-coin';
//     const timeHorizon = 86400; // 1 day in seconds
//     const volatilityService = new VolatilityService();
//     try {
//         const vol = await volatilityService.getGARCHVolatility(symbol, timeHorizon);
//         console.log('GARCH Volatility:', vol);
//     } catch (err) {
//         console.error('Error:', err);
//     }
// }

// test();