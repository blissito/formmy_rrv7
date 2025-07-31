import React from "react";

const CelebrationFlip = ({
  mainText = "4000 SUSCRIPTORES",
  subText = "¡GRACIAS!",
  mainColor = "dodgerblue",
  subColor = "hotpink",
  duration = 3,
  showFooter = true,
  footerText = "¡Celebrando nuestros increíbles suscriptores!",
}) => {
  // Estilos CSS como objeto JavaScript
  const styles = {
    container: {
      fontFamily: '"Courier New", monospace', // Fallback sin dependencias externas
      background: "#111",
      margin: 0,
      padding: "1rem",
      minHeight: "100vh",
      display: "grid",
      placeContent: "center",
      gridTemplateRows: "1fr auto",
      boxSizing: "border-box",
    },
    section: {
      alignContent: "center",
      fontFamily: '"Courier New", monospace',
    },
    flipText: {
      "--clr-1": mainColor,
      "--clr-2": subColor,
      "--translate-distance": "1lh",
      "--duration": `${duration}s`,
      "--timing-function": "cubic-bezier(0.66, 0, 0.34, 1)",
      overflowY: "hidden",
      width: "min(100%, 1200px)",
      marginInline: "auto",
      display: "grid",
      gridAutoColumns: "1fr",
      gridAutoFlow: "column",
      gap: 0,
      fontSize: "clamp(1rem, 4.5vw + 0.05rem, 5rem)",
      fontWeight: 700,
      color: "var(--clr-1)",
      lineHeight: 1,
    },
    flipTextSecond: {
      fontSize: "clamp(1rem, 3.5vw + 0.05rem, 3rem)",
      fontWeight: 300,
      color: "var(--clr-2)",
      "--delay-factor": "300ms",
    },
    span: {
      display: "grid",
      placeContent: "center",
      animation:
        "flip-transform var(--duration) var(--timing-function) infinite var(--delay), flip-translate var(--duration) var(--timing-function) infinite var(--delay)",
    },
    footer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      fontSize: "0.7rem",
      color: "#aaa",
      marginTop: "2rem",
    },
  };

  // Función para crear spans con delays individuales
  const createSpans = (text, isSecond = false) => {
    return text.split("").map((char, index) => (
      <span
        key={index}
        style={{
          ...styles.span,
          "--delay": `calc(${index + 1} * 100ms + var(--delay-factor, 0ms))`,
          "--translate": "calc(var(--translate-distance) * 2)",
          "--i": index + 1,
        }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  // Agregar corazones al texto secundario
  const decoratedSubText = `♥♥♥♥ ${subText} ♥♥♥♥`;

  return (
    <div style={styles.container}>
      {/* Estilos CSS para las animaciones */}
      <style>{`
        @keyframes flip-transform {
          25% {
            /* scale: 1 -1; */
          }
          50%, 100% {
            transform: translateY(calc(var(--translate) * -1));
          }
        }
        
        @keyframes flip-translate {
          24.999999% {
            opacity: 1;
            translate: 0 0;
          }
          25% {
            opacity: 0;
          }
          25.000001%, 100% {
            opacity: 1;
            translate: 0 calc(var(--translate) * 1);
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `}</style>

      <section style={styles.section}>
        {/* Texto principal */}
        <div style={styles.flipText}>{createSpans(mainText)}</div>

        {/* Texto secundario con corazones */}
        <div
          style={{
            ...styles.flipText,
            ...styles.flipTextSecond,
          }}
        >
          {createSpans(decoratedSubText, true)}
        </div>
      </section>

      {/* Footer opcional */}
      {showFooter && (
        <footer style={styles.footer}>
          <p>{footerText}</p>
        </footer>
      )}
    </div>
  );
};

export default CelebrationFlip;
