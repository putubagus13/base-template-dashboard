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
        brand: {
          50: "#fffdf0",
          100: "#fff8cc",
          200: "#fff099",
          300: "#ffe666",
          400: "#ffd633",
          500: "#f7c600", // warna utama logo
          600: "#e6ad00",
          700: "#cc9200",
          800: "#a66f00",
          900: "#805400",
          950: "#4d3100",
        },

        maroon: {
          50: "#fcf4f4",
          100: "#f8e7e7",
          200: "#f1cfcf",
          300: "#e5abab",
          400: "#d67e7e",
          500: "#c55454",
          600: "#a93f3f",
          700: "#8a3131",
          800: "#702b2b",
          900: "#5e2929",
          950: "#341313",
        },

        leaf: {
          50: "#f3fbef",
          100: "#e5f7dc",
          200: "#cceeb9",
          300: "#a8e28a",
          400: "#7ed155",
          500: "#58bb2d",
          600: "#429823",
          700: "#34771e",
          800: "#2c5f1d",
          900: "#264f1c",
          950: "#102b0b",
        },

        torch: {
          50: "#faf7f3",
          100: "#f3ece2",
          200: "#e5d7c2",
          300: "#d4ba98",
          400: "#c29769",
          500: "#b17a45",
          600: "#9a6438",
          700: "#805031",
          800: "#69432d",
          900: "#573826",
          950: "#301c11",
        },

        ivory: {
          50: "#fffefb",
          100: "#fffdf5",
          200: "#fef9e8",
          300: "#fcf3d4",
          400: "#f8e8b5",
          500: "#f2d98d",
          600: "#e5c265",
          700: "#d2a542",
          800: "#b48634",
          900: "#956d2e",
          950: "#573d17",
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
