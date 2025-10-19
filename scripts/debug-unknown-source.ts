/**
 * Debug: Encontrar el embedding que aparece como "Unknown"
 */

import { db } from '~/utils/db.server';
import { vectorSearch } from '../server/vector/vector-search.service';

const CHATBOT_ID = '68f456dca443330f35f8c81d';

async function main() {
  console.log('\n🔍 === DEBUG: Buscar fuente "Unknown" ===\n');

  try {
    // Buscar "formmy" para reproducir el caso
    const results = await vectorSearch('formmy', CHATBOT_ID, 10);

    console.log(`Total resultados: ${results.length}\n`);

    // Encontrar el que aparece como Unknown
    results.forEach((result, i) => {
      const hasFileName = result.metadata.fileName;
      const hasTitle = result.metadata.title;
      const hasUrl = result.metadata.url;
      const contextType = result.metadata.contextType;

      // Este será "Unknown" si no tiene ninguno de los tres
      if (!hasFileName && !hasTitle && !hasUrl) {
        console.log(`❌ Resultado #${i + 1} - SIN METADATA VÁLIDA:`);
        console.log(`   ID: ${result.id}`);
        console.log(`   Score: ${result.score.toFixed(4)}`);
        console.log(`   ContextType: ${contextType || 'null'}`);
        console.log(`   ContextId: ${result.metadata.contextId || 'null'}`);
        console.log(`   Metadata completa:`, JSON.stringify(result.metadata, null, 2));
        console.log(`   Content preview: ${result.content.substring(0, 100)}...\n`);
      }
    });

    // Buscar todos los embeddings sin fileName, title ni url
    console.log('🔍 Buscando TODOS los embeddings problemáticos...\n');

    const allEmbeddings = await db.embedding.findMany({
      where: { chatbotId: CHATBOT_ID },
      select: {
        id: true,
        metadata: true,
        content: true
      }
    });

    const problematic = allEmbeddings.filter((emb: any) => {
      const meta = emb.metadata;
      return !meta?.fileName && !meta?.title && !meta?.url;
    });

    console.log(`Total embeddings: ${allEmbeddings.length}`);
    console.log(`Embeddings problemáticos: ${problematic.length}\n`);

    if (problematic.length > 0) {
      console.log('📋 Embeddings sin metadata válida:\n');

      problematic.forEach((emb: any, i: number) => {
        console.log(`${i + 1}. ID: ${emb.id}`);
        console.log(`   Metadata:`, JSON.stringify(emb.metadata, null, 2));
        console.log(`   Content: ${emb.content?.substring(0, 80)}...\n`);

        if (i >= 4) {
          console.log(`   ... y ${problematic.length - 5} más\n`);
          return;
        }
      });

      // Intentar encontrar el contexto asociado
      console.log('🔗 Buscando contextos asociados...\n');

      for (const emb of problematic.slice(0, 3)) {
        const contextId = (emb.metadata as any)?.contextId;

        if (contextId) {
          console.log(`Buscando contextId: ${contextId}`);

          // Buscar en ContextItem
          const contextItem = await db.contextItem.findUnique({
            where: { id: contextId },
            select: {
              id: true,
              type: true,
              fileName: true,
              title: true,
              url: true,
              content: true
            }
          });

          if (contextItem) {
            console.log(`✅ ContextItem encontrado:`);
            console.log(`   Type: ${contextItem.type}`);
            console.log(`   FileName: ${contextItem.fileName || 'null'}`);
            console.log(`   Title: ${contextItem.title || 'null'}`);
            console.log(`   URL: ${contextItem.url || 'null'}`);
            console.log(`   Content preview: ${contextItem.content?.substring(0, 60)}...\n`);
          } else {
            console.log(`⚠️  ContextItem NO encontrado\n`);
          }
        } else {
          console.log(`⚠️  Sin contextId\n`);
        }
      }

      // Proponer solución
      console.log('\n' + '='.repeat(60));
      console.log('💡 SOLUCIÓN');
      console.log('='.repeat(60) + '\n');

      console.log('Opciones:');
      console.log('1. Re-sincronizar metadata desde los contextos originales');
      console.log('2. Actualizar manualmente los embeddings con metadata faltante');
      console.log('3. Eliminar y re-vectorizar esos contextos\n');
    } else {
      console.log('✅ No hay embeddings sin metadata válida!');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
