import { useState, useRef, useCallback } from "react";
import { Effect, pipe } from "effect";
import { validateChatbotDataEffect } from "~/utils/zod";

export function useManualSave(
  initialData: any,
  planLimits?: { availableModels?: string[] },
  intent: string = "update_chatbot"
) {
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const initialRef = useRef(initialData);

  // Detectar cambios
  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };
      const isChanged =
        JSON.stringify(updated) !== JSON.stringify(initialRef.current);
      console.log(
        "handleChange: updated=",
        updated,
        "initial=",
        initialRef.current,
        "isChanged=",
        isChanged
      );
      setHasChanges(isChanged);
      return updated;
    });
  }, []);

  // Guardar cambios manualmente, siempre con intent fijo
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    const effect = pipe(
      Effect.sync(() => {
        // Validación síncrona
        const parsed = validateChatbotDataEffect(formData, planLimits);
        if (!parsed.success) {
          throw parsed.error;
        }
        return { ...formData, intent };
      }),
      Effect.flatMap((data) =>
        Effect.tryPromise(async () => {
          // Convertir a FormData
          const fd = new FormData();
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              fd.append(key, String(value));
            }
          });
          // Si existe chatbotId en data pero no se añadió (por falsy), forzar su inclusión
          if (data.chatbotId && !fd.has("chatbotId")) {
            fd.append("chatbotId", String(data.chatbotId));
          }
          console.log("[useManualSave] Enviando fetch a /api/v1/chatbot", fd);
          const response = await fetch("/api/v1/chatbot", {
            method: "POST",
            body: fd,
          });
          console.log("[useManualSave] response", response);
          let result;
          try {
            result = await response.json();
          } catch (e) {
            console.error(
              "[useManualSave] Error al parsear response.json()",
              e
            );
            throw new Error("Respuesta no es JSON válido");
          }
          console.log("[useManualSave] result", result);
          if (!response.ok) throw new Error(result.error || "Error al guardar");
          return result;
        })
      ),
      Effect.catchAll((err) => {
        console.error("[useManualSave] Error en Effect.tryPromise:", err);
        return Effect.sync(() => {
          throw err;
        });
      }),
      Effect.ensuring(Effect.sync(() => setIsSaving(false)))
    );
    try {
      await Effect.runPromise(effect);
      setSuccess(true);
      setHasChanges(false);
      initialRef.current = formData;
    } catch (err) {
      setError(err);
    }
  }, [formData, planLimits, intent]);

  // Resetear cambios
  const resetChanges = useCallback(() => {
    setFormData(initialRef.current);
    setHasChanges(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    formData,
    isSaving,
    error,
    success,
    hasChanges,
    handleChange,
    handleSave, // ahora no requiere argumentos
    resetChanges,
    setFormData, // por si se necesita setear todo manualmente
  };
}
