import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
import { getQuoteCost } from './api/quote.js';

app.use(express.static(path.join(__dirname, '../frontend')));

// --- Quote ---
app.post('/api/quote/cost', express.json(), async (req, res, next) => {
  try {
    const { amountIn } = req.body;
    if (amountIn == null) {
      return res.status(400).json({ error: 'Missing required parameter: amountIn' });
    }
    const result = await getQuoteCost({ amountIn: Number(amountIn) });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 