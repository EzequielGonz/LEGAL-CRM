"use client";

/**
 * Oficina 3D como el reel (22/11, vuelta 6). Escena de noche, vista aérea de corte que se orbita,
 * y recorrido a altura de persona al entrar a una sala (WASD + arrastrar; en celular, arrastrar y
 * tocar el piso). Personajes de Quaternius (CC0) con animaciones de quieto, caminar, llevar y
 * sentarse; los que trabajan teclean y llevan la carpeta al Cerebro; algunos libres van por un café.
 * Tocar a un agente abre su chat (lo maneja el componente de arriba). La lista accesible de salas y
 * agentes vive afuera, en HTML: este canvas es decorativo (aria-hidden).
 */
import { Component, Suspense, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, PerformanceMonitor, useGLTF, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { clone as clonarConEsqueleto } from "three/examples/jsm/utils/SkeletonUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Mundo } from "@/components/cerebro/oficina-reel-mundo";
import { BANDEJA_CEREBRO, SALAS, SALAS_ORDEN, asientosDeSala, faseMensajero, largoRuta, puntoEnRuta, rutaAlCerebro, suavizado, type Punto } from "@/lib/oficina/edificio";
import {
  ALTURA_OJOS,
  adelante,
  cajasDeParedes,
  entradaA,
  estadoDeCartel,
  lugarEn,
  moverConChoques,
  paseanteDeSala,
  rutaAlCafe,
  type Actividad,
  type Lugar,
} from "@/lib/oficina/recorrido";
import { COLOR_AREA, COLOR_ESTADO, type PuestoVisual } from "@/lib/oficina/escena";
import type { Area } from "@/lib/oficina/reglas";
import type { SalaVisual } from "@/lib/oficina/panel";

export type Vista3D = { tipo: "aerea" } | { tipo: "dentro"; lugar: Lugar; n: number };
export type Calidad = "alta" | "media" | "baja";

export interface Escena3DProps {
  salas: Record<Area, SalaVisual>;
  hojas: number;
  vista: Vista3D;
  conPanel: boolean;
  animar: boolean;
  activa: boolean;
  reducido: boolean;
  calidad: Calidad;
  resaltada: Area | null;
  agenteSel: string | null;
  alEntrar: (l: Lugar) => void;
  alCambiarLugar: (l: Lugar | null) => void;
  alElegirAgente: (clave: string) => void;
  alListo: () => void;
  alFallar: () => void;
}

const MODELOS = ["casual_male", "casual_female", "suit_male", "suit_female", "worker_female", "casual2_male"] as const;
const RUTA = (m: string) => `/modelos/oficina/${m}.glb`;
const RUTA_ANIM = "/modelos/oficina/animaciones.glb";
/** Los personajes de Quaternius miden 3,3 unidades: a 1,72 m. */
const ESCALA_PJ = 0.52;
const cajas = cajasDeParedes();

// --- Cámara ---------------------------------------------------------------------------------

interface Pose {
  pos: THREE.Vector3;
  mira: THREE.Vector3;
}

function poseAerea(conPanel: boolean, apaisada: boolean): Pose {
  const corr = conPanel && apaisada ? -5.5 : 0;
  return apaisada ? { pos: new THREE.Vector3(17 + corr, 46, 49), mira: new THREE.Vector3(corr + 1, 0, 2) } : { pos: new THREE.Vector3(50, 68, 8), mira: new THREE.Vector3(0, 0, 0.5) };
}

const FOV_AEREA = 42;
/** Adentro, lente más abierta: se ve la sala como en el reel. */
const FOV_DENTRO = 66;
// Una cámara auxiliar: su lookAt apunta el -z (el de un Object3D común apunta el +z).
const tmpObj = new THREE.PerspectiveCamera();
const qDesde = new THREE.Quaternion();
const qHasta = new THREE.Quaternion();

interface Recorrido {
  x: number;
  z: number;
  yaw: number;
  pitch: number;
  destino: [number, number] | null;
  teclas: Set<string>;
}

function Director({ vista, conPanel, reducido, alCambiarLugar, caminata }: { vista: Vista3D; conPanel: boolean; reducido: boolean; alCambiarLugar: (l: Lugar | null) => void; caminata: React.MutableRefObject<Recorrido> }) {
  const { camera, size, gl } = useThree();
  const controles = useRef<OrbitControlsImpl>(null);
  const vuelo = useRef<{ desde: THREE.Vector3; hasta: THREE.Vector3; qd: THREE.Quaternion; qh: THREE.Quaternion; fd: number; fh: number; t: number; dur: number; fin: () => void } | null>(null);
  const modo = useRef<"aerea" | "dentro">("aerea");
  const guardada = useRef<Pose | null>(null);
  const lugarActual = useRef<Lugar | null>(null);
  const primera = useRef(true);
  const apaisada = size.width >= size.height;

  const volar = useCallback(
    (pos: THREE.Vector3, mira: THREE.Vector3, dur: number, fin: () => void, fov = FOV_AEREA) => {
      tmpObj.position.copy(pos);
      tmpObj.lookAt(mira);
      const cam = camera as THREE.PerspectiveCamera;
      if (reducido || dur <= 0) {
        camera.position.copy(pos);
        camera.quaternion.copy(tmpObj.quaternion);
        cam.fov = fov;
        cam.updateProjectionMatrix();
        fin();
        return;
      }
      vuelo.current = { desde: camera.position.clone(), hasta: pos.clone(), qd: camera.quaternion.clone(), qh: tmpObj.quaternion.clone(), fd: cam.fov, fh: fov, t: 0, dur, fin };
    },
    [camera, reducido],
  );

  // Cambios de vista: entrar a un lugar o volver a la vista aérea.
  useEffect(() => {
    const c = controles.current;
    if (vista.tipo === "dentro") {
      if (modo.current === "aerea" && c) guardada.current = { pos: camera.position.clone(), mira: c.target.clone() };
      modo.current = "dentro";
      if (c) c.enabled = false;
      const v = entradaA(vista.lugar);
      const r = caminata.current;
      r.x = v.x;
      r.z = v.z;
      r.yaw = v.yaw;
      r.pitch = v.pitch;
      r.destino = null;
      lugarActual.current = vista.lugar;
      const [fx, fz] = adelante(v.yaw);
      const pos = new THREE.Vector3(v.x, ALTURA_OJOS, v.z);
      const mira = new THREE.Vector3(v.x + fx, ALTURA_OJOS + Math.tan(v.pitch), v.z + fz);
      volar(pos, mira, primera.current ? 0 : 1.6, () => undefined, FOV_DENTRO);
    } else {
      const p = guardada.current ?? poseAerea(conPanel, apaisada);
      const destino = primera.current && !reducido ? p : p;
      if (primera.current && !reducido) {
        camera.position.set(destino.pos.x + 30, destino.pos.y + 34, destino.pos.z + 40);
        camera.lookAt(destino.mira);
      }
      volar(destino.pos, destino.mira, primera.current ? 2.6 : 1.5, () => {
        modo.current = "aerea";
        if (c) {
          c.target.copy(destino.mira);
          c.enabled = true;
          c.update();
        }
      });
      guardada.current = null;
    }
    primera.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  // Con el panel abierto o cerrado, la vista aérea se corre para que el edificio quede a la vista.
  useEffect(() => {
    if (modo.current !== "aerea" || vuelo.current) return;
    const p = poseAerea(conPanel, apaisada);
    volar(p.pos, p.mira, 0.9, () => {
      const c = controles.current;
      if (c) {
        c.target.copy(p.mira);
        c.update();
      }
    });
  }, [conPanel, apaisada, volar]);

  // Mirar arrastrando y caminar con el teclado (solo dentro).
  useEffect(() => {
    const el = gl.domElement;
    let previo: { x: number; y: number } | null = null;
    const abajo = (e: PointerEvent) => {
      if (modo.current !== "dentro") return;
      previo = { x: e.clientX, y: e.clientY };
    };
    const mover = (e: PointerEvent) => {
      if (modo.current !== "dentro" || !previo) return;
      const r = caminata.current;
      const k = e.pointerType === "touch" ? 0.006 : 0.0045;
      r.yaw += (e.clientX - previo.x) * k;
      r.pitch = Math.max(-1.1, Math.min(0.9, r.pitch + (e.clientY - previo.y) * k));
      previo = { x: e.clientX, y: e.clientY };
    };
    const arriba = () => {
      previo = null;
    };
    const esCampo = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable=true]");
    const tecla = (e: KeyboardEvent, on: boolean) => {
      if (modo.current !== "dentro" || esCampo(e.target)) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "q", "e"].includes(k)) {
        if (on) caminata.current.teclas.add(k);
        else caminata.current.teclas.delete(k);
        if (k.startsWith("arrow") && on) e.preventDefault();
      }
    };
    const kd = (e: KeyboardEvent) => tecla(e, true);
    const ku = (e: KeyboardEvent) => tecla(e, false);
    const blur = () => caminata.current.teclas.clear();
    el.addEventListener("pointerdown", abajo);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", arriba);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerdown", abajo);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", arriba);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
    };
  }, [gl, caminata]);

  useFrame((_, dtCrudo) => {
    const dt = Math.min(dtCrudo, 0.05);
    const v = vuelo.current;
    if (v) {
      // El vuelo usa el tiempo real: en equipos lentos no se estira.
      v.t += Math.min(dtCrudo, 0.25) / v.dur;
      const u = suavizado(Math.min(1, v.t));
      camera.position.lerpVectors(v.desde, v.hasta, u);
      qDesde.copy(v.qd);
      qHasta.copy(v.qh);
      camera.quaternion.slerpQuaternions(qDesde, qHasta, u);
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = v.fd + (v.fh - v.fd) * u;
      cam.updateProjectionMatrix();
      if (v.t >= 1) {
        vuelo.current = null;
        v.fin();
      }
      return;
    }
    if (modo.current !== "dentro") return;
    const r = caminata.current;
    const t = r.teclas;
    if (t.has("arrowleft") || t.has("q")) r.yaw += dt * 1.8;
    if (t.has("arrowright") || t.has("e")) r.yaw -= dt * 1.8;
    const vel = (t.has("shift") ? 4.2 : 2.3) * dt;
    const [fx, fz] = adelante(r.yaw);
    let dx = 0;
    let dz = 0;
    const av = (t.has("w") || t.has("arrowup") ? 1 : 0) - (t.has("s") || t.has("arrowdown") ? 1 : 0);
    const la = (t.has("d") ? 1 : 0) - (t.has("a") ? 1 : 0);
    if (av || la) {
      r.destino = null;
      const n = Math.hypot(av, la);
      dx = ((fx * av - fz * la) / n) * vel;
      dz = ((fz * av + fx * la) / n) * vel;
    } else if (r.destino) {
      const ddx = r.destino[0] - r.x;
      const ddz = r.destino[1] - r.z;
      const d = Math.hypot(ddx, ddz);
      if (d < 0.12) r.destino = null;
      else {
        dx = (ddx / d) * Math.min(vel, d);
        dz = (ddz / d) * Math.min(vel, d);
      }
    }
    if (dx || dz) {
      const [nx, nz] = moverConChoques(r.x, r.z, dx, dz, cajas);
      if (r.destino && nx === r.x && nz === r.z) r.destino = null;
      r.x = nx;
      r.z = nz;
      const l = lugarEn(r.x, r.z);
      if (l !== lugarActual.current) {
        lugarActual.current = l;
        alCambiarLugar(l);
      }
    }
    const paso = dx || dz ? Math.sin(performance.now() / 160) * 0.025 : 0;
    camera.position.set(r.x, ALTURA_OJOS + paso, r.z);
    camera.rotation.set(r.pitch, r.yaw, 0, "YXZ");
  });

  return (
    <OrbitControls
      ref={controles}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={12}
      maxDistance={78}
      minPolarAngle={0.2}
      maxPolarAngle={1.18}
      screenSpacePanning={false}
      enabled={false}
    />
  );
}

// --- Personajes ------------------------------------------------------------------------------

interface Plan {
  clave: string;
  area: Area;
  j: number;
  p: PuestoVisual;
  modelo: (typeof MODELOS)[number];
  asiento: { x: number; z: number };
  rol: "quieto" | "mensajero" | "paseante";
  ruta: Punto[];
  largo: number;
  desfase: number;
  espera: number;
}

function planes(salas: Record<Area, SalaVisual>): Plan[] {
  const salida: Plan[] = [];
  SALAS_ORDEN.forEach((area, ia) => {
    const v = salas[area];
    const asientos = asientosDeSala(area, v.puestos.length);
    const paseante = paseanteDeSala(area, v.puestos.map((p) => p.estado));
    v.puestos.forEach((p, j) => {
      const a = asientos[j];
      const mensajero = v.mensajeros.includes(j);
      const rol = mensajero ? "mensajero" : paseante === j ? "paseante" : "quieto";
      const ruta = rol === "mensajero" ? rutaAlCerebro(area, a) : rol === "paseante" ? rutaAlCafe(area, a, ia) : [[a.x, a.z] as Punto];
      salida.push({
        clave: `${area}:${j}`,
        area,
        j,
        p,
        modelo: MODELOS[(ia * 5 + j * 3) % MODELOS.length],
        asiento: { x: a.x, z: a.z },
        rol,
        ruta,
        largo: largoRuta(ruta),
        desfase: ia * 3.1 + j * 1.7,
        espera: rol === "paseante" ? 16 + ia * 2 : 6 + (j % 3) * 2,
      });
    });
  });
  return salida;
}

const vTmp = new THREE.Vector3();

const Personaje = memo(function Personaje({
  plan,
  escena,
  clips,
  animar,
  tRef,
  aerea,
  sel,
  sombra,
  alElegir,
}: {
  plan: Plan;
  escena: THREE.Object3D;
  clips: THREE.AnimationClip[];
  animar: boolean;
  tRef: React.MutableRefObject<number>;
  aerea: boolean;
  sel: boolean;
  sombra: boolean;
  alElegir: (clave: string) => void;
}) {
  const grupo = useRef<THREE.Group>(null);
  const cartel = useRef<HTMLDivElement>(null);
  const texto = useRef<HTMLSpanElement>(null);
  const carpeta = useRef<THREE.Mesh>(null);
  const aro = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const { camera } = useThree();

  const { modelo, mixer, acciones, huesos } = useMemo(() => {
    const m = clonarConEsqueleto(escena) as THREE.Object3D;
    const color = COLOR_AREA[plan.area];
    m.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = sombra;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((mt) => {
        const c = (mt as THREE.MeshStandardMaterial).clone();
        if (/shirt|vest/i.test(c.name)) c.color = new THREE.Color(color).multiplyScalar(0.85);
        c.roughness = 0.75;
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? mats : mats[0];
    });
    const mixer = new THREE.AnimationMixer(m);
    const accion = (n: string) => {
      const c = clips.find((x) => x.name === n);
      return c ? mixer.clipAction(c) : null;
    };
    const sentarse = accion("SitDown");
    if (sentarse) {
      sentarse.setLoop(THREE.LoopOnce, 1);
      sentarse.clampWhenFinished = true;
    }
    const huesos: Record<string, THREE.Object3D | undefined> = {};
    for (const n of ["UpperArm.L", "UpperArm.R", "LowerArm.L", "LowerArm.R", "Head", "Torso"]) huesos[n] = m.getObjectByName(n);
    return { modelo: m, mixer, acciones: { quieto: accion("Idle"), caminar: accion("Walk"), llevar: accion("Walk_Carry"), sentado: sentarse }, huesos };
  }, [escena, clips, plan.area, sombra]);

  const actual = useRef<THREE.AnimationAction | null>(null);
  const actividad = useRef<Actividad | "dejando">("sentado");
  const usar = useCallback(
    (a: THREE.AnimationAction | null, fundido = 0.3) => {
      if (!a || actual.current === a) return;
      a.reset();
      if (a === acciones.sentado) a.time = a.getClip().duration - 0.001;
      a.play();
      if (actual.current) actual.current.crossFadeTo(a, fundido, false);
      actual.current = a;
    },
    [acciones],
  );

  useEffect(() => {
    usar(acciones.sentado, 0);
    mixer.update(0.01);
    return () => {
      mixer.stopAllAction();
    };
  }, [acciones, mixer, usar]);

  useFrame((_, dt) => {
    const g = grupo.current;
    if (!g) return;
    const t = tRef.current;
    const pl = plan;
    let act: Actividad | "dejando" = "sentado";
    let x = pl.asiento.x;
    let z = pl.asiento.z;
    let rumbo = Math.PI;
    if (animar && pl.rol !== "quieto") {
      const f = faseMensajero(t, pl.largo, pl.desfase, pl.espera);
      if (f.fase !== "sentado") {
        const pr = puntoEnRuta(pl.ruta, f.d);
        x = pr.x;
        z = pr.z;
        rumbo = f.fase === "volviendo" ? pr.rumbo + Math.PI : pr.rumbo;
        if (f.fase === "dejando") {
          if (pl.rol === "mensajero") rumbo = Math.atan2(BANDEJA_CEREBRO[0] - x, BANDEJA_CEREBRO[1] - z);
          act = pl.rol === "paseante" ? "cafe" : "dejando";
        } else act = f.fase === "yendo" ? (pl.rol === "mensajero" ? "llevando" : "cafe") : "volviendo";
      }
    }
    if (act !== actividad.current) {
      actividad.current = act;
      if (act === "sentado") usar(acciones.sentado, 0.25);
      else if (act === "llevando") usar(acciones.llevar ?? acciones.caminar);
      else if (act === "dejando") usar(acciones.quieto);
      else if (act === "cafe") usar(actividadCafeQuieto(pl, t) ? acciones.quieto : acciones.caminar);
      else usar(acciones.caminar);
      if (texto.current) texto.current.textContent = estadoDeCartel(pl.p.estado, act === "dejando" ? "llevando" : act);
      if (carpeta.current) carpeta.current.visible = act === "llevando";
    } else if (act === "cafe") {
      usar(actividadCafeQuieto(pl, t) ? acciones.quieto : acciones.caminar);
    }
    // Sentado: la animación lleva la cadera 0,38 m hacia atrás; el cuerpo se adelanta para caer en la silla.
    if (act === "sentado") g.position.set(pl.asiento.x, -0.05, pl.asiento.z - 0.4);
    else g.position.set(x, 0, z);
    // Giro suave hacia el rumbo.
    let d = rumbo - g.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    g.rotation.y += act === "sentado" ? d : d * Math.min(1, dt * 10);
    // Siempre se reevalúa la pose (con 0 s si está quieto) para que los ajustes de abajo no se acumulen.
    mixer.update(animar ? Math.min(dt, 0.05) : 0);
    // Tecleo: los que trabajan mueven los antebrazos sobre el teclado.
    if (act === "sentado") {
      const tr = pl.p.estado === "trabajando";
      const k = tr && animar ? Math.sin(t * 14 + pl.j) * 0.09 : 0;
      const k2 = tr && animar ? Math.sin(t * 13 + pl.j + 1.7) * 0.09 : 0;
      if (huesos["UpperArm.L"]) huesos["UpperArm.L"].rotation.x += -0.55;
      if (huesos["UpperArm.R"]) huesos["UpperArm.R"].rotation.x += -0.55;
      if (huesos["LowerArm.L"]) huesos["LowerArm.L"].rotation.x += -0.5 + k;
      if (huesos["LowerArm.R"]) huesos["LowerArm.R"].rotation.x += -0.5 + k2;
      if (huesos.Head && tr && animar) huesos.Head.rotation.x += Math.sin(t * 1.3 + pl.j) * 0.05;
    }
    // Cartel: en la vista aérea solo los que hacen algo; adentro, los cercanos.
    if (cartel.current) {
      const cerca = !aerea && vTmp.set(g.position.x, 1.6, g.position.z).distanceTo(camera.position) < 11;
      const mostrar = sel || hover || (aerea ? act !== "sentado" || pl.p.estado === "listo" : cerca);
      cartel.current.style.display = mostrar ? "" : "none";
    }
    if (aro.current) aro.current.visible = sel || hover;
  });

  const color = COLOR_ESTADO[plan.p.estado];
  return (
    <group ref={grupo} position={[plan.asiento.x, 0, plan.asiento.z]} rotation={[0, Math.PI, 0]}>
      <primitive object={modelo} scale={ESCALA_PJ} />
      <mesh ref={carpeta} position={[0, 1.02, 0.36]} rotation={[0.3, 0, 0]} visible={false} castShadow>
        <boxGeometry args={[0.32, 0.05, 0.4]} />
        <meshStandardMaterial color="#e9c677" roughness={0.6} />
      </mesh>
      <mesh ref={aro} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} visible={false}>
        <ringGeometry args={[0.42, 0.5, 40]} />
        <meshBasicMaterial color={new THREE.Color(1.4, 1.2, 0.6)} toneMapped={false} />
      </mesh>
      {/* Zona de toque: un cilindro invisible, más fácil de acertar que la malla animada. */}
      <mesh
        position={[0, 0.9, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          alElegir(plan.clave);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        <cylinderGeometry args={[0.42, 0.42, 1.8, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <Html position={[0, 2.02, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <div ref={cartel} className="of3-cartel" data-estado={plan.p.estado} style={{ display: "none" }}>
          <i style={{ background: color }} />
          <b>{plan.p.nombre}</b>
          <span ref={texto}>{estadoDeCartel(plan.p.estado)}</span>
        </div>
      </Html>
    </group>
  );
});

/** En el café: mitad del rato parado tomando, el resto caminando (lo decide la fase). */
function actividadCafeQuieto(pl: Plan, t: number): boolean {
  const f = faseMensajero(t, pl.largo, pl.desfase, pl.espera);
  return f.fase === "dejando";
}

function Personajes({ salas, animar, aerea, agenteSel, sombras, alElegir }: { salas: Record<Area, SalaVisual>; animar: boolean; aerea: boolean; agenteSel: string | null; sombras: boolean; alElegir: (c: string) => void }) {
  const g0 = useGLTF(RUTA(MODELOS[0]), false, false);
  const g1 = useGLTF(RUTA(MODELOS[1]), false, false);
  const g2 = useGLTF(RUTA(MODELOS[2]), false, false);
  const g3 = useGLTF(RUTA(MODELOS[3]), false, false);
  const g4 = useGLTF(RUTA(MODELOS[4]), false, false);
  const g5 = useGLTF(RUTA(MODELOS[5]), false, false);
  const anim = useGLTF(RUTA_ANIM, false, false);
  const escenas = useMemo(() => ({ [MODELOS[0]]: g0.scene, [MODELOS[1]]: g1.scene, [MODELOS[2]]: g2.scene, [MODELOS[3]]: g3.scene, [MODELOS[4]]: g4.scene, [MODELOS[5]]: g5.scene }) as Record<string, THREE.Object3D>, [g0, g1, g2, g3, g4, g5]);
  const lista = useMemo(() => planes(salas), [salas]);
  const tRef = useRef(0);
  useFrame((_, dt) => {
    if (animar) tRef.current += Math.min(dt, 0.05);
  });
  return (
    <>
      {lista.map((pl) => (
        <Personaje key={`${pl.clave}:${pl.rol}:${pl.p.estado}`} plan={pl} escena={escenas[pl.modelo]} clips={anim.animations} animar={animar} tRef={tRef} aerea={aerea} sel={agenteSel === pl.clave} sombra={sombras} alElegir={alElegir} />
      ))}
    </>
  );
}

// --- Carteles de salas (solo en la vista aérea) ---------------------------------------------

function CartelesSalas({ salas, hojas, alEntrar }: { salas: Record<Area, SalaVisual>; hojas: number; alEntrar: (l: Lugar) => void }) {
  return (
    <>
      {SALAS_ORDEN.map((a) => {
        const s = SALAS[a];
        const v = salas[a];
        const extra = a === "direccion" ? (hojas ? `${hojas} para tu OK` : "Todo al día") : v.trabajando ? `${v.trabajando} trabajando` : "Libre";
        return (
          <Html key={a} position={[s.cx, 3.1, a === "direccion" ? s.z0 + 1.2 : s.cz - 1]} center zIndexRange={[20, 0]}>
            <button type="button" tabIndex={-1} aria-hidden="true" className={`of3-sala${v.trabajando || (a === "direccion" && hojas) ? " activa" : ""}`} onClick={() => alEntrar(a)}>
              <b>{v.titulo}</b>
              <small>{extra}</small>
            </button>
          </Html>
        );
      })}
      <Html position={[0, 3.1, 10]} center zIndexRange={[20, 0]}>
        <button type="button" tabIndex={-1} aria-hidden="true" className="of3-sala" onClick={() => alEntrar("entrada")}>
          <b>Living y cocina</b>
          <small>Café y pool</small>
        </button>
      </Html>
    </>
  );
}

// --- Posproceso: oclusión ambiental, brillo de lámparas y tono ACES ---------------------------

function Efectos({ calidad }: { calidad: Calidad }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    if (calidad === "alta") {
      const ao = new GTAOPass(scene, camera, size.width, size.height);
      ao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.6, thickness: 1.2, scale: 1.1, samples: 12 });
      ao.blendIntensity = 0.85;
      c.addPass(ao);
    }
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.32, 0.5, 0.92));
    c.addPass(new OutputPass());
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, calidad]);
  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, size, gl]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame((_, dt) => {
    composer.render(dt);
  }, 1);
  return null;
}

// --- Carga ---------------------------------------------------------------------------------

function Listo({ alListo }: { alListo: () => void }) {
  const n = useRef(0);
  const hecho = useRef(false);
  useFrame(() => {
    if (hecho.current) return;
    n.current++;
    if (n.current > 3) {
      hecho.current = true;
      alListo();
    }
  });
  return null;
}

function PantallaCarga({ visible }: { visible: boolean }) {
  const { progress } = useProgress();
  const pct = Math.round(progress);
  if (!visible) return null;
  return (
    <div className="of3-carga" role="status" aria-live="polite">
      <div className="of3-carga-edificio" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <p>
        Armando la oficina… <b>{pct} %</b>
      </p>
      <div className="of3-carga-barra" aria-hidden="true">
        <i style={{ width: `${Math.max(6, pct)}%` }} />
      </div>
    </div>
  );
}

class Barrera extends Component<{ alFallar: () => void; children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.alFallar();
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}

export default function OficinaReel3D(props: Escena3DProps) {
  const { salas, hojas, vista, conPanel, animar, activa, reducido, resaltada, agenteSel, alEntrar, alCambiarLugar, alElegirAgente, alListo, alFallar } = props;
  const [calidad, setCalidad] = useState<Calidad>(props.calidad);
  const [listo, setListo] = useState(false);
  const caminata = useRef<Recorrido>({ x: 0, z: 0, yaw: 0, pitch: 0, destino: null, teclas: new Set() });
  const aerea = vista.tipo === "aerea";
  const sombras = calidad !== "baja";
  const marcarListo = useCallback(() => {
    setListo(true);
    alListo();
  }, [alListo]);

  const tocarPiso = useCallback(
    (l: Lugar, e: ThreeEvent<MouseEvent>) => {
      if (vista.tipo === "aerea") alEntrar(l);
      else caminata.current.destino = [e.point.x, e.point.z];
    },
    [vista, alEntrar],
  );

  return (
    <div className="of3-lienzo">
      <Barrera alFallar={alFallar}>
        <Canvas
          shadows={sombras ? "soft" : false}
          dpr={calidad === "baja" ? 1 : [1, 1.5]}
          frameloop={activa ? "always" : "never"}
          camera={{ fov: 42, near: 0.1, far: 260, position: [40, 60, 70] }}
          gl={{ antialias: calidad !== "alta", powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
          onCreated={({ scene }) => {
            scene.background = new THREE.Color("#0a0e1a");
            scene.fog = new THREE.Fog("#0a0e1a", 70, 150);
          }}
        >
          <PerformanceMonitor onDecline={() => setCalidad((c) => (c === "alta" ? "media" : "baja"))} flipflops={2} />
          <hemisphereLight args={["#6f80b8", "#3a2614", 1.1]} />
          <ambientLight intensity={0.25} />
          <directionalLight
            position={[-18, 34, 14]}
            intensity={0.7}
            color="#a8b8ff"
            castShadow={sombras}
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
            shadow-normalBias={0.03}
            shadow-camera-left={-26}
            shadow-camera-right={26}
            shadow-camera-top={22}
            shadow-camera-bottom={-22}
            shadow-camera-near={1}
            shadow-camera-far={90}
          />
          <Suspense fallback={null}>
            <Mundo salas={salas} hojas={hojas} sombras={sombras} luces={calidad === "baja" ? "pocas" : "todas"} aerea={aerea} resaltada={resaltada} alTocarPiso={tocarPiso} animar={animar} />
            <Personajes salas={salas} animar={animar} aerea={aerea} agenteSel={agenteSel} sombras={calidad === "alta"} alElegir={alElegirAgente} />
            {aerea && <CartelesSalas salas={salas} hojas={hojas} alEntrar={alEntrar} />}
            <Listo alListo={marcarListo} />
          </Suspense>
          <Director vista={vista} conPanel={conPanel} reducido={reducido} alCambiarLugar={alCambiarLugar} caminata={caminata} />
          {calidad !== "baja" && <Efectos calidad={calidad} />}
        </Canvas>
      </Barrera>
      <PantallaCarga visible={!listo} />
    </div>
  );
}

for (const m of MODELOS) useGLTF.preload(RUTA(m), false, false);
useGLTF.preload(RUTA_ANIM, false, false);
