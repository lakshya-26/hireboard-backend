import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { assertAuthEnv } from './config/auth.js';
import { connectDB } from './config/database.js';
import './models/index.js';
import { registerRoutes } from './routes/index.js';
import { commonErrorHandler } from './utils/errorHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

async function start() {
  try {
    assertAuthEnv();
    await connectDB();
    await registerRoutes(app);

    app.use((err, req, res, _next) => {
      console.error(err);
      return commonErrorHandler(
        req,
        res,
        err.message,
        err.statusCode ?? 500,
        err,
      );
    });

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
