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
                <div style="padding: 4% 4% 16px 4%">
                <img
                    alt="logo"
                    style="height: 32px; width: auto"
                    src="https://www.formmy.app/assets/formmy-logo.png"
                />
                </div>
                <div style="padding: 0 4%">
                <h2
                    style="
                    color: #000000;
                    font-size: 24px;
                    margin-top: 24px;
                    line-height: 120%;
                    text-align: left;
                    "
                >
                    🔔 Recordatorio programado
                </h2>
                <p
                    style="
                    margin-top: 12px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Hola,
                </p>
                <p
                    style="
                    margin-top: 16px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Tu asistente <strong>${chatbotName}</strong> te recuerda:
                </p>

                <div style="margin-top: 24px; margin-bottom: 24px;">
                    <div
                        style="
                        border-radius: 12px;
                        padding: 20px;
                        text-align: left;
                        background: #f5f5f5;
                        display: inline-block;
                        "
                    >
                        <p
                        style="
                            color: #4b5563;
                            font-size: 14px;
                            margin: 0 0 8px 0;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            font-weight: 600;
                        "
                        >
                        📅 ${title}
                        </p>
                        <p
                        style="
                            color: #9a99ea;
                            font-size: 18px;
                            font-weight: bold;
                            margin: 8px 0 0px;
                            letter-spacing: 1px;
                        "
                        >
                        🕒 ${formattedDate}
                        </p>
                    </div>
                </div>

                <p
                    style="
                    margin-top: 16px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    ¡No olvides tu cita! Si necesitas reprogramar o tienes alguna pregunta, puedes contactarnos.
                </p>

                <a href="${host}/dashboard" target="blank">
                    <button
                    style="
                        background: #9a99ea;
                        height: 40px;
                        font-weight: 500;
                        border-radius: 8px;
                        color: white;
                        width: 200px;
                        text-align: center;
                        font-size: 16px;
                        margin-top: 24px;
                        margin-bottom: 8px;
                        border: none;
                        cursor: pointer;
                    "
                    >
                    Ir a mi Dashboard
                    </button>
                </a>

                <p
                    style="
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 14px;
                    margin-top: 32px;
                    "
                >
                    Este recordatorio fue programado a través de tu chatbot <strong>${chatbotName}</strong>
                </p>
                <p
                    style="
                    margin-top: -8px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >
                    — El equipo de Formmy 👻
                </p>
                <hr
                    style="
                    background: #f2f2f2;
                    height: 1px;
                    border: none;
                    width: 100%;
                    margin-top: 32px;
                    margin-bottom: 0px;
                    "
                />
                </div>
                <div style="padding: 4%">
                <div style="text-align: center; margin-bottom: 0px">
                    <a
                    href="https://www.facebook.com/profile.php?id=61554028371141"
                    target="blank"
                    style="text-decoration: none"
                    >
                    <img
                        alt="facebook"
                        style="width: 16px; height: 16px; margin: 0 4px"
                        src="https://i.imgur.com/1yIQM74.png"
                    />
                    </a>
                    <a
                    href="https://www.instagram.com/_formmyapp/"
                    target="blank"
                    style="text-decoration: none"
                    >
                    <img
                        alt="instagram"
                        style="width: 16px; height: 16px; margin: 0 4px"
                        src="https://i.imgur.com/7l8Kwze.png"
                    />
                    </a>
                    <a
                    href="https://www.linkedin.com/company/formmyapp/"
                    target="blank"
                    style="text-decoration: none"
                    >
                    <img
                        alt="linkedin"
                        style="width: 18px; height: 18px; margin: 0 4px"
                        src="https://i.imgur.com/isFeBmr.png"
                    />
                    </a>

                    <a
                    href="https://x.com/FormmyApp1"
                    target="blank"
                    style="text-decoration: none"
                    >
                    <img
                        alt="twitter"
                        style="width: 16px; height: 16px; margin: 0 4px"
                        src="https://i.imgur.com/RFCc0w1.png"
                    />
                    </a>
                    <a
                    href="https://www.youtube.com/@_FormmyApp"
                    target="blank"
                    style="text-decoration: none"
                    >
                    <img
                        alt="youtube"
                        style="width: 16px; height: 16px; margin: 0 4px"
                        src="https://i.imgur.com/GxqCb6n.png"
                    />
                    </a>
                    <div style="text-align: center; margin-top: 16px">
                    <p style="color: #81838e; font-size: 12px">
                        Chatea. Conecta. Y convierte.
                    </p>
                    <p style="color: #81838e; font-size: 8px">
                        Derechos Reservados 2025 ®
                    </p>
                    </div>
                </div>
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