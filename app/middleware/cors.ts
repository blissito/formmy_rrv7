/**
 * Global CORS middleware for SDK endpoints
 * Ensures public access across all domains
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Accept, Authorization, X-Requested-With",
};

/**
 * Apply CORS headers to Response
 */
export function withCors(response: Response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsPreflight() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Create JSON response with CORS headers
 */
export function jsonWithCors(data: any, init?: ResponseInit) {
  const response = Response.json(data, init);
  return withCors(response);
}
