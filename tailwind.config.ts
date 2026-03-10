// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["IM Fell English", "Noto Serif TC", "Georgia", "serif"],
      },
      colors: {
        arcana: {
          bg: "#0d0518",
          deep: "#1a0a2e",
          mid: "#2d1b4e",
          gold: "#b45309",
          glow: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};

export default config;
