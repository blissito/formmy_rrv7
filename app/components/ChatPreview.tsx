import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "~/lib/utils";
import type { Chatbot, Integration } from "@prisma/client";
import { ChatInput } from "./chat/ChatInput";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatHeader } from "./chat/ChatHeader";
import { LoadingIndicator } from "./chat/LoadingIndicator";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";
import { WIDGET_TEMPLATES, type WidgetTemplate } from "@/server/widgets/widget-templates";
import { ArtifactRenderer } from "./artifacts/ArtifactRenderer";
import {
  formatArtifactEventMessage,
  createArtifactEventMetadata,
  isLegacyArtifactEventMessage,
  isResolvingEvent,
  type ResolvedOutcome,
} from "~/lib/artifact-events";
import {
  ArtifactActionBubble,
  isArtifactActionMessage,
} from "./chat/ArtifactActionBubble";

// Tipo para rastrear artefactos resueltos
interface ResolvedArtifact {
  outcome: ResolvedOutcome;
  data?: Record<string, unknown>;
}

// NOTE: HITL pattern (findPendingConfirmArtifactTool + addToolOutput) removed
// Incompatible con transport "Last Message Only" - eventos se envían como mensajes

export interface ChatPreviewProps {
  chatbot: Chatbot;
  integrations?: Integration[]; // Integraciones del chatbot
  production?: boolean;
  onClose?: () => void;
  parentDomain?: string | null; // 🔒 SEGURIDAD: Parent domain para validación (Oct 16, 2025)
  template?: string; // Template del widget para aplicar estilos específicos
  showTrigger?: boolean; // Si debe mostrar el trigger (modo widget preview)
}

export default function ChatPreview({
  chatbot,
  production,
  onClose,
  template,
  showTrigger = false,
}: ChatPreviewProps) {
  // Detectar template automáticamente desde el chatbot o usar el prop
  const activeTemplate = template || chatbot.widgetTemplate || "bubble";
  const templateConfig = WIDGET_TEMPLATES[activeTemplate];
  // 🔑 SESSION PERSISTENCE: Generate or retrieve sessionId from localStorage
  // ✅ FIX: Lazy initialization para evitar race condition
  // ✅ FIX: Incluir chatbotId en sessionId (consistente con WhatsApp)
  const [sessionId] = useState<string>(() => {
    // SSR safety: retornar vacío en servidor
    if (typeof window === "undefined") return "";

    const storageKey = `formmy_session_${chatbot.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      // Si ya existe, verificar que tenga el formato correcto (web_chatbotId_nanoid)
      // Si es formato antiguo (solo nanoid), regenerar
      if (stored.startsWith(`web_${chatbot.id}_`)) {
        return stored;
      }
    }

    // Generar nuevo sessionId con formato: web_chatbotId_nanoid
    const newId = `web_${chatbot.id}_${nanoid()}`;
    localStorage.setItem(storageKey, newId);
    return newId;
  });

  // ✅ PATRÓN CORRECTO: "Last Message Only" con carga de historial
  const { messages, status, sendMessage, error, setMessages } = useChat({
    id: sessionId || undefined, // ✅ AI SDK native session field
    transport: new DefaultChatTransport({
      api: `/chat/vercel/public?chatbotId=${chatbot.id}`,
      // ⬅️ Solo enviar el último mensaje al servidor
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
          },
        };
      },
    }),
    onError: (error) => {
      console.error("[ChatPreview] ❌ Error en useChat:", error);
    },
  });

  // 🎯 Trackear artefactos resueltos para no re-renderizar interactivos
  // Map: artifactName -> { outcome, data }
  const [resolvedArtifacts, setResolvedArtifacts] = useState<Map<string, ResolvedArtifact>>(new Map());

  // Callback para marcar un artefacto como resuelto
  const markArtifactResolved = useCallback((artifactName: string, outcome: ResolvedOutcome, data?: Record<string, unknown>) => {
    console.log(`[ChatPreview] Marcando artefacto resuelto: ${artifactName} -> ${outcome}`);
    setResolvedArtifacts(prev => {
      const next = new Map(prev);
      next.set(artifactName, { outcome, data });
      return next;
    });
  }, []);

  // ✅ Cargar mensajes históricos al montar el componente
  useEffect(() => {
    if (!sessionId) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(
          `/chat/vercel/public?sessionId=${sessionId}&chatbotId=${chatbot.id}`
        );
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          console.log("[ChatPreview] 📚 Loaded history:", data.messages.length);
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("[ChatPreview] ❌ Error loading history:", error);
      }
    };

    loadHistory();
  }, [sessionId, chatbot.id]);

  useEffect(() => {
    console.log("[ChatPreview] Estado actual:");
    console.log("  - sessionId:", sessionId);
    console.log("  - status:", status);
    console.log("  - messagesCount:", messages.length);
    console.log("  - messages:", messages);
    console.log("  - hasError:", !!error);
    if (error) console.log("  - error:", error);
  }, [status, messages.length, sessionId, error]);

  // ✨ TEMPLATE STYLES: Estilos dinámicos según template
  const getTemplateStyles = (template: string) => {
    const styles = {
      bubble: {
        container: "rounded-2xl shadow-2xl",
        header: "rounded-t-2xl",
        background: "bg-white",
        border: "border border-gray-200",
      },
      sidebar: {
        container: "rounded-none shadow-none",
        header: "rounded-none",
        background: "bg-white",
        border: "border-l border-gray-200",
      },
      minimal: {
        container: "rounded-lg shadow-lg",
        header: "rounded-t-lg",
        background: "bg-gray-50",
        border: "border border-gray-300",
      },
      enterprise: {
        container: "rounded-t-xl shadow-xl",
        header: "rounded-t-xl bg-gradient-to-r from-blue-600 to-blue-700",
        background: "bg-white",
        border: "border-t border-x border-gray-200",
      },
      industrial: {
        container: "rounded-sm shadow-lg border-2 border-gray-400",
        header: "rounded-none bg-gray-800",
        background: "bg-gray-100",
        border: "border-2 border-gray-400",
      },
    };
    return styles[template as keyof typeof styles] || styles.bubble;
  };

  const templateStyles = getTemplateStyles(activeTemplate);

  const [text, setText] = useState("");
  const isStreaming = status !== "ready";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref para trackear si el usuario está cerca del final
  const isNearBottomRef = useRef(true);

  // Actualizar isNearBottomRef cuando el usuario hace scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      isNearBottomRef.current = isNearBottom;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll con ResizeObserver para detectar cuando artefactos terminan de cargar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollToBottom = () => {
      if (isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Scroll inicial cuando cambian mensajes
    scrollToBottom();

    // ResizeObserver para detectar cambios de altura (ej: artefactos cargando)
    const resizeObserver = new ResizeObserver(() => {
      scrollToBottom();
    });

    resizeObserver.observe(container);

    if (!isStreaming) {
      inputRef.current?.focus();
    }

    return () => resizeObserver.disconnect();
  }, [messages, isStreaming]);

  const handleSubmit = () => {
    sendMessage({ text });
    setText("");
  };

  const handleClearConversation = () => {
    // Limpiar mensajes del chat
    setMessages([]);

    // Generar nuevo sessionId
    const storageKey = `formmy_session_${chatbot.id}`;
    const newId = `web_${chatbot.id}_${nanoid()}`;
    localStorage.setItem(storageKey, newId);

    // Recargar la página para aplicar el nuevo sessionId
    window.location.reload();
  };

  return (
    <main
      className={cn("h-full", {
        "bg-chatPattern bg-cover rounded-3xl  pt-6": !production,
      })}
    >
      {/* Stream toggle removed - usando AgentEngine V0 con streaming siempre activo */}

      {/* Widget Preview Mode - Muestra trigger + chat abierto */}
      {showTrigger && !production ? (
        <div className="h-svh max-h-[600px] mb-6 max-w-lg mx-auto relative">
          <WidgetPreviewContainer
            templateConfig={templateConfig}
            chatbot={chatbot}
            templateStyles={templateStyles}
            messages={messages}
            status={status}
            isStreaming={isStreaming}
            text={text}
            setText={setText}
            handleSubmit={handleSubmit}
            handleClearConversation={handleClearConversation}
            onClose={onClose}
            scrollContainerRef={scrollContainerRef}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            resolvedArtifacts={resolvedArtifacts}
            onArtifactEvent={(eventName, payload, artifactName) => {
              console.log(`[Preview Artifact Event] ${eventName}:`, payload);

              // 🎯 Marcar artefacto como resuelto ANTES de enviar mensaje
              if (artifactName && isResolvingEvent(eventName)) {
                const outcome = eventName === "onCancel" || eventName === "onClose" ? "cancelled" : "confirmed";
                markArtifactResolved(artifactName, outcome, payload as Record<string, unknown>);
              }

              // 🎯 Enviar evento como mensaje de usuario
              // ⚠️ NOTA: HITL pattern (addToolOutput) deshabilitado - incompatible con transport "Last Message Only"
              // El transport solo envía el último mensaje, pero addToolOutput requiere contexto completo
              console.log(`[Preview] Sending artifact event as message: ${eventName}`);
              const friendlyMessage = formatArtifactEventMessage(
                eventName,
                payload as Record<string, unknown>
              );
              const metadata = createArtifactEventMetadata(
                eventName,
                payload as Record<string, unknown>,
                artifactName
              );
              sendMessage({ text: friendlyMessage }, { metadata });
            }}
          />
        </div>
      ) : (
        <article
          className={cn(
            templateStyles.border,
            templateStyles.background,
            "flex flex-col",
            "overflow-hidden",
            {
              "h-full w-full": production,
              [`h-svh max-h-[600px] mb-6 max-w-lg mx-auto ${templateStyles.container}`]:
                !production,
            }
          )}
        >
        <ChatHeader
          primaryColor={chatbot.primaryColor || "#9A99EA"}
          name={chatbot.name}
          avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
          onClear={handleClearConversation}
          showCloseButton={production}
          onClose={onClose}
          className={templateStyles.header}
          style={{ backgroundColor: chatbot.primaryColor || "#9A99EA" }}
        />

        <section
          ref={scrollContainerRef}
          className="pr-4 grow pt-4 overflow-y-auto flex flex-col gap-2 "
        >
          <>
            <MessageBubble
              key={"saludo"}
              message={{ role: "assistant", content: chatbot.welcomeMessage }}
              avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
            />
            {messages?.map((message) => {
              console.log("[ChatPreview] Renderizando mensaje:", message);
              return (
                <div key={message.id}>
                  {/* <strong>{message.role}</strong> */}
                  {message.parts?.map((part, idx) => {
                    console.log("[ChatPreview] Renderizando part:", part);
                    switch (part.type) {
                      case "text":
                        // Detectar si es un mensaje de evento de artefacto legacy
                        if (message.role === "user" && isArtifactActionMessage(part.text)) {
                          return (
                            <div key={idx} className="flex justify-end px-4 my-1">
                              <ArtifactActionBubble text={part.text} />
                            </div>
                          );
                        }
                        return (
                          <MessageBubble
                            key={idx}
                            message={{ role: message.role, content: part.text }}
                            avatarUrl={
                              chatbot.avatarUrl || "/dash/default-ghosty.svg"
                            }
                          />
                        );
                      case "tool-openArtifactTool":
                        // Renderizar artefacto inline si tiene output disponible
                        console.log("[ChatPreview] tool-openArtifactTool part:", part);
                        if ("state" in part && part.state === "output-available" && "output" in part) {
                          const output = part.output as { type?: string; code?: string; compiledCode?: string | null; data?: Record<string, unknown>; displayName?: string; name?: string };
                          console.log("[ChatPreview] Artifact output:", { type: output?.type, name: output?.name, hasCode: !!output?.code, data: output?.data });
                          if (output?.type === "artifact" && output.code) {
                            const artifactName = output.name;
                            // Verificar si este artefacto ya fue resuelto
                            const resolved = artifactName ? resolvedArtifacts.get(artifactName) : undefined;

                            return (
                              <div key={idx} className="ml-4 my-2">
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  <span className="w-3 h-3">🧩</span>
                                  <span>{output.displayName || "Artefacto"}</span>
                                  {resolved && (
                                    <span className={cn(
                                      "ml-2 px-2 py-0.5 rounded-full text-xs",
                                      resolved.outcome === "confirmed" && "bg-green-100 text-green-700",
                                      resolved.outcome === "cancelled" && "bg-gray-100 text-gray-600"
                                    )}>
                                      {resolved.outcome === "confirmed" ? "✓ Confirmado" : "✗ Cancelado"}
                                    </span>
                                  )}
                                </div>
                                <ArtifactRenderer
                                  name={output.name}
                                  code={output.code}
                                  compiledCode={output.compiledCode}
                                  data={output.data || {}}
                                  // Pasar fase si ya está resuelto
                                  phase={resolved ? "resolved" : undefined}
                                  outcome={resolved?.outcome}
                                  resolvedData={resolved?.data}
                                  onEvent={(eventName, payload) => {
                                    console.log(`[Widget Artifact Event] ${eventName}:`, payload);

                                    // 🎯 Marcar artefacto como resuelto ANTES de enviar mensaje
                                    if (artifactName && isResolvingEvent(eventName)) {
                                      const outcome = eventName === "onCancel" || eventName === "onClose" ? "cancelled" : "confirmed";
                                      markArtifactResolved(artifactName, outcome, payload as Record<string, unknown>);
                                    }

                                    // 🎯 Enviar evento como mensaje de usuario
                                    // ⚠️ NOTA: HITL pattern deshabilitado - incompatible con transport "Last Message Only"
                                    console.log(`[Widget] Sending artifact event as message: ${eventName}`);
                                    const friendlyMessage = formatArtifactEventMessage(
                                      eventName,
                                      payload as Record<string, unknown>
                                    );
                                    const metadata = createArtifactEventMetadata(
                                      eventName,
                                      payload as Record<string, unknown>,
                                      artifactName
                                    );
                                    sendMessage({ text: friendlyMessage }, { metadata });
                                  }}
                                />
                              </div>
                            );
                          }
                        }
                        return null;
                      default:
                        console.warn("[ChatPreview] Tipo de part no soportado:", part.type);
                        return null;
                    }
                  })}
                </div>
              );
            })}
          </>

          <div ref={messagesEndRef} />
        </section>

        <section>
          {isStreaming && (
            <MessageBubble
              role="assistant"
              avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
            >
              <LoadingIndicator />
            </MessageBubble>
          )}
        </section>

        <ChatInput
          ref={inputRef}
          value={text}
          onChange={(value) => {
            setText(value);
          }}
          onSend={handleSubmit}
          disabled={isStreaming}
        />
        </article>
      )}
    </main>
  );
}

// Componente para preview con trigger visible
interface WidgetPreviewContainerProps {
  templateConfig: WidgetTemplate;
  chatbot: Chatbot;
  templateStyles: any;
  messages: any[];
  status: string;
  isStreaming: boolean;
  text: string;
  setText: (value: string) => void;
  handleSubmit: () => void;
  handleClearConversation: () => void;
  onClose?: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  onArtifactEvent?: (eventName: string, payload: unknown, artifactName?: string) => void;
  resolvedArtifacts?: Map<string, ResolvedArtifact>;
}

const WidgetPreviewContainer = ({
  templateConfig,
  chatbot,
  templateStyles,
  messages,
  status,
  isStreaming,
  text,
  setText,
  handleSubmit,
  handleClearConversation,
  onClose,
  scrollContainerRef,
  messagesEndRef,
  inputRef,
  onArtifactEvent,
  resolvedArtifacts = new Map(),
}: WidgetPreviewContainerProps) => {
  const primaryColor = chatbot.primaryColor || "#9A99EA";
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const handleTriggerClick = () => {
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };
  
  return (
    <div className="w-full h-full relative">
      {/* Simulated Website Background */}
      <div className="h-svh max-h-[600px] mb-6 max-w-lg mx-auto relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">

        {/* Widget Trigger - Solo visible cuando el chat está cerrado */}
        {!isChatOpen && (
          <TriggerElement 
            templateConfig={templateConfig} 
            primaryColor={primaryColor} 
            onClick={handleTriggerClick}
            isInteractive={true}
          />
        )}
        
        {/* Widget Chat - Solo visible cuando está abierto */}
        {isChatOpen && (
          <ChatElement
            templateConfig={templateConfig}
            chatbot={chatbot}
            templateStyles={templateStyles}
            messages={messages}
            status={status}
            isStreaming={isStreaming}
            text={text}
            setText={setText}
            handleSubmit={handleSubmit}
            handleClearConversation={handleClearConversation}
            onClose={handleChatClose}
            scrollContainerRef={scrollContainerRef}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            onArtifactEvent={onArtifactEvent}
            resolvedArtifacts={resolvedArtifacts}
          />
        )}
      </div>
    </div>
  );
};

// Componente para renderizar el trigger
interface TriggerElementProps {
  templateConfig: WidgetTemplate;
  primaryColor: string;
  onClick?: () => void;
  isInteractive?: boolean;
}

const TriggerElement = ({ templateConfig, primaryColor, onClick, isInteractive = false }: TriggerElementProps) => {
  const { trigger } = templateConfig;
  
  // Solo renderizar el trigger específico del template actual
  const getTriggerClasses = () => {
    const baseClasses = isInteractive ? "z-50 opacity-100" : "-z-50 opacity-20";
    
    switch (trigger.type) {
      case "bubble":
        return `bottom-4 right-4 w-12 h-12 rounded-full ${baseClasses}`;
      case "sidebar":
      case "tab":
        return `top-1/2 -translate-y-1/2 right-0 w-8 h-24 rounded-l-lg ${baseClasses}`;
      case "bar":
        return `bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 rounded-full ${baseClasses}`;
      default:
        return `bottom-4 right-4 w-12 h-12 rounded-full ${baseClasses}`;
    }
  };
  
  return (
    <div
      className={cn(
        "absolute transition-all duration-300 flex items-center justify-center text-white shadow-lg hover:shadow-xl",
        getTriggerClasses(),
        {
          "cursor-pointer hover:scale-105": isInteractive,
          "pointer-events-none": !isInteractive,
        }
      )}
      style={{ backgroundColor: primaryColor }}
      onClick={isInteractive ? onClick : undefined}
    >
      {trigger.type === "bubble" && (
        <>
          {templateConfig.id === "industrial" ? (
            // Industrial bubble with tools icon
            <div className="w-6 h-6 flex flex-col gap-1 items-center">
              <div className="w-4 h-1 bg-white rounded-sm opacity-90"></div>
              <div className="w-4 h-1 bg-white rounded-sm opacity-70"></div>
              <div className="w-3 h-1 bg-white rounded-sm opacity-90"></div>
            </div>
          ) : (
            // Regular chat icon
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          )}
        </>
      )}
      {(trigger.type === "sidebar" || trigger.type === "tab") && (
        <span className="text-xs font-medium transform rotate-90 whitespace-nowrap">
          {trigger.type === "sidebar" ? "CHAT" : "AYUDA"}
        </span>
      )}
      {trigger.type === "bar" && (
        <span className="text-sm font-medium">¿Necesitas ayuda?</span>
      )}
    </div>
  );
};

// Componente para renderizar el chat
interface ChatElementProps {
  templateConfig: WidgetTemplate;
  chatbot: Chatbot;
  templateStyles: any;
  messages: any[];
  status: string;
  isStreaming: boolean;
  text: string;
  setText: (value: string) => void;
  handleSubmit: () => void;
  handleClearConversation: () => void;
  onClose?: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  onArtifactEvent?: (eventName: string, payload: unknown, artifactName?: string) => void;
  resolvedArtifacts?: Map<string, ResolvedArtifact>;
}

const ChatElement = ({
  templateConfig,
  chatbot,
  templateStyles,
  messages,
  isStreaming,
  text,
  setText,
  handleSubmit,
  handleClearConversation,
  onClose,
  scrollContainerRef,
  messagesEndRef,
  inputRef,
  onArtifactEvent,
  resolvedArtifacts = new Map(),
}: ChatElementProps) => {
  const { chat } = templateConfig;
  
  return (
    <article
      className={cn(
        templateStyles.border,
        templateStyles.background,
        "flex flex-col",
        "overflow-hidden",
        "w-full h-full",
        templateStyles.container
      )}
    >
      <ChatHeader
        primaryColor={chatbot.primaryColor || "#9A99EA"}
        name={chatbot.name}
        avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
        onClear={handleClearConversation}
        showCloseButton={false}
        onClose={onClose}
        className={cn({
          "rounded-t-lg": !["sidebar", "industrial"].includes(templateConfig.id),
          "rounded-none": templateConfig.id === "sidebar",
        })}
        style={{ backgroundColor: chatbot.primaryColor || "#9A99EA" }}
      />

      <section
        ref={scrollContainerRef}
        className="pr-4 grow pt-4 overflow-y-auto flex flex-col gap-2"
      >
        <>
          <MessageBubble
            key={"saludo"}
            message={{ role: "assistant", content: chatbot.welcomeMessage }}
            avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
          />
          {messages?.map((message) => (
            <div key={message.id}>
              {message.parts?.map((part: any, idx: number) => {
                switch (part.type) {
                  case "text":
                    // Detectar si es un mensaje de evento de artefacto legacy
                    if (message.role === "user" && isArtifactActionMessage(part.text)) {
                      return (
                        <div key={idx} className="flex justify-end px-4 my-1">
                          <ArtifactActionBubble text={part.text} />
                        </div>
                      );
                    }
                    return (
                      <MessageBubble
                        key={idx}
                        message={{ role: message.role, content: part.text }}
                        avatarUrl={
                          chatbot.avatarUrl || "/dash/default-ghosty.svg"
                        }
                      />
                    );
                  case "tool-openArtifactTool":
                    // Renderizar artefacto inline si tiene output disponible
                    if (part.state === "output-available" && part.output?.type === "artifact" && part.output.code) {
                      const artifactName = part.output.name;
                      const resolved = artifactName ? resolvedArtifacts.get(artifactName) : undefined;
                      return (
                        <div key={idx} className="ml-4 my-2">
                          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <span>🧩</span>
                            <span>{part.output.displayName || "Artefacto"}</span>
                            {resolved && (
                              <span className={cn(
                                "ml-2 px-2 py-0.5 rounded-full text-xs",
                                resolved.outcome === "confirmed" && "bg-green-100 text-green-700",
                                resolved.outcome === "cancelled" && "bg-gray-100 text-gray-600"
                              )}>
                                {resolved.outcome === "confirmed" ? "✓ Confirmado" : "✗ Cancelado"}
                              </span>
                            )}
                          </div>
                          <ArtifactRenderer
                            name={part.output.name}
                            code={part.output.code}
                            compiledCode={part.output.compiledCode}
                            data={part.output.data || {}}
                            phase={resolved ? "resolved" : undefined}
                            outcome={resolved?.outcome}
                            resolvedData={resolved?.data}
                            onEvent={(eventName, payload) => {
                              console.log(`[Widget Preview Artifact Event] ${eventName}:`, payload);
                              // Propagar al handler padre con nombre del artefacto
                              if (onArtifactEvent) {
                                onArtifactEvent(eventName, payload, artifactName);
                              }
                            }}
                          />
                        </div>
                      );
                    }
                    return null;
                  default:
                    return null;
                }
              })}
            </div>
          ))}
        </>
        <div ref={messagesEndRef} />
      </section>

      <section>
        {isStreaming && (
          <MessageBubble
            role="assistant"
            avatarUrl={chatbot.avatarUrl || "/dash/default-ghosty.svg"}
          >
            <LoadingIndicator />
          </MessageBubble>
        )}
      </section>

      <ChatInput
        ref={inputRef}
        value={text}
        onChange={(value) => {
          setText(value);
        }}
        onSend={handleSubmit}
        disabled={isStreaming}
      />
    </article>
  );
};
