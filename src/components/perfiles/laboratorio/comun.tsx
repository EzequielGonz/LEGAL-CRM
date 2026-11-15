"use client";

import { useEffect, useRef } from "react";

/**
 * Laboratorio del bot (15/11): tipos, estilos y ayudas compartidas por las
 * pestañas. Colores del tema claro (bg-white, text-slate-*): el modo oscuro
 * los invierte solo (tema-premium.css), igual que el resto del panel.
 * Todos los controles miden al menos 44 px de alto (uso táctil en el celular).
 */

export type Rubro = "juridico" | "agencia_0km" | "coberturas_medicas" | "marketing";
export const RUBROS: Rubro[] = ["juridico", "agencia_0km", "coberturas_medicas", "marketing"];
export type Seleccion = Rubro | "todos";

export type EstadoVersion = "borrador" | "en_prueba" | "activa" | "archivada";

export interface VersionResumen {
  version: number;
  nombre: string;
  descripcion: string;
  creada: string;
  laboratorio: boolean;
  base_version: number | null;
  rubros: Rubro[];
  modelo: string | null;
  tono: string;
  reglas: string;
  roles: { nombre: string }[];
  fichas: number;
  estado: EstadoVersion;
}

export interface PruebaResumen {
  id: string;
  rubro: Rubro;
  campaign_id: string;
  campana: string;
  version: number;
  control_version: number | null;
  modelo: string | null;
  porcentaje: number;
  dias: number;
  inicio: string;
  fin: string;
  cortada_at: string | null;
  vigente: boolean;
}

export interface AplicacionResumen {
  id: string;
  tipo: "version_perfil" | "rol_perfil" | "rol_tipo_consulta" | "rol_base" | "rol_campana";
  rubro: Rubro;
  version: number | null;
  tipo_consulta: string | null;
  rol: string | null;
  base: string | null;
  campana: string | null;
  aplicada_at: string;
}

export interface Resumen {
  modeloServidor: string;
  versiones: VersionResumen[];
  asignaciones: { rubro: Rubro; version: number; comparar_con: number | null; porcentaje: number }[];
  pruebas: PruebaResumen[];
  aplicaciones: AplicacionResumen[];
  proveedores: { id: string; nombre: string; endpoint: string; variable_clave: string; notas: string; configurada: boolean; estado: string }[];
  experimentoGlobal: { nombre: string } | null;
  aviso: string;
}

export interface Biblioteca {
  roles: { id: string; rubro: Rubro | null; nombre: string; objetivo: string; tono: string; instrucciones: string; usos: number }[];
  generales: { id: string; nombre: string; objetivo: string; tono: string; instrucciones: string }[];
  bases: { id: string; nombre: string; rubro: Rubro | null; rol_id: string | null }[];
  campanas: { id: string; nombre: string; rubro: Rubro | null; estado: string; rol_id: string | null }[];
}

export const TIPOS_CONSULTA: { id: string; label: string; soloJuridico?: boolean }[] = [
  { id: "entrante", label: "Escribió por su cuenta (redes, web, publicidad)" },
  { id: "campana", label: "Viene de una base o campaña" },
  { id: "civil", label: "Consultas civiles", soloJuridico: true },
  { id: "penal", label: "Consultas penales", soloJuridico: true },
];

// Foco: el global del panel (globals.css, :focus-visible), sin reemplazos locales.
export const BTN = "inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
/** Acción principal: la convención de botón principal del panel (btn-gold), con 44 px de alto. */
export const BTN_PRINCIPAL = "btn-gold min-h-11";
export const BTN_PELIGRO = "inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";
export const CAMPO = "min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-sm text-slate-900";
export const AREA = "w-full rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-900";
export const ETIQUETA = "mb-1 block text-sm font-medium text-slate-800";
export const AYUDA = "mt-1 text-xs text-slate-600";
export const TARJETA = "rounded-xl border border-slate-200 bg-slate-50 p-4";
export const SUBTITULO = "text-base font-semibold text-slate-900";

export const ETIQUETA_ESTADO: Record<EstadoVersion, string> = { borrador: "Borrador", en_prueba: "En prueba", activa: "Activa", archivada: "Archivada" };
const COLOR_ESTADO: Record<EstadoVersion, string> = {
  borrador: "border-slate-300 bg-white text-slate-800",
  en_prueba: "border-amber-300 bg-amber-50 text-amber-900",
  activa: "border-emerald-300 bg-emerald-50 text-emerald-900",
  archivada: "border-slate-300 bg-slate-100 text-slate-700",
};

export function Insignia({ estado }: { estado: EstadoVersion }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${COLOR_ESTADO[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>;
}

export function Aviso({ tono = "info", children }: { tono?: "info" | "alerta" | "ok"; children: React.ReactNode }) {
  const c = tono === "alerta" ? "border-amber-300 bg-amber-50 text-amber-900" : tono === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-800";
  return <div className={`rounded-lg border px-3 py-2 text-sm ${c}`}>{children}</div>;
}

/** Mensajes de resultado de una acción (éxito o error), anunciados al lector de pantalla. */
export function Mensajes({ ok, error }: { ok: string | null; error: string | null }) {
  // El botón que se tocó puede desaparecer (aplicar, archivar, volver atrás…): el foco va al mensaje.
  const okRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
    else if (ok) okRef.current?.focus();
  }, [ok, error]);
  return (
    <div className="space-y-2 empty:hidden">
      {ok && (
        <p ref={okRef} tabIndex={-1} role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {ok}
        </p>
      )}
      {error && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
    </div>
  );
}

/** Pide algo a la API del laboratorio. Devuelve el JSON o lanza un Error con el texto para mostrar. */
export async function pedir<T = any>(consulta: string | Record<string, unknown>): Promise<T> {
  const esGet = typeof consulta === "string";
  const r = await fetch(esGet ? `/api/perfiles/laboratorio?${consulta}` : "/api/perfiles/laboratorio", {
    method: esGet ? "GET" : "POST",
    cache: "no-store",
    headers: esGet ? undefined : { "Content-Type": "application/json" },
    body: esGet ? undefined : JSON.stringify(consulta),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error ?? "No se pudo completar la operación. Probá de nuevo en un momento.");
  return j as T;
}

export function fecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function perfilesDe(sel: Seleccion): Rubro[] {
  return sel === "todos" ? RUBROS : [sel];
}

export const AVISO_EN_VIVO = "Esto cambia cómo responde el bot en charlas reales. Rige para las respuestas nuevas en hasta 1 minuto y se puede volver atrás desde el laboratorio.";
