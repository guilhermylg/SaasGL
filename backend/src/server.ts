import express from "express";
import cors from "cors";
import inscricaoRoutes from "./routes/inscricaoRoutes";
import portalRoutes from "./routes/portalRoutes";
import adminRoutes from "./routes/adminRoutes";
import authRoutes from "./routes/authRoutes";
import { apiLimiter } from "./middleware/rateLimiter";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(apiLimiter);
app.use(express.json());

// ── Rotas ────────────────────────────────────────────────────────────────────────
app.use("/api/inscricao", inscricaoRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ── Health Check ────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

import { initScheduler } from "./scheduler";

// ── Start ───────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚂 Trem das Onze API rodando na porta ${PORT}`);
  initScheduler();
});

export default app;
