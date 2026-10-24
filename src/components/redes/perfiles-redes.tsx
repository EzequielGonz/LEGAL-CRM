"use client";

import { useEffect, useState } from "react";
import type { PaginaFacebook, PerfilInstagram } from "@/lib/redes/facebook-pagina";
import { InstagramPorEnlace } from "@/components/redes/instagram-por-enlace";

interface Respuesta {
  vinculacion: { facebook: boolean; instagram: boolean; variables: { pagina: string; token: string; instagram: string } };
  facebook: { datos: PaginaFacebook | null; error: string | null };
  instagram: { datos: PerfilInstagram | null; error: string | null };
}

const campo = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

function SinVincular({ red, variables }: { red: string; variables: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-medium text-slate-900">Falta vincular {red}</p>
      <p className="mt-1">
        Se conecta con el token de la página de Meta, cargado en las variables privadas de Vercel: {variables.map((v, i) => (
          <span key={v}>
            <code className="rounded bg-white px-1 py-0.5 text-xs">{v}</code>
            {i < variables.length - 1 ? ", " : ""}
          </span>
        ))}
        . Nunca se pega en el chat.
      </p>
    </div>
  );
}

function FormFacebook({ perfil, inicial }: { perfil: string; inicial: PaginaFacebook }) {
  const [d, setD] = useState(inicial);
  const [foto, setFoto] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(inicial.foto);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const set = (k: keyof PaginaFacebook, v: unknown) => setD((x) => ({ ...x, [k]: v }));

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    const form = new FormData();
    form.set("perfil", perfil);
    form.set("datos", JSON.stringify({ about: d.about, description: d.description, phone: d.phone, website: d.website, emails: d.emails }));
    if (foto) form.set("foto", foto);
    try {
      const res = await fetch("/api/redes/facebook", { method: "POST", body: form });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? "No se pudo guardar.");
      if (j.datos) {
        setD(j.datos);
        setVista(j.datos.foto ?? vista);
      }
      setFoto(null);
      setAviso({ tipo: "ok", texto: "Guardado en Facebook." });
    } catch (e) {
      setAviso({ tipo: "error", texto: (e as Error).message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="group relative grid h-20 w-20 cursor-pointer place-items-center overflow-hidden rounded-full bg-slate-100 text-xs text-slate-500 ring-1 ring-slate-200">
          {vista ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vista} alt="Foto de la página" className="h-full w-full object-cover" />
          ) : (
            <span>Sin foto</span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-slate-950/60 py-0.5 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Cambiar</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFoto(f);
              if (f) setVista(URL.createObjectURL(f));
            }}
          />
        </label>
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-950">{d.nombre}</p>
          <p className="text-sm text-slate-600">{d.seguidores !== null ? `${d.seguidores.toLocaleString("es-AR")} seguidores` : "Página de Facebook"}</p>
          {d.enlace ? (
            <a href={d.enlace} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-700 underline">
              Abrir la página
            </a>
          ) : null}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">Presentación (frase corta)</span>
          <input value={d.about} maxLength={255} onChange={(e) => set("about", e.target.value)} className={campo} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">Descripción</span>
          <textarea rows={4} value={d.description} onChange={(e) => set("description", e.target.value)} className={campo} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Teléfono</span>
          <input value={d.phone} onChange={(e) => set("phone", e.target.value)} className={campo} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Web</span>
          <input value={d.website} placeholder="https://" onChange={(e) => set("website", e.target.value)} className={campo} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-slate-800">Mails (separados por coma)</span>
          <input value={d.emails.join(", ")} onChange={(e) => set("emails", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} className={campo} />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={guardar} disabled={guardando} className="btn-gold">
          {guardando ? "Guardando…" : "Guardar en Facebook"}
        </button>
        {aviso && <p className={`text-sm ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-700"}`}>{aviso.texto}</p>}
      </div>
      <p className="mt-3 text-xs text-slate-500">El nombre de la página y la portada se cambian desde Facebook (Meta no permite cambiarlos por fuera).</p>
    </div>
  );
}

/**
 * Perfiles de Facebook e Instagram del perfil (reorganización 2, 18/10).
 * Facebook se edita desde acá; Instagram se muestra (Meta no deja cambiar la
 * biografía ni la foto por fuera de la app) con la biografía sugerida y el
 * enlace con origen listos para copiar.
 */
export function PerfilesRedes({ perfil, enlaceInstagram, bioSugerida }: { perfil: string; enlaceInstagram: string | null; bioSugerida: string }) {
  const [r, setR] = useState<Respuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/redes/facebook?perfil=${encodeURIComponent(perfil)}`, { cache: "no-store" })
      .then(async (x) => {
        const j = await x.json().catch(() => ({}));
        if (!x.ok) throw new Error(j?.error ?? "No se pudo leer.");
        setR(j);
      })
      .catch((e) => setError((e as Error).message));
  }, [perfil]);

  async function copiar(texto: string, clave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      window.setTimeout(() => setCopiado(null), 1500);
    } catch {
      /* el navegador no dejó copiar */
    }
  }

  if (error) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (!r) return <div className="h-64 rounded-2xl skeleton-shimmer" aria-label="Cargando" />;
  const ig = r.instagram.datos;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Facebook</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.vinculacion.facebook ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{r.vinculacion.facebook ? "Se edita desde acá" : "Sin vincular"}</span>
        </div>
        {!r.vinculacion.facebook ? (
          <SinVincular red="la página de Facebook" variables={[r.vinculacion.variables.pagina, r.vinculacion.variables.token]} />
        ) : r.facebook.error || !r.facebook.datos ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No se pudo leer la página: {r.facebook.error ?? "sin datos"}. Revisá que el token tenga el permiso de administrar la página.</p>
        ) : (
          <FormFacebook perfil={perfil} inicial={r.facebook.datos} />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Instagram</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Se edita en la app</span>
        </div>
        {ig ? (
          <div className="flex items-center gap-4">
            {ig.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ig.foto} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <span className="h-16 w-16 rounded-full bg-slate-100" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">@{ig.usuario}</p>
              <p className="text-sm text-slate-600">
                {ig.seguidores !== null ? `${ig.seguidores.toLocaleString("es-AR")} seguidores` : ""}
                {ig.publicaciones !== null ? ` · ${ig.publicaciones} publicaciones` : ""}
              </p>
            </div>
          </div>
        ) : r.vinculacion.instagram ? (
          <div className="space-y-3">
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No se pudo leer Instagram: {r.instagram.error ?? "sin datos"}.</p>
            <InstagramPorEnlace perfil={perfil} />
          </div>
        ) : (
          // 24/10: sin la API vinculada, el perfil se ve por su enlace público.
          <InstagramPorEnlace perfil={perfil} />
        )}
        {ig?.biografia ? <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{ig.biografia}</p> : null}

        <div className="mt-5 space-y-3 text-sm">
          <p className="font-medium text-slate-900">Para pegar en la app</p>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-medium text-slate-500">Biografía sugerida</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-800">{bioSugerida}</p>
            <button type="button" onClick={() => copiar(bioSugerida, "bio")} className="btn-suave-sm mt-2">
              {copiado === "bio" ? "Copiada" : "Copiar biografía"}
            </button>
          </div>
          {enlaceInstagram ? (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500">Enlace de la biografía (con origen)</p>
              <code className="mt-1 block truncate text-xs text-slate-700">{enlaceInstagram}</code>
              <button type="button" onClick={() => copiar(enlaceInstagram, "enlace")} className="btn-suave-sm mt-2">
                {copiado === "enlace" ? "Copiado" : "Copiar enlace"}
              </button>
            </div>
          ) : null}
          <a href="https://www.instagram.com/accounts/edit/" target="_blank" rel="noreferrer" className="btn-gold inline-flex">
            Abrir Instagram para editar
          </a>
        </div>
      </section>
    </div>
  );
}
