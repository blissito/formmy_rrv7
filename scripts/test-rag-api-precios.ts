/**
 * Test: Simular exactamente lo que hace DeveloperTools cuando busca "precios"
 * Para reproducir el caso "Unknown"
 */

async function main() {
  console.log('\n🔍 === TEST: RAG API "precios" (simulando DeveloperTools) ===\n');

  const CHATBOT_ID = '68f456dca443330f35f8c81d';
  const API_KEY = process.env.FORMMY_API_KEY || 'test_key';

  try {
    // 1. Consultar el RAG API exactamente como lo hace DeveloperTools
    console.log('📡 Consultando RAG API...\n');

    const response = await fetch(`http://localhost:5173/api/rag/v1?intent=query&chatbotId=${CHATBOT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        query: 'precios'
      })
    });

    if (!response.ok) {
      console.error(`❌ Error ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      process.exit(1);
    }

    const data = await response.json();

    console.log('📊 Respuesta del API:\n');
    console.log(`Query: "${data.query}"`);
    console.log(`Results: ${data.results?.length || 0}`);
    console.log(`Answer: ${data.answer?.substring(0, 100)}...\n`);

    // 2. Analizar los chunks devueltos
    if (data.results && data.results.length > 0) {
      console.log('📋 Análisis de chunks:\n');

      data.results.forEach((chunk: any, i: number) => {
        console.log(`─────────────────────────────────────`);
        console.log(`Chunk #${i + 1}`);
        console.log(`Score: ${(chunk.score * 100).toFixed(1)}%`);
        console.log(`\n🔍 Metadata completa:`);
        console.log(JSON.stringify(chunk.metadata, null, 2));

        // Simular exactamente la lógica del componente
        const meta = chunk.metadata;
        const fileName = meta?.fileName;
        const title = meta?.title;
        const url = meta?.url;

        console.log(`\n📌 Campos individuales:`);
        console.log(`  fileName: ${fileName === null ? 'null' : fileName === undefined ? 'undefined' : `"${fileName}"`}`);
        console.log(`  title: ${title === null ? 'null' : title === undefined ? 'undefined' : `"${title}"`}`);
        console.log(`  url: ${url === null ? 'null' : url === undefined ? 'undefined' : `"${url}"`}`);

        // Aplicar la lógica del helper getSourceName
        let displayName;
        if (fileName) {
          displayName = fileName;
        } else if (title) {
          displayName = title;
        } else if (url) {
          try {
            displayName = new URL(url).hostname;
          } catch {
            displayName = url;
          }
        } else {
          displayName = 'Unknown';
        }

        console.log(`\n🎯 Se mostraría como: "${displayName}"`);

        if (displayName === 'Unknown') {
          console.log(`\n❌ ESTE CHUNK MOSTRARÍA "UNKNOWN"!`);
        }

        console.log(`\nContent: ${chunk.content.substring(0, 100)}...\n`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
