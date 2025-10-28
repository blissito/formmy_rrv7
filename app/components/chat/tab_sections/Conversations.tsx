import type { Chatbot, Message, User } from "@prisma/client";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import { Avatar } from "../Avatar";
import { useState, useEffect, useRef, type ReactNode, forwardRef } from "react";
import { useNavigate, useSubmit } from "react-router";
import { cn } from "~/lib/utils";
import Empty from "~/SVGs/Empty";
import EmptyDark from "~/SVGs/EmptyDark";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDashboardTranslation } from "~/hooks/useDashboardTranslation";

type ConversationsProps = {
  chatbot: Chatbot;
  user: User;
  conversations?: Conversation[];
  totalConversations?: number;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string) => void;
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
  onToggleFavorite,
  selectedConversationId,
}: ConversationsProps) => {
  // Hook de traducción global del dashboard
  const { t } = useDashboardTranslation();
  const submit = useSubmit();

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

  // 🌐 TABS i18n: Usar índices (0 = All, 1 = Favorites) para compatibilidad con localStorage
  const TAB_ALL = 0;
  const TAB_FAVORITES = 1;
  const tabNames = [t('conversations.allConversations'), t('conversations.favorites')];

  const { currentTab: currentTabIndex, setCurrentTab: setCurrentTabIndex} = useChipTabs(TAB_ALL.toString(), `conversations_${chatbot?.id || 'default'}`);
  const navigate = useNavigate();

  // Estado local para toggle manual (inicializado con valores reales)
  const [localManualModes, setLocalManualModes] = useState<Record<string, boolean>>({});

  // Estado local para favoritos (inicializado con valores reales)
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({});

  // Filtrar favoritos usando estado local optimista
  const favoriteConversations = actualConversations.filter(
    (conversation) => localFavorites[conversation.id] ?? conversation.isFavorite
  );
  const allConversations = actualConversations;

  // Seleccionar conversación inicial (desde query param o la primera disponible)
  const initialConversation = selectedConversationId
    ? actualConversations.find(c => c.id === selectedConversationId) || actualConversations[0]
    : actualConversations[0];

  const [conversation, setConversation] = useState<Conversation>(initialConversation);

  // Inicializar estado local con valores de BD
  useEffect(() => {
    const initialModes: Record<string, boolean> = {};
    const initialFavorites: Record<string, boolean> = {};
    actualConversations.forEach(conv => {
      initialModes[conv.id] = conv.manualMode || false;
      initialFavorites[conv.id] = conv.isFavorite || false;
    });
    setLocalManualModes(initialModes);
    setLocalFavorites(initialFavorites);
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

  // 🎯 Toggle favorito con sincronización backend
  const handleToggleFavorite = async (conversationId: string, event?: React.MouseEvent) => {
    // Prevenir propagación para que no seleccione la conversación
    if (event) {
      event.stopPropagation();
    }

    console.log("⭐ Toggle favorite with backend sync for:", conversationId);

    // Actualizar estado local inmediatamente para UX responsiva
    setLocalFavorites(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));

    // Sincronizar con backend si hay función disponible
    if (onToggleFavorite) {
      try {
        await onToggleFavorite(conversationId);
        console.log("✅ Favorite backend sync completed");
      } catch (error) {
        console.error("❌ Favorite backend sync failed:", error);
        // Revertir estado local si falló
        setLocalFavorites(prev => ({
          ...prev,
          [conversationId]: !prev[conversationId]
        }));
      }
    }
  };

  // Mostrar empty state si no hay conversaciones
  if (conversations.length === 0) {
    return <EmptyConversations t={t} />;
  }

  return (
    <>
      <main className="grid grid-cols-12 gap-6 max-h-[calc(100svh-320px)] ">
        <article className={cn("col-span-12 md:col-span-3", "flex flex-col h-full gap-4 md:gap-6")}>
          <ChipTabs
            names={tabNames}
            onTabChange={(tabName) => {
              const index = tabNames.indexOf(tabName);
              setCurrentTabIndex(index.toString());
            }}
            activeTab={tabNames[parseInt(currentTabIndex) || 0]}
          />
        <ConversationsList
          onConversationSelect={setConversation}
          conversations={
            parseInt(currentTabIndex) === TAB_FAVORITES
              ? favoriteConversations
              : allConversations
          }
          currentConversation={conversation}
          selectedConversationId={selectedConversationId}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore && parseInt(currentTabIndex) === TAB_ALL}
          onLoadMore={loadMoreConversations}
          onToggleFavorite={handleToggleFavorite}
          localFavorites={localFavorites}
          currentTabIndex={parseInt(currentTabIndex) || 0}
          tabAll={TAB_ALL}
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
    </>
  );
};

const EmptyConversations = ({ t }: { t: (key: string) => string }) => {
  return (
    <div className="text-center mt-12 flex flex-col items-center justify-center min-h-[400px]">
      <Empty className="w-[200px] md:w-[240px] dark:hidden flex" />
      <EmptyDark className="w-[240px] hidden dark:flex" />
      <h3 className="font-bold text-lg text-space-800 dark:text-clear mt-6">
        {t('conversations.noConversations')}
      </h3>
      <p className="text-gray-600 text-sm dark:text-gray-400 font-light mt-2 max-w-md">
        {t('conversations.noConversationsDescription')}<br />
        {t('conversations.installScript')}
      </p>
    </div>
  );
};

const EmptyFavorites = () => {
  const { t } = useDashboardTranslation();
  return (
    <div className="text-center mt-0 md:mt-12 flex flex-col items-center ">
      <Empty className="w-[160px] md:w-[200px] dark:hidden flex" />
      <EmptyDark className="w-[200px] hidden dark:flex" />
      <h3 className="font-bold text-sm text-space-800 dark:text-clear">
        {t('conversations.noFavorites') || '¡No tienes favoritos!'}
      </h3>
      <p className="text-gray-600 text-sm dark:text-gray-400 font-light mt-2">
        {t('conversations.noFavoritesDescription') || 'Marca como favoritos tus mensajes más importantes.'}
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
  onToggleFavorite,
  localFavorites = {},
  currentTabIndex,
  tabAll,
}: {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  currentConversation: Conversation;
  selectedConversationId?: string;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onToggleFavorite?: (conversationId: string, event?: React.MouseEvent) => void;
  localFavorites?: Record<string, boolean>;
  currentTabIndex: number;
  tabAll: number;
}) => {
  const { t } = useDashboardTranslation();
  const conversationRefs = useRef<Record<string, HTMLElement | null>>({});

  // Hacer scroll a la conversación seleccionada cuando cambie (deshabilitado para evitar scroll de página)
  // useEffect(() => {
  //   if (selectedConversationId && conversationRefs.current[selectedConversationId]) {
  //     // Pequeño delay para asegurar que el elemento esté renderizado
  //     const timeoutId = setTimeout(() => {
  //       const element = conversationRefs.current[selectedConversationId];
  //       if (element) {
  //         element.scrollIntoView({
  //           behavior: 'smooth',
  //           block: 'center',
  //           inline: 'nearest'
  //         });
  //       }
  //     }, 100);

  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [selectedConversationId]);

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
              onToggleFavorite={onToggleFavorite}
              isFavorite={localFavorites[conversation.id] ?? conversation.isFavorite}
            />
          ))}

          {/* Botón para cargar más */}
          {hasMore && currentTabIndex === tabAll && (
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
                    {t('common.loading')}
                  </>
                ) : (
                  `${t('conversations.loadMore')} (${conversations.length})`
                )}
              </button>
            </div>
          )}

          {/* Indicador de fin de lista */}
          {!hasMore && conversations.length > 20 && currentTabIndex === tabAll && (
            <div className="py-3 text-center text-xs text-gray-400">
              ✓ {t('conversations.allConversations')} ({conversations.length})
            </div>
          )}
        </>
      ) : (
        <EmptyFavorites />
      )}
    </section>
  );
};

/**
 * Formatea un número de teléfono en el formato: +521 xxx xxx xxxx
 * Ejemplo: 5212345672825 → +521 234 567 2825
 * Ejemplo: 12345672825 → +1 234 567 2825
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // Eliminar espacios y caracteres especiales
  const cleaned = phoneNumber.replace(/[^\d]/g, '');

  // Si está vacío o muy corto, retornar original
  if (cleaned.length < 10) {
    return phoneNumber;
  }

  let lada = '';
  let restOfNumber = '';

  // Detectar lada mexicana (52) + lada local (1) - 13 dígitos en total (52 + 1 + 10 dígitos)
  if (cleaned.startsWith('521') && cleaned.length === 13) {
    lada = '+521';
    restOfNumber = cleaned.slice(3); // Los 10 dígitos restantes
  }
  // Detectar lada mexicana sin el 1 (52) - 12 dígitos en total
  else if (cleaned.startsWith('52') && cleaned.length === 12) {
    lada = '+52';
    restOfNumber = cleaned.slice(2);
  }
  // Detectar lada USA/Canadá (1) - 11 dígitos en total
  else if (cleaned.startsWith('1') && cleaned.length === 11) {
    lada = '+1';
    restOfNumber = cleaned.slice(1);
  }
  // Otros casos: asumir que los primeros 2 dígitos son la lada
  else if (cleaned.length >= 12) {
    lada = `+${cleaned.slice(0, 2)}`;
    restOfNumber = cleaned.slice(2);
  }
  // Si tiene exactamente 10 dígitos, asumir número local sin lada
  else if (cleaned.length === 10) {
    lada = '';
    restOfNumber = cleaned;
  }
  // Fallback
  else {
    return phoneNumber;
  }

  // Formatear como: lada xxx xxx xxxx (3-3-4)
  if (restOfNumber.length >= 10) {
    const part1 = restOfNumber.slice(0, 3);
    const part2 = restOfNumber.slice(3, 6);
    const part3 = restOfNumber.slice(6, 10);
    return lada ? `${lada} ${part1} ${part2} ${part3}` : `${part1} ${part2} ${part3}`;
  }

  // Si no tiene suficientes dígitos, retornar con la lada separada
  return lada ? `${lada} ${restOfNumber}` : restOfNumber;
};

const Conversation = forwardRef<
  HTMLElement,
  {
    conversation: Conversation;
    onClick?: () => void;
    isActive?: boolean;
    onToggleFavorite?: (conversationId: string, event?: React.MouseEvent) => void;
    isFavorite?: boolean;
  }
>(({ conversation, onClick, isActive, onToggleFavorite, isFavorite }, ref) => {
  const userMessage = conversation.messages.find(
    (message) => message.role === "USER"
  );
  const pic = userMessage?.picture || conversation.avatar;
  const lastUserMessage = [...conversation.messages].reverse().find(
    (message) => message.role === "USER"
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que seleccione la conversación
    if (onToggleFavorite) {
      onToggleFavorite(conversation.id, e);
    }
  };

  // Mostrar número de WhatsApp formateado si está disponible en lugar de "Usuario xxxx"
  // Si el número existe y no es "N/A", formatearlo; de lo contrario, usar userName
  const displayName = (conversation.tel && conversation.tel !== "N/A")
    ? formatPhoneNumber(conversation.tel)
    : conversation.userName;

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
        <p className="font-medium text-base mb-0 pb-0">{displayName}</p>
        <p className="text-xs text-irongray truncate -mt-[2px] grow">
          {lastUserMessage?.content}
        </p>
      </div>
      <div className="flex-2 pr-3 flex flex-col items-end gap-1">
        <p className="text-xs text-gray-500">{conversation.time}</p>
        {/* Botón de favorito clickeable */}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            "transition-all hover:scale-110 cursor-pointer active:scale-95",
            isFavorite ? "text-yellow-500" : "text-gray-400 hover:text-yellow-400"
          )}
          title={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
        >
          {isFavorite ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          )}
        </button>
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
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-600">
            {/* Mostrar número de WhatsApp formateado si está disponible en lugar de "Usuario xxxx" */}
            {tel && tel !== "N/A" ? formatPhoneNumber(tel) : (conversation.userName || "User")}
          </h3>
          {/* Logo WhatsApp si es conversación de WhatsApp */}
          {isWhatsAppConversation && (
            <img src="/assets/chat/whatsapp.svg" alt="WhatsApp" className="w-5 h-5" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
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
  chatbotId,
  isWhatsApp = false,
}: {
  conversationId: string;
  onSendResponse: (conversationId: string, message: string) => void;
  chatbotId?: string;
  isWhatsApp?: boolean;
}) => {
  const { t } = useDashboardTranslation();
  const submit = useSubmit();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
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

  // Fetch templates when showing selector
  useEffect(() => {
    if (isWhatsApp && chatbotId && showTemplateSelector && templates.length === 0) {
      fetchTemplates();
    }
  }, [isWhatsApp, chatbotId, showTemplateSelector]);

  const fetchTemplates = async () => {
    if (!chatbotId) return;

    setLoadingTemplates(true);
    try {
      const response = await fetch(
        `/api/v1/integrations/whatsapp?intent=list_templates&chatbotId=${chatbotId}`
      );
      const data = await response.json();

      if (response.ok) {
        // TEMP: Show ALL templates for debugging (including PENDING)
        // TODO: Revert to only APPROVED before production
        const allTemplates = data.templates || [];
        console.log('📋 Templates recibidos:', allTemplates.map((t: any) => ({ name: t.name, status: t.status })));
        setTemplates(allTemplates);

        // Original: Only show APPROVED templates
        // const approvedTemplates = (data.templates || []).filter(
        //   (tmpl: any) => tmpl.status === 'APPROVED'
        // );
        // setTemplates(approvedTemplates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSendTemplate = async (template: any) => {
    setIsSending(true);
    try {
      const response = await fetch('/api/v1/conversations?intent=send_template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          templateName: template.name,
          templateLanguage: template.language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowTemplateSelector(false);
        // Trigger revalidation to show the template message from backend
        submit({}, { method: "get" });
      } else {
        const error = await response.json();
        console.error('Error sending template:', error);
        alert(t('conversations.errorSendingTemplate') || 'Error sending template');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('conversations.errorSendingTemplate') || 'Error sending template');
    } finally {
      setIsSending(false);
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

        {/* WhatsApp Template Button */}
        {isWhatsApp && (
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="px-3 py-1 text-xs bg-green-50 border border-green-200 rounded-full hover:bg-green-100 transition-colors flex items-center gap-1.5"
          >
            <img src="/assets/chat/whatsapp.svg" className="w-3 h-3" alt="WhatsApp" />
            {t('conversations.sendTemplate')}
          </button>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTemplateSelector(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <img src="/assets/chat/whatsapp.svg" className="w-5 h-5" alt="WhatsApp" />
                {t('conversations.selectTemplate')}
              </h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {loadingTemplates ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 mx-auto text-green-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('conversations.loading')}</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">{t('conversations.noApprovedTemplates')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSendTemplate(template)}
                      disabled={isSending}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {template.name}
                          </h4>
                          {template.components && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                              {template.components.find((c: any) => c.type === 'BODY')?.text || 'No content'}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>{template.category}</span>
                            <span>•</span>
                            <span>{template.language}</span>
                          </div>
                        </div>
                        <div className="text-green-600 flex-shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('conversations.templateInfo')}
              </p>
            </div>
          </div>
        </div>
      )}

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const isUserScrollingRef = useRef<boolean>(false);

  // Detectar si el usuario está scrolleando manualmente
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // Margen de 50px

    // Si el usuario scrollea hacia arriba, marcar que está leyendo
    isUserScrollingRef.current = !isAtBottom;
  };

  // Auto-scroll al final SOLO cuando:
  // 1. Se agrega un nuevo mensaje (aumenta el count)
  // 2. El usuario NO está scrolleando hacia arriba (leyendo historial)
  useEffect(() => {
    const currentMessageCount = conversation?.messages?.length || 0;
    const previousMessageCount = prevMessageCountRef.current;

    // Si aumentó el número de mensajes Y el usuario no está leyendo historial
    if (currentMessageCount > previousMessageCount && !isUserScrollingRef.current) {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }

    // Actualizar el count previo
    prevMessageCountRef.current = currentMessageCount;
  }, [conversation?.messages]);

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
        ref={messagesContainerRef}
        onScroll={handleScroll}
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
            chatbotId={chatbot?.id}
            isWhatsApp={conversation.isWhatsApp || (conversation.tel !== "N/A" && conversation.tel.startsWith("+") && conversation.tel.length >= 10)}
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
      <div className="text-[0.95rem] px-3 py-[6px] bg-dark text-white rounded-xl max-w-[80%] break-words">
        {message.content}
      </div>
      <Avatar className="w-8 h-8 flex-shrink-0" src={message.picture} />
    </div>
  );
};
// Estilos unificados para el contenido markdown - compactos (sin prose)
const PROSE_STYLES = "compact-markdown";

// CSS personalizado para espaciado mínimo - SIN prose de Tailwind
const LIST_STYLES = `
  .compact-markdown {
    line-height: 1.5;
    font-size: 0.95rem;
    color: #1f2937;
  }
  .compact-markdown p {
    margin: 0 0 1.5rem 0;
  }
  .compact-markdown p:last-child {
    margin-bottom: 0;
  }
  .compact-markdown h1, .compact-markdown h2, .compact-markdown h3,
  .compact-markdown h4, .compact-markdown h5, .compact-markdown h6 {
    margin: 1.75rem 0 1.5rem 0;
    font-weight: 600;
  }
  .compact-markdown h1:first-child, .compact-markdown h2:first-child,
  .compact-markdown h3:first-child, .compact-markdown h4:first-child,
  .compact-markdown h5:first-child, .compact-markdown h6:first-child {
    margin-top: 0;
  }
  .compact-markdown ul, .compact-markdown ol {
    list-style: none;
    padding: 0;
    margin: 1.5rem 0;
  }
  .compact-markdown ul:first-child, .compact-markdown ol:first-child {
    margin-top: 0;
  }
  .compact-markdown ul:last-child, .compact-markdown ol:last-child {
    margin-bottom: 0;
  }
  .compact-markdown ol {
    counter-reset: list-counter;
  }
  .compact-markdown li {
    margin: 0 0 1rem 0;
    padding-left: 1.3rem;
    position: relative;
    line-height: 1.5;
  }
  .compact-markdown li:last-child {
    margin-bottom: 0;
  }
  .compact-markdown li p {
    margin: 0;
    display: inline;
  }
  .compact-markdown ul li::before {
    content: "• ";
    color: #374151;
    position: absolute;
    left: 0;
    font-weight: 500;
  }
  .compact-markdown ol li {
    counter-increment: list-counter;
  }
  .compact-markdown ol li::before {
    content: counter(list-counter) ". ";
    color: #374151;
    font-weight: 500;
    position: absolute;
    left: 0;
  }
  .compact-markdown code {
    background-color: #1e293b;
    color: #4ade80;
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.85rem;
    font-family: ui-monospace, monospace;
  }
  .compact-markdown pre {
    background-color: #1e293b;
    color: #4ade80;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
    font-family: ui-monospace, monospace;
    overflow-x: auto;
    margin: 0.5rem 0;
    border: 1px solid #334155;
  }
  .compact-markdown pre:first-child {
    margin-top: 0;
  }
  .compact-markdown pre:last-child {
    margin-bottom: 0;
  }
  .compact-markdown pre code {
    background: none;
    padding: 0;
    color: inherit;
  }
  .compact-markdown strong {
    font-weight: 600;
  }
  .compact-markdown em {
    font-style: italic;
  }
  .compact-markdown a {
    color: #2563eb;
    text-decoration: none;
  }
  .compact-markdown a:hover {
    text-decoration: underline;
  }
  .compact-markdown blockquote {
    border-left: 2px solid #e5e7eb;
    padding-left: 0.75rem;
    font-style: italic;
    color: #6b7280;
    margin: 0.4rem 0;
  }
  .compact-markdown blockquote:first-child {
    margin-top: 0;
  }
  .compact-markdown blockquote:last-child {
    margin-bottom: 0;
  }
`;

/**
 * @TODO: Añadir la acción para el microlike
 * Posible feature:
 * Cuando se le da like al microlike la respuesta
 * puede guardarse como "SHOT" (Ejemplo) para este agente.
 * Pueden existir ejemplos positivos y negativos 👎🏼
 */
const AssistantMessage = ({ message, avatarUrl }: { message: Message; avatarUrl?: string }) => {
  const markdownComponents = {
    a: ({ children, href }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    table: ({ children }: any) => (
      <div className="my-3 overflow-x-auto bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-100 dark:bg-gray-700">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 last:border-r-0">
        {children}
      </td>
    ),
  };

  return (
    <div className="justify-start flex items-start gap-2">
      <style dangerouslySetInnerHTML={{ __html: LIST_STYLES }} />
      <Avatar className="w-8 h-8 flex-shrink-0" src={avatarUrl} />
      <div className="text-base px-3 py-[6px] bg-white border border-outlines rounded-xl relative max-w-[80%] break-words">
        <div className={PROSE_STYLES}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        </div>
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
