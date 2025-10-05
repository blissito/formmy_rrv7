/**
 * Test simple para ver qué está pasando con las herramientas
 */

const API_URL = 'http://localhost:3001';
const DEV_TOKEN = 'FORMMY_DEV_TOKEN_2025';

async function testGhosty() {
  console.log('🚀 Enviando petición a Ghosty...\n');

  const response = await fetch(`${API_URL}/api/ghosty/v0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEV_TOKEN}`
    },
    body: JSON.stringify({
      message: '¿Qué características nuevas tiene Formmy?',
      integrations: {}
    })
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const error = await response.text();
    console.error('Error:', error);
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  console.log('\n📥 Recibiendo respuesta:\n');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    process.stdout.write(chunk);
  }
}

testGhosty().catch(console.error);
