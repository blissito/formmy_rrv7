import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useState, useRef, useEffect } from "react";
import { useFormmyChat, getMessageText } from "../hooks/use-formmy-chat";
// ═══════════════════════════════════════════════════════════════════════════
// Styles (inline to avoid external dependencies)
// ═══════════════════════════════════════════════════════════════════════════
const defaultTheme = {
    primaryColor: "#9A99EA",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    borderRadius: "16px",
};
function getPositionStyles(position = "bottom-right") {
    const base = { position: "fixed", zIndex: 9999 };
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
export function ChatBubble({ agentId, position = "bottom-right", theme = {}, defaultOpen = false, onOpenChange, }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading)
            return;
        const message = input.trim();
        setInput("");
        await sendMessage(message);
    };
    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };
    return (_jsxs("div", { style: positionStyles, children: [isOpen && (_jsxs("div", { style: {
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
                }, children: [_jsxs("div", { style: {
                            padding: "16px",
                            backgroundColor: mergedTheme.primaryColor,
                            color: "#fff",
                            fontWeight: 600,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }, children: [_jsx("span", { children: "Chat" }), _jsx("button", { onClick: handleToggle, style: {
                                    background: "none",
                                    border: "none",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "20px",
                                    lineHeight: 1,
                                }, "aria-label": "Close chat", children: "\u00D7" })] }), _jsxs("div", { style: {
                            flex: 1,
                            overflowY: "auto",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }, children: [messages.length === 0 && (_jsx("div", { style: {
                                    textAlign: "center",
                                    color: "#666",
                                    marginTop: "40px",
                                }, children: "Send a message to start the conversation" })), messages.map((msg) => {
                                const text = getMessageText(msg);
                                if (!text)
                                    return null;
                                const isUser = msg.role === "user";
                                return (_jsx("div", { style: {
                                        display: "flex",
                                        justifyContent: isUser ? "flex-end" : "flex-start",
                                    }, children: _jsx("div", { style: {
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
                                        }, children: text }) }, msg.id));
                            }), isLoading && (_jsx("div", { style: { display: "flex", justifyContent: "flex-start" }, children: _jsxs("div", { style: {
                                        padding: "10px 14px",
                                        borderRadius: "12px",
                                        backgroundColor: "#f0f0f0",
                                        color: "#666",
                                        fontSize: "14px",
                                    }, children: [_jsx("span", { style: { animation: "pulse 1.5s infinite" }, children: "\u25CF" }), _jsx("span", { style: { animation: "pulse 1.5s infinite 0.2s" }, children: "\u25CF" }), _jsx("span", { style: { animation: "pulse 1.5s infinite 0.4s" }, children: "\u25CF" })] }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { onSubmit: handleSubmit, style: {
                            padding: "12px 16px",
                            borderTop: "1px solid #eee",
                            display: "flex",
                            gap: "8px",
                        }, children: [_jsx("input", { ref: inputRef, type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: "Type a message...", disabled: isLoading, style: {
                                    flex: 1,
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #ddd",
                                    fontSize: "14px",
                                    outline: "none",
                                } }), _jsx("button", { type: "submit", disabled: !input.trim() || isLoading, style: {
                                    padding: "10px 16px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: mergedTheme.primaryColor,
                                    color: "#fff",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                                    opacity: input.trim() && !isLoading ? 1 : 0.6,
                                }, children: "Send" })] })] })), _jsx("button", { onClick: handleToggle, style: {
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
                }, "aria-label": isOpen ? "Close chat" : "Open chat", children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: isOpen ? (
                    // X icon
                    _jsxs(_Fragment, { children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] })) : (
                    // Chat icon
                    _jsx(_Fragment, { children: _jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) })) }) }), _jsx("style", { children: `
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      ` })] }));
}
//# sourceMappingURL=chat-bubble.js.map