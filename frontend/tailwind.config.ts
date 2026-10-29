import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050B18",
        surface: {
          DEFAULT: "#0B1626",
          elevated: "#112239",
          card: "rgba(11, 22, 38, 0.75)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(34, 211, 238, 0.3)",
        },
        accent: {
          cyan: "#22D3EE",
          blue: "#2563EB",
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
        "cyan-glow": "0 0 25px -5px rgba(34, 211, 238, 0.25)",
        "cyan-glow-lg": "0 0 40px -5px rgba(34, 211, 238, 0.4)",
        "coral-glow": "0 0 25px -5px rgba(251, 113, 133, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
