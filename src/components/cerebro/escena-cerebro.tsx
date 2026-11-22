"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { formatoNumero } from "@/lib/premium/anillo";

/**
 * Esfera de puntos y frase cinética del cerebro (21/11), la misma de la
 * página que armó Claude: 900 puntos en espiral de Fibonacci que giran y
 * siguen al puntero; la frase se revela palabra por palabra y, cuando
 * aparece la palabra clave en recuadro, la esfera late. Sin movimiento si
 * la persona lo pidió en su sistema.
 */
export type Frase = [string, string, string];

export function EsferaCerebro({ pulso }: { pulso: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pulsoRef = useRef(0);
  useEffect(() => {
    pulsoRef.current = 1;
  }, [pulso]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = 900;
    const pts: [number, number, number][] = [];
    const g = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = g * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
    }
    let W = 0, H = 0, R = 0, rot = 0, mx = 0, my = 0, raf = 0;
    const tilt = -0.35;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.78;
    };
    const mover = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      mx = (e.clientX - b.left) / W - 0.5;
      my = (e.clientY - b.top) / H - 0.5;
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const a = rot + mx * 0.8, b = tilt + my * 0.5;
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const cx = W / 2, cy = H / 2, k = 1 + pulsoRef.current * 0.06;
      for (const p of pts) {
        const x = p[0] * ca - p[2] * sa;
        let z = p[0] * sa + p[2] * ca;
        const y = p[1] * cb - z * sb;
        z = p[1] * sb + z * cb;
        const s = 1 / (1.9 - z * 0.6), d = (z + 1) / 2;
        ctx.fillStyle = `rgba(255,${(120 + d * 120) | 0},${(180 + d * 60) | 0},${0.15 + d * 0.85})`;
        ctx.beginPath();
        ctx.arc(cx + x * R * s * k, cy + y * R * s * k, 0.6 + d * 1.7, 0, 6.283);
        ctx.fill();
      }
      if (!reduce) {
        rot += 0.0035;
        pulsoRef.current *= 0.94;
        raf = requestAnimationFrame(draw);
      }
    };
    size();
    window.addEventListener("resize", size);
    cv.parentElement?.addEventListener("pointermove", mover);
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      cv.parentElement?.removeEventListener("pointermove", mover);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}

/** Hero completo: esfera, número grande que cuenta y frases que rotan. */
export function HeroCerebro({ frases, numero, bajada, fecha }: { frases: Frase[]; numero: number | null; bajada: string; fecha: string }) {
  const [i, setI] = useState(0);
  const [visibles, setVisibles] = useState(999);
  const [pulso, setPulso] = useState(0);
  const [cuenta, setCuenta] = useState(numero ?? 0);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || frases.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % frases.length), 4200);
    return () => clearInterval(id);
  }, [frases.length]);

  const f = frases[i] ?? frases[0];
  const palabras: { w: string; box?: boolean }[] = [];
  if (f) {
    f[0].split(" ").filter(Boolean).forEach((w) => palabras.push({ w }));
    palabras.push({ w: f[1], box: true });
    f[2].trim().split(" ").filter(Boolean).forEach((w) => palabras.push({ w }));
  }
  const indiceBox = palabras.findIndex((p) => p.box);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisibles(999);
      return;
    }
    setVisibles(0);
    const timers = palabras.map((_, j) =>
      setTimeout(() => {
        setVisibles(j + 1);
        if (j === indiceBox) setPulso((p) => p + 1);
      }, j * 170)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    if (numero == null) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCuenta(numero);
      return;
    }
    const t0 = performance.now(), T = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / T);
      setCuenta(Math.round(numero * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numero]);

  return (
    <header className="cz-hero">
      <EsferaCerebro pulso={pulso} />
      <div className="cz-in">
        <p className="cz-k">Memoria de Claude · al {fecha}</p>
        {numero != null && (
          <div className="cz-big">
            +{formatoNumero(cuenta)}
            <small>{bajada}</small>
          </div>
        )}
        <p className="cz-phrase" aria-live="polite">
          {palabras.map((p, j) => (
            <Fragment key={`${i}-${j}`}>
              {j > 0 && !/^[.,:;]/.test(p.w) ? " " : ""}
              <span className={`${p.box ? "cz-box" : ""} ${j < visibles ? "v" : ""}`.trim()}>{p.w}</span>
            </Fragment>
          ))}
        </p>
        <p className="cz-scroll">↓ BAJÁ PARA ENTRAR</p>
      </div>
    </header>
  );
}
