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
  // First, try to get the business account info to verify the token and permissions
  const businessAccountUrl = `https://graph.facebook.com/v20.0/${config.businessAccountId}?fields=name,id,message_template_namespace`;
  const phoneNumbersUrl = `https://graph.facebook.com/v20.0/${config.businessAccountId}/phone_numbers`;

  // First, verify we can access the business account
  return Effect.tryPromise({
    try: async () => {

      
      // First, try to get business account info
      const accountResponse = await fetch(businessAccountUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const responseText = await accountResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { raw: responseText };
      }

      if (!accountResponse.ok) {
        console.error('Business Account API Error:', {
          status: accountResponse.status,
          statusText: accountResponse.statusText,
          errorData,
          url: businessAccountUrl,
          headers: Object.fromEntries(accountResponse.headers.entries())
        });
        
        // Check for common errors
        if (accountResponse.status === 400) {
          if (errorData.error?.message?.includes("expired")) {
            throw new IntegrationError(
              "TOKEN_EXPIRED",
              "El token de acceso ha expirado. Por favor genera uno nuevo en el Administrador de WhatsApp Business."
            );
          }
          if (errorData.error?.type === "OAuthException") {
            throw new IntegrationError(
              "INVALID_TOKEN",
              "El token de acceso no es válido o no tiene los permisos necesarios."
            );
          }
        }
        
        throw new Error(`Failed to fetch business account: ${accountResponse.status} ${accountResponse.statusText}`);
      }

      // Then try to get phone numbers
      const phoneNumbersResponse = await fetch(phoneNumbersUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return phoneNumbersResponse;
    },
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
          try: async () => {
            // Try to get error details from the response
            let errorDetails;
            try {
              errorDetails = await response.json();
            } catch (e) {
              errorDetails = { error: 'Failed to parse error response' };
            }
            
            console.error('WhatsApp API Error:', {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              errorDetails,
              config: {
                businessAccountId: config.businessAccountId,
                phoneNumberId: config.phoneNumberId,
                hasAccessToken: !!config.accessToken,
                hasWebhookToken: !!config.webhookVerifyToken
              }
            });
            
            // Return a more detailed error message
            let errorMessage = `WhatsApp API error: ${response.status} ${response.statusText}`;
            
            if (errorDetails?.error?.message) {
              errorMessage += ` - ${errorDetails.error.message}`;
            } else if (response.status === 400) {
              errorMessage += ' - This is usually caused by an invalid Business Account ID, missing permissions, or incorrect token scopes.';
            } else if (response.status === 403) {
              errorMessage += ' - The access token might be invalid or expired, or missing required permissions.';
            }
            
            throw new IntegrationError(
              "API_ERROR",
              errorMessage,
              {
                status: response.status,
                statusText: response.statusText,
                ...(errorDetails?.error ? { apiError: errorDetails.error } : {})
              }
            );
          },
          catch: (error) => {
            console.error('Error processing API error response:', error);
            return new IntegrationError(
              "API_ERROR",
              `Failed to process API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              { originalError: error }
            );
          }
        });
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
    Effect.flatMap((apiResponse) => {
      if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        return Effect.fail(
          new IntegrationError(
            "INVALID_RESPONSE",
            "API response is missing phone number data.",
            apiResponse
          )
        );
      }

      const phoneInfo = apiResponse.data.find(
        (p: any) => p.id === config.phoneNumberId
      );

      if (!phoneInfo) {
        return Effect.fail(
          new IntegrationError(
            "PHONE_NUMBER_NOT_FOUND",
            "The provided Phone Number ID was not found in the business account.",
            { businessAccountId: config.businessAccountId }
          )
        );
      }

      return Effect.succeed({
        success: true,
        message: "Connection test successful",
        details: {
          phoneNumber: phoneInfo.display_phone_number || config.phoneNumberId,
          businessName: phoneInfo.verified_name || "Unknown",
          verificationStatus: phoneInfo.quality_rating || "unknown",
        },
      } as ConnectionTestResult);
    }),
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "chatbotId is required",
          field: "chatbotId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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

    return new Response(JSON.stringify({ success: true, integrations }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching WhatsApp integrations:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch integrations",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * Action function - handles POST, PUT, DELETE requests
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  let data;
  const contentType = request.headers.get("Content-Type") || "";

  if (contentType.includes("application/json")) {
    data = await request.json();
  } else {
    const formData = await request.formData();
    data = Object.fromEntries(formData);
  }

  const { intent, ...values } = data;

  const formDataObject = new FormData();
  if (intent) {
    formDataObject.append("intent", intent as string);
  }
  for (const key in values) {
    const value = values[key];
    if (value !== null && value !== undefined) {
      formDataObject.append(key, String(value));
    }
  }

  try {
    const intent = formDataObject.get("intent") as string;


    if (!intent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "'intent' is required",
          code: "VALIDATION_ERROR",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    switch (intent) {
      case "create":
        return await handleCreateIntegration(formDataObject);
      case "update":
        return await handleUpdateIntegration(formDataObject);
      case "delete":
        return await handleDeleteIntegration(formDataObject);
      case "test":
        return await handleTestConnection(formDataObject);
      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid intent", code: "INVALID_INTENT" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in WhatsApp integration action:", error);

    if (error instanceof IntegrationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "chatbotId is required",
          field: "chatbotId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!phoneNumberId?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "phoneNumberId is required",
          field: "phoneNumberId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!accessToken?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "accessToken is required",
          field: "accessToken",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!businessAccountId?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "businessAccountId is required",
          field: "businessAccountId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
      Effect.Do.pipe(
        Effect.tap(() => 
          Effect.logInfo('Iniciando prueba de conexión con WhatsApp')
        ),
        Effect.flatMap(() =>
          testWhatsAppConnection({
            phoneNumberId: validatedData.phoneNumberId,
            accessToken: validatedData.accessToken,
            businessAccountId: validatedData.businessAccountId,
            webhookVerifyToken: validatedData.webhookVerifyToken,
          })
        )
      ),
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
        const integrationData = {
          phoneNumberId: validatedData.phoneNumberId,
          businessAccountId: validatedData.businessAccountId,
          webhookVerifyToken: validatedData.webhookVerifyToken,
        };
        

        
        return Effect.tryPromise({
          try: async () => {
            try {
              const result = await createIntegration(
                validatedData.chatbotId,
                IntegrationType.WHATSAPP,
                validatedData.accessToken,
                integrationData
              );

              return result;
            } catch (error) {
              throw error; // Re-lanzar el error para manejarlo en el catch externo
            }
          },
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

    return new Response(
      JSON.stringify({
        success: true,
        integration: result.integration,
        connectionTest: result.testResult,
        message: "WhatsApp integration created successfully",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating WhatsApp integration:", error);

    if (error instanceof IntegrationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to create integration",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "integrationId is required",
          field: "integrationId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // First, get the existing integration to compare values
    const existingIntegration = await db.integration.findUnique({
      where: { id: integrationId },
    });

    if (!existingIntegration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Integration not found",
          code: "NOT_FOUND",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
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

    // Check if there are actual credential changes by comparing with existing values
    const hasCredentialChanges = !!(
      (phoneNumberId?.trim() && phoneNumberId !== existingIntegration.phoneNumberId) ||
      (accessToken?.trim() && accessToken !== existingIntegration.token) ||
      (businessAccountId?.trim() && businessAccountId !== existingIntegration.businessAccountId)
    );



    // Create update effect
    const updateEffect = hasCredentialChanges
      ? pipe(
          testWhatsAppConnection({
            phoneNumberId: phoneNumberId?.trim() || existingIntegration.phoneNumberId || "",
            accessToken: accessToken?.trim() || existingIntegration.token || "",
            businessAccountId: businessAccountId?.trim() || existingIntegration.businessAccountId || "",
            webhookVerifyToken: webhookVerifyToken?.trim() || existingIntegration.webhookVerifyToken || undefined,
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

    return new Response(
      JSON.stringify({
        success: true,
        integration: updatedIntegration,
        message: "WhatsApp integration updated successfully",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating WhatsApp integration:", error);

    if (error instanceof IntegrationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to update integration",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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
      return new Response(
        JSON.stringify({
          success: false,
          error: "integrationId is required",
          field: "integrationId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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

    return new Response(
      JSON.stringify({
        success: true,
        integration: deletedIntegration,
        message: "WhatsApp integration deleted successfully",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting WhatsApp integration:", error);

    if (error instanceof IntegrationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to delete integration",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Handle testing connection for a WhatsApp integration
 * Can be used for both new and existing integrations
 */
async function handleTestConnection(formData: FormData) {
  try {
    const integrationId = formData.get("integrationId") as string | null;
    const phoneNumberId = formData.get("phoneNumberId") as string | null;
    const accessToken = formData.get("accessToken") as string | null;
    const businessAccountId = formData.get("businessAccountId") as string | null;
    const webhookVerifyToken = formData.get("webhookVerifyToken") as string | null;

    // For new integrations, validate required fields
    if (!integrationId) {
      if (!phoneNumberId?.trim() || !accessToken?.trim() || !businessAccountId?.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "For new integrations, phoneNumberId, accessToken, and businessAccountId are required",
            fields: {
              phoneNumberId: !phoneNumberId?.trim() ? "Required" : undefined,
              accessToken: !accessToken?.trim() ? "Required" : undefined,
              businessAccountId: !businessAccountId?.trim() ? "Required" : undefined,
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Test connection with provided credentials
      const testResult = await Effect.runPromise(
        testWhatsAppConnection({
          phoneNumberId,
          accessToken,
          businessAccountId,
          webhookVerifyToken: webhookVerifyToken || undefined,
        })
      );

      return new Response(
        JSON.stringify({
          success: testResult.success,
          testResult,
          message: testResult.success
            ? "Connection test successful"
            : "Connection test failed",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // For existing integrations, fetch and test
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Integration not found",
          code: "NOT_FOUND",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Test connection with integration data
    const testResult = await Effect.runPromise(
      testWhatsAppConnection({
        phoneNumberId: integration.phoneNumberId || "",
        accessToken: integration.token || "",
        businessAccountId: integration.businessAccountId || "",
        webhookVerifyToken: integration.webhookVerifyToken || undefined,
      })
    );

    // Update the integration with test result
    await db.integration.update({
      where: { id: integrationId },
      data: {
        lastActivity: new Date(),
        errorMessage: testResult.success ? null : testResult.message,
      },
    });

    return new Response(
      JSON.stringify({
        success: testResult.success,
        testResult,
        message: testResult.success
          ? "Connection test successful"
          : "Connection test failed",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error testing WhatsApp connection:", error);

    if (error instanceof IntegrationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        }),
        { 
          status: error.code === "NOT_FOUND" ? 404 : 500,
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to test connection",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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
