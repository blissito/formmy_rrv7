import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

type NoUsageEmail = {
  email: string;
  name?: string;
};

const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.formmy.app";

// create transporter
export const sendgridTransport = getSesTransport();

export const sendNoUsageEmail = async ({ email, name }: NoUsageEmail) => {
  return sendgridTransport
    .sendMail({
      from: getSesRemitent(),
      to: email,
      subject: "¡Tu Formmy aún no está en acción!",
      html: `
        <html>
        <head>
            <title>¡Tu Formmy aún no está en acción!</title>
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
                    src="https://i.imgur.com/N8uvxtt.png"
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
                    ¡Hey ${name || 'amigo'}! Tu cuenta ya está lista… pero tu Formmy aún no.
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
                    Con Formmy puedes crear un formulario personalizado o activar un
                    chatbot con IA en minutos. Sin código, sin enredos. Ya diste el
                    primer paso… ahora deja que tu web haga el resto.
                </p>
                <p
                    style="
                    margin-top: 16px;
                    margin-bottom: 4px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    ¿Qué puedes hacer hoy mismo?
                </p>
                <p
                    style="
                    margin-top: 4px;
                    margin-bottom: 4px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    📋 Crear tu primer formulario
                </p>
                <p
                    style="
                    margin-top: 4px;
                    margin-bottom: 4px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    💬 Configurar un chat con IA
                </p>
                <p
                    style="
                    margin-top: 4px;
                    margin-bottom: 16px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    🚀 Integrarlo a tu sitio ¡solo copia y pega!
                </p>

                <p
                    style="
                    margin-top: 0px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >
                    Hazlo en menos de 5 minutos y empieza a captar leads, responder
                    preguntas y mejorar la experiencia de tus clientes.
                </p>

                <a href="https://www.formmy.app/dashboard/ghosty" target="blank">
                    <button
                    style="
                        background: #9a99ea;
                        height: 40px;
                        font-weight: 500;
                        border-radius: 8px;
                        color: white;
                        width: 140px;
                        text-align: center;
                        font-size: 16px;
                        margin-top: 8px;
                        margin-bottom: 8px;
                        border: none;
                    "
                    >
                    ¡Empezar ya!
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
                    Nos encantaría ver lo que construyes.
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
                        <a href="https://www.formmy.app/unsubscribe?email=${encodeURIComponent(email)}&type=marketing" 
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
      console.log('No usage email sent successfully:', r);
    })
    .catch((e: Error) => console.error('Error sending no usage email:', e));
};