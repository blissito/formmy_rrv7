import type { Chatbot, User } from "@prisma/client";
import type { UIMessage } from "server/chatbot/conversationTransformer.server";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import { Avatar } from "../Avatar";
import { useState, useEffect, useRef, useMemo, type ReactNode, forwardRef } from "react";
import { useNavigate, useSubmit, useRevalidator } from "react-router";
import { cn } from "~/lib/utils";
import Empty from "~/SVGs/Empty";
import EmptyDark from "~/SVGs/EmptyDark";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDashboardTranslation } from "~/hooks/useDashboardTranslation";
import { FaWhatsapp } from "react-icons/fa";
import { CiStar } from "react-icons/ci";
import { FaStar } from "react-icons/fa";

// Extender tipo Chatbot para asegurar que incluye whatsappAutoManual
type ChatbotWithWhatsAppConfig = Chatbot & {
  whatsappAutoManual?: boolean | null;
};

// Componente Tooltip reutilizable
const Tooltip = ({
  text,
  children,
  icon,
  position = "bottom",
  align = "center"
}: {
  text: string;
  children: ReactNode;
  icon?: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "left" | "center" | "right";
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Posiciones del tooltip según position y align
  const getPositionClasses = () => {
    if (position === "top" || position === "bottom") {
      const vertical = position === "bottom" ? "top-full mt-2" : "bottom-full mb-2";
      const horizontal = {
        left: "left-0",
        center: "left-1/2 -translate-x-1/2",
        right: "right-0",
      };
      return `${vertical} ${horizontal[align]}`;
    }
    // Para left/right mantener comportamiento actual
    if (position === "left") return "right-full top-1/2 -translate-y-1/2 mr-2";
    if (position === "right") return "left-full top-1/2 -translate-y-1/2 ml-2";
    return "";
  };

  // Posiciones de la flecha según position y align
  const getArrowClasses = () => {
    if (position === "top" || position === "bottom") {
      const vertical = position === "bottom" ? "bottom-full -mb-1" : "top-full -mt-1";
      const horizontal = {
        left: "left-4",
        center: "left-1/2 -translate-x-1/2",
        right: "right-4",
      };
      return `${vertical} ${horizontal[align]}`;
    }
    if (position === "left") return "left-full top-1/2 -translate-y-1/2 -ml-1";
    if (position === "right") return "right-full top-1/2 -translate-y-1/2 -mr-1";
    return "";
  };

  // Estilos de la flecha según el prop
  const arrowStyles = {
    bottom: "border-b-gray-900 dark:border-b-gray-800",
    top: "border-t-gray-900 dark:border-t-gray-800",
    left: "border-l-gray-900 dark:border-l-gray-800",
    right: "border-r-gray-900 dark:border-r-gray-800",
  };

  return (
    <div className="relative inline-block" style={{ overflow: 'visible' }}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && (
        <div className={cn(
          "absolute w-max max-w-xs px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg pointer-events-none",
          getPositionClasses()
        )}
        style={{ zIndex: 9999 }}>
          {icon && <span className="mr-1">{icon}</span>}
          {text}
          {/* Flecha del tooltip */}
          <div className={cn("absolute", getArrowClasses())}>
            <div className={cn("border-4 border-transparent", arrowStyles[position])}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Skeleton para mensajes en carga
const MessageSkeleton = ({ side = "left" }: { side?: "left" | "right" }) => {
  const widths = ["w-48", "w-64", "w-56", "w-72"];
  const randomWidth = widths[Math.floor(Math.random() * widths.length)];

  return (
    <div className={cn("flex items-end gap-2 mb-4", side === "right" && "flex-row-reverse")}>
      {/* Avatar skeleton */}
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />

      {/* Message bubble skeleton */}
      <div className={cn(
        "rounded-2xl p-3 space-y-2 animate-pulse",
        randomWidth,
        side === "left"
          ? "bg-white dark:bg-gray-800 rounded-bl-none"
          : "bg-gray-100 dark:bg-gray-700 rounded-br-none"
      )}>
        {/* Shimmer effect overlay */}
        <div className="relative overflow-hidden">
          <div className={cn(
            "h-3 rounded w-full",
            side === "left"
              ? "bg-gray-300 dark:bg-gray-600"
              : "bg-gray-400 dark:bg-gray-500"
          )} />
          <div className={cn(
            "h-3 rounded w-4/5 mt-2",
            side === "left"
              ? "bg-gray-300 dark:bg-gray-600"
              : "bg-gray-400 dark:bg-gray-500"
          )} />

          {/* Shimmer animation */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </div>
  );
};

// Tipo para el resultado de envío de respuesta manual
type ManualResponseResult = { messageId: string; content: string } | null;

type ConversationsProps = {
  chatbot: ChatbotWithWhatsAppConfig;
  user: User;
  conversations?: Conversation[];
  totalConversations?: number;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => Promise<ManualResponseResult>;
  onDeleteConversation?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string) => void;
  selectedConversationId?: string;
};

interface Conversation {
  id: string;
  chatbotId: string;
  messages: UIMessage[];
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

  // ⚡ FASE 1: Estado para carga client-side con infinity scroll
  const [allLoadedConversations, setAllLoadedConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true); // Loading inicial
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement | null>(null); // Ref para IntersectionObserver

  // ⚡ FASE 2: Estado para lazy loading de mensajes
  const [messagesCache, setMessagesCache] = useState<Record<string, UIMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [messagesHasMore, setMessagesHasMore] = useState<Record<string, boolean>>({});



  // ⚡ FASE 1: Cargar conversaciones iniciales desde el cliente
  useEffect(() => {
    const loadInitialConversations = async () => {
      if (!chatbot?.id) return;

      setIsLoadingConversations(true);
      try {
        const response = await fetch(
          `/api/v1/conversations?chatbotId=${chatbot.id}&limit=20`
        );

        if (!response.ok) {
          throw new Error(`Error loading conversations: ${response.status}`);
        }

        const data = await response.json();

        setAllLoadedConversations(data.conversations || []);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("❌ Error loading initial conversations:", error);
        setAllLoadedConversations([]);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadInitialConversations();
  }, [chatbot?.id]);

  // ⚡ FASE 1: Función para cargar más conversaciones con cursor
  const loadMoreConversations = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const url = `/api/v1/conversations?chatbotId=${chatbot.id}&limit=20&cursor=${nextCursor}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error loading more conversations: ${response.status}`);
      }

      const data = await response.json();

      if (data.conversations && data.conversations.length > 0) {
        setAllLoadedConversations(prev => [...prev, ...data.conversations]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("❌ Error loading more conversations:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ⚡ FASE 1: IntersectionObserver para infinity scroll automático
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Cuando el elemento observado es visible, cargar más
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMoreConversations();
        }
      },
      { threshold: 0.1 } // Trigger cuando el 10% del elemento es visible
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, nextCursor]);

  // ⚡ FASE 2: Función para cargar mensajes de una conversación
  const loadMessagesForConversation = async (conversationId: string) => {
    // Si ya están cargando, no hacer nada
    if (loadingMessages[conversationId]) {
      console.log(`⏳ Ya cargando mensajes para conversación ${conversationId}`);
      return;
    }

    // Si ya están en caché, solo actualizar la conversación actual
    if (messagesCache[conversationId]) {
      console.log(`✅ Mensajes en caché para conversación ${conversationId}, actualizando conversación actual`);
      setAllLoadedConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: messagesCache[conversationId] }
            : conv
        )
      );
      // Actualizar también la conversación seleccionada si es la misma
      if (conversation?.id === conversationId) {
        setConversation(prev => prev ? { ...prev, messages: messagesCache[conversationId] } : prev);
      }
      return;
    }

    console.log(`🔄 Cargando mensajes para conversación ${conversationId}...`);
    setLoadingMessages(prev => ({ ...prev, [conversationId]: true }));

    try {
      const response = await fetch(
        `/api/v1/conversations/${conversationId}/messages?limit=50`
      );

      if (!response.ok) {
        throw new Error(`Error loading messages: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Mensajes cargados para conversación ${conversationId}:`, data.messages?.length || 0);

      // Guardar mensajes en caché
      setMessagesCache(prev => ({
        ...prev,
        [conversationId]: data.messages || [],
      }));

      // Guardar info de hasMore
      setMessagesHasMore(prev => ({
        ...prev,
        [conversationId]: data.hasMore || false,
      }));

      // Actualizar la conversación en la lista
      setAllLoadedConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: data.messages || [] }
            : conv
        )
      );

      // ⚡ CRÍTICO: Actualizar también la conversación seleccionada si es la misma
      if (conversation?.id === conversationId) {
        setConversation(prev => prev ? { ...prev, messages: data.messages || [] } : prev);
      }
    } catch (error) {
      console.error("❌ Error loading messages for conversation:", error);
      setMessagesCache(prev => ({ ...prev, [conversationId]: [] }));
    } finally {
      setLoadingMessages(prev => ({ ...prev, [conversationId]: false }));
    }
  };

  // 🔍 Filtrar conversaciones vacías de WhatsApp
  // Una conversación está "vacía" si es de WhatsApp Y tiene mensajes PERO todos son reacciones
  // ⚡ FASE 2: NO filtrar si messages.length === 0 (aún no cargados con lazy loading)
  const actualConversations = useMemo(() => {
    return allLoadedConversations.filter(conv => {
      // Si no es WhatsApp, incluir siempre
      if (!conv.isWhatsApp) return true;

      // Si es WhatsApp pero aún no tiene mensajes cargados, incluir (lazy loading)
      if (!conv.messages || conv.messages.length === 0) return true;

      // Si tiene mensajes, verificar que tenga al menos un mensaje NO reacción
      const hasRealMessages = conv.messages.some(msg => !msg.isReaction);
      return hasRealMessages;
    });
  }, [allLoadedConversations]);

  // 🌐 TABS i18n: Usar índices (0 = All, 1 = Favorites) para compatibilidad con localStorage
  const TAB_ALL = 0;
  const TAB_FAVORITES = 1;
  const tabNames = [t('conversations.allConversations'), t('conversations.favorites')];

  const { currentTab: currentTabIndex, setCurrentTab: setCurrentTabIndex} = useChipTabs(TAB_ALL.toString(), `conversations_${chatbot?.id || 'default'}`);
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  // ✅ Revalidar al montar componente - asegura datos frescos cuando vuelve de Preview
  useEffect(() => {
    revalidator.revalidate();
  }, []); // Solo al montar

  // Estado local para toggle manual (inicializado con valores reales)
  const [localManualModes, setLocalManualModes] = useState<Record<string, boolean>>({});

  // Estado local para favoritos (inicializado con valores reales)
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({});

  // Estado para modo manual global de WhatsApp
  const [whatsappAutoManualUI, setWhatsappAutoManualUI] = useState(chatbot?.whatsappAutoManual || false);
  const [isTogglingWhatsAppManual, setIsTogglingWhatsAppManual] = useState(false);
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState(false);

  // Sincronizar estado UI con props cuando cambien (después de revalidación)
  useEffect(() => {
    setWhatsappAutoManualUI(chatbot?.whatsappAutoManual || false);
  }, [chatbot?.whatsappAutoManual]);

  // Filtrar favoritos usando estado local optimista
  const favoriteConversations = actualConversations.filter(
    (conversation) => localFavorites[conversation.id] ?? conversation.isFavorite
  );
  const allConversations = actualConversations;

  // Seleccionar conversación inicial (desde query param o la primera disponible)
  const initialConversation = selectedConversationId
    ? actualConversations.find(c => c.id === selectedConversationId) || actualConversations[0]
    : actualConversations[0];

  const [conversation, setConversation] = useState<Conversation | undefined>(initialConversation);

  // Estado para controlar visibilidad del panel de detalles de contacto
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Estado para controlar vista mobile (lista vs conversación)
  const [showConversationInMobile, setShowConversationInMobile] = useState(false);

  // Estado para controlar vista mobile del panel de contacto
  const [showContactDetailsInMobile, setShowContactDetailsInMobile] = useState(false);

  // Inicializar estado local con valores de BD
  // ✅ MERGE en vez de REPLACE - preserva cambios locales durante polling
  useEffect(() => {
    setLocalManualModes(prev => {
      const updated = { ...prev };
      let hasNewConversations = false;

      allLoadedConversations.forEach(conv => {
        // Solo inicializar conversaciones nuevas - preservar cambios manuales
        if (updated[conv.id] === undefined) {
          updated[conv.id] = conv.manualMode || false;
          hasNewConversations = true;
        }
      });

      // Solo actualizar si hay conversaciones nuevas
      return hasNewConversations ? updated : prev;
    });

    setLocalFavorites(prev => {
      const updated = { ...prev };
      let hasNewConversations = false;

      allLoadedConversations.forEach(conv => {
        if (updated[conv.id] === undefined) {
          updated[conv.id] = conv.isFavorite || false;
          hasNewConversations = true;
        }
      });

      // Solo actualizar si hay conversaciones nuevas
      return hasNewConversations ? updated : prev;
    });
  }, [allLoadedConversations]);

  // 🔄 Actualizar conversación cuando cambia selectedConversationId (desde URL)
  useEffect(() => {
    if (selectedConversationId && actualConversations.length > 0) {
      const targetConv = actualConversations.find(c => c.id === selectedConversationId);
      if (targetConv && targetConv.id !== conversation?.id) {
        setConversation(targetConv);
        // ⚡ FASE 2: Cargar mensajes si no están en caché
        loadMessagesForConversation(targetConv.id);
      }
    }
  }, [selectedConversationId, actualConversations, conversation?.id]);

  // 🔄 Actualizar conversación seleccionada cuando cambian las props (para revalidación)
  useEffect(() => {
    if (actualConversations.length > 0) {
      // Si no hay conversación seleccionada, seleccionar la primera
      if (!conversation) {
        const firstConv = actualConversations[0];
        console.log(`🎯 Seleccionando primera conversación: ${firstConv.id}, mensajes:`, firstConv.messages?.length || 0);
        setConversation(firstConv);
        loadMessagesForConversation(firstConv.id);
      } else {
        // Si hay conversación seleccionada, actualizarla PERO mantener mensajes si ya estaban cargados
        const updated = actualConversations.find(c => c.id === conversation.id);
        if (updated) {
          // ⚡ CRÍTICO: Preservar mensajes existentes si ya estaban cargados
          const messagesToUse = updated.messages && updated.messages.length > 0
            ? updated.messages
            : conversation.messages || [];

          // ⚡ FIX LOOP: Solo actualizar si hay cambios reales en los datos
          const hasChanges =
            updated.userName !== conversation.userName ||
            updated.lastMessage !== conversation.lastMessage ||
            updated.manualMode !== conversation.manualMode ||
            updated.isFavorite !== conversation.isFavorite ||
            messagesToUse.length !== (conversation.messages?.length || 0);

          if (hasChanges) {
            setConversation({ ...updated, messages: messagesToUse });
          }
        } else {
          // Si la conversación seleccionada ya no existe (fue eliminada), seleccionar la primera
          const firstConv = actualConversations[0];
          console.log(`🎯 Conversación eliminada, seleccionando primera: ${firstConv.id}`);
          setConversation(firstConv);
          loadMessagesForConversation(firstConv.id);
        }
      }
    }
  }, [actualConversations, conversation?.id]);

  // ⚡ FASE 3: Polling deshabilitado - Se reemplazará con SSE (Server-Sent Events)
  // TODO: Implementar SSE para actualizaciones en tiempo real
  // useEffect(() => {
  //   if (!chatbot?.id) return;
  //
  //   const interval = setInterval(() => {
  //     // Revalidar loader data cada 5 segundos para obtener nuevas conversaciones
  //     navigate(window.location.pathname, { replace: true });
  //   }, 5000);
  //
  //   return () => clearInterval(interval);
  // }, [chatbot?.id, navigate]);

  // 🎯 Toggle que sincroniza con backend
  const handleToggleManual = async (conversationId: string) => {

    // Actualizar estado local inmediatamente para UX responsiva
    setLocalManualModes(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));

    // Sincronizar con backend si hay función disponible
    if (onToggleManual) {
      try {
        await onToggleManual(conversationId);
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

  // ✅ Handler con optimistic update para que el mensaje aparezca inmediatamente
  const handleSendManualResponse = async (conversationId: string, message: string) => {
    if (!onSendManualResponse) {
      alert("⚠️ Función de envío no disponible");
      return;
    }

    // Llamar al handler externo (hace POST al backend)
    const result = await onSendManualResponse(conversationId, message);

    // ✅ Optimistic update: agregar mensaje al cache local si el backend confirmó
    if (result) {
      const newMessage: UIMessage = {
        role: "ASSISTANT",
        content: result.content,
        createdAt: new Date(),
      };

      // Actualizar cache de mensajes
      setMessagesCache(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage]
      }));

      // Actualizar mensajes de la conversación actual si es la misma
      if (conversation?.id === conversationId) {
        setConversation(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), newMessage]
        } : prev);
      }

      // Actualizar mensajes en allLoadedConversations
      setAllLoadedConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: [...(conv.messages || []), newMessage], lastMessage: result.content }
            : conv
        )
      );
    }
  };

  // 🎯 Toggle favorito con sincronización backend
  const handleToggleFavorite = async (conversationId: string, event?: React.MouseEvent) => {
    // Prevenir propagación para que no seleccione la conversación
    if (event) {
      event.stopPropagation();
    }


    // Actualizar estado local inmediatamente para UX responsiva
    setLocalFavorites(prev => ({
      ...prev,
      [conversationId]: !prev[conversationId]
    }));

    // Sincronizar con backend si hay función disponible
    if (onToggleFavorite) {
      try {
        await onToggleFavorite(conversationId);
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

  // 🗑️ Delete conversación con actualización optimista
  const handleDeleteConversation = async (conversationId: string) => {
    // ⚡ Actualización optimista - remover de UI inmediatamente
    setAllLoadedConversations(prev => prev.filter(c => c.id !== conversationId));

    // Si la conversación borrada es la seleccionada, seleccionar otra
    if (conversation?.id === conversationId) {
      const remaining = allLoadedConversations.filter(c => c.id !== conversationId);
      setConversation(remaining[0] || undefined);
    }

    // Limpiar caché de mensajes para esta conversación
    setMessagesCache(prev => {
      const { [conversationId]: _, ...rest } = prev;
      return rest;
    });

    // Llamar al callback del padre para sincronizar con backend
    if (onDeleteConversation) {
      onDeleteConversation(conversationId);
    }
  };

  // 🎯 Toggle modo manual global para WhatsApp
  const handleToggleWhatsAppAutoManual = async () => {
    if (isTogglingWhatsAppManual) return; // Prevenir múltiples clicks

    const currentValue = whatsappAutoManualUI;
    const newValue = !currentValue;

    // Confirmar con el usuario
    const whatsappConversations = actualConversations.filter(
      (conv) => conv.isWhatsApp
    );

    if (whatsappConversations.length > 0) {
      const mode = newValue ? "manual" : "automático";

      // Detectar conversaciones con configuración individual diferente
      const conversationsWithDifferentConfig = whatsappConversations.filter(
        (conv) => conv.manualMode !== newValue
      );

      // Mensaje de confirmación con warning si hay configuraciones individuales
      let confirmMessage = `¿Activar modo ${mode} para ${whatsappConversations.length} conversaciones de WhatsApp?\n\n`;

      if (conversationsWithDifferentConfig.length > 0) {
        confirmMessage += `⚠️ ATENCIÓN: Esto cambiará ${conversationsWithDifferentConfig.length} conversación${conversationsWithDifferentConfig.length > 1 ? 'es' : ''} que ${conversationsWithDifferentConfig.length > 1 ? 'tienen' : 'tiene'} configuración individual diferente.\n\n`;
      }

      confirmMessage += `Esto ${newValue ? 'desactivará' : 'activará'} las respuestas automáticas del bot para TODAS las conversaciones de WhatsApp.`;

      const confirmed = window.confirm(confirmMessage);

      if (!confirmed) return;
    }

    // ✅ Optimistic update - actualizar UI inmediatamente
    setWhatsappAutoManualUI(newValue);
    setIsTogglingWhatsAppManual(true);

    try {
      const response = await fetch('/api/v1/conversations?intent=toggle_all_whatsapp_manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          isManual: newValue
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Actualizar estados locales de conversaciones individuales
        setLocalManualModes(prev => {
          const updated = { ...prev };
          whatsappConversations.forEach(conv => {
            updated[conv.id] = newValue;
          });
          return updated;
        });

        // Revalidar para traer datos frescos de BD (incluyendo chatbot.whatsappAutoManual)
        revalidator.revalidate();

        // Feedback al usuario
        alert(`✅ ${data.message || `Modo ${newValue ? 'manual' : 'automático'} activado`}`);
      } else {
        const error = await response.json();
        console.error("❌ Error toggling WhatsApp manual mode:", error);

        // Revertir estado UI si falló
        setWhatsappAutoManualUI(currentValue);

        alert(`Error: ${error.error || 'No se pudo actualizar el modo manual'}`);
      }
    } catch (error) {
      console.error("❌ Error toggling WhatsApp manual mode:", error);

      // Revertir estado UI en caso de error
      setWhatsappAutoManualUI(currentValue);

      alert("Error de conexión. Por favor intenta de nuevo.");
    } finally {
      setIsTogglingWhatsAppManual(false);
    }
  };

  return (
    <>
      {/* ⚡ FASE 1: Mostrar loading inicial mientras cargan conversaciones */}
      {isLoadingConversations ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-metal">{t('common.loading')}</p>
          </div>
        </div>
      ) : actualConversations.length === 0 ? (
        <EmptyConversations t={t} />
      ) : (

      <main className="grid grid-cols-12 gap-6 min-h-[calc(100svh-248px)] max-h-[calc(100svh-248px)] md:min-h-[calc(100svh-296px)] md:max-h-[calc(100svh-296px)]">
        {/* Lista de conversaciones - Se oculta en mobile/tablet cuando se ve una conversación */}
        <article className={cn(
          "col-span-12 lg:col-span-3",
          "flex flex-col h-full gap-4 lg:gap-6",
          showConversationInMobile && "hidden lg:flex" // Ocultar en mobile/tablet si se muestra conversación
        )}>
          {/* Tabs + Botón WhatsApp */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ChipTabs
                names={tabNames}
                onTabChange={(tabName) => {
                  const index = tabNames.indexOf(tabName);
                  setCurrentTabIndex(index.toString());
                }}
                activeTab={tabNames[parseInt(currentTabIndex) || 0]}
              />
            </div>
            {/* Botón WhatsApp - Solo visible si hay conversaciones de WhatsApp */}
            {actualConversations.some(conv => conv.isWhatsApp) && (
              <Tooltip text="Activa/desactiva el modo manual para todas las conversaciones de WhatsApp a la vez" icon="⚙️">
                <button
                  onClick={() => setShowWhatsAppPanel(!showWhatsAppPanel)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                    showWhatsAppPanel
                      ? "bg-green-500 text-white"
                      : "text-metal border border-outlines hover:bg-surfaceFour dark:hover:bg-metal/20"
                  )}
                >
                  <FaWhatsapp className="w-5 h-5" />
                </button>
              </Tooltip>
            )}
          </div>

          {/* Panel de configuración WhatsApp - Se muestra/oculta */}
          {showWhatsAppPanel && actualConversations.some(conv => conv.isWhatsApp) && (
            <div
              className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              style={{
                animation: 'slideDown 0.2s ease-out'
              }}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes slideDown {
                    from {
                      opacity: 0;
                      transform: translateY(-10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `
              }} />
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modo manual WhatsApp
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({actualConversations.filter(c => c.isWhatsApp).length} conversaciones)
                </span>
              </div>
              <button
                onClick={handleToggleWhatsAppAutoManual}
                disabled={isTogglingWhatsAppManual}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full font-medium transition-colors",
                  whatsappAutoManualUI
                    ? "bg-dark text-white"
                    : "bg-cloud text-dark",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                title={whatsappAutoManualUI ? "Desactivar modo manual" : "Activar modo manual"}
              >
                {isTogglingWhatsAppManual ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    {whatsappAutoManualUI ? "🔧 Manual" : "🤖 Agente"}
                  </span>
                )}
              </button>
            </div>
          )}

        <ConversationsList
          onConversationSelect={(conv) => {
            setConversation(conv);
            setShowContactDetails(false); // Cerrar panel al cambiar de conversación
            setShowConversationInMobile(true); // Mostrar conversación en mobile
            // ⚡ FASE 2: Cargar mensajes de la conversación seleccionada
            loadMessagesForConversation(conv.id);
          }}
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
          observerTargetRef={observerTarget}
          onToggleFavorite={handleToggleFavorite}
          localFavorites={localFavorites}
          currentTabIndex={parseInt(currentTabIndex) || 0}
          tabAll={TAB_ALL}
        />
      </article>
      {/* Preview de conversación - En mobile/tablet se muestra solo cuando showConversationInMobile es true */}
      <section className={cn(
        "col-span-12 pb-4 min-h-[calc(100vh-296px)]",
        showContactDetails ? "lg:col-span-6" : "lg:col-span-9",
        !showConversationInMobile && "hidden lg:block", // Ocultar en mobile/tablet si no se ha seleccionado conversación
        showContactDetailsInMobile && "hidden lg:block" // Ocultar solo en mobile/tablet cuando se muestra panel de contacto
      )}>
        {conversation && <ConversationsPreview
          conversation={conversation}
          chatbot={chatbot}
          onToggleManual={handleToggleManual}
          onSendManualResponse={handleSendManualResponse}
          onDeleteConversation={handleDeleteConversation}
          onToggleFavorite={handleToggleFavorite}
          localManualMode={localManualModes[conversation?.id] ?? conversation?.manualMode ?? false}
          isFavorite={localFavorites[conversation?.id] ?? conversation?.isFavorite}
          isLoadingMessages={loadingMessages[conversation?.id] ?? false}
          onAvatarClick={() => {
            const newState = !showContactDetails;
            setShowContactDetails(newState);
            // Solo sincronizar estado mobile/tablet en pantallas < 1024px (breakpoint lg:)
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setShowContactDetailsInMobile(newState);
            }
          }}
          onBackToList={() => setShowConversationInMobile(false)} // Función para volver a la lista en mobile
        />}
      </section>
      {/* Panel de detalles de contacto */}
      {showContactDetails && conversation && (
        <aside
          className={cn(
            "pb-4",
            // Mobile/Tablet: full-screen si showContactDetailsInMobile, oculto si no
            showContactDetailsInMobile ? "col-span-12" : "hidden",
            // Desktop: siempre visible como sidebar
            "lg:block lg:col-span-3"
          )}
          style={{
            animation: 'slideInFromRight 0.3s ease-out forwards, fadeIn 0.3s ease-out forwards'
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes slideInFromRight {
                from {
                  opacity: 0;
                  transform: translateX(20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `
          }} />
          <ContactDetailsPanel
            conversation={conversation}
            onClose={() => {
              setShowContactDetails(false);
              setShowContactDetailsInMobile(false); // Cerrar vista mobile también
            }}
            onBackToConversation={() => {
              setShowContactDetailsInMobile(false);
              setShowContactDetails(false); // Cerrar también el estado principal para sincronizar
            }}
          />
        </aside>
      )}
    </main>
      )}
    </>
  );
};

const EmptyConversations = ({ t }: { t: (key: string) => string }) => {
  return (
    <div className="text-center mt-12 flex flex-col items-center justify-center min-h-[400px]">
      <Empty className="w-[220px] lg:w-[280px] dark:hidden flex" />
      <EmptyDark className="w-[240px] hidden dark:flex" />
      <h3 className="font-bold text-xl lg:text-2xl text-space-800 dark:text-clear mt-6">
        {t('conversations.noConversations')}
      </h3>
      <p className="text-gray-600 text-sm lg:text-base dark:text-gray-400 font-light mt-2 max-w-md">
        {t('conversations.noConversationsDescription')}<br />
        {t('conversations.installScript')}
      </p>
    </div>
  );
};

const EmptyFavorites = () => {
  const { t } = useDashboardTranslation();
  return (
    <div className="text-center mt-0 lg:mt-12 flex flex-col items-center ">
      <Empty className="w-[160px] lg:w-[200px] dark:hidden flex" />
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
  observerTargetRef,
  onToggleFavorite,
  localFavorites = {},
  currentTabIndex,
  tabAll,
}: {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  currentConversation: Conversation | undefined;
  selectedConversationId?: string;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  observerTargetRef?: React.RefObject<HTMLDivElement | null>;
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
    <section className="flex flex-col gap-1 max-h-[calc(100svh-200px)] lg:max-h-[616px] pb-3 overflow-y-scroll  ">
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
              isActive={currentConversation ? conversation.id === currentConversation.id : false}
              onToggleFavorite={onToggleFavorite}
              isFavorite={localFavorites[conversation.id] ?? conversation.isFavorite}
            />
          ))}

          {/* ⚡ FASE 1: Indicador de carga para infinity scroll + observer target */}
          {hasMore && currentTabIndex === tabAll && (
            <div ref={observerTargetRef} className="py-3 grid place-items-center min-h-[40px]">
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 text-sm text-metal">
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  {t('common.loading')}
                </div>
              )}
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

  // Detectar si es conversación de WhatsApp
  const isWhatsAppConversation = conversation.isWhatsApp ||
    (conversation.tel !== "N/A" && conversation.tel.startsWith("+") && conversation.tel.length >= 10);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que seleccione la conversación
    if (onToggleFavorite) {
      onToggleFavorite(conversation.id, e);
    }
  };

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
      <div className="relative">
        <Avatar className="w-10" src={pic} />
        {/* Badge de WhatsApp - círculo verde con icono */}
        {isWhatsAppConversation && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ">
            <FaWhatsapp className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 truncate">
        <div className="flex items-baseline gap-2">
          <p className="font-medium text-base mb-0 pb-0">{conversation.userName}</p>
          {conversation.tel && conversation.tel !== "N/A" && (
            <p className="text-[10px] text-gray-400 truncate">{formatPhoneNumber(conversation.tel)}</p>
          )}
        </div>
        <p className="text-xs text-irongray truncate -mt-[2px] grow">
          {lastUserMessage?.content}
        </p>
      </div>
      <div className="flex-2 pr-3 flex flex-col items-end gap-1">
        <p className="text-xs text-gray-500">{conversation.time}</p>
        {/* Indicador de mensajes nuevos */}
        {conversation.unread > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-[10px] text-brand-500 font-medium">
              {conversation.unread}
            </span>
          </div>
        )}
        {/* Mostrar estrella solo cuando está marcado como favorito */}
        {isFavorite && (
          <Tooltip text="Quitar de favoritos" icon="⭐" position="left">
            <button
              onClick={handleFavoriteClick}
              className="transition-all h-5 w-5 flex items-center justify-center hover:scale-110 cursor-pointer active:scale-95 text-yellow-500"
            >
              <FaStar className="w-4 h-4" />
            </button>
          </Tooltip>
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
  onToggleFavorite,
  isFavorite = false,
  onAvatarClick,
  onBackToList,
}: {
  conversation: Conversation;
  primaryColor?: string;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  localManualMode?: boolean;
  onDeleteConversation?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string, event?: React.MouseEvent) => void;
  isFavorite?: boolean;
  onAvatarClick?: () => void;
  onBackToList?: () => void;
}) => {
  const { date } = conversation;
  const [manualMessage, setManualMessage] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Función para abreviar meses en la fecha
  const getAbbreviatedDate = (fullDate: string): string => {
    const monthMap: Record<string, string> = {
      'enero': 'Ene',
      'febrero': 'Feb',
      'marzo': 'Mar',
      'abril': 'Abr',
      'mayo': 'May',
      'junio': 'Jun',
      'julio': 'Jul',
      'agosto': 'Ago',
      'septiembre': 'Sep',
      'octubre': 'Oct',
      'noviembre': 'Nov',
      'diciembre': 'Dic'
    };

    let abbreviated = fullDate;
    Object.entries(monthMap).forEach(([full, abbr]) => {
      abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbr);
    });
    // Remover "de" extra si existe
    abbreviated = abbreviated.replace(/\sde\s/g, ' ');
    return abbreviated;
  };

  const abbreviatedDate = getAbbreviatedDate(date);


  // Detectar si es conversación de WhatsApp
  // Si tel es un número válido (no "N/A" o "Usuario Web") → es WhatsApp
  const isWhatsAppConversation = conversation.isWhatsApp ||
    (conversation.tel !== "N/A" && conversation.tel.startsWith("+") && conversation.tel.length >= 10);

  // Obtener la foto del usuario (misma lógica que en Conversation component)
  const userMessage = conversation.messages.find(
    (message) => message.role === "USER"
  );
  const userAvatarUrl = userMessage?.picture || conversation.avatar;

  const handleToggleManual = () => {
    if (onToggleManual) {
      onToggleManual(conversation.id);
    }
  };

  const handleDeleteConversation = () => {

    if (!onDeleteConversation) {
      console.error("❌ No onDeleteConversation function provided");
      alert("Error: Función de eliminar no disponible");
      return;
    }

    if (confirm("¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.")) {
      onDeleteConversation(conversation.id);
    } else {
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(conversation.id, e);
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

  const handleDownloadCSV = () => {
    if (!conversation) return;

    const headers = ["Fecha", "Hora", "Rol", "Mensaje"];
    const rows = conversation.messages.map(message => {
      // Manejar fecha que puede venir como string o Date desde el servidor
      let fecha = "Sin fecha";
      let hora = "";

      if (message.createdAt) {
        const dateObj = new Date(message.createdAt);
        fecha = dateObj.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        hora = dateObj.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }

      const role = message.role === "USER" ? "Usuario" : "Asistente";
      const content = `"${message.content.replace(/"/g, '""')}"`;

      return [fecha, hora, role, content].join(",");
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
    <header
      style={{ borderColor: primaryColor || "brand-500" }}
      className={cn(
        "border-t border-l border-r border-outlines",
        "flex",
        "items-center bg-white",
        "gap-1 lg:gap-2",
        "rounded-t-3xl",
        " w-full py-1 px-3 lg:p-3"
      )}
    >
      {/* Botón de volver - Solo visible en mobile/tablet */}
      {onBackToList && (
        <Tooltip text="Volver a conversaciones">
          <button
            onClick={onBackToList}
            className="lg:hidden md:w-8 md:h-8 w-5 h-5 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </Tooltip>
      )}
      <Tooltip text="Ver detalles del contacto" icon="👤">
        <button
          onClick={onAvatarClick}
          className="relative hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center flex-shrink-0"
        >
          <Avatar className="w-8 h-8 md:h-10 md:w-10" src={userAvatarUrl || "/assets/chat/ghosty.svg"} />
          {/* Badge de WhatsApp - círculo verde con icono */}
          {isWhatsAppConversation && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ">
              <FaWhatsapp className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </button>
      </Tooltip>
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className="text-sm md:text-base font-semibold text-dark ">
            {conversation.userName || "User"}
          </h3>
        </div>
        {/* Mobile/Tablet: fecha abreviada */}
        <p className="lg:hidden text-xs text-lightgray -mt-[2px]">{abbreviatedDate}</p>
        {/* Desktop: fecha completa */}
        <p className="hidden lg:block text-xs text-lightgray -mt-[2px]">{date}</p>
      </div>
      <Tooltip text={localManualMode ? "Cambiar a modo automático (bot responde)" : "Cambiar a modo manual (tú respondes)"} icon={localManualMode ? "🤖" : "🔧"} position="bottom">
        <ToggleButton
          isManual={localManualMode}
          onClick={handleToggleManual}
          disabled={false}
        />
      </Tooltip>
      <div className="hidden md:block">
      <Tooltip text="Descargar conversación en CSV" icon="📥" position="bottom">
        <button
          onClick={handleDownloadCSV}
          className="hover:bg-gray-50 rounded-full p-1 transition-colors"
        >
          <img className="w-6 h-6" src="/assets/chat/download.svg" alt="download icon" />
        </button>
      </Tooltip>
      </div>
      <Tooltip text={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"} icon="⭐" position="bottom" align="right">
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "rounded-full p-[2px] transition-all hover:scale-110 active:scale-95",
            "w-8 h-8 flex items-center justify-center",
            isFavorite ? "text-yellow-500 hover:bg-yellow-50" : "text-metal hover:bg-gray-50"
          )}
        >
          {isFavorite ? (
            <FaStar className="w-5 h-5" />
          ) : (
            <CiStar className="w-6 h-6" />
          )}
        </button>
      </Tooltip>
      <Tooltip text="Eliminar conversación" icon="🗑️" position="bottom" align="right">
        <button
          onClick={handleDeleteConversation}
          className=" hover:bg-red-50 rounded-full p-1 transition-colors"
        >
          <img className="w-6 h-6" src="/assets/chat/recyclebin.svg" alt="trash icon" />
        </button>
      </Tooltip>
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
      "ml-auto mr-0 md:mr-2 px-3 py-2 text-xs rounded-full font-medium transition-colors",
      isManual
        ? "bg-dark text-white"
        : "bg-cloud text-dark",
      "disabled:opacity-50"
    )}
  >
    {/* Mobile/Tablet: solo emoji */}
    <span className="lg:hidden">
      {isManual ? "🔧" : "🤖"}
    </span>
    {/* Desktop: emoji + texto */}
    <span className="hidden lg:inline">
      {isManual ? "🔧  Manual" : "🤖 Agente"}
    </span>
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
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🎯 AUTO-FOCUS: Input listo inmediatamente
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showQuickResponses) {
        const target = e.target as HTMLElement;
        if (!target.closest('.quick-responses-dropdown') && !target.closest('.quick-responses-button')) {
          setShowQuickResponses(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQuickResponses]);

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

  // 🎯 SMART SHORTCUTS: Enter envía
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
    "⏱️ Te respondo en un momento",
    "📞 ¿Podrías compartir tu contacto?",
  ];

  return (
    <div className="border-l border-t border-r border-b border-outlines bg-white p-4 w-full rounded-b-3xl relative">
      {/* Dropdown de respuestas rápidas */}
      {showQuickResponses && (
        <div className="quick-responses-dropdown absolute bottom-full left-4 mb-2 bg-white border border-outlines rounded-xl shadow-lg p-2 min-w-[300px] max-w-md z-10">
          <div className="flex flex-col gap-1">
            {quickResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(response);
                  setShowQuickResponses(false);
                }}
                className="px-3 py-2 text-sm text-left text-dark hover:bg-gray-50 rounded-lg transition-colors"
              >
                {response}
              </button>
            ))}
            {/* WhatsApp Templates */}
            {isWhatsApp && (
              <button
                onClick={() => {
                  setShowQuickResponses(false);
                  setShowTemplateSelector(true);
                }}
                className="px-3 py-2 text-sm text-left text-green-700 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 border-t border-gray-100 mt-1 pt-2"
              >
                <img src="/assets/chat/whatsapp.svg" className="w-4 h-4" alt="WhatsApp" />
                {t('conversations.sendTemplate')}
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Input de mensaje limpio */}
      <div className="flex items-center gap-3">
        {/* Botón de respuestas rápidas */}
        <button
          onClick={() => setShowQuickResponses(!showQuickResponses)}
          className={cn(
            "quick-responses-button",
            "w-10 h-10 flex items-center justify-center rounded-xl border border-outlines",
            "hover:bg-gray-50 transition-colors flex-shrink-0",
            showQuickResponses ? "bg-gray-50" : "bg-white"
          )}
          title="Respuestas rápidas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-metal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* Input de texto */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje"
          maxLength={4096}
          className={cn(
            "flex-1 h-10 px-4 border-none rounded-xl",
            "bg-outlines/20 text-dark text-sm",
            "placeholder:text-lightgray",
            "focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-transparent",
            "transition-all duration-200"
          )}
        />

        {/* Botón de enviar */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className={cn(
            "w-10 h-10 rounded-full bg-brand-500 text-white",
            "flex items-center justify-center flex-shrink-0",
            "hover:bg-brand-600 hover:shadow-lg",
            "active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-500 disabled:hover:shadow-none",
            "transition-all duration-200"
          )}
          title="Enviar mensaje"
        >
          {isSending ? (
            <div className="w-6 h-6 border-1 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <img src="/dash/send.svg" alt="Enviar" className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
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
  onToggleFavorite,
  localManualMode = false,
  isFavorite = false,
  isLoadingMessages = false,
  onAvatarClick,
  onBackToList,
}: {
  conversation: Conversation | undefined;
  primaryColor?: string;
  chatbot?: Chatbot;
  onToggleManual?: (conversationId: string) => void;
  onSendManualResponse?: (conversationId: string, message: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string, event?: React.MouseEvent) => void;
  localManualMode?: boolean;
  isFavorite?: boolean;
  isLoadingMessages?: boolean;
  onAvatarClick?: () => void;
  onBackToList?: () => void;
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

  return (
    <div className="h-full flex flex-col min-h-[calc(100svh-248px)] max-h-[calc(100svh-248px)] md:min-h-[calc(100svh-296px)] md:max-h-[calc(100svh-296px)] ">
      <div className="flex-shrink-0">
        {conversation && (
          <ChatHeader
            conversation={conversation}
            onToggleManual={onToggleManual}
            onSendManualResponse={onSendManualResponse}
            onDeleteConversation={onDeleteConversation}
            onToggleFavorite={onToggleFavorite}
            localManualMode={localManualMode}
            isFavorite={isFavorite}
            onAvatarClick={onAvatarClick}
            onBackToList={onBackToList}
          />
        )}
      </div>

      {/* Messages - Flex grow container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={cn(
          "border border-outlines w-full shadow-standard flex-1 overflow-y-auto",
          localManualMode ? "border-b-0" : "rounded-b-3xl"
        )}
        style={{
          backgroundImage: "url('/dash/chat-cover.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y"
        }}
      >
        <div className="p-4">
          {isLoadingMessages ? (
            // Skeleton loading con mensajes alternados
            <div className="space-y-4">
              <MessageSkeleton side="left" />
              <MessageSkeleton side="right" />
              <MessageSkeleton side="left" />
              <MessageSkeleton side="right" />
              <MessageSkeleton side="left" />
            </div>
          ) : conversation?.messages ? (
            groupMessagesByDate(
              conversation.messages.filter((message) => !message.isReaction && message.role !== "SYSTEM")
            ).map(([date, messages]) => (
              <div key={date}>
                <DateSeparator date={date} />
                {messages.map((message, index) => {
                  // Buscar reacciones para este mensaje
                  const reactions = conversation.messages.filter(
                    (msg) => msg.isReaction === true && msg.reactionToMsgId === message.externalMessageId
                  );

                  // Determinar si mostrar timestamp (solo si es el último del grupo con misma hora)
                  const nextMessage = messages[index + 1];
                  const currentTime = formatMessageTime(new Date(message.createdAt));
                  const nextTime = nextMessage ? formatMessageTime(new Date(nextMessage.createdAt)) : null;
                  const showTimestamp = !nextMessage || message.role !== nextMessage.role || currentTime !== nextTime;

                  // Determinar si mostrar avatar (solo si es el primero del grupo con misma hora)
                  const prevMessage = messages[index - 1];
                  const prevTime = prevMessage ? formatMessageTime(new Date(prevMessage.createdAt)) : null;
                  const showAvatar = !prevMessage || message.role !== prevMessage.role || currentTime !== prevTime;

                  // Determinar margen: si el siguiente mensaje es del mismo grupo (mismo remitente, misma hora), usar margen pequeño
                  const isNextMessageSameGroup = nextMessage && message.role === nextMessage.role && currentTime === nextTime;
                  const marginClass = isNextMessageSameGroup ? "mb-1" : "mb-4 last:mb-8";

                  return (
                    <div key={index} className={marginClass}>
                      <SingleMessage
                        message={message}
                        chatbotAvatarUrl={chatbot?.avatarUrl || undefined}
                        reactions={reactions}
                        showTimestamp={showTimestamp}
                        showAvatar={showAvatar}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
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

// Helper: Formatear hora (HH:MM)
function formatMessageTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper: Formatear fecha para separadores (Hoy, Ayer, o fecha completa)
function formatDateSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInMs = today.getTime() - messageDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Hoy";
  } else if (diffInDays === 1) {
    return "Ayer";
  } else if (diffInDays < 7) {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[date.getDay()];
  } else {
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  }
}

// Helper: Agrupar mensajes por día
function groupMessagesByDate(messages: UIMessage[]): [string, UIMessage[]][] {
  const groups = new Map<string, UIMessage[]>();

  messages.forEach(msg => {
    const date = new Date(msg.createdAt);
    const dateKey = formatDateSeparator(date);

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(msg);
  });

  return Array.from(groups.entries());
}

// Componente: Separador de fecha sticky
const DateSeparator = ({ date }: { date: string }) => (
  <div className="sticky top-0 z-10 flex justify-center py-2 mb-3">
    <span className="bg-gray-200/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
      {date}
    </span>
  </div>
);

export const SingleMessage = ({
  message,
  chatbotAvatarUrl,
  reactions = [],
  showTimestamp = true,
  showAvatar = true,
}: {
  message: UIMessage;
  chatbotAvatarUrl?: string;
  reactions?: UIMessage[];
  showTimestamp?: boolean;
  showAvatar?: boolean;
}) => {
  return message.role === "USER" ? (
    <UserMessage message={message} reactions={reactions} showTimestamp={showTimestamp} showAvatar={showAvatar} />
  ) : (
    <AssistantMessage message={message} avatarUrl={chatbotAvatarUrl} reactions={reactions} showTimestamp={showTimestamp} showAvatar={showAvatar} />
  );
};

const UserMessage = ({ message, reactions = [], showTimestamp = true, showAvatar = true }: { message: UIMessage; reactions?: UIMessage[]; showTimestamp?: boolean; showAvatar?: boolean }) => {
  // Detectar si el mensaje contiene un sticker (picture contiene imagen, content es "📎 Sticker")
  const hasMultimedia = message.picture && message.content === "📎 Sticker";

  // Obtener la primera reacción (solo mostramos una según WhatsApp nativo)
  const reaction = reactions[0];

  return (
    <div className="justify-end flex items-start gap-2">
      <div className="flex flex-col items-end gap-1 max-w-[70%]">
        <div className="relative w-fit">
          {hasMultimedia ? (
            // Mostrar sticker/imagen como contenido
            <div className="max-w-[200px]">
              <img
                src={message.picture}
                alt="Sticker"
                className="rounded-xl w-full h-auto"
                loading="lazy"
              />
            </div>
          ) : (
            // Mensaje de texto normal
            <div className="text-sm lg:text-[0.95rem] px-3 py-[6px] bg-dark text-white rounded-xl break-words w-fit">
              {message.content}
            </div>
          )}
          {/* Mostrar reacción como overlay - mismo estilo que MicroLikeButton */}
          {reaction && reaction.reactionEmoji && (
            <div
              className={cn(
                "grid place-content-center",
                "min-w-4 min-h-4 shadow aspect-square",
                "bg-[#fff] rounded-full w-min",
                "absolute -bottom-3 right-2",
                "text-xs p-[10px]"
              )}
              title="Reacción de WhatsApp"
            >
              {reaction.reactionEmoji}
            </div>
          )}
        </div>
        {/* Timestamp del mensaje - solo si showTimestamp es true */}
        {showTimestamp && (
          <div className="text-[10px] text-lightgray pr-1">
            {formatMessageTime(new Date(message.createdAt))}
          </div>
        )}
      </div>
      {/* Avatar del usuario - solo si showAvatar es true */}
      {showAvatar ? (
        <Avatar className="w-8 h-8 flex-shrink-0" src={message.avatarUrl} />
      ) : (
        <div className="w-8 h-8 flex-shrink-0" />
      )}
    </div>
  );
};
// Estilos unificados para el contenido markdown - compactos (sin prose)
const PROSE_STYLES = "compact-markdown";

// CSS personalizado para espaciado mínimo - SIN prose de Tailwind
const LIST_STYLES = `
  .compact-markdown {
    line-height: 1.5;
    font-size: 0.875rem; /* 14px en mobile */
    color: #1f2937;
    word-break: normal;
    overflow-wrap: break-word;
  }
  @media (min-width: 768px) {
    .compact-markdown {
      font-size: 0.95rem; /* ~15.2px en desktop */
    }
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
    margin: 12px 0;
  }
  .compact-markdown ul:first-child, .compact-markdown ol:first-child {
    margin-top: 0;
  }
  .compact-markdown ul:last-child, .compact-markdown ol:last-child {
    margin-bottom: 0;
  }
  .compact-markdown ol:not(ol ol) {
    counter-reset: list-counter 0;
  }
  .compact-markdown li {
    margin: 0 0 1rem 0;
    padding-left: 1.3rem;
    position: relative;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .compact-markdown li:last-child {
    margin-bottom: 0;
  }
  .compact-markdown li p {
    margin: 0;
    display: inline;
  }
  .compact-markdown ul > li::before {
    content: "• ";
    color: #374151;
    position: absolute;
    left: 0;
    font-weight: 500;
  }
  .compact-markdown ol > li {
    counter-increment: list-counter 1;
  }
  .compact-markdown ol > li::before {
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
    font-size: 0.8125rem; /* 13px en mobile */
    font-family: ui-monospace, monospace;
  }
  @media (min-width: 768px) {
    .compact-markdown code {
      font-size: 0.85rem; /* ~13.6px en desktop */
    }
  }
  .compact-markdown pre {
    background-color: #1e293b;
    color: #4ade80;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.8125rem; /* 13px en mobile */
    font-family: ui-monospace, monospace;
    overflow-x: auto;
    margin: 0.5rem 0;
    border: 1px solid #334155;
  }
  @media (min-width: 768px) {
    .compact-markdown pre {
      font-size: 0.85rem; /* ~13.6px en desktop */
    }
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
const AssistantMessage = ({
  message,
  avatarUrl,
  reactions = [],
  showTimestamp = true,
  showAvatar = true,
}: {
  message: UIMessage;
  avatarUrl?: string;
  reactions?: UIMessage[];
  showTimestamp?: boolean;
  showAvatar?: boolean;
}) => {
  // Detectar si el mensaje contiene un sticker (picture contiene imagen, content es "📎 Sticker")
  const hasMultimedia = message.picture && message.content === "📎 Sticker";

  // Obtener la primera reacción (solo mostramos una según WhatsApp nativo)
  const reaction = reactions[0];

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
      {/* Avatar del bot - solo si showAvatar es true */}
      {showAvatar ? (
        <Avatar className="w-8 h-8 flex-shrink-0" src={avatarUrl} />
      ) : (
        <div className="w-8 h-8 flex-shrink-0" />
      )}
      <div className="flex flex-col items-start gap-1 max-w-[80%]">
        <div className="relative">
          {hasMultimedia ? (
            // Mostrar sticker/imagen como contenido
            <div className="max-w-[200px]">
              <img
                src={message.picture}
                alt="Sticker"
                className="rounded-xl w-full h-auto"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="text-sm lg:text-base px-3 py-[6px] bg-white border border-outlines rounded-xl relative">
              <div className={PROSE_STYLES}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {/* MicroLikeButton comentado - no funcional sin onClick handler */}
              {/* <MicroLikeButton /> */}
            </div>
          )}
          {/* Mostrar reacción como overlay - mismo estilo que MicroLikeButton */}
          {reaction && reaction.reactionEmoji && (
            <div
              className={cn(
                "grid place-content-center ",
                "min-w-4 min-h-4 shadow aspect-square",
                "bg-white rounded-full w-min",
                "absolute -bottom-2 left-2",
                "text-sm p-[3px]"
              )}
              title="Reacción de WhatsApp"
            >
              {reaction.reactionEmoji}
            </div>
          )}
        </div>
        {/* Timestamp del mensaje - solo si showTimestamp es true */}
        {showTimestamp && (
          <div className="text-[10px] text-lightgray pl-1">
            {formatMessageTime(new Date(message.createdAt))}
          </div>
        )}
      </div>
    </div>
  );
};

// Panel de detalles del contacto
const ContactDetailsPanel = ({
  conversation,
  onClose,
  onBackToConversation,
}: {
  conversation: Conversation;
  onClose: () => void;
  onBackToConversation?: () => void;
}) => {
  // Obtener la foto del usuario
  const userMessage = conversation.messages.find((message) => message.role === "USER");
  const userAvatarUrl = userMessage?.picture || conversation.avatar;

  // Detectar si es conversación de WhatsApp
  const isWhatsAppConversation = conversation.isWhatsApp ||
    (conversation.tel !== "N/A" && conversation.tel.startsWith("+") && conversation.tel.length >= 10);

  // Filtrar emails falsos generados automáticamente (ej: user-xxx@whatsapp.local)
  const isValidEmail = conversation.userEmail &&
    conversation.userEmail !== "N/A" &&
    !conversation.userEmail.includes("@whatsapp.local");

  const displayEmail = isValidEmail ? conversation.userEmail : "--";

  // Obtener fecha del primer mensaje
  const firstMessage = conversation.messages.length > 0 ? conversation.messages[0] : null;
  const firstMessageDate = firstMessage
    ? new Date(firstMessage.createdAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  // TODO: Implementar lógica de compra
  const hasPurchased = false;

  return (
    <div className="bg-white rounded-3xl border border-outlines shadow-standard p-6 h-fit lg:h-fit min-h-[calc(100svh-200px)] lg:min-h-0 flex flex-col relative">
      {/* Botón de volver - Solo visible en mobile/tablet */}
      {onBackToConversation && (
        <button
          onClick={onBackToConversation}
          className="lg:hidden absolute top-4 left-4 w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors z-10"
          title="Volver a conversación"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {/* Botón de cerrar en esquina superior derecha - Solo visible en desktop */}
      <button
        onClick={onClose}
        className="hidden lg:flex absolute top-4 right-4 w-8 h-8 items-center justify-center hover:bg-gray-50 rounded-full transition-colors z-10"
        title="Cerrar"
      >
        <img src="/dash/sunroof.svg" alt="Cerrar" className="w-5 h-5" />
      </button>

      {/* Avatar grande centrado */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <Avatar className="w-24 h-24" src={userAvatarUrl || "/assets/chat/ghosty.svg"} />
          {isWhatsAppConversation && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <FaWhatsapp className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-dark mb-1">{conversation.userName}</h2>
        {conversation.tel && conversation.tel !== "N/A" && (
          <p className="text-sm text-gray-500">{formatPhoneNumber(conversation.tel)}</p>
        )}
      </div>

      {/* Información de contacto */}
      <div className="space-y-4 flex-1">
        {/* Email */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-brand-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">
              Correo electrónico
            </p>
            <p className="text-sm font-medium text-dark truncate">
              {displayEmail}
            </p>
          </div>
        </div>

        {/* Fecha del primer mensaje */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-bird/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-bird" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">
              Primer mensaje
            </p>
            <p className="text-sm font-medium text-dark">{firstMessageDate}</p>
          </div>
        </div>

        {/* Estado de compra */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            hasPurchased ? "bg-lime/10" : "bg-lime/30"
          )}>
            <svg className={cn("w-5 h-5", hasPurchased ? "text-lime" : "text-[#7BA31C]")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">
              Estado de compra
            </p>
            <p className={cn(
              "text-sm font-medium",
              hasPurchased ? "text-lime" : "text-metal"
            )}>
              {hasPurchased ? 'Ha comprado' : 'No ha comprado'}
            </p>
          </div>
        </div>

        {/* Total de mensajes */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-cloud/30 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-metal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">
              Total de mensajes
            </p>
            <p className="text-sm font-medium text-dark">
              {conversation.messages.filter(m => !m.isReaction).length}
            </p>
          </div>
        </div>
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
