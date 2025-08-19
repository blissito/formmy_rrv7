import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

type ReminderEmail = {
  email: string;
  title: string;
  date: Date;
  chatbotName: string;
};

const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.formmy.app";

// create transporter
export const sesTransport = getSesTransport();

export const sendReminderEmail = async ({ email, title, date, chatbotName }: ReminderEmail) => {
  const formattedDate = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return sesTransport
    .sendMail({
      from: getSesRemitent(),
      to: email,
      subject: `🔔 Recordatorio: ${title}`,
      html: `
    <html>
    <head>
        <title>🔔 Recordatorio: ${title}</title>
    </head>
    <body style="font-family: Arial; background: #191a20">
        <div style="background: #191a20; margin: 0 auto; padding: 24px 16px">
        <div
            style="
            text-align: left;
            background-color: white;
            border-radius: 16px;
            margin: 0 auto;
            max-width: 600px;
            overflow: hidden;
            "
        >
            <div
            style="
                padding: 4% 4% 16px 4%;
            "
            >
            <img
                alt="logo"
                style="height: 32px; width: auto"
                src="https://www.formmy.app/assets/formmy-logo.png"
            />
            </div>
            <div style="padding: 0 4%">
            <h1 style="font-size: 22px; font-weight: bold; color: #191a20; margin-bottom: 16px">
                🔔 Recordatorio
            </h1>
            <p style="font-size: 16px; margin-bottom: 16px; color: #4a4a4a; line-height: 1.5">
                Hola,
            </p>
            <p style="font-size: 16px; margin-bottom: 16px; color: #4a4a4a; line-height: 1.5">
                Tu asistente <strong>${chatbotName}</strong> te recuerda:
            </p>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #007bff">
                <h2 style="font-size: 18px; font-weight: bold; color: #191a20; margin: 0 0 12px 0">
                    📅 ${title}
                </h2>
                <p style="font-size: 16px; color: #4a4a4a; margin: 0; font-weight: 500">
                    🕒 ${formattedDate}
                </p>
            </div>
            <p style="font-size: 16px; margin-bottom: 24px; color: #4a4a4a; line-height: 1.5">
                ¡No olvides tu cita! Si necesitas reprogramar o tienes alguna pregunta, puedes contactarnos.
            </p>
            <div style="text-align: center; margin: 32px 0">
                <a
                href="${host}/dashboard"
                style="
                    background: #007bff;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    display: inline-block;
                "
                >
                Ir a mi Dashboard
                </a>
            </div>
            </div>
            <div
            style="
                padding: 24px 4% 4% 4%;
                text-align: center;
                color: #888;
                font-size: 14px;
            "
            >
            <p style="margin: 0">
                Este recordatorio fue programado a través de tu chatbot <strong>${chatbotName}</strong>
            </p>
            <p style="margin: 8px 0 0 0">
                <a href="${host}" style="color: #007bff; text-decoration: none"
                >FormmyApp</a
                > - Chatbots inteligentes para tu negocio
            </p>
            </div>
        </div>
        </div>
    </body>
    </html>
    `,
    })
    .then((info) => {
      console.log("✅ Reminder email sent: %s", info.messageId);
      return info;
    })
    .catch((error) => {
      console.error("❌ Error sending reminder email:", error);
      throw error;
    });
};