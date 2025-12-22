/**
 * Native Artifacts Registry
 *
 * Artefactos oficiales de Formmy - pre-aprobados, seguros y listos para usar.
 * El código vive aquí como source of truth y se sincroniza a DB al startup.
 *
 * Para agregar un nuevo artefacto nativo:
 * 1. Crear archivo en native/ (ej: product-gallery.tsx)
 * 2. Exportar código y metadata siguiendo el patrón de date-picker
 * 3. Agregar al NATIVE_REGISTRY abajo
 * 4. Deploy - se sincroniza automáticamente
 */

import DATE_PICKER_CODE, {
  ARTIFACT_METADATA as DATE_PICKER_METADATA,
} from "./date-picker.js";

// ============================================================================
// TYPES
// ============================================================================

export interface NativeArtifactConfig {
  code: string;
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
// REGISTRY
// ============================================================================

/**
 * Registro de todos los artefactos nativos de Formmy.
 *
 * Key = nombre técnico (slug) del artefacto
 * Value = código + metadata
 */
export const NATIVE_REGISTRY: Record<string, NativeArtifactConfig> = {
  "date-picker": {
    code: DATE_PICKER_CODE,
    metadata: DATE_PICKER_METADATA,
  },

  // Futuros artefactos nativos:
  // "product-gallery": { code: PRODUCT_GALLERY_CODE, metadata: PRODUCT_GALLERY_METADATA },
  // "payment-form": { code: PAYMENT_FORM_CODE, metadata: PAYMENT_FORM_METADATA },
  // "survey-widget": { code: SURVEY_WIDGET_CODE, metadata: SURVEY_WIDGET_METADATA },
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
