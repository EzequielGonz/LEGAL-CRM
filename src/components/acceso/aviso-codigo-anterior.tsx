import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSignedSession } from "@/lib/acceso/session";

/**
 * 15/11 (decisión de la responsable): si se ingresó con el código anterior de
 * 6 números, un aviso pide cambiarlo por uno de 8. Desaparece al ingresar con
 * el código nuevo.
 */
export async function AvisoCodigoAnterior() {
  let c6 = false;
  try {
    const s = await readSignedSession((await cookies()).get(SESSION_COOKIE)?.value);
    c6 = !!s?.c6;
  } catch {
    c6 = false;
  }
  if (!c6) return null;
  return (
    <div role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>
        <strong>Cambiá el código de ingreso.</strong> El de 6 números todavía sirve, pero los nuevos tienen 8 y son más seguros.
      </p>
      <Link href="/configuracion#acceso" className="mt-1 inline-flex min-h-[44px] items-center font-semibold underline underline-offset-2">
        Cambiar el código
      </Link>
    </div>
  );
}
