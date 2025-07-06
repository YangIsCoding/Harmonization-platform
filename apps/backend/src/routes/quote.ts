import { Router } from 'express';
import { getMockBridgeQuotes } from '../../../../packages/sdk/quote'; //

const router = Router();

router.post('/', async (req, res) => {
  const { fromChain, toChain, amount } = req.body;

  // ✅ 呼叫 SDK 函數，並傳入請求資料
  const quotes = await getMockBridgeQuotes(fromChain, toChain, amount);

  res.json(quotes);
});

export default router;
