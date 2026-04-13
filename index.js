import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import './models/index.js';
import healthRouter from './routes/health.route.js';
import { registerRoutes } from './routes/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

async function start() {
  try {
    await connectDB();
    await registerRoutes(app);
    // Unversioned health URL (common for load balancers); also available at /api/v1/health
    app.use('/api/health', healthRouter);

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

start();
