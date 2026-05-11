import { Router } from "express";
import {
  getDashboard,
  getLeads,
  efetivarMatricula,
  getFinanceiro,
  confirmarPagamento,
  rejeitarPagamento,
  getAlunos,
} from "../controllers/adminController";

const router = Router();

router.get("/dashboard", getDashboard);
router.get("/leads", getLeads);
router.post("/leads/:id/efetivar", efetivarMatricula);
router.get("/financeiro", getFinanceiro);
router.patch("/financeiro/:id/confirmar", confirmarPagamento);
router.patch("/financeiro/:id/rejeitar", rejeitarPagamento);
router.get("/alunos", getAlunos);

export default router;
