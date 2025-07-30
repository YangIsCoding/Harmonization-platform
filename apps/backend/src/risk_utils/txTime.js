const { Connection, clusterApiUrl } = require('@solana/web3.js');
const { Alchemy, Network } = require('alchemy-sdk');

const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
});

class TxTimeService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30s
    }

    async estimateETHTxTime(gasPriceGwei) {
        const apiKey = process.env.ETHERSCAN_API_KEY;
        const gasPriceWei = BigInt(Math.floor(gasPriceGwei * 1e9)).toString();
        const url = `${process.env.ETHERSCAN_BASE_URL}?chainid=1&module=gastracker&action=gasestimate&gasprice=${gasPriceWei}&apikey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Etherscan gas estimate');
        const data = await response.json();
        if (data.status !== '1' || !data.result) {
            console.error('Etherscan response for gasPrice', gasPriceGwei, ':', data);
            throw new Error('Invalid Etherscan gas estimate', data);
        }
        return Number(data.result);
    }

    async estimateSolanaTxTime() {
        const cacheKey = `sol_blocktimes`;
        const cached = this.getCached(cacheKey);
        let avgBlockTime;
        if (cached) {
            avgBlockTime = cached;
        } else {
            const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
            const slot = await connection.getSlot('confirmed');
            const slots = Array.from({ length: 20 }, (_, i) => slot - i).filter(s => s > 0);
            const blockTimes = await connection.getBlocks(slots[slots.length - 1], slots[0]);
            if (!blockTimes || blockTimes.length < 2) throw new Error('Failed to fetch Solana block times');
            const firstTime = await connection.getBlockTime(slots[0]);
            const lastTime = await connection.getBlockTime(slots[slots.length - 1]);
            if (!firstTime || !lastTime) throw new Error('Failed to fetch Solana block times');
            avgBlockTime = Math.abs(firstTime - lastTime) / (slots[0] - slots[slots.length - 1]);
            this.setCached(cacheKey, avgBlockTime);
        }
        return avgBlockTime;
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

module.exports = new TxTimeService();

// async function test() {
//     const txTime = new TxTimeService();

//     console.log('Getting gas price from Alchemy...');
//     const currentGasPriceWei = await alchemy.core.getGasPrice();
//     console.log('currentGasPriceWei', currentGasPriceWei);

//     const currentGasPriceGwei = Number(currentGasPriceWei) / 1e9;
//     console.log('Current gas price:', currentGasPriceGwei);

//     console.log('Estimating ETH tx time...');
//     const ethTxTime = await txTime.estimateETHTxTime(currentGasPriceGwei);
//     console.log('ETH tx time:', ethTxTime, 'seconds');

//     console.log('Estimating Solana tx time...');
//     const solTxTime = await txTime.estimateSolanaTxTime();
//     console.log('Solana tx time:', solTxTime, 'seconds');

// }

// test().catch(err => {
//     console.error('Test failed:', err);
// });