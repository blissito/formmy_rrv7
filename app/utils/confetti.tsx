import { useEffect } from "react";
import JSConfetti from "js-confetti";

export const EmojiConfetti = ({
  mode = "default",
  emojis = ["🎉", "👾", "🎊", "🚀", "🥳", "🎈", "🪅"],
  confettiColors = [
    "#ff0a54",
    "#ff477e",
    "#ff7096",
    "#ff85a1",
    "#fbb1bd",
    "#f9bec7",
  ],
}: {
  mode?: "default" | "emojis";
  emojis?: string[];
  confettiColors?: string[];
}) => {
  useEffect(() => {
    const jsConfetti = new JSConfetti();

    if (mode === "emojis") {
      jsConfetti.addConfetti({
        emojis,
      });
    } else {
      jsConfetti.addConfetti();
    }

    /* eslint-disable */
  }, []);
  return null;
};
