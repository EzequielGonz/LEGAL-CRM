import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_REFRESH_AFTER_SECONDS,
  sessionCookieOptions,
  signSession,
  validateSession,
} from "@/lib/acceso/session";

/**
 * Acceso con PIN general compartido (Etapa 1 · bloque 1.1).
 *
 * Todo el panel y toda la API requieren sesión, salvo lo que por naturaleza
 * llega de afuera y tiene su propia verificación:
 * - /login y /api/acceso/ingresar (para poder ingresar);
 * - /api/webhooks/* (Meta/WhatsApp: se verifica la firma X-Hub-Signature-256);
 * - /api/campaigns/tick (tarea programada: se verifica CRON_SECRET);
 * - /landing y /api/landing (formulario público, con límite por origen);
 * - archivos de la app instalable (manifiesto, service worker, íconos).
 */
const PUBLIC_PATHS: RegExp[] = [
  /^\/login\/?$/,
  /^\/api\/acceso\/ingresar\/?$/,
  /^\/api\/webhooks\//,
  /^\/api\/campaigns\/tick\/?$/,
  /^\/landing\/?$/,
  /^\/api\/landing\/?$/,
  /^\/manifest\.webmanifest$/,
  /^\/sw\.js$/,
  /^\/offline\.html$/,
  /^\/iconos\//,
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const session = await validateSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (session) {
    const response = NextResponse.next();
    // Sin vencimiento programado: mientras se use, la cookie se renueva.
    const ageSeconds = Math.floor(Date.now() / 1000) - session.iat;
    if (ageSeconds > SESSION_REFRESH_AFTER_SECONDS) {
      const renewed = await signSession({ ...session, iat: Math.floor(Date.now() / 1000) });
      response.cookies.set(SESSION_COOKIE, renewed, sessionCookieOptions());
    }
    return response;
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Sesión requerida. Ingresá con el PIN del panel." },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  if (pathname !== "/" && pathname !== "/inicio") {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
