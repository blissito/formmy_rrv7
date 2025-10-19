/**
 * Cuenta las páginas de un PDF desde un buffer
 * @param buffer Buffer del PDF
 * @returns Número de páginas
 */
export async function countPDFPages(buffer: Buffer): Promise<number> {
  try {
    // Usar require dinámico para pdf-parse (CommonJS module)
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.numpages;
  } catch (error) {
    console.error("Error counting PDF pages:", error);
    // Fallback: estimar ~10 páginas si falla
    return 10;
  }
}

/**
 * Calcula los créditos necesarios según el modo y número de páginas
 * Modelo híbrido: Base (hasta 5 páginas) + créditos por página extra
 */
export function calculateCreditsForPages(
  mode: "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS",
  pages: number
): number {
  const BASE_PAGES = 5;

  const pricing = {
    COST_EFFECTIVE: {
      base: 5,        // 5 créditos hasta 5 páginas (1 crédito/página)
      perPage: 1,     // 1 crédito por página extra
    },
    AGENTIC: {
      base: 15,       // 15 créditos hasta 5 páginas (3 créditos/página)
      perPage: 3,     // 3 créditos por página extra
    },
    AGENTIC_PLUS: {
      base: 30,       // 30 créditos hasta 5 páginas (6 créditos/página)
      perPage: 6,     // 6 créditos por página extra
    },
  };

  const config = pricing[mode];

  if (pages <= BASE_PAGES) {
    // Si tiene 5 páginas o menos, cobrar solo proporcional
    return pages * config.perPage;
  }

  // Si tiene más de 5 páginas: base + extras
  const extraPages = pages - BASE_PAGES;
  return config.base + (extraPages * config.perPage);
}

/**
 * Obtiene información de pricing para mostrar en UI
 */
export function getPricingInfo(mode: "COST_EFFECTIVE" | "AGENTIC" | "AGENTIC_PLUS") {
  const pricing = {
    COST_EFFECTIVE: {
      baseCredits: 5,
      basePagesIncluded: 5,
      perPageExtra: 1,
      description: "1 crédito/página",
    },
    AGENTIC: {
      baseCredits: 15,
      basePagesIncluded: 5,
      perPageExtra: 3,
      description: "3 créditos/página",
    },
    AGENTIC_PLUS: {
      baseCredits: 30,
      basePagesIncluded: 5,
      perPageExtra: 6,
      description: "6 créditos/página",
    },
  };

  return pricing[mode];
}
