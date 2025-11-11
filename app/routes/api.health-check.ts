/**
 * Simple Health Check Endpoint
 * Testing route structure
 */


export async function loader({ request }: Route.LoaderArgs) {
  return new Response(JSON.stringify({
    status: "ok",
    timestamp: new Date().toISOString(),
    path: "/api/health-check"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}