import { useState, useCallback } from 'react';


export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  image?: string;
  siteName?: string;
  publishedTime?: string;
  images?: string[]; // Galería que se carga después
}
export type MessageRole = 'user' | 'assistant';

export interface GhostyMessage {
  id: string;
  role: MessageRole;
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

  const loadImagesForSources = useCallback(async (messageId: string, sources: SearchSource[]) => {
    try {
      const urls = sources.map(s => s.url);
      
      const response = await fetch('/api/ghosty/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'extract-images',
          data: {
            urls,
            maxImagesPerUrl: 4
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.galleries) {
          // Mapear las galerías a las fuentes
          const updatedSources = sources.map(source => {
            const gallery = data.galleries.find((g: any) => g.url === source.url);
            return {
              ...source,
              images: gallery?.images || []
            };
          });

          updateMessage(messageId, { sources: updatedSources });
        }
      }
    } catch (error) {
      console.warn('Failed to load images for sources:', error);
    }
  }, [updateMessage]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Capturar el historial ANTES de agregar los nuevos mensajes
    const conversationHistory = messages
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      .filter(msg => msg.content && msg.content.trim()); // Filtrar mensajes vacíos
    
    // Add user message
    const userMessage = addMessage({
      role: 'user',
      content: content.trim(),
    });

    // Expand chat if not expanded
    if (!isExpanded) {
      setIsExpanded(true);
    }

    // Set initial state - let the LLM decide if it needs tools
    setCurrentState('thinking');
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

      const response = await fetch('/api/ghosty/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          history: conversationHistory,
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
              
              if (parsed.type === 'status') {
                // Handle status updates (thinking, searching, etc.)
                if (parsed.status === 'thinking') {
                  setCurrentState('thinking');
                } else if (parsed.status === 'searching') {
                  setCurrentState('searching');
                }
              } else if (parsed.type === 'chunk') {
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
              } else if (parsed.type === 'metadata') {
                // Handle tools used metadata
                if (parsed.toolsUsed?.includes('web_search')) {
                  setCurrentState('searching');
                }
              } else if (parsed.type === 'done') {
                updateMessage(assistantMessage.id, {
                  content: currentContent,
                  isStreaming: false,
                  sources: sources,
                });
                setCurrentState('idle');
                
                // Cargar imágenes en background después de completar la respuesta
                if (sources && sources.length > 0) {
                  setTimeout(() => {
                    loadImagesForSources(assistantMessage.id, sources);
                  }, 100);
                }
                
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
  }, [messages, addMessage, updateMessage, isExpanded]);

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
    loadImagesForSources,
  };
};