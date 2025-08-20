import { MetricCard } from './MetricCard';

interface RevenueOverviewProps {
  estimatedRevenue: number;
  users: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    active: number;
  };
  chatbots: {
    total: number;
    active: number;
    conversations: number;
    thisMonthConversations: number;
  };
}

export function RevenueOverview({ estimatedRevenue, users, chatbots }: RevenueOverviewProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Revenue Estimado"
        value={`$${estimatedRevenue.toLocaleString()} MXN`}
        subtitle="Mensual (solo planes de pago)"
        trend={`${users.active} usuarios activos`}
      />
      <MetricCard
        title="Total Usuarios"
        value={users.total.toLocaleString()}
        subtitle={`+${users.thisWeek} esta semana`}
        trend={`+${users.thisMonth} este mes`}
      />
      <MetricCard
        title="Chatbots Activos"
        value={chatbots.active.toLocaleString()}
        subtitle={`${chatbots.total} total`}
        trend={chatbots.total > 0 ? 
          `${((chatbots.active / chatbots.total) * 100).toFixed(1)}% activos` : 
          '0% activos'}
      />
      <MetricCard
        title="Conversaciones"
        value={chatbots.conversations.toLocaleString()}
        subtitle={`+${chatbots.thisMonthConversations} este mes`}
        trend="Total histórico"
      />
    </section>
  );
}