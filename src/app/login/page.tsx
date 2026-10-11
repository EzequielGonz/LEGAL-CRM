import { ensurePinState } from "@/lib/acceso/pin";
import { PinLoginForm } from "@/components/acceso/pin-login-form";

export const dynamic = "force-dynamic";

/**
 * Ingreso con el PIN general compartido (6 dígitos). No hay cuentas
 * personales ni recuperación por correo: el PIN se cambia desde
 * Configuración (pidiendo el actual) y se recupera desde la configuración
 * privada del servidor (ACCESS_PIN_RESET).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  let configured = true;
  try {
    configured = (await ensurePinState()).configured;
  } catch (err) {
    console.error("[login] No se pudo leer el estado del PIN:", err);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      {/* Glow decorativo dorado, puramente ambiental */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 animate-float rounded-full bg-gold-500/10 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />
      <PinLoginForm configured={configured} next={searchParams?.next ?? null} />
    </div>
  );
}
