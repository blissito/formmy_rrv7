/**
 * Query Expansion Service
 *
 * Mejora la búsqueda semántica expandiendo la query del usuario en múltiples
 * variaciones para aumentar el recall (encontrar más resultados relevantes).
 *
 * Estrategias:
 * 1. Extracción de términos clave
 * 2. Reformulación contextual
 * 3. Queries alternativas
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Opciones para query expansion
 */
export interface QueryExpansionOptions {
  /**
   * Número máximo de queries expandidas (default: 3)
   */
  maxQueries?: number;

  /**
   * Incluir query original (default: true)
   */
  includeOriginal?: boolean;

  /**
   * Usar LLM para expansion (default: false)
   * Si false, usa expansión simple sin LLM (más rápido)
   */
  useLLM?: boolean;
}

/**
 * Resultado de query expansion
 */
export interface QueryExpansionResult {
  /**
   * Query original
   */
  original: string;

  /**
   * Queries expandidas
   */
  expanded: string[];

  /**
   * Todas las queries (original + expanded)
   */
  all: string[];
}

/**
 * Expande una query de usuario en múltiples variaciones para mejorar retrieval
 *
 * Ejemplo:
 * Input: "qué es be the nerd?"
 * Output: [
 *   "Be the Nerd",
 *   "empresa Be the Nerd servicios",
 *   "Fixter Geek Be the Nerd"
 * ]
 */
export async function expandQuery(
  query: string,
  options: QueryExpansionOptions = {}
): Promise<QueryExpansionResult> {
  const {
    maxQueries = 3,
    includeOriginal = true,
    useLLM = false // 🚀 Por defecto NO usar LLM (más rápido)
  } = options;

  // 🚀 Si no usar LLM, usar expansión simple (sin latencia)
  if (!useLLM) {
    console.log(`\n🔍 [QUERY EXPANSION] Modo simple (sin LLM): "${query}"`);
    return expandQuerySimple(query);
  }

  console.log(`\n🔍 [QUERY EXPANSION] Modo LLM: "${query}"`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3, // Baja temperatura para variaciones consistentes
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `Eres un experto en búsqueda semántica. Genera variaciones de la query del usuario para mejorar la búsqueda en una base de datos de conocimiento.

INSTRUCCIONES:
1. Extrae los términos clave (nombres propios, conceptos importantes)
2. Genera ${maxQueries} variaciones diferentes de la query:
   - Usa el término clave directo (sin preguntas)
   - Agrega contexto relevante (empresa, servicios, productos)
   - Usa sinónimos y términos relacionados
3. Cada variación debe ser concisa (5-10 palabras)
4. Retorna SOLO las variaciones, una por línea
5. NO incluyas la query original
6. NO incluyas números o prefijos

EJEMPLO:
Input: "qué es be the nerd?"
Output:
Be the Nerd
empresa Be the Nerd servicios
Fixter Geek desarrollo software`
        },
        {
          role: 'user',
          content: query
        }
      ]
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    const expanded = content
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && q !== query)
      .slice(0, maxQueries);

    console.log(`✅ [QUERY EXPANSION] Generadas ${expanded.length} variaciones:`);
    expanded.forEach((q, i) => {
      console.log(`   ${i + 1}. "${q}"`);
    });

    const all = includeOriginal ? [query, ...expanded] : expanded;

    return {
      original: query,
      expanded,
      all
    };
  } catch (error) {
    console.error('❌ [QUERY EXPANSION] Error:', error);
    // Fallback: retornar solo la query original
    return {
      original: query,
      expanded: [],
      all: [query]
    };
  }
}

/**
 * Expande query de forma simple sin LLM (fallback rápido)
 *
 * Estrategias:
 * - Remover palabras de pregunta (qué, cuál, cómo, etc.)
 * - Extraer términos en mayúsculas (nombres propios)
 * - Detectar nombres propios multi-palabra (ej: "Be the Nerd")
 * - Agregar variaciones contextuales
 */
export function expandQuerySimple(query: string): QueryExpansionResult {
  const stopWordsES = ['qué', 'que', 'cual', 'cuál', 'cómo', 'como', 'es', 'son', 'la', 'el', 'los', 'las', 'un', 'una', 'de', 'del', 'sobre', 'acerca', 'para', 'por'];
  const stopWordsEN = ['what', 'is', 'are', 'the', 'a', 'an', 'of', 'for', 'about', 'how', 'do', 'does'];
  const allStopWords = [...stopWordsES, ...stopWordsEN];

  // 1. Detectar nombres propios multi-palabra (secuencias de palabras capitalizadas)
  // Ejemplo: "qué es Be the Nerd?" → "Be the Nerd"
  const words = query.split(' ');
  let properNounSequences: string[] = [];
  let currentSequence: string[] = [];

  for (const word of words) {
    const cleanWord = word.replace(/[?¿!¡.,;:]/g, ''); // Limpiar puntuación
    if (/^[A-Z]/.test(cleanWord) && cleanWord.length > 1) {
      currentSequence.push(cleanWord);
    } else {
      if (currentSequence.length > 0) {
        properNounSequences.push(currentSequence.join(' '));
        currentSequence = [];
      }
    }
  }
  // Agregar última secuencia si existe
  if (currentSequence.length > 0) {
    properNounSequences.push(currentSequence.join(' '));
  }

  // 2. Limpiar query (remover puntuación y stop words)
  const cleaned = query
    .toLowerCase()
    .replace(/[?¿!¡.,;:]/g, '')
    .split(' ')
    .filter(word => !allStopWords.includes(word.toLowerCase()) && word.length > 2)
    .join(' ')
    .trim();

  const expanded: string[] = [];

  // Variación 1 (PRIORIDAD): Nombres propios multi-palabra (más específico)
  // Ej: "Be the Nerd" en lugar de solo "be", "the", "nerd"
  if (properNounSequences.length > 0) {
    const primaryProperNoun = properNounSequences[0]; // Primera secuencia detectada
    expanded.push(primaryProperNoun);

    // Variación 2: Nombre propio + contexto
    if (!query.toLowerCase().includes('empresa') && !query.toLowerCase().includes('servicio') && !query.toLowerCase().includes('company')) {
      expanded.push(`${primaryProperNoun} empresa`);
    }
  }

  // Variación 3: Query limpia (sin stop words)
  if (cleaned && cleaned.length > 0 && !expanded.includes(cleaned)) {
    // Solo agregar si es diferente de las variaciones anteriores
    const isUnique = !expanded.some(e => e.toLowerCase().includes(cleaned) || cleaned.includes(e.toLowerCase()));
    if (isUnique) {
      expanded.push(cleaned);
    }
  }

  console.log(`🔍 [SIMPLE EXPANSION] Original: "${query}"`);
  console.log(`🔍 [SIMPLE EXPANSION] Nombres propios: ${properNounSequences.length > 0 ? properNounSequences.join(', ') : 'ninguno'}`);
  console.log(`🔍 [SIMPLE EXPANSION] Variaciones: ${expanded.length}`);
  expanded.forEach((q, i) => {
    console.log(`   ${i + 1}. "${q}"`);
  });

  return {
    original: query,
    expanded: expanded.filter(q => q.length > 0),
    all: [query, ...expanded.filter(q => q.length > 0)]
  };
}
