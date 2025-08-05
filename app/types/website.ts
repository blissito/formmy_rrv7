export interface WebsiteEntry {
  url: string;
  content: string;
  routes: string[];
  includeRoutes?: string[];
  excludeRoutes?: string[];
  updateFrequency: "yearly" | "monthly";
  lastUpdated: Date;
  contextId?: string; // ID del contexto si ya existe en la base de datos
}
