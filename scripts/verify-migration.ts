/**
 * Verify migration results directly from MongoDB
 */

import { db } from "~/utils/db.server";

async function main() {
  const chatbot = await db.chatbot.findUnique({
    where: { id: "68f456dca443330f35f8c81d" },
    select: { contexts: true }
  });

  console.log("📋 Verificación directa de MongoDB");
  console.log("============================================================\n");
  console.log(`Total contexts: ${(chatbot?.contexts as any[] || []).length}`);
  console.log("\nContexts:\n");

  (chatbot?.contexts as any[] || []).forEach((ctx: any, index: number) => {
    console.log(`${index + 1}. [${ctx.type}] ${ctx.fileName || ctx.title || ctx.url}`);
    console.log(`   ID: ${ctx.id}`);
    console.log(`   ParsingMode: ${ctx.parsingMode || "N/A"}`);
    console.log(`   ParsingPages: ${ctx.parsingPages || "N/A"}`);
    console.log(`   ParsingCredits: ${ctx.parsingCredits || "N/A"}`);
    console.log("");
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
