import { Effect, Schema } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";

const OpenRouterStreamSchema = Schema.Struct({
  model: Schema.String,
  instructions: Schema.String,
  temperature: Schema.Number,
  message: Schema.String,
});

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
    const safeModel = data.model || DEFAULT_AI_MODEL;
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
    const bodyToSend = {
      model: safeModel,
      messages: [
        { role: "system", content: safeInstructions },
        { role: "user", content: safeMessage },
      ],
      temperature: safeTemperature,
      stream: true,
    };
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
      return new Response(errorText, {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(
      error instanceof Error ? error.message : String(error),
      { status: 400, headers: { "Content-Type": "text/plain" } }
    );
  }
}
