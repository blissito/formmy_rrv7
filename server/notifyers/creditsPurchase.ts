import { EmailService } from "../email/email.service";
import {
  createEmailTemplate,
  emailH2,
  emailParagraph,
  emailTeamSignature
} from "../email/templates/base-template";

type CreditsPurchaseEmail = {
  email: string;
  name?: string;
  credits: number;
  newBalance: number;
};

export const sendCreditsPurchaseEmail = async ({
  email,
  name,
  credits,
  newBalance
}: CreditsPurchaseEmail) => {
  const content = `
    ${emailH2(`¡Gracias por tu compra, ${name || 'amigo'}! 🎉`)}
    ${emailParagraph(
      `Tu compra de <strong>${credits.toLocaleString()} créditos</strong> ha sido procesada exitosamente.`
    )}
    ${emailParagraph(
      `Tu nuevo balance es de <strong>${newBalance.toLocaleString()} créditos</strong> y ya están disponibles en tu cuenta.`
    )}
    ${emailParagraph(
      `Usa tus créditos para:`,
      { align: 'left' }
    )}
    <ul style="color: #4b5563; line-height: 140%; font-size: 16px; margin-top: -8px;">
      <li>Procesar documentos con LlamaParse</li>
      <li>Hacer consultas a tu base de conocimiento (RAG)</li>
      <li>Generar contenido con tu chatbot IA</li>
      <li>Usar funciones avanzadas de análisis</li>
    </ul>
    ${emailParagraph(
      `Consulta tu balance y uso de créditos en tiempo real desde tu dashboard.`
    )}
    ${emailTeamSignature('¡A seguir construyendo! 🚀')}
  `;

  const html = createEmailTemplate({
    title: "Compra de créditos exitosa",
    subject: "✅ Tu compra de créditos ha sido procesada",
    coverImage: "https://i.imgur.com/rbQGsVf.png",
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
    subject: "✅ Tu compra de créditos ha sido procesada",
    html
  });
};
