import { Effect, pipe, Schema } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";

const OpenRouterRequestSchema = Schema.Struct({
  model: Schema.String,
  instructions: Schema.String,
  temperature: Schema.Number,
  message: Schema.String,
  stream: Schema.optional(Schema.Boolean),
});

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
    const safeModel = data.model || DEFAULT_AI_MODEL;
    const safeInstructions = data.instructions || "";
    const safeTemperature =
      typeof data.temperature === "number" ? data.temperature : 0.7;
    const safeMessage = data.message || "";
    console.log("[OpenRouter] Model enviado:", safeModel);
    const bodyToSend = {
      model: safeModel,
      messages: [
        { role: "system", content: safeInstructions },
        { role: "user", content: safeMessage },
      ],
      temperature: safeTemperature,
      ...(data.stream ? { stream: true } : {}),
    };
    console.log("[OpenRouter] Body enviado:", bodyToSend);
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
    // STREAM: retorna Response(stream) directamente
    if (stream) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(bodyToSend),
      });
      if (!res.ok) {
        const errorText = await res.text();
        return new Response(
          JSON.stringify({
            success: false,
            error: `OpenRouter error: ${errorText}`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(res.body, {
        status: 200,
        headers: {
          "Content-Type":
            res.headers.get("Content-Type") || "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
    // NO STREAM: fetch normal
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyToSend),
    });
    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenRouter error: ${errorText}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const json = await res.json();
    return new Response(JSON.stringify({ success: true, result: json }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error && error.stack ? error.stack : undefined,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const loader = async () =>
  new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
