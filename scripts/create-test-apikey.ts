#!/usr/bin/env npx tsx

/**
 * Script para crear un API key de prueba
 */

import { db } from "../app/utils/db.server";
import { nanoid } from "nanoid";

async function createTestApiKey() {
  try {
    const chatbotId = "687edb4e7656b411c6a6c628"; // El chatbot "Bot para mis XV"

    console.log('🔑 Creating API key for chatbot:', chatbotId);

    // Primero obtener el chatbot con su usuario
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      include: { user: true }
    });

    if (!chatbot) {
      throw new Error('Chatbot not found');
    }

    console.log('📋 Chatbot found:', chatbot.name, 'User:', chatbot.user.email);

    // Crear directamente un nuevo API key (saltar verificación por problemas con datos existentes)

    // Crear API key directamente con Prisma
    const apiKey = await db.apiKey.create({
      data: {
        key: `formmy_${nanoid(7)}`,
        name: `${chatbot.name} Test Key`,
        chatbotId,
        userId: chatbot.userId,
        isActive: true,
        rateLimit: 1000,
        requestCount: 0,
        monthlyRequests: 0,
        allowedDomains: []
      }
    });

    console.log('✅ API Key created/found:');
    console.log('Key:', apiKey.key);
    console.log('Name:', apiKey.name);
    console.log('Active:', apiKey.isActive);
    console.log('Created:', apiKey.createdAt);

    console.log('\n🧪 Test with curl:');
    console.log(`curl -X POST http://localhost:3000/api/v0/chatbot \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -H "x-api-key: ${apiKey.key}" \\
  -d "intent=chat&chatbotId=${chatbotId}&message=Hola&sessionId=test-session"`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestApiKey();