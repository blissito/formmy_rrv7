import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function findTestUser() {
  try {
    console.log('Buscando usuario de prueba...');
    
    // Buscar un usuario con customerId (probablemente tenga suscripción)
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

    if (user) {
      console.log('Usuario con customerId encontrado:');
      console.log(user);
      return user;
    }

    // Si no hay usuarios con customerId, buscar cualquier usuario
    console.log('No se encontraron usuarios con customerId. Buscando cualquier usuario...');
    const anyUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        customerId: true,
        plan: true
      }
    });

    if (anyUser) {
      console.log('Usuario encontrado (sin customerId):');
      console.log(anyUser);
      return anyUser;
    }

    console.log('No se encontraron usuarios en la base de datos.');
    return null;
  } catch (error) {
    console.error('Error al buscar usuario de prueba:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la búsqueda
findTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
