/**
 * Test: Verificar que Ghosty tiene acceso a create_formmy_plan_payment
 */

import { getToolsForPlan, type ToolContext } from "../server/tools";

console.log("\n🧪 PRUEBA: Herramientas disponibles para Ghosty\n");
console.log("=".repeat(60));

// Simular contexto de Ghosty
const ghostyContext: ToolContext = {
  userId: "test-user-id",
  userPlan: "PRO",
  chatbotId: null,
  conversationId: "test-conv-id",
  message: "Quiero el plan Pro",
  integrations: {},
  isGhosty: true // 🎯 Este es el flag crítico
};

// Obtener herramientas disponibles
const tools = getToolsForPlan("PRO", {}, ghostyContext);

console.log(`\n✅ Total de herramientas disponibles: ${tools.length}`);
console.log("\n📋 Lista de herramientas:\n");

const toolNames = tools.map((tool: any) => {
  const name = tool?.metadata?.name || tool?.name || "unknown";
  const description = tool?.metadata?.description || tool?.description || "Sin descripción";
  return { name, description: description.substring(0, 100) + "..." };
});

toolNames.forEach((tool, index) => {
  console.log(`${index + 1}. ${tool.name}`);
  console.log(`   ${tool.description}\n`);
});

// Verificar específicamente create_formmy_plan_payment
const hasFormmyPlanTool = toolNames.some(t => t.name === "create_formmy_plan_payment");

console.log("=".repeat(60));
console.log(`\n🎯 create_formmy_plan_payment tool: ${hasFormmyPlanTool ? "✅ DISPONIBLE" : "❌ NO DISPONIBLE"}`);

if (!hasFormmyPlanTool) {
  console.log("\n⚠️  ERROR: La herramienta NO está disponible para Ghosty");
  console.log("   Verifica que isGhosty: true esté configurado correctamente\n");
  process.exit(1);
}

console.log("\n✅ Todas las verificaciones pasaron correctamente!\n");
