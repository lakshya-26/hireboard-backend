/**
 * Syncs Mongoose indexes with the current schema definitions.
 * Run after deploying schema/index changes (see README or project docs).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { Application, Reminder, User } from '../models/index.js';

async function main() {
  await connectDB();
  await Promise.all([
    User.syncIndexes(),
    Application.syncIndexes(),
    Reminder.syncIndexes(),
  ]);
  console.log('Mongoose indexes synced for User, Application, Reminder');
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
