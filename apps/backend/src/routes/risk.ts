import { Router } from 'express';
// @ts-ignore
const fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = Router();

const ETHERSCAN_API_KEY = 'P22EW7SQ71FTQXYGWVKFR7UZ8EWK8E4YR7';

// 获取 gas price、gas cost、确认时间
router.post('/gas', async (req, res) => {
  try {
    const gasLimit = req.body.gasLimit || 60000;
    // 1. 获取当前 gas price（ProposeGasPrice, gwei）
    const gasOracleResp = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`);
    const gasOracle = await gasOracleResp.json();
    const gasPriceGwei = Number(gasOracle?.result?.ProposeGasPrice || 30);
    const gasPriceWei = gasPriceGwei * 1e9;
    // 2. 计算 gas cost（ETH）
    const gasCostEth = (gasPriceWei * gasLimit) / 1e18;
    // 3. 获取确认时间（秒）
    const gasEstimateResp = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=${gasPriceWei}&apikey=${ETHERSCAN_API_KEY}`);
    const gasEstimate = await gasEstimateResp.json();
    const confirmationTime = Number(gasEstimate?.result || 0);
    res.json({
      gasPrice: gasPriceGwei,
      gasLimit,
      gasCost: gasCostEth,
      confirmationTime
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gas info', details: String(err) });
  }
});

// 获取 mempool pending tx 和 congestion ratio
router.post('/mempool', async (req, res) => {
  try {
    // 用 Etherscan API 获取 mempool pending tx
    const resp = await fetch(`https://api.etherscan.io/api?module=proxy&action=txpool_status&apikey=${ETHERSCAN_API_KEY}`);
    const data = await resp.json();
    const pending = Number(data?.result?.pending || 0);
    // mock 历史均值（实际可存数据库或定时抓取）
    const pendingMA = 100000; // 可以根据实际情况调整
    const congestionRatio = pendingMA > 0 ? pending / pendingMA : 0;
    res.json({
      pendingTx: pending,
      pendingTxMA: pendingMA,
      congestionRatio
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mempool info', details: String(err) });
  }
});

export default router;