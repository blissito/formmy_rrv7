import pkg from "@prisma/client";
const { KeyScope } = pkg;
import { validateSdkKey } from "../chatbot/apiKeyModel.server";

export interface SdkAuthContext {
  userId: string;
  scope: KeyScope;
  allowedDomains: string[];
  apiKeyId: string;
}

export class SdkAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = "AUTH_ERROR"
  ) {
    super(message);
    this.name = "SdkAuthError";
  }
}

/**
 * Extracts SDK key from request headers
 * Supports: X-Publishable-Key, X-Secret-Key, Authorization: Bearer
 */
function extractKeyFromRequest(request: Request): string | null {
  // Check X-Publishable-Key header (for frontend)
  const publishableKey = request.headers.get("X-Publishable-Key");
  if (publishableKey) return publishableKey;

  // Check X-Secret-Key header (for backend)
  const secretKey = request.headers.get("X-Secret-Key");
  if (secretKey) return secretKey;

  // Check Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Validates domain against allowed domains list
 * Supports wildcards: *.example.com matches sub.example.com
 *
 * SECURITY: Empty allowedDomains = BLOCKED (not allowed)
 * To allow all domains, explicitly add "*" to the list
 */
function isDomainAllowed(origin: string, allowedDomains: string[]): boolean {
  // SECURITY: Empty list means no domains allowed
  // User must explicitly configure domains or add "*" for all
  if (allowedDomains.length === 0) {
    console.warn(
      "[SDK Auth] Empty allowedDomains - blocking request. Configure domains in dashboard."
    );
    return false;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    return allowedDomains.some((pattern) => {
      // Explicit wildcard for all domains
      if (pattern === "*") return true;

      if (pattern.startsWith("*.")) {
        // Wildcard pattern: *.example.com
        const suffix = pattern.slice(1); // .example.com
        return hostname.endsWith(suffix) || hostname === pattern.slice(2);
      }
      return hostname === pattern;
    });
  } catch {
    console.error("[SDK Auth] Invalid Origin URL:", origin);
    return false;
  }
}

/**
 * Authenticates an SDK request
 * - Extracts key from headers
 * - Validates key exists and is active
 * - For PUBLISHABLE keys: validates Origin against allowedDomains
 * - Returns auth context with userId and scope
 */
export async function authenticateSdkRequest(
  request: Request,
  options: { requireSecret?: boolean } = {}
): Promise<SdkAuthContext> {
  const key = extractKeyFromRequest(request);

  if (!key) {
    throw new SdkAuthError(
      "Missing API key. Use X-Publishable-Key, X-Secret-Key, or Authorization header.",
      401
    );
  }

  // Validate key format (supports both old and new prefixes)
  const validPrefixes = ["formmy_sk_live_", "formmy_pk_live_", "sk_live_", "pk_live_"];
  if (!validPrefixes.some(prefix => key.startsWith(prefix))) {
    throw new SdkAuthError(
      "Invalid API key format. Must start with formmy_sk_live_ or formmy_pk_live_",
      401
    );
  }

  // Require secret key for certain operations
  const isPublishableKey = key.startsWith("pk_live_") || key.startsWith("formmy_pk_live_");
  if (options.requireSecret && isPublishableKey) {
    throw new SdkAuthError(
      "This operation requires a secret key (formmy_sk_live_). Publishable keys cannot perform admin operations.",
      403
    );
  }

  const authResult = await validateSdkKey(key);

  if (!authResult) {
    throw new SdkAuthError("Invalid or inactive API key", 401);
  }

  // For publishable keys, validate domain
  if (authResult.scope === KeyScope.PUBLISHABLE) {
    const origin = request.headers.get("Origin");

    if (!origin) {
      throw new SdkAuthError(
        "Missing Origin header. Publishable keys require Origin for security.",
        403
      );
    }

    if (!isDomainAllowed(origin, authResult.apiKey.allowedDomains)) {
      throw new SdkAuthError(
        `Domain not allowed. Add "${new URL(origin).hostname}" to allowedDomains.`,
        403
      );
    }
  }

  return {
    userId: authResult.userId,
    scope: authResult.scope,
    allowedDomains: authResult.apiKey.allowedDomains,
    apiKeyId: authResult.apiKey.id,
  };
}

/**
 * Creates error response for SDK auth failures
 */
export function createSdkErrorResponse(error: unknown): Response {
  if (error instanceof SdkAuthError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("[SDK Auth] Unexpected error:", error);
  return Response.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
