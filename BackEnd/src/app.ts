// src/app.ts (Backend)
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
 * ✅ CORS - Allow your frontend domain
 */
app.use(
  cors({
    origin: [
      env.CLIENT_URL, // Your main frontend URL
      "https://edumind-app.onrender.com",
      "http://localhost:5173",
      "http://localhost:8080",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "EduMind API",
    environment: env.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/", chatRoutes);
app.use("/api/", messageRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Error:", err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;