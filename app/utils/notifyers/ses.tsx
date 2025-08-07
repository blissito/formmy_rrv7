import nodemailer from "nodemailer";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

let sesClient;
const getSesClient = () => {
  // @ts-ignore
  sesClient ??= new SESClient({
    region: process.env.SES_REGION,
    credentials: {
      accessKeyId: process.env.SES_KEY,
      secretAccessKey: process.env.SES_SECRET,
    },
  });
  return sesClient;
};
export const getSesTransport = () => {
  return nodemailer.createTransport({
    SES: {
      ses: getSesClient(),
      aws: { SendRawEmailCommand },
    },
  });
};

export const getSesRemitent = () => `Formmy <notificaciones@formmy.app>`;
