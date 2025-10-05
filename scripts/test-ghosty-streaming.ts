/**
 * Test script para verificar tracking en modo streaming (SSE)
 */

const API_URL = process.env.API_URL || "http://localhost:3001";
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || "FORMMY_DEV_TOKEN_2025";

async function testGhostyStreaming() {
  console.log("🧪 Testing Ghosty Streaming Mode (SSE)\n");
  console.log(`API: ${API_URL}/api/ghosty/v0`);
  console.log(`Auth: ${DEV_TOKEN}\n`);

  const testMessage = "¿Qué día es hoy? Y guarda este contacto: Test User, test@example.com";

  console.log(`📝 Test message: "${testMessage}"\n`);

  try {
    const response = await fetch(`${API_URL}/api/ghosty/v0`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEV_TOKEN}`,
      },
      body: JSON.stringify({
        message: testMessage,
        stream: true, // Modo streaming
      }),
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

    console.log("📡 Streaming events:\n");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let toolsUsed: string[] = [];
    let chunkCount = 0;
    let finalMetadata: any = null;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("\n✅ Stream completed");
        break;
      }

      const text = decoder.decode(value);
      const lines = text.split('\n\n');

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = line.replace('data: ', '');
        try {
          const event = JSON.parse(data);

          if (event.type === 'tool-start') {
            console.log(`🔧 Tool started: ${event.tool}`);
            toolsUsed.push(event.tool);
          } else if (event.type === 'chunk') {
            chunkCount++;
            process.stdout.write('.');
          } else if (event.type === 'done') {
            console.log(`\n\n📊 Final metadata received:`);
            console.log(JSON.stringify(event.metadata, null, 2));
            finalMetadata = event.metadata;
          } else if (event.type === 'complete') {
            console.log(`\n✅ Completion signal at: ${event.timestamp}`);
          } else if (event.type === 'error') {
            console.error(`\n❌ Error: ${event.content}`);
          }
        } catch (parseError) {
          // Ignorar líneas que no son JSON válido
        }
      }
    }

    // Validaciones
    console.log("\n\n✅ Summary:");
    console.log(`- Chunks received: ${chunkCount}`);
    console.log(`- Tools executed: ${toolsUsed.length}`);
    console.log(`- Tools: [${toolsUsed.join(', ')}]`);

    if (finalMetadata) {
      console.log("\n📈 Usage tracking:");
      console.log(`- toolsExecuted: ${finalMetadata.toolsExecuted}`);
      console.log(`- creditsUsed: ${finalMetadata.creditsUsed}`);
      console.log(`- tokensUsed: ${finalMetadata.tokensUsed}`);
      console.log(`- estimatedCost: $${finalMetadata.estimatedCost?.usdCost}`);

      // Validar que los números coincidan
      if (finalMetadata.toolsExecuted === toolsUsed.length) {
        console.log("✅ Tool count matches");
      } else {
        console.log(`⚠️ Tool count mismatch: expected ${toolsUsed.length}, got ${finalMetadata.toolsExecuted}`);
      }

      if (finalMetadata.creditsUsed > 0) {
        console.log("✅ Credits tracked correctly");
      } else {
        console.log("⚠️ No credits tracked");
      }

      if (finalMetadata.tokensUsed > 0) {
        console.log("✅ Tokens tracked correctly");
      } else {
        console.log("⚠️ No tokens tracked");
      }
    } else {
      console.log("\n❌ No final metadata received");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run test
testGhostyStreaming().catch(console.error);
