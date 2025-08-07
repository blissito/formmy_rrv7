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
        <title>¡Te han invitado a Formmy!</title>
      </head>
      <body style="font-family:Arial;">
        <div style="margin:0 auto;text-align:center;padding-top:16px;font-family:sans-serif;">
        <h2>¡Te han invitado a Formmy! 🎉</h2>
        <p style="font-weight:bold;font-size:18px;">
           Ahora puedes ser parte del Formmy: ${project.name}
        </p>
        
        <a href="${host}/dash?projectId=${project.id}">
            <button style="padding:14px 16px;border-radius:9px;border:none;box-shadow:1px 1px 1px gray;background-color:#AEADEF;color:white;font-size:16px;cursor:pointer;margin-bottom:32px">
            Aceptar Invitación
        </button>
        </a>
        <br/>  
        <img src="https://i.imgur.com/dvGDfHO.png" />
        
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
