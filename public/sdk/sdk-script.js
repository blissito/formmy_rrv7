// SDK Template - This will be processed with dynamic values
(function (global, doc) {
  "use strict";

  // Ensure we have proper context
  const window = global || (typeof window !== "undefined" ? window : {});
  const document = doc || (typeof document !== "undefined" ? document : {});

  // Skip if no proper environment
  if (!window || !document) {
    console.warn("Formmy Chat SDK: No valid window/document context found");
    return;
  }

  // Prevent multiple initializations by checking if already defined
  if (window.FormmyChatSDK && window.FormmyChatSDK.isInitialized) {
    console.warn("Formmy Chat SDK already initialized");
    return;
  }

  // Configuración por defecto
  const defaultConfig = {
    apiKey: "",
    chatbot: {
      name: "Chatbot",
      primaryColor: "#6366F1",
      welcomeMessage: "¡Hola! ¿Cómo puedo ayudarte hoy?",
    },
    // Endpoint dinámico según entorno
    get apiBaseUrl() {
      const host = (typeof window !== 'undefined' ? window.location.hostname : '');
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3000/api/sdk';
      }
      return 'https://formmy-v2.fly.dev/api/sdk';
    },
  };

  // Configuración desde el servidor (sin parseo de JSON)
  const serverConfig = {
    apiKey: "{{API_KEY}}",
    // Inyectar el objeto directamente desde el servidor
    chatbot: {
      name: "{{CHATBOT_NAME}}",
      id: "{{CHATBOT_ID}}",
      primaryColor: "{{CHATBOT_PRIMARY_COLOR}}",
      welcomeMessage: "{{CHATBOT_WELCOME_MESSAGE}}",
    },
  };

  // Combinar configuraciones (default + server)
  const config = {
    ...defaultConfig,
    ...serverConfig,
    // Asegurarse de que apiKey siempre tenga un valor
    apiKey: serverConfig.apiKey || defaultConfig.apiKey,
    // Combinar la configuración del chatbot
    chatbot: {
      ...defaultConfig.chatbot,
      ...serverConfig.chatbot,
    },
  };

  // Limpiar valores vacíos
  Object.keys(config.chatbot).forEach((key) => {
    if (config.chatbot[key] === "") {
      delete config.chatbot[key];
    }
  });

  // Si no hay nombre de chatbot, usar el valor por defecto
  if (!config.chatbot.name || config.chatbot.name.startsWith("{{")) {
    config.chatbot.name = defaultConfig.chatbot.name;
  }

  console.log("Formmy Chat SDK loading for chatbot:", config.chatbot.name);

  const FormmyChatSDK = {
    config: config,
    sessionId: null,
    isInitialized: false,
    elements: {},

    hexToRgb: function (hex) {
      // Convert hex to RGB for rgba usage
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? parseInt(result[1], 16) +
            "," +
            parseInt(result[2], 16) +
            "," +
            parseInt(result[3], 16)
        : "99,207,222"; // fallback to default color
    },

    init: function () {
      if (this.isInitialized) return;

      this.sessionId =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
