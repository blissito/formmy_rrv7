/**
 * Refresh Website Contexts Worker for Agenda.js
 *
 * Actualiza automáticamente el contenido de contextos tipo LINK
 * según su updateFrequency (monthly/yearly)
 *
 * Corre: 1° de cada mes a las 2:00 AM
 */

import type { Job } from 'agenda';
import { getAgenda } from '../agenda.server';
import { db } from '~/utils/db.server';
import { createHash } from 'crypto';

export interface RefreshWebsiteJobData {
  runDate: Date;
}

/**
 * Calcula hash MD5 del contenido para detectar cambios
 */
function calculateContentHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Determina si un contexto debe actualizarse según su updateFrequency
 */
function shouldRefresh(
  lastUpdated: Date,
  updateFrequency: string | null | undefined
): boolean {
  if (!updateFrequency) return false;

  const now = new Date();
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (updateFrequency) {
    case 'monthly':
      return daysSinceUpdate >= 30;
    case 'yearly':
      return daysSinceUpdate >= 365;
    default:
      return false;
  }
}

/**
 * Re-scrape un sitio web y retorna el contenido actualizado
 */
async function rescrapeWebsite(url: string): Promise<{ content: string; error?: string }> {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      return {
        content: '',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Extraer texto con JSDOM (mismo código que fetch-website)
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remover scripts, styles, y otros elementos no deseados
    const unwantedSelectors = ['script', 'style', 'nav', 'footer', 'header', 'aside'];
    unwantedSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    // Extraer texto del body
    const bodyText = document.body.textContent || '';

    // Limpiar y normalizar
    const cleanedText = bodyText
      .replace(/\s+/g, ' ') // Multiple spaces → single space
      .replace(/\n\s*\n/g, '\n') // Multiple newlines → single newline
      .trim();

    return { content: cleanedText };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { content: '', error: errorMessage };
  }
}

/**
 * Actualiza un contexto con nuevo contenido y re-vectoriza
 */
async function updateContextContent(
  chatbotId: string,
  contextId: string,
  newContent: string
): Promise<void> {
  // 1. Obtener chatbot con contexts
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { id: true, contexts: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot ${chatbotId} no encontrado`);
  }

  // 2. Encontrar el contexto y actualizarlo
  const updatedContexts = (chatbot.contexts as any[]).map((ctx: any) => {
    if (ctx.id === contextId) {
      // Calcular nuevo tamaño
      const newSizeKB = Math.ceil(Buffer.from(newContent).length / 1024);

      return {
        ...ctx,
        content: newContent,
        sizeKB: newSizeKB,
        // NO actualizar createdAt, agregar lastRefreshedAt
      };
    }
    return ctx;
  });

  // 3. Actualizar chatbot
  await db.chatbot.update({
    where: { id: chatbotId },
    data: { contexts: updatedContexts },
  });

  // 4. Re-vectorizar: eliminar embeddings viejos + crear nuevos
  const { revectorizeContext } = await import('../../vector/auto-vectorize.service');
  await revectorizeContext(chatbotId, contextId, newContent);

  console.log(`✅ Updated and re-vectorized context ${contextId} for chatbot ${chatbotId}`);
}

/**
 * Procesa todos los contextos tipo LINK que necesitan refresh
 */
async function refreshWebsiteContexts(): Promise<{
  checked: number;
  refreshed: number;
  unchanged: number;
  errors: number;
}> {
  try {
    // 1. Obtener todos los chatbots con contextos tipo LINK
    const chatbots = await db.chatbot.findMany({
      where: {
        contexts: {
          // MongoDB: al menos un contexto tipo LINK con updateFrequency
          path: '$[*].type',
          array_contains: 'LINK',
        } as any,
      },
      select: {
        id: true,
        slug: true,
        contexts: true,
      },
    });

    let checked = 0;
    let refreshed = 0;
    let unchanged = 0;
    let errors = 0;

    // 2. Para cada chatbot, procesar sus contextos LINK
    for (const chatbot of chatbots) {
      const contexts = chatbot.contexts as any[];

      for (const context of contexts) {
        if (context.type !== 'LINK') continue;
        if (!context.url) continue;

        // Verificar si debe actualizarse
        const lastUpdated = context.createdAt ? new Date(context.createdAt) : new Date();
        if (!shouldRefresh(lastUpdated, context.updateFrequency)) {
          continue; // Skip, no es momento de actualizar
        }

        checked++;

        try {
          console.log(
            `[RefreshWebsiteWorker] Checking ${context.url} (chatbot: ${chatbot.slug})`
          );

          // 3. Re-scrape el sitio
          const { content, error } = await rescrapeWebsite(context.url);

          if (error) {
            console.error(`[RefreshWebsiteWorker] Error scraping ${context.url}: ${error}`);
            errors++;
            continue;
          }

          // 4. Comparar hash para detectar cambios
          const oldHash = calculateContentHash(context.content || '');
          const newHash = calculateContentHash(content);

          if (oldHash === newHash) {
            console.log(`[RefreshWebsiteWorker] No changes detected for ${context.url}`);
            unchanged++;
            continue;
          }

          // 5. Contenido cambió → actualizar y re-vectorizar
          console.log(`[RefreshWebsiteWorker] Changes detected for ${context.url}, updating...`);
          await updateContextContent(chatbot.id, context.id, content);
          refreshed++;
        } catch (error) {
          console.error(
            `[RefreshWebsiteWorker] Error processing ${context.url}:`,
            error
          );
          errors++;
        }
      }
    }

    return { checked, refreshed, unchanged, errors };
  } catch (error) {
    console.error('[RefreshWebsiteWorker] Job failed:', error);
    return { checked: 0, refreshed: 0, unchanged: 0, errors: 1 };
  }
}

/**
 * Register refresh website worker with Agenda
 */
export async function registerRefreshWebsiteWorker() {
  const agenda = await getAgenda();

  agenda.define<RefreshWebsiteJobData>(
    'refresh-website-contexts',
    {
      priority: 'low', // Prioridad baja para no afectar operaciones críticas
      concurrency: 1, // Solo una ejecución a la vez
    },
    async (job: Job<RefreshWebsiteJobData>) => {
      const startTime = Date.now();

      try {
        console.log('[RefreshWebsiteWorker] Starting website refresh job...');

        const result = await refreshWebsiteContexts();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(
          `[RefreshWebsiteWorker] Completed in ${duration}s - Checked: ${result.checked}, Refreshed: ${result.refreshed}, Unchanged: ${result.unchanged}, Errors: ${result.errors}`
        );

        return result;
      } catch (error) {
        console.error('[RefreshWebsiteWorker] Job failed:', error);
        throw error;
      }
    }
  );

  // Programar: 1° de cada mes a las 2:00 AM
  // Cron format: minute hour day month dayOfWeek
  // '0 2 1 * *' = minuto 0, hora 2, día 1, cualquier mes, cualquier día de semana
  await agenda.every('0 2 1 * *', 'refresh-website-contexts', {
    runDate: new Date(),
  });

  console.log('[RefreshWebsiteWorker] Registered - Runs 1st of every month at 2:00 AM');
}

/**
 * Ejecutar manualmente el worker (para testing)
 */
export async function runRefreshWebsiteNow(): Promise<void> {
  const agenda = await getAgenda();
  await agenda.now('refresh-website-contexts', { runDate: new Date() });
  console.log('[RefreshWebsiteWorker] Manual execution triggered');
}
