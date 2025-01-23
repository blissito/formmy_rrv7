import {
  z
} from "/build/_shared/chunk-YSJMGTXM.js";
import {
  createHotContext
} from "/build/_shared/chunk-2F64VKTU.js";

// app/utils/zod.ts
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/utils/zod.ts"
  );
  import.meta.hot.lastModified = "1737642690842.8215";
}
var customInputSchema = z.object({
  name: z.string(),
  title: z.string().min(1, { message: "Escribe un titulo para identificar tu input" }),
  placeholder: z.string().optional(),
  isRequired: z.coerce.string().optional().transform((v) => v === "true" || v === "on" ? true : false),
  type: z.union([
    z.literal("select"),
    z.literal("text"),
    z.literal("textarea")
  ]),
  // @TODO: separate types validation
  options: z.array(z.string().min(3, "Las opciones no pueden estar vac\xEDas")).optional().default([])
  // @TODO: separate types validation
}).superRefine((values, context) => {
  if (values.type === "select") {
    if (values.options.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Agrega cuando menos dos opciones",
        path: ["options"]
      });
    }
    if (values.type === "select") {
      if (!values.placeholder || values.placeholder === "") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El placeholder es necesario para un campo de selecci\xF3n",
          path: ["placeholder"]
        });
      }
    }
  }
});
var extraDataSchema = z.object({
  email: z.string().email(),
  picture: z.string()
});
var literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
var jsonSchema = z.lazy(
  () => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);
var answerSchema = z.object({
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
      phone: z.string().optional()
    }),
    z.any()
    // @TODO custom inputs?
  ]),
  schema: z.any(),
  projectId: z.string(),
  userId: z.string().optional(),
  createdAt: z.date()
});
var userSchema = z.object({
  name: z.string().optional().nullable(),
  picture: z.string().optional(),
  email: z.string().email(),
  id: z.string(),
  provider: z.string().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional()
});
var booleanString = z.string().optional().transform((value) => value === "true");
var notificationsSchema = z.object({
  new: booleanString,
  members: booleanString,
  warning: booleanString
});
var projectSettingsSchema = z.object({
  notifications: notificationsSchema
});
var configSchema = z.object({
  theme: z.union([z.literal("light"), z.literal("dark")]),
  ctaColor: z.string().min(7),
  inputs: z.array(z.string()),
  border: z.union([z.literal("redondo"), z.literal("cuadrado")]),
  customInputs: z.array(customInputSchema),
  watermark: z.boolean().optional().nullable(),
  message: z.string().optional(),
  icon: z.string().optional(),
  confetti: z.string().optional()
});
var projectSchema = z.object({
  id: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  userId: z.string(),
  answers: z.array(answerSchema).optional(),
  config: configSchema.nullable(),
  settings: projectSettingsSchema.optional()
});
var messageSchema = z.object({
  icon: z.string().nullable(),
  message: z.string().min(10),
  confetti: z.union([z.literal("paper"), z.literal("emoji")]).nullable(),
  theme: z.union([z.literal("light"), z.literal("dark")]),
  ctaColor: z.string().min(7),
  inputs: z.array(z.string()),
  border: z.union([z.literal("redondo"), z.literal("cuadrado")])
});

export {
  customInputSchema,
  configSchema,
  messageSchema
};
//# sourceMappingURL=/build/_shared/chunk-WAI7GNH5.js.map
