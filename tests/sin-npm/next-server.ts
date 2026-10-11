// SOLO para entornos SIN acceso a npm: lo mínimo de "next/server" para
// llamar a las rutas de la API en las pruebas. Con las dependencias reales
// (npm ci) se usa el paquete de Next.js.
export class NextResponse extends Response {
  static json(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    return new NextResponse(JSON.stringify(body), {
      status: init?.status ?? 200,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  }
  static redirect(url: string | URL, init?: number | { status?: number; headers?: Record<string, string> }) {
    const status = typeof init === "number" ? init : init?.status ?? 307;
    const headers = new Headers(typeof init === "object" ? init.headers : undefined);
    headers.set("Location", String(url));
    return new NextResponse(null, { status, headers });
  }
}
export type NextRequest = Request;
