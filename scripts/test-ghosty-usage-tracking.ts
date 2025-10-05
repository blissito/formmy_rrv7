/**
 * Test script para verificar que Ghosty devuelve tokens y créditos consumidos
 */

const API_URL = process.env.API_URL || "http://localhost:3001";
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || "FORMMY_DEV_TOKEN_2025";

interface UsageMetadata {
  toolsExecuted: number;
  toolsUsed: string[];
  tokensUsed: number;
  creditsUsed: number;
  estimatedCost: {
    tokens: number;
    credits: number;
    usdCost: string;
  };
}

async function testGhostyUsageTracking() {
  console.log("🧪 Testing Ghosty Usage Tracking\n");
  console.log(`API: ${API_URL}/api/ghosty/v0`);
  console.log(`Auth: ${DEV_TOKEN}\n`);

  const testCases = [
    {
      name: "Simple message (no tools)",
      message: "Hola Ghosty, ¿cómo estás?",
      expectedTools: 0,
      expectedCredits: 0,
    },
    {
      name: "With datetime tool (1 tool, 1 credit)",
      message: "¿Qué día es hoy?",
      expectedTools: 1,
      expectedCredits: 1,
    },
    {
      name: "Save contact (1 tool, 1 credit)",
      message: "Guarda este contacto: Juan Pérez, email juan@example.com",
      expectedTools: 1,
      expectedCredits: 1,
    },
    {
      name: "Multiple tools (2+ tools, variable credits)",
      message: "¿Qué día es hoy? Y guarda este contacto: María López, maria@example.com",
      expectedTools: 2,
      expectedCredits: 2,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);

    try {
      const response = await fetch(`${API_URL}/api/ghosty/v0`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEV_TOKEN}`,
        },
        body: JSON.stringify({
          message: testCase.message,
          stream: false, // Non-streaming para capturar metadata fácilmente
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error: ${response.status} - ${error}`);
        continue;
      }

      const data = await response.json();

      console.log("\n📊 Response metadata:");
      console.log(JSON.stringify(data.metadata, null, 2));

      // Validaciones
      const metadata = data.metadata as UsageMetadata;

      console.log("\n✅ Validations:");

      // Validar estructura
      if (!metadata) {
        console.error("❌ No metadata found in response");
        continue;
      }

      if (metadata.toolsExecuted !== undefined) {
        console.log(`✅ toolsExecuted: ${metadata.toolsExecuted}`);
      } else {
        console.error("❌ toolsExecuted missing");
      }

      if (Array.isArray(metadata.toolsUsed)) {
        console.log(`✅ toolsUsed: [${metadata.toolsUsed.join(", ")}]`);
      } else {
        console.error("❌ toolsUsed missing or not an array");
      }

      if (typeof metadata.tokensUsed === "number") {
        console.log(`✅ tokensUsed: ${metadata.tokensUsed}`);
      } else {
        console.error("❌ tokensUsed missing");
      }

      if (typeof metadata.creditsUsed === "number") {
        console.log(`✅ creditsUsed: ${metadata.creditsUsed}`);
      } else {
        console.error("❌ creditsUsed missing");
      }

      if (metadata.estimatedCost) {
        console.log(`✅ estimatedCost:`);
        console.log(`   - tokens: ${metadata.estimatedCost.tokens}`);
        console.log(`   - credits: ${metadata.estimatedCost.credits}`);
        console.log(`   - usdCost: $${metadata.estimatedCost.usdCost}`);
      } else {
        console.error("❌ estimatedCost missing");
      }

      // Validar expectativas
      console.log("\n🎯 Expected vs Actual:");
      console.log(`Tools: expected ${testCase.expectedTools}, got ${metadata.toolsExecuted}`);
      console.log(`Credits: expected ${testCase.expectedCredits}, got ${metadata.creditsUsed}`);

      if (metadata.toolsExecuted >= testCase.expectedTools) {
        console.log("✅ Tool count matches or exceeds expectation");
      } else {
        console.log("⚠️ Tool count below expectation");
      }

      if (metadata.creditsUsed >= testCase.expectedCredits) {
        console.log("✅ Credit usage matches or exceeds expectation");
      } else {
        console.log("⚠️ Credit usage below expectation");
      }

      // Validar tokens
      if (metadata.tokensUsed > 0) {
        console.log(`✅ Tokens tracked: ${metadata.tokensUsed}`);
      } else {
        console.log("⚠️ No tokens tracked (might be 0 for very short responses)");
      }

    } catch (error) {
      console.error(`❌ Test failed:`, error);
    }

    console.log("\n" + "=".repeat(80));
  }

  console.log("\n\n✅ Test suite completed");
}

// Run tests
testGhostyUsageTracking().catch(console.error);
