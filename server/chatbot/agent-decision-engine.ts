/**
 * Agent Decision Engine
 * 
 * Sistema inteligente de toma de decisiones para el chatbot que optimiza:
 * - Detección eficiente de necesidad de herramientas
 * - Decisiones de streaming vs non-streaming
 * - Caching de estado para reducir latencia
 */

import { db } from "~/utils/db.server";
import { detectReminderIntentSync } from "../tools/toolsets/reminder-toolset";
import { classifyReminderIntentCached } from "../tools/toolsets/reminder-intent-classifier";

// Types & Interfaces
export interface AgentDecision {
  needsTools: boolean;
  confidence: number; // 0-100
  suggestedTools: string[];
  shouldStream: boolean;
  reasoning: string;
  detectionTime: number;
}

export enum AgentMode {
  CHAT = 'chat',           // Conversación normal, streaming
  TOOLS = 'tools',         // Herramientas requeridas, non-streaming
  HYBRID = 'hybrid'        // Puede usar tools opcionalmente, streaming
}

export interface ToolContext {
  chatbotId: string;
  userId: string;
  userPlan: string;
  hasStripeIntegration?: boolean;
  modelSupportsTools?: boolean;
}

export interface DecisionCache {
  [key: string]: {
    result: AgentDecision;
    timestamp: number;
    ttl: number; // Time to live in ms
  };
}

/**
 * Engine principal para decisiones del agente
 */
export class AgentDecisionEngine {
  private cache: DecisionCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  
  /**
   * Análisis inteligente con LLM + keywords de fallback
   */
  private async quickToolScan(message: string): Promise<{ detected: boolean; keywords: string[]; confidence: number }> {
    console.log(`🔍 QUICK TOOL SCAN: Starting with message "${message}"`);
    const messageLC = message.toLowerCase();
    const detectedKeywords: string[] = [];
    
    // Payment indicators (high confidence)
    const paymentKeywords = [
      'link de pago', 'payment link', 'generar pago', 'crear cobro',
      'stripe', 'factura', 'invoice', 'checkout'
    ];
    
    // Amount indicators (very high confidence) 
    const amountPatterns = [
      /\$\d+/,
      /\d+\s*(pesos|dolares|usd|mxn)/i,
      /\d+\s*\$$/,
    ];
    
    // Commercial intent (medium confidence)
    const commercialKeywords = [
      'quiero contratar', 'necesito pagar', 'como puedo pagar',
      'proceder con el pago', 'generar link', 'crear link'
    ];
    
    
    // Contact information patterns (high confidence)
    const contactPatterns = [
      /mi nombre es\s+[\w\s]+/i,
      /soy\s+[\w\s]+\s+(de|en)\s+[\w\s]+/i,
      /mi email es\s+[\w.-]+@[\w.-]+/i,
      /mi correo es\s+[\w.-]+@[\w.-]+/i,
      /trabajo en\s+[\w\s]+/i,
      /empresa\s+[\w\s]+/i,
      /mi teléfono es\s+[\d\s\-\+\(\)]+/i,
    ];
    
    const contactKeywords = [
      'mi nombre', 'me llamo', 'soy', 'trabajo en', 'empresa',
      'mi email', 'mi correo', 'mi teléfono', 'contactarme'
    ];
    
    let confidence = 0;
    
    // REMINDER TOOLSET - Detección con LLM inteligente (más preciso que keywords)
    console.log(`🔍 DEBUG: Llamando classifyReminderIntentCached con mensaje: "${message}"`);
    try {
      const reminderIntent = await classifyReminderIntentCached(message);
      console.log(`🔍 DEBUG: Resultado de classifyReminderIntentCached:`, reminderIntent);
      console.log(`🎯 REMINDER INTENT DEBUG:`, {
        message: message.substring(0, 50),
        intent: reminderIntent.intent,
        confidence: reminderIntent.confidence,
        suggestedTool: reminderIntent.suggestedTool,
        entities: reminderIntent.entities
      });
      
      if (reminderIntent.intent !== 'none' && reminderIntent.confidence > 0.5) {
        detectedKeywords.push(`llm_intent_${reminderIntent.intent}`);
        confidence += reminderIntent.confidence * 100; // Convertir 0-1 a 0-100
      }
    } catch (error) {
      console.warn('⚠️ LLM classifier failed, falling back to keywords:', error.message);
      // Fallback a detección por keywords MEJORADA
      const reminderIntent = detectReminderIntentSync(message);
      console.log(`🔍 DEBUG: Fallback resultado detectReminderIntentSync:`, reminderIntent);
      
      if (reminderIntent.needsTools) {
        detectedKeywords.push(...reminderIntent.keywords);
        confidence += reminderIntent.confidence;
        
        // Mapear directamente la intención sugerida como keyword LLM
        if (reminderIntent.suggestedTool) {
          const intentMap = {
            'list_reminders': 'list',
            'schedule_reminder': 'create',
            'update_reminder': 'update', 
            'cancel_reminder': 'delete'
          };
          const intentType = intentMap[reminderIntent.suggestedTool as keyof typeof intentMap];
          if (intentType) {
            detectedKeywords.push(`llm_intent_${intentType}`);
            console.log(`🎯 KEYWORD FALLBACK: Mapped ${reminderIntent.suggestedTool} to llm_intent_${intentType}`);
          }
        }
      }
    }
    
    // Check payment keywords (40-60 confidence)
    for (const keyword of paymentKeywords) {
      if (messageLC.includes(keyword)) {
        detectedKeywords.push(keyword);
        confidence += 40;
      }
    }
    
    // Check amount patterns (very high confidence +60)
    for (const pattern of amountPatterns) {
      if (pattern.test(message)) {
        detectedKeywords.push('amount_detected');
        confidence += 60;
        break;
      }
    }
    
    // Check commercial intent (+30)
    for (const keyword of commercialKeywords) {
      if (messageLC.includes(keyword)) {
        detectedKeywords.push(keyword);
        confidence += 30;
      }
    }
    
    // Reminder toolset already processed above with modular detection
    
    // Check contact patterns (very high confidence +50)
    for (const pattern of contactPatterns) {
      if (pattern.test(message)) {
        detectedKeywords.push('contact_pattern_detected');
        confidence += 50;
        break;
      }
    }
    
    // Check contact keywords (+35)
    for (const keyword of contactKeywords) {
      if (messageLC.includes(keyword)) {
        detectedKeywords.push(keyword);
        confidence += 35;
        break; // Solo uno para evitar inflar demasiado
      }
    }
    
    // Cap confidence at 100
    confidence = Math.min(confidence, 100);
    
    return {
      detected: detectedKeywords.length > 0,
      keywords: detectedKeywords,
      confidence
    };
  }
  
  /**
   * Análisis profundo con contexto (solo si quick scan es positivo)
   */
  private async deepToolAnalysis(
    message: string, 
    context: ToolContext,
    quickScanResult: ReturnType<typeof this.quickToolScan>
  ): Promise<{ confidence: number; suggestedTools: string[]; reasoning: string }> {
    const messageLC = message.toLowerCase();
    let confidence = quickScanResult.confidence;
    const suggestedTools: string[] = [];
    const reasoning: string[] = [];
    
    // Context-aware analysis
    
    // LLM Intent Results (highest priority)
    if (quickScanResult.keywords.some(k => k.startsWith('llm_intent_'))) {
      const llmIntentKeyword = quickScanResult.keywords.find(k => k.startsWith('llm_intent_'));
      const intentType = llmIntentKeyword?.split('_')[2]; // Extract 'list', 'create', etc.
      
      const intentToolMapping = {
        'list': 'list_reminders',
        'create': 'schedule_reminder', 
        'update': 'update_reminder',
        'delete': 'cancel_reminder'
      };
      
      const suggestedTool = intentToolMapping[intentType as keyof typeof intentToolMapping];
      if (suggestedTool) {
        suggestedTools.push(suggestedTool);
        confidence += 25; // High boost for LLM classification
        reasoning.push(`LLM classified intent as ${intentType}`);
      }
    }
    
    // Stripe analysis  
    if (context.hasStripeIntegration && quickScanResult.keywords.some(k => 
      ['link de pago', 'stripe', 'generar pago', 'amount_detected'].includes(k)
    )) {
      suggestedTools.push('create_payment_link');
      confidence += 15; // Boost confidence when Stripe is available
      reasoning.push('Stripe integration available + payment intent detected');
    }
    
    if (quickScanResult.keywords.some(k => 
      ['agendar', 'agendar cita', 'calendario', 'schedule', 'recordatorio', 
       'cita para', 'reunión', 'programar', 'programé', 'recordar',
       'agenda', 'envíame recordatorio', 'envíame un recordatorio', 
       'mándame recordatorio', 'ponme recordatorio', 'recordame', 'recuerdame',
       'avísame', 'notifícame'].includes(k)
    )) {
      suggestedTools.push('schedule_reminder');
      
      // Extra confidence for high-confidence scheduling keywords
      const hasHighConfidenceScheduling = quickScanResult.keywords.some(k => 
        ['agenda', 'envíame recordatorio', 'envíame un recordatorio', 
         'mándame recordatorio', 'ponme recordatorio', 'recordame', 'recuerdame',
         'avísame', 'notifícame'].includes(k)
      );
      
      confidence += hasHighConfidenceScheduling ? 20 : 10;
      reasoning.push(hasHighConfidenceScheduling ? 
        'High confidence scheduling intent detected' : 
        'Scheduling intent detected');
    }
    
    if (quickScanResult.keywords.some(k => 
      ['contact_pattern_detected', 'mi nombre', 'me llamo', 'soy', 'trabajo en', 'empresa', 'mi email', 'mi correo', 'mi teléfono', 'contactarme'].includes(k)
    )) {
      suggestedTools.push('save_contact_info');
      confidence += 15;
      reasoning.push('Contact information shared');
    }
    
    // Plan-based adjustments
    if (context.userPlan === 'FREE') {
      confidence = Math.max(0, confidence - 30); // Reduce confidence for free users
      reasoning.push('FREE plan - tools limited');
    } else if (context.userPlan === 'ENTERPRISE') {
      confidence += 5; // Slight boost for enterprise
      reasoning.push('ENTERPRISE plan - full tool access');
    }
    
    // Model capability check
    if (!context.modelSupportsTools && suggestedTools.length > 0) {
      confidence = Math.max(0, confidence - 40);
      reasoning.push('Model does not support tools');
    }
    
    return {
      confidence: Math.min(confidence, 100),
      suggestedTools,
      reasoning: reasoning.join('; ')
    };
  }
  
  /**
   * Genera clave de cache basada en contexto y mensaje
   */
  private generateCacheKey(message: string, context: ToolContext): string {
    const messageHash = message.toLowerCase().substring(0, 50).replace(/\s+/g, '-');
    return `${context.chatbotId}-${context.userPlan}-${context.modelSupportsTools}-${messageHash}`;
  }
  
  /**
   * Limpia cache expirado
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.cache)) {
      if (now - entry.timestamp > entry.ttl) {
        delete this.cache[key];
      }
    }
  }
  
  /**
   * Decisión principal del engine
   */
  async makeDecision(message: string, context: ToolContext): Promise<AgentDecision> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(message, context);
    const cached = this.cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        ...cached.result,
        detectionTime: Date.now() - startTime
      };
    }
    
    // Quick scan first (always runs)
    const quickScan = await this.quickToolScan(message);
    
    let decision: AgentDecision;
    
    if (!quickScan.detected || quickScan.confidence < 20) {
      // No tools detected or very low confidence - fast path
      decision = {
        needsTools: false,
        confidence: 0,
        suggestedTools: [],
        shouldStream: true,  // Default to streaming
        reasoning: 'No tool indicators detected',
        detectionTime: Date.now() - startTime
      };
    } else {
      // Deep analysis required
      const deepAnalysis = await this.deepToolAnalysis(message, context, quickScan);
      
      decision = {
        needsTools: deepAnalysis.confidence >= 60, // High confidence threshold
        confidence: deepAnalysis.confidence,
        suggestedTools: deepAnalysis.suggestedTools,
        shouldStream: deepAnalysis.confidence < 70, // Stream unless very confident about tools
        reasoning: deepAnalysis.reasoning,
        detectionTime: Date.now() - startTime
      };
    }
    
    // Cache result
    this.cache[cacheKey] = {
      result: decision,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };
    
    // Cleanup old cache entries periodically
    if (Math.random() < 0.1) { // 10% chance
      this.cleanupCache();
    }
    
    return decision;
  }
  
  /**
   * Lazy loading de integrations - solo consulta cuando es necesario
   */
  async getIntegrationsIfNeeded(chatbotId: string, needsTools: boolean, suggestedTools: string[]): Promise<{
    stripe?: any;
  }> {
    if (!needsTools || suggestedTools.length === 0) {
      return {};
    }
    
    const integrations: any = {};
    
    // Solo consultar Stripe si realmente se sugiere
    if (suggestedTools.includes('create_payment_link')) {
      try {
        const stripeIntegration = await db.integration.findFirst({
          where: {
            chatbotId,
            platform: "STRIPE",
            isActive: true,
            stripeApiKey: {
              not: null
            }
          },
        });
        
        if (stripeIntegration) {
          integrations.stripe = stripeIntegration;
        }
      } catch (error) {
        console.warn("⚠️ Error loading Stripe integration:", error);
      }
    }
    
    return integrations;
  }
  
  /**
   * Estadísticas de performance del engine
   */
  getStats(): {
    cacheHits: number;
    cacheMisses: number;
    avgDecisionTime: number;
    cacheSize: number;
  } {
    // Esta sería implementación básica - en producción usar métricas más sofisticadas
    return {
      cacheHits: Object.keys(this.cache).length,
      cacheMisses: 0, // TODO: implementar contador
      avgDecisionTime: 0, // TODO: implementar promedio
      cacheSize: Object.keys(this.cache).length
    };
  }
}

// Export singleton instance
export const agentEngine = new AgentDecisionEngine();