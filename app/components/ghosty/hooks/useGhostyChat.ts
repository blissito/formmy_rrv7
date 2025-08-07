import { useState, useCallback } from 'react';

/**
 * Determina si una pregunta probablemente necesitará búsqueda web
 */
function shouldLikelySearch(message: string, history: GhostyMessage[] = []): boolean {
  const searchKeywords = [
    'busca', 'búsqueda', 'encuentra', 'información sobre',
    'qué es', 'cómo', 'cuál', 'cuáles', 'dónde',
    'últimas', 'reciente', 'actual', 'novedades',
    'documentación', 'docs', 'guía', 'tutorial',
    'precio', 'costo', 'plan', 'comparar'
  ];
  
  const lowerMessage = message.toLowerCase();
  const hasSearchKeywords = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // También detectar preguntas de seguimiento
  const followUpIndicators = [
    'y el precio', 'y el costo', 'cuánto cuesta', 'qué tal',
    'y sobre', 'y qué', 'también', 'además'
  ];
  
  const isFollowUp = followUpIndicators.some(indicator => lowerMessage.includes(indicator));
  
  if (isFollowUp && history.length > 0) {
    const recentMessages = history.slice(-4).map(h => h.content.toLowerCase()).join(' ');
    const hasSearchableContext = searchKeywords.some(keyword => recentMessages.includes(keyword));
    return hasSearchableContext;
  }
  
  return hasSearchKeywords;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface GhostyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: SearchSource[];
}

export type GhostyState = 'idle' | 'thinking' | 'searching' | 'streaming' | 'error';

export const useGhostyChat = (initialMessages: GhostyMessage[] = []) => {
  const [messages, setMessages] = useState<GhostyMessage[]>(initialMessages);
  const [currentState, setCurrentState] = useState<GhostyState>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((message: Omit<GhostyMessage, 'id' | 'timestamp'>) => {
    const newMessage: GhostyMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<GhostyMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage = addMessage({
      role: 'user',
      content: content.trim(),
    });

    // Expand chat if not expanded
    if (!isExpanded) {
      setIsExpanded(true);
    }

    // Determine if likely to need search
    const mightNeedSearch = shouldLikelySearch(content.trim(), messages);
    
    // Set appropriate initial state
    setCurrentState(mightNeedSearch ? 'searching' : 'thinking');
    setError(null);

    // Add assistant message placeholder
    const assistantMessage = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
      setCurrentState('streaming');
      
      // Call Ghosty API with streaming (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch('/api/ghosty/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          history: messages, // ✅ Enviar historial completo
          stream: true,
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
      let sources: SearchSource[] | undefined;

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
              
              if (parsed.type === 'chunk') {
                currentContent += parsed.content;
                updateMessage(assistantMessage.id, {
                  content: currentContent,
                  isStreaming: true,
                });
              } else if (parsed.type === 'sources') {
                sources = parsed.sources;
                updateMessage(assistantMessage.id, {
                  sources: sources,
                });
              } else if (parsed.type === 'done') {
                updateMessage(assistantMessage.id, {
                  content: currentContent,
                  isStreaming: false,
                  sources: sources,
                });
                setCurrentState('idle');
                return;
              } else if (parsed.type === 'error') {
                throw new Error(parsed.content);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      setCurrentState('idle');
      
    } catch (err) {
      setCurrentState('error');
      let errorMessage = 'Error inesperado';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'La solicitud tardó demasiado - inténtalo de nuevo';
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Error de conexión - verifica tu internet';
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
  }, [addMessage, updateMessage, isExpanded]);

  const regenerateResponse = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;

    const userMessage = messages[messages.findIndex(m => m.id === messageId) - 1];
    if (userMessage && userMessage.role === 'user') {
      // Remove current assistant message and regenerate
      setMessages(prev => prev.filter(m => m.id !== messageId));
      sendMessage(userMessage.content);
    }
  }, [messages, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentState('idle');
    setError(null);
    setIsExpanded(false);
  }, []);

  const expandChat = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapseChat = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return {
    // State
    messages,
    currentState,
    isExpanded,
    error,
    
    // Actions
    sendMessage,
    clearChat,
    regenerateResponse,
    expandChat,
    collapseChat,
    
    // Utils
    addMessage,
    updateMessage,
  };
};