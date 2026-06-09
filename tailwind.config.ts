// tailwind.config.ts
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // brand: {
        //   50: "#eef2ff",
        //   100: "#e0e7ff",
        //   500: "#6366f1",
        //   600: "#4f46e5",
        //   700: "#4338ca",
        // },
        brand: {
          50: "#eef8fb",
          100: "#d9eff7",
          200: "#b7ddeb",
          300: "#8cc7dc",
          400: "#5eaecb",
          500: "#2f91b6", // warna utama logo
          600: "#1f7ea6",
          700: "#0c5f8c",
          800: "#084b70",
          900: "#053a57",
          950: "#02253a",
        },

        lotus: {
          50: "#faf6fc",
          100: "#f2eaf8",
          200: "#e3d3f1",
          300: "#cdb0e5",
          400: "#b38bd8",
          500: "#9c6bc9",
          600: "#8350ae",
          700: "#69418c",
          800: "#55356f",
          900: "#462d5a",
        },

        blossom: {
          50: "#fff3f8",
          100: "#ffe5f0",
          200: "#ffc7de",
          300: "#ff9fc4",
          400: "#ff72a7",
          500: "#f54e8f",
          600: "#df2f73",
          700: "#bb1f5b",
          800: "#981c4d",
          900: "#7e1c44",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
