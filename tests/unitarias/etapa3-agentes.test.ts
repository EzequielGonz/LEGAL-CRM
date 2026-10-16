// Etapa 3 · Agentes: contrato de salida, módulos, contexto, simulador con
// herramientas simuladas, evaluación determinista, corpus y exportador.
// Todo en memoria, sin base ni proveedor. Datos ficticios.
import test from "node:test";
import assert from "node:assert/strict";
import { HERRAMIENTAS_PERMITIDAS, instruccionReparacion, normalizarSalida, validarTextoSalida } from "@/lib/agentes/contrato";
import { detectarSenales, seleccionarModulos, TODOS_LOS_MODULOS, textoDeModulos } from "@/lib/agentes/modulos";
import { armarContexto, armarResumen, textoResumen } from "@/lib/agentes/contexto";
import { configuracionVertex, generadorSimulado, generadorVertex, informeModeloActivo, ModeloNoDisponibleError } from "@/lib/agentes/modelo";
import { simularConversacion } from "@/lib/agentes/simulador";
import { decidirComparacion, evaluarSimulacion, UMBRALES_PROPUESTOS } from "@/lib/agentes/evaluacion";
import { CASOS, casosPorFamilia } from "@/lib/agentes/casos";
import { anonimizar, casoAEjemplo, exportarJsonl, familiasCruzadas, hashCorpus, particionPara, planDistribucion, validarJsonl, type CasoCorpus } from "@/lib/agentes/corpus";

const identidad = { presentationName: "Asistente", brandName: "Estudio de prueba" };

// ---------------------------------------------------------------- contrato
test("contrato: retiene precios, cuotas, plazos, urgencia, identidad humana y dictámenes", () => {
  const casos: [string, string][] = [
    ["Son $ 45.000 por mes.", "precio_o_importe"],
    ["Podés pagarlo en 12 cuotas sin interés.", "cuotas_o_financiacion"],
    ["Seguro ganás el juicio.", "plazo_o_resultado_prometido"],
    ["Quedan solo 2 lugares, decidí hoy.", "urgencia_inventada"],
    ["Soy la doctora Pérez, abogada del estudio.", "identidad_humana_falsa"],
    ["Te corresponde una indemnización por despido.", "diagnostico_o_dictamen"],
    ["Hola\n\nUno\n\nDos\n\nTres\n\nCuatro", "varios_mensajes"],
  ];
  for (const [texto, motivo] of casos) {
    const v = validarTextoSalida(texto);
    assert.equal(v.ok, false, texto);
    assert.ok(v.motivos.includes(motivo as any), `${texto} → ${v.motivos.join(",")}`);
  }
  assert.equal(validarTextoSalida("").ok, false);
  assert.equal(validarTextoSalida("x".repeat(901)).ok, false);
});

test("contrato: deja pasar una respuesta normal y la instrucción de reparación nombra el motivo", () => {
  const ok = validarTextoSalida("Gracias por contarme. ¿Preferís que te escriban por la tarde?");
  assert.equal(ok.ok, true);
  const v = validarTextoSalida("Cuesta $ 10.000.");
  assert.match(instruccionReparacion(v), /importe|precio/i);
});

test("contrato: normalizarSalida separa texto, acciones permitidas y datos", () => {
  const s = normalizarSalida([
    { text: "Anoto eso." },
    { functionCall: { name: "guardar_datos_calificacion", args: { datos: { lesion: "hombro" } } } },
    { functionCall: { name: "borrar_todo", args: {} } },
  ], ["mensaje"]);
  assert.equal(s.texto, "Anoto eso.");
  assert.deepEqual(s.acciones.map((a) => a.herramienta), ["guardar_datos_calificacion"]);
  assert.equal(s.datos.lesion, "hombro");
  assert.ok(HERRAMIENTAS_PERMITIDAS.includes("captar"));
  assert.ok(!HERRAMIENTAS_PERMITIDAS.includes("borrar_todo" as any));
});

// ---------------------------------------------------------------- módulos
test("módulos: señales y selección por rubro/modo (comunes + rubro + hasta 4 comerciales)", () => {
  assert.ok(detectarSenales("¿cuánto cobran?").includes("precio"));
  assert.ok(detectarSenales("no me escribas más").includes("enojo"));
  assert.ok(detectarSenales("quiero hablar con una persona").includes("pide_persona"));
  assert.ok(detectarSenales("[Audio]", { esAudioODocumento: true }).includes("audio"));
  const sel = seleccionarModulos({ rubro: "juridico", modo: "frio", senales: ["apertura", "precio"] });
  assert.ok(sel.some((m) => m.tipo === "instrucciones_comunes"));
  assert.ok(sel.some((m) => m.rubro === "juridico"));
  assert.ok(!sel.some((m) => m.rubro && m.rubro !== "juridico"));
  assert.ok(sel.filter((m) => m.tipo === "comercial").length <= 4);
  assert.ok(textoDeModulos(sel).length > 200);
  assert.ok(TODOS_LOS_MODULOS.length >= 10);
});

// ---------------------------------------------------------------- contexto
test("contexto: el resumen y la instrucción del sistema incluyen reglas, identidad y módulos", () => {
  const r = armarResumen({ rubro: "juridico", qualificationData: { lesion: "hombro" }, zona: "amba" });
  assert.match(textoResumen(r), /hombro/);
  const ctx = armarContexto({ rubro: "juridico", modo: "consulta_actual", identidad, instruccionesAgente: "Tono cálido.", resumen: r, ultimoMensaje: "¿cuánto cuesta?", primerTurno: true });
  assert.match(ctx.systemInstruction, /Asistente/);
  assert.match(ctx.systemInstruction, /Tono cálido/);
  assert.ok(ctx.senales.includes("precio"));
  assert.ok(ctx.modulos.length >= 3);
});

// ---------------------------------------------------------------- modelo
test("modelo: el informe no expone claves y Vertex no llama a nada sin configuración", async () => {
  const inf = informeModeloActivo({ GEMINI_API_KEY: "secreto", GEMINI_MODEL: "gemini-x" });
  assert.equal(inf.identificador, "gemini-x");
  assert.equal(inf.claveConfigurada, true);
  assert.ok(!JSON.stringify(inf).includes("secreto"));
  assert.equal(configuracionVertex({}).configurado, false);
  await assert.rejects(generadorVertex("tuned-1", {})({ contents: [], systemInstruction: "", tools: [] }), ModeloNoDisponibleError);
});

// ---------------------------------------------------------------- simulador
const caso = (id: string) => CASOS.find((c) => c.id === id)!;

test("simulador W01: consulta resuelta → detención necesidad_resuelta sin captar, con disculpa única", async () => {
  const c = caso("W01");
  const gen = generadorSimulado({
    1: [{ text: "Puede ser que haya sido hace tiempo. ¿Te suena una consulta por un accidente laboral?" }],
    2: [{ functionCall: { name: "detener_contacto", args: { motivo: "caso_resuelto" } } }],
    3: [{ text: "Gracias por aclararlo. Disculpá la molestia; dejamos esta consulta cerrada." }],
  });
  const r = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: c.mensajes, aperturaEnviada: c.aperturaEnviada, hechos: c.hechos }, gen);
  assert.equal(r.estado.detenido, "necesidad_resuelta");
  assert.equal(r.estado.captado, false);
  const ev = evaluarSimulacion(r, c.esperado);
  assert.deepEqual(ev.fallos_criticos, []);
  assert.ok(ev.comercial >= 14, `comercial ${ev.comercial}`);
});

test("simulador W08: precio aislado + pide persona → captar(solo_precio) pausa el chat y no responde más", async () => {
  const c = caso("W08");
  const gen = generadorSimulado({
    1: [{ functionCall: { name: "captar", args: { solo_precio: true, aceptacion: false, evidencia: "" } } }],
    2: [{ text: "Dejo tu consulta como prioridad para que el equipo te dé una respuesta concreta." }],
  });
  const r = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: c.mensajes }, gen);
  assert.equal(r.estado.captado, false);
  assert.equal(r.estado.atencionHumana, "precio_fuera_alcance");
  assert.equal(r.turnos.filter((t) => t.rol === "sistema").length, 1, "el segundo mensaje no recibe respuesta automática");
  const ev = evaluarSimulacion(r, c.esperado);
  assert.deepEqual(ev.fallos_criticos, []);
});

test("simulador W09: enojo → detención y una sola disculpa; insistir sería contacto indebido", async () => {
  const c = caso("W09");
  const gen = generadorSimulado({
    1: [{ functionCall: { name: "detener_contacto", args: { motivo: "enojo_por_contacto" } } }],
    2: [{ text: "Disculpá la molestia. Dejamos registrado que no querés recibir más mensajes." }],
  });
  const r = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: c.mensajes, aperturaEnviada: c.aperturaEnviada }, gen);
  assert.equal(r.estado.detenido, "enojo");
  const ev = evaluarSimulacion(r, c.esperado);
  assert.deepEqual(ev.fallos_criticos, []);
  assert.equal(ev.controles.sin_insistencia, true);
});

test("simulador: un precio en la respuesta se repara una vez; si insiste, se retiene y pasa a persona", async () => {
  const c = caso("W08");
  const reparable = generadorSimulado({
    1: [{ text: "Son $ 50.000 por mes." }],
    2: [{ text: "No puedo adelantar valores; el equipo te pasa una propuesta concreta." }],
  });
  const r1 = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: [c.mensajes[0]] }, reparable);
  const t1 = r1.turnos.find((t) => t.rol === "asesor")!;
  assert.equal(t1.validacion.reparado, true);
  assert.doesNotMatch(t1.texto ?? "", /\$/);

  const terco = generadorSimulado({ 1: [{ text: "Son $ 50.000." }], 2: [{ text: "Bueno, $ 48.000." }] });
  const r2 = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: [c.mensajes[0]] }, terco);
  const t2 = r2.turnos.find((t) => t.rol === "asesor")!;
  assert.equal(t2.validacion.retenido, true);
  assert.equal(t2.texto, null);
  assert.equal(r2.estado.atencionHumana, "consulta_fuera_alcance");
  assert.equal(r2.estado.chatPausado, true);
});

test("simulador: captar sin aceptación no capta; con aceptación y evidencia capta y pausa", async () => {
  const c = caso("W04");
  const sinAcept = generadorSimulado({
    1: [{ functionCall: { name: "captar", args: { aceptacion: false, evidencia: "" } } }],
    2: [{ text: "Contame un poco más y lo dejamos listo." }],
  });
  const r = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: [c.mensajes[0]] }, sinAcept);
  assert.equal(r.estado.captado, false);
  const ok = generadorSimulado({
    1: [{ functionCall: { name: "elegir_ruta_juridica", args: { ruta: "directa" } } }, { functionCall: { name: "captar", args: { aceptacion: true, evidencia: "Sí, por mensaje." } } }],
    2: [{ text: "Dejamos la información para que un profesional se comunique por mensaje." }],
  });
  const r2 = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: c.mensajes }, ok);
  assert.equal(r2.estado.captado, true);
  assert.equal(r2.estado.rutaJuridica, "directa");
  const ev = evaluarSimulacion(r2, c.esperado);
  assert.deepEqual(ev.fallos_criticos, []);
});

test("simulador: herramienta que falla + confirmación en el texto = falsa_accion", async () => {
  const c = caso("W02");
  const gen = generadorSimulado({
    1: [{ functionCall: { name: "programar_fase2", args: { horario: "mañana 18:00" } } }],
    2: [{ text: "Listo, te quedó agendado para mañana a las 18." }],
  });
  const r = await simularConversacion({ rubro: c.rubro, area: c.area, modo: c.modo, identidad, mensajesProspecto: [c.mensajes[1]], fallar: ["programar_fase2"] }, gen);
  assert.deepEqual(r.estado.herramientasFallidas, ["programar_fase2"]);
  const ev = evaluarSimulacion(r, c.esperado);
  assert.ok(ev.fallos_criticos.includes("falsa_accion"));
});

// ---------------------------------------------------------------- evaluación
test("evaluación: la decisión de comparación respeta umbrales fijos y fallos críticos", () => {
  const ref = { variante: "A" as const, porRol: { juridico: { comercial: 14, naturalidad: 12, casos: 10, fallos: 0 } }, fallosCriticos: 0 };
  const bueno = { variante: "B" as const, porRol: { juridico: { comercial: 15, naturalidad: 12, casos: 10, fallos: 0 } }, fallosCriticos: 0, preferenciasGanadas: 7, comparaciones: 10 };
  assert.equal(decidirComparacion(bueno, ref).aprobado, true);
  const conFallo = { ...bueno, fallosCriticos: 1 };
  assert.equal(decidirComparacion(conFallo, ref).aprobado, false);
  const regresion = { ...bueno, porRol: { juridico: { comercial: 12, naturalidad: 12, casos: 10, fallos: 0 } } };
  const d = decidirComparacion(regresion, ref);
  assert.equal(d.aprobado, false);
  assert.ok(d.motivos.some((m) => /regresión|< 14/.test(m)));
  const pocaPref = { ...bueno, preferenciasGanadas: 5 };
  assert.equal(decidirComparacion(pocaPref, ref, UMBRALES_PROPUESTOS).aprobado, false);
});

// ---------------------------------------------------------------- corpus
function casoCorpus(c: (typeof CASOS)[number], revision: CasoCorpus["revision"] = "aprobado"): CasoCorpus {
  const mensajes: CasoCorpus["mensajes"] = [];
  if (c.aperturaEnviada) mensajes.push({ rol: "asesor", texto: c.aperturaEnviada });
  c.mensajes.forEach((m, i) => {
    mensajes.push({ rol: "prospecto", texto: m });
    if (i < c.mensajes.length - 1) mensajes.push({ rol: "asesor", texto: "Entiendo, contame más." });
  });
  return { clave: c.id, familia: c.familia, rubro: c.rubro, area: c.area, modo: c.modo, particion: particionPara(c.familia, c.rubro), hechos: c.hechos ?? {}, mensajes, respuesta_correcta: c.respuestaCorrecta, revision, instrucciones: "Reglas de prueba." };
}

test("corpus: 16 casos de control en ≥ 10 familias; la partición es determinista y por familia", () => {
  assert.equal(CASOS.length, 16);
  assert.ok(Object.keys(casosPorFamilia()).length >= 10);
  assert.equal(particionPara("frio", "juridico"), particionPara("frio", "juridico"));
  const casos = CASOS.map((c) => casoCorpus(c));
  assert.deepEqual(familiasCruzadas(casos), []);
  const plan = planDistribucion(casos);
  assert.equal(plan.totalAprobados, 16);
  assert.equal(plan.pilotoCompleto, false);
  assert.equal(plan.porRubro.juridico.entrenamiento.meta, 150);
});

test("corpus: solo se exportan casos aprobados, el JSONL valida y es reproducible", () => {
  const casos = CASOS.map((c, i) => casoCorpus(c, i === 0 ? "pendiente" : "aprobado"));
  const particiones = ["entrenamiento", "validacion", "reservado"] as const;
  let total = 0;
  for (const p of particiones) {
    const { lineas, omitidos } = exportarJsonl(casos, p);
    total += lineas.length;
    const v = validarJsonl(lineas);
    assert.deepEqual(v.errores, []);
    if (casos[0].particion === p) assert.equal(omitidos.length, 1);
    assert.equal(hashCorpus(lineas), hashCorpus(exportarJsonl(casos, p).lineas));
  }
  assert.equal(total, 15);
  const ej = casoAEjemplo(casos[1]);
  assert.equal(ej.contents[ej.contents.length - 1].role, "model");
  assert.ok(ej.systemInstruction.parts[0].text.length > 0);
});

test("corpus: validarJsonl detecta estructura inválida y anonimizar quita teléfonos y correos", () => {
  const malo = JSON.stringify({ systemInstruction: { parts: [{ text: "" }] }, contents: [{ role: "user", parts: [{ text: "hola" }] }] });
  const v = validarJsonl([malo, "{no json"]);
  assert.equal(v.ok, false);
  assert.ok(v.errores.length >= 3);
  const a = anonimizar("Llamame al +54 11 4567 8901 o a juan@ejemplo.com, soy [[Juan]]");
  assert.doesNotMatch(a, /4567|ejemplo\.com|Juan/);
});
