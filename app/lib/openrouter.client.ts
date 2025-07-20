import { Effect, Schema } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";

export const OpenRouterClientSchema = Schema.Struct({
  model: Schema.String,
  instructions: Schema.String,
  temperature: Schema.Number,
  message: Schema.String,
  stream: Schema.optional(Schema.Boolean),
});

export type OpenRouterClientInput = {
  model?: string;
  instructions?: string;
  temperature?: number;
  message?: string;
  stream?: boolean;
  onStreamChunk?: (text: string) => void;
};

export const sendOpenRouterMessageEffect = (input: OpenRouterClientInput) =>
  Effect.gen(function* (_) {
    // No enviar petición si el mensaje está vacío
    if (!input.message || !input.message.trim()) {
      throw new Error("El mensaje no puede estar vacío.");
    }
    // Validar input
    yield* _(
      Schema.decode(OpenRouterClientSchema)({
        model: input.model || DEFAULT_AI_MODEL,
        instructions: input.instructions || "",
        temperature:
          typeof input.temperature === "number" ? input.temperature : 0.7,
        message: input.message,
        stream: input.stream,
      })
    );
    // Hacer request al endpoint correcto
    console.log("[OpenRouterClient] Mensaje enviado:", input.message);
    const fd = new FormData();
    fd.set("model", input.model || DEFAULT_AI_MODEL);
    fd.set("instructions", input.instructions || "");
    fd.set(
      "temperature",
      String(typeof input.temperature === "number" ? input.temperature : 0.7)
    );
    fd.set("message", input.message);
    if (input.stream) fd.set("stream", "true");
    const endpoint = input.stream
      ? "/api/v1/openrouter/stream"
      : "/api/v1/openrouter";
    const res = yield* _(
      Effect.tryPromise(() =>
        fetch(endpoint, {
          method: "POST",
          body: fd,
        })
      )
    );
    if (!res.ok) {
      const error = yield* _(Effect.tryPromise(() => res.text()));
      throw new Error(error);
    }
    if (input.stream && input.onStreamChunk) {
      // Procesar stream SSE
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream body");
      let accumulated = "";
      let buffer = "";
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = yield* _(
          Effect.tryPromise(() => reader.read())
        );
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Procesar líneas completas
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Mantener línea incompleta en buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6); // Remover "data: "
              if (data === "[DONE]") {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  accumulated += content;
                  input.onStreamChunk(accumulated);
                }
              } catch (e) {
                // Ignorar líneas que no son JSON válido
                console.log("[OpenRouterClient] Línea SSE no válida:", line);
              }
            }
          }
        }
      }
      return { streamed: true, content: accumulated };
    } else {
      const json = yield* _(Effect.tryPromise(() => res.json()));
      if (!json.success) {
        throw new Error(json.error || "Error desconocido en OpenRouter");
      }
      return json.result;
    }
  });
