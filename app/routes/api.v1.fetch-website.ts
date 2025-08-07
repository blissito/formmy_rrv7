import { JSDOM } from "jsdom";
import type { Route } from "./+types/api.v1.fetch-website";

interface WebsiteRequest {
  url: string;
  includeRoutes?: string[];
  excludeRoutes?: string[];
  updateFrequency?: "yearly" | "monthly";
}

interface FetchWebsiteResult {
  content: string;
  routes: string[];
  error?: string;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: WebsiteRequest = await request.json();
    const { url, includeRoutes, excludeRoutes } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Construir la URL completa
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    
    // Validar URL
    let parsedUrl;
    try {
      parsedUrl = new URL(fullUrl);
    } catch (urlError) {
      throw new Error(`Invalid URL: ${fullUrl}. Error: ${urlError instanceof Error ? urlError.message : 'Unknown URL parsing error'}`);
    }

    // Hacer fetch del contenido principal
    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `Error al obtener el sitio web: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();

    // Extraer texto del HTML usando JSDOM
    const textContent = extractTextFromHTML(html);


    // Descubrir rutas del sitio
    const discoveredRoutes = discoverRoutes(fullUrl, html);

    // Filtrar rutas según incluir/excluir
    const filteredRoutes = filterRoutes(
      discoveredRoutes,
      includeRoutes,
      excludeRoutes
    );

    // Obtener contenido de las rutas filtradas (limitado para evitar timeout)
    const routesContent = await fetchRoutesContent(filteredRoutes.slice(0, 5));

    // Combinar todo el contenido
    const combinedContent = `${textContent}\n\n${routesContent}`;

    const result: FetchWebsiteResult = {
      content: combinedContent,
      routes: filteredRoutes,
    };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error desconocido al obtener el sitio web";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Función auxiliar para extraer texto del HTML usando JSDOM
const extractTextFromHTML = (html: string): string => {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Intentar extraer información antes de remover scripts
    const title = document.querySelector("title")?.textContent || "";
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const h1Tags = Array.from(document.querySelectorAll("h1")).map(h => h.textContent).join(" ");
    const h2Tags = Array.from(document.querySelectorAll("h2")).map(h => h.textContent).join(" ");

    // Remover scripts y estilos
    const scripts = document.querySelectorAll("script, style");
    scripts.forEach((script) => script.remove());

    // Obtener solo el texto del body
    const body = document.querySelector("body");
    const bodyText = body?.textContent || "";

    // Combinar toda la información disponible
    const combinedText = [title, metaDescription, h1Tags, h2Tags, bodyText]
      .filter(text => text && text.trim().length > 0)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return combinedText;
  } catch {
    // Fallback: usar regex simple para remover tags HTML
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

// Función para descubrir rutas en el sitio
const discoverRoutes = (baseUrl: string, html: string): string[] => {
  try {
    const routes = new Set<string>();
    const urlPattern = new URL(baseUrl);
    const baseHost = urlPattern.hostname;

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const links = document.querySelectorAll("a[href]");

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        try {
          let fullUrl: string;

          if (href.startsWith("http")) {
            const linkUrl = new URL(href);
            // Solo incluir enlaces del mismo dominio
            if (linkUrl.hostname === baseHost) {
              fullUrl = href;
            } else {
              return;
            }
          } else if (href.startsWith("/")) {
            fullUrl = `${urlPattern.protocol}//${urlPattern.host}${href}`;
          } else {
            return; // Ignorar enlaces relativos complejos
          }

          routes.add(fullUrl);
        } catch {
          // Ignorar URLs malformadas
        }
      }
    });

    return Array.from(routes);
  } catch {
    return [];
  }
};

// Función para filtrar rutas según criterios de inclusión/exclusión
const filterRoutes = (
  routes: string[],
  includeRoutes?: string[],
  excludeRoutes?: string[]
): string[] => {
  let filteredRoutes = [...routes];

  // Aplicar filtros de inclusión
  if (includeRoutes && includeRoutes.length > 0) {
    filteredRoutes = filteredRoutes.filter((route) => {
      return includeRoutes.some((includePattern) => {
        const pattern = includePattern.trim();
        return route.includes(pattern);
      });
    });
  }

  // Aplicar filtros de exclusión
  if (excludeRoutes && excludeRoutes.length > 0) {
    filteredRoutes = filteredRoutes.filter((route) => {
      return !excludeRoutes.some((excludePattern) => {
        const pattern = excludePattern.trim();
        return route.includes(pattern);
      });
    });
  }

  return filteredRoutes;
};

// Función para obtener contenido de múltiples rutas
const fetchRoutesContent = async (routes: string[]): Promise<string> => {
  const contents: string[] = [];

  for (const route of routes) {
    try {
      const response = await fetch(route, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WebsiteFetcher/1.0)",
        },
        // Timeout para evitar que se cuelgue
        signal: AbortSignal.timeout(10000), // 10 segundos
      });

      if (response.ok) {
        const html = await response.text();
        const textContent = extractTextFromHTML(html);
        contents.push(`\n--- Contenido de ${route} ---\n${textContent}`);
      }
    } catch {
      // Ignorar errores individuales de rutas
      contents.push(`\n--- Error al obtener ${route} ---\n`);
    }
  }

  return contents.join("\n");
};
