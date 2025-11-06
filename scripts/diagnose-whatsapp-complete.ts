/**
 * Script de diagnóstico completo para integración WhatsApp
 * Analiza TODOS los problemas identificados en logs
 */

import { PrismaClient, ConversationStatus } from "@prisma/client";

const db = new PrismaClient();

interface DiagnosticResult {
  issue: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  details: any;
  solution: string;
}

async function diagnoseWhatsAppIntegration() {
  console.log("\n🔍 === DIAGNÓSTICO COMPLETO WHATSAPP ===\n");

  const results: DiagnosticResult[] = [];

  // 1. Verificar integración WhatsApp
  console.log("1️⃣ Verificando integración WhatsApp...");
  const integration = await db.integration.findFirst({
    where: { platform: "WHATSAPP" },
    include: { chatbot: { include: { project: { include: { user: true } } } } }
  });

  if (!integration) {
    results.push({
      issue: "No WhatsApp integration found",
      severity: 'CRITICAL',
      details: null,
      solution: "Necesitas conectar WhatsApp usando Embedded Signup en el dashboard"
    });
  } else {
    console.log("✅ Integración encontrada:", {
      id: integration.id,
      chatbotId: integration.chatbotId,
      phoneNumberId: integration.phoneNumberId,
      isActive: integration.isActive,
      tokenPreview: integration.token ? `***${integration.token.slice(-6)}` : 'MISSING'
    });

    // Verificar estructura del token
    if (integration.token) {
      const tokenLength = integration.token.length;
      const hasInvalidChars = /[^A-Za-z0-9_-]/.test(integration.token);

      if (tokenLength < 50 || tokenLength > 500) {
        results.push({
          issue: "Token length suspicious",
          severity: 'CRITICAL',
          details: {
            length: tokenLength,
            expected: "50-500 characters",
            preview: `***${integration.token.slice(-10)}`
          },
          solution: "El token parece corrupto. Necesitas generar uno nuevo via Embedded Signup."
        });
      }

      if (hasInvalidChars) {
        results.push({
          issue: "Token contains invalid characters",
          severity: 'CRITICAL',
          details: { tokenPreview: `***${integration.token.slice(-10)}` },
          solution: "El token tiene caracteres inválidos. Debe ser regenerado."
        });
      }
    } else {
      results.push({
        issue: "Token is NULL",
        severity: 'CRITICAL',
        details: null,
        solution: "Debes conectar WhatsApp via Embedded Signup para obtener un token válido"
      });
    }

    // 2. Verificar chatbot y user
    console.log("\n2️⃣ Verificando chatbot y owner...");
    if (!integration.chatbot) {
      results.push({
        issue: "Chatbot not found for integration",
        severity: 'CRITICAL',
        details: { chatbotId: integration.chatbotId },
        solution: "El chatbot asociado no existe. Debes re-crear la integración."
      });
    } else {
      console.log("✅ Chatbot encontrado:", {
        id: integration.chatbot.id,
        name: integration.chatbot.name,
        projectId: integration.chatbot.projectId
      });

      if (!integration.chatbot.project) {
        results.push({
          issue: "Project not found for chatbot",
          severity: 'CRITICAL',
          details: { projectId: integration.chatbot.projectId },
          solution: "El proyecto asociado no existe. DB inconsistente."
        });
      } else {
        console.log("✅ Project encontrado:", {
          id: integration.chatbot.project.id,
          name: integration.chatbot.project.name
        });

        if (!integration.chatbot.project.user) {
          results.push({
            issue: "User not found for project",
            severity: 'CRITICAL',
            details: {
              projectId: integration.chatbot.project.id,
              userId: integration.chatbot.project.userId
            },
            solution: "El user owner no existe. Este es el error 'User not found for chatbot' que ves en logs."
          });
        } else {
          console.log("✅ User encontrado:", {
            id: integration.chatbot.project.user.id,
            email: integration.chatbot.project.user.email
          });
        }
      }
    }
  }

  // 3. Verificar conversaciones deleted
  console.log("\n3️⃣ Verificando conversaciones deleted...");
  const deletedConversations = await db.conversation.findMany({
    where: {
      status: ConversationStatus.DELETED,
      sessionId: { startsWith: "whatsapp_" }
    },
    select: {
      id: true,
      sessionId: true,
      updatedAt: true,
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (deletedConversations.length > 0) {
    results.push({
      issue: "Deleted WhatsApp conversations exist",
      severity: 'WARNING',
      details: {
        count: deletedConversations.length,
        conversations: deletedConversations.map(c => ({
          id: c.id,
          sessionId: c.sessionId,
          deletedAt: c.deletedAt
        }))
      },
      solution: "Estas conversaciones causan el error 'Cannot add message to a deleted conversation'. Deberías eliminarlas permanentemente o restaurarlas."
    });
  } else {
    console.log("✅ No hay conversaciones deleted con problemas");
  }

  // 4. Verificar App Secret en environment
  console.log("\n4️⃣ Verificando App Secret...");
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appSecret) {
    results.push({
      issue: "FACEBOOK_APP_SECRET not set",
      severity: 'CRITICAL',
      details: null,
      solution: "Debes agregar FACEBOOK_APP_SECRET a tus variables de entorno. Obtenlo de Meta App Dashboard."
    });
  } else {
    console.log("✅ App Secret encontrado:", {
      length: appSecret.length,
      preview: `***${appSecret.slice(-6)}`
    });

    if (appSecret.length !== 32) {
      results.push({
        issue: "App Secret length incorrect",
        severity: 'ERROR',
        details: {
          length: appSecret.length,
          expected: 32,
          preview: `***${appSecret.slice(-6)}`
        },
        solution: "El App Secret de Meta siempre tiene 32 caracteres. Verifica que lo hayas copiado correctamente."
      });
    }
  }

  // 5. Test de conectividad con Meta API
  console.log("\n5️⃣ Testing conectividad con Meta API...");
  if (integration?.token) {
    try {
      const testUrl = `https://graph.facebook.com/v18.0/me?access_token=${integration.token}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      if (response.ok) {
        console.log("✅ Token es VÁLIDO! Meta respondió:", data);
      } else {
        results.push({
          issue: "Token validation failed with Meta API",
          severity: 'CRITICAL',
          details: {
            status: response.status,
            error: data,
            tokenPreview: `***${integration.token.slice(-10)}`
          },
          solution: "Meta rechazó el token. Debes generar uno nuevo via Embedded Signup."
        });
      }
    } catch (error: any) {
      results.push({
        issue: "Network error testing token",
        severity: 'ERROR',
        details: { error: error.message },
        solution: "No se pudo conectar a Meta API. Verifica tu conexión a internet."
      });
    }
  }

  // 6. Verificar webhook verify token
  console.log("\n6️⃣ Verificando webhook verify token...");
  if (integration?.webhookVerifyToken) {
    console.log("✅ Webhook verify token configurado:", {
      preview: `***${integration.webhookVerifyToken.slice(-6)}`
    });
  } else {
    results.push({
      issue: "Webhook verify token not configured",
      severity: 'WARNING',
      details: null,
      solution: "El webhook verify token debería estar configurado para validar webhooks de Meta."
    });
  }

  // === RESUMEN ===
  console.log("\n\n📊 === RESUMEN DE DIAGNÓSTICO ===\n");

  const critical = results.filter(r => r.severity === 'CRITICAL');
  const errors = results.filter(r => r.severity === 'ERROR');
  const warnings = results.filter(r => r.severity === 'WARNING');

  console.log(`🔴 CRÍTICO: ${critical.length}`);
  console.log(`🟠 ERROR: ${errors.length}`);
  console.log(`🟡 WARNING: ${warnings.length}`);

  if (results.length === 0) {
    console.log("\n✅ ¡TODO ESTÁ PERFECTO! No se encontraron problemas.\n");
  } else {
    console.log("\n\n=== PROBLEMAS ENCONTRADOS ===\n");

    [...critical, ...errors, ...warnings].forEach((result, i) => {
      const emoji = result.severity === 'CRITICAL' ? '🔴' :
                    result.severity === 'ERROR' ? '🟠' : '🟡';

      console.log(`${emoji} ${i + 1}. ${result.issue}`);
      console.log(`   Severidad: ${result.severity}`);
      if (result.details) {
        console.log(`   Detalles:`, JSON.stringify(result.details, null, 2));
      }
      console.log(`   💡 Solución: ${result.solution}`);
      console.log("");
    });
  }

  // === PLAN DE ACCIÓN ===
  console.log("\n\n🎯 === PLAN DE ACCIÓN RECOMENDADO ===\n");

  if (critical.length > 0) {
    console.log("1. 🔴 URGENTE - Resolver problemas críticos primero:\n");
    critical.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.issue}`);
      console.log(`      → ${r.solution}\n`);
    });
  }

  if (integration && integration.token) {
    console.log("\n2. 🔄 Regenerar token WhatsApp:");
    console.log("   - Ve a: https://formmy.app/dashboard/integrations");
    console.log("   - Click en 'Conectar WhatsApp'");
    console.log("   - Completa el flujo de Embedded Signup");
    console.log("   - Esto generará un token válido nuevo\n");
  }

  if (!appSecret || appSecret.length !== 32) {
    console.log("\n3. 🔐 Configurar App Secret correcto:");
    console.log("   - Ve a: https://developers.facebook.com/apps");
    console.log("   - Selecciona tu app");
    console.log("   - Settings → Basic → App Secret → Show");
    console.log("   - Copia el valor de 32 caracteres");
    console.log("   - Actualiza: fly secrets set FACEBOOK_APP_SECRET=<valor>\n");
  }

  if (deletedConversations.length > 0) {
    console.log("\n4. 🗑️ Limpiar conversaciones deleted:");
    console.log(`   - Ejecuta: npx tsx scripts/cleanup-deleted-conversations.ts\n`);
  }

  console.log("\n\n✅ Una vez resueltos estos problemas, el webhook debería funcionar correctamente.\n");
}

// Ejecutar diagnóstico
diagnoseWhatsAppIntegration()
  .then(() => {
    console.log("\n✅ Diagnóstico completado\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error en diagnóstico:", error);
    process.exit(1);
  });
