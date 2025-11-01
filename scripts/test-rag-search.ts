import { vectorSearch } from '../server/vector/vector-search.service';

async function testRAG() {
  const chatbotId = '69062a5a18b9ed0f66119fa2'; // Tu chatbot Ghosty
  const queries = [
    'be the nerd',
    'Hector Bliss',
    'implementación de IA',
    'servicios de desarrollo',
    'automatización'
  ];

  for (const query of queries) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TESTING QUERY: "${query}"`);
    console.log(`${'='.repeat(80)}`);

    try {
      const results = await vectorSearch(query, chatbotId, 5);

      console.log(`\n✅ RESULTADOS: ${results.length} encontrados\n`);

      results.forEach((result, idx) => {
        console.log(`${idx + 1}. Score: ${result.score.toFixed(4)}`);
        console.log(`   Content: ${result.content.substring(0, 150)}...`);
        console.log(`   Source: ${result.metadata.title || result.metadata.url || result.metadata.fileName}`);
        console.log('');
      });
    } catch (error) {
      console.error(`❌ ERROR:`, error);
    }

    console.log(`${'='.repeat(80)}\n`);
  }
}

testRAG().catch(console.error);
