import { Effect, Schema } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";
import { v4 as uuidv4 } from "uuid";

export const OpenRouterClientSchema = Schema.Struct({
  model: Schema.String,
  instructions: Schema.String,
  temperature: Schema.Number,
  messages: Schema.Array(
    Schema.Struct({ role: Schema.String, content: Schema.String })
  ),
  stream: Schema.optional(Schema.Boolean),
  apiKey: Schema.String,
});

export type OpenRouterClientInput = {
  model?: string;
  instructions?: string;
  temperature?: number;
  messages: { role: string; content: string }[];
  stream?: boolean;
  onStreamChunk?: (partial: string) => void;
  chatbotId?: string;
  apiKey: string;
};

export const sendOpenRouterMessageEffect = (input: OpenRouterClientInput) =>
  Effect.gen(function* (_) {
    // No enviar petición si el array de mensajes está vacío
    if (!input.messages || !input.messages.length) {
      throw new Error("El historial de mensajes no puede estar vacío.");
    }

    // Validar input Better than zod?
    yield* _(
      Schema.decode(OpenRouterClientSchema)({
        model: input.model || DEFAULT_AI_MODEL,
        instructions: input.instructions || "",
        temperature:
          typeof input.temperature === "number" ? input.temperature : 0.7,
        messages: input.messages,
        stream: input.stream,
        apiKey: input.apiKey,
      })
    );

    // Crear sessionId si no existe
    const sessionId = input.chatbotId || uuidv4();

    // Preparar el cuerpo de la petición
    const body = {
      chatbotId: input.chatbotId,
      message: input.messages[input.messages.length - 1].content,
      sessionId,
      stream: input.stream,
    };

    // Hacer request al nuevo endpoint
    console.log("[OpenRouterClient] Enviando mensaje a SDK chat:", body);
    const res = yield* _(
      Effect.tryPromise(() =>
        fetch("/api/sdk/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": input.apiKey,
          },
          body: JSON.stringify(body),
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
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = yield* _(
          Effect.tryPromise(() => reader.read())
        );
        done = doneReading;
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          // Procesar líneas completas
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // Mantener línea incompleta
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remover "data: "
              
              if (data.trim() === '[DONE]') {
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "chunk" && parsed.content) {
                  accumulated += parsed.content;
                  input.onStreamChunk(accumulated);
                } else if (parsed.type === "done") {
                  // Señal de finalización recibida
                  break;
                }
              } catch (e) {
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
        throw new Error(json.error || "Error desconocido en SDK chat");
      }
      return json.response;
    }
  });
