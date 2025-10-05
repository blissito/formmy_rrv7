/**
 * ToolCreditsTable - Analytics de uso de herramientas
 * Muestra consumo de credits por tool con warnings de límites
 */

interface ToolUsageEntry {
  toolName: string;
  count: number;
  credits: number;
  topPlan: string;
}

interface ToolCreditsTableProps {
  toolUsage: ToolUsageEntry[];
  totalCredits: number;
  usersNearLimit: Array<{ plan: string; count: number }>;
}

export function ToolCreditsTable({ toolUsage, totalCredits, usersNearLimit }: ToolCreditsTableProps) {
  // Ordenar por credits descendente
  const sortedUsage = [...toolUsage].sort((a, b) => b.credits - a.credits);

  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Tool Credits Usage (30 días)</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">
            {totalCredits.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Credits Totales</div>
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
              <th className="text-right p-2">Costo/Uso</th>
              <th className="text-left p-2">Plan Principal</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsage.map((entry, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2 font-mono text-xs">{entry.toolName}</td>
                <td className="p-2 text-right">{entry.count.toLocaleString()}</td>
                <td className="p-2 text-right font-semibold">{entry.credits.toLocaleString()}</td>
                <td className="p-2 text-right text-gray-600">
                  {(entry.credits / entry.count).toFixed(1)}
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
                <td colSpan={5} className="p-4 text-center text-gray-500">
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
                <td className="p-2 text-right" colSpan={2}>
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
