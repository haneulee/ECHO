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
        display: ["var(--font-averia)", "serif"],
        body: ["var(--font-averia)", "serif"],
      },
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-soft": "rgb(var(--color-surface-soft) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        "nav-active": "rgb(var(--color-nav-active) / <alpha-value>)",
        "nav-inactive": "rgb(var(--color-nav-inactive) / <alpha-value>)",
        paper: "rgb(var(--color-bg) / <alpha-value>)",
        mist: "rgb(var(--color-surface-soft) / <alpha-value>)",
        ink: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        milk: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-border) / <alpha-value>)",
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
