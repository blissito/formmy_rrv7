// Bundle del widget que se inyecta en el sitio del usuario
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Missing chatbot slug', { status: 400 });
  }

  const baseUrl = url.origin;

  // Este script se ejecuta una vez React está disponible
  const bundleContent = `
(function() {
  'use strict';

  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const { useState } = React;

  const CHATBOT_SLUG = '${slug}';
  const API_BASE = '${baseUrl}';

  // Componente FloatingWidget standalone (copia del original)
  function FloatingChatWidget({ chatbot }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => {
      setIsOpen(!isOpen);
    };

    const primaryColor = chatbot.primaryColor || '#63CFDE';

    return React.createElement(
      React.Fragment,
      null,
      // Botón flotante (bubble)
      React.createElement(
        'button',
        {
          onClick: toggleChat,
          className: 'formmy-bubble-btn' + (isOpen ? ' formmy-hidden' : ''),
          style: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: primaryColor,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 42424242,
            transition: 'all 0.3s',
            color: 'white',
          },
          'aria-label': 'Abrir chat',
        },
        // Icono de chat
        React.createElement(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            fill: 'none',
            viewBox: '0 0 24 24',
            strokeWidth: 1.5,
            stroke: 'currentColor',
            style: { width: '32px', height: '32px' },
          },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            d: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
          })
        )
      ),

      // Chat window
      React.createElement(
        'div',
        {
          className: 'formmy-chat-window' + (isOpen ? ' formmy-open' : ''),
          style: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            maxWidth: 'calc(100vw - 40px)',
            height: 'calc(100vh - 150px)',
            maxHeight: '704px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            zIndex: 42424242,
            transformOrigin: 'bottom right',
            transform: isOpen ? 'scale(1)' : 'scale(0)',
            opacity: isOpen ? 1 : 0,
            transition: 'all 0.2s',
            pointerEvents: isOpen ? 'auto' : 'none',
          },
        },
        React.createElement(
          'div',
          { style: { position: 'relative', height: '100%' } },
          // Botón de cierre
          isOpen && React.createElement(
            'button',
            {
              onClick: toggleChat,
              style: {
                position: 'absolute',
                top: '0',
                right: '-8px',
                margin: '6px',
                backgroundColor: '#4B5563',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                zIndex: 50,
                padding: '6px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                transition: 'all 0.2s',
              },
              title: 'Cerrar chat',
              onMouseEnter: (e) => { e.target.style.backgroundColor = '#374151'; },
              onMouseLeave: (e) => { e.target.style.backgroundColor = '#4B5563'; },
            },
            React.createElement(
              'svg',
              {
                viewBox: '0 0 24 24',
                width: '16',
                height: '16',
                style: { display: 'block' }
              },
              React.createElement('path', {
                fill: '#111827',
                stroke: '#111827',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                d: 'M6 18L18 6M6 6l12 12',
              })
            )
          ),
          // Iframe del chat
          React.createElement('iframe', {
            src: API_BASE + '/chat/embed?slug=' + CHATBOT_SLUG,
            style: {
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '16px',
              backgroundColor: 'white',
            },
            allow: 'clipboard-write',
          })
        )
      )
    );
  }

  // Fetch del chatbot y render
  fetch(API_BASE + '/api/chatbot/public/' + CHATBOT_SLUG)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('formmy-widget-root');
      if (!container) return;

      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(FloatingChatWidget, { chatbot: data.chatbot }));
    })
    .catch(err => {
      console.error('Formmy Widget Error:', err);
    });
})();
`;

  return new Response(bundleContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
