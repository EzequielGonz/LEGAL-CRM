"use client";

import { useState } from "react";
import { EnlaceAvanzado } from "@/components/nivel/nivel";
import { useRouter } from "next/navigation";
import { SendLimitsFields } from "./send-limits-fields";
import { TemplatePicker } from "@/components/plantillas/template-picker";
import { ChatCampana } from "@/components/campanas/chat-campana";
import type { SlugPerfil } from "@/lib/marca";

export function NewCampaignForm({
  channels,
  lines = [],
  redirectBase = "/campanas",
  perfil,
  bases = [],
  roles = [],
}: {
  channels: { id: string; label: string }[];
  /** 24/10: bases ya cargadas del perfil, para elegir en vez de escribir. */
  bases?: { id: string; nombre: string; filas: number | null }[];
  /** 24/10: roles del bot del perfil (vale solo para esta campaña). */
  roles?: { id: string; nombre: string }[];
  /** Líneas del perfil habilitadas para campañas (bloque 1.4). Se puede asignar después. */
  lines?: { id: string; label: string }[];
  /** Base de la URL a la que navegar después de crear la campaña, seguida
   * de "/<id>". Por defecto "/campanas" (panel de Jurídico); los paneles
   * de otros rubros pasan la suya, por ejemplo "/panel/agencia_0km/campanas". */
  redirectBase?: string;
  /** Perfil de la pantalla: habilita «Preparar con IA» dentro de Campañas. */
  perfil?: SlugPerfil;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [iaAbierta, setIaAbierta] = useState(false);
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [template, setTemplate] = useState("");
  const [lineId, setLineId] = useState(lines.length === 1 ? lines[0].id : "");
  const [baseId, setBaseId] = useState("");
  const [rolId, setRolId] = useState("");
  const [minDelaySeconds, setMinDelaySeconds] = useState(50);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState(200);
  const [batchSize, setBatchSize] = useState(10);
  const [batchPauseSeconds, setBatchPauseSeconds] = useState(300);
  const [dailyLimit, setDailyLimit] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!channelId) {
      setLoading(false);
      setError(
        "No hay ningún canal de WhatsApp disponible para elegir. Recargá la página e intentá de nuevo."
      );
      return;
    }

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        channel_id: channelId,
        template_id: template || null,
        min_send_delay_seconds: minDelaySeconds,
        max_send_delay_seconds: maxDelaySeconds,
        batch_size: batchSize,
        batch_pause_seconds: batchPauseSeconds,
        daily_send_limit: dailyLimit === "" ? null : dailyLimit,
        line_id: lineId || null,
        base_id: baseId || undefined,
        agent_role_id: rolId || null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    // Antes, si esto fallaba (por ejemplo la sesión vencida o algún error del
    // servidor), el formulario se cerraba solo y no avisaba nada — parecía
    // que "no se podían crear más campañas" cuando en realidad no hay ningún
    // límite, solo faltaba mostrar el error.
    if (!res.ok || data.error || !data.campaign) {
      setError(data.error ?? "No se pudo crear la campaña. Probá de nuevo.");
      return;
    }

    setOpen(false);
    router.push(`${redirectBase}/${data.campaign.id}`);
  }

  if (!open) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="btn-gold"
          >
            Preparar una campaña
          </button>
          {perfil && !iaAbierta && (
            <button
              type="button"
              onClick={() => setIaAbierta(true)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400"
            >
              Preparar con IA
            </button>
          )}
        </div>
        {perfil && iaAbierta && (
          <div className="mt-4">
            <ChatCampana slug={perfil} onCerrar={() => setIaAbierta(false)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      <p className="text-sm text-slate-700">
        Crear una campaña solo la prepara: no envía nada. Los mensajes salen recién cuando la lanzás y lo confirmás.
      </p>
      {bases.length > 0 && (
        <div>
          <label htmlFor="campana-base" className="mb-1 block text-sm font-medium text-slate-700">Base</label>
          <select
            id="campana-base"
            value={baseId}
            onChange={(e) => {
              const id = e.target.value;
              setBaseId(id);
              const b = bases.find((x) => x.id === id);
              if (b && !name.trim()) setName(b.nombre);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          >
            <option value="">Elegir después (o cargar un archivo nuevo en la campaña)</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
                {b.filas != null ? ` · ${b.filas} filas` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-600">
            Sus contactos entran como pendientes (sin detenidos ni ya contactados). No se envía nada hasta que la lances.
          </p>
        </div>
      )}
      <div>
        <label htmlFor="campana-nombre" className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
        <input
          id="campana-nombre"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
          placeholder="Ej: Base clientes 2024 - Accidentes laborales"
        />
      </div>
      {/* Con un solo canal no hace falta elegir: se ve en Avanzado. */}
      <div className={channels.length > 1 ? "" : "solo-avanzado"}>
        <label htmlFor="campana-canal" className="mb-1 block text-sm font-medium text-slate-700">Canal (WhatsApp)</label>
        <select
          id="campana-canal"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        >
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="campana-linea" className="mb-1 block text-sm font-medium text-slate-700">Línea que envía</label>
        <select
          id="campana-linea"
          value={lineId}
          onChange={(e) => {
            setLineId(e.target.value);
            setTemplate("");
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        >
          <option value="">Asignar después</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-600">
          Sin línea asignada la campaña queda en borrador y no se puede lanzar. Las líneas se cargan en Configuración.
        </p>
      </div>
      <div>
        <label htmlFor="campana-rol" className="mb-1 block text-sm font-medium text-slate-700">Rol del bot en esta campaña</label>
        <select
          id="campana-rol"
          value={rolId}
          onChange={(e) => setRolId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        >
          <option value="">Sin rol propio (usa el de la base o el bot del perfil)</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-600">Vale solo para esta campaña. Se puede cambiar o editar después desde la campaña.</p>
      </div>
      <div>
        <p className="mb-1 block text-sm font-medium text-slate-700">Plantilla (catálogo de la línea)</p>
        <TemplatePicker lineId={lineId || null} value={template} onChange={setTemplate} ariaLabel="Plantilla (catálogo de la línea)" />
        <p className="mt-1 text-xs text-slate-600">
          Solo plantillas aprobadas según Meta y asignadas a la línea para campañas. Se puede elegir después.
        </p>
      </div>

      <p className="solo-simple rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Ritmo de envío: el recomendado (de a 10 mensajes, con esperas variables y pausas, para cuidar el número).{" "}
        <EnlaceAvanzado href="#campana-ritmo" className="font-medium underline underline-offset-2">
          Personalizar
        </EnlaceAvanzado>
      </p>
      <div id="campana-ritmo" tabIndex={-1} className="solo-avanzado">
      <SendLimitsFields
        idPrefix="campana-envio"
        minDelaySeconds={minDelaySeconds}
        onMinDelayChange={setMinDelaySeconds}
        maxDelaySeconds={maxDelaySeconds}
        onMaxDelayChange={setMaxDelaySeconds}
        batchSize={batchSize}
        onBatchSizeChange={setBatchSize}
        batchPauseSeconds={batchPauseSeconds}
        onBatchPauseSecondsChange={setBatchPauseSeconds}
        dailyLimit={dailyLimit}
        onDailyLimitChange={setDailyLimit}
      />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-gold"
        >
          {loading ? "Creando..." : "Crear campaña (no envía nada)"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
