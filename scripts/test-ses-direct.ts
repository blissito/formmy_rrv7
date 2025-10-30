import { config } from 'dotenv';
config();

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.SES_REGION,
  credentials: {
    accessKeyId: process.env.SES_KEY!,
    secretAccessKey: process.env.SES_SECRET!,
  },
});

const params = {
  Source: "no-reply@formmy.app",
  Destination: {
    ToAddresses: ["fixtergeek@gmail.com"],
  },
  Message: {
    Subject: {
      Data: "✅ Test desde Claude Code",
    },
    Body: {
      Html: {
        Data: "<h1>Email de prueba</h1><p>Si recibes esto, las credenciales SES funcionan correctamente!</p>",
      },
    },
  },
};

async function test() {
  try {
    const result = await sesClient.send(new SendEmailCommand(params));
    console.log("✅ Email enviado exitosamente!");
    console.log("MessageId:", result.MessageId);
    console.log("\n📬 Revisa tu email: fixtergeek@gmail.com");
  } catch (error: any) {
    console.error("❌ Error enviando email:");
    console.error("Mensaje:", error.message);
    console.error("Código:", error.Code || error.name);

    if (error.Code === 'MessageRejected' || error.message.includes('not verified')) {
      console.error("\n⚠️  El email 'notificaciones@formmy.app' NO está verificado en SES");
      console.error("   O tu cuenta SES está en Sandbox Mode");
    }
  }
}

test();
