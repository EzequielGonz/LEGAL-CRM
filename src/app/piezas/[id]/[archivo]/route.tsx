import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS } from "@/lib/rubros";
import { marcaDe, normalizarColores, type SlugPerfil } from "@/lib/marca";

export const dynamic = "force-dynamic";

/**
 * Imagen de una pieza de contenido (18/10): placa con la marca del perfil y
 * el titular. Termina en .png, así Metricool, Instagram y Facebook la leen
 * sin sesión; el identificador de la pieza no se puede adivinar y la pieza
 * es para publicar. Solo se dibujan piezas que no estén canceladas.
 * Cuadrada (1080) para publicaciones y carruseles; vertical (1080 × 1920)
 * para historias.
 */
const SLUG_POR_ID = Object.fromEntries(Object.entries(RUBRO_IDS).map(([k, v]) => [v, k])) as Record<string, SlugPerfil>;

function claro(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

export async function GET(_req: Request, { params }: { params: { id: string; archivo: string } }) {
  const m = /^(\d{1,2})\.png$/.exec(params.archivo);
  if (!m || !/^[0-9a-f-]{36}$/i.test(params.id)) return new Response("No existe", { status: 404 });
  const indice = Number(m[1]) - 1;
  const supabase = createAdminClient();
  const { data: pieza } = await supabase.from("content_pieces").select("rubro_id, formato, titulo, media, estado").eq("id", params.id).maybeSingle();
  if (!pieza || pieza.estado === "cancelada") return new Response("No existe", { status: 404 });
  const media = Array.isArray(pieza.media) ? (pieza.media as any[]) : [];
  const item = media[indice];
  if (!item) return new Response("No existe", { status: 404 });
  const slug = SLUG_POR_ID[pieza.rubro_id] ?? "juridico";
  const { data: brief } = await supabase.from("brand_briefs").select("nombre_publico, colores, web").eq("rubro_id", pieza.rubro_id).maybeSingle();
  const colores = normalizarColores((brief as any)?.colores);
  const marca = marcaDe(slug);
  const fondo = colores.oscuro ?? colores.principal ?? marca.paleta[0];
  const acento = colores.panel ?? colores.acento ?? colores.secundario ?? marca.acento;
  const textoColor = claro(fondo) ? "#111111" : "#FFFFFF";
  const nombre = (brief as any)?.nombre_publico || marca.nombre;
  const web = String((brief as any)?.web ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const historia = pieza.formato === "historia";
  const ancho = 1080;
  const alto = historia ? 1920 : 1080;
  const texto = String(item.texto ?? pieza.titulo ?? "").slice(0, 280);
  const total = media.length;
  const tam = texto.length > 140 ? 58 : texto.length > 80 ? 72 : 88;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: fondo, color: textoColor, padding: historia ? "140px 96px" : "88px 88px", position: "relative" }}>
        <div style={{ position: "absolute", right: -160, top: -160, width: 520, height: 520, borderRadius: 9999, background: acento, opacity: 0.22, display: "flex" }} />
        <div style={{ position: "absolute", left: -120, bottom: -220, width: 460, height: 460, borderRadius: 9999, background: acento, opacity: 0.12, display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9999, background: acento, display: "flex" }} />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>{nombre}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ width: 96, height: 8, borderRadius: 8, background: acento, display: "flex" }} />
          <div style={{ fontSize: historia ? tam + 8 : tam, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, display: "flex" }}>{texto}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, opacity: 0.9 }}>
          <div style={{ display: "flex" }}>{web || "Escribinos por WhatsApp"}</div>
          {total > 1 ? <div style={{ display: "flex", fontWeight: 700 }}>{`${indice + 1} / ${total}`}</div> : <div style={{ display: "flex" }} />}
        </div>
      </div>
    ),
    { width: ancho, height: alto, headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
