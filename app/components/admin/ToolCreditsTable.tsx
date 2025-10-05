/**
 * ToolCreditsTable - Analytics de uso de herramientas
 * Muestra consumo de credits por tool con warnings de límites
 */

interface ToolUsageEntry {
  toolName: string;
  count: number;
  credits: number;
  costUSD: number;
  costMXN: number;
  pricePerUseUSD: number;
  topPlan: string;
}

interface ToolCreditsTableProps {
  toolUsage: ToolUsageEntry[];
  totalCredits: number;
  totalCostUSD: number;
  totalCostMXN: number;
  usersNearLimit: Array<{ plan: string; count: number }>;
}

export function ToolCreditsTable({ toolUsage, totalCredits, totalCostUSD, totalCostMXN, usersNearLimit }: ToolCreditsTableProps) {
  // Ordenar por costo descendente (más relevante que credits)
  const sortedUsage = [...toolUsage].sort((a, b) => b.costMXN - a.costMXN);

  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tool Usage & Costs (30 días)</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">
            {totalCredits.toLocaleString()} credits
          </div>
          <div className="text-lg font-semibold text-red-600">
            ${totalCostMXN.toFixed(2)} MXN
          </div>
          <div className="text-xs text-gray-500">
            (${totalCostUSD.toFixed(4)} USD)
          </div>
        </div>
      </div>

      {/* Warnings de usuarios cerca del límite */}
      {usersNearLimit.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold">⚠️</span>
            <div className="text-sm">
              <span className="font-semibold text-yellow-800">Usuarios cerca del límite:</span>
              {usersNearLimit.map((item, i) => (
                <span key={i} className="ml-2 text-yellow-700">
                  {item.count} {item.plan} ({'>'}80% usado)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Herramienta</th>
              <th className="text-right p-2">Usos</th>
              <th className="text-right p-2">Credits</th>
              <th className="text-right p-2">Costo MXN</th>
              <th className="text-right p-2">$/Uso</th>
              <th className="text-left p-2">Más usado por</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsage.map((entry, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2 font-mono text-xs">{entry.toolName}</td>
                <td className="p-2 text-right">{entry.count.toLocaleString()}</td>
                <td className="p-2 text-right font-semibold">{entry.credits.toLocaleString()}</td>
                <td className="p-2 text-right">
                  {entry.costMXN > 0 ? (
                    <div>
                      <div className="font-bold text-red-600">${entry.costMXN.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">({entry.count} × ${(entry.pricePerUseUSD * 20).toFixed(1)})</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-2 text-right text-gray-600 text-xs">
                  {entry.pricePerUseUSD > 0 ? (
                    <div>
                      <div>${(entry.pricePerUseUSD * 20).toFixed(1)} MXN</div>
                      <div className="text-gray-400">${entry.pricePerUseUSD.toFixed(4)} USD</div>
                    </div>
                  ) : (
                    'Gratis'
                  )}
                </td>
                <td className="p-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      entry.topPlan === 'ENTERPRISE'
                        ? 'bg-purple-100 text-purple-800'
                        : entry.topPlan === 'PRO'
                        ? 'bg-blue-100 text-blue-800'
                        : entry.topPlan === 'STARTER'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {entry.topPlan}
                  </span>
                </td>
              </tr>
            ))}
            {toolUsage.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No hay datos de uso de herramientas
                </td>
              </tr>
            )}
          </tbody>
          {toolUsage.length > 0 && (
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="p-2">TOTAL</td>
                <td className="p-2 text-right">
                  {sortedUsage.reduce((sum, e) => sum + e.count, 0).toLocaleString()}
                </td>
                <td className="p-2 text-right">{totalCredits.toLocaleString()}</td>
                <td className="p-2 text-right text-red-600">
                  ${totalCostMXN.toFixed(2)}
                </td>
                <td className="p-2 text-right text-xs text-gray-600" colSpan={2}>
                  {sortedUsage.length} herramientas activas
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
