"use client";

import { useState } from "react";
import Link from "next/link";
import { pedidoDesdeCerebro } from "@/lib/cerebro/contenido";
import { MAX_PEDIDO, pareceDatoPersonal } from "@/lib/bandeja-claude";

/**
 * Bandeja desde el cerebro (21/11): un pedido corto para Claude, con la
 * foto de la semana adjunta si se quiere. Usa la Bandeja para Claude de
 * siempre (misma tabla, mismas validaciones): Claude la toma cuando abren
 * un chat del proyecto y dicen «ok».
 */
const PERFILES = [
  { slug: "juridico", nombre: "VITA (Jurídico)" },
  { slug: "marketing", nombre: "Kocos Marketing" },
  { slug: "coberturas_medicas", nombre: "Coberturas médicas" },
  { slug: "agencia_0km", nombre: "Autos 0 km" },
] as const;

export function HablarConClaude({ foto }: { foto: string | null }) {
  const [perfil, setPerfil] = useState<string>("juridico");
  const [texto, setTexto] = useState("");
  const [conFoto, setConFoto] = useState(Boolean(foto));
  const [estado, setEstado] = useState<"listo" | "enviando" | "ok" | "error">("listo");
  const [mensaje, setMensaje] = useState("");

  const pedido = pedidoDesdeCerebro(texto, conFoto ? foto : null);
  const largo = pedido.length > MAX_PEDIDO;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) {
      setEstado("error");
      setMensaje("Escribí qué querés que haga Claude.");
      return;
    }
    if (pareceDatoPersonal(texto)) {
      setEstado("error");
      setMensaje("Sacá teléfonos, documentos o correos: la bandeja no guarda datos personales.");
      return;
    }
    setEstado("enviando");
    setMensaje("");
    try {
      const r = await fetch("/api/bandeja-claude", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ perfil, pedido }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "No se pudo guardar el pedido.");
      setEstado("ok");
      setMensaje("Listo: quedó en la Bandeja para Claude. Lo toma cuando abran un chat del proyecto y digan «ok».");
      setTexto("");
    } catch (err) {
      setEstado("error");
      setMensaje(err instanceof Error ? err.message : "No se pudo guardar el pedido.");
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="hablar-titulo">
      <div>
        <h2 id="hablar-titulo" className="text-lg font-semibold text-slate-900">
          Hablale a Claude
        </h2>
        <p className="mt-1 text-sm text-slate-600">Una idea, una duda o algo para revisar. Va a la Bandeja para Claude con el contexto del cerebro.</p>
      </div>
      <label className="block text-sm font-medium text-slate-800">
        Perfil
        <select
          value={perfil}
          onChange={(e) => setPerfil(e.target.value)}
          className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 sm:max-w-xs"
        >
          {PERFILES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-800">
        Pedido
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          maxLength={MAX_PEDIDO}
          placeholder="Ej.: revisá por qué Coberturas no envía y proponeme cómo destrabarlo."
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>
      {foto && (
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conFoto} onChange={(e) => setConFoto(e.target.checked)} className="h-4 w-4" />
          Sumar la foto de la semana (solo cifras, sin datos de personas)
        </label>
      )}
      {largo && <p className="text-sm text-amber-800">El pedido es muy largo: sacá la foto de la semana o acortalo.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={estado === "enviando" || largo} className="btn-gold min-h-[44px] disabled:opacity-60">
          {estado === "enviando" ? "Enviando…" : "Mandar a Claude"}
        </button>
        <Link href={`/bandeja?perfil=${perfil}`} prefetch={false} className="text-sm font-medium text-slate-700 underline">
          Ver la bandeja
        </Link>
      </div>
      <p role="status" aria-live="polite" className={estado === "error" ? "text-sm text-red-700" : "text-sm text-emerald-800"}>
        {estado === "ok" || estado === "error" ? mensaje : ""}
      </p>
    </form>
  );
}
