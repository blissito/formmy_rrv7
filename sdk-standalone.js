(function (global, doc) {
  "use strict";

  // Check if we're in a browser environment
  if (typeof global === 'undefined' || typeof doc === 'undefined') {
    console.warn('Formmy Chat SDK requires a browser environment');
    return;
  }

  // Get configuration from global scope
  const config = global.FormmyChatConfig || {
    chatbot: {
      id: 'default',
      name: 'Geeki',
      primaryColor: '#63CFDE',
      welcomeMessage: '¡Hola! ¿Cómo puedo ayudarte hoy?'
    },
    apiBaseUrl: 'http://localhost:3000',
    apiKey: 'test'
  };

  const FormmyChatSDK = {
    config: config,
    elements: {},
    sessionId: null,
    isInitialized: false,

    // Helper function to convert hex to RGB
    hexToRgb: function(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) :
        '99, 207, 222';
    },

    init: function () {
      if (this.isInitialized) return;

      this.sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      this.createChatWidget();
      this.createToggleButton();
      this.isInitialized = true;

      console.log("Formmy Chat SDK initialized");
    },

    createChatWidget: function () {
      // Store user config in object properties for access across functions
      this.primaryColor = this.config.chatbot.primaryColor;
      this.welcomeMessage = this.config.chatbot.welcomeMessage;
      this.botName = this.config.chatbot.name;
      
      console.log('Creating chat widget with user config:');
      console.log('- Primary Color:', this.primaryColor);
      console.log('- Welcome Message:', this.welcomeMessage);
      console.log('- Bot Name:', this.botName);

      // Create main container - exactly matching ChatPreview.tsx
      const container = document.createElement("main");
      container.id = "formmy-chat-widget";
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 100%;
        max-width: 32rem;
        height: 600px;
        background: rgba(${this.primaryColor ? this.hexToRgb(this.primaryColor) : '99, 207, 222'}, 0.125);
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        display: none;
        flex-direction: column;
        z-index: 9999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
        padding: 1rem;
      `;

      // Create main article container (exactly like ChatPreview.tsx)
      const article = document.createElement("article");
      article.style.cssText = `
        height: 90%;
        background: #fff;
        border-radius: 1.5rem;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        max-width: 32rem;
        margin: 0 auto;
      `;

      // Create header (matching ChatHeader component)
      const header = document.createElement("section");
      header.style.cssText = `
        background: rgba(99, 207, 222, 0.1);
        display: flex;
        align-items: center;
        padding: 0.75rem;
        height: min-content;
        gap: 0.75rem;
      `;

      // Create avatar (matching Avatar component)
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

      // Create bot name
      const name = document.createElement("p");
      name.style.cssText = `
        margin: 0;
        font-weight: 500;
        font-size: 0.75rem;
        color: #111827;
      `;
      name.textContent = this.botName;

      const closeButton = document.createElement("button");
      closeButton.id = "formmy-close-btn";
      closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: #6b7280;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
        margin-left: auto;
        border-radius: 4px;
        transition: background-color 0.2s;
      `;
      closeButton.textContent = "×";

      // Add hover effect
      closeButton.onmouseenter = () => {
        closeButton.style.backgroundColor = "rgba(107, 114, 128, 0.1)";
      };
      closeButton.onmouseleave = () => {
        closeButton.style.backgroundColor = "transparent";
      };

      header.appendChild(avatar);
      header.appendChild(name);
      header.appendChild(closeButton);

      // Create messages container (matching ChatPreview.tsx)
      const messagesContainer = document.createElement("section");
      messagesContainer.style.cssText = `
        flex: 1;
        padding-right: 1rem;
        padding-top: 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        scroll-behavior: smooth;
      `;

      // Create input container (matching ChatInput component)
      const inputContainer = document.createElement("section");
      inputContainer.style.cssText = `
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
      `;

      const inputWrapper = document.createElement("div");
      inputWrapper.style.cssText = `
        display: flex;
        gap: 0.5rem;
        align-items: flex-end;
      `;

      const input = document.createElement("textarea");
      input.id = "formmy-chat-input";
      input.placeholder = "Escribe tu mensaje...";
      input.style.cssText = `
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        outline: none;
        font-size: 0.875rem;
        font-family: inherit;
        resize: none;
        min-height: 2.5rem;
        max-height: 6rem;
        background: white;
        transition: border-color 0.2s, box-shadow 0.2s;
        line-height: 1.25;
      `;
      input.rows = 1;
      
      // Add focus and blur effects
      input.addEventListener('focus', () => {
        input.style.borderColor = this.config.chatbot.primaryColor || '#63CFDE';
        input.style.boxShadow = '0 0 0 2px rgba(99, 207, 222, 0.2)';
      });
      
      input.addEventListener('blur', () => {
        input.style.borderColor = '#d1d5db';
        input.style.boxShadow = 'none';
      });

      const sendButton = document.createElement("button");
      sendButton.id = "formmy-send-btn";
      sendButton.style.cssText = `
        padding: 0.5rem 1rem;
        background: ${this.primaryColor} !important;
        color: white !important;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.2s;
        white-space: nowrap;
        height: 2.5rem;
        min-width: 4rem;
        display: block !important;
        opacity: 1 !important;
      `;
      sendButton.textContent = "Enviar";
      
      // Add hover effects
      sendButton.onmouseenter = () => {
        sendButton.style.backgroundColor = this.primaryColor + 'E6';
      };

      sendButton.onmouseleave = () => {
        sendButton.style.backgroundColor = this.primaryColor;
      };

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(sendButton);
      inputContainer.appendChild(inputWrapper);

      // Add welcome message
      const welcomeDiv = document.createElement("main");
      welcomeDiv.style.cssText = `
        padding-left: 1rem;
        padding-right: 1rem;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
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
        white-space: pre-line;
        margin: 0;
      `;
      welcomeText.textContent = this.welcomeMessage;

      welcomeBubble.appendChild(welcomeText);
      welcomeDiv.appendChild(welcomeAvatar);
      welcomeDiv.appendChild(welcomeBubble);
      messagesContainer.appendChild(welcomeDiv);

      // Assemble the complete chat widget structure
      article.appendChild(header);
      article.appendChild(messagesContainer);
      article.appendChild(inputContainer);
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
        inputContainer
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
        z-index: 10001;
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
      if (sendButton) {
        sendButton.addEventListener("click", () => {
          const message = input.value.trim();
          if (message) {
            this.displayMessage(message, true);
            input.value = "";
            // Simulate bot response
            setTimeout(() => {
              this.displayMessage("¡Gracias por tu mensaje! Esta es una respuesta de prueba.", false);
            }, 1000);
          }
        });
      }

      // Send message on Enter key
      if (input) {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
          }
        });
      }

      // Close chat
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          this.toggleChat(false);
        });
      }
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
          background: ${this.config.chatbot.primaryColor};
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
        const messageDiv = document.createElement("main");
        messageDiv.style.cssText = `
          padding-left: 1rem;
          padding-right: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        `;

        const avatar = document.createElement("div");
        avatar.style.cssText = `
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: ${this.config.chatbot.primaryColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.75rem;
          flex-shrink: 0;
        `;
        avatar.textContent = this.config.chatbot.name.charAt(0).toUpperCase();

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
    }
  };

  // Ensure DOM is ready before initializing
  function initializeSDK() {
    if (!global.FormmyChatSDK || !global.FormmyChatSDK.isInitialized) {
      global.FormmyChatSDK = FormmyChatSDK;
      FormmyChatSDK.init();
    }
  }
  
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", initializeSDK);
  } else {
    initializeSDK();
  }

  global.FormmyChatSDK = FormmyChatSDK;
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
