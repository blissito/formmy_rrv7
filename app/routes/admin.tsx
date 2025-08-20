import { data as json } from "react-router";
import { useLoaderData } from "react-router";
import { type LoaderFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getAdminUserOrRedirect } from "server/getUserUtils.server";
import {
  ErrorDisplay,
  RevenueOverview,
  PlansDistribution,
  TokenUsageTable,
  TopChatbots,
  ActiveIntegrations,
} from "~/components/admin";

// Helper function to safely parse AI model provider
function parseAiModelProvider(aiModel: string | null | undefined): string {
  if (!aiModel) return 'unknown';
  
  // Handle direct provider names (e.g., "openai", "anthropic")
  if (!aiModel.includes('/')) {
    return aiModel;
  }
  
  // Handle provider/model format (e.g., "openai/gpt-4", "anthropic/claude-3-haiku")
  const parts = aiModel.split('/');
  return parts.length > 0 ? parts[0] : 'unknown';
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminUserOrRedirect(request);
  
  try {
    // Get current date ranges for calculations
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User metrics
    const [totalUsers, thisWeekUsers, thisMonthUsers, activeUsers] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.user.count({ where: { plan: { in: ["TRIAL", "STARTER", "PRO", "ENTERPRISE"] } } }),
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

    // Token usage by provider (from messages with AI model info)
    const tokenUsageByProvider = await db.message.groupBy({
      by: ['aiModel'],
      _count: { aiModel: true },
      _sum: { tokens: true },
      where: {
        role: 'ASSISTANT',
        tokens: { not: null },
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

    return {
      users: {
        total: totalUsers,
        thisWeek: thisWeekUsers,
        thisMonth: thisMonthUsers,
        active: activeUsers,
      },
      chatbots: {
        total: totalChatbots,
        active: activeChatbots,
        conversations: totalConversations,
        thisMonthConversations,
      },
      plans: planDistribution.map(p => ({ plan: p.plan, count: p._count.plan })),
      tokens: tokenUsageByProvider.map(t => ({
        provider: parseAiModelProvider(t.aiModel),
        model: t.aiModel || 'unknown',
        count: t._count.aiModel || 0,
        tokens: t._sum.tokens || 0,
      })),
      topChatbots,
      integrations: integrations.map(i => ({ platform: i.platform, count: i._count.platform })),
    };
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);
    
    // Return fallback data structure to prevent crashes
    return {
      users: { total: 0, thisWeek: 0, thisMonth: 0, active: 0 },
      chatbots: { total: 0, active: 0, conversations: 0, thisMonthConversations: 0 },
      plans: [],
      tokens: [],
      topChatbots: [],
      integrations: [],
      error: 'Error cargando datos del dashboard. Intenta refrescar la página.',
    };
  }
};

// Plan pricing configuration - consider moving to server environment or config file
const PLAN_RATES: Record<string, number> = {
  STARTER: 149,
  PRO: 499,
  ENTERPRISE: 1499,
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
        users={data.users}
        chatbots={data.chatbots}
      />

      {/* Plans Distribution */}
      <PlansDistribution plans={data.plans} />

      {/* Token Usage by Provider */}
      <TokenUsageTable tokens={data.tokens} />

      {/* Top Chatbots & Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopChatbots topChatbots={data.topChatbots} />
        <ActiveIntegrations integrations={data.integrations} />
      </div>
    </article>
  );
}

