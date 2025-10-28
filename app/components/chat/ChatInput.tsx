import { useRef, forwardRef, useImperativeHandle } from "react";
import { FiPhone } from "react-icons/fi";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  error?: string | null;
  voiceEnabled?: boolean;
  onVoiceClick?: () => void;
}

export interface ChatInputRef {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  ({ value, onChange, onSend, disabled = false, error, voiceEnabled = false, onVoiceClick }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSend();
        }
      }
    };

    return (
      <div className="self-end w-full px-2 pb-1">
        <p className="text-xs text-gray-400 text-center mb-2">
          Powered by{" "}
          <a
            href="https://www.formmy.app"
            rel="noreferrer"
            target="_blank"
            className="underline"
          >
            Formmy.app
          </a>
        </p>
        <div className="m-2 flex items-center gap-2 border border-outlines focus:border-dark rounded-full">
          <input
            ref={inputRef}
            type="text"
            placeholder="Escribe un mensaje..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-min h-10 bg-transparent border-none grow text-base placeholder-lightgray rounded-full focus:outline-none focus:ring-0 focus:border-none"
          />
          {voiceEnabled && onVoiceClick && (
            <button
              className="w-min flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
              onClick={onVoiceClick}
              disabled={disabled}
              aria-label="Conversación de voz"
              title="Hablar con el asistente"
            >
              <FiPhone className="w-5 h-5 text-green-600" />
            </button>
          )}
          <button
            className="w-min pr-3 flex-2"
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
          >
            <img
              className="min-w-5"
              alt="send icon"
              src="/assets/chat/send.svg"
            />
          </button>
        </div>
        {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";
