import nodemailer from "nodemailer";
import { getSesRemitent, getSesTransport } from "./ses";

// create transporter
export const sendgridTransport = getSesTransport();

export const notifyOwner = async ({
  projectId,
  projectName,
  emails,
}: {
  projectName: string;
  projectId: string;
  emails: string[];
}) =>
  sendgridTransport
    .sendMail({
      from: getSesRemitent(),
      subject: "👻 Nuevo mensaje en Formmy",
      bcc: emails,
      html: `
      <html>
      <head>
        <title>Nuevo mensaje en tu Formmy</title>
      </head>
      <body style="font-family:Arial;">
        <div style="margin:0 auto;text-align:center;padding-top:16px;font-family:sans-serif;">
        <h2>¡Tu Formmy ha recibido un nuevo mensaje! 🎉</h2>
        <p style="font-weight:normal;font-size:18px;color:#4B5563;">
            Has recibido un nuevo mensaje en tu formmy: ${projectName}
        </p>
        
        <a href="https://www.formmy.app/dash/${projectId}">
            <button style="padding:14px 16px;border-radius:9px;border:none;box-shadow:1px 1px 1px #cccccc;background-color:#AEADEF;color:white;font-size:16px;cursor:pointer;margin-bottom:32px; border:none;">
            Ver el mensaje
        </button>
        </a>
        <br/>  
        <img style="height:120px;" alt="fantasma" src="https://i.imgur.com/DPhjVP5.png" />
        
        </div>
      </body>
    </html>
        `,
    })
    .then((r: any) => {
      console.log(r);
    })
    .catch((e: Error) => console.log(e));
