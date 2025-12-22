/**
 * Registro de Componentes Nativos
 *
 * Los artefactos nativos son componentes React reales importados en build time.
 * NO pasan por new Function() - se renderizan directamente.
 *
 * Para agregar un nuevo artefacto nativo:
 * 1. Crea el componente .tsx en esta carpeta
 * 2. Importa y registra aquí
 * 3. Agrega metadata en NATIVE_ARTIFACT_META
 */

import type { ComponentType } from "react";
import GalleryCard from "./GallleryChatCard";
import ProductCard from "./ProductChatCard";
import PaymentCard from "./PaymentChatCard";

// Props estándar que reciben todos los artefactos nativos
export interface NativeArtifactProps {
  data: Record<string, unknown>;
  onEvent: (eventName: string, payload: unknown) => void;
  phase?: "interactive" | "processing" | "resolved";
  outcome?: "confirmed" | "cancelled" | "expired";
}

// Registro de componentes (importados en build time)
export const NATIVE_COMPONENTS: Record<string, ComponentType<any>> = {
  "gallery-card": GalleryCard,
  "product-card": ProductCard,
  "payment-card": PaymentCard,
};

// Metadata de artefactos nativos
export const NATIVE_ARTIFACT_META: Record<
  string,
  {
    displayName: string;
    description: string;
    category: string;
    events: string[];
  }
> = {
  "gallery-card": {
    displayName: "Galería de Imágenes",
    description: "Muestra una galería de hasta 4 imágenes con vista modal. Artefacto de display puro - no emite eventos.",
    category: "galleries",
    events: [], // Sin eventos - display-only
  },
  "product-card": {
    displayName: "Tarjeta de Producto",
    description: "Muestra un producto con imagen, nombre y precio.",
    category: "products",
    events: ["onViewMore", "onAddToCart"],
  },
  "payment-card": {
    displayName: "Tarjeta de Pago",
    description: "Resumen de pedido con total y botón de pago.",
    category: "payments",
    events: ["onPay", "onCancel"],
  },
};

// Helpers
export function isNativeArtifact(name: string): boolean {
  return name in NATIVE_COMPONENTS;
}

export function getNativeComponent(name: string): ComponentType<any> | null {
  return NATIVE_COMPONENTS[name] ?? null;
}

export function getNativeArtifactNames(): string[] {
  return Object.keys(NATIVE_COMPONENTS);
}
