import { data as json } from "react-router";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/admin";
import { db } from "~/utils/db.server";
import { getAdminUserOrRedirect } from "server/getUserUtils.server";
import {
  ErrorDisplay,
  RevenueOverview,
  PlansDistribution,
  AIProviderTable,
  ToolCreditsTable,
  RAGMetrics,
  SystemHealth,
  TopChatbots,
  ActiveIntegrations,
  ContactsOverview,
  ParserMetrics,
  GhostyContextManager,
} from "~/components/admin";

// Helper function to safely parse AI model provider
function parseAiModelProvider(aiModel: string | null | undefined): string {
  if (!aiModel) return 'unknown';

  if (aiModel.startsWith('gpt-')) return 'openai';
  if (aiModel.startsWith('claude-')) return 'anthropic';
  if (aiModel.startsWith('gemini-')) return 'openrouter';

  // Handle provider/model format (e.g., "openai/gpt-4", "anthropic/claude-3-haiku")
  if (aiModel.includes('/')) {
    const parts = aiModel.split('/');
    return parts.length > 0 ? parts[0] : 'unknown';
  }

  return 'unknown';
}

// Helper function to map model aliases to display names
function getModelDisplayName(model: string): string {
  const modelNames: Record<string, string> = {
    'gpt-5-nano': 'GPT-4o-mini',
    'gpt-4o-mini': 'GPT-4o-mini',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-5-mini': 'GPT-4.5 Mini',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  };

  return modelNames[model] || model;
}

// Helper function to calculate costs with proper input/output token pricing
function calculateModelCost(model: string, tokens: number): number {
  // Asumimos 60% input tokens, 40% output tokens (más realista que 50/50)
  const inputRatio = 0.6;
  const outputRatio = 0.4;

  // Precios por 1M tokens en USD (input/output separados)
  const modelPricing: Record<string, { input: number; output: number }> = {
    'gpt-5-nano': { input: 0.15, output: 0.60 }, // Se mapea a gpt-4o-mini
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-5-mini': { input: 0.25, output: 2.00 },
    'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  };

  const pricing = modelPricing[model] || { input: 0.15, output: 0.60 }; // Default a gpt-4o-mini

  const inputTokens = tokens * inputRatio;
  const outputTokens = tokens * outputRatio;

  const inputCostUSD = (inputTokens / 1000000) * pricing.input;
  const outputCostUSD = (outputTokens / 1000000) * pricing.output;

  // Convertir a MXN (1 USD = 20 MXN)
  const totalCostMXN = (inputCostUSD + outputCostUSD) * 20;

  return totalCostMXN;
}

// Helper function to get price per 1M tokens in MXN (for display)
function getPricePerMillionMXN(model: string): string {
  const modelPricing: Record<string, { input: number; output: number }> = {
    'gpt-5-nano': { input: 0.15, output: 0.60 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-5-mini': { input: 0.25, output: 2.00 },
    'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  };

  const pricing = modelPricing[model] || { input: 0.15, output: 0.60 };

  // Promedio ponderado (60% input, 40% output) en MXN
  const avgUSD = (pricing.input * 0.6) + (pricing.output * 0.4);
  const avgMXN = avgUSD * 20;

  return `$${avgMXN.toFixed(2)}`;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  await getAdminUserOrRedirect(request);
  
  try {
    // Get current date ranges for calculations
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User metrics
    const [totalUsers, thisWeekUsers, thisMonthUsers, activeUsers, paidUsers] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.user.count({ where: { plan: { in: ["TRIAL", "STARTER", "PRO", "ENTERPRISE"] } } }),
      db.user.count({ where: { plan: { in: ["STARTER", "PRO", "ENTERPRISE"] } } }), // Solo usuarios de pago
    ]);

    // Chatbot & conversation metrics
    const [totalChatbots, activeChatbots, totalConversations, thisMonthConversations] = await Promise.all([
      db.chatbot.count(),
      db.chatbot.count({ where: { status: "ACTIVE" } }),
      db.conversation.count(),
      db.conversation.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // Revenue metrics (based on plan distribution)
    const planDistribution = await db.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });

    // AI usage by model (excluir 'manual' que son respuestas humanas, no AI)
    const aiUsageByModel = await db.message.groupBy({
      by: ['aiModel'],
      _count: { id: true },
      _sum: {
        tokens: true,
        totalCost: true,
      },
      where: {
        role: 'ASSISTANT',
        aiModel: {
          not: null,
          notIn: ['manual'] // Filtrar respuestas manuales
        },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Top chatbots by usage
    const topChatbots = await db.chatbot.findMany({
      select: {
        name: true,
        conversationCount: true,
        monthlyUsage: true,
        user: { select: { email: true } },
      },
      orderBy: { conversationCount: 'desc' },
      take: 5,
    });

    // Integration usage
    const integrations = await db.integration.groupBy({
      by: ['platform'],
      _count: { platform: true },
      where: { isActive: true },
    });

    // Lead metrics (leads captured via save_contact_info)
    const [totalContacts, thisWeekContacts, thisMonthContacts] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { capturedAt: { gte: sevenDaysAgo } } }),
      db.lead.count({ where: { capturedAt: { gte: startOfMonth } } }),
    ]);

    // GroupBy puede fallar si hay datos legacy con source null
    let contactsBySource: Array<{ source: string; _count: number }> = [];
    try {
      const result = await db.lead.groupBy({
        by: ['source'],
        _count: true,
      });
      contactsBySource = result.filter(c => c.source !== null) as any;
    } catch (error) {
      console.error('Error grouping leads by source (possibly null values in legacy data):', error);
    }

    // Cost metrics (aggregate all users for the last 30 days)
    let costMetrics = {
      totalCost: 0,
      costByProvider: [],
      costByModel: []
    };

    try {
      // Get all messages with costs from the last 30 days
      const costMessages = await db.message.findMany({
        where: {
          role: 'ASSISTANT',
          totalCost: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          totalCost: true,
          tokens: true,
          provider: true,
          aiModel: true,
        }
      });

      const totalCost = costMessages.reduce((sum, msg) => sum + (msg.totalCost || 0), 0);
      
      // Group by provider
      const providerMap = new Map();
      costMessages.forEach(msg => {
        const provider = msg.provider || 'unknown';
        const existing = providerMap.get(provider) || { cost: 0, messages: 0, tokens: 0 };
        providerMap.set(provider, {
          cost: existing.cost + (msg.totalCost || 0),
          messages: existing.messages + 1,
          tokens: existing.tokens + (msg.tokens || 0)
        });
      });

      // Group by model
      const modelMap = new Map();
      costMessages.forEach(msg => {
        const model = msg.aiModel || 'unknown';
        const existing = modelMap.get(model) || { cost: 0, messages: 0, tokens: 0 };
        modelMap.set(model, {
          cost: existing.cost + (msg.totalCost || 0),
          messages: existing.messages + 1,
          tokens: existing.tokens + (msg.tokens || 0)
        });
      });

      costMetrics = {
        totalCost,
        costByProvider: Array.from(providerMap.entries()).map(([provider, data]) => ({
          provider,
          model: 'aggregate',
          ...data
        })).sort((a, b) => b.cost - a.cost),
        costByModel: Array.from(modelMap.entries()).map(([model, data]) => ({
          provider: parseAiModelProvider(model),
          model,
          ...data
        })).sort((a, b) => b.cost - a.cost)
      };
    } catch (error) {
      console.error('Error loading cost metrics:', error);
    }

    // Tool Credits Analytics (NUEVO)
    let toolCreditsData = {
      toolUsage: [],
      totalCredits: 0,
      totalCostUSD: 0,
      totalCostMXN: 0,
      usersNearLimit: [],
    };

    try {
      const { getToolCreditCost } = await import('server/tools/toolCosts');
      const { calculateToolCostFull } = await import('server/tools/toolPricing.server');
      const { PLAN_LIMITS } = await import('server/chatbot/planLimits.server');

      // Agrupar tool usages por toolName (últimos 30 días)
      const toolUsageRaw = await db.toolUsage.groupBy({
        by: ['toolName'],
        _count: { id: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      });

      // Calcular créditos y costos monetarios por tool
      const toolUsage = await Promise.all(
        toolUsageRaw.map(async (usage) => {
          const credits = getToolCreditCost(usage.toolName) * usage._count.id;
          const costData = calculateToolCostFull(usage.toolName, usage._count.id, credits);

          // Obtener chatbots que usan esta tool y su plan
          const chatbotsUsingTool = await db.toolUsage.findMany({
            where: {
              toolName: usage.toolName,
              createdAt: { gte: thirtyDaysAgo },
            },
            select: {
              chatbot: {
                select: {
                  user: { select: { plan: true } },
                },
              },
            },
            take: 100,
          });

          // Filtrar solo los que tienen chatbot y contar por plan
          const planCounts = chatbotsUsingTool
            .filter(t => t.chatbot?.user?.plan) // Solo los que tienen chatbot y plan
            .reduce((acc: any, t) => {
              const plan = t.chatbot?.user?.plan || 'FREE';
              acc[plan] = (acc[plan] || 0) + 1;
              return acc;
            }, {});

          const topPlan = Object.entries(planCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'TRIAL';

          return {
            toolName: usage.toolName,
            count: usage._count.id,
            credits,
            costUSD: costData.costUSD,
            costMXN: costData.costMXN,
            pricePerUseUSD: costData.pricePerUseUSD,
            topPlan,
          };
        })
      );

      const totalCredits = toolUsage.reduce((sum, u) => sum + u.credits, 0);
      const totalCostUSD = toolUsage.reduce((sum, u) => sum + u.costUSD, 0);
      const totalCostMXN = toolUsage.reduce((sum, u) => sum + u.costMXN, 0);

      // Detectar usuarios cerca del límite (>80% usado)
      const usersNearLimit: any[] = [];
      const userPlans = await db.user.findMany({
        where: { plan: { in: ['STARTER', 'PRO', 'ENTERPRISE'] } },
        select: { id: true, plan: true },
      });

      for (const user of userPlans) {
        const userChatbots = await db.chatbot.findMany({
          where: { userId: user.id },
          select: { id: true },
        });

        const chatbotIds = userChatbots.map((c) => c.id);

        const userToolUsage = await db.toolUsage.count({
          where: {
            chatbotId: { in: chatbotIds },
            createdAt: { gte: startOfMonth },
          },
        });

        // Estimar créditos usados (promedio 2 credits/tool)
        const estimatedCredits = userToolUsage * 2;
        const limit = PLAN_LIMITS[user.plan].toolCreditsPerMonth;
        const percentageUsed = limit > 0 ? (estimatedCredits / limit) * 100 : 0;

        if (percentageUsed > 80) {
          const existing = usersNearLimit.find((u) => u.plan === user.plan);
          if (existing) {
            existing.count++;
          } else {
            usersNearLimit.push({ plan: user.plan, count: 1 });
          }
        }
      }

      toolCreditsData = { toolUsage, totalCredits, totalCostUSD, totalCostMXN, usersNearLimit };
    } catch (error) {
      console.error('Error loading tool credits data:', error);
    }

    // RAG Metrics (NUEVO)
    let ragMetrics = {
      ragSearches: 0,
      webSearches: 0,
      conversationsWithRAG: 0,
    };

    try {
      const [ragCount, webCount] = await Promise.all([
        db.toolUsage.count({
          where: {
            toolName: 'search_context',
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        db.toolUsage.count({
          where: {
            toolName: 'web_search_google',
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      // Contar conversaciones con al menos 1 búsqueda
      const conversationsWithSearch = await db.conversation.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          chatbot: {
            toolUsages: {
              some: {
                toolName: { in: ['search_context', 'web_search_google'] },
              },
            },
          },
        },
        select: { id: true },
      });

      ragMetrics = {
        ragSearches: ragCount,
        webSearches: webCount,
        conversationsWithRAG: conversationsWithSearch.length,
      };
    } catch (error) {
      console.error('Error loading RAG metrics:', error);
    }

    // System Health (NUEVO)
    let systemHealth = {
      avgLatency: 0,
      maxLatency: 0,
      toolErrors: [],
      alerts: [],
    };

    try {
      // Latencia promedio y máxima (de Message.responseTime)
      const latencyStats = await db.message.aggregate({
        _avg: { responseTime: true },
        _max: { responseTime: true },
        where: {
          role: 'ASSISTANT',
          responseTime: { not: null },
          createdAt: { gte: sevenDaysAgo },
        },
      });

      // Error rate por tool
      const toolUsageStats = await db.toolUsage.groupBy({
        by: ['toolName', 'success'],
        _count: { id: true },
        where: { createdAt: { gte: sevenDaysAgo } },
      });

      // Calcular error rates
      const toolErrorsMap = new Map();
      toolUsageStats.forEach((stat) => {
        const existing = toolErrorsMap.get(stat.toolName) || { total: 0, errors: 0 };
        if (stat.success === false) {
          existing.errors += stat._count.id;
        }
        existing.total += stat._count.id;
        toolErrorsMap.set(stat.toolName, existing);
      });

      const toolErrors = Array.from(toolErrorsMap.entries())
        .map(([toolName, data]: any) => ({
          toolName,
          errorRate: data.total > 0 ? (data.errors / data.total) * 100 : 0,
          errorCount: data.errors,
          totalCount: data.total,
        }))
        .filter((e) => e.errorCount > 0);

      // Generar alertas
      const alerts: any[] = [];

      // Alert: Profit margin bajo
      const USD_TO_MXN = 20;
      const totalCostMXN = costMetrics.totalCost * USD_TO_MXN;
      const estimatedRevenue = planDistribution.reduce((acc, plan) => {
        const rates: any = { STARTER: 149, PRO: 499, ENTERPRISE: 2499 };
        return acc + (rates[plan.plan] || 0) * plan._count.plan;
      }, 0);
      const profitMargin = estimatedRevenue > 0 ? ((estimatedRevenue - totalCostMXN) / estimatedRevenue) * 100 : 0;

      if (profitMargin < 40) {
        alerts.push({
          type: 'danger',
          message: `Profit margin bajo: ${profitMargin.toFixed(1)}% (target 44-62%)`,
        });
      } else if (profitMargin < 50) {
        alerts.push({
          type: 'warning',
          message: `Profit margin aceptable: ${profitMargin.toFixed(1)}% (target 50%+)`,
        });
      }

      // Alert: High error rate
      if (toolErrors.some((e) => e.errorRate > 5)) {
        alerts.push({
          type: 'danger',
          message: 'Herramientas con error rate >5% detectadas',
        });
      }

      systemHealth = {
        avgLatency: latencyStats._avg.responseTime || 0,
        maxLatency: latencyStats._max.responseTime || 0,
        toolErrors,
        alerts,
      };
    } catch (error) {
      console.error('Error loading system health:', error);
    }

    // Parser/LlamaParse Metrics (NUEVO)
    let parserMetrics = {
      totalJobs: 0,
      totalPages: 0,
      totalCredits: 0,
      byMode: [],
    };

    try {
      const parserAggregates = await db.parsingJob.aggregate({
        _count: { id: true },
        _sum: { creditsUsed: true, pages: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      const parserByMode = await db.parsingJob.groupBy({
        by: ['mode'],
        _count: { id: true },
        _sum: { creditsUsed: true, pages: true },
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      parserMetrics = {
        totalJobs: parserAggregates._count.id || 0,
        totalPages: parserAggregates._sum.pages || 0,
        totalCredits: parserAggregates._sum.creditsUsed || 0,
        byMode: parserByMode,
      };
    } catch (error) {
      console.error('Error loading parser metrics:', error);
    }

    // Ghosty Context Management (NUEVO)
    let ghostyContexts: any[] = [];
    const GHOSTY_CHATBOT_ID = '691e648afcfecb9dedc6b5de';

    try {
      ghostyContexts = await db.context.findMany({
        where: { chatbotId: GHOSTY_CHATBOT_ID },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          embeddingIds: true,
        },
      });
    } catch (error) {
      console.error('Error loading Ghosty contexts:', error);
    }

    return {
      users: {
        total: totalUsers,
        thisWeek: thisWeekUsers,
        thisMonth: thisMonthUsers,
        active: activeUsers,
        paid: paidUsers, // Usuarios de pago (STARTER, PRO, ENTERPRISE)
      },
      chatbots: {
        total: totalChatbots,
        active: activeChatbots,
        conversations: totalConversations,
        thisMonthConversations,
      },
      plans: planDistribution.map(p => ({ plan: p.plan, count: p._count.plan })),
      aiUsage: aiUsageByModel.map(usage => {
        const model = usage.aiModel || 'unknown';
        const requests = usage._count.id || 0;
        const actualTokens = usage._sum.tokens || 0;
        const actualCostUSD = usage._sum.totalCost || 0;

        // Estimaciones si no hay datos reales
        let estimatedTokens = actualTokens;
        let costMXN = actualCostUSD * 20; // Convertir USD a MXN

        if (estimatedTokens === 0 && requests > 0) {
          // Estimación conservadora: ~500 tokens por request
          estimatedTokens = requests * 500;
        }

        // Calcular costo en MXN con pricing input/output correcto
        if (actualCostUSD === 0 && estimatedTokens > 0) {
          costMXN = calculateModelCost(model, estimatedTokens);
        }

        return {
          provider: parseAiModelProvider(model),
          model,
          modelDisplay: getModelDisplayName(model),
          requests,
          tokens: estimatedTokens,
          cost: costMXN,
          pricePerMillion: getPricePerMillionMXN(model),
        };
      }),
      costs: {
        // Total en MXN (convertir desde USD o calcular estimado)
        totalCost: costMetrics.totalCost > 0
          ? costMetrics.totalCost * 20 // Convertir USD a MXN
          : aiUsageByModel.reduce((sum, usage) => {
              const model = usage.aiModel || 'unknown';
              const requests = usage._count.id || 0;
              if (requests === 0) return sum;

              const estimatedTokens = requests * 500;
              const costMXN = calculateModelCost(model, estimatedTokens);
              return sum + costMXN;
            }, 0),
        byProvider: costMetrics.costByProvider,
        byModel: costMetrics.costByModel,
      },
      topChatbots,
      integrations: integrations.map(i => ({ platform: i.platform, count: i._count.platform })),
      contacts: {
        total: totalContacts,
        thisWeek: thisWeekContacts,
        thisMonth: thisMonthContacts,
        bySource: contactsBySource.map(c => ({ source: c.source, count: c._count })),
      },
      toolCredits: toolCreditsData,
      ragMetrics,
      systemHealth,
      parserMetrics,
      ghosty: {
        contexts: ghostyContexts,
      },
    };
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);

    // Return fallback data structure to prevent crashes
    return {
      users: { total: 0, thisWeek: 0, thisMonth: 0, active: 0, paid: 0 },
      chatbots: { total: 0, active: 0, conversations: 0, thisMonthConversations: 0 },
      plans: [],
      aiUsage: [],
      costs: { totalCost: 0, byProvider: [], byModel: [] },
      topChatbots: [],
      integrations: [],
      contacts: { total: 0, thisWeek: 0, thisMonth: 0, bySource: [] },
      toolCredits: { toolUsage: [], totalCredits: 0, totalCostUSD: 0, totalCostMXN: 0, usersNearLimit: [] },
      ragMetrics: { ragSearches: 0, webSearches: 0, conversationsWithRAG: 0 },
      systemHealth: { avgLatency: 0, maxLatency: 0, toolErrors: [], alerts: [] },
      parserMetrics: { totalJobs: 0, totalPages: 0, totalCredits: 0, byMode: [] },
      ghosty: { contexts: [] },
      error: 'Error cargando datos del dashboard. Intenta refrescar la página.',
    };
  }
};

// Plan pricing configuration - consider moving to server environment or config file
const PLAN_RATES: Record<string, number> = {
  STARTER: 149,
  PRO: 499,
  ENTERPRISE: 2499,
} as const;

export default function AdminDashboard() {
  const data = useLoaderData<typeof loader>();

  // Show error message if data loading failed
  if ('error' in data) {
    return <ErrorDisplay error={data.error} />;
  }

  // Calculate estimated monthly revenue (in MXN)
  const estimatedRevenue = data.plans.reduce((acc, plan) => {
    return acc + (PLAN_RATES[plan.plan] || 0) * plan.count;
  }, 0);

  return (
    <article className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Métricas clave para founders</p>
      </header>

      {/* Revenue & Users Overview */}
      <RevenueOverview
        estimatedRevenue={estimatedRevenue}
        totalCost={data.costs.totalCost}
        users={data.users}
        chatbots={data.chatbots}
      />

      {/* Plans Distribution */}
      <PlansDistribution plans={data.plans} />

      {/* System Health Dashboard */}
      <SystemHealth
        avgLatency={data.systemHealth.avgLatency}
        maxLatency={data.systemHealth.maxLatency}
        toolErrors={data.systemHealth.toolErrors}
        alerts={data.systemHealth.alerts}
      />

      {/* RAG Performance Metrics */}
      <RAGMetrics
        ragSearches={data.ragMetrics.ragSearches}
        webSearches={data.ragMetrics.webSearches}
        totalConversations={data.chatbots.thisMonthConversations}
        conversationsWithRAG={data.ragMetrics.conversationsWithRAG}
      />

      {/* AI Provider Usage (consolidado) */}
      <AIProviderTable usage={data.aiUsage} totalCost={data.costs.totalCost} />

      {/* Tool Credits Analytics */}
      <ToolCreditsTable
        toolUsage={data.toolCredits.toolUsage}
        totalCredits={data.toolCredits.totalCredits}
        totalCostUSD={data.toolCredits.totalCostUSD}
        totalCostMXN={data.toolCredits.totalCostMXN}
        usersNearLimit={data.toolCredits.usersNearLimit}
      />

      {/* Contacts Overview */}
      <ContactsOverview contacts={data.contacts} />

      {/* Parser/LlamaParse Metrics */}
      <ParserMetrics
        totalJobs={data.parserMetrics.totalJobs}
        totalPages={data.parserMetrics.totalPages}
        totalCredits={data.parserMetrics.totalCredits}
        byMode={data.parserMetrics.byMode}
      />

      {/* Ghosty Context Management */}
      <GhostyContextManager contexts={data.ghosty.contexts} />

      {/* Top Chatbots & Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TopChatbots topChatbots={data.topChatbots} />
        <ActiveIntegrations integrations={data.integrations} />
      </div>
    </article>
  );
}

