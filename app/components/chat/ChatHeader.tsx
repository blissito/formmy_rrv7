import { Avatar } from "./Avatar";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ChatHeaderProps {
  primaryColor?: string;
  name?: string;
  avatarUrl?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const ChatHeader = ({
  primaryColor,
  name = "Geeki",
  avatarUrl,
  showCloseButton = false,
  onClose,
}: ChatHeaderProps) => {
  return (
    <section className="bg-brand-300/10 flex items-center justify-between py-3 px-3 h-min gap-3">
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl} primaryColor={primaryColor} />
        <p className="heading text-lg ">{name}</p>
      </div>

      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
          aria-label="Minimizar chat"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </section>
  );
};
