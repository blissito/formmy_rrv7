import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'puppeteer';
import type { SearchResult, SearchResponse } from './types';

// Configurar stealth plugin
puppeteer.use(StealthPlugin());

export class PuppeteerWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private isDebugMode = process.env.NODE_ENV === 'development';

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async simulateHumanBehavior(page: Page) {
    // Simulate random mouse movements
    for (let i = 0; i < 3; i++) {
      const x = 100 + Math.random() * 1800;
      const y = 100 + Math.random() * 800;
      await page.mouse.move(x, y, { steps: 3 + Math.random() * 7 });
      await this.delay(100 + Math.random() * 200);
    }

    // Simulate random scroll
    await page.evaluate(() => {
      window.scrollTo({
        top: Math.random() * 300,
        behavior: 'smooth'
      });
    });

    await this.delay(500 + Math.random() * 1000);

    // Sometimes move mouse over common elements
    try {
      const elements = await page.$$('a, button, input');
      if (elements.length > 0) {
        const randomElement = elements[Math.floor(Math.random() * Math.min(elements.length, 3))];
        const box = await randomElement.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 5 });
          await this.delay(200 + Math.random() * 300);
        }
      }
    } catch (e) {
      // Ignore errors in simulation
    }
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
      console.log('🔍 Starting Puppeteer search for:', query);

      const isProduction = process.env.NODE_ENV === 'production';
      
      // Launch browser with advanced stealth configuration
      browser = await puppeteer.launch({
        headless: isProduction ? 'new' : false,
        executablePath: isProduction ? '/usr/bin/chromium-browser' : undefined,
        ignoreHTTPSErrors: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=site-per-process',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-features=OptimizationHints',
          '--disable-features=Translate',
          '--window-size=1920,1080',
          '--start-maximized',
          '--disable-features=UserAgentClientHint'
        ],
        defaultViewport: null // Let it use the actual window size
      });

      page = await browser.newPage();

      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      // Set realistic headers and user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // Set additional browser properties
      await page.evaluateOnNewDocument(() => {
        // Override the navigator.webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Mock chrome runtime
        window.chrome = {
          runtime: {},
        };
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Mock permissions
        Object.defineProperty(navigator, 'permissions', {
          get: () => ({
            query: () => Promise.resolve({ state: 'granted' }),
          }),
        });
      });

      // First, go to a different page to establish browsing history
      console.log('📍 Establishing browsing context...');
      await page.goto('https://www.wikipedia.org', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await this.delay(1000 + Math.random() * 2000);
      
      // Now navigate to Google as if we're browsing naturally
      console.log('📍 Navigating to Google...');
      await page.goto('https://www.google.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Simulate more human behavior after loading
      await this.simulateHumanBehavior(page);

      // Wait for page to load with variable delay
      await this.delay(3000 + Math.random() * 3000);

      // Wait for and interact with search box more naturally
      console.log('🔍 Looking for search box...');
      
      // Try to find the search box with different selectors
      let searchBox = null;
      try {
        await page.waitForSelector('textarea[name="q"]', { timeout: 5000 });
        searchBox = await page.$('textarea[name="q"]');
      } catch {
        try {
          await page.waitForSelector('input[name="q"]', { timeout: 5000 });
          searchBox = await page.$('input[name="q"]');
        } catch {
          throw new Error('Could not find search box');
        }
      }

      // Move mouse to search box naturally
      const box = await searchBox.boundingBox();
      if (box) {
        // Move to a point near the search box first
        await page.mouse.move(box.x - 50, box.y, { steps: 5 });
        await this.delay(200 + Math.random() * 300);
        
        // Then move to the search box
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 3 });
        await this.delay(300 + Math.random() * 200);
      }

      // Click the search box
      console.log('👆 Clicking search box...');
      await searchBox.click();
      await this.delay(500 + Math.random() * 500);

      // Type search query with more realistic human behavior
      console.log('⌨️ Typing search query...');
      for (let i = 0; i < query.length; i++) {
        const char = query[i];
        await page.keyboard.type(char);
        
        // Variable typing speed with occasional pauses
        let delay = 80 + Math.random() * 120; // 80-200ms per character
        
        // Occasionally pause longer (like thinking)
        if (Math.random() < 0.15) {
          delay += 200 + Math.random() * 500;
        }
        
        // Occasionally type multiple characters quickly (like muscle memory)
        if (Math.random() < 0.1 && i < query.length - 1) {
          delay = 30 + Math.random() * 50;
        }
        
        await this.delay(delay);
      }

      // Pause before submitting (like reviewing the query)
      await this.delay(1000 + Math.random() * 1500);

      // Submit the search - try multiple methods
      console.log('🔍 Submitting search...');
      try {
        // Try clicking the search button first
        const searchButton = await page.$('input[name="btnK"]');
        if (searchButton) {
          const buttonBox = await searchButton.boundingBox();
          if (buttonBox) {
            await page.mouse.move(buttonBox.x + buttonBox.width/2, buttonBox.y + buttonBox.height/2, { steps: 3 });
            await this.delay(200);
            await searchButton.click();
          } else {
            await page.keyboard.press('Enter');
          }
        } else {
          await page.keyboard.press('Enter');
        }
      } catch {
        await page.keyboard.press('Enter');
      }

      // Wait for results
      console.log('⏳ Waiting for search results...');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

      // Wait for results to load
      await this.delay(2000);

      // Check if blocked or has CAPTCHA
      const url = page.url();
      console.log('🔗 Current URL:', url);

      // Check for various blocking scenarios
      if (url.includes('/sorry/')) {
        console.log('🚫 Google blocked the request with sorry page');
        
        // Return empty results gracefully
        return {
          query,
          results: [],
          timestamp: new Date().toISOString(),
          error: 'Google blocked the request - too many automated queries detected'
        };
      }

      // Check for reCAPTCHA (including image selection type)
      const hasRecaptcha = await page.evaluate(() => {
        // Check for various CAPTCHA indicators
        const recaptchaIframe = document.querySelector('iframe[src*="recaptcha"]');
        const recaptchaDiv = document.querySelector('#recaptcha, .g-recaptcha');
        const captchaText = document.body.innerHTML.toLowerCase();
        
        // Check for image selection CAPTCHA specifically
        const imageSelection = captchaText.includes('select all images') || 
                              captchaText.includes('click on all images') ||
                              captchaText.includes('select all squares') ||
                              document.querySelector('[role="button"][tabindex="0"]') !== null;
        
        return recaptchaIframe !== null || 
               recaptchaDiv !== null || 
               captchaText.includes('recaptcha') ||
               captchaText.includes('captcha') ||
               imageSelection;
      });

      if (hasRecaptcha) {
        console.log('🧩 reCAPTCHA detected - attempting advanced bypass techniques...');
        
        // Try multiple bypass strategies
        const bypassResult = await this.attemptCaptchaBypass(page, query, numResults);
        if (bypassResult) {
          return bypassResult;
        }
      }

      // Extract results
      console.log('📊 Extracting search results...');
      const results = await page.evaluate((maxResults: number) => {
        const searchResults: any[] = [];
        
        // Try multiple selectors
        const selectors = [
          '#search .g',
          '#rso .g', 
          '.srg .g',
          '[data-hveid] .g'
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
          console.log('No results found with standard selectors');
          return [];
        }

        for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
          const element = resultElements[i];
          
          // Extract title
          const titleElement = element.querySelector('h3, [role="heading"]');
          const linkElement = element.querySelector('a[href]:not([href^="#"])');
          const snippetElement = element.querySelector('.VwiC3b, .yXK7lf, [data-sncf], .st');
          
          if (titleElement && linkElement) {
            const title = titleElement.textContent?.trim() || '';
            const url = (linkElement as HTMLAnchorElement).href;
            const snippet = snippetElement?.textContent?.trim() || '';
            
            // Filter out Google's own results
            if (url && !url.includes('google.com/search') && !url.includes('googleusercontent.com')) {
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

      // Cache results
      this.cache.set(query, {
        data: response,
        expires: Date.now() + this.cacheTimeout
      });

      return response;

    } catch (error) {
      console.error('❌ Error in Puppeteer search:', error);
      return {
        query,
        results: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Search failed'
      };
    } finally {
      // Clean up
      try {
        if (page) {
          await page.close();
        }
        if (browser) {
          await browser.close();
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  }

  private async attemptCaptchaBypass(page: Page, query: string, numResults: number): Promise<SearchResponse | null> {
    console.log('🔧 Attempting CAPTCHA bypass strategies...');
    
    // Strategy 1: Direct URL method with different parameters
    try {
      console.log('🚀 Strategy 1: Direct search URL with evasion parameters');
      
      const directSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${numResults}&safe=off&lr=lang_en&tbs=qdr:y&gl=us&hl=en&source=hp`;
      
      await page.goto(directSearchUrl, {
        waitUntil: 'networkidle0',
        timeout: 15000
      });
      
      await this.delay(3000);
      
      // Check if this worked
      const currentUrl = page.url();
      if (!currentUrl.includes('/sorry/') && !currentUrl.includes('captcha')) {
        console.log('✅ Strategy 1 success - extracting results');
        const results = await this.extractResults(page, numResults);
        if (results.length > 0) {
          return {
            query,
            results,
            timestamp: new Date().toISOString(),
            source: 'Google (Direct URL bypass)'
          };
        }
      }
    } catch (e) {
      console.log('❌ Strategy 1 failed');
    }
    
    // Strategy 2: New browser session with different fingerprint
    try {
      console.log('🚀 Strategy 2: Fresh session with altered fingerprint');
      
      // Close current page and create new one
      await page.close();
      const newPage = await (page.browser().newPage());
      
      // Set different fingerprint
      await newPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      await newPage.setViewport({ width: 1366, height: 768 }); // Different resolution
      
      // Add different browser properties
      await newPage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 4 // Different CPU cores
        });
        
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 4 // Different RAM
        });
        
        Object.defineProperty(navigator, 'platform', {
          get: () => 'MacIntel' // Different platform
        });
        
        // Different language
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'es']
        });
      });
      
      // Navigate differently - start from another Google service
      await newPage.goto('https://news.google.com', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await this.delay(2000 + Math.random() * 2000);
      
      // Navigate to main Google
      await newPage.goto('https://www.google.com', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await this.simulateHumanBehavior(newPage);
      
      // Try search again
      const result = await this.performSearchOnPage(newPage, query, numResults);
      if (result) {
        return result;
      }
      
    } catch (e) {
      console.log('❌ Strategy 2 failed');
    }
    
    // Strategy 3: Mobile user agent
    try {
      console.log('🚀 Strategy 3: Mobile user agent');
      
      const mobilePage = await page.browser().newPage();
      
      await mobilePage.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
      await mobilePage.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
      
      await mobilePage.goto('https://www.google.com', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await this.delay(2000);
      
      const result = await this.performSearchOnPage(mobilePage, query, numResults);
      if (result) {
        result.source = 'Google (Mobile bypass)';
        return result;
      }
      
    } catch (e) {
      console.log('❌ Strategy 3 failed');
    }
    
    // Strategy 4: Return to original approach with longer wait
    console.log('🚀 Strategy 4: Extended wait approach');
    try {
      // Wait much longer and try to proceed
      await this.delay(15000 + Math.random() * 10000);
      
      const finalCheck = await page.evaluate(() => {
        return !window.location.href.includes('/sorry/') && 
               document.querySelector('#search') !== null;
      });
      
      if (finalCheck) {
        console.log('✅ Extended wait worked - extracting results');
        const results = await this.extractResults(page, numResults);
        if (results.length > 0) {
          return {
            query,
            results,
            timestamp: new Date().toISOString(),
            source: 'Google (Extended wait)'
          };
        }
      }
      
    } catch (e) {
      console.log('❌ Strategy 4 failed');
    }
    
    console.log('❌ All bypass strategies failed');
    return null;
  }
  
  private async performSearchOnPage(page: Page, query: string, numResults: number): Promise<SearchResponse | null> {
    try {
      await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 10000 });
      
      const searchBox = await page.$('textarea[name="q"], input[name="q"]');
      if (!searchBox) return null;
      
      await searchBox.click();
      await this.delay(500);
      
      // Type query
      for (const char of query) {
        await page.keyboard.type(char);
        await this.delay(50 + Math.random() * 100);
      }
      
      await this.delay(1000);
      await page.keyboard.press('Enter');
      
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      
      const url = page.url();
      if (url.includes('/sorry/') || url.includes('captcha')) {
        return null;
      }
      
      const results = await this.extractResults(page, numResults);
      if (results.length > 0) {
        return {
          query,
          results,
          timestamp: new Date().toISOString(),
          source: 'Google'
        };
      }
      
    } catch (e) {
      return null;
    }
    
    return null;
  }
  
  private async extractResults(page: Page, numResults: number): Promise<any[]> {
    return await page.evaluate((maxResults: number) => {
      const searchResults: any[] = [];
      
      const selectors = [
        '#search .g',
        '#rso .g', 
        '.srg .g',
        '[data-hveid] .g'
      ];

      let resultElements: NodeListOf<Element> | null = null;
      
      for (const selector of selectors) {
        resultElements = document.querySelectorAll(selector);
        if (resultElements && resultElements.length > 0) {
          break;
        }
      }

      if (!resultElements || resultElements.length === 0) {
        return [];
      }

      for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
        const element = resultElements[i];
        
        const titleElement = element.querySelector('h3, [role="heading"]');
        const linkElement = element.querySelector('a[href]:not([href^="#"])');
        const snippetElement = element.querySelector('.VwiC3b, .yXK7lf, [data-sncf], .st');
        
        if (titleElement && linkElement) {
          const title = titleElement.textContent?.trim() || '';
          const url = (linkElement as HTMLAnchorElement).href;
          const snippet = snippetElement?.textContent?.trim() || '';
          
          if (url && !url.includes('google.com/search') && !url.includes('googleusercontent.com')) {
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
  }

  async close() {
    // Nothing to close - each search handles its own browser
    console.log('✅ Puppeteer web search service closed');
  }
}

let serviceInstance: PuppeteerWebSearchService | null = null;

export async function getPuppeteerWebSearchService(): Promise<PuppeteerWebSearchService> {
  if (!serviceInstance) {
    serviceInstance = new PuppeteerWebSearchService();
    console.log("✅ Puppeteer web search service initialized");
  }
  return serviceInstance;
}

export async function cleanupPuppeteerWebSearchService() {
  if (serviceInstance) {
    await serviceInstance.close();
    serviceInstance = null;
  }
}