import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        ink: "var(--ink)",
        soft: "var(--soft)",
        line: "var(--line)",
        card: "var(--card)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Book Antiqua",
          "Georgia",
          "Times New Roman",
          "serif"
        ]
      },
      boxShadow: {
        hush: "0 24px 60px rgba(15, 23, 42, 0.08)",
        glow: "0 0 0 1px rgba(255,255,255,0.2) inset"
      },
      backgroundImage: {
        "paper-light": "radial-gradient(circle at top, rgba(255,255,255,0.96), rgba(255,255,255,0.72) 32%, transparent 70%)",
        "paper-dark": "radial-gradient(circle at top, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 34%, transparent 72%)"
      }
    }
  },
  plugins: []
};

export default config;
