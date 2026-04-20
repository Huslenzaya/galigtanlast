import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          DEFAULT: "#1a6bbd",
          50: "#e8f3ff",
          100: "#b8d9ff",
          200: "#4a9ede",
          300: "#1a6bbd",
          400: "#155299",
        },
        sand: {
          DEFAULT: "#c97b2a",
          50: "#fff8ed",
          100: "#ffe4b0",
          200: "#f0a030",
          300: "#c97b2a",
          400: "#a36022",
        },
        grass: {
          DEFAULT: "#2a9a52",
          50: "#edfaf2",
          100: "#a8ecc0",
          200: "#3dba68",
          300: "#2a9a52",
          400: "#1e7a40",
        },
        ember: {
          DEFAULT: "#c83030",
          50: "#fff0f0",
          100: "#ffb8b8",
          200: "#e84848",
          300: "#c83030",
          400: "#a02424",
        },
        ink: {
          DEFAULT: "#1a1a2e",
          light: "#3a3a5c",
          muted: "#6a6a8a",
        },
        paper: {
          DEFAULT: "#fffef9",
          50: "#f5f0e8",
          100: "#e8e0d0",
        },
      },
      fontFamily: {
        nunito: ["var(--font-nunito)", "sans-serif"],
        mongolian: ["var(--font-mongolian)", "serif"],
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        soft: "0 2px 16px rgba(26,26,46,0.08)",
        medium: "0 6px 32px rgba(26,26,46,0.14)",
      },
      animation: {
        bob: "bob 4s ease-in-out infinite",
        "pop-in": "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        "flip-in": "flipIn 0.55s cubic-bezier(0.4,0,0.2,1)",
        "fade-up": "fadeUp 0.35s ease",
        "slide-in": "slideIn 0.3s ease",
        rise: "rise linear forwards",
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        popIn: {
          from: { transform: "scale(0.5)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        flipIn: {
          from: { transform: "rotateY(90deg)" },
          to: { transform: "rotateY(0deg)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        rise: {
          from: { bottom: "-80px", opacity: "1" },
          to: { bottom: "110%", opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
