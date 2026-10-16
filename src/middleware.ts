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

const RETRY_PAGE = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="6"><title>Un momento</title><style>body{font-family:system-ui,sans-serif;background:#f6f8fc;color:#0f1c34;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px}main{max-width:28rem;background:#fff;border:1px solid #d3ddee;border-radius:12px;padding:28px}h1{font-size:1.25rem;margin:0 0 12px}p{margin:0 0 12px;line-height:1.5}a{color:#2f4266}</style></head><body><main><h1>No se pudo comprobar la sesión</h1><p>La base de datos no respondió. Tu sesión sigue abierta: esta página vuelve a intentar sola en unos segundos.</p><p><a href="">Reintentar ahora</a></p></main></body></html>`;

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const check = await validateSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (check.status === "valida") {
    const response = NextResponse.next();
    // Sin vencimiento programado: mientras se use, la cookie se renueva.
    const ageSeconds = Math.floor(Date.now() / 1000) - check.session.iat;
    if (ageSeconds > SESSION_REFRESH_AFTER_SECONDS) {
      const renewed = await signSession({ ...check.session, iat: Math.floor(Date.now() / 1000) });
      response.cookies.set(SESSION_COOKIE, renewed, sessionCookieOptions());
    }
    return response;
  }

  // Bloque 1.12: la vigencia no se pudo comprobar (base sin responder). No se
  // acepta por las dudas ni se borra la cookie: error recuperable.
  if (check.status === "no_comprobable") {
    const headers = { "Retry-After": "5", "Cache-Control": "no-store" };
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "No se pudo comprobar la sesión en este momento. Volvé a intentar en unos segundos; no hace falta ingresar de nuevo.",
          code: "sesion_no_comprobable",
          reintentar: true,
        },
        { status: 503, headers }
      );
    }
    return new NextResponse(RETRY_PAGE, { status: 503, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error:
          check.status === "revocada"
            ? "La sesión se cerró en todos los dispositivos. Ingresá de nuevo con el PIN."
            : "Sesión requerida. Ingresá con el PIN del panel.",
        code: `sesion_${check.status}`,
      },
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
