import { after, NextResponse } from "next/server";
import { requireSession } from "@/lib/acceso/autorizacion";
import { mensajeVisible, respuestaErrorInterno } from "@/lib/error-publico";
import { esRubro, RUBROS, type Rubro } from "@/lib/laboratorio/reglas";
import { modelosDisponibles } from "@/lib/laboratorio/modelos";
import {
  LaboratorioError,
  aplicarRol,
  aplicarVersionAPerfil,
  archivarProveedor,
  archivarVersion,
  bibliotecaRoles,
  cambiarModeloVersion,
  comparativa,
  copiarRol,
  cortarPruebaAB,
  crearPruebaAB,
  crearProveedor,
  crearRol,
  crearRolGeneral,
  crearVersion,
  diferenciasParaAplicar,
  editarRolComoCopia,
  fichasDeVersion,
  leerSimulacion,
  listarSimulaciones,
  prepararSimulacion,
  resumenLaboratorio,
  revertirAplicacion,
} from "@/lib/laboratorio/servicio";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Laboratorio del bot (15/11).
 *
 * GET ?vista=resumen                         → versiones (con insignia), pruebas A/B, aplicaciones vigentes, proveedores.
 * GET ?vista=modelos                         → modelos de Gemini disponibles para la clave del servidor.
 * GET ?vista=biblioteca                      → roles de los 4 perfiles y generales, bases y campañas.
 * GET ?vista=fichas&perfil=&version=         → fichas de una versión para un perfil.
 * GET ?vista=diferencias&perfil=&version=    → qué cambia si se aplica una versión a todo el perfil.
 * GET ?vista=comparativa&perfiles=a,b&dias=  → cifras por versión y por variante de A/B.
 * GET ?vista=simulaciones | ?vista=simulacion&id=
 * POST { accion, ... }                       → ver `acciones` abajo.
 *
 * Nada de esto envía mensajes ni toca Meta. Aplicar algo es manual, con
 * confirmación en pantalla y con vuelta atrás; todo queda en ops_change_log.
 */
function perfiles(v: string | null): Rubro[] {
  const lista = (v ?? "").split(",").filter(esRubro);
  return lista.length ? Array.from(new Set(lista)) : RUBROS;
}

function error(err: unknown, contexto: string) {
  if (err instanceof LaboratorioError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof Error && !(err as any).code) return NextResponse.json({ error: mensajeVisible(err, contexto) }, { status: 400 });
  return respuestaErrorInterno(err, contexto);
}

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const vista = url.searchParams.get("vista") ?? "resumen";
  const sinCache = { headers: { "Cache-Control": "no-store" } };
  try {
    if (vista === "resumen") return NextResponse.json(await resumenLaboratorio(), sinCache);
    if (vista === "modelos") return NextResponse.json(await modelosDisponibles(), sinCache);
    if (vista === "biblioteca") return NextResponse.json(await bibliotecaRoles(), sinCache);
    if (vista === "fichas" || vista === "diferencias") {
      const perfil = url.searchParams.get("perfil");
      const version = Number(url.searchParams.get("version"));
      if (!esRubro(perfil) || !Number.isInteger(version) || version < 1) return NextResponse.json({ error: "Perfil o versión no válidos." }, { status: 400 });
      if (vista === "fichas") return NextResponse.json({ fichas: await fichasDeVersion(version, perfil) }, sinCache);
      return NextResponse.json(await diferenciasParaAplicar(perfil, version), sinCache);
    }
    if (vista === "comparativa") {
      const dias = Number(url.searchParams.get("dias") ?? 14) || 14;
      return NextResponse.json(await comparativa(perfiles(url.searchParams.get("perfiles")), dias), sinCache);
    }
    if (vista === "simulaciones") return NextResponse.json({ simulaciones: await listarSimulaciones() }, sinCache);
    if (vista === "simulacion") {
      const id = url.searchParams.get("id");
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Falta la simulación o no es válida." }, { status: 400 });
      return NextResponse.json({ simulacion: await leerSimulacion(id) }, sinCache);
    }
    return NextResponse.json({ error: "Vista no válida." }, { status: 400 });
  } catch (err) {
    return error(err, `laboratorio GET ${vista}`);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
const uuidONulo = (v: unknown): string | null => (esUuid(v) ? v : null);

export async function POST(request: Request) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Pedido no válido." }, { status: 400 });
  const accion = typeof body.accion === "string" ? body.accion : "";
  // Quién hizo el cambio: la sesión (id corto, no es un dato personal); si no hay, «panel».
  const actor = auth.session?.sid ? `panel:${String(auth.session.sid).slice(0, 8)}` : "panel";
  const texto = (v: unknown) => (typeof v === "string" ? v : "");
  const faltaId = (que: string) => NextResponse.json({ error: `Falta ${que} o no es válido.` }, { status: 400 });
  try {
    switch (accion) {
      case "crear_version":
        return NextResponse.json(await crearVersion(body, actor));
      case "modelo_version":
        await cambiarModeloVersion(Number(body.version), texto(body.modelo) || null, actor);
        return NextResponse.json({ ok: true });
      case "archivar_version":
        await archivarVersion(Number(body.version), texto(body.nota), actor);
        return NextResponse.json({ ok: true });
      case "aplicar_version": {
        if (!esRubro(body.perfil)) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
        if (body.confirmado !== true) return NextResponse.json({ error: "Falta confirmar el cambio." }, { status: 400 });
        return NextResponse.json(await aplicarVersionAPerfil(body.perfil, Number(body.version), actor));
      }
      case "aplicar_rol": {
        if (!esRubro(body.perfil)) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
        if (body.confirmado !== true) return NextResponse.json({ error: "Falta confirmar el cambio." }, { status: 400 });
        const tipo = body.tipo;
        if (!["rol_perfil", "rol_tipo_consulta", "rol_base", "rol_campana"].includes(tipo)) return NextResponse.json({ error: "Destino no válido." }, { status: 400 });
        if (body.rol_id && !esUuid(body.rol_id)) return faltaId("el rol");
        return NextResponse.json(
          await aplicarRol({ tipo, rubro: body.perfil, rolId: uuidONulo(body.rol_id), tipoConsulta: body.tipo_consulta, baseId: uuidONulo(body.base_id), campaignId: uuidONulo(body.campaign_id) }, actor)
        );
      }
      case "volver_atras":
        if (!esUuid(body.id)) return faltaId("la aplicación");
        if (body.confirmado !== true) return NextResponse.json({ error: "Falta confirmar la vuelta atrás." }, { status: 400 });
        return NextResponse.json(await revertirAplicacion(body.id, texto(body.nota), actor));
      case "rol_nuevo":
        if (!esRubro(body.perfil)) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
        return NextResponse.json({ rol: await crearRol(body.perfil, body, actor) });
      case "rol_copia_editada":
        if (!esUuid(body.rol_id)) return faltaId("el rol");
        return NextResponse.json({ rol: await editarRolComoCopia(body.rol_id, body, actor) });
      case "copiar_rol":
        if (!esRubro(body.destino)) return NextResponse.json({ error: "Perfil de destino no válido" }, { status: 400 });
        if (!esUuid(body.rol_id) && !esUuid(body.general_id)) return faltaId("el rol");
        return NextResponse.json({ rol: await copiarRol({ rolId: uuidONulo(body.rol_id), generalId: uuidONulo(body.general_id) }, body.destino, actor) });
      case "rol_general":
        return NextResponse.json({ rol: await crearRolGeneral(body, actor) });
      case "proveedor":
        return NextResponse.json(await crearProveedor(body, actor));
      case "archivar_proveedor":
        if (!esUuid(body.id)) return faltaId("el proveedor");
        await archivarProveedor(body.id, actor);
        return NextResponse.json({ ok: true });
      case "crear_ab": {
        if (!esRubro(body.perfil)) return NextResponse.json({ error: "Perfil no válido" }, { status: 400 });
        if (body.confirmado !== true) return NextResponse.json({ error: "Falta confirmar la prueba." }, { status: 400 });
        if (!esUuid(body.campaign_id)) return faltaId("la campaña");
        return NextResponse.json(await crearPruebaAB({ rubro: body.perfil, campaignId: body.campaign_id, version: body.version, modelo: body.modelo, porcentaje: body.porcentaje, dias: body.dias }, actor));
      }
      case "cortar_ab":
        if (!esUuid(body.id)) return faltaId("la prueba");
        return NextResponse.json(await cortarPruebaAB(body.id, texto(body.nota), actor));
      case "simular": {
        const { id, completar } = await prepararSimulacion(body, actor);
        after(completar);
        return NextResponse.json({ ok: true, id }, { status: 202 });
      }
      default:
        return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
    }
  } catch (err) {
    return error(err, `laboratorio POST ${accion}`);
  }
}
