"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Ciudades principales de Argentina (capitales provinciales y grandes centros urbanos).
const CIUDADES_ARGENTINA = [
  "Ciudad Autónoma de Buenos Aires",
  "La Plata",
  "Mar del Plata",
  "Bahía Blanca",
  "Quilmes",
  "Lomas de Zamora",
  "Lanús",
  "San Isidro",
  "Vicente López",
  "Tigre",
  "Morón",
  "La Matanza",
  "Pilar",
  "Córdoba",
  "Villa Carlos Paz",
  "Río Cuarto",
  "Rosario",
  "Santa Fe",
  "Rafaela",
  "Mendoza",
  "San Juan",
  "San Luis",
  "Tucumán",
  "Salta",
  "San Salvador de Jujuy",
  "Santiago del Estero",
  "Catamarca",
  "La Rioja",
  "Corrientes",
  "Resistencia",
  "Posadas",
  "Formosa",
  "Paraná",
  "Neuquén",
  "Bariloche",
  "Santa Rosa La Pampa",
  "Viedma",
  "Trelew",
  "Comodoro Rivadavia",
  "Río Gallegos",
  "Ushuaia",
];

/** Carga muchas búsquedas de Google Maps de una vez (una por ciudad) para el barrido nacional. */
export function ScrapeQueueForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rubro, setRubro] = useState("");
  const [cantidad, setCantidad] = useState(40);
  const [zonasText, setZonasText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const zonas = Array.from(new Set(zonasText.split("\n").map((z) => z.trim()).filter(Boolean)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOkMessage(null);
    const res = await fetch("/api/marketing/scraping/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rubro, zonas, cantidad }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || data.error) {
      setError(data.error ?? "No se pudo cargar la cola.");
      return;
    }
    setOkMessage(`Listo: ${data.encoladas} búsquedas en cola. Se van corriendo solas, una por vez.`);
    setZonasText("");
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
      <button type="button" onClick={() => setOpen(!open)} className="text-sm font-semibold text-slate-800">
        {open ? "▾" : "▸"} Barrido masivo (varias ciudades a la vez)
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <p className="text-xs text-slate-500">
            Cargá un rubro y una lista de ciudades: se crea una búsqueda por ciudad y el sistema las corre solas, de a una,
            analizando los negocios a medida que entran. Cada búsqueda consume créditos de tu cuenta de Outscraper.
          </p>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Rubro</label>
              <input
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                placeholder="Ej: peluquerías"
                required
                className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Negocios por ciudad (máx. 60)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500">Ciudades (una por línea)</label>
              <button
                type="button"
                onClick={() => setZonasText(CIUDADES_ARGENTINA.join("\n"))}
                className="text-xs text-blue-600 hover:underline"
              >
                Cargar las {CIUDADES_ARGENTINA.length} ciudades principales de Argentina
              </button>
            </div>
            <textarea
              value={zonasText}
              onChange={(e) => setZonasText(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus-gold"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading || zonas.length === 0 || !rubro.trim()} className="btn-gold">
              {loading ? "Cargando…" : `Poner en cola ${zonas.length} búsqueda(s)`}
            </button>
            {zonas.length > 0 && (
              <span className="text-xs text-slate-400">Hasta {zonas.length * cantidad} negocios en total</span>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {okMessage && <p className="text-sm text-green-700">{okMessage}</p>}
        </form>
      )}
    </div>
  );
}
