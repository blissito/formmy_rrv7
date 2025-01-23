import type { Config } from "tailwindcss";
const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

export default {
  darkMode: "class",
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      colors: {
        white: "#ECECED",
        dark: "#0E0E11",
        hole: "#0A0A0C",
        // irongray: "#888888",
        irongray: "#878893",
        lightgray: "#1B1B1D",
        iman: "#EFEFEF",
        brand: {
          100: "#F7F7F9",
          300: "#AEADEF",
          500: "#9A99EA",
          800: "#161720",
        },
        space: {
          100: "#FAFBFE",
          200: "#F4F5FB",
          300: "#9DA3AE",
          400: "#878893",
          500: "#5F6370",
          600: "#81838E",
          700: "#12151A",
          800: "#191A20",
          // 900: "#16181E",
          900: "#0E0E11",
        },
        clear: "#ffffff",
        gray: {
          100: "#E2E2E2",
          200: "#F2F1F1",
          300: "#E3E1E1",
          400: "#B2B3BE",
          500: "#878893",
          600: "#4B5563",
          800: "#2A2C34",
          900: "#23252d",
        },
      },
      backgroundImage: {
        pattern: "url('/assets/pattern.svg')",
        patternwhite: "url('/assets/pattern-w.svg')",
      },
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        floatingleft: "floatingleft 4s infinite ease-in-out",
        floatingright: "floatingright 4s infinite ease-in-out	",
        "meteor-effect": "meteor 5s linear infinite",
      },
      keyframes: {
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        floatingleft: {
          "0%": {
            transform: "translate(0,  0px), rotate(6deg)",
          },
          "50%": {
            transform: " rotate(-6deg)",
          },
          "100%": {
            transform: "translate(0,  -0px), rotate(6deg)",
          },
        },
        floatingright: {
          "0%": {
            transform: "translate(0,  0px), rotate(-6deg)",
          },
          "50%": {
            transform: "rotate(6deg)",
          },
          "100%": {
            transform: "translate(0,  -0px), rotate(-6deg)",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), addVariablesForColors],
} satisfies Config;

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
