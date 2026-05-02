import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "Inter", "system-ui", "sans-serif"],
        display: ["Lora", "Georgia", "serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#2D6A4F",
          dark: "#1B4332",
          medium: "#40916C",
          light: "#95D5B2",
          subtle: "#D8F3DC",
        },
        accent: {
          DEFAULT: "#E07A3A",
          dark: "#C45E24",
          light: "#FDDCBA",
        },
        earth: {
          DEFAULT: "#8B5E3C",
          light: "#C9A87C",
          subtle: "#F5E6D3",
        },
        amber: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
        leaf: "#A3B18A",
        background: "#FAF6F0",
        surface: "#FFFFFF",
        textPrimary: "#1A1A1A",
        textSecondary: "#5C5044",
        border: "#E8DFD4",
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
        card: "0 2px 8px 0 rgba(45,30,15,0.06), 0 1px 2px -1px rgba(45,30,15,0.04)",
        "card-hover": "0 12px 28px -4px rgba(45,30,15,0.12), 0 4px 10px -4px rgba(45,30,15,0.06)",
        header: "0 1px 0 0 rgba(45,30,15,0.05)",
        tab: "0 -2px 12px 0 rgba(45,30,15,0.08)",
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
