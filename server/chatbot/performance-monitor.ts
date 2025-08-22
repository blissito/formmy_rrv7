/**
 * Performance Monitor para el Chatbot API
 * 
 * Sistema de monitoreo y logging estructurado para optimización de rendimiento
 */

export interface PerformanceMetrics {
  requestId: string;
  chatbotId: string;
  userId: string;
  timestamp: number;
  
  // Agent decision metrics
  agentDecisionTime: number;
  agentConfidence: number;
  agentNeedsTools: boolean;
  agentSuggestedTools: string[];
  agentReasoning: string;
  
  // Model & provider metrics
  modelRequested: string;
  modelUsed: string;
  providerUsed: string;
  usedFallback: boolean;
  
  // Performance metrics
  totalResponseTime?: number;
  firstTokenLatency?: number;
  tokensGenerated?: number;
  
  // Resource usage
  integrationQueriesCount: number;
  cacheHitRate: number;
  
  // User experience
  streamingEnabled: boolean;
  toolsExecuted: string[];
  errorOccurred: boolean;
  errorType?: string;
}

export interface ChatSessionMetrics {
  sessionId: string;
  requestCount: number;
  avgResponseTime: number;
  toolUsageRate: number;
  streamingRate: number;
  errorRate: number;
  lastActivity: number;
}

/**
 * Monitor central de performance
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private sessions: Map<string, ChatSessionMetrics> = new Map();
  private readonly MAX_METRICS_STORED = 1000;
  
  /**
   * Inicia tracking de una request
   */
  startRequest(chatbotId: string, userId: string, sessionId?: string): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize or update session metrics
    if (sessionId) {
      const session = this.sessions.get(sessionId) || {
        sessionId,
        requestCount: 0,
        avgResponseTime: 0,
        toolUsageRate: 0,
        streamingRate: 0,
        errorRate: 0,
        lastActivity: Date.now()
      };
      
      session.requestCount++;
      session.lastActivity = Date.now();
      this.sessions.set(sessionId, session);
    }
    
    return requestId;
  }
  
  /**
   * Registra métricas de decisión del agente
   */
  logAgentDecision(requestId: string, metrics: {
    chatbotId: string;
    userId: string;
    agentDecisionTime: number;
    agentConfidence: number;
    agentNeedsTools: boolean;
    agentSuggestedTools: string[];
    agentReasoning: string;
  }): void {
    const existing = this.metrics.find(m => m.requestId === requestId);
    if (existing) {
      Object.assign(existing, metrics);
    } else {
      this.metrics.push({
        requestId,
        timestamp: Date.now(),
        integrationQueriesCount: 0,
        cacheHitRate: 0,
        streamingEnabled: false,
        toolsExecuted: [],
        errorOccurred: false,
        modelRequested: '',
        modelUsed: '',
        providerUsed: '',
        usedFallback: false,
        ...metrics
      });
    }
    
    // Log structured data
    console.log(`🎯 [${requestId}] Agent Decision:`, {
      confidence: metrics.agentConfidence,
      needsTools: metrics.agentNeedsTools,
      decisionTime: `${metrics.agentDecisionTime}ms`,
      tools: metrics.agentSuggestedTools,
      reasoning: metrics.agentReasoning
    });
  }
  
  /**
   * Registra métricas de modelo y provider
   */
  logModelMetrics(requestId: string, metrics: {
    modelRequested: string;
    modelUsed: string;
    providerUsed: string;
    usedFallback: boolean;
    streamingEnabled: boolean;
  }): void {
    const existing = this.metrics.find(m => m.requestId === requestId);
    if (existing) {
      Object.assign(existing, metrics);
    }
    
    console.log(`🤖 [${requestId}] Model Selection:`, {
      requested: metrics.modelRequested,
      used: metrics.modelUsed,
      provider: metrics.providerUsed,
      fallback: metrics.usedFallback,
      streaming: metrics.streamingEnabled
    });
  }
  
  /**
   * Registra uso de recursos
   */
  logResourceUsage(requestId: string, metrics: {
    integrationQueriesCount: number;
    cacheHitRate: number;
    toolsExecuted: string[];
  }): void {
    const existing = this.metrics.find(m => m.requestId === requestId);
    if (existing) {
      Object.assign(existing, metrics);
    }
    
    if (metrics.integrationQueriesCount > 0) {
      console.log(`💾 [${requestId}] Resource Usage:`, {
        dbQueries: metrics.integrationQueriesCount,
        cacheHit: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
        toolsUsed: metrics.toolsExecuted
      });
    }
  }
  
  /**
   * Completa tracking de una request
   */
  endRequest(requestId: string, metrics: {
    totalResponseTime: number;
    firstTokenLatency?: number;
    tokensGenerated?: number;
    errorOccurred?: boolean;
    errorType?: string;
  }, sessionId?: string): void {
    const existing = this.metrics.find(m => m.requestId === requestId);
    if (existing) {
      Object.assign(existing, metrics);
    }
    
    // Update session metrics
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        session.avgResponseTime = (session.avgResponseTime * (session.requestCount - 1) + metrics.totalResponseTime) / session.requestCount;
        session.toolUsageRate = (session.toolUsageRate * (session.requestCount - 1) + (existing?.toolsExecuted.length || 0 > 0 ? 1 : 0)) / session.requestCount;
        session.streamingRate = (session.streamingRate * (session.requestCount - 1) + (existing?.streamingEnabled ? 1 : 0)) / session.requestCount;
        session.errorRate = (session.errorRate * (session.requestCount - 1) + (metrics.errorOccurred ? 1 : 0)) / session.requestCount;
        this.sessions.set(sessionId, session);
      }
    }
    
    const performanceLevel = metrics.totalResponseTime < 2000 ? '⚡' : 
                           metrics.totalResponseTime < 5000 ? '⏱️' : '🐌';
    
    console.log(`${performanceLevel} [${requestId}] Request Complete:`, {
      totalTime: `${metrics.totalResponseTime}ms`,
      tokens: metrics.tokensGenerated,
      firstToken: metrics.firstTokenLatency ? `${metrics.firstTokenLatency}ms` : 'N/A',
      error: metrics.errorOccurred ? metrics.errorType : false
    });
    
    // Cleanup old metrics
    if (this.metrics.length > this.MAX_METRICS_STORED) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS_STORED);
    }
  }
  
  /**
   * Log de warning para performance
   */
  logPerformanceWarning(requestId: string, warning: string, context?: any): void {
    console.warn(`⚠️ [${requestId}] Performance Warning: ${warning}`, context);
  }
  
  /**
   * Log de optimización sugerida
   */
  logOptimizationSuggestion(requestId: string, suggestion: string, impact: string): void {
    console.log(`💡 [${requestId}] Optimization: ${suggestion} (Impact: ${impact})`);
  }
  
  /**
   * Obtiene estadísticas agregadas
   */
  getAggregatedStats(timeWindow: number = 3600000): {
    totalRequests: number;
    avgResponseTime: number;
    avgAgentDecisionTime: number;
    toolUsageRate: number;
    streamingRate: number;
    fallbackRate: number;
    errorRate: number;
    cacheEfficiency: number;
    topModelsUsed: Array<{ model: string; count: number }>;
    topProviders: Array<{ provider: string; count: number }>;
  } {
    const now = Date.now();
    const recent = this.metrics.filter(m => now - m.timestamp < timeWindow);
    
    if (recent.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        avgAgentDecisionTime: 0,
        toolUsageRate: 0,
        streamingRate: 0,
        fallbackRate: 0,
        errorRate: 0,
        cacheEfficiency: 0,
        topModelsUsed: [],
        topProviders: []
      };
    }
    
    // Calculate aggregated metrics
    const avgResponseTime = recent.reduce((sum, m) => sum + (m.totalResponseTime || 0), 0) / recent.length;
    const avgAgentDecisionTime = recent.reduce((sum, m) => sum + m.agentDecisionTime, 0) / recent.length;
    const toolUsageRate = recent.filter(m => m.toolsExecuted.length > 0).length / recent.length;
    const streamingRate = recent.filter(m => m.streamingEnabled).length / recent.length;
    const fallbackRate = recent.filter(m => m.usedFallback).length / recent.length;
    const errorRate = recent.filter(m => m.errorOccurred).length / recent.length;
    const cacheEfficiency = recent.reduce((sum, m) => sum + m.cacheHitRate, 0) / recent.length;
    
    // Top models and providers
    const modelCounts = recent.reduce((acc, m) => {
      acc[m.modelUsed] = (acc[m.modelUsed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const providerCounts = recent.reduce((acc, m) => {
      acc[m.providerUsed] = (acc[m.providerUsed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topModelsUsed = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const topProviders = Object.entries(providerCounts)
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return {
      totalRequests: recent.length,
      avgResponseTime: Math.round(avgResponseTime),
      avgAgentDecisionTime: Math.round(avgAgentDecisionTime),
      toolUsageRate: Math.round(toolUsageRate * 100) / 100,
      streamingRate: Math.round(streamingRate * 100) / 100,
      fallbackRate: Math.round(fallbackRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheEfficiency: Math.round(cacheEfficiency * 100) / 100,
      topModelsUsed,
      topProviders
    };
  }
  
  /**
   * Cleanup de sesiones antiguas
   */
  cleanupOldSessions(maxAge: number = 24 * 3600000): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();