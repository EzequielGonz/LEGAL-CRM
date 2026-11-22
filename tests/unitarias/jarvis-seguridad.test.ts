import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { decisionConfirmar, esPropuestaVedada, HERRAMIENTAS_VEDADAS, sinVedadas } from "../../src/lib/jarvis/seguridad";
import { DECLARACIONES } from "../../src/lib/asistente/herramientas";
import { DECLARACIONES_JARVIS, NOMBRES_JARVIS, buscarEnGlosario } from "../../src/lib/jarvis/herramientas";
import { FUERA_DEL_CATALOGO } from "../../src/lib/asistente/catalogo";

// 22/11 · Jarvis nunca lanza campañas ni publica, no le escribe a nadie y todo cambio lleva «¿Lo hago?».

test("las herramientas vedadas existen en el asistente y Jarvis no las tiene", () => {
  const nombres = (DECLARACIONES as any[]).map((d) => d.name);
  for (const v of ["proponer_lanzamiento", "proponer_publicaciones", "proponer_respuesta_chat"]) {
    assert.ok(HERRAMIENTAS_VEDADAS.includes(v), v);
    assert.ok(nombres.includes(v), `${v} existe en el asistente`);
  }
  const deJarvis = [...(DECLARACIONES as any[]).filter((d) => !HERRAMIENTAS_VEDADAS.includes(d.name)), ...(DECLARACIONES_JARVIS as unknown as any[])].map((d) => d.name);
  for (const v of HERRAMIENTAS_VEDADAS) assert.ok(!deJarvis.includes(v), `Jarvis no debe tener ${v}`);
  // Lo que sí hace: buscar chats, ir a pantallas, tareas en la Bandeja, líneas, cifras, borradores.
  for (const ok of ["buscar_chat", "ir_a_pantalla", "pedir_cambio_de_codigo", "resumen_perfil", "estado_lineas", "explicar_cifra", "dejar_borrador", "proponer_campana"]) assert.ok(deJarvis.includes(ok), ok);
});

test("las herramientas propias de Jarvis no cambian datos: están declaradas y son tres", () => {
  assert.deepEqual([...NOMBRES_JARVIS], ["dejar_borrador", "estado_lineas", "explicar_cifra"]);
  assert.deepEqual((DECLARACIONES_JARVIS as any[]).map((d) => d.name), [...NOMBRES_JARVIS]);
});

test("las propuestas que lanzan, publican o le escriben a alguien quedan afuera", () => {
  assert.equal(esPropuestaVedada({ tipo: "lanzar_campana" }), true);
  assert.equal(esPropuestaVedada({ tipo: "publicaciones" }), true);
  assert.equal(esPropuestaVedada({ tipo: "responder_chat" }), true);
  assert.equal(esPropuestaVedada({ tipo: "plan_campanas", detalle: { lanzar: true } }), true);
  assert.equal(esPropuestaVedada({ tipo: "plan_campanas", detalle: { lanzar: false } }), false);
  assert.equal(esPropuestaVedada({ tipo: "operacion_panel", detalle: { clave: "redes_conexion_y_publicacion_automatica" } }), true);
  assert.equal(esPropuestaVedada({ tipo: "operacion_panel", detalle: { clave: "plantillas_meta_enviar_a_revision" } }), true);
  // Lo que sí puede dejar con confirmación.
  assert.equal(esPropuestaVedada({ tipo: "crear_campana" }), false); // borrador: no envía nada
  assert.equal(esPropuestaVedada({ tipo: "pausar_campana" }), false);
  assert.equal(esPropuestaVedada({ tipo: "tomar_chat" }), false);
  assert.equal(esPropuestaVedada({ tipo: "operacion_panel", detalle: { clave: "bandeja_pedir_cambio" } }), false);
});

test("sinVedadas separa lo que se muestra de lo que se descarta, sin perder orden", () => {
  const lista = [{ tipo: "crear_campana", id: "a" }, { tipo: "lanzar_campana", id: "b" }, { tipo: "tomar_chat", id: "c" }];
  const r = sinVedadas(lista);
  assert.deepEqual(r.visibles.map((x) => x.id), ["a", "c"]);
  assert.deepEqual(r.vedadas.map((x) => x.id), ["b"]);
});

test("decisión de confirmar: siempre hay tarjeta «¿Lo hago?» salvo lo vedado, y el nivel sale de los permisos del asistente", () => {
  const cambio = decisionConfirmar({ tipo: "crear_campana" });
  assert.deepEqual(cambio, { mostrar: true, nivel: "cambio", extra: "ninguno" });
  const pin = decisionConfirmar({ tipo: "asignar_agente", detalle: { estado: "activa" } });
  assert.equal(pin.mostrar, true);
  assert.equal(pin.nivel, "pin");
  assert.equal(pin.extra, "codigo");
  assert.equal(decisionConfirmar({ tipo: "asignar_agente", detalle: { estado: "pausada" } }).extra, "ninguno");
  const reforzada = decisionConfirmar({ tipo: "operacion_panel", detalle: { clave: "x", nivel: "contacto" } });
  assert.equal(reforzada.extra, "reforzada");
  // Sin dato válido en una operación del panel, el más exigente.
  assert.equal(decisionConfirmar({ tipo: "operacion_panel", detalle: {} }).extra, "codigo");
  const vedada = decisionConfirmar({ tipo: "lanzar_campana" });
  assert.equal(vedada.mostrar, false);
  assert.match(vedada.motivo ?? "", /dueños/);
});

test("el glosario explica las cifras en palabras simples", () => {
  assert.match(buscarEnGlosario("¿qué es un captado?")[0].explicacion, /siguiente paso/);
  assert.equal(buscarEnGlosario("esperando respuesta")[0].clave, "Esperan a una persona");
  assert.equal(buscarEnGlosario("tasa de respuesta")[0].clave, "Tasa de respuesta");
  assert.equal(buscarEnGlosario("zzz").length, 3); // sin coincidencia: las más comunes
});

test("las rutas nuevas de la API piden sesión, validan el perfil y están listadas fuera del catálogo", () => {
  for (const ruta of ["mensaje", "parte"]) {
    const archivo = join(__dirname, "../../src/app/api/jarvis", ruta, "route.ts");
    assert.ok(existsSync(archivo), ruta);
    const src = readFileSync(archivo, "utf8");
    assert.match(src, /requireSession\(request\)/);
    assert.match(src, /esSlugPerfil/);
    assert.ok(FUERA_DEL_CATALOGO[`jarvis/${ruta}`], `jarvis/${ruta} en FUERA_DEL_CATALOGO`);
  }
  const mensaje = readFileSync(join(__dirname, "../../src/app/api/jarvis/mensaje/route.ts"), "utf8");
  assert.match(mensaje, /perfilCoincideConRuta/); // cada rubro separado
  assert.match(mensaje, /chequearTopeGemini/); // tope de gasto de IA
});

test("el gasto de Jarvis se registra como el resto de la IA del panel y el texto de la persona no va al sistema", () => {
  const servidor = readFileSync(join(__dirname, "../../src/lib/jarvis/servidor.ts"), "utf8");
  assert.match(servidor, /registrarTurno/);
  assert.match(servidor, /chequearTopeGemini/);
  const motor = readFileSync(join(__dirname, "../../src/lib/asistente/motor.ts"), "utf8");
  // El sistema de Jarvis solo lleva la ruta saneada y el nombre del perfil; los mensajes van como contenidos de usuario.
  assert.match(motor, /bloqueJarvis\(\{ pantalla: opciones\.pantalla, ruta: opciones\.ruta, perfilNombre: nombre \}\)/);
  assert.match(motor, /armarContenidos\(mensajes, imagenes, \[\]\)/);
});

test("corrección del dueño: la estética de Jarvis es la clásica del panel, sin gradient mesh ni esferas de color ni fuentes ajenas", () => {
  const css = readFileSync(join(__dirname, "../../src/components/jarvis/jarvis.css"), "utf8");
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const rastro of ["jv-mesh", "jv-mancha", "jv-violeta", "jv-magenta", "jv-turquesa", "jv-esfera", "jv-halo"]) assert.ok(!sinComentarios.includes(rastro), `no debe quedar ${rastro}`);
  // Colores y tipografía del panel: escalas del perfil y Inter Tight (--font-sans).
  assert.match(sinComentarios, /--c-slate-900/);
  assert.match(sinComentarios, /--c-gold-500/);
  assert.match(sinComentarios, /var\(--font-sans\)/);
  assert.ok(!/Geist|Instrument/.test(sinComentarios));
  // El vidrio (blur) va solo en la hoja de Jarvis.
  const conBlur = sinComentarios.split("}").filter((b) => /backdrop-filter/.test(b)).map((b) => b.split("{")[0].trim());
  assert.ok(conBlur.every((sel) => /^\.jv-hoja$|^@supports/.test(sel) || sel.includes(".jv-hoja")), `blur solo en la hoja: ${conBlur.join(" | ")}`);
  assert.ok(!existsSync(join(__dirname, "../../src/components/jarvis/fuentes.ts")));
  // Con «reducir movimiento» nada se anima.
  assert.match(css, /prefers-reduced-motion/);
});

test("ninguna operación del catálogo que hace salir mensajes, publica o lo habilita se ofrece desde Jarvis", async () => {
  const { esOperacionVedada } = await import("../../src/lib/jarvis/seguridad");
  const fuente = readFileSync(join(__dirname, "../../src/lib/asistente/catalogo.ts"), "utf8");
  const claves = [...fuente.matchAll(/clave: "([a-z_0-9]+)"/g)].map((m) => m[1]);
  assert.ok(claves.length > 50, "se leyó el catálogo");
  const debenEstarVedadas = [
    "marketing_ejecutar_base", "marketing_prospeccion_activar", "seguimiento_encender_apagar", "recontacto_encender_apagar",
    "bot_encender_apagar", "persona_volver_a_contactar", "contenido_programar_pieza", "campana_dias_y_wasender",
    "bot_publicar_agente", "plantillas_meta_enviar_a_revision", "redes_conexion_y_publicacion_automatica",
  ];
  for (const c of debenEstarVedadas) {
    assert.ok(claves.includes(c), `${c} existe en el catálogo`);
    assert.equal(esOperacionVedada(c), true, `${c} debe quedar fuera de Jarvis`);
    assert.equal(esPropuestaVedada({ tipo: "operacion_panel", detalle: { clave: c } }), true, c);
  }
  // Toda operación cuya descripción diga que hace salir mensajes o los lanza queda vedada.
  const bloques = fuente.split(/\n  \{\n/).slice(1);
  for (const b of bloques) {
    const clave = /clave: "([a-z_0-9]+)"/.exec(b)?.[1];
    const desc = /descripcion: "([^"]*)"/.exec(b)?.[1] ?? "";
    if (!clave) continue;
    if (/(hace salir mensajes|y la lanza|les escribe|empieza a mandar|sale el mensaje)/i.test(desc)) assert.equal(esOperacionVedada(clave), true, `${clave}: ${desc.slice(0, 80)}`);
  }
  // Lo que no envía sigue disponible para Jarvis (con tarjeta).
  for (const c of ["bot_ficha_del_negocio", "persona_zona", "campana_archivar", "contenido_guardar_borrador"]) assert.equal(esOperacionVedada(c), false, c);
});
