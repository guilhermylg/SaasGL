import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema } from "../validators/schemas";

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({
      where: { email: data.email },
    });

    if (!admin) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isValidPassword = await bcrypt.compare(data.senha, admin.senha);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "8h" }
    );

    res.json({
      token,
      admin: {
        nome: admin.nome,
        email: admin.email,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
};
