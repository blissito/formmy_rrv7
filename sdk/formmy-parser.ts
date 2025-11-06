/**
 * Formmy Parser SDK - Simple TypeScript Client
 *
 * Uso:
 * ```typescript
 * import { FormmyParser } from './sdk/formmy-parser';
 *
 * const parser = new FormmyParser('sk_live_xxxxx');
 *
 * // Parse documento
 * const job = await parser.parse('./documento.pdf', 'AGENTIC');
 * const result = await parser.waitFor(job.id);
 * console.log(result.markdown);
 *
 * // Query RAG
 * const ragResult = await parser.query('¿horarios?', 'chatbot_id_xxx');
 * console.log(ragResult.answer);
 * console.log(ragResult.sources);
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

export type ParsingMode = 'DEFAULT' | 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type QueryMode = 'fast' | 'accurate';

export interface ParsingJob {
  id: string;
  status: JobStatus;
  fileName: string;
  mode: ParsingMode;
  creditsUsed: number;
  markdown?: string;
  pages?: number;
  processingTime?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ParserConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface RAGQueryResult {
  query: string;
  answer?: string; // Solo en mode="accurate"
  results?: Array<{
    content: string;
    score: number;
    metadata: {
      fileName?: string;
      page?: number;
      chunkIndex?: number;
    };
  }>;
  sources?: Array<{
    content: string;
    score: number;
    metadata: {
      fileName?: string;
      page?: number;
      chunkIndex?: number;
    };
  }>;
  creditsUsed: number;
  processingTime: number;
}

export class FormmyParser {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ParserConfig | string) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = 'https://formmy.app';
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || 'https://formmy.app';
    }
  }

  /**
   * Parsear un archivo PDF/DOCX/etc
   */
  async parse(
    file: string | Buffer,
    mode: ParsingMode = 'DEFAULT'
  ): Promise<ParsingJob> {
    const formData = new FormData();

    // Handle file path or buffer
    if (typeof file === 'string') {
      const filePath = path.resolve(file);
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const blob = new Blob([fileBuffer]);
      formData.append('file', blob, fileName);
    } else {
      const blob = new Blob([file]);
      formData.append('file', blob, 'document.pdf');
    }

    formData.append('mode', mode);

    const response = await fetch(`${this.baseUrl}/api/parser/v1?intent=upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        // Si no es JSON, usar el texto completo (probablemente HTML)
        errorMessage = responseText.substring(0, 300);
      }
      throw new Error(`Parser API error (${response.status}): ${errorMessage}`);
    }

    return JSON.parse(responseText);
  }

  /**
   * Consultar el estado de un job
   */
  async getStatus(jobId: string): Promise<ParsingJob> {
    const response = await fetch(
      `${this.baseUrl}/api/parser/v1?intent=status&jobId=${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        errorMessage = responseText.substring(0, 300);
      }
      throw new Error(`Parser API error (${response.status}): ${errorMessage}`);
    }

    return JSON.parse(responseText);
  }

  /**
   * Esperar a que el job se complete (polling)
   */
  async waitFor(
    jobId: string,
    options: {
      pollInterval?: number; // ms entre checks (default: 2000)
      timeout?: number; // timeout total en ms (default: 300000 = 5 min)
      onProgress?: (job: ParsingJob) => void; // callback con el estado actual
    } = {}
  ): Promise<ParsingJob> {
    const pollInterval = options.pollInterval || 2000;
    const timeout = options.timeout || 300000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.getStatus(jobId);

      // Callback de progreso
      if (options.onProgress) {
        options.onProgress(job);
      }

      // Completado exitosamente
      if (job.status === 'COMPLETED') {
        return job;
      }

      // Error
      if (job.status === 'FAILED') {
        throw new Error(`Parsing failed: ${job.error || 'Unknown error'}`);
      }

      // Continuar esperando
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Timeout waiting for job ${jobId} to complete`);
  }

  /**
   * Query RAG - Búsqueda semántica en la base de conocimiento
   */
  async query(
    query: string,
    chatbotId: string,
    options: {
      mode?: QueryMode; // default: 'accurate'
      contextId?: string; // Para test específico de documento
    } = {}
  ): Promise<RAGQueryResult> {
    const { mode = 'accurate', contextId } = options;

    const response = await fetch(`${this.baseUrl}/api/rag/v1?intent=query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        chatbotId,
        contextId,
        mode
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        errorMessage = responseText.substring(0, 300);
      }
      throw new Error(`RAG API error (${response.status}): ${errorMessage}`);
    }

    return JSON.parse(responseText);
  }
}
