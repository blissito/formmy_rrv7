/**
 * Enhanced Ghosty Chat Hook with LlamaIndex callbacks and rich UI states
 */

import { useState, useCallback } from 'react';

// Enhanced states that map to LlamaIndex agent lifecycle
export type GhostyLlamaState = 
  | 'idle' 
  | 'thinking'           // Agent is planning
  | 'tool-analyzing'     // Deciding which tools to use  
  | 'tool-chatbots'      // Querying chatbots
  | 'tool-stats'         // Getting statistics
  | 'tool-web-search'    // Web searching
  | 'tool-web-fetch'     // Fetching webpage
  | 'synthesizing'       // Combining tool results
  | 'streaming'          // Final response streaming
  | 'error';

// Enhanced progress tracking
export interface ToolProgress {
  toolName: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress?: number; // 0-100
  message?: string;
  startTime?: Date;
  endTime?: Date;
}

// Rich source metadata from LlamaIndex
export interface LlamaSource {
  type: 'chatbot' | 'stats' | 'web' | 'context';
  title: string;
  url?: string;
  snippet?: string;
  favicon?: string;
  image?: string;
  data?: any;
  confidence?: number; // 0-1 from LlamaIndex
  toolUsed?: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    queryType?: string;
  };
}

// Enhanced message with LlamaIndex metadata
export interface GhostyLlamaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: LlamaSource[];
  toolsUsed?: string[];
  toolProgress?: ToolProgress[];
  confidence?: number;
  suggestedFollowUp?: string[];
  widgets?: Array<{
    type: 'payment' | 'booking' | 'form';
    id: string;
  }>;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    model?: string;
    iterations?: number;
  };
}

export const useGhostyLlamaChat = (initialMessages: GhostyLlamaMessage[] = []) => {
  const [messages, setMessages] = useState<GhostyLlamaMessage[]>(initialMessages);
  const [currentState, setCurrentState] = useState<GhostyLlamaState>('idle');
  const [toolProgress, setToolProgress] = useState<ToolProgress[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThought, setCurrentThought] = useState<string>('');

  const addMessage = useCallback((message: Omit<GhostyLlamaMessage, 'id' | 'timestamp'>) => {
    const newMessage: GhostyLlamaMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<GhostyLlamaMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const addToolProgress = useCallback((toolName: string, status: ToolProgress['status'], message?: string, progress?: number) => {
    const newProgress: ToolProgress = {
      toolName,
      status,
      message,
      progress,
      startTime: status === 'running' ? new Date() : undefined,
      endTime: status === 'completed' || status === 'error' ? new Date() : undefined,
    };

    setToolProgress(prev => {
      const existing = prev.find(p => p.toolName === toolName);
      if (existing) {
        return prev.map(p => p.toolName === toolName ? { ...p, ...newProgress } : p);
      }
      return [...prev, newProgress];
    });
  }, []);

  const getToolDisplayName = (toolName: string): string => {
    const toolDisplayNames: Record<string, string> = {
      // Chatbot tools
      'query_chatbots': '🤖 Consultando chatbots...',
      'get_chatbot_stats': '📊 Analizando estadísticas...',

      // Reminder tools
      'schedule_reminder': '📅 Programando recordatorio...',
      'list_reminders': '📋 Consultando recordatorios...',
      'update_reminder': '✏️ Actualizando recordatorio...',
      'cancel_reminder': '❌ Cancelando recordatorio...',
      'delete_reminder': '🗑️ Eliminando recordatorio...',

      // Payment tools
      'create_formmy_plan_payment': '💳 Generando link de pago para plan...',
      'create_payment_link': '💳 Creando link de pago...',

      // Contact tools
      'save_contact_info': '👤 Guardando contacto...',

      // Legacy tools (mantenidos por compatibilidad)
      'get_chatbot': '🔍 Obteniendo chatbot...',
      'web_search': '🌐 Buscando en la web...',
      'web_fetch': '📄 Obteniendo página web...',
    };
    return toolDisplayNames[toolName] || `🛠️ ${toolName}...`;
  };

  const getStateDisplayMessage = (state: GhostyLlamaState): string => {
    const stateMessages: Record<GhostyLlamaState, string> = {
      'idle': '',
      'thinking': '🤔 Analizando tu consulta...',
      'tool-analyzing': '🔧 Decidiendo qué herramientas usar...',
      'tool-chatbots': '🤖 Consultando información de tus chatbots...',
      'tool-stats': '📊 Obteniendo estadísticas detalladas...',
      'tool-web-search': '🌐 Buscando información actualizada...',
      'tool-web-fetch': '📄 Obteniendo contenido de la página...',
      'synthesizing': '🧠 Combinando información encontrada...',
      'streaming': '✍️ Preparando respuesta...',
      'error': '❌ Ha ocurrido un error',
    };
    return stateMessages[state];
  };

  const generateFollowUpSuggestions = (message: GhostyLlamaMessage, availableTools: string[] = []): string[] => {
    const suggestions: string[] = [];
    const content = message.content.toLowerCase();
    const toolsUsed = message.toolsUsed || [];

    // 🛡️ Helper para verificar si una herramienta está disponible
    const hasToolAccess = (toolName: string) => availableTools.includes(toolName);

    // 🎯 Obtener últimas 3 preguntas del usuario para NO repetir
    const recentQuestions = messages
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content.toLowerCase());

    const isDuplicate = (suggestion: string) => {
      const lower = suggestion.toLowerCase();
      return recentQuestions.some(q =>
        q.includes(lower.substring(0, 20)) || // Primeras 20 chars
        lower.includes(q.substring(0, 20)) ||
        (q.includes('quedan') && lower.includes('quedan')) ||
        (q.includes('plan') && lower.includes('plan'))
      );
    };

    // 🎯 Sugerencias INTELIGENTES basadas en contexto real

    // Usage limits - detectar plan específico y sugerir upgrade o acciones
    if (toolsUsed.includes('get_usage_limits')) {
      if (content.includes('trial')) {
        suggestions.push('¿Qué obtengo si cambio a STARTER?');
        suggestions.push('¿Cuánto cuesta el plan PRO?');
      } else if (content.includes('free')) {
        suggestions.push('Activa mi trial de 365 días');
        suggestions.push('¿Qué planes tienen chatbots?');
      } else if (content.includes('starter')) {
        suggestions.push('Compara STARTER vs PRO');
        suggestions.push('¿Qué herramientas extra tiene PRO?');
      } else if (content.includes('pro')) {
        suggestions.push('¿Vale la pena ENTERPRISE?');
        suggestions.push('Muéstrame estadísticas de uso');
      } else if (content.includes('90%') || content.includes('advertencia')) {
        suggestions.push('¿Cómo upgrade a siguiente plan?');
        suggestions.push('¿Puedo comprar conversaciones extra?');
      } else {
        suggestions.push('¿Qué herramientas tengo disponibles?');
        suggestions.push('Muéstrame mis chatbots activos');
      }
    }

    // Chatbot queries - acciones específicas
    if (toolsUsed.includes('query_chatbots')) {
      const hasActiveBot = content.match(/\d+\s*(chatbot|activo)/);
      if (hasActiveBot) {
        suggestions.push('Estadísticas del chatbot más usado');
        suggestions.push('¿Cómo optimizar respuestas?');
      } else if (content.includes('no tienes') || content.includes('sin chatbots')) {
        suggestions.push('Créame un chatbot de soporte');
        suggestions.push('¿Qué necesito para crear chatbot?');
      } else {
        suggestions.push('Desactiva chatbots con bajo uso');
        suggestions.push('¿Cómo mejorar tasa de conversión?');
      }
    }

    // Chatbot stats - análisis numérico
    if (toolsUsed.includes('get_chatbot_stats')) {
      if (content.match(/\d+\s*conversaciones/)) {
        suggestions.push('Compara con semana pasada');
        suggestions.push('¿Cómo aumentar conversaciones?');
      } else {
        suggestions.push('Top 3 días con más tráfico');
        suggestions.push('Exportar reporte PDF');
      }
    }

    // Recordatorios - flujo completo (solo si tiene acceso)
    if (toolsUsed.includes('schedule_reminder')) {
      if (hasToolAccess('list_reminders')) {
        suggestions.push('Ver todos mis recordatorios');
      }
      if (hasToolAccess('schedule_reminder')) {
        suggestions.push('Crear otro para la próxima semana');
      }
    }
    if (toolsUsed.includes('list_reminders')) {
      if (content.includes('no tienes') || content.includes('0')) {
        if (hasToolAccess('schedule_reminder')) {
          suggestions.push('Crear recordatorio de seguimiento');
        }
      } else {
        if (hasToolAccess('delete_reminder')) {
          suggestions.push('Eliminar recordatorios vencidos');
        }
        if (hasToolAccess('update_reminder')) {
          suggestions.push('Reprogramar para mañana');
        }
      }
    }

    // Pagos - seguimiento (solo si tiene acceso a create_payment_link)
    if (toolsUsed.includes('create_payment_link')) {
      suggestions.push('¿Cómo rastrear si pagaron?');
      if (hasToolAccess('create_payment_link')) {
        suggestions.push('Crear link de $1,000 MXN');
      }
    }

    // Contactos - CRM flow
    if (toolsUsed.includes('save_contact_info')) {
      if (hasToolAccess('schedule_reminder')) {
        suggestions.push('Crear recordatorio en 3 días');
      }
      suggestions.push('¿Cómo exportar contactos?');
    }

    // Web search - profundizar
    if (toolsUsed.includes('web_search_google')) {
      if (hasToolAccess('web_search_google')) {
        suggestions.push('Busca más info sobre esto');
      }
      if (hasToolAccess('get_usage_limits')) {
        suggestions.push('¿Cuántas búsquedas me quedan?');
      }
    }

    // RAG Context search
    if (toolsUsed.includes('search_context')) {
      suggestions.push('¿Qué más puedo preguntarte?');
      suggestions.push('Optimiza mi base de conocimiento');
    }

    // 🔍 Si NO usó tools, sugerencias basadas en intención del usuario
    if (suggestions.length === 0) {
      // Detectar intención y sugerir siguiente paso
      if (content.includes('conversaciones') && content.includes('quedan')) {
        if (hasToolAccess('get_usage_limits')) {
          suggestions.push('¿Qué herramientas tengo disponibles?');
        }
        if (hasToolAccess('query_chatbots')) {
          suggestions.push('Muestra mis chatbots activos');
        }
      } else if (content.includes('plan') && (content.includes('actual') || content.includes('funciona'))) {
        suggestions.push('Compara mi plan con otros');
        if (hasToolAccess('get_usage_limits')) {
          suggestions.push('¿Cuántas conversaciones me quedan?');
        }
      } else if (content.includes('chatbot')) {
        if (hasToolAccess('get_chatbot_stats')) {
          suggestions.push('Estadísticas de esta semana');
        }
        suggestions.push('¿Cómo mejorar conversiones?');
      } else if (content.includes('recordatorio')) {
        if (hasToolAccess('list_reminders')) {
          suggestions.push('Lista recordatorios pendientes');
        }
        if (hasToolAccess('schedule_reminder')) {
          suggestions.push('Crear uno para mañana a las 10am');
        }
      } else if (content.includes('pago')) {
        if (hasToolAccess('create_payment_link')) {
          suggestions.push('Crear link de pago de $500');
        }
        suggestions.push('¿Cómo configurar Stripe?');
      } else if (content.includes('optimizar') || content.includes('mejorar')) {
        if (hasToolAccess('get_chatbot_stats')) {
          suggestions.push('Analiza mis métricas');
        }
        suggestions.push('Tips para aumentar conversiones');
      } else {
        // Default: acciones útiles y variadas basadas en herramientas disponibles
        const defaults = [];
        if (hasToolAccess('get_chatbot_stats')) {
          defaults.push('Muéstrame estadísticas de la semana');
        }
        if (hasToolAccess('query_chatbots')) {
          defaults.push('Crea un chatbot de ventas');
        }
        if (hasToolAccess('get_usage_limits')) {
          defaults.push('¿Qué herramientas tengo disponibles?');
        }
        if (hasToolAccess('schedule_reminder')) {
          defaults.push('Recordatorio para seguimiento mañana');
        }
        defaults.push('Compara mis planes disponibles'); // Siempre disponible

        // Si no hay defaults por herramientas, usar genéricos
        if (defaults.length === 0) {
          defaults.push('¿Qué puedes hacer por mí?', '¿Cómo funciona Formmy?');
        }

        // Rotar defaults para variedad
        const offset = messages.length % defaults.length;
        const selectedDefaults = [
          defaults[offset],
          defaults[(offset + 1) % defaults.length]
        ].filter(Boolean);

        suggestions.push(...selectedDefaults);
      }
    }

    // 🚫 Filtrar duplicados de conversación reciente
    const uniqueSuggestions = suggestions.filter(s => !isDuplicate(s));

    // Si todo quedó filtrado, usar fallbacks inteligentes
    if (uniqueSuggestions.length === 0) {
      const smartFallbacks = [
        '¿Qué más puedes ayudarme?',
        'Muestra resumen de mi cuenta',
        'Tips para optimizar Formmy',
        '¿Cómo integrar WhatsApp?'
      ];
      uniqueSuggestions.push(...smartFallbacks.slice(0, 2));
    }

    // Asegurar exactamente 2 sugerencias
    while (uniqueSuggestions.length < 2) {
      uniqueSuggestions.push('¿Qué otras herramientas tienes?');
    }

    return uniqueSuggestions.slice(0, 2);
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // ✅ Detectar si es primera interacción después de clearChat()
    // Si messages está vacío, es nueva conversación
    const isFirstMessageAfterClear = messages.length === 0;

    // Add user message
    const userMessage = addMessage({
      role: 'user',
      content: content.trim(),
    });

    if (!isExpanded) {
      setIsExpanded(true);
    }

    // Reset states
    setCurrentState('thinking');
    setError(null);
    setToolProgress([]);
    setCurrentThought('');

    // Add assistant message placeholder
    const assistantMessage = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
      toolProgress: [],
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

      // Use NEW AgentV0 endpoint with real LlamaIndex tools and GPT-5
      const response = await fetch('/api/ghosty/v0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ Enviar cookies de sesión para autenticación
        body: JSON.stringify({
          message: content.trim(),
          stream: true,
          integrations: {}, // ✅ Backend inyecta Stripe de Formmy para cobro de planes
          forceNewConversation: isFirstMessageAfterClear // ✅ Backend creará nueva conversación
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentContent = '';
      let sources: LlamaSource[] = [];
      let toolsUsed: string[] = [];
      let availableTools: string[] = [];
      let widgets: Array<{type: 'payment' | 'booking' | 'form', id: string}> = [];
      let metadata: any = {};

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              switch (parsed.type) {
                case 'status':
                  if (parsed.status === 'thinking') {
                    setCurrentState('thinking');
                    setCurrentThought(parsed.message || 'Procesando...');
                  } else if (parsed.status === 'tool-analyzing') {
                    setCurrentState('tool-analyzing');
                    setCurrentThought(''); // Limpiar para evitar acumulación
                  }
                  break;

                case 'tool-start':
                  const toolName = parsed.tool;
                  // Mapeo inteligente de tool name a estado
                  const getToolState = (tool: string): GhostyLlamaState => {
                    if (tool.includes('chatbot') || tool.includes('query')) return 'tool-chatbots';
                    if (tool.includes('stats') || tool.includes('analyz')) return 'tool-stats';
                    if (tool.includes('web_search') || tool.includes('search')) return 'tool-web-search';
                    if (tool.includes('web_fetch') || tool.includes('fetch')) return 'tool-web-fetch';
                    // Para herramientas específicas, usar estado genérico 'tool-analyzing'
                    return 'tool-analyzing';
                  };

                  setCurrentState(getToolState(toolName));
                  setCurrentThought(''); // Limpiar pensamiento anterior
                  addToolProgress(toolName, 'running', parsed.message || getToolDisplayName(toolName));
                  break;

                case 'tool-progress':
                  addToolProgress(parsed.tool, 'running', parsed.message, parsed.progress);
                  break;

                case 'tool-complete':
                  addToolProgress(parsed.tool, 'completed', 'Completado');
                  // Después de completar una herramienta, volver a 'synthesizing' si hay más información
                  if (toolProgress.filter(t => t.status === 'running').length === 0) {
                    setCurrentState('synthesizing');
                  }
                  break;

                case 'tool-error':
                  addToolProgress(parsed.tool, 'error', parsed.error || 'Error en la herramienta');
                  // En caso de error de herramienta, continuar con síntesis si hay otras herramientas exitosas
                  const hasSuccessfulTools = toolProgress.some(t => t.status === 'completed');
                  if (hasSuccessfulTools) {
                    setCurrentState('synthesizing');
                  }
                  break;

                case 'synthesizing':
                  setCurrentState('synthesizing');
                  setCurrentThought('Organizando la información encontrada...');
                  break;

                case 'chunk':
                  setCurrentState('streaming');
                  setCurrentThought(''); // Limpiar para evitar interferencia con streaming
                  currentContent += parsed.content;
                  updateMessage(assistantMessage.id, {
                    content: currentContent,
                    isStreaming: true,
                    toolProgress: toolProgress,
                  });
                  break;

                case 'widget':
                  // 🆕 Agregar widget al mensaje actual

                  widgets.push({
                    type: parsed.widgetType,
                    id: parsed.widgetId
                  });
                  updateMessage(assistantMessage.id, {
                    widgets: [...widgets]
                  });
                  break;

                case 'sources':
                  sources = parsed.sources?.map((source: any) => ({
                    ...source,
                    confidence: source.confidence || 0.8, // Default confidence
                  })) || [];
                  break;

                case 'metadata':
                  if (parsed.toolsUsed) {
                    toolsUsed = parsed.toolsUsed;
                  }
                  if (parsed.availableTools) {
                    availableTools = parsed.availableTools;
                  }
                  if (parsed.tokens) {
                    metadata.tokensUsed = parsed.tokens;
                  }
                  break;

                case 'done':
                  // Extraer availableTools del metadata si está disponible
                  if (parsed.metadata?.availableTools) {
                    availableTools = parsed.metadata.availableTools;
                  }

                  // Generate follow-up suggestions
                  const finalMessage = {
                    content: currentContent,
                    isStreaming: false,
                    sources: sources,
                    toolsUsed: toolsUsed,
                    toolProgress: toolProgress,
                    widgets: widgets, // 🆕 Incluir widgets detectados
                    metadata: {
                      ...metadata,
                      ...parsed.metadata,
                    },
                  };

                  const suggestions = generateFollowUpSuggestions({
                    ...assistantMessage,
                    ...finalMessage,
                  }, availableTools);

                  updateMessage(assistantMessage.id, {
                    ...finalMessage,
                    suggestedFollowUp: suggestions,
                  });

                  setCurrentState('idle');
                  setToolProgress([]);
                  setCurrentThought('');
                  return;

                case 'error':
                  throw new Error(parsed.error || 'Unknown error');
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

    } catch (err) {
      setCurrentState('error');
      setToolProgress([]);
      
      let errorMessage = 'Error inesperado';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'La consulta tardó demasiado tiempo - inténtalo de nuevo';
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Error de conexión - verifica tu conexión a internet';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      updateMessage(assistantMessage.id, {
        content: 'Lo siento, hubo un error procesando tu mensaje. Usa el botón "Reintentar" o escribe tu pregunta de nuevo.',
        isStreaming: false,
      });
    }
  }, [messages, addMessage, updateMessage, isExpanded, addToolProgress, toolProgress]);

  const regenerateResponse = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;

    const userMessage = messages[messages.findIndex(m => m.id === messageId) - 1];
    if (userMessage && userMessage.role === 'user') {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      sendMessage(userMessage.content);
    }
  }, [messages, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentState('idle');
    setError(null);
    setToolProgress([]);
    setCurrentThought('');
    // ✅ NO colapsar el chat - mantener expandido si ya estaba expandido
    // setIsExpanded(false);
  }, []);

  const expandChat = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapseChat = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return {
    // Enhanced state
    messages,
    currentState,
    isExpanded,
    error,
    toolProgress,
    currentThought,
    
    // Actions
    sendMessage,
    clearChat,
    regenerateResponse,
    expandChat,
    collapseChat,
    
    // Utils
    addMessage,
    updateMessage,
    getToolDisplayName,
    getStateDisplayMessage,
  };
};