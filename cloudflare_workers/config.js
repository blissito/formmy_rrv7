/**
 * Configuración centralizada para el Worker WhatsApp-Flowise Bridge
 * Este archivo permite cambiar fácilmente endpoints y configuraciones para testing
 */

export const CONFIG = {
  // =============================================================================
  // FLOWISE ENDPOINTS - Configura aquí tus diferentes instancias
  // =============================================================================

  flowise: {
    // Endpoint activo (cambia el nombre aquí para rotar)
    active: 'production',

    endpoints: {
      // Producción principal
      production: {
        url: 'https://formmy-tasks.fly.dev',
        chatflowId: '1a7b3b45-e9b2-45ec-a2ed-f1eb293f0271',
        apiKey: true, // Usar API key desde secrets
        name: 'Formmy Tasks - Producción',
        description: 'Instancia principal de producción'
      },

      // Desarrollo local
      development: {
        url: 'http://localhost:3000',
        chatflowId: 'dev-chatflow-id',
        apiKey: false, // Sin API key para desarrollo
        name: 'Flowise Local',
        description: 'Instancia local para desarrollo'
      },

      // Staging/Testing
      staging: {
        url: 'https://formmy-staging.fly.dev',
        chatflowId: 'staging-chatflow-id',
        apiKey: true,
        name: 'Staging Environment',
        description: 'Ambiente de pruebas'
      },

      // Backup endpoint
      backup: {
        url: 'https://formmy-backup.fly.dev',
        chatflowId: 'backup-chatflow-id',
        apiKey: true,
        name: 'Backup Instance',
        description: 'Instancia de respaldo'
      },

      // Experimental
      experimental: {
        url: 'https://formmy-experimental.fly.dev',
        chatflowId: 'experimental-chatflow-id',
        apiKey: true,
        name: 'Experimental Features',
        description: 'Testing de nuevas funcionalidades'
      }
    }
  },

  // =============================================================================
  // CONFIGURACIÓN DE COMPORTAMIENTO
  // =============================================================================

  behavior: {
    // Timeout para llamadas a Flowise (ms)
    timeout: 30000,

    // Reintentos en caso de error
    retries: 3,

    // Delay entre reintentos (ms)
    retryDelay: 1000,

    // Máximo caracteres en respuesta de WhatsApp
    maxResponseLength: 4096,

    // Habilitar logs detallados
    enableDetailedLogs: true,

    // Mensaje de error personalizado
    errorMessage: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',

    // Mensaje cuando Flowise no responde
    timeoutMessage: 'El servicio está temporalmente ocupado. Intenta de nuevo en unos momentos.',

    // Habilitar fallback a endpoints alternativos
    enableFallback: true,

    // Orden de fallback (si el endpoint activo falla)
    fallbackOrder: ['backup', 'staging']
  },

  // =============================================================================
  // CONFIGURACIÓN DE DESARROLLO
  // =============================================================================

  development: {
    // Habilitar modo debug
    debug: true,

    // Simular delays para testing
    simulateDelay: false,
    simulateDelayMs: 2000,

    // Simular errores para testing
    simulateErrors: false,
    simulateErrorRate: 0.1, // 10% de errores

    // Endpoints de testing locales
    localEndpoints: {
      ngrok: 'https://abc123.ngrok.io',
      localhost: 'http://localhost:3000',
      tunnel: 'https://formmy-dev.loca.lt'
    }
  },

  // =============================================================================
  // CONFIGURACIÓN DE MONITOREO
  // =============================================================================

  monitoring: {
    // Habilitar métricas
    enableMetrics: true,

    // Logs de performance
    logPerformance: true,

    // Umbral de latencia para alertas (ms)
    latencyThreshold: 5000,

    // Rate limiting (requests por minuto)
    rateLimit: 60,

    // Webhook para alertas (opcional)
    alertWebhook: null // 'https://hooks.slack.com/...'
  },

  // =============================================================================
  // TEMPLATES DE MENSAJES
  // =============================================================================

  messages: {
    welcome: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte hoy?',

    maintenance: '🔧 Estamos realizando mantenimiento. Volveremos pronto.',

    rateLimitExceeded: '⏰ Has enviado muchos mensajes seguidos. Espera un momento e intenta de nuevo.',

    invalidMessage: 'No pude entender tu mensaje. ¿Podrías reformularlo?',

    systemError: 'Hay un problema técnico temporal. Nuestro equipo ha sido notificado.'
  }
};

// =============================================================================
// FUNCIONES HELPER PARA ACCEDER A LA CONFIGURACIÓN
// =============================================================================

/**
 * Obtiene la configuración del endpoint activo de Flowise
 */
export function getActiveFlowiseConfig() {
  const activeEndpoint = CONFIG.flowise.active;
  const config = CONFIG.flowise.endpoints[activeEndpoint];

  if (!config) {
    throw new Error(`Endpoint '${activeEndpoint}' no encontrado en configuración`);
  }

  return config;
}

/**
 * Obtiene la URL completa de la API de predicción
 */
export function getFlowisePredictionURL() {
  const config = getActiveFlowiseConfig();
  return `${config.url}/api/v1/prediction/${config.chatflowId}`;
}

/**
 * Obtiene configuración de fallback endpoints
 */
export function getFallbackConfigs() {
  return CONFIG.behavior.fallbackOrder.map(endpointName => ({
    name: endpointName,
    ...CONFIG.flowise.endpoints[endpointName]
  }));
}

/**
 * Verifica si un endpoint está disponible
 */
export function isEndpointConfigured(endpointName) {
  return CONFIG.flowise.endpoints.hasOwnProperty(endpointName);
}

/**
 * Lista todos los endpoints disponibles
 */
export function listAvailableEndpoints() {
  return Object.keys(CONFIG.flowise.endpoints).map(key => ({
    name: key,
    active: key === CONFIG.flowise.active,
    ...CONFIG.flowise.endpoints[key]
  }));
}

/**
 * Cambia el endpoint activo (útil para debugging)
 */
export function switchActiveEndpoint(endpointName) {
  if (!isEndpointConfigured(endpointName)) {
    throw new Error(`Endpoint '${endpointName}' no existe en la configuración`);
  }
  CONFIG.flowise.active = endpointName;
  return getActiveFlowiseConfig();
}

// =============================================================================
// CONFIGURACIÓN DINÁMICA BASADA EN ENVIRONMENT
// =============================================================================

/**
 * Aplica configuración específica según el ambiente
 */
export function applyEnvironmentConfig(env) {
  // En desarrollo, usar configuraciones más permisivas
  if (env.ENVIRONMENT === 'development') {
    CONFIG.behavior.timeout = 60000; // 60 segundos para debugging
    CONFIG.behavior.enableDetailedLogs = true;
    CONFIG.development.debug = true;
  }

  // En producción, configuraciones optimizadas
  if (env.ENVIRONMENT === 'production') {
    CONFIG.behavior.timeout = 15000; // 15 segundos
    CONFIG.behavior.enableDetailedLogs = false;
    CONFIG.development.debug = false;
  }

  return CONFIG;
}

export default CONFIG;