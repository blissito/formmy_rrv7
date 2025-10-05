/**
 * Test de generación de reportes PDF
 * Verifica que el agente ejecute generate_chatbot_report y retorne link descargable
 */

const API_URL = process.env.API_URL || "http://localhost:3001";
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || "FORMMY_DEV_TOKEN_2025";

interface StreamEvent {
  type: string;
  content?: string;
  tool?: string;
  message?: string;
  metadata?: {
    toolsExecuted: number;
    toolsUsed: string[];
    tokensUsed: number;
    creditsUsed: number;
  };
}

async function testReportGeneration(message: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Test: Generación de Reporte PDF`);
  console.log(`📨 Message: "${message}"\n`);

  try {
    const response = await fetch(`${API_URL}/api/ghosty/v0`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEV_TOKEN}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error: ${response.status} - ${error}`);
      return null;
    }

    if (!response.body) {
      console.error("❌ No response body");
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullResponse = "";
    let toolsDetected: string[] = [];
    let finalMetadata: any = null;
    let downloadUrl: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n\n');

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = line.replace('data: ', '');
        try {
          const event: StreamEvent = JSON.parse(data);

          if (event.type === 'tool-start') {
            console.log(`  🔧 Tool ejecutada: ${event.tool}`);
            toolsDetected.push(event.tool!);
          } else if (event.type === 'chunk') {
            fullResponse += event.content;
          } else if (event.type === 'done') {
            finalMetadata = event.metadata;
          }
        } catch (e) {
          // Ignorar líneas inválidas
        }
      }
    }

    // Extraer URL de descarga del markdown (con o sin prefijos como sandbox:)
    const linkMatch = fullResponse.match(/\[.*?\]\((?:sandbox:)?(\/api\/ghosty\/download\/[^)]+)\)/);
    if (linkMatch) {
      downloadUrl = linkMatch[1];
    }

    // Resultados
    console.log(`\n✅ RESPUESTA COMPLETA:`);
    console.log(fullResponse);
    console.log(`\n📊 MÉTRICAS:`);
    console.log(`  • Tools ejecutadas: ${toolsDetected.join(', ') || 'ninguna'}`);
    console.log(`  • Créditos usados: ${finalMetadata?.creditsUsed || 0}`);
    console.log(`  • Tokens usados: ${finalMetadata?.tokensUsed || 0}`);

    // Validaciones
    console.log(`\n🔍 VALIDACIONES:`);
    const hasReportTool = toolsDetected.includes('generate_chatbot_report');
    const hasDownloadLink = downloadUrl !== null;

    console.log(`  ${hasReportTool ? '✅' : '❌'} Tool generate_chatbot_report ejecutada`);
    console.log(`  ${hasDownloadLink ? '✅' : '❌'} Link de descarga presente`);

    if (downloadUrl) {
      console.log(`  📥 URL de descarga: ${downloadUrl}`);
    }

    return { hasReportTool, hasDownloadLink, downloadUrl };

  } catch (error) {
    console.error(`❌ Error en test:`, error);
    return null;
  }
}

async function testDownload(downloadUrl: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📥 Test: Descarga del PDF`);
  console.log(`🔗 URL: ${downloadUrl}\n`);

  try {
    const fullUrl = `${API_URL}${downloadUrl}`;
    const response = await fetch(fullUrl);

    if (!response.ok) {
      console.error(`❌ Error al descargar: ${response.status}`);
      return false;
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const contentDisposition = response.headers.get('content-disposition');

    console.log(`✅ Descarga exitosa:`);
    console.log(`  • Content-Type: ${contentType}`);
    console.log(`  • Content-Length: ${contentLength} bytes (${(parseInt(contentLength || '0') / 1024).toFixed(2)} KB)`);
    console.log(`  • Content-Disposition: ${contentDisposition}`);

    const isPDF = contentType === 'application/pdf';
    const hasAttachment = contentDisposition?.includes('attachment');

    console.log(`\n🔍 VALIDACIONES:`);
    console.log(`  ${isPDF ? '✅' : '❌'} Content-Type es application/pdf`);
    console.log(`  ${hasAttachment ? '✅' : '❌'} Header attachment presente`);

    return isPDF && hasAttachment;

  } catch (error) {
    console.error(`❌ Error descargando:`, error);
    return false;
  }
}

// Main
(async () => {
  console.log(`\n🎯 SUITE DE TESTS: GENERACIÓN DE REPORTES PDF\n`);
  console.log(`Configuración:`);
  console.log(`  • API URL: ${API_URL}`);
  console.log(`  • Auth Token: ${DEV_TOKEN.substring(0, 10)}...`);

  // Test 1: Solicitud explícita
  const test1 = await testReportGeneration("genera un reporte de mis chatbots");

  // Test 2: Variante de solicitud
  const test2 = await testReportGeneration("dame un PDF con todos mis bots");

  // Test 3: Solicitud de exportación
  const test3 = await testReportGeneration("exporta mis chatbots a un documento");

  // Test de descarga (si hay URL disponible)
  let downloadSuccess = false;
  if (test1?.downloadUrl) {
    downloadSuccess = await testDownload(test1.downloadUrl);
  }

  // Resumen
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 RESUMEN DE TESTS\n`);

  const allPassed =
    test1?.hasReportTool && test1?.hasDownloadLink &&
    test2?.hasReportTool && test2?.hasDownloadLink &&
    test3?.hasReportTool && test3?.hasDownloadLink &&
    downloadSuccess;

  console.log(`Test 1 (genera reporte): ${test1?.hasReportTool && test1?.hasDownloadLink ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (dame PDF): ${test2?.hasReportTool && test2?.hasDownloadLink ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (exporta): ${test3?.hasReportTool && test3?.hasDownloadLink ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test descarga PDF: ${downloadSuccess ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n${allPassed ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON'}`);
  console.log(`${'='.repeat(80)}\n`);

  process.exit(allPassed ? 0 : 1);
})();
