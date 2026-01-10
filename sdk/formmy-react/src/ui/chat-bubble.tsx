/**
 * @formmy.app/react - ChatBubble Component
 *
 * Ready-to-use floating chat widget.
 *
 * Usage:
 * ```tsx
 * import { FormmyProvider, ChatBubble } from '@formmy.app/react';
 *
 * function App() {
 *   return (
 *     <FormmyProvider publishableKey="pk_live_xxx">
 *       <YourApp />
 *       <ChatBubble
 *         agentId="agent_123"
 *         position="bottom-right"
 *         theme={{ primaryColor: '#9A99EA' }}
 *       />
 *     </FormmyProvider>
 *   );
 * }
 * ```
 */

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useFormmyChat, getMessageText } from "../hooks/use-formmy-chat";
import type { ChatBubbleProps, ChatTheme } from "../core/types";

// ═══════════════════════════════════════════════════════════════════════════
// Styles (inline to avoid external dependencies)
// ═══════════════════════════════════════════════════════════════════════════

const defaultTheme: Required<ChatTheme> = {
  primaryColor: "#9A99EA",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  borderRadius: "16px",
};

function getPositionStyles(position: ChatBubbleProps["position"] = "bottom-right") {
  const base = { position: "fixed" as const, zIndex: 9999 };

  switch (position) {
    case "bottom-left":
      return { ...base, bottom: "24px", left: "24px" };
    case "top-right":
      return { ...base, top: "24px", right: "24px" };
    case "top-left":
      return { ...base, top: "24px", left: "24px" };
    case "bottom-right":
    default:
      return { ...base, bottom: "24px", right: "24px" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function ChatBubble({
  agentId,
  position = "bottom-right",
  theme = {},
  defaultOpen = false,
  onOpenChange,
}: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useFormmyChat({ agentId });

  const mergedTheme = { ...defaultTheme, ...theme };
  const positionStyles = getPositionStyles(position);
  const isLoading = status === "streaming" || status === "submitted";

  // Handle open/close
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle send
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  // Handle Enter key
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div style={positionStyles}>
      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            right: "0",
            width: "380px",
            maxWidth: "calc(100vw - 48px)",
            height: "500px",
            maxHeight: "calc(100vh - 120px)",
            backgroundColor: mergedTheme.backgroundColor,
            borderRadius: mergedTheme.borderRadius,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              backgroundColor: mergedTheme.primaryColor,
              color: "#fff",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Chat</span>
            <button
              onClick={handleToggle}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "20px",
                lineHeight: 1,
              }}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  marginTop: "40px",
                }}
              >
                Send a message to start the conversation
              </div>
            )}

            {messages.map((msg) => {
              const text = getMessageText(msg);
              if (!text) return null;

              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: isUser
                        ? mergedTheme.primaryColor
                        : "#f0f0f0",
                      color: isUser ? "#fff" : mergedTheme.textColor,
                      fontSize: "14px",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "#f0f0f0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ animation: "pulse 1.5s infinite" }}>●</span>
                  <span
                    style={{ animation: "pulse 1.5s infinite 0.2s" }}
                  >
                    ●
                  </span>
                  <span
                    style={{ animation: "pulse 1.5s infinite 0.4s" }}
                  >
                    ●
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #eee",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: mergedTheme.primaryColor,
                color: "#fff",
                fontSize: "14px",
                fontWeight: 500,
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                opacity: input.trim() && !isLoading ? 1 : 0.6,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: mergedTheme.primaryColor,
          border: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
        }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            // X icon
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            // Chat icon
            <>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </>
          )}
        </svg>
      </button>

      {/* Pulse animation styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
