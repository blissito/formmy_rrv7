import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

type WelcomeEmail = {
  email: string;
  name?: string;
};

const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.formmy.app";

// create transporter
export const sendgridTransport = getSesTransport();

export const sendWelcomeEmail = async ({ email, name }: WelcomeEmail) => {
  return sendgridTransport
    .sendMail({
      from: getSesRemitent(),
      to: email,
      subject: "Bienevenid@ a FormmyApp 🚀",
      html: `
    <html>
    <head>
        <title>Bienevenid@ a FormmyApp 🚀</title>
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
            <img
                alt="cover"
                style="width: 100%; height: 132px"
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
                ¡Nos emociona tenerte aquí! 🚀
            </h2>
            <p
                style="
                margin-top: 12px;
                margin-bottom: 24px;
                color: #4b5563;
                text-align: left;
                line-height: 140%;
                font-size: 16px;
                "
            >
                Con Formmy puedes crear formularios personalizados y activar un chat
                con IA que responde por ti 24/7. En minutos, tu sitio web estará
                captando leads, respondiendo preguntas y generando resultados.
            </p>
            <div
                style="
                text-align: left;
                width: 100%;
                margin: 0 auto;
                margin-bottom: 24px;
                "
            >
                <table>
                <tr>
                    <td>
                    <img
                        alt="cover"
                        style="width: 100px; height: 100px"
                        src="https://i.imgur.com/W4RDOyd.png"
                    />
                    </td>
                    <td style="padding-left: 16px">
                    <h3
                        style="
                        margin: 0px;
                        color: #191a20;
                        font-size: 16px;
                        padding-top: 16px;
                        "
                    >
                        Crea tu primer Chatbot IA
                    </h3>
                    <p
                        style="
                        margin-top: 4px;
                        color: #4b5563;
                        line-height: 120%;
                        font-size: 14px;
                        "
                    >
                        Diseña un asistente virtual que responda preguntas, guíe a
                        tus visitantes y trabaje por ti las 24 horas.
                    </p>
                    </td>
                </tr>
                </table>
                <table style="margin-top: 16px">
                <tr>
                    <td>
                    <img
                        alt="cover"
                        style="width: 100px; height: 100px"
                        src="https://i.imgur.com/LpPvhSi.png"
                    />
                    </td>
                    <td style="padding-left: 16px">
                    <h3 style="margin: 0px; font-size: 16px; padding-top: 16px">
                        Agrega tu primer formmy de contacto
                    </h3>
                    <p
                        style="
                        margin-top: 4px;
                        color: #4b5563;
                        line-height: 120%;
                        font-size: 14px;
                        "
                    >
                        Recibe mensajes y datos de tus clientes de forma sencilla.
                        Solo pega el código en tu web y empieza a recibir respuestas
                        al instante.
                    </p>
                    </td>
                </tr>
                </table>
                <table style="margin-top: 16px">
                <tr>
                    <td>
                    <img
                        alt="cover"
                        style="width: 100px; height: 100px"
                        src="https://i.imgur.com/rbQGsVf.png"
                    />
                    </td>
                    <td style="padding-left: 16px">
                    <h3 style="margin: 0px; font-size: 16px; padding-top: 16px">
                        Crea un formmy de suscripción
                    </h3>
                    <p
                        style="
                        margin-top: 4px;
                        color: #4b5563;
                        line-height: 120%;
                        font-size: 14px;
                        "
                    >
                        Consigue que más personas se unan a tu lista. Conecta tu
                        formulario y empieza a recibir suscriptores sin
                        complicaciones.
                    </p>
                    </td>
                </tr>
                </table>
            </div>
            <p
                style="
                margin-top: 16px;
                color: #4b5563;
                text-align: justify;
                line-height: 140%;
                font-size: 16px;
                "
            >
                Con Formmy puedes crear formularios personalizados y activar un chat
                con IA que responde por ti 24/7. En minutos, tu sitio web estará
                captando leads, respondiendo preguntas y generando resultados.
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
                    margin-top: 24px;
                    margin-bottom: 24px;
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
                Bienvenido a la nueva era de los sitios que conversan.
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
      console.log('Welcome email sent successfully:', r);
    })
    .catch((e: Error) => console.error('Error sending welcome email:', e));
};