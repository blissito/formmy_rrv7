/**
 * Script para obtener API key y chatbots de un usuario
 */
import { db } from "~/utils/db.server";

async function getUserCredentials(email: string) {
  try {
    console.log(`\n🔍 Buscando usuario: ${email}\n`);

    // Buscar usuario
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        toolCreditsUsed: true,
        purchasedCredits: true,
      },
    });

    if (!user) {
      console.error("❌ Usuario no encontrado");
      process.exit(1);
    }

    console.log("✅ Usuario encontrado:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Plan: ${user.plan}`);
    console.log(`   Créditos usados: ${user.toolCreditsUsed}`);
    console.log(`   Créditos comprados: ${user.purchasedCredits}`);

    // Buscar API key activa
    const apiKey = await db.apiKey.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        key: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    if (!apiKey) {
      console.log("\n⚠️  No hay API key activa");
    } else {
      console.log("\n🔑 API Key activa:");
      console.log(`   Key: ${apiKey.key}`);
      console.log(`   Nombre: ${apiKey.name || "Sin nombre"}`);
      console.log(`   Creada: ${apiKey.createdAt.toISOString()}`);
      console.log(`   Último uso: ${apiKey.lastUsedAt?.toISOString() || "Nunca"}`);
    }

    // Buscar chatbots
    const chatbots = await db.chatbot.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        slug: true,
        name: true,
        personality: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`\n🤖 Chatbots (${chatbots.length}):`);

    for (let i = 0; i < chatbots.length; i++) {
      const bot = chatbots[i];

      // Contar embeddings para este chatbot
      const embeddingCount = await db.embedding.count({
        where: { chatbotId: bot.id },
      });

      console.log(`\n   ${i + 1}. ${bot.name} (${bot.slug})`);
      console.log(`      ID: ${bot.id}`);
      console.log(`      Personalidad: ${bot.personality || "N/A"}`);
      console.log(`      Embeddings: ${embeddingCount}`);
    }

    // Obtener embeddings del primer chatbot para testing
    if (chatbots.length > 0) {
      const firstChatbot = chatbots[0];
      const embeddingCount = await db.embedding.count({
        where: { chatbotId: firstChatbot.id },
      });

      console.log(`\n📊 Embeddings en ${firstChatbot.slug}: ${embeddingCount}`);

      if (embeddingCount > 0) {
        // Obtener sample de metadata
        const sampleEmbeddings = await db.embedding.findMany({
          where: { chatbotId: firstChatbot.id },
          select: { metadata: true },
          take: 3,
        });

        console.log("\n   Muestras de metadata:");
        sampleEmbeddings.forEach((emb: any, i) => {
          console.log(`   ${i + 1}. contextType: ${emb.metadata?.contextType || "N/A"}`);
          console.log(`      title: ${emb.metadata?.title || "N/A"}`);
          console.log(`      contextId: ${emb.metadata?.contextId || "N/A"}`);
        });
      }
    }

    console.log("\n✅ Script completado\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Obtener email desde argumentos o usar default
const email = process.argv[2] || "fixtergeek@gmail.com";
getUserCredentials(email);
