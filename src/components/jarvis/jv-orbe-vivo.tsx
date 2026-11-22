"use client";

import { useEffect, useRef } from "react";

export type EstadoOrbe = "reposo" | "pensando" | "hablando" | "escuchando";

interface Props {
  /** Lado en píxeles CSS (el lienzo se dibuja al doble o al triple en pantallas HD). */
  tamano: number;
  estado?: EstadoOrbe;
  /** Cuánto brilla extra (0 a 1): sube al pasar el mouse por el orbe flotante. */
  brillo?: number;
  className?: string;
}

/**
 * Orbe vivo de Jarvis (vuelta 6). Esfera dibujada en canvas 2D (sin WebGL: anda en cualquier equipo):
 * - respira (el radio late lento) y el plasma de adentro gira en tres capas de color;
 * - al pasar el mouse, el brillo sube y el reflejo sigue al puntero;
 * - pensando u hablando: se ilumina y le salen ondas alrededor; escuchando: ondas más cortas y rápidas.
 * Con «reducir movimiento» se dibuja un solo cuadro quieto. Se detiene si la pestaña no se ve o el orbe
 * sale de la pantalla. Es decorativo (aria-hidden): el estado se dice en texto al lado.
 */
export function OrbeVivo({ tamano, estado = "reposo", brillo = 0, className }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const estadoRef = useRef<EstadoOrbe>(estado);
  const brilloRef = useRef(brillo);
  estadoRef.current = estado;
  brilloRef.current = brillo;

  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const lado = Math.round(tamano * dpr);
    c.width = lado;
    c.height = lado;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Color del perfil (variable del tema: «r g b»), con violeta y cian de Jarvis.
    const leerRgb = (v: string, def: [number, number, number]): [number, number, number] => {
      const crudo = getComputedStyle(c).getPropertyValue(v).trim();
      const p = crudo.split(/[\s,]+/).map(Number);
      return p.length >= 3 && p.every((n) => Number.isFinite(n)) ? [p[0], p[1], p[2]] : def;
    };
    const acento = leerRgb("--c-gold-500", [96, 165, 250]);
    const violeta: [number, number, number] = [124, 92, 255];
    const cian: [number, number, number] = [56, 225, 255];
    const rosa: [number, number, number] = [236, 72, 153];
    const rgba = (k: [number, number, number], a: number) => `rgba(${k[0]},${k[1]},${k[2]},${a})`;

    let mx = 0;
    let my = 0;
    const alMover = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 2)));
      my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 2)));
    };
    window.addEventListener("pointermove", alMover, { passive: true });

    let energia = 0; // 0 reposo → 1 pensando/hablando (se acerca suave)
    let cuadro = 0;
    let visible = true;
    let corriendo = false;
    const t0 = performance.now();

    const dibujar = (ahora: number) => {
      const t = (ahora - t0) / 1000;
      const e = estadoRef.current;
      const objetivo = e === "reposo" ? 0 : e === "escuchando" ? 0.75 : 1;
      energia += (objetivo - energia) * 0.06;
      const luz = Math.min(1, brilloRef.current + energia * 0.6);
      const W = lado;
      const cx = W / 2;
      const cy = W / 2;
      const R0 = W * 0.34;
      const R = R0 * (1 + 0.035 * Math.sin(t * 1.3) + energia * 0.04 * Math.sin(t * 5.2));
      ctx.clearRect(0, 0, W, W);

      // Halo exterior.
      const halo = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, W * 0.5);
      halo.addColorStop(0, rgba(violeta, 0.32 + luz * 0.3));
      halo.addColorStop(0.55, rgba(acento, 0.12 + luz * 0.18));
      halo.addColorStop(1, rgba(acento, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, W);

      // Ondas: al pensar, hablar o escuchar.
      if (energia > 0.02) {
        const ondas = e === "escuchando" ? 4 : 3;
        for (let k = 0; k < ondas; k++) {
          const fase = (t * (e === "escuchando" ? 0.9 : 0.55) + k / ondas) % 1;
          const rr = R * (1.02 + fase * 0.42);
          ctx.beginPath();
          for (let i = 0; i <= 96; i++) {
            const a = (i / 96) * Math.PI * 2;
            const def = 1 + 0.035 * energia * Math.sin(a * (5 + k) + t * (2.4 + k)) + 0.02 * energia * Math.sin(a * 9 - t * 3.1);
            const x = cx + Math.cos(a) * rr * def;
            const y = cy + Math.sin(a) * rr * def;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgba(k % 2 ? cian : acento, (1 - fase) * 0.55 * energia);
          ctx.lineWidth = W * 0.008;
          ctx.stroke();
        }
      }

      // Cuerpo: esfera con borde ondulado suave.
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const def = 1 + 0.012 * Math.sin(a * 3 + t * 0.8) + 0.03 * energia * Math.sin(a * 6 - t * 4);
        const x = cx + Math.cos(a) * R * def;
        const y = cy + Math.sin(a) * R * def;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.clip();
      const fondo = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
      fondo.addColorStop(0, "rgba(86,64,220,1)");
      fondo.addColorStop(0.55, "rgba(38,24,120,1)");
      fondo.addColorStop(1, "rgba(10,8,40,1)");
      ctx.fillStyle = fondo;
      ctx.fillRect(0, 0, W, W);

      // Plasma: tres manchas de luz que giran adentro (solo dentro del orbe).
      ctx.globalCompositeOperation = "lighter";
      const manchas: [[number, number, number], number, number, number][] = [
        [violeta, 0.55, 0.42, 1.05],
        [cian, -0.75, 0.5, 0.85],
        [rosa, 0.9, 0.46, 0.8],
        [acento, 1.1, 0.3, 0.7],
      ];
      manchas.forEach(([col, vel, dist, tam], i) => {
        const a = t * vel * (1 + energia * 1.4) + i * 2.1;
        const x = cx + Math.cos(a) * R * dist + mx * R * 0.25;
        const y = cy + Math.sin(a * 1.3) * R * dist * 0.8 + my * R * 0.25;
        const g = ctx.createRadialGradient(x, y, 0, x, y, R * tam);
        g.addColorStop(0, rgba(col, 0.55 + luz * 0.15));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, W);
      });
      // Núcleo que late al hablar.
      const nucleo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (0.45 + energia * 0.2 * (0.5 + 0.5 * Math.sin(t * 9))));
      nucleo.addColorStop(0, `rgba(255,255,255,${0.06 + luz * 0.18})`);
      nucleo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = nucleo;
      ctx.fillRect(0, 0, W, W);
      ctx.globalCompositeOperation = "source-over";

      // Reflejo de vidrio arriba a la izquierda (sigue un poco al puntero) y borde con relieve.
      const rx = cx - R * 0.38 + mx * R * 0.2;
      const ry = cy - R * 0.45 + my * R * 0.2;
      const reflejo = ctx.createRadialGradient(rx, ry, 0, rx, ry, R * 0.55);
      reflejo.addColorStop(0, "rgba(255,255,255,0.5)");
      reflejo.addColorStop(0.3, "rgba(255,255,255,0.08)");
      reflejo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = reflejo;
      ctx.fillRect(0, 0, W, W);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.0, 0, Math.PI * 2);
      const borde = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
      borde.addColorStop(0, `rgba(255,255,255,${0.55 + luz * 0.3})`);
      borde.addColorStop(1, "rgba(255,255,255,0.05)");
      ctx.strokeStyle = borde;
      ctx.lineWidth = W * 0.012;
      ctx.stroke();
    };

    const bucle = (ahora: number) => {
      dibujar(ahora);
      if (corriendo) cuadro = requestAnimationFrame(bucle);
    };
    const arrancar = () => {
      if (quieto || corriendo || !visible || document.hidden) return;
      corriendo = true;
      cuadro = requestAnimationFrame(bucle);
    };
    const parar = () => {
      corriendo = false;
      cancelAnimationFrame(cuadro);
    };

    dibujar(t0 + 1800);
    if (!quieto) arrancar();
    const obs = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) arrancar();
      else parar();
    });
    obs.observe(c);
    const alVer = () => (document.hidden ? parar() : arrancar());
    document.addEventListener("visibilitychange", alVer);
    return () => {
      parar();
      obs.disconnect();
      document.removeEventListener("visibilitychange", alVer);
      window.removeEventListener("pointermove", alMover);
    };
  }, [tamano]);

  return <canvas ref={lienzo} aria-hidden="true" className={className} style={{ width: tamano, height: tamano, display: "block" }} />;
}
