import React from "react";
import "./CelebrationFlip.css";

export interface CelebrationFlipProps {
  /** Main text to display (e.g., "4000 SUSCRIPTORES") */
  mainText: string;
  /** Secondary text to display (e.g., "¡GRACIAS!") */
  secondaryText: string;
  /** Primary color for main text */
  primaryColor?: string;
  /** Secondary color for hearts and secondary text */
  secondaryColor?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Custom CSS class name */
  className?: string;
}

const CelebrationFlip: React.FC<CelebrationFlipProps> = ({
  mainText,
  secondaryText,
  primaryColor = "dodgerblue",
  secondaryColor = "hotpink",
  duration = 3,
  className = "",
}) => {
  // Split text into individual characters for animation
  const splitText = (text: string) => {
    return text
      .split("")
      .map((char, index) => (
        <span key={index}>{char === " " ? "" : char}</span>
      ));
  };

  // Create hearts and secondary text
  const createSecondaryLine = () => {
    const hearts = ["♥", "♥", "♥", "♥"];
    const textChars = secondaryText.split("");
    const endHearts = ["♥", "♥", "♥", "♥"];

    return [
      ...hearts.map((heart, index) => (
        <span key={`start-heart-${index}`}>{heart}</span>
      )),
      <span key="space-1"></span>,
      ...textChars.map((char, index) => (
        <span key={`text-${index}`}>{char === " " ? "" : char}</span>
      )),
      <span key="space-2"></span>,
      ...endHearts.map((heart, index) => (
        <span key={`end-heart-${index}`}>{heart}</span>
      )),
    ];
  };

  const style = {
    "--clr-1": primaryColor,
    "--clr-2": secondaryColor,
    "--duration": `${duration}s`,
  } as React.CSSProperties;

  return (
    <section className={`celebration-flip ${className}`} style={style}>
      <div className="flip-text">{splitText(mainText)}</div>
      <div className="flip-text">{createSecondaryLine()}</div>
    </section>
  );
};

export default CelebrationFlip;
