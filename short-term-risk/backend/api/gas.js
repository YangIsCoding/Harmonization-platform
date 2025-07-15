import { Connection, clusterApiUrl, SystemProgram, Keypair, Transaction } from '@solana/web3.js';
import { Web3 } from 'web3';

class GasTrackerService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000;
        this.web3 = new Web3(`${process.env.ALCHEMY_BASE_URL}/${process.env.ALCHEMY_API_KEY}`);
    }

    async getETHGasPrice() {
        const cacheKey = 'eth_gas';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const apiKey = process.env.ETHERSCAN_API_KEY;
            if (!apiKey || apiKey === 'YourApiKeyToken') {
                throw new Error('Etherscan API key not configured');
            }

            const url = `${process.env.ETHERSCAN_BASE_URL}?chainid=1&module=gastracker&action=gasoracle&apikey=${apiKey}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === '1' && data.result) {
                    const safeGas = parseFloat(data.result.SafeGasPrice);
                    const proposeGas = parseFloat(data.result.ProposeGasPrice);
                    const fastGas = parseFloat(data.result.FastGasPrice);
                    const gasPrice = proposeGas || fastGas || safeGas;
                    if (gasPrice && gasPrice > 0 && gasPrice < 1000) {
                        this.setCached(cacheKey, gasPrice);
                        return gasPrice;
                    } else {
                        throw new Error(`Invalid gas price from Etherscan: ${gasPrice}`);
                    }
                } else if (data.status === '0') {
                    throw new Error(`Etherscan API error: ${data.message} - ${data.result}`);
                }
            } else {
                throw new Error(`Etherscan API returned ${response.status}`);
            }
        } catch (error) {
            console.error('ETH gas price fetch failed:', error);
            throw new Error(`Failed to fetch ETH gas price: ${error.message}`);
        }
    }
    async getETHGasLimit() {
        const cacheKey = 'eth_gas_limit';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        const approvalData = this.web3.eth.abi.encodeFunctionCall({
            name: 'approve',
            type: 'function',
            inputs: [
                { type: 'address', name: 'spender' },
                { type: 'uint256', name: 'amount' }
            ]
        }, [process.env.WORMHOLE_TOKEN_BRIDGE, '1000000000']); // 1000 USDC with 6 decimals
        
        const approvalGas = await this.web3.eth.estimateGas({
            to: process.env.USDC_CONTRACT,
            data: approvalData,
            from: '0x0000000000000000000000000000000000000000'
        });

        const bridgeGas = await this.web3.eth.estimateGas({
            to: process.env.WORMHOLE_TOKEN_BRIDGE,
            value: '0x0',
            data: '0x', 
            from: '0x0000000000000000000000000000000000000000'
        });
        const totalGas = Math.floor((Number(approvalGas) + Number(bridgeGas)) * 1.2);
        this.setCached(cacheKey, totalGas);
        return totalGas;
    }

    // Alternative: Estimate gas for a specific amount
    async estimateGasForAmount(amount) {
        amount = amount * 10 ** 6; // 6 decimals
        const approvalData = this.web3.eth.abi.encodeFunctionCall({
            name: 'approve',
            type: 'function',
            inputs: [
                { type: 'address', name: 'spender' },
                { type: 'uint256', name: 'amount' }
            ]
        }, [process.env.WORMHOLE_TOKEN_BRIDGE, amount.toString()]);
        const approvalGas = await this.web3.eth.estimateGas({
            to: process.env.USDC_CONTRACT,
            data: approvalData,
            from: '0x0000000000000000000000000000000000000000'
        });
        // Bridge gas estimation (simplified)
        const bridgeGas = await this.web3.eth.estimateGas({
            to: process.env.WORMHOLE_TOKEN_BRIDGE,
            value: '0x0',
            data: '0x',
            from: '0x0000000000000000000000000000000000000000'
        });
        return Math.floor((Number(approvalGas) + Number(bridgeGas)) * 1.2);
    }

    async getSolanaFee() {
        const cacheKey = 'sol_fee';
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
        const fromPubkey = Keypair.generate().publicKey;
        const toPubkey = Keypair.generate().publicKey;
        const instruction = SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: 1,
        });
        const { blockhash } = await connection.getLatestBlockhash();
        const transaction = new Transaction({
            feePayer: fromPubkey,
            recentBlockhash: blockhash,
        }).add(instruction);
        const message = transaction.compileMessage();
        const fee = await connection.getFeeForMessage(message);
        if (fee && fee.value) {
            const feeSOL = fee.value / 1e9;
            this.setCached(cacheKey, feeSOL);
            return feeSOL;
        } else {
            throw new Error('No fee returned from getFeeForMessage');
        }
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

export default new GasTrackerService();

// async function test() {
//     // Use a real symbol or a test symbol
//     const gasTracker = new GasTrackerService();
//     try {
//         const ethGasPrice = await gasTracker.getETHGasPrice();
//         const ethGasLimit = await gasTracker.getETHGasLimit();
//         const solanaFee = await gasTracker.getSolanaFee();
//         console.log('ETH Gas Price:', ethGasPrice, 'Gwei');
//         console.log('ETH Gas Limit:', ethGasLimit, 'unit');
//         console.log('Solana Fee:', solanaFee, 'SOL');
//     } catch (err) {
//         console.error('Error:', err);
//     }
// }

// test();