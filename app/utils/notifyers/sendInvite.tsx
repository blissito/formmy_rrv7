import { type Project } from "@prisma/client";
import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

type SuccessfulSubmitType = {
  project: Project;
  email: string;
};
const host =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.formmy.app";
// create transporter
export const sendgridTransport = getSesTransport();

export const sendInvite = async ({ project, email }: SuccessfulSubmitType) => {
  return sendgridTransport
    .sendMail({
      from: getSesRemitent(),
      // to: getSesRemitent(), // Required by SES
      subject: "🪪 Te han invitado a Formmy",
      bcc: [email],
      html: `
        <html>
        <head>
            <title>🪪 Te han invitado a Formmy</title>
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
                    ¡Te han invitado a Formmy! 🎉
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
                    Has recibido una invitación para unirte a un espacio de trabajo en Formmy.
                </p>
                <p
                    style="
                    margin-top: 16px;
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    font-weight: bold;
                    "
                >
                    Proyecto: ${project.name}
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
                    Al aceptar la invitación, podrás colaborar en este proyecto, gestionar formularios y chatbots, y acceder a todas las funcionalidades del equipo.
                </p>

                <a href="${host}/dash?projectId=${project.id}" target="blank">
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
                    Aceptar Invitación
                    </button>
                </a>

                <p
                    style="
                    color: #4b5563;
                    text-align: left;
                    line-height: 140%;
                    font-size: 16px;
                    margin-top: 24px;
                    "
                >
                    ¡Bienvenido al equipo! 🚀
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
      console.log(r);
    })
    .catch((e: Error) => console.log(e));
};
