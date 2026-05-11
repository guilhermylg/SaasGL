import { Request, Response } from "express";
import prisma from "../prisma";

export const buscarPortal = async (req: Request, res: Response) => {
  try {
    const { cpf } = req.params;

    const responsavel = await prisma.responsavel.findUnique({
      where: { cpf },
      include: {
        alunos: {
          where: { status: "Ativo" },
          orderBy: { dataCadastro: "desc" },
          include: {
            mensalidades: {
              orderBy: { dataCriacao: "desc" },
            },
          },
        },
      },
    });

    if (!responsavel) {
      return res.status(404).json({ error: "CPF não encontrado." });
    }

    return res.json({
      responsavel: {
        id: responsavel.id,
        nomeCompleto: responsavel.nomeCompleto,
        cpf: responsavel.cpf,
        whatsapp: responsavel.whatsapp,
      },
      alunos: responsavel.alunos.map((aluno) => ({
        id: aluno.id,
        nomeCompleto: aluno.nomeCompleto,
        categoria: aluno.categoria,
        mensalidades: aluno.mensalidades.map((m) => ({
          id: m.id,
          mesReferencia: m.mesReferencia,
          valor: Number(m.valor),
          dataVencimento: m.dataVencimento,
          status: m.status,
        })),
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar portal:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};

export const notificarPagamento = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id },
      include: {
        aluno: true,
      },
    });

    if (!mensalidade) {
      return res.status(404).json({ error: "Mensalidade não encontrada." });
    }

    await prisma.mensalidade.update({
      where: { id },
      data: { status: "Aguardando Conferência" },
    });

    return res.json({
      message: "Status atualizado",
      alunoNome: mensalidade.aluno.nomeCompleto,
      mesReferencia: mensalidade.mesReferencia,
    });
  } catch (error) {
    console.error("Erro ao notificar pagamento:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
};
