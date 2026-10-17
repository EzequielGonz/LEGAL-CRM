import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { rubroIdDe } from "@/lib/indicadores";
import { briefCompleto, faltantesDelBrief, PILARES } from "@/lib/contenido/brief";
import { createAdminClient } from "@/lib/supabase/admin";
import { RUBRO_IDS, type RubroSlug } from "@/lib/rubros";
import { logoValido, normalizarColores, resolverMarca } from "@/lib/marca";

export const dynamic = "force-dynamic";

const SLUG = Object.fromEntries(Object.entries(RUBRO_IDS).map(([k, v]) => [v, k])) as Record<string, RubroSlug>;

/**
 * Brief de marca por perfil (Etapa 3 · contenido). GET ?perfil= → brief,
 * faltantes y pilares editoriales. PUT { perfil, ...campos } → guarda (sin
 * PIN: no publica nada). Los secretos de redes NO van acá: solo nombre,
 * logo (enlace), colores, servicios, público, zonas, tono, contacto público.
 */
export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const rubroId = rubroIdDe(new URL(request.url).searchParams.get("perfil"));
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const { data } = await createAdminClient().from("brand_briefs").select("*").eq("rubro_id", rubroId).maybeSingle();
  const brief = data ?? { rubro_id: rubroId, servicios: [], colores: {}, contacto: {}, afirmaciones_autorizadas: [], prohibido: [] };
  const colores = normalizarColores((brief as any).colores);
  const marca = resolverMarca(SLUG[rubroId], brief as any);
  return NextResponse.json({
    brief: { ...brief, colores },
    marca: { nombre: marca.nombre, logoPanel: marca.logoPanel, origenLogo: marca.origenLogo, logoOriginal: `/logos/${SLUG[rubroId]}.svg`, logoPiezas: marca.logoPiezas, paleta: marca.paleta },
    faltantes: faltantesDelBrief(brief as any),
    completo: briefCompleto(brief as any),
    pilares: PILARES[SLUG[rubroId]],
  });
}

const TEXTO = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) || null : null);
const LISTA = (v: unknown, max = 20) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().slice(0, 200)).slice(0, max) : []);

export async function PUT(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const rubroId = rubroIdDe(body?.perfil);
  if (!rubroId) return NextResponse.json({ error: "Perfil no válido." }, { status: 400 });
  const logo = TEXTO(body?.logo_ref, 500);
  if (logo && !/^https:\/\//.test(logo)) return NextResponse.json({ error: "El logo de las piezas tiene que ser un enlace https.", campo: "logo_ref" }, { status: 400 });
  const logoPanelTexto = TEXTO(body?.logo_panel, 500);
  const logoPanel = logoPanelTexto ? logoValido(logoPanelTexto) : null;
  if (logoPanelTexto && !logoPanel) return NextResponse.json({ error: "El logo del panel tiene que ser un enlace https o un archivo de /logos.", campo: "logo_panel" }, { status: 400 });
  for (const [k, v] of Object.entries((body?.colores ?? {}) as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim() && !/^#[0-9a-f]{6}$/i.test(v.trim())) {
      return NextResponse.json({ error: `El color «${k}» tiene que tener el formato #RRGGBB.`, campo: `color_${k}` }, { status: 400 });
    }
  }
  // Se conservan todos los colores ya guardados (claro, oscuro, acento…) y se
  // superponen los enviados. Clave canónica: `principal`.
  const { data: previo } = await createAdminClient().from("brand_briefs").select("colores, logo_panel").eq("rubro_id", rubroId).maybeSingle();
  const colores = { ...normalizarColores((previo as any)?.colores), ...normalizarColores(body?.colores) };
  const contacto: Record<string, string> = {};
  for (const k of ["whatsapp", "web", "direccion"]) {
    const v = TEXTO(body?.contacto?.[k], 200);
    if (v) contacto[k] = v;
  }
  const fila = {
    rubro_id: rubroId,
    nombre_publico: TEXTO(body?.nombre_publico, 120),
    logo_ref: logo,
    // Si el formulario no manda el campo, se conserva el logo del panel guardado.
    logo_panel: body && "logo_panel" in body ? logoPanel : ((previo as any)?.logo_panel ?? null),
    colores,
    servicios: LISTA(body?.servicios),
    publico: TEXTO(body?.publico),
    zonas: TEXTO(body?.zonas, 200),
    tono: TEXTO(body?.tono, 300),
    contacto,
    web: TEXTO(body?.web, 300),
    objetivos: TEXTO(body?.objetivos, 600),
    afirmaciones_autorizadas: LISTA(body?.afirmaciones_autorizadas, 30),
    prohibido: LISTA(body?.prohibido, 30),
    updated_at: new Date().toISOString(),
  };
  const completo = briefCompleto(fila as any);
  const { error } = await createAdminClient().from("brand_briefs").upsert({ ...fila, completo } as any, { onConflict: "rubro_id" });
  if (error) return NextResponse.json({ error: "No se pudo guardar el brief." }, { status: 500 });
  revalidateTag("marca-perfil");
  return NextResponse.json({ ok: true, completo, faltantes: faltantesDelBrief(fila as any) });
}
