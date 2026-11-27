import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { aSecciones, pareceSecreto, validarEntrada } from "../../src/lib/cerebro/conocimiento";
import { decisionesDe, fechaLarga } from "../../src/lib/cerebro/decisiones";
import { buscarEnCerebro } from "../../src/lib/jarvis/cerebro-memoria";

test("enseñarle algo al cerebro: valida tipo, largo, datos personales y claves", () => {
  assert.equal(validarEntrada({ tipo: "nota", titulo: "Fines de semana", contenido: "No se envía los domingos." }).ok, true);
  assert.equal(validarEntrada({ tipo: "otra", titulo: "abc", contenido: "texto largo" }).ok, false);
  assert.equal(validarEntrada({ tipo: "nota", titulo: "ab", contenido: "texto largo" }).ok, false);
  assert.equal(validarEntrada({ tipo: "nota", titulo: "Contacto", contenido: "Llamar a maria@correo.com" }).ok, false);
  assert.equal(validarEntrada({ tipo: "nota", titulo: "Clave", contenido: "la api_key: abc123" }).ok, false);
  assert.equal(validarEntrada({ tipo: "enlace", titulo: "Guía", contenido: "mirar esto" }).ok, false);
  assert.equal(validarEntrada({ tipo: "enlace", titulo: "Guía", contenido: "Guía de Meta", fuente: "https://developers.facebook.com/docs" }).ok, true);
  assert.equal(pareceSecreto("AIza" + "x".repeat(30)), true);
  assert.equal(pareceSecreto("una frase común de negocio"), false);
});

test("lo aprendido se busca igual que los .md y muestra la fuente", () => {
  const s = aSecciones([{ tipo: "regla", titulo: "Domingos", contenido: "Los domingos no se envían campañas.", fuente: null }]);
  const r = buscarEnCerebro(s, "¿se envían campañas los domingos?");
  assert.equal(r[0].archivo, "Aprendido · Regla");
});

test("decisiones: las fechadas van primero, de la más nueva a la más vieja, y las de fondo después", () => {
  const md = "## Regla de fondo\n- No se paga nada.\n## Órdenes del 21/11 (tarde)\n- Punto A uno\n## Órdenes del 22/11\n- Punto B dos\n### 22/11 · Jarvis\n- Punto C tres";
  const d = decisionesDe(md);
  assert.deepEqual(d.map((x) => x.titulo), ["22/11 · Jarvis", "Órdenes del 22/11", "Órdenes del 21/11 (tarde)", "Regla de fondo"]);
  assert.equal(d[3].fecha, null);
  assert.equal(fechaLarga("2026-11-22"), "22 de noviembre");
});

test("con las órdenes reales hay decisiones fechadas del 22/11", () => {
  const d = decisionesDe(readFileSync(join(__dirname, "../../cerebro/02-ordenes-vigentes.md"), "utf8"));
  assert.ok(d.length > 10);
  assert.equal(d[0].fecha, "2026-11-22");
});
