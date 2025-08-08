import { Input } from "../common/Input";
import { useS3Upload } from "~/hooks/useS3Upload";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { ColorPicker } from "../common/ColorPicker";

interface ChatFormProps {
  name: string;
  primaryColor: string;
  welcomeMessage: string;
  goodbyeMessage: string;
  avatarUrl?: string;
  chatbotSlug?: string;
  isSaving?: boolean;
  onNameChange: (name: string) => void;
  onPrimaryColorChange: (color: string) => void;
  onWelcomeMessageChange: (message: string) => void;
  onGoodbyeMessageChange: (message: string) => void;
  onAvatarChange: (url: string) => void;
  onAvatarFileChange?: (file: File | null) => void;
}

export const ChatForm = ({
  name,
  primaryColor,
  welcomeMessage,
  goodbyeMessage,
  avatarUrl,
  onNameChange,
  onPrimaryColorChange,
  onWelcomeMessageChange,
  onGoodbyeMessageChange,
  onAvatarFileChange,
}: ChatFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToShow, setImageToShow] = useState<string>(avatarUrl);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen");
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }

    // Crear preview y mostrarlo inmediatamente
    const preview = URL.createObjectURL(file);
    setImageToShow(preview);

    onAvatarFileChange?.(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showColorPicker) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showColorPicker]);

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-medium">Estilo de tu chat</h2>
      {/* Avatar y Nombre */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="relative row-span-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={false}
            className="relative w-full h-[164px] border rounded-3xl border-outlines overflow-hidden group hover:border-primary transition-colors"
          >
            {imageToShow ? (
              <img
                src={imageToShow}
                alt="Avatar del chatbot"
                className="object-cover w-full h-full"
              />
            ) : (
              <img
                src="/assets/chat/earth.svg"
                alt="Avatar del chatbot"
                style={{
                  filter: `hue-rotate(${
                    primaryColor === "#63CFDE" ? "0" : "180"
                  }deg)`,
                }}
                className="object-cover p-4 w-full h-full"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Cambiar imagen
              </span>
            </div>
          </button>
        </div>
        <Input
          label="Nombre"
          name="name"
          value={name}
          onChange={onNameChange}
        />
        <div className="relative" style={{ zIndex: 1000 }}>
          <Input
            left={
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{
                  background: primaryColor,
                }}
                className="w-10 h-6 bg-red-500 mt-3 rounded cursor-pointer hover:scale-105 transition-transform"
              />
            }
            label="Color"
            name="color"
            type="text"
            value={primaryColor}
            onChange={onPrimaryColorChange}
          />
          {showColorPicker && (
            <div
              className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center"
              style={{ zIndex: 999999 }}
              onClick={() => setShowColorPicker(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <ColorPicker
                  color={primaryColor}
                  onChange={onPrimaryColorChange}
                  onClose={() => setShowColorPicker(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saludo inicial */}
      <Input
        type="textarea"
        inputClassName="h-32 "
        placeholder="¡Hola! ¿Cómo puedo ayudarte hoy? (Puedes usar markdown para formatear el texto)."
        onChange={onWelcomeMessageChange}
        value={welcomeMessage}
        label={
          <div className="flex flex-col gap-1">
            <span>Saludo inicial</span>
          </div>
        }
      />
      {/* Despedida */}
      <Input
        type="textarea"
        inputClassName="h-32 "
        placeholder="Si necesitas ayuda con algo más, escríbeme, estoy aquí para ayudarte. (Puedes usar markdown para formatear el texto)."
        onChange={onGoodbyeMessageChange}
        value={goodbyeMessage}
        label={
          <div className="flex flex-col gap-1">
            <span>Mensaje de despedida</span>
          </div>
        }
      />
    </div>
  );
};
