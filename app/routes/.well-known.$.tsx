/**
 * Handler for .well-known routes (Chrome DevTools, security.txt, etc.)
 * Returns a 404 response for all .well-known requests
 */
export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);

  // Log the request for debugging if needed
  console.log(`Blocked .well-known request: ${url.pathname}`);

  // Return 404 for all .well-known requests
  return new Response(null, {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};

/**
 * Component should never render since loader always returns a Response
 */
export default function WellKnownRoute() {
  return null;
}
