import cron from "node-cron";
import prisma from "./prisma";

export const initScheduler = () => {
  // Roda todo dia 1º de cada mês às 01:00 da manhã
  cron.schedule("0 1 1 * *", async () => {
    console.log("⏳ [Scheduler] Iniciando geração de mensalidades...");
    try {
      const ativos = await prisma.aluno.findMany({
        where: { status: "Ativo" },
      });

      const hoje = new Date();
      const mesRef = `${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
      const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 10);
      const valorPadrao = parseFloat(process.env.VALOR_MENSALIDADE_PADRAO || "150.00");

      let geradas = 0;

      for (const aluno of ativos) {
        // Verifica se já existe mensalidade para o mês (evita duplicidade)
        const existe = await prisma.mensalidade.findFirst({
          where: {
            alunoId: aluno.id,
            mesReferencia: mesRef,
          },
        });

        if (!existe) {
          await prisma.mensalidade.create({
            data: {
              alunoId: aluno.id,
              mesReferencia: mesRef,
              valor: valorPadrao,
              dataVencimento: vencimento,
              status: "Pendente",
            },
          });
          geradas++;
        }
      }

      console.log(`✅ [Scheduler] Geração concluída. ${geradas} novas mensalidades criadas para o mês ${mesRef}.`);
    } catch (error) {
      console.error("❌ [Scheduler] Erro ao gerar mensalidades:", error);
    }
  });

  console.log("⏱️  Scheduler de mensalidades inicializado.");
};
