/**
 * Native Artifacts Registry
 *
 * Artefactos oficiales de Formmy - pre-aprobados, seguros y listos para usar.
 * El código vive aquí como source of truth. La instalación usa DB pero el código
 * SIEMPRE viene de este registry (memoria).
 *
 * Para agregar un nuevo artefacto nativo:
 * 1. Crear archivo en native/ (ej: product-gallery.ts)
 * 2. Exportar código y metadata siguiendo el patrón de date-picker
 * 3. Agregar al NATIVE_REGISTRY abajo
 * 4. Deploy → Cambios activos inmediatamente (sin re-sync DB)
 */

import DATE_PICKER_CODE, {
  ARTIFACT_METADATA as DATE_PICKER_METADATA,
} from "./date-picker.js";
import { transpileJSX } from "../transpiler.service.js";

// ============================================================================
// TYPES
// ============================================================================

export interface NativeArtifactConfig {
  code: string;
  compiledCode: string; // Pre-transpilado al cargar módulo
  metadata: {
    displayName: string;
    description: string;
    category: string;
    events: string[];
    propsSchema?: Record<string, unknown>;
    iconUrl?: string;
  };
}

// ============================================================================
// HELPER
// ============================================================================

type ArtifactMetadata = NativeArtifactConfig["metadata"];

/**
 * Crea un artefacto nativo con código pre-transpilado
 */
function createNativeArtifact(
  code: string,
  metadata: ArtifactMetadata
): NativeArtifactConfig {
  const result = transpileJSX(code);
  if (!result.success || !result.code) {
    console.error(`[Native Artifacts] Error transpiling: ${result.error}`);
  }
  return {
    code,
    compiledCode: result.code ?? code,
    metadata,
  };
}

// ============================================================================
// REGISTRY
// ============================================================================

/**
 * Registro de todos los artefactos nativos de Formmy.
 *
 * Key = nombre técnico (slug) del artefacto
 * Value = código + compiledCode + metadata
 *
 * El código se transpila UNA VEZ al cargar el módulo (startup).
 */
// Código placeholder para artefactos que usan componentes React reales en frontend
// El frontend detecta isNative y usa el componente del registry, no este código
const FRONTEND_NATIVE_PLACEHOLDER = `const ArtifactComponent = ({ data }) => null;`;

export const NATIVE_REGISTRY: Record<string, NativeArtifactConfig> = {
  // Artefacto con código dinámico (transpilado en servidor)
  "date-picker": createNativeArtifact(DATE_PICKER_CODE, DATE_PICKER_METADATA),

  // Artefactos con componentes React reales en frontend
  // El código aquí es placeholder - el frontend usa componentes importados en build
  "gallery-card": createNativeArtifact(FRONTEND_NATIVE_PLACEHOLDER, {
    displayName: "Galería de Imágenes",
    description: "Muestra una galería de hasta 4 imágenes con vista modal y navegación. Artefacto de DISPLAY puro - no emite eventos al chat, no requiere confirmArtifactTool.",
    category: "galleries",
    events: [], // Sin eventos - es display-only, no captura decisiones
    propsSchema: {
      type: "object",
      properties: {
        images: { type: "array", items: { type: "string" }, description: "URLs de imágenes (máx 4)" },
        title: { type: "string", description: "Título de la galería" },
        description: { type: "string", description: "Descripción opcional" },
      },
    },
  }),

  "product-card": createNativeArtifact(FRONTEND_NATIVE_PLACEHOLDER, {
    displayName: "Tarjeta de Producto",
    description: "Muestra un producto con imagen, nombre, descripción y precio.",
    category: "products",
    events: ["onViewMore", "onAddToCart"],
    propsSchema: {
      type: "object",
      properties: {
        imageUrl: { type: "string", description: "URL de imagen del producto" },
        name: { type: "string", description: "Nombre del producto" },
        description: { type: "string", description: "Descripción" },
        price: { type: "number", description: "Precio" },
        currency: { type: "string", description: "Moneda (MXN, USD)" },
      },
    },
  }),

  "payment-card": createNativeArtifact(FRONTEND_NATIVE_PLACEHOLDER, {
    displayName: "Tarjeta de Pago",
    description: "Resumen de pedido con lista de productos, total y botón de pago.",
    category: "payments",
    events: ["onPay", "onCancel"],
    propsSchema: {
      type: "object",
      properties: {
        storeLogo: { type: "string", description: "URL del logo" },
        items: { type: "array", description: "Lista de productos" },
        total: { type: "number", description: "Total a pagar" },
        currency: { type: "string", description: "Moneda" },
      },
    },
  }),
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la lista de nombres de artefactos nativos
 */
export function getNativeArtifactNames(): string[] {
  return Object.keys(NATIVE_REGISTRY);
}

/**
 * Verifica si un nombre corresponde a un artefacto nativo
 */
export function isNativeArtifact(name: string): boolean {
  return name in NATIVE_REGISTRY;
}

/**
 * Obtiene un artefacto nativo por nombre
 */
export function getNativeArtifact(
  name: string
): NativeArtifactConfig | undefined {
  return NATIVE_REGISTRY[name];
}

// Constantes del sistema
export const SYSTEM_AUTHOR_ID = "000000000000000000000000";
export const SYSTEM_AUTHOR_EMAIL = "team@formmy.app";
