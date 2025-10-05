import { MetricCard } from './MetricCard';

interface RevenueOverviewProps {
  estimatedRevenue: number;
  totalCost: number;
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

export function RevenueOverview({ estimatedRevenue, totalCost, users, chatbots }: RevenueOverviewProps) {
  // Calcular profit margin (totalCost ya viene en MXN desde el loader)
  const totalCostMXN = totalCost;
  const profitMXN = estimatedRevenue - totalCostMXN;
  const profitMargin = estimatedRevenue > 0 ? (profitMXN / estimatedRevenue) * 100 : 0;

  // Determinar color y trend del profit margin
  const profitTrend = profitMargin >= 50
    ? '✅ Excelente (>50%)'
    : profitMargin >= 40
    ? '✅ Saludable (40-50%)'
    : profitMargin >= 30
    ? '⚠️ Bajo target (30-40%)'
    : '🔴 Crítico (<30%)';

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <MetricCard
        title="Revenue Estimado"
        value={`$${estimatedRevenue.toLocaleString()} MXN`}
        subtitle="Mensual (solo planes de pago)"
        trend={`${users.active} usuarios activos`}
      />
      <MetricCard
        title="Profit Margin"
        value={`${profitMargin.toFixed(1)}%`}
        subtitle={`$${profitMXN.toLocaleString()} MXN`}
        trend={profitTrend}
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