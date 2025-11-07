/**
 * Script de monitoreo: Ver webhooks de WhatsApp en tiempo real
 *
 * Uso:
 *   npx tsx scripts/monitor-whatsapp-webhooks.ts
 *
 * Monitorea los logs de Fly.io y filtra webhooks de WhatsApp
 */

import { spawn } from "child_process";

console.log("🔍 Monitoreando webhooks de WhatsApp en tiempo real...");
console.log("Presiona Ctrl+C para detener\n");
console.log("=".repeat(80) + "\n");

const flyLogs = spawn("fly", ["logs"], {
  stdio: ["inherit", "pipe", "pipe"],
});

let buffer = "";

flyLogs.stdout?.on("data", (data: Buffer) => {
  buffer += data.toString();
  const lines = buffer.split("\n");

  // Guardar última línea incompleta
  buffer = lines.pop() || "";

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Filtrar líneas relevantes de WhatsApp
    if (
      lowerLine.includes("whatsapp") ||
      lowerLine.includes("webhook") ||
      lowerLine.includes("sync") ||
      lowerLine.includes("smb_app") ||
      lowerLine.includes("history") ||
      lowerLine.includes("state_sync")
    ) {
      // Colorear según el tipo de log
      let emoji = "📝";
      if (lowerLine.includes("error") || lowerLine.includes("failed")) {
        emoji = "❌";
      } else if (lowerLine.includes("success") || lowerLine.includes("✅")) {
        emoji = "✅";
      } else if (lowerLine.includes("sync")) {
        emoji = "🔄";
      } else if (lowerLine.includes("webhook")) {
        emoji = "📡";
      }

      console.log(`${emoji} ${line}`);
    }
  }
});

flyLogs.stderr?.on("data", (data: Buffer) => {
  console.error("⚠️ ", data.toString());
});

flyLogs.on("close", (code) => {
  console.log(`\n\nMonitoreo finalizado (código: ${code})`);
  process.exit(code || 0);
});

// Manejar Ctrl+C
process.on("SIGINT", () => {
  console.log("\n\nDeteniendo monitoreo...");
  flyLogs.kill();
  process.exit(0);
});
