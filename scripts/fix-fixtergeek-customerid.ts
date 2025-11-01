import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "fixtergeek@gmail.com" }
  });

  if (!user) {
    console.log("Usuario no encontrado");
    return;
  }

  console.log(`Usuario actual: ${user.email}, customerId: ${user.customerId}`);

  // Asignar un customerId temporal único
  const tempCustomerId = `temp_migration_${user.id.substring(0, 12)}`;

  await prisma.user.update({
    where: { email: "fixtergeek@gmail.com" },
    data: { customerId: tempCustomerId }
  });

  console.log(`✅ customerId actualizado a: ${tempCustomerId}`);
}

main().finally(() => prisma.$disconnect());
