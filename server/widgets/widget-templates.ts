export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // URL de preview image
  trigger: {
    type: "bubble" | "sidebar" | "tab" | "bar";
    position: string;
    size?: { width: number; height: number };
    icon?: string;
    text?: string;
    animation?: string;
    behavior?: "float" | "push" | "overlay";
  };
  chat: {
    style: "modern" | "minimal" | "enterprise" | "industrial";
    position: string;
    size: { width: string; height: string; maxWidth?: string; maxHeight?: string };
    borderRadius?: string;
    showHeader?: boolean;
    showFooter?: boolean;
    animations?: boolean;
  };
}

export const WIDGET_TEMPLATES: Record<string, WidgetTemplate> = {
  bubble: {
    id: "bubble",
    name: "Bubble Clásico",
    description: "Botón flotante circular con chat desplegable. Ideal para sitios modernos.",
    preview: "/assets/templates/bubble-preview.png",
    trigger: {
      type: "bubble",
      position: "bottom-right",
      size: { width: 64, height: 64 },
      icon: "chat",
      animation: "scale",
      behavior: "float", // Flota sobre el contenido
    },
    chat: {
      style: "modern",
      position: "bottom-right",
      size: {
        width: "400px",
        height: "calc(100vh - 150px)",
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "704px",
      },
      borderRadius: "16px",
      showHeader: true,
      showFooter: true,
      animations: true,
    },
  },

  sidebar: {
    id: "sidebar",
    name: "Sidebar Push",
    description: "Panel lateral que empuja el contenido del sitio. Perfecto para aplicaciones empresariales.",
    preview: "/assets/templates/sidebar-preview.png",
    trigger: {
      type: "sidebar",
      position: "right",
      size: { width: 48, height: 120 },
      text: "Chat",
      animation: "slide",
      behavior: "push", // Empuja el contenido del sitio
    },
    chat: {
      style: "enterprise",
      position: "right",
      size: {
        width: "380px",
        height: "100vh",
      },
      borderRadius: "0",
      showHeader: true,
      showFooter: true,
      animations: false,
    },
  },

  minimal: {
    id: "minimal",
    name: "Tab Minimalista",
    description: "Pestaña lateral discreta con diseño limpio. Para sitios con estética minimalista.",
    preview: "/assets/templates/minimal-preview.png",
    trigger: {
      type: "tab",
      position: "right-center",
      size: { width: 40, height: 160 },
      text: "Ayuda",
      animation: "fade",
      behavior: "overlay", // Se superpone sin mover contenido
    },
    chat: {
      style: "minimal",
      position: "right",
      size: {
        width: "350px",
        height: "500px",
        maxHeight: "80vh",
      },
      borderRadius: "8px",
      showHeader: false,
      showFooter: false,
      animations: true,
    },
  },

  enterprise: {
    id: "enterprise",
    name: "Barra Empresarial",
    description: "Barra inferior con acciones rápidas y chat integrado. Para portales corporativos.",
    preview: "/assets/templates/enterprise-preview.png",
    trigger: {
      type: "bar",
      position: "bottom",
      size: { width: 320, height: 60 },
      text: "¿Necesitas ayuda?",
      animation: "slide-up",
      behavior: "float",
    },
    chat: {
      style: "enterprise",
      position: "bottom-center",
      size: {
        width: "500px",
        height: "600px",
        maxWidth: "90vw",
        maxHeight: "80vh",
      },
      borderRadius: "12px 12px 0 0",
      showHeader: true,
      showFooter: true,
      animations: false,
    },
  },

  industrial: {
    id: "industrial",
    name: "Panel Industrial",
    description: "Widget robusto con menú de herramientas integrado. Para aplicaciones industriales y técnicas.",
    preview: "/assets/templates/industrial-preview.png",
    trigger: {
      type: "bubble",
      position: "bottom-right",
      size: { width: 72, height: 72 },
      icon: "tools",
      animation: "rotate",
      behavior: "float",
    },
    chat: {
      style: "industrial",
      position: "bottom-right",
      size: {
        width: "450px",
        height: "650px",
        maxWidth: "calc(100vw - 20px)",
        maxHeight: "calc(100vh - 100px)",
      },
      borderRadius: "4px",
      showHeader: true,
      showFooter: true,
      animations: false,
    },
  },
};

// Helper function to get template by ID
export function getTemplate(templateId: string): WidgetTemplate {
  return WIDGET_TEMPLATES[templateId] || WIDGET_TEMPLATES.bubble;
}

// Helper function to get CSS for a template
export function getTemplateTriggerStyles(template: WidgetTemplate): string {
  const { trigger } = template;
  let baseStyles = "";

  switch (trigger.type) {
    case "bubble":
      baseStyles = `
        position: fixed;
        ${getPositionStyles(trigger.position)}
        width: ${trigger.size?.width}px;
        height: ${trigger.size?.height}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
        z-index: 42424242;
      `;
      break;

    case "sidebar":
    case "tab":
      baseStyles = `
        position: fixed;
        ${getPositionStyles(trigger.position)}
        width: ${trigger.size?.width}px;
        height: ${trigger.size?.height}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        writing-mode: ${trigger.position.includes("left") || trigger.position.includes("right") ? "vertical-rl" : "horizontal-tb"};
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
        z-index: 42424242;
      `;
      break;

    case "bar":
      baseStyles = `
        position: fixed;
        ${getPositionStyles(trigger.position)}
        width: ${trigger.size?.width}px;
        height: ${trigger.size?.height}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 30px;
        box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s;
        z-index: 42424242;
      `;
      break;
  }

  return baseStyles;
}

export function getTemplateChatStyles(template: WidgetTemplate): string {
  const { chat } = template;
  
  return `
    position: fixed;
    ${getPositionStyles(chat.position)}
    width: ${chat.size.width};
    height: ${chat.size.height};
    ${chat.size.maxWidth ? `max-width: ${chat.size.maxWidth};` : ""}
    ${chat.size.maxHeight ? `max-height: ${chat.size.maxHeight};` : ""}
    border-radius: ${chat.borderRadius || "16px"};
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    z-index: 42424243;
    transform-origin: ${getTransformOrigin(chat.position)};
    transition: ${chat.animations ? "all 0.2s" : "none"};
  `;
}

// Helper function to get position CSS
function getPositionStyles(position: string): string {
  const positions: Record<string, string> = {
    "bottom-right": "bottom: 20px; right: 20px;",
    "bottom-left": "bottom: 20px; left: 20px;",
    "bottom-center": "bottom: 20px; left: 50%; transform: translateX(-50%);",
    "top-right": "top: 20px; right: 20px;",
    "top-left": "top: 20px; left: 20px;",
    "right": "right: 0; top: 0; height: 100%;",
    "left": "left: 0; top: 0; height: 100%;",
    "right-center": "right: 0; top: 50%; transform: translateY(-50%);",
    "left-center": "left: 0; top: 50%; transform: translateY(-50%);",
    "bottom": "bottom: 0; left: 50%; transform: translateX(-50%);",
  };
  
  return positions[position] || positions["bottom-right"];
}

// Helper function to get transform origin
function getTransformOrigin(position: string): string {
  if (position.includes("bottom") && position.includes("right")) return "bottom right";
  if (position.includes("bottom") && position.includes("left")) return "bottom left";
  if (position.includes("top") && position.includes("right")) return "top right";
  if (position.includes("top") && position.includes("left")) return "top left";
  if (position.includes("bottom")) return "bottom center";
  if (position.includes("top")) return "top center";
  if (position.includes("right")) return "center right";
  if (position.includes("left")) return "center left";
  return "center center";
}

// Function to get animation classes
export function getAnimationClass(animation?: string, isOpen?: boolean): string {
  if (!animation) return "";
  
  const animations: Record<string, { open: string; closed: string }> = {
    scale: {
      open: "scale-100 opacity-100",
      closed: "scale-0 opacity-0",
    },
    slide: {
      open: "translate-x-0 opacity-100",
      closed: "translate-x-full opacity-0",
    },
    "slide-up": {
      open: "translate-y-0 opacity-100",
      closed: "translate-y-full opacity-0",
    },
    fade: {
      open: "opacity-100",
      closed: "opacity-0",
    },
    rotate: {
      open: "rotate-0 scale-100",
      closed: "rotate-180 scale-0",
    },
  };
  
  const anim = animations[animation] || animations.scale;
  return isOpen ? anim.open : anim.closed;
}