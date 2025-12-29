// src/server.ts
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    /**
     * ✅ Connect MongoDB first
     */
    await connectDB();

    /**
     * ✅ Start server
     */
    const server = app.listen(env.PORT, () => {
      console.log(
        `🚀 EduMind API running on port ${env.PORT} [${env.NODE_ENV}]`
      );
    });

    /**
     * ✅ Graceful shutdown (VERY IMPORTANT for production)
     */
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
