/**
 * Parser Metrics Component - Dashboard de métricas de LlamaParse
 */

interface ParserMetricsProps {
  totalJobs: number;
  totalPages: number;
  totalCredits: number;
  byMode: Array<{
    mode: "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS";
    _count: { id: number };
    _sum: { creditsUsed: number | null; pages: number | null };
  }>;
}

// Costos de LlamaParse por modo (USD por página)
const LLAMAPARSE_COST_PER_PAGE = {
  COST_EFFECTIVE: 0.003,
  AGENTIC: 0.007,
  AGENTIC_PLUS: 0.015,
} as const;

// Valor de créditos en MXN (ajustado para 90% profit margin)
const CREDIT_VALUE_MXN = {
  COST_EFFECTIVE: 3.0, // 1 crédito = $3.00 MXN (90% profit @ 5 páginas)
  AGENTIC: 2.33, // 3 créditos = $7.00 MXN (90% profit @ 5 páginas)
  AGENTIC_PLUS: 2.5, // 6 créditos = $15.00 MXN (90% profit @ 5 páginas)
} as const;

const MODE_LABELS = {
  COST_EFFECTIVE: "Cost Effective",
  AGENTIC: "Agentic",
  AGENTIC_PLUS: "Agentic Plus",
} as const;

export function ParserMetrics({
  totalJobs,
  totalPages,
  totalCredits,
  byMode,
}: ParserMetricsProps) {
  // Calcular costo total en USD
  const totalCostUSD = byMode.reduce((sum, mode) => {
    const pages = mode._sum.pages || 0;
    const costPerPage = LLAMAPARSE_COST_PER_PAGE[mode.mode];
    return sum + pages * costPerPage;
  }, 0);

  const totalCostMXN = totalCostUSD * 20;

  // Calcular ingresos generados (créditos usados * valor por crédito)
  const totalRevenueMXN = byMode.reduce((sum, mode) => {
    const credits = mode._sum.creditsUsed || 0;
    const valuePerCredit = CREDIT_VALUE_MXN[mode.mode];
    return sum + credits * valuePerCredit;
  }, 0);

  const profitMXN = totalRevenueMXN - totalCostMXN;
  const profitMargin =
    totalRevenueMXN > 0 ? ((profitMXN / totalRevenueMXN) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            📄 Parser / LlamaParse
          </h3>
          <p className="text-sm text-gray-500">Últimos 30 días</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Profit Margin</div>
          <div
            className={`text-2xl font-bold ${
              profitMXN > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {profitMargin}%
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Documentos</div>
          <div className="text-3xl font-bold text-gray-900">{totalJobs}</div>
          <div className="text-xs text-gray-500 mt-1">procesados</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Páginas</div>
          <div className="text-3xl font-bold text-gray-900">{totalPages}</div>
          <div className="text-xs text-gray-500 mt-1">total</div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 mb-1">Costo LlamaParse</div>
          <div className="text-2xl font-bold text-red-700">
            ${totalCostMXN.toFixed(2)}
          </div>
          <div className="text-xs text-red-600 mt-1">
            ${totalCostUSD.toFixed(2)} USD
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 mb-1">Ingreso</div>
          <div className="text-2xl font-bold text-green-700">
            ${totalRevenueMXN.toFixed(2)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            {totalCredits} créditos
          </div>
        </div>
      </div>

      {/* Breakdown por modo */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Breakdown por Modo
        </h4>
        <div className="space-y-2">
          {byMode.map((mode) => {
            const jobs = mode._count.id;
            const pages = mode._sum.pages || 0;
            const credits = mode._sum.creditsUsed || 0;
            const costUSD = pages * LLAMAPARSE_COST_PER_PAGE[mode.mode];
            const costMXN = costUSD * 20;
            const revenueMXN = credits * CREDIT_VALUE_MXN[mode.mode];
            const profit = revenueMXN - costMXN;
            const margin = revenueMXN > 0 ? ((profit / revenueMXN) * 100).toFixed(0) : "0";

            return (
              <div
                key={mode.mode}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-32">
                    <div className="font-semibold text-sm text-gray-900">
                      {MODE_LABELS[mode.mode]}
                    </div>
                    <div className="text-xs text-gray-500">{jobs} jobs</div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Páginas:</span>{" "}
                      <span className="font-semibold">{pages}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Créditos:</span>{" "}
                      <span className="font-semibold">{credits}</span>
                    </div>
                    <div>
                      <span className="text-red-600">Costo:</span>{" "}
                      <span className="font-semibold text-red-700">
                        ${costMXN.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600">Ingreso:</span>{" "}
                      <span className="font-semibold text-green-700">
                        ${revenueMXN.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      profit > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {margin}%
                  </div>
                  <div className="text-xs text-gray-500">margen</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nota */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Pricing (90% profit target):</strong> Cost Effective ($3.00/crédito) • Agentic
          ($2.33/crédito) • Agentic Plus ($2.50/crédito)
        </p>
      </div>
    </div>
  );
}
