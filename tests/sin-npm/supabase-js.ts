// SOLO para entornos SIN acceso a npm (donde no se puede instalar
// @supabase/supabase-js). Imita las llamadas HTTP del cliente real a la API
// (PostgREST) y a Storage, para correr las mismas pruebas con la red
// simulada. La verificación oficial usa el paquete real (npm ci): ver
// tests/README.md. Nunca se usa en la aplicación.

type Result = { data: any; error: any; count: number | null; status: number };

function quote(v: unknown): string {
  const s = String(v);
  return /[,()"\s]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

class Query implements PromiseLike<Result> {
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private filters: [string, string][] = [];
  private selectCols: string | null = null;
  private body: unknown = undefined;
  private prefer: string[] = [];
  private countMode: string | null = null;
  private head = false;
  private singleMode: "one" | "maybe" | null = null;
  private orderParts: string[] = [];
  private rangeFrom?: number;
  private rangeTo?: number;
  private limitN?: number;
  private onConflict?: string;

  constructor(private url: string, private key: string, private path: string) {}

  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    this.selectCols = cols.replace(/\s+/g, "");
    if (opts?.count) this.countMode = opts.count;
    if (opts?.head) this.head = true;
    if (this.method !== "GET") this.prefer.push("return=representation");
    return this;
  }
  insert(rows: unknown) {
    this.method = "POST";
    this.body = rows;
    return this;
  }
  upsert(rows: unknown, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.method = "POST";
    this.body = rows;
    this.prefer.push(`resolution=${opts?.ignoreDuplicates ? "ignore" : "merge"}-duplicates`);
    if (opts?.onConflict) this.onConflict = opts.onConflict;
    return this;
  }
  update(values: unknown) {
    this.method = "PATCH";
    this.body = values;
    return this;
  }
  delete() {
    this.method = "DELETE";
    return this;
  }
  eq(c: string, v: unknown) {
    this.filters.push([c, `eq.${v}`]);
    return this;
  }
  neq(c: string, v: unknown) {
    this.filters.push([c, `neq.${v}`]);
    return this;
  }
  is(c: string, v: unknown) {
    this.filters.push([c, `is.${v === null ? "null" : v}`]);
    return this;
  }
  in(c: string, vals: unknown[]) {
    this.filters.push([c, `in.(${vals.map(quote).join(",")})`]);
    return this;
  }
  not(c: string, op: string, v: unknown) {
    this.filters.push([c, `not.${op}.${v === null ? "null" : v}`]);
    return this;
  }
  gt(c: string, v: unknown) {
    this.filters.push([c, `gt.${v}`]);
    return this;
  }
  gte(c: string, v: unknown) {
    this.filters.push([c, `gte.${v}`]);
    return this;
  }
  lt(c: string, v: unknown) {
    this.filters.push([c, `lt.${v}`]);
    return this;
  }
  lte(c: string, v: unknown) {
    this.filters.push([c, `lte.${v}`]);
    return this;
  }
  like(c: string, pattern: string) {
    this.filters.push([c, `like.${pattern}`]);
    return this;
  }
  or(expr: string, opts?: { referencedTable?: string; foreignTable?: string }) {
    const tabla = opts?.referencedTable ?? opts?.foreignTable;
    this.filters.push([tabla ? `${tabla}.or` : "or", `(${expr})`]);
    return this;
  }
  contains(c: string, v: unknown) {
    this.filters.push([c, `cs.${typeof v === "string" ? v : JSON.stringify(v)}`]);
    return this;
  }
  ilike(c: string, pattern: string) {
    this.filters.push([c, `ilike.${pattern}`]);
    return this;
  }
  filter(c: string, op: string, v: unknown) {
    this.filters.push([c, `${op}.${v === null ? "null" : v}`]);
    return this;
  }
  order(c: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    const dir = opts?.ascending === false ? "desc" : "asc";
    const nulls = opts?.nullsFirst === undefined ? "" : opts.nullsFirst ? ".nullsfirst" : ".nullslast";
    this.orderParts.push(`${c}.${dir}${nulls}`);
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }
  single() {
    this.singleMode = "one";
    return this;
  }
  then<T1 = Result, T2 = never>(ok?: ((v: Result) => T1 | PromiseLike<T1>) | null, ko?: ((e: any) => T2 | PromiseLike<T2>) | null) {
    return this.exec().then(ok, ko);
  }

  private async exec(): Promise<Result> {
    const params = new URLSearchParams();
    if (this.selectCols) params.set("select", this.selectCols);
    for (const [k, v] of this.filters) params.append(k, v);
    if (this.orderParts.length) params.set("order", this.orderParts.join(","));
    if (this.limitN !== undefined) params.set("limit", String(this.limitN));
    if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
      params.set("offset", String(this.rangeFrom));
      params.set("limit", String(this.rangeTo - this.rangeFrom + 1));
    }
    if (this.onConflict) params.set("on_conflict", this.onConflict);
    // Igual que postgrest-js: en inserciones en lote declara la unión de
    // columnas (las que faltan en un objeto quedan en null).
    if (this.method === "POST" && Array.isArray(this.body)) {
      const cols = [...new Set((this.body as Record<string, unknown>[]).flatMap((o) => Object.keys(o)))];
      if (cols.length) params.set("columns", cols.map((c) => `"${c}"`).join(","));
    }
    const headers: Record<string, string> = {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      "Content-Type": "application/json",
    };
    const prefer = [...this.prefer];
    if (this.countMode) prefer.push(`count=${this.countMode}`);
    if (prefer.length) headers.Prefer = prefer.join(",");
    const res = await fetch(`${this.url}/rest/v1/${this.path}?${params}`, {
      method: this.head ? "HEAD" : this.method,
      headers,
      body: this.body !== undefined ? JSON.stringify(this.body) : undefined,
    });
    const range = res.headers.get("content-range");
    const count = range && range.includes("/") && range.split("/")[1] !== "*" ? Number(range.split("/")[1]) : null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error: { message: err.message, code: err.code, details: err.details }, count, status: res.status };
    }
    let data: any = null;
    if (!this.head && res.status !== 204) {
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    }
    if (this.singleMode) {
      const arr = Array.isArray(data) ? data : data ? [data] : [];
      if (arr.length === 0) {
        return this.singleMode === "maybe"
          ? { data: null, error: null, count, status: res.status }
          : { data: null, error: { message: "sin filas", code: "PGRST116" }, count, status: 406 };
      }
      if (arr.length > 1) return { data: null, error: { message: "más de una fila", code: "PGRST116" }, count, status: 406 };
      data = arr[0];
    }
    return { data, error: null, count, status: res.status };
  }
}

class Bucket {
  constructor(private url: string, private key: string, private bucket: string) {}
  private headers(extra: Record<string, string> = {}) {
    return { apikey: this.key, Authorization: `Bearer ${this.key}`, ...extra };
  }
  async upload(path: string, body: unknown, opts: { contentType?: string; upsert?: boolean; cacheControl?: string } = {}) {
    const res = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${path}`, {
      method: "POST",
      headers: this.headers({
        "x-upsert": String(opts.upsert ?? false),
        "content-type": opts.contentType ?? "text/plain;charset=UTF-8",
        "cache-control": `max-age=${opts.cacheControl ?? "3600"}`,
      }),
      body: body as any,
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { data: { path, id: data.Id, fullPath: data.Key }, error: null } : { data: null, error: data };
  }
  async createSignedUrl(path: string, expiresIn: number, opts?: { download?: string | boolean }) {
    const res = await fetch(`${this.url}/storage/v1/object/sign/${this.bucket}/${path}`, {
      method: "POST",
      headers: this.headers({ "content-type": "application/json" }),
      body: JSON.stringify({ expiresIn }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: data };
    const download = opts?.download ? `&download=${opts.download === true ? "" : opts.download}` : "";
    return { data: { signedUrl: encodeURI(`${this.url}/storage/v1${data.signedURL}${download}`) }, error: null };
  }
}

export function createClient(url: string, key: string, _opts?: unknown) {
  return {
    from: (table: string) => new Query(url, key, table),
    storage: { from: (bucket: string) => new Bucket(url, key, bucket) },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(args ?? {}),
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { message: text };
      }
      if (!res.ok) return { data: null, error: { message: json?.message ?? res.statusText, code: json?.code } };
      return { data: json, error: null };
    },
  };
}

export type SupabaseClient = ReturnType<typeof createClient>;
