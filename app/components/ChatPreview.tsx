import { useState, useRef } from "react";
import { sendOpenRouterMessageEffect } from "../lib/openrouter.client";
import { Effect } from "effect";
import { DEFAULT_AI_MODEL } from "../utils/constants";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type ChatPreviewProps = {
  model?: string;
  instructions: string;
  temperature: number;
  primaryColor?: string;
  name?: string;
  avatarComponent?: React.ReactNode;
  welcomeMessage?: string;
};

export default function ChatPreview({
  model,
  instructions,
  temperature,
  primaryColor = "#63CFDE",
  name = "Mi Chatbot",
  avatarComponent,
  welcomeMessage = "¡Hola! ¿Cómo puedo ayudarte hoy?",
}: ChatPreviewProps) {
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [stream, setStream] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    setChatError(null);
    const userMessage = { role: "user", content: chatInput };
    setChatMessages((msgs) => [...msgs, userMessage]);
    setChatInput("");
    if (stream) {
      let lastBotMsg = "";
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
            lastBotMsg = partial;
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

  const handleChatInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (!chatLoading && chatInput.trim()) {
        handleChatSend();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-space-800 rounded-lg shadow overflow-hidden">
      {/* Toggle stream */}
      <div className="flex items-center justify-end px-4 pt-4 pb-2">
        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={stream}
            onChange={() => setStream((s) => !s)}
            className="accent-brand-500"
          />
          Modo stream (typing effect)
        </label>
      </div>
      {/* Chat Header */}
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8">{avatarComponent}</div>
          <span className="font-medium text-gray-900 dark:text-white">
            {name}
          </span>
        </div>
      </div>
      {/* Chat Messages */}
      <div className="h-96 p-4 space-y-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 min-w-0">
        {chatMessages.map((msg, idx) =>
          msg.role === "assistant" ? (
            <div className="flex items-start gap-3" key={idx}>
              <div className="w-8 h-8 flex-shrink-0">{avatarComponent}</div>
              <div className="bg-white dark:bg-space-700 rounded-lg p-3 max-w-md shadow-sm">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:mb-2 prose-p:last:mb-0 prose-headings:mb-2 prose-headings:font-bold prose-ul:mb-2 prose-ol:mb-2 prose-li:text-sm prose-code:bg-gray-100 prose-code:dark:bg-gray-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-pre:bg-gray-100 prose-pre:dark:bg-gray-600 prose-pre:p-2 prose-pre:rounded prose-pre:text-xs prose-code:font-mono prose-pre:overflow-x-auto prose-pre:mb-2 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:dark:border-gray-500 prose-blockquote:pl-2 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:dark:text-gray-400 prose-blockquote:mb-2 prose-strong:font-semibold prose-em:italic prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:hover:underline prose-table:overflow-x-auto prose-table:w-full prose-th:px-2 prose-th:py-1 prose-th:text-xs prose-th:font-semibold prose-td:px-2 prose-td:py-1 prose-td:text-xs">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-left">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 justify-end" key={idx}>
              <div className="bg-brand-500 rounded-lg p-3 max-w-xs">
                <p className="text-sm text-white">{msg.content}</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
            </div>
          )
        )}
        {chatLoading && stream && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex-shrink-0">{avatarComponent}</div>
            <div className="bg-white dark:bg-space-700 rounded-lg p-3 max-w-xs shadow-sm opacity-60">
              <div className="text-sm text-gray-900 dark:text-white animate-pulse">
                ...
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-space-700 dark:text-white text-sm"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatInputKeyDown}
            disabled={chatLoading}
          />
          <button
            type="button"
            className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors"
            onClick={handleChatSend}
            disabled={chatLoading || !chatInput.trim()}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 2L11 13"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 2L15 22L11 13L2 9L22 2Z"
              ></path>
            </svg>
          </button>
        </div>
        {chatError && (
          <div className="text-red-500 mt-2 text-sm">{chatError}</div>
        )}
      </div>
    </div>
  );
}
