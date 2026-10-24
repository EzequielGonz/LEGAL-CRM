// Etapa 2 · Bloque 1 — Origen de tarea, entrantes 24 h, captación por rubro,
// resultado posterior, atención humana (12.2) y citas (Fase 2 y reagendamiento).
import test from "node:test";
import assert from "node:assert/strict";
import { decidirRespuestaEntrante, decidirSalidaEmpresa, politicaPorOrigen, type CondicionesEntrante } from "@/lib/contacto/origen";
import {
  clasificarAtencion,
  evaluarCaptacion,
  MOTIVOS_AGENTE,
  normalizarZona,
  TRATAMIENTO_ATENCION,
  validarResultadoPosterior,
} from "@/lib/captacion/reglas";
import { decidirReagendamiento, horarioFase2 } from "@/lib/citas/reglas";
import { calendarWith } from "@/lib/contacto/reglas";

const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};
const H = 3600 * 1000;

// Domingo 18/10/2026 a las 23:30 y lunes 19 a las 10.
const DOMINGO_NOCHE = art("2026-10-18", 23, 30);
const LUNES = art("2026-10-19", 10);

const base: CondicionesEntrante = {
  entrante24hHabilitado: true,
  agenteActivo: true,
  pausaIa: false,
  chatTomado: false,
  legible: true,
  detenido: false,
  captado: false,
  ventanaAbierta: true,
};

test("A08: de noche o en domingo la IA responde un entrante solo con la atención 24 h habilitada", () => {
  assert.deepEqual(decidirRespuestaEntrante(base, DOMINGO_NOCHE), { responder: true });
  assert.deepEqual(decidirRespuestaEntrante({ ...base, entrante24hHabilitado: false }, DOMINGO_NOCHE), {
    responder: false,
    motivo: "fuera_de_horario_sin_24h",
  });
  // En horario general responde aunque la 24 h esté apagada.
  assert.deepEqual(decidirRespuestaEntrante({ ...base, entrante24hHabilitado: false }, LUNES), { responder: true });
});

test("A08: nunca con pausa general, chat tomado, agente apagado o mensaje no legible (aunque haya 24 h)", () => {
  assert.equal((decidirRespuestaEntrante({ ...base, pausaIa: true }, LUNES) as any).motivo, "pausa_general");
  assert.equal((decidirRespuestaEntrante({ ...base, chatTomado: true }, LUNES) as any).motivo, "chat_tomado");
  assert.equal((decidirRespuestaEntrante({ ...base, agenteActivo: false }, DOMINGO_NOCHE) as any).motivo, "agente_inactivo");
  assert.equal((decidirRespuestaEntrante({ ...base, legible: false }, LUNES) as any).motivo, "no_legible");
  assert.equal((decidirRespuestaEntrante({ ...base, captado: true }, LUNES) as any).motivo, "captado_mensaje_posterior");
  assert.equal((decidirRespuestaEntrante({ ...base, detenido: true }, LUNES) as any).motivo, "detenido");
  // La pausa gana sobre todo lo demás.
  assert.equal((decidirRespuestaEntrante({ ...base, pausaIa: true, chatTomado: true, captado: true }, LUNES) as any).motivo, "pausa_general");
});

test("A09: una salida de la empresa (seguimiento, reagendamiento, inicio de cita) nunca sale en domingo, aunque haya 24 h", () => {
  for (const origen of ["seguimiento", "reagendamiento", "inicio_cita", "inicio_campana", "recuperacion"] as const) {
    assert.equal(politicaPorOrigen(origen), "salida_empresa");
    assert.deepEqual(
      decidirSalidaEmpresa({ origen, pausaEnvios: false, detenido: false, chatTomado: false }, DOMINGO_NOCHE),
      { enviar: false, motivo: "fuera_de_horario" }
    );
    assert.deepEqual(decidirSalidaEmpresa({ origen, pausaEnvios: false, detenido: false, chatTomado: false }, LUNES), { enviar: true });
    assert.equal((decidirSalidaEmpresa({ origen, pausaEnvios: true, detenido: false, chatTomado: false }, LUNES) as any).motivo, "pausa_general");
  }
  assert.equal(politicaPorOrigen("respuesta_entrante"), "entrante");
  assert.equal((decidirSalidaEmpresa({ origen: "respuesta_entrante", pausaEnvios: false, detenido: false, chatTomado: false }, LUNES) as any).motivo, "origen_no_automatico");
  // Un feriado cerrado por excepción también frena la salida.
  const cerrado = calendarWith([{ day: "2026-10-19", closed: true, startHour: null, endHour: null }]);
  assert.equal(
    (decidirSalidaEmpresa({ origen: "seguimiento", pausaEnvios: false, detenido: false, chatTomado: false }, LUNES, cerrado) as any).motivo,
    "fuera_de_horario"
  );
});

test("A17: captación incompleta o fuera de AMBA: captado con advertencias y grupo identificable", () => {
  const r = evaluarCaptacion({
    rubro: "coberturas_medicas",
    aceptacion: true,
    evidencia: "Acepta que lo llame el asesor",
    datos: { cobertura_actual: "OSDE" },
    zona: "fuera",
  });
  assert.equal(r.captar, true);
  assert.equal(r.zona, "fuera");
  assert.equal(r.fueraDeZona, true);
  assert.ok(r.advertencias.includes("localidad"));
  assert.ok(!r.advertencias.includes("cobertura_actual"));
  // Sin ubicación: «sin confirmar», nunca AMBA, y queda la advertencia.
  const s = evaluarCaptacion({ rubro: "agencia_0km", aceptacion: true, evidencia: "Quiere hablar con el vendedor", datos: {} });
  assert.equal(s.captar, true);
  assert.equal(s.zona, "sin_confirmar");
  assert.ok(s.advertencias.includes("ubicacion_sin_confirmar"));
  assert.equal(normalizarZona("Palermo"), "sin_confirmar");
});

test("C06/C07: sin aceptación o sin evidencia no capta; solo preguntar el precio no capta", () => {
  assert.equal(evaluarCaptacion({ rubro: "agencia_0km", aceptacion: false, evidencia: "x", datos: {} }).motivo, "sin_aceptacion");
  assert.equal(evaluarCaptacion({ rubro: "agencia_0km", aceptacion: true, evidencia: "  ", datos: {} }).motivo, "sin_evidencia");
  const precio = evaluarCaptacion({ rubro: "marketing", aceptacion: true, evidencia: "¿Cuánto sale?", datos: {}, soloPrecio: true });
  assert.equal(precio.captar, false);
  assert.equal(precio.motivo, "solo_precio");
  // Marketing no registra zona.
  assert.equal(precio.zona, "sin_confirmar");
  assert.ok(!precio.advertencias.includes("ubicacion_sin_confirmar"));
});

test("A20: el resultado posterior es otra dimensión, solo después de derivar y con motivo cuando no avanza", () => {
  assert.equal(validarResultadoPosterior({ derivado: false, resultado: "avanzo", fuente: "profesional" }).ok, false);
  assert.equal(validarResultadoPosterior({ derivado: true, resultado: "inventado", fuente: "profesional" }).ok, false);
  assert.equal(validarResultadoPosterior({ derivado: true, resultado: "avanzo", fuente: "nadie" }).ok, false);
  assert.equal(validarResultadoPosterior({ derivado: true, resultado: "no_avanzo", fuente: "operador" }).ok, false);
  const ok = validarResultadoPosterior({ derivado: true, resultado: "no_avanzo", fuente: "operador", motivo: "presupuesto", nota: "  Lo piensa  " });
  assert.deepEqual(ok, { ok: true, resultado: "no_avanzo", fuente: "operador", motivo: "presupuesto", nota: "Lo piensa" });
  const p = validarResultadoPosterior({ derivado: true, resultado: "contacto_previsto", fuente: "profesional", motivo: "presupuesto" });
  assert.equal(p.ok && p.motivo, null);
});

test("A14: rechazo, enojo o número equivocado → disculpa breve y detención, fuera de la atención principal", () => {
  for (const m of ["no_quiere_mensajes", "enojo_por_contacto", "numero_equivocado", "caso_resuelto", "abogado_existente"] as const) {
    const t = clasificarAtencion(m);
    assert.equal(t.categoria, "detencion");
    assert.equal(t.principal, false, m);
    assert.equal(t.pausarChat, true);
    assert.equal(t.respuesta, "disculpa_breve");
    assert.ok(t.detener);
  }
  assert.equal(clasificarAtencion("no_quiere_mensajes").detener, "no_contacto");
  assert.equal(clasificarAtencion("numero_de_menor").menor, true);
});

test("A15: pide una persona o un precio fuera de alcance → atención comercial principal con pausa del chat", () => {
  for (const m of ["pide_persona", "precio_fuera_alcance", "decision_profesional", "consulta_fuera_alcance", "datos_sensibles"] as const) {
    const t = clasificarAtencion(m);
    assert.equal(t.categoria, "comercial");
    assert.equal(t.principal, true);
    assert.equal(t.pausarChat, true);
    assert.equal(t.detener, null);
  }
  // 24/10: origen de los datos o pedido de baja → disculpa y detención, sin pendiente principal.
  for (const m of ["pregunta_procedencia", "procedencia_no_comprobable", "reclamo_datos", "solicitud_eliminacion"] as const) {
    const t = clasificarAtencion(m);
    assert.equal(t.principal, false);
    assert.equal(t.detener, "no_contacto");
    assert.equal(t.respuesta, "disculpa_datos");
  }
  // Un motivo desconocido se conserva como registro histórico, sin pausar.
  const h = clasificarAtencion("algo_raro");
  assert.equal(h.motivo, "motivo_historico");
  assert.equal(h.pausarChat, false);
  // El agente no puede marcar incidencias ni registros históricos.
  for (const m of MOTIVOS_AGENTE) assert.notEqual(TRATAMIENTO_ATENCION[m].categoria, "incidencia_operativa");
});

test("A18: la Fase 2 de IA empieza unos 2 minutos después o en el horario elegido", () => {
  const now = LUNES;
  assert.equal(horarioFase2(now).startsAt.getTime(), now.getTime() + 2 * 60_000);
  const elegido = new Date(now.getTime() + 3 * H);
  assert.equal(horarioFase2(now, elegido).startsAt.getTime(), elegido.getTime());
  // Un horario en el pasado no se usa.
  assert.equal(horarioFase2(now, new Date(now.getTime() - H)).startsAt.getTime(), now.getTime() + 2 * 60_000);
});

test("A13: cita incumplida → un solo reagendamiento una hora después del inicio realmente enviado, en franja válida", () => {
  const enviado = art("2026-10-19", 10, 7);
  const d = decidirReagendamiento({ inicioEnviadoAt: enviado, esReagendamiento: false, yaReagendada: false, ultimoEntranteAt: art("2026-10-19", 9) });
  assert.equal(d.programar, true);
  assert.equal(d.programar && d.at.getTime(), enviado.getTime() + H);
  assert.equal(d.programar && d.mensaje, "texto_libre");
  // Enviado a las 20:30 del sábado: la hora siguiente cae fuera; pasa al lunes 8.
  const tarde = decidirReagendamiento({ inicioEnviadoAt: art("2026-10-17", 20, 30), esReagendamiento: false, yaReagendada: false, ultimoEntranteAt: null });
  assert.equal(tarde.programar && tarde.at.getTime(), art("2026-10-19", 8).getTime());
  assert.equal(tarde.programar && tarde.mensaje, "plantilla");
  // Nunca dos reagendamientos, ni reagendar un reagendamiento, ni sin inicio enviado, ni si respondió.
  assert.equal((decidirReagendamiento({ inicioEnviadoAt: enviado, esReagendamiento: false, yaReagendada: true, ultimoEntranteAt: null }) as any).motivo, "ya_reagendada");
  assert.equal((decidirReagendamiento({ inicioEnviadoAt: enviado, esReagendamiento: true, yaReagendada: false, ultimoEntranteAt: null }) as any).motivo, "ya_es_reagendamiento");
  assert.equal((decidirReagendamiento({ inicioEnviadoAt: null, esReagendamiento: false, yaReagendada: false, ultimoEntranteAt: null }) as any).motivo, "sin_inicio_enviado");
  assert.equal(
    (decidirReagendamiento({ inicioEnviadoAt: enviado, esReagendamiento: false, yaReagendada: false, ultimoEntranteAt: new Date(enviado.getTime() + 60_000) }) as any).motivo,
    "respondio"
  );
});

// Bloque 2 — enlaces de indicadores y retorno seguro.
import { enlaceIndicador, indicadorPorClave, rubroIdDe, volverSeguro, INDICADORES } from "@/lib/indicadores";

test("A05: el retorno solo acepta rutas internas y el enlace conserva perfil e indicador", () => {
  assert.equal(volverSeguro("/estadisticas?x=1"), "/estadisticas?x=1");
  assert.equal(volverSeguro("//otra.web"), null);
  assert.equal(volverSeguro("https://otra.web"), null);
  assert.equal(volverSeguro("/\\otra"), null);
  assert.equal(enlaceIndicador("marketing", "captado", "/estadisticas"), "/oportunidades?perfil=marketing&indicador=captado&volver=%2Festadisticas");
  assert.equal(enlaceIndicador("marketing", "captado", "https://x"), "/oportunidades?perfil=marketing&indicador=captado");
  assert.equal(rubroIdDe("juridico"), "11111111-1111-1111-1111-111111111111");
  assert.equal(rubroIdDe("44444444-4444-4444-4444-444444444444"), "44444444-4444-4444-4444-444444444444");
  assert.equal(rubroIdDe("otro"), null);
  assert.equal(indicadorPorClave("inexistente"), null);
  assert.equal(new Set(INDICADORES.map((i) => i.clave)).size, INDICADORES.length, "claves únicas");
});

// Bloque 3 — Fuente (2.8) y pedido de texto (2.6).
import { detectarFuente, identificadoresValidos, correspondePedidoTexto } from "@/lib/fuente";

test("2.8: la fuente se acredita solo con referencia; sin referencia queda «no informada»", () => {
  assert.deepEqual(detectarFuente({ channelType: "whatsapp", body: "Hola" }), { fuente: "no_informada", detalle: null });
  assert.equal(detectarFuente({ channelType: "whatsapp", metadata: { referral: { source_type: "ad", source_id: "123", headline: "Consulta" } } }).fuente, "anuncio");
  assert.equal(detectarFuente({ channelType: "whatsapp", metadata: { referral: { source_type: "post", source_url: "https://www.instagram.com/p/x" } } }).fuente, "instagram");
  assert.equal(detectarFuente({ channelType: "whatsapp", metadata: { referral: { source_type: "post", source_url: "https://fb.me/abc" } } }).fuente, "facebook");
  assert.equal(detectarFuente({ channelType: "instagram" }).fuente, "instagram");
  const ids = identificadoresValidos([
    { texto: "Hola, vengo desde la web", fuente: "landing" },
    { texto: "corto", fuente: "landing" },
    { texto: "Algo largo de verdad", fuente: "inventada" },
    { texto: "Algo largo y no informado", fuente: "no_informada" },
  ]);
  assert.equal(ids.length, 1);
  assert.equal(detectarFuente({ channelType: "whatsapp", body: "hola, VENGO DESDE LA WEB!!", identificadores: ids }).fuente, "landing");
  assert.equal(detectarFuente({ channelType: "whatsapp", body: "Hola", contactSource: "base_de_datos" }).fuente, "base_importada");
});

test("2.6: el pedido de texto ante un audio sale como mucho una vez cada 30 minutos (24/10)", () => {
  const now = new Date("2026-10-19T13:00:00Z");
  assert.equal(correspondePedidoTexto(null, now), true);
  // 24/10: como mucho un pedido cada 30 minutos (antes 12 h).
  assert.equal(correspondePedidoTexto(new Date(now.getTime() - 10 * 60_000), now), false);
  assert.equal(correspondePedidoTexto(new Date(now.getTime() - 30 * 60_000), now), true);
});

// Bloque 4 — Biblioteca de agentes: solo configuración, nunca activa.
import { limitesEfectivos, validarCambioAgente } from "@/lib/agentes/biblioteca";

test("bloque 4: la biblioteca no permite activar, ni guardar claves o teléfonos; los derivados heredan los límites", () => {
  assert.equal(validarCambioAgente({ estado: "activo" }).ok, false);
  assert.equal(validarCambioAgente({ estado: "borrador" }).ok, true);
  assert.equal(validarCambioAgente({ objetivo: "Usar la clave EAAB1234567890abcdefghijklmn" }).ok, false);
  assert.equal(validarCambioAgente({ objetivo: "Llamar al +54 9 11 5555-1234" }).ok, false);
  assert.equal(validarCambioAgente({ nombre: "" }).ok, false);
  assert.equal(validarCambioAgente({ modos: ["frio", "inventado"] as any }).ok, false);
  assert.equal(validarCambioAgente({}).ok, false);
  assert.deepEqual(
    limitesEfectivos({ rol: "derivado", limites: ["B", "A"] }, { limites: ["A", "C"] }),
    ["A", "C", "B"]
  );
  assert.deepEqual(limitesEfectivos({ rol: "principal", limites: ["A"] }, null), ["A"]);
});

// Bloque 5 — Política de autopublicación y Search Console (sin conectar).
import { evaluarPieza, estadoInicial, clasificarFalloPublicacion, frasesSensibles } from "@/lib/contenido/politica";
import { configuracionSearchConsole, firmarEstado, verificarEstado, cifrarToken, descifrarToken, urlAutorizacion } from "@/lib/seo/search-console";
import { cambioPidePin, validarCambioPolitica } from "@/lib/contenido/panel";

const POL = { habilitada: true, calendario_pausado: false, destino_ref: "pagina-prueba", ctas: [{ tipo: "landing", url: "https://perfil.prueba.invalid/consulta" }] };
const BASE = {
  canal: "facebook" as const,
  formato: "post" as const,
  texto: "¿Tuviste un accidente de trabajo? Contanos qué pasó y te orientamos sobre los próximos pasos.",
  cta_url: "https://perfil.prueba.invalid/consulta/",
};

test("A28: una pieza rutinaria válida se publica; la sensible sin evidencia se retiene con motivo", () => {
  assert.deepEqual(evaluarPieza(BASE, POL), { publicable: true, retener: false, motivos: [] });
  const precio = evaluarPieza({ ...BASE, texto: "Consultá ahora: cuotas sin interés y 20% de descuento." }, POL);
  assert.equal(precio.retener, true);
  assert.ok(precio.motivos.includes("contenido_sensible"));
  const conEvidencia = evaluarPieza(
    { ...BASE, texto: "Atendemos de lunes a viernes. Plazo de respuesta: en 2 días hábiles.", afirmaciones: [{ texto: "Plazo de respuesta: en 2 días hábiles.", evidencia: "Política del perfil revisada" }] },
    POL
  );
  assert.equal(conEvidencia.publicable, true);
  assert.ok(evaluarPieza({ ...BASE, texto: "Escribinos al [completar teléfono]" }, POL).motivos.includes("placeholder"));
  assert.ok(evaluarPieza({ ...BASE, cta_url: "https://otra.web/x" }, POL).motivos.includes("cta_no_autorizado"));
  assert.ok(evaluarPieza({ ...BASE, cta_url: "" }, POL).motivos.includes("sin_cta"));
  assert.ok(evaluarPieza({ ...BASE, canal: "instagram" }, POL).motivos.includes("falta_media"));
  assert.ok(evaluarPieza({ ...BASE, canal: "instagram", media: [{ tipo: "imagen", ref: "x" }] }, POL).motivos.includes("media_sin_texto_alternativo"));
  assert.ok(frasesSensibles("Te garantizamos la indemnización.").length === 1);
});

test("sin política habilitada la pieza buena queda «lista» (no retenida) y no se programa", () => {
  const ev = evaluarPieza(BASE, { ...POL, habilitada: false });
  assert.equal(ev.publicable, false);
  assert.equal(ev.retener, false);
  assert.equal(estadoInicial(ev, true), "lista");
  assert.equal(estadoInicial(evaluarPieza(BASE, POL), true), "programada");
  assert.equal(estadoInicial(evaluarPieza(BASE, { ...POL, destino_ref: null }), true), "lista");
  assert.equal(clasificarFalloPublicacion({ tipo: "sin_respuesta" }), "incierta");
  assert.equal(clasificarFalloPublicacion({ status: 401 }), "token_vencido");
  assert.equal(clasificarFalloPublicacion({ status: 400 }), "error");
});

test("A29/Search Console: sin variables ni habilitación no conecta; estado firmado y token cifrado", () => {
  assert.equal(configuracionSearchConsole({}).lista, false);
  const env = { GSC_CLIENT_ID: "id", GSC_CLIENT_SECRET: "s", GSC_REDIRECT_URI: "https://x.invalid/vuelta", GSC_TOKEN_KEY: "k".repeat(40), SEARCH_CONSOLE_ENABLED: "true" };
  assert.equal(configuracionSearchConsole(env).lista, true);
  assert.equal(configuracionSearchConsole({ ...env, SEARCH_CONSOLE_ENABLED: "false" }).lista, false);
  const t = 1_800_000_000_000;
  const st = firmarEstado("rubro-1", t, env);
  assert.deepEqual(verificarEstado(st, t + 60_000, env), { ok: true, rubroId: "rubro-1" });
  assert.equal(verificarEstado(st, t + 11 * 60_000, env).ok, false, "vence");
  assert.equal(verificarEstado(st.replace(/.$/, (c) => (c === "A" ? "B" : "A")), t, env).ok, false, "firma alterada");
  const c = cifrarToken("token-de-prueba", env);
  assert.ok(!c.includes("token-de-prueba"));
  assert.equal(descifrarToken(c, env), "token-de-prueba");
  assert.equal(descifrarToken(c, { ...env, GSC_TOKEN_KEY: "z".repeat(40) }), null);
  assert.ok(urlAutorizacion(st, env).includes("webmasters.readonly"));
  assert.equal(cambioPidePin({ calendario_pausado: true }), false);
  assert.equal(cambioPidePin({ calendario_pausado: false }), true);
  assert.equal(cambioPidePin({ habilitada: true }), true);
  assert.equal(validarCambioPolitica({ frecuencia_semanal: 99 }).ok, false);
});
