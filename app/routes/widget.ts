// Módulo ES6 del widget Formmy (estilo Flowise)
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const baseUrl = url.origin;

  const moduleContent = `
const FormMyWidget = {
  init: async function(config) {
    if (!config || !config.chatbotSlug) {
      console.error('FormMyWidget: chatbotSlug is required');
      return;
    }

    const apiHost = config.apiHost || '${baseUrl}';
    const chatbotSlug = config.chatbotSlug;

    // Evitar múltiples inicializaciones
    if (window.__formmy_widget_loaded) return;
    window.__formmy_widget_loaded = true;

    // Obtener configuración del chatbot desde la API
    let primaryColor = config.primaryColor || '#9A99EA'; // Fallback default
    try {
      const response = await fetch(\`\${apiHost}/api/chatbot/public/\${chatbotSlug}\`);
      if (response.ok) {
        const data = await response.json();
        // Usar primaryColor del chatbot, permitir override con config
        primaryColor = config.primaryColor || data.chatbot?.primaryColor || '#9A99EA';
      }
    } catch (error) {
      console.warn('FormMyWidget: Could not fetch chatbot config, using default color');
    }

    // Crear estilos
    const style = document.createElement('style');
    style.textContent = \`
      .formmy-bubble {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: \${primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 42424242;
        transition: all 0.3s;
        color: white;
      }
      .formmy-bubble:hover {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
      .formmy-bubble.hidden {
        opacity: 0;
        pointer-events: none;
      }
      .formmy-chat-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        max-width: calc(100vw - 40px);
        height: calc(100vh - 150px);
        max-height: 704px;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        z-index: 42424242;
        transform-origin: bottom right;
        transition: all 0.2s;
      }
      .formmy-chat-container.closed {
        transform: scale(0);
        opacity: 0;
        pointer-events: none;
      }
      @media (max-width: 640px) {
        .formmy-chat-container {
          width: calc(100vw - 40px);
        }
      }
    \`;
    document.head.appendChild(style);

    // Crear bubble button
    const bubble = document.createElement('button');
    bubble.className = 'formmy-bubble';
    bubble.innerHTML = \`
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 32px; height: 32px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    \`;

    // Crear contenedor del chat
    const chatContainer = document.createElement('div');
    chatContainer.className = 'formmy-chat-container closed';
    chatContainer.innerHTML = \`
      <iframe
        src="\${apiHost}/chat/embed?slug=\${chatbotSlug}"
        style="width: 100%; height: 100%; border: none; border-radius: 16px; background: transparent;"
        allow="clipboard-write"
      ></iframe>
    \`;

    document.body.appendChild(bubble);
    document.body.appendChild(chatContainer);

    // 🔒 SEGURIDAD: Enviar parent domain al iframe para validación
    // Implementado: Oct 16, 2025
    const iframe = chatContainer.querySelector('iframe');
    const sendParentDomain = () => {
      if (iframe && iframe.contentWindow) {
        const parentDomain = window.location.hostname;
        iframe.contentWindow.postMessage({
          type: 'formmy-parent-domain',
          domain: parentDomain,
          href: window.location.href
        }, apiHost);
      }
    };

    // Enviar parent domain cuando el iframe esté listo
    iframe.addEventListener('load', sendParentDomain);

    // Toggle functionality
    let isOpen = false;
    const toggle = () => {
      isOpen = !isOpen;
      if (isOpen) {
        bubble.classList.add('hidden');
        chatContainer.classList.remove('closed');
        // Enviar parent domain cada vez que se abre (por si acaso)
        setTimeout(sendParentDomain, 100);
        // Enviar mensaje al iframe para hacer focus en el input
        setTimeout(() => {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'formmy-focus-input'
            }, apiHost);
          }
        }, 300); // Esperar a que la animación de apertura termine
      } else {
        bubble.classList.remove('hidden');
        chatContainer.classList.add('closed');
      }
    };

    bubble.addEventListener('click', toggle);

    // Escuchar mensajes del iframe para cerrar
    window.addEventListener('message', (event) => {
      if (event.data.type === 'formmy-close-chat' && isOpen) {
        toggle();
      }
    });
  }
};

export default FormMyWidget;
`;

  return new Response(moduleContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
