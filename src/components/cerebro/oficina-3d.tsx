"use client";

/**
 * Escena 3D de la Oficina (22/11). Se carga con next/dynamic y ssr:false solo
 * desde la Oficina. Todo está armado con primitivas (cajas, cilindros,
 * cápsulas, esferas) y tres texturas chicas dibujadas en un canvas: no baja
 * ningún modelo. Sin sombras dinámicas: las sombras de contacto son manchas
 * suaves. La cámara solo vuela entre presets (sala, vista cenital y primer
 * plano de cada puesto); no hay órbita libre. Las tarjetas son HTML sobre la
 * escena, nunca texto dentro del canvas. Es un espejo de la lista accesible:
 * la escena entera es aria-hidden.
 */
import { Suspense, memo, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei/web/Html";
import * as THREE from "three";
import {
  COLOR_ESTADO,
  FILAS_Z,
  SEPARACION_X,
  brazosFestejo,
  brazosTecleo,
  camaraDe,
  derivaCamara,
  intensidadDestello,
  puestosConGlifo,
  type PuestoVisual,
  type Vista,
} from "@/lib/oficina/escena";
import type { Area } from "@/lib/oficina/reglas";

export interface Escena3DProps {
  puestos: PuestoVisual[];
  vista: Vista;
  conPanel: boolean;
  /** false: sin animaciones continuas (pausa o movimiento reducido). */
  animar: boolean;
  /** false: la escena deja de dibujar (fuera de pantalla o pestaña oculta). */
  activa: boolean;
  /** Movimiento reducido: la cámara corta en vez de volar. */
  reducido: boolean;
  alElegir: (area: Area) => void;
  alListo?: () => void;
}

// --- Texturas dibujadas en un canvas (chicas y deterministas) ------------------------------

function lienzo(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!];
}

function aTextura(c: HTMLCanvasElement, repetir?: [number, number]): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repetir) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repetir[0], repetir[1]);
  }
  return t;
}

/** Generador pseudoaleatorio con semilla: la ciudad sale igual siempre. */
function semilla(n: number) {
  let s = n >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function texturaPiso(): THREE.CanvasTexture {
  const [c, g] = lienzo(256, 256);
  const claros = ["#C9732E", "#BB681E", "#D07F36"];
  const oscuros = ["#8A3B24", "#83372A", "#93432B"];
  const rnd = semilla(7);
  const filas = 8;
  const alto = 256 / filas;
  for (let f = 0; f < filas; f++) {
    const desfase = (f % 2) * 64;
    for (let i = -1; i < 3; i++) {
      const x = i * 128 + desfase;
      const paleta = (f + i + 2) % 3 === 0 ? oscuros : claros;
      g.fillStyle = paleta[Math.floor(rnd() * paleta.length)];
      g.fillRect(x, f * alto, 128, alto);
      g.fillStyle = "rgba(0,0,0,.28)";
      g.fillRect(x, f * alto, 128, 2);
      g.fillRect(x, f * alto, 2, alto);
    }
  }
  return aTextura(c, [5, 3]);
}

function texturaVentanal(): THREE.CanvasTexture {
  const [c, g] = lienzo(1024, 256);
  const cielo = g.createLinearGradient(0, 0, 0, 256);
  cielo.addColorStop(0, "#14173d");
  cielo.addColorStop(1, "#3b2d63");
  g.fillStyle = cielo;
  g.fillRect(0, 0, 1024, 256);
  const rnd = semilla(11);
  for (let capa = 0; capa < 2; capa++) {
    let x = -10;
    while (x < 1024) {
      const w = 40 + rnd() * 60;
      const h = (capa ? 70 : 120) + rnd() * (capa ? 60 : 90);
      g.fillStyle = capa ? "#232557" : "#1b1c46";
      g.fillRect(x, 256 - h, w, h);
      for (let yy = 256 - h + 8; yy < 250; yy += 12) {
        for (let xx = x + 6; xx < x + w - 8; xx += 11) {
          const r = rnd();
          if (r < 0.34) {
            g.fillStyle = r < 0.03 ? "#ff6b6b" : "#F5D36B";
            g.fillRect(xx, yy, 5, 6);
          }
        }
      }
      x += w + 4 + rnd() * 10;
    }
  }
  return aTextura(c);
}

function texturaCartel(): THREE.CanvasTexture {
  const [c, g] = lienzo(512, 160);
  g.fillStyle = "#14141c";
  g.fillRect(0, 0, 512, 160);
  g.strokeStyle = "#F2C531";
  g.lineWidth = 8;
  g.strokeRect(8, 8, 496, 144);
  g.fillStyle = "#ffffff";
  g.font = "800 66px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillText("OFICINA", 256, 86);
  g.fillStyle = "#F2C531";
  g.font = "700 30px system-ui, sans-serif";
  g.fillText("8 AGENTES", 256, 128);
  return aTextura(c);
}

function texturaBrillo(): THREE.CanvasTexture {
  const [c, g] = lienzo(128, 128);
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.35, "rgba(255,233,176,.55)");
  r.addColorStop(1, "rgba(255,233,176,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return aTextura(c);
}

function texturaSombra(): THREE.CanvasTexture {
  const [c, g] = lienzo(128, 128);
  const r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  r.addColorStop(0, "rgba(20,10,30,.55)");
  r.addColorStop(0.6, "rgba(20,10,30,.22)");
  r.addColorStop(1, "rgba(20,10,30,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return aTextura(c);
}

interface Recursos {
  piso: THREE.Texture;
  ventanal: THREE.Texture;
  cartel: THREE.Texture;
  brillo: THREE.Texture;
  sombra: THREE.Texture;
}

function useRecursos(): Recursos {
  const r = useMemo<Recursos>(
    () => ({ piso: texturaPiso(), ventanal: texturaVentanal(), cartel: texturaCartel(), brillo: texturaBrillo(), sombra: texturaSombra() }),
    [],
  );
  useEffect(() => () => Object.values(r).forEach((t) => t.dispose()), [r]);
  return r;
}

// --- Cámara: vuela entre presets con suavizado, sin órbita libre ---------------------------

const vA = new THREE.Vector3();
const vB = new THREE.Vector3();

function suavizado(t: number): number {
  // Equivale a cubic-bezier(.65,0,.35,1): lento al salir, rápido al medio, lento al llegar.
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function Camara({ vista, conPanel, animar, reducido }: Pick<Escena3DProps, "vista" | "conPanel" | "animar" | "reducido">) {
  const { camera, size } = useThree();
  const apaisada = size.width / Math.max(1, size.height) > 1.15;
  const destino = useMemo(() => camaraDe(vista, conPanel, apaisada), [vista, conPanel, apaisada]);
  const desde = useRef({ pos: new THREE.Vector3(...destino.pos), mira: new THREE.Vector3(...destino.mira), fov: destino.fov });
  const actual = useRef({ pos: new THREE.Vector3(...destino.pos), mira: new THREE.Vector3(...destino.mira), fov: destino.fov });
  const avance = useRef(1);
  const duracion = useRef(0.8);
  const reloj = useRef(0);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    desde.current = { pos: actual.current.pos.clone(), mira: actual.current.mira.clone(), fov: actual.current.fov };
    avance.current = reducido ? 1 : 0;
    duracion.current = vista === "cenital" ? 0.65 : 0.85;
  }, [destino, vista, reducido]);

  useFrame((_, dt) => {
    const paso = Math.min(dt, 0.05);
    if (animar) reloj.current += paso;
    if (avance.current < 1) avance.current = Math.min(1, avance.current + paso / duracion.current);
    const e = suavizado(avance.current);
    actual.current.pos.lerpVectors(desde.current.pos, vA.set(...destino.pos), e);
    actual.current.mira.lerpVectors(desde.current.mira, vB.set(...destino.mira), e);
    actual.current.fov = desde.current.fov + (destino.fov - desde.current.fov) * e;
    camera.position.copy(actual.current.pos);
    // Deriva muy leve en reposo (±0,5°, ~10 s por ciclo), alrededor del punto que mira.
    if (animar && avance.current >= 1) {
      const a = derivaCamara(reloj.current);
      const dx = camera.position.x - actual.current.mira.x;
      const dz = camera.position.z - actual.current.mira.z;
      camera.position.x = actual.current.mira.x + dx * Math.cos(a) - dz * Math.sin(a);
      camera.position.z = actual.current.mira.z + dx * Math.sin(a) + dz * Math.cos(a);
    }
    camera.lookAt(actual.current.mira);
    const pc = camera as THREE.PerspectiveCamera;
    if (Math.abs(pc.fov - actual.current.fov) > 0.01) {
      pc.fov = actual.current.fov;
      pc.updateProjectionMatrix();
    }
  });
  return null;
}

// --- Piezas sueltas --------------------------------------------------------------------------

const MADERA = "#E9A94B";
const MADERA_FRENTE = "#C98A45";
const MARCO = "#E39A3B";

function Caja({ p, s, c, ...resto }: { p: [number, number, number]; s: [number, number, number]; c: string } & Record<string, unknown>) {
  return (
    <mesh position={p} {...resto}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.8} />
    </mesh>
  );
}

function Planta({ pos, escala = 1 }: { pos: [number, number, number]; escala?: number }) {
  const hojas = [0, 1, 2, 3, 4, 5];
  return (
    <group position={pos} scale={escala}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.1, 0.075, 0.14, 12]} />
        <meshStandardMaterial color="#C2693A" roughness={0.9} />
      </mesh>
      {hojas.map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.05) * 0.05, 0.22, Math.sin(i * 1.05) * 0.05]} rotation={[Math.sin(i * 1.05) * 0.5, 0, -Math.cos(i * 1.05) * 0.5]}>
          <coneGeometry args={[0.05, 0.26, 5]} />
          <meshStandardMaterial color={i % 2 ? "#4FA35A" : "#7CCB6B"} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function PlantaGrande({ pos }: { pos: [number, number, number] }) {
  const hojas = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <group position={pos}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.36, 0.28, 0.6, 14]} />
        <meshStandardMaterial color="#F1EEF2" roughness={0.7} />
      </mesh>
      {hojas.map((i) => (
        <mesh key={i} position={[Math.cos(i * 0.785) * 0.18, 1.05 + (i % 3) * 0.12, Math.sin(i * 0.785) * 0.18]} rotation={[Math.sin(i * 0.785) * 0.55, 0, -Math.cos(i * 0.785) * 0.55]}>
          <coneGeometry args={[0.13, 1.15, 6]} />
          <meshStandardMaterial color={i % 2 ? "#3F8F4F" : "#6FBF63"} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Lampara({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.03, 12]} />
        <meshStandardMaterial color="#25252d" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.04, 0.3, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
        <meshStandardMaterial color="#25252d" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0.13, 0.55, 0]} rotation={[0, 0, 2.4]}>
        <coneGeometry args={[0.1, 0.16, 12, 1, true]} />
        <meshStandardMaterial color="#FFD47A" emissive="#FFB347" emissiveIntensity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Domo({ pos, brillo }: { pos: [number, number, number]; brillo: THREE.Texture }) {
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#FFF1D2" emissive="#FFE0A0" emissiveIntensity={0.55} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 2.8, 4]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <sprite position={[0, -0.25, 0]} scale={[2.2, 2.2, 1]}>
        <spriteMaterial map={brillo} color="#FFE9B0" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

// --- Personaje chibi (todo primitivas) ---------------------------------------------------------

function Personaje({ p, animar, tRef, festejoDesde }: { p: PuestoVisual; animar: boolean; tRef: React.MutableRefObject<number>; festejoDesde: React.MutableRefObject<number | null> }) {
  const brazoI = useRef<THREE.Group>(null);
  const brazoD = useRef<THREE.Group>(null);
  const cabeza = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Mesh>(null);
  const destello = useRef<THREE.Sprite>(null);
  const confeti = useRef<(THREE.Mesh | null)[]>([]);
  const estado = p.estado;

  useFrame(() => {
    const t = tRef.current;
    let izq = -0.5;
    let der = -0.5;
    let abre = 0;
    if (estado === "trabajando") {
      [izq, der] = brazosTecleo(t, p.indice);
    } else if (estado === "libre" || estado === "en_cola") {
      izq = der = -0.35 + Math.sin(t * 1.3 + p.indice) * 0.03;
    }
    const f = festejoDesde.current == null ? 0 : brazosFestejo(t - festejoDesde.current);
    if (f > 0) {
      izq = izq + (3.0 - izq) * f;
      der = der + (3.0 - der) * f;
      abre = f * 0.4;
    }
    if (brazoI.current) {
      brazoI.current.rotation.x = izq;
      brazoI.current.rotation.z = abre;
    }
    if (brazoD.current) {
      brazoD.current.rotation.x = der;
      brazoD.current.rotation.z = -abre;
    }
    if (cabeza.current) {
      cabeza.current.rotation.x = estado === "trabajando" ? 0.12 + Math.sin(t * 3.1 + p.indice) * 0.04 : estado === "listo" ? Math.sin(t * 1.1) * 0.03 : 0.04 + Math.sin(t * 0.9 + p.indice) * 0.03;
      cabeza.current.rotation.z = estado === "libre" ? Math.sin(t * 0.7 + p.indice * 2) * 0.05 : 0;
    }
    if (torso.current) torso.current.scale.y = 1 + Math.sin(t * 1.6 + p.indice) * 0.012;

    const dt = festejoDesde.current == null ? -1 : t - festejoDesde.current;
    const inten = dt >= 0 ? intensidadDestello(dt) : 0;
    if (destello.current) {
      const m = destello.current.material as THREE.SpriteMaterial;
      m.opacity = inten * 0.95;
      const s = 0.8 + Math.max(0, dt) * 3.2;
      destello.current.scale.set(s, s, 1);
      destello.current.visible = inten > 0.001;
    }
    confeti.current.forEach((m, i) => {
      if (!m) return;
      m.visible = inten > 0.001;
      (m.material as THREE.MeshBasicMaterial).opacity = inten;
      const a = i * 0.785 + 0.3;
      const r = Math.max(0, dt) * (0.9 + (i % 3) * 0.35);
      m.position.set(Math.cos(a) * r, 1.05 + Math.max(0, dt) * (1.4 + (i % 2) * 0.5) - Math.max(0, dt) * Math.max(0, dt) * 1.4, Math.sin(a) * r * 0.6);
      m.rotation.set(dt * 4 + i, dt * 3, 0);
    });
  });

  const cuerpo = p.color;
  const gris = estado === "libre" || estado === "en_cola";
  return (
    <group>
      <mesh ref={torso} position={[0, 0.34, 0]}>
        <capsuleGeometry args={[0.2, 0.26, 4, 12]} />
        <meshStandardMaterial color={gris ? "#6A6C7C" : cuerpo} roughness={0.85} />
      </mesh>
      {/* Brazos: el pivote es el hombro */}
      <group ref={brazoI} position={[0.27, 0.52, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.065, 0.2, 4, 8]} />
          <meshStandardMaterial color={gris ? "#5F6170" : cuerpo} roughness={0.85} />
        </mesh>
      </group>
      <group ref={brazoD} position={[-0.27, 0.52, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.065, 0.2, 4, 8]} />
          <meshStandardMaterial color={gris ? "#5F6170" : cuerpo} roughness={0.85} />
        </mesh>
      </group>
      {/* Cabeza: esfera, gorra gris y visera que tapa la cara */}
      <group ref={cabeza} position={[0, 0.84, 0]}>
        <mesh>
          <sphereGeometry args={[0.26, 18, 14]} />
          <meshStandardMaterial color="#E2A35A" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.275, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
          <meshStandardMaterial color="#5E6070" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.0, 0.22]}>
          <boxGeometry args={[0.36, 0.11, 0.1]} />
          <meshStandardMaterial color="#2A2B36" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.17, 0.27]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.3, 0.025, 0.16]} />
          <meshStandardMaterial color="#5E6070" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.2, 0.0]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshBasicMaterial color={cuerpo} toneMapped={false} />
        </mesh>
      </group>
      {/* Festejo: destello y confeti, una vez */}
      <sprite ref={destello} position={[0, 1.05, 0.1]} visible={false}>
        <spriteMaterial color="#FFE9B0" transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0} />
      </sprite>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={i} ref={(m) => (confeti.current[i] = m)} visible={false}>
          <boxGeometry args={[0.05, 0.05, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

// --- Tarjeta flotante (HTML sobre la escena) --------------------------------------------------------

function Tarjeta({ p, foco, hover, lejos, glifo, paso, cen }: { p: PuestoVisual; foco: boolean; hover: boolean; lejos: boolean; glifo: string | null; paso: number; cen: boolean }) {
  return (
    <div className={`cz-of3-card ${p.estado} ${foco ? "foco" : ""} ${hover ? "hover" : ""} ${lejos ? "lejos" : ""} ${cen ? "cen" : ""}`} style={{ ["--tono" as string]: p.color }}>
      {glifo && (
        <span key={paso} className="glifo" aria-hidden="true">
          {glifo}
        </span>
      )}
      <div className="cab">
        <i className="punto" aria-hidden="true" />
        <b>{p.nombre}</b>
        <span className="chip">{p.estado === "listo" ? "Listo" : p.estado === "trabajando" ? `${Math.round(p.progreso * 100)} %` : p.estado === "en_cola" ? "En cola" : "Libre"}</span>
      </div>
      {(foco || hover) && <p className="que">{p.queHace}</p>}
      <div className="barra" aria-hidden="true">
        <span style={{ width: `${Math.round(p.progreso * 100)}%` }} />
      </div>
    </div>
  );
}

// --- Un puesto completo ---------------------------------------------------------------------------------

const Puesto = memo(function Puesto({
  p,
  foco,
  hover,
  lejos,
  vista,
  animar,
  tRef,
  recursos,
  glifo,
  paso,
  setHover,
  alElegir,
}: {
  p: PuestoVisual;
  foco: boolean;
  hover: boolean;
  lejos: boolean;
  vista: Vista;
  animar: boolean;
  tRef: React.MutableRefObject<number>;
  recursos: Recursos;
  glifo: string | null;
  paso: number;
  setHover: (a: Area | null) => void;
  alElegir: (a: Area) => void;
}) {
  const festejoDesde = useRef<number | null>(null);
  const anterior = useRef<number | null>(null);
  const aro = useRef<THREE.Mesh>(null);
  // Festeja una sola vez cuando el escritorio termina su parte (suma una parte hecha).
  // Al abrir la página no festeja: arranca con el valor que ya tiene.
  useEffect(() => {
    if (anterior.current !== null && p.partesHechas > anterior.current) festejoDesde.current = tRef.current;
    anterior.current = p.partesHechas;
  }, [p.partesHechas, tRef]);

  useFrame(() => {
    if (!aro.current) return;
    const m = aro.current.material as THREE.MeshBasicMaterial;
    const pulso = foco ? 0.65 + Math.sin(tRef.current * 3.1) * 0.25 : hover ? 0.6 : 0.22;
    m.opacity = pulso;
  });

  const led = COLOR_ESTADO[p.estado];
  return (
    <group
      position={[p.x, 0, p.z]}
      onClick={(e) => {
        e.stopPropagation();
        alElegir(p.area);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(p.area);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(null);
        document.body.style.cursor = "";
      }}
    >
      {/* sombras de contacto: manchas suaves */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[3.4, 3.0]} />
        <meshBasicMaterial map={recursos.sombra} transparent depthWrite={false} />
      </mesh>
      {/* aro de foco en el piso */}
      <mesh ref={aro} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, -0.3]}>
        <ringGeometry args={[1.55, 1.64, 48]} />
        <meshBasicMaterial color={p.color} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* escritorio */}
      <Caja p={[0, 0.78, 0]} s={[2.1, 0.08, 0.95]} c={MADERA} />
      <Caja p={[0, 0.5, 0.43]} s={[2.1, 0.46, 0.05]} c={MADERA_FRENTE} />
      {[-0.98, 0.98].flatMap((x) => [-0.4, 0.4].map((z) => <Caja key={`${x}${z}`} p={[x, 0.37, z]} s={[0.05, 0.74, 0.05]} c="#1c1c24" />))}
      {/* charco de luz de la lámpara */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.7, 0.825, 0.1]}>
        <circleGeometry args={[0.42, 20]} />
        <meshBasicMaterial color="#FFE2A0" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* monitor: se ve la espalda, con el punto de estado */}
      <Caja p={[0, 0.93, 0.08]} s={[0.07, 0.2, 0.07]} c="#25252d" />
      <Caja p={[0, 1.2, 0.08]} s={[0.72, 0.4, 0.04]} c="#17171f" />
      <mesh position={[0, 1.2, 0.105]}>
        <circleGeometry args={[0.06, 14]} />
        <meshBasicMaterial color={led} toneMapped={false} />
      </mesh>
      <Caja p={[0, 0.83, -0.22]} s={[0.5, 0.02, 0.17]} c="#2a2a33" />
      <Lampara pos={[0.78, 0.82, 0.1]} />
      <Planta pos={[-0.78, 0.82, 0.12]} />
      <mesh position={[0.4, 0.88, 0.2]}>
        <cylinderGeometry args={[0.04, 0.035, 0.09, 10]} />
        <meshStandardMaterial color="#F6F3EE" roughness={0.6} />
      </mesh>
      {/* silla */}
      <mesh position={[0, 0.5, -0.85]}>
        <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
        <meshStandardMaterial color="#4a4c58" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.25, -0.85]}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </mesh>
      <Caja p={[0, 0.9, -1.15]} s={[0.55, 0.6, 0.07]} c="#6A6C7A" />
      {/* personaje: sentado, mirando al frente */}
      <group position={[0, 0.54, -0.85]} scale={1.25}>
        <Personaje p={p} animar={animar} tRef={tRef} festejoDesde={festejoDesde} />
      </group>
      {/* mamparas de vidrio esmerilado con marco de madera */}
      {[-1.12, 1.12].map((x) => (
        <group key={x} position={[x, 0, -0.3]}>
          <mesh position={[0, 0.98, 0]}>
            <boxGeometry args={[0.04, 1.15, 1.9]} />
            <meshStandardMaterial color="#E8EEFF" transparent opacity={0.28} roughness={0.35} depthWrite={false} />
          </mesh>
          <Caja p={[0, 1.57, 0]} s={[0.07, 0.05, 1.9]} c={MARCO} />
          <Caja p={[0, 0.4, 0.94]} s={[0.07, 1.2, 0.05]} c={MARCO} />
          <Caja p={[0, 0.4, -0.94]} s={[0.07, 1.2, 0.05]} c={MARCO} />
        </group>
      ))}
      <mesh position={[0, 0.98, -1.28]}>
        <boxGeometry args={[2.2, 1.0, 0.04]} />
        <meshStandardMaterial color="#E8EEFF" transparent opacity={0.22} roughness={0.35} depthWrite={false} />
      </mesh>
      <Caja p={[0, 1.5, -1.28]} s={[2.25, 0.05, 0.07]} c={MARCO} />
      {/* tarjeta flotante */}
      <Html position={vista === "cenital" ? [0, 0.8, -2.0] : [0, 2.85, -0.7]} center zIndexRange={[30, 0]} pointerEvents="none">
        <div
          role="presentation"
          onClick={() => alElegir(p.area)}
          onPointerEnter={() => setHover(p.area)}
          onPointerLeave={() => setHover(null)}
          style={{ pointerEvents: "auto" }}
        >
          <Tarjeta p={p} foco={foco} hover={hover} lejos={lejos} glifo={glifo} paso={paso} cen={vista === "cenital"} />
        </div>
      </Html>
    </group>
  );
});

// --- Sala ------------------------------------------------------------------------------------------------------

function Sala({ puestos, vista, animar, alElegir, recursos }: Pick<Escena3DProps, "puestos" | "vista" | "animar" | "alElegir"> & { recursos: Recursos }) {
  const [hover, setHover] = useState<Area | null>(null);
  const tRef = useRef(0);
  const [paso, setPaso] = useState(0);
  useFrame((_, dt) => {
    if (animar) tRef.current += Math.min(dt, 0.05);
  });
  // Un tic cada 2,4 s reparte los glifos: máximo dos a la vez en toda la sala.
  useEffect(() => {
    if (!animar) return;
    const id = setInterval(() => setPaso((n) => n + 1), 2400);
    return () => clearInterval(id);
  }, [animar]);
  const conGlifo = animar ? puestosConGlifo(puestos, paso * 2.4) : [];
  const seleccionado = vista !== "sala" && vista !== "cenital" ? vista : null;

  return (
    <>
      {/* piso, alfombra y pared del fondo con el ventanal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[34, 22]} />
        <meshStandardMaterial map={recursos.piso} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.02, -0.1]}>
        <boxGeometry args={[15.6, 0.04, 9.4]} />
        <meshStandardMaterial color="#8E8FD6" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.045, -0.1]}>
        <boxGeometry args={[15.0, 0.02, 8.8]} />
        <meshStandardMaterial color="#9A9BE0" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.5, -5.3]}>
        <planeGeometry args={[34, 7]} />
        <meshStandardMaterial color="#EEE8EC" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.0, -5.27]}>
        <planeGeometry args={[17, 4]} />
        <meshBasicMaterial map={recursos.ventanal} toneMapped={false} />
      </mesh>
      {[-8.5, -4.25, 0, 4.25, 8.5].map((x) => (
        <Caja key={x} p={[x, 3.0, -5.22]} s={[0.14, 4.1, 0.1]} c="#5A3A2A" />
      ))}
      <Caja p={[0, 5.03, -5.22]} s={[17.2, 0.14, 0.1]} c="#5A3A2A" />
      <Caja p={[0, 0.95, -5.1]} s={[17.2, 0.1, 0.4]} c="#5A3A2A" />
      <Caja p={[0, 0.18, -5.24]} s={[34, 0.36, 0.1]} c="#4B3426" />
      <mesh position={[0, 5.95, -5.2]}>
        <planeGeometry args={[4, 1.25]} />
        <meshBasicMaterial map={recursos.cartel} toneMapped={false} />
      </mesh>
      <PlantaGrande pos={[-8.3, 0, -4.4]} />
      <PlantaGrande pos={[8.3, 0, -4.4]} />
      <PlantaGrande pos={[-8.3, 0, 4.2]} />
      <PlantaGrande pos={[8.3, 0, 4.2]} />
      {[-SEPARACION_X, 0, SEPARACION_X].map((x) => (
        <Domo key={x} pos={[x, 4.0, (FILAS_Z[0] + FILAS_Z[1]) / 2]} brillo={recursos.brillo} />
      ))}
      {puestos.map((p) => {
        const g = conGlifo.includes(p.area) ? p.glifos[(paso + p.indice) % 3] : null;
        return (
          <Puesto
            key={p.area}
            p={p}
            foco={seleccionado === p.area}
            hover={hover === p.area}
            lejos={seleccionado != null && seleccionado !== p.area}
            vista={vista}
            animar={animar}
            tRef={tRef}
            recursos={recursos}
            glifo={g}
            paso={g ? paso : 0}
            setHover={setHover}
            alElegir={alElegir}
          />
        );
      })}
    </>
  );
}

export default function Escena3D(props: Escena3DProps) {
  const recursos = useRecursos();
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={props.activa ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 40, near: 0.5, far: 80, position: camaraDe("sala").pos }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor("#0d0d12");
        scene.background = new THREE.Color("#0d0d12");
        props.alListo?.();
      }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <hemisphereLight args={["#fff1dc", "#6b5a7a", 1.05]} />
      <directionalLight position={[-7, 11, 7]} intensity={1.5} color="#fff2da" />
      <ambientLight intensity={0.25} />
      <Suspense fallback={null}>
        <Camara vista={props.vista} conPanel={props.conPanel} animar={props.animar} reducido={props.reducido} />
        <Sala puestos={props.puestos} vista={props.vista} animar={props.animar} alElegir={props.alElegir} recursos={recursos} />
      </Suspense>
    </Canvas>
  );
}
