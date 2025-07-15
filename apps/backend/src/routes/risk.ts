import { Router } from 'express';

// Import the JS handler (adjust the path if needed)
const { getQuoteCost } = require('../risk_utils/quote.js');

const router = Router();

// POST /api/risk
router.post('/', async (req, res) => {
  try {
    const { amountIn } = req.body;
    if (typeof amountIn !== 'number' || isNaN(amountIn) || amountIn <= 0) {
      res.status(400).json({ error: 'Invalid amountIn' });
      return;
    }
    // Call the JS function, which should return the quote result
    const result = await getQuoteCost(amountIn);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
