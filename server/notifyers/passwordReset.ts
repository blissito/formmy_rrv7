import { getSesRemitent, getSesTransport } from "./ses";

type PasswordResetEmail = {
  email: string;
  name?: string;
  resetLink: string;
};

const transport = getSesTransport();

export const sendPasswordResetEmail = async ({
  email,
  name,
  resetLink,
}: PasswordResetEmail) => {
  console.log("📧 [sendPasswordResetEmail] Enviando a:", email);

  return transport
    .sendMail({
      from: getSesRemitent(),
      to: email,
      subject: "Restablece tu contraseña - Formmy",
      html: `
    <html>
    <head>
        <title>Restablece tu contraseña</title>
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
            <div style="padding: 4% 4% 16px 4%;">
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
                Hola${name ? ` ${name}` : ""},
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
                Recibimos una solicitud para restablecer tu contraseña.
                Haz clic en el botón de abajo para crear una nueva.
            </p>

            <a href="${resetLink}" target="blank">
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
                    margin-top: 8px;
                    margin-bottom: 24px;
                    border: none;
                    cursor: pointer;
                "
                >
                Restablecer contraseña
                </button>
            </a>

            <p
                style="
                margin-top: 16px;
                color: #6b7280;
                text-align: left;
                line-height: 140%;
                font-size: 14px;
                "
            >
                Este enlace expira en <strong>1 hora</strong>.
            </p>
            <p
                style="
                margin-top: 8px;
                color: #6b7280;
                text-align: left;
                line-height: 140%;
                font-size: 14px;
                "
            >
                Si no solicitaste este cambio, ignora este email.
            </p>
            <hr
                style="
                background: #f2f2f2;
                height: 1px;
                border: none;
                width: 100%;
                margin-top: 32px;
                margin-bottom: 16px;
                "
            />
            <p
                style="
                color: #9ca3af;
                text-align: left;
                line-height: 140%;
                font-size: 12px;
                margin-bottom: 24px;
                "
            >
                Si el botón no funciona, copia este enlace:<br />
                <a href="${resetLink}" style="color: #9a99ea; word-break: break-all;">
                ${resetLink}
                </a>
            </p>
            </div>
        </div>
        </div>
    </body>
    </html>
      `,
    })
    .then((r: any) => {
      console.log("📧 [sendPasswordResetEmail] ✅ Enviado");
      return r;
    })
    .catch((e: Error) => {
      console.error("📧 [sendPasswordResetEmail] ❌ Error:", e);
      throw e;
    });
};
