import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, validateSession, type SessionPayload } from "@/lib/acceso/session";

/**
 * Comprobación de sesión en las pantallas privadas del servidor (bloque
 * 1.12), además del middleware. Se llama al principio de cada layout o
 * página raíz privada:
 *
 *   const sesion = await requirePageSession();
 *   if (!sesion.ok) return sesion.fallback;
 *
 * Sin sesión, cookie inválida o sesión revocada → se redirige al ingreso.
 * Vigencia no comprobable (la base no respondió) → se muestra un aviso
 * que reintenta solo, sin borrar la cookie.
 */
export type PageSession = { ok: true; session: SessionPayload } | { ok: false; fallback: JSX.Element };

export async function requirePageSession(): Promise<PageSession> {
  const check = await validateSession(cookies().get(SESSION_COOKIE)?.value);
  if (check.status === "valida") return { ok: true, session: check.session };
  if (check.status === "no_comprobable") return { ok: false, fallback: <SesionNoComprobable /> };
  redirect("/login");
}

export function SesionNoComprobable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6" aria-live="polite">
      <meta httpEquiv="refresh" content="6" />
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-7">
        <h1 className="text-xl font-semibold text-slate-900">No se pudo comprobar la sesión</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          La base de datos no respondió. Tu sesión sigue abierta: esta pantalla vuelve a intentar sola en unos segundos.
        </p>
        <a href="" className="mt-4 inline-block text-sm font-medium text-slate-700 underline">
          Reintentar ahora
        </a>
      </div>
    </main>
  );
}
