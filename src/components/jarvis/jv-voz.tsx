"use client";

import { useEffect, useRef } from "react";
import { textoParaVoz } from "@/lib/jarvis/tablero";

/**
 * Voz de Jarvis (vuelta 6), solo con lo que trae el navegador (Web Speech API y Web Audio: sin servicios
 * pagos). `hablar` lee en voz alta una respuesta (se apaga con el botón de la cabecera y se recuerda en este
 * navegador). `OndaVoz` dibuja la onda del micrófono mientras Jarvis escucha; si el navegador no deja leer el
 * micrófono, muestra barras animadas igual.
 */

const CLAVE_VOZ = "jarvis:voz";

export function leerVozActiva(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_VOZ) === "1";
  } catch {
    return false;
  }
}
export function guardarVozActiva(v: boolean) {
  try {
    window.localStorage.setItem(CLAVE_VOZ, v ? "1" : "0");
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
}

export function vozDisponible(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

/** Lee el texto en voz alta (español, de preferencia rioplatense). Devuelve false si no se pudo. */
export function hablar(texto: string, alEmpezar: () => void, alTerminar: () => void): boolean {
  if (!vozDisponible()) return false;
  const limpio = textoParaVoz(texto);
  if (!limpio) return false;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(limpio);
  const voces = s.getVoices();
  u.voice = voces.find((v) => /es[-_]AR/i.test(v.lang)) ?? voces.find((v) => /es[-_](US|419|MX)/i.test(v.lang)) ?? voces.find((v) => /^es/i.test(v.lang)) ?? null;
  u.lang = u.voice?.lang ?? "es-AR";
  u.rate = 1.04;
  u.onstart = alEmpezar;
  u.onend = alTerminar;
  u.onerror = alTerminar;
  s.speak(u);
  return true;
}

export function callar() {
  if (vozDisponible()) window.speechSynthesis.cancel();
}

/** Onda del micrófono mientras se dicta. Decorativa: el estado «Te escucho» se dice en texto. */
export function OndaVoz({ activa }: { activa: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!activa) return;
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const ancho = c.clientWidth || 160;
    const alto = c.clientHeight || 32;
    c.width = Math.round(ancho * dpr);
    c.height = Math.round(alto * dpr);
    let audio: AudioContext | null = null;
    let flujo: MediaStream | null = null;
    let analizador: AnalyserNode | null = null;
    let datos: Uint8Array<ArrayBuffer> | null = null;
    let cuadro = 0;
    let vivo = true;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const color = getComputedStyle(c).color || "#fff";

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (!vivo) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        flujo = s;
        audio = new AudioContext();
        analizador = audio.createAnalyser();
        analizador.fftSize = 64;
        datos = new Uint8Array(new ArrayBuffer(analizador.frequencyBinCount));
        audio.createMediaStreamSource(s).connect(analizador);
      })
      .catch(() => undefined);

    const BARRAS = 28;
    const t0 = performance.now();
    const dibujar = (ahora: number) => {
      const W = c.width;
      const H = c.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      if (analizador && datos) analizador.getByteFrequencyData(datos);
      const paso = W / BARRAS;
      for (let i = 0; i < BARRAS; i++) {
        let v: number;
        if (datos) v = datos[Math.min(datos.length - 1, Math.floor((i / BARRAS) * datos.length))] / 255;
        else v = quieto ? 0.35 : 0.25 + 0.25 * Math.sin((ahora - t0) / 180 + i * 0.6) * Math.sin((ahora - t0) / 430 + i);
        const h = Math.max(H * 0.12, Math.abs(v) * H * 0.95);
        const x = i * paso + paso * 0.25;
        ctx.globalAlpha = 0.45 + Math.abs(v) * 0.55;
        ctx.beginPath();
        ctx.roundRect(x, (H - h) / 2, paso * 0.5, h, paso * 0.25);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!quieto || datos) cuadro = requestAnimationFrame(dibujar);
    };
    cuadro = requestAnimationFrame(dibujar);
    return () => {
      vivo = false;
      cancelAnimationFrame(cuadro);
      flujo?.getTracks().forEach((t) => t.stop());
      void audio?.close().catch(() => undefined);
    };
  }, [activa]);
  if (!activa) return null;
  return <canvas ref={lienzo} className="jv-onda" aria-hidden="true" />;
}
