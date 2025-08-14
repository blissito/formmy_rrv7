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
        dark: "#191A20",
        hole: "#0A0A0C",
        metal:"#4B5563",
        irongray: "#81838E",
        lightgray: "#B6B6BA",
        surface:"#F2F5F9",
        outlines:"#E1E3E7",
        perl:"#E9EBEF",
        secondary:"#E1E3E7",
        surfaceThree:"#F6F6FA",
        surfaceFour:"#F6F6F6",
        danger:"#ED695F",
        success:"#5FA46F",
        iman: "#EFEFEF",
        bird:"#EDC75A",
        pro:"#F2C94C",
        cloud:"#8AD7C9",
        grass:"#7FBE60",
        salmon:"#E4AE8E",
        brand: {
          100: "#F5F5FC",
          300: "#AEADEF",
          500: "#9A99EA",
          600: "#8483E0",
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
          900: "#141419",
        },
      },
      backgroundImage: {
        pattern: "url('/assets/pattern.svg')",
        patternwhite: "url('/assets/pattern-w.svg')",
        steperCover: "url('/home/steper-cover.webp')",
        actionsBack: "url('/dash/actions-back.svg')",
        chatPattern:"url('/dash/chat-pattern.webp')"
      },
      boxShadow: {
        standard: "8px 16px 14px #F8F8FB",
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
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    addVariablesForColors,
  ],
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
