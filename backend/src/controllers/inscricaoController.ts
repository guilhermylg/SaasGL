import { Request, Response } from "express";
import prisma from "../prisma";
import { inscricaoSchema } from "../validators/schemas";

export const criarInscricao = async (req: Request, res: Response) => {
  try {
    const data = inscricaoSchema.parse(req.body);
    const {
      nomeResponsavel,
      cpf,
      whatsapp,
      nomeAluno,
      dataNascimento,
      categoria,
      informacoesMedicas,
    } = data;

    // Busca ou cria o responsável pelo CPF
    let responsavel = await prisma.responsavel.findUnique({
      where: { cpf },
    });

    if (!responsavel) {
      responsavel = await prisma.responsavel.create({
        data: {
          nomeCompleto: nomeResponsavel,
          cpf,
          whatsapp,
        },
      });
    }

    // Cria o aluno com status Lead
    const aluno = await prisma.aluno.create({
      data: {
        responsavelId: responsavel.id,
        nomeCompleto: nomeAluno,
        dataNascimento: new Date(dataNascimento),
        categoria: categoria || null,
        informacoesMedicas: informacoesMedicas || null,
        status: "Lead",
      },
    });

    return res.status(201).json({
      message: "Inscrição realizada com sucesso!",
      alunoId: aluno.id,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors[0].message });
    }

    console.error("Erro ao processar inscrição:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "CPF já cadastrado com dados divergentes.",
      });
    }

    return res.status(500).json({
      error: "Erro interno ao processar inscrição.",
    });
  }
};
