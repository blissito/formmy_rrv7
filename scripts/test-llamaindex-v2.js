/**
 * Script para probar LlamaIndex V2 API con streaming
 */

async function testLlamaIndexV2() {
  // Usar un ObjectId válido (24 caracteres hex)
  const testChatbotId = "507f1f77bcf86cd799439011";

  const formData = new FormData();
  formData.append("intent", "chat");
  formData.append("message", "Hola, cuéntame sobre los beneficios del ejercicio");
  formData.append("chatbotId", testChatbotId);
  formData.append("stream", "true");
  formData.append("apiKey", "formmy-test-2024");

  console.log('🚀 Testing LlamaIndex V2 API...');

  try {
    const response = await fetch('http://localhost:3000/api/llamaindex/v2', {
      method: 'POST',
      body: formData
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.body && response.headers.get('content-type')?.includes('text/plain')) {
      // Streaming response
      console.log('🌊 Streaming response detected');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
      }
    } else {
      // JSON response
      const text = await response.text();
      console.log('📝 Response body:', text);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLlamaIndexV2();