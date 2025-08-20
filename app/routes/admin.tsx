import { data as json } from "react-router";
import { useLoaderData } from "react-router";
import { type LoaderFunctionArgs } from "react-router";
import { db } from "~/utils/db.server";
import { getAdminUserOrRedirect } from "server/getUserUtils.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await getAdminUserOrRedirect(request);
  
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
      provider: t.aiModel?.split('/')[0] || 'unknown',
      model: t.aiModel || 'unknown',
      count: t._count.aiModel || 0,
      tokens: t._sum.tokens || 0,
    })),
    topChatbots,
    integrations: integrations.map(i => ({ platform: i.platform, count: i._count.platform })),
  };
};

export default function AdminDashboard() {
  const data = useLoaderData<typeof loader>();

  // Calculate estimated monthly revenue (in MXN)
  const estimatedRevenue = data.plans.reduce((acc, plan) => {
    const rates: Record<string, number> = {
      STARTER: 149,
      PRO: 499,
      ENTERPRISE: 1499,
    };
    return acc + (rates[plan.plan] || 0) * plan.count;
  }, 0);

  return (
    <article className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Métricas clave para founders</p>
      </header>

      {/* Revenue & Users Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Revenue Estimado"
          value={`$${estimatedRevenue.toLocaleString()} MXN`}
          subtitle="Mensual"
          trend={`${data.users.active} usuarios activos`}
        />
        <MetricCard
          title="Total Usuarios"
          value={data.users.total.toLocaleString()}
          subtitle={`+${data.users.thisWeek} esta semana`}
          trend={`+${data.users.thisMonth} este mes`}
        />
        <MetricCard
          title="Chatbots Activos"
          value={data.chatbots.active.toLocaleString()}
          subtitle={`${data.chatbots.total} total`}
          trend={`${((data.chatbots.active / data.chatbots.total) * 100).toFixed(1)}% activos`}
        />
        <MetricCard
          title="Conversaciones"
          value={data.chatbots.conversations.toLocaleString()}
          subtitle={`+${data.chatbots.thisMonthConversations} este mes`}
          trend="Total histórico"
        />
      </section>

      {/* Plans Distribution */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Distribución de Planes</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data.plans.map((plan) => (
            <div key={plan.plan} className="text-center">
              <div className="text-2xl font-bold text-blue-600">{plan.count}</div>
              <div className="text-sm text-gray-600">{plan.plan}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Token Usage by Provider */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Uso de Tokens por Proveedor (30 días)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Proveedor</th>
                <th className="text-left p-2">Modelo</th>
                <th className="text-right p-2">Requests</th>
                <th className="text-right p-2">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {data.tokens.map((token, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs">{token.provider}</td>
                  <td className="p-2 font-mono text-xs">{token.model}</td>
                  <td className="p-2 text-right">{token.count.toLocaleString()}</td>
                  <td className="p-2 text-right font-semibold">{token.tokens.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Chatbots & Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Chatbots</h2>
          <div className="space-y-3">
            {data.topChatbots.map((bot, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium">{bot.name}</div>
                  <div className="text-sm text-gray-600">{bot.user.email}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{bot.conversationCount}</div>
                  <div className="text-sm text-gray-600">conversaciones</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Integraciones Activas</h2>
          <div className="space-y-3">
            {data.integrations.map((integration, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div className="font-medium">{integration.platform}</div>
                <div className="font-semibold">{integration.count}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-1">{subtitle}</div>
      <div className="text-xs text-blue-600">{trend}</div>
    </div>
  );
}