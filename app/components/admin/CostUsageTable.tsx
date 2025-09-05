interface CostEntry {
  provider: string;
  model: string;
  cost: number;
  messages: number;
  tokens: number;
}

interface CostUsageTableProps {
  costs: CostEntry[];
  totalCost: number;
}

export function CostUsageTable({ costs, totalCost }: CostUsageTableProps) {
  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Costos por Proveedor (30 días)</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            ${totalCost.toFixed(4)}
          </div>
          <div className="text-sm text-gray-500">Costo Total</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Proveedor</th>
              <th className="text-left p-2">Modelo</th>
              <th className="text-right p-2">Mensajes</th>
              <th className="text-right p-2">Tokens</th>
              <th className="text-right p-2">Costo (USD)</th>
              <th className="text-right p-2">% del Total</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((entry, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-2 font-mono text-xs">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    entry.provider === 'openai' ? 'bg-green-500' :
                    entry.provider === 'anthropic' ? 'bg-orange-500' :
                    entry.provider === 'openrouter' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></span>
                  {entry.provider}
                </td>
                <td className="p-2 font-mono text-xs">{entry.model}</td>
                <td className="p-2 text-right">{entry.messages.toLocaleString()}</td>
                <td className="p-2 text-right">{entry.tokens.toLocaleString()}</td>
                <td className="p-2 text-right font-semibold">
                  ${entry.cost.toFixed(6)}
                </td>
                <td className="p-2 text-right text-gray-600">
                  {totalCost > 0 ? ((entry.cost / totalCost) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            ))}
            {costs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No hay datos de costos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}