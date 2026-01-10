/**
 * @formmy.app/react - Backend Client
 *
 * Usage:
 * ```typescript
 * import { Formmy } from '@formmy.app/react/client';
 *
 * const formmy = new Formmy({ secretKey: 'sk_live_xxx' });
 *
 * // Create agent
 * const agent = await formmy.agents.create({ name: 'Mi Asistente' });
 *
 * // List agents
 * const { agents } = await formmy.agents.list();
 * ```
 */
const DEFAULT_BASE_URL = "https://formmy.app";
export class FormmyError extends Error {
    code;
    status;
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = "FormmyError";
    }
}
export class Formmy {
    secretKey;
    baseUrl;
    constructor(config) {
        if (!config.secretKey) {
            throw new Error("Formmy client requires a secretKey (formmy_sk_live_xxx)");
        }
        const secretKey = config.secretKey;
        // Support both old (sk_live_) and new (formmy_sk_live_) prefixes
        const validSecretPrefixes = ["formmy_sk_live_", "sk_live_"];
        if (!validSecretPrefixes.some(prefix => secretKey.startsWith(prefix))) {
            throw new Error("Invalid secretKey format. Must start with formmy_sk_live_");
        }
        this.secretKey = secretKey;
        this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // Agents Namespace
    // ═══════════════════════════════════════════════════════════════════════════
    get agents() {
        return {
            /**
             * List all agents for the authenticated user
             */
            list: async () => {
                return this.request("GET", "?intent=agents.list");
            },
            /**
             * Get a specific agent by ID
             */
            get: async (agentId) => {
                return this.request("GET", `?intent=agents.get&agentId=${agentId}`);
            },
            /**
             * Create a new agent
             */
            create: async (data) => {
                return this.request("POST", "?intent=agents.create", data);
            },
            /**
             * Update an existing agent
             */
            update: async (agentId, data) => {
                return this.request("POST", `?intent=agents.update&agentId=${agentId}`, data);
            },
            /**
             * Delete an agent (soft delete)
             */
            delete: async (agentId) => {
                return this.request("POST", `?intent=agents.delete&agentId=${agentId}`);
            },
        };
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // Chat Namespace (for server-side chat)
    // ═══════════════════════════════════════════════════════════════════════════
    get chat() {
        return {
            /**
             * Stream a chat response - returns Response for proxying
             * Use this when you need to forward the stream to your frontend
             *
             * @example
             * ```typescript
             * // Elysia/Express/Hono backend
             * app.post("/chat", async ({ body }) => {
             *   const response = await formmy.chat.stream({
             *     agentId: body.agentId,
             *     message: body.message,
             *   });
             *   return response; // Proxy the stream directly
             * });
             * ```
             */
            stream: async (options) => {
                const sessionId = options.conversationId || `sdk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const response = await fetch(`${this.baseUrl}/api/v2/sdk?intent=chat&agentId=${options.agentId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.secretKey}`,
                    },
                    body: JSON.stringify({
                        message: {
                            id: `msg_${Date.now()}`,
                            role: "user",
                            parts: [{ type: "text", text: options.message }],
                        },
                        id: sessionId,
                    }),
                });
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new FormmyError(error.error || "Request failed", error.code || "REQUEST_FAILED", response.status);
                }
                // Return the response directly for streaming proxy
                // The response body is a ReadableStream in Vercel AI SDK UIMessage format
                return new Response(response.body, {
                    headers: {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                        "X-Formmy-Conversation-Id": sessionId,
                    },
                });
            },
            /**
             * Send a message and get complete response (non-streaming)
             * Use this for server-to-server communication where you don't need streaming
             */
            send: async (options) => {
                const sessionId = options.conversationId || `sdk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const response = await fetch(`${this.baseUrl}/api/v2/sdk?intent=chat&agentId=${options.agentId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.secretKey}`,
                    },
                    body: JSON.stringify({
                        message: {
                            id: `msg_${Date.now()}`,
                            role: "user",
                            parts: [{ type: "text", text: options.message }],
                        },
                        id: sessionId,
                    }),
                });
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new FormmyError(error.error || "Request failed", error.code || "REQUEST_FAILED", response.status);
                }
                // Read streaming response as text
                const text = await response.text();
                // Parse SSE response - Vercel AI SDK v6 format
                // Lines: data: {"type":"text-delta","id":"...","delta":"Hello"}
                const lines = text.split("\n");
                const contentParts = [];
                for (const line of lines) {
                    // Vercel AI SDK v6 format: data: {...}
                    if (line.startsWith("data: ")) {
                        try {
                            const parsed = JSON.parse(line.slice(6));
                            if (parsed.type === "text-delta" && parsed.delta) {
                                contentParts.push(parsed.delta);
                            }
                        }
                        catch {
                            // Skip malformed chunks
                        }
                    }
                    // Legacy format support: 0:"text"
                    else if (line.startsWith("0:")) {
                        try {
                            const parsed = JSON.parse(line.slice(2));
                            if (typeof parsed === "string") {
                                contentParts.push(parsed);
                            }
                        }
                        catch {
                            // Skip malformed chunks
                        }
                    }
                }
                return {
                    content: contentParts.join(""),
                    conversationId: sessionId,
                };
            },
        };
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // Private methods
    // ═══════════════════════════════════════════════════════════════════════════
    async request(method, path, body) {
        const url = `${this.baseUrl}/api/v2/sdk${path}`;
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.secretKey}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new FormmyError(data.error || "Request failed", data.code || "REQUEST_FAILED", response.status);
        }
        return data;
    }
}
//# sourceMappingURL=client.js.map