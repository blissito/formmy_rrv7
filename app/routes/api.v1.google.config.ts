// API endpoint to get Google OAuth configuration
export async function loader() {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleSecret = process.env.GOOGLE_SECRET;

    if (!googleClientId || !googleSecret) {
      return new Response(
        JSON.stringify({ 
          error: "Google OAuth credentials not configured" 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    // Only return the client ID (not the secret) as it's safe for client-side use
    // The secret should only be used server-side
    const config = {
      clientId: googleClientId,
      redirectUri: `${process.env.NODE_ENV === "production" ? "https" : "http"}://${process.env.HOST || "localhost:3000"}/api/v1/oauth2/google/calendar/callback`,
      calendarId: "primary"
    };

    return new Response(JSON.stringify(config), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting Google config:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
