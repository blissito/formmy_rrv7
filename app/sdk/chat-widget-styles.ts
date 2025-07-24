/**
 * Estilos del Chat Widget SDK
 *
 * Este archivo contiene todos los estilos del widget de chat embebido.
 * Brendi puede modificar estos estilos sin tocar el código JavaScript.
 *
 * Colores dinámicos se reemplazan en tiempo de ejecución:
 * - {{PRIMARY_COLOR}} - Color principal del chatbot
 * - {{BOT_INITIAL}} - Inicial del nombre del bot
 */

export interface ChatWidgetStyles {
  container: string;
  header: string;
  avatar: string;
  botName: string;
  closeButton: string;
  messagesArea: string;
  welcomeMessage: string;
  welcomeAvatar: string;
  welcomeBubble: string;
  welcomeText: string;
  footer: string;
  poweredBy: string;
  inputWrapper: string;
  input: string;
  sendButton: string;
  userMessage: string;
  userBubble: string;
  userAvatar: string;
  botMessage: string;
  botMessageAvatar: string;
  botMessageBubble: string;
  toggleButton: string;
}

export const chatWidgetStyles: ChatWidgetStyles = {
  // Contenedor principal del widget
  container: `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10002;
    display: none;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    border: 1px solid #e1e5e9;
  `,

  // Header del chat
  header: `
    background: {{PRIMARY_COLOR}}1A;
    display: flex;
    align-items: center;
    padding: 12px;
    gap: 12px;
    min-height: 60px;
    border-bottom: 1px solid #f0f0f0;
  `,

  // Avatar del bot en el header
  avatar: `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: {{PRIMARY_COLOR}};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
  `,

  // Nombre del bot
  botName: `
    font-weight: 500;
    font-size: 14px;
    margin: 0;
    flex: 1;
    color: #1f2937;
  `,

  // Botón de cerrar
  closeButton: `
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    margin-left: auto;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  `,

  // Área de mensajes
  messagesArea: `
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,

  // Contenedor del mensaje de bienvenida
  welcomeMessage: `
    display: flex;
    align-items: flex-start;
    gap: 12px;
  `,

  // Avatar en mensaje de bienvenida
  welcomeAvatar: `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: {{PRIMARY_COLOR}};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  `,

  // Burbuja del mensaje de bienvenida
  welcomeBubble: `
    background: white;
    border-radius: 12px;
    padding: 12px;
    max-width: 240px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border: 1px solid #f0f0f0;
  `,

  // Texto del mensaje de bienvenida
  welcomeText: `
    font-size: 14px;
    line-height: 1.4;
    white-space: pre-line;
    margin: 0;
    color: #374151;
  `,

  // Footer con input
  footer: `
    padding: 16px;
    background: white;
    border-top: 1px solid #f0f0f0;
  `,

  // Texto "Powered by"
  poweredBy: `
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
    margin: 0 0 8px 0;
  `,

  // Contenedor del input
  inputWrapper: `
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e1e5e9;
    border-radius: 16px;
    padding: 4px;
    background: white;
    transition: border-color 0.2s ease;
  `,

  // Campo de input
  input: `
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 12px;
    font-size: 14px;
    outline: none;
    color: #374151;
  `,

  // Botón de enviar
  sendButton: `
    padding: 8px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: {{PRIMARY_COLOR}};
    transition: background-color 0.2s ease;
  `,

  // Contenedor mensaje de usuario
  userMessage: `
    display: flex;
    align-items: flex-start;
    gap: 12px;
    justify-content: flex-end;
  `,

  // Burbuja mensaje de usuario
  userBubble: `
    background: {{PRIMARY_COLOR}};
    color: white;
    border-radius: 12px;
    padding: 8px 12px;
    max-width: 240px;
    font-size: 14px;
    line-height: 1.4;
    white-space: pre-line;
    margin: 0;
  `,

  // Avatar de usuario
  userAvatar: `
    width: 32px;
    height: 32px;
    background: #d1d5db;
    border-radius: 50%;
    flex-shrink: 0;
  `,

  // Contenedor mensaje del bot
  botMessage: `
    display: flex;
    align-items: flex-start;
    gap: 12px;
  `,

  // Avatar en mensaje del bot
  botMessageAvatar: `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: {{PRIMARY_COLOR}};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  `,

  // Burbuja mensaje del bot
  botMessageBubble: `
    background: white;
    border-radius: 12px;
    padding: 12px;
    max-width: 240px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border: 1px solid #f0f0f0;
    font-size: 14px;
    line-height: 1.4;
    white-space: pre-line;
    color: #374151;
  `,

  // Botón toggle flotante
  toggleButton: `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: {{PRIMARY_COLOR}};
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
  `,
};

/**
 * Función para procesar estilos reemplazando variables dinámicas
 */
export function processStyles(
  styles: ChatWidgetStyles,
  primaryColor: string,
  botInitial: string
): ChatWidgetStyles {
  const processed = {} as ChatWidgetStyles;

  for (const [key, value] of Object.entries(styles)) {
    processed[key as keyof ChatWidgetStyles] = value
      .replace(/\{\{PRIMARY_COLOR\}\}/g, primaryColor)
      .replace(/\{\{BOT_INITIAL\}\}/g, botInitial);
  }

  return processed;
}

/**
 * Configuración de hover effects y estados interactivos
 */
export const interactiveStyles = {
  closeButtonHover: `
    background-color: rgba(0, 0, 0, 0.05);
  `,

  sendButtonHover: `
    background-color: rgba(99, 102, 241, 0.1);
  `,

  inputWrapperFocus: `
    border-color: {{PRIMARY_COLOR}};
    box-shadow: 0 0 0 3px {{PRIMARY_COLOR}}20;
  `,

  toggleButtonHover: `
    transform: scale(1.1);
  `,
};

/**
 * Configuración de temas
 */
export const themes = {
  light: {
    background: "#ffffff",
    messagesBg: "#f8f9fa",
    textColor: "#374151",
    borderColor: "#e1e5e9",
  },

  dark: {
    background: "#1f2937",
    messagesBg: "#111827",
    textColor: "#f9fafb",
    borderColor: "#374151",
  },
};
