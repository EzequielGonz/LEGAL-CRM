import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { decisionConfirmar, esOperacionSensible, esPropuestaSensible, esPropuestaVedada, HERRAMIENTAS_SENSIBLES, HERRAMIENTAS_VEDADAS, sinVedadas } from "../../src/lib/jarvis/seguridad";
import { DECLARACIONES } from "../../src/lib/asistente/herramientas";
import { DECLARACIONES_JARVIS, NOMBRES_JARVIS, buscarEnGlosario } from "../../src/lib/jarvis/herramientas";
import { FUERA_DEL_CATALOGO } from "../../src/lib/asistente/catalogo";

// 22/11 · Jarvis nunca lanza campañas ni publica, no le escribe a nadie y todo cambio lleva «¿Lo hago?».

// 22/11 (segunda vuelta) · orden del dueño: «que Jarvis pueda hacer TODO, preguntándome antes siempre».

test("Jarvis tiene todas las herramientas del asistente, incluidas las que envían o publican", () => {
  assert.deepEqual([...HERRAMIENTAS_VEDADAS], []);
  const nombres = (DECLARACIONES as any[]).map((d) => d.name);
  const deJarvis = [...(DECLARACIONES as any[]).filter((d) => !HERRAMIENTAS_VEDADAS.includes(d.name)), ...(DECLARACIONES_JARVIS as unknown as any[])].map((d) => d.name);
  for (const v of HERRAMIENTAS_SENSIBLES.filter((h) => nombres.includes(h))) assert.ok(deJarvis.includes(v), `Jarvis tiene ${v}`);
  for (const ok of ["buscar_chat", "ir_a_pantalla", "pedir_cambio_de_codigo", "resumen_perfil", "estado_lineas", "explicar_cifra", "dejar_borrador", "proponer_campana", "proponer_lanzamiento"]) assert.ok(deJarvis.includes(ok), ok);
});

test("las herramientas propias de Jarvis no cambian datos: están declaradas y son cuatro", () => {
  assert.deepEqual([...NOMBRES_JARVIS], ["dejar_borrador", "estado_lineas", "explicar_cifra", "consultar_cerebro"]);
  assert.deepEqual((DECLARACIONES_JARVIS as any[]).map((d) => d.name), [...NOMBRES_JARVIS]);
});

test("nada queda vedado, pero lo que envía, lanza o publica se marca como sensible", () => {
  for (const t of ["lanzar_campana", "publicaciones", "responder_chat"]) {
    assert.equal(esPropuestaVedada({ tipo: t }), false, t);
    assert.equal(esPropuestaSensible({ tipo: t }), true, t);
  }
  assert.equal(esPropuestaSensible({ tipo: "plan_campanas", detalle: { lanzar: true } }), true);
  assert.equal(esPropuestaSensible({ tipo: "plan_campanas", detalle: { lanzar: false } }), false);
  assert.equal(esPropuestaSensible({ tipo: "crear_campana" }), false);
  assert.equal(esPropuestaSensible({ tipo: "operacion_panel", detalle: { clave: "bandeja_pedir_cambio" } }), false);
  const lista = [{ tipo: "crear_campana", id: "a" }, { tipo: "lanzar_campana", id: "b" }];
  assert.deepEqual(sinVedadas(lista).visibles.map((x) => x.id), ["a", "b"]);
});

test("toda operación del catálogo que hace salir mensajes o publica pide confirmación reforzada o código", () => {
  const fuente = readFileSync(join(__dirname, "../../src/lib/asistente/catalogo.ts"), "utf8");
  const claves = [...fuente.matchAll(/clave: "([a-z_0-9]+)"/g)].map((m) => m[1]);
  assert.ok(claves.length > 50, "se leyó el catálogo");
  const sensibles = [
    "marketing_ejecutar_base", "marketing_prospeccion_activar", "seguimiento_encender_apagar", "recontacto_encender_apagar",
    "bot_encender_apagar", "persona_volver_a_contactar", "contenido_programar_pieza", "campana_dias_y_wasender",
    "bot_publicar_agente", "plantillas_meta_enviar_a_revision", "redes_conexion_y_publicacion_automatica",
  ];
  for (const c of sensibles) {
    assert.ok(claves.includes(c), `${c} existe en el catálogo`);
    assert.equal(esOperacionSensible(c), true, c);
    const d = decisionConfirmar({ tipo: "operacion_panel", detalle: { clave: c, nivel: "cambio" } });
    assert.equal(d.mostrar, true, c);
    assert.notEqual(d.extra, "ninguno", `${c} no puede salir con un Sí simple`);
  }
  for (const b of fuente.split(/\n  \{\n/).slice(1)) {
    const clave = /clave: "([a-z_0-9]+)"/.exec(b)?.[1];
    const desc = /descripcion: "([^"]*)"/.exec(b)?.[1] ?? "";
    if (clave && /(hace salir mensajes|y la lanza|les escribe|empieza a mandar|sale el mensaje)/i.test(desc)) assert.equal(esOperacionSensible(clave), true, clave);
  }
});

test("decisión de confirmar: siempre hay tarjeta; lo sensible nunca baja de confirmación reforzada", () => {
  assert.deepEqual(decisionConfirmar({ tipo: "crear_campana" }), { mostrar: true, nivel: "cambio", extra: "ninguno" });
  const pin = decisionConfirmar({ tipo: "asignar_agente", detalle: { estado: "activa" } });
  assert.equal(pin.nivel, "pin");
  assert.equal(pin.extra, "codigo");
  assert.equal(decisionConfirmar({ tipo: "asignar_agente", detalle: { estado: "pausada" } }).extra, "ninguno");
  assert.equal(decisionConfirmar({ tipo: "operacion_panel", detalle: {} }).extra, "codigo");
  const lanzar = decisionConfirmar({ tipo: "lanzar_campana" });
  assert.equal(lanzar.mostrar, true);
  assert.notEqual(lanzar.extra, "ninguno");
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

