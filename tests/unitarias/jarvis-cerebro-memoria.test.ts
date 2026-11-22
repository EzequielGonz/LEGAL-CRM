import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buscarEnCerebro, seccionesDe } from "../../src/lib/jarvis/cerebro-memoria";

test("parte el markdown en secciones y encuentra la que responde", () => {
  const md = "# Órdenes\nintro\n## Recontacto\nSale una vez por oportunidad y 30 días por teléfono.\n## Diseño\nSin fondo raro.";
  const s = seccionesDe("02.md", md);
  assert.equal(s.length, 3);
  const r = buscarEnCerebro(s, "¿cada cuánto sale el recontacto?");
  assert.equal(r[0].titulo, "Recontacto");
  assert.deepEqual(buscarEnCerebro(s, "de la el"), []);
});

test("con el cerebro real, encuentra las órdenes de Jarvis", () => {
  const md = readFileSync(join(__dirname, "../../cerebro/02-ordenes-vigentes.md"), "utf8");
  const r = buscarEnCerebro(seccionesDe("02-ordenes-vigentes.md", md), "Jarvis puede hacer todo confirmación");
  assert.ok(r.length > 0);
  assert.match(r[0].texto + r[0].titulo, /Jarvis/);
});
