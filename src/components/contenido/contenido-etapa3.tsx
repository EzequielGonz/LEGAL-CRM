"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { enfocarCampo } from "@/components/nivel/nivel";

/**
 * Etapa 3 · Contenido: brief de marca (qué somos, a quién hablamos, qué se
 * puede afirmar), generador de piezas con vista previa (texto + imagen) y
 * auditoría de la landing. Nada se publica desde acá: las piezas entran a
 * la cola según la política del canal.
 */

async function pedir(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
function Estado({ msg }: { msg: { ok: boolean; text: string } | null }) {
  return (
    <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-sm text-emerald-700" : "text-sm font-medium text-red-700") : "sr-only"}>
      {msg?.text ?? ""}
    </p>
  );
}
const lineas = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);

/**
 * Brief de marca: la fuente única de nombre, logos y colores del perfil.
 * Con `soloMarca` (Configuración · Perfil y marca) muestra solo la
 * identidad; el resto del brief se conserva tal cual al guardar.
 */
export function BriefMarca({ perfil, soloMarca = false }: { perfil: string; soloMarca?: boolean }) {
  const router = useRouter();
  const [b, setB] = useState<any>(null);
  const [marca, setMarca] = useState<{ logoOriginal: string; origenLogo: string; paleta: string[] } | null>(null);
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [pilares, setPilares] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    void pedir(`/api/contenido/brief?perfil=${perfil}`).then((r) => {
      if (!r.ok) return;
      setB({ ...r.data.brief, servicios_txt: (r.data.brief.servicios ?? []).join("\n"), afirm_txt: (r.data.brief.afirmaciones_autorizadas ?? []).join("\n"), prohib_txt: (r.data.brief.prohibido ?? []).join("\n") });
      setFaltantes(r.data.faltantes ?? []);
      setPilares(r.data.pilares ?? []);
      setMarca(r.data.marca ?? null);
    });
  }, [perfil]);
  if (!b) return <p className="text-sm text-slate-500">Cargando brief…</p>;
  const campo = (k: string, label: string, props: any = {}) => (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <input id={`brief-${k}`} value={b[k] ?? ""} onChange={(e) => setB({ ...b, [k]: e.target.value })} {...props} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2" />
    </label>
  );
  const color = (k: string, label: string, ejemplo: string) => (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-lg border border-slate-300" style={{ background: /^#[0-9a-f]{6}$/i.test(b.colores?.[k] ?? "") ? b.colores[k] : "transparent" }} />
        <input id={`brief-color_${k}`} value={b.colores?.[k] ?? ""} onChange={(e) => setB({ ...b, colores: { ...b.colores, [k]: e.target.value } })} placeholder={ejemplo} spellCheck={false} className="tactil w-full rounded-lg border border-slate-300 px-2 font-mono" />
      </span>
    </label>
  );
  const otrosColores = Object.entries(b.colores ?? {}).filter(([k]) => !["principal", "secundario", "texto"].includes(k));
  const area = (k: string, label: string, rows = 3) => (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <textarea id={`brief-${k}`} value={b[k] ?? ""} onChange={(e) => setB({ ...b, [k]: e.target.value })} rows={rows} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1" />
    </label>
  );
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const r = await pedir("/api/contenido/brief", "PUT", {
          perfil,
          nombre_publico: b.nombre_publico,
          logo_ref: b.logo_ref,
          logo_panel: b.logo_panel ?? "",
          colores: { principal: b.colores?.principal, secundario: b.colores?.secundario, texto: b.colores?.texto },
          servicios: lineas(b.servicios_txt ?? ""),
          publico: b.publico,
          zonas: b.zonas,
          tono: b.tono,
          contacto: { whatsapp: b.contacto?.whatsapp, web: b.contacto?.web, direccion: b.contacto?.direccion },
          web: b.web,
          objetivos: b.objetivos,
          afirmaciones_autorizadas: lineas(b.afirm_txt ?? ""),
          prohibido: lineas(b.prohib_txt ?? ""),
        });
        setBusy(false);
        if (!r.ok) {
          setMsg({ ok: false, text: r.data?.error ?? "No se pudo guardar." });
          // El error lleva al campo que lo causó.
          if (r.data?.campo) enfocarCampo(`brief-${r.data.campo}`);
          return;
        }
        setFaltantes(r.data.faltantes ?? []);
        setMsg({ ok: true, text: r.data.completo ? "Brief guardado y completo." : `Brief guardado. Faltan: ${(r.data.faltantes ?? []).join(", ")}.` });
        router.refresh();
      }}
    >
      {!soloMarca && faltantes.length > 0 && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Falta: {faltantes.join(", ")}. Sin lo obligatorio, las piezas generadas quedan retenidas.</p>}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {campo("nombre_publico", "Nombre público de la marca", { maxLength: 120 })}
        {campo("logo_ref", "Logo de las piezas (enlace https)", { placeholder: "https://…/logo.png" })}
        <div className="md:col-span-2 rounded-xl border border-slate-200 p-3">
          <p className="text-xs font-medium text-slate-700">Logo del panel (menú, selector de perfiles y Teléfono)</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="placa-logo placa-logo-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={(b.logo_panel ?? "").trim() || marca?.logoOriginal || `/logos/${perfil}.svg`} alt="Vista previa del logo del panel" />
            </span>
            <label className="min-w-0 flex-1 text-sm">
              <span className="sr-only">Enlace del logo del panel</span>
              <input id="brief-logo_panel" value={b.logo_panel ?? ""} onChange={(e) => setB({ ...b, logo_panel: e.target.value })} placeholder="Vacío = logo original del perfil" className="tactil w-full rounded-lg border border-slate-300 px-2" />
            </label>
            {(b.logo_panel ?? "").trim() && (
              <button type="button" onClick={() => setB({ ...b, logo_panel: "" })} className="tactil rounded-lg border border-slate-300 px-3 text-sm">
                Usar el original
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-600">Se muestra sobre placa negra, sin filtros ni deformación. Al guardar se actualiza en todo el panel.</p>
        </div>
        {color("principal", "Color principal", "#112250")}
        {color("texto", "Color del texto sobre el principal", "#ffffff")}
        {color("secundario", "Color secundario", "#3B507D")}
        {!soloMarca && (
          <>
        {campo("publico", "A quién le hablamos")}
        {campo("zonas", "Zonas")}
        {campo("tono", "Tono (p. ej. cercano, claro, sin tecnicismos)")}
        <label className="block text-sm">
          <span className="text-xs font-medium text-slate-700">Web pública</span>
          <input value={b.contacto?.web ?? ""} onChange={(e) => setB({ ...b, contacto: { ...b.contacto, web: e.target.value } })} className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2" />
        </label>
          </>
        )}
      </div>
      {otrosColores.length > 0 && (
        <p className="text-xs text-slate-600">
          Otros colores de la paleta guardados (se conservan al guardar):{" "}
          {otrosColores.map(([k, v]) => (
            <span key={k} className="mr-2 inline-flex items-center gap-1 whitespace-nowrap">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm border border-slate-300" style={{ background: String(v) }} />
              {k} <span className="font-mono">{String(v)}</span>
            </span>
          ))}
        </p>
      )}
      {!soloMarca && (
        <>
          {area("servicios_txt", "Servicios (uno por línea)")}
          {area("afirm_txt", "Afirmaciones autorizadas (una por línea; solo estas se usan como hechos)")}
          {area("prohib_txt", "Frases que nunca se usan (una por línea)", 2)}
          {area("objetivos", "Objetivos del contenido", 2)}
        </>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Guardando…" : soloMarca ? "Guardar marca del perfil" : "Guardar brief"}
        </button>
        <Estado msg={msg} />
      </div>
      {!soloMarca && pilares.length > 0 && (
        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer">Sobre qué se habla (pilares de este perfil)</summary>
          <ul className="mt-1 list-disc pl-5">
            {pilares.map((p) => (
              <li key={p.pilar}>
                <strong>{p.pilar}:</strong> {p.ejemplo}
              </li>
            ))}
          </ul>
        </details>
      )}
    </form>
  );
}

export function GeneradorPiezas({ perfil }: { perfil: string }) {
  const router = useRouter();
  const [canales, setCanales] = useState<string[]>(["instagram", "facebook"]);
  const [semanas, setSemanas] = useState(1);
  const [porSemana, setPorSemana] = useState(2);
  const [vista, setVista] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const enviar = async (soloVista: boolean) => {
    setBusy(true);
    setMsg(null);
    const r = await pedir("/api/contenido/piezas", "POST", { perfil, canales, semanas, porSemana, soloVista });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? "No se pudo generar." });
    if (soloVista) {
      setVista(r.data.piezas);
      setMsg({ ok: true, text: `${r.data.piezas.length} piezas en vista previa. Nada guardado.` });
    } else {
      setVista([]);
      const cuenta = r.data.piezas.reduce((a: any, p: any) => ({ ...a, [p.estado]: (a[p.estado] ?? 0) + 1 }), {});
      setMsg({ ok: true, text: `Encoladas: ${Object.entries(cuenta).map(([k, v]) => `${v} ${k}`).join(", ")}. Nada se publica sin política habilitada, cuenta conectada y ejecutor encendido.` });
      router.refresh();
    }
  };
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-end gap-3">
        <fieldset className="flex gap-3">
          <legend className="text-xs font-medium text-slate-700">Canales</legend>
          {["instagram", "facebook"].map((c) => (
            <label key={c} className="flex items-center gap-1">
              <input type="checkbox" checked={canales.includes(c)} onChange={(e) => setCanales(e.target.checked ? [...canales, c] : canales.filter((x) => x !== c))} /> {c === "instagram" ? "Instagram" : "Facebook"}
            </label>
          ))}
        </fieldset>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Semanas</span>
          <input type="number" min={1} max={4} value={semanas} onChange={(e) => setSemanas(Number(e.target.value))} className="tactil mt-1 w-20 rounded-lg border border-slate-300 px-2" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Piezas por semana</span>
          <input type="number" min={1} max={3} value={porSemana} onChange={(e) => setPorSemana(Number(e.target.value))} className="tactil mt-1 w-20 rounded-lg border border-slate-300 px-2" />
        </label>
        <button type="button" disabled={busy} onClick={() => enviar(true)} className="tactil rounded-lg border border-slate-300 px-3 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-60">
          Vista previa
        </button>
        <button type="button" disabled={busy} onClick={() => enviar(false)} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Generando…" : "Generar y encolar"}
        </button>
      </div>
      <Estado msg={msg} />
      {vista.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {vista.map((p, i) => (
            <li key={i} className="rounded-lg border border-slate-200 p-2">
              <div className="mb-1 aspect-square w-full overflow-hidden rounded bg-slate-100" dangerouslySetInnerHTML={{ __html: p.svg }} />
              <p className="text-xs text-slate-500">
                {p.canal} · {p.pilar} · {new Date(p.fecha).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}
              </p>
              <p className="whitespace-pre-line text-sm text-slate-800">{p.texto}</p>
              {p.motivosRetencion?.length > 0 && <p className="mt-1 text-xs font-medium text-amber-800">Quedaría retenida: {p.motivosRetencion.join("; ")}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AuditoriaLanding({ perfil }: { perfil: string }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [res, setRes] = useState<any>(null);
  const [previas, setPrevias] = useState<any[]>([]);
  useEffect(() => {
    void pedir(`/api/contenido/auditoria?perfil=${perfil}`).then((r) => r.ok && setPrevias(r.data.auditorias ?? []));
  }, [perfil]);
  return (
    <form
      className="space-y-2 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const r = await pedir("/api/contenido/auditoria", "POST", { perfil, url });
        setBusy(false);
        if (!r.ok) return setMsg({ ok: false, text: r.data?.error ?? "No se pudo auditar." });
        setRes(r.data.auditoria);
        setMsg({ ok: true, text: `Auditoría guardada: ${r.data.auditoria.puntaje}/100.` });
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="block grow">
          <span className="text-xs font-medium text-slate-700">Dirección de la landing (propia)</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} type="url" required placeholder="https://…" className="tactil mt-1 w-full rounded-lg border border-slate-300 px-2" />
        </label>
        <button type="submit" disabled={busy} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60">
          {busy ? "Auditando…" : "Auditar"}
        </button>
      </div>
      <Estado msg={msg} />
      {res && (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="font-medium text-slate-900">
            {res.puntaje}/100 · {res.titulo ?? "sin título"}
          </p>
          <ul className="mt-1 space-y-1">
            {res.problemas.length === 0 && <li className="text-emerald-700">Sin problemas básicos detectados.</li>}
            {res.problemas.map((p: any) => (
              <li key={p.clave} className="text-xs">
                <span className={`mr-1 rounded px-1 ${p.gravedad === "alta" ? "bg-red-100 text-red-800" : p.gravedad === "media" ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-700"}`}>{p.gravedad}</span>
                {p.detalle} <span className="text-slate-500">→ {p.mejora}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {previas.length > 0 && (
        <p className="text-xs text-slate-500">
          Anteriores: {previas.slice(0, 5).map((a) => `${new Date(a.created_at).toLocaleDateString("es-AR")} ${a.puntaje}/100`).join(" · ")}
        </p>
      )}
    </form>
  );
}
