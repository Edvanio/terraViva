import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#16A34A",
          dark: "#14532D",
          medium: "#15803D",
          light: "#86EFAC",
          subtle: "#DCFCE7",
        },
        amber: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
        background: "#F4F7F5",
        surface: "#FFFFFF",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        border: "#E5E7EB",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)",
        "card-hover": "0 10px 25px -3px rgba(0,0,0,0.12), 0 4px 10px -4px rgba(0,0,0,0.08)",
        header: "0 1px 0 0 rgba(0,0,0,0.06)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out both",
      },
    }
  },
  plugins: [],
};

export default config;
