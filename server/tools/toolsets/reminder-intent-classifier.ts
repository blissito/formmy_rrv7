/**
 * MODERN LLM-BASED INTENT CLASSIFIER
 * Usa el mismo LLM para detectar intenciones en lugar de keywords hardcodeadas
 * Enfoque usado por la industria (OpenAI, Anthropic, etc.)
 */

export interface ReminderIntent {
  intent: 'create' | 'list' | 'update' | 'delete' | 'none';
  confidence: number;
  entities?: {
    reminderId?: string;
    title?: string;
    date?: string;
    time?: string;
    email?: string;
  };
  suggestedTool: string | null;
}

/**
 * CLASIFICADOR DE INTENCIONES USANDO LLM
 * Mucho más preciso y flexible que keywords hardcodeadas
 */
export async function classifyReminderIntent(
  message: string, 
  conversationHistory?: string[]
): Promise<ReminderIntent> {
  
  // Prompt optimizado para clasificación de intenciones
  const intentPrompt = `
You are an expert intent classifier for a reminder/calendar system. Analyze the user message and classify the intent.

INTENT CATEGORIES:
- "create": User wants to create/schedule a new reminder (agenda, recordame, avísame, programa)
- "list": User wants to see existing reminders (qué recordatorios tengo, mis citas, cuántos)  
- "update": User wants to modify an existing reminder (cambiar, actualizar, mover)
- "delete": User wants to cancel/remove a reminder (cancelar, eliminar, borrar)
- "none": Not related to reminders

CONTEXT CLUES:
- Spanish variations: "que" vs "qué", "cuanto" vs "cuánto"  
- Informal language: "tengo recordatorios?", "hay citas?"
- Commands: "muéstrame", "dime", "lista"
- Time references: "mañana", "próximo", "cambiar a las 3pm"

USER MESSAGE: "${message}"

Respond with JSON only:
{
  "intent": "list|create|update|delete|none",
  "confidence": 0.0-1.0,
  "entities": {
    "title": "extracted title if any",
    "date": "extracted date if any", 
    "time": "extracted time if any",
    "reminderId": "if updating/deleting specific reminder"
  }
}`;

  try {
    // Usar el modelo más rápido y barato para clasificación
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Más barato y rápido para clasificación
        messages: [
          { role: 'system', content: 'You are an expert intent classifier. Respond only with valid JSON.' },
          { role: 'user', content: intentPrompt }
        ],
        max_tokens: 200,
        temperature: 0.1, // Baja temperature para consistencia
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Mapear intent a herramienta sugerida
    const toolMapping = {
      'create': 'schedule_reminder',
      'list': 'list_reminders', 
      'update': 'update_reminder',
      'delete': 'cancel_reminder',
      'none': null
    };

    return {
      intent: result.intent,
      confidence: result.confidence,
      entities: result.entities || {},
      suggestedTool: toolMapping[result.intent as keyof typeof toolMapping]
    };

  } catch (error) {
    console.error('❌ LLM Intent Classification failed:', error);
    
    // Fallback a keywords simples
    return fallbackKeywordClassification(message);
  }
}

/**
 * FALLBACK: Keywords básicos si el LLM falla
 * Solo como respaldo de emergencia
 */
function fallbackKeywordClassification(message: string): ReminderIntent {
  const messageLC = message.toLowerCase();
  
  // Patterns simples para fallback
  if (messageLC.includes('recordatorios tengo') || messageLC.includes('mis citas')) {
    return { intent: 'list', confidence: 0.8, suggestedTool: 'list_reminders' };
  }
  
  if (messageLC.includes('agenda') || messageLC.includes('recordame')) {
    return { intent: 'create', confidence: 0.7, suggestedTool: 'schedule_reminder' };
  }
  
  if (messageLC.includes('cambiar') || messageLC.includes('actualizar')) {
    return { intent: 'update', confidence: 0.6, suggestedTool: 'update_reminder' };
  }
  
  if (messageLC.includes('cancelar') || messageLC.includes('eliminar')) {
    return { intent: 'delete', confidence: 0.6, suggestedTool: 'cancel_reminder' };
  }
  
  return { intent: 'none', confidence: 0.1, suggestedTool: null };
}

/**
 * CACHE SIMPLE para evitar clasificaciones repetidas
 */
const intentCache = new Map<string, { result: ReminderIntent; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function classifyReminderIntentCached(message: string): Promise<ReminderIntent> {
  const cacheKey = message.toLowerCase().trim();
  const cached = intentCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.result;
  }
  
  const result = await classifyReminderIntent(message);
  intentCache.set(cacheKey, { result, timestamp: Date.now() });
  
  return result;
}