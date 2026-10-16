import { ensurePinState } from "@/lib/acceso/pin";
import { PinLoginForm } from "@/components/acceso/pin-login-form";
import { LamparaIngreso } from "@/components/acceso/lampara-ingreso";

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

  // Escena «lámpara» (16/10): solo visual; el ingreso sigue siendo con el PIN.
  return (
    <LamparaIngreso>
      <PinLoginForm configured={configured} next={searchParams?.next ?? null} />
    </LamparaIngreso>
  );
}
