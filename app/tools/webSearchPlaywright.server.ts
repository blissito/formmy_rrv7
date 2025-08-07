import { chromium, type Browser, type Page } from 'playwright';
import type { SearchResult, SearchResponse } from './types';

export class PlaywrightWebSearchService {
  private cache = new Map<string, { data: SearchResponse; expires: number }>();
  private cacheTimeout = 15 * 60 * 1000;
  private browser: Browser | null = null;
  private contexts: any[] = [];
  private maxConcurrentSearches = 3;
  private searchQueue: Array<{resolve: Function, reject: Function, query: string, numResults: number}> = [];
  private activeSearch = 0;
  private lastRequestTime = 0;
  private minRequestInterval = 5000; // 5 segundos entre requests para evitar rate limiting
  private isDebugMode = process.env.NODE_ENV === 'development';
  private initializationAttempts = 0;
  private maxInitAttempts = 3;

  async initialize() {
    if (!this.browser) {
      this.initializationAttempts++;
      if (this.initializationAttempts > this.maxInitAttempts) {
        throw new Error(`Failed to initialize browser after ${this.maxInitAttempts} attempts`);
      }
      
      console.log(`🔄 Browser initialization attempt ${this.initializationAttempts}/${this.maxInitAttempts}`);
      
      // Detectar entorno y configurar executable path apropiado
      const isProduction = process.env.NODE_ENV === 'production';
      const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
      
      let executablePath: string | undefined = undefined;
      
      if (isProduction && systemChromium) {
        // En producción, usar Chromium del sistema
        executablePath = systemChromium;
        console.log("🐳 Using system Chromium in production:", executablePath);
      } else {
        // En desarrollo, dejar que Playwright use sus propios binaries
        console.log("💻 Using Playwright bundled Chromium in development");
      }
      
      try {
        this.browser = await chromium.launch({
          headless: true,
          executablePath,
          timeout: 30000, // 30 segundos timeout para launch
        args: isProduction ? [
          // Args minimalistas para producción estable
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', 
          '--single-process',
          '--disable-gpu',
          '--headless',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ] : [
          // Args completos para desarrollo
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ]
      });

      // Añadir listeners para debug
      this.browser.on('disconnected', () => {
        console.log("❌ Browser disconnected unexpectedly!");
        this.browser = null;
        this.contexts = [];
      });

        // Reset counter en inicialización exitosa
        this.initializationAttempts = 0;
        
        if (this.isDebugMode || isProduction) {
          console.log(`✅ Browser launched successfully (PID: ${this.browser.process()?.pid})`);
        }
      } catch (launchError) {
        console.error("❌ Failed to launch browser:", launchError);
        this.browser = null;
        throw new Error(`Browser launch failed: ${launchError instanceof Error ? launchError.message : 'Unknown error'}`);
      }

      // Crear pool de contextos aislados
      for (let i = 0; i < this.maxConcurrentSearches; i++) {
        const context = await this.browser.newContext({
          userAgent: this.getRandomUserAgent(),
          viewport: { width: 1920, height: 1080 },
          locale: 'es-ES',
          timezoneId: 'America/Mexico_City',
          extraHTTPHeaders: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
        });

        // Configurar para parecer más humano
        await context.addInitScript(() => {
          // Override navigator.webdriver
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
          
          // Override plugins array
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
          
          // Override languages
          Object.defineProperty(navigator, 'languages', {
            get: () => ['es-ES', 'es', 'en-US', 'en'],
          });
          
          // Override chrome object
          (window as any).chrome = {
            runtime: {},
          };
        });

        this.contexts.push({ context, inUse: false });
      }
    }
  }

  private getRandomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async search(query: string, numResults: number = 5): Promise<SearchResponse> {
    // Verificar si el browser está inicializado
    if (!this.browser) {
      console.log("⚠️ Browser not initialized - search will fail gracefully");
      throw new Error("Playwright browser not available - browser binaries might not be installed");
    }
    
    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    await this.initialize();

    // Rate limiting
    await this.rateLimit();

    // Queue management
    return new Promise((resolve, reject) => {
      this.searchQueue.push({ resolve, reject, query, numResults });
      this.processQueue();
    });
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async processQueue(): Promise<void> {
    if (this.searchQueue.length === 0 || this.activeSearch >= this.maxConcurrentSearches) {
      return;
    }

    const { resolve, reject, query, numResults } = this.searchQueue.shift()!;
    this.activeSearch++;

    try {
      const result = await this.performSearchWithRetry(query, numResults);
      this.cache.set(query, {
        data: result,
        expires: Date.now() + this.cacheTimeout,
      });
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeSearch--;
      // Process next in queue
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private async performSearchWithRetry(query: string, numResults: number, retries: number = 2): Promise<SearchResponse> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.performSearch(query, numResults);
        if (result.results.length > 0) {
          return result;
        }
        if (attempt < retries) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        const backoffTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    
    return { query, timestamp: new Date(), results: [] };
  }

  private async performSearch(query: string, numResults: number): Promise<SearchResponse> {
    let page: Page | null = null;
    let contextWrapper: any = null;
    
    try {
      // Verificar y reinicializar browser si es necesario
      if (!this.browser || !this.browser.isConnected()) {
        console.log("🔄 Browser not available, reinitializing...");
        this.browser = null;
        this.contexts = [];
        await this.initialize();
      }
      
      // En producción, crear context fresh para evitar problemas de lifecycle
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        console.log("🐳 Creating fresh context for production search...");
        const context = await this.browser!.newContext({
          userAgent: this.getRandomUserAgent(),
          viewport: { width: 1920, height: 1080 },
          locale: 'es-ES',
          timezoneId: 'America/Mexico_City',
          extraHTTPHeaders: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
        });
        
        await context.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
          Object.defineProperty(navigator, 'languages', {
            get: () => ['es-ES', 'es', 'en-US', 'en'],
          });
          (window as any).chrome = {
            runtime: {},
          };
        });
        
        contextWrapper = { context, inUse: true };
        page = await context.newPage();
      } else {
        // En desarrollo, usar pool de contexts
        contextWrapper = this.contexts.find(ctx => !ctx.inUse);
        if (!contextWrapper) {
          throw new Error('No available contexts in pool');
        }
        
        contextWrapper.inUse = true;
        
        // Verificar que el context sigue válido
        if (contextWrapper.context.isDestroyed()) {
          console.log("⚠️ Context was destroyed, recreating...");
          contextWrapper.context = await this.browser!.newContext({
            userAgent: this.getRandomUserAgent(),
            viewport: { width: 1920, height: 1080 },
            locale: 'es-ES',
            timezoneId: 'America/Mexico_City',
            extraHTTPHeaders: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
              'Accept-Encoding': 'gzip, deflate',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
            },
          });
          
          await contextWrapper.context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined,
            });
            Object.defineProperty(navigator, 'plugins', {
              get: () => [1, 2, 3, 4, 5],
            });
            Object.defineProperty(navigator, 'languages', {
              get: () => ['es-ES', 'es', 'en-US', 'en'],
            });
            (window as any).chrome = {
              runtime: {},
            };
          });
        }
        
        page = await contextWrapper.context.newPage();
      }

      // Anti-detección: remover webdriver properties
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Mock chrome object
        (window as any).chrome = {
          runtime: {},
        };
        
        // Mock permissions
        Object.defineProperty(navigator, 'permissions', {
          get: () => ({
            query: () => Promise.resolve({ state: 'granted' }),
          }),
        });
        
        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });
      
      // Set timeouts más cortos para producción
      // const isProduction = process.env.NODE_ENV === 'production';
      const navTimeout = isProduction ? 8000 : 15000;
      const waitTimeout = isProduction ? 1000 : 2000;
      
      // Primero ir a Google.com para establecer cookies
      await page.goto('https://www.google.com', {
        waitUntil: 'domcontentloaded',
        timeout: navTimeout
      });

      // Delay más corto en producción
      await page.waitForTimeout(waitTimeout + Math.random() * waitTimeout);

      // Simular actividad humana - hacer clic en algún elemento si existe
      try {
        await page.evaluate(() => {
          // Mover el mouse aleatoriamente
          const event = new MouseEvent('mousemove', {
            clientX: Math.random() * 1000,
            clientY: Math.random() * 600,
            bubbles: true
          });
          document.dispatchEvent(event);
        });
      } catch (e) {
        // Ignorar errores de simulación de mouse
      }

      await page.waitForTimeout(500 + Math.random() * 500);

      // Luego hacer la búsqueda de forma más gradual con parámetros adicionales
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=es&sei=${Math.random().toString(36).substring(2, 15)}`, {
        waitUntil: 'domcontentloaded',
        timeout: navTimeout
      });

      if (this.isDebugMode) {
        console.log('🌐 Página de Google cargada, buscando resultados...');
      }

      // Esperar un poco más y probar múltiples selectores
      await page.waitForTimeout(2000);
      
      // Debug: capturar título y URL para verificar que llegamos
      const title = await page.title();
      const url = page.url();
      
      if (this.isDebugMode) {
        console.log(`📄 Título: ${title}`);
        console.log(`🔗 URL: ${url}`);
      }
      
      // Verificar si Google nos está bloqueando
      const isBlocked = await page.evaluate(() => {
        const html = document.body.innerHTML.toLowerCase();
        const title = document.title.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        return html.includes('captcha') || 
               html.includes('blocked') ||
               title.includes('blocked') ||
               url.includes('/sorry/') ||
               html.includes('unusual traffic') ||
               html.includes('not a robot');
      });
      
      if (isBlocked) {
        if (this.isDebugMode) {
          console.log('🚫 Google detectó bot - página bloqueada');
        }
        throw new Error('Google blocked request');
      }

      const results = await page.evaluate((maxResults) => {
        const searchResults: any[] = [];
        
        // Debug: mostrar algunos elementos del DOM para entender la estructura
        console.log('🔍 Analizando DOM...');
        const bodyClasses = document.body.className;
        const searchContainer = document.querySelector('#search');
        console.log(`📦 Body classes: ${bodyClasses}`);
        console.log(`📦 #search existe: ${!!searchContainer}`);
        
        // Selectores actualizados 2025
        const selectors = [
          'div[data-ved] h3',     // Títulos con data-ved
          '.g h3',                // Tradicional
          '.tF2Cxc h3',          // Nuevo formato
          '.MjjYud h3',          // Otro formato reciente
          'div[jscontroller] h3', // Con JS controller
          '[role="heading"]',     // Semantic heading
          'h3 a',                // Cualquier h3 con link
        ];
        
        // Buscar títulos primero
        let titleElements: NodeListOf<Element> = document.querySelectorAll('h3');
        let selectorUsed = 'h3 (fallback)';
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length >= 3) { // Al menos 3 resultados
            titleElements = elements;
            selectorUsed = selector;
            break;
          }
        }
        
        console.log(`📊 Selector usado: ${selectorUsed}`);
        console.log(`📊 Títulos encontrados: ${titleElements.length}`);
        
        // Debug: mostrar primeros títulos encontrados
        if (titleElements.length > 0) {
          Array.from(titleElements).slice(0, 3).forEach((el, i) => {
            console.log(`📝 Título ${i+1}: ${el.textContent?.substring(0, 50)}...`);
          });
        } else {
          // Si no hay títulos, mostrar estructura general
          const allH3 = document.querySelectorAll('h3');
          const allDivs = document.querySelectorAll('div[data-ved]');
          console.log(`🔍 H3 totales: ${allH3.length}`);
          console.log(`🔍 Divs con data-ved: ${allDivs.length}`);
          
          // Mostrar muestra del HTML
          const sample = document.querySelector('#search')?.innerHTML?.substring(0, 1000) || 
                        document.body.innerHTML.substring(0, 1000);
          console.log('🔍 HTML muestra:', sample);
        }
        
        // Procesar los títulos encontrados
        for (let i = 0; i < Math.min(titleElements.length, maxResults); i++) {
          const titleElement = titleElements[i];
          
          // Buscar el enlace desde el título hacia arriba y abajo
          const linkElement = titleElement.querySelector('a') ||
                             titleElement.closest('a') ||
                             titleElement.parentElement?.querySelector('a') ||
                             titleElement.parentElement?.parentElement?.querySelector('a');
          
          if (!linkElement) continue;
          
          const url = linkElement.getAttribute('href') || linkElement.href;
          const title = titleElement.textContent || linkElement.textContent || '';
          
          // Buscar snippet cerca del título
          const container = titleElement.closest('div[data-ved]') || 
                          titleElement.closest('.g') || 
                          titleElement.closest('.tF2Cxc') ||
                          titleElement.parentElement?.parentElement;
          
          const snippetElement = container?.querySelector('.VwiC3b, .IsZvec, .s3v9rd, .X5LH0c, .lEBKkf, span[data-ved]') ||
                                container?.querySelector('span:not([class])') ||
                                container?.querySelector('div:last-child span');
          
          const snippet = snippetElement?.textContent || '';
          
          console.log(`🔗 Procesando: "${title?.substring(0, 30)}..." -> ${url?.substring(0, 50)}...`);
          
          // Validar URL
          if (url && !url.includes('google.com') && !url.includes('googleusercontent.com')) {
            let finalUrl = url;
            
            // Limpiar URL de Google redirect
            if (url.startsWith('/url?q=')) {
              const urlMatch = url.match(/[?&]q=([^&]+)/);
              if (urlMatch) {
                finalUrl = decodeURIComponent(urlMatch[1]);
              }
            }
            
            if (finalUrl.startsWith('http') && title.trim()) {
              searchResults.push({
                title: title.trim(),
                url: finalUrl,
                snippet: snippet.trim()
              });
              console.log(`✅ Agregado: ${title.trim().substring(0, 30)}...`);
            }
          }
        }
        
        console.log(`✅ Resultados válidos: ${searchResults.length}`);
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
      return {
        query,
        timestamp: new Date(),
        results: []
      };
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      if (contextWrapper) {
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
          // En producción, cerrar el context completamente
          await contextWrapper.context.close().catch(() => {});
        } else {
          // En desarrollo, solo liberar el context del pool
          contextWrapper.inUse = false;
        }
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
        // Obtener contexto disponible
        const contextWrapper = this.contexts.find(ctx => !ctx.inUse);
        if (!contextWrapper) {
          enhanced.push(result);
          continue;
        }

        contextWrapper.inUse = true;
        const page = await contextWrapper.context.newPage();
        
        try {
          await page.goto(result.url, {
            waitUntil: 'domcontentloaded',
            timeout: 8000
          });

          const metadata = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script, style, noscript');
            scripts.forEach(el => el.remove());
            
            // Extraer contenido principal
            const mainContent = 
              document.querySelector('main')?.textContent ||
              document.querySelector('article')?.textContent ||
              document.querySelector('[role="main"]')?.textContent ||
              document.querySelector('.content')?.textContent ||
              document.querySelector('#content')?.textContent ||
              '';
            
            // Helper para convertir URL relativa a absoluta
            const toAbsoluteURL = (url: string): string => {
              if (!url) return '';
              try {
                return new URL(url, window.location.origin).href;
              } catch {
                return '';
              }
            };
            
            // Extraer Open Graph image (múltiples fuentes)
            let ogImage = '';
            const ogImageSelectors = [
              'meta[property="og:image"]',
              'meta[property="og:image:url"]', 
              'meta[name="twitter:image"]',
              'meta[name="twitter:image:src"]',
              'meta[property="twitter:image"]',
              'meta[name="image"]'
            ];
            
            for (const selector of ogImageSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                const content = element.getAttribute('content');
                if (content && content.length > 10) { // Filtrar URLs muy cortas
                  ogImage = toAbsoluteURL(content);
                  if (ogImage) break;
                }
              }
            }
            
            // Si no hay OG image, buscar una imagen principal simple
            if (!ogImage) {
              const images = Array.from(document.querySelectorAll('article img, .content img, main img')).filter(img => {
                const src = img.src || img.getAttribute('data-src');
                return src && img.offsetWidth > 150 && img.offsetHeight > 100;
              });
              
              if (images.length > 0) {
                const src = images[0].src || images[0].getAttribute('data-src');
                ogImage = toAbsoluteURL(src);
              }
            }
            
            // Extraer site name
            const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
                            document.querySelector('meta[name="application-name"]')?.getAttribute('content') ||
                            document.title.split(' | ')[0]?.split(' - ')[0] ||
                            window.location.hostname;
            
            // Extraer fecha de publicación
            const publishedTime = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                                 document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ||
                                 document.querySelector('meta[name="date"]')?.getAttribute('content') ||
                                 document.querySelector('meta[name="publish_date"]')?.getAttribute('content') ||
                                 document.querySelector('time[datetime]')?.getAttribute('datetime') ||
                                 document.querySelector('time[pubdate]')?.getAttribute('datetime');
            
            // Buscar favicon (múltiples fuentes)
            let favicon = '';
            const faviconSelectors = [
              'link[rel="icon"][sizes*="32"]',
              'link[rel="icon"][sizes*="48"]', 
              'link[rel="shortcut icon"]',
              'link[rel="icon"]',
              'link[rel="apple-touch-icon"]',
              'link[rel="apple-touch-icon-precomposed"]'
            ];
            
            for (const selector of faviconSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                const href = element.getAttribute('href');
                if (href) {
                  favicon = toAbsoluteURL(href);
                  if (favicon) break;
                }
              }
            }
            
            // Fallback para favicon
            if (!favicon) {
              const domain = window.location.origin;
              favicon = `${domain}/favicon.ico`;
            }
            
            // Debug info
            if (window.location.hostname.includes('fixtergeek') || true) { // Debug para fixtergeek específicamente
              console.log('🔍 Metadata extracted for', window.location.href);
              console.log('  📸 OG Image:', ogImage || 'NONE');
              console.log('  🎯 Favicon:', favicon || 'NONE');
              console.log('  🏢 Site name:', siteName);
              console.log('  🗓️ Published:', publishedTime || 'NONE');
            }
            
            return {
              content: mainContent.replace(/\s+/g, ' ').trim().substring(0, 800),
              image: ogImage,
              siteName,
              publishedTime,
              favicon
            };
          });

          await page.close();
          contextWrapper.inUse = false;
          
          // Fallback para favicon usando Google's service
          let finalFavicon = metadata.favicon;
          if (!finalFavicon || finalFavicon.endsWith('/favicon.ico')) {
            try {
              const domain = new URL(result.url).hostname;
              finalFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
            } catch {
              finalFavicon = metadata.favicon;
            }
          }

          enhanced.push({
            ...result,
            content: metadata.content || result.snippet,
            image: metadata.image,
            siteName: metadata.siteName,
            publishedTime: metadata.publishedTime,
            favicon: finalFavicon
          });

          if (this.isDebugMode) {
            console.log(`✅ Metadata para ${result.url}:`, {
              image: !!metadata.image,
              favicon: !!finalFavicon,
              siteName: metadata.siteName
            });
          }
          
        } catch (pageError) {
          await page.close();
          contextWrapper.inUse = false;
          if (this.isDebugMode) {
            console.log(`No se pudo obtener metadata para: ${result.url}`);
          }
          
          // Agregar favicon básico incluso si falla la extracción
          try {
            const domain = new URL(result.url).hostname;
            enhanced.push({
              ...result,
              favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
              siteName: domain
            });
          } catch {
            enhanced.push(result);
          }
        }
        
      } catch (error) {
        if (this.isDebugMode) {
          console.log(`Error procesando: ${result.url}`);
        }
        
        // Agregar favicon básico incluso con errores
        try {
          const domain = new URL(result.url).hostname;
          enhanced.push({
            ...result,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
            siteName: domain
          });
        } catch {
          enhanced.push(result);
        }
      }
    }
    
    return enhanced;
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
    try {
      await serviceInstance.initialize();
      console.log("✅ Playwright web search service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Playwright web search service:", error);
      console.log("📋 This might be due to missing browser binaries in production");
      console.log("💡 Consider running 'npx playwright install --with-deps chromium'");
      // Don't throw here - let the service handle the error gracefully
    }
  }
  return serviceInstance;
}

export async function cleanupWebSearchService() {
  if (serviceInstance) {
    await serviceInstance.close();
    serviceInstance = null;
  }
}