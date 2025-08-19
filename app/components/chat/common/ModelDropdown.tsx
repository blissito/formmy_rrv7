import type { User } from "@prisma/client";
import { AI_MODELS, getModelsForPlan } from "~/utils/aiModels";
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
  // Obtener modelos disponibles según el plan del usuario
  const availableModels = getModelsForPlan(user.plan);

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
    disabledReason: undefined,
    badge: model.badge,
    recommended: model.recommended,
  }));

  // Si no hay modelos disponibles (FREE sin trial), no debe haber selección
  const effectiveSelectedValue = availableModels.length === 0 ? "" : (selectedModel || "");

  // Manejo de onChange: solo permitir selección de modelos disponibles
  const handleChange = (value: string) => {
    if (availableModels.length === 0) {
      // Para usuarios FREE sin acceso, no permitir cambios
      return;
    }
    
    if (availableModels.includes(value)) {
      onChange(value);
    }
  };

  return (
    <IconDropdown
      options={modelOptions}
      selectedValue={effectiveSelectedValue}
      onChange={handleChange}
      className={className}
      label={label}
      placeholder={availableModels.length === 0 ? "Sin acceso a modelos IA - Actualiza tu plan" : undefined}
    />
  );
};
