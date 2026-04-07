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
        primary: {
          DEFAULT: "#1a1a2e",
          light: "#25254a",
          dark: "#12121f",
        },
        accent: {
          DEFAULT: "#e94560",
          light: "#f06b80",
          dark: "#c73550",
        },
        gold: {
          DEFAULT: "#f5a623",
          light: "#f7bc5a",
          dark: "#d48e1a",
        },
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
