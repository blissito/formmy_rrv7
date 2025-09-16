import fs from 'fs';
import path from 'path';

// Script para generar voz con Google Text-to-Speech
const GOOGLE_TTS_API = 'https://texttospeech.googleapis.com/v1/text:synthesize';

const script = `Los agentes son asistentes de chat conectados a un LLM (o un modelo de lenguaje) que puede razonar. El LLM asignado al agente puede solicitar el uso de herramientas que le permitan conseguir más información; hacer investigaciones o ejecutar acciones como lectura y escritura de archivos o ejecución de comandos y scripts. Lo más importante es que pueden ir y venir, mantenerse en loops de acciones hasta terminar. Todo, a partir de tu solicitud.`;

async function generateVoice() {
  // Obtener API key de variables de entorno
  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  if (!apiKey) {
    console.error('❌ Por favor, agrega GOOGLE_TTS_API_KEY a tu archivo .env');
    process.exit(1);
  }

  const requestBody = {
    input: {
      text: script
    },
    voice: {
      languageCode: 'es-US',  // Español (Estados Unidos)
      name: 'es-US-Neural2-A', // Voz femenina neural
      // Otras opciones: es-US-Neural2-B (masculina), es-US-Studio-B (premium masculina)
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,  // Velocidad normal (ajusta entre 0.25 y 4.0)
      pitch: 0,           // Tono normal (ajusta entre -20 y 20)
      volumeGainDb: 0     // Volumen normal
    }
  };

  try {
    console.log('🎤 Generando voz con Google Text-to-Speech...');

    const response = await fetch(`${GOOGLE_TTS_API}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error de API: ${error}`);
    }

    const data = await response.json();

    // Decodificar el audio base64
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    // Guardar el archivo MP3
    const outputPath = path.join(process.cwd(), 'tts-output.mp3');
    fs.writeFileSync(outputPath, audioBuffer);

    console.log('✅ Audio generado exitosamente:', outputPath);
    console.log('📊 Tamaño del archivo:', (audioBuffer.length / 1024).toFixed(2), 'KB');

  } catch (error) {
    console.error('❌ Error generando voz:', error);
  }
}

// Ejecutar
generateVoice();