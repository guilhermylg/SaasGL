import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@tremdasonze.com";
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("senha123", 10);
    await prisma.admin.create({
      data: {
        nome: "Administrador Principal",
        email: adminEmail,
        senha: hashedPassword,
      },
    });
    console.log("✅ Administrador padrão criado com sucesso.");
    console.log(`Email: ${adminEmail} | Senha: senha123`);
  } else {
    console.log("ℹ️ Administrador padrão já existe.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
