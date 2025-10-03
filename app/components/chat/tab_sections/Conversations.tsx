import type { Chatbot, Message, User } from "@prisma/client";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import { Avatar } from "../Avatar";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { cn } from "~/lib/utils";

const dev_conversations = [
  {
    messages: [
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "USER",
        content: "Hola, estoy buscando a alguien que me ayude a crear un sitio web para mi negocio",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "ASSISTANT",
        content: "¡Hola! Encantado de ayudarte. Cuéntame un poco más sobre tu negocio. ¿Qué tipo de empresa tienes y qué funcionalidades necesitas en tu sitio web?",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "USER",
        content: "Tengo una cafetería en el centro y quiero un sitio para mostrar el menú, ubicación y poder recibir pedidos en línea",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "ASSISTANT",
        content: "Perfecto, entiendo. Para tu cafetería podemos crear un sitio con catálogo de productos, sistema de pedidos, integración con Google Maps y pasarela de pagos. ¿Cuál es tu presupuesto aproximado y en cuánto tiempo lo necesitas?",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "USER",
        content: "Mi presupuesto es de unos $25,000 MXN y lo necesitaría en un mes máximo",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "ASSISTANT",
        content: "Excelente, ese presupuesto es adecuado para lo que necesitas. Podemos entregarlo en 3-4 semanas. Te prepararé una propuesta detallada con diseño, funcionalidades y costos. ¿Prefieres que te la envíe por correo o agendamos una videollamada?",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "USER",
        content: "Por correo está bien. Mi email es maria@cafeteriacentral.com",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "ASSISTANT",
        content: "Perfecto María. Te enviaré la propuesta hoy mismo a tu correo. ¿Hay alguna otra pregunta que tengas mientras tanto?",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "USER",
        content: "¿También podrían ayudarme con el SEO para aparecer en búsquedas de Google?",
      },
      {
        picture: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
        role: "ASSISTANT",
        content: "¡Por supuesto! Incluiremos optimización SEO básica en el desarrollo y podemos ofrecerte un plan de SEO continuo. Te lo detallo en la propuesta.",
      },
    ],
    isFavorite: true,
    id: "1",
    userName: "María González",
    userEmail: "maria@cafeteriacentral.com",
    lastMessage: "¿También podrían ayudarme con el SEO para aparecer en búsquedas de Google?",
    time: "Hace 2h",
    date: "30 de septiembre de 2025",
    unread: 0,
    avatar: "/assets/chat/ghosty.svg",
    tel: "+52 55 1234 5678",
    manualMode: false,
    isWhatsApp: true,
  },
  {
    messages: [
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "USER",
        content: "Buenos días, necesito cotización para un e-commerce",
      },
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "ASSISTANT",
        content: "¡Buenos días! Con gusto te ayudo. ¿Qué tipo de productos vas a vender y cuántos artículos aproximadamente tendrás en el catálogo?",
      },
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "USER",
        content: "Vendo ropa deportiva, tengo como 200 productos inicialmente pero quiero poder agregar más",
      },
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "ASSISTANT",
        content: "Entendido. ¿Necesitas pasarela de pagos integrada? ¿Stripe, Mercado Pago u otra? ¿Y control de inventario?",
      },
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "USER",
        content: "Sí, Mercado Pago y sí necesito control de inventario. ¿Cuánto costaría?",
      },
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "ASSISTANT",
        content: "Para un e-commerce con esas características estaríamos hablando de $45,000-$60,000 MXN. Incluye diseño responsivo, carrito de compras, sistema de pagos, gestión de inventario y panel de administración. Tiempo de desarrollo: 6-8 semanas.",
      },
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "USER",
        content: "Está dentro de mi presupuesto. ¿Qué tecnologías usan?",
      },
      {
        picture: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        role: "ASSISTANT",
        content: "Trabajamos con React para el frontend, Node.js para el backend, y podemos usar Shopify o una solución custom. Para tu caso recomendaría una plataforma custom para mayor flexibilidad. ¿Te interesa agendar una llamada para discutir detalles?",
      },
    ],
    isFavorite: false,
    id: "2",
    userName: "Carlos Ramírez",
    userEmail: "carlos.r@sportswear.mx",
    lastMessage: "Está dentro de mi presupuesto. ¿Qué tecnologías usan?",
    time: "Hace 5h",
    date: "29 de septiembre de 2025",
    unread: 1,
    avatar: "/assets/chat/ghosty.svg",
    tel: "+52 81 9876 5432",
    manualMode: false,
    isWhatsApp: true,
  },
  {
    messages: [
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "USER",
        content: "Hola! Vi su trabajo en Instagram. Necesito una landing page",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "ASSISTANT",
        content: "¡Hola! Gracias por contactarnos. ¿Para qué producto o servicio es la landing page?",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "USER",
        content: "Es para un curso online de fotografía que voy a lanzar el próximo mes",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "ASSISTANT",
        content: "Perfecto. ¿Necesitas formulario de inscripción, integración con plataforma de pagos, contador regresivo o alguna otra funcionalidad específica?",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "USER",
        content: "Sí a todo! También quisiera que tenga testimonios de alumnos y un video promocional",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "ASSISTANT",
        content: "Excelente. Una landing page completa con esas secciones te costaría $15,000-$20,000 MXN y estaría lista en 2 semanas. Incluye diseño moderno, formularios, integración de pago y optimización para conversiones. ¿Te parece bien ese rango?",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "USER",
        content: "Sí perfecto! ¿Cuándo podríamos empezar?",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "ASSISTANT",
        content: "Podemos empezar esta misma semana. Necesitaría tu logo, paleta de colores (si la tienes), textos del contenido y el video. ¿Ya cuentas con todo ese material?",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "USER",
        content: "Tengo el logo y video. Los textos los puedo tener en 2 días",
      },
      {
        picture: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg",
        role: "ASSISTANT",
        content: "Perfecto! Entonces arrancamos el lunes. Te envío contrato y forma de pago al correo. ¿Cuál es tu email?",
      },
    ],
    isFavorite: true,
    id: "3",
    userName: "Ana Martínez",
    userEmail: "ana.foto@gmail.com",
    lastMessage: "Tengo el logo y video. Los textos los puedo tener en 2 días",
    time: "Ayer",
    date: "29 de septiembre de 2025",
    unread: 0,
    avatar: "/assets/chat/ghosty.svg",
    tel: "+52 33 4567 8901",
    manualMode: false,
    isWhatsApp: true,
  },
];

type ConversationsProps = {
  chatbot: Chatbot;
  user: User;
  conversations?: Conversation[];
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
};

interface Conversation {
  id: string;
  chatbotId: string;
  messages: Message[];
  userName: string;
  userEmail: string;
  lastMessage: string;
  time: string;
  date: string;
  unread: number;
  avatar: string;
  tel: string;
  isFavorite: boolean;
  manualMode: boolean;
  isWhatsApp: boolean;
}

export const Conversations = ({
  conversations = [],
  chatbot,
  user,
  onToggleManual,
  onSendManualResponse,
}: ConversationsProps) => {
  console.log("🔍 DEBUG - Conversations Props:", {
    conversationsCount: conversations.length,
    hasToggleManual: !!onToggleManual,
    hasSendManual: !!onSendManualResponse,
    firstConversationId: conversations.length > 0 ? conversations[0].id : 'none',
    conversationIDs: conversations.map(c => c.id)
  });

  // Use real conversations if provided, fallback to dev data for development
  const actualConversations = conversations.length > 0 ? conversations : dev_conversations;

  console.log("🔍 Using conversations:", {
    source: conversations.length > 0 ? 'real' : 'dev',
    count: actualConversations.length,
    ids: actualConversations.map(c => c.id)
  });
  const { currentTab, setCurrentTab } = useChipTabs("Todos", `conversations_${chatbot?.id || 'default'}`);
  const navigate = useNavigate();

  const favoriteConversations = actualConversations.filter(
    (conversation) => conversation.isFavorite
  );
  const allConversations = actualConversations;
  const [conversation, setConversation] = useState<Conversation>(
    actualConversations[0] || dev_conversations[0]
  );

  // Estado local para toggle manual (inicializado con valores reales)
  const [localManualModes, setLocalManualModes] = useState<Record<string, boolean>>({});

  // Inicializar estado local con valores de BD
  useEffect(() => {
    const initialModes: Record<string, boolean> = {};
    actualConversations.forEach(conv => {
      initialModes[conv.id] = conv.manualMode || false;
    });
    setLocalManualModes(initialModes);
  }, [actualConversations]);

  // 🔄 Actualizar conversación seleccionada cuando cambian las props
  useEffect(() => {
    if (actualConversations.length > 0 && conversation) {
      const updated = actualConversations.find(c => c.id === conversation.id);
      if (updated) {
        console.log("🔄 Updating selected conversation:", {
          id: updated.id,
          manualMode: updated.manualMode
        });
        setConversation(updated);
      }
    }
  }, [actualConversations, conversation?.id]);

  // Polling básico para actualizaciones en tiempo real
  useEffect(() => {
    if (!chatbot?.id) return;

    const interval = setInterval(() => {
      // Revalidar loader data cada 5 segundos para obtener nuevas conversaciones
      navigate(window.location.pathname, { replace: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [chatbot?.id, navigate]);

  // 🎯 Toggle que sincroniza con backend
  const handleToggleManual = async (conversationId: string) => {
    console.log("🔄 Toggle with backend sync for:", conversationId);

    // Actualizar estado local inmediatamente para UX responsiva
    setLocalManualModes(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));

    // Sincronizar con backend si hay función disponible
    if (onToggleManual) {
      try {
        await onToggleManual(conversationId);
        console.log("✅ Backend sync completed");
      } catch (error) {
        console.error("❌ Backend sync failed:", error);
        // Revertir estado local si falló
        setLocalManualModes(prev => ({
          ...prev,
          [conversationId]: !prev[conversationId]
        }));
      }
    }
  };

  const handleSendManualResponse = onSendManualResponse || (async (conversationId: string, message: string) => {
    console.log("⚠️ No onSendManualResponse function provided - using fallback");
    alert("⚠️ Función de envío no disponible");
  });

  return (
    <main className="grid grid-cols-12 gap-6 max-h-[calc(100svh-320px)] ">
      <article className={cn("col-span-12 md:col-span-3 overflow-y-scroll", "flex flex-col h-full gap-4 md:gap-6")}>
        <ChipTabs
          names={["Todos", "Favoritos"]}
          onTabChange={setCurrentTab}
          activeTab={currentTab}
        />
        <ConversationsList
          onConversationSelect={setConversation}
          conversations={
            currentTab === "Favoritos"
              ? favoriteConversations
              : allConversations
          }
          currentConversation={conversation}
        />
      </article>
      <section className="col-span-12 md:col-span-9 pb-4 ">
        <ConversationsPreview
          conversation={conversation}
          chatbot={chatbot}
          onToggleManual={handleToggleManual}
          onSendManualResponse={handleSendManualResponse}
          localManualMode={localManualModes[conversation?.id] || false}
        />
      </section>
    </main>
  );
};

const ConversationsList = ({
  conversations = dev_conversations,
  onConversationSelect,
  currentConversation,
}: {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  currentConversation: Conversation;
}) => {
  return (
    <section className="flex flex-col gap-1 max-h-[264px] md:max-h-[616px] overflow-y-scroll ">
      {conversations.map((conversation) => (
        <Conversation
          key={conversation.id}
          conversation={conversation}
          onClick={() => onConversationSelect(conversation)}
          isActive={conversation.id === currentConversation.id}
        />
      ))}
    </section>
  );
};

const Conversation = ({
  conversation,
  onClick,
  isActive,
}: {
  conversation: Conversation;
  onClick?: () => void;
  isActive?: boolean;
}) => {
  const pic = conversation.messages.filter(
    (message) => message.role === "USER"
  )[0].picture;
  const lastUserMessage = conversation.messages.find(
    (message) => message.role === "USER"
  );
  return (
    <section
      onClick={onClick}
      className={cn(
        "px-2 py-3 rounded-2xl transition-colors",
        "hover:bg-brand-500/10",
        "cursor-pointer",
        "flex gap-3",
        "items-center",
        "w-full min-w-full",
        {
          "bg-brand-500/10": isActive,
        }
      )}
    >
      <Avatar className="w-10" src={conversation.pic} />
      <div className="flex-1 truncate">
        <p className="font-medium text-base mb-0 pb-0">{conversation.userName}</p>
        <p className="text-xs text-irongray truncate -mt-[2px]">
          {lastUserMessage?.content}
        </p>
      </div>
      <div className="flex-2 pr-3">
        <p className="ml-3 text-xs text-gray-500">{conversation.time}</p>
        {conversation.isFavorite && (
          <img className="ml-auto" src="/assets/chat/pin.svg" alt="pin icon" />
        )}
      </div>
    </section>
  );
};

const ChatHeader = ({
  conversation,
  primaryColor,
  onToggleManual,
  onSendManualResponse,
  localManualMode = false,
}: {
  conversation: Conversation;
  primaryColor?: string;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  localManualMode?: boolean;
}) => {
  const { date, tel } = conversation;
  const [manualMessage, setManualMessage] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  const [isSending, setIsSending] = useState(false);

  console.log("🔍 DEBUG - ChatHeader:", {
    conversationId: conversation.id,
    localManualMode,
    hasToggleFunction: !!onToggleManual,
    isToggling
  });

  // Detectar si es conversación de WhatsApp
  // Si tel es un número válido (no "N/A" o "Usuario Web") → es WhatsApp
  const isWhatsAppConversation = conversation.isWhatsApp ||
    (conversation.tel !== "N/A" && conversation.tel.startsWith("+") && conversation.tel.length >= 10);

  const handleToggleManual = () => {
    console.log("🔄 Local toggle clicked:", conversation.id);
    if (onToggleManual) {
      onToggleManual(conversation.id);
    }
  };

  const handleSendMessage = async () => {
    if (!onSendManualResponse || !manualMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSendManualResponse(conversation.id, manualMessage.trim());
      setManualMessage(""); // Clear input after sending
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <header
      style={{ borderColor: primaryColor || "brand-500" }}
      className={cn(
        "border-t border-l border-r border-outlines",
        "flex",
        "items-center",
        "gap-2",
        "rounded-t-3xl",
        "bg-brand-100/40 w-full p-3"
      )}
    >
      <Avatar className="h-10 w-10" src={conversation.messages[0]?.picture || "/assets/chat/ghosty.svg"} />
      <div>
        <div className="flex items-center gap-1">
          <h3 className="text-base font-medium text-dark">{tel === "N/A" ? "Usuario web" : tel}</h3>
          {/* Solo mostrar logo WhatsApp si es conversación legítima de WhatsApp */}
          {isWhatsAppConversation && (
            <img src="/assets/chat/whatsapp.svg" alt="whatsapp icon" />
          )}
        </div>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <ToggleButton
        isManual={localManualMode}
        onClick={handleToggleManual}
        disabled={false}
      />
      <button className="mr-3">
        <img className="w-6 h-6" src="/assets/chat/recyclebin.svg" alt="trash icon" />
      </button>
    </header>
  );
};

const ToggleButton = ({
  isManual,
  onClick,
  disabled
}: {
  isManual: boolean;
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "ml-auto mr-2 px-3 py-1 text-xs rounded-full font-medium transition-colors",
      isManual
        ? "bg-orange-100 text-orange-800"
        : "bg-blue-100 text-blue-800",
      "disabled:opacity-50"
    )}
  >
    {isManual ? "🔧 MANUAL" : "🤖 BOT"}
  </button>
);

const ManualResponseInput = ({
  conversationId,
  onSendResponse,
}: {
  conversationId: string;
  onSendResponse: (conversationId: string, message: string) => void;
}) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🎯 AUTO-FOCUS: Input listo inmediatamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(0, 0);
    }
  }, []);

  // 🎯 AUTO-RESIZE: Se expande con el contenido
  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendResponse(conversationId, message.trim());
      setMessage(""); // Clear input after sending
    } finally {
      setIsSending(false);
    }
  };

  // 🎯 SMART SHORTCUTS: Ctrl+Enter envía, Esc cancela
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // 🎯 QUICK RESPONSES: Respuestas rápidas pre-definidas
  const quickResponses = [
    "👋 ¡Hola! ¿En qué puedo ayudarte?",
    "✅ Perfecto, entendido",
    "⏱️ Te respondo en un momento",
    "📞 ¿Podrías compartir tu contacto?",
  ];

  return (
    <div className="border-l border-r border-b border-outlines bg-brand-100 p-4 w-full rounded-b-3xl">
      {/* 🎯 QUICK RESPONSES */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickResponses.map((response, index) => (
          <button
            key={index}
            onClick={() => setMessage(response)}
            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            {response}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleAutoResize}
            onKeyDown={handleKeyDown}
            placeholder="💬 Responde al usuario aquí..."
            className="w-full p-3 border-2 border-blue-200 rounded-xl resize-none focus:outline-none focus:ring-0  focus:border-brand-500 transition-all"
            rows={2}
            maxLength={4096}
            style={{ minHeight: '60px' }}
          />
          <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
            <span>⚡ Enter envía • Shift+Enter nueva línea</span>
            <span className={message.length > 3500 ? 'text-orange-600 font-medium' : ''}>{message.length}/4096</span>
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className={cn(
            "px-6 py-3 bg-brand-500 text-white rounded-full transition-all transform",
            "hover:scale-105 hover:shadow-lg hover:bg-brand-600",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
            "flex items-center gap-2 font-medium whitespace-nowrap",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          )}
        >
          {isSending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Enviando...
            </>
          ) : (
            <>
              Enviar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ActionButtons = () => {
  return (
    <nav className="flex items-center gap-2">
      <SimpleButton src="/assets/chat/tuning.svg" />
      <SimpleButton src="/assets/chat/refresh.svg" />
      <SimpleButton src="/assets/chat/download.svg" />
    </nav>
  );
};

const SimpleButton = ({
  src,
  onClick,
  className,
}: {
  src: string;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <button
      className={cn(
        "enabled:cursor-pointer enabled:active:scale-95",
        "enabled:hover:bg-gray-50 enabled:hover:shadow-sm transition-all",
        "rounded-xl p-1 border border-gray-300",

        className
      )}
      onClick={onClick}
    >
      <img className="pointer-events-none" src={src} alt="icon" />
    </button>
  );
};

// This should be reusable for any conversation
export const ConversationsPreview = ({
  conversation,
  primaryColor,
  chatbot,
  onToggleManual,
  onSendManualResponse,
  localManualMode = false,
}: {
  conversation: Conversation | undefined;
  primaryColor?: string;
  chatbot?: Chatbot;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  localManualMode?: boolean;
}) => {
  // Log conversation state for debugging
  console.log("🔍 ConversationsPreview render:", {
    conversationId: conversation?.id,
    manualMode: conversation?.manualMode,
    hasToggleFunction: !!onToggleManual,
    hasSendFunction: !!onSendManualResponse
  });
  return (
    <div className="h-full flex flex-col max-h-[calc(100vh-320px)]">
      <div className="flex-shrink-0">
        <ActionButtons />
        <hr className="my-3" />
        {conversation && (
          <ChatHeader
            conversation={conversation}
            onToggleManual={onToggleManual}
            onSendManualResponse={onSendManualResponse}
            localManualMode={localManualMode}
          />
        )}
      </div>

      {/* Messages - Flex grow container */}
      <div
        style={{ borderColor: primaryColor || "brand-500" }}
        className={cn(
          "border w-full shadow-standard flex-1 overflow-y-auto",
          localManualMode ? "border-b-0" : "rounded-b-3xl"
        )}
      >
        <div className="p-4">
          {conversation?.messages?.map((message, index) => (
            <div key={index} className="mb-4 last:mb-8">
              <SingleMessage message={message} chatbotAvatarUrl={chatbot?.avatarUrl} />
            </div>
          )) || (
            <div className="text-center text-gray-500 p-8">
              Selecciona una conversación para ver los mensajes
            </div>
          )}
        </div>
      </div>

      {/* Manual Response Input - Flex shrink */}
      {localManualMode && onSendManualResponse && (
        <div className="flex-shrink-0">
          <ManualResponseInput
            conversationId={conversation.id}
            onSendResponse={onSendManualResponse}
          />
        </div>
      )}
    </div>
  );
};

export const SingleMessage = ({ message, chatbotAvatarUrl }: { message: Message; chatbotAvatarUrl?: string }) => {
  return message.role === "USER" ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage message={message} avatarUrl={chatbotAvatarUrl} />
  );
};

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <div className="justify-end flex items-start gap-2">
      <div className="text-base p-3 bg-dark text-white rounded-xl max-w-[80%] break-words">
        {message.content}
      </div>
      <Avatar className="w-8 h-8 flex-shrink-0" src={message.picture} />
    </div>
  );
};
/**
 * @TODO: Añadir la acción para el microlike
 * Posible feature:
 * Cuando se le da like al microlike la respuesta
 * puede guardarse como "SHOT" (Ejemplo) para este agente.
 * Pueden existir ejemplos positivos y negativos 👎🏼
 */
const AssistantMessage = ({ message, avatarUrl }: { message: Message; avatarUrl?: string }) => {
  return (
    <div className="justify-start flex items-start gap-2">
      <Avatar className="w-8 h-8 flex-shrink-0" src={avatarUrl} />
      <div className="text-base p-3 bg-white border border-outlines rounded-xl relative max-w-[80%] break-words">
        {message.content}
        <MicroLikeButton />
      </div>
    </div>
  );
};

// Esto necesita un padre relativo
export const MicroLikeButton = ({
  isActive = false,
  onClick,
}: {
  isActive?: boolean;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "active:scale-95",
        "hover:scale-[1.02]",
        "cursor-pointer",
        "grid place-content-center",
        "min-w-4 min-h-4 shadow aspect-square",
        "bg-[#fff] rounded-full w-min",
        "absolute -bottom-3 right-2 w-2",
        "text-xs p-[10px]",
        {
          "bg-brand-300": isActive,
        }
      )}
    >
      👍🏼
    </button>
  );
};
