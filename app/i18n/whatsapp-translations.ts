/**
 * WhatsApp Dashboard Translations
 * Sistema de i18n minimalista para sección de WhatsApp
 * Idiomas: Inglés (EN) y Español (ES)
 */

export const whatsappTranslations = {
  en: {
    // Conversaciones
    conversations: "Conversations",
    allConversations: "All",
    favorites: "Favorites",
    manualMode: "Manual Mode",
    autoMode: "Auto Mode",
    sendMessage: "Send Message",
    phoneNumber: "Phone Number",
    typing: "Type a message...",
    noConversations: "No conversations yet",
    noConversationsDescription: "Conversations with your clients will appear here.",
    installScript: "Install the script on your website to start receiving conversations",
    loadMore: "Load More",

    // Templates
    templates: "Message Templates",
    createTemplate: "Create Template",
    templateName: "Template Name",
    templateCategory: "Category",
    templateLanguage: "Language",
    templateBody: "Message Body",
    templateBodyPlaceholder: "Hello! Welcome to our service.",
    status: "Status",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    sendTemplate: "Send Template",
    selectTemplate: "Select Template",
    viewInManager: "View in WhatsApp Manager",
    templateNameHelper: "Lowercase, no spaces. Use underscores.",
    templateVariablesHelper: "Variables: Use {{1}}, {{2}} for dynamic content",
    templateApprovalInfo: "Template will be submitted to Meta for approval.",
    templateApprovalTime: "Approval usually takes 1-15 minutes.",
    noTemplates: "No templates found. Create one above.",
    noApprovedTemplates: "No approved templates available. Create and approve templates first.",
    templateInfo: "Only approved templates can be sent to users",
    errorSendingTemplate: "Error sending template",
    refresh: "Refresh",

    // Categorías de templates
    categoryMarketing: "Marketing",
    categoryUtility: "Utility",
    categoryAuthentication: "Authentication",

    // Idiomas de templates
    languageEnglishUS: "English (US)",
    languageSpanishMX: "Spanish (MX)",
    languageSpanish: "Spanish",

    // Estados y acciones
    connected: "Connected",
    disconnected: "Disconnected",
    sending: "Sending...",
    sent: "Sent",
    received: "Received",
    creating: "Creating...",
    loading: "Loading...",

    // Errores y mensajes
    error: "Error",
    success: "Success",
    templateCreated: "Template created successfully",
    templateSent: "Template sent successfully",
    messageSent: "Message sent successfully",
    failedToSend: "Failed to send message",
    failedToCreate: "Failed to create template",
    integrationNotFound: "WhatsApp integration not found",
    notWhatsAppConversation: "This is not a WhatsApp conversation",

    // Tooltips y ayuda
    toggleManualTooltip: "Switch between AI agent (auto) and manual responses",
    sendMessageTooltip: "Send manual message via WhatsApp to this contact",
    whatsappBadgeTooltip: "Message sent/received via WhatsApp Business API",
    phoneNumberTooltip: "Contact's WhatsApp phone number",

    // Integración
    integration: "Integration",
    whatsappIntegration: "WhatsApp Business",
    setupIntegration: "Setup Integration",
    testConnection: "Test Connection",
    updateIntegration: "Update Integration"
  },

  es: {
    // Conversaciones
    conversations: "Conversaciones",
    allConversations: "Todas",
    favorites: "Favoritas",
    manualMode: "Modo Manual",
    autoMode: "Modo Automático",
    sendMessage: "Enviar Mensaje",
    phoneNumber: "Número de Teléfono",
    typing: "Escribe un mensaje...",
    noConversations: "No hay conversaciones aún",
    noConversationsDescription: "Las conversaciones con tus clientes aparecerán aquí.",
    installScript: "Instala el script en tu sitio web para comenzar a recibir conversaciones",
    loadMore: "Cargar Más",

    // Templates
    templates: "Plantillas de Mensajes",
    createTemplate: "Crear Plantilla",
    templateName: "Nombre de Plantilla",
    templateCategory: "Categoría",
    templateLanguage: "Idioma",
    templateBody: "Cuerpo del Mensaje",
    templateBodyPlaceholder: "¡Hola! Bienvenido a nuestro servicio.",
    status: "Estado",
    approved: "Aprobado",
    pending: "Pendiente",
    rejected: "Rechazado",
    sendTemplate: "Enviar Plantilla",
    selectTemplate: "Seleccionar Plantilla",
    viewInManager: "Ver en WhatsApp Manager",
    templateNameHelper: "Minúsculas, sin espacios. Usa guiones bajos.",
    templateVariablesHelper: "Variables: Usa {{1}}, {{2}} para contenido dinámico",
    templateApprovalInfo: "La plantilla será enviada a Meta para aprobación.",
    templateApprovalTime: "La aprobación suele tardar de 1 a 15 minutos.",
    noTemplates: "No se encontraron plantillas. Crea una arriba.",
    noApprovedTemplates: "No hay plantillas aprobadas disponibles. Crea y aprueba plantillas primero.",
    templateInfo: "Solo las plantillas aprobadas pueden ser enviadas a usuarios",
    errorSendingTemplate: "Error al enviar plantilla",
    refresh: "Actualizar",

    // Categorías de templates
    categoryMarketing: "Marketing",
    categoryUtility: "Utilidad",
    categoryAuthentication: "Autenticación",

    // Idiomas de templates
    languageEnglishUS: "Inglés (US)",
    languageSpanishMX: "Español (MX)",
    languageSpanish: "Español",

    // Estados y acciones
    connected: "Conectado",
    disconnected: "Desconectado",
    sending: "Enviando...",
    sent: "Enviado",
    received: "Recibido",
    creating: "Creando...",
    loading: "Cargando...",

    // Errores y mensajes
    error: "Error",
    success: "Éxito",
    templateCreated: "Plantilla creada exitosamente",
    templateSent: "Plantilla enviada exitosamente",
    messageSent: "Mensaje enviado exitosamente",
    failedToSend: "Error al enviar mensaje",
    failedToCreate: "Error al crear plantilla",
    integrationNotFound: "Integración de WhatsApp no encontrada",
    notWhatsAppConversation: "Esta no es una conversación de WhatsApp",

    // Tooltips y ayuda
    toggleManualTooltip: "Cambiar entre agente IA (automático) y respuestas manuales",
    sendMessageTooltip: "Enviar mensaje manual por WhatsApp a este contacto",
    whatsappBadgeTooltip: "Mensaje enviado/recibido vía API de WhatsApp Business",
    phoneNumberTooltip: "Número de WhatsApp del contacto",

    // Integración
    integration: "Integración",
    whatsappIntegration: "WhatsApp Business",
    setupIntegration: "Configurar Integración",
    testConnection: "Probar Conexión",
    updateIntegration: "Actualizar Integración"
  }
} as const;

export type WhatsAppLanguage = keyof typeof whatsappTranslations;
export type WhatsAppTranslationKey = keyof typeof whatsappTranslations.en;
