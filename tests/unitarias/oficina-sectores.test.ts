import { test } from "node:test";
import assert from "node:assert/strict";
import { ESCRITORIOS } from "../../src/lib/oficina/reglas";
import { SECTORES, ORDEN_SECTORES, esSector, estadoSector, puestosOcupados, cuentaMotores } from "../../src/lib/oficina/sectores";

test("cada escritorio de la oficina es un sector con al menos 4 puestos y motores válidos", () => {
  assert.deepEqual(ORDEN_SECTORES, ESCRITORIOS.map((e) => e.area));
  const ids = new Set<string>();
  for (const a of ORDEN_SECTORES) {
    const s = SECTORES[a];
    assert.ok(s.puestos.length >= 4, a);
    for (const p of s.puestos) {
      assert.ok(["claude", "gemini", "panel"].includes(p.motor), p.id);
      assert.ok(!ids.has(p.id), `id repetido ${p.id}`);
      ids.add(p.id);
    }
  }
  assert.equal(esSector("redes"), true);
  assert.equal(esSector("x"), false);
  assert.ok(SECTORES.direccion.titulo.includes("Cerebro"));
});

test("estado del sector cuenta lo que trabaja, lo que espera y lo que pide OK", () => {
  const base = { area: null, ruta: ["redes", "direccion"] as any, recorrido: [] as any[], decision: null };
  const tareas = [
    { ...base, estado: "en_curso" as any },
    { ...base, estado: "pendiente" as any },
    { ...base, estado: "lista" as any },
    { ...base, estado: "en_curso" as any, recorrido: [{ area: "redes" }] as any },
  ];
  const e = estadoSector("redes", tareas);
  assert.deepEqual(e, { trabajando: 1, enCola: 1, paraAprobar: 1 });
  assert.equal(puestosOcupados(SECTORES.redes, e), 2);
  assert.equal(estadoSector("seo", tareas).trabajando, 0);
  const m = cuentaMotores(SECTORES.redes);
  assert.equal(m.claude + m.gemini + m.panel, SECTORES.redes.puestos.length);
});
