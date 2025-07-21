import { Effect, Schema } from "effect";
import { FALLBACK_MODELS } from "~/utils/aiModels";

const OpenRouterRequestSchema = Schema.Struct({
  model: Schema.String,
  instructions: Schema.String,
  temperature: Schema.Number,
  message: Schema.String,
  stream: Schema.optional(Schema.Boolean),
});

async function tryModelWithFallback(
  apiKey: string,
  bodyToSend: any,
  stream: boolean
) {
  let currentModel = bodyToSend.model;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const requestBody = { ...bodyToSend, model: currentModel };
      console.log(
        `[OpenRouter] Intentando modelo: ${currentModel} (intento ${
          attempts + 1
        })`
      );

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        return res;
      }

      const errorText = await res.text();
      console.log(`[OpenRouter] Error con modelo ${currentModel}:`, errorText);

      // Si es rate limit, intentar con modelo de fallback
      if (errorText.includes("rate-limited") || errorText.includes("429")) {
        const fallbackModel =
          FALLBACK_MODELS[currentModel as keyof typeof FALLBACK_MODELS];
        if (fallbackModel && fallbackModel !== currentModel) {
          console.log(
            `[OpenRouter] Cambiando a modelo de fallback: ${fallbackModel}`
          );
          currentModel = fallbackModel;
          attempts++;
          continue;
        }
      }

      // Si no es rate limit o no hay fallback, devolver el error
      return res;
    } catch (error) {
      console.error(
        `[OpenRouter] Error de red con modelo ${currentModel}:`,
        error
      );
      attempts++;
      if (attempts >= maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error("Máximo número de intentos alcanzado");
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  for (const [key, value] of formData.entries()) {
    console.log(`[OpenRouter API] FormData: ${key} = ${value}`);
  }
  const data = {
    model: String(formData.get("model") ?? ""),
    instructions: String(formData.get("instructions") ?? ""),
    temperature: Number(formData.get("temperature")),
    message: String(formData.get("message") ?? ""),
    stream: formData.get("stream") === "true",
  };
  console.log(
    "[OpenRouter API] Mensaje recibido en backend:",
    formData.get("message")
  );

  try {
    const input = await Effect.runPromise(
      Effect.tryPromise(() =>
        Promise.resolve(Schema.decodeUnknown(OpenRouterRequestSchema)(data))
      )
    );
    const { model, instructions, temperature, message, stream } = input as any;
    // Usa los valores del FormData (data) para construir el body
    const safeModel = data.model || "gpt-4"; // Default to gpt-4
    const safeInstructions = data.instructions || "";
    const safeTemperature =
      typeof data.temperature === "number" ? data.temperature : 0.7;
    const safeMessage = data.message || "";
    console.log("[OpenRouter] Model enviado:", safeModel);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No OpenRouter API key configured",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Intentar con el modelo original
    let currentModel = safeModel;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        console.log(
          `[OpenRouter] Intento ${attempts + 1}: usando modelo ${currentModel}`
        );

        const bodyToSend = {
          model: currentModel,
          messages: [
            { role: "system", content: safeInstructions },
            { role: "user", content: safeMessage },
          ],
          temperature: safeTemperature,
        };

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://formmy.ai",
              "X-Title": "Formmy Chatbot",
            },
            body: JSON.stringify(bodyToSend),
          }
        );

        if (response.status === 429) {
          // Rate limit - intentar con modelo de fallback
          const fallbackModel =
            FALLBACK_MODELS[currentModel as keyof typeof FALLBACK_MODELS];
          if (fallbackModel && fallbackModel !== currentModel) {
            console.log(
              `[OpenRouter] Rate limit en ${currentModel}, cambiando a ${fallbackModel}`
            );
            currentModel = fallbackModel;
            attempts++;
            continue;
          } else {
            return new Response(
              "Rate limit alcanzado en todos los modelos disponibles",
              {
                status: 429,
                headers: { "Content-Type": "text/plain" },
              }
            );
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[OpenRouter] Error ${response.status}: ${errorText}`);
          return new Response(`Error: ${errorText}`, {
            status: response.status,
            headers: { "Content-Type": "text/plain" },
          });
        }

        // Éxito - retornar respuesta
        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error(`[OpenRouter] Error en intento ${attempts + 1}:`, error);
        attempts++;

        if (attempts >= maxAttempts) {
          return new Response(
            `Error interno: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            {
              status: 500,
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        // Intentar con modelo de fallback
        const fallbackModel =
          FALLBACK_MODELS[currentModel as keyof typeof FALLBACK_MODELS];
        if (fallbackModel && fallbackModel !== currentModel) {
          currentModel = fallbackModel;
        }
      }
    }
  } catch (error: any) {
    console.error("[OpenRouter] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const loader = async () =>
  new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
