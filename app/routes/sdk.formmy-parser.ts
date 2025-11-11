/**
 * SDK ES Module Route - Servir formmy-parser como ES Module
 * GET /sdk/formmy-parser.js
 *
 * Browser-compatible version sin dependencias de Node.js
 */


export const loader = async ({ request }: Route.LoaderArgs) => {
  // ES Module JavaScript puro (no TypeScript, no Node.js deps)
  // IMPORTANTE: Usamos template literals escapados porque esto es código backend
  const esModuleContent = String.raw`/**
 * Formmy Parser SDK - ES Module
 * Browser-compatible version (no Node.js dependencies)
 *
 * Usage:
 * import { FormmyParser } from 'https://formmy.app/sdk/formmy-parser.js';
 *
 * const parser = new FormmyParser('YOUR_API_KEY');
 *
 * // Parse document (pass File/Blob from <input type="file">)
 * const job = await parser.parse(fileBlob, 'AGENTIC');
 * const result = await parser.waitFor(job.id);
 *
 * // Query RAG
 * const ragResult = await parser.query('¿horarios?', 'chatbot_id_xxx');
 */

export class FormmyParser {
  constructor(config) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = 'https://formmy.app';
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || 'https://formmy.app';
    }
  }

  /**
   * Parse documento (PDF/DOCX/XLSX/TXT)
   * @param {File|Blob} file - File/Blob from <input type="file">
   * @param {string} mode - 'COST_EFFECTIVE' | 'AGENTIC' | 'AGENTIC_PLUS'
   * @returns {Promise<ParsingJob>}
   */
  async parse(file, mode = 'AGENTIC') {
    const formData = new FormData();

    if (file instanceof Blob || file instanceof File) {
      formData.append('file', file, file.name || 'document.pdf');
    } else {
      throw new Error('Browser mode: Please pass a File/Blob object from <input type="file">');
    }

    formData.append('mode', mode);

    const response = await fetch(\`\${this.baseUrl}/api/parser/v1?intent=upload\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Parser API error: \${error.error || error.message || response.statusText}\`);
    }

    return await response.json();
  }

  /**
   * Consultar estado de parsing job
   * @param {string} jobId
   * @returns {Promise<ParsingJob>}
   */
  async getStatus(jobId) {
    const response = await fetch(
      \`\${this.baseUrl}/api/parser/v1?intent=status&jobId=\${jobId}\`,
      {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`Parser API error: \${error.error || response.statusText}\`);
    }

    return await response.json();
  }

  /**
   * Esperar a que job complete (polling automático)
   * @param {string} jobId
   * @param {object} options - { pollInterval: 2000, timeout: 300000, onProgress: (job) => {} }
   * @returns {Promise<ParsingJob>}
   */
  async waitFor(jobId, options = {}) {
    const pollInterval = options.pollInterval || 2000;
    const timeout = options.timeout || 300000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.getStatus(jobId);

      if (options.onProgress) {
        options.onProgress(job);
      }

      if (job.status === 'COMPLETED') {
        return job;
      }

      if (job.status === 'FAILED') {
        throw new Error(\`Parsing failed: \${job.error || 'Unknown error'}\`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(\`Timeout waiting for job \${jobId} to complete\`);
  }

  /**
   * Query RAG - Búsqueda semántica en base de conocimiento
   * @param {string} query - Pregunta natural
   * @param {string} chatbotId - ID del chatbot
   * @param {object} options - { mode: 'fast' | 'accurate', contextId: 'xxx' }
   * @returns {Promise<RAGQueryResult>}
   */
  async query(query, chatbotId, options = {}) {
    const { mode = 'accurate', contextId } = options;

    const response = await fetch(\`\${this.baseUrl}/api/rag/v1?intent=query\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        chatbotId,
        contextId,
        mode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`RAG API error: \${error.error || error.message || response.statusText}\`);
    }

    return await response.json();
  }

  /**
   * Listar documentos parseados del chatbot
   * @param {string} chatbotId
   * @returns {Promise<Array>}
   */
  async list(chatbotId) {
    const response = await fetch(
      \`\${this.baseUrl}/api/rag/v1?intent=list&chatbotId=\${chatbotId}\`,
      {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(\`RAG API error: \${error.error || response.statusText}\`);
    }

    const data = await response.json();
    return data.contexts || [];
  }
}
`;

  return new Response(esModuleContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
