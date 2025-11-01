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
  // 🆕 Metadata para fuentes de RAG (archivos/documentos)
  fileName?: string;
  score?: number;
  chunkIndex?: number;
  contextType?: 'FILE' | 'LINK' | 'TEXT' | 'QUESTION';
}

export type MessageRole = 'user' | 'assistant';

export interface GhostyMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: SearchSource[];
  toolsUsed?: string[];
}

export type GhostyState = 'idle' | 'thinking' | 'streaming' | 'tool-execution' | 'error';

export const useGhostyV0Chat = (initialMessages: GhostyMessage[] = []) => {
  const [messages, setMessages] = useState<GhostyMessage[]>(initialMessages);
  const [currentState, setCurrentState] = useState<GhostyState>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<string | null>(null);

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

  const sendMessage = useCallback(async (content: string, integrations: Record<string, any> = {}) => {
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

    // Set initial state
    setCurrentState('thinking');
    setError(null);
    setCurrentTool(null);

    // Add assistant message placeholder
    const assistantMessage = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
      toolsUsed: []
    });

    try {
      // Call Ghosty v0 API with streaming
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout para tools

      const response = await fetch('/api/ghosty/v0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          stream: true,
          integrations
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
      const toolsUsed: string[] = [];
      let ragSources: any[] = []; // Para almacenar fuentes de RAG (search_context)

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
                if (parsed.status === 'thinking') {
                  setCurrentState('thinking');
                } else if (parsed.status === 'streaming') {
                  setCurrentState('streaming');
                }
              } else if (parsed.type === 'tool-start') {
                setCurrentState('tool-execution');
                setCurrentTool(parsed.tool);
                if (!toolsUsed.includes(parsed.tool)) {
                  toolsUsed.push(parsed.tool);
                }
              } else if (parsed.type === 'sources') {
                // 🔍 Handler para fuentes de RAG (search_context)
                ragSources = parsed.sources || [];
              } else if (parsed.type === 'chunk') {
                setCurrentState('streaming');
                setCurrentTool(null);
                currentContent += parsed.content;
                updateMessage(assistantMessage.id, {
                  content: currentContent,
                  isStreaming: true,
                  toolsUsed: [...toolsUsed]
                });
              } else if (parsed.type === 'done') {
                // Convertir fuentes de RAG al formato SearchSource
                const formattedSources: SearchSource[] = ragSources.map((source: any) => {
                  // Priorizar fileName > title > url para el título
                  const displayTitle = source.metadata?.fileName ||
                                      source.metadata?.title ||
                                      source.metadata?.url ||
                                      'Documento';

                  return {
                    title: displayTitle,
                    url: source.metadata?.url || '#',
                    snippet: source.text || '',
                    fileName: source.metadata?.fileName,
                    score: source.score,
                    chunkIndex: source.metadata?.chunkIndex,
                    contextType: source.metadata?.source || 'FILE'
                  };
                });

                updateMessage(assistantMessage.id, {
                  content: currentContent,
                  isStreaming: false,
                  toolsUsed: [...toolsUsed],
                  sources: formattedSources.length > 0 ? formattedSources : undefined
                });
                setCurrentState('idle');
                setCurrentTool(null);
                return;
              } else if (parsed.type === 'complete') {
                // Final completion signal
                setCurrentState('idle');
                setCurrentTool(null);
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
      setCurrentTool(null);

    } catch (err) {
      setCurrentState('error');
      setCurrentTool(null);
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
    setCurrentTool(null);
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
    currentTool,

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