import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  // Index route
  index("routes/_index.tsx"),

  // Admin routes
  route("admin", "routes/admin.tsx", [
    route("users", "routes/admin.users.tsx"),
    route("projects", "routes/admin.projects.tsx"),
  ]),

  // Dashboard routes
  route("dashboard", "routes/dashboard.tsx", [
    route("chat", "routes/dashboard.chat.tsx"),
    route("chat/nuevo", "routes/dashboard.chat_.nuevo.tsx"),
    route("chat/:chatbotSlug", "routes/dashboard.chat_.$chatbotSlug.tsx"),
    route("ghosty", "routes/dashboard.ghosty.tsx"),
    route("plan", "routes/dashboard.plan.tsx"),
    route("formmys", "routes/dashboard.formmys.tsx"),
    route("formmys/new", "routes/dashboard.formmys.new.tsx"),
    route("formmys/:projectId", "routes/dashboard.formmys_.$projectId.tsx"),
    route(
      "formmys/:projectId/code",
      "routes/dashboard.formmys_.$projectId_.code.tsx"
    ),
    route(
      "formmys/:projectId/edition",
      "routes/dashboard.formmys_.$projectId_.edition.tsx"
    ),
    route(
      "formmys/:projectId/edition/custom",
      "routes/dashboard.formmys_.$projectId_.edition.custom.tsx"
    ),
    route(
      "formmys/:projectId/settings",
      "routes/dashboard.formmys_.$projectId_.settings.tsx"
    ),
    route("ayuda", "routes/dashboard.ayuda.tsx"),
  ]),

  // Legacy dash routes
  route("dash", "routes/dash.tsx"),
  route("dash/new", "routes/dash.new.tsx"),
  route("dash/:projectId", "routes/dash_.$projectId.tsx"),
  route("dash/:projectId/edit", "routes/dash_.$projectId_.edit.tsx"),
  route("dash/:projectId/settings", "routes/dash_.$projectId_.settings.tsx", [
    route("access", "routes/dash_.$projectId_.settings.access.tsx"),
    route("danger", "routes/dash_.$projectId_.settings.danger.tsx"),
    route(
      "notifications",
      "routes/dash_.$projectId_.settings.notifications.tsx"
    ),
  ]),

  // Config routes
  route("config/:projectId/basic", "routes/config.$projectId.basic.tsx"),
  route(
    "config/:projectId/basic/custom",
    "routes/config.$projectId.basic.custom.tsx"
  ),
  route("config/:projectId/message", "routes/config.$projectId.message.tsx"),
  route("config/:projectId/share", "routes/config.$projectId.share.tsx"),

  // Chat routes
  route("chat", "routes/chat.tsx"),
  route("chat/embed", "routes/chat_.embed.tsx"),
  route("chat/404", "routes/chat.404.tsx"),
  route("chat-ia", "routes/chat-ia.tsx"),

  // Public content routes
  route("formularios", "routes/formularios.tsx"),
  route("planes", "routes/planes.tsx"),
  route("profile", "routes/profile.tsx"),
  route("terms", "routes/terms.tsx"),
  route("aviso", "routes/aviso.tsx"),
  route("academy", "routes/academy.tsx"),
  route("blissmo", "routes/blissmo.tsx"),
  route("compartir", "routes/compartir.tsx"),
  route("feedback", "routes/feedback.tsx"),
  route("full", "routes/full.tsx"),
  route("gracias", "routes/gracias.tsx"),

  // Blog routes
  route("blog", "routes/blog._index.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),

  // Embed and preview routes
  route("embed/:projectId", "routes/embed.$projectId.tsx"),
  route("preview/:projectId", "routes/preview.$projectId.tsx"),

  // Form routes
  route(":projectSlug/form", "routes/$projectSlug.form.tsx"),

  // API routes - Stripe & Webhooks
  route("api/stripe", "routes/api.stripe.tsx"),
  route("stripe/webhook", "routes/stripe.webhook.tsx"),
  route("api/login", "routes/api.login.tsx"),
  route("api/self", "routes/api.self.tsx"),
  route("api/utils", "routes/api.utils.tsx"),
  route("api/answers", "routes/api.answers.tsx"),
  route("api/formmy", "routes/api.formmy.tsx"),

  // API v1 routes
  route("api/v1/chatbot", "routes/api.v1.chatbot.ts"),
  // =========================================================
  route("api/v1/messages", "routes/api.v1.messages.ts"),
  route("api/v1/apikey", "routes/api.v1.apikey.ts"),
  route("api/v1/context", "routes/api.v1.context.ts"),
  route("api/v1/calendar", "routes/api.v1.calendar.ts"),
  route("api/v1/export", "routes/api.v1.export.ts"),
  route("api/v1/fetch-website", "routes/api.v1.fetch-website.ts"),
  route("api/v1/google/config", "routes/api.v1.google.config.ts"),
  route("api/v1/integration", "routes/api.v1.integration.ts"),
  route(
    "api/v1/integrations/whatsapp",
    "routes/api.v1.integrations.whatsapp.tsx"
  ),
  route(
    "api/v1/integrations/whatsapp/send",
    "routes/api.v1.integrations.whatsapp.send.ts"
  ),
  route(
    "api/v1/integrations/whatsapp/webhook",
    "routes/api.v1.integrations.whatsapp.webhook.tsx"
  ),
  route(
    "api/v1/oauth2/google/calendar/callback",
    "routes/api.v1.oauth2.google.calendar.callback.ts"
  ),
  route("api/v1/referral", "routes/api.v1.referral.ts"),

  // API Ghosty routes
  route("api/ghosty/chat", "routes/api.ghosty.chat.ts"),
  route("api/ghosty/chat/enhanced", "routes/api.ghosty.chat.enhanced.ts"),
  route("api/ghosty/tools", "routes/api.ghosty.tools.ts"),

  // API S3 routes
  route("api/s3/presigned-url", "routes/api.s3.presigned-url.ts"),
  route("api/s3/delete-old-avatars", "routes/api.s3.delete-old-avatars.ts"),

  // API Download routes
  route(
    "api/download/:projectId.csv",
    "routes/api.download.$projectId[.]csv.tsx"
  ),

  // Well-known routes
  route(".well-known/*", "routes/.well-known.$.tsx"),

  // Catch-all route (should be last)
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
