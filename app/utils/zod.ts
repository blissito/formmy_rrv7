import { z } from "zod";
import * as S from "@effect/schema/Schema";
import { Effect } from "effect";

export const customInputSchema = z
  .object({
    name: z.string(),
    title: z
      .string()
      .min(1, { message: "Escribe un titulo para identificar tu input" }),
    placeholder: z.string().optional(),
    isRequired: z.coerce
      .string()
      .optional()
      .transform((v) => (v === "true" || v === "on" ? true : false)),
    type: z.union([
      z.literal("select"),
      z.literal("text"),
      z.literal("textarea"),
    ]), // @TODO: separate types validation
    options: z
      .array(z.string().min(3, "Las opciones no pueden estar vacías"))
      .optional()
      .default([]), // @TODO: separate types validation
  })
  // maybe not needed?
  .superRefine((values, context) => {
    if (values.type === "select") {
      if (values.options.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Agrega cuando menos dos opciones",
          path: ["options"],
        });
      }
      if (values.type === "select") {
        if (!values.placeholder || values.placeholder === "") {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El placeholder es necesario para un campo de selección",
            path: ["placeholder"],
          });
        }
      }
    }
  });

export type CustomInputType = z.infer<typeof customInputSchema>;

export const extraDataSchema = z.object({
  email: z.string().email(),
  picture: z.string(),
});
export type ExtraData = z.infer<typeof extraDataSchema>;

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

export const answerSchema = z.object({
  id: z.string(),
  opened: z.boolean().optional(),
  deleted: z.boolean().optional(),
  favorite: z.boolean(),
  data: z.union([
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
      company: z.string().optional(),
      message: z.string().optional(),
      phone: z.string().optional(),
    }),
    z.any(), // @TODO custom inputs?
  ]),
  schema: z.any(),
  projectId: z.string(),
  userId: z.string().optional(),
  createdAt: z.date(),
});
export type AnswerType = z.infer<typeof answerSchema>;

export const userSchema = z.object({
  name: z.string().optional().nullable(),
  picture: z.string().optional(),
  email: z.string().email(),
  id: z.string(),
  provider: z.string().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
});

export type UserType = z.infer<typeof userSchema>;

const booleanString = z
  .string()
  .optional()
  // .refine((value) => value === "true" || value === "false", {
  //   message: "El valor debe ser booleano",
  // })
  .transform((value) => value === "true");

export const notificationsSchema = z.object({
  new: z.coerce.boolean(),
  members: z.coerce.boolean().optional(),
  warning: z.coerce.boolean().optional(),
});

export type Notifications = z.infer<typeof notificationsSchema>;

export const projectSettingsSchema = z.object({
  notifications: notificationsSchema,
});

export const configSchema = z.object({
  theme: z.union([z.literal("light"), z.literal("dark")]),
  ctaColor: z.string().min(7),
  inputs: z.array(z.string()),
  border: z.union([z.literal("redondo"), z.literal("cuadrado")]),
  customInputs: z.array(customInputSchema),
  watermark: z.boolean().optional().nullable(),
  message: z.string().optional(),
  icon: z.string().optional(),
  confetti: z.string().optional(),
});
export type ConfigSchema = z.infer<typeof configSchema>;

export const projectSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  userId: z.string(),
  answers: z.array(answerSchema).optional(),
  config: configSchema.nullable(),
  settings: projectSettingsSchema.optional(),
});

export type ProjectType = z.infer<typeof projectSchema>;

export const messageSchema = z.object({
  icon: z.string().nullable(),
  message: z.string().min(10),
  confetti: z.union([z.literal("paper"), z.literal("emoji")]).nullable(),
  theme: z.union([z.literal("light"), z.literal("dark")]),
  ctaColor: z.string().min(7),
  inputs: z.array(z.string()),
  border: z.union([z.literal("redondo"), z.literal("cuadrado")]),
});
export type MessageSchema = z.infer<typeof messageSchema>;

export const chatbotConfigSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar 50 caracteres"),
  aiModel: z.string(),
  personality: z.string(),
  welcomeMessage: z.string().min(1, "El mensaje de bienvenida es obligatorio"),
  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Color primario inválido"),
  temperature: z
    .number()
    .min(0, "Temperatura mínima 0")
    .max(1, "Temperatura máxima 1"),
  instructions: z
    .string()
    .max(4000, "El prompt no puede superar 4000 caracteres")
    .optional(),
});

export function validateChatbotData(
  data: unknown,
  planLimits?: { availableModels?: string[] }
) {
  return chatbotConfigSchema
    .superRefine((val, ctx) => {
      if (
        planLimits?.availableModels &&
        !planLimits.availableModels.includes(val.aiModel)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El modelo ${val.aiModel} no está disponible en tu plan.`,
          path: ["aiModel"],
        });
      }
    })
    .safeParse(data);
}

export const chatbotConfigEffectSchema = S.Struct({
  name: S.String.pipe(S.minLength(2), S.maxLength(50)),
  aiModel: S.String,
  personality: S.String,
  welcomeMessage: S.String,
  primaryColor: S.String.pipe(S.pattern(/^#([0-9A-Fa-f]{6})$/)),
  temperature: S.Number.pipe(S.greaterThanOrEqualTo(0), S.lessThanOrEqualTo(1)),
  prompt: S.optional(S.String.pipe(S.maxLength(4000))),
});

export function validateChatbotDataEffect(
  data: unknown,
  planLimits?: { availableModels?: string[] }
) {
  try {
    const value = Effect.runSync(
      S.decodeUnknown(chatbotConfigEffectSchema)(data)
    );
    if (
      planLimits?.availableModels &&
      !planLimits.availableModels.includes((data as any).aiModel)
    ) {
      return {
        success: false,
        error: {
          aiModel: `El modelo ${
            (data as any).aiModel
          } no está disponible en tu plan.`,
        },
      };
    }
    return { success: true, data: value };
  } catch (error) {
    return { success: false, error };
  }
}
