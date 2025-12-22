#!/usr/bin/env npx tsx
import { db } from "../app/utils/db.server.js";

async function main() {
  const chatbot = await db.chatbot.findFirst({
    where: { slug: "ghosty_VXku4l" },
    select: { id: true, slug: true, name: true }
  });

  if (!chatbot) {
    console.log("❌ Chatbot no encontrado");
    process.exit(1);
  }

  console.log(`\n🤖 Chatbot: ${chatbot.name} (${chatbot.slug})`);

  // Verificar instalaciones
  const installations = await db.artifactInstallation.findMany({
    where: { chatbotId: chatbot.id },
    include: { artifact: { select: { name: true, displayName: true, isNative: true } } }
  });

  console.log(`\n📦 Artefactos instalados: ${installations.length}`);
  for (const inst of installations) {
    console.log(`  - ${inst.artifact.name} (${inst.artifact.displayName}) ${inst.artifact.isNative ? '🏠 native' : ''} ${inst.isActive ? '✅' : '❌'}`);
  }

  // Verificar si gallery-card está
  const hasGallery = installations.some(i => i.artifact.name === 'gallery-card');
  if (!hasGallery) {
    console.log("\n⚠️  gallery-card NO está instalado!");

    // Buscar el artefacto
    const galleryArtifact = await db.artifact.findUnique({
      where: { name: "gallery-card" }
    });

    if (galleryArtifact) {
      console.log("   Instalando...");
      await db.artifactInstallation.create({
        data: {
          chatbotId: chatbot.id,
          artifactId: galleryArtifact.id,
          isActive: true
        }
      });
      console.log("   ✅ Instalado!");
    } else {
      console.log("   ❌ Artefacto gallery-card no existe en la DB");
    }
  }

  process.exit(0);
}

main().catch(console.error);
