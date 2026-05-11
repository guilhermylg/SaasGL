import { z } from "zod";
import { validarCPF } from "../utils/cpfValidator";

export const inscricaoSchema = z.object({
  nomeResponsavel: z
    .string()
    .min(3, "Nome do responsável deve ter pelo menos 3 caracteres")
    .max(150, "Nome muito longo"),
  cpf: z
    .string()
    .min(11, "CPF inválido")
    .max(14, "CPF inválido")
    .refine((val) => validarCPF(val), { message: "CPF inválido" }),
  whatsapp: z
    .string()
    .min(10, "WhatsApp inválido")
    .max(20, "WhatsApp inválido"),
  nomeAluno: z
    .string()
    .min(3, "Nome do atleta deve ter pelo menos 3 caracteres")
    .max(150, "Nome muito longo"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  informacoesMedicas: z.string().optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const alunoUpdateSchema = z.object({
  nomeCompleto: z.string().min(3).max(150).optional(),
  categoria: z.string().optional(),
  informacoesMedicas: z.string().optional().nullable(),
  status: z.enum(["Lead", "Ativo", "Inativo"]).optional(),
});

export type InscricaoInput = z.infer<typeof inscricaoSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AlunoUpdateInput = z.infer<typeof alunoUpdateSchema>;
