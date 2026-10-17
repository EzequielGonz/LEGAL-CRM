"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LineView {
  id: string;
  area: string;
  label: string;
  phone_display: string | null;
  credential_key: string;
  answers_with_agent: boolean;
  use_for_campaigns: boolean;
  daily_limit: number | null;
  active: boolean;
  credentials: { phoneNumberId: boolean; accessToken: boolean; ok: boolean };
}

const AREA_LABEL: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  agencia_0km: "Agencia 0KM",
  coberturas_medicas: "Coberturas médicas",
  marketing: "Marketing",
};

export function ProfileSettings({
  profile,
  areas,
  lines,
  detected,
  missing,
}: {
  profile: {
    id: string;
    name: string;
    emoji: string | null;
    brand_name: string | null;
    agent_presentation_name: string | null;
    whatsapp_phone: string | null;
  };
  areas: string[];
  lines: LineView[];
  detected: { key: string; credentials: { ok: boolean } }[];
  missing: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [brand, setBrand] = useState(profile.brand_name ?? "");
  const [presentation, setPresentation] = useState(profile.agent_presentation_name ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [newLine, setNewLine] = useState({ area: areas[0] ?? "", label: "", phone_display: "", credential_key: "", daily_limit: "" });
  const [lineMsg, setLineMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/perfiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brand_name: brand, agent_presentation_name: presentation }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: "Guardado." } : { ok: false, text: data.error ?? "No se pudo guardar." });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addLine(prefill?: { credential_key: string }) {
    setLineMsg(null);
    const payload = { ...newLine, ...(prefill ?? {}) };
    if (prefill && !payload.label) payload.label = prefill.credential_key.replace(/^WHATSAPP_/, "").replaceAll("_", " ");
    const res = await fetch(`/api/perfiles/${profile.id}/lineas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setLineMsg({ ok: false, text: data.error ?? "No se pudo registrar la línea." });
    else {
      setLineMsg({ ok: true, text: "Línea registrada." });
      setNewLine({ area: areas[0] ?? "", label: "", phone_display: "", credential_key: "", daily_limit: "" });
      router.refresh();
    }
  }

  async function patchLine(id: string, patch: Record<string, unknown>) {
    setLineMsg(null);
    const res = await fetch(`/api/perfiles/${profile.id}/lineas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setLineMsg({ ok: false, text: data.error ?? "No se pudo guardar." });
    else router.refresh();
  }

  const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold";
  const etiqueta = "text-sm font-medium text-slate-700";

  return (
    <div className="space-y-6">
      {missing.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Falta completar para contactar desde este perfil:</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">Mientras falte, los envíos y las respuestas automáticas de este perfil quedan deshabilitados. Guardar mensajes y registrar captaciones no se frena.</p>
        </div>
      ) : (
        <p className="rounded-lg bg-green-50 p-3 text-xs text-green-800">El perfil tiene lo necesario para contactar (las campañas además necesitan su línea y su plantilla).</p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className={etiqueta}>
          Nombre del perfil (uso interno)
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1 w-full`} />
        </label>
        <label className={etiqueta}>
          Nombre del perfil o marca (lo ve el contacto)
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={`${input} mt-1 w-full`} />
        </label>
        <label className={etiqueta}>
          Nombre con el que se presenta el agente
          <input value={presentation} onChange={(e) => setPresentation(e.target.value)} className={`${input} mt-1 w-full`} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={saveProfile} disabled={saving} className="btn-gold">
          {saving ? "Guardando..." : "Guardar perfil"}
        </button>
        {msg && <span className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>}
      </div>
      {profile.whatsapp_phone && (
        <p className="text-[11px] text-slate-400">Teléfono que figuraba antes en este perfil (dato anterior, sin uso automático): {profile.whatsapp_phone}</p>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Líneas de WhatsApp</h3>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {lines.map((l) => (
            <li key={l.id} className={`flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${l.active ? "" : "opacity-60"}`}>
              <div>
                <p className="font-medium text-slate-800">
                  {l.label} <span className="text-xs font-normal text-slate-500">· {AREA_LABEL[l.area] ?? l.area}{l.phone_display ? ` · ${l.phone_display}` : ""}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Variables {l.credential_key}_* ·{" "}
                  {l.credentials.ok ? (
                    <span className="text-green-700">credenciales cargadas</span>
                  ) : (
                    <span className="text-red-700">faltan credenciales en la configuración privada</span>
                  )}
                  {l.daily_limit ? ` · límite ${l.daily_limit}/día` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <label className="tactil flex items-center gap-2">
                  <input type="checkbox" aria-label={`Responde con agente: ${l.label}`} className="h-4 w-4" checked={l.answers_with_agent} onChange={(e) => patchLine(l.id, { answers_with_agent: e.target.checked })} />
                  Agente
                </label>
                <label className="tactil flex items-center gap-2">
                  <input type="checkbox" aria-label={`Se usa para campañas: ${l.label}`} className="h-4 w-4" checked={l.use_for_campaigns} onChange={(e) => patchLine(l.id, { use_for_campaigns: e.target.checked })} />
                  Campañas
                </label>
                <button type="button" onClick={() => patchLine(l.id, { active: !l.active })} aria-label={`${l.active ? "Desactivar" : "Activar"} la línea ${l.label}`} className="tactil rounded border border-slate-300 px-3 hover:bg-slate-50">
                  {l.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </li>
          ))}
          {lines.length === 0 && <li className="p-3 text-sm text-slate-400">Este perfil todavía no tiene líneas asignadas.</li>}
        </ul>

        {detected.length > 0 && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <p className="mb-2 text-xs text-slate-600">
              Conexiones que ya existen en la configuración privada y no están asignadas a ninguna línea. Siguen funcionando como hasta ahora;
              asignalas a este perfil solo si corresponden a él:
            </p>
            <div className="flex flex-wrap gap-2">
              {detected.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => addLine({ credential_key: d.key })}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-gold-400"
                  title="Asignar a este perfil"
                >
                  {d.key} {d.credentials.ok ? "" : "(incompleta)"} · asignar
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {areas.length > 1 && (
            <label className={etiqueta}>
              Área de la línea
              <select value={newLine.area} onChange={(e) => setNewLine({ ...newLine, area: e.target.value })} className={`${input} mt-1 w-full`}>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {AREA_LABEL[a] ?? a}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={etiqueta}>
            Nombre de la línea
            <input value={newLine.label} onChange={(e) => setNewLine({ ...newLine, label: e.target.value })} className={`${input} mt-1 w-full`} />
          </label>
          <label className={etiqueta}>
            Número para mostrar
            <input value={newLine.phone_display} onChange={(e) => setNewLine({ ...newLine, phone_display: e.target.value })} inputMode="tel" className={`${input} mt-1 w-full`} />
          </label>
          <label className={etiqueta}>
            Prefijo de credenciales
            <input value={newLine.credential_key} onChange={(e) => setNewLine({ ...newLine, credential_key: e.target.value.toUpperCase() })} placeholder="WHATSAPP_CIVIL" aria-describedby="ayuda-prefijo" className={`${input} mt-1 w-full font-mono`} />
          </label>
          <label className={etiqueta}>
            Límite diario (opcional)
            <input value={newLine.daily_limit} onChange={(e) => setNewLine({ ...newLine, daily_limit: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={`${input} mt-1 w-full`} />
          </label>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={() => addLine()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Registrar línea
          </button>
          <span role="status" className={`text-sm ${lineMsg?.ok ? "text-green-700" : "text-red-700"}`}>{lineMsg?.text ?? ""}</span>
        </div>
        <p id="ayuda-prefijo" className="mt-2 text-xs text-slate-600">
          Las claves de cada línea se cargan en la configuración privada del servidor como PREFIJO_PHONE_NUMBER_ID y PREFIJO_ACCESS_TOKEN. Acá nunca se muestran.
        </p>
      </div>
    </div>
  );
}
