/**
 * Test real del endpoint de chatbot para verificar metadata de fuentes
 * Simula exactamente lo que hace el frontend
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRealChatbot() {
  console.log("🔍 Testing real chatbot sources metadata...\n");

  // Buscar chatbot de prueba
  const chatbot = await prisma.chatbot.findFirst({
    where: {
      name: { contains: "Demo" }
    }
  });

  if (!chatbot) {
    console.error("❌ No se encontró chatbot de prueba");
    return;
  }

  console.log(`✅ Chatbot encontrado: ${chatbot.name} (${chatbot.id})\n`);

  // Simular request del frontend - USAR ENDPOINT DEL CHATBOT, NO GHOSTY
  const testQuery = "qué animal soy?"; // Pregunta que debería buscar en la base de conocimiento
  const url = `http://localhost:3000/api/v0/chatbot`;

  console.log(`📤 Enviando query: "${testQuery}"`);
  console.log(`   URL: ${url}`);
  console.log(`   Chatbot: ${chatbot.id}\n`);

  try {
    // Crear FormData como espera el endpoint
    const formData = new FormData();
    formData.append("intent", "chat");
    formData.append("message", testQuery);
    formData.append("chatbotId", chatbot.id);
    formData.append("sessionId", "test-session-" + Date.now());
    formData.append("stream", "true");

    const response = await fetch(url, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      console.error(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return;
    }

    console.log("✅ Response OK, parseando stream...\n");

    // Parsear stream como lo hace el frontend
    const reader = response.body?.getReader();
    if (!reader) {
      console.error("❌ No reader disponible");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let messageCount = 0;
    let sourcesFound = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice(6));
          messageCount++;

          if (data.type === "sources") {
            sourcesFound = true;
            console.log(`📋 SOURCES EVENT RECIBIDO (#${messageCount}):`);
            console.log(JSON.stringify(data, null, 2));
            console.log("\n🔍 ANÁLISIS DE METADATA:");

            if (!data.sources || data.sources.length === 0) {
              console.log("   ⚠️  Array de sources está vacío");
            } else {
              data.sources.forEach((source: any, idx: number) => {
                console.log(`\n   Source #${idx + 1}:`);
                console.log(`     - id: ${source.id || 'MISSING'}`);
                console.log(`     - score: ${source.score}`);
                console.log(`     - text length: ${source.text?.length || 0}`);
                console.log(`     - metadata keys: ${Object.keys(source.metadata || {}).join(', ') || 'NONE'}`);

                if (source.metadata) {
                  console.log(`     - source: ${source.metadata.source || 'MISSING'}`);
                  console.log(`     - fileName: ${source.metadata.fileName || 'MISSING'}`);
                  console.log(`     - contextId: ${source.metadata.contextId || 'MISSING'}`);
                  console.log(`     - chatbotId: ${source.metadata.chatbotId || 'MISSING'}`);
                  console.log(`     - chunkIndex: ${source.metadata.chunkIndex}`);
                }
              });
            }
          } else if (data.type === "text") {
            // Solo mostrar primer y último texto
            if (messageCount <= 2 || data.done) {
              console.log(`💬 TEXT EVENT (#${messageCount}): "${data.text?.substring(0, 50)}${data.text?.length > 50 ? '...' : ''}"`);
            }
          }
        } catch (e) {
          // Ignorar líneas malformadas
        }
      }
    }

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total events: ${messageCount}`);
    console.log(`   Sources encontradas: ${sourcesFound ? '✅ SÍ' : '❌ NO'}`);

    if (!sourcesFound) {
      console.log(`\n⚠️  No se recibió ningún evento "sources"`);
      console.log(`   Esto significa que el agente no está usando search_context`);
      console.log(`   o que la herramienta no está devolviendo fuentes.`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testRealChatbot()
  .then(() => {
    console.log("\n✅ Test completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
