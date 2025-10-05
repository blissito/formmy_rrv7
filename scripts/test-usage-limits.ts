/**
 * Test de la nueva herramienta get_usage_limits
 */

const API_URL = process.env.API_URL || "http://localhost:3001";
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || "FORMMY_DEV_TOKEN_2025";

async function testUsageLimits() {
  console.log("🧪 Testing get_usage_limits tool\n");
  console.log(`API: ${API_URL}/api/ghosty/v0`);
  console.log(`Auth: ${DEV_TOKEN}\n`);

  const testMessages = [
    "¿Cuántas conversaciones me quedan?",
    "¿Cuál es mi límite mensual?",
    "Muéstrame mi uso de plan",
    "¿Cuándo se reinicia mi contador?",
  ];

  for (const message of testMessages) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📝 Pregunta: "${message}"\n`);

    try {
      const response = await fetch(`${API_URL}/api/ghosty/v0`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEV_TOKEN}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error: ${response.status} - ${error}`);
        continue;
      }

      if (!response.body) {
        console.error("❌ No response body");
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullResponse = "";
      let toolsUsed: string[] = [];
      let metadata: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.replace('data: ', '');
          try {
            const event = JSON.parse(data);

            if (event.type === 'tool-start') {
              console.log(`  🔧 Tool: ${event.tool}`);
              toolsUsed.push(event.tool);
            } else if (event.type === 'chunk') {
              fullResponse += event.content;
            } else if (event.type === 'done') {
              metadata = event.metadata;
            }
          } catch (parseError) {
            // Ignorar líneas no JSON
          }
        }
      }

      // Mostrar respuesta
      console.log(`\n💬 Respuesta:\n`);
      console.log(fullResponse);

      // Mostrar metadata
      if (metadata) {
        console.log(`\n📊 Metadata:`);
        console.log(`  - Tools ejecutadas: ${metadata.toolsExecuted}`);
        console.log(`  - Tools usadas: [${metadata.toolsUsed?.join(', ') || 'ninguna'}]`);
        console.log(`  - Tokens: ${metadata.tokensUsed}`);
        console.log(`  - Créditos: ${metadata.creditsUsed}`);
        console.log(`  - Costo: $${metadata.estimatedCost?.usdCost || '0'}`);
      }

      // Validar que usó get_usage_limits
      if (toolsUsed.includes('get_usage_limits')) {
        console.log(`\n✅ Herramienta get_usage_limits ejecutada correctamente`);
      } else {
        console.log(`\n⚠️ No se usó get_usage_limits (tools: ${toolsUsed.join(', ') || 'ninguna'})`);
      }

    } catch (error) {
      console.error(`\n❌ Test failed:`, error);
    }
  }

  console.log(`\n${'='.repeat(80)}\n`);
  console.log(`✅ Tests completados\n`);
}

testUsageLimits().catch(console.error);
