import { useState, useRef, useCallback } from "react";
import { Effect, pipe } from "effect";

export interface UseManualSaveOptions<T> {
  initialData: T;
  validate: (data: T, planLimits?: any) => { success: boolean; error?: any };
  endpoint: string;
  intent?: string;
  idField?: string;
  planLimits?: any;
}

export function useManualSave<T = any>({
  initialData,
  validate,
  endpoint,
  intent = "update",
  idField = "id",
  planLimits,
}: UseManualSaveOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
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
        const parsed = validate(formData, planLimits);
        if (!parsed.success) {
          throw parsed.error;
        }
        return { ...formData, intent } as T & { [key: string]: any };
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
          // Si existe idField en data pero no se añadió (por falsy), forzar su inclusión
          if ((data as any)[idField] && !fd.has(idField)) {
            fd.append(idField, String((data as any)[idField]));
          }
          const response = await fetch(endpoint, {
            method: "POST",
            body: fd,
          });
          let result;
          try {
            result = await response.json();
          } catch (e) {
            throw new Error("Respuesta no es JSON válido");
          }
          if (!response.ok) throw new Error(result.error || "Error al guardar");
          return result;
        })
      ),
      Effect.catchAll((err) => {
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
  }, [formData, planLimits, intent, endpoint, idField, validate]);

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
