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
    <form onSubmit={enviar} className="cz-form" aria-label="Hablale a Claude">
      <label>
        Perfil
        <select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
          {PERFILES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Pedido
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          maxLength={MAX_PEDIDO}
          placeholder="Ej.: revisá por qué Coberturas no envía y proponeme cómo destrabarlo."
        />
      </label>
      {foto && (
        <label className="check">
          <input type="checkbox" checked={conFoto} onChange={(e) => setConFoto(e.target.checked)} />
          Sumar la foto de la semana (solo cifras, sin datos de personas)
        </label>
      )}
      {largo && <p className="cz-err">El pedido es muy largo: sacá la foto de la semana o acortalo.</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button type="submit" disabled={estado === "enviando" || largo} className="cz-btn">
          {estado === "enviando" ? "Enviando…" : "Mandar a Claude"}
        </button>
        <Link href={`/bandeja?perfil=${perfil}`} prefetch={false} className="cz-btn sec">
          Ver la bandeja
        </Link>
      </div>
      <p role="status" aria-live="polite" className={estado === "error" ? "cz-err" : "cz-ok"}>
        {estado === "ok" || estado === "error" ? mensaje : ""}
      </p>
    </form>
  );
}
