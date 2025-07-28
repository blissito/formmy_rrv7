import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Define routes that should be handled by the router
  routes: [
    // System routes (handle first to avoid conflicts)
    { path: "/.well-known/*", component: "./app/routes/.well-known.$.tsx" },

    // Chatbot management routes
    { path: "/chat", component: "./app/routes/chat.tsx" },
    { path: "/chat/config", component: "./app/routes/chat.config.tsx" },
    {
      path: "/chat/config/:chatbotId",
      component: "./app/routes/chat.config.$chatbotId.tsx",
    },
    { path: "/chat/*", component: "./app/routes/chat.404.tsx" },

    
    // Catch-all route (must be last)
    { path: "*", component: "./app/routes/$.tsx" },
  ],
} satisfies Config;
