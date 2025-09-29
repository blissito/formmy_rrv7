/**
 * Simple Health Check Endpoint
 * Testing route structure
 */

import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  return new Response(JSON.stringify({
    status: "ok",
    timestamp: new Date().toISOString(),
    path: "/api/health-check"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}