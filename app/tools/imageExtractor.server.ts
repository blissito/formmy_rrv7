import { chromium, type Browser, type Page } from 'playwright';
import type { ImageGallery } from './types';

export class ImageExtractorService {
  private cache = new Map<string, { data: string[]; expires: number }>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutos cache para imágenes
  private browser: Browser | null = null;
  private isDebugMode = process.env.NODE_ENV === 'development';

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async extractImages(url: string, maxImages: number = 6): Promise<string[]> {
    const cached = this.cache.get(url);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    await this.initialize();
    
    let page: Page | null = null;
    
    try {
      page = await this.browser!.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      // Anti-detección básica
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      try {
        // Si es una URL de redirección de Bing, seguir hasta la URL final
        if (url.includes('bing.com/ck/a')) {
          console.log('🔗 Detectada URL de redirección de Bing, siguiendo...');
          await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 15000
          });
          
          // Esperar a que termine la redirección
          await this.delay(2000);
          
          // Obtener la URL final después de las redirecciones
          const finalUrl = page.url();
          console.log(`🎯 URL final: ${finalUrl}`);
          
          // Si sigue siendo una URL de Bing, extraer la URL real del parámetro 'u'
          if (finalUrl.includes('bing.com')) {
            const urlMatch = url.match(/&u=([^&]+)/);
            if (urlMatch) {
              const decodedUrl = decodeURIComponent(urlMatch[1]);
              const realUrl = Buffer.from(decodedUrl.replace(/^a1/, ''), 'base64').toString('utf-8');
              console.log(`🔓 URL decodificada: ${realUrl}`);
              
              await page.goto(realUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
              });
            }
          }
        } else {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
        }
      } catch (navigateError) {
        console.warn(`⚠️ No se pudo acceder a ${url}: ${navigateError.message}`);
        return { url, images: [], error: `URL no accesible: ${navigateError.message}` };
      }

      let images: string[] = [];
      
      try {
        images = await page.evaluate((maxImages) => {
        const foundImages: string[] = [];
        
        // Helper para convertir URL relativa a absoluta
        const toAbsoluteURL = (url: string): string => {
          if (!url) return '';
          try {
            return new URL(url, window.location.origin).href;
          } catch {
            return '';
          }
        };

        // Selectores priorizados para encontrar imágenes de contenido
        const imageSelectors = [
          'article img',
          '.content img', 
          'main img',
          '.post img',
          '.entry img',
          '[role="main"] img',
          'img[src*="blog"]',
          'img[src*="post"]', 
          'img[alt*="thumbnail"]',
          'img[class*="featured"]',
          'img[class*="hero"]',
          'img[class*="banner"]',
          'img'
        ];

        for (const selector of imageSelectors) {
          if (foundImages.length >= maxImages) break;
          
          const images = Array.from(document.querySelectorAll(selector)).filter(img => {
            const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-srcset');
            if (!src) return false;
            
            // Filtros de calidad
            const isLargeEnough = img.offsetWidth > 150 && img.offsetHeight > 100;
            const isNotUIElement = !src.includes('icon') && !src.includes('logo') && !src.includes('avatar') && !src.includes('profile');
            const isNotSocial = !src.includes('facebook') && !src.includes('twitter') && !src.includes('linkedin');
            const isNotAd = !src.includes('ad') && !src.includes('banner') && !img.className.includes('ad');
            const isNotTracking = !src.includes('pixel') && !src.includes('track');
            
            return isLargeEnough && isNotUIElement && isNotSocial && isNotAd && isNotTracking;
          });

          for (const img of images) {
            if (foundImages.length >= maxImages) break;
            
            const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
            const absoluteUrl = toAbsoluteURL(src);
            
            if (absoluteUrl && !foundImages.includes(absoluteUrl)) {
              foundImages.push(absoluteUrl);
            }
          }
        }

        return foundImages;
      }, maxImages);
      } catch (evalError) {
        console.warn(`⚠️ Error evaluando página ${url}: ${evalError.message}`);
        images = [];
      }

      await page.close();

      // Cache the results
      this.cache.set(url, {
        data: images,
        expires: Date.now() + this.cacheTimeout,
      });

      if (this.isDebugMode) {
        console.log(`🖼️ Extraídas ${images.length} imágenes de ${url}`);
      }

      return images;

    } catch (error) {
      if (this.isDebugMode) {
        console.log(`❌ Error extrayendo imágenes de ${url}:`, error);
      }
      if (page) {
        await page.close().catch(() => {});
      }
      return [];
    }
  }

  async extractMultipleImages(urls: string[], maxImagesPerUrl: number = 4): Promise<ImageGallery[]> {
    const results: ImageGallery[] = [];
    
    // Procesar hasta 3 URLs en paralelo para no sobrecargar
    const batches = [];
    for (let i = 0; i < urls.length; i += 3) {
      batches.push(urls.slice(i, i + 3));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (url) => {
        const images = await this.extractImages(url, maxImagesPerUrl);
        return {
          url,
          images,
          extractedAt: new Date()
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.images.length > 0) {
          results.push(result.value);
        }
      }
    }

    return results;
  }
}

// Singleton instance
let imageExtractorInstance: ImageExtractorService | null = null;

export async function getImageExtractor(): Promise<ImageExtractorService> {
  if (!imageExtractorInstance) {
    imageExtractorInstance = new ImageExtractorService();
    await imageExtractorInstance.initialize();
  }
  return imageExtractorInstance;
}

export async function cleanupImageExtractor() {
  if (imageExtractorInstance) {
    await imageExtractorInstance.close();
    imageExtractorInstance = null;
  }
}

// Cleanup en shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await cleanupImageExtractor();
  });
  
  process.on('SIGTERM', async () => {
    await cleanupImageExtractor();
  });
}