import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  const quote = req.body; // quote should include fromChain, toChain, amount, bridge, etc.
  console.log('Executing bridge quote:', quote);

  // 模擬執行結果
  const result = {
    status: 'success',
    txHash: '0x1234567890abcdef',
    executedAt: new Date().toISOString(),
  };

  res.json(result);
});

export default router;
