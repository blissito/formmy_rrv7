/**
 * Manifest de Artefactos Nativos
 *
 * Define la metadata de cada artefacto nativo.
 * El script de carga usa este manifest para subir los artefactos a la DB.
 *
 * Para agregar un nuevo artefacto:
 * 1. Crea el componente .tsx en esta carpeta
 * 2. Agrega la entrada aquí con su metadata
 * 3. Corre: npm run load:artifacts
 */

export interface ArtifactManifestEntry {
  /** Nombre del archivo sin extensión */
  file: string;
  /** Nombre técnico (slug) - usado para invocar el artefacto */
  name: string;
  /** Nombre para mostrar en el marketplace */
  displayName: string;
  /** Descripción del artefacto */
  description: string;
  /** Categoría: forms, calendars, payments, galleries, etc */
  category: string;
  /** Eventos que emite el artefacto */
  events: string[];
  /** Schema de props (opcional) */
  propsSchema?: Record<string, unknown>;
}

export const NATIVE_ARTIFACTS_MANIFEST: ArtifactManifestEntry[] = [
  {
    file: "GallleryChatCard",
    name: "gallery-card",
    displayName: "Galería de Imágenes",
    description:
      "Muestra una galería de hasta 4 imágenes con vista modal y navegación. Ideal para mostrar productos, portafolio o fotos.",
    category: "galleries",
    events: ["onImageClick", "onClose"],
    propsSchema: {
      type: "object",
      properties: {
        images: {
          type: "array",
          items: { type: "string" },
          description: "URLs de las imágenes (máximo 4)",
        },
        title: {
          type: "string",
          description: "Título de la galería",
        },
        description: {
          type: "string",
          description: "Descripción opcional",
        },
      },
      required: ["images"],
    },
  },
  {
    file: "ProductChatCard",
    name: "product-card",
    displayName: "Tarjeta de Producto",
    description:
      "Muestra un producto con imagen, nombre, descripción y precio. Incluye botón de acción.",
    category: "products",
    events: ["onViewMore", "onAddToCart"],
    propsSchema: {
      type: "object",
      properties: {
        imageUrl: {
          type: "string",
          description: "URL de la imagen del producto",
        },
        name: {
          type: "string",
          description: "Nombre del producto",
        },
        description: {
          type: "string",
          description: "Descripción del producto",
        },
        price: {
          type: "number",
          description: "Precio del producto",
        },
        currency: {
          type: "string",
          description: "Moneda (ej: MXN, USD)",
        },
      },
      required: ["name", "price"],
    },
  },
  {
    file: "PaymentChatCard",
    name: "payment-card",
    displayName: "Tarjeta de Pago",
    description:
      "Muestra el resumen de un pedido con lista de productos, total y botón de pago.",
    category: "payments",
    events: ["onPay", "onCancel"],
    propsSchema: {
      type: "object",
      properties: {
        storeLogo: {
          type: "string",
          description: "URL del logo de la tienda",
        },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
            },
          },
          description: "Lista de productos",
        },
        total: {
          type: "number",
          description: "Total a pagar",
        },
        currency: {
          type: "string",
          description: "Moneda",
        },
      },
      required: ["total"],
    },
  },
];
