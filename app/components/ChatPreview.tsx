import { useState, useRef } from "react";
import { sendOpenRouterMessageEffect } from "../lib/openrouter.client";
import { Effect } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";
import { cn } from "~/lib/utils";
import { ChatInput, type ChatInputRef } from "./chat/ChatInput";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatHeader } from "./chat/ChatHeader";
import { StreamToggle } from "./chat/StreamToggle";
import { LoadingIndicator } from "./chat/LoadingIndicator";

export type ChatPreviewProps = {
  model?: string;
  instructions: string;
  temperature: number;
  primaryColor?: string;
  name?: string;

  welcomeMessage?: string;
};

export default function ChatPreview({
  model,
  instructions,
  temperature,
  primaryColor = "#63CFDE",
  name = "Mi Chatbot",

  welcomeMessage = "¡Hola! ¿Cómo puedo ayudarte hoy?",
}: ChatPreviewProps) {
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([{ role: "assistant", content: welcomeMessage }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [stream, setStream] = useState(true);
  const inputRef = useRef<ChatInputRef>(null);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    setChatError(null);
    const userMessage = { role: "user" as const, content: chatInput };
    setChatMessages((msgs) => [...msgs, userMessage]);
    setChatInput("");
    if (stream) {
      setChatMessages((msgs) => [...msgs, { role: "assistant", content: "" }]);
      Effect.runPromise(
        sendOpenRouterMessageEffect({
          model: model || DEFAULT_AI_MODEL,
          instructions,
          temperature,
          messages: [
            { role: "system", content: instructions },
            ...chatMessages,
            { role: "user", content: chatInput },
          ],
          stream: true,
          onStreamChunk: (partial) => {
            setChatMessages((msgs) => {
              // Actualiza solo el último mensaje assistant
              const updated = [...msgs];
              let lastIdx = updated.length - 1;
              while (lastIdx >= 0 && updated[lastIdx].role !== "assistant")
                lastIdx--;
              if (lastIdx >= 0)
                updated[lastIdx] = { ...updated[lastIdx], content: partial };
              return updated;
            });
          },
        })
      )
        .then(() => {
          setChatLoading(false);
          inputRef.current?.focus();
        })
        .catch((err: unknown) => {
          setChatError(err instanceof Error ? err.message : String(err));
          setChatLoading(false);
          inputRef.current?.focus();
        });
    } else {
      Effect.runPromise(
        sendOpenRouterMessageEffect({
          model: model || DEFAULT_AI_MODEL,
          instructions,
          temperature,
          messages: [
            { role: "system", content: instructions },
            ...chatMessages,
            { role: "user", content: chatInput },
          ],
        })
      )
        .then((result: any) => {
          const botContent =
            result.choices?.[0]?.message?.content || "Respuesta vacía";
          setChatMessages((msgs) => [
            ...msgs,
            { role: "assistant", content: botContent },
          ]);
          setChatLoading(false);
          inputRef.current?.focus();
        })
        .catch((err: unknown) => {
          setChatError(err instanceof Error ? err.message : String(err));
          setChatLoading(false);
          inputRef.current?.focus();
        });
    }
  };

  return (
    <main className="bg-brand-500/20 h-full dark:bg-space-800 rounded-lg shadow overflow-hidden">
      <StreamToggle stream={stream} onToggle={setStream} />

      <article
        className={cn(
          "h-[90%]",
          "bg-[#fff]",
          "rounded-3xl",
          "flex flex-col",
          "overflow-y-auto dark:bg-gray-800 max-w-xs mx-auto"
        )}
      >
        <ChatHeader primaryColor={primaryColor} name={name} />

        <section className="grow pt-4 overflow-y-auto">
          {chatMessages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              primaryColor={primaryColor}
            />
          ))}
        </section>

        <section>
          {chatLoading && stream && (
            <LoadingIndicator primaryColor={primaryColor} />
          )}
        </section>

        <ChatInput
          ref={inputRef}
          value={chatInput}
          onChange={setChatInput}
          onSend={handleChatSend}
          disabled={chatLoading}
          error={chatError}
        />
      </article>
    </main>
  );
}
