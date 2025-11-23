/**
 * Server logic para Health Check de Chatbot
 * Contiene toda la lógica de backend separada del route
 */

import { db } from "~/utils/db.server";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: "up" | "down"; responseTime?: number; error?: string };
    agentEngine: { status: "up" | "down"; responseTime?: number; error?: string };
    llamaIndexWorkflow: { status: "up" | "down"; responseTime?: number; error?: string };
    aiProviders: {
      openai: { status: "up" | "down"; error?: string };
      anthropic: { status: "up" | "down"; error?: string };
    };
    tools: { status: "up" | "down"; availableCount: number; error?: string };
  };
  uptime: number;
}

// GET /api/health/chatbot
export async function handleHealthCheckLoader({ request }: Route.LoaderArgs) {
  return await performHealthCheck();
}

// POST /api/health/chatbot (para testing específico)
export async function handleHealthCheckAction({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const component = formData.get("component") as string;

  if (component) {
    return await performSpecificCheck(component);
  }

  return await performHealthCheck();
}

/**
 * Ejecuta todos los health checks
 */
async function performHealthCheck(): Promise<Response> {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
    checks: {
      database: { status: "down" },
      agentEngine: { status: "down" },
      llamaIndexWorkflow: { status: "down" },
      aiProviders: {
        openai: { status: "down" },
        anthropic: { status: "down" }
      },
      tools: { status: "down", availableCount: 0 }
    }
  };

  let unhealthyCount = 0;

  // 1. Check Database
  try {
    const dbStart = Date.now();
    await db.user.findFirst({ take: 1 });
    result.checks.database = {
      status: "up",
      responseTime: Date.now() - dbStart
    };
  } catch (error) {
    result.checks.database = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown database error"
    };
    unhealthyCount++;
  }

  // 2. Check Agent Engine
  try {
    const agentStart = Date.now();
    const { streamAgentV0 } = await import("../../server/agents/agent-v0.server");

    // Test simple agent instantiation
    const mockUser = { id: "health-check", plan: "PRO" };
    const mockChatbotId = "health-check";
    const testGenerator = streamAgentV0(mockUser, "health check", mockChatbotId, {});

    // Solo verificar que el generator se puede crear
    const iterator = testGenerator[Symbol.asyncIterator]();
    await iterator.return?.(); // Cerrar inmediatamente

    result.checks.agentEngine = {
      status: "up",
      responseTime: Date.now() - agentStart
    };
  } catch (error) {
    result.checks.agentEngine = {
      status: "down",
      error: error instanceof Error ? error.message : "Agent engine error"
    };
    unhealthyCount++;
  }

  // 3. Check LlamaIndex Workflow
  try {
    const llamaStart = Date.now();
    const { agent } = await import("@llamaindex/workflow");
    const { OpenAI } = await import("@llamaindex/openai");

    // Verificar que las importaciones funcionan
    if (typeof agent === "function" && typeof OpenAI === "function") {
      result.checks.llamaIndexWorkflow = {
        status: "up",
        responseTime: Date.now() - llamaStart
      };
    } else {
      throw new Error("LlamaIndex modules not properly loaded");
    }
  } catch (error) {
    result.checks.llamaIndexWorkflow = {
      status: "down",
      error: error instanceof Error ? error.message : "LlamaIndex workflow error"
    };
    unhealthyCount++;
  }

  // 4. Check AI Providers
  // OpenAI
  if (process.env.OPENAI_API_KEY) {
    result.checks.aiProviders.openai = { status: "up" };
  } else {
    result.checks.aiProviders.openai = {
      status: "down",
      error: "OPENAI_API_KEY not configured"
    };
    unhealthyCount++;
  }

  // Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    result.checks.aiProviders.anthropic = { status: "up" };
  } else {
    result.checks.aiProviders.anthropic = {
      status: "down",
      error: "ANTHROPIC_API_KEY not configured"
    };
    unhealthyCount++;
  }

  // 5. Check Tools Registry (Vercel AI SDK)
  try {
    // Tools now managed by Vercel AI SDK - check if factory functions exist
    const { createPublicTools } = await import("../../server/config/vercel.model.providers");
    result.checks.tools = {
      status: "up",
      message: "Vercel AI SDK tools available"
    };
  } catch (error) {
    result.checks.tools = {
      status: "down",
      message: "Vercel AI SDK tools error",
      error: error instanceof Error ? error.message : "Tools registry error"
    };
    unhealthyCount++;
  }

  // Determinar estado general
  if (unhealthyCount === 0) {
    result.status = "healthy";
  } else if (unhealthyCount <= 2) {
    result.status = "degraded";
  } else {
    result.status = "unhealthy";
  }

  // Status HTTP según estado
  const statusCode = result.status === "healthy" ? 200 :
                    result.status === "degraded" ? 207 : 503;

  return new Response(JSON.stringify(result, null, 2), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Health-Status": result.status
    }
  });
}

/**
 * Ejecuta health check específico para un componente
 */
async function performSpecificCheck(component: string): Promise<Response> {
  const timestamp = new Date().toISOString();

  switch (component) {
    case "agent":
      try {
        const { streamAgentV0 } = await import("../../server/agents/agent-v0.server");
        return new Response(JSON.stringify({
          component: "agent",
          status: "healthy",
          timestamp,
          details: "Agent-v0 loaded successfully"
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({
          component: "agent",
          status: "unhealthy",
          timestamp,
          error: error instanceof Error ? error.message : "Unknown error"
        }), { status: 503, headers: { "Content-Type": "application/json" } });
      }

    case "database":
      try {
        await db.user.findFirst({ take: 1 });
        return new Response(JSON.stringify({
          component: "database",
          status: "healthy",
          timestamp,
          details: "Database connection successful"
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({
          component: "database",
          status: "unhealthy",
          timestamp,
          error: error instanceof Error ? error.message : "Database error"
        }), { status: 503, headers: { "Content-Type": "application/json" } });
      }

    case "tools":
      try {
        // Check Vercel AI SDK tools availability
        const { createPublicTools } = await import("../../server/config/vercel.model.providers");

        return new Response(JSON.stringify({
          component: "tools",
          status: "healthy",
          timestamp,
          details: "Vercel AI SDK tools available",
          system: "Vercel AI SDK (migrated from LlamaIndex)"
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (error) {
        return new Response(JSON.stringify({
          component: "tools",
          status: "unhealthy",
          timestamp,
          error: error instanceof Error ? error.message : "Tools error"
        }), { status: 503, headers: { "Content-Type": "application/json" } });
      }

    default:
      return new Response(JSON.stringify({
        error: "Unknown component",
        availableComponents: ["agent", "database", "tools"],
        timestamp
      }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}