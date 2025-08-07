import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page, BrowserContext } from 'playwright';
import type { SearchResult, SearchResponse } from './types';

// Configurar stealth plugin con todas las evasiones
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('chrome.loadTimes'); // Esta puede causar problemas
chromium.use(stealth);

export class UndetectedWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private isDebugMode = process.env.NODE_ENV === 'development';

  async initialize() {
    // Método simplificado - ahora cada búsqueda crea su propio browser
    console.log("✅ Undetected web search service ready (creates fresh browser per search)");
  }

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Siempre crear una nueva instancia del browser para cada búsqueda
    let localContext: BrowserContext | null = null;
    let localBrowser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Crear browser fresh para cada búsqueda
      const isProduction = process.env.NODE_ENV === 'production';
      const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      
      let executablePath: string | undefined = undefined;
      if (isProduction && systemChromium) {
        executablePath = systemChromium;
      }

      const userDataDir = '/tmp/chrome-user-data-' + Math.random().toString(36).substring(7);
      
      localContext = await chromium.launchPersistentContext(userDataDir, {
        headless: isProduction,
        executablePath,
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=AutomationControlled',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--enable-automation=false'
        ],
        extraHTTPHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      localBrowser = localContext.browser();

      // Inyectar scripts anti-detección
      await localContext.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
        
        window.chrome = {
          runtime: {
            connect: () => {},
            sendMessage: () => {}
          }
        };
        
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' }
          ]
        });
      });

      page = await localContext.newPage();

      // Pre-navigate to about:blank to set up the page
      await page.goto('about:blank');
      await page.waitForTimeout(500);

      // Simular comportamiento super humano
      await page.evaluate(() => {
        // Simular que el usuario ha estado navegando
        window.history.pushState({}, '', 'https://www.google.com/');
      });

      // Navegar a Google de forma más natural
      await page.goto('https://www.google.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Esperar que la página se estabilice
      await page.waitForTimeout(2000 + Math.random() * 1000);

      // Mover el mouse de forma natural
      await this.moveMouseNaturally(page);

      // Buscar el campo de búsqueda con múltiples selectores
      let searchBox;
      try {
        searchBox = await page.waitForSelector('textarea[name="q"]', { timeout: 5000 });
      } catch {
        searchBox = await page.waitForSelector('input[name="q"]', { timeout: 5000 });
      }

      // Hacer clic y esperar
      await searchBox.click();
      await page.waitForTimeout(300 + Math.random() * 200);

      // Escribir con velocidad variable y errores ocasionales
      await this.typeWithHumanBehavior(page, query);

      // Esperar antes de buscar
      await page.waitForTimeout(800 + Math.random() * 700);

      // Presionar Enter o hacer clic en buscar
      if (Math.random() > 0.5) {
        await page.keyboard.press('Enter');
      } else {
        const searchButton = await page.$('input[name="btnK"], button[name="btnK"]');
        if (searchButton) {
          await searchButton.click();
        } else {
          await page.keyboard.press('Enter');
        }
      }

      // Esperar navegación
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000 + Math.random() * 1000);

      // Verificar URL
      const url = page.url();
      console.log('📍 Current URL:', url);
      
      if (url.includes('/sorry/') || url.includes('captcha')) {
        console.log('🚫 Detected by Google - trying alternative approach');
        
        // Intentar usar la búsqueda directa con parámetros adicionales
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=us&hl=en&num=${numResults}&start=0`;
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        if (newUrl.includes('/sorry/') || newUrl.includes('captcha')) {
          throw new Error('Google blocked the request even with direct URL');
        }
      }

      // Extraer resultados con múltiples selectores
      const results = await page.evaluate((maxResults) => {
        const searchResults: any[] = [];
        
        // Intentar múltiples selectores
        const selectors = [
          '#search .g',
          '#rso .g',
          '[data-hveid] .g',
          '.srg .g',
          '[data-async-context] .g'
        ];
        
        let resultElements: NodeListOf<Element> | null = null;
        
        for (const selector of selectors) {
          resultElements = document.querySelectorAll(selector);
          if (resultElements && resultElements.length > 0) {
            console.log(`Found ${resultElements.length} results with selector: ${selector}`);
            break;
          }
        }
        
        if (!resultElements || resultElements.length === 0) {
          // Buscar cualquier elemento que parezca un resultado
          resultElements = document.querySelectorAll('[class*="g "], [class*="g-"]');
        }
        
        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const element = resultElements[i];
          
          // Buscar título con múltiples selectores
          const titleElement = element.querySelector('h3, [role="heading"], .LC20lb');
          const linkElement = element.querySelector('a[href]:not([href^="#"]):not([href^="javascript"])');
          const snippetElement = element.querySelector('.VwiC3b, .yXK7lf, [data-sncf], .st, .s');
          
          if (titleElement && linkElement) {
            const title = titleElement.textContent?.trim() || '';
            const url = (linkElement as HTMLAnchorElement).href;
            const snippet = snippetElement?.textContent?.trim() || '';
            
            // Filtrar resultados no válidos
            if (url && !url.includes('google.com') && !url.includes('googleusercontent.com')) {
              searchResults.push({
                title,
                url,
                snippet,
                content: snippet
              });
            }
          }
        }
        
        return searchResults;
      }, numResults);

      console.log(`✅ Found ${results.length} search results`);

      const response: SearchResponse = {
        query,
        results,
        timestamp: new Date().toISOString()
      };

      this.cache.set(query, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });

      return response;

    } catch (error) {
      console.error('❌ Error in undetected search:', error);
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Search failed'
      };
    } finally {
      // Limpieza completa
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
        if (localContext && !localContext.isDestroyed()) {
          await localContext.close();
        }
        if (localBrowser && localBrowser.isConnected()) {
          await localBrowser.close();
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  }

  private async moveMouseNaturally(page: Page) {
    const moves = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < moves; i++) {
      const x = 100 + Math.random() * 1720;
      const y = 100 + Math.random() * 880;
      await page.mouse.move(x, y, { steps: 10 });
      await page.waitForTimeout(100 + Math.random() * 200);
    }
  }

  private async typeWithHumanBehavior(page: Page, text: string) {
    for (let i = 0; i < text.length; i++) {
      await page.keyboard.type(text[i]);
      
      // Velocidad de escritura variable
      const baseDelay = 50 + Math.random() * 100;
      
      // Ocasionalmente pausas más largas (como si pensara)
      if (Math.random() < 0.1) {
        await page.waitForTimeout(baseDelay + 200 + Math.random() * 300);
      } else {
        await page.waitForTimeout(baseDelay);
      }
      
      // Muy ocasionalmente simular error y corrección
      if (Math.random() < 0.02 && i < text.length - 1) {
        await page.keyboard.type('a');
        await page.waitForTimeout(200);
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(100);
      }
    }
  }

  async close() {
    // Nada que cerrar - cada búsqueda maneja su propio browser
    console.log("✅ Undetected web search service closed");
  }
}

let serviceInstance: UndetectedWebSearchService | null = null;

export async function getUndetectedWebSearchService(): Promise<UndetectedWebSearchService> {
  if (!serviceInstance) {
    serviceInstance = new UndetectedWebSearchService();
    try {
      await serviceInstance.initialize();
    } catch (error) {
      console.error("Failed to initialize service:", error);
    }
  }
  return serviceInstance;
}

export async function cleanupUndetectedWebSearchService() {
  if (serviceInstance) {
    await serviceInstance.close();
    serviceInstance = null;
  }
}