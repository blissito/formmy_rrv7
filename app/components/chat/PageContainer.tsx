import type { Chatbot, User } from "@prisma/client";
import { useState, type ReactNode, useEffect, Children, useRef, createContext, useContext } from "react";
import { cn } from "~/lib/utils";
import Spinner from "../Spinner";
import { Effect, pipe } from "effect";
import { Link, Links } from "react-router";
import { IoIosArrowRoundBack } from "react-icons/io";
import { PreviewForm } from "./tab_sections/Preview";
import {
  Conversations,
  ConversationsPreview,
} from "./tab_sections/Conversations";
import ChatPreview from "../ChatPreview";
import DeleteIcon from "../ui/icons/Delete";
import CodeIcon from "../ui/icons/Code";
import OpenTabIcon from "../ui/icons/OpenTab";
import UsersIcon from "../ui/icons/Users";
import { motion } from "framer-motion";
import EditIcon from "../ui/icons/Edit";
import { type AgentType } from "./common/AgentDropdown";
import { ProTagChatbot } from "../ProTagChatbot";
import { getDefaultModelForPlan } from "~/utils/aiModels";

// Context para compartir estado entre PreviewForm y ChatPreview
interface PreviewContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedAgent: AgentType;
  setSelectedAgent: (agent: AgentType) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  instructions: string;
  setInstructions: (instructions: string) => void;
  customInstructions: string;
  setCustomInstructions: (customInstructions: string) => void;
  name: string;
  setName: (name: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  welcomeMessage: string;
  setWelcomeMessage: (message: string) => void;
  goodbyeMessage: string;
  setGoodbyeMessage: (message: string) => void;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export const usePreviewContext = () => {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error("usePreviewContext must be used within PreviewProvider");
  }
  return context;
};

const MAX_WIDTH = "max-w-7xl";

export const PageContainer = ({
  children,
  ...props
}: {
  children: ReactNode;
  [x: string]: unknown;
}) => {
  const childrenArray = Children.toArray(children);
  const HeaderComponent = childrenArray.find(
    (child) =>
      typeof child === "object" &&
      child !== null &&
      "type" in child &&
      (child as React.ReactElement).type === PageContainer.Header
  );
  const nodes = childrenArray.filter(
    (child) =>
      typeof child !== "object" ||
      child === null ||
      !("type" in child) ||
      (child as React.ReactElement).type !== PageContainer.Header
  );
  return (
    <main className="h-full max-w-7xl mx-auto p-4 md:py-8 md:px-0 ">
      {HeaderComponent && HeaderComponent}
      <article className={cn("h-full")} {...props}>
        <section>{nodes}</section>
      </article>
    </main>
  );
};

export const Title = ({
  children,
  back,
  cta,
  className,
  ...props
}: {
  back?: string;
  cta?: ReactNode;
  children: ReactNode;
  className?: string;
  [x: string]: unknown;
}) => {
  return (
    <nav
      className={cn(
        "flex justify-between items-center mb-6 md:mb-8",
        className
      )}
    >
      <div className="flex items-end gap-4 relative">
        {back && (
          <Link to={back} className="text-4xl absolute -left-2 md:-left-10">
            <IoIosArrowRoundBack />
          </Link>
        )}
        <h2
          className={cn(
            "text-2xl md:text-3xl font-bold ml-0 text-dark",
            back && "ml-8 md:ml-0"
          )}
        >
          {children}
        </h2>
      </div>
      {cta}
    </nav>
  );
};

export const Header = ({
  user,
  ...props
}: {
  user: User;

  [x: string]: unknown;
}) => {
  return (
    <section className="top-0 left-0 right-0">
      <nav
        className={cn(
          "flex gap-1 text-xs font-thin justify-end py-2",
          MAX_WIDTH
        )}
      >
        <button className="flex gap-1 items-center bg-gray-300 rounded-full px-2">
          <span className="w-4">
            <img alt="svg" src="/assets/chat/dashboard-gauge.svg" />
          </span>
          <span>Uso</span>
        </button>
        <button className="rounded-full px-2 py-1">Docs</button>
        <button className="rounded-full px-2 py-1">
          <span className="w-4 block">
            <img alt="noti" src="/assets/chat/notification.svg" />
          </span>
        </button>
        <button className="rounded-full px-2 py-1">
          <span className="w-10 h-10 block">
            <img
              className="w-full h-full rounded-full p-1"
              alt="user"
              src={user?.picture || undefined}
            />
          </span>
        </button>
      </nav>
    </section>
  );
};

export const Button = ({
  children,
  onClick,
  isDisabled,
  isLoading,
  className,
  mode,
  to,
  ...props
}: {
  mode?: "ghost";
  className?: string;
  isLoading?: boolean;
  onClick?: () => void;
  children: ReactNode;
  [x: string]: unknown;
  isDisabled?: boolean;
}) => {
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          "h-10 w-[auto] flex gap-1 items-center px-6 rounded-full transition-all",
          mode === "ghost"
            ? "bg-white border border-gray-300 rounded-lg text-gray-600 px-2 hover:bg-surfaceFour "
            : "bg-brand-500 text-clear hover:ring hover:ring-brand-500",
          className
        )}
        {...props}
      >
        {isLoading && <Spinner />}
        {!isLoading && children}
      </Link>
    );
  }
  //   else
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 w-[auto] flex gap-1 items-center px-6 rounded-full transition-all",
        mode === "ghost"
          ? "bg-white border border-gray-300 rounded-lg text-gray-600 px-2 hover:bg-surfaceFour "
          : "bg-brand-500 text-white hover:ring hover:ring-brand-500",
        {
          "pointer-events-none bg-gray-300 text-gray-400": isDisabled,
        },
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Spinner />}
      {!isLoading && children}
    </button>
  );
};

// delete is possible from the card directly
export const ChatCard = ({
  onDelete,
  chatbot,
  userRole,
  isInvited,
}: {
  onDelete?: () => void;
  chatbot: Chatbot & { canAccess?: boolean; needsUpgrade?: boolean };
  userRole?: string;
  isInvited?: boolean;
}) => {
  const [conversationsCount, setConversationsCount] = useState(0);

  const effectRunner = async () => {
    const program = pipe(
      Effect.tryPromise({
        try: () =>
          fetch("/api/v1/chatbot", {
            method: "post",
            body: new URLSearchParams({
              intent: "get_conversations_count",
              chatbotId: chatbot.id,
            }),
          }),
        catch: (error) => new Error(`Error en la petición: ${error}`),
      }),
      Effect.flatMap((response) => {
        // Handle 403 (access denied) gracefully
        if (response.status === 403) {
          console.log("Access denied to chatbot - user needs to upgrade");
          return Effect.succeed({ needsUpgrade: true, count: 0 });
        }
        return Effect.tryPromise({
          try: () => response.json(),
          catch: (error) =>
            new Error(`Error al procesar la respuesta: ${error}`),
        });
      }),
      Effect.map((data) => {
        if (data.success && data.count !== undefined) {
          setConversationsCount(data.count);
        } else if (data.needsUpgrade) {
          setConversationsCount(0); // Show 0 for blocked access
        }
        return data;
      }),
      Effect.catchAll((error) => {
        console.error("Error al obtener el conteo de conversaciones:", error);
        return Effect.succeed(null);
      })
    );

    await Effect.runPromise(program);
  };

  useEffect(() => {
    // get conversations
    effectRunner();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        // delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="col-span-1"
    >
{chatbot.canAccess === false ? (
        // Show as disabled div with Pro upgrade for blocked chatbots  
        <div className="group relative overflow-hidden transition-all border border-outlines bg-white rounded-2xl w-full h-full block opacity-75">
          <section className="bg-gradient-to-r from-[#51B8BF] to-brand-500 w-full h-24 flex items-end justify-center border-b border-outlines">
            <img src="/dash/chat.png" alt="chatbot" />
          </section>
          <div className="flex flex-col px-4 pt-4 pb-2 relative">
            <ProTagChatbot 
              message="Tu plan gratuito no incluye acceso a chatbots. Actualiza tu plan para usar esta funcionalidad."
            />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-medium text-dark truncate">
                {chatbot.name}
              </h2>
              {isInvited && userRole && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {userRole === "VIEWER" && "Viewer"}
                  {userRole === "EDITOR" && "Editor"}
                  {userRole === "ADMIN" && "Admin"}
                </span>
              )}
            </div>
            <p className="text-sm text-metal flex-grow">
              {chatbot.description ||
                "Pronto podrás saber que es lo que más preguntan tus clientes"}
            </p>
            <div className="flex text-sm gap-4 mt-4 justify-between items-end">
              <p className="text-metal font-normal flex gap-1 items-center">
                <UsersIcon className="w-5 h-5" /> {conversationsCount}{" "}
                {conversationsCount === 1 ? "chat" : "chats"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Normal link for accessible chatbots
        <Link
          to={`/dashboard/chat/${chatbot.slug}`}
          className="group relative overflow-hidden transition-all hover:shadow-none md:hover:shadow-[0_4px_16px_0px_rgba(204,204,204,0.25)] border border-outlines bg-white rounded-2xl w-full h-full block"
        >
          <section className="bg-gradient-to-r from-[#51B8BF] to-brand-500 w-full h-24 flex items-end justify-center border-b border-outlines">
            <img src="/dash/chat.png" alt="chatbot" />
          </section>
          <div className="flex flex-col px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-medium text-dark truncate">
                {chatbot.name}
              </h2>
              {isInvited && userRole && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {userRole === "VIEWER" && "Viewer"}
                  {userRole === "EDITOR" && "Editor"}
                  {userRole === "ADMIN" && "Admin"}
                </span>
              )}
            </div>
            <p className="text-sm text-metal flex-grow">
              {chatbot.description ||
                "Pronto podrás saber que es lo que más preguntan tus clientes"}
            </p>
            <div className="flex text-sm gap-4 mt-4 justify-between items-end">
              <p className="text-metal font-normal flex gap-1 items-center">
                <UsersIcon className="w-5 h-5" /> {conversationsCount}{" "}
                {conversationsCount === 1 ? "chat" : "chats"}
              </p>
            </div>
            {!isInvited && (
              <div
                id="actions"
                className=" hidden md:flex w-[126px] bg-cover gap-2 h-[36px] bg-actionsBack absolute z-20 -bottom-10 right-0 group-hover:-bottom-[1px] -right-[1px] transition-all  items-center justify-end px-3"
              >
                <button
                  className="hover:bg-surfaceThree w-7 h-7 rounded-lg grid place-items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete?.();
                  }}
                >
                   <DeleteIcon className="w-5 h-5" />
                </button>
                <hr className="h-6 w-[1px] border-none bg-outlines" />
                <a 
                  href={`/chat/embed?slug=${chatbot.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-surfaceThree w-7 h-7 rounded-lg grid place-items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <OpenTabIcon />
                </a>
                <Link 
                  to={`/dashboard/chat/${chatbot.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:bg-surfaceThree w-7 h-7 rounded-lg grid place-items-center"
                >
                  <EditIcon />
                </Link>
              </div>
            )}
          </div>
        </Link>
      )}
    </motion.div>
  );
};

export const StickyGrid = ({ children }: { children: ReactNode }) => {
  const nodes = Children.toArray(children);
  return (
    <article className="flex gap-2 md:gap-6 w-full pb-8 ">
      <section className="self-start sticky top-4  md:mr-0">
        {nodes[0]}
      </section>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 grow  ">
        <section className={`grow w-full ${nodes[2] ? "max-w-[732px]" : ""}`}>
          {nodes[1]}
        </section>
        {nodes[2] && (
          <section className="self-start sticky top-4 w-full md:w-[280px]">
            {nodes[2]}
          </section>
        )}
      </div>
    </article>
  );
};

export const EditionPair = ({
  currentTab,
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
  currentTab?: string;
}) => {
  // Estado compartido para el tab Preview
  const [selectedModel, setSelectedModel] = useState(
    chatbot.aiModel || getDefaultModelForPlan(user.plan)
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(
    (chatbot.personality as AgentType) || "sales"
  );
  const [temperature, setTemperature] = useState(chatbot.temperature || 1);
  const [instructions, setInstructions] = useState(
    chatbot.instructions ||
      "Eres un asistente virtual útil y amigable. Responde de manera profesional y clara a las preguntas de los usuarios."
  );
  const [name, setName] = useState(chatbot.name || "Geeki");
  const [primaryColor, setPrimaryColor] = useState(
    chatbot.primaryColor || "#63CFDE"
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?"
  );
  const [goodbyeMessage, setGoodbyeMessage] = useState(
    chatbot.goodbyeMessage ||
      "Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte."
  );
  const [avatarUrl, setAvatarUrl] = useState(chatbot.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [customInstructions, setCustomInstructions] = useState(
    chatbot.customInstructions || ""
  );

  // Sincronizar el estado del contexto cuando cambien los datos del loader
  useEffect(() => {
    setSelectedModel(chatbot.aiModel || getDefaultModelForPlan(user.plan));
    setSelectedAgent((chatbot.personality as AgentType) || "sales");
    setTemperature(chatbot.temperature || 1);
    setInstructions(chatbot.instructions || "Eres un asistente virtual útil y amigable. Responde de manera profesional y clara a las preguntas de los usuarios.");
    setName(chatbot.name || "Geeki");
    setPrimaryColor(chatbot.primaryColor || "#63CFDE");
    setWelcomeMessage(chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?");
    setGoodbyeMessage(chatbot.goodbyeMessage || "Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte.");
    setAvatarUrl(chatbot.avatarUrl || "");
    setCustomInstructions(chatbot.customInstructions || "");
  }, [chatbot, user.plan]);

  const contextValue: PreviewContextType = {
    selectedModel,
    setSelectedModel,
    selectedAgent,
    setSelectedAgent,
    temperature,
    setTemperature,
    instructions,
    setInstructions,
    customInstructions,
    setCustomInstructions,
    name,
    setName,
    primaryColor,
    setPrimaryColor,
    welcomeMessage,
    setWelcomeMessage,
    goodbyeMessage,
    setGoodbyeMessage,
    avatarUrl,
    setAvatarUrl,
    avatarFile,
    setAvatarFile,
  };

  let content;
  let preview;

  if (currentTab === "Preview") {
    return (
      <PreviewContext.Provider value={contextValue}>
        <article className="grid grid-cols-12 w-full gap-6 h-full    min-h-[calc(100vh-310px)]">
          <section className="col-span-12 md:col-span-4">
            <PreviewForm chatbot={chatbot} user={user} />
          </section>
          <section className="col-span-12 md:col-span-8">
            <ChatPreview 
              chatbot={{
                ...chatbot,
                name,
                primaryColor,
                welcomeMessage,
                goodbyeMessage,
                avatarUrl,
                aiModel: selectedModel,
                temperature,
                instructions,
                personality: selectedAgent,
              }} 
            />
          </section>
        </article>
      </PreviewContext.Provider>
    );
  }

  switch (currentTab) {
    case "Conversaciones":
      content = <Conversations chatbot={chatbot} user={user} />;
      preview = (
        <ConversationsPreview conversation={undefined} chatbot={chatbot} />
      ); // No preview for conversations tab
      return (
        <article className="grid grid-cols-12 w-full gap-6 h-full    min-h-[calc(100vh-310px)]">
          <section className="col-span-12 md:col-span-4">{content}</section>
          {preview && (
            <section className="col-span-12 md:col-span-8">{preview}</section>
          )}
        </article>
      );
    default:
      content = null;
      preview = null;
  }
};

export const TabSelector = ({
  activeTab,
  onTabChange,
}: {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) => {
  const [selectedTab, setSelectedTab] = useState(activeTab || "Preview");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = [
    "Preview",
    "Conversaciones",
    "Entrenamiento",
    "Tareas",
    "Código",
    "Configuración",
  ];

  const activeIndex = tabs.indexOf(selectedTab);

  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabRefs.current[activeIndex];
      if (activeTab && containerRef.current) {
        const tabRect = activeTab.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: tabRect.width,
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeIndex]);

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
    onTabChange?.(tab);
  };

  return (
    <nav
      className={cn(
        "relative",
        "flex overflow-y-scroll md:overflow-auto items-start md:items-end justify-start md:justify-center",
        "mb-6"
      )}
      style={{
        scrollbarWidth: "none",
      }}
    >
      <div
        ref={containerRef}
        className="relative flex border-b border-outlines/50 "
      >
        {tabs.map((tab, index) => (
          <TabButton
            key={tab}
            ref={(el: HTMLButtonElement | null) =>
              (tabRefs.current[index] = el)
            }
            isActive={selectedTab === tab}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </TabButton>
        ))}

        {/* Barra animada sin bordes laterales */}
        <div
          className="absolute bottom-0 h-0.5 bg-brand-500 rounded-full top-[47px] transition-all duration-300 ease-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>
    </nav>
  );
};

export const TabButton = ({
  children,
  onClick,
  isLoading,
  className,
  to,
  isActive,
  isDisabled,
  ...props
}: {
  isActive?: boolean;
  className?: string;
  isLoading?: boolean;
  onClick?: () => void;
  children: ReactNode;
  isDisabled?: boolean;
  [x: string]: unknown;
}) => {
  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "relative",
        "text-base",
        "text-gray-600",
        "p-3 px-3 md:px-6",
        "hover:text-black transition-all duration-200",
        "focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none",
        "border-none outline-none",
        "select-none",
        {
          "text-black font-medium": isActive,
        },
        className
      )}
      style={{
        WebkitTapHighlightColor: "transparent",
        outline: "none",
        border: "none",
      }}
      {...props}
    >
      <span className="relative z-10">
        {isLoading && <Spinner />}
        {!isLoading && children}
      </span>
    </button>
  );
};
// @todo: añade un tag de próximamente

PageContainer.TabSelector = TabSelector;
PageContainer.StickyGrid = StickyGrid;
PageContainer.Title = Title;
PageContainer.ChatCard = ChatCard;
PageContainer.Header = Header;
PageContainer.Button = Button;
PageContainer.EditionPair = EditionPair;
