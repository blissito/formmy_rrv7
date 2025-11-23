import { db } from "../app/utils/db.server";

async function verify() {
  const chatbots = await db.chatbot.count();
  const users = await db.user.count();
  const conversations = await db.conversation.count();
  const messages = await db.message.count();
  const contexts = await db.context.count();
  const embeddings = await db.embedding.count();
  const contacts = await db.contact.count();
  const leads = await db.lead.count();
  const integrations = await db.integration.count();

  console.log("📊 Estado final de la base de datos:");
  console.log(`   Usuarios: ${users}`);
  console.log(`   Chatbots: ${chatbots}`);
  console.log(`   Conversaciones: ${conversations}`);
  console.log(`   Mensajes: ${messages}`);
  console.log(`   Contextos (nuevo): ${contexts}`);
  console.log(`   Embeddings: ${embeddings}`);
  console.log(`   Contactos: ${contacts}`);
  console.log(`   Leads: ${leads}`);
  console.log(`   Integraciones: ${integrations}`);

  // Verificar chatbot preservado
  const chatbot = await db.chatbot.findUnique({
    where: { id: "691fe6f9aaf51e4d69c10b8e" },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
      contexts: true,
      _count: {
        select: {
          contextObjects: true,
          conversations: true,
        },
      },
    },
  });

  console.log("\n✅ Chatbot preservado:");
  console.log(`   ID: ${chatbot?.id}`);
  console.log(`   Slug: ${chatbot?.slug}`);
  console.log(`   Nombre: ${chatbot?.name}`);
  console.log(`   Usuario: ${chatbot?.userId}`);
  console.log(`   Contextos legacy (array): ${chatbot?.contexts.length}`);
  console.log(`   Contextos nuevos (relación): ${chatbot?._count.contextObjects}`);
  console.log(`   Conversaciones: ${chatbot?._count.conversations}`);
}

verify()
  .catch(console.error)
  .finally(() => db.$disconnect());
