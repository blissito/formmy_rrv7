/**
 * Ultra Debug: Analizar TODO el flujo de metadata de embeddings
 * Encontrar exactamente qué está causando "Unknown"
 */

import { db } from '~/utils/db.server';

async function main() {
  console.log('\n🔬 === ULTRA DEBUG: METADATA DE EMBEDDINGS ===\n');

  try {
    const CHATBOT_ID = '68f456dca443330f35f8c81d';

    // 1. Obtener TODOS los embeddings con metadata completa
    const embeddings = await db.embedding.findMany({
      where: { chatbotId: CHATBOT_ID },
      select: {
        id: true,
        chatbotId: true,
        content: true,
        metadata: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total embeddings: ${embeddings.length}\n`);

    // 2. Analizar cada embedding
    console.log('📋 ANÁLISIS DETALLADO:\n');
    console.log('='.repeat(80) + '\n');

    const analysis = {
      withAllMetadata: 0,
      withFileName: 0,
      withTitle: 0,
      withUrl: 0,
      withNone: 0,
      byContextType: {} as Record<string, number>,
      problematic: [] as any[]
    };

    embeddings.forEach((emb, idx) => {
      const meta = emb.metadata as any;

      const hasFileName = meta?.fileName !== null && meta?.fileName !== undefined;
      const hasTitle = meta?.title !== null && meta?.title !== undefined;
      const hasUrl = meta?.url !== null && meta?.url !== undefined;
      const contextType = meta?.contextType || 'NO_TYPE';

      // Contar por tipo
      analysis.byContextType[contextType] = (analysis.byContextType[contextType] || 0) + 1;

      // Contar metadata presente
      if (hasFileName) analysis.withFileName++;
      if (hasTitle) analysis.withTitle++;
      if (hasUrl) analysis.withUrl++;

      // Determinar si tendría nombre válido con nuestro helper
      const wouldShowAs = hasFileName ? meta.fileName
        : hasTitle ? meta.title
        : hasUrl ? meta.url
        : 'Unknown';

      if (wouldShowAs === 'Unknown') {
        analysis.withNone++;
        analysis.problematic.push({
          index: idx,
          id: emb.id,
          contextType,
          chunkIndex: meta?.chunkIndex,
          contextId: meta?.contextId,
          metadata: meta,
          contentPreview: emb.content?.substring(0, 100)
        });
      } else {
        analysis.withAllMetadata++;
      }

      // Mostrar los primeros 3 y último para ver patrón
      if (idx < 3 || idx === embeddings.length - 1) {
        console.log(`[${idx + 1}/${embeddings.length}] Chunk ${meta?.chunkIndex ?? 'N/A'}`);
        console.log(`   Type: ${contextType}`);
        console.log(`   Would show as: "${wouldShowAs}"`);
        console.log(`   Metadata keys: ${Object.keys(meta || {}).join(', ')}`);
        console.log(`   - fileName: ${hasFileName ? `"${meta.fileName}"` : 'NO'}`);
        console.log(`   - title: ${hasTitle ? `"${meta.title}"` : 'NO'}`);
        console.log(`   - url: ${hasUrl ? `"${meta.url}"` : 'NO'}`);
        console.log(`   Content: ${emb.content?.substring(0, 60)}...`);
        console.log();
      }
    });

    // 3. Mostrar estadísticas
    console.log('='.repeat(80));
    console.log('📊 ESTADÍSTICAS');
    console.log('='.repeat(80) + '\n');

    console.log(`Total: ${embeddings.length} embeddings`);
    console.log(`✅ Con nombre válido: ${analysis.withAllMetadata}`);
    console.log(`❌ Que mostrarían "Unknown": ${analysis.withNone}\n`);

    console.log('Por campo:');
    console.log(`   fileName presente: ${analysis.withFileName}`);
    console.log(`   title presente: ${analysis.withTitle}`);
    console.log(`   url presente: ${analysis.withUrl}\n`);

    console.log('Por tipo de contexto:');
    Object.entries(analysis.byContextType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log();

    // 4. Mostrar problemáticos en detalle
    if (analysis.problematic.length > 0) {
      console.log('='.repeat(80));
      console.log('❌ EMBEDDINGS PROBLEMÁTICOS (mostrarían "Unknown")');
      console.log('='.repeat(80) + '\n');

      analysis.problematic.forEach((prob, i) => {
        console.log(`${i + 1}. ID: ${prob.id}`);
        console.log(`   Index en lista: #${prob.index + 1}`);
        console.log(`   Type: ${prob.contextType}`);
        console.log(`   Chunk: ${prob.chunkIndex ?? 'N/A'}`);
        console.log(`   ContextId: ${prob.contextId || 'NO'}`);
        console.log(`   Metadata completa:`);
        console.log(JSON.stringify(prob.metadata, null, 4));
        console.log(`   Content: ${prob.contentPreview}...`);
        console.log();
      });

      // 5. Buscar contextos originales
      console.log('='.repeat(80));
      console.log('🔍 VERIFICANDO CONTEXTOS ORIGINALES');
      console.log('='.repeat(80) + '\n');

      for (const prob of analysis.problematic) {
        if (prob.contextId) {
          console.log(`Buscando contextId: ${prob.contextId}`);

          const context = await db.contextItem.findUnique({
            where: { id: prob.contextId },
            select: {
              id: true,
              type: true,
              fileName: true,
              title: true,
              url: true,
              questions: true
            }
          });

          if (context) {
            console.log(`✅ Contexto encontrado:`);
            console.log(`   Type: ${context.type}`);
            console.log(`   fileName: ${context.fileName || 'null'}`);
            console.log(`   title: ${context.title || 'null'}`);
            console.log(`   url: ${context.url || 'null'}`);
            console.log(`   questions: ${context.questions || 'null'}`);

            // Verificar si el contexto tiene la data pero el embedding no
            const hasDataInContext = context.fileName || context.title || context.url;
            const hasDataInEmbedding = prob.metadata?.fileName || prob.metadata?.title || prob.metadata?.url;

            if (hasDataInContext && !hasDataInEmbedding) {
              console.log(`\n   🔴 PROBLEMA: El contexto TIENE metadata pero el embedding NO!`);
              console.log(`   → La metadata no se copió al crear el embedding\n`);
            }
          } else {
            console.log(`❌ Contexto NO encontrado (huérfano)\n`);
          }
        }
      }

      // 6. Analizar el código de auto-vectorize
      console.log('='.repeat(80));
      console.log('💡 DIAGNÓSTICO');
      console.log('='.repeat(80) + '\n');

      console.log('Problema identificado: Embeddings sin fileName, title ni url\n');
      console.log('Acciones recomendadas:');
      console.log('1. Revisar auto-vectorize.service.ts para ver cómo se copia metadata');
      console.log('2. Verificar que TODOS los campos se copien al crear embeddings');
      console.log('3. Crear script de migración para fix embeddings existentes\n');

    } else {
      console.log('✅ ¡PERFECTO! Todos los embeddings tienen metadata válida.\n');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
