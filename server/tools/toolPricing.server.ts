/**
 * Tool Pricing - Costos monetarios reales de herramientas externas
 * Complementa toolCosts.ts (credits) con costos en USD
 */

export interface ToolCostCalculation {
  toolName: string;
  usageCount: number;
  credits: number;
  costUSD: number;
  costMXN: number;
  pricePerUseUSD: number;
}

/**
 * Pricing por herramienta (en USD)
 * Basado en costos reales de APIs externas
 */
export const TOOL_PRICING_USD: Record<string, number> = {
  // Google Search API: $5 USD por 1,000 queries
  web_search_google: 0.005, // $0.005 USD por búsqueda

  // Herramientas sin costo externo (solo compute/BD)
  save_contact_info: 0,
  get_current_datetime: 0,
  schedule_reminder: 0,
  list_reminders: 0,
  update_reminder: 0,
  cancel_reminder: 0,
  delete_reminder: 0,
  search_context: 0, // RAG usa embeddings que ya están calculados en costs de AI
  get_usage_limits: 0,
  create_payment_link: 0, // Stripe no cobra por crear links
  query_chatbots: 0,
  get_chatbot_stats: 0,
  generate_chatbot_report: 0,

  // Default para herramientas no catalogadas
  default: 0,
} as const;

/**
 * Calcula el costo monetario de una herramienta
 */
export function getToolMonetaryCost(toolName: string): number {
  return TOOL_PRICING_USD[toolName] ?? TOOL_PRICING_USD.default;
}

/**
 * Calcula el costo total en USD y MXN para un conjunto de tool usages
 */
export function calculateToolCosts(
  toolUsages: Array<{ toolName: string; count: number }>
): {
  totalUSD: number;
  totalMXN: number;
  breakdown: Array<{
    toolName: string;
    count: number;
    costUSD: number;
    costMXN: number;
  }>;
} {
  const USD_TO_MXN = 20;

  const breakdown = toolUsages.map((usage) => {
    const pricePerUse = getToolMonetaryCost(usage.toolName);
    const costUSD = pricePerUse * usage.count;
    const costMXN = costUSD * USD_TO_MXN;

    return {
      toolName: usage.toolName,
      count: usage.count,
      costUSD,
      costMXN,
    };
  });

  const totalUSD = breakdown.reduce((sum, item) => sum + item.costUSD, 0);
  const totalMXN = totalUSD * USD_TO_MXN;

  return { totalUSD, totalMXN, breakdown };
}

/**
 * Calcula costo completo (credits + dinero) para una herramienta
 */
export function calculateToolCostFull(
  toolName: string,
  usageCount: number,
  credits: number
): ToolCostCalculation {
  const USD_TO_MXN = 20;
  const pricePerUseUSD = getToolMonetaryCost(toolName);
  const costUSD = pricePerUseUSD * usageCount;
  const costMXN = costUSD * USD_TO_MXN;

  return {
    toolName,
    usageCount,
    credits,
    costUSD,
    costMXN,
    pricePerUseUSD,
  };
}
