import express from "express";
import cors from "cors";
import inscricaoRoutes from "./routes/inscricaoRoutes";
import portalRoutes from "./routes/portalRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rotas ────────────────────────────────────────────────────────────────────────
app.use("/api/inscricao", inscricaoRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/admin", adminRoutes);

// ── Health Check ────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start ───────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚂 Trem das Onze API rodando na porta ${PORT}`);
});

export default app;
