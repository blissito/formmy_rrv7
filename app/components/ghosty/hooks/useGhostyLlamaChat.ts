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
      'query_chatbots': '🤖 Consultando chatbots',
      'get_chatbot_stats': '📊 Analizando estadísticas',

      // Reminder tools
      'schedule_reminder': '📅 Programando recordatorio',
      'list_reminders': '📋 Consultando recordatorios',
      'update_reminder': '✏️ Actualizando recordatorio',
      'cancel_reminder': '❌ Cancelando recordatorio',
      'delete_reminder': '🗑️ Eliminando recordatorio',

      // Payment tools
      'create_payment_link': '💳 Creando link de pago',

      // Contact tools
      'save_contact_info': '👤 Guardando contacto',

      // Legacy tools (mantenidos por compatibilidad)
      'get_chatbot': '🔍 Obteniendo chatbot específico',
      'web_search': '🌐 Buscando en la web',
      'web_fetch': '📄 Obteniendo página web',
    };
    return toolDisplayNames[toolName] || `🛠️ ${toolName}`;
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

  const generateFollowUpSuggestions = (message: GhostyLlamaMessage): string[] => {
    const suggestions: string[] = [];
    
    // Based on tools used
    if (message.toolsUsed?.includes('query_chatbots')) {
      suggestions.push('¿Puedes mostrar estadísticas de estos chatbots?');
      suggestions.push('¿Cómo puedo optimizar el rendimiento?');
    }

    if (message.toolsUsed?.includes('get_chatbot_stats')) {
      suggestions.push('¿Cómo se compara con el mes anterior?');
      suggestions.push('¿Qué estrategias recomiendas para mejorar?');
    }

    if (message.toolsUsed?.includes('schedule_reminder')) {
      suggestions.push('¿Puedes listar mis recordatorios pendientes?');
      suggestions.push('¿Cómo configuro recordatorios recurrentes?');
    }

    if (message.toolsUsed?.includes('create_payment_link')) {
      suggestions.push('¿Cómo personalizo el link de pago?');
      suggestions.push('¿Puedo ver las estadísticas de pagos?');
    }

    if (message.toolsUsed?.includes('save_contact_info')) {
      suggestions.push('¿Cómo organizo mis contactos por categorías?');
      suggestions.push('¿Puedes exportar mi lista de contactos?');
    }

    if (message.toolsUsed?.includes('web_search')) {
      suggestions.push('¿Puedes resumir los puntos más importantes?');
      suggestions.push('¿Cómo puedo aplicar esto a Formmy?');
    }
    
    // Content-based suggestions
    const content = message.content.toLowerCase();
    if (content.includes('conversacion')) {
      suggestions.push('¿Cómo mejorar la tasa de conversión?');
    }
    if (content.includes('costo') || content.includes('tokens')) {
      suggestions.push('¿Cómo reducir los costos de AI?');
    }
    
    return suggestions.slice(0, 3); // Max 3 suggestions
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
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
        body: JSON.stringify({
          message: content.trim(),
          stream: true,
          integrations: {} // TODO: Add real integrations
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
                  currentContent += parsed.content;
                  updateMessage(assistantMessage.id, {
                    content: currentContent,
                    isStreaming: true,
                    toolProgress: toolProgress,
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
                  if (parsed.tokens) {
                    metadata.tokensUsed = parsed.tokens;
                  }
                  break;

                case 'done':
                  // Generate follow-up suggestions
                  const finalMessage = {
                    content: currentContent,
                    isStreaming: false,
                    sources: sources,
                    toolsUsed: toolsUsed,
                    toolProgress: toolProgress,
                    metadata: {
                      ...metadata,
                      ...parsed.metadata,
                    },
                  };

                  const suggestions = generateFollowUpSuggestions({
                    ...assistantMessage,
                    ...finalMessage,
                  });

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
    setIsExpanded(false);
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