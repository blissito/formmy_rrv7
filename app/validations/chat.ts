import { Schema } from "effect";
import { Chatbot } from "@prisma/client";

// Esquema para los mensajes del chat
export const ChatMessageSchema = Schema.Struct({
  role: Schema.Literal("user", "assistant", "system"),
  content: Schema.String,
});

// Esquema para el cuerpo de la petición
export const ChatRequestSchema = Schema.Struct({
  chatbotId: Schema.String,
  message: Schema.String,
  sessionId: Schema.String,
  stream: Schema.optional(Schema.Boolean),
});

// Esquema para la respuesta de error
export const ErrorResponseSchema = Schema.Struct({
  status: Schema.Number,
  error: Schema.String,
  details: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
});

// Esquema para la respuesta exitosa
export const SuccessResponseSchema = Schema.Struct({
  success: Schema.Literal(true),
  content: Schema.String,
  tokens: Schema.optional(Schema.Number),
});

// Esquema para el chunk de streaming
export const StreamChunkSchema = Schema.Struct({
  type: Schema.Literal("chunk"),
  content: Schema.String,
});

// Tipos derivados de los esquemas
export type ChatRequest = Schema.Schema.Type<typeof ChatRequestSchema>;
export type ErrorResponse = Schema.Schema.Type<typeof ErrorResponseSchema>;
export type SuccessResponse = Schema.Schema.Type<typeof SuccessResponseSchema>;
export type StreamChunk = Schema.Schema.Type<typeof StreamChunkSchema>;
