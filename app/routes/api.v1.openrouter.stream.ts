import { Effect, Schema } from "effect";
import { FALLBACK_MODELS } from "../utils/aiModels";

const OpenRouterStreamSchema = Schema.Struct({
  model: Schema.String,
  instructions: Schema.String,
  temperature: Schema.Number,
  message: Schema.String,
});

async function tryModelWithFallback(apiKey: string, bodyToSend: any) {
  let currentModel = bodyToSend.model;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const requestBody = { ...bodyToSend, model: currentModel };
      console.log(
        `[OpenRouter Stream] Intentando modelo: ${currentModel} (intento ${
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

      // Para streaming, solo verificar el status code, no leer el body
      if (res.status === 429) {
        const fallbackModel =
          FALLBACK_MODELS[currentModel as keyof typeof FALLBACK_MODELS];
        if (fallbackModel && fallbackModel !== currentModel) {
          console.log(
            `[OpenRouter Stream] Cambiando a modelo de fallback: ${fallbackModel}`
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
        `[OpenRouter Stream] Error de red con modelo ${currentModel}:`,
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

export async function loader() {
  return new Response("This endpoint only supports POST requests.", {
    status: 405,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = {
    model: String(formData.get("model") ?? ""),
    instructions: String(formData.get("instructions") ?? ""),
    temperature: Number(formData.get("temperature")),
    message: String(formData.get("message") ?? ""),
  };
  try {
    const input = await Effect.runPromise(
      Effect.tryPromise(() =>
        Promise.resolve(Schema.decode(OpenRouterStreamSchema)(data))
      )
    );
    const { model, instructions, temperature, message } = input as any;
    const safeModel = data.model || "mistral"; // Assuming a default model
    const safeInstructions = data.instructions || "";
    const safeTemperature =
      typeof data.temperature === "number" ? data.temperature : 0.7;
    const safeMessage = data.message || "";
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response("No OpenRouter API key configured", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Log para verificar que se está usando la API key
    console.log(
      `[OpenRouter Stream] Usando API key: ${apiKey.substring(0, 10)}...`
    );

    // Intentar con el modelo original
    let currentModel = safeModel;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        console.log(
          `[OpenRouter Stream] Intento ${
            attempts + 1
          }: usando modelo ${currentModel}`
        );

        const bodyToSend = {
          model: currentModel,
          messages: [
            { role: "system", content: safeInstructions },
            { role: "user", content: safeMessage },
          ],
          temperature: safeTemperature,
          stream: true,
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
              `[OpenRouter Stream] Rate limit en ${currentModel}, cambiando a ${fallbackModel}`
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
          console.error(
            `[OpenRouter Stream] Error ${response.status}: ${errorText}`
          );
          return new Response(`Error: ${errorText}`, {
            status: response.status,
            headers: { "Content-Type": "text/plain" },
          });
        }

        // Éxito - retornar stream
        return new Response(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (error) {
        console.error(
          `[OpenRouter Stream] Error en intento ${attempts + 1}:`,
          error
        );
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
    return new Response(
      error instanceof Error ? error.message : String(error),
      { status: 400, headers: { "Content-Type": "text/plain" } }
    );
  }
}
