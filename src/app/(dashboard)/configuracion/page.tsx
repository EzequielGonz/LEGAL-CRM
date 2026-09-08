import { createClient } from "@/lib/supabase/server";
import { AreaBadge } from "@/components/ui/badge";
import { StudioForm } from "@/components/configuracion/studio-form";
import { AdminPhoneForm } from "@/components/configuracion/admin-phone-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = createClient();

  const [{ data: channels }, { data: studios }, { data: userResp }] = await Promise.all([
    supabase.from("channels").select("*").order("area").order("type"),
    supabase.from("studios").select("*").order("area"),
    supabase.auth.getUser(),
  ]);

  let adminPhone: string | null = null;
  if (userResp.user) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("phone")
      .eq("id", userResp.user.id)
      .maybeSingle();
    adminPhone = profile?.phone ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Notificaciones</h2>
        <AdminPhoneForm initialPhone={adminPhone} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Canales</h2>
        <p className="mb-3 text-xs text-slate-400">
          El estado de conexión se actualiza automáticamente al configurar las credenciales en
          las variables de entorno del servidor (ver Configuración → guía de Meta API).
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
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Estudios jurídicos</h2>
        <ul className="divide-y divide-slate-100">
          {(studios ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2">
                <AreaBadge area={s.area} />
                <span className="text-slate-700">{s.name}</span>
              </div>
              <span className="text-xs text-slate-400">{s.contact_phone}</span>
            </li>
          ))}
          {(studios ?? []).length === 0 && (
            <li className="py-2 text-sm text-slate-400">Sin estudios cargados.</li>
          )}
        </ul>
        <StudioForm />
      </div>
    </div>
  );
}
