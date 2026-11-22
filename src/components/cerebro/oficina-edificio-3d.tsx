"use client";

/**
 * Edificio 3D de la Oficina (22/11). Se carga con next/dynamic y ssr:false desde `OficinaVisual`.
 * Casa de muñecas de noche: sin techo, paredes bajas, una sala por sector y el Cerebro grande en el
 * centro. Todo es procedural (cajas, cilindros, conos y esferas instanciados; ninguna textura baja de
 * la red). Sombras con un solo mapa suave; luces cálidas por sala. Los agentes teclean sentados y,
 * cuando su sector tiene tareas en marcha, uno camina por el pasillo al Cerebro con una carpeta, la
 * deja y vuelve. La cámara vuela entre el edificio y cada sala. El canvas es aria-hidden: la fuente
 * de verdad es la lista del panel.
 */
import { Suspense, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei/web/Html";
import * as THREE from "three";
import { brazosTecleo } from "@/lib/oficina/escena";
import type { Area } from "@/lib/oficina/reglas";
import {
  BANDEJA_CEREBRO,
  ENTRADA,
  LIMITES,
  SALAS,
  SALAS_ORDEN,
  asientosDeSala,
  camaraEdificio,
  faseMensajero,
  largoRuta,
  murosDeRect,
  murosDeSala,
  puntoEnRuta,
  puntosDeRastro,
  rutaAlCerebro,
  suavizado,
  type Asiento,
  type Punto,
} from "@/lib/oficina/edificio";
import type { SalaVisual } from "@/lib/oficina/panel";
import type { PuestoVisual } from "@/lib/oficina/escena";

export interface EdificioProps {
  salas: Record<Area, SalaVisual>;
  hojas: number;
  sala: Area | null;
  resaltada: Area | null;
  /** «area:indice» del agente marcado en el panel. */
  puestoSel: string | null;
  conPanel: boolean;
  animar: boolean;
  activa: boolean;
  reducido: boolean;
  alElegirSala: (a: Area | null) => void;
  alElegirPuesto?: (area: Area, indice: number) => void;
  alListo?: () => void;
}

// --- Piezas instanciadas -------------------------------------------------------------------------

type V3 = [number, number, number];
interface Item {
  p: V3;
  s: V3;
  c: string;
  ry?: number;
  rx?: number;
  rz?: number;
}
type Geo = "caja" | "cil" | "cono" | "esf" | "plano";
type Mat = "std" | "basico" | "vidrio" | "aditivo";

const geometrias: Record<Geo, () => THREE.BufferGeometry> = {
  caja: () => new THREE.BoxGeometry(1, 1, 1),
  cil: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 18),
  cono: () => new THREE.ConeGeometry(0.5, 1, 7),
  esf: () => new THREE.SphereGeometry(0.5, 20, 14),
  plano: () => new THREE.PlaneGeometry(1, 1),
};

const dummy = new THREE.Object3D();
const color = new THREE.Color();

const Instancias = memo(function Instancias({ items, geo, mat = "std", sombra = true, recibe = true, orden }: { items: Item[]; geo: Geo; mat?: Mat; sombra?: boolean; recibe?: boolean; orden?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometria = useMemo(() => geometrias[geo](), [geo]);
  useEffect(() => () => geometria.dispose(), [geometria]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach((it, i) => {
      dummy.position.set(...it.p);
      dummy.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
      dummy.scale.set(...it.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, color.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh key={items.length} ref={ref} args={[geometria, undefined, items.length]} frustumCulled={false} castShadow={sombra && mat === "std"} receiveShadow={recibe && mat === "std"} renderOrder={orden}>
      {mat === "std" && <meshStandardMaterial roughness={0.82} metalness={0.05} />}
      {mat === "basico" && <meshBasicMaterial toneMapped={false} />}
      {mat === "vidrio" && <meshStandardMaterial roughness={0.25} transparent opacity={0.3} depthWrite={false} />}
      {mat === "aditivo" && <meshBasicMaterial transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />}
    </instancedMesh>
  );
});

function semilla(n: number) {
  let s = n >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// --- Construcción del edificio (una sola vez) ---------------------------------------------------

interface Capa {
  cajas: Item[];
  cil: Item[];
  conos: Item[];
  esf: Item[];
  vidrio: Item[];
  luz: Item[];
  aditivo: Item[];
}

interface Pantalla {
  area: Area;
  j: number;
  p: V3;
}

const PISOS: Record<Area, [string, string]> = {
  direccion: ["#1f1b33", "#2b2547"],
  analisis: ["#7a6a58", "#8a7a66"],
  redes: ["#7d4a44", "#8d5a52"],
  diseno: ["#6a5578", "#7a6588"],
  seo: ["#4c6a5c", "#5c7a6c"],
  bots: ["#455d7c", "#556d8c"],
  ingenieria: ["#575d66", "#676d76"],
  asistente: ["#8a6844", "#9a7854"],
};
const MESAS: Record<Area, string> = { direccion: "#b8894a", analisis: "#c89a62", redes: "#d19a70", diseno: "#c8a0c4", seo: "#b8c9a8", bots: "#a8bcd8", ingenieria: "#b4b8c0", asistente: "#d8b078" };

function construir(): { capa: Capa; pantallas: Pantalla[]; arboles: { troncos: Item[]; copas: Item[]; copas2: Item[] } } {
  const capa: Capa = { cajas: [], cil: [], conos: [], esf: [], vidrio: [], luz: [], aditivo: [] };
  const pantallas: Pantalla[] = [];
  const caja = (p: V3, s: V3, c: string, ry = 0) => capa.cajas.push({ p, s, c, ry });
  const cil = (p: V3, s: V3, c: string) => capa.cil.push({ p, s, c });
  const cono = (p: V3, s: V3, c: string, rx = 0, rz = 0) => capa.conos.push({ p, s, c, rx, rz });
  const esf = (p: V3, s: V3, c: string) => capa.esf.push({ p, s, c });

  const planta = (x: number, z: number, k = 1) => {
    cil([x, 0.18 * k, z], [0.34 * k, 0.36 * k, 0.34 * k], "#c2693a");
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      cono([x + Math.cos(a) * 0.1 * k, 0.62 * k, z + Math.sin(a) * 0.1 * k], [0.2 * k, 0.7 * k, 0.2 * k], i % 2 ? "#3f8f4f" : "#6fbf63", Math.sin(a) * 0.45, -Math.cos(a) * 0.45);
    }
  };

  // suelo del edificio y pasillos
  caja([0, -0.16, 0], [LIMITES.x1 - LIMITES.x0, 0.32, LIMITES.z1 - LIMITES.z0], "#25202c");
  caja([0, 0.02, 0], [LIMITES.x1 - LIMITES.x0 - 0.6, 0.04, LIMITES.z1 - LIMITES.z0 - 0.6], "#3a3340");
  // franjas de baldosa en los pasillos
  for (const x of [-7.1, 7.1]) caja([x, 0.046, 0], [0.05, 0.01, 26.6], "#4a4350");
  for (const z of [-6.2, 6.2]) caja([0, 0.046, z], [34.4, 0.01, 0.05], "#4a4350");

  for (const area of SALAS_ORDEN) {
    const s = SALAS[area];
    const [piso, alfombra] = PISOS[area];
    caja([s.cx, 0.05, s.cz], [s.x1 - s.x0, 0.06, s.z1 - s.z0], piso);
    if (area !== "direccion") caja([s.cx, 0.085, s.cz], [s.x1 - s.x0 - 1.6, 0.02, s.z1 - s.z0 - 1.6], alfombra);
    // paredes: cuerpo claro y remate oscuro
    for (const m of murosDeSala(area)) {
      caja(m.p, m.s, area === "direccion" ? "#e3d6bd" : "#e6ddd0");
      caja([m.p[0], m.s[1] + 0.03, m.p[2]], [m.s[0] + 0.04, 0.06, m.s[2] + 0.04], area === "direccion" ? "#c9a45a" : "#4a3a2e");
    }
    // ventanas del fondo, con la noche detrás
    const tieneVentana = [-3.1, 3.1];
    for (const dx of tieneVentana) {
      capa.luz.push({ p: [s.cx + dx, 1.0, s.z0 + 0.1], s: [1.5, 0.75, 1], c: "#26356b" });
      capa.luz.push({ p: [s.cx + dx, 1.12, s.z0 + 0.105], s: [1.4, 0.3, 1], c: "#3a4b8c" });
      caja([s.cx + dx, 1.0, s.z0 + 0.08], [1.62, 0.87, 0.04], "#4a3a2e");
    }
    planta(s.x0 + 0.7, s.z0 + 0.75, 1.15);
    planta(s.x1 - 0.7, s.z0 + 0.75, 1.15);
    if (area === "analisis" || area === "diseno" || area === "ingenieria" || area === "seo") {
      if (s.lado === "S" || s.lado === "E") {
        capa.luz.push({ p: [s.cx, 1.0, s.z0 + 0.1], s: [2.1, 0.9, 1], c: "#f3eee2" });
        for (let k = 0; k < 8; k++) capa.luz.push({ p: [s.cx - 0.8 + (k % 4) * 0.52, 1.1 - Math.floor(k / 4) * 0.34, s.z0 + 0.115], s: [0.3, 0.22, 1], c: ["#f2c531", "#ff8fa8", "#7fd0ff", "#9be58a"][k % 4] });
      }
    }
  }

  // escritorios, sillas y monitores
  for (const area of SALAS_ORDEN) {
    const n = Math.min(8, area === "direccion" ? 6 : 7);
    const asientos = asientosDeSala(area, n);
    asientos.forEach((a, j) => {
      const [x, z] = a.mesa;
      caja([x, 0.76, z], [1.6, 0.06, 0.8], MESAS[area]);
      caja([x - 0.72, 0.37, z], [0.06, 0.74, 0.74], "#2b2630");
      caja([x + 0.72, 0.37, z], [0.06, 0.74, 0.74], "#2b2630");
      caja([x, 0.4, z - 0.36], [1.5, 0.7, 0.04], "#3a3340");
      cil([x, 0.83, z - 0.12], [0.07, 0.14, 0.07], "#25252d");
      caja([x, 1.14, z - 0.14], [0.7, 0.42, 0.04], "#15131a");
      pantallas.push({ area, j, p: [x, 1.14, z - 0.115] });
      caja([x, 0.795, z + 0.14], [0.46, 0.02, 0.16], "#2a2a33");
      cil([x + 0.62, 0.82, z + 0.05], [0.09, 0.09, 0.09], "#f6f3ee");
      // silla
      cil([x, 0.5, z + 0.92], [0.55, 0.07, 0.55], "#4a4c58");
      cil([x, 0.25, z + 0.92], [0.07, 0.5, 0.07], "#222");
      cil([x, 0.04, z + 0.92], [0.5, 0.04, 0.5], "#25252d");
      caja([x, 0.84, z + 1.2], [0.5, 0.56, 0.06], "#6a6c7a");
      if (j === 0) caja([x - 0.62, 0.84, z + 0.1], [0.08, 0.02, 0.08], "#25252d");
    });
  }

  // Cerebro: pedestal del orbe, anillos dorados, pantallas doradas y escritorio de entrada
  const c = SALAS.direccion;
  cil([0, 0.12, -0.3], [4.4, 0.05, 4.4], "#c9a45a");
  cil([0, 0.145, -0.3], [4.1, 0.05, 4.1], "#1a1630");
  cil([0, 0.16, -0.3], [2.1, 0.12, 2.1], "#2c2548");
  cil([0, 0.3, -0.3], [1.5, 0.3, 1.5], "#c9a45a");
  for (const dx of [-2.8, 2.8]) {
    capa.luz.push({ p: [dx, 1.0, c.z0 + 0.1], s: [2.2, 0.9, 1], c: "#d9a93c" });
    capa.luz.push({ p: [dx, 1.0, c.z0 + 0.12], s: [1.9, 0.62, 1], c: "#f6d98a" });
  }
  caja([BANDEJA_CEREBRO[0], 0.76, BANDEJA_CEREBRO[1]], [2.6, 0.08, 0.9], "#c9a45a");
  caja([BANDEJA_CEREBRO[0], 0.38, BANDEJA_CEREBRO[1]], [2.5, 0.7, 0.8], "#2a2340");
  caja([BANDEJA_CEREBRO[0], 0.8, BANDEJA_CEREBRO[1] + 0.34], [2.6, 0.04, 0.04], "#f6d98a");
  planta(c.x0 + 0.8, c.z1 - 0.8, 1.6);
  planta(c.x1 - 0.8, c.z1 - 0.8, 1.6);

  // Entrada: sala de descanso con mesa de pool, sillones y plantas
  const e = ENTRADA;
  const ecx = (e.x0 + e.x1) / 2;
  const ecz = (e.z0 + e.z1) / 2;
  caja([ecx, 0.05, ecz], [e.x1 - e.x0, 0.06, e.z1 - e.z0], "#6b4a2e");
  cil([ecx, 0.085, ecz + 0.4], [5.6, 0.02, 5.6], "#4b2a2a");
  for (const m of murosDeRect(e, { N: 0 })) {
    caja(m.p, m.s, "#e6ddd0");
    caja([m.p[0], m.s[1] + 0.03, m.p[2]], [m.s[0] + 0.04, 0.06, m.s[2] + 0.04], "#4a3a2e");
  }
  caja([ecx, 0.82, ecz + 0.6], [2.7, 0.1, 1.5], "#2f6b4a");
  caja([ecx, 0.9, ecz + 0.6], [2.9, 0.08, 1.7], "#5a3a22");
  for (const [dx, dz] of [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]]) cil([ecx + dx, 0.4, ecz + 0.6 + dz], [0.16, 0.8, 0.16], "#3a2616");
  for (const dx of [-3.2, 3.2]) {
    caja([ecx + dx, 0.32, ecz - 1.9], [1.9, 0.5, 0.9], "#4b4f6e");
    caja([ecx + dx, 0.72, ecz - 2.3], [1.9, 0.5, 0.18], "#5b5f80");
  }
  esf([ecx - 0.6, 0.97, ecz + 0.6], [0.14, 0.14, 0.14], "#f2f2f2");
  esf([ecx + 0.4, 0.97, ecz + 0.9], [0.14, 0.14, 0.14], "#d0453a");
  planta(e.x0 + 0.8, e.z1 - 0.9, 1.7);
  planta(e.x1 - 0.8, e.z1 - 0.9, 1.7);
  capa.luz.push({ p: [ecx, 1.0, e.z0 + 0.1], s: [3.2, 0.9, 1], c: "#26356b" });

  // árboles alrededor, siempre iguales
  const rnd = semilla(21);
  const troncos: Item[] = [];
  const copas: Item[] = [];
  const copas2: Item[] = [];
  let n = 0;
  while (n < 90) {
    const x = (rnd() * 2 - 1) * 36;
    const z = (rnd() * 2 - 1) * 28;
    if (Math.abs(x) < 21.4 && Math.abs(z) < 18.2) continue;
    if (z > 15 && Math.abs(x) < 3.4) continue;
    const k = 0.8 + rnd() * 0.9;
    n++;
    troncos.push({ p: [x, 0.5 * k, z], s: [0.35 * k, 1 * k, 0.35 * k], c: "#4a3322" });
    const verde = ["#1f4a33", "#27583a", "#1b4030", "#2d6040"][Math.floor(rnd() * 4)];
    copas.push({ p: [x, 1.9 * k, z], s: [2.0 * k, 2.4 * k, 2.0 * k], c: verde });
    copas2.push({ p: [x, 3.0 * k, z], s: [1.4 * k, 1.8 * k, 1.4 * k], c: verde });
  }
  return { capa, pantallas, arboles: { troncos, copas, copas2 } };
}

// --- Cámara ------------------------------------------------------------------------------------------------

const vA = new THREE.Vector3();
const vB = new THREE.Vector3();

function Camara({ sala, conPanel, animar, reducido }: Pick<EdificioProps, "sala" | "conPanel" | "animar" | "reducido">) {
  const { camera, size, invalidate } = useThree();
  const apaisada = size.width / Math.max(1, size.height) > 1.15;
  const destino = useMemo(() => camaraEdificio(sala, conPanel, apaisada), [sala, conPanel, apaisada]);
  const desde = useRef({ pos: new THREE.Vector3(...destino.pos), mira: new THREE.Vector3(...destino.mira), fov: destino.fov });
  const actual = useRef({ pos: new THREE.Vector3(...destino.pos), mira: new THREE.Vector3(...destino.mira), fov: destino.fov });
  const avance = useRef(1);
  const primera = useRef(true);
  const inicio = useRef(0);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      aplicar(1);
      return;
    }
    desde.current = { pos: actual.current.pos.clone(), mira: actual.current.mira.clone(), fov: actual.current.fov };
    avance.current = reducido ? 1 : 0;
    inicio.current = performance.now();
    if (reducido) aplicar(1);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino, reducido]);

  function aplicar(e: number) {
    actual.current.pos.lerpVectors(desde.current.pos, vA.set(...destino.pos), e);
    actual.current.mira.lerpVectors(desde.current.mira, vB.set(...destino.mira), e);
    actual.current.fov = desde.current.fov + (destino.fov - desde.current.fov) * e;
    camera.position.copy(actual.current.pos);
    camera.lookAt(actual.current.mira);
    const pc = camera as THREE.PerspectiveCamera;
    if (Math.abs(pc.fov - actual.current.fov) > 0.01) {
      pc.fov = actual.current.fov;
      pc.updateProjectionMatrix();
    }
  }

  useFrame(() => {
    if (avance.current < 1) {
      // Con el reloj real: en equipos lentos el vuelo dura lo mismo, con menos cuadros.
      avance.current = Math.min(1, (performance.now() - inicio.current) / 1250);
      aplicar(suavizado(avance.current));
      if (avance.current < 1) invalidate();
    } else if (!animar) {
      aplicar(1);
    }
  });
  return null;
}

/** Con el bucle «a demanda» hay que pedir un cuadro cuando cambian los datos. */
function Invalida({ dep }: { dep: unknown[] }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dep);
  return null;
}

// --- Personaje ------------------------------------------------------------------------------------------------

const PIEL = ["#E2A35A", "#C98B5B", "#F0C39A", "#A5694A", "#D9A37E"];
const PELO = ["#2b2118", "#5a3a22", "#1c1c24", "#8a5a2a", "#3a2a3a", "#b9a47a"];

interface PersonajeProps {
  p: PuestoVisual;
  area: Area;
  indice: number;
  asiento: Asiento;
  ruta: Punto[] | null;
  animar: boolean;
  tRef: React.MutableRefObject<number>;
  etiqueta: boolean;
  seleccionado: boolean;
  alElegir?: () => void;
}

const SENTADO_Y = 0.54;
const DE_PIE_Y = 0.36;

const Personaje = memo(function Personaje({ p, area, indice, asiento, ruta, animar, tRef, etiqueta, seleccionado, alElegir }: PersonajeProps) {
  const grupo = useRef<THREE.Group>(null);
  const brazoI = useRef<THREE.Group>(null);
  const brazoD = useRef<THREE.Group>(null);
  const piernaI = useRef<THREE.Group>(null);
  const piernaD = useRef<THREE.Group>(null);
  const cabeza = useRef<THREE.Group>(null);
  const carpeta = useRef<THREE.Mesh>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const largo = useMemo(() => (ruta ? largoRuta(ruta) : 0), [ruta]);
  const desfase = useMemo(() => SALAS_ORDEN.indexOf(area) * 3.7 + indice * 1.3, [area, indice]);
  const trabajando = p.estado === "trabajando";
  const gris = p.estado === "libre" || p.estado === "en_cola";
  const piel = PIEL[(indice + SALAS_ORDEN.indexOf(area)) % PIEL.length];
  const pelo = PELO[(indice * 2 + SALAS_ORDEN.indexOf(area)) % PELO.length];
  const ropa = gris ? "#6A6C7C" : p.color;
  const ropaBrazo = gris ? "#5F6170" : p.color;

  useFrame(() => {
    const g = grupo.current;
    if (!g) return;
    const t = tRef.current;
    let izq: number;
    let der: number;
    let sentado = true;
    let caminando = false;
    let llevaCarpeta = false;
    let x = asiento.x;
    let z = asiento.z;
    let rumbo = Math.PI;
    let y = SENTADO_Y;

    if (ruta && animar) {
      const f = faseMensajero(t, largo, desfase);
      if (f.fase !== "sentado") {
        const pt = puntoEnRuta(ruta, f.d);
        x = pt.x;
        z = pt.z;
        sentado = false;
        caminando = f.fase === "yendo" || f.fase === "volviendo";
        llevaCarpeta = f.fase === "yendo" || (f.fase === "dejando" && f.u < 0.45);
        // al volver camina en sentido contrario al de la ruta; al dejar la carpeta mira la bandeja
        rumbo = f.fase === "dejando" ? Math.atan2(BANDEJA_CEREBRO[0] - x, BANDEJA_CEREBRO[1] - z) : f.fase === "volviendo" ? pt.rumbo + Math.PI : pt.rumbo;
        const levanta = Math.min(1, f.fase === "yendo" ? f.d / 0.7 : f.fase === "volviendo" ? (largo - f.d) / 0.7 : 1);
        y = SENTADO_Y + (DE_PIE_Y - SENTADO_Y) * suavizado(levanta);
        if (caminando) y += Math.abs(Math.sin(t * 9 + desfase)) * 0.05;
      }
    }
    g.position.set(x, y, z);
    g.rotation.y = rumbo;

    if (caminando) {
      const sw = Math.sin(t * 9 + desfase);
      izq = llevaCarpeta ? -1.15 : sw * 0.7;
      der = llevaCarpeta ? -1.15 : -sw * 0.7;
      if (piernaI.current) piernaI.current.rotation.x = -sw * 0.75;
      if (piernaD.current) piernaD.current.rotation.x = sw * 0.75;
    } else if (!sentado) {
      izq = der = llevaCarpeta ? -1.15 : -0.3;
      if (piernaI.current) piernaI.current.rotation.x = 0;
      if (piernaD.current) piernaD.current.rotation.x = 0;
    } else if (trabajando) {
      [izq, der] = animar ? brazosTecleo(t, indice) : [-1.05, -1.05];
    } else if (p.estado === "listo") {
      izq = -0.6;
      der = animar ? -2.2 + Math.sin(t * 2.2 + indice) * 0.25 : -2.2;
    } else {
      izq = der = -0.35 + (animar ? Math.sin(t * 1.3 + indice) * 0.03 : 0);
    }
    if (brazoI.current) brazoI.current.rotation.x = izq;
    if (brazoD.current) brazoD.current.rotation.x = der;
    if (piernaI.current) piernaI.current.visible = !sentado;
    if (piernaD.current) piernaD.current.visible = !sentado;
    if (carpeta.current) carpeta.current.visible = llevaCarpeta;
    if (cabeza.current) {
      cabeza.current.rotation.x = animar ? (trabajando ? 0.1 + Math.sin(t * 3.1 + indice) * 0.04 : 0.04 + Math.sin(t * 0.9 + indice) * 0.03) : trabajando ? 0.1 : 0.04;
      cabeza.current.rotation.z = animar && p.estado === "libre" && sentado ? Math.sin(t * 0.7 + indice * 2) * 0.05 : 0;
    }
    if (cuerpo.current && animar) cuerpo.current.scale.y = 1 + Math.sin(t * 1.6 + indice) * 0.012;
  });

  return (
    <group ref={grupo} scale={1.25} position={[asiento.x, SENTADO_Y, asiento.z]} rotation={[0, Math.PI, 0]}>
      <group ref={cuerpo}>
        <mesh position={[0, 0.34, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.26, 4, 12]} />
          <meshStandardMaterial color={ropa} roughness={0.85} />
        </mesh>
      </group>
      <group ref={brazoI} position={[0.27, 0.52, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.2, 4, 8]} />
          <meshStandardMaterial color={ropaBrazo} roughness={0.85} />
        </mesh>
      </group>
      <group ref={brazoD} position={[-0.27, 0.52, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.2, 4, 8]} />
          <meshStandardMaterial color={ropaBrazo} roughness={0.85} />
        </mesh>
      </group>
      <group ref={piernaI} position={[0.11, 0.14, 0]} visible={false}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.2, 4, 8]} />
          <meshStandardMaterial color="#2c2e3a" roughness={0.85} />
        </mesh>
      </group>
      <group ref={piernaD} position={[-0.11, 0.14, 0]} visible={false}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.2, 4, 8]} />
          <meshStandardMaterial color="#2c2e3a" roughness={0.85} />
        </mesh>
      </group>
      <group ref={cabeza} position={[0, 0.84, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.26, 18, 14]} />
          <meshStandardMaterial color={piel} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.03, -0.02]}>
          <sphereGeometry args={[0.275, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={pelo} roughness={0.9} />
        </mesh>
        <mesh position={[0.09, 0.0, 0.235]}>
          <sphereGeometry args={[0.032, 8, 6]} />
          <meshBasicMaterial color="#17131a" />
        </mesh>
        <mesh position={[-0.09, 0.0, 0.235]}>
          <sphereGeometry args={[0.032, 8, 6]} />
          <meshBasicMaterial color="#17131a" />
        </mesh>
      </group>
      <mesh ref={carpeta} position={[0, 0.5, 0.34]} rotation={[0.1, 0, 0]} visible={false} castShadow>
        <boxGeometry args={[0.34, 0.05, 0.44]} />
        <meshStandardMaterial color="#e8c46a" roughness={0.7} emissive="#a77a1c" emissiveIntensity={0.25} />
      </mesh>
      {seleccionado && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.5, 0.62, 32]} />
          <meshBasicMaterial color="#F2C531" toneMapped={false} />
        </mesh>
      )}
      {etiqueta && (
        <Html position={[0, 1.7 + (asiento.col % 2) * 0.5, 0]} center zIndexRange={[30, 0]} pointerEvents="none">
          <div className={`cz-ed-tag e-${p.estado}${seleccionado ? " sel" : ""}`} onClick={alElegir}>
            <i aria-hidden="true" style={{ background: p.color }} />
            <div>
              <b>{p.nombre}</b>
              <span>{p.estado === "trabajando" ? "Trabajando" : p.estado === "listo" ? "Listo para tu OK" : p.estado === "en_cola" ? "En cola" : "Libre"}</span>
            </div>
            {p.estado === "trabajando" && (
              <em aria-hidden="true">
                <u />
                <u />
                <u />
              </em>
            )}
          </div>
        </Html>
      )}
    </group>
  );
});

// --- Dinámicos: pantallas, hojas del Cerebro, orbe, rastro ------------------------------------------------

const COLOR_PANTALLA = { trabajando: "#8fd8ff", listo: "#79e2a9", en_cola: "#c9a94a", libre: "#262837" } as const;

const Pantallas = memo(function Pantallas({ pantallas, salas }: { pantallas: Pantalla[]; salas: Record<Area, SalaVisual> }) {
  const items = useMemo<Item[]>(
    () =>
      pantallas.map((pa) => {
        const est = salas[pa.area].puestos[pa.j]?.estado ?? "libre";
        return { p: pa.p, s: [0.62, 0.34, 1], c: COLOR_PANTALLA[est] };
      }),
    [pantallas, salas],
  );
  return <Instancias items={items} geo="plano" mat="basico" />;
});

const Hojas = memo(function Hojas({ n }: { n: number }) {
  const items = useMemo<Item[]>(() => {
    const salida: Item[] = [];
    const k = Math.min(10, n);
    for (let i = 0; i < k; i++) {
      salida.push({ p: [BANDEJA_CEREBRO[0] - 0.55 + (i % 3) * 0.04, 0.83 + i * 0.026, BANDEJA_CEREBRO[1] + Math.sin(i * 1.7) * 0.05], s: [0.5, 0.022, 0.36], c: i % 4 === 3 ? "#f6d98a" : "#f7f2e6", ry: Math.sin(i * 2.3) * 0.22 });
    }
    // las que llegan después de diez se suman como un segundo montón
    for (let i = 0; i < Math.max(0, Math.min(10, n - 10)); i++) {
      salida.push({ p: [BANDEJA_CEREBRO[0] + 0.55, 0.83 + i * 0.026, BANDEJA_CEREBRO[1] + 0.02], s: [0.5, 0.022, 0.36], c: "#f7f2e6", ry: Math.sin(i * 1.3) * 0.2 });
    }
    return salida;
  }, [n]);
  return <Instancias items={items} geo="caja" />;
});

function Orbe({ animar }: { animar: boolean }) {
  const anillo1 = useRef<THREE.Mesh>(null);
  const anillo2 = useRef<THREE.Mesh>(null);
  const esfera = useRef<THREE.Mesh>(null);
  const brillo = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,236,170,1)");
    r.addColorStop(0.35, "rgba(255,200,90,.45)");
    r.addColorStop(1, "rgba(255,200,90,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => brillo.dispose(), [brillo]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!animar) return;
    t.current += Math.min(dt, 0.05);
    if (anillo1.current) anillo1.current.rotation.z = t.current * 0.6;
    if (anillo2.current) anillo2.current.rotation.y = t.current * 0.8;
    if (esfera.current) {
      esfera.current.position.y = 1.95 + Math.sin(t.current * 1.4) * 0.08;
      const m = esfera.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 1.1 + Math.sin(t.current * 2) * 0.25;
    }
  });
  return (
    <group position={[0, 0, -0.3]}>
      <mesh ref={esfera} position={[0, 1.95, 0]} castShadow>
        <icosahedronGeometry args={[0.62, 2]} />
        <meshStandardMaterial color="#f6d98a" emissive="#ffb82e" emissiveIntensity={1.1} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh ref={anillo1} position={[0, 1.95, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.95, 0.025, 8, 56]} />
        <meshBasicMaterial color="#f6d98a" toneMapped={false} />
      </mesh>
      <mesh ref={anillo2} position={[0, 1.95, 0]} rotation={[0.3, 0, 0.9]}>
        <torusGeometry args={[1.2, 0.018, 8, 56]} />
        <meshBasicMaterial color="#ffc94d" toneMapped={false} />
      </mesh>
      <sprite position={[0, 1.95, 0]} scale={[4.4, 4.4, 1]}>
        <spriteMaterial map={brillo} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <pointLight position={[0, 2.6, 0]} color="#ffc65a" intensity={70} distance={16} decay={2} />
    </group>
  );
}

/** Rastro de luz por los pasillos de los sectores que tienen tareas en marcha: la luz corre hacia el Cerebro. */
function Rastro({ rutas, animar, tRef }: { rutas: Punto[][]; animar: boolean; tRef: React.MutableRefObject<number> }) {
  const malla = useRef<THREE.InstancedMesh>(null);
  const puntos = useMemo(() => {
    const salida: { x: number; z: number; k: number }[] = [];
    for (const r of rutas) {
      const pts = puntosDeRastro(r, 1.0);
      pts.forEach((p, i) => salida.push({ x: p[0], z: p[1], k: i / Math.max(1, pts.length) }));
    }
    return salida;
  }, [rutas]);
  const geo = useMemo(() => new THREE.CircleGeometry(0.11, 10), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useLayoutEffect(() => {
    const m = malla.current;
    if (!m) return;
    puntos.forEach((p, i) => {
      dummy.position.set(p.x, 0.07, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, color.set("#7a5a1c"));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [puntos]);
  useFrame(() => {
    const m = malla.current;
    if (!m || !animar) return;
    const t = tRef.current;
    puntos.forEach((p, i) => {
      const onda = (Math.sin((t * 1.6 - p.k * 9) * 2.0) + 1) / 2;
      const v = 0.3 + onda * 0.7;
      m.setColorAt(i, color.setRGB(1.0 * v, 0.74 * v, 0.25 * v));
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  if (!puntos.length) return null;
  return (
    <instancedMesh key={puntos.length} ref={malla} args={[geo, undefined, puntos.length]} frustumCulled={false}>
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

// --- Resalte de sala y cartel -------------------------------------------------------------------------------------

function Marco({ area, nivel }: { area: Area; nivel: 0 | 1 | 2 }) {
  const s = SALAS[area];
  if (!nivel) return null;
  const c = nivel === 2 ? "#ffd27a" : "#d9a93c";
  const g = nivel === 2 ? 0.14 : 0.08;
  const caja = (p: V3, sc: V3, k: string) => (
    <mesh key={k} position={p}>
      <boxGeometry args={sc} />
      <meshBasicMaterial color={c} toneMapped={false} transparent opacity={nivel === 2 ? 0.95 : 0.7} />
    </mesh>
  );
  return (
    <group>
      {caja([s.cx, 0.11, s.z0], [s.x1 - s.x0 + g, 0.04, g], "n")}
      {caja([s.cx, 0.11, s.z1], [s.x1 - s.x0 + g, 0.04, g], "s")}
      {caja([s.x0, 0.11, s.cz], [g, 0.04, s.z1 - s.z0], "o")}
      {caja([s.x1, 0.11, s.cz], [g, 0.04, s.z1 - s.z0], "e")}
    </group>
  );
}

function CartelSala({ sala, v, hojas }: { sala: Area; v: SalaVisual; hojas: number }) {
  const s = SALAS[sala];
  const trabajan = v.puestos.filter((p) => p.estado === "trabajando").length;
  return (
    <Html position={[s.cx, sala === "direccion" ? 3.6 : 2.2, s.cz + (sala === "direccion" ? 1.5 : 0.4)]} center zIndexRange={[20, 0]} pointerEvents="none">
      <div className={`cz-ed-sala${trabajan ? " viva" : ""}${sala === "direccion" ? " cerebro" : ""}`}>
        <b>{v.titulo}</b>
        <span>
          {sala === "direccion" ? (hojas > 0 ? `${hojas} para tu OK` : "Todo al día") : trabajan ? `${trabajan} trabajando` : v.estado.enCola ? `${v.estado.enCola} en cola` : "Libre"}
        </span>
      </div>
    </Html>
  );
}

// --- Edificio -------------------------------------------------------------------------------------------------------------------

function Edificio(props: EdificioProps) {
  const { salas, hojas, sala, resaltada, puestoSel, animar, alElegirSala, alElegirPuesto } = props;
  const { capa, pantallas, arboles } = useMemo(() => construir(), []);
  const tRef = useRef(0);
  const [hover, setHover] = useHover();
  useFrame((_, dt) => {
    if (animar) tRef.current += Math.min(dt, 0.05);
  });

  const asientos = useMemo(() => {
    const m = {} as Record<Area, Asiento[]>;
    for (const a of SALAS_ORDEN) m[a] = asientosDeSala(a, Math.min(salas[a].puestos.length, 7));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rutas = useMemo(() => {
    const m = {} as Record<Area, Record<number, Punto[]>>;
    for (const a of SALAS_ORDEN) {
      m[a] = {};
      salas[a].mensajeros.forEach((j) => {
        const as = asientos[a][j];
        if (as) m[a][j] = rutaAlCerebro(a, as);
      });
    }
    return m;
  }, [salas, asientos]);
  const rutasActivas = useMemo(() => {
    const l: Punto[][] = [];
    for (const a of SALAS_ORDEN) {
      const ids = salas[a].mensajeros;
      if (ids.length) {
        const r = rutas[a][ids[0]];
        if (r) l.push(r.slice(Math.max(0, r.findIndex((p) => p[0] === SALAS[a].puerta[0] && p[1] === SALAS[a].puerta[1]))));
      }
    }
    return l;
  }, [rutas, salas]);

  return (
    <>
      <hemisphereLight args={["#98a6dc", "#4a3a30", 1.0]} />
      <directionalLight
        position={[-14, 26, 16]}
        intensity={1.1}
        color="#c4cfff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={5}
        shadow-camera-far={70}
        shadow-bias={-0.0006}
        shadow-radius={5}
      />
      {/* una luz cálida por sala, sin sombras */}
      {SALAS_ORDEN.filter((a) => a !== "direccion").map((a) => (
        <pointLight key={a} position={[SALAS[a].cx, 3.4, SALAS[a].cz + 0.4]} color="#ffbe78" intensity={a === sala || !sala ? 60 : 26} distance={13} decay={2} />
      ))}
      <pointLight position={[0, 3.2, 9.5]} color="#ffb061" intensity={45} distance={12} decay={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]} receiveShadow>
        <planeGeometry args={[160, 130]} />
        <meshStandardMaterial color="#14201a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 22]} receiveShadow>
        <planeGeometry args={[4.4, 14]} />
        <meshStandardMaterial color="#3d3a40" roughness={0.95} />
      </mesh>

      <Instancias items={capa.cajas} geo="caja" />
      <Instancias items={capa.cil} geo="cil" />
      <Instancias items={capa.conos} geo="cono" />
      <Instancias items={capa.esf} geo="esf" />
      <Instancias items={capa.luz} geo="plano" mat="basico" />
      <Instancias items={arboles.troncos} geo="cil" recibe={false} />
      <Instancias items={arboles.copas} geo="cono" recibe={false} />
      <Instancias items={arboles.copas2} geo="cono" recibe={false} />
      <Pantallas pantallas={pantallas} salas={salas} />
      <Hojas n={hojas} />
      <Orbe animar={animar} />
      <Rastro rutas={rutasActivas} animar={animar} tRef={tRef} />

      {/* zonas clicables: una por sala */}
      {SALAS_ORDEN.map((a) => {
        const s = SALAS[a];
        return (
          <mesh
            key={a}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[s.cx, 0.12, s.cz]}
            onClick={(e) => {
              e.stopPropagation();
              alElegirSala(a);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHover(a);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHover(null);
              document.body.style.cursor = "";
            }}
          >
            <planeGeometry args={[s.x1 - s.x0, s.z1 - s.z0]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })}
      {SALAS_ORDEN.map((a) => (
        <Marco key={a} area={a} nivel={a === sala ? 2 : a === hover || a === resaltada ? 1 : 0} />
      ))}

      {SALAS_ORDEN.map((a) => {
        const v = salas[a];
        return (
          <group key={a}>
            {v.puestos.slice(0, Math.min(v.puestos.length, 7)).map((p, j) => {
              const as = asientos[a][j];
              if (!as) return null;
              return (
                <Personaje
                  key={j}
                  p={p}
                  area={a}
                  indice={j}
                  asiento={as}
                  ruta={rutas[a][j] ?? null}
                  animar={animar}
                  tRef={tRef}
                  etiqueta={sala === a}
                  seleccionado={puestoSel === `${a}:${j}`}
                  alElegir={() => alElegirPuesto?.(a, j)}
                />
              );
            })}
            {!sala && <CartelSala sala={a} v={v} hojas={hojas} />}
          </group>
        );
      })}
    </>
  );
}

function useHover(): [Area | null, (a: Area | null) => void] {
  const [h, setH] = useState<Area | null>(null);
  return [h, setH];
}

export default function EscenaEdificio(props: EdificioProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
      frameloop={!props.activa ? "never" : props.animar ? "always" : "demand"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 31, near: 0.5, far: 220, position: camaraEdificio(props.sala, props.conPanel, true).pos }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#0a0910");
        scene.fog = new THREE.Fog("#0a0910", 80, 160);
        props.alListo?.();
      }}
      onPointerMissed={() => props.alElegirSala(null)}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Camara sala={props.sala} conPanel={props.conPanel} animar={props.animar} reducido={props.reducido} />
        <Invalida dep={[props.salas, props.sala, props.resaltada, props.puestoSel, props.hojas, props.animar, props.activa]} />
        <Edificio {...props} />
      </Suspense>
    </Canvas>
  );
}
