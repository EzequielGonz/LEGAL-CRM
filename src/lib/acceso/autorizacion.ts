import { NextResponse } from "next/server";
import { SESSION_COOKIE, validateSession, type SessionCheck, type SessionPayload } from "@/lib/acceso/session";

/**
 * Comprobación de sesión dentro de cada operación privada del servidor
 * (Etapa 1 · bloque 1.12). El middleware ya corta lo que llega sin sesión,
 * pero cada ruta vuelve a comprobarla por su cuenta: así una ruta nueva,
 * un cambio en el middleware o una llamada que lo esquive no dejan pasar
 * una operación sin sesión.
 *
 * Resultados:
 *  - sin cookie, cookie alterada o sesión revocada → 401 (hay que ingresar);
 *  - vigencia no comprobable (la base no respondió) → 503 recuperable, con
 *    Retry-After y SIN borrar la cookie: cuando la base vuelve, la misma
 *    sesión sigue valiendo. La política de permanencia no cambia.
 */

export const SESSION_UNAVAILABLE_MESSAGE =
  "No se pudo comprobar la sesión en este momento. Volvé a intentar en unos segundos; no hace falta ingresar de nuevo.";
export const SESSION_REQUIRED_MESSAGE = "Sesión requerida. Ingresá con el PIN del panel.";
export const SESSION_REVOKED_MESSAGE = "La sesión se cerró en todos los dispositivos. Ingresá de nuevo con el PIN.";

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function sessionFailureResponse(check: Exclude<SessionCheck, { status: "valida" }>): NextResponse {
  if (check.status === "no_comprobable") {
    return NextResponse.json(
      { error: SESSION_UNAVAILABLE_MESSAGE, code: "sesion_no_comprobable", reintentar: true },
      { status: 503, headers: { "Retry-After": "5", "Cache-Control": "no-store" } }
    );
  }
  const message = check.status === "revocada" ? SESSION_REVOKED_MESSAGE : SESSION_REQUIRED_MESSAGE;
  return NextResponse.json(
    { error: message, code: `sesion_${check.status}` },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export type SessionGuard = { ok: true; session: SessionPayload } | { ok: false; status: SessionCheck["status"]; response: NextResponse };

/**
 * Para rutas de la API. Uso:
 *   const auth = await requireSession(request);
 *   if (!auth.ok) return auth.response;
 */
export async function requireSession(request: Request): Promise<SessionGuard> {
  const check = await validateSession(readCookie(request, SESSION_COOKIE));
  if (check.status === "valida") return { ok: true, session: check.session };
  return { ok: false, status: check.status, response: sessionFailureResponse(check) };
}
