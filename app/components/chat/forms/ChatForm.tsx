import type { Chatbot } from "@prisma/client";
import { Input } from "../common/Input";

interface ChatFormProps {
  chatbot: Chatbot;
  onNameChange: (name: string) => void;
  onPrimaryColorChange: (color: string) => void;
  onWelcomeMessageChange: (message: string) => void;
  onGoodbyeMessageChange: (message: string) => void;
}

export const ChatForm = ({
  chatbot,
  onNameChange,
  onPrimaryColorChange,
  onWelcomeMessageChange,
  onGoodbyeMessageChange,
}: ChatFormProps) => {
  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-medium">Estilo de tu chat</h2>
      {/* Avatar y Nombre */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <img
          src="/assets/chat/earth.svg"
          alt="Avatar del chatbot"
          style={{
            filter: `hue-rotate(${
              chatbot.primaryColor === "#63CFDE" ? "0" : "180"
            }deg)`,
          }}
          className="object-cover p-4 border rounded-3xl row-span-2 w-full h-full"
        />
        <Input
          label="Nombre"
          name="name"
          value={chatbot.name || "Geeki"}
          onChange={onNameChange}
        />
        <Input
          label="Color"
          name="color"
          type="color"
          value={chatbot.primaryColor || "#63CFDE"}
          onChange={onPrimaryColorChange}
        />
      </div>

      {/* Saludo inicial */}
      <Input
        type="textarea"
        placeholder="¡Hola! ¿Cómo puedo ayudarte hoy?"
        onChange={onWelcomeMessageChange}
        value={chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?"}
        label="Saludo inicial"
      />
      {/* Despedida */}
      <Input
        type="textarea"
        placeholder="Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte."
        onChange={onGoodbyeMessageChange}
        value={
          chatbot.goodbyeMessage ||
          "Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte."
        }
        label="Mensaje de despedida"
      />
    </div>
  );
};
