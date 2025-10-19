/**
 * Formmy Parser SDK - Simple TypeScript Client
 *
 * Uso:
 * ```typescript
 * import { FormmyParser } from './sdk/formmy-parser';
 *
 * const parser = new FormmyParser('sk_live_xxxxx');
 * const job = await parser.parse('./documento.pdf', 'AGENTIC');
 * const result = await parser.waitFor(job.id);
 * console.log(result.markdown);
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';

export type ParsingMode = 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

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

export class FormmyParser {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ParserConfig | string) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = 'https://formmy-v2.fly.dev';
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || 'https://formmy-v2.fly.dev';
    }
  }

  /**
   * Parsear un archivo PDF/DOCX/etc
   */
  async parse(
    file: string | Buffer,
    mode: ParsingMode = 'AGENTIC'
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Parser API error: ${error.error || error.message || response.statusText}`);
    }

    return await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Parser API error: ${error.error || response.statusText}`);
    }

    return await response.json();
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
}
