import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

type WeeklyMetrics = {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  averageResponseTime?: number;
};

type WeekSummaryEmail = {
  email: string;
  name?: string;
  chatbotName?: string;
  metrics?: WeeklyMetrics;
};

const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.formmy.app";

// create transporter
export const sendgridTransport = getSesTransport();

export const sendWeekSummaryEmail = async ({ email, name, chatbotName, metrics }: WeekSummaryEmail) => {
  // Default metrics if none provided
  const defaultMetrics = {
    totalConversations: 0,
    totalMessages: 0,
    averageMessagesPerConversation: 0,
  };
  
  const actualMetrics = metrics || defaultMetrics;
  return sendgridTransport
    .sendMail({
      from: getSesRemitent(),
      to: email,
      subject: "📊 Esta semana en Formmy",
      html: `
        <html>
        <head>
            <title>📊 Esta semana en Formmy </title>
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
                <img
                    alt="cover"
                    style="width: 100%; height: auto"
                    src="https://i.imgur.com/NwfDldt.png"
                />
                <h2
                    style="
                    color: #000000;
                    font-size: 24px;
                    margin-top: 24px;
                    line-height: 120%;
                    text-align: left;
                    "
                >
                    ¡Hola ${name || 'amigo'}! aquí está tu resumen semanal de tu chatbot
                    <span style="color: #7271cc"> ${chatbotName || 'Ghosty'} 🤖</span>
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
                    Echa un vistazo a cómo tu chatbot IA trabajó por ti esta semana:
                </p>
                <p
                    style="
                    margin-top: 16px;
                    margin-bottom: 8px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >
                    🤖 Conversaciones totales: ${actualMetrics.totalConversations}
                </p>
                <p
                    style="
                    margin-top: 8px;
                    margin-bottom: 8px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >
                    💬 Mensajes respondidos: ${actualMetrics.totalMessages}
                </p>
                <p
                    style="
                    margin-top: 8px;
                    margin-bottom: 8px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >
                    ⭐ Mensajes promedio por conversación: ${actualMetrics.averageMessagesPerConversation}
                </p>
                <p
                    style="
                    margin-top: 8px;
                    margin-bottom: 8px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >
                    ⏱ Tiempo promedio de respuesta: ${actualMetrics.averageResponseTime ? `${actualMetrics.averageResponseTime}ms` : 'N/A'}
                </p>
                <p
                    style="
                    margin-top: 16px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Consulta el detalle completo en tu dashboard.
                </p>
                <p
                    style="
                    margin-top: 16px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Nos encanta ver cómo tu chatbot ayuda a mantener conversaciones más
                    rápidas y efectivas con tus clientes.
                </p>
                <a href="https://www.formmy.app/dashboard/ghosty" target="blank">
                    <button
                    style="
                        background: #9a99ea;
                        height: 40px;
                        font-weight: 500;
                        border-radius: 8px;
                        color: white;
                        width: 120px;
                        text-align: center;
                        font-size: 16px;
                        margin-top: 8px;
                        margin-bottom: 8px;
                        border: none;
                    "
                    >
                    Ir al dashboard
                    </button>
                </a>

                <p
                    style="
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Saludos,
                </p>
                <p
                    style="
                    margin-top: -16px;
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
                    <p style="color: #81838e; font-size: 10px; text-align: center; margin-top: 8px;">
                        <a href="https://www.formmy.app/unsubscribe?email=${encodeURIComponent(email)}&type=weekly" 
                           style="color: #81838e; text-decoration: underline;">
                           ¿No deseas recibir estos correos? Darse de baja
                        </a>
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
    .then((r: any) => {
      console.log('Week summary email sent successfully:', r);
    })
    .catch((e: Error) => console.error('Error sending week summary email:', e));
};