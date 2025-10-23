import { db } from '../app/utils/db.server';

async function getUserInfo(email: string) {
  console.log(`🔍 Buscando información para: ${email}\n`);

  try {
    // Buscar usuario
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        chatbots: {
          select: {
            id: true,
            name: true,
            personality: true,
            createdAt: true,
          },
        },
        apiKeys: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            key: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
      },
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:\n');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Nombre: ${user.name || 'N/A'}`);
    console.log(`Plan: ${user.plan}`);

    console.log(`\n📱 Chatbots (${user.chatbots.length}):`);
    user.chatbots.forEach((bot, i) => {
      console.log(`\n${i + 1}. ${bot.name}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   Personalidad: ${bot.personality}`);
      console.log(`   Creado: ${bot.createdAt.toISOString()}`);
    });

    console.log(`\n🔑 API Keys activas (${user.apiKeys.length}):`);
    user.apiKeys.forEach((key, i) => {
      console.log(`\n${i + 1}. ${key.name || 'Unnamed'}`);
      console.log(`   Key: ${key.key}`);
      console.log(`   Creado: ${key.createdAt.toISOString()}`);
      console.log(`   Último uso: ${key.lastUsedAt?.toISOString() || 'Nunca'}`);
    });

    // Mostrar resumen para SDK
    if (user.chatbots.length > 0 && user.apiKeys.length > 0) {
      console.log('\n\n📋 CONFIGURACIÓN PARA SDK:');
      console.log('─'.repeat(50));
      console.log(`API Key: ${user.apiKeys[0].key}`);
      console.log(`Chatbot ID: ${user.chatbots[0].id}`);
      console.log('─'.repeat(50));
      console.log('\nCódigo de ejemplo:');
      console.log(`
import { Formmy } from 'formmy-sdk';

const formmy = new Formmy({
  apiKey: '${user.apiKeys[0].key}',
});

// Query knowledge base
const result = await formmy.query('tu pregunta', {
  chatbotId: '${user.chatbots[0].id}',
});
      `);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

// Ejecutar
const email = process.argv[2] || 'fixtergeek@gmail.com';
getUserInfo(email);
