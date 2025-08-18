import type { User } from "@prisma/client";
import { AI_MODELS, PLAN_MODELS } from "~/utils/aiModels";
import { IconDropdown, type DropdownOption } from "./IconDropdown";

type ModelDropdownProps = {
  selectedModel: string;
  onChange: (model: string) => void;
  user: User;
  className?: string;
  label?: string;
};

export const ModelDropdown = ({
  selectedModel,
  onChange,
  user,
  className,
  label = "Selecciona el modelo IA",
}: ModelDropdownProps) => {
  // Determinar qué modelos están disponibles según el plan del usuario
  // TEMPORAL: Permitir modelos PRO para usuarios FREE (testing)
  const availableModels = PLAN_MODELS.PRO;

  // Función para obtener el logo según el proveedor del modelo
  const getModelLogo = (modelValue: string) => {
    if (modelValue.includes("mistralai")) {
      return "/assets/chat/models/mistral.svg";
    } else if (
      modelValue.includes("anthropic") ||
      modelValue.includes("claude")
    ) {
      return "/assets/chat/models/anthropic.svg";
    } else if (modelValue.includes("openai") || modelValue.includes("gpt")) {
      return "/assets/chat/models/openai.svg";
    } else if (modelValue.includes("meta") || modelValue.includes("llama")) {
      return "/assets/chat/models/meta.svg";
    } else if (modelValue.includes("google") || modelValue.includes("gemini")) {
      return "/assets/chat/models/google.svg";
    } else if (modelValue.includes("deepseek")) {
      return "/assets/chat/models/deepseek.svg";
    } else if (modelValue.includes("qwen")) {
      return "/assets/chat/models/qwen.svg";
    } else if (
      modelValue.includes("moonshotai") ||
      modelValue.includes("kimi")
    ) {
      return "/assets/chat/models/moonshot.svg";
    }
    return "/assets/chat/models/ai.svg"; // Logo genérico
  };

  // Convertir los modelos de IA a opciones para el dropdown
  const modelOptions: DropdownOption[] = AI_MODELS.map((model) => ({
    value: model.value,
    label: model.label,
    description: model.category,
    iconSrc: getModelLogo(model.value),
    disabled: !availableModels.includes(model.value),
    disabledReason: !availableModels.includes(model.value)
      ? "Requiere PRO"
      : undefined,
  }));

  return (
    <IconDropdown
      options={modelOptions}
      selectedValue={selectedModel}
      onChange={onChange}
      className={className}
      label={label}
    />
  );
};
