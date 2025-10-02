import { db } from '../app/utils/db.server';

async function main() {
  const result = await db.chatbot.update({
    where: { id: '68a8bccb2b5f4db764eb931d' },
    data: {
      temperature: 0.7, // Recomendado para growth hacker
      maxTokens: 800 // Límite razonable
    }
  });

  console.log('✅ Chatbot actualizado:');
  console.log('  Temperatura:', result.temperature, '(era 2)');
  console.log('  Max Tokens:', result.maxTokens, '(era undefined)');

  await db.$disconnect();
}

main();
