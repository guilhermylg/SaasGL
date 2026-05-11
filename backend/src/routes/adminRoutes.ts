import { Router } from "express";
import {
  getDashboard,
  getLeads,
  efetivarMatricula,
  getFinanceiro,
  confirmarPagamento,
  rejeitarPagamento,
  getAlunos,
  updateAluno,
  deleteAluno,
  getHistoricoPagamentos,
  exportarCRM,
} from "../controllers/adminController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", getDashboard);
router.get("/leads", getLeads);
router.post("/leads/:id/efetivar", efetivarMatricula);
router.get("/financeiro", getFinanceiro);
router.patch("/financeiro/:id/confirmar", confirmarPagamento);
router.patch("/financeiro/:id/rejeitar", rejeitarPagamento);
router.get("/alunos", getAlunos);
router.put("/alunos/:id", updateAluno);
router.delete("/alunos/:id", deleteAluno);
router.get("/alunos/:id/historico", getHistoricoPagamentos);
router.get("/export/alunos", exportarCRM);

export default router;
