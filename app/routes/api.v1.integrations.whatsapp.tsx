import { data as json } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Effect, pipe } from "effect";
import { IntegrationType } from "@prisma/client";
import {
  createIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  deleteIntegration,
  updateIntegrationActivity,
} from "../../server/chatbot/integrationModel.server";
import { db } from "../utils/db.server";

// ============================================================================
// Domain Types
// ============================================================================

interface ConnectionTestResult {
  readonly success: boolean;
  readonly message: string;
  readonly details?: {
    readonly phoneNumber?: string;
    readonly businessName?: string;
    readonly verificationStatus?: string;
  };
}

interface WhatsAppConnectionConfig {
  readonly phoneNumberId: string;
  readonly accessToken: string;
  readonly businessAccountId: string;
  readonly webhookVerifyToken?: string;
}

// ============================================================================
// Error Types
// ============================================================================

class IntegrationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

class ValidationError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ============================================================================
// Effect-based Business Logic
// ============================================================================

/**
 * Tests WhatsApp connection using simple HTTP request
 */
const testWhatsAppConnection = (config: WhatsAppConnectionConfig) => {
  const testUrl = `https://graph.facebook.com/v17.0/${config.phoneNumberId}`;

  return Effect.tryPromise({
    try: () =>
      fetch(testUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
      }),
    catch: (error) =>
      new IntegrationError(
        "CONNECTION_ERROR",
        `Failed to connect to WhatsApp API: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      ),
  }).pipe(
    Effect.flatMap((response) => {
      if (!response.ok) {
        return Effect.tryPromise({
          try: () => response.json(),
          catch: () => ({}),
        }).pipe(
          Effect.flatMap((errorData) =>
            Effect.fail(
              new IntegrationError(
                "API_ERROR",
                `WhatsApp API error: ${response.status} ${response.statusText}`,
                errorData
              )
            )
          )
        );
      }

      return Effect.tryPromise({
        try: () => response.json(),
        catch: (error) =>
          new IntegrationError(
            "PARSE_ERROR",
            `Failed to parse API response: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          ),
      });
    }),
    Effect.map(
      (data) =>
        ({
          success: true,
          message: "Connection test successful",
          details: {
            phoneNumber: data.display_phone_number || config.phoneNumberId,
            businessName: data.name || "Unknown",
            verificationStatus: data.verified_name || "unverified",
          },
        } as ConnectionTestResult)
    ),
    Effect.catchAll((error) =>
      Effect.succeed({
        success: false,
        message:
          error instanceof IntegrationError
            ? error.message
            : "Connection test failed",
        details: error instanceof IntegrationError ? error.details : undefined,
      } as ConnectionTestResult)
    )
  );
};

// ============================================================================
// Route Handlers (Simplified)
// ============================================================================

/**
 * Loader function - handles GET requests
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const chatbotId = url.searchParams.get("chatbotId");

    if (!chatbotId) {
      return json(
        {
          success: false,
          error: "chatbotId is required",
          field: "chatbotId",
        },
        { status: 400 }
      );
    }

    // Fetch integrations using Effect
    const fetchEffect = Effect.tryPromise({
      try: () => getIntegrationsByChatbotId(chatbotId),
      catch: (error) =>
        new IntegrationError(
          "FETCH_ERROR",
          `Failed to fetch integrations: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        ),
    }).pipe(
      Effect.map((integrations) =>
        integrations.filter(
          (integration) => integration.platform === IntegrationType.WHATSAPP
        )
      )
    );

    const integrations = await Effect.runPromise(fetchEffect);

    return json({
      success: true,
      integrations,
    });
  } catch (error) {
    console.error("Error fetching WhatsApp integrations:", error);
    return json(
      {
        success: false,
        error: "Failed to fetch integrations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

/**
 * Action function - handles POST, PUT, DELETE requests
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent") as string;

    if (!intent) {
      return json(
        {
          success: false,
          error: "Intent is required",
          field: "intent",
        },
        { status: 400 }
      );
    }

    if (!["create", "update", "delete", "test"].includes(intent)) {
      return json(
        {
          success: false,
          error: "Invalid intent. Must be one of: create, update, delete, test",
          field: "intent",
        },
        { status: 400 }
      );
    }

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
        return json(
          {
            success: false,
            error: `Unsupported intent: ${intent}`,
            field: "intent",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in WhatsApp integration action:", error);
    return json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// ============================================================================
// Action Handlers using Effect
// ============================================================================

/**
 * Handle creating a new WhatsApp integration
 */
async function handleCreateIntegration(formData: FormData) {
  try {
    // Extract and validate required fields
    const chatbotId = formData.get("chatbotId") as string;
    const phoneNumberId = formData.get("phoneNumberId") as string;
    const accessToken = formData.get("accessToken") as string;
    const businessAccountId = formData.get("businessAccountId") as string;
    const webhookVerifyToken = formData.get("webhookVerifyToken") as
      | string
      | null;

    // Validation
    if (!chatbotId?.trim()) {
      return json(
        {
          success: false,
          error: "chatbotId is required",
          field: "chatbotId",
        },
        { status: 400 }
      );
    }
    if (!phoneNumberId?.trim()) {
      return json(
        {
          success: false,
          error: "phoneNumberId is required",
          field: "phoneNumberId",
        },
        { status: 400 }
      );
    }
    if (!accessToken?.trim()) {
      return json(
        {
          success: false,
          error: "accessToken is required",
          field: "accessToken",
        },
        { status: 400 }
      );
    }
    if (!businessAccountId?.trim()) {
      return json(
        {
          success: false,
          error: "businessAccountId is required",
          field: "businessAccountId",
        },
        { status: 400 }
      );
    }

    const validatedData = {
      chatbotId,
      phoneNumberId,
      accessToken,
      businessAccountId,
      webhookVerifyToken: webhookVerifyToken || undefined,
    };

    // Test connection using Effect
    const createEffect = pipe(
      testWhatsAppConnection({
        phoneNumberId: validatedData.phoneNumberId,
        accessToken: validatedData.accessToken,
        businessAccountId: validatedData.businessAccountId,
        webhookVerifyToken: validatedData.webhookVerifyToken,
      }),
      Effect.flatMap((testResult) => {
        if (!testResult.success) {
          return Effect.fail(
            new IntegrationError(
              "CONNECTION_TEST_FAILED",
              testResult.message,
              testResult.details
            )
          );
        }

        // Create integration
        return Effect.tryPromise({
          try: () =>
            createIntegration(
              validatedData.chatbotId,
              IntegrationType.WHATSAPP,
              validatedData.accessToken,
              {
                phoneNumberId: validatedData.phoneNumberId,
                businessAccountId: validatedData.businessAccountId,
                webhookVerifyToken: validatedData.webhookVerifyToken,
              }
            ),
          catch: (error) =>
            new IntegrationError(
              "CREATE_ERROR",
              `Failed to create integration: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            ),
        }).pipe(
          Effect.flatMap((integration) =>
            Effect.tryPromise({
              try: () => updateIntegrationActivity(integration.id, new Date()),
              catch: (error) =>
                new IntegrationError(
                  "UPDATE_ACTIVITY_ERROR",
                  `Failed to update activity: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                ),
            }).pipe(
              Effect.map(() => ({
                integration,
                testResult,
              }))
            )
          )
        );
      })
    );

    const result = await Effect.runPromise(createEffect);

    return json({
      success: true,
      integration: result.integration,
      connectionTest: result.testResult,
      message: "WhatsApp integration created successfully",
    });
  } catch (error) {
    console.error("Error creating WhatsApp integration:", error);

    if (error instanceof IntegrationError) {
      return json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 400 }
      );
    }

    return json(
      {
        success: false,
        error: "Failed to create integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle updating an existing WhatsApp integration
 */
async function handleUpdateIntegration(formData: FormData) {
  try {
    const integrationId = formData.get("integrationId") as string;

    if (!integrationId?.trim()) {
      return json(
        {
          success: false,
          error: "integrationId is required",
          field: "integrationId",
        },
        { status: 400 }
      );
    }

    const phoneNumberId = formData.get("phoneNumberId") as string;
    const accessToken = formData.get("accessToken") as string;
    const businessAccountId = formData.get("businessAccountId") as string;
    const webhookVerifyToken = formData.get("webhookVerifyToken") as string;
    const isActive = formData.get("isActive") as string;

    // Build update data
    const updateData: any = {};
    if (phoneNumberId?.trim()) updateData.phoneNumberId = phoneNumberId;
    if (accessToken?.trim()) updateData.token = accessToken;
    if (businessAccountId?.trim())
      updateData.businessAccountId = businessAccountId;
    if (webhookVerifyToken?.trim())
      updateData.webhookVerifyToken = webhookVerifyToken;
    if (isActive !== null) updateData.isActive = isActive === "true";

    const hasCredentialChanges = !!(
      phoneNumberId ||
      accessToken ||
      businessAccountId
    );

    // Create update effect
    const updateEffect = hasCredentialChanges
      ? pipe(
          testWhatsAppConnection({
            phoneNumberId: phoneNumberId || "",
            accessToken: accessToken || "",
            businessAccountId: businessAccountId || "",
            webhookVerifyToken: webhookVerifyToken || undefined,
          }),
          Effect.flatMap((testResult) => {
            if (!testResult.success) {
              return Effect.fail(
                new IntegrationError(
                  "CONNECTION_TEST_FAILED",
                  "Connection test failed with updated credentials",
                  testResult.message
                )
              );
            }
            return Effect.succeed(testResult);
          }),
          Effect.flatMap(() =>
            Effect.tryPromise({
              try: () => updateIntegration(integrationId, updateData),
              catch: (error) =>
                new IntegrationError(
                  "UPDATE_ERROR",
                  `Failed to update integration: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                ),
            })
          )
        )
      : Effect.tryPromise({
          try: () => updateIntegration(integrationId, updateData),
          catch: (error) =>
            new IntegrationError(
              "UPDATE_ERROR",
              `Failed to update integration: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            ),
        });

    const updatedIntegration = await Effect.runPromise(
      updateEffect.pipe(
        Effect.flatMap((integration) =>
          Effect.tryPromise({
            try: () => updateIntegrationActivity(integrationId, new Date()),
            catch: (error) =>
              new IntegrationError(
                "UPDATE_ACTIVITY_ERROR",
                `Failed to update activity: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              ),
          }).pipe(Effect.map(() => integration))
        )
      )
    );

    return json({
      success: true,
      integration: updatedIntegration,
      message: "WhatsApp integration updated successfully",
    });
  } catch (error) {
    console.error("Error updating WhatsApp integration:", error);

    if (error instanceof IntegrationError) {
      return json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 400 }
      );
    }

    return json(
      {
        success: false,
        error: "Failed to update integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle deleting a WhatsApp integration
 */
async function handleDeleteIntegration(formData: FormData) {
  try {
    const integrationId = formData.get("integrationId") as string;

    if (!integrationId?.trim()) {
      return json(
        {
          success: false,
          error: "integrationId is required",
          field: "integrationId",
        },
        { status: 400 }
      );
    }

    const deleteEffect = Effect.tryPromise({
      try: () => deleteIntegration(integrationId),
      catch: (error) =>
        new IntegrationError(
          "DELETE_ERROR",
          `Failed to delete integration: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        ),
    });

    const deletedIntegration = await Effect.runPromise(deleteEffect);

    return json({
      success: true,
      integration: deletedIntegration,
      message: "WhatsApp integration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting WhatsApp integration:", error);

    if (error instanceof IntegrationError) {
      return json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 500 }
      );
    }

    return json(
      {
        success: false,
        error: "Failed to delete integration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle testing connection for an existing integration
 */
async function handleTestConnection(formData: FormData) {
  try {
    const integrationId = formData.get("integrationId") as string;

    if (!integrationId?.trim()) {
      return json(
        {
          success: false,
          error: "integrationId is required",
          field: "integrationId",
        },
        { status: 400 }
      );
    }

    const testEffect = Effect.tryPromise({
      try: () => db.integration.findUnique({ where: { id: integrationId } }),
      catch: (error) =>
        new IntegrationError(
          "FETCH_ERROR",
          `Failed to fetch integration: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        ),
    }).pipe(
      Effect.flatMap((integration) => {
        if (!integration) {
          return Effect.fail(
            new IntegrationError("NOT_FOUND", "Integration not found")
          );
        }

        return testWhatsAppConnection({
          phoneNumberId: integration.phoneNumberId || "",
          accessToken: integration.token || "",
          businessAccountId: integration.businessAccountId || "",
          webhookVerifyToken: integration.webhookVerifyToken || undefined,
        }).pipe(
          Effect.flatMap((testResult) => {
            const updateData: any = {
              lastActivity: new Date(),
              errorMessage: testResult.success ? null : testResult.message,
            };

            return Effect.tryPromise({
              try: () => updateIntegration(integrationId, updateData),
              catch: (error) =>
                new IntegrationError(
                  "UPDATE_ERROR",
                  `Failed to update integration with test result: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                ),
            }).pipe(Effect.map(() => testResult));
          })
        );
      })
    );

    const testResult = await Effect.runPromise(testEffect);

    return json({
      success: testResult.success,
      testResult,
      message: testResult.success
        ? "Connection test successful"
        : "Connection test failed",
    });
  } catch (error) {
    console.error("Error testing WhatsApp connection:", error);

    if (error instanceof IntegrationError) {
      return json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.code === "NOT_FOUND" ? 404 : 500 }
      );
    }

    return json(
      {
        success: false,
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Effect-based WhatsApp Integration API Route
// ============================================================================
//
// This route provides CRUD operations for WhatsApp integrations using Effect.js
// for functional programming patterns, better error handling, and composability.
//
// Features:
// - Effect-based async operations with proper error handling
// - Functional composition and pipeline operations
// - Type-safe error handling with custom error types
// - Connection testing using WhatsApp Graph API
// - Comprehensive validation and logging
// ============================================================================
