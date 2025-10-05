/**
 * AIProviderTable - Uso de IA por Proveedor/Modelo
 * Muestra análisis detallado con costos en MXN y pricing input/output
 */

interface AIUsageEntry {
  provider: string;
  model: string;
  modelDisplay: string;
  requests: number;
  tokens: number;
  cost: number;
  pricePerMillion: string;
}

interface AIProviderTableProps {
  usage: AIUsageEntry[];
  totalCost: number;
}

export function AIProviderTable({ usage, totalCost }: AIProviderTableProps) {
  // Ordenar por costo descendente
  const sortedUsage = [...usage].sort((a, b) => b.cost - a.cost);

  // Calcular totales
  const totals = usage.reduce(
    (acc, entry) => ({
      requests: acc.requests + entry.requests,
      tokens: acc.tokens + entry.tokens,
      cost: acc.cost + entry.cost,
    }),
    { requests: 0, tokens: 0, cost: 0 }
  );

  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Uso de IA por Proveedor (30 días)</h2>
          <p className="text-xs text-gray-500 mt-1">
            💡 Costos calculados con pricing input/output (60%/40%) • Precios en MXN
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            ${totalCost.toFixed(2)} MXN
          </div>
          <div className="text-sm text-gray-500">Costo Total Estimado</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-3 font-semibold">Proveedor</th>
              <th className="text-left p-3 font-semibold">Modelo</th>
              <th className="text-right p-3 font-semibold">Requests</th>
              <th className="text-right p-3 font-semibold">Tokens</th>
              <th className="text-right p-3 font-semibold">MXN/1M Tokens</th>
              <th className="text-right p-3 font-semibold">Costo Total</th>
              <th className="text-right p-3 font-semibold">% del Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsage.map((entry, i) => {
              return (
                <tr key={i} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          entry.provider === 'openai'
                            ? 'bg-green-500'
                            : entry.provider === 'anthropic'
                            ? 'bg-orange-500'
                            : entry.provider === 'openrouter'
                            ? 'bg-blue-500'
                            : 'bg-gray-500'
                        }`}
                      ></span>
                      <span className="font-medium capitalize">{entry.provider}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{entry.modelDisplay}</div>
                    <div className="text-xs text-gray-500 font-mono">{entry.model}</div>
                  </td>
                  <td className="p-3 text-right font-medium">{entry.requests.toLocaleString()}</td>
                  <td className="p-3 text-right text-gray-600">{entry.tokens.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                      {entry.pricePerMillion}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-green-700">
                    ${entry.cost.toFixed(2)} MXN
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-gray-600">
                      {totalCost > 0 ? ((entry.cost / totalCost) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {usage.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  <div className="text-gray-400 mb-2">📊</div>
                  No hay datos de uso disponibles en los últimos 30 días
                </td>
              </tr>
            )}
          </tbody>
          {usage.length > 0 && (
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr className="font-bold">
                <td className="p-3" colSpan={2}>
                  <span className="text-gray-700 uppercase text-xs tracking-wide">Total</span>
                </td>
                <td className="p-3 text-right text-gray-900">{totals.requests.toLocaleString()}</td>
                <td className="p-3 text-right text-gray-900">{totals.tokens.toLocaleString()}</td>
                <td className="p-3 text-right">
                  <span className="text-xs text-gray-500">Promedio ponderado</span>
                </td>
                <td className="p-3 text-right text-green-700 text-base">
                  ${totals.cost.toFixed(2)} MXN
                </td>
                <td className="p-3 text-right text-gray-700">100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
