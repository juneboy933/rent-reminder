import express from 'express';
import cors from 'cors';
import landlordRoutes from './routes/landlord.routes.js';
import smsLogsRoutes from './routes/sms.routes.js';
import { connectDB } from './config/mongo.config.js';
import './jobs/cron.job.js';

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/landlords', landlordRoutes);
app.use('/api/sms-logs', smsLogsRoutes);

connectDB.then(() => {
  app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch( err => {
  console.error('Failed to connect to database:', err);
});
