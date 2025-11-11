/**
 * DEBUG ENDPOINT - Captura TODO lo que llegue al webhook
 *
 * Uso temporal para diagnosticar por qué no llegan los webhooks de sync
 */


/**
 * GET - Verificación del webhook (igual que el endpoint normal)
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  console.log("🔍 [DEBUG WEBHOOK] GET request:", { mode, token, challenge });

  if (mode === "subscribe" && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("OK", { status: 200 });
};

/**
 * POST - Captura TODA la data que llegue
 */
export const action = async ({ request }: Route.ActionArgs) => {
  try {
    const rawBody = await request.text();

    console.log("🔍 [DEBUG WEBHOOK] ==========================================");
    console.log("🔍 [DEBUG WEBHOOK] POST request received");
    console.log("🔍 [DEBUG WEBHOOK] Timestamp:", new Date().toISOString());
    console.log("🔍 [DEBUG WEBHOOK] Headers:", JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
    console.log("🔍 [DEBUG WEBHOOK] Body (raw):", rawBody);

    try {
      const parsed = JSON.parse(rawBody);
      console.log("🔍 [DEBUG WEBHOOK] Body (parsed):", JSON.stringify(parsed, null, 2));

      // Extraer info útil
      if (parsed.entry) {
        for (const entry of parsed.entry) {
          console.log("🔍 [DEBUG WEBHOOK] Entry ID:", entry.id);
          if (entry.changes) {
            for (const change of entry.changes) {
              console.log("🔍 [DEBUG WEBHOOK] Change Field:", change.field);
              console.log("🔍 [DEBUG WEBHOOK] Change Value:", JSON.stringify(change.value, null, 2));
            }
          }
        }
      }
    } catch (e) {
      console.log("🔍 [DEBUG WEBHOOK] Could not parse body as JSON");
    }

    console.log("🔍 [DEBUG WEBHOOK] ==========================================");

    return new Response(JSON.stringify({ success: true, debug: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🔍 [DEBUG WEBHOOK] ERROR:", error);
    return new Response(JSON.stringify({ error: "Debug webhook error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
