import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
  } catch (err) {
    console.error(
      `\nCould not connect to MongoDB at ${env.mongoUri}\n` +
        'Make sure MongoDB is running (e.g. `sudo systemctl start mongod`) ' +
        'or set MONGO_URI in .env to a reachable instance.\n',
    );
    throw err;
  }
};
