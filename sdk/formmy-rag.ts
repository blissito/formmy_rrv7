/**
 * Formmy RAG SDK - Simple TypeScript Client
 *
 * Uso:
 * ```typescript
 * import { FormmyRAG } from './sdk/formmy-rag';
 *
 * const rag = new FormmyRAG('sk_live_xxxxx');
 *
 * // Listar contextos
 * const contexts = await rag.list();
 *
 * // Subir contexto
 * await rag.upload({
 *   content: 'Horarios: Lunes a Viernes 9am-6pm',
 *   type: 'TEXT',
 *   metadata: { title: 'Horarios de atención' }
 * });
 *
 * // Consultar RAG
 * const result = await rag.query('¿Cuáles son los horarios?');
 * console.log(result.answer);
 * console.log(result.sources);
 * ```
 */

export type ContextType = 'TEXT' | 'FILE' | 'LINK' | 'QUESTION';

export interface RAGContext {
  id: string;
  type: ContextType;
  fileName?: string | null;
  title?: string | null;
  url?: string | null;
  sizeKB: number;
  createdAt: string;
  parsingMode?: string | null;
  parsingPages?: number | null;
  parsingCredits?: number | null;
}

export interface RAGListResponse {
  chatbotId: string;
  chatbotName: string;
  totalContexts: number;
  totalSizeKB: number;
  totalEmbeddings: number;
  contexts: RAGContext[];
}

export interface RAGUploadParams {
  content: string;
  type: ContextType;
  metadata?: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    url?: string;
    title?: string;
    questions?: string;
    answer?: string;
    routes?: string[];
  };
}

export interface RAGUploadResponse {
  success: boolean;
  contextId: string;
  embeddingsCreated: number;
  embeddingsSkipped: number;
  creditsUsed: number;
}

export interface RAGQueryParams {
  query: string;
  topK?: number; // Entre 1 y 20, default 5
  stream?: boolean; // Future feature
}

export interface RAGQueryResponse {
  query: string;
  answer: string;
  sources: Array<{
    content: string;
    score: number;
    metadata: {
      fileName?: string | null;
      title?: string | null;
      url?: string | null;
      contextType?: string;
    };
  }>;
  creditsUsed: number;
}

export interface RAGConfig {
  apiKey: string;
  baseUrl?: string;
}

export class FormmyRAG {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: RAGConfig | string) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = 'https://formmy-v2.fly.dev';
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || 'https://formmy-v2.fly.dev';
    }
  }

  /**
   * Listar todos los contextos del chatbot
   */
  async list(): Promise<RAGListResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/rag?intent=list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
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

  /**
   * Subir contenido manualmente al RAG
   */
  async upload(params: RAGUploadParams): Promise<RAGUploadResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/rag?intent=upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
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

  /**
   * Consultar el RAG con búsqueda semántica
   */
  async query(query: string, options: Omit<RAGQueryParams, 'query'> = {}): Promise<RAGQueryResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/rag?intent=query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        ...options,
      }),
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

  /**
   * Helper: Obtener un contexto específico por ID
   */
  async getContext(contextId: string): Promise<RAGContext | null> {
    const listResponse = await this.list();
    return listResponse.contexts.find(ctx => ctx.id === contextId) || null;
  }

  /**
   * Helper: Buscar contextos por tipo
   */
  async findByType(type: ContextType): Promise<RAGContext[]> {
    const listResponse = await this.list();
    return listResponse.contexts.filter(ctx => ctx.type === type);
  }
}
