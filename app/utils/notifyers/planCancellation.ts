import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

type PlanCancellationType = {
  email: string;
  endDate: string; // Format: "20 de noviembre de 2025"
};

const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.formmy.app";

// create transporter
export const sendgridTransport = getSesTransport();

export const sendPlanCancellation = async ({ email, endDate }: PlanCancellationType) => {
  return sendgridTransport
    .sendMail({
      from: getSesRemitent(),
      to: email,
      subject: "Esta es una triste despedida",
      html: `
        <html>
        <head>
            <title>Tu suscripción a Formmy PRO ha sido cancelada</title>
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
                <h2
                    style="
                    color: #191a20;
                    font-size: 24px;
                    margin-top: 16px;
                    line-height: 120%;
                    text-align: left;
                    "
                >
                    Esta es una triste despedida 😔
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
                    Tu suscripción a
                    <strong> Formmy PRO✨ ha sido cancelada exitosamente</strong>.
                </p>
                <p
                    style="
                    margin-top: 12px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Tu acceso a las funciones del Plan Pro estará disponible hasta el
                    final del período de facturación actual, el
                    <strong>${endDate}</strong>.
                </p>
                <p
                    style="
                    margin-top: 12px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Lamentamos verte partir, pero agradecemos que hayas sido parte de
                    nuestra comunidad. Si decides regresar en el futuro, estaremos
                    encantados de darte la bienvenida nuevamente.
                </p>
                <p
                    style="
                    margin-top: 12px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Si hubo algún motivo para esta decisión o si tienes alguna
                    sugerencia para mejorar, nos encantaría escucharte. Tu opinión es
                    muy valiosa para nosotros. Escríbenos a
                    <a
                    href="mailto:hola@formmy.app"
                    target="blank"
                    rel="noreferrer"
                    >
                    <span style="text-decoration: underline; color: #8c8be2"
                        >hola@formmy.app</span
                    ></a
                    >
                </p>
                <p
                    style="
                    margin-top: 12px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    "
                >
                    Esta no es una despedida, es un hasta pronto.
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
                    - El equipo de Formmy 👻
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
      console.log('Cancellation email sent successfully:', r);
    })
    .catch((e: Error) => console.error('Error sending cancellation email:', e));
};