import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  caminoArea,
  diaCorto,
  diasDeLaSemana,
  etiquetaDia,
  fechaCortaAr,
  marcarCifra,
  nombreCorto,
  palabrasDeCartel,
  porcentajeTexto,
  proporcion,
  sumaSerie,
  tarjetaDeHerramienta,
  tarjetasDeResultados,
  textoParaVoz,
} from "../../src/lib/jarvis/tablero";
import { ACCIONES_SIEMPRE, todasLasAcciones } from "../../src/lib/jarvis/pantallas";
import { operacionPorClave, FUERA_DEL_CATALOGO } from "../../src/lib/asistente/catalogo";
import { nivelDeOperacion } from "../../src/lib/asistente/catalogo-tipos";
import { bloqueJarvis, VERSION_PROMPT_JARVIS } from "../../src/lib/jarvis/prompt";
import { decisionConfirmar } from "../../src/lib/jarvis/seguridad";

// Vuelta 6 (22/11) · «Jarvis lo mismo, antes estaba con gráficos de estadísticas mejor armado» y
// «que Jarvis pueda hacer TODO, preguntándome antes siempre».

test("los 7 días de la semana salen en hora de Argentina, del más viejo a hoy", () => {
  // 22/11/2026 02:00 UTC = 21/11 23:00 en Argentina: «hoy» todavía es el 21.
  const d = diasDeLaSemana(Date.parse("2026-11-22T02:00:00Z"));
  assert.equal(d.length, 7);
  assert.equal(d[6].dia, "2026-11-21");
  assert.equal(d[0].dia, "2026-11-15");
  assert.equal(d[6].desde, "2026-11-21T03:00:00.000Z");
  assert.equal(d[6].hasta, "2026-11-22T03:00:00.000Z");
  for (let i = 1; i < 7; i++) assert.equal(d[i].desde, d[i - 1].hasta, "días pegados, sin huecos");
  assert.equal(etiquetaDia("2026-11-22"), "do");
  assert.equal(etiquetaDia("2026-11-23"), "lu");
  assert.equal(etiquetaDia("no"), "");
  assert.equal(diaCorto("2026-11-22"), "22/11");
});

test("el camino del gráfico de área queda dentro de la caja y no inventa valores", () => {
  const { linea, area, puntos } = caminoArea([0, 4, 10, null, 2, 8, 5], 300, 90);
  assert.equal(puntos.length, 7);
  for (const [x, y] of puntos) {
    assert.ok(x >= 0 && x <= 300);
    assert.ok(y >= 0 && y <= 90);
  }
  // El máximo toca el techo (margen 6) y el cero o el día sin dato, el piso.
  assert.equal(puntos[2][1], 6);
  assert.equal(puntos[0][1], 89);
  assert.equal(puntos[3][1], 89);
  assert.match(linea, /^M0 89 C/);
  assert.match(area, /Z$/);
  // Sin datos: línea plana abajo.
  assert.equal(caminoArea([], 300, 90).linea, "M0 89 L300 89");
  for (const n of (linea.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)) assert.ok(n >= 0 && n <= 300);
});

test("proporciones y porcentajes nunca pasan de 100 % ni dividen por cero", () => {
  assert.equal(proporcion(5, 10), 0.5);
  assert.equal(proporcion(20, 10), 1);
  assert.equal(proporcion(3, 0), 0);
  assert.equal(proporcion(null, 10), 0);
  assert.equal(porcentajeTexto(3, 12), "25 %");
  assert.equal(porcentajeTexto(3, 0), "—");
  assert.equal(porcentajeTexto(null, 5), "—");
  assert.equal(sumaSerie([{ dia: "a", etiqueta: "lu", valor: 2 }, { dia: "b", etiqueta: "ma", valor: null }, { dia: "c", etiqueta: "mi", valor: 3 }]), 5);
});

test("en las tarjetas las personas van con nombre corto, sin teléfonos ni correos", () => {
  assert.equal(nombreCorto("María José Pérez"), "María P.");
  assert.equal(nombreCorto("  juan   gomez "), "juan G.");
  assert.equal(nombreCorto("Lucía"), "Lucía");
  assert.equal(nombreCorto("+54 9 11 5555 0000"), "Sin nombre");
  assert.equal(nombreCorto("algo@correo.com"), "Sin nombre");
  assert.equal(nombreCorto(null), "Sin nombre");
  assert.equal(fechaCortaAr("2026-11-25T18:00:00Z"), "25/11 15:00");
  assert.equal(fechaCortaAr("no"), "");
});

test("tarjetas ricas: captados como lista de personas, cifras como barras y líneas como estado", () => {
  const cap = tarjetaDeHerramienta(
    "listar_captados",
    { captados: [{ nombre: "Ana María López", derivado: false, proxima_cita: "2026-11-25T18:00:00Z" }, { nombre: "Pedro Ruiz", derivado: true, proxima_cita: null }] },
    "coberturas_medicas"
  );
  assert.ok(cap && cap.tipo === "personas");
  assert.deepEqual(
    cap.personas.map((p) => p.nombre),
    ["Ana L.", "Pedro R."]
  );
  assert.match(cap.personas[0].detalle, /sin derivar · cita 25\/11 15:00/);
  assert.equal(cap.enlace?.href, "/contactos?perfil=coberturas_medicas");
  assert.doesNotMatch(JSON.stringify(cap), /López|María/);

  const res = tarjetaDeHerramienta("resumen_perfil", { captados: 4, captados_sin_derivar: 2, piden_una_persona: 5, en_conversacion: 9, perdidos: 1 }, "juridico");
  assert.ok(res && res.tipo === "barras");
  assert.deepEqual(res.datos.find((d) => d.etiqueta === "Piden una persona"), { etiqueta: "Piden una persona", valor: 5 });
  assert.ok(!res.datos.some((d) => d.etiqueta === "En seguimiento"), "lo que no vino no se inventa");

  const lin = tarjetaDeHerramienta("estado_lineas", { lineas_oficiales: [{ nombre: "Principal", puede_enviar: true }], lineas_wasender: [{ nombre: "QR 1", conectada: false }] }, "marketing");
  assert.ok(lin && lin.tipo === "estado");
  assert.deepEqual(
    lin.filas.map((f) => f.ok),
    [true, false]
  );

  const chat = tarjetaDeHerramienta("buscar_chat", { chats: [{ nombre: "Carla Díaz", atiende: "bot", captacion: "en_conversacion", mensajes: [{ cuando: "2026-11-22T13:00:00Z" }] }] }, "marketing");
  assert.ok(chat && chat.tipo === "personas");
  assert.equal(chat.personas[0].nombre, "Carla D.");
  assert.match(chat.personas[0].detalle, /en charla · lo atiende el bot · último 22\/11 10:00/);
  assert.equal(chat.enlace?.href, "/panel/marketing/chats");

  // Errores, herramientas que proponen y resultados vacíos no arman tarjeta.
  assert.equal(tarjetaDeHerramienta("listar_captados", { error: "x" }, "marketing"), null);
  assert.equal(tarjetaDeHerramienta("proponer_respuesta_chat", { propuesta: "1" }, "marketing"), null);
  assert.equal(tarjetaDeHerramienta("listar_captados", { captados: [] }, "marketing"), null);
});

test("una respuesta lleva hasta 3 tarjetas, la última de cada herramienta", () => {
  const r = (n: number) => ({ nombre: "resumen_perfil", resultado: { captados: n } });
  const t = tarjetasDeResultados([r(1), r(2), { nombre: "estado_lineas", resultado: { lineas_oficiales: [{ nombre: "A", puede_enviar: true }] } }, { nombre: "consultar_cerebro", resultado: {} }], "marketing");
  assert.equal(t.length, 2);
  assert.ok(t.some((x) => x.tipo === "barras" && x.datos[0].valor === 2));
});

test("carteles: las claves entre asteriscos quedan marcadas y la primera cifra se resalta", () => {
  assert.deepEqual(palabrasDeCartel("Tu *secretario* de todo"), [
    { t: "Tu", clave: false },
    { t: "secretario", clave: true },
    { t: "de", clave: false },
    { t: "todo", clave: false },
  ]);
  assert.equal(marcarCifra("Hoy 5 personas esperan."), "Hoy *5 personas* esperan.");
  assert.equal(marcarCifra("Está todo al día."), "Está todo al día.");
  assert.equal(marcarCifra("Ya *marcado* 3"), "Ya *marcado* 3");
  assert.equal(textoParaVoz("Mirá «esto» en https://x.y/z *ya*"), "Mirá esto en ya");
});

test("las funciones nuevas están en todas las pantallas y no repiten etiquetas", () => {
  for (const etiqueta of ["Agendar una cita", "Mover a alguien de etapa", "Pedirle una tarea a la Oficina", "Enseñarle algo al cerebro", "Consultar el cerebro"]) {
    assert.ok(ACCIONES_SIEMPRE.some((a) => a.etiqueta === etiqueta), etiqueta);
  }
  for (const p of ["hoy", "chats", "cerebro", "campanas"] as const) {
    const a = todasLasAcciones(p);
    assert.equal(new Set(a.map((x) => x.etiqueta)).size, a.length);
    assert.ok(a.length >= ACCIONES_SIEMPRE.length + 3);
  }
  // Todas piden una propuesta o una pregunta, nunca hacerlo directo.
  for (const a of ACCIONES_SIEMPRE.slice(0, 4)) assert.match(a.pedido, /propon|propuesta/i);
});

test("pedirle una tarea a la Oficina y enseñarle al cerebro son propuestas con «¿Lo hago?» por las rutas de siempre", () => {
  const ofi = operacionPorClave("oficina_pedir_tarea");
  const cer = operacionPorClave("cerebro_ensenar");
  assert.ok(ofi && cer);
  assert.equal(ofi.ruta, "oficina");
  assert.equal(ofi.metodo, "POST");
  assert.equal(cer.ruta, "cerebro/conocimiento");
  assert.deepEqual(cer.campos.find((c) => c.nombre === "tipo")?.valores, ["nota", "regla", "documento", "enlace", "aprendizaje"]);
  assert.equal(nivelDeOperacion(ofi, {}), "cambio");
  assert.equal(nivelDeOperacion(cer, {}), "cambio");
  assert.ok(!("oficina" in FUERA_DEL_CATALOGO));
  assert.ok(!("cerebro/conocimiento" in FUERA_DEL_CATALOGO));
  // Con la tarjeta de Jarvis: se muestra y no son sensibles (no hacen salir mensajes).
  const d = decisionConfirmar({ tipo: "operacion_panel", detalle: { clave: "oficina_pedir_tarea", nivel: nivelDeOperacion(ofi, {}) } });
  assert.equal(d.mostrar, true);
  assert.equal(d.extra, "ninguno");
  // Arrancar la Oficina o aprobar una entrega siguen siendo del dueño en persona.
  assert.ok("oficina/arrancar" in FUERA_DEL_CATALOGO);
  assert.ok("oficina/[id]" in FUERA_DEL_CATALOGO);
});

test("el prompt v1.2 enseña las funciones nuevas y sigue pidiendo la tarjeta", () => {
  assert.equal(VERSION_PROMPT_JARVIS, "1.2");
  const b = bloqueJarvis({ pantalla: "hoy", ruta: "/hoy", perfilNombre: "Autos 0 km" });
  for (const clave of ["oficina_pedir_tarea", "cerebro_ensenar", "cita_agendar", "proponer_marcar_derivado", "proponer_campana", "proponer_respuesta_chat", "consultar_cerebro"]) assert.ok(b.includes(clave), clave);
  assert.match(b, /siempre como propuesta con tarjeta/);
  assert.match(b, /Nunca lo hagas sin la tarjeta/);
});

test("Jarvis devuelve tarjetas armadas con lo que leyeron sus herramientas, sin tocar la seguridad", () => {
  const motor = readFileSync(join(__dirname, "../../src/lib/asistente/motor.ts"), "utf8");
  assert.match(motor, /tarjetas: tarjetasDeResultados\(leidos, slug\)/);
  const ruta = readFileSync(join(__dirname, "../../src/app/api/jarvis/tablero/route.ts"), "utf8");
  assert.match(ruta, /requireSession/);
  assert.doesNotMatch(ruta, /export async function (POST|PATCH|PUT|DELETE)/, "el tablero solo lee");
});
