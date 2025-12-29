// src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import folderRoutes from "./routes/folder.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { env } from "./config/env.js";

const app = express();

/**
 * ✅ CORS
 * - Allow frontend origin
 * - Allow cookies (JWT / session cookies)
 */
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

/**
 * ✅ Logging
 * - Use `dev` locally
 * - Use `combined` in production
 */
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

/**
 * ✅ Body parsing
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * ✅ Health check
 */
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "EduMind API",
    environment: env.NODE_ENV,
  });
});

/**
 * ✅ Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/", chatRoutes);
app.use("/api/", messageRoutes);

/**
 * ✅ Global error handler (VERY IMPORTANT)
 */
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
