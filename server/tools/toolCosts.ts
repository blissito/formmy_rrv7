/**
 * Tool Credit Costs - Definición de costos por herramienta
 * Usado para tracking y analytics de consumo de créditos
 */

export const TOOL_CREDIT_COSTS: Record<string, number> = {
  // Basic tools (1 crédito)
  save_contact_info: 1,
  get_current_datetime: 1,

  // Intermediate tools (2-3 créditos)
  schedule_reminder: 2,
  list_reminders: 1,
  update_reminder: 2,
  cancel_reminder: 1,
  delete_reminder: 1,
  search_context: 2,
  web_search_google: 3,
  get_usage_limits: 1,

  // Advanced tools (4-6 créditos)
  create_payment_link: 4,
  query_chatbots: 2,
  get_chatbot_stats: 3,
  generate_chatbot_report: 6,

  // Default para herramientas no catalogadas
  default: 1,
} as const;

/**
 * Calcula el costo en créditos de una herramienta
 */
export function getToolCreditCost(toolName: string): number {
  return TOOL_CREDIT_COSTS[toolName] ?? TOOL_CREDIT_COSTS.default;
}

/**
 * Calcula el total de créditos consumidos por un array de tool usages
 */
export function calculateTotalCredits(toolUsages: Array<{ toolName: string; count: number }>): number {
  return toolUsages.reduce((total, usage) => {
    const cost = getToolCreditCost(usage.toolName);
    return total + (cost * usage.count);
  }, 0);
}
