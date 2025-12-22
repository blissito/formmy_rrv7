/**
 * Servicio de transpilación JSX → JavaScript
 *
 * Usa sucrase que es ~20x más rápido que Babel para transformaciones simples.
 * Se ejecuta en el servidor cuando se crea/actualiza un artefacto.
 */

import { transform } from "sucrase";

interface TranspileResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Transpila código JSX a JavaScript vanilla
 *
 * @param jsxCode - Código JSX/TSX del artefacto
 * @returns Código JavaScript transpilado o error
 */
export function transpileJSX(jsxCode: string): TranspileResult {
  try {
    const result = transform(jsxCode, {
      transforms: ["typescript", "jsx"], // Soportar TypeScript + JSX
      jsxRuntime: "classic", // Usar React.createElement en lugar de jsx runtime
      production: true,
    });

    return {
      success: true,
      code: result.code,
    };
  } catch (e) {
    console.error("[Transpiler] Error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error de transpilación desconocido",
    };
  }
}

/**
 * Valida que el código transpilado sea ejecutable
 *
 * @param code - Código JavaScript transpilado
 * @returns true si es válido
 */
export function validateTranspiledCode(code: string): { valid: boolean; error?: string } {
  try {
    // Intentar parsear el código para validar sintaxis
    new Function("React", code);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Código inválido",
    };
  }
}
