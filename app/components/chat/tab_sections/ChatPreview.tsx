import { useState } from "react";
import type { Chatbot } from "@prisma/client";

type ChatPreviewProps = {
  chatbot: Chatbot;
};

export const ChatPreview = ({ chatbot }: ChatPreviewProps) => {
  const [message, setMessage] = useState("");
  const botInitial = chatbot.name.charAt(0).toUpperCase();
  const primaryColor = chatbot.primaryColor || "#6366F1";
  const welcomeMessage =
    chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?";

  return (
    <article className="bg-gray-100 rounded-3xl p-6 shadow-sm">
      <section className="bg-white rounded-3xl shadow-md overflow-hidden max-w-md mx-auto">
        {/* Header del chat */}
        <header className="p-4 border-b flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            {botInitial}
          </div>
          <h3 className="font-medium">{chatbot.name}</h3>
        </header>

        {/* Área de mensajes */}
        <main className="p-4 min-h-[300px] bg-gray-50 flex flex-col gap-4">
          {/* Mensaje del chatbot */}
          <div className="flex gap-3 items-start">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mt-1"
              style={{ backgroundColor: primaryColor }}
            >
              {botInitial}
            </div>
            <div
              className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[70%]"
              style={{ borderTopLeftRadius: "0" }}
            >
              <p className="text-sm">{welcomeMessage}</p>
            </div>
          </div>
        </main>

        {/* Footer con input */}
        <footer className="p-4 border-t">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="w-full px-4 py-3 pr-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full"
              style={{ backgroundColor: primaryColor }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Powered by Formmy.app
          </p>
        </footer>
      </section>
    </article>
  );
};
