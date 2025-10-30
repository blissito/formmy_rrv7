import nodemailer from "nodemailer";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

const getSesClient = () => {
  // Crear nuevo cliente cada vez para asegurar credenciales frescas
  return new SESClient({
    region: process.env.SES_REGION,
    credentials: {
      accessKeyId: process.env.SES_KEY!,
      secretAccessKey: process.env.SES_SECRET!,
    },
  });
};
export const getSesTransport = () => {
  return nodemailer.createTransport({
    SES: {
      ses: getSesClient(),
      aws: { SendRawEmailCommand },
    },
  });
};

export const getSesRemitent = () => `Formmy <no-reply@formmy.app>`;
