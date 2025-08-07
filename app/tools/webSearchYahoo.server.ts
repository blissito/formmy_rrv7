import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';
import type { SearchResult, SearchResponse } from './types';

// Configurar stealth plugin
puppeteer.use(StealthPlugin());

export class YahooWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private isDebugMode = process.env.NODE_ENV === 'development';

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateHumanBehavior(page: Page) {
    // Simulate random mouse movements
    for (let i = 0; i < 2; i++) {
      const x = 100 + Math.random() * 1600;
      const y = 100 + Math.random() * 600;
      await page.mouse.move(x, y, { steps: 3 + Math.random() * 5 });
      await this.delay(100 + Math.random() * 200);
    }

    // Simulate random scroll
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
      console.log('🔍 Starting Yahoo search for:', query);

      const isProduction = process.env.NODE_ENV === 'production';
      
      // Determine executable path for production
      let executablePath: string | undefined = undefined;
      if (isProduction) {
        executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
        console.log('🐳 Production: Using Chromium at', executablePath);
      } else {
        console.log('💻 Development: Using bundled Puppeteer Chromium');
      }
      
      // Launch browser with stealth (always headless to avoid interrupting user)
      browser = await puppeteer.launch({
        headless: 'new', // Always headless
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=site-per-process',
          '--disable-web-security',
          '--no-first-run',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--window-size=1920,1080'
        ],
        defaultViewport: null
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

      // Navigate to Yahoo Search
      console.log('📍 Navigating to Yahoo Search...');
      await page.goto('https://search.yahoo.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Simulate human behavior
      await this.simulateHumanBehavior(page);
      await this.delay(1000 + Math.random() * 2000);

      // Find search box
      console.log('🔍 Looking for Yahoo search box...');
      await page.waitForSelector('input[name="p"], #yschsp', { timeout: 10000 });

      let searchBox = await page.$('input[name="p"]');
      if (!searchBox) {
        searchBox = await page.$('#yschsp');
      }

      if (!searchBox) {
        throw new Error('Could not find Yahoo search box');
      }

      // Move mouse to search box naturally
      const box = await searchBox.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 3 });
        await this.delay(200 + Math.random() * 300);
      }

      // Click the search box
      console.log('👆 Clicking Yahoo search box...');
      await searchBox.click();
      await this.delay(300 + Math.random() * 300);

      // Clear any existing text
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await this.delay(100);

      // Type search query with human-like behavior
      console.log('⌨️ Typing search query...');
      for (let i = 0; i < query.length; i++) {
        const char = query[i];
        await page.keyboard.type(char);
        
        // Variable typing speed
        let delay = 60 + Math.random() * 120; // 60-180ms per character
        
        // Occasionally pause longer (like thinking)
        if (Math.random() < 0.1) {
          delay += 200 + Math.random() * 400;
        }
        
        await this.delay(delay);
      }

      // Pause before submitting
      await this.delay(500 + Math.random() * 1000);

      // Submit the search
      console.log('🔍 Submitting Yahoo search...');
      await page.keyboard.press('Enter');

      // Wait for results
      console.log('⏳ Waiting for Yahoo search results...');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
      await this.delay(2000);

      // Check URL and extract results
      const url = page.url();
      console.log('🔗 Current URL:', url);

      // Yahoo rarely blocks, but check just in case
      if (url.includes('captcha') || url.includes('blocked')) {
        console.log('⚠️ Yahoo search was blocked (rare)');
        return {
          query,
          results: [],
          timestamp: new Date().toISOString(),
          error: 'Yahoo search temporarily blocked'
        };
      }

      // Extract results from Yahoo
      console.log('📊 Extracting Yahoo search results...');
      const results = await page.evaluate((maxResults: number) => {
        const searchResults: any[] = [];
        
        // Yahoo result selectors
        const selectors = [
          '.algo',
          '.dd.algo',
          '.result',
          '.Sr',
          '[data-bm]'
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
          console.log('No Yahoo results found with standard selectors, trying broader search');
          // Try broader selectors
          resultElements = document.querySelectorAll('div[class*="algo"], div[class*="result"], li[class*="result"]');
        }

        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const element = resultElements[i];
          
          // Extract title and link
          const titleElement = element.querySelector('h3 a, .title a, a h3, .d-ib a');
          const snippetElement = element.querySelector('.compText, p, .abs, .d-ib + div');
          
          if (titleElement) {
            const title = titleElement.textContent?.trim() || '';
            const url = (titleElement as HTMLAnchorElement).href;
            const snippet = snippetElement?.textContent?.trim() || '';
            
            // Filter out Yahoo's own results and ads
            if (url && title && 
                !url.includes('yahoo.com/search') && 
                !url.includes('r.search.yahoo.com') && 
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

      console.log(`✅ Yahoo found ${results.length} results`);

      const response: SearchResponse = {
        query,
        results,
        timestamp: new Date().toISOString(),
        source: 'Yahoo'
      };

      // Cache results
      this.cache.set(query, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });

      return response;

    } catch (error) {
      console.error('❌ Error in Yahoo search:', error);
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Yahoo search failed'
      };
    } finally {
      // Clean up
      try {
        if (page) await page.close();
        if (browser) await browser.close();
      } catch (cleanupError) {
        console.error('Error during Yahoo cleanup:', cleanupError);
      }
    }
  }

  async close() {
    console.log('✅ Yahoo web search service closed');
  }
}

let serviceInstance: YahooWebSearchService | null = null;

export async function getYahooWebSearchService(): Promise<YahooWebSearchService> {
  if (!serviceInstance) {
    serviceInstance = new YahooWebSearchService();
    console.log("✅ Yahoo web search service initialized");
  }
  return serviceInstance;
}

export async function cleanupYahooWebSearchService() {
  if (serviceInstance) {
    await serviceInstance.close();
    serviceInstance = null;
  }
}