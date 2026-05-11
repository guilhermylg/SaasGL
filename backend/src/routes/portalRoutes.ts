import { Router } from "express";
import { buscarPortal, notificarPagamento } from "../controllers/portalController";

const router = Router();

router.get("/:cpf", buscarPortal);
router.patch("/mensalidade/:id/notificar", notificarPagamento);

export default router;
