import { Input } from "../common/Input";

interface ChatFormProps {
  name: string;
  primaryColor: string;
  welcomeMessage: string;
  goodbyeMessage: string;
  onNameChange: (name: string) => void;
  onPrimaryColorChange: (color: string) => void;
  onWelcomeMessageChange: (message: string) => void;
  onGoodbyeMessageChange: (message: string) => void;
}

export const ChatForm = ({
  name,
  primaryColor,
  welcomeMessage,
  goodbyeMessage,
  onNameChange,
  onPrimaryColorChange,
  onWelcomeMessageChange,
  onGoodbyeMessageChange,
}: ChatFormProps) => {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-medium">Estilo de tu chat</h2>
      {/* Avatar y Nombre */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <img
          src="/assets/chat/earth.svg"
          alt="Avatar del chatbot"
          style={{
            filter: `hue-rotate(${
              primaryColor === "#63CFDE" ? "0" : "180"
            }deg)`,
          }}
          className="object-cover p-4 border rounded-3xl border border-outlines row-span-2 w-full h-[164px]"
        />
        <Input
          label="Nombre"
          name="name"
          value={name}
          onChange={onNameChange}
        />
        <Input
          left={
            <div
              style={{
                background: primaryColor,
              }}
              className="w-10 h-6 bg-red-500 mt-3 rounded"
            />
          }
          label="Color"
          name="color"
          type="text"
          value={primaryColor}
          onChange={onPrimaryColorChange}
        />
      </div>

      {/* Saludo inicial */}
      <Input
        type="textarea"
        inputClassName="h-32 "
        placeholder="¡Hola! ¿Cómo puedo ayudarte hoy? (Puedes usar markdown para formatear el texto)."
        onChange={onWelcomeMessageChange}
        value={welcomeMessage}
        label={<div className="flex flex-col gap-1"><span>Saludo inicial</span>
        </div>}
      />
      {/* Despedida */}
      <Input
        type="textarea"
        inputClassName="h-32 "
        placeholder="Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte. (Puedes usar markdown para formatear el texto)."
        onChange={onGoodbyeMessageChange}
        value={goodbyeMessage}
        label={<div className="flex flex-col gap-1"><span>Mensaje de despedida</span>
        
          </div>}
      />
    </div>
  );
};
