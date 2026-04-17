import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { assertAuthEnv } from "./config/auth.js";
import { assertOtpEmailEnv } from "./config/otpEmail.js";
import { closeRedis, getRedis } from "./config/redis.js";
import { connectDB } from "./config/database.js";
import "./models/index.js";
import { registerRoutes } from "./routes/index.js";
import {
  startReminderEmailCron,
  stopReminderEmailCron,
} from "./jobs/reminderEmailCron.js";
import { commonErrorHandler } from "./utils/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT);

const clientOrigin = process.env.CLIENT_ORIGIN;

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

async function start() {
  try {
    assertAuthEnv();
    assertOtpEmailEnv();
    await connectDB();
    await registerRoutes(app);
    await getRedis();

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
      startReminderEmailCron();
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  stopReminderEmailCron();
  await closeRedis();
  await mongoose.connection.close();
  process.exit(0);
});

start();
