"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Carga del presupuesto (16/10): sube el archivo directo al almacenamiento
 * privado (enlace firmado de un solo uso) y, con el PIN, lo envía: con la
 * ventana de 24 h abierta sale en el momento; si no, sale la plantilla de
 * aviso y el archivo se manda apenas la persona responda.
 * Desde el 21/10 se puede programar día y hora (Buenos Aires) para que salga solo.
 */
export function CargarPresupuesto({ budgetId, minimo, sugerido }: { budgetId: string; minimo: string; sugerido: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [extras, setExtras] = useState<File[]>([]);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [alcance, setAlcance] = useState("");
  const [plazo, setPlazo] = useState("");
  const [notas, setNotas] = useState("");
  const [pin, setPin] = useState("");
  const [modo, setModo] = useState<"ahora" | "programar">("ahora");
  const [cuando, setCuando] = useState(sugerido);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
          setMsg({ ok: false, text: "El archivo supera 15 MB." });
          return;
        }
        setBusy(true);
        setMsg(null);
        try {
          const r1 = await fetch("/api/marketing/presupuestos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "subida", budgetId, nombre: file.name }) });
          const d1 = await r1.json().catch(() => ({}));
          if (!r1.ok) throw new Error(d1.error ?? "No se pudo preparar la subida.");
          const { error } = await createClient().storage.from("presupuestos").uploadToSignedUrl(d1.path, d1.token, file);
          if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);
          // Fotos o videos que acompañan (22/10).
          const adjuntos: { path: string; nombre: string }[] = [];
          for (const x of extras) {
            const esVideo = x.type.startsWith("video/");
            if (x.size > (esVideo ? 16 : 5) * 1024 * 1024) throw new Error(`${x.name}: supera ${esVideo ? "16" : "5"} MB (límite de WhatsApp).`);
            const rx = await fetch("/api/marketing/presupuestos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "subida_extra", budgetId, nombre: x.name }) });
            const dx = await rx.json().catch(() => ({}));
            if (!rx.ok) throw new Error(dx.error ?? `No se pudo preparar ${x.name}.`);
            const { error: ex } = await createClient().storage.from(dx.bucket).uploadToSignedUrl(dx.path, dx.token, x);
            if (ex) throw new Error(`No se pudo subir ${x.name}: ${ex.message}`);
            adjuntos.push({ path: dx.path, nombre: x.name });
          }
          const r2 = await fetch("/api/marketing/presupuestos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accion: "enviar",
              budgetId,
              path: d1.path,
              nombre: file.name,
              mime: file.type,
              monto: monto ? Number(monto.replace(/\./g, "").replace(",", ".")) : undefined,
              moneda,
              alcance,
              plazo,
              notas,
              programadoPara: modo === "programar" ? cuando : undefined,
              adjuntos,
              pin,
            }),
          });
          const d2 = await r2.json().catch(() => ({}));
          if (!r2.ok) throw new Error(d2.error ?? "No se pudo enviar.");
          setMsg({ ok: true, text: d2.detalle ?? "Listo." });
          router.refresh();
        } catch (err: any) {
          setMsg({ ok: false, text: String(err?.message ?? err) });
        } finally {
          setBusy(false);
          setPin("");
        }
      }}
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">Archivo del presupuesto (PDF, imagen, Word o Excel)</span>
        <input type="file" required accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-700">Fotos o videos que acompañan (opcional, hasta 10)</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/3gpp,video/quicktime" onChange={(e) => setExtras(Array.from(e.target.files ?? []).slice(0, 10))} className="block w-full text-sm" />
        {extras.length > 0 && <span className="mt-0.5 block text-xs text-slate-600">{extras.length} archivo(s): salen después del presupuesto.</span>}
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-700">Total</span>
          <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" placeholder="Ej.: 350000" className="tactil w-full rounded-lg border border-slate-300 px-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-700">Moneda</span>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className="tactil w-full rounded-lg border border-slate-300 bg-white px-2">
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-700">Plazo de entrega</span>
          <input value={plazo} onChange={(e) => setPlazo(e.target.value)} placeholder="Ej.: 15 días hábiles" className="tactil w-full rounded-lg border border-slate-300 px-2" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-slate-700">Alcance (qué incluye)</span>
        <textarea value={alcance} onChange={(e) => setAlcance(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-1" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-slate-700">Notas internas (no se envían)</span>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={1} className="w-full rounded-lg border border-slate-300 px-2 py-1" />
      </label>
      <fieldset className="rounded-lg border border-slate-200 bg-white p-2">
        <legend className="px-1 text-xs font-medium text-slate-700">¿Cuándo se lo mandamos?</legend>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name={`modo-${budgetId}`} checked={modo === "ahora"} onChange={() => setModo("ahora")} />
            Ahora
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name={`modo-${budgetId}`} checked={modo === "programar"} onChange={() => setModo("programar")} />
            Programar día y hora
          </label>
        </div>
        {modo === "programar" && (
          <label className="mt-2 block">
            <span className="mb-1 block text-xs text-slate-700">Día y hora (hora de Buenos Aires)</span>
            <input type="datetime-local" required value={cuando} min={minimo} onChange={(e) => setCuando(e.target.value)} className="tactil rounded-lg border border-slate-300 px-2" />
            <span className="mt-0.5 block text-xs text-slate-500">Se admite de lunes a sábado de 8 a 21. Si el cliente escribe antes, sale en ese momento y la IA retoma la venta. Si a la hora elegida la ventana de 24 h está cerrada, sale la plantilla de aviso.</span>
          </label>
        )}
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" placeholder="PIN" required aria-label="PIN" className="tactil w-28 rounded-lg border border-slate-300 px-2" />
        <button type="submit" disabled={busy || !file} className="tactil rounded-lg bg-slate-900 px-4 text-sm font-semibold text-gold-100 disabled:opacity-60">
          {busy ? "Guardando…" : modo === "programar" ? "Cargar y programar" : "Cargar y enviar"}
        </button>
      </div>
      <p role="status" aria-live="polite" className={msg ? (msg.ok ? "text-emerald-700" : "font-medium text-red-700") : "sr-only"}>
        {msg?.text ?? ""}
      </p>
    </form>
  );
}
