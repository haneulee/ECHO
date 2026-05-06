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
        display: ["Francesco", "serif"],
        body: ["Helvetica Neue", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#F7F5F0",
        surface: "#FFFCF7",
        "surface-soft": "#F1EEE8",
        border: "#E1DCD2",
        text: "#26231F",
        "text-muted": "#8A8379",
        "nav-active": "#26231F",
        "nav-inactive": "#8A8379",
        paper: "#F7F5F0",
        mist: "#F1EEE8",
        ink: "#26231F",
        muted: "#8A8379",
        milk: "#FFFCF7",
        line: "#E1DCD2",
      },
      borderRadius: {
        card: "24px",
      },
      boxShadow: {
        quiet: "0 18px 60px rgba(38, 35, 31, 0.045)",
      },
    },
  },
  plugins: [],
};

export default config;
