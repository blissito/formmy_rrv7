import { useState } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";
import { ProTagChatbot } from "../ProTagChatbot";

interface ChatbotCreateButtonProps {
  canCreate: boolean;
  showProTag: boolean;
  currentCount?: number;
  maxAllowed?: number;
  proTagMessage?: string;
  className?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const ChatbotCreateButton = ({
  canCreate,
  showProTag,
  currentCount,
  maxAllowed,
  proTagMessage,
  className,
  isLoading,
  children,
}: ChatbotCreateButtonProps) => {
  const [showModal, setShowModal] = useState(false);

  if (canCreate) {
    // User can create chatbots, show normal button
    return (
      <Link
        to="/dashboard/chat/nuevo"
        className={cn(
          "h-10 w-[auto] flex gap-1 items-center px-6 rounded-full transition-all",
          "bg-brand-500 text-clear hover:ring hover:ring-brand-500",
          className
        )}
      >
        {children}
      </Link>
    );
  }

  if (showProTag) {
    // User can't create chatbots and should see ProTag
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(true)}
          disabled={isLoading}
          className={cn(
            "h-10 w-[auto] flex gap-1 items-center px-6 rounded-full transition-all",
            "bg-gray-300 text-gray-500 cursor-not-allowed",
            className
          )}
        >
          {children}
        </button>
        <ProTagChatbot
          isOpen={showModal}
          onChange={setShowModal}
          onClose={() => setShowModal(false)}
          message={proTagMessage}
          currentCount={currentCount}
          maxAllowed={maxAllowed}
        />
      </div>
    );
  }

  // Fallback - disabled button without ProTag
  return (
    <button
      disabled={true}
      className={cn(
        "h-10 w-[auto] flex gap-1 items-center px-6 rounded-full transition-all",
        "bg-gray-300 text-gray-500 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
};