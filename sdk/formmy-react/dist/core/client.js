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
             * Send a message and get a response (non-streaming)
             * For streaming, use the useFormmyChat hook on the frontend
             */
            send: async (options) => {
                // For server-side, we make a regular POST and read the full response
                const sessionId = options.conversationId || `sdk_${Date.now()}`;
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
                // Parse SSE response - Vercel AI SDK format
                // Lines starting with "0:" contain text content chunks
                const lines = text.split("\n");
                const contentParts = [];
                for (const line of lines) {
                    if (line.startsWith("0:")) {
                        try {
                            const parsed = JSON.parse(line.slice(2));
                            if (typeof parsed === "string") {
                                contentParts.push(parsed);
                            }
                        }
                        catch {
                            // Log malformed chunks but don't lose the rest
                            console.warn("[Formmy SDK] Malformed SSE chunk:", line.slice(0, 100));
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