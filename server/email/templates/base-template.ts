/**
 * Base Email Template System
 * Respeta 100% el branding de Formmy - NO MODIFICAR ESTILOS
 */

interface EmailButton {
  text: string;
  url: string;
  width?: string;
}

interface EmailTemplateOptions {
  title: string;
  subject: string;
  coverImage?: string;
  content: string; // HTML content del cuerpo
  button?: EmailButton;
  recipientEmail: string;
}

/**
 * Header con logo Formmy
 * Estilos exactos del branding
 */
function emailHeader(): string {
  return `
    <div style="padding: 4% 4% 16px 4%">
      <img
        alt="logo"
        style="height: 32px; width: auto"
        src="https://www.formmy.app/assets/formmy-logo.png"
      />
    </div>
  `;
}

/**
 * Footer con redes sociales
 * Estilos exactos del branding
 */
function emailFooter(): string {
  return `
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
  `;
}

/**
 * Botón CTA
 * Estilos exactos del branding
 */
function emailButton(button: EmailButton): string {
  return `
    <a href="${button.url}" target="blank">
      <button
        style="
          background: #9a99ea;
          height: 40px;
          font-weight: 500;
          border-radius: 8px;
          color: white;
          width: ${button.width || '140px'};
          text-align: center;
          font-size: 16px;
          margin-top: 24px;
          margin-bottom: 24px;
          border: none;
        "
      >
        ${button.text}
      </button>
    </a>
  `;
}

/**
 * Firma del equipo Formmy
 * Estilos exactos del branding
 */
function emailSignature(customText?: string): string {
  return `
    <p
      style="
        color: #4b5563;
        text-align: left;
        line-height: 140%;
        font-size: 16px;
      "
    >
      ${customText || 'Bienvenido a la nueva era de los sitios que conversan.'}
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
  `;
}

/**
 * Imagen de portada opcional
 */
function emailCover(imageUrl: string): string {
  return `
    <img
      alt="cover"
      style="width: 100%; height: auto"
      src="${imageUrl}"
    />
  `;
}

/**
 * Template base para todos los correos
 * Respeta 100% el branding de Formmy
 */
export function createEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    coverImage,
    content,
    button
  } = options;

  return `
    <html>
    <head>
      <title>${title}</title>
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
          ${emailHeader()}
          <div style="padding: 0 4%">
            ${coverImage ? emailCover(coverImage) : ''}
            ${content}
            ${button ? emailButton(button) : ''}
            ${emailFooter()}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Helper: Título H2
 * Estilos exactos del branding
 */
export function emailH2(text: string): string {
  return `
    <h2
      style="
        color: #000000;
        font-size: 24px;
        margin-top: 24px;
        line-height: 120%;
        text-align: left;
      "
    >
      ${text}
    </h2>
  `;
}

/**
 * Helper: Párrafo
 * Estilos exactos del branding
 */
export function emailParagraph(text: string, options?: { align?: 'left' | 'justify'; bold?: boolean }): string {
  const align = options?.align || 'left';
  const fontWeight = options?.bold ? 'font-weight: bold;' : '';

  return `
    <p
      style="
        margin-top: 12px;
        color: #4b5563;
        text-align: ${align};
        line-height: 140%;
        font-size: 16px;
        ${fontWeight}
      "
    >
      ${text}
    </p>
  `;
}

/**
 * Helper: Firma del equipo
 */
export function emailTeamSignature(greeting: string = 'Un abrazo'): string {
  return emailSignature(greeting);
}
