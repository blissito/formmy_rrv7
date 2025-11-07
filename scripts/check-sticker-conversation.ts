import { db } from "../app/utils/db.server";

async function checkStickerConversation() {
  try {
    // Find chatbot
    const chatbot = await db.chatbot.findUnique({
      where: {
        slug: "mi-chatbot-IF3R5V",
      },
    });

    if (!chatbot) {
      console.log("❌ Chatbot not found");
      return;
    }

    console.log(`✅ Found chatbot: ${chatbot.name} (${chatbot.id})`);

    // Find all conversations for this chatbot with recent sticker messages
    const conversations = await db.conversation.findMany({
      where: {
        chatbotId: chatbot.id,
        messages: {
          some: {
            content: "📎 Sticker",
          },
        },
      },
      include: {
        messages: {
          where: {
            content: "📎 Sticker",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        contacts: {
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    });

    console.log(`\n📊 Found ${conversations.length} conversations with stickers`);

    if (conversations.length === 0) {
      console.log("❌ No sticker messages found for this chatbot");
      return;
    }

    // Check each conversation
    for (const conversation of conversations) {
      const contact = conversation.contacts[0];
      console.log(`\n${"=".repeat(80)}`);
      console.log(`Conversation: ${conversation.id}`);
      if (contact) {
        console.log(`Contact: ${contact.name || "Unknown"} (${contact.phone || "no phone"})`);
      }
      console.log(`Sticker messages: ${conversation.messages.length}`);

      conversation.messages.forEach((msg, i) => {
        console.log(`\n  [${i + 1}] ${msg.role} - ${msg.createdAt.toISOString()}`);
        console.log(`      Content: ${msg.content}`);

        // Check picture field
        if (msg.picture) {
          console.log(`      📎 Picture: ✅ YES`);
          console.log(`         Length: ${msg.picture.length} chars`);
          console.log(`         Preview: ${msg.picture.substring(0, 80)}...`);

          // Check if it's a data URL
          if (msg.picture.startsWith("data:")) {
            const mimeMatch = msg.picture.match(/^data:([^;]+);/);
            if (mimeMatch) {
              console.log(`         MIME: ${mimeMatch[1]}`);
            }
          } else {
            console.log(`         ⚠️  NOT a data URL!`);
          }
        } else {
          console.log(`      📎 Picture: ❌ NO (THIS IS THE PROBLEM!)`);
        }
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

checkStickerConversation();
