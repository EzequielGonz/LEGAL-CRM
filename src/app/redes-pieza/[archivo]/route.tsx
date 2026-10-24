import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { FECHAS_REDES, PLAN_REDES, TIPOS_REDES } from "@/lib/redes/plan-redes";
import { LOGOS_REDES } from "@/lib/redes/logos-redes";
import { FECHAS_REDES_EXTRA, PLAN_REDES_EXTRA, TIPOS_REDES_EXTRA } from "@/lib/redes/plan-redes-extra";

/**
 * Piezas del plan de redes de 15 días (21/10). Cada imagen tiene su dirección
 * pública terminada en .png (no pasa por la sesión, igual que /piezas), para
 * que Metricool la copie al programar. Solo dibuja; no publica nada.
 *
 * Archivo: <rubro>-d<día>-<n>.png  (carrusel n=1..5, posteo n=1)
 *          <rubro>-d<día>-h.png     (historia)
 *          <rubro>-e<día>-<n>.png  y  <rubro>-e<día>-h<1..4>.png  (ampliación del 24/10)
 */
export const dynamic = "force-dynamic";

type Marca = { nombre: string; sub: string; ig: string; bg: string; bg2: string; ink: string; ink2: string; acc: string; accInk: string; serif: boolean; up: boolean; oscuro: boolean; radio: number };

const MARCAS: Record<string, Marca> = {
  vita: { nombre: "VITA Abogados", sub: "Estudio Jurídico", ig: "@estudiojuridicovita", bg: "#F5F4F0", bg2: "#E7E2CE", ink: "#112250", ink2: "#3B507D", acc: "#B8914A", accInk: "#FFFFFF", serif: true, up: false, oscuro: false, radio: 0 },
  cob: { nombre: "Compara tu Obra Social", sub: "Coberturas médicas", ig: "@comparatuobrasocial", bg: "#DAF1DE", bg2: "#BFE3C7", ink: "#0B2B26", ink2: "#235347", acc: "#163832", accInk: "#DAF1DE", serif: false, up: false, oscuro: false, radio: 999 },
  "0km": { nombre: "Automotores Kocos", sub: "Autos 0 km", ig: "@autoskocos", bg: "#000521", bg2: "#011F65", ink: "#FFFFFF", ink2: "#9DB8E6", acc: "#2078CF", accInk: "#FFFFFF", serif: false, up: true, oscuro: true, radio: 999 },
  mkt: { nombre: "Kocos Marketing", sub: "Marketing y automatización", ig: "@kocosmkt", bg: "#1B1B1B", bg2: "#323232", ink: "#FFE7D0", ink2: "#CDB8A6", acc: "#FC6E20", accInk: "#1B1B1B", serif: false, up: false, oscuro: true, radio: 0 },
};

const FONDOS: Record<string, string> = {
  vita: "#F5F4F0",
  cob: "linear-gradient(160deg, #E8F6EA 0%, #DAF1DE 60%)",
  "0km": "radial-gradient(circle at 85% 18%, #0E4EB2 0%, #011F65 35%, #000521 75%)",
  mkt: "#1B1B1B",
};

// ---------- Fuentes (Google Fonts, recortadas al texto de la pieza) ----------
async function fuente(familia: string, peso: number, texto: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familia)}:wght@${peso}&text=${encodeURIComponent(texto)}`;
    const css = await (await fetch(url, { cache: "force-cache" })).text();
    const m = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!m) return null;
    const r = await fetch(m[1], { cache: "force-cache" });
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// ---------- Texto con marcas: <m>acento</m> y <h>resaltado</h> ----------
type Trozo = { t: string; tipo: "n" | "m" | "h" };
function trozos(s: string): Trozo[] {
  const out: Trozo[] = [];
  const re = /<(m|h)>(.*?)<\/\1>/g;
  let i = 0;
  let r: RegExpExecArray | null;
  while ((r = re.exec(s))) {
    if (r.index > i) out.push({ t: s.slice(i, r.index), tipo: "n" });
    out.push({ t: r[2], tipo: r[1] as "m" | "h" });
    i = r.index + r[0].length;
  }
  if (i < s.length) out.push({ t: s.slice(i), tipo: "n" });
  return out;
}
function plano(s: string) {
  return s.replace(/<\/?(m|h)>/g, "");
}

function Titulo({ texto, m, size, family }: { texto: string; m: Marca; size: number; family: string }) {
  const palabras: { w: string; tipo: Trozo["tipo"] }[] = [];
  for (const tr of trozos(m.up ? texto.toUpperCase().replace(/<(\/?)([MH])>/g, (_x, a, b) => `<${a}${b.toLowerCase()}>`) : texto)) {
    for (const w of tr.t.split(/\s+/).filter(Boolean)) palabras.push({ w, tipo: tr.tipo });
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontFamily: family, fontSize: size, fontWeight: m.serif ? 700 : 900, lineHeight: 1.08, letterSpacing: m.serif ? -1 : -2.5 }}>
      {palabras.map((p, k) => {
        const sig = palabras[k + 1];
        const pegado = p.tipo === "h" && sig?.tipo === "h";
        return (
          <span
            key={k}
            style={{
              display: "flex",
              color: p.tipo === "m" ? m.acc : p.tipo === "h" ? m.accInk : m.ink,
              background: p.tipo === "h" ? m.acc : "transparent",
              padding: p.tipo === "h" ? `0 ${pegado ? size * 0.26 : size * 0.12}px 0 ${size * 0.06}px` : 0,
              marginRight: pegado ? 0 : size * 0.24,
              marginBottom: p.tipo === "h" ? 6 : 0,
            }}
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
}

function Marca({ cod, m, chico }: { cod: string; m: Marca; chico?: boolean }) {
  const lado = chico ? 56 : 68;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img alt="" src={LOGOS_REDES[cod]} width={lado} height={lado} style={{ borderRadius: 16, background: m.oscuro ? m.ink : "#FFFFFF", padding: 4 }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: m.ink }}>{m.nombre}</div>
        <div style={{ display: "flex", fontSize: 21, color: m.ink2 }}>{m.sub}</div>
      </div>
    </div>
  );
}

function Puntos({ n, i, m }: { n: number; i: number; m: Marca }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {Array.from({ length: n }).map((_, k) => (
        <div key={k} style={{ display: "flex", height: 8, borderRadius: 8, width: k === i ? 38 : 8, background: k === i ? m.acc : m.ink, opacity: k === i ? 1 : 0.3 }} />
      ))}
    </div>
  );
}

function Etiqueta({ texto, m }: { texto: string; m: Marca }) {
  return <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600, color: m.oscuro || m.serif ? m.acc : m.ink2 }}>{texto}</div>;
}

function Boton({ texto, m, grande }: { texto: string; m: Marca; grande?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: grande ? 36 : 30, fontWeight: 800, background: m.acc, color: m.accInk, padding: grande ? "26px 42px" : "18px 30px", borderRadius: m.radio, ...(m.radio === 0 && m.oscuro ? { boxShadow: `12px 12px 0 ${m.ink}` } : {}) }}>
      {texto}
    </div>
  );
}

function Decoracion({ cod, m, alto }: { cod: string; m: Marca; alto: number }) {
  if (cod === "vita")
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: alto, display: "flex" }}>
        <div style={{ position: "absolute", left: 64, top: 64, right: 64, bottom: 64, border: `2px solid ${m.acc}`, opacity: 0.55, display: "flex" }} />
        <div style={{ position: "absolute", left: 78, top: 78, right: 78, bottom: 78, border: `1px solid ${m.acc}`, opacity: 0.35, display: "flex" }} />
      </div>
    );
  if (cod === "cob")
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: alto, display: "flex" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 540, height: 540, borderRadius: 999, border: `2px solid ${m.ink2}`, opacity: 0.18, display: "flex" }} />
        <div style={{ position: "absolute", right: -40, top: -40, width: 380, height: 380, borderRadius: 999, background: m.ink2, opacity: 0.08, display: "flex" }} />
      </div>
    );
  if (cod === "0km")
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: alto, display: "flex", overflow: "hidden" }}>
        {Array.from({ length: 16 }).map((_, k) => (
          <div key={k} style={{ position: "absolute", left: -300 + k * 110, top: -200, width: 2, height: alto + 400, background: "#2078CF", opacity: 0.06 + (k % 3) * 0.03, transform: "rotate(28deg)", display: "flex" }} />
        ))}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: 1080, height: 10, backgroundImage: "linear-gradient(90deg, #2078CF, #0E4EB2 60%, rgba(0,5,33,0))", display: "flex" }} />
      </div>
    );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: alto, display: "flex" }}>
      <div style={{ position: "absolute", right: 0, top: 130, width: 18, height: 340, background: m.acc, display: "flex" }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 64, display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 4, color: m.ink2, fontWeight: 600 }}>
        <div style={{ display: "flex" }}>/ KOCOS MKT</div>
        <div style={{ display: "flex" }}>2026</div>
      </div>
    </div>
  );
}

function Lienzo({ cod, m, alto, pad, children }: { cod: string; m: Marca; alto: number; pad: string; children: ReactNode }) {
  return (
    <div style={{ width: 1080, height: alto, display: "flex", position: "relative", ...(FONDOS[cod].includes("gradient") ? { backgroundImage: FONDOS[cod] } : { backgroundColor: FONDOS[cod] }), color: m.ink, fontFamily: "Inter" }}>
      <Decoracion cod={cod} m={m} alto={alto} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: alto, padding: pad, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

export async function GET(_req: Request, { params }: { params: { archivo: string } }) {
  const r = /^(vita|cob|0km|mkt)-([de])(\d{1,2})-([1-5]|h[1-4]?)\.png$/.exec(params.archivo);
  if (!r) return new Response("No existe", { status: 404 });
  const [, cod, serie, diaTxt, parteTxt] = r;
  const extra = serie === "e";
  const dia = Number(diaTxt);
  const fechas = extra ? FECHAS_REDES_EXTRA : FECHAS_REDES;
  const tipos: readonly string[] = extra ? TIPOS_REDES_EXTRA : TIPOS_REDES;
  if (dia < 1 || dia > fechas.length) return new Response("No existe", { status: 404 });
  // En el plan original la historia es «h»; en la ampliación hay cuatro por día («h1»..«h4»).
  if (parteTxt.startsWith("h") && (extra ? parteTxt.length !== 2 : parteTxt.length !== 1)) return new Response("No existe", { status: 404 });
  const parte = parteTxt.startsWith("h") ? "h" : parteTxt;
  const plan = (extra ? PLAN_REDES_EXTRA : PLAN_REDES)[cod];
  const m = MARCAS[cod];
  const k = dia - 1;
  const tipo = tipos[k];
  const ih = extra && parte === "h" ? k * 4 + Number(parteTxt.slice(1)) - 1 : k;
  const familiaTitulo = m.serif ? "Lora" : "Inter";
  const padPost = cod === "vita" ? "120px" : "96px";

  let nodo: JSX.Element;
  let alto = 1350;
  let todo = "";

  if (parte === "h") {
    alto = 1920;
    const h = plan.historias[ih];
    todo = `${m.nombre}${m.sub}${h.etq}${plano(h.titulo)}${h.texto}${h.boton}Tocá el botón o respondé esta historia${m.ig}`;
    nodo = (
      <Lienzo cod={cod} m={m} alto={alto} pad="250px 90px 300px 90px">
        <Marca cod={cod} m={m} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <Etiqueta texto={h.etq} m={m} />
          <div style={{ display: "flex", marginTop: 26 }}>
            <Titulo texto={m.up ? h.titulo : h.titulo} m={m} size={cod === "vita" ? 104 : 112} family={familiaTitulo} />
          </div>
          <div style={{ display: "flex", fontSize: 40, lineHeight: 1.4, marginTop: 34, color: m.ink2 }}>{h.texto}</div>
          <div style={{ display: "flex", marginTop: 64 }}>
            <Boton texto={`${h.boton}  →`} m={m} grande />
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 28, color: m.ink2 }}>Tocá el botón o respondé esta historia · {m.ig}</div>
        </div>
      </Lienzo>
    );
  } else if (tipo === "P") {
    if (parte !== "1") return new Response("No existe", { status: 404 });
    const ip = tipos.slice(0, k).filter((t) => t === "P").length;
    const p = plan.posts[ip];
    todo = `${m.nombre}${m.sub}${p.etq}${plano(p.titulo)}${p.texto}WhatsApp ${plan.wa}${plan.web}`;
    nodo = (
      <Lienzo cod={cod} m={m} alto={alto} pad={padPost}>
        <Marca cod={cod} m={m} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <Etiqueta texto={p.etq} m={m} />
          <div style={{ display: "flex", marginTop: 26 }}>
            <Titulo texto={p.titulo} m={m} size={cod === "vita" ? 100 : 108} family={familiaTitulo} />
          </div>
          <div style={{ display: "flex", fontSize: 38, lineHeight: 1.38, marginTop: 34, color: m.ink2, maxWidth: 840 }}>{p.texto}</div>
        </div>
        <div style={{ display: "flex", marginTop: "auto", paddingTop: 40, justifyContent: "space-between", alignItems: "center" }}>
          <Boton texto={`WhatsApp ${plan.wa}`} m={m} />
          <div style={{ display: "flex", fontSize: 26, color: m.ink2 }}>{plan.web}</div>
        </div>
      </Lienzo>
    );
  } else {
    const ic = tipos.slice(0, k).filter((t) => t === "C").length;
    const c = plan.carruseles[ic];
    const n = 5;
    const i = Number(parte) - 1;
    if (i === 0) {
      todo = `${m.nombre}${m.sub}${c.etq}${plano(c.gancho)}${c.apoyo}Deslizá →`;
      nodo = (
        <Lienzo cod={cod} m={m} alto={alto} pad={padPost}>
          <Marca cod={cod} m={m} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <Etiqueta texto={c.etq} m={m} />
            <div style={{ display: "flex", marginTop: 26 }}>
              <Titulo texto={c.gancho} m={m} size={cod === "vita" ? 104 : 112} family={familiaTitulo} />
            </div>
            <div style={{ display: "flex", fontSize: 36, lineHeight: 1.38, marginTop: 34, color: m.ink2, maxWidth: 840 }}>{c.apoyo}</div>
          </div>
          <div style={{ display: "flex", marginTop: "auto", paddingTop: 40, justifyContent: "space-between", alignItems: "center" }}>
            <Puntos n={n} i={0} m={m} />
            <Boton texto="Deslizá  →" m={m} />
          </div>
        </Lienzo>
      );
    } else if (i < 4) {
      const l = c.laminas[i - 1];
      todo = `${m.ig}${i + 1}/${n}0${i}${l.t}${l.x}`;
      nodo = (
        <Lienzo cod={cod} m={m} alto={alto} pad={padPost}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 600, color: m.ink2, marginTop: cod === "mkt" ? 40 : 0 }}>
            <div style={{ display: "flex" }}>{m.ig}</div>
            <div style={{ display: "flex" }}>{`${i + 1}/${n}`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: "auto" }}>
            <div style={{ display: "flex", fontFamily: familiaTitulo, fontSize: 280, fontWeight: m.serif ? 700 : 900, lineHeight: 0.9, color: m.acc, opacity: m.oscuro ? 0.9 : 1 }}>{`0${i}`}</div>
            <div style={{ display: "flex", marginTop: 40 }}>
              <Titulo texto={l.t} m={m} size={84} family={familiaTitulo} />
            </div>
            <div style={{ display: "flex", fontSize: 44, lineHeight: 1.42, marginTop: 34, color: m.ink2, maxWidth: 860 }}>{l.x}</div>
          </div>
          <Puntos n={n} i={i} m={m} />
        </Lienzo>
      );
    } else {
      todo = `${m.nombre}${m.sub}${c.ct}${c.cx}${c.boton}WhatsApp ${plan.wa} · ${m.ig}Guardalo para tenerlo a mano`;
      nodo = (
        <Lienzo cod={cod} m={m} alto={alto} pad={padPost}>
          <Marca cod={cod} m={m} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <Titulo texto={c.ct} m={m} size={96} family={familiaTitulo} />
            <div style={{ display: "flex", fontSize: 38, lineHeight: 1.4, marginTop: 30, color: m.ink2, maxWidth: 840 }}>{c.cx}</div>
            <div style={{ display: "flex", marginTop: 56 }}>
              <Boton texto={c.boton} m={m} grande />
            </div>
            <div style={{ display: "flex", marginTop: 30, fontSize: 28, color: m.ink2 }}>{`WhatsApp ${plan.wa} · ${m.ig}`}</div>
          </div>
          <div style={{ display: "flex", marginTop: "auto", paddingTop: 40, justifyContent: "space-between", alignItems: "center", fontSize: 24, color: m.ink2 }}>
            <div style={{ display: "flex" }}>Guardalo para tenerlo a mano</div>
            <Puntos n={n} i={n - 1} m={m} />
          </div>
        </Lienzo>
      );
    }
  }

  const texto = `${todo}${todo.toUpperCase()}0123456789/·→«»¿?¡!.,:;-`;
  const [i4, i6, i8, i9, lora] = await Promise.all([
    fuente("Inter", 400, texto),
    fuente("Inter", 600, texto),
    fuente("Inter", 800, texto),
    fuente("Inter", 900, texto),
    m.serif ? fuente("Lora", 700, texto) : Promise.resolve(null),
  ]);
  const fonts = [
    i4 && { name: "Inter", data: i4, weight: 400 as const, style: "normal" as const },
    i6 && { name: "Inter", data: i6, weight: 600 as const, style: "normal" as const },
    i8 && { name: "Inter", data: i8, weight: 800 as const, style: "normal" as const },
    i9 && { name: "Inter", data: i9, weight: 900 as const, style: "normal" as const },
    lora && { name: "Lora", data: lora, weight: 700 as const, style: "normal" as const },
  ].filter(Boolean) as any[];

  // Se dibuja completo antes de responder: si algo falla, se ve el motivo en vez de un 500 mudo.
  try {
    const img = new ImageResponse(nodo, { width: 1080, height: alto, fonts });
    const buf = await img.arrayBuffer();
    return new Response(buf, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (err: any) {
    return new Response(`No se pudo dibujar: ${String(err?.message ?? err).slice(0, 400)} (fuentes: ${fonts.length})`, { status: 500 });
  }
}
