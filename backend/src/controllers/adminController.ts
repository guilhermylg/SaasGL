import { Request, Response } from "express";
import prisma from "../prisma";

// ── Dashboard KPIs ──────────────────────────────────────────────────────────────

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const aguardando = await prisma.mensalidade.count({
      where: { status: "Aguardando Conferência" },
    });

    const novosLeads = await prisma.aluno.count({
      where: { status: "Lead" },
    });

    const now = new Date();
    const mesAtual = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const receitaRows = await prisma.mensalidade.findMany({
      where: {
        status: "Pago",
        mesReferencia: mesAtual,
      },
      select: { valor: true },
    });

    const receitaConfirmada = receitaRows.reduce(
      (acc, row) => acc + Number(row.valor),
      0
    );

    const totalAtivos = await prisma.aluno.count({
      where: { status: "Ativo" },
    });

    const inadimplentes = await prisma.mensalidade.count({
      where: {
        status: { in: ["Pendente", "Atrasado"] },
        mesReferencia: mesAtual,
      },
    });

    // Receita dos últimos 6 meses para o gráfico
    const meses: { label: string; receita: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      const rows = await prisma.mensalidade.findMany({
        where: { status: "Pago", mesReferencia: label },
        select: { valor: true },
      });
      const total = rows.reduce((acc, r) => acc + Number(r.valor), 0);
      meses.push({ label, receita: total });
    }

    return res.json({
      aguardando,
      novosLeads,
      receitaConfirmada,
      totalAtivos,
      inadimplentes,
      receitaMensal: meses,
    });
  } catch (error) {
    console.error("Erro dashboard:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

// ── Gestão de Leads ─────────────────────────────────────────────────────────────

export const getLeads = async (_req: Request, res: Response) => {
  try {
    const leads = await prisma.aluno.findMany({
      where: { status: "Lead" },
      orderBy: { dataCadastro: "desc" },
      include: {
        responsavel: {
          select: {
            nomeCompleto: true,
            whatsapp: true,
            cpf: true,
          },
        },
      },
    });

    return res.json(leads);
  } catch (error) {
    console.error("Erro leads:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

export const efetivarMatricula = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    const aluno = await prisma.aluno.findUnique({ where: { id } });
    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado." });
    }

    // Atualiza status para Ativo
    await prisma.aluno.update({
      where: { id },
      data: { status: "Ativo" },
    });

    // Gera primeira mensalidade
    const hoje = new Date();
    const mesRef = `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
    const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 10);

    await prisma.mensalidade.create({
      data: {
        alunoId: id,
        mesReferencia: mesRef,
        valor: 150.0,
        dataVencimento: vencimento,
        status: "Pendente",
      },
    });

    return res.json({ message: "Matrícula efetivada com sucesso!" });
  } catch (error) {
    console.error("Erro efetivar:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

// ── Validação Financeira ────────────────────────────────────────────────────────

export const getFinanceiro = async (_req: Request, res: Response) => {
  try {
    const pendentes = await prisma.mensalidade.findMany({
      where: { status: "Aguardando Conferência" },
      orderBy: { dataCriacao: "desc" },
      include: {
        aluno: {
          include: {
            responsavel: {
              select: {
                nomeCompleto: true,
                whatsapp: true,
              },
            },
          },
        },
      },
    });

    const result = pendentes.map((m) => ({
      id: m.id,
      mesReferencia: m.mesReferencia,
      valor: Number(m.valor),
      dataVencimento: m.dataVencimento,
      alunoNome: m.aluno.nomeCompleto,
      responsavelNome: m.aluno.responsavel.nomeCompleto,
      responsavelWhatsapp: m.aluno.responsavel.whatsapp,
    }));

    return res.json(result);
  } catch (error) {
    console.error("Erro financeiro:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

export const confirmarPagamento = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.mensalidade.update({
      where: { id },
      data: { status: "Pago" },
    });

    return res.json({ message: "Pagamento confirmado." });
  } catch (error) {
    console.error("Erro confirmar:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

export const rejeitarPagamento = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.mensalidade.update({
      where: { id },
      data: { status: "Pendente" },
    });

    return res.json({ message: "Pagamento rejeitado." });
  } catch (error) {
    console.error("Erro rejeitar:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

// ── CRM de Alunos ───────────────────────────────────────────────────────────────

export const getAlunos = async (req: Request, res: Response) => {
  try {
    const { categoria, status } = req.query;

    const where: any = {};
    if (categoria && typeof categoria === "string") {
      where.categoria = categoria;
    }
    if (status && typeof status === "string") {
      where.status = status;
    }

    const alunos = await prisma.aluno.findMany({
      where,
      orderBy: { dataCadastro: "desc" },
      include: {
        responsavel: {
          select: {
            nomeCompleto: true,
            whatsapp: true,
            cpf: true,
          },
        },
      },
    });

    const result = alunos.map((a) => ({
      id: a.id,
      nomeCompleto: a.nomeCompleto,
      dataNascimento: a.dataNascimento,
      categoria: a.categoria,
      status: a.status,
      dataCadastro: a.dataCadastro,
      informacoesMedicas: a.informacoesMedicas,
      responsavel: a.responsavel,
    }));

    return res.json(result);
  } catch (error) {
    console.error("Erro CRM:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};
