"use client";

/** Campos de ritmo/límite de envío, compartidos entre los distintos
 *  formularios de creación de campaña (el de la pantalla Campañas y el de
 *  selección de contactos dentro de una Base).
 *
 *  El tiempo entre mensajes no es un número fijo: se sortea al azar en cada
 *  envío, entre "mínimo" y "máximo" segundos, para que el ritmo se parezca
 *  al de una persona mandando mensajes a mano (y no siempre el mismo
 *  intervalo exacto, que es un patrón fácil de detectar). Los valores por
 *  defecto (entre 50s y 200s, lotes de 10, pausa de 5min) son el ritmo
 *  "seguro" pedido para no generar bloqueos de WhatsApp. */
export function SendLimitsFields({
  minDelaySeconds,
  onMinDelayChange,
  maxDelaySeconds,
  onMaxDelayChange,
  batchSize,
  onBatchSizeChange,
  batchPauseSeconds,
  onBatchPauseSecondsChange,
  dailyLimit,
  onDailyLimitChange,
}: {
  minDelaySeconds: number;
  onMinDelayChange: (v: number) => void;
  maxDelaySeconds: number;
  onMaxDelayChange: (v: number) => void;
  batchSize: number;
  onBatchSizeChange: (v: number) => void;
  batchPauseSeconds: number;
  onBatchPauseSecondsChange: (v: number) => void;
  dailyLimit: number | "";
  onDailyLimitChange: (v: number | "") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Mínimo de segundos entre mensajes
        </label>
        <input
          type="number"
          min={1}
          value={minDelaySeconds}
          onChange={(e) => onMinDelayChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Máximo de segundos entre mensajes
        </label>
        <input
          type="number"
          min={1}
          value={maxDelaySeconds}
          onChange={(e) => onMaxDelayChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Mensajes por lote (antes de la pausa larga)
        </label>
        <input
          type="number"
          min={1}
          value={batchSize}
          onChange={(e) => onBatchSizeChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Pausa entre lotes (segundos)
        </label>
        <input
          type="number"
          min={1}
          value={batchPauseSeconds}
          onChange={(e) => onBatchPauseSecondsChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Límite de envíos por día
        </label>
        <input
          type="number"
          min={1}
          placeholder="Sin límite"
          value={dailyLimit}
          onChange={(e) => onDailyLimitChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
        />
      </div>
      <p className="col-span-2 text-xs text-slate-400">
        Con los valores de por defecto: cada mensaje nuevo espera un tiempo al azar entre 50 y 200
        segundos desde el anterior (nunca siempre el mismo número), hasta 10 mensajes, y después una
        pausa de 5 minutos antes de seguir con el próximo lote — así se cuida la calidad del número,
        se evitan bloqueos de WhatsApp y el envío se parece más al de una persona mandando mensajes a
        mano. Los envíos los va haciendo el sistema solo en segundo plano una vez que apretás
        &quot;Lanzar&quot;; no hace falta dejar la pantalla abierta.
      </p>
    </div>
  );
}
