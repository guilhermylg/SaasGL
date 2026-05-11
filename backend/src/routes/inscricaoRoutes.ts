import { Router } from "express";
import { criarInscricao } from "../controllers/inscricaoController";
import { inscricaoLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/", inscricaoLimiter, criarInscricao);

export default router;
