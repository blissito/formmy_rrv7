/**
 * Lista tus chatbots para obtener el CHATBOT_ID
 */
import { db } from '../app/utils/db.server';

async function listChatbots() {
  try {
    // Buscar usuario por email
    const user = await db.user.findUnique({
      where: { email: 'fixtergeek@gmail.com' },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.log('❌ No se encontró el usuario fixtergeek@gmail.com');
      return;
    }

    console.log(`\n👤 Usuario: ${user.name} (${user.email})\n`);

    const chatbots = await db.chatbot.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        personality: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (chatbots.length === 0) {
      console.log('❌ No se encontraron chatbots');
      return;
    }

    console.log('\n📋 Tus Chatbots:\n');
    chatbots.forEach((bot, idx) => {
      console.log(`${idx + 1}. ${bot.name}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   Tipo: ${bot.personality}`);
      console.log(`   Creado: ${bot.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    console.log('💡 Copia el ID del chatbot con WhatsApp configurado');
    console.log('   y úsalo para ejecutar el script de templates:\n');
    console.log('   CHATBOT_ID=<tu-id> npx tsx scripts/debug-whatsapp-templates.ts\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

listChatbots();
