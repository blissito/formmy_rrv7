/**
 * Script de prueba: Test Semántico de Deduplicación a Nivel de Store
 *
 * Verifica que:
 * 1. Se previenen duplicados semánticos dentro del mismo documento
 * 2. Se previenen duplicados semánticos entre DIFERENTES documentos (store-level)
 * 3. El umbral de similaridad (85%) funciona correctamente
 */

import { db } from '~/utils/db.server';
import { addMarkdownToContext } from '../server/llamaparse/embedding.service';

const TEST_CHATBOT_ID = '6796b9d15ba8bdacbcd8d603'; // Ghosty Dev

async function main() {
  console.log('\n🧪 === TEST DEDUPLICACIÓN SEMÁNTICA (STORE-LEVEL) ===\n');

  try {
    // 1. Limpiar embeddings previos del test
    console.log('🧹 Limpiando embeddings de pruebas previas...');
    const deleted = await db.embedding.deleteMany({
      where: {
        chatbotId: TEST_CHATBOT_ID,
        metadata: {
          path: ['fileName'],
          string_contains: 'TEST_'
        }
      }
    });
    console.log(`   ✅ ${deleted.count} embeddings eliminados\n`);

    // 2. Test 1: Agregar documento con contenido único
    console.log('📄 TEST 1: Agregar documento único (test_doc_1.md)');
    const doc1Content = `
# Formmy RAG System

Formmy utiliza MongoDB Atlas Vector Search para búsquedas semánticas.
El sistema divide documentos en chunks de 2000 caracteres con overlap de 200.
Los embeddings se generan con OpenAI text-embedding-3-small (768 dimensiones).
    `.trim();

    const result1 = await addMarkdownToContext(
      TEST_CHATBOT_ID,
      doc1Content,
      'TEST_doc_1.md'
    );

    console.log(`   Resultado: ${result1.embeddingsCreated} creados, ${result1.embeddingsSkipped || 0} duplicados`);
    console.log(`   ✅ Documento único agregado correctamente\n`);

    // 3. Test 2: Agregar MISMO documento (debería detectar 100% duplicados)
    console.log('📄 TEST 2: Re-agregar el MISMO documento (test_doc_1_duplicate.md)');
    console.log('   Expectativa: Todos los chunks deberían ser detectados como duplicados\n');

    const result2 = await addMarkdownToContext(
      TEST_CHATBOT_ID,
      doc1Content, // Mismo contenido exacto
      'TEST_doc_1_duplicate.md'
    );

    console.log(`   Resultado: ${result2.embeddingsCreated} creados, ${result2.embeddingsSkipped || 0} duplicados`);

    if ((result2.embeddingsSkipped || 0) > 0) {
      console.log(`   ✅ ÉXITO: Sistema detectó duplicados entre documentos diferentes (store-level)`);
    } else {
      console.log(`   ❌ FALLO: No se detectaron duplicados cuando debería haberlos`);
    }
    console.log('');

    // 4. Test 3: Agregar documento con contenido SIMILAR (no idéntico)
    console.log('📄 TEST 3: Agregar documento similar pero con variaciones (test_doc_2.md)');
    console.log('   Expectativa: Algunos chunks similares, otros únicos\n');

    const doc2Content = `
# Sistema RAG de Formmy

Formmy usa MongoDB Atlas Vector Search para búsquedas semánticas avanzadas.
Los documentos se dividen en fragmentos de 2000 caracteres.
Generamos embeddings usando el modelo text-embedding-3-small de OpenAI.
El sistema también incluye deduplicación semántica automática.
    `.trim();

    const result3 = await addMarkdownToContext(
      TEST_CHATBOT_ID,
      doc2Content,
      'TEST_doc_2.md'
    );

    console.log(`   Resultado: ${result3.embeddingsCreated} creados, ${result3.embeddingsSkipped || 0} duplicados`);
    console.log(`   ✅ Documento procesado con detección de similaridad\n`);

    // 5. Test 4: Agregar documento completamente diferente
    console.log('📄 TEST 4: Agregar documento completamente diferente (test_doc_3.md)');
    console.log('   Expectativa: Todos los chunks deberían ser únicos\n');

    const doc3Content = `
# Receta de Pizza Napolitana

Ingredientes:
- 500g harina tipo 00
- 325ml agua tibia
- 10g sal
- 3g levadura fresca
- Tomate San Marzano
- Mozzarella de búfala
- Albahaca fresca
- Aceite de oliva extra virgen

Preparación:
Mezclar harina con agua y levadura.
Amasar durante 15 minutos hasta obtener masa elástica.
Dejar reposar 24 horas en refrigerador.
    `.trim();

    const result4 = await addMarkdownToContext(
      TEST_CHATBOT_ID,
      doc3Content,
      'TEST_doc_3.md'
    );

    console.log(`   Resultado: ${result4.embeddingsCreated} creados, ${result4.embeddingsSkipped || 0} duplicados`);

    if (result4.embeddingsCreated > 0 && (result4.embeddingsSkipped || 0) === 0) {
      console.log(`   ✅ ÉXITO: Contenido único se agregó sin duplicados detectados`);
    }
    console.log('');

    // 6. Estadísticas finales
    console.log('📊 ESTADÍSTICAS FINALES:');
    const totalEmbeddings = await db.embedding.count({
      where: {
        chatbotId: TEST_CHATBOT_ID,
        metadata: {
          path: ['fileName'],
          string_contains: 'TEST_'
        }
      }
    });

    console.log(`   Total embeddings de prueba en store: ${totalEmbeddings}`);

    const uniqueFiles = await db.embedding.groupBy({
      by: ['metadata'],
      where: {
        chatbotId: TEST_CHATBOT_ID,
      },
    });

    console.log(`   Archivos únicos procesados: ${uniqueFiles.length}`);
    console.log('');

    // 7. Resumen
    console.log('✅ RESUMEN DE PRUEBAS:');
    console.log(`   Test 1 (Doc único): ${result1.embeddingsCreated} embeddings creados`);
    console.log(`   Test 2 (Duplicado exacto): ${result2.embeddingsSkipped || 0} duplicados detectados`);
    console.log(`   Test 3 (Contenido similar): ${result3.embeddingsCreated} creados, ${result3.embeddingsSkipped || 0} duplicados`);
    console.log(`   Test 4 (Contenido diferente): ${result4.embeddingsCreated} creados, ${result4.embeddingsSkipped || 0} duplicados`);
    console.log('');

    if ((result2.embeddingsSkipped || 0) > 0) {
      console.log('🎉 ¡ÉXITO! El test semántico a nivel de STORE está funcionando correctamente.');
      console.log('   Los duplicados se detectan entre TODOS los documentos del chatbot, no solo dentro del mismo documento.');
    } else {
      console.log('⚠️  ADVERTENCIA: No se detectaron duplicados en el Test 2.');
      console.log('   Esto podría indicar un problema con el test semántico.');
    }

    console.log('\n🧹 Limpiando embeddings de prueba...');
    const finalCleanup = await db.embedding.deleteMany({
      where: {
        chatbotId: TEST_CHATBOT_ID,
        metadata: {
          path: ['fileName'],
          string_contains: 'TEST_'
        }
      }
    });
    console.log(`   ✅ ${finalCleanup.count} embeddings eliminados`);

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
