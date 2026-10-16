// SOLO para entornos SIN acceso a npm: lo mínimo de "next/server" para
// llamar a las rutas de la API y al middleware en las pruebas. Con las
// dependencias reales (npm ci) se usa el paquete de Next.js.
type CookieInit = { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: string };

class CookiesSalientes {
  constructor(private headers: Headers) {}
  set(name: string, value: string, init: CookieInit = {}) {
    const parts = [`${name}=${value}`];
    if (init.path) parts.push(`Path=${init.path}`);
    if (init.maxAge !== undefined) parts.push(`Max-Age=${init.maxAge}`);
    if (init.httpOnly) parts.push("HttpOnly");
    if (init.secure) parts.push("Secure");
    if (init.sameSite) parts.push(`SameSite=${init.sameSite}`);
    this.headers.append("set-cookie", parts.join("; "));
  }
}

export class NextResponse extends Response {
  cookies = new CookiesSalientes(this.headers);
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
  static next() {
    return new NextResponse(null, { status: 200, headers: { "x-middleware-next": "1" } });
  }
}

class NextURL extends URL {
  clone() {
    return new NextURL(this.href);
  }
}

export class NextRequest extends Request {
  nextUrl: NextURL;
  cookies: { get(name: string): { name: string; value: string } | undefined };
  constructor(input: string | URL, init?: RequestInit) {
    super(input, init);
    this.nextUrl = new NextURL(typeof input === "string" ? input : input.href);
    const header = this.headers.get("cookie") ?? "";
    this.cookies = {
      get(name: string) {
        for (const part of header.split(";")) {
          const [k, ...rest] = part.trim().split("=");
          if (k === name) return { name, value: decodeURIComponent(rest.join("=")) };
        }
        return undefined;
      },
    };
  }
}
