import { useState } from "react";
import { XMarkIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import ChatPreview from "./ChatPreview";
import type { Chatbot } from "@prisma/client";
import { cn } from "~/lib/utils";

interface FloatingChatWidgetProps {
  chatbot: Chatbot;
}

export default function FloatingChatWidget({ chatbot }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px]">
          <button
            onClick={toggleChat}
            className="absolute -top-2 -right-2 z-10 bg-gray-800 hover:bg-gray-900 text-white rounded-full p-1.5 shadow-lg transition-colors"
            aria-label="Cerrar chat"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <ChatPreview production chatbot={chatbot} onClose={toggleChat} />
        </div>
      ) : (
        <button
          onClick={toggleChat}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
            "flex items-center justify-center text-white hover:scale-105"
          )}
          style={{
            backgroundColor: chatbot.primaryColor || "#63CFDE"
          }}
          aria-label="Abrir chat"
        >
          <ChatBubbleLeftRightIcon className="w-8 h-8" />
        </button>
      )}
    </>
  );
}