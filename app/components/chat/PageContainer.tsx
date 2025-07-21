import type { Chatbot, User } from "@prisma/client";
import { useState, type ReactNode, useEffect } from "react";
import { MAX } from "uuid";
import { cn } from "~/lib/utils";
import Spinner from "../Spinner";
import { Effect, pipe } from "effect";

const MAX_WIDTH = "max-w-7xl";

export const PageContainer = ({
  children,

  ...props
}: {
  children: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <main className="bg-indigo-50/70">
      <article
        className={cn("h-svh pt-20 pb-10 pl-24 pr-6", MAX_WIDTH)}
        {...props}
      >
        <main className="bg-brand-100 h-full rounded-3xl py-6 px-8 shadow">
          {children}
        </main>
      </article>
    </main>
  );
};

export const Title = ({
  children,
  cta,
  ...props
}: {
  cta?: ReactNode;
  children: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <nav className="flex justify-between items-center">
      <h1 className="font-medium text-2xl md:text-3xl">{children}</h1>
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

const Button = ({
  children,
  onClick,
  isLoading,
  ...props
}: {
  isLoading?: boolean;
  onClick?: () => void;
  children: ReactNode;
  [x: string]: unknown;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn("p-2 bg-brand-500 text-white rounded-full px-6")}
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
    <section className="border rounded-3xl border-gray-300 px-5 py-4 max-w-80">
      <h3 className="font-medium text-xl">{chatbot.name}</h3>
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
          <span>
            <img
              className="w-full h-full"
              src="/assets/chat/paintbrush.svg"
              alt="avatares"
            />
          </span>
        </div>
      </nav>
    </section>
  );
};

PageContainer.Title = Title;
PageContainer.ChatCard = ChatCard;
PageContainer.Header = Header;
PageContainer.Button = Button;
