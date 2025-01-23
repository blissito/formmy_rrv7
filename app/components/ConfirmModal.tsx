import { Button } from "./Button";
import Modal from "./Modal";
import { type ReactNode } from "react";

export default function ConfirmModal({
  message,
  isOpen,
  title,
  onClose,
  children,
  onClick,
  footer,
  emojis = "✋🏼🤓💡",
}: {
  emojis?: string;
  isOpen: boolean;
  message: ReactNode;
  title: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  onClick?: () => void;
  footer?: ReactNode;
}) {
  return (
    <>
      {isOpen ? (
        <Modal onClose={onClose} size="md">
          <p className="text-4xl text-center mb-6">{emojis}</p>
          {typeof title === "string" ? (
            <h2 className="dark:text-white text-space-800 font-semibold text-2xl text-center mb-4">
              {title}
            </h2>
          ) : (
            title
          )}
          {typeof message === "string" ? (
            <p className="dark:text-gray-400 mb-8 text-gray-600 text-center ">
              {message}
            </p>
          ) : (
            message
          )}
          {children}
          {footer ? (
            footer
          ) : (
            <div className="flex gap-6 mb-6">
              <Button onClick={onClose} className="bg-gray-100 text-gray-600">
                Cancelar
              </Button>
              <Button onClick={onClick} className="bg-red-500 text-white">
                Eliminar
              </Button>
            </div>
          )}
        </Modal>
      ) : null}
    </>
  );
}
