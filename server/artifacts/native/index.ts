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

export interface ArtifactTriggers {
  /** Palabras clave que activan este artefacto (ej: "fotos", "galería") */
  keywords: string[];
  /** Intenciones semánticas (ej: "ver_galeria", "mostrar_imagenes") */
  intents: string[];
}

export interface ArtifactExample {
  /** Mensaje de ejemplo del usuario */
  userMessage: string;
  /** Datos que se deben pasar al artefacto */
  initialData: Record<string, unknown>;
}

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
    // Campos para mejorar detección y uso por el modelo
    /** Triggers que activan este artefacto */
    triggers?: ArtifactTriggers;
    /** Ejemplos de uso para few-shot learning */
    examples?: ArtifactExample[];
    /** Estrategia para obtener datos: "rag" busca primero, "static" usa config */
    dataStrategy?: "rag" | "static";
    /** Query sugerido para buscar en RAG si dataStrategy es "rag" */
    ragQuery?: string;
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
    description: "Muestra MÚLTIPLES imágenes en formato galería. SOLO usar cuando el usuario pida ver FOTOS o IMÁGENES explícitamente (NO para productos con precio). Display puro sin acciones.",
    category: "galleries",
    events: [], // Sin eventos - es display-only, no captura decisiones
    propsSchema: {
      type: "object",
      properties: {
        images: { type: "array", items: { type: "string" }, description: "URLs de imágenes (máx 4)", required: true },
        title: { type: "string", description: "Título de la galería" },
        description: { type: "string", description: "Descripción opcional" },
      },
    },
    // Triggers para detección automática
    triggers: {
      keywords: [
        "fotos", "imágenes", "galería", "ver fotos", "muéstrame fotos",
        "pictures", "gallery", "photos", "portafolio", "catálogo visual",
        "ver imágenes", "mostrar fotos", "enseñame fotos", "quiero ver fotos",
      ],
      intents: ["ver_galeria", "mostrar_imagenes", "ver_fotos"],
    },
    // Ejemplos para few-shot learning
    examples: [
      {
        userMessage: "Muéstrame fotos del portafolio",
        initialData: {
          images: ["https://ejemplo.com/foto1.jpg", "https://ejemplo.com/foto2.jpg"],
          title: "Portafolio",
        },
      },
      {
        userMessage: "Quiero ver la galería de imágenes",
        initialData: {
          images: ["https://ejemplo.com/img1.jpg"],
          title: "Galería",
        },
      },
    ],
    dataStrategy: "rag",
    ragQuery: "imágenes fotos galería portafolio",
  }),

  "product-card": createNativeArtifact(FRONTEND_NATIVE_PLACEHOLDER, {
    displayName: "Tarjeta de Producto",
    description: "Muestra UN SOLO producto/servicio con NOMBRE y PRECIO. USAR cuando el usuario pregunte por precio, producto específico, o quiera comprar. Tiene botones de acción (Saber más, Agregar al carrito).",
    category: "products",
    events: ["onViewMore", "onAddToCart"],
    propsSchema: {
      type: "object",
      properties: {
        imageUrl: { type: "string", description: "URL de imagen del producto" },
        name: { type: "string", description: "Nombre del producto", required: true },
        description: { type: "string", description: "Descripción del producto" },
        price: { type: "number", description: "Precio del producto", required: true },
        currency: { type: "string", description: "Moneda (MXN, USD)", default: "MXN" },
      },
    },
    // Triggers para detección automática
    triggers: {
      keywords: [
        "producto", "precio", "comprar", "ver producto", "cuánto cuesta",
        "artículo", "item", "agregar carrito", "mostrar producto",
        "quiero comprar", "información del producto", "detalles del producto",
        "servicio", "cuánto vale", "costo",
      ],
      intents: ["ver_producto", "consultar_precio", "comprar_producto", "agregar_carrito"],
    },
    // Ejemplos para few-shot learning
    examples: [
      {
        userMessage: "Cuánto cuesta el producto X?",
        initialData: {
          name: "Producto X",
          description: "Descripción del producto",
          price: 299.99,
          currency: "MXN",
        },
      },
      {
        userMessage: "Quiero ver el servicio premium",
        initialData: {
          name: "Servicio Premium",
          description: "Acceso completo a todas las funciones",
          price: 499,
          currency: "MXN",
        },
      },
    ],
    dataStrategy: "rag",
    ragQuery: "productos precios catálogo servicios",
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
