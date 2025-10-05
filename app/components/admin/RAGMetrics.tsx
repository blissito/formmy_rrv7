/**
 * RAGMetrics - Métricas de búsqueda RAG vs Web
 * KPIs para monitorear el uso del motor de búsqueda agéntico
 */

import { MetricCard } from './MetricCard';

interface RAGMetricsProps {
  ragSearches: number;
  webSearches: number;
  totalConversations: number;
  conversationsWithRAG: number;
}

export function RAGMetrics({ ragSearches, webSearches, totalConversations, conversationsWithRAG }: RAGMetricsProps) {
  const totalSearches = ragSearches + webSearches;
  const avgSearchesPerConv = totalConversations > 0
    ? (totalSearches / totalConversations).toFixed(1)
    : '0';

  const webFallbackPercentage = totalSearches > 0
    ? ((webSearches / totalSearches) * 100).toFixed(1)
    : '0';

  const convWithRAGPercentage = totalConversations > 0
    ? ((conversationsWithRAG / totalConversations) * 100).toFixed(1)
    : '0';

  // Determinar si el avg está en el target (2-4 búsquedas)
  const avgFloat = parseFloat(avgSearchesPerConv);
  const avgTrend = avgFloat >= 2 && avgFloat <= 4
    ? '✅ En target (2-4)'
    : avgFloat < 2
    ? '⚠️ Bajo target'
    : '⚠️ Sobre target';

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4">🔍 RAG Performance Metrics (30 días)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="RAG Searches"
          value={ragSearches.toLocaleString()}
          subtitle="Búsquedas en base de conocimiento"
          trend={`${((ragSearches / (totalSearches || 1)) * 100).toFixed(1)}% del total`}
        />
        <MetricCard
          title="Web Fallbacks"
          value={webSearches.toLocaleString()}
          subtitle={`${webFallbackPercentage}% de búsquedas`}
          trend={parseFloat(webFallbackPercentage) < 15 ? '✅ Bajo (bueno)' : '⚠️ Alto fallback'}
        />
        <MetricCard
          title="Avg Searches/Conv"
          value={avgSearchesPerConv}
          subtitle="Promedio de búsquedas"
          trend={avgTrend}
        />
        <MetricCard
          title="% Conv con RAG"
          value={`${convWithRAGPercentage}%`}
          subtitle={`${conversationsWithRAG} de ${totalConversations}`}
          trend={parseFloat(convWithRAGPercentage) > 25 ? '✅ Alto uso' : '⚠️ Bajo uso'}
        />
      </div>
    </section>
  );
}
