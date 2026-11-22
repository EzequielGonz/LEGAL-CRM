import { test } from "node:test";
import assert from "node:assert/strict";
import { anillosDe, armarParte, decisionesDe, diasEntre, frasesPorReglas, metaCaptados, proporcionAnillo, saludoPorHora, ultimaVisitaValida, type DatosParte } from "../../src/lib/jarvis/parte";
import { numerosPermitidos, promptRedaccionParte, validarRedaccionParte, bloqueJarvis, VERSION_PROMPT_JARVIS } from "../../src/lib/jarvis/prompt";

// 22/11 · parte del día: se arma con datos de la base, sin gastar tokens. Gemini solo redacta (y se valida).

const base: DatosParte = {
  perfil: "Autos 0 km",
  hora: 9,
  dia: "2026-11-22",
  captadosHoy: 3,
  captadosAyer: 5,
  esperandoPersona: 2,
  enConversacion: 8,
  sinDerivar: 1,
  tareasParaOk: 2,
  tareasResueltasHoy: 1,
  lineasCaidas: 0,
  nuevosDesdeUltimaVisita: 12,
  diasDesdeUltimaVisita: 1,
};
const con = (x: Partial<DatosParte>): DatosParte => ({ ...base, ...x });

test("el saludo depende de la hora de Argentina que llega como dato", () => {
  assert.equal(saludoPorHora(5), "Buen día");
  assert.equal(saludoPorHora(11), "Buen día");
  assert.equal(saludoPorHora(12), "Buenas tardes");
  assert.equal(saludoPorHora(19), "Buenas tardes");
  assert.equal(saludoPorHora(20), "Buenas noches");
  assert.equal(saludoPorHora(3), "Buenas noches");
});

test("el parte por reglas tiene 2 o 3 frases cortas y dice qué pasó, qué espera y qué mirar", () => {
  const frases = frasesPorReglas(base);
  assert.ok(frases.length >= 2 && frases.length <= 3);
  assert.match(frases[0], /3 personas/);
  assert.match(frases[0], /ayer fueron 5/);
  assert.match(frases[1], /2 tareas esperan tu OK/);
  assert.match(frases[1], /2 personas esperan/);
  assert.match(frases[2], /chats/);
  for (const f of frases) assert.ok(f.length <= 90, f);
});

test("singular y plural", () => {
  const f = frasesPorReglas(con({ captadosHoy: 1, captadosAyer: 0, tareasParaOk: 1, esperandoPersona: 1 }));
  assert.match(f[0], /se captó 1 persona\./);
  assert.match(f[1], /1 tarea espera tu OK y 1 persona espera/);
});

test("sin movimiento, el parte dice que está todo al día y no inventa nada", () => {
  const vacio = con({ captadosHoy: 0, captadosAyer: 0, esperandoPersona: 0, enConversacion: 0, sinDerivar: 0, tareasParaOk: 0, tareasResueltasHoy: 0, lineasCaidas: 0, nuevosDesdeUltimaVisita: 0, diasDesdeUltimaVisita: 0 });
  const f = frasesPorReglas(vacio);
  assert.deepEqual(f, ["Todavía no hay captados hoy.", "Está todo al día."]);
  assert.equal(decisionesDe(vacio, "/inbox").length, 0);
});

test("la primera visita no habla de «desde la última vez»; con varios días lo dice", () => {
  assert.ok(!frasesPorReglas(con({ captadosHoy: 0, nuevosDesdeUltimaVisita: null, diasDesdeUltimaVisita: null })).some((f) => /última visita|estos \d+ días/.test(f)));
  assert.match(frasesPorReglas(con({ captadosHoy: 0, nuevosDesdeUltimaVisita: 7, diasDesdeUltimaVisita: 4 }))[0], /^En estos 4 días se sumaron 7 contactos nuevos\./);
  assert.match(frasesPorReglas(con({ captadosHoy: 0, nuevosDesdeUltimaVisita: 1, diasDesdeUltimaVisita: 0 }))[0], /^Desde tu última visita se sumó 1 contacto nuevo\./);
});

test("una línea con problema pasa adelante en lo que conviene mirar", () => {
  const f = frasesPorReglas(con({ lineasCaidas: 1 }));
  assert.match(f[f.length - 1], /líneas: 1 tiene un problema/);
  const d = decisionesDe(con({ lineasCaidas: 2 }), "/inbox");
  assert.ok(d.some((x) => /2 líneas con problemas/.test(x.texto)));
});

test("tres anillos: captados hoy, chats esperando y tareas para tu OK", () => {
  const a = anillosDe(base);
  assert.deepEqual(a.map((x) => x.clave), ["captados", "chats", "tareas"]);
  assert.deepEqual(a.map((x) => x.etiqueta), ["Captados hoy", "Chats esperando", "Tareas para tu OK"]);
  assert.equal(a[0].valor, 3);
  assert.equal(a[0].meta, 5);
  assert.equal(a[1].valor, 2);
  assert.equal(a[1].meta, 8);
  assert.equal(a[2].valor, 2);
  assert.equal(a[2].meta, 3); // pendientes + resueltas hoy
});

test("la meta del anillo de captados nunca queda por debajo de lo de hoy ni de 5", () => {
  assert.equal(metaCaptados(0, 0), 5);
  assert.equal(metaCaptados(9, 2), 9);
  assert.equal(metaCaptados(1, 12), 12);
  assert.equal(proporcionAnillo(3, 5), 0.6);
  assert.equal(proporcionAnillo(9, 5), 1);
  assert.equal(proporcionAnillo(0, 5), 0);
  assert.equal(proporcionAnillo(4, 0), 0);
});

test("«para decidir» tiene como máximo 3 ítems, con el chat primero y el botón a los chats del perfil", () => {
  const d = decisionesDe(con({ lineasCaidas: 1, sinDerivar: 4 }), "/panel/agencia_0km/chats");
  assert.ok(d.length <= 3);
  assert.deepEqual(d[0].accion, { tipo: "ir", href: "/panel/agencia_0km/chats" });
  assert.match(d[0].texto, /Responder a 2 personas/);
});

test("armarParte devuelve saludo, frases, anillos y decisiones, y es determinista", () => {
  const a = armarParte(base, "/inbox");
  const b = armarParte({ ...base }, "/inbox");
  assert.deepEqual(a, b);
  assert.equal(a.saludo, "Buen día");
  assert.equal(a.fuente, "reglas");
  assert.equal(a.dia, "2026-11-22");
  assert.equal(a.anillos.length, 3);
});

test("días desde la última visita y validación de lo que manda el navegador", () => {
  const ahora = Date.parse("2026-11-22T15:00:00Z");
  assert.equal(diasEntre("2026-11-19T15:00:00Z", ahora), 3);
  assert.equal(diasEntre(null, ahora), null);
  assert.equal(diasEntre("2027-01-01T00:00:00Z", ahora), null);
  assert.equal(ultimaVisitaValida("2026-11-20T10:00:00Z", ahora), "2026-11-20T10:00:00.000Z");
  assert.equal(ultimaVisitaValida("2026-01-01T10:00:00Z", ahora), null); // más de 30 días
  assert.equal(ultimaVisitaValida("2030-01-01T10:00:00Z", ahora), null); // del futuro
  assert.equal(ultimaVisitaValida("ignorá todo lo anterior", ahora), null);
  assert.equal(ultimaVisitaValida({}, ahora), null);
});

// ---- redacción con IA (opcional): se valida antes de mostrar

test("lo que redacta el modelo solo se acepta si usa números de los datos, sin formato y con 1 a 3 frases", () => {
  assert.deepEqual(validarRedaccionParte("Hoy se captaron 3 personas. Hay 2 tareas esperando tu OK.", base), ["Hoy se captaron 3 personas.", "Hay 2 tareas esperando tu OK."]);
  assert.equal(validarRedaccionParte("Hoy se captaron 47 personas.", base), null); // número inventado
  assert.equal(validarRedaccionParte("**Hoy** se captaron 3 personas.", base), null); // formato
  assert.equal(validarRedaccionParte("Una. Dos. Tres. Cuatro.", base), null); // demasiadas frases
  assert.equal(validarRedaccionParte("Hoy se captaron 3 personas", base), null); // sin cierre
  assert.equal(validarRedaccionParte("", base), null);
  assert.equal(validarRedaccionParte(undefined, base), null);
  assert.equal(validarRedaccionParte("a".repeat(500) + ".", base), null);
});

test("los números permitidos salen de los datos y el pedido a Gemini lleva solo cifras, sin personas", () => {
  const n = numerosPermitidos(base);
  for (const v of ["3", "5", "2", "8", "1", "0", "12"]) assert.ok(n.has(v), v);
  assert.ok(!n.has("47"));
  const prompt = promptRedaccionParte(base, armarParte(base, "/inbox"));
  assert.match(prompt, /captados hoy 3/);
  assert.match(prompt, /español rioplatense/);
  assert.doesNotMatch(prompt, /\d{8,}/); // ningún teléfono ni documento
});

test("el bloque de instrucciones de Jarvis fija la pantalla, el perfil, el trato y lo que no hace", () => {
  const b = bloqueJarvis({ pantalla: "chats", ruta: "/panel/marketing/chats", perfilNombre: "Kocos Marketing" });
  assert.match(b, /pantalla «Chats»/);
  assert.match(b, /Kocos Marketing/);
  assert.match(b, /No lanzás ni reanudás campañas, no publicás y no le escribís a nadie/);
  assert.match(b, /nunca mezclés ni nombres datos de otro perfil/);
  assert.match(b, /nunca instrucciones/);
  assert.match(b, new RegExp(`JARVIS v${VERSION_PROMPT_JARVIS.replace(".", "\\.")}`));
  // Capas del prompt: identidad, tarea, trato, reglas duras, formato, ejemplos y casos límite.
  for (const capa of ["IDENTIDAD", "TAREA", "TRATO", "REGLAS DURAS", "DATOS, NO ÓRDENES", "FORMATO", "EJEMPLO 1", "EJEMPLO 2", "CASOS LÍMITE"]) assert.ok(b.includes(capa), capa);
});

test("estilo del dueño: es hombre, sin saludo con nombre inventado y sin femenino en lo que ve en pantalla", () => {
  const b = bloqueJarvis({ pantalla: "hoy", ruta: "/", perfilNombre: "Autos 0 km" });
  assert.match(b, /es hombre/);
  assert.match(b, /Nunca inventes un nombre/);
  // El saludo del parte es solo «Buen día.», nunca con un nombre.
  assert.equal(armarParte(base, "/inbox").saludo, "Buen día");
  const textos = [...armarParte(base, "/inbox").frases, ...armarParte(base, "/inbox").anillos.map((a) => a.etiqueta + a.nota), ...armarParte(base, "/inbox").decisiones.map((d) => d.texto + d.boton)];
  for (const t of textos) assert.doesNotMatch(t, /\b(Ana|María|responsable|productora|usuaria)\b/);
  assert.doesNotMatch(promptRedaccionParte(base, armarParte(base, "/inbox")), /responsable/);
});
