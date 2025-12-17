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

    // Obtener configuración del chatbot desde la API (valida dominio)
    let primaryColor = config.primaryColor || '#9A99EA';
    let isBlocked = false;
    let blockMessage = '';
    let chatbotData = null;
    let template = config.template || 'bubble';

    try {
      const response = await fetch(\`\${apiHost}/api/chatbot/public/\${chatbotSlug}\`);
      if (response.ok) {
        const data = await response.json();
        chatbotData = data.chatbot;
        primaryColor = config.primaryColor || data.chatbot?.primaryColor || '#9A99EA';
        template = config.template || data.chatbot?.widgetTemplate || 'bubble';
      } else if (response.status === 403) {
        isBlocked = true;
        blockMessage = 'Este chatbot no está disponible desde este sitio web.';
        console.error('FormMyWidget: Dominio no autorizado');
      } else if (response.status === 404) {
        isBlocked = true;
        blockMessage = 'Chatbot no encontrado.';
        console.error('FormMyWidget: Chatbot no encontrado');
      }
    } catch (error) {
      console.warn('FormMyWidget: Could not fetch chatbot config, using default color and template');
    }

    // Function to get template styles
    const getTemplateStyles = (template, primaryColor) => {
      const templates = {
        bubble: {
          trigger: {
            className: 'formmy-bubble',
            position: 'bottom: 20px; right: 20px;',
            size: 'width: 64px; height: 64px;',
            shape: 'border-radius: 50%;',
            behavior: ''
          },
          chat: {
            position: 'bottom: 20px; right: 20px;',
            size: 'width: 400px; max-width: calc(100vw - 40px); height: calc(100vh - 150px); max-height: 704px;',
            shape: 'border-radius: 16px;',
            origin: 'transform-origin: bottom right;',
            animation: 'transform: scale(0); opacity: 0;'
          }
        },
        sidebar: {
          trigger: {
            className: 'formmy-sidebar-trigger',
            position: 'right: 0; top: 50%; transform: translateY(-50%);',
            size: 'width: 48px; height: 120px;',
            shape: 'border-radius: 8px 0 0 8px;',
            behavior: 'writing-mode: vertical-rl;'
          },
          chat: {
            position: 'right: 0; top: 0;',
            size: 'width: 380px; height: 100vh;',
            shape: 'border-radius: 0;',
            origin: 'transform-origin: center right;',
            animation: 'transform: translateX(100%); opacity: 0;'
          }
        },
        minimal: {
          trigger: {
            className: 'formmy-tab-trigger',
            position: 'right: 0; top: 50%; transform: translateY(-50%);',
            size: 'width: 40px; height: 160px;',
            shape: 'border-radius: 8px 0 0 8px;',
            behavior: 'writing-mode: vertical-rl; font-size: 14px;'
          },
          chat: {
            position: 'right: 20px; top: 50%; transform: translateY(-50%);',
            size: 'width: 350px; height: 500px; max-height: 80vh;',
            shape: 'border-radius: 8px;',
            origin: 'transform-origin: center right;',
            animation: 'opacity: 0; pointer-events: none;'
          }
        },
        enterprise: {
          trigger: {
            className: 'formmy-bar-trigger',
            position: 'bottom: 20px; left: 50%; transform: translateX(-50%);',
            size: 'width: 320px; height: 60px;',
            shape: 'border-radius: 30px;',
            behavior: 'font-size: 16px; font-weight: 500;'
          },
          chat: {
            position: 'bottom: 20px; left: 50%; transform: translateX(-50%);',
            size: 'width: 500px; max-width: 90vw; height: 600px; max-height: 80vh;',
            shape: 'border-radius: 12px 12px 0 0;',
            origin: 'transform-origin: bottom center;',
            animation: 'transform: translateY(100%); opacity: 0;'
          }
        },
        industrial: {
          trigger: {
            className: 'formmy-industrial-bubble',
            position: 'bottom: 20px; right: 20px;',
            size: 'width: 72px; height: 72px;',
            shape: 'border-radius: 8px;',
            behavior: ''
          },
          chat: {
            position: 'bottom: 20px; right: 20px;',
            size: 'width: 450px; max-width: calc(100vw - 20px); height: 650px; max-height: calc(100vh - 100px);',
            shape: 'border-radius: 4px;',
            origin: 'transform-origin: bottom right;',
            animation: 'transform: scale(0); opacity: 0;'
          }
        }
      };

      const t = templates[template] || templates.bubble;
      
      return \`
        .formmy-trigger {
          position: fixed;
          \${t.trigger.position}
          \${t.trigger.size}
          \${t.trigger.shape}
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
          \${t.trigger.behavior}
        }
        .formmy-trigger:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          transform: scale(1.05) \${t.trigger.position.includes('translateY') ? 'translateY(-50%)' : t.trigger.position.includes('translateX') ? 'translateX(-50%)' : ''};
        }
        .formmy-trigger.hidden {
          opacity: 0;
          pointer-events: none;
        }
        .formmy-chat-container {
          position: fixed;
          \${t.chat.position}
          \${t.chat.size}
          \${t.chat.shape}
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          z-index: 42424243;
          \${t.chat.origin}
          transition: all 0.3s ease-in-out;
          overflow: hidden;
        }
        .formmy-chat-container.closed {
          \${t.chat.animation}
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .formmy-chat-container {
            width: calc(100vw - 20px) !important;
            max-width: calc(100vw - 20px) !important;
            left: 10px !important;
            right: 10px !important;
            transform: none !important;
          }
          .formmy-chat-container.closed {
            transform: translateY(100%) !important;
          }
        }
      \`;
    };

    // Crear estilos dinámicos
    const style = document.createElement('style');
    style.textContent = getTemplateStyles(template, primaryColor);
    document.head.appendChild(style);

    // Function to get trigger content based on template
    const getTriggerContent = (template) => {
      const contents = {
        bubble: \`
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 32px; height: 32px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
        \`,
        sidebar: \`<span style="font-size: 14px; font-weight: 500;">CHAT</span>\`,
        minimal: \`<span style="font-size: 12px; font-weight: 500;">AYUDA</span>\`,
        enterprise: \`
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <span>¿Necesitas ayuda?</span>
          </div>
        \`,
        industrial: \`
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 28px; height: 28px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        \`
      };
      return contents[template] || contents.bubble;
    };

    // Crear trigger button
    const trigger = document.createElement('button');
    trigger.className = 'formmy-trigger';
    trigger.innerHTML = getTriggerContent(template);

    // Crear contenedor del chat
    const chatContainer = document.createElement('div');
    chatContainer.className = 'formmy-chat-container closed';

    if (isBlocked) {
      // Mostrar mensaje de bloqueo con fantasmita dormido
      chatContainer.innerHTML = \`
        <div style="width: 100%; height: 100%; border-radius: 16px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box;">
          <img src="\${apiHost}/dash/sleepy-ghosty.svg" alt="ghosty" style="width: 80px; margin-bottom: 16px;" />
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #9A99EA; font-family: system-ui, sans-serif;">Acceso restringido</h3>
          <p style="margin: 0; font-size: 14px; color: #666; text-align: center; font-family: system-ui, sans-serif;">\${blockMessage}</p>
          <a href="https://formmy.app" target="_blank" style="margin-top: 24px; font-size: 12px; color: #999; text-decoration: underline; font-family: system-ui, sans-serif;">Powered by Formmy</a>
        </div>
      \`;
    } else {
      chatContainer.innerHTML = \`
        <iframe
          src="\${apiHost}/chat/embed?slug=\${chatbotSlug}&template=\${template}"
          style="width: 100%; height: 100%; border: none; border-radius: inherit; background: transparent;"
          allow="clipboard-write"
        ></iframe>
      \`;
    }

    document.body.appendChild(trigger);
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

    // Enviar parent domain cuando el iframe esté listo (solo si no está bloqueado)
    if (iframe && !isBlocked) {
      iframe.addEventListener('load', sendParentDomain);
    }

    // Toggle functionality
    let isOpen = false;
    const toggle = () => {
      isOpen = !isOpen;
      if (isOpen) {
        trigger.classList.add('hidden');
        chatContainer.classList.remove('closed');
        // Solo enviar mensajes al iframe si no está bloqueado
        if (!isBlocked && iframe) {
          // Enviar parent domain cada vez que se abre (por si acaso)
          setTimeout(sendParentDomain, 100);
          // Enviar template al iframe
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: 'formmy-focus-input'
              }, apiHost);
              iframe.contentWindow.postMessage({
                type: 'formmy-set-template',
                template: template
              }, apiHost);
            }
          }, 300); // Esperar a que la animación de apertura termine
        }
      } else {
        trigger.classList.remove('hidden');
        chatContainer.classList.add('closed');
      }
    };

    trigger.addEventListener('click', toggle);

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
