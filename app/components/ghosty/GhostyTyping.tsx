import { motion } from "motion/react";
import { cn } from "~/lib/utils";
import type { GhostyState } from './hooks/useGhostyChat';

interface GhostyTypingProps {
  state: GhostyState;
  className?: string;
}

export const GhostyTyping = ({ state, className }: GhostyTypingProps) => {
  if (state === 'idle') return null;

  const getStateConfig = () => {
    switch (state) {
      case 'thinking':
        return {
          text: "Ghosty está pensando...",
          icon: "🤔",
          color: "text-brand-500"
        };
      case 'searching':
        return {
          text: "Buscando en línea...",
          icon: "🔍",
          color: "text-brand-500"
        };
      case 'streaming':
        return {
          text: "Ghosty está escribiendo...",
          icon: "✍️",
          color: "text-brand-500"
        };
      case 'error':
        return {
          text: "Algo salió mal...",
          icon: "❌",
          color: "text-red-500"
        };
      default:
        return {
          text: "Ghosty está trabajando...",
          icon: "👻",
          color: "text-brand-500"
        };
    }
  };

  const config = getStateConfig();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        "bg-[#FCFDFE] border border-outlines rounded-2xl",
        "max-w-fit",
        className
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        "bg-brand-500 text-clear text-sm font-medium"
      )}>
        👻
      </div>

      {/* Status content */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <span className={cn("text-sm font-medium", config.color)}>
          {config.text}
        </span>
        
        {/* Animated dots */}
        {(state === 'thinking' || state === 'searching' || state === 'streaming') && (
          <div className="flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn("w-1 h-1 rounded-full", config.color.replace('text-', 'bg-'))}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Typing indicator for when assistant is composing
export const GhostyThinkingBubble = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-3 mb-4",
        className
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        "bg-brand-500 text-clear text-sm font-medium"
      )}>
        👻
      </div>

      {/* Thinking bubble */}
      <div className={cn(
        "bg-[#FCFDFE] border border-outlines rounded-2xl px-4 py-3",
        "flex items-center gap-2"
      )}>
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-500"
              animate={{
                y: [-2, -6, -2],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};