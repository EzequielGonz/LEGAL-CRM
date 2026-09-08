import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civil: {
          DEFAULT: "#1d4ed8",
          light: "#dbeafe",
        },
        penal: {
          DEFAULT: "#7c2d12",
          light: "#fee2e2",
        },
        // Paleta "navy" que reemplaza el slate por defecto de Tailwind: al
        // redefinir estos mismos tonos, cualquier clase existente en el
        // proyecto (bg-slate-900, text-slate-600, border-slate-200, etc.)
        // hereda automáticamente el look azul oscuro sin tocar cada archivo.
        slate: {
          50: "#f6f8fc",
          100: "#eaeff8",
          200: "#d3ddee",
          300: "#aabcda",
          400: "#7c93bd",
          500: "#57709e",
          600: "#3f577f",
          700: "#2f4266",
          800: "#1d2c4a",
          900: "#0f1c34",
          950: "#080f20",
        },
        gold: {
          50: "#fdfbf3",
          100: "#faf3d9",
          200: "#f3e4ab",
          300: "#ebd274",
          400: "#e0ba42",
          500: "#d4af37",
          600: "#b3901f",
          700: "#8f7119",
          800: "#74591a",
          900: "#5f491b",
          950: "#35270d",
        },
      },
      fontFamily: {
        serif: [
          "'Playfair Display'",
          "Georgia",
          "'Times New Roman'",
          "serif",
        ],
        sans: [
          "'Inter'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(212, 175, 55, 0)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2.4s ease-in-out infinite",
      },
      boxShadow: {
        gold: "0 4px 14px 0 rgba(212, 175, 55, 0.25)",
        navy: "0 10px 30px -10px rgba(8, 15, 32, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
