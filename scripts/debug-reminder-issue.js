#!/usr/bin/env node
/**
 * Script de diagnóstico para el problema de recordatorios
 * Reproduce el flujo completo del chatbot
 */

const API_URL = process.env.API_URL || "http://localhost:3000";
const CHATBOT_ID = process.env.CHATBOT_ID || "6774f2a0a0b3bf4be4d5ee19";
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || "FORMMY_DEV_TOKEN_2025";

async function testReminderFlow() {
  console.log("🔍 Diagnóstico del flujo de recordatorios\n");
  console.log("📍 Endpoint:", API_URL);
  console.log("🤖 Chatbot ID:", CHATBOT_ID);
  console.log("\n" + "=".repeat(60) + "\n");

  const formData = new FormData();
  formData.append("intent", "chat");
  formData.append("chatbotId", CHATBOT_ID);
  formData.append("message", "Recuérdame la misa del 15 de septiembre de 2025 a las 5 PM, enviarlo a fixtergeek@gmail.com");
  formData.append("sessionId", `test-${Date.now()}`);
  formData.append("conversationHistory", JSON.stringify([
    { role: "assistant", content: "¡Hola! ¿Cómo puedo ayudarte?" }
  ]));
  formData.append("stream", "true");

  try {
    console.log("📤 Enviando request a /api/v0/chatbot...\n");

    const response = await fetch(`${API_URL}/api/v0/chatbot`, {
      method: "POST",
      headers: {
        "x-dev-token": DEV_TOKEN
      },
      body: formData
    });

    console.log("📥 Status:", response.status);
    console.log("📋 Headers:", Object.fromEntries(response.headers.entries()));
    console.log("\n" + "=".repeat(60) + "\n");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      return;
    }

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('text/event-stream')) {
      console.log("✅ SSE Stream detectado - procesando eventos...\n");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let toolsExecuted = [];
      let chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);

              if (data.type === 'chunk') {
                chunks.push(data.content);
                fullResponse += data.content;
                process.stdout.write(data.content);
              } else if (data.type === 'tool-start') {
                console.log(`\n\n🔧 [TOOL] Ejecutando: ${data.tool || data.message}`);
                toolsExecuted.push(data.tool);
              } else if (data.type === 'metadata') {
                console.log("\n\n📊 Metadata final:", JSON.stringify(data.metadata, null, 2));
              } else if (data.type === 'done') {
                console.log("\n\n✅ Stream completado");
              } else if (data.type === 'error') {
                console.log("\n\n❌ Error:", data.content);
              }
            } catch (e) {
              // Ignorar líneas que no son JSON
            }
          }
        }
      }

      console.log("\n\n" + "=".repeat(60));
      console.log("📈 RESUMEN:");
      console.log("  - Chunks recibidos:", chunks.length);
      console.log("  - Herramientas ejecutadas:", toolsExecuted.length > 0 ? toolsExecuted : "Ninguna");
      console.log("  - Respuesta completa length:", fullResponse.length);
      console.log("=".repeat(60) + "\n");

      // Verificación de problemas
      if (toolsExecuted.length === 0) {
        console.log("⚠️  PROBLEMA DETECTADO: No se ejecutaron herramientas");
        console.log("   - El agente debió ejecutar 'schedule_reminder' pero no lo hizo");
        console.log("   - Verificar que el modelo tenga acceso a tools");
      }

      if (fullResponse.includes("error al intentar obtener la fecha")) {
        console.log("⚠️  PROBLEMA DETECTADO: Error en get_current_datetime");
        console.log("   - El agente está intentando usar datetime pero falla");
      }

    } else if (contentType?.includes('application/json')) {
      const jsonData = await response.json();
      console.log("📦 JSON Response:", JSON.stringify(jsonData, null, 2));
    } else {
      console.log("❓ Tipo de respuesta desconocido:", contentType);
    }

  } catch (error) {
    console.error("💥 Error ejecutando test:", error.message);
    console.error(error);
  }
}

// Run test
testReminderFlow().catch(console.error);