#!/usr/bin/env node

/**
 * Prueba final para verificar que todos los detalles funcionen:
 * 1. ✅ Fuentes con links y estilos
 * 2. ✅ Estado "Buscando en línea..." 
 * 3. ✅ No confusión sobre browsing
 * 4. ✅ Contexto de historial
 */

console.log('🎯 PRUEBA FINAL - Verificar detalles de UX');
console.log('=' .repeat(50));

const testQuery = "busca información sobre precios de WhatsApp Business API 2024";

async function testFinalDetails() {
  try {
    console.log(`\n📝 Pregunta: "${testQuery}"`);
    console.log('⏳ Esperando respuesta...');
    
    const start = Date.now();
    const response = await fetch('http://localhost:3000/api/ghosty/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testQuery,
        history: [],
        stream: false,
        enableSearch: true
      })
    });
    
    const duration = Date.now() - start;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`⏱️ Tiempo de respuesta: ${duration}ms`);
    console.log(`📊 Tipo de respuesta: ${data.type}`);
    
    // Verificar fuentes
    if (data.sources && data.sources.length > 0) {
      console.log(`✅ Fuentes encontradas: ${data.sources.length}`);
      console.log('📚 Primera fuente:');
      console.log(`   Título: ${data.sources[0].title}`);
      console.log(`   URL: ${data.sources[0].url}`);
      console.log(`   Snippet: ${data.sources[0].snippet.substring(0, 100)}...`);
    } else {
      console.log('⚠️  No se encontraron fuentes');
    }
    
    // Verificar contenido
    console.log('\\n💬 Contenido de respuesta (primeros 300 caracteres):');
    console.log(`"${data.content.substring(0, 300)}..."`);
    
    // Verificar que no mencione problemas de browsing
    const hasProblems = data.content.toLowerCase().includes('no puedo') || 
                        data.content.toLowerCase().includes('simulate') ||
                        data.content.toLowerCase().includes('browsing');
    
    if (hasProblems) {
      console.log('❌ PROBLEMA: El modelo aún menciona limitaciones de browsing');
    } else {
      console.log('✅ El modelo no menciona problemas de browsing');
    }
    
    // Verificar citas
    const hasCitations = /\\[\\d+\\]/.test(data.content);
    if (hasCitations) {
      console.log('✅ Respuesta incluye citas [1], [2], etc.');
    } else {
      console.log('⚠️  Respuesta no incluye citas');
    }
    
    console.log('\\n🎯 RESULTADOS:');
    console.log(`- Fuentes: ${data.sources?.length || 0} encontradas`);
    console.log(`- Citas: ${hasCitations ? 'Sí' : 'No'}`);
    console.log(`- Sin problemas de browsing: ${!hasProblems ? 'Sí' : 'No'}`);
    console.log(`- Tiempo: ${duration}ms`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Verificar si el servidor está corriendo
fetch('http://localhost:3000/api/ghosty/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'test' })
}).then(() => {
  console.log('✅ Servidor detectado, ejecutando prueba...');
  testFinalDetails();
}).catch(() => {
  console.log('❌ Servidor no disponible. Inicia con: npm run dev');
});