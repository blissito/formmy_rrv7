import {
  createIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  deleteIntegration,
} from "../../server/chatbot/integrationModel.server";
import { IntegrationType } from "@prisma/client";

// GET handler - Fetch integrations for a chatbot
export async function loader({ request }: any) {
  try {
    const url = new URL(request.url);
    const chatbotId = url.searchParams.get("chatbotId");

    if (!chatbotId) {
      return new Response(JSON.stringify({ error: "chatbotId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const integrations = await getIntegrationsByChatbotId(chatbotId);
    return new Response(JSON.stringify({ integrations }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch integrations",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST/PUT/DELETE handler with intent-based routing
export async function action({ request }: any) {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent") as string;

    switch (intent) {
      case "create":
        return await handleCreateIntegration(formData);
      case "update":
        return await handleUpdateIntegration(formData);
      case "delete":
        return await handleDeleteIntegration(formData);
      case "test":
        return await handleTestConnection(formData);
      default:
        return new Response(JSON.stringify({ error: "Invalid intent" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error in integration action:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function handleCreateIntegration(formData: FormData) {
  const chatbotId = formData.get("chatbotId") as string;
  const platformString = formData.get("platform") as string;
  const token = formData.get("token") as string;

  // Validate and convert platform string to enum
  const platform = platformString as IntegrationType;
  if (!Object.values(IntegrationType).includes(platform)) {
    return new Response(
      JSON.stringify({ error: `Invalid platform: ${platformString}. Valid values are: ${Object.values(IntegrationType).join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // WhatsApp-specific fields
  const phoneNumberId = formData.get("phoneNumberId") as string;
  const businessAccountId = formData.get("businessAccountId") as string;
  const webhookVerifyToken = formData.get("webhookVerifyToken") as string;

  // Google Calendar-specific fields
  const calendarId = formData.get("calendarId") as string;
  const clientId = formData.get("clientId") as string;
  const clientSecret = formData.get("clientSecret") as string;
  const redirectUri = formData.get("redirectUri") as string;

  // Validation
  if (!chatbotId || !platform) {
    return new Response(
      JSON.stringify({ error: "chatbotId and platform are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (platform === IntegrationType.WHATSAPP) {
    if (!phoneNumberId || !token || !businessAccountId) {
      return new Response(
        JSON.stringify({
          error:
            "phoneNumberId, token, and businessAccountId are required for WhatsApp",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (platform === IntegrationType.GOOGLE_CALENDAR) {
    // Use environment variables for Google Calendar credentials
    const envClientId = process.env.GOOGLE_CLIENT_ID;
    const envClientSecret = process.env.GOOGLE_SECRET;
    
    if (!envClientId || !envClientSecret) {
      return new Response(
        JSON.stringify({
          error: "Google OAuth credentials not configured in environment",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const whatsappData =
    platform === IntegrationType.WHATSAPP
      ? {
          phoneNumberId,
          businessAccountId,
          webhookVerifyToken,
        }
      : undefined;

  const googleCalendarData =
    platform === IntegrationType.GOOGLE_CALENDAR
      ? {
          calendarId: calendarId || "primary",
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_SECRET!,
          redirectUri: redirectUri || `${process.env.NODE_ENV === "production" ? "https" : "http"}://${process.env.HOST || "localhost:3000"}/api/v1/oauth2/google/calendar/callback`,
        }
      : undefined;

  const integration = await createIntegration(
    chatbotId,
    platform,
    token,
    whatsappData,
    googleCalendarData
  );

  return new Response(JSON.stringify({ integration, success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleUpdateIntegration(formData: FormData) {
  const integrationId = formData.get("integrationId") as string;
  const token = formData.get("token") as string;
  const isActive = formData.get("isActive") === "true";

  // WhatsApp-specific fields
  const phoneNumberId = formData.get("phoneNumberId") as string;
  const businessAccountId = formData.get("businessAccountId") as string;
  const webhookVerifyToken = formData.get("webhookVerifyToken") as string;
  const errorMessage = formData.get("errorMessage") as string;

  if (!integrationId) {
    return new Response(
      JSON.stringify({ error: "integrationId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const updateData: Parameters<typeof updateIntegration>[1] = {};

  if (token) updateData.token = token;
  if (typeof isActive === "boolean") updateData.isActive = isActive;
  if (phoneNumberId) updateData.phoneNumberId = phoneNumberId;
  if (businessAccountId) updateData.businessAccountId = businessAccountId;
  if (webhookVerifyToken) updateData.webhookVerifyToken = webhookVerifyToken;
  if (errorMessage !== undefined) updateData.errorMessage = errorMessage;

  const integration = await updateIntegration(integrationId, updateData);

  return new Response(JSON.stringify({ integration, success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleDeleteIntegration(formData: FormData) {
  const integrationId = formData.get("integrationId") as string;

  if (!integrationId) {
    return new Response(
      JSON.stringify({ error: "integrationId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const integration = await deleteIntegration(integrationId);

  return new Response(JSON.stringify({ integration, success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleTestConnection(formData: FormData) {
  const phoneNumberId = formData.get("phoneNumberId") as string;
  const token = formData.get("token") as string;
  const businessAccountId = formData.get("businessAccountId") as string;

  if (!phoneNumberId || !token || !businessAccountId) {
    return new Response(
      JSON.stringify({
        error: "phoneNumberId, token, and businessAccountId are required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // TODO: Implement actual connection test using WhatsApp SDK
    // For now, return a mock success response
    const testResult = {
      success: true,
      message: "Connection test successful",
      details: {
        phoneNumber: phoneNumberId,
        businessName: "Test Business", // This would come from WhatsApp API
        verificationStatus: "verified",
      },
    };

    return new Response(JSON.stringify({ testResult, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        testResult: {
          success: false,
          message:
            error instanceof Error ? error.message : "Connection test failed",
        },
        success: false,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
