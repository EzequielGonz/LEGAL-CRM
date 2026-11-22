import { test } from "node:test";
import assert from "node:assert/strict";
import { filasParaDecidir, franjaDeEstado, frasesDeHoy, horaEnBuenosAires, metaDelAnillo, saludoPorHora } from "../../src/lib/hoy/resumen-hoy";

// 22/11 · «Hoy» renovado: saludo por hora argentina (sin nombre), frases de Jarvis, «Para decidir» y franja de estado.

test("saludo: según la hora de Buenos Aires y sin nombre de persona", () => {
  assert.equal(saludoPorHora(0), "Buenas noches");
  assert.equal(saludoPorHora(5), "Buen día");
  assert.equal(saludoPorHora(11), "Buen día");
  assert.equal(saludoPorHora(12), "Buenas tardes");
  assert.equal(saludoPorHora(19), "Buenas tardes");
  assert.equal(saludoPorHora(20), "Buenas noches");
  assert.equal(saludoPorHora(23), "Buenas noches");
  for (const h of [0, 8, 13, 21]) assert.ok(!/ana|,/i.test(saludoPorHora(h)), "el saludo no lleva nombre ni coma");
});

test("hora argentina: 15:00 UTC son las 12 en Buenos Aires (UTC−3)", () => {
  assert.equal(horaEnBuenosAires(new Date("2026-11-22T15:00:00Z")), 12);
  assert.equal(horaEnBuenosAires(new Date("2026-11-22T02:30:00Z")), 23);
  assert.equal(saludoPorHora(horaEnBuenosAires(new Date("2026-11-22T11:00:00Z"))), "Buen día");
});

test("frases de Jarvis: dos como máximo, sin jerga, y un estado vacío amable", () => {
  const vacio = frasesDeHoy({ esperan: 0, porDerivar: 0, esperanDeMas: 0, posibles: 0 });
  assert.ok(vacio[0].includes("Todo al día"));
  const f = frasesDeHoy({ esperan: 5, porDerivar: 15, esperanDeMas: 4, posibles: 0 });
  assert.equal(f[0], "5 personas te esperan para que les respondas.");
  assert.equal(f[1], "Hay 15 captados para pasar a quien los atiende.");
  const uno = frasesDeHoy({ esperan: 1, porDerivar: 0, esperanDeMas: 0, posibles: 0 });
  assert.equal(uno[0], "Una persona te espera para que le respondas.");
  assert.equal(uno[1], undefined);
  for (const frase of [...f, ...uno, ...vacio]) assert.ok(!/lead|pipeline|kpi/i.test(frase ?? ""));
});

test("para decidir: una fila por pendiente, lo urgente primero, sin nombres ni teléfonos", () => {
  const filas = filasParaDecidir({
    esperan: 5,
    porDerivar: 15,
    esperanDeMas: 4,
    posibles: 3,
    hrefResponder: "/hoy?perfil=juridico&todo=1#hoy-cola",
    hrefDerivar: "/hoy?perfil=juridico&todo=1#hoy-captados",
    hrefPosibles: "/oportunidades?perfil=juridico&indicador=posible_captacion",
    campana: { texto: "Campaña pausada", href: "/campanas/1", tono: "amarillo" },
  });
  assert.deepEqual(filas.map((f) => f.clave), ["responder", "derivar", "campana", "posibles"]);
  assert.equal(filas[0].titulo, "Responder a 5 personas");
  assert.equal(filas[1].detalle, "4 esperan hace más de 24 horas");
  assert.ok(filas.every((f) => f.boton.length > 0 && f.href.length > 0));
  assert.ok(filas.every((f) => !/\d{8,}|@/.test(f.titulo + f.detalle)), "ni teléfonos ni mails");
  // Una campaña en verde o sin datos no genera fila.
  assert.equal(filasParaDecidir({ esperan: 0, porDerivar: 0, esperanDeMas: 0, posibles: 0, hrefResponder: "/", hrefDerivar: "/", hrefPosibles: "/", campana: { texto: "ok", href: "/", tono: "verde" } }).length, 0);
});

test("franja: lo grave nunca queda oculto y el verde dice «Todo en orden»", () => {
  const base = { rojos: 0, amarillos: 0, hrefSalud: "/salud?perfil=juridico", lineas: [] as { tono: "rojo" | "amarillo" | "verde" | "gris"; texto: string; href?: string }[] };
  assert.equal(franjaDeEstado(base).estado, "ok");
  assert.equal(franjaDeEstado(base).titulo, "Todo en orden");
  const mal = franjaDeEstado({ ...base, rojos: 1, primero: "5 mensajes sin responder" });
  assert.equal(mal.estado, "mal");
  assert.equal(mal.titulo, "Un problema frena la operación");
  assert.equal(mal.href, "/salud?perfil=juridico");
  // Línea caída: rojo aunque Salud no marque nada.
  const linea = franjaDeEstado({ ...base, lineas: [{ tono: "verde", texto: "Línea CIVIL" }, { tono: "rojo", texto: "WhatsApp por QR desconectado", href: "/wasender?perfil=juridico" }] });
  assert.equal(linea.estado, "mal");
  assert.equal(linea.href, "/wasender?perfil=juridico");
  assert.equal(franjaDeEstado({ ...base, amarillos: 2 }).titulo, "2 puntos para revisar");
  assert.equal(franjaDeEstado({ ...base, cifrasSinLeer: 1 }).estado, "aviso");
  // Lo rojo gana sobre lo amarillo.
  assert.equal(franjaDeEstado({ ...base, rojos: 2, amarillos: 3 }).titulo, "2 problemas frenan la operación");
});

test("anillo grande: la meta nunca es cero ni menor que lo que espera", () => {
  assert.equal(metaDelAnillo(0, 0), 1);
  assert.equal(metaDelAnillo(15, 5), 20);
  assert.equal(metaDelAnillo(15, null), 15);
});
