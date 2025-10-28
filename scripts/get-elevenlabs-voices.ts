/**
 * Script para obtener todas las voces disponibles de ElevenLabs
 * con soporte para español, especialmente voces nativas mexicanas/latinas
 */

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: {
    accent?: string;
    gender?: string;
    age?: string;
    language?: string;
    descriptive?: string;
    use_case?: string;
  };
  description?: string;
  preview_url?: string;
  verified_languages?: Array<{
    language: string;
    model_id: string;
    accent?: string;
    locale?: string;
    preview_url?: string;
  }>;
}

async function getElevenLabsVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error("❌ ELEVENLABS_API_KEY no está configurada en .env");
    process.exit(1);
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const voices: ElevenLabsVoice[] = data.voices;

    console.log("\n" + "=".repeat(80));
    console.log("📋 CATÁLOGO COMPLETO DE VOCES ELEVENLABS");
    console.log("=".repeat(80));
    console.log(`\nTotal de voces disponibles: ${voices.length}`);

    // Filtrar voces con soporte español
    const spanishVoices = voices.filter((voice) => {
      // Buscar en verified_languages
      const hasSpanishLang = voice.verified_languages?.some(
        (lang) => lang.language === "es"
      );

      // Buscar en labels
      const labelLanguage = voice.labels?.language === "es";

      // Buscar menciones en descripción o nombre
      const name = voice.name.toLowerCase();
      const desc = (voice.description || "").toLowerCase();
      const hasSpanishMention =
        name.includes("spanish") ||
        name.includes("español") ||
        name.includes("mexican") ||
        name.includes("mexicano") ||
        name.includes("latino") ||
        desc.includes("spanish") ||
        desc.includes("español") ||
        desc.includes("mexican") ||
        desc.includes("mexicano") ||
        desc.includes("latino");

      return hasSpanishLang || labelLanguage || hasSpanishMention;
    });

    console.log(`\n✅ Voces con soporte español: ${spanishVoices.length}\n`);

    // Categorizar voces
    const nativeMexican: ElevenLabsVoice[] = [];
    const latinAmerican: ElevenLabsVoice[] = [];
    const multilingual: ElevenLabsVoice[] = [];

    spanishVoices.forEach((voice) => {
      const name = voice.name.toLowerCase();
      const desc = (voice.description || "").toLowerCase();
      const accent = voice.labels?.accent?.toLowerCase() || "";

      // Buscar voces mexicanas nativas
      const isMexican =
        name.includes("diego") ||
        name.includes("valentina") ||
        desc.includes("mexican") ||
        desc.includes("mexicano") ||
        accent.includes("mexican");

      // Buscar voces latinoamericanas
      const isLatino =
        desc.includes("latino") ||
        desc.includes("latin american") ||
        desc.includes("colombian") ||
        desc.includes("argentinian") ||
        desc.includes("chilean");

      if (isMexican) {
        nativeMexican.push(voice);
      } else if (isLatino) {
        latinAmerican.push(voice);
      } else {
        multilingual.push(voice);
      }
    });

    // Mostrar voces nativas mexicanas
    if (nativeMexican.length > 0) {
      console.log("\n" + "🇲🇽 ".repeat(40));
      console.log("🎯 VOCES NATIVAS MEXICANAS (RECOMENDADAS)");
      console.log("🇲🇽 ".repeat(40) + "\n");

      nativeMexican.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name.toUpperCase()}`);
        console.log(`   Voice ID: ${voice.voice_id}`);
        console.log(
          `   Género: ${voice.labels?.gender || "N/A"} | Edad: ${voice.labels?.age || "N/A"}`
        );
        console.log(
          `   Acento: ${voice.labels?.accent || "N/A"} | Idioma: ${voice.labels?.language || "N/A"}`
        );
        console.log(`   Descripción: ${voice.description || "N/A"}`);

        // Mostrar info de idiomas verificados
        const spanishLangs = voice.verified_languages?.filter(
          (lang) => lang.language === "es"
        );
        if (spanishLangs && spanishLangs.length > 0) {
          console.log(`   Español verificado en modelos:`);
          spanishLangs.forEach((lang) => {
            console.log(
              `     - ${lang.model_id}${lang.accent ? ` (${lang.accent})` : ""}${lang.locale ? ` [${lang.locale}]` : ""}`
            );
          });
        }

        if (voice.preview_url) {
          console.log(`   Preview: ${voice.preview_url}`);
        }
        console.log("");
      });
    }

    // Mostrar voces latinoamericanas
    if (latinAmerican.length > 0) {
      console.log("\n" + "🌎 ".repeat(40));
      console.log("VOCES LATINOAMERICANAS");
      console.log("🌎 ".repeat(40) + "\n");

      latinAmerican.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name}`);
        console.log(`   Voice ID: ${voice.voice_id}`);
        console.log(
          `   Género: ${voice.labels?.gender || "N/A"} | Edad: ${voice.labels?.age || "N/A"}`
        );
        console.log(`   Descripción: ${voice.description || "N/A"}`);
        console.log("");
      });
    }

    // Mostrar voces multilingües
    if (multilingual.length > 0) {
      console.log("\n" + "🌐 ".repeat(40));
      console.log("VOCES MULTILINGÜES CON SOPORTE ESPAÑOL");
      console.log("(Acento extranjero - NO recomendadas para usuarios mexicanos)");
      console.log("🌐 ".repeat(40) + "\n");

      multilingual.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name}`);
        console.log(`   Voice ID: ${voice.voice_id}`);
        console.log(
          `   Acento original: ${voice.labels?.accent || "N/A"} | Género: ${voice.labels?.gender || "N/A"}`
        );
        console.log(`   Descripción: ${voice.description || "N/A"}`);
        console.log("");
      });
    }

    // Resumen final
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN");
    console.log("=".repeat(80));
    console.log(`🇲🇽 Voces nativas mexicanas: ${nativeMexican.length}`);
    console.log(`🌎 Voces latinoamericanas: ${latinAmerican.length}`);
    console.log(`🌐 Voces multilingües: ${multilingual.length}`);
    console.log(`📋 Total español: ${spanishVoices.length}`);
    console.log("");

    // Recomendaciones
    console.log("\n" + "💡 ".repeat(40));
    console.log("RECOMENDACIONES PARA FORMMY");
    console.log("💡 ".repeat(40) + "\n");

    if (nativeMexican.length > 0) {
      console.log("✅ Usar EXCLUSIVAMENTE las voces nativas mexicanas:");
      nativeMexican.forEach((voice) => {
        console.log(`   - ${voice.name} (${voice.voice_id})`);
      });
    } else {
      console.log(
        "⚠️ No se encontraron voces nativas mexicanas. Considerar voces latinoamericanas."
      );
    }

    console.log(
      "\n❌ EVITAR voces multilingües (tienen acento americano/británico al hablar español)"
    );
    console.log("");

  } catch (error) {
    console.error("❌ Error al obtener voces:", error);
    process.exit(1);
  }
}

getElevenLabsVoices();
