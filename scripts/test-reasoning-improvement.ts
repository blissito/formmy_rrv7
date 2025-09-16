/**
 * Test para mejorar capacidades de razonamiento explícito del agente
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

const enhancedChatbot = {
  id: '66f6a7b8c1234567890abcdf',
  name: 'Enhanced Reasoning Bot',
  aiModel: 'gpt-5-nano',
  temperature: 1,
  instructions: `Eres un asistente inteligente que SIEMPRE explica su razonamiento paso a paso.

REGLAS CRÍTICAS DE RAZONAMIENTO:
1. SIEMPRE explica por qué tomas cada decisión
2. MUESTRA tu proceso de pensamiento antes de actuar
3. JUSTIFICA las fechas, horarios y opciones que eliges
4. USA formato: "Analizando... → Decidiendo... → Ejecutando..."`,
  customInstructions: `Cuando tengas que elegir fechas o resolver problemas complejos:

1. **ANALIZA** las restricciones dadas
2. **EVALÚA** las opciones disponibles
3. **EXPLICA** por qué eliges esa opción
4. **EJECUTA** la herramienta
5. **CONFIRMA** el resultado

Ejemplo: "Analizando tus restricciones: después del 18/09, antes del 25/09, martes o miércoles, horario 9am-5pm. Las opciones son: martes 23/09 o miércoles 24/09. Elijo martes 23/09 porque..."`,
  integrations: {}
};

const realUser = {
  id: '66f6a7b8c1234567890abcde',
  plan: 'PRO',
  email: 'test@formmy.app'
};

async function testReasoningImprovement() {
  console.log('🧠 TESTING ENHANCED REASONING CAPABILITIES\n');

  // Test 1: Problema complejo de optimización
  console.log('--- Test 1: Optimización Compleja ---');
  const optimizationMessage = `
    Ayúdame a optimizar mi semana. Tengo estas restricciones:
    - Reunión importante debe ser lunes, martes o miércoles
    - No puedo reuniones después de las 4pm los lunes
    - Los martes son mejores para reuniones largas
    - Prefiero las mañanas para temas importantes
    - Necesito 2 horas para preparar antes de cualquier reunión

    Programa: 1) La reunión de presupuesto (2 horas) y 2) El tiempo de preparación.
    Explica paso a paso tu razonamiento.
  `;

  try {
    console.log(`🧠 Complex optimization: "${optimizationMessage.trim().substring(0, 100)}..."`);

    const result = await chatWithLlamaIndexV2(
      optimizationMessage.trim(),
      enhancedChatbot,
      realUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('\n📊 REASONING RESULT:');
    console.log('- Tools used:', result.toolsUsed?.length || 0);
    console.log('- Processing time:', result.processingTime);
    console.log('- Content length:', result.content?.length || 0);

    console.log('\n💭 REASONING ANALYSIS:');
    console.log(result.content);

    // Analizar calidad del razonamiento
    const reasoningIndicators = [
      result.content?.includes('Analizando'),
      result.content?.includes('porque'),
      result.content?.includes('restricciones'),
      result.content?.includes('opciones'),
      result.content?.includes('elijo') || result.content?.includes('decido'),
      result.content?.includes('martes') && result.content?.includes('mejor'),
      result.content?.includes('preparación')
    ];

    const reasoningScore = reasoningIndicators.filter(Boolean).length;
    console.log(`\n🎯 REASONING SCORE: ${reasoningScore}/7`);

    if (reasoningScore >= 5) {
      console.log('✅ EXCELLENT: Agent shows detailed reasoning');
    } else if (reasoningScore >= 3) {
      console.log('⚠️ GOOD: Agent shows some reasoning');
    } else {
      console.log('❌ POOR: Agent lacks reasoning explanation');
    }

    // Verificar acciones en BD
    const { db } = await import('../app/utils/db.server');
    const recentActions = await db.scheduledAction.findMany({
      where: {
        chatbotId: enhancedChatbot.id,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n💾 Actions created: ${recentActions.length}`);
    for (const action of recentActions) {
      const data = action.data as any;
      console.log(`- ${data.title}: ${data.date}`);
    }

  } catch (error) {
    console.error('❌ Reasoning test failed:', error);
  }

  console.log('\n');

  // Test 2: Decisión con múltiples criterios
  console.log('--- Test 2: Decisión Multi-Criterio ---');
  const multiCriteriaMessage = `
    Necesito elegir entre 3 opciones para mi reunión semanal:

    Opción A: Lunes 10am (sala pequeña disponible, pero hay tráfico)
    Opción B: Martes 2pm (sala grande disponible, hora post-almuerzo)
    Opción C: Miércoles 9am (sala mediana, mejor día para decisiones)

    Evalúa cada opción según: disponibilidad, productividad, logística.
    Dame tu recomendación con razonamiento completo y programa la elegida.
  `;

  try {
    console.log(`🎯 Multi-criteria decision: "${multiCriteriaMessage.trim().substring(0, 80)}..."`);

    const result = await chatWithLlamaIndexV2(
      multiCriteriaMessage.trim(),
      enhancedChatbot,
      realUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('\n📊 DECISION RESULT:');
    console.log('- Processing time:', result.processingTime);
    console.log('- Tools used:', result.toolsUsed?.length || 0);

    console.log('\n🎯 DECISION ANALYSIS:');
    console.log(result.content);

    // Analizar estructura de decisión
    const decisionStructure = [
      result.content?.includes('Opción A') || result.content?.includes('Lunes'),
      result.content?.includes('Opción B') || result.content?.includes('Martes'),
      result.content?.includes('Opción C') || result.content?.includes('Miércoles'),
      result.content?.includes('evalú') || result.content?.includes('analiz'),
      result.content?.includes('recomend') || result.content?.includes('mejor'),
      result.content?.includes('porque') || result.content?.includes('ya que'),
      result.content?.includes('productividad') || result.content?.includes('logística')
    ];

    const structureScore = decisionStructure.filter(Boolean).length;
    console.log(`\n📋 DECISION STRUCTURE: ${structureScore}/7`);

    if (structureScore >= 5) {
      console.log('✅ EXCELLENT: Systematic decision-making');
    } else if (structureScore >= 3) {
      console.log('⚠️ GOOD: Some systematic approach');
    } else {
      console.log('❌ POOR: Lacks systematic evaluation');
    }

  } catch (error) {
    console.error('❌ Decision test failed:', error);
  }

  console.log('\n🧠 Enhanced reasoning testing completed');
}

testReasoningImprovement().catch(console.error);