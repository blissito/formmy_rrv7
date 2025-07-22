import type { Chatbot, User } from "@prisma/client";
import { useState, type ReactNode, useEffect, Children } from "react";
import { cn } from "~/lib/utils";
import Spinner from "../Spinner";
import { Effect, pipe } from "effect";
import { Link, Links } from "react-router";
import { IoIosArrowRoundBack } from "react-icons/io";
import { PreviewForm } from "./tab_sections/Preview";
import ChatPreview from "../ChatPreview";

const MAX_WIDTH = "max-w-7xl";

export const PageContainer = ({
  children,

  ...props
}: {
  children: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <main className="bg-indigo-50/70 ">
      <article
        className={cn("min-h-screen pt-20 pb-10 pl-24 pr-6 ")}
        {...props}
      >
        {/* Revisit: alto de la tarjeta */}
        <main className="bg-[#fff] min-h-[80vh] rounded-3xl py-6 px-8 shadow min-w-5xl">
          <section className="max-w-7xl mx-auto">{children}</section>
        </main>
      </article>
    </main>
  );
};

export const Title = ({
  children,
  back,
  cta,
  ...props
}: {
  back?: string;
  cta?: ReactNode;
  children: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <nav className="flex justify-between items-center mb-10">
      <div className="flex items-end gap-4">
        {back && (
          <Link to={back} className="text-4xl">
            <IoIosArrowRoundBack />
          </Link>
        )}
        <h1 className="font-medium text-2xl md:text-3xl">{children}</h1>
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
    <section className="fixed top-0 left-0 right-0">
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
}) => {
  const modes = {
    "bg-[#fff] border border-gray-300 rounded-lg text-gray-600 px-2":
      mode === "ghost",
  };
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          "p-2 bg-brand-500 text-white rounded-full px-6",
          modes,
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
        "p-2 bg-brand-500 text-white rounded-full px-6",
        modes,
        className
      )}
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
}: {
  onDelete?: () => void;
  chatbot: Chatbot;
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
      Effect.flatMap((response) =>
        Effect.tryPromise({
          try: () => response.json(),
          catch: (error) =>
            new Error(`Error al procesar la respuesta: ${error}`),
        })
      ),
      Effect.map((data) => {
        if (data.success && data.count !== undefined) {
          setConversationsCount(data.count);
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
    <section className="border rounded-3xl border-gray-300 px-5 py-4 max-w-80 hover:shadow-lg transition-all">
      <Link
        to={`/chat/${chatbot.slug}`}
        className="font-medium text-xl hover:underline"
      >
        {chatbot.name}
      </Link>
      <p className="text-gray-600 py-4">
        Tus clientes suelen preguntar por tu servicio de consultoría
      </p>
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="w-5">
            <img
              className="w-full h-full"
              src="/assets/chat/user.svg"
              alt="avatares"
            />
          </span>
          <span>{conversationsCount} chats</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="hover:bg-gray-300 w-6 rounded-full"
            onClick={onDelete}
          >
            <img
              className="w-full h-full"
              src="/assets/chat/recyclebin.svg"
              alt="avatares"
            />
          </button>
          <hr className="h-[18px] border-l-2 border-l-gray-300" />
          <span>
            <img
              className="w-full h-full"
              src="/assets/chat/code.svg"
              alt="avatares"
            />
          </span>
          <Link to={`/chat/${chatbot.slug}`}>
            <img
              className="w-full h-full"
              src="/assets/chat/paintbrush.svg"
              alt="avatares"
            />
          </Link>
        </div>
      </nav>
    </section>
  );
};

export const StickyGrid = ({ children }: { children: ReactNode }) => {
  const nodes = Children.toArray(children);
  return (
    <article className="flex gap-6">
      <section className="self-start sticky top-4">{nodes[0]}</section>
      <section className="grow">{nodes[1]}</section>
      <section className="self-start sticky top-4">{nodes[2]}</section>
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
  let c;
  let p;
  if (currentTab === "Preview") {
    c =
      currentTab === "Preview" ? (
        <PreviewForm chatbot={chatbot} user={user} />
      ) : null;
    p = currentTab === "Preview" ? <ChatPreview chatbot={chatbot} /> : null;
  }
  //

  return (
    <article className="flex gap-6">
      <section className="grow flex-1">{c}</section>
      <section className="grow flex-2">{p}</section>
    </article>
  );
};

export const TabSelector = ({
  activeTab,
  onTabChange,
}: {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) => {
  const [selectedTab, setSelectedTab] = useState(activeTab || "Preview");

  const handleTabClick = (tab: string) => {
    setSelectedTab(tab);
    onTabChange?.(tab);
  };

  const tabs = [
    "Preview",
    "Conversaciones",
    "Entrenamiento",
    "Tareas",
    "Código",
    "Configuración",
  ];

  return (
    <nav
      className={cn(
        "border-b",
        "flex overflow-auto items-end justify-center",
        "mb-6"
      )}
      style={{
        scrollbarWidth: "none",
      }}
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab}
          isActive={selectedTab === tab}
          onClick={() => handleTabClick(tab)}
        >
          {tab}
        </TabButton>
      ))}
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
  ...props
}: {
  isActive?: boolean;
  className?: string;
  isLoading?: boolean;
  onClick?: () => void;
  children: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-sm",
        "text-gray-600",
        // @TODO: Revisit rpundeness, podría ser un elemento aparte con Motion
        "border-b-4 border-transparent",
        "p-2 px-6",
        "hover:text-black transition-colors",
        {
          "border-b-brand-500 text-black": isActive,
        },
        className
      )}
      {...props}
    >
      {isLoading && <Spinner />}
      {!isLoading && children}
    </button>
  );
};

PageContainer.TabSelector = TabSelector;
PageContainer.StickyGrid = StickyGrid;
PageContainer.Title = Title;
PageContainer.ChatCard = ChatCard;
PageContainer.Header = Header;
PageContainer.Button = Button;
PageContainer.EditionPair = EditionPair;
