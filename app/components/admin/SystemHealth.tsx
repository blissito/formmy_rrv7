/**
 * SystemHealth - Dashboard de salud del sistema
 * Semáforo visual + error rates + latencias + alertas
 */

interface HealthAlert {
  type: 'success' | 'warning' | 'danger';
  message: string;
}

interface ToolError {
  toolName: string;
  errorRate: number;
  errorCount: number;
  totalCount: number;
}

interface SystemHealthProps {
  avgLatency: number;
  maxLatency: number;
  toolErrors: ToolError[];
  alerts: HealthAlert[];
}

export function SystemHealth({ avgLatency, maxLatency, toolErrors, alerts }: SystemHealthProps) {
  // Determinar color de latencia
  const latencyStatus = avgLatency < 1000 ? 'success' : avgLatency < 2000 ? 'warning' : 'danger';

  // Top 3 herramientas con más errores
  const topErrors = [...toolErrors]
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 3);

  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">🚦 System Health (7 días)</h2>

      {/* Semáforo visual de métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Latencia */}
        <div
          className={`p-4 rounded-lg border-2 ${
            latencyStatus === 'success'
              ? 'bg-green-50 border-green-300'
              : latencyStatus === 'warning'
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {latencyStatus === 'success' ? '✅' : latencyStatus === 'warning' ? '⚠️' : '🔴'}
            </span>
            <div>
              <div className="text-sm text-gray-600">API Latency</div>
              <div className="text-lg font-bold">{avgLatency.toFixed(0)}ms avg</div>
              <div className="text-xs text-gray-500">Max: {maxLatency.toFixed(0)}ms</div>
            </div>
          </div>
        </div>

        {/* Error rate de tools */}
        <div
          className={`p-4 rounded-lg border-2 ${
            toolErrors.length === 0
              ? 'bg-green-50 border-green-300'
              : topErrors[0]?.errorRate > 5
              ? 'bg-red-50 border-red-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {toolErrors.length === 0 ? '✅' : topErrors[0]?.errorRate > 5 ? '🔴' : '⚠️'}
            </span>
            <div>
              <div className="text-sm text-gray-600">Tool Errors</div>
              <div className="text-lg font-bold">
                {toolErrors.length > 0
                  ? `${topErrors[0].errorRate.toFixed(1)}%`
                  : '0%'}
              </div>
              <div className="text-xs text-gray-500">Target: {'<'}5%</div>
            </div>
          </div>
        </div>

        {/* Total alerts */}
        <div
          className={`p-4 rounded-lg border-2 ${
            alerts.filter((a) => a.type === 'danger').length > 0
              ? 'bg-red-50 border-red-300'
              : alerts.filter((a) => a.type === 'warning').length > 0
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-green-50 border-green-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {alerts.filter((a) => a.type === 'danger').length > 0
                ? '🔴'
                : alerts.filter((a) => a.type === 'warning').length > 0
                ? '⚠️'
                : '✅'}
            </span>
            <div>
              <div className="text-sm text-gray-600">System Alerts</div>
              <div className="text-lg font-bold">{alerts.length}</div>
              <div className="text-xs text-gray-500">
                {alerts.filter((a) => a.type === 'danger').length} críticas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas activas */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                alert.type === 'danger'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}
            >
              <div className="flex items-start gap-2 text-sm">
                <span className="font-bold">
                  {alert.type === 'danger' ? '🔴' : alert.type === 'warning' ? '⚠️' : '✅'}
                </span>
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top errores de herramientas */}
      {topErrors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Tool Errors</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tool</th>
                  <th className="text-right p-2">Error Rate</th>
                  <th className="text-right p-2">Errors</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {topErrors.map((error, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{error.toolName}</td>
                    <td className="p-2 text-right font-semibold">
                      <span
                        className={
                          error.errorRate > 5
                            ? 'text-red-600'
                            : error.errorRate > 2
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }
                      >
                        {error.errorRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right">{error.errorCount}</td>
                    <td className="p-2 text-right text-gray-600">{error.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toolErrors.length === 0 && alerts.length === 0 && (
        <div className="text-center py-4 text-green-600 font-semibold">
          ✅ Sistema operando normalmente sin errores
        </div>
      )}
    </section>
  );
}
