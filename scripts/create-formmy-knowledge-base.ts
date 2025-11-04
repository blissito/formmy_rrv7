/**
 * Crear base de conocimiento completa de Formmy para Ghosty
 * Extrae contenido del sitio web y genera embeddings
 */

import { db } from '../app/utils/db.server';
import { generateEmbedding } from '../server/vector/embedding.service';

// Contenido completo de Formmy extraído del sitio
const formmyKnowledge = [
  // Hero y propuesta de valor
  {
    title: 'Propuesta de Valor Principal',
    content: 'Formmy es una plataforma de Chat IA para sitios web. Sin complicaciones, fácil y rápido. Integra en minutos y sin dolores de cabeza. Más de 1,000 usuarios usan Formmy para captar leads, automatizar procesos y atender a sus clientes.',
    category: 'hero'
  },

  // Chatbots IA
  {
    title: 'Chat IA para Negocios',
    content: 'Automatiza la atención y soporte con agentes inteligentes que responden 24/7. Mejora la experiencia de tus usuarios y dedica tu tiempo a lo que realmente importa. Personaliza tu chat con el color y estilo de tu marca. Entrena a tu agente IA para responder a tus clientes. Integra WhatsApp, Instagram y Messenger. Asígnale tareas especiales a tus agentes como enviar correos o agendar citas.',
    category: 'chatbots'
  },

  // Formularios
  {
    title: 'Formularios de Contacto',
    content: 'Agrega formularios de contacto o suscripción a tu sitio web con un par de clics. Recibe mensajes y suscripciones de tus clientes sin perder ni uno solo. Personaliza tu formmy con el color y estilo de tu marca. Selecciona o agrega campos personalizados para tus clientes. Agrega un mensaje para tus clientes al enviar el formulario. Invita a tu staff a administrar tus formularios.',
    category: 'formularios'
  },

  // Plan FREE
  {
    title: 'Plan Free',
    content: 'El plan Free de Formmy cuesta $0 MXN mensuales. Incluye 3 proyectos (formularios), mensajes ilimitados, notificaciones vía email, personalización de formularios y dashboard para administrar tus mensajes. Perfecto para ti y tu sitio web personal.',
    category: 'pricing'
  },

  // Plan STARTER
  {
    title: 'Plan Starter',
    content: 'El plan Starter de Formmy cuesta $149 MXN mensuales. Es un plan de formularios ilimitados sin acceso a chatbots con IA. Ideal para negocios que solo necesitan gestión de formularios.',
    category: 'pricing'
  },

  // Plan PRO
  {
    title: 'Plan Pro',
    content: 'El plan Pro de Formmy cuesta $499 MXN mensuales. Incluye 10 chatbots con IA, 250 conversaciones mensuales, 1000 tool credits, modelo Claude 3 Haiku. Incluye proyectos ilimitados de formularios, mensajes ilimitados, notificaciones vía email, más opciones para personalizar formularios, administración de usuarios y dashboard avanzado. Ideal si eres freelancer o agencia.',
    category: 'pricing'
  },

  // Plan ENTERPRISE
  {
    title: 'Plan Enterprise',
    content: 'El plan Enterprise de Formmy cuesta $2,490 MXN mensuales. Incluye chatbots ilimitados, 1000 conversaciones mensuales, 5000 tool credits, modelos GPT-5 Mini y Claude 3.5 Haiku (los mejores modelos). Todo lo del plan Pro más capacidades empresariales avanzadas.',
    category: 'pricing'
  },

  // Herramientas de IA
  {
    title: 'Herramientas de los Chatbots',
    content: 'Los chatbots de Formmy pueden realizar múltiples tareas: crear recordatorios y agendar citas, generar links de pago con Stripe, guardar información de contactos y leads, buscar información actualizada en Google, integración con WhatsApp Business para respuestas automáticas. Los chatbots usan GPT-5 Nano, GPT-5 Mini, Claude 3 Haiku y Claude 3.5 Haiku según el plan.',
    category: 'features'
  },

  // Integraciones
  {
    title: 'Integraciones Disponibles',
    content: 'Formmy integra con WhatsApp Business API para mensajes automáticos, Stripe para cobros y pagos en línea, Google Search para búsquedas en tiempo real, recordatorios automáticos con envío de emails. La integración de WhatsApp cuesta $99 MXN adicionales mensuales.',
    category: 'integraciones'
  },

  // Tecnología
  {
    title: 'Tecnología y Stack',
    content: 'Formmy está construido con React Router v7, Tailwind CSS para diseño, MongoDB Atlas como base de datos con Prisma ORM, deployment en fly.io usando Docker. Los agentes inteligentes usan LlamaIndex Agent Workflows, sistema de embeddings de 768 dimensiones para búsqueda semántica avanzada.',
    category: 'tecnologia'
  },

  // Servicios adicionales
  {
    title: 'Servicios Adicionales',
    content: 'Formmy ofrece servicios adicionales: Setup Service por $1,500 MXN one-time para configuración personalizada, White Label a $299 MXN/mes para tu propia marca, API Access a $199 MXN/mes para integraciones custom. También conversaciones extra desde $59 MXN por 100 conversaciones adicionales.',
    category: 'servicios'
  },

  // Ghosty
  {
    title: 'Ghosty - Asistente IA',
    content: 'Ghosty es el asistente principal de Formmy que te ayuda a crear y gestionar tus chatbots y formularios. Proporciona insights, métricas SEO, recomendaciones de optimización y ejecuta tareas automatizadas. Disponible en tu dashboard para guiarte paso a paso.',
    category: 'ghosty'
  },

  // Trial
  {
    title: 'Trial y Prueba Gratuita',
    content: 'Formmy ofrece 60 días de trial gratuito con acceso completo a todas las herramientas y funcionalidades. Después del trial, los usuarios Free mantienen acceso a formularios pero pierden acceso a chatbots IA. Puedes cambiar de plan en cualquier momento.',
    category: 'trial'
  },

  // Use Cases
  {
    title: 'Casos de Uso',
    content: 'Formmy es perfecto para automatizar atención al cliente 24/7, capturar leads desde tu sitio web, agendar citas automáticamente, cobrar pagos sin fricción, soporte técnico automatizado, responder FAQ, calificar prospectos, integrar WhatsApp Business. Usado por +1,000 empresas, freelancers y agencias.',
    category: 'casos-de-uso'
  },

  // Tool Credits
  {
    title: 'Sistema de Tool Credits',
    content: 'Los tool credits limitan el uso de herramientas avanzadas. Herramientas básicas como recordatorios cuestan 1 credit. Herramientas intermedias como crear payment links cuestan 2-3 credits. Herramientas avanzadas como análisis de documentos cuestan 4-6 credits. Se renuevan cada mes según tu plan.',
    category: 'credits'
  }
];

async function main() {
  console.log('\n📚 Creando base de conocimiento de Formmy para Ghosty...\n');

  // Buscar el chatbot de Ghosty
  const user = await db.user.findUnique({
    where: { email: 'fixtergeek@gmail.com' },
    select: { id: true, email: true }
  });

  if (!user) {
    console.log('❌ Usuario fixtergeek@gmail.com no encontrado');
    return;
  }

  console.log(`✅ Usuario: ${user.email}`);

  // Buscar Ghosty o crear uno
  let ghosty = await db.chatbot.findFirst({
    where: {
      userId: user.id,
      name: { contains: 'Ghosty', mode: 'insensitive' }
    }
  });

  if (!ghosty) {
    console.log('\n📝 Creando chatbot Ghosty...');
    ghosty = await db.chatbot.create({
      data: {
        userId: user.id,
        name: 'Ghosty - Asistente Formmy',
        slug: 'ghosty-formmy-' + Date.now(),
        description: 'Asistente inteligente de Formmy con conocimiento completo de la plataforma',
        personality: 'customer_support',
        aiModel: 'gpt-4o-mini',
        temperature: 0.7,
        instructions: 'Eres Ghosty, el asistente oficial de Formmy. Ayudas a usuarios con información sobre planes, features y cómo usar la plataforma.',
        status: 'ACTIVE',
        isActive: true,
        contexts: []
      }
    });
  }

  console.log(`✅ Ghosty: ${ghosty.name} (${ghosty.id})`);

  // Limpiar embeddings anteriores
  const deleted = await db.embedding.deleteMany({
    where: { chatbotId: ghosty.id }
  });

  console.log(`🗑️  ${deleted.count} embeddings anteriores eliminados\n`);

  // Crear embeddings de la base de conocimiento
  console.log('📝 Generando embeddings...\n');

  for (let i = 0; i < formmyKnowledge.length; i++) {
    const doc = formmyKnowledge[i];
    const embedding = await generateEmbedding(doc.content);

    await db.embedding.create({
      data: {
        chatbotId: ghosty.id,
        content: doc.content,
        embedding,
        metadata: {
          contextType: 'TEXT',
          title: doc.title,
          category: doc.category,
          chunkIndex: i,
          source: 'formmy-website'
        }
      }
    });

    console.log(`   ✅ ${i + 1}/${formmyKnowledge.length}: ${doc.title}`);
  }

  const total = await db.embedding.count({ where: { chatbotId: ghosty.id } });
  console.log(`\n📊 Total embeddings creados: ${total}`);

  // Test de búsqueda
  console.log('\n⏳ Esperando 30 segundos para indexación...');
  await new Promise(r => setTimeout(r, 30000));

  console.log('\n🔎 Probando búsqueda: "¿Cuánto cuesta el plan Pro?"\n');
  const queryEmbedding = await generateEmbedding('¿Cuánto cuesta el plan Pro?');

  const results: any = await db.embedding.aggregateRaw({
    pipeline: [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 20,
          limit: 3
        }
      },
      {
        $project: {
          content: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]
  });

  if (results.length > 0) {
    console.log(`🎉 ¡VECTOR SEARCH FUNCIONA!\n`);
    results.forEach((r: any, i: number) => {
      console.log(`${i + 1}. ${r.metadata?.title || 'Sin título'} (${(r.score * 100).toFixed(1)}%)`);
      console.log(`   "${r.content.substring(0, 80)}..."\n`);
    });
  } else {
    console.log('⚠️  Vector search aún no indexa (espera 10-15 min más)');
    console.log('   Los embeddings SÍ fueron creados correctamente.\n');
  }

  console.log(`✅ Base de conocimiento completa!\n`);
  console.log(`📝 Ghosty ID: ${ghosty.id}`);
  console.log(`📊 Embeddings: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
