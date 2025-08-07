import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page, BrowserContext } from 'playwright';
import type { SearchResult, SearchResponse } from './types';

// Configurar stealth plugin
chromium.use(StealthPlugin());

export class StealthWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private initializationAttempts = 0;
  private maxInitAttempts = 3;
  private isDebugMode = process.env.NODE_ENV === 'development';

  async initialize() {
    if (!this.browser) {
      this.initializationAttempts++;
      if (this.initializationAttempts > this.maxInitAttempts) {
        throw new Error(`Failed to initialize browser after ${this.maxInitAttempts} attempts`);
      }
      
      console.log(`🔄 Stealth browser initialization attempt ${this.initializationAttempts}/${this.maxInitAttempts}`);
      
      const isProduction = process.env.NODE_ENV === 'production';
      const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      
      let executablePath: string | undefined = undefined;
      
      if (isProduction && systemChromium) {
        executablePath = systemChromium;
        console.log("🐳 Using system Chromium with stealth in production:", executablePath);
      } else {
        console.log("💻 Using Playwright bundled Chromium with stealth in development");
      }
      
      try {
        // Lanzar browser con configuración stealth
        this.browser = await chromium.launch({
          headless: true, // Stealth funciona mejor con headless
          executablePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--start-maximized'
          ]
        });

        // Crear contexto con configuración realista
        this.context = await this.browser.newContext({
          viewport: { width: 1920, height: 1080 },
          userAgent: this.getRandomUserAgent(),
          locale: 'es-ES',
          timezoneId: 'America/Mexico_City',
          geolocation: { latitude: 19.4326, longitude: -99.1332 },
          permissions: ['geolocation'],
          extraHTTPHeaders: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
          }
        });

        // Añadir cookies realistas
        await this.context.addCookies([
          {
            name: 'NID',
            value: this.generateRandomCookieValue(),
            domain: '.google.com',
            path: '/',
            expires: Date.now() / 1000 + 7776000,
            httpOnly: true,
            secure: true,
            sameSite: 'None'
          },
          {
            name: 'SID',
            value: this.generateRandomCookieValue(),
            domain: '.google.com',
            path: '/',
            expires: Date.now() / 1000 + 7776000,
            httpOnly: false,
            secure: true,
            sameSite: 'None'
          }
        ]);

        this.browser.on('disconnected', () => {
          console.log("❌ Stealth browser disconnected unexpectedly!");
          this.browser = null;
          this.context = null;
        });

        this.initializationAttempts = 0;
        console.log("✅ Stealth browser launched successfully");
        
      } catch (launchError) {
        console.error("❌ Failed to launch stealth browser:", launchError);
        this.browser = null;
        this.context = null;
        throw new Error(`Stealth browser launch failed: ${launchError instanceof Error ? launchError.message : 'Unknown error'}`);
      }
    }
  }

  private generateRandomCookieValue(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < 128; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private getRandomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    // Check cache first
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Initialize if needed
    if (!this.browser || !this.context) {
      console.log("⚠️ Stealth browser not initialized - attempting lazy initialization...");
      try {
        await this.initialize();
      } catch (initError) {
        console.error("❌ Failed to initialize stealth browser during search:", initError);
        return {
          query,
          results: [],
          timestamp: new Date().toISOString(),
          error: "Search service initialization failed"
        };
      }
    }

    if (!this.browser || !this.context) {
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        error: "Search service unavailable"
      };
    }

    let page: Page | null = null;

    try {
      page = await this.context.newPage();

      // Simular comportamiento humano más realista
      await this.simulateHumanBehavior(page);

      // Navegar primero a Google home
      await page.goto('https://www.google.com', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Esperar un poco como haría un humano
      await this.humanDelay(2000, 4000);

      // Buscar el campo de búsqueda y hacer clic
      const searchBox = await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 10000 });
      await searchBox.click();
      
      // Escribir la búsqueda letra por letra con delays humanos
      for (const char of query) {
        await page.keyboard.type(char);
        await this.humanDelay(50, 150);
      }

      // Simular pensar antes de presionar Enter
      await this.humanDelay(500, 1000);
      
      // Presionar Enter
      await page.keyboard.press('Enter');

      // Esperar que carguen los resultados
      await page.waitForSelector('#search', { timeout: 15000 });
      await this.humanDelay(1500, 2500);

      // Verificar si fuimos bloqueados
      const url = page.url();
      if (url.includes('/sorry/') || url.includes('captcha')) {
        console.log('🚫 Google detectó actividad inusual');
        throw new Error('Google blocked request');
      }

      // Extraer resultados
      const results = await page.evaluate((maxResults) => {
        const searchResults: any[] = [];
        
        // Buscar todos los resultados orgánicos
        const resultElements = document.querySelectorAll('#search .g');
        
        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const element = resultElements[i];
          
          // Título y URL
          const titleElement = element.querySelector('h3');
          const linkElement = element.querySelector('a[href]');
          
          // Snippet
          const snippetElement = element.querySelector('[data-sncf="1"], [data-sncf="2"], .VwiC3b, .yXK7lf');
          
          if (titleElement && linkElement) {
            const title = titleElement.textContent?.trim() || '';
            const url = (linkElement as HTMLAnchorElement).href;
            const snippet = snippetElement?.textContent?.trim() || '';
            
            searchResults.push({
              title,
              url,
              snippet,
              content: snippet
            });
          }
        }
        
        return searchResults;
      }, numResults);

      const response: SearchResponse = {
        query,
        results,
        timestamp: new Date().toISOString()
      };

      // Cache the results
      this.cache.set(query, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });

      return response;

    } catch (error) {
      console.error('❌ Error en búsqueda stealth:', error);
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Search failed'
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async simulateHumanBehavior(page: Page) {
    // Simular movimientos de mouse aleatorios
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * 1920);
      const y = Math.floor(Math.random() * 1080);
      await page.mouse.move(x, y);
      await this.humanDelay(100, 300);
    }

    // Simular scroll suave
    await page.evaluate(() => {
      window.scrollTo({
        top: Math.random() * 200,
        behavior: 'smooth'
      });
    });
  }

  private async humanDelay(min: number, max: number) {
    const delay = min + Math.random() * (max - min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance
let stealthServiceInstance: StealthWebSearchService | null = null;

export async function getStealthWebSearchService(): Promise<StealthWebSearchService> {
  if (!stealthServiceInstance) {
    stealthServiceInstance = new StealthWebSearchService();
    try {
      await stealthServiceInstance.initialize();
      console.log("✅ Stealth web search service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize stealth web search service:", error);
    }
  }
  return stealthServiceInstance;
}

export async function cleanupStealthWebSearchService() {
  if (stealthServiceInstance) {
    await stealthServiceInstance.close();
    stealthServiceInstance = null;
  }
}