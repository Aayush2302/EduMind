// src/server.ts
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';


async function startServer(): Promise<void> {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
