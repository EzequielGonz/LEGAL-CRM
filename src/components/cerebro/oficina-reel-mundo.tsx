"use client";

/**
 * Mundo de la Oficina estilo videojuego (22/11, vuelta 6): arquitectura, muebles, jardín y luces.
 * Muebles: Furniture Kit de Kenney (CC0, ver public/modelos/LICENCIAS.md), instanciados. Lo que el
 * kit no trae (mesa de pool, tabiques de cubículos, monitores encendidos, lámparas colgantes,
 * pizarras, ventanas con persianas, árboles) se modela acá con varias piezas, no cajas sueltas.
 * Texturas de piso y pantallas: lienzos dibujados en el cliente con una semilla fija.
 */
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ENTRADA, SALAS, SALAS_ORDEN, asientosDeSala, murosDeRect, BANDEJA_CEREBRO, type Muro } from "@/lib/oficina/edificio";
import { ALTO_PARED, tapasDePasillo, type Lugar } from "@/lib/oficina/recorrido";
import type { Area } from "@/lib/oficina/reglas";
import type { SalaVisual } from "@/lib/oficina/panel";

export const RUTA_MUEBLES = "/modelos/oficina/muebles.glb";
/** Escala del kit de Kenney (su escritorio mide 0,38 de alto; uno real, 0,76 m). */
const K = 2;

// --- Utilidades -------------------------------------------------------------------------------

function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const unitCaja = new THREE.BoxGeometry(1, 1, 1);
const unitCilindro = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

export interface Pieza {
  p: [number, number, number];
  s: [number, number, number];
  r?: number;
  c?: string;
}

/** Muchas cajas (o cilindros) con un solo material y color por instancia. */
const Lote = memo(function Lote({ items, mat, geo = "caja", sombra = true, recibe = true }: { items: Pieza[]; mat: THREE.Material; geo?: "caja" | "cilindro"; sombra?: boolean; recibe?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach((it, i) => {
      dummy.position.set(...it.p);
      dummy.rotation.set(0, it.r ?? 0, 0);
      dummy.scale.set(...it.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, tmpColor.set(it.c ?? "#ffffff"));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geo === "caja" ? unitCaja : unitCilindro, mat, items.length]} castShadow={sombra} receiveShadow={recibe} />;
});

// --- Texturas dibujadas -----------------------------------------------------------------------

type Lienzo = (g: CanvasRenderingContext2D, w: number, h: number, r: () => number) => void;

function textura(w: number, h: number, dibujar: Lienzo, semilla: number, repetir = true): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  dibujar(g, w, h, azar(semilla));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const tablas =
  (base: [number, number, number], var_: number): Lienzo =>
  (g, w, h, r) => {
    const alto = h / 8;
    for (let f = 0; f < 8; f++) {
      let x = -r() * 200;
      while (x < w) {
        const largo = 160 + r() * 200;
        const k = 1 + (r() - 0.5) * var_;
        g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
        g.fillRect(x, f * alto, largo, alto);
        g.strokeStyle = "rgba(0,0,0,0.10)";
        for (let v = 0; v < 5; v++) {
          g.beginPath();
          const y = f * alto + 4 + r() * (alto - 8);
          g.moveTo(x + 4, y);
          g.bezierCurveTo(x + largo * 0.3, y + (r() - 0.5) * 6, x + largo * 0.6, y + (r() - 0.5) * 6, x + largo - 4, y);
          g.stroke();
        }
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.fillRect(x, f * alto, 2, alto);
        x += largo;
      }
      g.fillStyle = "rgba(0,0,0,0.38)";
      g.fillRect(0, f * alto, w, 2);
    }
  };

const alfombra =
  (base: string, punto: string): Lienzo =>
  (g, w, h, r) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.07)";
      g.fillRect(r() * w, r() * h, 2, 2);
    }
    g.fillStyle = punto;
    for (let y = 16; y < h; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < w; x += 32) g.fillRect(x, y, 4, 4);
  };

const baldosas: Lienzo = (g, w, h, r) => {
  const n = 8;
  const t = w / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const k = 0.94 + r() * 0.08;
      g.fillStyle = `rgb(${222 * k | 0},${214 * k | 0},${198 * k | 0})`;
      g.fillRect(i * t, j * t, t, t);
    }
  g.strokeStyle = "#8f8778";
  g.lineWidth = 3;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo(i * t, 0);
    g.lineTo(i * t, h);
    g.moveTo(0, i * t);
    g.lineTo(w, i * t);
    g.stroke();
  }
};

const pasto: Lienzo = (g, w, h, r) => {
  g.fillStyle = "#1d3a1c";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14000; i++) {
    const k = r();
    g.fillStyle = k > 0.6 ? "rgba(90,140,60,0.18)" : k > 0.3 ? "rgba(10,30,10,0.25)" : "rgba(60,100,40,0.15)";
    g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3);
  }
};

const vereda: Lienzo = (g, w, h, r) => {
  const t = w / 4;
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const k = 0.9 + r() * 0.12;
      g.fillStyle = `rgb(${150 * k | 0},${146 * k | 0},${140 * k | 0})`;
      g.fillRect(i * t, j * t, t, t);
    }
  g.strokeStyle = "#5d5a56";
  g.lineWidth = 4;
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo(i * t, 0);
    g.lineTo(i * t, h);
    g.moveTo(0, i * t);
    g.lineTo(w, i * t);
    g.stroke();
  }
};

const codigo =
  (paleta: string[]): Lienzo =>
  (g, w, h, r) => {
    g.fillStyle = "#0c1222";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#18213a";
    g.fillRect(0, 0, w, 14);
    for (let y = 22; y < h - 6; y += 10) {
      let x = 8 + (r() * 4 | 0) * 10;
      const piezas = 1 + (r() * 4 | 0);
      for (let k = 0; k < piezas && x < w - 10; k++) {
        const largo = 14 + r() * 60;
        g.fillStyle = paleta[(r() * paleta.length) | 0];
        g.fillRect(x, y, largo, 5);
        x += largo + 6;
      }
    }
  };

const grafico: Lienzo = (g, w, h) => {
  g.fillStyle = "#f4f2ec";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#7a7a7a";
  g.lineWidth = 3;
  g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = "#333";
  g.font = "bold 26px Georgia, serif";
  g.fillText("CAPTACIÓN", 28, 42);
  g.strokeStyle = "#222";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(40, 60);
  g.lineTo(40, h - 30);
  g.lineTo(w - 30, h - 30);
  g.stroke();
  g.strokeStyle = "#c0392b";
  g.lineWidth = 5;
  g.beginPath();
  const pts = [0.85, 0.7, 0.75, 0.5, 0.55, 0.32, 0.2];
  pts.forEach((v, i) => {
    const x = 50 + (i * (w - 100)) / (pts.length - 1);
    const y = 60 + v * (h - 100);
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  g.stroke();
  g.fillStyle = "#2c6fbf";
  for (let i = 0; i < 5; i++) g.fillRect(70 + i * 70, h - 30 - (30 + i * 18), 26, 30 + i * 18);
};

const cuadro =
  (fondo: string, texto: string, tinta: string): Lienzo =>
  (g, w, h) => {
    g.fillStyle = fondo;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,0.4)";
    g.lineWidth = 6;
    g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = tinta;
    g.font = "italic 700 54px Georgia, serif";
    g.textAlign = "center";
    g.fillText(texto, w / 2, h / 2 + 18);
  };

interface Texturas {
  madera: THREE.CanvasTexture;
  maderaOscura: THREE.CanvasTexture;
  alfombra: THREE.CanvasTexture;
  alfombraAzul: THREE.CanvasTexture;
  baldosas: THREE.CanvasTexture;
  pasto: THREE.CanvasTexture;
  vereda: THREE.CanvasTexture;
  codigo: THREE.CanvasTexture[];
  grafico: THREE.CanvasTexture;
  cuadros: THREE.CanvasTexture[];
}

let cacheTexturas: Texturas | null = null;
export function texturas(): Texturas {
  if (cacheTexturas) return cacheTexturas;
  cacheTexturas = {
    madera: textura(512, 512, tablas([168, 116, 72], 0.22), 11),
    maderaOscura: textura(512, 512, tablas([96, 62, 40], 0.25), 12),
    alfombra: textura(256, 256, alfombra("#5e2227", "rgba(150,60,60,0.35)"), 13),
    alfombraAzul: textura(256, 256, alfombra("#2b2f45", "rgba(120,130,180,0.25)"), 14),
    baldosas: textura(256, 256, baldosas, 15),
    pasto: textura(512, 512, pasto, 16),
    vereda: textura(256, 256, vereda, 17),
    codigo: [
      textura(256, 160, codigo(["#5fd4ff", "#a98bff", "#f2c531", "#6fd3a3"]), 21, false),
      textura(256, 160, codigo(["#ff8fd0", "#5fd4ff", "#ffffff"]), 22, false),
      textura(256, 160, codigo(["#6fd3a3", "#f2c531", "#e8a87c"]), 23, false),
    ],
    grafico: textura(512, 340, grafico, 24, false),
    cuadros: [textura(320, 220, cuadro("#2a4d7a", "Lograr", "#f2c531"), 25, false), textura(320, 220, cuadro("#7a2a2a", "Captar", "#ffe7d0"), 26, false), textura(320, 220, cuadro("#20413a", "Crecer", "#c8f0d8"), 27, false)],
  };
  return cacheTexturas;
}

function planoConUV(ancho: number, fondo: number, metrosPorTile: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(ancho, fondo);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * ancho) / metrosPorTile, (uv.getY(i) * fondo) / metrosPorTile);
  g.rotateX(-Math.PI / 2);
  return g;
}

// --- Muebles del kit de Kenney ------------------------------------------------------------------

export interface Mueble {
  m: string;
  x: number;
  z: number;
  r?: number;
  y?: number;
  s?: number;
}

interface Plantilla {
  partes: { geo: THREE.BufferGeometry; mat: THREE.Material; local: THREE.Matrix4 }[];
  /** Centro en planta y piso, para ubicar la pieza por su centro. */
  centro: THREE.Vector3;
}

function plantillas(escena: THREE.Object3D): Record<string, Plantilla> {
  const salida: Record<string, Plantilla> = {};
  escena.updateMatrixWorld(true);
  for (const raiz of escena.children) {
    const inv = new THREE.Matrix4().copy(raiz.matrixWorld).invert();
    const partes: Plantilla["partes"] = [];
    const caja = new THREE.Box3().setFromObject(raiz);
    raiz.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const local = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (mats.length === 1) partes.push({ geo: m.geometry, mat: mats[0], local });
      else
        m.geometry.groups.forEach((gr) => {
          const g = m.geometry.clone();
          g.clearGroups();
          g.setDrawRange(gr.start, gr.count);
          partes.push({ geo: g, mat: mats[gr.materialIndex ?? 0], local });
        });
    });
    const c = new THREE.Vector3();
    caja.getCenter(c);
    c.applyMatrix4(inv);
    const minY = new THREE.Vector3(0, caja.min.y, 0).applyMatrix4(inv).y;
    salida[raiz.name] = { partes, centro: new THREE.Vector3(c.x, minY, c.z) };
  }
  return salida;
}

const mT = new THREE.Matrix4();
const mR = new THREE.Matrix4();
const mS = new THREE.Matrix4();
const mC = new THREE.Matrix4();
const mF = new THREE.Matrix4();

const InstanciasMueble = memo(function InstanciasMueble({ pl, items, sombra }: { pl: Plantilla; items: Mueble[]; sombra: boolean }) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    pl.partes.forEach((parte, k) => {
      const im = refs.current[k];
      if (!im) return;
      items.forEach((it, i) => {
        const s = K * (it.s ?? 1);
        mT.makeTranslation(it.x, it.y ?? 0, it.z);
        mR.makeRotationY(it.r ?? 0);
        mS.makeScale(s, s, s);
        mC.makeTranslation(-pl.centro.x, -pl.centro.y, -pl.centro.z);
        mF.copy(mT).multiply(mR).multiply(mS).multiply(mC).multiply(parte.local);
        im.setMatrixAt(i, mF);
      });
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
    });
  }, [pl, items]);
  return (
    <>
      {pl.partes.map((parte, k) => (
        <instancedMesh
          key={k}
          ref={(el) => {
            refs.current[k] = el;
          }}
          args={[parte.geo, parte.mat, items.length]}
          castShadow={sombra}
          receiveShadow
        />
      ))}
    </>
  );
});

function MueblesKenney({ items, sombra }: { items: Mueble[]; sombra: boolean }) {
  const { scene } = useGLTF(RUTA_MUEBLES, false, false);
  const pls = useMemo(() => plantillas(scene), [scene]);
  const porPieza = useMemo(() => {
    const m: Record<string, Mueble[]> = {};
    for (const it of items) (m[it.m] ??= []).push(it);
    return m;
  }, [items]);
  return (
    <group>
      {Object.entries(porPieza).map(([nombre, lista]) => (pls[nombre] ? <InstanciasMueble key={nombre} pl={pls[nombre]} items={lista} sombra={sombra} /> : null))}
    </group>
  );
}

// --- Plano del edificio -----------------------------------------------------------------------

const FACHADA = { x0: -17.2, x1: 17.2, z0: -13.9, z1: 13.9 };
const COLOR_PARED: Record<Area | "entrada", string> = {
  direccion: "#3a3442",
  analisis: "#d9c4a6",
  redes: "#7a3030",
  diseno: "#d6c0b0",
  seo: "#c9b79a",
  bots: "#6e3a32",
  ingenieria: "#cdbb9f",
  asistente: "#d2b48c",
  entrada: "#d8c6aa",
};

function esFachada(m: Muro): boolean {
  const [x, , z] = m.p;
  const [sx, , sz] = m.s;
  const horizontal = sx > sz;
  if (horizontal) return Math.abs(Math.abs(z) - FACHADA.z1) < 0.05;
  return Math.abs(Math.abs(x) - FACHADA.x1) < 0.05;
}

interface Arquitectura {
  paredes: Pieza[];
  marcos: Pieza[];
  vidrios: Pieza[];
  persianas: Pieza[];
  zocalos: Pieza[];
  remates: Pieza[];
}

/** Paredes: fachada con ventanas y persianas, tabiques de vidrio hacia el pasillo, dinteles en las puertas. */
function arquitectura(): Arquitectura {
  const a: Arquitectura = { paredes: [], marcos: [], vidrios: [], persianas: [], zocalos: [], remates: [] };
  const H = ALTO_PARED;
  const lugares: { lugar: Area | "entrada"; muros: Muro[]; vidrio: (m: Muro) => boolean }[] = [];
  for (const area of SALAS_ORDEN) {
    const s = SALAS[area];
    const muros = area === "direccion" ? murosDeRect(s, { N: 0, O: 0, E: 0 }) : murosDeRect(s, { [s.lado]: s.lado === "N" || s.lado === "S" ? s.puerta[0] : s.puerta[1] });
    const ladoPuerta = s.lado;
    lugares.push({
      lugar: area,
      muros,
      vidrio: (m) => {
        if (area === "direccion") return Math.abs(m.p[2] - s.z1) > 0.05; // todo vidrio menos el fondo
        const horizontal = m.s[0] > m.s[2];
        if (ladoPuerta === "N" || ladoPuerta === "S") return horizontal && Math.abs(m.p[2] - (ladoPuerta === "N" ? s.z0 : s.z1)) < 0.05;
        return !horizontal && Math.abs(m.p[0] - (ladoPuerta === "O" ? s.x0 : s.x1)) < 0.05;
      },
    });
  }
  lugares.push({ lugar: "entrada", muros: murosDeRect(ENTRADA, { N: 0, S: 0 }), vidrio: (m) => m.s[0] > m.s[2] });
  const tapas: Muro[] = tapasDePasillo().map((c) => ({ p: [(c[0] + c[2]) / 2, 0, (c[1] + c[3]) / 2], s: [c[2] - c[0], 0, c[3] - c[1]] }));
  lugares.push({ lugar: "entrada", muros: tapas, vidrio: () => true });

  for (const { lugar, muros, vidrio } of lugares) {
    for (const m of muros) {
      const horizontal = m.s[0] > m.s[2];
      const largo = horizontal ? m.s[0] : m.s[2];
      const grosor = horizontal ? m.s[2] : m.s[0];
      const pos = (u: number): [number, number] => (horizontal ? [m.p[0] + u, m.p[2]] : [m.p[0], m.p[2] + u]);
      const caja = (u: number, l: number, y0: number, y1: number, g = grosor): [number, number, number][] => {
        const [x, z] = pos(u);
        return [
          [x, (y0 + y1) / 2, z],
          horizontal ? [l, y1 - y0, g] : [g, y1 - y0, l],
        ];
      };
      const push = (lista: Pieza[], u: number, l: number, y0: number, y1: number, c?: string, g?: number) => {
        const [p, s] = caja(u, l, y0, y1, g);
        lista.push({ p, s, c });
      };
      a.remates.push({ p: [m.p[0], H + 0.04, m.p[2]], s: horizontal ? [largo + 0.04, 0.08, grosor + 0.06] : [grosor + 0.06, 0.08, largo + 0.04], c: "#1c1a20" });
      if (vidrio(m)) {
        // Tabique de vidrio: zócalo, travesaños, parantes cada 1,2 m y persianas a media altura en algunos paños.
        push(a.zocalos, 0, largo, 0, 0.12, "#2a2630");
        push(a.marcos, 0, largo, H - 0.1, H, "#2a2630", grosor + 0.02);
        push(a.marcos, 0, largo, 2.05, 2.12, "#2a2630", grosor + 0.02);
        push(a.vidrios, 0, largo, 0.12, H - 0.1, undefined, 0.03);
        const n = Math.max(1, Math.round(largo / 1.2));
        for (let i = 0; i <= n; i++) push(a.marcos, -largo / 2 + (i * largo) / n, 0.06, 0, H, "#2a2630", grosor + 0.03);
        for (let i = 0; i < n; i++) {
          if ((i + Math.round(m.p[0] + m.p[2])) % 3 !== 0) continue;
          const u = -largo / 2 + ((i + 0.5) * largo) / n;
          for (let k = 0; k < 9; k++) push(a.persianas, u, largo / n - 0.08, 1.15 + k * 0.1, 1.15 + k * 0.1 + 0.05, "#d9d4c8", 0.05);
        }
      } else if (esFachada(m)) {
        // Fachada: zócalo, antepecho, columnas cada 2 m, ventanas con vidrio y persianas, dintel corrido.
        const c = COLOR_PARED[lugar];
        push(a.paredes, 0, largo, 0, 0.95, c);
        push(a.paredes, 0, largo, 2.15, H, c);
        push(a.zocalos, 0, largo + 0.01, 0, 0.1, "#2a2224", grosor + 0.02);
        const n = Math.max(1, Math.round(largo / 2));
        const paso = largo / n;
        for (let i = 0; i <= n; i++) push(a.paredes, -largo / 2 + i * paso, 0.32, 0.95, 2.15, c, grosor + 0.01);
        for (let i = 0; i < n; i++) {
          const u = -largo / 2 + (i + 0.5) * paso;
          push(a.vidrios, u, paso - 0.32, 0.95, 2.15, undefined, 0.03);
          push(a.marcos, u, paso - 0.3, 0.95, 1.0, "#3b2f2a", grosor + 0.12);
          push(a.marcos, u, 0.05, 0.95, 2.15, "#3b2f2a", grosor + 0.02);
          const bajas = 4 + ((i * 7 + Math.round(Math.abs(m.p[0] * 3))) % 7);
          for (let k = 0; k < bajas; k++) push(a.persianas, u, paso - 0.4, 2.08 - k * 0.1, 2.08 - k * 0.1 + 0.055, "#e3ded2", 0.06);
        }
      } else {
        // Pared llena, con color de la sala y zócalo.
        push(a.paredes, 0, largo, 0, H, COLOR_PARED[lugar]);
        push(a.zocalos, 0, largo + 0.01, 0, 0.1, "#2a2224", grosor + 0.02);
      }
    }
  }
  // Dinteles sobre las puertas (de 2,12 m al techo).
  const dintel = (x: number, z: number, horizontal: boolean) =>
    a.paredes.push({ p: [x, (2.12 + H) / 2, z], s: horizontal ? [1.72, H - 2.12, 0.16] : [0.16, H - 2.12, 1.72], c: "#2a2630" });
  for (const area of SALAS_ORDEN) {
    const s = SALAS[area];
    if (area === "direccion") {
      dintel(0, s.z0, true);
      dintel(s.x0, 0, false);
      dintel(s.x1, 0, false);
    } else dintel(s.puerta[0], s.puerta[1], s.lado === "N" || s.lado === "S");
  }
  dintel(0, ENTRADA.z0, true);
  dintel(0, ENTRADA.z1, true);
  return a;
}

// --- Equipamiento por sala ----------------------------------------------------------------------

export interface Equipamiento {
  muebles: Mueble[];
  tabiques: Pieza[];
  metal: Pieza[];
  blancos: Pieza[];
  tazas: Pieza[];
  papeles: Pieza[];
  pantallas: { x: number; y: number; z: number; r: number; w: number; h: number; area: Area; j: number; variante: number }[];
  colgantes: { x: number; z: number }[];
  cuadros: { x: number; y: number; z: number; r: number; w: number; h: number; t: number }[];
  pizarras: { x: number; y: number; z: number; r: number }[];
}

/** Rotación para que un mueble del kit mire hacia +z (hacia la silla). */
const FRENTE = Math.PI;

export function equipamiento(salas: Record<Area, SalaVisual>): Equipamiento {
  const e: Equipamiento = { muebles: [], tabiques: [], metal: [], blancos: [], tazas: [], papeles: [], pantallas: [], colgantes: [], cuadros: [], pizarras: [] };
  const r = azar(77);
  for (const area of SALAS_ORDEN) {
    const s = SALAS[area];
    const n = salas[area].puestos.length;
    const asientos = asientosDeSala(area, n);
    asientos.forEach((a, j) => {
      const [mx, mz] = a.mesa;
      e.muebles.push({ m: "desk", x: mx, z: mz, r: FRENTE });
      e.muebles.push({ m: "chairDesk", x: a.x, z: a.z - 0.05, r: FRENTE + (r() - 0.5) * 0.4 });
      e.muebles.push({ m: "computerKeyboard", x: mx - 0.05, z: mz + 0.16, y: 0.77, r: FRENTE });
      e.muebles.push({ m: "computerMouse", x: mx + 0.35, z: mz + 0.18, y: 0.77, r: FRENTE });
      // Monitor propio: pie, brazo, marco y pantalla (se enciende cuando el puesto trabaja).
      const dos = (j + area.length) % 3 === 0;
      const xs = dos ? [mx - 0.3, mx + 0.3] : [mx];
      xs.forEach((x, k) => {
        const giro = dos ? (k === 0 ? 0.18 : -0.18) : 0;
        e.metal.push({ p: [x, 0.775, mz - 0.18], s: [0.22, 0.02, 0.16], c: "#1d1d22" });
        e.metal.push({ p: [x, 0.92, mz - 0.22], s: [0.05, 0.28, 0.05], c: "#1d1d22" });
        e.metal.push({ p: [x, 1.13, mz - 0.2], s: [0.58, 0.36, 0.035], r: giro, c: "#121216" });
        e.pantallas.push({ x: x + Math.sin(giro) * 0.02, y: 1.13, z: mz - 0.18, r: giro, w: 0.54, h: 0.32, area, j, variante: (j + k + area.length) % 3 });
      });
      e.tazas.push({ p: [mx + 0.55, 0.82, mz + 0.05], s: [0.08, 0.1, 0.08], c: ["#f4f1ea", "#c0392b", "#2c6fbf", "#2b2b2b"][(j + area.length) % 4] });
      if ((j + area.length) % 2 === 0) e.papeles.push({ p: [mx - 0.5, 0.775, mz + 0.05], s: [0.3, 0.02, 0.22], r: r() * 0.5, c: "#f4f2ec" });
      if (area !== "direccion") {
        // Tabiques de cubículo: atrás y a los costados, como en el reel.
        e.tabiques.push({ p: [mx, 0.62, mz - 0.48], s: [2.0, 1.24, 0.05], c: "#3c5a52" });
        e.metal.push({ p: [mx, 1.25, mz - 0.48], s: [2.04, 0.04, 0.08], c: "#cfc8b8" });
        if (a.col === 0 || a.col === 2 || (n <= 4 && a.col === 1)) {
          const lado = mx - 1.03;
          e.tabiques.push({ p: [lado, 0.55, mz - 0.05], s: [0.05, 1.1, 0.9], c: "#3c5a52" });
          e.metal.push({ p: [lado, 1.11, mz - 0.05], s: [0.08, 0.04, 0.94], c: "#cfc8b8" });
        }
        if (a.col === 3 || j === n - 1) {
          const lado = mx + 1.03;
          e.tabiques.push({ p: [lado, 0.55, mz - 0.05], s: [0.05, 1.1, 0.9], c: "#3c5a52" });
          e.metal.push({ p: [lado, 1.11, mz - 0.05], s: [0.08, 0.04, 0.94], c: "#cfc8b8" });
        }
      }
      e.colgantes.push({ x: mx, z: mz + 0.1 });
    });

    if (area === "direccion") {
      // Cerebro: bandeja de entregas, mesa de reunión, pantallas grandes, bibliotecas y plantas.
      const [bx, bz] = BANDEJA_CEREBRO;
      e.muebles.push({ m: "tableCross", x: bx, z: bz, r: 0, s: 1.2 });
      e.muebles.push({ m: "chairModernCushion", x: bx - 1.2, z: bz + 0.2, r: Math.PI / 2 });
      e.muebles.push({ m: "chairModernCushion", x: bx + 1.2, z: bz + 0.2, r: -Math.PI / 2 });
      e.muebles.push({ m: "bookcaseClosedWide", x: s.x0 + 0.35, z: 3.6, r: Math.PI / 2 });
      e.muebles.push({ m: "bookcaseClosedWide", x: s.x1 - 0.35, z: 3.6, r: -Math.PI / 2 });
      e.muebles.push({ m: "pottedPlant", x: s.x0 + 0.6, z: s.z0 + 0.6 });
      e.muebles.push({ m: "pottedPlant", x: s.x1 - 0.6, z: s.z0 + 0.6 });
      e.muebles.push({ m: "pottedPlant", x: s.x0 + 0.6, z: s.z1 - 0.6 });
      e.muebles.push({ m: "pottedPlant", x: s.x1 - 0.6, z: s.z1 - 0.6 });
      e.muebles.push({ m: "lampRoundFloor", x: s.x1 - 0.5, z: 1.4 });
      e.muebles.push({ m: "speaker", x: -3.7, z: s.z0 + 0.4 });
      e.muebles.push({ m: "speaker", x: 3.7, z: s.z0 + 0.4 });
      e.cuadros.push({ x: -3.5, y: 1.5, z: s.z1 - 0.1, r: Math.PI, w: 1.2, h: 0.8, t: 0 });
      e.cuadros.push({ x: 3.5, y: 1.5, z: s.z1 - 0.1, r: Math.PI, w: 1.2, h: 0.8, t: 2 });
      continue;
    }

    // Fondo de la sala (el lado opuesto a la puerta) y laterales.
    const atras = s.lado === "S" ? s.z0 : s.z1; // salas de arriba: fondo al norte; de abajo: al sur
    const haciaAdentro = s.lado === "S" ? 1 : -1;
    const conPuertaLateral = s.lado === "E" || s.lado === "O";
    const zAtras = conPuertaLateral ? s.z0 : atras;
    const dirAtras = conPuertaLateral ? 1 : haciaAdentro;
    e.pizarras.push({ x: s.cx + 2.2, y: 1.45, z: zAtras + dirAtras * 0.1, r: dirAtras > 0 ? 0 : Math.PI });
    e.cuadros.push({ x: s.cx - 2.4, y: 1.55, z: zAtras + dirAtras * 0.1, r: dirAtras > 0 ? 0 : Math.PI, w: 1.0, h: 0.7, t: SALAS_ORDEN.indexOf(area) % 3 });
    // Biblioteca y planta en el lateral sin puerta.
    const xLat = s.lado === "O" ? s.x1 - 0.3 : s.x0 + 0.3;
    const rLat = s.lado === "O" ? -Math.PI / 2 : Math.PI / 2;
    e.muebles.push({ m: "bookcaseOpen", x: xLat, z: s.cz - 0.6, r: rLat });
    e.muebles.push({ m: "bookcaseOpen", x: xLat, z: s.cz + 0.3, r: rLat });
    e.muebles.push({ m: "books", x: xLat, z: s.cz - 0.6, y: 1.78, r: rLat });
    e.muebles.push({ m: "pottedPlant", x: s.x0 + 0.5, z: zAtras + dirAtras * 0.5 });
    e.muebles.push({ m: "pottedPlant", x: s.x1 - 0.5, z: zAtras + dirAtras * 0.5 });
    e.muebles.push({ m: "trashcan", x: s.x1 - 0.45, z: s.cz + 1.4 });
    e.muebles.push({ m: "cardboardBoxClosed", x: s.x1 - 0.55, z: s.cz + 0.6, r: 0.4 });
    e.muebles.push({ m: "coatRackStanding", x: s.x1 - 0.45, z: zAtras + dirAtras * 1.3 });
    // Dispenser de agua: bidón celeste sobre mueble blanco.
    const dx = s.x1 - 0.45;
    const dz = s.cz - 1.4;
    e.blancos.push({ p: [dx, 0.45, dz], s: [0.36, 0.9, 0.36], c: "#e8e6e0" });
    e.blancos.push({ p: [dx, 1.08, dz], s: [0.3, 0.36, 0.3], c: "#7fc4e8" });
  }
  return e;
}

/** Living con cocina y pool en la entrada. */
function equipamientoEntrada(): { muebles: Mueble[]; blancos: Pieza[]; colgantes: { x: number; z: number }[] } {
  const m: Mueble[] = [];
  const b: Pieza[] = [];
  // Cocina sobre la pared este: bajomesadas, pileta, cocina, alacenas y heladera.
  const xE = ENTRADA.x1 - 0.48;
  const tramos = ["kitchenCabinet", "kitchenSink", "kitchenCabinetDrawer", "kitchenStove", "kitchenCabinet"];
  tramos.forEach((t, i) => {
    const z = ENTRADA.z0 + 0.9 + i * 0.86;
    m.push({ m: t, x: xE, z, r: -Math.PI / 2 });
    m.push({ m: i % 2 ? "kitchenCabinetUpperDouble" : "kitchenCabinetUpper", x: ENTRADA.x1 - 0.3, z, y: 1.45, r: -Math.PI / 2 });
  });
  m.push({ m: "kitchenCoffeeMachine", x: xE + 0.05, z: ENTRADA.z0 + 0.95, y: 0.9, r: -Math.PI / 2 });
  m.push({ m: "kitchenMicrowave", x: xE + 0.05, z: ENTRADA.z0 + 4.4, y: 0.9, r: -Math.PI / 2 });
  m.push({ m: "kitchenFridgeLarge", x: ENTRADA.x1 - 0.55, z: ENTRADA.z0 + 5.4, r: -Math.PI / 2 });
  // Barra con banquetas.
  for (let i = 0; i < 4; i++) m.push({ m: "kitchenBar", x: 3.25, z: ENTRADA.z0 + 1.0 + i * 0.86, r: Math.PI / 2 });
  for (let i = 0; i < 3; i++) m.push({ m: "stoolBar", x: 2.45, z: ENTRADA.z0 + 1.3 + i * 1.0, r: -Math.PI / 2 });
  // Living: sillón en L, mesa ratona, alfombra, lámpara de pie.
  m.push({ m: "rugRounded", x: 2.6, z: 12.3 });
  m.push({ m: "loungeSofaCorner", x: 3.6, z: 12.9, r: Math.PI });
  m.push({ m: "loungeSofa", x: 1.6, z: 13.2, r: Math.PI });
  m.push({ m: "tableCoffee", x: 2.4, z: 12.0, r: 0 });
  m.push({ m: "lampRoundFloor", x: 5.5, z: 13.4 });
  m.push({ m: "pottedPlant", x: -0.95, z: 13.5 });
  m.push({ m: "pottedPlant", x: 0.95, z: 13.5 });
  m.push({ m: "pottedPlant", x: -5.6, z: 7.75 });
  m.push({ m: "loungeChair", x: -5.4, z: 13.2, r: Math.PI * 0.75 });
  m.push({ m: "sideTable", x: -4.6, z: 13.5, r: Math.PI });
  m.push({ m: "radio", x: -4.6, z: 13.5, y: 0.77, r: Math.PI });
  m.push({ m: "trashcan", x: 5.6, z: 7.7 });
  return { muebles: m, blancos: b, colgantes: [{ x: -3.2, z: 9.3 }, { x: -3.2, z: 12.1 }, { x: 3.25, z: 9.4 }] };
}

// --- Mesa de pool (modelada, varias piezas) ---------------------------------------------------

function MesaPool({ x, z, mats }: { x: number; z: number; mats: Materiales }) {
  const L = 2.5;
  const A = 1.4;
  const bolas = useMemo(() => {
    const r = azar(Math.round(x * 10 + z));
    const colores = ["#f5f5f0", "#e8c22e", "#2c5fbf", "#c0392b", "#7d3cbf", "#e8781f", "#1f8a4c", "#7a1f1f", "#111111"];
    return colores.map((c, i) => ({ c, x: (r() - 0.5) * (L - 0.5), z: (r() - 0.5) * (A - 0.5), i }));
  }, [x, z]);
  return (
    <group position={[x, 0, z]}>
      {/* Patas torneadas */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[sx * (L / 2 - 0.2), 0.36, sz * (A / 2 - 0.18)]} geometry={unitCilindro} scale={[0.16, 0.72, 0.16]} material={mats.maderaPool} castShadow />
      )))}
      <mesh position={[0, 0.66, 0]} geometry={unitCaja} scale={[L - 0.1, 0.16, A - 0.1]} material={mats.maderaPool} castShadow receiveShadow />
      <mesh position={[0, 0.8, 0]} geometry={unitCaja} scale={[L - 0.22, 0.04, A - 0.22]} material={mats.pano} receiveShadow />
      {/* Bandas con bisel */}
      {[-1, 1].map((s) => (
        <mesh key={`l${s}`} position={[0, 0.83, s * (A / 2 - 0.06)]} geometry={unitCaja} scale={[L, 0.09, 0.12]} material={mats.maderaPool} castShadow />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`c${s}`} position={[s * (L / 2 - 0.06), 0.83, 0]} geometry={unitCaja} scale={[0.12, 0.09, A]} material={mats.maderaPool} castShadow />
      ))}
      {[-1, 0, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`b${sx}${sz}`} position={[sx * (L / 2 - 0.13), 0.825, sz * (A / 2 - 0.13)]} geometry={unitCilindro} scale={[0.09, 0.02, 0.09]} material={mats.negro} />
      )))}
      {bolas.map((b) => (
        <mesh key={b.i} position={[b.x, 0.85, b.z]} castShadow>
          <sphereGeometry args={[0.035, 12, 10]} />
          <meshStandardMaterial color={b.c} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0.3, 0.84, 0.25]} rotation={[0, 0.5, Math.PI / 2 - 0.02]} geometry={unitCilindro} scale={[0.02, 1.45, 0.02]} material={mats.maderaClara} castShadow />
    </group>
  );
}

// --- Exterior -----------------------------------------------------------------------------

interface Exterior {
  troncos: Pieza[];
  copas: { p: [number, number, number]; s: number; c: string }[];
  arbustos: { p: [number, number, number]; s: number; c: string }[];
  postes: Pieza[];
  faroles: { x: number; z: number }[];
  bancos: Mueble[];
}

function exterior(): Exterior {
  const r = azar(4242);
  const e: Exterior = { troncos: [], copas: [], arbustos: [], postes: [], faroles: [], bancos: [] };
  const verdes = ["#1f4a22", "#24552a", "#2d6330", "#1a3d1e", "#335f2a"];
  const arbol = (x: number, z: number, t: number) => {
    const alto = 1.6 + r() * 1.4;
    e.troncos.push({ p: [x, alto / 2, z], s: [0.22 * t, alto, 0.22 * t], c: "#4a3322" });
    const capas = 2 + ((r() * 2) | 0);
    for (let k = 0; k < capas; k++) {
      e.copas.push({ p: [x + (r() - 0.5) * 0.4, alto + 0.5 + k * 0.75, z + (r() - 0.5) * 0.4], s: (1.35 - k * 0.28) * t * (0.9 + r() * 0.3), c: verdes[(r() * verdes.length) | 0] });
    }
  };
  for (let i = 0; i < 140; i++) {
    const ang = r() * Math.PI * 2;
    const x = Math.cos(ang) * (28 + r() * 30);
    const z = Math.sin(ang) * (24 + r() * 26);
    if (z > 17 && z < 27) continue; // la calle
    if (Math.abs(x) < 21 && Math.abs(z) < 19) continue;
    arbol(x, z, 0.9 + r() * 0.6);
  }
  for (let x = -16; x <= 16; x += 2.4) {
    if (Math.abs(x) < 2) continue;
    e.arbustos.push({ p: [x, 0.3, 14.9], s: 0.55 + r() * 0.2, c: verdes[(r() * verdes.length) | 0] });
    e.arbustos.push({ p: [x + 0.8, 0.3, -14.9], s: 0.5 + r() * 0.2, c: verdes[(r() * verdes.length) | 0] });
  }
  for (let z = -12; z <= 12; z += 2.6) {
    e.arbustos.push({ p: [-18.2, 0.3, z], s: 0.5 + r() * 0.2, c: verdes[(r() * verdes.length) | 0] });
    e.arbustos.push({ p: [18.2, 0.3, z + 1], s: 0.5 + r() * 0.2, c: verdes[(r() * verdes.length) | 0] });
  }
  for (let x = -18; x <= 18; x += 9) {
    e.postes.push({ p: [x, 1.6, 17.2], s: [0.1, 3.2, 0.1], c: "#2a2a30" });
    e.postes.push({ p: [x, 3.15, 16.95], s: [0.1, 0.08, 0.6], c: "#2a2a30" });
    e.faroles.push({ x, z: 16.7 });
  }
  e.bancos.push({ m: "benchCushion", x: -4, z: 16.0, r: Math.PI }, { m: "benchCushion", x: 4, z: 16.0, r: Math.PI });
  return e;
}

// --- Materiales compartidos --------------------------------------------------------------------

export interface Materiales {
  pared: THREE.MeshStandardMaterial;
  marco: THREE.MeshStandardMaterial;
  vidrio: THREE.MeshStandardMaterial;
  persiana: THREE.MeshStandardMaterial;
  tabique: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  blanco: THREE.MeshStandardMaterial;
  taza: THREE.MeshStandardMaterial;
  maderaPool: THREE.MeshStandardMaterial;
  maderaClara: THREE.MeshStandardMaterial;
  pano: THREE.MeshStandardMaterial;
  negro: THREE.MeshStandardMaterial;
  foco: THREE.MeshStandardMaterial;
  pantalla: THREE.MeshBasicMaterial[];
  apagada: THREE.MeshBasicMaterial;
  copa: THREE.MeshStandardMaterial;
  tronco: THREE.MeshStandardMaterial;
}

export function crearMateriales(): Materiales {
  const t = texturas();
  return {
    pared: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
    marco: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.3 }),
    vidrio: new THREE.MeshStandardMaterial({ color: "#9fc3d8", transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false }),
    persiana: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    tabique: new THREE.MeshStandardMaterial({ roughness: 0.95 }),
    metal: new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.4 }),
    blanco: new THREE.MeshStandardMaterial({ roughness: 0.4 }),
    taza: new THREE.MeshStandardMaterial({ roughness: 0.35 }),
    maderaPool: new THREE.MeshStandardMaterial({ color: "#5a2f1d", roughness: 0.45 }),
    maderaClara: new THREE.MeshStandardMaterial({ color: "#d8b27a", roughness: 0.5 }),
    pano: new THREE.MeshStandardMaterial({ color: "#1f6b3a", roughness: 0.95 }),
    negro: new THREE.MeshStandardMaterial({ color: "#0b0b0d", roughness: 0.6 }),
    foco: new THREE.MeshStandardMaterial({ color: "#fff3d6", emissive: "#ffcf8a", emissiveIntensity: 3.2 }),
    pantalla: t.codigo.map((m) => new THREE.MeshBasicMaterial({ map: m, toneMapped: false, color: new THREE.Color(1.35, 1.35, 1.35) })),
    apagada: new THREE.MeshBasicMaterial({ color: "#1b2440" }),
    copa: new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }),
    tronco: new THREE.MeshStandardMaterial({ roughness: 1 }),
  };
}

// --- Componente principal ----------------------------------------------------------------------

export interface MundoProps {
  salas: Record<Area, SalaVisual>;
  hojas: number;
  sombras: boolean;
  /** Luces por sala (en celular menos). */
  luces: "todas" | "pocas";
  aerea: boolean;
  resaltada: Area | null;
  alTocarPiso?: (lugar: Lugar, e: ThreeEvent<MouseEvent>) => void;
  animar: boolean;
}

const geoCopa = new THREE.IcosahedronGeometry(1, 0);
const geoCono = new THREE.ConeGeometry(0.22, 0.2, 18, 1, true);
const geoFoco = new THREE.SphereGeometry(0.07, 10, 8);
const geoPlano = new THREE.PlaneGeometry(1, 1);

function Colgantes({ puntos, mats }: { puntos: { x: number; z: number }[]; mats: Materiales }) {
  const cables = useMemo<Pieza[]>(() => puntos.map((p) => ({ p: [p.x, 2.42, p.z], s: [0.012, 0.36, 0.012], c: "#111" })), [puntos]);
  const conos = useRef<THREE.InstancedMesh>(null);
  const focos = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    puntos.forEach((p, i) => {
      dummy.position.set(p.x, 2.2, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      conos.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 2.14;
      dummy.updateMatrix();
      focos.current?.setMatrixAt(i, dummy.matrix);
    });
    if (conos.current) conos.current.instanceMatrix.needsUpdate = true;
    if (focos.current) focos.current.instanceMatrix.needsUpdate = true;
    conos.current?.computeBoundingSphere();
    focos.current?.computeBoundingSphere();
  }, [puntos]);
  return (
    <>
      <Lote items={cables} mat={mats.negro} sombra={false} />
      <instancedMesh ref={conos} args={[geoCono, mats.marco, puntos.length]} />
      <instancedMesh ref={focos} args={[geoFoco, mats.foco, puntos.length]} />
    </>
  );
}

function Pantallas({ eq, salas, mats }: { eq: Equipamiento; salas: Record<Area, SalaVisual>; mats: Materiales }) {
  const grupos = useMemo(() => {
    const g: Record<string, typeof eq.pantallas> = { a: [], v0: [], v1: [], v2: [] };
    for (const p of eq.pantallas) {
      const est = salas[p.area].puestos[p.j]?.estado;
      if (est === "trabajando" || est === "listo" || p.area === "direccion") g[`v${p.variante}`].push(p);
      else g.a.push(p);
    }
    return g;
  }, [eq, salas]);
  return (
    <>
      {Object.entries(grupos).map(([k, lista]) => (
        <Placas key={k} lista={lista} mat={k === "a" ? mats.apagada : mats.pantalla[Number(k.slice(1))]} />
      ))}
    </>
  );
}

const Placas = memo(function Placas({ lista, mat }: { lista: { x: number; y: number; z: number; r: number; w: number; h: number }[]; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    lista.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.r, 0);
      dummy.scale.set(p.w, p.h, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [lista]);
  if (!lista.length) return null;
  return <instancedMesh ref={ref} args={[geoPlano, mat, lista.length]} />;
});

function Orbe({ animar }: { animar: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (animar && ref.current) {
      ref.current.rotation.y += dt * 0.35;
      ref.current.position.y = 1.7 + Math.sin(performance.now() / 900) * 0.06;
    }
  });
  return (
    <group position={[0, 0, -0.6]}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.35, 0.12, 40]} />
        <meshStandardMaterial color="#26212f" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.025, 8, 64]} />
        <meshBasicMaterial color={new THREE.Color(1.6, 1.0, 2.6)} toneMapped={false} />
      </mesh>
      <group ref={ref} position={[0, 1.7, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color="#9b6bff" emissive="#7a4dff" emissiveIntensity={1.6} roughness={0.2} flatShading />
        </mesh>
        <mesh scale={1.35}>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshBasicMaterial color="#c9b3ff" wireframe transparent opacity={0.35} />
        </mesh>
      </group>
      <pointLight position={[0, 1.7, 0]} color="#a78bff" intensity={14} distance={9} decay={1.6} />
    </group>
  );
}

function Hojas({ n }: { n: number }) {
  const pilas = Math.min(6, Math.max(0, n));
  const [bx, bz] = BANDEJA_CEREBRO;
  return (
    <group position={[bx, 0.84, bz]}>
      {Array.from({ length: pilas }, (_, i) => (
        <group key={i} position={[(i % 3) * 0.42 - 0.42, 0, i < 3 ? -0.12 : 0.22]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0, k * 0.022, 0]} rotation={[0, k * 0.18 - 0.1, 0]} castShadow>
              <boxGeometry args={[0.3, 0.018, 0.4]} />
              <meshStandardMaterial color={k === 2 ? "#f2c531" : "#f4f2ec"} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

const SUB_OK: [string, string] = ["entrega para tu OK", "entregas para tu OK"];
const SUB_TRABAJO: [string, string] = ["agente trabajando", "agentes trabajando"];

function PantallaGrande({ x, z, r, hojas, titulo, sub }: { x: number; z: number; r: number; hojas: number; titulo: string; sub: [string, string] }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 288;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 512, 288);
    grad.addColorStop(0, "#151a33");
    grad.addColorStop(1, "#2a1846");
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 288);
    g.fillStyle = "#c9b3ff";
    g.font = "600 22px system-ui, sans-serif";
    g.fillText(titulo.toUpperCase(), 28, 46);
    g.fillStyle = "#ffffff";
    g.font = "italic 700 92px Georgia, serif";
    g.fillText(String(hojas), 28, 168);
    g.font = "500 26px system-ui, sans-serif";
    g.fillStyle = "#e9c677";
    g.fillText(hojas === 1 ? sub[0] : sub[1], 28, 214);
    g.strokeStyle = "#6fd3a3";
    g.lineWidth = 4;
    g.beginPath();
    [0.7, 0.5, 0.62, 0.38, 0.45, 0.22].forEach((v, i) => {
      const px = 300 + i * 36;
      const py = 90 + v * 140;
      if (i) g.lineTo(px, py);
      else g.moveTo(px, py);
    });
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [hojas, titulo, sub]);
  return (
    <group position={[x, 1.55, z]} rotation={[0, r, 0]}>
      <mesh geometry={unitCaja} scale={[2.1, 1.22, 0.06]}>
        <meshStandardMaterial color="#0d0d10" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[2.0, 1.12]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Cuadros({ eq }: { eq: Equipamiento }) {
  const t = texturas();
  return (
    <>
      {eq.cuadros.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} rotation={[0, c.r, 0]}>
          <mesh geometry={unitCaja} scale={[c.w + 0.08, c.h + 0.08, 0.04]}>
            <meshStandardMaterial color="#1e1a16" />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[c.w, c.h]} />
            <meshStandardMaterial map={t.cuadros[c.t]} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {eq.pizarras.map((p, i) => (
        <group key={`p${i}`} position={[p.x, p.y, p.z]} rotation={[0, p.r, 0]}>
          <mesh geometry={unitCaja} scale={[1.7, 1.12, 0.05]}>
            <meshStandardMaterial color="#b9b9b9" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[1.6, 1.04]} />
            <meshStandardMaterial map={t.grafico} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.6, 0.06]} geometry={unitCaja} scale={[1.5, 0.03, 0.08]}>
            <meshStandardMaterial color="#9a9a9a" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Pisos({ alTocarPiso, aerea, resaltada }: Pick<MundoProps, "alTocarPiso" | "aerea" | "resaltada">) {
  const t = texturas();
  const pisos = useMemo(() => {
    const lista: { lugar: Lugar; x: number; z: number; w: number; d: number; map: THREE.Texture; tile: number }[] = [];
    for (const a of SALAS_ORDEN) {
      const s = SALAS[a];
      const map = a === "direccion" ? t.maderaOscura : a === "analisis" || a === "seo" || a === "ingenieria" ? t.alfombraAzul : t.alfombra;
      lista.push({ lugar: a, x: s.cx, z: s.cz, w: s.x1 - s.x0, d: s.z1 - s.z0, map, tile: a === "direccion" ? 3 : 1.6 });
    }
    lista.push({ lugar: "entrada", x: (ENTRADA.x0 + ENTRADA.x1) / 2 - 1.5, z: (ENTRADA.z0 + ENTRADA.z1) / 2, w: ENTRADA.x1 - ENTRADA.x0 - 3, d: ENTRADA.z1 - ENTRADA.z0, map: t.madera, tile: 2.2 });
    lista.push({ lugar: "entrada", x: ENTRADA.x1 - 1.5, z: (ENTRADA.z0 + ENTRADA.z1) / 2, w: 3, d: ENTRADA.z1 - ENTRADA.z0, map: t.baldosas, tile: 2 });
    return lista.map((p) => ({ ...p, geo: planoConUV(p.w, p.d, p.tile) }));
  }, [t]);
  const pasillo = useMemo(() => planoConUV(35.2, 28.6, 2.4), []);
  return (
    <group>
      <mesh geometry={pasillo} position={[0, 0.005, 0]} receiveShadow>
        <meshStandardMaterial map={t.madera} color="#d8c0a0" roughness={0.75} />
      </mesh>
      {pisos.map((p, i) => (
        <mesh
          key={i}
          geometry={p.geo}
          position={[p.x, 0.012, p.z]}
          receiveShadow
          onClick={(e) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            alTocarPiso?.(p.lugar, e);
          }}
          onPointerOver={(e) => {
            if (!aerea) return;
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <meshStandardMaterial map={p.map} roughness={0.92} emissive={resaltada === p.lugar ? "#e9c677" : "#000000"} emissiveIntensity={resaltada === p.lugar ? 0.12 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function Jardin({ ext, mats, sombras }: { ext: Exterior; mats: Materiales; sombras: boolean }) {
  const t = texturas();
  const pasto = useMemo(() => {
    const g = planoConUV(220, 220, 6);
    return g;
  }, []);
  const vereda = useMemo(() => planoConUV(40, 3.2, 1.6), []);
  const veredaLat = useMemo(() => planoConUV(2.6, 31, 1.6), []);
  const calle = useMemo(() => planoConUV(220, 7, 7), []);
  const copas = useRef<THREE.InstancedMesh>(null);
  const arbustos = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const llenar = (m: THREE.InstancedMesh | null, lista: { p: [number, number, number]; s: number; c: string }[]) => {
      if (!m) return;
      lista.forEach((c, i) => {
        dummy.position.set(...c.p);
        dummy.rotation.set(c.s * 3, c.s * 7, 0);
        dummy.scale.setScalar(c.s);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        m.setColorAt(i, tmpColor.set(c.c));
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
    };
    llenar(copas.current, ext.copas);
    llenar(arbustos.current, ext.arbustos);
  }, [ext]);
  return (
    <group>
      <mesh geometry={pasto} position={[0, -0.03, 0]} receiveShadow>
        <meshStandardMaterial map={t.pasto} roughness={1} />
      </mesh>
      <mesh geometry={vereda} position={[0, -0.005, 15.7]} receiveShadow>
        <meshStandardMaterial map={t.vereda} roughness={0.95} />
      </mesh>
      <mesh geometry={veredaLat} position={[19.0, -0.005, 0]} receiveShadow>
        <meshStandardMaterial map={t.vereda} roughness={0.95} />
      </mesh>
      <mesh geometry={calle} position={[0, -0.02, 21]} receiveShadow>
        <meshStandardMaterial color="#1d1e22" roughness={0.9} />
      </mesh>
      <Lote items={useMemo(() => Array.from({ length: 30 }, (_, i) => ({ p: [-90 + i * 6, -0.01, 21] as [number, number, number], s: [2.4, 0.01, 0.16] as [number, number, number], c: "#d9cfa8" })), [])} mat={mats.blanco} sombra={false} />
      <Lote items={ext.troncos} mat={mats.tronco} geo="cilindro" sombra={sombras} />
      <instancedMesh ref={copas} args={[geoCopa, mats.copa, ext.copas.length]} castShadow={sombras} receiveShadow />
      <instancedMesh ref={arbustos} args={[geoCopa, mats.copa, ext.arbustos.length]} castShadow={sombras} receiveShadow />
      <Lote items={ext.postes} mat={mats.metal} sombra={sombras} />
      {ext.faroles.map((f, i) => (
        <mesh key={i} position={[f.x, 3.08, f.z]} geometry={geoFoco} scale={1.6} material={mats.foco} />
      ))}
    </group>
  );
}

export function Mundo({ salas, hojas, sombras, luces, aerea, resaltada, alTocarPiso, animar }: MundoProps) {
  const mats = useMemo(() => crearMateriales(), []);
  const arq = useMemo(() => arquitectura(), []);
  const eq = useMemo(() => equipamiento(salas), [salas]);
  const ent = useMemo(() => equipamientoEntrada(), []);
  const ext = useMemo(() => exterior(), []);
  const muebles = useMemo(() => [...eq.muebles, ...ent.muebles, ...ext.bancos], [eq, ent, ext]);
  const colgantes = useMemo(() => [...eq.colgantes, ...ent.colgantes], [eq, ent]);
  const lucesSalas = useMemo(() => {
    const l: { x: number; z: number; c: string; i: number }[] = SALAS_ORDEN.map((a) => ({ x: SALAS[a].cx, z: SALAS[a].cz + (a === "direccion" ? 2 : 0), c: a === "direccion" ? "#ffd2a0" : "#ffb878", i: a === "direccion" ? 40 : 32 }));
    l.push({ x: -3, z: 10.6, c: "#ffc58a", i: 30 }, { x: 3.5, z: 10.6, c: "#ffc58a", i: 26 });
    return luces === "todas" ? l : l.filter((_, i) => i % 2 === 0);
  }, [luces]);

  return (
    <group>
      <Jardin ext={ext} mats={mats} sombras={sombras} />
      <Pisos alTocarPiso={alTocarPiso} aerea={aerea} resaltada={resaltada} />
      <Lote items={arq.paredes} mat={mats.pared} sombra={sombras} />
      <Lote items={arq.zocalos} mat={mats.marco} sombra={false} />
      <Lote items={arq.marcos} mat={mats.marco} sombra={sombras} />
      <Lote items={arq.remates} mat={mats.marco} sombra={false} />
      <Lote items={arq.persianas} mat={mats.persiana} sombra={sombras} />
      <Lote items={arq.vidrios} mat={mats.vidrio} sombra={false} recibe={false} />
      <Lote items={eq.tabiques} mat={mats.tabique} sombra={sombras} />
      <Lote items={eq.metal} mat={mats.metal} sombra={sombras} />
      <Lote items={eq.blancos} mat={mats.blanco} sombra={sombras} />
      <Lote items={eq.tazas} mat={mats.taza} geo="cilindro" sombra={false} />
      <Lote items={eq.papeles} mat={mats.blanco} sombra={false} />
      <Pantallas eq={eq} salas={salas} mats={mats} />
      <Colgantes puntos={colgantes} mats={mats} />
      <Cuadros eq={eq} />
      <MueblesKenney items={muebles} sombra={sombras} />
      <MesaPool x={-3.2} z={9.3} mats={mats} />
      <MesaPool x={-3.2} z={12.1} mats={mats} />
      <Orbe animar={animar} />
      <Hojas n={hojas} />
      <PantallaGrande x={-3.7} z={SALAS.direccion.z0 + 0.12} r={0} hojas={hojas} titulo="Cerebro · Para tu OK" sub={SUB_OK} />
      <PantallaGrande x={3.7} z={SALAS.direccion.z0 + 0.12} r={0} hojas={SALAS_ORDEN.reduce((n, a) => n + salas[a].trabajando, 0)} titulo="Oficina en vivo" sub={SUB_TRABAJO} />
      {lucesSalas.map((l, i) => (
        <pointLight key={i} position={[l.x, 2.3, l.z]} color={l.c} intensity={l.i} distance={13} decay={1.5} />
      ))}
    </group>
  );
}

useGLTF.preload(RUTA_MUEBLES, false, false);
