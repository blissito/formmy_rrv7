import { Input } from "../common/Input";
import { useS3Upload } from "~/hooks/useS3Upload";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

interface ChatFormProps {
  name: string;
  primaryColor: string;
  welcomeMessage: string;
  goodbyeMessage: string;
  avatarUrl?: string;
  chatbotSlug?: string;
  onNameChange: (name: string) => void;
  onPrimaryColorChange: (color: string) => void;
  onWelcomeMessageChange: (message: string) => void;
  onGoodbyeMessageChange: (message: string) => void;
  onAvatarChange: (url: string) => void;
}

export const ChatForm = ({
  name,
  primaryColor,
  welcomeMessage,
  goodbyeMessage,
  avatarUrl,
  chatbotSlug,
  onNameChange,
  onPrimaryColorChange,
  onWelcomeMessageChange,
  onGoodbyeMessageChange,
  onAvatarChange,
}: ChatFormProps) => {
  const { uploadFile, uploadState } = useS3Upload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(avatarUrl || "");
  
  // Actualizar previewUrl cuando avatarUrl cambie
  useEffect(() => {
    setPreviewUrl(avatarUrl || "");
  }, [avatarUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Mostrar preview local
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Subir a S3
    const result = await uploadFile(file, "chatbot-avatars", chatbotSlug);
    if (result) {
      onAvatarChange(result.publicUrl);
      setPreviewUrl(result.publicUrl);
      toast.success("Imagen actualizada correctamente");
    } else {
      // Revertir al avatar anterior si falla
      setPreviewUrl(avatarUrl || "");
      toast.error("Error al subir la imagen");
    }

    // Limpiar preview local
    URL.revokeObjectURL(localPreview);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
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
            disabled={uploadState.isUploading}
            className="relative w-full h-[164px] border rounded-3xl border-outlines overflow-hidden group hover:border-primary transition-colors"
          >
            {previewUrl && previewUrl !== "" ? (
              <img
                src={previewUrl}
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
            {uploadState.isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white">Subiendo...</div>
              </div>
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
