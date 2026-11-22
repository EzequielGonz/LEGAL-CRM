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
  // 22/11 (lista del 20/11, punto i): una sola línea; en el celular ocupaba media pantalla.
  return (
    <div role="status" className="aviso-codigo">
      <p>
        <span className="d-luz" data-estado="aviso" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Cambiá el código de ingreso</strong> por uno de 8 números.
        </span>
      </p>
      <Link href="/configuracion#acceso">Cambiar el código</Link>
    </div>
  );
}
