import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';
import type { SearchResult, SearchResponse } from './types';

// Configurar stealth plugin
puppeteer.use(StealthPlugin());

export class BingWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private isDebugMode = process.env.NODE_ENV === 'development';

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateHumanBehavior(page: Page) {
    // Versión más rápida para producción
    if (process.env.NODE_ENV === 'production') {
      await this.delay(100);
      return;
    }
    
    // Simulación completa solo en desarrollo
    for (let i = 0; i < 2; i++) {
      const x = 100 + Math.random() * 1600;
      const y = 100 + Math.random() * 600;
      await page.mouse.move(x, y, { steps: 3 + Math.random() * 5 });
      await this.delay(100 + Math.random() * 200);
    }

    await page.evaluate(() => {
      window.scrollTo({
        top: Math.random() * 200,
        behavior: 'smooth'
      });
    });

    await this.delay(300 + Math.random() * 500);
  }

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    // Check cache
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      console.log('🔍 Starting Bing search for:', query);

      const isProduction = process.env.NODE_ENV === 'production';
      
      // Determine executable path for production
      let executablePath: string | undefined = undefined;
      if (isProduction) {
        executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
        console.log('🐳 Production: Using Chromium at', executablePath);
      } else {
        console.log('💻 Development: Using bundled Puppeteer Chromium');
      }
      
      // Launch browser with container-optimized settings
      const browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--no-first-run',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--window-size=1920,1080'
      ];
      
      // Configuración adicional para contenedores en producción
      if (isProduction) {
        browserArgs.push(
          '--single-process',
          '--no-zygote',
          '--disable-extensions',
          '--disable-default-apps',
          '--disable-background-networking',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--disable-client-side-phishing-detection',
          '--disable-hang-monitor',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-domain-reliability',
          '--disable-features=VizDisplayCompositor',
          '--run-all-compositor-stages-before-draw',
          '--disable-threaded-animation',
          '--disable-threaded-scrolling',
          '--disable-checker-imaging',
          '--disable-image-animation-resync',
          '--disable-partial-raster',
          '--use-gl=swiftshader'
        );
      }
      
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath,
        args: browserArgs,
        defaultViewport: null,
        timeout: 30000, // Timeout más largo para contenedores
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
      });

      page = await browser.newPage();

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // Set additional browser properties
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        window.chrome = {
          runtime: {},
        };
        
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' }
          ],
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'es'],
        });
      });

      // Navigate to Bing Search
      console.log('📍 Navigating to Bing Search...');
      await page.goto('https://www.bing.com', {
        waitUntil: 'domcontentloaded', // Más rápido que networkidle2
        timeout: 10000
      });

      // Simulate human behavior (rápido en producción)
      await this.simulateHumanBehavior(page);
      await this.delay(process.env.NODE_ENV === 'production' ? 200 : 1000 + Math.random() * 2000);

      // Find search box
      console.log('🔍 Looking for Bing search box...');
      await page.waitForSelector('#sb_form_q', { timeout: 10000 });

      const searchBox = await page.$('#sb_form_q');
      if (!searchBox) {
        throw new Error('Could not find Bing search box');
      }

      // Move mouse to search box naturally
      const box = await searchBox.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 3 });
        await this.delay(200 + Math.random() * 300);
      }

      // Click the search box
      console.log('👆 Clicking Bing search box...');
      await searchBox.click();
      await this.delay(300 + Math.random() * 300);

      // Clear any existing text
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await this.delay(100);

      // Type search query (rápido en producción)
      console.log('⌨️ Typing search query...');
      if (process.env.NODE_ENV === 'production') {
        // En producción, escribir todo de una vez
        await page.keyboard.type(query, { delay: 20 });
      } else {
        // En desarrollo, simular comportamiento humano
        for (let i = 0; i < query.length; i++) {
          const char = query[i];
          await page.keyboard.type(char);
          
          let delay = 60 + Math.random() * 120;
          
          if (Math.random() < 0.1) {
            delay += 200 + Math.random() * 400;
          }
          
          await this.delay(delay);
        }
      }

      // Pause before submitting (más corto en producción)
      await this.delay(process.env.NODE_ENV === 'production' ? 100 : 500 + Math.random() * 1000);

      // Submit the search
      console.log('🔍 Submitting Bing search...');
      await page.keyboard.press('Enter');

      // Wait for results (optimizado)
      console.log('⏳ Waiting for Bing search results...');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
      await this.delay(process.env.NODE_ENV === 'production' ? 500 : 2000);

      // Check URL and extract results
      const url = page.url();
      console.log('🔗 Current URL:', url);

      // Bing rarely blocks, but check just in case
      if (url.includes('captcha') || url.includes('blocked')) {
        console.log('⚠️ Bing search was blocked (rare)');
        return {
          query,
          results: [],
          timestamp: new Date()
        };
      }

      // Extract results from Bing
      console.log('📊 Extracting Bing search results...');
      const results = await page.evaluate((maxResults: number) => {
        const searchResults: any[] = [];
        
        // Bing result selectors
        const selectors = [
          '.b_algo',
          '.b_result',
          '.b_ans',
          '.algo'
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
          console.log('No Bing results found with standard selectors, trying broader search');
          // Try broader selectors
          resultElements = document.querySelectorAll('li[class*="algo"], li[class*="result"], div[class*="result"]');
        }

        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const element = resultElements[i];
          
          // Extract title and link
          const titleElement = element.querySelector('h2 a, h3 a, .b_algoheader a');
          const snippetElement = element.querySelector('.b_caption p, .b_dList, .b_snippet');
          
          if (titleElement) {
            const title = titleElement.textContent?.trim() || '';
            const url = (titleElement as HTMLAnchorElement).href;
            const snippet = snippetElement?.textContent?.trim() || '';
            
            // Filter out Bing's own results and ads
            if (url && title && 
                !url.includes('bing.com/search') && 
                !url.includes('microsoft.com') && 
                !url.includes('sponsored') &&
                !url.startsWith('javascript:')) {
              
              searchResults.push({
                title: title.replace(/\s+/g, ' '),
                url: url.startsWith('http') ? url : `https:${url}`,
                snippet: snippet.replace(/\s+/g, ' ').substring(0, 300),
                content: snippet.replace(/\s+/g, ' ').substring(0, 300)
              });
            }
          }
        }
        
        return searchResults;
      }, numResults);

      console.log(`✅ Bing found ${results.length} results`);

      const response: SearchResponse = {
        query,
        results,
        timestamp: new Date()
      };

      // Cache results
      this.cache.set(query, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });

      return response;

    } catch (error) {
      console.error('❌ Error in Bing search:', error);
      return {
        query,
        results: [],
        timestamp: new Date()
      };
    } finally {
      // Clean up
      try {
        if (page) await page.close();
        if (browser) await browser.close();
      } catch (cleanupError) {
        console.error('Error during Bing cleanup:', cleanupError);
      }
    }
  }

  async close() {
    console.log('✅ Bing web search service closed');
  }
}

let serviceInstance: BingWebSearchService | null = null;

export async function getBingWebSearchService(): Promise<BingWebSearchService> {
  if (!serviceInstance) {
    serviceInstance = new BingWebSearchService();
    console.log("✅ Bing web search service initialized");
  }
  return serviceInstance;
}

export async function cleanupBingWebSearchService() {
  if (serviceInstance) {
    await serviceInstance.close();
    serviceInstance = null;
  }
}