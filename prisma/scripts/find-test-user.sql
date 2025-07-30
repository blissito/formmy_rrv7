-- Script para encontrar un usuario de prueba
-- Busca usuarios que tengan un customerId (son los que probablemente tienen suscripción)

// Buscar el primer usuario con customerId
const user = await prisma.user.findFirst({
  where: {
    customerId: { not: null }
  },
  select: {
    id: true,
    email: true,
    customerId: true,
    plan: true
  }
});

console.log('Usuario encontrado:', user);

// Si no hay usuarios con customerId, buscar cualquier usuario
if (!user) {
  const anyUser = await prisma.user.findFirst({
    select: {
      id: true,
      email: true,
      customerId: true,
      plan: true
    }
  });
  
  console.log('Usuario sin customerId encontrado:', anyUser);
}
