import { EmailService } from "../email/email.service";
import {
  createEmailTemplate,
  emailH2,
  emailParagraph,
  emailTeamSignature
} from "../email/templates/base-template";

type ConversationsPurchaseEmail = {
  email: string;
  name?: string;
  conversations: number;
  newTotal: number;
};

export const sendConversationsPurchaseEmail = async ({
  email,
  name,
  conversations,
  newTotal
}: ConversationsPurchaseEmail) => {
  const content = `
    ${emailH2(`¡Gracias por tu compra, ${name || 'amigo'}! 🎉`)}
    ${emailParagraph(
      `Tu compra de <strong>${conversations.toLocaleString()} conversaciones adicionales</strong> ha sido procesada exitosamente.`
    )}
    ${emailParagraph(
      `Ahora tienes un total de <strong>${newTotal.toLocaleString()} conversaciones disponibles</strong> para usar con tus chatbots.`
    )}
    ${emailParagraph(
      `Estas conversaciones te permitirán:`,
      { align: 'left' }
    )}
    <ul style="color: #4b5563; line-height: 140%; font-size: 16px; margin-top: -8px;">
      <li>Mantener más conversaciones activas simultáneamente</li>
      <li>Atender a más clientes sin interrupciones</li>
      <li>Escalar tu servicio de atención 24/7</li>
      <li>Captar más leads y cerrar más ventas</li>
    </ul>
    ${emailParagraph(
      `Consulta el uso de tus conversaciones en tiempo real desde tu dashboard.`
    )}
    ${emailTeamSignature('¡A seguir creciendo! 📈')}
  `;

  const html = createEmailTemplate({
    title: "Compra de conversaciones exitosa",
    subject: "✅ Tu compra de conversaciones ha sido procesada",
    coverImage: "https://i.imgur.com/LpPvhSi.png",
    content,
    button: {
      text: "Ver mi dashboard",
      url: "https://www.formmy.app/dashboard",
      width: "160px"
    },
    recipientEmail: email
  });

  await EmailService.send({
    to: email,
    subject: "✅ Tu compra de conversaciones ha sido procesada",
    html
  });
};
