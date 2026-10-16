import type { Config } from "tailwindcss";

// Sistema visual por perfil (16/10): slate (base) y gold (acento) leen
// variables CSS definidas en globals.css. Cada perfil cambia su paleta con
// data-tema="<slug>"; las clases existentes (bg-slate-900, text-gold-200,
// bg-gold-500/20…) siguen funcionando, opacidad incluida.
const PASOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
function escala(nombre: "slate" | "gold") {
  return Object.fromEntries(PASOS.map((p) => [p, `rgb(var(--c-${nombre}-${p}) / <alpha-value>)`]));
}

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
        // slate = base del perfil, gold = acento del perfil (ver globals.css).
        slate: escala("slate"),
        gold: escala("gold"),
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--c-gold-500) / 0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgb(var(--c-gold-500) / 0)" },
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
        gold: "0 4px 14px 0 rgb(var(--c-gold-500) / 0.25)",
        navy: "0 10px 30px -10px rgb(var(--c-slate-950) / 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
