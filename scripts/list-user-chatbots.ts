import { db } from '../app/utils/db.server';

async function main() {
  const user = await db.user.findUnique({
    where: { email: 'fixtergeek@gmail.com' },
    select: {
      id: true,
      email: true,
      plan: true,
      chatbots: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          contexts: true,
          _count: {
            select: { embeddings: true }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('Usuario no encontrado');
    return;
  }

  console.log('\n👤 USUARIO: ' + user.email);
  console.log('📋 Plan: ' + user.plan);
  console.log('🤖 Total chatbots: ' + user.chatbots.length + '\n');

  console.log('CHATBOTS DISPONIBLES:\n');
  user.chatbots.forEach((c: any, i: number) => {
    const status = c.isActive ? '✅ Activo' : '❌ Inactivo';
    console.log(`${i + 1}. ${c.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Slug: ${c.slug}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Contextos: ${c.contexts.length}`);
    console.log(`   Embeddings: ${c._count.embeddings}`);
    if (c.contexts.length > 0) {
      console.log('   Títulos contextos:');
      c.contexts.slice(0, 3).forEach((ctx: any) => {
        console.log(`      - ${ctx.title || ctx.id}`);
      });
      if (c.contexts.length > 3) {
        console.log(`      ... y ${c.contexts.length - 3} más`);
      }
    }
    console.log('');
  });

  await db.$disconnect();
}

main();
