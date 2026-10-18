import { test } from "node:test";
import assert from "node:assert/strict";
import { csvPlantillas, normalizarFilasPlantillas, rubroDeNombre } from "@/lib/plantillas/archivo";
import { enlaceWhatsAppOrigen, identificadorOrigen, numeroWhatsApp, unirIdentificadores } from "@/lib/redes/ctas";
import { detectarFuente, identificadoresValidos } from "@/lib/fuente";
import { cuerpoMetricool, fechaLocal } from "@/lib/redes/metricool";
import { mediaDePieza } from "@/lib/redes/programar";
import { huecosCalendario, normalizarPedido, rutaDestino } from "@/lib/asistente/herramientas";
import { validarCambioBot, validarPiezas } from "@/lib/asistente/textos";
import { validarPerfil } from "@/lib/redes/whatsapp-perfil";
import { validarConfigAnuncios } from "@/lib/redes/publicidad";

test("plantillas desde archivo: reconoce el rubro por columna o por prefijo y valida lo de Meta", () => {
  assert.equal(rubroDeNombre("cob_recupero_a"), "coberturas_medicas");
  assert.equal(rubroDeNombre("aviso_captacion_autos"), "agencia_0km");
  assert.equal(rubroDeNombre("form_recibido_mkt"), "marketing");
  const { validas, errores } = normalizarFilasPlantillas([
    { nombre: "jur_hola", cuerpo: "Hola {{1}}, ¿seguís con la consulta?", botones: "Sí | No" },
    { Perfil: "Coberturas", Nombre: "saludo", Texto: "Hola {{1}}, soy {{2}}.", Categoria: "utility" },
    { nombre: "sin_rubro_x", cuerpo: "Hola" },
    { nombre: "mkt_mal", cuerpo: "Hola {{2}}" },
    { nombre: "jur_hola", cuerpo: "Repetida" },
  ]);
  assert.deepEqual(validas.map((v) => [v.rubro, v.nombre, v.categoria]), [
    ["juridico", "jur_hola", "MARKETING"],
    ["coberturas_medicas", "saludo", "UTILITY"],
  ]);
  assert.deepEqual(validas[0].botones, ["Sí", "No"]);
  assert.equal(errores.length, 3);
  const csv = csvPlantillas(validas);
  assert.ok(csv.startsWith("perfil,nombre,categoria"));
  assert.equal(normalizarFilasPlantillas([{ ...Object.fromEntries(csv.split("\n")[0].split(",").map((k, i) => [k, JSON.parse(csv.split("\n")[1].split(/,(?=")/)[i])])) }]).validas.length, 1);
});

test("llamados a la acción con origen: el mensaje prearmado de cada red se reconoce como su fuente", () => {
  assert.equal(numeroWhatsApp("11 7250-2391"), "5491172502391");
  assert.equal(numeroWhatsApp("5491172502391"), "5491172502391");
  assert.equal(numeroWhatsApp("123"), null);
  const ig = enlaceWhatsAppOrigen("5491172502391", "instagram")!;
  assert.ok(ig.startsWith("https://wa.me/5491172502391?text="));
  const ids = identificadoresValidos(unirIdentificadores([], [{ texto: identificadorOrigen("instagram"), fuente: "instagram" }]));
  const mensaje = decodeURIComponent(ig.split("text=")[1]);
  assert.equal(detectarFuente({ channelType: "whatsapp", body: mensaje, identificadores: ids }).fuente, "instagram");
  assert.equal(unirIdentificadores(ids, [{ texto: "los vi en instagram", fuente: "instagram" }]).length, 1);
});

test("Metricool: historia sin texto, fecha en hora argentina y tipo por red", () => {
  assert.equal(fechaLocal("2026-10-20T13:00:00.000Z", "America/Argentina/Buenos_Aires"), "2026-10-20T10:00:00");
  const post = cuerpoMetricool({ canal: "instagram", formato: "post", texto: "Hola", media: ["https://x/1.png"], alt: ["a"], fecha: "2026-10-20T13:00:00.000Z", zonaHoraria: "America/Argentina/Buenos_Aires" });
  assert.equal(post.text, "Hola");
  assert.deepEqual(post.instagramData, { type: "POST", isAiGenerated: true });
  const hist = cuerpoMetricool({ canal: "facebook", formato: "historia", texto: "Hola", media: ["https://x/1.png"], alt: ["a"], fecha: "2026-10-20T13:00:00.000Z", zonaHoraria: "America/Argentina/Buenos_Aires" });
  assert.equal(hist.text, undefined);
  assert.deepEqual(hist.facebookData, { type: "STORY" });
});

test("imágenes de una pieza: una por diapositiva, con texto alternativo", () => {
  const m = mediaDePieza("https://panel.test", "abc", { formato: "carrusel", titular: "Portada", diapositivas: ["Uno", "Dos"] });
  assert.equal(m.length, 3);
  assert.equal(m[2].ref, "https://panel.test/piezas/abc/3.png");
  assert.ok(m.every((x) => x.alt));
  assert.equal(mediaDePieza(null, "abc", { formato: "post", titular: "T" }).length, 0);
});

test("calendario pedido: 1 post y 1 historia por día y un carrusel cada 2 días durante 30 días", () => {
  const p = normalizarPedido({ dias: 30, posts_por_dia: 1, historias_por_dia: 1, carrusel_cada_dias: 2, desde: "2026-10-19" }, "2026-10-18");
  const h = huecosCalendario(p);
  assert.equal(h.filter((x) => x.formato === "post").length, 30);
  assert.equal(h.filter((x) => x.formato === "historia").length, 30);
  assert.equal(h.filter((x) => x.formato === "carrusel").length, 15);
  assert.equal(h[0].fecha, "2026-10-19T13:00:00.000Z");
  assert.deepEqual(p.redes, ["instagram", "facebook"]);
  // Una fecha pasada o mal escrita arranca mañana.
  assert.equal(normalizarPedido({ dias: 1, desde: "2020-01-01" }, "2026-10-18").desde, "2026-10-19");
  assert.equal(rutaDestino("marketing", "campanas")?.href, "/panel/marketing/campanas");
  assert.equal(rutaDestino("juridico", "nada"), null);
});

test("textos generados: se descarta lo que no pasaría los controles", () => {
  const huecos = [
    { formato: "post" as const, fecha: "2026-10-19T13:00:00.000Z", dia: 0 },
    { formato: "post" as const, fecha: "2026-10-20T13:00:00.000Z", dia: 1 },
    { formato: "historia" as const, fecha: "2026-10-19T21:00:00.000Z", dia: 0 },
  ];
  const salida = JSON.stringify([
    { n: 1, formato: "post", tema: "Consejos", titular: "Qué hacer después de un choque", texto: "Lo primero es mantener la calma y anotar los datos del otro conductor. Te contamos cómo seguir." },
    { n: 2, formato: "post", tema: "Promo", titular: "Precio especial", texto: "Aprovechá el precio especial de esta semana con 20% de descuento para vos." },
    { n: 3, formato: "historia", tema: "Pregunta", titular: "¿Tuviste un accidente laboral?", texto: "" },
  ]);
  const r = validarPiezas(salida, huecos);
  assert.equal(r.piezas.length, 2);
  assert.equal(r.descartadas, 1);
  assert.equal(validarPiezas("no es json", huecos).piezas.length, 0);
});

test("cambio de bot: se rechaza lo que borra las instrucciones o no cambia nada", () => {
  const actual = "Sos el asistente del estudio. ".repeat(20);
  assert.equal(validarCambioBot(JSON.stringify({ instrucciones: "corto", resumen: "x" }), actual), null);
  assert.equal(validarCambioBot(JSON.stringify({ instrucciones: actual, resumen: "x" }), actual), null);
  const ok = validarCambioBot(JSON.stringify({ instrucciones: actual + " Respondé más breve.", resumen: "Más breve" }), actual);
  assert.equal(ok?.resumen, "Más breve");
});

test("perfil de WhatsApp y publicidad: límites de Meta y nada que gaste", () => {
  assert.throws(() => validarPerfil({ about: "x".repeat(140) }));
  assert.throws(() => validarPerfil({ email: "no-es-mail" }));
  assert.deepEqual(validarPerfil({ about: "Hola", websites: ["https://a.com", "", "https://b.com", "https://c.com"], vertical: "LEGAL" }).websites, ["https://a.com", "https://b.com"]);
  assert.equal(validarPerfil({ vertical: "LEGAL" }).vertical, "UNDEFINED");
  assert.equal(validarConfigAnuncios({ presupuesto_diario: "-5" }).presupuesto_diario, null);
  assert.throws(() => validarConfigAnuncios({ cuenta_publicitaria: "mi cuenta" }));
  assert.equal(validarConfigAnuncios({ cuenta_publicitaria: "act_1234567890123" }).cuenta_publicitaria, "act_1234567890123");
});
