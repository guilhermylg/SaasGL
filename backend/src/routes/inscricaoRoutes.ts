import { Router } from "express";
import { criarInscricao } from "../controllers/inscricaoController";

const router = Router();

router.post("/", criarInscricao);

export default router;
