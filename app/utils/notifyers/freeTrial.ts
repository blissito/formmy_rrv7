import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

type FreeTrialEmail = {
  email: string;
  name?: string;
};

const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.formmy.app";

// create transporter
export const sendgridTransport = getSesTransport();

export const sendFreeTrialEmail = async ({ email, name }: FreeTrialEmail) => {
  return sendgridTransport
    .sendMail({
      from: getSesRemitent(),
      to: email,
      subject: "⏳ Últimos días de Formmy Chat 😱",
      html: `
        <html>
        <head>
            <title>⏳ Últimos días de Formmy Chat 😱</title>
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
                    ¡Hola ${name || 'amigo'}! Tu chatbot IA está por desconectarse
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
                    Tu chatbot IA ha estado trabajando duro estos días 🧠💬.
                    Respondiendo dudas, guiando a tus clientes y dándole vida a tu
                    sitio. Pero tu
                    <strong>
                    prueba gratuita de 30 días está a punto de terminar… ⏳</strong
                    >
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
                    ¿Y si te decimos que puedes mantenerlo activo por mucho menos?
                </p>
                <a href="https://www.formmy.app/dashboard/ghosty" target="blank">
                    <p
                    style="
                        margin-top: 16px;
                        color: #7271cc;
                        text-align: justify;
                        line-height: 140%;
                        font-size: 16px;
                        text-decoration: underline;
                    "
                    >
                    💥 Activa tu plan ahora y obtén 50% de descuento durante tu primer
                    año.
                    </p>
                </a>
                <p
                    style="
                    margin-top: 16px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Así es, tu Formmy Chat IA seguirá funcionando 24/7 – respondiendo,
                    vendiendo y dando soporte – por la mitad de precio. Pero esta oferta
                    expira cuando termine tu prueba gratuita.
                </p>

                <p
                    style="
                    margin-top: 0px;
                    color: #4b5563;
                    text-align: justify;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Tu chatbot IA ya abrió una nueva forma de conectar con tus clientes.
                    Y lo mejor es que apenas está comenzando.
                </p>

                <a href="https://www.formmy.app/dashboard/ghosty" target="blank">
                    <button
                    style="
                        background: #9a99ea;
                        height: 40px;
                        font-weight: 500;
                        border-radius: 8px;
                        color: white;
                        width: 260px;
                        text-align: center;
                        font-size: 16px;
                        margin-top: 8px;
                        margin-bottom: 8px;
                        border: none;
                    "
                    >
                    Sí, quiero mi 50% y mi chatbot 👻
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
                    Haz que tu web no se quede muda 😉
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
      console.log('Free Trial email sent successfully:', r);
    })
    .catch((e: Error) => console.error('Error sending free trial email:', e));
};