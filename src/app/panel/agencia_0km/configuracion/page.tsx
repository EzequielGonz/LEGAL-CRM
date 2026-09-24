import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function Configuracion0kmPage() {
  const supabase = createClient();
  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("area", "agencia_0km")
    .order("type");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Configuración — Agencia 0KM</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Canales</h2>
        <p className="mb-3 text-xs text-slate-400">
          El estado de conexión se actualiza automáticamente al configurar las credenciales en
          las variables de entorno del servidor en Vercel (WHATSAPP_AGENCIA_0KM_PHONE_NUMBER_ID /
          WHATSAPP_AGENCIA_0KM_ACCESS_TOKEN).
        </p>
        <ul className="divide-y divide-slate-100">
          {(channels ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <AreaBadge area={c.area} />
                <span className="text-slate-700">{c.label}</span>
              </div>
              <span
                className={`text-xs font-medium ${
                  c.is_connected ? "text-green-600" : "text-slate-400"
                }`}
              >
                {c.is_connected ? "Conectado" : "Sin conectar"}
              </span>
            </li>
          ))}
          {(channels ?? []).length === 0 && (
            <li className="py-2 text-sm text-slate-400">Sin canales cargados.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
