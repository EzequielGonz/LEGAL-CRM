import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CATALOGO, FUERA_DEL_CATALOGO, operacionPorClave } from "../../src/lib/asistente/catalogo";
import { buscarOperaciones, fichaDeOperacion, nivelDeOperacion, problemasDelCatalogo, rutaConIds, validarCampos } from "../../src/lib/asistente/catalogo-tipos";
import { ejecutarOperacionPanel, nivelDePropuestaPanel } from "../../src/lib/asistente/panel-operaciones";
import { nivelDeAccion } from "../../src/lib/asistente/permisos";
import { RUBRO_IDS } from "../../src/lib/rubros";

// 13/11 · «al asistente virtual del panel, dale permisos a TODO […] que pueda hacer TODO».
// Y después: «el asistente dejalo así» (propone y la persona confirma).

const API = join(__dirname, "../../src/app/api");

/** Rutas del panel que cambian algo: { "campaigns/[id]/pause": ["POST"] }. */
function rutasQueCambian(dir = API, base = ""): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) Object.assign(out, rutasQueCambian(p, base ? `${base}/${n}` : n));
    else if (n === "route.ts") {
      const metodos = [...readFileSync(p, "utf8").matchAll(/export async function (POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
      if (metodos.length) out[base] = metodos;
    }
  }
  return out;
}

/** No son operaciones del panel: entrada y salida, tareas internas, subidas de archivos y avisos de proveedores. */
const INFRAESTRUCTURA = new Set([
  "acceso/cerrar-otras",
  "acceso/ingresar",
  "acceso/pin",
  "acceso/salir",
  "agent/process",
  "asistente",
  "asistente/acciones/[id]",
  "asistente/acciones/[id]/deshacer",
  "bases",
  "bases/upload-url",
  "campaigns/import",
  "campaigns/tick",
  "conversations/[id]/subida",
  "landing",
  "push/prueba",
  "push/suscripcion",
  "push/suscripcion/[id]",
  "webhooks/meta",
  "webhooks/wasender",
  "webhooks/whatsapp",
]);

test("el catálogo está bien formado", () => {
  assert.deepEqual(problemasDelCatalogo(CATALOGO), []);
  assert.ok(CATALOGO.length >= 70, `tiene ${CATALOGO.length} operaciones`);
});

test("cada operación del catálogo apunta a una ruta que existe y acepta ese método", () => {
  const rutas = rutasQueCambian();
  for (const op of CATALOGO) {
    assert.ok(existsSync(join(API, op.ruta, "route.ts")), `${op.clave}: no existe la ruta ${op.ruta}`);
    assert.ok(rutas[op.ruta]?.includes(op.metodo), `${op.clave}: ${op.ruta} no tiene ${op.metodo}`);
  }
});

test("«TODO»: cada ruta que cambia algo está en el catálogo, tiene herramienta propia o dice por qué quedó afuera", () => {
  const cubiertas = new Set([...CATALOGO.map((o) => o.ruta), ...Object.keys(FUERA_DEL_CATALOGO).map((k) => k.split("#")[0])]);
  const sinCubrir = Object.keys(rutasQueCambian()).filter((r) => !cubiertas.has(r) && !INFRAESTRUCTURA.has(r));
  assert.deepEqual(sinCubrir, [], "hay rutas nuevas sin decidir: sumalas al catálogo o a FUERA_DEL_CATALOGO con su motivo");
  for (const [ruta, motivo] of Object.entries(FUERA_DEL_CATALOGO)) assert.ok(motivo.length > 20, `${ruta}: falta el motivo`);
});

test("niveles: lo que le escribe a personas pide confirmación reforzada; lo que gasta, enciende un bot o es un control general pide el código", () => {
  const nivel = (clave: string, cuerpo: Record<string, unknown> = {}) => {
    const op = operacionPorClave(clave)!;
    assert.ok(op, clave);
    return nivelDeOperacion(op, { ...cuerpo, ...(op.fijos ?? {}) });
  };
  // Controles generales y encendidos automáticos.
  for (const c of ["pausa_general", "tareas_del_servidor", "seguimiento_encender_apagar", "recontacto_encender_apagar", "perfil_atencion_24_horas", "contenido_politica", "marketing_ejecutar_base", "bot_crear_agente", "bot_publicar_agente"]) {
    assert.equal(nivel(c), "pin", c);
    assert.ok(operacionPorClave(c)!.campoPin, `${c}: la ruta pide el código en el cuerpo`);
  }
  // Gastan o hacen que el sistema escriba solo.
  assert.equal(nivel("marketing_extraer_negocios"), "pin");
  assert.equal(nivel("marketing_prospeccion_activar"), "pin");
  assert.equal(nivel("marketing_prospeccion_pausar"), "cambio", "frenar es un clic");
  // Encender sube el nivel; apagar no.
  assert.equal(nivel("bot_encender_apagar", { active: true }), "pin");
  assert.equal(nivel("bot_encender_apagar", { active: false }), "cambio");
  assert.equal(nivel("wasender_linea_editar", { habilitada: true }), "pin");
  assert.equal(nivel("wasender_linea_editar", { responde_con_bot: true }), "pin");
  assert.equal(nivel("wasender_linea_editar", { nombre: "Otra" }), "cambio");
  assert.equal(nivel("linea_meta_editar", { answers_with_agent: true }), "pin");
  assert.equal(nivel("redes_conexion_y_publicacion_automatica", { publicarSolo: true }), "pin");
  // Pueden hacer salir un mensaje a una persona.
  assert.equal(nivel("persona_quien_atiende", { estado: "ia" }), "contacto");
  assert.equal(nivel("persona_quien_atiende", { estado: "requiere_humano" }), "cambio");
  assert.equal(nivel("seguimiento_revisar_tarea", { action: "reintentar" }), "contacto");
  assert.equal(nivel("seguimiento_revisar_tarea", { action: "descartar" }), "cambio");
  assert.equal(nivel("persona_volver_a_contactar"), "contacto", "levantar un «no contactar» nunca es un clic");
  // Frenar o archivar siempre es un clic.
  for (const c of ["campana_archivar", "base_archivar", "wasender_linea_desconectar", "persona_no_contactar_mas", "persona_perder"]) assert.equal(nivel(c), "cambio", c);
});

test("el nivel se decide en el servidor: una propuesta sin dato válido pide el código", () => {
  assert.equal(nivelDeAccion("operacion_panel", { nivel: "cambio" }), "cambio");
  assert.equal(nivelDeAccion("operacion_panel", { nivel: "cualquiera" }), "pin");
  assert.equal(nivelDeAccion("operacion_panel", {}), "pin");
  assert.equal(nivelDePropuestaPanel({ clave: "no_existe", nivel: "cambio" }), "pin");
  // Aunque el navegador mande «cambio», el servidor recalcula con el catálogo.
  assert.equal(nivelDePropuestaPanel({ clave: "pausa_general", nivel: "cambio", cuerpo: {} }), "pin");
  assert.equal(nivelDePropuestaPanel({ clave: "bot_encender_apagar", nivel: "cambio", cuerpo: { active: true } }), "pin");
});

test("los datos del modelo se filtran: no puede colar un perfil, un código ni un campo fijo", () => {
  const op = operacionPorClave("audios_encender_apagar")!;
  const v = validarCampos(op, { encendido: "sí", perfil: "marketing", pin: "123456", accion: "otra" });
  assert.deepEqual(v, { ok: true, cuerpo: { encendido: true } });
  assert.equal(validarCampos(op, {}).ok, false, "falta el dato obligatorio");
  const cita = operacionPorClave("cita_cambiar_estado")!;
  assert.equal(validarCampos(cita, { estado: "borrada" }).ok, false, "solo valen los estados que acepta la pantalla");
  assert.deepEqual(validarCampos(cita, { estado: "realizada", nota: "  vino  " }), { ok: true, cuerpo: { estado: "realizada", nota: "vino" } });
  const cal = operacionPorClave("calendario_agregar_excepcion")!;
  assert.deepEqual(validarCampos(cal, { day: "2026-12-08", closed: true, start_hour: "9" }), { ok: true, cuerpo: { day: "2026-12-08", closed: true, start_hour: 9 } });
  assert.equal(validarCampos(cal, { day: "2026-12-08", start_hour: "nueve" }).ok, false);
});

test("la ruta se arma solo con identificadores", () => {
  assert.equal(rutaConIds("campaigns/[id]/archivo", { id: "0f8fad5b-d9cb-469f-a165-70867728950e" }), "/api/campaigns/0f8fad5b-d9cb-469f-a165-70867728950e/archivo");
  assert.throws(() => rutaConIds("campaigns/[id]/archivo", {}), /Falta identificar/);
  assert.throws(() => rutaConIds("campaigns/[id]/archivo", { id: "../../acceso/pin" }), /Falta identificar/);
  assert.throws(() => rutaConIds("campaigns/[id]/archivo", { id: "a/b" }));
});

test("buscar: encuentra por lo que la persona diría, y cada perfil ve solo lo suyo", () => {
  const claves = (t: string, perfil = "juridico") => buscarOperaciones(CATALOGO, t, undefined, perfil).slice(0, 5).map((o) => o.clave);
  assert.ok(claves("archivar una base").includes("base_archivar"));
  assert.ok(claves("feriado").includes("calendario_agregar_excepcion"));
  assert.ok(claves("no contactar más").includes("persona_no_contactar_mas"));
  assert.ok(claves("pausa general").includes("pausa_general"));
  assert.ok(claves("color del perfil").includes("perfil_color_y_nombre_publico"));
  assert.ok(claves("entiende audios").includes("audios_encender_apagar"));
  assert.ok(!buscarOperaciones(CATALOGO, "extraer negocios", undefined, "juridico").some((o) => o.soloPerfil === "marketing"), "Jurídico no ve operaciones de Marketing");
  assert.ok(claves("extraer negocios", "marketing").includes("marketing_extraer_negocios"));
  const ficha = fichaDeOperacion(operacionPorClave("pausa_general")!);
  assert.equal(ficha.confirmacion, "pide el código de acceso");
  assert.equal((ficha as any).alcance, "vale para los cuatro perfiles");
  assert.ok(!JSON.stringify(ficha).includes("campoPin"), "el modelo no ve detalles internos");
});

test("al confirmar se llama a la ruta de la pantalla, con el perfil y el código puestos por el servidor", async () => {
  const llamadas: { url: string; init: any }[] = [];
  const fetchImpl = (async (url: any, init: any) => {
    llamadas.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true, encendido: true }), { status: 200 });
  }) as unknown as typeof fetch;
  const http = { origen: "https://panel.example", cookie: "sesion=abc", fetchImpl };

  // El perfil sale de la propuesta guardada: lo que venga en el cuerpo no lo cambia.
  const r = await ejecutarOperacionPanel({ rubro_id: RUBRO_IDS.marketing, payload: { clave: "audios_encender_apagar", perfil: "marketing", ids: {}, cuerpo: { encendido: true, perfil: "juridico" } } }, http);
  assert.equal(r.hecho, true);
  assert.equal(llamadas[0].url, "https://panel.example/api/audios/ajuste");
  assert.equal(llamadas[0].init.method, "POST");
  assert.equal(llamadas[0].init.headers.cookie, "sesion=abc");
  assert.deepEqual(JSON.parse(llamadas[0].init.body), { encendido: true, perfil: "marketing" });

  // El código solo viaja si la operación lo pide, y sin código no se llama a nada.
  await assert.rejects(() => ejecutarOperacionPanel({ rubro_id: RUBRO_IDS.juridico, payload: { clave: "pausa_general", perfil: "juridico", ids: {}, cuerpo: { ai_replies_paused: true } } }, http), /código de acceso/);
  assert.equal(llamadas.length, 1);
  await ejecutarOperacionPanel({ rubro_id: RUBRO_IDS.juridico, payload: { clave: "pausa_general", perfil: "juridico", ids: {}, cuerpo: { ai_replies_paused: true } } }, { ...http, pin: "000000" });
  assert.deepEqual(JSON.parse(llamadas[1].init.body), { ai_replies_paused: true, pin: "000000" });

  // Los valores fijos de la operación ganan sobre lo que venga en la propuesta.
  await ejecutarOperacionPanel({ rubro_id: RUBRO_IDS.juridico, payload: { clave: "base_archivar", perfil: "juridico", ids: { id: "0f8fad5b-d9cb-469f-a165-70867728950e" }, cuerpo: { accion: "recuperar", nota: "vieja" } } }, http);
  assert.equal(llamadas[2].url, "https://panel.example/api/bases/0f8fad5b-d9cb-469f-a165-70867728950e/archivo");
  assert.deepEqual(JSON.parse(llamadas[2].init.body), { accion: "archivar", nota: "vieja" });

  // El perfil como identificador del rubro, cuando la ruta lo pide así.
  await ejecutarOperacionPanel({ rubro_id: RUBRO_IDS.agencia_0km, payload: { clave: "seguimiento_base_para_campana_manual", perfil: "agencia_0km", ids: {}, cuerpo: {} } }, http);
  assert.deepEqual(JSON.parse(llamadas[3].init.body), { rubro_id: RUBRO_IDS.agencia_0km });

  // Una operación de Marketing no corre en otro perfil.
  await assert.rejects(() => ejecutarOperacionPanel({ rubro_id: RUBRO_IDS.juridico, payload: { clave: "marketing_prospeccion_pausar", perfil: "juridico", ids: {}, cuerpo: {} } }, http), /no es de este perfil/);

  // Si la pantalla lo rechaza, se muestra su motivo y no se da por hecho.
  const rechaza = (async () => new Response(JSON.stringify({ error: "La campaña está en curso: pausala antes." }), { status: 409 })) as unknown as typeof fetch;
  await assert.rejects(() => ejecutarOperacionPanel({ rubro_id: RUBRO_IDS.juridico, payload: { clave: "campana_archivar", perfil: "juridico", ids: { id: "0f8fad5b-d9cb-469f-a165-70867728950e" }, cuerpo: {} } }, { ...http, fetchImpl: rechaza }), /pausala antes/);
});
