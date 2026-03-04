import express from 'express';
import cors from 'cors';
import landlordRoutes from './routes/landlord.routes.js';
import smsLogsRoutes from './routes/sms.routes.js';
import mpesaRoutes from './routes/mpesa.routes.js';
import { connectDB } from './config/mongo.config.js';
import './jobs/cron.job.js';

const PORT = process.env.PORT || 8000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Verbose request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('  Body:', JSON.stringify(req.body));
  console.log('  Headers:', req.headers);
  res.on('finish', () => {
    console.log(`  Response Status: ${res.statusCode}`);
  });
  next();
});

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/landlords', landlordRoutes);
app.use('/api/sms-logs', smsLogsRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

console.log('[STARTUP] Connecting to MongoDB...');
connectDB.then(() => {
  app.listen(PORT, () => {
      console.log(`[STARTUP] ✓ Server running on http://localhost:${PORT}`);
      console.log(`[STARTUP] Database connected successfully`);
  });
}).catch( err => {
  console.error('[STARTUP] ✗ Failed to connect to database:', err.message);
  process.exit(1);
});
