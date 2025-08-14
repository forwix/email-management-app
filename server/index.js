// ---- env 読み込み ----
import dotenv from 'dotenv';
dotenv.config();

// ---- 依存 ----
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ---- ルート ----
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/emails.js';
import claudeRoutes from './routes/claude.js';

// ---- アプリ設定 ----
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100,                 // 同一IP最大100リクエスト/15分
});
app.use(limiter);

// CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- ルート登録 ----
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/claude', claudeRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ---- 起動（DB接続成功後にlisten）----
const { PORT = 5000, MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
