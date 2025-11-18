import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { visitorRouter } from './routes/visitors.js';
import { adminRouter } from './routes/admin.js';
import { analyticsRouter } from './routes/analytics.js';
import { graphRouter } from './routes/graph.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeCronJobs } from './services/cronJobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/visitors', visitorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/graph', graphRouter);

// Error handling
app.use(errorHandler);

// Initialize cron jobs for cleanup
initializeCronJobs();

app.listen(PORT, () => {
  console.log(`✅ FP-VIS Backend running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});

export default app;