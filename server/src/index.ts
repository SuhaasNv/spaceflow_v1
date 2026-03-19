import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import spacesRoutes from "./routes/spaces.js";
import bookingsRoutes from "./routes/bookings.js";
import occupancyRoutes from "./routes/occupancy.js";
import analyticsRoutes from "./routes/analytics.js";
import adminRoutes from "./routes/admin.js";
import recommendationsRoutes from "./routes/recommendations.js";
import aiRoutes from "./routes/ai.js";
import seedRoutes from "./routes/seed.js";

import { auditLogger } from "./middleware/audit.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:8080").replace(/\/$/, "");

// Trust Railway's reverse proxy so express-rate-limit and req.ip work correctly.
// Use 2 for Railway (load balancer + internal proxy); 1 for local dev.
app.set("trust proxy", process.env.NODE_ENV === "production" ? 2 : 1);

// CORS — must be before other middleware
// Allow FRONTEND_URL and any *.vercel.app (preview deployments)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin or non-browser
      if (origin === FRONTEND_URL || origin.endsWith(".vercel.app")) {
        return cb(null, origin);
      }
      cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Audit logger (non-blocking)
app.use("/api", auditLogger);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/spaces", spacesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/occupancy", occupancyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Seed endpoint (before 404 so it's matched)
app.use("/api/seed", seedRoutes);

// 404 — catch unmatched /api routes
app.use("/api", (req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 SpaceFlow API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}`);
});

export default app;
