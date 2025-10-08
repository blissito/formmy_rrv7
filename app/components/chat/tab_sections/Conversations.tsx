import type { Chatbot, Message, User } from "@prisma/client";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import { Avatar } from "../Avatar";
import { useState, useEffect, useRef, type ReactNode, forwardRef } from "react";
import { useNavigate } from "react-router";
import { cn } from "~/lib/utils";
import Empty from "~/SVGs/Empty";
import EmptyDark from "~/SVGs/EmptyDark";

type ConversationsProps = {
  chatbot: Chatbot;
  user: User;
  conversations?: Conversation[];
  totalConversations?: number;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  selectedConversationId?: string;
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
  totalConversations = 0,
  chatbot,
  user,
  onToggleManual,
  onSendManualResponse,
  onDeleteConversation,
  selectedConversationId,
}: ConversationsProps) => {
  // Estado para scroll infinito
  const [allLoadedConversations, setAllLoadedConversations] = useState(conversations);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasMore = allLoadedConversations.length < totalConversations;

  console.log("🔍 DEBUG - Conversations Props:", {
    conversationsCount: conversations.length,
    totalConversations,
    hasToggleManual: !!onToggleManual,
    hasSendManual: !!onSendManualResponse,
    hasDeleteConversation: !!onDeleteConversation,
    firstConversationId: conversations.length > 0 ? conversations[0].id : 'none',
    conversationIDs: conversations.map(c => c.id)
  });

  console.log("📊 Pagination state:", {
    allLoadedCount: allLoadedConversations.length,
    totalConversations,
    hasMore,
    isLoadingMore
  });

  // Actualizar cuando cambien las props
  useEffect(() => {
    setAllLoadedConversations(conversations);
  }, [conversations]);

  // Función para cargar más conversaciones
  const loadMoreConversations = async () => {
    console.log("🔄 loadMoreConversations called", { isLoadingMore, hasMore, currentCount: allLoadedConversations.length });

    if (isLoadingMore || !hasMore) {
      console.log("⏸️ Skipping load - already loading or no more to load");
      return;
    }

    setIsLoadingMore(true);
    try {
      const url = `/api/v1/conversations/load-more?chatbotId=${chatbot.id}&skip=${allLoadedConversations.length}`;
      console.log("📡 Fetching:", url);

      const response = await fetch(url);
      console.log("📡 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Data received:", data);

      if (data.conversations && data.conversations.length > 0) {
        console.log("✅ Adding conversations:", data.conversations.length);
        setAllLoadedConversations(prev => [...prev, ...data.conversations]);
      } else {
        console.log("⚠️ No conversations in response");
      }
    } catch (error) {
      console.error("❌ Error loading more conversations:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const actualConversations = allLoadedConversations;

  const { currentTab, setCurrentTab} = useChipTabs("Todos", `conversations_${chatbot?.id || 'default'}`);
  const navigate = useNavigate();

  const favoriteConversations = actualConversations.filter(
    (conversation) => conversation.isFavorite
  );
  const allConversations = actualConversations;

  // Seleccionar conversación inicial (desde query param o la primera disponible)
  const initialConversation = selectedConversationId
    ? actualConversations.find(c => c.id === selectedConversationId) || actualConversations[0]
    : actualConversations[0];

  const [conversation, setConversation] = useState<Conversation>(initialConversation);

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

  // 🔄 Actualizar conversación cuando cambia selectedConversationId (desde URL)
  useEffect(() => {
    if (selectedConversationId && actualConversations.length > 0) {
      const targetConv = actualConversations.find(c => c.id === selectedConversationId);
      if (targetConv && targetConv.id !== conversation?.id) {
        console.log("🔗 Navigating to conversation from URL:", selectedConversationId);
        setConversation(targetConv);
      }
    }
  }, [selectedConversationId, actualConversations, conversation?.id]);

  // 🔄 Actualizar conversación seleccionada cuando cambian las props (para revalidación)
  useEffect(() => {
    if (actualConversations.length > 0 && conversation) {
      const updated = actualConversations.find(c => c.id === conversation.id);
      if (updated) {
        console.log("🔄 Updating selected conversation:", {
          id: updated.id,
          manualMode: updated.manualMode
        });
        setConversation(updated);
      } else {
        // Si la conversación seleccionada ya no existe (fue eliminada), seleccionar la primera
        console.log("⚠️ Selected conversation no longer exists, selecting first available");
        setConversation(actualConversations[0]);
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

  // Mostrar empty state si no hay conversaciones
  if (conversations.length === 0) {
    return <EmptyConversations />;
  }

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
          selectedConversationId={selectedConversationId}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore && currentTab === "Todos"}
          onLoadMore={loadMoreConversations}
        />
      </article>
      <section className="col-span-12 md:col-span-9 pb-4 b  min-h-[calc(100vh-310px)] ">
        <ConversationsPreview
          conversation={conversation}
          chatbot={chatbot}
          onToggleManual={handleToggleManual}
          onSendManualResponse={handleSendManualResponse}
          onDeleteConversation={onDeleteConversation}
          localManualMode={localManualModes[conversation?.id] || false}
        />
      </section>
    </main>
  );
};

const EmptyConversations = () => {
  return (
    <div className="text-center mt-12 flex flex-col items-center justify-center min-h-[400px]">
      <Empty className="w-[200px] md:w-[240px] dark:hidden flex" />
      <EmptyDark className="w-[240px] hidden dark:flex" />
      <h3 className="font-bold text-lg text-space-800 dark:text-clear mt-6">
        Aún no tienes conversaciones
      </h3>
      <p className="text-gray-600 text-sm dark:text-gray-400 font-light mt-2 max-w-md">
        Las conversaciones con tus clientes aparecerán aquí.<br />
        Agrega el chatbot a tu sitio web para empezar a recibir mensajes.
      </p>
    </div>
  );
};

const EmptyFavorites = () => {
  return (
    <div className="text-center mt-0 md:mt-12 flex flex-col items-center ">
      <Empty className="w-[160px] md:w-[200px] dark:hidden flex" />
      <EmptyDark className="w-[200px] hidden dark:flex" />
      <h3 className="font-bold text-sm text-space-800 dark:text-clear">
        ¡No tienes favoritos!
      </h3>
      <p className="text-gray-600 text-sm dark:text-gray-400 font-light mt-2">
        Marca como favoritos <br /> tus mensajes más importantes.
      </p>
    </div>
  );
};

const ConversationsList = ({
  conversations = [],
  onConversationSelect,
  currentConversation,
  selectedConversationId,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
}: {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  currentConversation: Conversation;
  selectedConversationId?: string;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) => {
  const conversationRefs = useRef<Record<string, HTMLElement | null>>({});

  // Hacer scroll a la conversación seleccionada cuando cambie
  useEffect(() => {
    if (selectedConversationId && conversationRefs.current[selectedConversationId]) {
      // Pequeño delay para asegurar que el elemento esté renderizado
      const timeoutId = setTimeout(() => {
        const element = conversationRefs.current[selectedConversationId];
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedConversationId]);

  return (
    <section className="flex flex-col gap-1 max-h-[264px] md:max-h-[616px] pb-6 overflow-y-scroll  ">
      {conversations.length > 0 ? (
        <>
          {conversations.map((conversation) => (
            <Conversation
              key={conversation.id}
              ref={(el) => {
                if (el) conversationRefs.current[conversation.id] = el;
              }}
              conversation={conversation}
              onClick={() => onConversationSelect(conversation)}
              isActive={conversation.id === currentConversation.id}
            />
          ))}

          {/* Botón para cargar más */}
          {hasMore && (
            <div className="py-3 grid place-items-center">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className={cn(
                  "w-fit py-2 px-4 rounded-full mx-auto text-sm font-medium transition-colors",
                  "bg-perl text-metal hover:bg-[#E1E3E7]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    Cargando...
                  </>
                ) : (
                  `Cargar más (${conversations.length} de muchas)`
                )}
              </button>
            </div>
          )}

          {/* Indicador de fin de lista */}
          {!hasMore && conversations.length > 20 && (
            <div className="py-3 text-center text-xs text-gray-400">
              ✓ Todas las conversaciones cargadas ({conversations.length})
            </div>
          )}
        </>
      ) : (
        <EmptyFavorites />
      )}
    </section>
  );
};

const Conversation = forwardRef<
  HTMLElement,
  {
    conversation: Conversation;
    onClick?: () => void;
    isActive?: boolean;
  }
>(({ conversation, onClick, isActive }, ref) => {
  const userMessage = conversation.messages.find(
    (message) => message.role === "USER"
  );
  const pic = userMessage?.picture || conversation.avatar;
  const lastUserMessage = conversation.messages.find(
    (message) => message.role === "USER"
  );
  return (
    <section
      ref={ref}
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
      <Avatar className="w-10" src={pic} />
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
});

Conversation.displayName = "Conversation";

const ChatHeader = ({
  conversation,
  primaryColor,
  onToggleManual,
  onSendManualResponse,
  localManualMode = false,
  onDeleteConversation,
}: {
  conversation: Conversation;
  primaryColor?: string;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  localManualMode?: boolean;
  onDeleteConversation?: (conversationId: string) => void;
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

  const handleDeleteConversation = () => {
    console.log("🗑️ ChatHeader delete clicked", {
      conversationId: conversation.id,
      hasDeleteFunction: !!onDeleteConversation
    });

    if (!onDeleteConversation) {
      console.error("❌ No onDeleteConversation function provided");
      alert("Error: Función de eliminar no disponible");
      return;
    }

    if (confirm("¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.")) {
      console.log("✅ User confirmed deletion, calling onDeleteConversation");
      onDeleteConversation(conversation.id);
    } else {
      console.log("❌ User cancelled deletion");
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
      <button
        onClick={handleDeleteConversation}
        className="mr-3 hover:bg-red-50 rounded-full p-1 transition-colors"
        title="Eliminar conversación"
      >
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

const ActionButtons = ({ conversation }: { conversation?: Conversation }) => {
  const handleDownloadCSV = () => {
    if (!conversation) return;

    const headers = ["Fecha/Hora", "Rol", "Mensaje"];
    const rows = conversation.messages.map(message => {
      const timestamp = new Date(message.createdAt).toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const role = message.role === "USER" ? "Usuario" : "Asistente";
      const content = `"${message.content.replace(/"/g, '""')}"`;

      return [timestamp, role, content].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const userName = conversation.userName.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `conversacion_${userName}_${date}.csv`;
    link.click();
  };

  return (
    <nav className="flex items-center gap-2 w-full justify-end mb-6">
      <SimpleButton src="/assets/chat/tuning.svg" disabled />
      <SimpleButton src="/assets/chat/refresh.svg" disabled />
      <SimpleButton src="/assets/chat/download.svg" onClick={handleDownloadCSV} />
    </nav>
  );
};

const SimpleButton = ({
  src,
  onClick,
  className,
  disabled = false,
}: {
  src: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      className={cn(
        "enabled:cursor-pointer enabled:active:scale-95",
        "enabled:hover:bg-gray-50 enabled:hover:shadow-sm transition-all",
        "rounded-xl p-1 border border-gray-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
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
  onDeleteConversation,
  localManualMode = false,
}: {
  conversation: Conversation | undefined;
  primaryColor?: string;
  chatbot?: Chatbot;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
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
        <ActionButtons conversation={conversation} />
        {conversation && (
          <ChatHeader
            conversation={conversation}
            onToggleManual={onToggleManual}
            onSendManualResponse={onSendManualResponse}
            onDeleteConversation={onDeleteConversation}
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
              <SingleMessage message={message} chatbotAvatarUrl={chatbot?.avatarUrl || undefined} />
            </div>
          )) || (
            <div className="text-center text-gray-500 p-8">
              Selecciona una conversación para ver los mensajes
            </div>
          )}
        </div>
      </div>

      {/* Manual Response Input - Flex shrink */}
      {localManualMode && onSendManualResponse && conversation && (
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
