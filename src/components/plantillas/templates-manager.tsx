"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSendable,
  previewBody,
  sourceLabel,
  statusLabel,
  TEMPLATE_PURPOSES,
  VARIABLE_SOURCES,
  type TemplateAnalysis,
} from "@/lib/plantillas/catalogo";

interface LineView {
  id: string;
  label: string;
  area: string;
  credential_key: string;
  active: boolean;
  use_for_campaigns: boolean;
  has_waba: boolean;
  access: { ok: boolean; missing: string[]; wabaEnv: string; wabaHint: string | null };
  last_sync: {
    started_at: string;
    finished_at: string | null;
    status: string;
    error: string | null;
    total: number | null;
    nuevas: number | null;
    cambiaron: number | null;
    sin_cambios: number | null;
    ya_no_figuran: number | null;
    line_verified: boolean | null;
    line_check_note: string | null;
  } | null;
}

interface TemplateView {
  id: string;
  name: string;
  language: string;
  category: string | null;
  status: string;
  previous_status: string | null;
  status_changed_at: string | null;
  quality_score: string | null;
  rejected_reason: string | null;
  body_text: string | null;
  variables: TemplateAnalysis;
  campaign_compatible: boolean;
  incompatibilities: string[];
  last_seen_at: string;
  missing_since: string | null;
  last_send_error: string | null;
  last_send_error_at: string | null;
  lines: string[];
  assignments: { id: string; line_id: string; purpose: string; variable_sources: string[] }[];
  campaigns: { id: string; name: string; status: string }[];
  legacy_campaigns: { id: string; name: string }[];
  usage: { mensajes: number; ultimo: string | null };
}

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—";

function statusClass(status: string, missing: boolean): string {
  if (missing) return "bg-slate-100 text-slate-500";
  const s = status.toUpperCase();
  if (s === "APPROVED") return "bg-green-50 text-green-700";
  if (["PENDING", "IN_REVIEW", "IN_APPEAL", "APPEAL_REQUESTED"].includes(s)) return "bg-amber-50 text-amber-700";
  if (["REJECTED", "PAUSED", "DISABLED", "DELETED", "PENDING_DELETION", "LIMIT_EXCEEDED"].includes(s)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

/**
 * Catálogo de plantillas de un perfil (pregunta 22). Leer desde Meta no
 * envía nada; asignar una plantilla a una línea y propósito tampoco: solo la
 * deja disponible para elegirla en una campaña.
 */
export function TemplatesManager({
  profile,
  lines,
  templates,
}: {
  profile: { id: string; name: string; hasBrand: boolean; hasPresentation: boolean };
  lines: LineView[];
  templates: TemplateView[];
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [onlyApproved, setOnlyApproved] = useState(false);

  async function sync(lineId: string) {
    setSyncing(lineId);
    setMsg(null);
    try {
      const res = await fetch("/api/plantillas/sincronizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_id: lineId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setMsg({
          ok: true,
          text: `Catálogo actualizado: ${d.total} plantilla(s) (${d.nuevas} nuevas, ${d.cambiaron} con cambios, ${d.ya_no_figuran} que ya no figuran). No se envió nada.`,
        });
      } else {
        setMsg({ ok: false, text: d.error ?? (d.faltantes ? `Falta: ${d.faltantes.join(", ")}` : "No se pudo leer el catálogo.") });
      }
      router.refresh();
    } finally {
      setSyncing(null);
    }
  }

  const lineLabel = (id: string) => lines.find((l) => l.id === id)?.label ?? "línea";
  const purposeLabel = (key: string) => TEMPLATE_PURPOSES.find((p) => p.key === key)?.label ?? key;
  const order = (t: TemplateView) => (t.missing_since ? 3 : isSendable(t.status) ? 0 : 1);
  const visible = templates
    .filter((t) => !onlyApproved || (isSendable(t.status) && !t.missing_since))
    .sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name) || a.language.localeCompare(b.language));

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-slate-500">
        Las plantillas se leen de la cuenta de WhatsApp Business de cada línea, con el estado que informa Meta. Un nombre escrito a
        mano o un texto de ejemplo no cuenta como aprobado. Leer el catálogo y asignar plantillas no envía ningún mensaje.
      </p>

      {lines.length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          Este perfil no tiene líneas registradas: primero se cargan en «Perfil, nombres y líneas».
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((l) => (
            <li key={l.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">
                    {l.label} <span className="font-normal text-slate-400">· {l.credential_key}</span>
                    {!l.active && <span className="ml-1 text-xs text-slate-400">(desactivada)</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    Cuenta de WhatsApp Business ({l.access.wabaEnv}):{" "}
                    {l.access.wabaHint ? <span className="text-green-700">cargada {l.access.wabaHint}</span> : <span className="text-amber-700">falta</span>}
                    {" · "}Token: {l.access.missing.includes(`${l.credential_key}_ACCESS_TOKEN`) ? <span className="text-amber-700">falta</span> : <span className="text-green-700">cargado</span>}
                  </p>
                  {l.last_sync ? (
                    <p className="text-xs text-slate-500">
                      Última lectura: {fmt(l.last_sync.started_at)} —{" "}
                      {l.last_sync.status === "ok" ? (
                        <>
                          {l.last_sync.total} plantilla(s)
                          {l.last_sync.line_verified === true && " · la línea figura en la cuenta"}
                          {l.last_sync.line_verified === false && <span className="text-red-600"> · la línea NO figura en esa cuenta</span>}
                          {l.last_sync.line_verified === null && l.last_sync.line_check_note && ` · ${l.last_sync.line_check_note}`}
                        </>
                      ) : l.last_sync.status === "error" ? (
                        <span className="text-red-600">error: {l.last_sync.error}</span>
                      ) : (
                        "en curso"
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Todavía no se leyó el catálogo de esta línea.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => sync(l.id)}
                  disabled={!l.access.ok || syncing !== null}
                  title={l.access.ok ? "" : `Falta en la configuración privada: ${l.access.missing.join(", ")}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {syncing === l.id ? "Leyendo…" : "Leer plantillas de Meta"}
                </button>
              </div>
              {!l.access.ok && (
                <p className="mt-1 text-xs text-amber-700">
                  Para leer el catálogo falta cargar en la configuración privada del servidor: {l.access.missing.join(", ")}. Solo esta
                  lectura queda deshabilitada.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {msg && <p className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}

      {templates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase text-slate-500">Catálogo ({templates.length})</p>
            <label className="flex items-center gap-1 text-xs text-slate-500">
              <input type="checkbox" checked={onlyApproved} onChange={(e) => setOnlyApproved(e.target.checked)} />
              Solo aprobadas
            </label>
          </div>
          {visible.map((t) => (
            <div key={t.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{t.name}</span>
                <span className="text-xs text-slate-500">
                  {t.language}
                  {t.category ? ` · ${t.category}` : ""}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(t.status, !!t.missing_since)}`}>
                  {t.missing_since ? `Ya no figura en Meta desde ${fmt(t.missing_since)}` : statusLabel(t.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Variables del cuerpo:{" "}
                {t.variables?.bodyVariables?.length ? t.variables.bodyVariables.map((v) => `{{${v}}}`).join(", ") : "ninguna"}
                {" · "}Envío desde campañas:{" "}
                {t.campaign_compatible ? "compatible" : <span className="text-amber-700">no ({t.incompatibilities.join("; ")})</span>}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Uso:{" "}
                {[
                  ...t.assignments.map((a) => `asignada a «${lineLabel(a.line_id)}» · ${purposeLabel(a.purpose)}`),
                  t.campaigns.length ? `${t.campaigns.length} campaña(s): ${t.campaigns.map((c) => c.name).join(", ")}` : null,
                  t.legacy_campaigns.length
                    ? `escrita a mano en ${t.legacy_campaigns.map((c) => `«${c.name}»`).join(", ")} (sin elegir del catálogo)`
                    : null,
                  t.usage.mensajes ? `${t.usage.mensajes.toLocaleString("es-AR")} envío(s) registrados con este nombre (último ${fmt(t.usage.ultimo)})` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "sin uso registrado"}
              </p>
              <button
                type="button"
                onClick={() => setOpen(open === t.id ? null : t.id)}
                className="mt-1 text-xs font-medium text-slate-700 underline"
              >
                {open === t.id ? "Ocultar" : "Ver texto y asignar"}
              </button>
              {open === t.id && (
                <TemplateDetail
                  t={t}
                  profile={profile}
                  lines={lines.filter((l) => t.lines.includes(l.id) && l.active)}
                  lineLabel={lineLabel}
                  purposeLabel={purposeLabel}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <p className="font-medium text-slate-600">Propósitos</p>
        <ul className="mt-1 space-y-0.5">
          {TEMPLATE_PURPOSES.map((p) => (
            <li key={p.key}>
              {p.label}: {p.enabled ? "se usa al elegir la plantilla de una campaña" : p.when}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TemplateDetail({
  t,
  profile,
  lines,
  lineLabel,
  purposeLabel,
}: {
  t: TemplateView;
  profile: { hasBrand: boolean; hasPresentation: boolean };
  lines: LineView[];
  lineLabel: (id: string) => string;
  purposeLabel: (key: string) => string;
}) {
  const router = useRouter();
  const vars = t.variables?.bodyVariables ?? [];
  const [lineId, setLineId] = useState(lines[0]?.id ?? "");
  const [purpose, setPurpose] = useState("campana");
  const [sources, setSources] = useState<string[]>(vars.map(() => ""));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const eligible = isSendable(t.status) && !t.missing_since && t.campaign_compatible;
  const warnings: string[] = [];
  if (sources.includes("perfil.marca") && !profile.hasBrand) warnings.push("Falta cargar el nombre del perfil o marca");
  if (sources.includes("perfil.presentacion") && !profile.hasPresentation) warnings.push("Falta cargar el nombre de presentación del agente");

  async function assign() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/plantillas/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_id: lineId, template_id: t.id, purpose, variable_sources: sources }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: "Asignada. Ya se puede elegir en las campañas de esa línea." } : { ok: false, text: d.error ?? "No se pudo asignar." });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(id: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/plantillas/asignaciones/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "desactivar" }),
      });
      const d = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: "Asignación desactivada (no se borró)." } : { ok: false, text: d.error ?? "No se pudo desactivar." });
      setConfirming(null);
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-3 border-t border-slate-100 pt-2 text-xs text-slate-600">
      {t.variables?.header && (
        <p>
          Encabezado ({t.variables.header.format}){t.variables.header.text ? `: ${t.variables.header.text}` : ""}
        </p>
      )}
      {t.body_text ? (
        <p className="whitespace-pre-line rounded bg-slate-50 p-2 text-slate-700">
          {previewBody({ bodyText: t.body_text, bodyVariables: vars }, (v, i) =>
            i >= 0 && t.variables.bodyExamples?.[i] ? `[${t.variables.bodyExamples[i]}]` : `{{${v}}}`
          )}
        </p>
      ) : (
        <p className="text-slate-400">Sin cuerpo.</p>
      )}
      {t.variables?.footer && <p>Pie: {t.variables.footer}</p>}
      {t.variables?.buttons?.length ? <p>Botones: {t.variables.buttons.map((b) => `${b.text ?? b.type} (${b.type})`).join(", ")}</p> : null}
      <p className="text-slate-500">
        Visto en Meta por última vez: {fmt(t.last_seen_at)}
        {t.previous_status && t.status_changed_at ? ` · antes ${statusLabel(t.previous_status)}, cambió el ${fmt(t.status_changed_at)}` : ""}
        {t.quality_score ? ` · calidad: ${t.quality_score}` : ""}
        {t.rejected_reason && t.rejected_reason !== "NONE" ? ` · motivo de rechazo: ${t.rejected_reason}` : ""}
      </p>
      {t.last_send_error && (
        <p className="text-red-600">
          Último rechazo al enviar ({fmt(t.last_send_error_at)}): {t.last_send_error}
        </p>
      )}

      {t.assignments.length > 0 && (
        <div>
          <p className="font-medium text-slate-700">Asignaciones</p>
          <ul className="mt-1 space-y-1">
            {t.assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2">
                <span>
                  «{lineLabel(a.line_id)}» · {purposeLabel(a.purpose)} · variables:{" "}
                  {a.variable_sources.length ? a.variable_sources.map((s, i) => `{{${vars[i] ?? i + 1}}} = ${sourceLabel(s)}`).join(", ") : "ninguna"}
                </span>
                {confirming === a.id ? (
                  <span className="flex items-center gap-1">
                    ¿Desactivar?
                    <button type="button" onClick={() => deactivate(a.id)} disabled={busy} className="font-medium text-red-600 underline">
                      Sí
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className="underline">
                      No
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirming(a.id)} className="underline">
                    Desactivar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {eligible ? (
        lines.length === 0 ? (
          <p className="text-amber-700">Ninguna línea activa de este perfil tiene cargada esta cuenta de WhatsApp Business.</p>
        ) : (
          <div className="space-y-2 rounded-lg border border-slate-200 p-2">
            <p className="font-medium text-slate-700">Asignar a una línea y propósito</p>
            <div className="flex flex-wrap gap-2">
              <select value={lineId} onChange={(e) => setLineId(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5">
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5">
                {TEMPLATE_PURPOSES.map((p) => (
                  <option key={p.key} value={p.key} disabled={!p.enabled}>
                    {p.label}
                    {p.enabled ? "" : " (todavía no)"}
                  </option>
                ))}
              </select>
            </div>
            {vars.map((v, i) => (
              <label key={v} className="flex flex-wrap items-center gap-2">
                <span className="w-12 font-mono">{`{{${v}}}`}</span>
                <select
                  value={sources[i] ?? ""}
                  onChange={(e) => setSources(sources.map((s, j) => (j === i ? e.target.value : s)))}
                  className="rounded-lg border border-slate-300 px-2 py-1.5"
                >
                  <option value="">Elegí el dato</option>
                  {VARIABLE_SOURCES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {t.variables.bodyExamples?.[i] && <span className="text-slate-400">ejemplo cargado en Meta: {t.variables.bodyExamples[i]}</span>}
              </label>
            ))}
            {warnings.length > 0 && (
              <p className="text-amber-700">{warnings.join(". ")}: la campaña no se va a poder lanzar hasta completarlo en el perfil.</p>
            )}
            <button
              type="button"
              onClick={assign}
              disabled={busy || !lineId || sources.some((s) => !s)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Asignar (no envía)"}
            </button>
          </div>
        )
      ) : (
        <p className="text-slate-500">
          No se puede asignar:{" "}
          {[
            !isSendable(t.status) ? `está ${statusLabel(t.status)}` : null,
            t.missing_since ? "ya no figura en Meta" : null,
            !t.campaign_compatible ? t.incompatibilities.join("; ") : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          .
        </p>
      )}
      {msg && <p className={msg.ok ? "text-green-700" : "text-red-600"}>{msg.text}</p>}
    </div>
  );
}
