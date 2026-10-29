import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#050914",
          secondary: "#080E1A",
        },
        surface: {
          DEFAULT: "#0A1424",
          card: "#0A1424",
          elevated: "#101D30",
          highlight: "#16263D",
        },
        border: {
          DEFAULT: "#1E334B",
          subtle: "#1E334B",
          glow: "rgba(34, 211, 238, 0.4)",
          violet: "rgba(168, 85, 247, 0.4)",
        },
        accent: {
          cyan: "#22D3EE",
          blue: "#3B82F6",
          violet: "#A855F7",
          neonViolet: "#8B5CF6",
          magenta: "#EC4899",
          coral: "#FB7185",
          emerald: "#34D399",
          amber: "#FBBF24",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 2.5s ease-in-out infinite",
        "marquee": "marquee 35s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      boxShadow: {
        "cyan-glow": "0 0 25px -5px rgba(34, 211, 238, 0.35)",
        "cyan-glow-lg": "0 0 40px -5px rgba(34, 211, 238, 0.45)",
        "violet-glow": "0 0 20px rgba(139, 92, 246, 0.4), 0 0 60px rgba(34, 211, 238, 0.15)",
        "coral-glow": "0 0 25px -5px rgba(251, 113, 133, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
