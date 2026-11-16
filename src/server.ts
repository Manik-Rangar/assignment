import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
      console.log(`Swagger docs at http://localhost:${env.port}/api-docs`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down`);
      server.close();
      await mongoose.connection.close();
      process.exit(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

void start();
