import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugBrendaGo() {
  try {
    // Buscar el chatbot
    const chatbot = await prisma.chatbot.findFirst({
      where: {
        name: {
          contains: 'brenda go',
          mode: 'insensitive'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            plan: true
          }
        }
      }
    });

    if (!chatbot) {
      console.log('❌ Chatbot "brenda go" no encontrado');
      return;
    }

    console.log('\n📊 CHATBOT INFO:');
    console.log('ID:', chatbot.id);
    console.log('Name:', chatbot.name);
    console.log('User:', chatbot.user?.email);
    console.log('Plan:', chatbot.user?.plan);
    console.log('Model:', chatbot.aiModel);
    console.log('Temperature:', chatbot.temperature);
    console.log('\n📚 CONTEXTS:');
    console.log('Total contexts:', chatbot.contexts.length);

    for (const ctx of chatbot.contexts) {
      console.log('\n---');
      console.log('ID:', ctx.id);
      console.log('Type:', ctx.type);
      console.log('Title:', ctx.title);
      console.log('Created:', ctx.createdAt);

      if (ctx.type === 'FILE') {
        console.log('File:', ctx.fileName);
        console.log('Size:', ctx.sizeKB, 'KB');
      } else if (ctx.type === 'LINK') {
        console.log('URL:', ctx.url);
      } else if (ctx.type === 'TEXT') {
        console.log('Content preview:', ctx.content?.substring(0, 200) + '...');
      } else if (ctx.type === 'QUESTION') {
        console.log('Question:', ctx.questions);
        console.log('Answer:', ctx.answer?.substring(0, 200) + '...');
      }
    }

    // Verificar embeddings en MongoDB
    console.log('\n🔍 CHECKING EMBEDDINGS IN MONGODB:');
    const embeddings = await prisma.embedding.findMany({
      where: {
        chatbotId: chatbot.id
      },
      select: {
        id: true,
        content: true,
        metadata: true
      },
      take: 5
    });

    console.log('Total embeddings:', embeddings.length);
    if (embeddings.length > 0) {
      console.log('Sample embeddings:');
      embeddings.slice(0, 3).forEach((emb, i) => {
        console.log(`\n  [${i + 1}]`);
        console.log('  Content:', emb.content.substring(0, 100) + '...');
        console.log('  Metadata:', emb.metadata);
      });
    }

    // Buscar conversaciones recientes
    console.log('\n💬 RECENT CONVERSATIONS:');
    const conversations = await prisma.conversation.findMany({
      where: {
        chatbotId: chatbot.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    console.log('Total conversations:', conversations.length);
    for (const conv of conversations) {
      console.log('\n---');
      console.log('Conversation ID:', conv.id);
      console.log('Created:', conv.createdAt);
      console.log('Messages:', conv.messages.length);

      // Mostrar últimos mensajes
      const lastMessages = conv.messages.slice(-4);
      for (const msg of lastMessages) {
        console.log(`\n[${msg.role.toUpperCase()}]:`, msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : ''));
      }
    }

    // Verificar tool usage
    console.log('\n🛠️ TOOL USAGE:');
    const toolUsage = await prisma.toolUsage.findMany({
      where: {
        chatbotId: chatbot.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log('Total tool calls:', toolUsage.length);

    // Agrupar por herramienta
    const toolCounts: Record<string, number> = {};
    toolUsage.forEach(t => {
      toolCounts[t.toolName] = (toolCounts[t.toolName] || 0) + 1;
    });

    console.log('\nTool usage breakdown:');
    Object.entries(toolCounts).forEach(([tool, count]) => {
      console.log(`  ${tool}: ${count} calls`);
    });

    const searchContextCalls = toolUsage.filter(t => t.toolName === 'search_context');
    console.log('\n🔍 search_context calls:', searchContextCalls.length);

    if (searchContextCalls.length > 0) {
      console.log('\nRecent search_context calls:');
      for (const call of searchContextCalls.slice(0, 5)) {
        console.log('\n  ---');
        console.log('  Success:', call.success);
        console.log('  User message:', call.userMessage?.substring(0, 80) + '...');
        console.log('  Response:', call.response?.substring(0, 80) + '...');
        console.log('  Metadata:', call.metadata);
        console.log('  Timestamp:', call.createdAt);
      }
    } else {
      console.log('⚠️  NO search_context calls found - agent is NOT using RAG!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBrendaGo();
