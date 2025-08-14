import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "~/lib/utils";
import { useGhostyChat, type GhostyMessage } from "./hooks/useGhostyChat";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { GhostyCompactInput } from "./GhostyCompactInput";
import { GhostyChatInterface } from "./GhostyChatInterface";
import DiagramIcon from "../ui/icons/Diagram";
import PartyIcon from "../ui/icons/Party";
import BookIcon from "../ui/icons/Book";
import PresentationIcon from "../ui/icons/Presentation";

// Suggestion cards data
const suggestionCards = [
  {
    className: "bg-bird",
    title: "Genera un reporte de...",
    description: "Interacciones, mensajes, etc.",
    icon: <DiagramIcon className="w-10 h-10 ml-1 mt-1"/>
  },
  {
    className: "bg-salmon", 
    title: "Lo nuevo en Formmy ✨",
    description: "features, noticias, estrenos.",
    icon: <PartyIcon className="w-10 h-10 ml-1 mt-1"/>
  },
  {
    className: "bg-grass",
    title: "Explícame...",
    description: "como funcionan los agentes.",
    icon: <BookIcon className="w-10 h-10 ml-1 mt-1"/>
  },
  {
    className: "bg-cloud",
    title: "Haz un resumen de...",
    description: "las preguntas más comunes.",
    icon: <PresentationIcon className="w-10 h-10 ml-1 mt-1"/>
  }
];

interface SuggestionCardProps {
  className?: string;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

const SuggestionCard = ({ className, title, description, icon, onClick }: SuggestionCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 border border-outlines bg-[#FCFDFE] rounded-2xl overflow-hidden p-2 hover:bg-brand-100/40 cursor-pointer",
        "md:flex-row md:items-center md:gap-3 md:p-4",
        "transition-all duration-200"
      )}
    >
      <div className={cn(
        "w-6 h-6 text-4xl rounded grid place-content-center",
        "md:rounded-xl md:min-w-12 md:min-h-12",
        className
      )}>
        <span className="text-lg">{icon}</span>
      </div>
      <div>
        <span className="text-sm md:text-base text-dark font-semibold">{title}</span>
        <p className="text-irongray text-xs md:text-sm">{description}</p>
      </div>
    </motion.div>
  );
};

interface GhostyContainerProps {
  userImage?: string;
}

export const GhostyContainer = ({ userImage }: GhostyContainerProps) => {
  const {
    isClient,
    saveToStorage,
    loadFromStorage,
    clearStorage,
    exportAsMarkdown,
  } = useLocalStorage();

  // Load initial messages from localStorage
  const [initialMessages, setInitialMessages] = useState<GhostyMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isClient) {
      const savedMessages = loadFromStorage();
      setInitialMessages(savedMessages);
      setIsLoaded(true);
      console.log('Loaded messages from storage:', savedMessages.length);
    }
  }, [isClient, loadFromStorage]);

  const {
    messages,
    currentState,
    isExpanded,
    error,
    sendMessage,
    clearChat,
    regenerateResponse,
    expandChat,
    collapseChat,
  } = useGhostyChat(isLoaded ? initialMessages : []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (isClient && messages.length > 0) {
      saveToStorage(messages);
    }
  }, [messages, isClient, saveToStorage]);

  const handleSuggestionClick = (title: string) => {
    const prompts = {
      "Genera un reporte de...": "Genera un reporte detallado de las interacciones de mi chatbot esta semana",
      "Lo nuevo en Formmy ✨": "¿Qué características nuevas se han añadido a Formmy recientemente?",
      "Explícame...": "Explícame cómo funcionan los agentes inteligentes en Formmy",
      "Haz un resumen de...": "Haz un resumen de las preguntas más comunes que recibe mi chatbot"
    };

    const prompt = prompts[title as keyof typeof prompts] || title;
    sendMessage(prompt);
  };

  const handleClearWithStorage = () => {
    clearChat();
    clearStorage();
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    const markdown = exportAsMarkdown(messages);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghosty-chat-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isExpanded) {
          expandChat();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, expandChat]);

  return (
    <div className={cn(
      "grid place-content-center min-h-[calc(100vh-156px)] p-4",
      "md:p-2 md:h-full"
    )}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Compact state - original layout
          <motion.div
            key="compact"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl w-full"
          >
            {/* Title */}
            <motion.h2 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "text-2xl heading text-center mb-6",
                "md:text-4xl"
              )}
            >
              ¡Hola! Conoce a <span className="text-brand-500">Ghosty IA 👻</span>
            </motion.h2>

            {/* Compact Input */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <GhostyCompactInput
                onSubmit={sendMessage}
                onExpand={expandChat}
                isLoading={currentState === 'thinking' || currentState === 'searching' || currentState === 'streaming'}
              />
            </motion.div>

            {/* Suggestion Cards */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4 mt-8"
            >
              {suggestionCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <SuggestionCard
                    {...card}
                    onClick={() => handleSuggestionClick(card.title)}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Keyboard shortcut hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6 hidden md:block"
            >
              <span className="text-xs text-lightgray">
                Presiona <kbd className="px-1 py-0.5 bg-brand-100/40 rounded text-metal font-bold">Cmd+K</kbd> para abrir chat
              </span>
            </motion.div>
          </motion.div>
        ) : (
          // Expanded state - full chat interface  
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full "
          >
            <GhostyChatInterface
              messages={messages}
              currentState={currentState}
              onSendMessage={sendMessage}
              onClearChat={handleClearWithStorage}
              onCollapseChat={collapseChat}
              onRegenerateResponse={regenerateResponse}
              onExportChat={handleExportChat}
              error={error}
              userImage={userImage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};