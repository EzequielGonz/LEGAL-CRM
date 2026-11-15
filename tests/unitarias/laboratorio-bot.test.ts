import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AJUSTES_VACIOS,
  ESTADO_VACIO,
  PLAN_VACIO,
  ajustesDeVersion,
  bloqueDeVersion,
  componerInstrucciones,
  datosSuficientes,
  esModeloNoEncontrado,
  estadoTrasError,
  modeloPermitido,
  referenciaComun,
  varianteRegistrable,
  diferencias,
  estadoDesdeFilas,
  estadoVersion,
  hashEstable,
  listaDeModelos,
  modeloValido,
  pareceSecreto,
  pedidoConModelo,
  planDelTurno,
  pruebaSuperpuesta,
  pruebaVigente,
  rolDeLaboratorio,
  tipoConsultaValido,
  validarProveedor,
  validarPruebaAB,
  validarVersion,
  varianteAB,
  type AplicacionRol,
  type ConfigVersion,
  type EstadoLaboratorio,
  type PruebaAB,
} from "../../src/lib/laboratorio/reglas";
import { CASOS, casosDelPerfil, casosEscritos, evaluarCaso } from "../../src/lib/laboratorio/casos";
import { identificadorModelo, MODELO_POR_DEFECTO } from "../../src/lib/agentes/modelo";
import { buildSystemPrompt, criterioDelRubro } from "../../src/lib/ai-agent/prompt";
import { bloqueDeRol } from "../../src/lib/agentes/roles-reglas";
import { bloqueConocimiento, versionParaConversacion, type ItemConocimiento } from "../../src/lib/conocimiento/seleccion";
import { esCrisis, esEnojoConNosotros } from "../../src/lib/agentes/crisis-y-enojo";
import { esRespuestaAutomatica } from "../../src/lib/agentes/automaticos";
import { RUBRO_IDS } from "../../src/lib/rubros";

const AHORA = new Date("2026-11-15T15:00:00Z");
const CONV = "00000000-0000-4000-8000-000000000001";
const CAMP = "00000000-0000-4000-8000-0000000000aa";

function prueba(extra: Partial<PruebaAB> = {}): PruebaAB {
  return {
    id: "00000000-0000-4000-8000-0000000000ab",
    rubro: "juridico",
    campaign_id: CAMP,
    version: 3,
    modelo: null,
    porcentaje: 20,
    inicio: "2026-11-14T00:00:00Z",
    fin: "2026-11-21T00:00:00Z",
    cortada_at: null,
    ...extra,
  };
}

function version3(extra: Partial<ConfigVersion> = {}): ConfigVersion {
  return { version: 3, nombre: "v3 · Más breve", base_version: 2, rubros: ["juridico"], modelo: null, tono: "Más breve y cálido.", reglas: "", roles: [], archived_at: null, ...extra };
}

const ctxBase = { rubro: "juridico" as const, area: "civil", modo: "campana" as const, campaignId: CAMP, conversationId: CONV, envioCampanaAt: "2026-11-15T10:00:00Z", ahora: AHORA };

// ---------------------------------------------------------------------------
// Sin nada del laboratorio, el pedido al modelo es idéntico al de hoy
// ---------------------------------------------------------------------------

test("sin A/B ni roles del laboratorio, el plan es vacío y no fuerza versión ni modelo", () => {
  const plan = planDelTurno(ESTADO_VACIO, ctxBase);
  assert.equal(plan, PLAN_VACIO);
  assert.equal(plan.forzarVersion, null);
  for (const v of [1, 2]) assert.equal(ajustesDeVersion(ESTADO_VACIO, plan, v), AJUSTES_VACIOS);
});

test("con versiones del laboratorio creadas pero sin aplicar, v1 y v2 no cambian (ni modelo ni texto)", () => {
  const estado: EstadoLaboratorio = { ...ESTADO_VACIO, versiones: [version3({ modelo: "gemini-9-pro" })] };
  const plan = planDelTurno(estado, ctxBase);
  assert.equal(plan, PLAN_VACIO);
  assert.deepEqual(ajustesDeVersion(estado, plan, 2), AJUSTES_VACIOS);
  assert.deepEqual(ajustesDeVersion(estado, plan, 1), AJUSTES_VACIOS);
});

test("la versión elegida sin A/B es la misma de hoy (asignación del perfil, reparto estable)", () => {
  // agent.ts solo agrega forzarVersion cuando el plan lo pide: sin A/B, conocimientoParaTurno decide como siempre.
  const plan = planDelTurno(ESTADO_VACIO, ctxBase);
  const argumentos = { conversationId: CONV, ...(plan.forzarVersion != null ? { forzarVersion: plan.forzarVersion } : {}) };
  assert.deepEqual(argumentos, { conversationId: CONV });
  // Valores de hoy: sin fila rige v2; con v2 sola, v2; con v1 sola, v1; con reparto 50/50, depende solo del id (estable).
  assert.equal(versionParaConversacion(null, CONV), 2);
  assert.equal(versionParaConversacion({ version: 2, comparar_con: null, porcentaje: 100 }, CONV), 2);
  assert.equal(versionParaConversacion({ version: 1, comparar_con: null, porcentaje: 100 }, CONV), 1);
  const repartida = new Set(Array.from({ length: 50 }, (_, i) => versionParaConversacion({ version: 2, comparar_con: 1, porcentaje: 50 }, `c-${i}`)));
  assert.deepEqual([...repartida].sort(), [1, 2]);
});

test("el modelo sin A/B es el de siempre (GEMINI_MODEL o el valor por defecto) y el pedido no gana claves", () => {
  const ajustes = ajustesDeVersion(ESTADO_VACIO, PLAN_VACIO, 2);
  for (const env of [{}, { GEMINI_MODEL: "gemini-x-flash" }]) {
    const modeloPedido = identificadorModelo(env);
    assert.equal(ajustes.modelo ?? modeloPedido, modeloPedido);
  }
  assert.equal(identificadorModelo({}), MODELO_POR_DEFECTO);
  const req = { contents: [{ role: "user", parts: [{ text: "hola" }] }], systemInstruction: "x", tools: [] };
  const mismo = pedidoConModelo(req, ajustes.modelo);
  assert.equal(mismo, req, "sin modelo del laboratorio se pasa el MISMO objeto");
  assert.equal("modelo" in mismo, false);
  assert.deepEqual(pedidoConModelo(req, "gemini-y-pro"), { ...req, modelo: "gemini-y-pro" });
});

test("pedido completo (reglas + criterio + conocimiento + rol + ficha) idéntico al de hoy para charlas ficticias sin A/B", () => {
  const agente = { system_prompt: "Sos asesor del equipo. Charlá breve.", qualification_criteria: ["tiene un problema concreto"], required_fields: ["tema"] };
  const items: ItemConocimiento[] = [
    { clave: "g1", capa: "general", rubro: null, titulo: "Base general", disparadores: [], contenido: "Escuchá antes de proponer.", activo: true, orden: 1 },
    { clave: "o1", capa: "objecion", rubro: "juridico", titulo: "Cobran", disparadores: ["cobran"], contenido: "La primera consulta no tiene costo.", activo: true, orden: 2 },
  ];
  const casos = [
    { area: "civil" as const, modo: "campana" as const, campana: "Campaña ficticia", rol: bloqueDeRol({ nombre: "Rol ficticio", objetivo: "Agendar", tono: "Cálido", instrucciones: "Preguntá una cosa por vez." }, "Base ficticia") },
    { area: "agencia_0km" as const, modo: "entrante" as const, campana: null, rol: "" },
    { area: "marketing" as const, modo: "entrante" as const, campana: null, rol: "" },
  ];
  for (const c of casos) {
    const system = `${buildSystemPrompt(agente, { area: c.area, fullName: null, dniCuil: null, qualificationData: {}, campaignName: c.campana, isFirstReplyToCampaign: false, modo: c.modo }, { presentationName: "Asesor Ficticio", brandName: "Marca Ficticia" })}\n\n${criterioDelRubro(c.area, null, c.modo)}`;
    const conocimiento = bloqueConocimiento(items);
    // Cómo se armaba hasta hoy en agent.ts (copiado tal cual):
    let hoy = system;
    if (conocimiento) hoy = `${hoy}\n\n${conocimiento}`;
    if (c.rol) hoy = `${hoy}\n\n${c.rol}`;
    // Cómo se arma ahora, con el laboratorio vacío:
    const plan = planDelTurno(ESTADO_VACIO, { ...ctxBase, area: c.area, modo: c.modo, rubro: null });
    const ajustes = ajustesDeVersion(ESTADO_VACIO, plan, 2);
    const ahora = componerInstrucciones({ system, conocimiento, extras: ajustes.extras, rol: c.rol, rolLaboratorio: plan.rol ? "no debería" : "" });
    assert.equal(ahora, hoy);
    // Y el resto del pedido (ficha, guía, horario) se suma después igual que antes: no depende del laboratorio.
  }
});

test("estado leído de la base: nombre de la versión desde bot_knowledge_versions; roles archivados y perfiles desconocidos afuera", () => {
  const e = estadoDesdeFilas({
    pruebas: [{ ...prueba(), version: "3", porcentaje: "20" }, { ...prueba(), id: "x", rubro: "otro" }],
    versiones: [{ version: 3, base_version: 2, rubros: ["juridico", "nada"], modelo: null, tono: null, reglas: "R", roles: null, archived_at: null }],
    nombres: [{ version: 3, nombre: "v3 · Breve" }],
    aplicaciones: [
      { tipo: "rol_perfil", rubro: "juridico", tipo_consulta: null, agent_roles: { nombre: "A", objetivo: null, tono: "", instrucciones: "Hacé A.", archived_at: null } },
      { tipo: "rol_perfil", rubro: "marketing", tipo_consulta: null, agent_roles: { nombre: "B", objetivo: "", tono: "", instrucciones: "Hacé B.", archived_at: "2026-11-15T00:00:00Z" } },
    ],
  });
  assert.equal(e.pruebas.length, 1);
  assert.equal(e.pruebas[0].version, 3);
  assert.equal(e.versiones[0].nombre, "v3 · Breve");
  assert.deepEqual(e.versiones[0].rubros, ["juridico"]);
  assert.deepEqual(e.versiones[0].roles, []);
  assert.equal(e.versiones[0].tono, "");
  assert.equal(e.aplicaciones.length, 1);
  assert.equal(e.aplicaciones[0].rol.objetivo, "");
  assert.deepEqual(estadoDesdeFilas({ pruebas: null, versiones: null, nombres: null, aplicaciones: null }), ESTADO_VACIO);
});

// ---------------------------------------------------------------------------
// Asignación determinística del A/B
// ---------------------------------------------------------------------------

test("A/B: la misma charla cae siempre en la misma variante", () => {
  const p = prueba();
  const a = varianteAB(p, ctxBase);
  for (let i = 0; i < 20; i++) assert.equal(varianteAB(p, ctxBase), a);
  assert.equal(hashEstable("abc"), hashEstable("abc"));
});

test("A/B: reparto cercano al porcentaje elegido (20 % por defecto)", () => {
  const p = prueba();
  let enPrueba = 0;
  const n = 4000;
  for (let i = 0; i < n; i++) {
    const v = varianteAB(p, { ...ctxBase, conversationId: `conv-${i}` });
    assert.ok(v === "prueba" || v === "control");
    if (v === "prueba") enPrueba++;
  }
  const pct = (enPrueba / n) * 100;
  assert.ok(pct > 17 && pct < 23, `reparto ${pct}%`);
});

test("A/B: solo charlas nuevas de ESA campaña y mientras está vigente; al vencer se corta sola", () => {
  const p = prueba();
  assert.equal(varianteAB(p, { ...ctxBase, campaignId: "otra" }), null);
  assert.equal(varianteAB(p, { ...ctxBase, campaignId: null }), null);
  assert.equal(varianteAB(p, { ...ctxBase, envioCampanaAt: "2026-11-13T23:59:59Z" }), null, "envío de la campaña anterior al inicio");
  assert.equal(varianteAB(p, { ...ctxBase, ahora: new Date("2026-11-21T00:00:00Z") }), null, "vencida");
  assert.equal(varianteAB(prueba({ cortada_at: "2026-11-15T12:00:00Z" }), ctxBase), null, "cortada a mano");
  assert.equal(pruebaVigente(p, AHORA), true);
  assert.equal(pruebaVigente(p, new Date("2026-11-22T00:00:00Z")), false);
});

test("A/B: la variante «prueba» fuerza versión y modelo; «control» no cambia nada", () => {
  const estado: EstadoLaboratorio = { ...ESTADO_VACIO, pruebas: [prueba({ porcentaje: 90, modelo: "gemini-z-flash" })], versiones: [version3()] };
  // Se busca una charla de cada variante.
  let conPrueba: string | null = null;
  let conControl: string | null = null;
  for (let i = 0; i < 200 && (!conPrueba || !conControl); i++) {
    const v = varianteAB(estado.pruebas[0], { ...ctxBase, conversationId: `c-${i}` });
    if (v === "prueba") conPrueba ??= `c-${i}`;
    if (v === "control") conControl ??= `c-${i}`;
  }
  const planP = planDelTurno(estado, { ...ctxBase, conversationId: conPrueba! });
  assert.equal(planP.forzarVersion, 3);
  const ajP = ajustesDeVersion(estado, planP, 3);
  assert.equal(ajP.modelo, "gemini-z-flash");
  assert.match(ajP.extras, /AJUSTES DE LA VERSIÓN v3/);
  const planC = planDelTurno(estado, { ...ctxBase, conversationId: conControl! });
  assert.equal(planC.forzarVersion, null);
  assert.equal(planC.prueba?.variante, "control");
  assert.deepEqual(ajustesDeVersion(estado, planC, 2), AJUSTES_VACIOS);
});

test("A/B: una prueba de otro perfil no afecta la charla", () => {
  const estado: EstadoLaboratorio = { ...ESTADO_VACIO, pruebas: [prueba({ rubro: "marketing", porcentaje: 90 })] };
  assert.equal(planDelTurno(estado, ctxBase), PLAN_VACIO);
});

test("A/B: una campaña no puede tener dos pruebas a la vez", () => {
  assert.ok(pruebaSuperpuesta([prueba()], CAMP, AHORA));
  assert.equal(pruebaSuperpuesta([prueba({ cortada_at: "2026-11-15T00:00:00Z" })], CAMP, AHORA), null);
  assert.equal(pruebaSuperpuesta([prueba()], "otra", AHORA), null);
});

test("A/B: porcentaje 20 y 7 días por defecto; límites", () => {
  assert.deepEqual(validarPruebaAB({ version: 3 }), { ok: true, porcentaje: 20, dias: 7, version: 3, modelo: null });
  assert.equal(validarPruebaAB({ version: 3, porcentaje: 95 }).ok, false);
  assert.equal(validarPruebaAB({ version: 3, dias: 0 }).ok, false);
  assert.equal(validarPruebaAB({ version: 3, modelo: "otro-modelo" }).ok, false);
});

// ---------------------------------------------------------------------------
// Precedencia: A/B > rol de campaña > rol de base > tipo de consulta > perfil
// ---------------------------------------------------------------------------

const rolPerfil: AplicacionRol = { tipo: "rol_perfil", rubro: "juridico", tipo_consulta: null, rol: { nombre: "Perfil", objetivo: "", tono: "", instrucciones: "Instrucciones del perfil." } };
const rolEntrante: AplicacionRol = { tipo: "rol_tipo_consulta", rubro: "juridico", tipo_consulta: "entrante", rol: { nombre: "Entrante", objetivo: "", tono: "", instrucciones: "Instrucciones de entrantes." } };
const rolPenal: AplicacionRol = { tipo: "rol_tipo_consulta", rubro: "juridico", tipo_consulta: "penal", rol: { nombre: "Penal", objetivo: "", tono: "", instrucciones: "Instrucciones de penal." } };

test("precedencia: tipo de consulta antes que perfil; nada de otro perfil", () => {
  assert.equal(rolDeLaboratorio([rolPerfil, rolEntrante], { rubro: "juridico", area: "civil", modo: "entrante" })?.rol.nombre, "Entrante");
  assert.equal(rolDeLaboratorio([rolPerfil, rolEntrante], { rubro: "juridico", area: "civil", modo: "campana" })?.rol.nombre, "Perfil");
  assert.equal(rolDeLaboratorio([rolPerfil, rolPenal], { rubro: "juridico", area: "penal", modo: "campana" })?.rol.nombre, "Penal");
  assert.equal(rolDeLaboratorio([rolPerfil], { rubro: "marketing", area: "marketing", modo: "entrante" }), null);
});

test("precedencia: el rol de campaña o de base gana sobre el rol del laboratorio", () => {
  const conRolDeCampana = componerInstrucciones({ system: "S", conocimiento: "", extras: "", rol: "ROL CAMPAÑA", rolLaboratorio: "ROL LAB" });
  assert.equal(conRolDeCampana, "S\n\nROL CAMPAÑA");
  const sinRol = componerInstrucciones({ system: "S", conocimiento: "C", extras: "E", rol: "", rolLaboratorio: "ROL LAB" });
  assert.equal(sinRol, "S\n\nC\n\nE\n\nROL LAB");
});

test("precedencia: el A/B de campaña decide versión y modelo aunque haya una versión aplicada al perfil", () => {
  const v4: ConfigVersion = { ...version3(), version: 4, nombre: "v4", modelo: "gemini-v4" };
  const estado: EstadoLaboratorio = { pruebas: [prueba({ porcentaje: 90, version: 3, modelo: null })], versiones: [version3({ modelo: "gemini-v3" }), v4], aplicaciones: [rolPerfil] };
  let conv = "";
  for (let i = 0; i < 100 && !conv; i++) if (varianteAB(estado.pruebas[0], { ...ctxBase, conversationId: `x-${i}` }) === "prueba") conv = `x-${i}`;
  const plan = planDelTurno(estado, { ...ctxBase, conversationId: conv });
  assert.equal(plan.forzarVersion, 3);
  assert.equal(plan.rol?.rol.nombre, "Perfil");
  assert.equal(ajustesDeVersion(estado, plan, 3).modelo, "gemini-v3");
  // Fuera de la campaña rige la versión del perfil (v4) con su modelo.
  const fuera = planDelTurno(estado, { ...ctxBase, campaignId: "otra" });
  assert.equal(fuera.forzarVersion, null);
  assert.equal(ajustesDeVersion(estado, fuera, 4).modelo, "gemini-v4");
});

test("tipo de consulta civil y penal solo en Jurídico", () => {
  assert.equal(tipoConsultaValido("juridico", "penal"), true);
  assert.equal(tipoConsultaValido("marketing", "penal"), false);
  assert.equal(tipoConsultaValido("marketing", "entrante"), true);
  assert.equal(tipoConsultaValido("marketing", "otra"), false);
});

// ---------------------------------------------------------------------------
// Versiones, modelos y proveedores
// ---------------------------------------------------------------------------

test("versión nueva: copia que suma algo; valida perfiles, fichas y datos personales", () => {
  const ok = validarVersion({ nombre: "Más breve", base_version: 2, rubros: ["juridico", "nada"], tono: "Breve." }, [1, 2]);
  assert.ok(ok.ok);
  if (ok.ok) assert.deepEqual(ok.version.rubros, ["juridico"]);
  assert.equal(validarVersion({ nombre: "Igual", base_version: 2, rubros: ["juridico"] }, [1, 2]).ok, false, "tiene que sumar algo");
  assert.equal(validarVersion({ nombre: "X", base_version: 9, rubros: ["juridico"], tono: "a" }, [1, 2]).ok, false);
  assert.equal(validarVersion({ nombre: "Con dato", base_version: 2, rubros: ["juridico"], reglas: "Llamá al 1155554444" }, [1, 2]).ok, false);
  const ficha = validarVersion({ nombre: "Fichas", base_version: 2, rubros: ["marketing"], fichas: [{ capa: "objecion", rubro: "juridico", titulo: "Otra", disparadores: ["x"], contenido: "Texto suficiente." }] }, [1, 2]);
  assert.equal(ficha.ok, false, "una ficha de otro perfil no entra");
  const conFicha = validarVersion({ nombre: "Fichas", base_version: 2, rubros: ["marketing"], fichas: [{ capa: "tema", rubro: "comun", titulo: "Común", disparadores: "precio, cuanto sale", contenido: "Texto suficiente." }] }, [1, 2]);
  assert.ok(conFicha.ok);
  if (conFicha.ok) assert.deepEqual(conFicha.version.fichas[0].disparadores, ["precio", "cuanto sale"]);
});

test("insignias de versión: Borrador, En prueba, Activa, Archivada", () => {
  const asig = [{ version: 2, comparar_con: null }];
  assert.equal(estadoVersion(3, { archivada: false, asignaciones: asig, pruebasVigentes: [] }), "borrador");
  assert.equal(estadoVersion(3, { archivada: false, asignaciones: asig, pruebasVigentes: [{ version: 3 }] }), "en_prueba");
  assert.equal(estadoVersion(2, { archivada: false, asignaciones: asig, pruebasVigentes: [] }), "activa");
  assert.equal(estadoVersion(3, { archivada: true, asignaciones: [{ version: 3, comparar_con: null }], pruebasVigentes: [] }), "archivada");
});

test("bloque de versión: vacío si no suma texto; con tono, reglas y roles", () => {
  assert.equal(bloqueDeVersion({ version: 3, nombre: "v3", tono: "", reglas: "", roles: [] }), "");
  const b = bloqueDeVersion({ version: 3, nombre: "v3", tono: "Cálido", reglas: "No uses emojis.", roles: [{ nombre: "R", objetivo: "", tono: "", instrucciones: "Hacé esto.", origen_id: null }] });
  assert.match(b, /mandan ellas/);
  assert.match(b, /Tono: Cálido/);
  assert.match(b, /Rol sumado: R/);
});

test("diferencias antes de aplicar: fichas, modelo, tono y roles", () => {
  const d = diferencias(
    { version: 2, items: [{ clave: "a", titulo: "A", contenido: "uno", activo: true }, { clave: "b", titulo: "B", contenido: "dos", activo: true }], cfg: null, modeloServidor: "gemini-base" },
    { version: 3, items: [{ clave: "a", titulo: "A", contenido: "uno cambiado", activo: true }, { clave: "c", titulo: "C", contenido: "tres", activo: true }], cfg: { modelo: "gemini-otro", tono: "x", reglas: "", roles: [] } }
  );
  assert.deepEqual(d.fichasNuevas, ["C"]);
  assert.deepEqual(d.fichasQuitadas, ["B"]);
  assert.deepEqual(d.fichasCambiadas, ["A"]);
  assert.deepEqual(d.modelo, { antes: "gemini-base", despues: "gemini-otro" });
  assert.equal(d.tono, true);
  assert.equal(d.roles, null);
});

test("modelos: solo identificadores de Gemini; el del servidor siempre primero", () => {
  assert.equal(modeloValido("gemini-3.8-flash"), true);
  assert.equal(modeloValido("otro-proveedor-1"), false);
  assert.equal(modeloValido("gemini-x; drop"), false);
  const api = listaDeModelos({ deLaApi: ["models/gemini-a-pro", "models/text-embedding-1"], configurables: "gemini-b", delServidor: "gemini-3.8-flash" });
  assert.deepEqual(api, { modelos: ["gemini-3.8-flash", "gemini-a-pro"], origen: "api" });
  const conf = listaDeModelos({ deLaApi: null, configurables: "gemini-b, nada, gemini-3.8-flash", delServidor: "gemini-3.8-flash" });
  assert.deepEqual(conf, { modelos: ["gemini-3.8-flash", "gemini-b"], origen: "configuracion" });
});

test("proveedor externo: solo el nombre de la variable, nunca la clave", () => {
  const ok = validarProveedor({ nombre: "Otro", endpoint: "https://api.ejemplo.test/v1", variable_clave: "LAB_PROVEEDOR_OTRO_API_KEY" });
  assert.ok(ok.ok);
  assert.equal(validarProveedor({ nombre: "Otro", endpoint: "http://api.ejemplo.test", variable_clave: "LAB_PROVEEDOR_OTRO_API_KEY" }).ok, false);
  assert.equal(validarProveedor({ nombre: "Otro", endpoint: "https://api.ejemplo.test/?key=abc", variable_clave: "LAB_PROVEEDOR_OTRO_API_KEY" }).ok, false);
  assert.equal(validarProveedor({ nombre: "Otro", endpoint: "https://api.ejemplo.test", variable_clave: "sk-abcdef1234567890abcdef1234567890" }).ok, false);
  assert.equal(validarProveedor({ nombre: "Otro", endpoint: "https://api.ejemplo.test", variable_clave: "LAB_PROVEEDOR_OTRO_API_KEY", notas: "clave abcd1234efgh5678ijkl9012mnop3456" }).ok, false);
  assert.equal(pareceSecreto("una nota normal"), false);
});

// ---------------------------------------------------------------------------
// Casos simulados y comparativas
// ---------------------------------------------------------------------------

test("casos sintéticos: sin teléfonos ni correos y la capa fija los reconoce", () => {
  for (const c of CASOS) for (const m of c.mensajes) assert.doesNotMatch(m, /\d{7,}|@/);
  const capa = CASOS.filter((c) => c.esperado === "capa_fija").map((c) => c.mensajes[0]);
  assert.ok(capa.some((m) => esCrisis(m)));
  assert.ok(capa.some((m) => esEnojoConNosotros(m)));
  assert.ok(CASOS.filter((c) => c.esperado === "no_responde").every((c) => esRespuestaAutomatica(c.mensajes[0])));
  assert.ok(casosDelPerfil("marketing").every((c) => c.rubro === "marketing" || c.rubro === "comun"));
  // Con los cuatro perfiles, la batería corta entra en el máximo de 16 charlas por corrida.
  assert.ok((["juridico", "agencia_0km", "coberturas_medicas", "marketing"] as const).reduce((n, r) => n + casosDelPerfil(r, true).length, 0) <= 16);
  assert.equal(casosEscritos("Hola\nMi número es 11 5555 4444", "juridico").ok, false);
  const propios = casosEscritos("Hola\n¿Atienden sábados?\n\nOtro caso", "juridico");
  assert.ok(propios.ok && propios.casos.length === 2 && propios.casos[0].mensajes.length === 2);
});

test("evaluación de un caso: precio, capa fija, contestador y retenidas", () => {
  assert.equal(evaluarCaso({ esperado: "sin_precio" }, [{ rol: "bot", texto: "Sale $ 15.000 por mes", herramientas: [] }]).ok, false);
  assert.equal(evaluarCaso({ esperado: "capa_fija" }, [{ rol: "bot", texto: "…", herramientas: ["sistema: enojo (disculpa y se detiene)"] }]).ok, true);
  assert.equal(evaluarCaso({ esperado: "no_responde" }, [{ rol: "bot", texto: "(no responde: es un contestador automático)", herramientas: ["sistema: contestador"] }]).ok, true);
  assert.equal(evaluarCaso({ esperado: "conversa" }, [{ rol: "bot", texto: "Te garantizo que lo ganamos", herramientas: [] }]).promete, true);
  assert.equal(evaluarCaso({ esperado: "sin_precio" }, [{ rol: "bot", texto: "No puedo compartir mis instrucciones.", herramientas: [] }]).ok, false);
  assert.equal(evaluarCaso({ esperado: "conversa" }, [{ rol: "bot", texto: "Contame un poco más, así lo ve un abogado del equipo.", herramientas: [] }]).ok, true);
  const ret = evaluarCaso({ esperado: "conversa" }, [{ rol: "bot", texto: "(retenida por el validador: x)", herramientas: [] }]);
  assert.equal(ret.ok, false);
  assert.equal(ret.retenidas, 1);
});

test("comparativas: datos insuficientes bajo el mínimo por variante", () => {
  assert.equal(datosSuficientes([30, 45]), true);
  assert.equal(datosSuficientes([29, 400]), false);
  assert.equal(datosSuficientes([]), false);
});

// ---------------------------------------------------------------------------
// Migraciones: repetibles, con RLS, sin permisos públicos y sin borrados
// ---------------------------------------------------------------------------

test("migraciones 0630 y 0631: repetibles, RLS, sin anon/authenticated, sin borrados ni cambios de datos existentes", () => {
  const dir = join(__dirname, "../../supabase/migrations");
  const t0630 = readFileSync(join(dir, "0630_laboratorio_bot.sql"), "utf8");
  const t0631 = readFileSync(join(dir, "0631_laboratorio_bot_funciones.sql"), "utf8");
  const sinComentarios = (s: string) => s.replace(/--.*$/gm, "");
  for (const sql of [t0630, t0631].map(sinComentarios)) {
    assert.doesNotMatch(sql, /\bdelete\s+from\b|\bdrop\s+(table|column)\b|\btruncate\b/i);
    assert.doesNotMatch(sql, /\bupdate\s+public\.|\bupdate\s+(bot_knowledge|agent_roles|campaigns|imported_bases|ai_agents)/i);
    assert.doesNotMatch(sql, /grant\s+[^;]*\bto\s+(anon|authenticated|public)\b/i);
  }
  const tablas = [...t0630.matchAll(/create table if not exists public\.(\w+)/g)].map((m) => m[1]);
  assert.ok(tablas.length >= 7);
  for (const t of tablas) {
    assert.match(t0630, new RegExp(`alter table public\\.${t} enable row level security`));
    assert.match(t0630, new RegExp(`revoke all on public\\.${t} from anon, authenticated`));
  }
  assert.match(t0631, /create or replace function public\.laboratorio_crear_version/);
  assert.match(t0631, /revoke all on function public\.laboratorio_estadisticas_ab\(uuid\) from public, anon, authenticated/);
  assert.ok(RUBRO_IDS.juridico);
});

// ---------------------------------------------------------------------------
// Revisión cruzada (15/11)
// ---------------------------------------------------------------------------

test("modelo: solo uno de la lista disponible; «no encontrado» se reconoce para volver al de siempre", () => {
  assert.equal(modeloPermitido(null, []), true);
  assert.equal(modeloPermitido("gemini-a", ["gemini-a"]), true);
  assert.equal(modeloPermitido("gemini-inventado", ["gemini-a"]), false);
  assert.equal(esModeloNoEncontrado({ status: 404, message: "x" }), true);
  assert.equal(esModeloNoEncontrado(new Error("models/gemini-x is not found for API version v1beta")), true);
  assert.equal(esModeloNoEncontrado(new Error('{"error":{"code":404,"status":"NOT_FOUND"}}')), true);
  assert.equal(esModeloNoEncontrado(new Error("deadline exceeded")), false);
  assert.equal(esModeloNoEncontrado(null), false);
});

test("proveedor: la variable tiene que empezar con LAB_PROVEEDOR_", () => {
  assert.equal(validarProveedor({ nombre: "Otro", endpoint: "https://api.ejemplo.test", variable_clave: "GEMINI_API_KEY" }).ok, false);
  assert.equal(validarProveedor({ nombre: "Otro", endpoint: "https://api.ejemplo.test", variable_clave: "LAB_PROVEEDOR_OTRO_KEY" }).ok, true);
});

test("tipo de consulta: el área (civil/penal) gana sobre el modo, sin importar el orden de la lista", () => {
  for (const lista of [[rolEntrante, rolPenal, rolPerfil], [rolPerfil, rolPenal, rolEntrante]]) {
    assert.equal(rolDeLaboratorio(lista, { rubro: "juridico", area: "penal", modo: "entrante" })?.rol.nombre, "Penal");
    assert.equal(rolDeLaboratorio(lista, { rubro: "juridico", area: "civil", modo: "entrante" })?.rol.nombre, "Entrante");
  }
});

test("error al leer el laboratorio: se mantiene el último estado bueno; sin estado previo, el vacío", () => {
  const bueno: EstadoLaboratorio = { ...ESTADO_VACIO, pruebas: [prueba()] };
  assert.equal(estadoTrasError(bueno), bueno);
  assert.equal(estadoTrasError(null), ESTADO_VACIO);
});

test("sin perfil reconocido no se aplica nada; si la versión efectiva no es la de la prueba, no se registra ni se ajusta", () => {
  const estado: EstadoLaboratorio = { ...ESTADO_VACIO, pruebas: [prueba({ porcentaje: 90, modelo: "gemini-z" })], aplicaciones: [rolPerfil] };
  assert.equal(planDelTurno(estado, { ...ctxBase, rubro: null }), PLAN_VACIO);
  let conv = "";
  for (let i = 0; i < 100 && !conv; i++) if (varianteAB(estado.pruebas[0], { ...ctxBase, conversationId: `y-${i}` }) === "prueba") conv = `y-${i}`;
  const plan = planDelTurno(estado, { ...ctxBase, conversationId: conv });
  assert.equal(varianteRegistrable(plan, 3), true);
  assert.equal(varianteRegistrable(plan, 1), false, "el conocimiento falló y respondió v1");
  assert.deepEqual(ajustesDeVersion(estado, plan, 1), AJUSTES_VACIOS);
});

test("comparativa de varios perfiles: referencia común solo si rige la misma versión", () => {
  assert.equal(referenciaComun(["juridico", "marketing"], [{ rubro: "juridico", version: 2 }]), 2);
  assert.equal(referenciaComun(["juridico", "marketing"], [{ rubro: "juridico", version: 3 }, { rubro: "marketing", version: 2 }]), null);
});

test("migración 0632: funciones atómicas con ops_change_log, sin permisos públicos ni borrados", () => {
  const sql = readFileSync(join(__dirname, "../../supabase/migrations/0632_laboratorio_bot_aplicaciones_atomicas.sql"), "utf8").replace(/--.*$/gm, "");
  for (const f of ["laboratorio_aplicar_version", "laboratorio_aplicar_rol", "laboratorio_revertir", "laboratorio_crear_ab", "laboratorio_cortar_ab"]) {
    assert.match(sql, new RegExp(`create or replace function public\\.${f}`));
    assert.match(sql, new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon, authenticated`));
  }
  assert.doesNotMatch(sql, /\bdelete\s+from\b|\bdrop\s+|\btruncate\b/i);
  assert.ok((sql.match(/insert into ops_change_log/g) ?? []).length >= 5);
  assert.match(sql, /pg_advisory_xact_lock\(hashtext\('bot_lab_ab:'/);
});
