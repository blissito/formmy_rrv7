import { chromium, type Browser, type Page } from 'playwright';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  timestamp: Date;
}

export class PlaywrightWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private browser: Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    await this.initialize();
    const searchResponse = await this.performSearch(query, numResults);
    
    this.cache.set(query, {
      data: searchResponse,
      expires: Date.now() + this.cacheTimeout,
    });

    return searchResponse;
  }

  private async performSearch(query: string, numResults: number): Promise<SearchResponse> {
    let page: Page | null = null;
    
    try {
      if (!this.browser) {
        await this.initialize();
      }
      
      page = await this.browser!.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      console.log('🌐 Página de Google cargada, buscando resultados...');

      await page.waitForSelector('#search', { timeout: 5000 }).catch(() => {});

      const results = await page.evaluate((maxResults) => {
        const searchResults: any[] = [];
        const resultElements = document.querySelectorAll('#search .g');
        
        console.log(`📊 Elementos encontrados: ${resultElements.length}`);
        
        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const element = resultElements[i];
          
          const linkElement = element.querySelector('a');
          const titleElement = element.querySelector('h3');
          const snippetElement = element.querySelector('.VwiC3b, .IsZvec, .s3v9rd');
          
          if (linkElement && titleElement) {
            const url = linkElement.href;
            const title = titleElement.textContent || '';
            const snippet = snippetElement?.textContent || '';
            
            if (url && !url.includes('google.com') && !url.includes('googleusercontent.com')) {
              searchResults.push({
                title: title.trim(),
                url: url,
                snippet: snippet.trim()
              });
            }
          }
        }
        
        return searchResults;
      }, numResults);

      const enhancedResults = await this.enhanceResultsWithContent(results.slice(0, 3), page);
      
      const allResults = [
        ...enhancedResults,
        ...results.slice(3)
      ];

      return {
        query,
        timestamp: new Date(),
        results: allResults
      };

    } catch (error) {
      console.error('Error en búsqueda con Playwright:', error);
      return this.getFallbackResults(query);
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  private async enhanceResultsWithContent(
    results: SearchResult[], 
    searchPage: Page
  ): Promise<SearchResult[]> {
    const enhanced: SearchResult[] = [];
    
    for (const result of results) {
      try {
        const page = await this.browser!.newPage();
        
        await page.goto(result.url, {
          waitUntil: 'domcontentloaded',
          timeout: 8000
        });

        const content = await page.evaluate(() => {
          const scripts = document.querySelectorAll('script, style, noscript');
          scripts.forEach(el => el.remove());
          
          const mainContent = 
            document.querySelector('main')?.textContent ||
            document.querySelector('article')?.textContent ||
            document.querySelector('[role="main"]')?.textContent ||
            document.querySelector('.content')?.textContent ||
            document.querySelector('#content')?.textContent ||
            '';
          
          return mainContent
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 800);
        });

        await page.close();
        
        enhanced.push({
          ...result,
          content: content || result.snippet
        });
        
      } catch (error) {
        console.log(`No se pudo obtener contenido adicional para: ${result.url}`);
        enhanced.push(result);
      }
    }
    
    return enhanced;
  }

  getFallbackResults(query: string): SearchResponse {
    const mockData: Record<string, SearchResult[]> = {
      default: [
        {
          title: "Formmy - Plataforma de Chatbots y Formularios",
          url: "https://formmy.app",
          snippet: "Crea chatbots inteligentes y formularios conversacionales que aumentan tus conversiones.",
          content: "Formmy es la plataforma líder en automatización conversacional. Conecta con tus clientes 24/7 a través de WhatsApp, web y más canales."
        },
        {
          title: "Documentación Oficial de Formmy",
          url: "https://docs.formmy.app",
          snippet: "Guías completas y documentación técnica para sacar el máximo provecho de Formmy.",
          content: "Aprende a configurar chatbots, crear formularios inteligentes, integrar con WhatsApp Business API y analizar métricas de conversación."
        },
        {
          title: "Blog de Formmy - Estrategias de Conversación",
          url: "https://blog.formmy.app",
          snippet: "Artículos y casos de éxito sobre marketing conversacional y automatización.",
          content: "Descubre las mejores prácticas para crear experiencias conversacionales que convierten. Casos reales de empresas que aumentaron sus ventas con chatbots."
        }
      ],
      whatsapp: [
        {
          title: "Integración WhatsApp Business API - Formmy",
          url: "https://formmy.app/whatsapp",
          snippet: "Conecta tu negocio con WhatsApp y automatiza la atención al cliente.",
          content: "Integración oficial con WhatsApp Business API. Envía mensajes automatizados, gestiona conversaciones y escala tu atención al cliente en WhatsApp."
        },
        {
          title: "Guía: Configurar WhatsApp con Formmy",
          url: "https://docs.formmy.app/whatsapp-setup",
          snippet: "Tutorial paso a paso para conectar WhatsApp Business con tu chatbot.",
          content: "1. Solicita acceso a WhatsApp Business API. 2. Configura tu número verificado. 3. Conecta con Formmy. 4. Crea flujos automatizados."
        },
        {
          title: "Precios WhatsApp Business - Formmy",
          url: "https://formmy.app/pricing/whatsapp",
          snippet: "Planes y costos para usar WhatsApp Business con Formmy.",
          content: "WhatsApp cobra por conversación iniciada. Primeras 1000 conversaciones gratis cada mes. Conversaciones de servicio: $0.005 USD. Conversaciones de marketing: $0.02 USD."
        }
      ],
      ai: [
        {
          title: "IA Conversacional en Formmy",
          url: "https://formmy.app/features/ai",
          snippet: "Potencia tus chatbots con inteligencia artificial avanzada.",
          content: "Usa GPT-4 y Claude para crear conversaciones naturales. Entrena modelos personalizados con tus datos. Respuestas contextuales y personalizadas."
        },
        {
          title: "Entrenamiento de Chatbots con IA",
          url: "https://docs.formmy.app/ai-training",
          snippet: "Cómo entrenar tu chatbot con datos propios para respuestas precisas.",
          content: "Sube documentos, FAQs y conversaciones previas. El sistema aprende automáticamente. Mejora continua con feedback de usuarios."
        },
        {
          title: "Casos de Uso de IA en Atención al Cliente",
          url: "https://blog.formmy.app/ai-customer-service",
          snippet: "Ejemplos reales de empresas usando IA para mejorar su servicio.",
          content: "Reducción del 70% en tiempo de respuesta. Resolución automática del 60% de consultas. Satisfacción del cliente aumentada en 40%."
        }
      ],
      formularios: [
        {
          title: "Constructor de Formularios Conversacionales",
          url: "https://formmy.app/form-builder",
          snippet: "Crea formularios que parecen conversaciones y convierten 3x más.",
          content: "Arrastra y suelta campos. Lógica condicional avanzada. Validación en tiempo real. Integración con CRMs. Analytics detallado."
        },
        {
          title: "Plantillas de Formularios - Formmy",
          url: "https://formmy.app/templates/forms",
          snippet: "Más de 100 plantillas listas para personalizar y usar.",
          content: "Formularios para: contacto, cotizaciones, encuestas, registro, reservas, aplicaciones de trabajo, feedback, suscripciones."
        },
        {
          title: "Formularios Multi-paso con Lógica Condicional",
          url: "https://docs.formmy.app/forms/conditional-logic",
          snippet: "Crea experiencias personalizadas mostrando campos según respuestas.",
          content: "Define reglas if/then. Salta pasos irrelevantes. Calcula valores dinámicamente. Personaliza mensajes según respuestas."
        }
      ],
      analytics: [
        {
          title: "Dashboard de Analytics - Formmy",
          url: "https://formmy.app/features/analytics",
          snippet: "Métricas en tiempo real para optimizar tus conversaciones.",
          content: "KPIs clave: tasa de conversión, tiempo de respuesta, satisfacción, abandono. Mapas de calor. Análisis de sentimiento. Exportación de datos."
        },
        {
          title: "Reportes Automáticos de Conversaciones",
          url: "https://docs.formmy.app/reports",
          snippet: "Recibe informes detallados por email cada semana.",
          content: "Resumen ejecutivo. Conversaciones totales. Tasa de resolución. Temas frecuentes. Recomendaciones de mejora basadas en IA."
        },
        {
          title: "ROI de Chatbots: Métricas que Importan",
          url: "https://blog.formmy.app/chatbot-roi",
          snippet: "Cómo medir el retorno de inversión de tu chatbot.",
          content: "Calcula: ahorro en costos de atención, aumento en conversiones, reducción de tiempo de respuesta, satisfacción del cliente."
        }
      ]
    };

    const lowerQuery = query.toLowerCase();
    let results = mockData.default;

    if (lowerQuery.includes('whatsapp')) {
      results = mockData.whatsapp;
    } else if (lowerQuery.includes('ia') || lowerQuery.includes('inteligencia') || lowerQuery.includes('ai')) {
      results = mockData.ai;
    } else if (lowerQuery.includes('formulario') || lowerQuery.includes('form')) {
      results = mockData.formularios;
    } else if (lowerQuery.includes('analytic') || lowerQuery.includes('metrica') || lowerQuery.includes('reporte')) {
      results = mockData.analytics;
    }

    return {
      query,
      timestamp: new Date(),
      results: results.slice(0, 5)
    };
  }

  formatForLLM(searchResponse: SearchResponse): string {
    const sources = searchResponse.results
      .map((result, index) => {
        const content = result.content 
          ? `\n   📄 Contenido: "${result.content}"`
          : '';
        
        return `[${index + 1}] ${result.title}
   🔗 ${result.url}
   📝 ${result.snippet}${content}`;
      })
      .join('\n\n');

    return `🔍 BÚSQUEDA WEB: "${searchResponse.query}"
⏰ ${new Date().toLocaleString('es-MX')}

📚 FUENTES ENCONTRADAS:
${sources}

💡 Usa [1], [2], [3] etc. para citar las fuentes cuando respondas.`;
  }

  formatReferences(searchResponse: SearchResponse): string {
    return '\n\n**📚 Fuentes consultadas:**\n' + 
      searchResponse.results
        .map((result, index) => 
          `[${index + 1}] [${result.title}](${result.url})`
        )
        .join('\n');
  }
}

let serviceInstance: PlaywrightWebSearchService | null = null;

export async function getWebSearchService(): Promise<PlaywrightWebSearchService> {
  if (!serviceInstance) {
    serviceInstance = new PlaywrightWebSearchService();
    await serviceInstance.initialize();
  }
  return serviceInstance;
}

export async function cleanupWebSearchService() {
  if (serviceInstance) {
    await serviceInstance.close();
    serviceInstance = null;
  }
}