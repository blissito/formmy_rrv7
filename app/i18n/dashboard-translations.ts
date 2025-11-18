/**
 * Dashboard Global Translations
 * Sistema i18n completo para todo el dashboard de Formmy
 * Idiomas: Inglés (EN) y Español (ES)
 *
 * Incluye:
 * - Navegación principal (tabs)
 * - Common (botones, acciones compartidas)
 * - Todas las secciones del dashboard
 * - WhatsApp (migrado de whatsapp-translations.ts)
 */

export const dashboardTranslations = {
  en: {
    // ============================================
    // NAVEGACIÓN PRINCIPAL (Tabs)
    // ============================================
    tabs: {
      preview: "Preview",
      conversations: "Conversations",
      contacts: "Leads",
      training: "Training",
      tasks: "Tasks",
      code: "Code",
      settings: "Settings"
    },

    // ============================================
    // COMMON (Compartidos en toda la app)
    // ============================================
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      update: "Update",
      edit: "Edit",
      create: "Create",
      loading: "Loading...",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
      download: "Download",
      upload: "Upload",
      refresh: "Refresh",
      close: "Close",
      back: "Back",
      next: "Next",
      finish: "Finish",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      all: "All",
      none: "None",
      select: "Select",
      selected: "Selected",
      actions: "Actions",
      status: "Status",
      name: "Name",
      description: "Description",
      createdAt: "Created",
      updatedAt: "Updated",
      exportCSV: "Export CSV",
      noResults: "No results found",
      searchPlaceholder: "Search...",
      optional: "Optional",
      required: "Required"
    },

    // ============================================
    // PREVIEW TAB
    // ============================================
    preview: {
      chatTab: "Chat",
      agentTab: "Agent",
      testYourChatbot: "Test your chatbot",
      typeMessage: "Type a message...",
      send: "Send",
      clear: "Clear",

      // AgentForm
      agentName: "Agent Name",
      agentNamePlaceholder: "My AI Assistant",
      agentType: "Agent Type",
      agentTypeHelper: "Select the personality type for your agent",
      model: "AI Model",
      modelHelper: "Choose the AI model that will power your agent",
      temperature: "Creativity",
      temperatureHelper: "Higher values = more creative, Lower values = more predictable",
      systemPrompt: "Custom Instructions",
      systemPromptPlaceholder: "You are a helpful assistant that...",
      systemPromptHelper: "Define how your agent should behave and respond",

      // ChatForm
      chatbotName: "Chatbot Name",
      chatbotDescription: "Description",
      welcomeMessage: "Welcome Message",
      welcomeMessagePlaceholder: "Hello! How can I help you today?",

      // Personality Types
      personalities: {
        sales: "Sales Agent",
        customer_support: "Customer Support",
        data_analyst: "Data Analyst",
        coach: "Personal Coach",
        medical_receptionist: "Medical Receptionist",
        educational_assistant: "Educational Assistant"
      }
    },

    // ============================================
    // CONVERSACIONES TAB (WhatsApp incluido)
    // ============================================
    conversations: {
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
      noFavorites: "No favorites yet!",
      noFavoritesDescription: "Mark your most important conversations as favorites.",
      loadMore: "Load More",
      toggleManualTooltip: "Switch between AI agent (auto) and manual responses",
      sendMessageTooltip: "Send manual message to this contact",
      whatsappBadgeTooltip: "Message sent/received via WhatsApp Business API",
      phoneNumberTooltip: "Contact's WhatsApp phone number",

      // WhatsApp Templates
      templates: "Message Templates",
      createTemplate: "Create Template",
      templateName: "Template Name",
      templateCategory: "Category",
      templateLanguage: "Language",
      templateBody: "Message Body",
      templateBodyPlaceholder: "Hello! Welcome to our service.",
      approved: "Approved",
      pending: "Pending",
      rejected: "Rejected",
      sendTemplate: "Send Template",
      selectTemplate: "Select Template",
      viewInManager: "View in WhatsApp Manager",
      loading: "Loading templates...",
      templateNameHelper: "Lowercase, no spaces. Use underscores.",
      templateVariablesHelper: "Variables: Use {{1}}, {{2}} for dynamic content",
      templateApprovalInfo: "Template will be submitted to Meta for approval.",
      templateApprovalTime: "Approval usually takes 1-15 minutes.",
      noTemplates: "No templates found. Create one above.",
      noApprovedTemplates: "No approved templates available. Create and approve templates first.",
      templateInfo: "Only approved templates can be sent to users",
      errorSendingTemplate: "Error sending template",

      // Template Categories
      categoryMarketing: "Marketing",
      categoryUtility: "Utility",
      categoryAuthentication: "Authentication",

      // Template Languages
      languageEnglishUS: "English (US)",
      languageSpanishMX: "Spanish (MX)",
      languageSpanish: "Spanish",

      // Estados
      connected: "Connected",
      disconnected: "Disconnected",
      sending: "Sending...",
      sent: "Sent",
      received: "Received",
      creating: "Creating...",

      // Mensajes
      success: "Success",
      error: "Error",
      templateCreated: "Template created successfully",
      templateSent: "Template sent successfully",
      messageSent: "Message sent successfully",
      failedToSend: "Failed to send message",
      failedToCreate: "Failed to create template",
      integrationNotFound: "WhatsApp integration not found",
      notWhatsAppConversation: "This is not a WhatsApp conversation"
    },

    // ============================================
    // LEADS TAB
    // ============================================
    contacts: {
      title: "Leads",
      searchPlaceholder: "Search by name, email, company...",
      exportCSV: "Export CSV",
      deleteSelected: "Delete Selected",
      contact: "Lead",
      position: "Position",
      date: "Date",
      source: "Source",
      sourceWhatsApp: "WhatsApp",
      sourceWeb: "Web",
      autoSaveTip: "💡 Tip: Leads are automatically saved when your chatbot captures contact information using the save_contact_info tool.",
      viewConversation: "View conversation",
      noConversation: "No conversation",
      noConversationAssociated: "This lead does not have an associated conversation",
      noSearchResults: "No leads found with \"{search}\"",

      // Status Labels
      status: {
        new: "New",
        contacted: "Contacted",
        scheduled: "Scheduled",
        negotiating: "Negotiating",
        on_hold: "On Hold",
        closed_won: "Closed Won",
        closed_lost: "Closed Lost"
      },

      // Table Headers
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Interest",
      contactStatus: "Status",
      lastContact: "Last Contact",
      actions: "Actions",

      // Actions
      viewDetails: "View Details",
      editContact: "Edit Lead",
      deleteContact: "Delete Lead",

      // Empty State
      noContacts: "No Leads",
      noContactsDescription: "You haven't captured any leads yet. Leads are automatically saved when your chatbot collects contact information from interested prospects.",

      // Confirmations
      confirmDelete: "Are you sure you want to delete this lead?",
      confirmDeleteMultiple: "Are you sure you want to delete {count} leads?",
      contactDeleted: "Lead deleted successfully",
      contactsDeleted: "Leads deleted successfully"
    },

    // ============================================
    // ENTRENAMIENTO TAB
    // ============================================
    training: {
      title: "Training Data",
      subtitle: "Add knowledge to your chatbot",

      // Menu Buttons
      uploadFiles: "Upload Files",
      addText: "Add Text",
      connectGoogleDrive: "Google Drive",
      connectNotion: "Notion",
      addQuestions: "Q&A",
      addWebsite: "Website",
      advancedSettings: "Advanced",

      // File Upload
      uploadFilesTitle: "Upload Documents",
      uploadFilesDescription: "Upload PDF, DOCX, TXT files to train your chatbot",
      selectFiles: "Select Files",
      dragAndDrop: "or drag and drop files here",
      uploadSuccess: "Files uploaded successfully",
      uploadError: "Error uploading files",
      processingFiles: "Processing files...",

      // File List
      fileName: "File Name",
      fileSize: "Size",
      uploadedAt: "Uploaded",
      deleteFile: "Delete",
      noFiles: "No files uploaded yet",
      confirmDeleteFile: "Are you sure you want to delete this file?",

      // Text Form
      addTextTitle: "Add Custom Text",
      textContent: "Content",
      textContentPlaceholder: "Enter the information you want your chatbot to learn...",
      textTitle: "Title",
      textTitlePlaceholder: "E.g., Company Policies",
      saveText: "Save Text",

      // Website Form
      addWebsiteTitle: "Add Website Content",
      websiteURL: "Website URL",
      websiteURLPlaceholder: "https://example.com",
      crawlWebsite: "Crawl Website",
      crawling: "Crawling...",
      crawlSuccess: "Website content added successfully",
      crawlError: "Error crawling website",

      // Questions Form
      addQuestionsTitle: "Add Questions & Answers",
      question: "Question",
      answer: "Answer",
      addQuestion: "Add Question",
      saveQuestions: "Save Q&A",
      questionPlaceholder: "What are your business hours?",
      answerPlaceholder: "We're open Monday to Friday, 9 AM to 6 PM",

      // Advanced Settings
      advancedTitle: "Advanced Parsing",
      parsingMode: "Parsing Mode",
      costEffective: "Cost Effective",
      agentic: "Agentic",
      agenticPlus: "Agentic Plus (OCR)",
      parsingModeHelper: "Choose parsing quality vs cost"
    },

    // ============================================
    // TAREAS TAB
    // ============================================
    tasks: {
      title: "Tasks",
      noTasks: "No tasks yet",
      noTasksDescription: "Automated tasks from your chatbot will appear here.",
      taskType: "Type",
      taskStatus: "Status",
      createdAt: "Created",
      completedAt: "Completed"
    },

    // ============================================
    // CÓDIGO TAB (Integraciones)
    // ============================================
    integrations: {
      title: "Integrations",
      subtitle: "Connect your favorite tools",

      // Common
      connect: "Connect",
      connected: "Connected",
      disconnect: "Disconnect",
      configure: "Configure",
      testConnection: "Test Connection",
      alwaysActive: "Always active",
      disconnectError: "Error disconnecting integration. Please try again.",

      // Deník
      denik: {
        name: "Deník",
        description: "Integrated reminder and scheduling system. Your agent can create reminders, schedule appointments, and send notifications automatically."
      },

      // Save Contact
      saveContact: {
        name: "Contact Management",
        description: "Contact capture and management system. Your agent saves customer and prospect information during conversations."
      },

      // Stripe
      stripe: {
        name: "Stripe",
        description: "Allow your agent to automatically generate payment links to charge for products and services."
      },

      // Google Calendar
      googleCalendar: {
        name: "Google Calendar",
        description: "Connect your agent to Google Calendar so it can schedule appointments and reminders automatically."
      },

      // Gmail
      gmail: {
        name: "Gmail",
        description: "Allow your agent to send and read emails automatically from your Gmail account."
      },

      // WhatsApp
      whatsapp: {
        name: "WhatsApp Business",
        description: "Connect your agent to a WhatsApp number and let it respond to your customers' messages.",
        integration: "Integration",
        setupIntegration: "Setup Integration",
        updateIntegration: "Update Integration"
      },

      // Instagram
      instagram: {
        name: "Instagram",
        description: "Connect your agent to an Instagram page and let it respond to your customers' messages."
      },

      // Shopify
      shopify: {
        name: "Shopify",
        description: "Let your agent interact with your customers, answer their questions, help with orders, and more."
      },

      // Slack
      slack: {
        name: "Slack",
        description: "Connect your agent to Slack, mention it, and have it respond to any message."
      },

      // WhatsApp Success Messages
      whatsappSuccessDefault: "WhatsApp integration configured successfully!",
      whatsappSuccessEmbedded: "WhatsApp connected via official Embedded Signup! Business Integration Token generated.",
      whatsappSuccessCoexistence: "WhatsApp connected in coexistence mode! Your chatbot and mobile app will work together.",

      // WhatsApp Templates
      whatsappTemplatesTitle: "WhatsApp Message Templates",
      whatsappTemplatesDescription: "Create and manage message templates for WhatsApp Business. Templates must be approved by Meta before use.",

      // Embed Section
      embedTitle: "Embed your chatbot on your website",
      embedDescription: "Choose the embedding method that works best for you.",
      embedMoreInfo: "More information",
      setupInstructions: "Setup Instructions",

      // Link Embed Instructions
      embedLinkText: "Chat with our assistant",
      embedLinkStep1: "Copy the link code",
      embedLinkStep2: "Paste it in your HTML file where you want it to appear",
      embedLinkStep3: "Customize the text and styles according to your needs",

      // Widget Embed Instructions
      embedWidgetStep1: "Copy the widget code",
      embedWidgetStep2: "Paste it in your HTML file, preferably before the </body>",
      embedWidgetStep3: "The widget will appear as a bubble in the bottom right corner",
      embedWidgetStep4: "Works on CodePen, JSFiddle, and any website",
      embedWidgetStep5: "No conflicts - doesn't block your site",
      embedWidgetStep6: "Responsive and optimized for all devices"
    },

    // ============================================
    // CONFIGURACIÓN TAB
    // ============================================
    settings: {
      title: "Settings",

      // Menu Buttons
      general: "General",
      notifications: "Notifications",
      users: "Users",
      security: "Security",
      streaming: "Streaming",

      // General Settings
      generalTitle: "General Settings",
      chatbotName: "Chatbot Name",
      chatbotDescription: "Description",
      chatbotLanguage: "Default Language",
      chatbotTimezone: "Timezone",

      // Notifications
      notificationsTitle: "Notification Preferences",
      emailNotifications: "Email Notifications",
      newConversations: "New Conversations",
      newContacts: "New Contacts",
      systemAlerts: "System Alerts",

      // Users
      usersTitle: "Team Members",
      inviteUser: "Invite User",
      userEmail: "Email",
      userRole: "Role",
      roleAdmin: "Admin",
      roleMember: "Member",
      roleViewer: "Viewer",
      removeUser: "Remove",
      pendingInvitation: "Pending",

      // Security
      securityTitle: "Security Settings",
      apiKeys: "API Keys",
      generateKey: "Generate New Key",
      revokeKey: "Revoke Key",
      allowedOrigins: "Allowed Origins",
      corsSettings: "CORS Settings",

      // Streaming
      streamingTitle: "Streaming Settings",
      enableStreaming: "Enable Streaming",
      streamingEnabled: "Streaming is enabled",
      streamingDisabled: "Streaming is disabled",
      streamingHelper: "Real-time response streaming for better user experience",

      // Delete Chatbot
      deleteChatbot: {
        title: "Delete Chatbot",
        description: "Permanently delete this chatbot and all its data",
        button: "Delete Chatbot",
        confirm: "Are you sure? This action cannot be undone.",
        confirmPlaceholder: "Type DELETE to confirm",
        deleting: "Deleting...",
        deleted: "Chatbot deleted successfully"
      }
    },

    // ============================================
    // SHARED COMPONENTS
    // ============================================
    components: {
      // MessageBubble
      messageBubble: {
        debugInfo: "Debug Info",
        reasoning: "Reasoning",
        sources: "Sources",
        toolCalls: "Tool Calls"
      },

      // InfoSources
      infoSources: {
        title: "Information Sources",
        addSource: "Add Source",
        noSources: "No sources added yet"
      },

      // ConfigMenu
      configMenu: {
        files: "Files",
        text: "Text",
        googleDrive: "Google Drive",
        notion: "Notion",
        questions: "Q&A",
        website: "Website",
        advanced: "Advanced"
      }
    }
  },

  es: {
    // ============================================
    // NAVEGACIÓN PRINCIPAL (Tabs)
    // ============================================
    tabs: {
      preview: "Preview",
      conversations: "Conversaciones",
      contacts: "Leads",
      training: "Entrenamiento",
      tasks: "Tareas",
      code: "Código",
      settings: "Configuración"
    },

    // ============================================
    // COMMON (Compartidos en toda la app)
    // ============================================
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      update: "Actualizar",
      edit: "Editar",
      create: "Crear",
      loading: "Cargando...",
      search: "Buscar",
      filter: "Filtrar",
      export: "Exportar",
      import: "Importar",
      download: "Descargar",
      upload: "Subir",
      refresh: "Actualizar",
      close: "Cerrar",
      back: "Atrás",
      next: "Siguiente",
      finish: "Finalizar",
      confirm: "Confirmar",
      yes: "Sí",
      no: "No",
      all: "Todos",
      none: "Ninguno",
      select: "Seleccionar",
      selected: "Seleccionado",
      actions: "Acciones",
      status: "Estado",
      name: "Nombre",
      description: "Descripción",
      createdAt: "Creado",
      updatedAt: "Actualizado",
      exportCSV: "Exportar CSV",
      noResults: "No se encontraron resultados",
      searchPlaceholder: "Buscar...",
      optional: "Opcional",
      required: "Requerido"
    },

    // ============================================
    // PREVIEW TAB
    // ============================================
    preview: {
      chatTab: "Chat",
      agentTab: "Agente",
      testYourChatbot: "Prueba tu chatbot",
      typeMessage: "Escribe un mensaje...",
      send: "Enviar",
      clear: "Limpiar",

      // AgentForm
      agentName: "Nombre del Agente",
      agentNamePlaceholder: "Mi Asistente IA",
      agentType: "Tipo de Agente",
      agentTypeHelper: "Selecciona el tipo de personalidad para tu agente",
      model: "Modelo de IA",
      modelHelper: "Elige el modelo de IA que impulsará tu agente",
      temperature: "Creatividad",
      temperatureHelper: "Valores altos = más creativo, Valores bajos = más predecible",
      systemPrompt: "Instrucciones Personalizadas",
      systemPromptPlaceholder: "Eres un asistente útil que...",
      systemPromptHelper: "Define cómo debe comportarse y responder tu agente",

      // ChatForm
      chatbotName: "Nombre del Chatbot",
      chatbotDescription: "Descripción",
      welcomeMessage: "Mensaje de Bienvenida",
      welcomeMessagePlaceholder: "¡Hola! ¿Cómo puedo ayudarte hoy?",

      // Personality Types
      personalities: {
        sales: "Agente de Ventas",
        customer_support: "Soporte al Cliente",
        data_analyst: "Analista de Datos",
        coach: "Coach Personal",
        medical_receptionist: "Recepcionista Médico",
        educational_assistant: "Asistente Educativo"
      }
    },

    // ============================================
    // CONVERSACIONES TAB (WhatsApp incluido)
    // ============================================
    conversations: {
      allConversations: "Todas",
      favorites: "Favoritas",
      manualMode: "Modo Manual",
      autoMode: "Modo Automático",
      sendMessage: "Enviar Mensaje",
      phoneNumber: "Número de Teléfono",
      typing: "Escribe un mensaje...",
      noConversations: "No hay conversaciones aún",
      noConversationsDescription: "Las conversaciones con tus clientes aparecerán aquí.",
      installScript: "Agrega el iframe de tu chatbot a tu sitio web para comenzar a recibir mensajes.",
      noFavorites: "¡No tienes favoritos!",
      noFavoritesDescription: "Marca como favoritos tus conversaciones más importantes.",
      loadMore: "Cargar Más",
      toggleManualTooltip: "Cambiar entre agente IA (automático) y respuestas manuales",
      sendMessageTooltip: "Enviar mensaje manual a este contacto",
      whatsappBadgeTooltip: "Mensaje enviado/recibido vía API de WhatsApp Business",
      phoneNumberTooltip: "Número de WhatsApp del contacto",

      // WhatsApp Templates
      templates: "Plantillas de Mensajes",
      createTemplate: "Crear Plantilla",
      templateName: "Nombre de Plantilla",
      templateCategory: "Categoría",
      templateLanguage: "Idioma",
      templateBody: "Cuerpo del Mensaje",
      templateBodyPlaceholder: "¡Hola! Bienvenido a nuestro servicio.",
      approved: "Aprobado",
      pending: "Pendiente",
      rejected: "Rechazado",
      sendTemplate: "Enviar Plantilla",
      selectTemplate: "Seleccionar Plantilla",
      viewInManager: "Ver en WhatsApp Manager",
      loading: "Cargando plantillas...",
      templateNameHelper: "Minúsculas, sin espacios. Usa guiones bajos.",
      templateVariablesHelper: "Variables: Usa {{1}}, {{2}} para contenido dinámico",
      templateApprovalInfo: "La plantilla será enviada a Meta para aprobación.",
      templateApprovalTime: "La aprobación suele tardar de 1 a 15 minutos.",
      noTemplates: "No se encontraron plantillas. Crea una arriba.",
      noApprovedTemplates: "No hay plantillas aprobadas disponibles. Crea y aprueba plantillas primero.",
      templateInfo: "Solo las plantillas aprobadas pueden ser enviadas a usuarios",
      errorSendingTemplate: "Error al enviar plantilla",

      // Template Categories
      categoryMarketing: "Marketing",
      categoryUtility: "Utilidad",
      categoryAuthentication: "Autenticación",

      // Template Languages
      languageEnglishUS: "Inglés (US)",
      languageSpanishMX: "Español (MX)",
      languageSpanish: "Español",

      // Estados
      connected: "Conectado",
      disconnected: "Desconectado",
      sending: "Enviando...",
      sent: "Enviado",
      received: "Recibido",
      creating: "Creando...",

      // Mensajes
      success: "Éxito",
      error: "Error",
      templateCreated: "Plantilla creada exitosamente",
      templateSent: "Plantilla enviada exitosamente",
      messageSent: "Mensaje enviado exitosamente",
      failedToSend: "Error al enviar mensaje",
      failedToCreate: "Error al crear plantilla",
      integrationNotFound: "Integración de WhatsApp no encontrada",
      notWhatsAppConversation: "Esta no es una conversación de WhatsApp"
    },

    // ============================================
    // LEADS TAB
    // ============================================
    contacts: {
      title: "Leads",
      searchPlaceholder: "Buscar por nombre, email, empresa...",
      exportCSV: "Exportar CSV",
      deleteSelected: "Eliminar Seleccionados",
      contact: "Lead",
      position: "Cargo",
      date: "Fecha",
      source: "Origen",
      sourceWhatsApp: "WhatsApp",
      sourceWeb: "Web",
      autoSaveTip: "Los leads se guardan cuando tu chatbot captura información de contacto usando save_contact_info.",
      viewConversation: "Ver conversación",
      noConversation: "Sin conversación",
      noConversationAssociated: "Este lead no tiene una conversación asociada",
      noSearchResults: "No se encontraron leads con \"{search}\"",

      // Status Labels
      status: {
        new: "Nuevo",
        contacted: "Contactado",
        scheduled: "Agendado",
        negotiating: "Negociando",
        on_hold: "En Pausa",
        closed_won: "Ganado",
        closed_lost: "Perdido"
      },

      // Table Headers
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      company: "Interés",
      contactStatus: "Estado",
      lastContact: "Último Contacto",
      actions: "Acciones",

      // Actions
      viewDetails: "Ver Detalles",
      editContact: "Editar Lead",
      deleteContact: "Eliminar Lead",

      // Empty State
      noContacts: "Sin leads",
      noContactsDescription: "Aún no has capturado leads. Los leads se guardan automáticamente cuando tu chatbot recopila información de contacto de prospectos interesados.",

      // Confirmations
      confirmDelete: "¿Estás seguro de que quieres eliminar este lead?",
      confirmDeleteMultiple: "¿Estás seguro de que quieres eliminar {count} leads?",
      contactDeleted: "Lead eliminado exitosamente",
      contactsDeleted: "Leads eliminados exitosamente"
    },

    // ============================================
    // ENTRENAMIENTO TAB
    // ============================================
    training: {
      title: "Datos de Entrenamiento",
      subtitle: "Agrega conocimiento a tu chatbot",

      // Menu Buttons
      uploadFiles: "Subir Archivos",
      addText: "Agregar Texto",
      connectGoogleDrive: "Google Drive",
      connectNotion: "Notion",
      addQuestions: "Preguntas y Respuestas",
      addWebsite: "Sitio Web",
      advancedSettings: "Avanzado",

      // File Upload
      uploadFilesTitle: "Subir Documentos",
      uploadFilesDescription: "Sube archivos PDF, DOCX, TXT para entrenar tu chatbot",
      selectFiles: "Seleccionar Archivos",
      dragAndDrop: "o arrastra y suelta archivos aquí",
      uploadSuccess: "Archivos subidos exitosamente",
      uploadError: "Error al subir archivos",
      processingFiles: "Procesando archivos...",

      // File List
      fileName: "Nombre del Archivo",
      fileSize: "Tamaño",
      uploadedAt: "Subido",
      deleteFile: "Eliminar",
      noFiles: "No se han subido archivos aún",
      confirmDeleteFile: "¿Estás seguro de que quieres eliminar este archivo?",

      // Text Form
      addTextTitle: "Agregar Texto Personalizado",
      textContent: "Contenido",
      textContentPlaceholder: "Ingresa la información que quieres que tu chatbot aprenda...",
      textTitle: "Título",
      textTitlePlaceholder: "Ej., Políticas de la Empresa",
      saveText: "Guardar Texto",

      // Website Form
      addWebsiteTitle: "Agregar Contenido de Sitio Web",
      websiteURL: "URL del Sitio Web",
      websiteURLPlaceholder: "https://ejemplo.com",
      crawlWebsite: "Rastrear Sitio Web",
      crawling: "Rastreando...",
      crawlSuccess: "Contenido del sitio web agregado exitosamente",
      crawlError: "Error al rastrear sitio web",

      // Questions Form
      addQuestionsTitle: "Agregar Preguntas y Respuestas",
      question: "Pregunta",
      answer: "Respuesta",
      addQuestion: "Agregar Pregunta",
      saveQuestions: "Guardar Preguntas",
      questionPlaceholder: "¿Cuál es su horario de atención?",
      answerPlaceholder: "Estamos abiertos de lunes a viernes, de 9 AM a 6 PM",

      // Advanced Settings
      advancedTitle: "Procesamiento Avanzado",
      parsingMode: "Modo de Procesamiento",
      costEffective: "Económico",
      agentic: "Agéntico",
      agenticPlus: "Agéntico Plus (OCR)",
      parsingModeHelper: "Elige calidad de procesamiento vs costo"
    },

    // ============================================
    // TAREAS TAB
    // ============================================
    tasks: {
      title: "Tareas",
      noTasks: "No hay tareas aún",
      noTasksDescription: "Las tareas automatizadas de tu chatbot aparecerán aquí.",
      taskType: "Tipo",
      taskStatus: "Estado",
      createdAt: "Creada",
      completedAt: "Completada"
    },

    // ============================================
    // CÓDIGO TAB (Integraciones)
    // ============================================
    integrations: {
      title: "Integraciones",
      subtitle: "Conecta tus herramientas favoritas",

      // Common
      connect: "Conectar",
      connected: "Conectado",
      disconnect: "Desconectar",
      configure: "Configurar",
      testConnection: "Probar Conexión",
      alwaysActive: "Siempre activa",
      disconnectError: "Error al desconectar la integración. Inténtalo de nuevo.",

      // Deník
      denik: {
        name: "Deník",
        description: "Sistema de recordatorios y agenda integrado. Tu agente puede crear recordatorios, agendar citas y enviar notificaciones automáticamente."
      },

      // Save Contact
      saveContact: {
        name: "Gestión de Contactos",
        description: "Sistema de captura y gestión de contactos. Tu agente guarda información de clientes y prospectos durante las conversaciones."
      },

      // Stripe
      stripe: {
        name: "Stripe",
        description: "Permite que tu agente genere links de pago automáticamente para cobrar productos y servicios."
      },

      // Google Calendar
      googleCalendar: {
        name: "Google Calendar",
        description: "Conecta tu agente a Google Calendar para que pueda programar citas y recordatorios automáticamente."
      },

      // Gmail
      gmail: {
        name: "Gmail",
        description: "Permite que tu agente envíe y lea correos electrónicos automáticamente desde tu cuenta de Gmail."
      },

      // WhatsApp
      whatsapp: {
        name: "WhatsApp Business",
        description: "Conecta a tu agente a un número de WhatsApp y deja que responda los mensajes de tus clientes.",
        integration: "Integración",
        setupIntegration: "Configurar Integración",
        updateIntegration: "Actualizar Integración"
      },

      // Instagram
      instagram: {
        name: "Instagram",
        description: "Conecta a tu agente a una página de Instagram y deja que responda los mensajes de tus clientes."
      },

      // Shopify
      shopify: {
        name: "Shopify",
        description: "Deje que tu agente interactúe con sus clientes, responda a sus consultas, ayude con los pedidos y más."
      },

      // Slack
      slack: {
        name: "Slack",
        description: "Conecta a tu agente a Slack, menciónalo y haz que responda cualquier mensaje."
      },

      // WhatsApp Success Messages
      whatsappSuccessDefault: "¡Integración de WhatsApp configurada correctamente!",
      whatsappSuccessEmbedded: "¡WhatsApp conectado via Embedded Signup oficial! Business Integration Token generado.",
      whatsappSuccessCoexistence: "¡WhatsApp conectado en modo coexistencia! Tu chatbot y la app móvil funcionarán juntos.",

      // WhatsApp Templates
      whatsappTemplatesTitle: "Plantillas de Mensajes de WhatsApp",
      whatsappTemplatesDescription: "Crea y gestiona plantillas de mensajes para WhatsApp Business. Las plantillas deben ser aprobadas por Meta antes de su uso.",

      // Embed Section
      embedTitle: "Embebe tu chatbot en tu sitio web",
      embedDescription: "Elige la forma de embebido que más te convenga.",
      embedMoreInfo: "Más información",
      setupInstructions: "Instrucciones de configuración",

      // Link Embed Instructions
      embedLinkText: "Chatear con nuestro asistente",
      embedLinkStep1: "Copia el código del enlace",
      embedLinkStep2: "Pégalo en tu archivo HTML donde quieras que aparezca",
      embedLinkStep3: "Personaliza el texto y los estilos según tus necesidades",

      // Widget Embed Instructions
      embedWidgetStep1: "Copia el código del widget",
      embedWidgetStep2: "Pégalo en tu archivo HTML, preferiblemente antes del </body>",
      embedWidgetStep3: "El widget aparecerá como una burbuja en la esquina inferior derecha",
      embedWidgetStep4: "Funciona en CodePen, JSFiddle y cualquier sitio web",
      embedWidgetStep5: "Sin conflictos - no bloquea tu sitio",
      embedWidgetStep6: "Responsive y optimizado para todos los dispositivos"
    },

    // ============================================
    // CONFIGURACIÓN TAB
    // ============================================
    settings: {
      title: "Configuración",

      // Menu Buttons
      general: "General",
      notifications: "Notificaciones",
      users: "Usuarios",
      security: "Seguridad",
      streaming: "Streaming",

      // General Settings
      generalTitle: "Configuración General",
      chatbotName: "Nombre del Chatbot",
      chatbotDescription: "Descripción",
      chatbotLanguage: "Idioma Predeterminado",
      chatbotTimezone: "Zona Horaria",

      // Notifications
      notificationsTitle: "Preferencias de Notificaciones",
      emailNotifications: "Notificaciones por Email",
      newConversations: "Nuevas Conversaciones",
      newContacts: "Nuevos Contactos",
      systemAlerts: "Alertas del Sistema",

      // Users
      usersTitle: "Miembros del Equipo",
      inviteUser: "Invitar Usuario",
      userEmail: "Email",
      userRole: "Rol",
      roleAdmin: "Administrador",
      roleMember: "Miembro",
      roleViewer: "Visor",
      removeUser: "Eliminar",
      pendingInvitation: "Pendiente",

      // Security
      securityTitle: "Configuración de Seguridad",
      apiKeys: "Claves API",
      generateKey: "Generar Nueva Clave",
      revokeKey: "Revocar Clave",
      allowedOrigins: "Orígenes Permitidos",
      corsSettings: "Configuración CORS",

      // Streaming
      streamingTitle: "Configuración de Streaming",
      enableStreaming: "Habilitar Streaming",
      streamingEnabled: "Streaming está habilitado",
      streamingDisabled: "Streaming está deshabilitado",
      streamingHelper: "Streaming de respuestas en tiempo real para mejor experiencia de usuario",

      // Delete Chatbot
      deleteChatbot: {
        title: "Eliminar Chatbot",
        description: "Eliminar permanentemente este chatbot y todos sus datos",
        button: "Eliminar Chatbot",
        confirm: "¿Estás seguro? Esta acción no se puede deshacer.",
        confirmPlaceholder: "Escribe ELIMINAR para confirmar",
        deleting: "Eliminando...",
        deleted: "Chatbot eliminado exitosamente"
      }
    },

    // ============================================
    // SHARED COMPONENTS
    // ============================================
    components: {
      // MessageBubble
      messageBubble: {
        debugInfo: "Info de Debug",
        reasoning: "Razonamiento",
        sources: "Fuentes",
        toolCalls: "Llamadas de Herramientas"
      },

      // InfoSources
      infoSources: {
        title: "Fuentes de Información",
        addSource: "Agregar Fuente",
        noSources: "No se han agregado fuentes aún"
      },

      // ConfigMenu
      configMenu: {
        files: "Archivos",
        text: "Texto",
        googleDrive: "Google Drive",
        notion: "Notion",
        questions: "Preguntas",
        website: "Sitio Web",
        advanced: "Avanzado"
      }
    }
  }
} as const;

export type DashboardLanguage = keyof typeof dashboardTranslations;
export type DashboardTranslationKey = keyof typeof dashboardTranslations.en;
