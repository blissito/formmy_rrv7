interface Token {
  provider: string;
  model: string;
  count: number;
  tokens: number;
}

interface TokenUsageTableProps {
  tokens: Token[];
}

export function TokenUsageTable({ tokens }: TokenUsageTableProps) {
  return (
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
            {tokens.map((token, i) => (
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
  );
}