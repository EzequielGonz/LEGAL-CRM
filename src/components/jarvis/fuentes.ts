import { Geist, Instrument_Serif } from "next/font/google";

// Fuentes propias de Jarvis (22/11): Geist para la interfaz y Instrument Serif
// itálica solo para el saludo del parte. Autoalojadas por Next.
export const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--jv-sans" });
export const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap", variable: "--jv-serif" });
