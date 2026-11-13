"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Icono } from "@/components/ui/icono-seccion";
import { useConfirmacion } from "@/components/ui/dialogo-confirmar";
import type { SlugPerfil } from "@/lib/marca";
import { etiquetaEstado, pideQr } from "@/lib/wasender/reglas";

interface Linea {
  id: string;
  area: string;
  nombre: string;
  telefono: string;
  estado: string;
  estado_at: string | null;
  habilitada: boolean;
  responde_con_bot: boolean;
  modo_prueba: boolean;
  ultimo_error: string | null;
  archivada_at: string | null;
  motivo_archivo: string | null;
  tiene_clave: boolean;
  limite_diario: number | null;
  reemplaza_linea_meta_id: string | null;
  reemplaza_desde: string | null;
  para_avisos: boolean;
  calentamiento?: { dia: number; limite: number; porCalentamiento: boolean };
}

interface LineaMeta {
  id: string;
  label: string;
  telefono: string | null;
  activa: boolean;
}

interface Config {
  lista: boolean;
  items: { clave: string; texto: string; ok: boolean; detalle?: string }[];
}

const AREA: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  agencia_0km: "Autos 0 km",
  coberturas_medicas: "Coberturas",
  marketing: "Marketing",
};

const TONO: Record<string, string> = {
  ok: "border-emerald-300 bg-emerald-50 text-emerald-800",
  aviso: "border-amber-300 bg-amber-50 text-amber-800",
  error: "border-red-300 bg-red-50 text-red-800",
  neutro: "border-slate-300 bg-white text-slate-700",
};

/** Cada cuánto se consulta el estado mientras se muestra el QR. */
const CONSULTA_QR_MS = 4000;

async function pedir(url: string, init?: RequestInit) {
  const res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json?.error ?? `Error ${res.status}`), { codigo: json?.codigo ?? null });
  return json;
}

/**
 * Pantalla de Wasender de un perfil: qué falta configurar, alta de líneas,
 * QR para vincular el celular, estado en vivo y los interruptores de cada
 * línea. Nada se envía hasta que la línea está conectada y habilitada.
 */
export function LineasWasender({ slug, marca }: { slug: SlugPerfil; marca: string }) {
  const [lineas, setLineas] = useState<Linea[] | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [lineasMeta, setLineasMeta] = useState<LineaMeta[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [area, setArea] = useState("");
  const [qr, setQr] = useState<{ lineaId: string; imagen: string | null } | null>(null);
  const [verArchivadas, setVerArchivadas] = useState(false);
  // Líneas que le avisan a otro entorno (por ejemplo, todavía a la Preview).
  const [avisaAfuera, setAvisaAfuera] = useState<Record<string, boolean>>({});
  const { pedir: preguntar, dialogo } = useConfirmacion();
  const qrRef = useRef(qr);
  qrRef.current = qr;

  const cargar = useCallback(async () => {
    try {
      const j = await pedir(`/api/wasender/lineas?perfil=${slug}`);
      setLineas(j.lineas ?? []);
      setAreas(j.areas ?? []);
      setLineasMeta(j.lineasMeta ?? []);
      setConfig(j.configuracion ?? null);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setLineas((l) => l ?? []);
    }
  }, [slug]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (areas.length && !area) setArea(areas[0]);
  }, [areas, area]);

  const reemplazar = (l: Linea) => setLineas((ls) => (ls ?? []).map((x) => (x.id === l.id ? l : x)));
  const anotarDestino = (id: string, recibeAqui: unknown) => {
    if (typeof recibeAqui === "boolean") setAvisaAfuera((m) => ({ ...m, [id]: !recibeAqui }));
  };

  // Al abrir, se consulta una vez a qué entorno avisa cada línea conectada.
  const consultadas = useRef(false);
  useEffect(() => {
    if (consultadas.current || !lineas) return;
    consultadas.current = true;
    for (const l of lineas.filter((x) => !x.archivada_at && x.estado === "connected")) {
      pedir(`/api/wasender/lineas/${l.id}/estado?perfil=${slug}`)
        .then((j) => anotarDestino(l.id, j.recibeAqui))
        .catch(() => undefined);
    }
  }, [lineas, slug]);

  // Mientras se muestra el QR, se consulta el estado hasta que la línea queda conectada.
  useEffect(() => {
    if (!qr) return;
    const t = setInterval(async () => {
      const actual = qrRef.current;
      if (!actual) return;
      try {
        const j = await pedir(`/api/wasender/lineas/${actual.lineaId}/estado?perfil=${slug}`);
        if (j.linea) reemplazar(j.linea);
        if (j.linea?.estado === "connected") {
          setQr(null);
          setAviso(`«${j.linea.nombre}» quedó conectada. Para que envíe, prendé «Envía mensajes».`);
        } else if (j.qrImagen) {
          setQr({ lineaId: actual.lineaId, imagen: j.qrImagen });
        }
      } catch {
        /* se reintenta en la próxima vuelta */
      }
    }, CONSULTA_QR_MS);
    return () => clearInterval(t);
  }, [qr, slug]);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setAviso(null);
    try {
      const crear = (confirma: boolean) =>
        pedir("/api/wasender/lineas", { method: "POST", body: JSON.stringify({ perfil: slug, area, nombre, telefono, confirma_fuera_de_meta: confirma }) });
      let j: any;
      try {
        j = await crear(false);
      } catch (err: any) {
        // El número figura como línea de Meta: solo se sigue si se confirma que ya se sacó de Meta.
        if (err?.codigo !== "numero_de_meta") throw err;
        const ok = await preguntar({
          titulo: "Ese número figura como línea de Meta. ¿Ya lo eliminaste de Meta (WhatsApp Manager)?",
          texto: "Si sigue en Meta (WhatsApp Manager) y lo conectás por QR, deja de funcionar allá.\n\nSeguí solo si ya lo sacaste de Meta. Si no, no lo agregues.",
          confirmar: "Ya lo saqué de Meta, seguir",
          cancelar: "No agregarlo",
          peligro: true,
        });
        if (!ok) throw new Error("No se agregó: el número sigue figurando como línea de Meta.");
        j = await crear(true);
      }
      setLineas((ls) => [...(ls ?? []), j.linea]);
      setNombre("");
      setTelefono("");
      setAviso("Línea creada en Wasender. Tocá «Conectar con QR» y escanealo desde el celular del chip.");
    } catch (e: any) {
      setError(e.message);
      void cargar();
    } finally {
      setCargando(false);
    }
  }

  async function conectar(l: Linea) {
    setError(null);
    setAviso(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}/conectar`, { method: "POST", body: JSON.stringify({ perfil: slug }) });
      if (j.linea) reemplazar(j.linea);
      if (j.linea?.estado === "connected") setAviso(`«${l.nombre}» ya está conectada.`);
      else setQr({ lineaId: l.id, imagen: j.qrImagen ?? null });
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function verEstado(l: Linea) {
    setError(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}/estado?perfil=${slug}`);
      if (j.linea) reemplazar(j.linea);
      if (j.qrImagen) setQr({ lineaId: l.id, imagen: j.qrImagen });
      anotarDestino(l.id, j.recibeAqui);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function recibirAqui(l: Linea) {
    setError(null);
    setAviso(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}/conectar`, { method: "POST", body: JSON.stringify({ perfil: slug, accion: "recibir_aqui" }) });
      if (j.linea) reemplazar(j.linea);
      anotarDestino(l.id, j.recibeAqui ?? true);
      setAviso(`Los mensajes de «${l.nombre}» ahora llegan a este panel.`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function desconectar(l: Linea) {
    const ok = await preguntar({
      titulo: `¿Desconectar «${l.nombre}» de Wasender?`,
      texto: "Deja de enviar y recibir hasta que la vuelvas a conectar con el QR.",
      confirmar: "Desconectar",
      peligro: true,
    });
    if (!ok) return;
    setError(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}/conectar`, { method: "POST", body: JSON.stringify({ perfil: slug, accion: "desconectar" }) });
      if (j.linea) reemplazar(j.linea);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function marcarEquivalencia(l: Linea, metaId: string) {
    const meta = lineasMeta.find((m) => m.id === metaId);
    const ok = await preguntar(
      meta
        ? {
            titulo: `¿«${l.nombre}» reemplaza a la línea de Meta «${meta.label}»?`,
            texto: `Desde ahora, todo lo que el panel le escriba a los chats de esa línea (bot, chat manual, citas y recontacto) sale por «${l.nombre}». Hacelo solo si ese número ya se sacó de Meta y está conectado acá. La línea de Meta no se borra.`,
            confirmar: "Sí, reemplaza",
          }
        : {
            titulo: "¿Quitar la equivalencia?",
            texto: "Los chats de la línea de Meta vuelven a salir por Meta.",
            confirmar: "Quitar",
            peligro: true,
          }
    );
    if (!ok) return;
    setError(null);
    setAviso(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}`, { method: "PATCH", body: JSON.stringify({ perfil: slug, reemplaza_linea_meta_id: metaId || null }) });
      if (j.linea) reemplazar(j.linea);
      setAviso(meta ? `Listo: los chats de «${meta.label}» salen por «${l.nombre}».` : "Equivalencia quitada.");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function avisos(l: Linea) {
    setError(null);
    try {
      await pedir(`/api/wasender/lineas/${l.id}`, { method: "PATCH", body: JSON.stringify({ perfil: slug, para_avisos: !l.para_avisos }) });
      await cargar();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function cambiarLimite(l: Linea) {
    const r = await preguntar({
      titulo: `Máximo de mensajes por día de «${l.nombre}»`,
      texto: "Máximo de mensajes de campaña por día, sumando todas sus campañas. Vacío = sin máximo de la línea.",
      confirmar: "Guardar",
      campo: { etiqueta: "Mensajes por día", valorInicial: l.limite_diario ? String(l.limite_diario) : "", tipo: "number", placeholder: "Sin máximo" },
    });
    if (r === null) return;
    const v = r === true ? "" : r;
    setError(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}`, { method: "PATCH", body: JSON.stringify({ perfil: slug, limite_diario: v.trim() === "" ? null : v.trim() }) });
      if (j.linea) reemplazar(j.linea);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function cambiar(l: Linea, cambios: Partial<Pick<Linea, "habilitada" | "responde_con_bot" | "modo_prueba">>) {
    setError(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}`, { method: "PATCH", body: JSON.stringify({ perfil: slug, ...cambios }) });
      if (j.linea) reemplazar(j.linea);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function archivar(l: Linea) {
    const r = await preguntar({
      titulo: `¿Por qué archivás «${l.nombre}»?`,
      texto: "No se borra: queda guardada con el motivo.",
      confirmar: "Archivar",
      peligro: true,
      campo: { etiqueta: "Motivo", tipo: "text", placeholder: "Por ejemplo: chip dado de baja", obligatorio: true },
    });
    const motivo = typeof r === "string" ? r : "";
    if (!motivo.trim()) return;
    setError(null);
    try {
      const j = await pedir(`/api/wasender/lineas/${l.id}`, { method: "POST", body: JSON.stringify({ perfil: slug, accion: "archivar", motivo }) });
      if (j.linea) reemplazar(j.linea);
      if (qr?.lineaId === l.id) setQr(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  const activas = (lineas ?? []).filter((l) => !l.archivada_at);
  const archivadas = (lineas ?? []).filter((l) => l.archivada_at);
  const faltan = config?.items.filter((i) => !i.ok) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {dialogo}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Wasender · {marca}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Líneas de WhatsApp conectadas por QR, aparte de Meta. Los chats entran al chat del panel y responde el mismo bot. Las líneas de Meta no cambian.
        </p>
      </div>

      {faltan.length > 0 && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <Icono nombre="alerta" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Falta configurar en Vercel</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {faltan.map((i) => (
                <li key={i.clave}>
                  {i.texto}
                  {i.detalle && <span className="block text-xs text-amber-800">{i.detalle}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {aviso}
        </p>
      )}

      {qr && (
        <section aria-labelledby="wasender-qr" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 id="wasender-qr" className="text-base font-semibold text-slate-900">
            Escaneá el QR con el celular del chip
          </h2>
          <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm text-slate-700">
            <li>En ese celular abrí WhatsApp.</li>
            <li>Andá a Configuración → Dispositivos vinculados → Vincular un dispositivo.</li>
            <li>Escaneá este código. Se renueva solo cada pocos segundos.</li>
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {qr.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagen generada en el servidor (data URL), sin optimizar
              <img src={qr.imagen} alt="Código QR para vincular la línea desde WhatsApp" width={256} height={256} className="h-64 w-64 rounded-xl border border-slate-200 bg-white p-2 [image-rendering:pixelated]" />
            ) : (
              <p className="flex h-64 w-64 items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Pidiendo el QR a Wasender…</p>
            )}
            <button type="button" onClick={() => setQr(null)} className="tactil rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50">
              Cerrar
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="wasender-lineas" className="space-y-3">
        <h2 id="wasender-lineas" className="text-base font-semibold text-slate-900">
          Líneas
        </h2>
        {lineas === null ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : activas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Todavía no hay líneas de Wasender en este perfil. Agregá la primera abajo.</p>
        ) : (
          <ul className="space-y-3">
            {activas.map((l) => {
              const est = etiquetaEstado(l.estado);
              return (
                <li key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{l.nombre}</p>
                      <p className="text-sm tabular-nums text-slate-600">
                        {l.telefono}
                        {areas.length > 1 ? ` · ${AREA[l.area] ?? l.area}` : ""}
                      </p>
                    </div>
                    <span className={clsx("rounded-full border px-2.5 py-0.5 text-xs font-medium", TONO[est.tono])}>{est.texto}</span>
                  </div>
                  {l.ultimo_error && <p className="mt-2 text-xs text-red-700">{l.ultimo_error}</p>}
                  {avisaAfuera[l.id] && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <p>Esta línea le avisa a otro entorno: los mensajes que recibe no llegan a este panel.</p>
                      <button type="button" onClick={() => recibirAqui(l)} className="tactil rounded-lg bg-amber-900 px-3 text-sm font-semibold text-white hover:bg-amber-800">
                        Recibir en este panel
                      </button>
                    </div>
                  )}
                  {l.calentamiento && (
                    <p className="mt-3 text-sm text-slate-700">
                      {l.calentamiento.porCalentamiento
                        ? `Día ${l.calentamiento.dia} de calentamiento: hoy puede enviar hasta ${l.calentamiento.limite} mensajes de campaña. Sube sola cada semana.`
                        : `Campañas: hasta ${l.calentamiento.limite} mensajes por día.`}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    <Interruptor activo={l.habilitada} onClick={() => cambiar(l, { habilitada: !l.habilitada })} texto="Envía mensajes" ayuda="Apagada no sale nada por esta línea." />
                    <Interruptor activo={l.responde_con_bot} onClick={() => cambiar(l, { responde_con_bot: !l.responde_con_bot })} texto="Responde el bot" ayuda="Apagado, los chats quedan para una persona." />
                    <Interruptor
                      activo={l.modo_prueba}
                      onClick={() => cambiar(l, { modo_prueba: !l.modo_prueba })}
                      texto="Modo prueba"
                      ayuda="Entre mensaje y mensaje el chat queda en atención humana, así producción no le escribe."
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3 text-sm">
                    <label className="block">
                      <span className="font-medium text-slate-800">Reemplaza a la línea de Meta</span>
                      <select
                        value={l.reemplaza_linea_meta_id ?? ""}
                        onChange={(e) => marcarEquivalencia(l, e.target.value)}
                        className="mt-1 block w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Ninguna</option>
                        {lineasMeta.map((m) => {
                          const tomada = activas.some((x) => x.id !== l.id && x.reemplaza_linea_meta_id === m.id);
                          return (
                            <option key={m.id} value={m.id} disabled={tomada}>
                              {m.label}
                              {m.telefono ? ` (${m.telefono})` : ""}
                              {tomada ? " · ya reemplazada" : ""}
                            </option>
                          );
                        })}
                      </select>
                      <span className="mt-1 block text-xs text-slate-500">
                        {l.reemplaza_linea_meta_id
                          ? `Sus chats salen por esta línea desde el ${new Date(l.reemplaza_desde ?? Date.now()).toLocaleDateString("es-AR")}.`
                          : "Elegila cuando el número ya se sacó de Meta."}
                      </span>
                    </label>
                    <Interruptor
                      activo={l.para_avisos}
                      onClick={() => avisos(l)}
                      texto="Avisos internos del perfil"
                      ayuda="Los avisos al equipo (cliente agendado, caso calificado) salen por esta línea."
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pideQr(l.estado) && (
                      <button type="button" onClick={() => conectar(l)} className="tactil inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                        <Icono nombre="wasender" className="h-4 w-4" />
                        Conectar con QR
                      </button>
                    )}
                    <button type="button" onClick={() => verEstado(l)} className="tactil rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50">
                      Ver estado
                    </button>
                    {l.estado === "connected" && (
                      <button type="button" onClick={() => desconectar(l)} className="tactil rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50">
                        Desconectar
                      </button>
                    )}
                    <button type="button" onClick={() => cambiarLimite(l)} className="tactil rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50">
                      {l.limite_diario ? `Máximo ${l.limite_diario} por día` : "Máximo por día"}
                    </button>
                    <button type="button" onClick={() => archivar(l)} className="tactil rounded-lg px-3 text-sm text-slate-500 underline hover:text-slate-700">
                      Archivar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="wasender-nueva" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 id="wasender-nueva" className="text-base font-semibold text-slate-900">
          Agregar línea
        </h2>
        <p className="mt-1 text-sm text-slate-600">Usá un chip nuevo con WhatsApp instalado en un celular. Nunca un número que ya está en Meta.</p>
        <form onSubmit={agregar} className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={80}
              required
              placeholder="Por ejemplo: Wasender 1"
              className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-800">Número con código de país</span>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              inputMode="tel"
              required
              placeholder="+54 9 11 …"
              className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400"
            />
          </label>
          {areas.length > 1 && (
            <label className="block text-sm">
              <span className="font-medium text-slate-800">Área</span>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="tactil mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {AREA[a] ?? a}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={cargando}
              className="tactil inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icono nombre="mas" className="h-4 w-4" />
              {cargando ? "Creando…" : "Agregar línea"}
            </button>
          </div>
        </form>
      </section>

      {archivadas.length > 0 && (
        <section className="space-y-2">
          <button type="button" onClick={() => setVerArchivadas((v) => !v)} className="tactil text-sm font-medium text-slate-700 underline">
            {verArchivadas ? "Ocultar" : "Ver"} archivadas ({archivadas.length})
          </button>
          {verArchivadas && (
            <ul className="space-y-2">
              {archivadas.map((l) => (
                <li key={l.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{l.nombre}</span> <span className="tabular-nums">{l.telefono}</span> · {l.motivo_archivo}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Interruptor({ activo, onClick, texto, ayuda }: { activo: boolean; onClick: () => void; texto: string; ayuda: string }) {
  return (
    <button type="button" role="switch" aria-checked={activo} onClick={onClick} title={ayuda} className="tactil inline-flex items-center gap-2 text-slate-800">
      <span className={clsx("relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors", activo ? "bg-emerald-600" : "bg-slate-300")}>
        <span className={clsx("absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", activo ? "translate-x-4" : "translate-x-0.5")} />
      </span>
      {texto}
    </button>
  );
}
