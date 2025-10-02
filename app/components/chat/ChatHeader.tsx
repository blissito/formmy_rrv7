import { Avatar } from "./Avatar";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface ChatHeaderProps {
  primaryColor?: string;
  name?: string;
  avatarUrl?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
  onClear?: () => void;
}

export const ChatHeader = ({
  primaryColor,
  name = "Geeki",
  avatarUrl,
  showCloseButton = false,
  onClose,
  onClear,
}: ChatHeaderProps) => {
  const handleClose = () => {
    // Si está en iframe, enviar mensaje al padre
    if (window.parent !== window) {
      window.parent.postMessage({ type: "formmy-close-chat" }, "*");
    }
    // Si hay callback onClose, llamarlo también
    onClose?.();
  };

  return (
    <section className="bg-brand-300/10 flex items-center justify-between py-3 px-3 h-min gap-3">
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl} primaryColor={primaryColor} />
        <p className="heading text-lg ">{name}</p>
      </div>

      <div className="flex items-center gap-2">
        {onClear && (
          <button
            onClick={onClear}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
            aria-label="Nueva conversación"
            title="Nueva conversación"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        )}

        {showCloseButton && (
          <button
            onClick={handleClose}
            className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
            aria-label="Cerrar chat"
            title="Cerrar chat"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
};
