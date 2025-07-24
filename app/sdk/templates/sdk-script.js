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
    apiBaseUrl: "http://localhost:3000/api/sdk",
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

  // Limpiar valores vacíos o placeholders no reemplazados
  Object.keys(config.chatbot).forEach((key) => {
    if (config.chatbot[key] === "" || config.chatbot[key]?.startsWith("{{")) {
      delete config.chatbot[key];
    }
  });

  // Si no hay valores válidos, usar los valores por defecto
  if (!config.chatbot.name || config.chatbot.name.startsWith("{{")) {
    config.chatbot.name = defaultConfig.chatbot.name;
  }
  if (!config.chatbot.primaryColor || config.chatbot.primaryColor.startsWith("{{")) {
    config.chatbot.primaryColor = defaultConfig.chatbot.primaryColor;
  }
  if (!config.chatbot.welcomeMessage || config.chatbot.welcomeMessage.startsWith("{{")) {
    config.chatbot.welcomeMessage = defaultConfig.chatbot.welcomeMessage;
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
      this.createChatWidget();
      this.createToggleButton();
      this.isInitialized = true;

      console.log("Formmy Chat SDK initialized");
    },

    createChatWidget: function () {
      // Store user config in object properties for access across functions
      this.primaryColor = this.config.chatbot.primaryColor || "#63CFDE";
      this.welcomeMessage =
        this.config.chatbot.welcomeMessage ||
        "¡Hola! ¿Cómo puedo ayudarte hoy?";
      this.botName = this.config.chatbot.name || "Chatbot";

      console.log("Creating chat widget with user config:");
      console.log("- Primary Color:", this.primaryColor);
      console.log("- Welcome Message:", this.welcomeMessage);
      console.log("- Bot Name:", this.botName);

      // Create main container - exactly matching ChatPreview.tsx
      const container = document.createElement("div");
      container.id = "formmy-chat-container";
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        display: none;
        flex-direction: column;
        z-index: 9999;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      `;

      // Create main article container (like ChatPreview.tsx)
      const article = document.createElement("article");
      article.style.cssText = `
        height: 100%;
        background: #fff;
        border-radius: 0.75rem;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-width: 100%;
        margin: 0 auto;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      `;

      // Create header
      const header = document.createElement("header");
      header.style.cssText = `
        background: ${this.primaryColor};
        color: white;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        border-bottom: 1px solid #e5e7eb;
      `;

      // Create avatar
      const avatar = document.createElement("div");
      avatar.style.cssText = `
        width: 2rem;
        height: 2rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.875rem;
      `;
      avatar.textContent = this.botName.charAt(0).toUpperCase();

      // Create bot name
      const name = document.createElement("h3");
      name.style.cssText = `
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      `;
      name.textContent = this.botName;

      const closeButton = document.createElement("button");
      closeButton.id = "formmy-close-btn";
      closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0 5px;
        margin-left: auto;
        border-radius: 4px;
        transition: background-color 0.2s;
      `;
      closeButton.textContent = "×";

      // Add hover effect
      closeButton.onmouseenter = () => {
        closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
      };
      closeButton.onmouseleave = () => {
        closeButton.style.backgroundColor = "transparent";
      };

      header.appendChild(avatar);
      header.appendChild(name);
      header.appendChild(closeButton);

      // Create messages container
      const messagesContainer = document.createElement("div");
      messagesContainer.id = "formmy-messages-container";
      messagesContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      `;
      
      // Track scroll position
      this.isUserAtBottom = true;
      messagesContainer.addEventListener('scroll', () => {
        const distanceFromBottom = messagesContainer.scrollHeight - (messagesContainer.scrollTop + messagesContainer.clientHeight);
        this.isUserAtBottom = distanceFromBottom <= 50;
      });

      // Create input area - identical to ChatPreview.tsx
      const inputArea = document.createElement("div");
      inputArea.style.cssText = `
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 0.5rem;
        align-items: flex-end;
      `;

      const inputWrapper = document.createElement("div");
      inputWrapper.style.cssText = `
        display: flex;
        gap: 0.5rem;
        align-items: flex-end;
        width: 100%;
      `;

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Escribe tu mensaje...";
      input.style.cssText = `
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 9999px;
        font-size: 0.875rem;
        outline: none;
        transition: all 0.2s;
        background: #f9fafb;
      `;
      input.style.borderColor = this.primaryColor;
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleSendMessage();
        }
      });

      const sendButton = document.createElement("button");
      sendButton.type = "button";
      sendButton.style.cssText = `
        padding: 0.75rem;
        background: ${this.primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        flex-shrink: 0;
      `;
      sendButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      // Add hover effects
      sendButton.onmouseenter = () => {
        sendButton.style.backgroundColor = this.primaryColor + "E6";
      };

      sendButton.onmouseleave = () => {
        sendButton.style.backgroundColor = this.primaryColor;
      };

      sendButton.addEventListener("click", () => this.handleSendMessage());

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(sendButton);
      inputArea.appendChild(inputWrapper);

      // Add welcome message
      const welcomeDiv = document.createElement("div");
      welcomeDiv.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0 1rem;
      `;

      const welcomeAvatar = document.createElement("div");
      welcomeAvatar.style.cssText = `
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: ${this.primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.75rem;
        flex-shrink: 0;
      `;
      welcomeAvatar.textContent = this.botName.charAt(0).toUpperCase();

      const welcomeBubble = document.createElement("div");
      welcomeBubble.style.cssText = `
        background: white;
        border-radius: 0.5rem;
        padding: 0.75rem;
        max-width: 24rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      `;

      const welcomeText = document.createElement("div");
      welcomeText.style.cssText = `
        font-size: 0.875rem;
        line-height: 1.25;
        color: #111827;
        margin: 0;
      `;
      welcomeText.textContent = this.welcomeMessage;

      welcomeBubble.appendChild(welcomeText);
      welcomeDiv.appendChild(welcomeAvatar);
      welcomeDiv.appendChild(welcomeBubble);

      messagesContainer.appendChild(welcomeDiv);

      // Create footer with Formmy.app link
      const footer = document.createElement("div");
      footer.style.cssText = `
        padding: 0.5rem 1rem;
        text-align: center;
        font-size: 0.75rem;
        color: #6b7280;
        border-top: 1px solid #f3f4f6;
        background: #fafafa;
      `;
      
      const footerText = document.createElement("div");
      footerText.innerHTML = `
        Powered by <a href="https://formmy.app" target="_blank" rel="noopener noreferrer" style="color: ${this.primaryColor}; text-decoration: none; font-weight: 500;">Formmy.app</a>
      `;
      footer.appendChild(footerText);

      // Assemble the complete chat widget structure
      article.appendChild(header);
      article.appendChild(messagesContainer);
      article.appendChild(inputArea);
      article.appendChild(footer);
      container.appendChild(article);

      // Add to body
      document.body.appendChild(container);

      // Store references
      this.elements = {
        container,
        article,
        messagesContainer,
        input,
        sendButton,
        closeButton,
        inputWrapper,
        inputArea,
      };

      // Add event listeners
      this.setupEventListeners();
    },

    createToggleButton: function () {
      const toggleButton = document.createElement("button");
      toggleButton.id = "formmy-chat-toggle";
      toggleButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.primaryColor} !important;
        color: white !important;
        border: none;
        cursor: pointer;
        font-size: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 9998;
        display: flex !important;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        opacity: 1 !important;
      `;

      // Add icon (can be replaced with an SVG)
      toggleButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      document.body.appendChild(toggleButton);
      this.elements.toggleButton = toggleButton;

      // Toggle chat on click
      toggleButton.addEventListener("click", () => {
        this.toggleChat();
      });
    },

    setupEventListeners: function () {
      const { input, sendButton, closeButton } = this.elements;

      // Send message on button click
      sendButton.addEventListener("click", () => this.handleSendMessage());

      // Send message on Enter key
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      // Close chat
      closeButton.addEventListener("click", () => {
        this.toggleChat(false);
      });
    },

    toggleChat: function (show = null) {
      const { container, toggleButton } = this.elements;
      const isVisible = container.style.display !== "none";
      const shouldShow = show !== null ? show : !isVisible;

      container.style.display = shouldShow ? "flex" : "none";

      // Update toggle button text/icon based on visibility
      if (toggleButton) {
        toggleButton.innerHTML = shouldShow
          ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }

      // Focus input when chat opens
      if (shouldShow && this.elements.input) {
        setTimeout(() => {
          this.elements.input.focus();
        }, 100);
      }
    },

    displayMessage: function (text, isUser = false) {
      const { messagesContainer } = this.elements;

      if (isUser) {
        // User message (right-aligned)
        const messageDiv = document.createElement("div");
        messageDiv.style.cssText = `
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 0 1rem;
        `;

        const bubble = document.createElement("div");
        bubble.style.cssText = `
          background: ${this.primaryColor};
          color: white;
          border-radius: 0.5rem;
          padding: 0.5rem;
          max-width: 16rem;
        `;

        const textElement = document.createElement("p");
        textElement.style.cssText = `
          font-size: 0.875rem;
          color: white;
          white-space: pre-line;
          line-height: 1.25;
          margin: 0;
        `;
        textElement.textContent = text;

        bubble.appendChild(textElement);
        messageDiv.appendChild(bubble);

        // Add user avatar placeholder
        const userAvatar = document.createElement("div");
        userAvatar.style.cssText = `
          width: 2rem;
          height: 2rem;
          background: #9ca3af;
          border-radius: 50%;
          flex-shrink: 0;
        `;
        messageDiv.appendChild(userAvatar);

        messagesContainer.appendChild(messageDiv);
      } else {
        // Assistant message (left-aligned)
        const messageDiv = document.createElement("div");
        messageDiv.style.cssText = `
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0 1rem;
        `;

        const avatar = document.createElement("div");
        avatar.style.cssText = `
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: ${this.primaryColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.75rem;
          flex-shrink: 0;
        `;
        avatar.textContent = this.botName.charAt(0).toUpperCase();

        const bubble = document.createElement("div");
        bubble.style.cssText = `
          background: white;
          border-radius: 0.5rem;
          padding: 0.75rem;
          max-width: 24rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        `;

        const contentDiv = document.createElement("div");
        contentDiv.style.cssText = `
          font-size: 0.875rem;
          line-height: 1.25;
          color: #111827;
          white-space: pre-line;
          margin: 0;
        `;
        contentDiv.textContent = text;

        bubble.appendChild(contentDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);

        messagesContainer.appendChild(messageDiv);
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    showTypingIndicator: function () {
      const messagesContainer = this.elements.messagesContainer;
      
      // Always clean up first
      this.hideTypingIndicator();
      
      const typingDiv = document.createElement("div");
      typingDiv.id = "formmy-typing-indicator";
      typingDiv.style.cssText = `
        display: flex;
        align-items: center;
        margin: 8px 0;
        justify-content: flex-start;
      `;

      const dots = document.createElement("div");
      dots.style.cssText = `
        display: flex;
        gap: 4px;
        padding: 10px 16px;
        background: #f3f4f6;
        border-radius: 18px 18px 18px 4px;
        align-items: center;
      `;

      for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.style.cssText = `
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          display: inline-block;
          animation: typing 1.4s ease-in-out ${i * 0.15}s infinite;
        `;
        dots.appendChild(dot);
      }

      typingDiv.appendChild(dots);
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      const style = document.createElement("style");
      style.id = "typing-animation";
      style.textContent = `
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    },

    hideTypingIndicator: function () {
      const typingIndicator = document.getElementById("formmy-typing-indicator");
      const animationStyle = document.getElementById("typing-animation");

      if (typingIndicator) typingIndicator.remove();
      if (animationStyle) animationStyle.remove();
    },

    handleSendMessage: async function () {
      const { input } = this.elements;
      const message = input.value.trim();

      if (!message) return;

      // Clear input
      input.value = "";

      // Display user message
      this.displayMessage(message, true);

      await this.sendMessage(message);
    },

    sendMessage: async function (message) {
      try {
        this.showTypingIndicator();

        const response = await fetch(`${this.config.apiBaseUrl}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.config.apiKey,
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            chatbotId: this.config.chatbot.id,
            message: message,
            sessionId: this.sessionId,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error("HTTP error! status: " + response.status);
        }

        // Handle streaming response
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";
          let isFirstChunk = true;

          // Create message container for the bot's response
          const messageDiv = document.createElement("div");
          messageDiv.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 8px 12px;
          `;

          const avatar = document.createElement("div");
          avatar.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${this.config.chatbot.primaryColor || "#6366F1"};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
          `;
          avatar.textContent = this.config.chatbot.name.charAt(0).toUpperCase();

          const bubble = document.createElement("div");
          bubble.style.cssText = `
            background: #f3f4f6;
            border-radius: 18px 18px 18px 0;
            padding: 12px 16px;
            max-width: 70%;
            font-size: 14px;
            line-height: 1.4;
            word-wrap: break-word;
          `;

          messageDiv.appendChild(avatar);
          messageDiv.appendChild(bubble);

          const messagesContainer = this.elements.messagesContainer;
          messagesContainer.appendChild(messageDiv);
          // Only auto-scroll if user hasn't scrolled up
          const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;
          if (isScrolledToBottom) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }

          // Ensure typing indicator is removed before processing
          this.hideTypingIndicator();
          // Process the stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              this.hideTypingIndicator();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk
              .split("\n")
              .filter((line) => line.trim() !== "");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.replace("data: ", "").trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullResponse += parsed.content;

                            bubble.textContent += parsed.content;
                   
                   // Scroll to bottom only if user is at bottom
                   if (this.isUserAtBottom) {
                     messagesContainer.scrollTop = messagesContainer.scrollHeight;
                   }
                  }
                } catch (e) {
                  console.error("Error parsing SSE data:", e);
                }
              }
            }
          }
        } else {
          // Fallback to non-streaming if SSE not supported
          const data = await response.json();
          // Add the complete message to history
          this.messages.push({
            role: "assistant",
            content: fullResponse,
          });
          // Ensure typing indicator is removed
          this.hideTypingIndicator();
          this.displayMessage(
            data.response || "Sorry, I could not process your message.",
            false
          );
        }
      } catch (error) {
        console.error("Error:", error);
        this.hideTypingIndicator();
        this.displayMessage(
          "Sorry, there was an error processing your message. Please try again.",
          false
        );
      } finally {
        this.hideTypingIndicator();
      }
    },
  };

  // Ensure DOM is ready before initializing
  function initializeSDK() {
    if (!window.FormmyChatSDK || !window.FormmyChatSDK.isInitialized) {
      window.FormmyChatSDK = FormmyChatSDK;
      FormmyChatSDK.init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSDK);
  } else {
    initializeSDK();
  }

  window.FormmyChatSDK = FormmyChatSDK;
})(
  typeof window !== "undefined" ? window : this,
  typeof document !== "undefined" ? document : {}
);
