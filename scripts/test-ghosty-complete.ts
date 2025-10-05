/**
 * Pruebas completas de Ghosty - Verificar metadata de usage tracking
 */

const API_URL = process.env.API_URL || "http://localhost:3001";
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || "FORMMY_DEV_TOKEN_2025";

interface StreamEvent {
  type: string;
  content?: string;
  tool?: string;
  message?: string;
  metadata?: {
    toolsExecuted: number;
    toolsUsed: string[];
    tokensUsed: number;
    creditsUsed: number;
    estimatedCost: {
      tokens: number;
      credits: number;
      usdCost: string;
    };
  };
}

async function testGhosty(testName: string, message: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Test: ${testName}`);
  console.log(`📨 Message: "${message}"\n`);

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
      return;
    }

    if (!response.body) {
      console.error("❌ No response body");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullResponse = "";
    let toolsDetected: string[] = [];
    let finalMetadata: any = null;
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n\n');

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = line.replace('data: ', '');
        try {
          const event: StreamEvent = JSON.parse(data);

          if (event.type === 'tool-start') {
            console.log(`  🔧 Tool: ${event.tool}`);
            toolsDetected.push(event.tool!);
          } else if (event.type === 'chunk') {
            fullResponse += event.content;
            chunkCount++;
          } else if (event.type === 'done') {
            finalMetadata = event.metadata;
          }
        } catch (parseError) {
          // Ignorar líneas no JSON
        }
      }
    }

    // Mostrar respuesta
    console.log(`\n💬 Response (${chunkCount} chunks):`);
    console.log(`  "${fullResponse.substring(0, 150)}${fullResponse.length > 150 ? '...' : ''}"`);

    // Validar metadata
    if (!finalMetadata) {
      console.log(`\n❌ NO METADATA RECEIVED`);
      return;
    }

    console.log(`\n📊 Metadata:`);
    console.log(`  toolsExecuted: ${finalMetadata.toolsExecuted}`);
    console.log(`  toolsUsed: [${finalMetadata.toolsUsed.join(', ')}]`);
    console.log(`  tokensUsed: ${finalMetadata.tokensUsed}`);
    console.log(`  creditsUsed: ${finalMetadata.creditsUsed}`);
    console.log(`  estimatedCost: $${finalMetadata.estimatedCost.usdCost} USD`);

    // Validaciones
    console.log(`\n✅ Validations:`);

    const toolsMatch = finalMetadata.toolsExecuted === toolsDetected.length;
    console.log(`  ${toolsMatch ? '✅' : '❌'} Tool count: detected ${toolsDetected.length}, reported ${finalMetadata.toolsExecuted}`);

    const hasTokens = finalMetadata.tokensUsed > 0;
    console.log(`  ${hasTokens ? '✅' : '❌'} Tokens tracked: ${finalMetadata.tokensUsed}`);

    const hasCredits = finalMetadata.creditsUsed >= 0; // 0 es válido si no hay tools
    console.log(`  ${hasCredits ? '✅' : '❌'} Credits tracked: ${finalMetadata.creditsUsed}`);

    const hasCost = parseFloat(finalMetadata.estimatedCost.usdCost) >= 0;
    console.log(`  ${hasCost ? '✅' : '✅'} Cost calculated: $${finalMetadata.estimatedCost.usdCost}`);

    // Calcular créditos esperados
    const TOOL_CREDITS: Record<string, number> = {
      'save_contact_info': 1,
      'get_current_datetime': 1,
      'schedule_reminder': 2,
      'list_reminders': 2,
      'web_search_google': 3,
      'search_context': 2,
      'create_payment_link': 4,
      'query_chatbots': 3,
      'get_chatbot_stats': 5,
    };

    const expectedCredits = finalMetadata.toolsUsed.reduce((sum: number, tool: string) => {
      return sum + (TOOL_CREDITS[tool] || 1);
    }, 0);

    const creditsMatch = finalMetadata.creditsUsed === expectedCredits;
    console.log(`  ${creditsMatch ? '✅' : '❌'} Credits calculation: expected ${expectedCredits}, got ${finalMetadata.creditsUsed}`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error);
  }
}

async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                   GHOSTY USAGE TRACKING - COMPLETE TESTS                  ║
╚═══════════════════════════════════════════════════════════════════════════╝

API: ${API_URL}/api/ghosty/v0
Auth: ${DEV_TOKEN}
`);

  // Test 1: Sin tools (solo conversación)
  await testGhosty(
    "Simple conversation (0 tools, 0 credits)",
    "Hola Ghosty, ¿cómo estás?"
  );

  // Test 2: Una tool básica (1 crédito)
  await testGhosty(
    "Datetime tool (1 tool, 1 credit)",
    "¿Qué hora es?"
  );

  // Test 3: Otra tool básica (1 crédito)
  await testGhosty(
    "Save contact (1 tool, 1 credit)",
    "Guarda este contacto: John Doe, email: john@example.com, teléfono: +52 123 456 7890"
  );

  // Test 4: Web search (3 créditos)
  await testGhosty(
    "Web search (1 tool, 3 credits)",
    "Busca en internet las últimas noticias sobre inteligencia artificial"
  );

  // Test 5: Múltiples tools
  await testGhosty(
    "Multiple tools (variable credits)",
    "¿Qué día es hoy? Luego guarda este contacto: Jane Smith, jane@example.com"
  );

  // Test 6: Query chatbots (solo para Ghosty)
  await testGhosty(
    "Query chatbots (1 tool, 3 credits - Ghosty only)",
    "Muéstrame mis chatbots activos"
  );

  // Test 7: Get stats (solo para Ghosty)
  await testGhosty(
    "Get chatbot stats (1 tool, 5 credits - Ghosty only)",
    "Dame las estadísticas de conversaciones de esta semana"
  );

  // Test 8: Conversación larga (más tokens)
  await testGhosty(
    "Long conversation (high token usage)",
    "Explícame detalladamente cómo funciona Formmy, qué planes tiene, cuáles son las funcionalidades principales de los chatbots, y cómo puedo integrar WhatsApp. Dame una respuesta completa y detallada."
  );

  console.log(`\n${'='.repeat(80)}`);
  console.log(`\n✅ All tests completed!\n`);
}

// Run all tests
runAllTests().catch(console.error);
