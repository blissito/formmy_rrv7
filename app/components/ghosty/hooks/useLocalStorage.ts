import { useState, useEffect, useCallback } from 'react';
import type { GhostyMessage } from './useGhostyChat';

const CHAT_STORAGE_KEY = 'ghosty-chat-history';
const MAX_MESSAGES = 50; // máximo 50 mensajes
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB máximo

interface ChatHistory {
  messages: GhostyMessage[];
  lastCleanup: string;
  version: string;
}

const CURRENT_VERSION = '1.0.0';

export const useLocalStorage = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStorageSize = useCallback(() => {
    if (!isClient) return 0;
    
    try {
      const data = localStorage.getItem(CHAT_STORAGE_KEY);
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  }, [isClient]);

  const cleanupHistory = useCallback((history: ChatHistory): ChatHistory => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Keep last 50 messages OR messages from last 7 days
    const recentMessages = history.messages
      .filter(msg => new Date(msg.timestamp) > sevenDaysAgo)
      .slice(-MAX_MESSAGES);

    return {
      ...history,
      messages: recentMessages,
      lastCleanup: now.toISOString(),
    };
  }, []);

  const saveToStorage = useCallback((messages: GhostyMessage[]) => {
    if (!isClient) return;

    try {
      const history: ChatHistory = {
        messages,
        lastCleanup: new Date().toISOString(),
        version: CURRENT_VERSION,
      };

      // Auto-cleanup if needed
      const cleanHistory = cleanupHistory(history);
      const data = JSON.stringify(cleanHistory);

      // Check size before saving
      if (new Blob([data]).size > MAX_STORAGE_SIZE) {
        // Emergency cleanup: keep only last 20 messages
        const emergencyHistory = {
          ...cleanHistory,
          messages: messages.slice(-20),
        };
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(emergencyHistory));
        console.warn('Ghosty: Emergency cleanup applied due to storage size limit');
      } else {
        localStorage.setItem(CHAT_STORAGE_KEY, data);
      }
    } catch (error) {
      console.error('Ghosty: Error saving to localStorage:', error);
      
      // If storage is full, try emergency cleanup
      try {
        const emergencyHistory: ChatHistory = {
          messages: messages.slice(-10), // Keep only last 10 messages
          lastCleanup: new Date().toISOString(),
          version: CURRENT_VERSION,
        };
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(emergencyHistory));
        console.warn('Ghosty: Emergency cleanup applied due to storage error');
      } catch {
        console.error('Ghosty: Could not save even emergency history');
      }
    }
  }, [isClient, cleanupHistory]);

  const loadFromStorage = useCallback((): GhostyMessage[] => {
    if (!isClient) return [];

    try {
      const data = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!data) return [];

      const history: ChatHistory = JSON.parse(data);
      
      // Version check for future migrations
      if (history.version !== CURRENT_VERSION) {
        console.log('Ghosty: Version mismatch, clearing history');
        localStorage.removeItem(CHAT_STORAGE_KEY);
        return [];
      }

      // Auto-cleanup on load if needed
      const now = new Date();
      const lastCleanup = new Date(history.lastCleanup);
      const daysSinceCleanup = (now.getTime() - lastCleanup.getTime()) / (24 * 60 * 60 * 1000);

      if (daysSinceCleanup > 1) { // Cleanup every day
        const cleanHistory = cleanupHistory(history);
        saveToStorage(cleanHistory.messages);
        return cleanHistory.messages;
      }

      // Convert timestamp strings back to Date objects
      return history.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

    } catch (error) {
      console.error('Ghosty: Error loading from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return [];
    }
  }, [isClient, cleanupHistory, saveToStorage]);

  const clearStorage = useCallback(() => {
    if (!isClient) return;
    
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (error) {
      console.error('Ghosty: Error clearing localStorage:', error);
    }
  }, [isClient]);

  const exportChat = useCallback((messages: GhostyMessage[]): string => {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, []);

  const exportAsMarkdown = useCallback((messages: GhostyMessage[]): string => {
    const now = new Date();
    let markdown = `# Conversación con Ghosty\n\n`;
    markdown += `**Exportado:** ${now.toLocaleString('es-ES')}\n\n`;
    markdown += `---\n\n`;

    messages.forEach(msg => {
      const time = msg.timestamp.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      if (msg.role === 'user') {
        markdown += `## 👤 Usuario (${time})\n\n${msg.content}\n\n`;
      } else {
        markdown += `## 👻 Ghosty (${time})\n\n${msg.content}\n\n`;
      }
    });

    return markdown;
  }, []);

  return {
    // Client-side ready
    isClient,
    
    // Storage operations
    saveToStorage,
    loadFromStorage,
    clearStorage,
    
    // Export functions
    exportChat,
    exportAsMarkdown,
    
    // Utils
    getStorageSize,
  };
};