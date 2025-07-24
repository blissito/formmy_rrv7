import type { Route } from "./+types/api.sdk.$apiKey[.]js";
import { authenticateApiKey } from "server/chatbot/apiKeyAuth.server";
import { db } from "../utils/db.server";
import {
  chatWidgetStyles,
  processStyles,
  interactiveStyles,
} from "../sdk/chat-widget-styles";

/**
 * Dynamic script generation endpoint for SDK
 * Generates personalized JavaScript SDK script based on API key
 * URL format: /api/sdk/{apiKey}.js
 */
export const loader = async ({ params }: Route.LoaderArgs) => {
  const { apiKey } = params;

  try {
    if (!apiKey) {
      return new Response("API key required", { status: 400 });
    }

    // Authenticate API key and get user data
    const authResult = await authenticateApiKey(apiKey);
    const { user } = authResult.apiKey;

    // Fetch user's active chatbots
    const chatbots = await db.chatbot.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        welcomeMessage: true,
        primaryColor: true,
        theme: true,
        enableStreaming: true,
        streamingSpeed: true,
        personality: true,
        aiModel: true,
        status: true,
        isActive: true,
      },
    });

    // Find the requested chatbot
    const requestedChatbot = chatbots[0];

    if (!requestedChatbot) {
      return new Response("No chatbots found", { status: 404 });
    }

    // Generate the SDK script
    const script = generateSDKScript({
      apiKey,
      chatbot: requestedChatbot,
    });

    return new Response(script, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("SDK script generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

/**
 * Generate the SDK script with inline HTML creation
 */
function generateSDKScript(config: { apiKey: string; chatbot: any }): string {
  const { apiKey, chatbot } = config;

  return `
(function() {
  'use strict';
  
  if (window.FormmyChatSDK) {
    console.warn('Formmy Chat SDK already initialized');
    return;
  }

  const config = {
    apiKey: "${apiKey}",
    chatbot: ${JSON.stringify(chatbot)},
    apiBaseUrl: "/api/sdk"
  };
  
  console.log('Formmy Chat SDK loading for chatbot:', config.chatbot.name);

  const FormmyChatSDK = {
    config: config,
    sessionId: null,
    isInitialized: false,
    elements: {},

    init: function() {
      if (this.isInitialized) return;
      
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.createChatWidget();
      this.createToggleButton();
      this.isInitialized = true;
      
      console.log('Formmy Chat SDK initialized');
    },

    createChatWidget: function() {
      const botInitial = config.chatbot.name.charAt(0).toUpperCase();
      const primaryColor = config.chatbot.primaryColor || '#6366F1';
      const welcomeMessage = config.chatbot.welcomeMessage || '¡Hola! ¿Cómo puedo ayudarte hoy?';

      // Process styles with dynamic values
      const styles = ${JSON.stringify(
        processStyles(chatWidgetStyles, "{{PRIMARY_COLOR}}", "{{BOT_INITIAL}}")
      )};
      const processedStyles = {};
      for (const [key, value] of Object.entries(styles)) {
        processedStyles[key] = value
          .replace(/\{\{PRIMARY_COLOR\}\}/g, primaryColor)
          .replace(/\{\{BOT_INITIAL\}\}/g, botInitial);
      }

      // Create main container
      const container = document.createElement('section');
      container.id = 'formmy-chat-widget';
      container.style.cssText = processedStyles.container;

      // Create header
      const header = document.createElement('header');
      header.style.cssText = processedStyles.header;

      const avatar = document.createElement('div');
      avatar.style.cssText = processedStyles.avatar;
      avatar.textContent = botInitial;

      const name = document.createElement('p');
      name.style.cssText = processedStyles.botName;
      name.textContent = config.chatbot.name;

      const closeButton = document.createElement('button');
      closeButton.id = 'formmy-close-btn';
      closeButton.style.cssText = processedStyles.closeButton;
      closeButton.textContent = '×';
      
      // Add hover effect
      closeButton.onmouseenter = () => {
        closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      };
      closeButton.onmouseleave = () => {
        closeButton.style.backgroundColor = 'transparent';
      };

      header.appendChild(avatar);
      header.appendChild(name);
      header.appendChild(closeButton);

      // Create messages area
      const messagesArea = document.createElement('main');
      messagesArea.id = 'formmy-chat-messages';
      messagesArea.style.cssText = processedStyles.messagesArea;

      // Add welcome message
      const welcomeDiv = document.createElement('main');
      welcomeDiv.style.cssText = processedStyles.welcomeMessage;

      const welcomeAvatar = document.createElement('div');
      welcomeAvatar.style.cssText = processedStyles.welcomeAvatar;
      welcomeAvatar.textContent = botInitial;

      const welcomeBubble = document.createElement('div');
      welcomeBubble.style.cssText = processedStyles.welcomeBubble;

      const welcomeText = document.createElement('div');
      welcomeText.style.cssText = processedStyles.welcomeText;
      welcomeText.textContent = welcomeMessage;

      welcomeBubble.appendChild(welcomeText);
      welcomeDiv.appendChild(welcomeAvatar);
      welcomeDiv.appendChild(welcomeBubble);
      messagesArea.appendChild(welcomeDiv);

      // Create footer
      const footer = document.createElement('footer');
      footer.style.cssText = processedStyles.footer;

      const poweredBy = document.createElement('p');
      poweredBy.style.cssText = processedStyles.poweredBy;
      poweredBy.innerHTML = 'Powered by <a href="https://www.formmy.app" target="_blank" rel="noreferrer" style="color: inherit; text-decoration: underline;">Formmy.app</a>';

      const inputWrapper = document.createElement('div');
      inputWrapper.style.cssText = processedStyles.inputWrapper;

      const input = document.createElement('input');
      input.id = 'formmy-chat-input';
      input.type = 'text';
      input.placeholder = 'Escribe un mensaje...';
      input.style.cssText = processedStyles.input;

      const sendButton = document.createElement('button');
      sendButton.id = 'formmy-send-btn';
      sendButton.type = 'button';
      sendButton.style.cssText = processedStyles.sendButton;
      sendButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4z"/><path d="m22 2-10 10"/></svg>';
      
      // Add hover effect
      sendButton.onmouseenter = () => {
        sendButton.style.backgroundColor = primaryColor + '20';
      };
      sendButton.onmouseleave = () => {
        sendButton.style.backgroundColor = 'transparent';
      };

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(sendButton);
      footer.appendChild(poweredBy);
      footer.appendChild(inputWrapper);

      // Assemble widget
      container.appendChild(header);
      container.appendChild(messagesArea);
      container.appendChild(footer);
      document.body.appendChild(container);

      // Store references
      this.elements.container = container;
      this.elements.messagesContainer = messagesArea;
      this.elements.input = input;
      this.elements.sendButton = sendButton;
      this.elements.closeButton = closeButton;

      this.setupEventListeners();
    },

    createToggleButton: function() {
      const primaryColor = config.chatbot.primaryColor || '#6366F1';
      const styles = ${JSON.stringify(
        processStyles(chatWidgetStyles, "{{PRIMARY_COLOR}}", "{{BOT_INITIAL}}")
      )};
      const toggleStyle = styles.toggleButton
        .replace(/\{\{PRIMARY_COLOR\}\}/g, primaryColor);

      const button = document.createElement('button');
      button.id = 'formmy-chat-toggle';
      button.innerHTML = '💬';
      button.style.cssText = toggleStyle;

      button.onmouseenter = () => button.style.transform = 'scale(1.1)';
      button.onmouseleave = () => button.style.transform = 'scale(1)';
      button.onclick = () => this.toggleWidget();
      
      document.body.appendChild(button);
      this.elements.toggleButton = button;
    },

    setupEventListeners: function() {
      const { input, sendButton, closeButton } = this.elements;
      
      if (sendButton) {
        sendButton.onclick = () => this.handleSendMessage();
      }
      
      if (input) {
        input.onkeypress = (e) => {
          if (e.key === 'Enter') {
            this.handleSendMessage();
          }
        };
      }
      
      if (closeButton) {
        closeButton.onclick = () => this.toggleWidget();
      }
    },

    toggleWidget: function() {
      const { container, toggleButton } = this.elements;
      const isVisible = container.style.display === 'flex';
      
      container.style.display = isVisible ? 'none' : 'flex';
      toggleButton.innerHTML = isVisible ? '💬' : '×';
      
      console.log('Widget toggled, now:', isVisible ? 'hidden' : 'visible');
    },

    handleSendMessage: function() {
      const { input } = this.elements;
      const message = input.value.trim();
      
      if (!message) return;
      
      this.displayMessage(message, true);
      input.value = '';
      this.sendMessage(message);
    },

    displayMessage: function(content, isUser) {
      const { messagesContainer } = this.elements;
      if (!messagesContainer) return;
      
      const primaryColor = config.chatbot.primaryColor || '#6366F1';
      const botInitial = config.chatbot.name.charAt(0).toUpperCase();
      const styles = ${JSON.stringify(
        processStyles(chatWidgetStyles, "{{PRIMARY_COLOR}}", "{{BOT_INITIAL}}")
      )};
      const processedStyles = {};
      for (const [key, value] of Object.entries(styles)) {
        processedStyles[key] = value
          .replace(/\{\{PRIMARY_COLOR\}\}/g, primaryColor)
          .replace(/\{\{BOT_INITIAL\}\}/g, botInitial);
      }
      
      const messageDiv = document.createElement('main');
      
      if (isUser) {
        messageDiv.style.cssText = processedStyles.userMessage;
        
        const bubble = document.createElement('div');
        bubble.style.cssText = processedStyles.userBubble;
        bubble.textContent = content;
        
        const avatar = document.createElement('div');
        avatar.style.cssText = processedStyles.userAvatar;
        
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(avatar);
      } else {
        messageDiv.style.cssText = processedStyles.botMessage;
        
        const avatar = document.createElement('div');
        avatar.style.cssText = processedStyles.botMessageAvatar;
        avatar.textContent = botInitial;
        
        const bubble = document.createElement('div');
        bubble.style.cssText = processedStyles.botMessageBubble;
        bubble.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
      }

      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    sendMessage: async function(message) {
      try {
        const response = await fetch(config.apiBaseUrl + '/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey,
          },
          body: JSON.stringify({
            chatbotId: config.chatbot.id,
            message: message,
            sessionId: this.sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }

        const data = await response.json();
        this.displayMessage(data.response || 'Sorry, I could not process your message.', false);
      } catch (error) {
        console.error('Error sending message:', error);
        this.displayMessage('Sorry, there was an error processing your message. Please try again.', false);
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FormmyChatSDK.init());
  } else {
    FormmyChatSDK.init();
  }

  window.FormmyChatSDK = FormmyChatSDK;

})();
`.trim();
}
