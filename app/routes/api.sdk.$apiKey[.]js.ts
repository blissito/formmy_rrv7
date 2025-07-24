import type { Route } from "./+types/api.sdk.$apiKey[.]js";
import { authenticateApiKey } from "server/chatbot/apiKeyAuth.server";
import { db } from "../utils/db.server";

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

    // Fetch user's active chatbots with streaming configuration
    const chatbots = await db.chatbot.findMany({
      where: {
        // @todo only active ones
        userId: user.id,
        // Remove the isActive and status filters to get all chatbots for now
        // We can add these back later if needed
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

    console.log(
      `Found ${chatbots.length} chatbots for user ${user.id}:`,
      chatbots.map((c) => ({
        slug: c.slug,
        status: c.status,
        isActive: c.isActive,
      }))
    );

    // Generate personalized script
    const script = generateSDKScript({
      apiKey,
      userId: user.id,
      chatbots,
      plan: user.plan,
    });

    return new Response(script, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate", // Disable cache for debugging
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*", // Allow cross-origin requests
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Response) {
      return error;
    }

    console.error("SDK script generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

/**
 * Interface for SDK script configuration
 */
interface SDKConfig {
  apiKey: string;
  userId: string;
  chatbots: Array<{
    id: string;
    slug: string;
    name: string;
    welcomeMessage: string | null;
    primaryColor: string | null;
    theme: string | null;
    enableStreaming: boolean;
    streamingSpeed: number;
    personality: string | null;
    aiModel: string;
  }>;
  plan: string;
}

/**
 * Generates the personalized SDK script with embedded configuration
 */
function generateSDKScript(config: SDKConfig): string {
  const { apiKey, userId, chatbots, plan } = config;

  return `
(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.FormmyChatSDK) {
    console.warn('Formmy Chat SDK already initialized');
    return;
  }

  // SDK Configuration embedded at build time
  const config = ${JSON.stringify(
    {
      apiKey,
      userId,
      chatbots,
      plan,
      version: "1.0.0",
      apiBaseUrl: "/api/sdk",
    },
    null,
    2
  )};

  // Auto-detect chatbot from script data attributes or use first active one
  const scriptElement = document.currentScript;
  const requestedChatbot = scriptElement?.dataset?.chatbot;
  
  console.log('SDK Debug Info:', {
    requestedChatbot,
    availableChatbots: config.chatbots.map(c => ({ slug: c.slug, name: c.name })),
    totalChatbots: config.chatbots.length
  });
  
  const chatbot = config.chatbots.find(c => c.slug === requestedChatbot) || config.chatbots[0];

  if (!chatbot) {
    console.warn('No chatbots found for API key: ${apiKey}');
    console.warn('Available chatbots:', config.chatbots);
    console.warn('Requested chatbot slug:', requestedChatbot);
    return;
  }
  
  console.log('Using chatbot:', { slug: chatbot.slug, name: chatbot.name });

  // SDK Core functionality
  const FormmyChatSDK = {
    config: config,
    chatbot: chatbot,
    sessionId: null,
    isInitialized: false,
    elements: {},

    // Initialize the SDK
    init: function() {
      if (this.isInitialized) return;
      
      // Generate unique session ID
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Get configuration from script data attributes
      const theme = scriptElement?.dataset?.theme || chatbot.theme || 'light';
      const position = scriptElement?.dataset?.position || 'bottom-right';
      
      // Create chat widget
      this.createChatWidget(theme, position);
      this.isInitialized = true;
      
      console.log('Formmy Chat SDK initialized for chatbot:', chatbot.name);
    },

    // Create the chat widget DOM elements
    createChatWidget: function(theme, position) {
      // Create widget container
      const container = document.createElement('div');
      container.id = 'formmy-chat-widget';
      container.style.cssText = \`
        position: fixed;
        \${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        \${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        width: 350px;
        height: 500px;
        background: \${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
        border: 1px solid \${theme === 'dark' ? '#333' : '#e1e5e9'};
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 10002;
        display: none;
        flex-direction: column;
        overflow: hidden;
      \`;

      // Create header
      const header = this.createChatHeader(theme);
      container.appendChild(header);

      // Create messages container
      const messagesContainer = document.createElement('div');
      messagesContainer.id = 'formmy-chat-messages';
      messagesContainer.style.cssText = \`
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: \${theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
      \`;
      container.appendChild(messagesContainer);

      // Create input container
      const inputContainer = this.createChatInput(theme);
      container.appendChild(inputContainer);

      // Create toggle button
      const toggleButton = this.createToggleButton(theme, chatbot.primaryColor);
      
      // Add to page
      document.body.appendChild(container);
      document.body.appendChild(toggleButton);
      
      // Store references
      this.elements = {
        container,
        header,
        messagesContainer,
        inputContainer,
        toggleButton
      };

      // Add welcome message
      if (chatbot.welcomeMessage) {
        this.displayMessage(chatbot.welcomeMessage, false);
      }

      // Setup event listeners
      this.setupEventListeners();
    },

    // Create chat header
    createChatHeader: function(theme) {
      const header = document.createElement('div');
      header.style.cssText = \`
        padding: 16px;
        background: \${chatbot.primaryColor || '#007bff'};
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      \`;

      const title = document.createElement('div');
      title.style.cssText = 'font-weight: 600; font-size: 16px;';
      title.textContent = chatbot.name;

      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.cssText = \`
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      \`;
      closeButton.onclick = () => this.toggleWidget();

      header.appendChild(title);
      header.appendChild(closeButton);
      return header;
    },

    // Create chat input
    createChatInput: function(theme) {
      const container = document.createElement('div');
      container.style.cssText = \`
        padding: 16px;
        border-top: 1px solid \${theme === 'dark' ? '#333' : '#e1e5e9'};
        background: \${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
      \`;

      const inputWrapper = document.createElement('div');
      inputWrapper.style.cssText = 'display: flex; gap: 8px;';

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Type your message...';
      input.style.cssText = \`
        flex: 1;
        padding: 12px;
        border: 1px solid \${theme === 'dark' ? '#333' : '#e1e5e9'};
        border-radius: 8px;
        background: \${theme === 'dark' ? '#2a2a2a' : '#ffffff'};
        color: \${theme === 'dark' ? '#ffffff' : '#000000'};
        font-size: 14px;
        outline: none;
      \`;

      const sendButton = document.createElement('button');
      sendButton.textContent = 'Send';
      sendButton.style.cssText = \`
        padding: 12px 16px;
        background: \${chatbot.primaryColor || '#007bff'};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      \`;

      inputWrapper.appendChild(input);
      inputWrapper.appendChild(sendButton);
      container.appendChild(inputWrapper);

      // Store input reference
      this.elements.input = input;
      this.elements.sendButton = sendButton;

      return container;
    },

    // Create toggle button
    createToggleButton: function(theme, primaryColor) {
      const button = document.createElement('button');
      button.id = 'formmy-chat-toggle';
      button.innerHTML = '💬';
      button.style.cssText = \`
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: \${primaryColor || '#007bff'};
        color: white;
        border: none;
        cursor: pointer;
        font-size: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      \`;

      button.onmouseenter = () => button.style.transform = 'scale(1.1)';
      button.onmouseleave = () => button.style.transform = 'scale(1)';
      button.onclick = () => this.toggleWidget();

      return button;
    },

    // Setup event listeners
    setupEventListeners: function() {
      const { input, sendButton } = this.elements;
      
      // Send message on button click
      sendButton.onclick = () => this.handleSendMessage();
      
      // Send message on Enter key
      input.onkeypress = (e) => {
        if (e.key === 'Enter') {
          this.handleSendMessage();
        }
      };
    },

    // Toggle widget visibility
    toggleWidget: function() {
      const { container, toggleButton } = this.elements;
      const isVisible = container.style.display === 'flex';
      
      container.style.display = isVisible ? 'none' : 'flex';
      toggleButton.innerHTML = isVisible ? '💬' : '×';
    },

    // Handle sending a message
    handleSendMessage: function() {
      const { input } = this.elements;
      const message = input.value.trim();
      
      if (!message) return;
      
      // Display user message
      this.displayMessage(message, true);
      input.value = '';
      
      // Send to API
      this.sendMessage(message);
    },

    // Simple text formatter (no regex)
    parseMarkdown: function(text) {
      if (!text) return text;
      
      // Use split and join instead of regex to avoid syntax errors
      return text.split('\\n').join('<br>');
    },

    // Display a message in the chat
    displayMessage: function(content, isUser) {
      const { messagesContainer } = this.elements;
      
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = \`
        margin-bottom: 12px;
        display: flex;
        \${isUser ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
      \`;

      const bubble = document.createElement('div');
      bubble.style.cssText = \`
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
        \${isUser 
          ? \`background: \${chatbot.primaryColor || '#007bff'}; color: white; border-bottom-right-radius: 4px;\`
          : \`background: #e9ecef; color: #333; border-bottom-left-radius: 4px;\`
        }
      \`;
      
      // For user messages, use plain text. For bot messages, parse markdown
      if (isUser) {
        bubble.textContent = content;
      } else {
        bubble.innerHTML = this.parseMarkdown(content);
        // Add basic styles for markdown elements
        if (!document.getElementById('formmy-markdown-styles')) {
          const style = document.createElement('style');
          style.id = 'formmy-markdown-styles';
          style.textContent = \`
            #formmy-chat-widget strong {
              font-weight: bold;
            }
            #formmy-chat-widget em {
              font-style: italic;
            }
            #formmy-chat-widget code {
              background: rgba(0,0,0,0.1);
              padding: 2px 4px;
              border-radius: 3px;
              font-family: monospace;
              font-size: 12px;
            }
          \`;
          document.head.appendChild(style);
        }
      }

      messageDiv.appendChild(bubble);
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      return bubble;
    },

    // Show typing indicator
    showTypingIndicator: function() {
      const indicator = this.displayMessage('...', false);
      indicator.id = 'typing-indicator';
      indicator.style.fontStyle = 'italic';
      indicator.style.opacity = '0.7';
      return indicator;
    },

    // Hide typing indicator
    hideTypingIndicator: function() {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) {
        indicator.parentElement.remove();
      }
    },

    // Send message to API
    sendMessage: async function(message) {
      try {
        const response = await fetch(config.apiBaseUrl + '/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey,
          },
          body: JSON.stringify({
            chatbotId: chatbot.id,
            message: message,
            sessionId: this.sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }

        // Check if streaming is enabled and response is SSE
        const contentType = response.headers.get('content-type');
        if (chatbot.enableStreaming && contentType?.includes('text/event-stream')) {
          this.handleStreamingResponse(response);
        } else {
          // Handle regular JSON response
          const data = await response.json();
          this.displayMessage(data.response || 'Sorry, I could not process your message.', false);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        this.displayMessage('Sorry, there was an error processing your message. Please try again.', false);
      }
    },

    // Handle streaming response
    handleStreamingResponse: function(response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let messageElement = this.showTypingIndicator();
      let fullMessage = '';

      const readStream = async () => {
        try {
          const { done, value } = await reader.read();

          if (done) {
            this.hideTypingIndicator();
            if (fullMessage) {
              this.displayMessage(fullMessage, false);
            }
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'chunk' && data.content) {
                  fullMessage += data.content;
                  // Update the typing indicator with parsed markdown
                  messageElement.innerHTML = this.parseMarkdown(fullMessage);
                } else if (data.type === 'end') {
                  this.hideTypingIndicator();
                  if (fullMessage) {
                    this.displayMessage(fullMessage, false);
                  }
                  return;
                } else if (data.type === 'error') {
                  this.hideTypingIndicator();
                  this.displayMessage('Sorry, there was an error processing your message.', false);
                  return;
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }

          readStream();
        } catch (error) {
          console.error('Streaming error:', error);
          this.hideTypingIndicator();
          this.displayMessage('Sorry, there was an error processing your message.', false);
        }
      };

      readStream();
    }
  };

  // Initialize SDK when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FormmyChatSDK.init());
  } else {
    FormmyChatSDK.init();
  }

  // Expose SDK globally for debugging
  window.FormmyChatSDK = FormmyChatSDK;

})();
`.trim();
}
