import express from 'express';
import cors from 'cors';
import executeRouter from './routes/execute';
import quoteRouter from './routes/quote';
import riskRouter from './routes/risk';

const app = express();
const PORT = 3001;

// ✅ 加入 cors 設定
app.use(
  cors({
    origin: 'http://localhost:3000', // ⬅️ 這是前端開發的網址
    methods: ['GET', 'POST'],
    credentials: true,
  })
);
// ✅ JSON 解析
app.use(express.json());

// ✅ API 路由
app.use('/api/quote', quoteRouter);
app.use('/api/risk', riskRouter);

// ✅ 健康檢查
app.get('/', (_, res) => {
  res.send('Backend is running!');
});

// ✅ 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});