import type { Chatbot, Message, User } from "@prisma/client";
import { ChipTabs, useChipTabs } from "../common/ChipTabs";
import { Avatar } from "../Avatar";
import { useState, type ReactNode } from "react";
import { cn } from "~/lib/utils";

const dev_conversations = [
  {
    messages: [
      {
        picture:
          "https://images.pexels.com/photos/16854007/pexels-photo-16854007.jpeg",
        role: "USER",
        content: "Paso por ella mañana, ahorita no importa mucho realmente",
      },
      {
        picture:
          "https://images.pexels.com/photos/16854007/pexels-photo-16854007.jpeg",
        role: "ASSISTANT",
        content: "Hola, ¿en qué puedo ayudarte?",
      },
      {
        picture:
          "https://images.pexels.com/photos/16854007/pexels-photo-16854007.jpeg",
        role: "USER",
        content: "Hola",
      },
      {
        picture:
          "https://images.pexels.com/photos/16854007/pexels-photo-16854007.jpeg",
        role: "ASSISTANT",
        content: "PErro! cómo andas?",
      },
      {
        picture:
          "https://images.pexels.com/photos/16854007/pexels-photo-16854007.jpeg",
        role: "USER",
        content: "Hola",
      },
      {
        picture:
          "https://images.pexels.com/photos/16854007/pexels-photo-16854007.jpeg",
        role: "USER",
        content: "ps ahí dos ods",
      },
    ],
    isFavorite: true,
    id: 1,
    userName: "Nombre",
    userEmail: "email@example.com",
    lastMessage: "Con gusto. Actualmente tenemos 5 mensajes",
    time: "Ayer",
    date: "21 de mayo de 2025",
    unread: 0,
    avatar: "/assets/chat/ghosty.svg",
    tel: "+52 776 762 78 90",
  },
  {
    messages: [
      {
        picture:
          "https://images.pexels.com/photos/5958344/pexels-photo-5958344.jpeg",
        role: "USER",
        content: "Hemos confiscado tu bodega por falta de pago",
      },
      {
        picture:
          "https://images.pexels.com/photos/5958344/pexels-photo-5958344.jpeg",
        role: "ASSISTANT",
        content: "Ayudame con esto que necesito hacer",
      },
      {
        picture:
          "https://images.pexels.com/photos/5958344/pexels-photo-5958344.jpeg",
        role: "USER",
        content: "Me cuesta 100 dolares",
      },
      {
        picture:
          "https://images.pexels.com/photos/5958344/pexels-photo-5958344.jpeg",
        role: "ASSISTANT",
        content: "ta re caro mano",
      },
      {
        picture:
          "https://images.pexels.com/photos/5958344/pexels-photo-5958344.jpeg",
        role: "USER",
        content: "si vdd! chale",
      },
    ],
    isFavorite: false,
    id: 2,
    userName: "Nombre",
    userEmail: "email@example.com",
    lastMessage: "Ultimo mensaje",
    time: "Ayer",
    date: "21 de mayo de 2025",
    unread: 0,
    avatar: "/assets/chat/ghosty.svg",
    tel: "+52 776 762 78 90",
  },
];

type ConversationsProps = {
  chatbot: Chatbot;
  user: User;
};

interface Conversation {
  id: number;
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
}

export const Conversations = ({
  conversations = dev_conversations,
  chatbot,
  user,
}: ConversationsProps) => {
  const { currentTab, setCurrentTab } = useChipTabs("Todos");
  const favoriteConversations = conversations.filter(
    (conversation) => conversation.isFavorite
  );
  const allConversations = conversations;
  const [conversation, setConversation] = useState<Conversation>(
    dev_conversations[0]
  );

  return (
    <main className="flex flex-wrap gap-6">
      <article className={cn("grow flex-1", "flex flex-col gap-6")}>
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
      <section className="grow max-w-">
        <ConversationsPreview conversation={conversation} />
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
    <section className="flex flex-col gap-1">
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
        "overflow-hidden",
        "px-2 py-3 rounded-2xl transition-colors",
        "hover:bg-brand-500/10",
        "cursor-pointer",
        "flex gap-3",
        "items-center",
        "w-[320px] min-w-full",
        {
          "bg-brand-500/10": isActive,
        }
      )}
    >
      <Avatar className="w-10" src={pic || "/assets/chat/ghosty.svg"} />
      <div className="flex-1 truncate">
        <p className="font-medium text-sm">{conversation.userName}</p>
        <p className="text-xs text-gray-600 truncate">
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
}: {
  conversation: Conversation;
  primaryColor?: string;
}) => {
  const { date, tel } = conversation;
  return (
    <header
      style={{ borderColor: primaryColor || "brand-500" }}
      className={cn(
        "border",
        "flex",
        "items-center",
        "gap-2",
        "rounded-t-3xl",
        "bg-gray-100/30 w-full p-3"
      )}
    >
      <Avatar src={conversation.messages[0].picture} />
      <div>
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-medium">{tel}</h3>
          {/* @TODO: This should match chat icons */}
          <img src="/assets/chat/whatsapp.svg" alt="whatsapp icon" />
        </div>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <button className="ml-auto mr-3">
        <img src="/assets/chat/recyclebin.svg" alt="trash icon" />
      </button>
    </header>
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
}: {
  conversation: Conversation;
  primaryColor?: string;
}) => {
  return (
    <article className="flex items-end flex-col">
      <ActionButtons />
      <hr className="my-3" />
      <ChatHeader conversation={conversation} />
      <section
        style={{ borderColor: primaryColor || "brand-500" }}
        className={cn(
          "flex",
          "flex-col",
          "border",
          "rounded-b-3xl",
          "w-full p-3"
        )}
      >
        {conversation.messages.map((message) => (
          <SingleMessage message={message} />
        ))}
      </section>
    </article>
  );
};

export const SingleMessage = ({ message }: { message: Message }) => {
  return message.role === "USER" ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage message={message} />
  );
};

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <main className="justify-end p-2 rounded-xl flex items-start gap-2">
      <div className="text-xs p-2 bg-brand-500/10 text-brand-500 rounded-lg">
        {message.content}
      </div>
      <Avatar src={message.picture} />
    </main>
  );
};
/**
 * @TODO: Añadir la acción para el microlike
 * Posible feature:
 * Cuando se le da like al microlike la respuesta
 * puede guardarse como "SHOT" (Ejemplo) para este agente.
 * Pueden existir ejemplos positivos y negativos 👎🏼
 */
const AssistantMessage = ({ message }: { message: Message }) => {
  return (
    <main className="justify-start p-2 rounded-xl flex items-start gap-2">
      <Avatar className="w-6" />
      <div className="text-xs p-2 bg-black text-gray-300 rounded-lg relative">
        {message.content}
        <MicroLikeButton />
      </div>
    </main>
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
