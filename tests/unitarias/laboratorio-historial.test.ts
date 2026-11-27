import { test } from "node:test";
import assert from "node:assert/strict";
import { armarHistorial } from "../../src/lib/laboratorio/historial";

test("el historial junta roles, ficha y agentes, lo más nuevo primero, sin inventar", () => {
  const e = armarHistorial({
    roles: [
      { nombre: "Urgencias", created_at: "2026-11-20T10:00:00Z", updated_at: "2026-11-21T10:00:00Z", creado_por: "operador" },
      { nombre: "Viejo", created_at: "2026-11-10T10:00:00Z", updated_at: "2026-11-11T10:00:00Z", archived_at: "2026-11-11T10:00:00Z", archived_note: "ya no sirve" },
    ],
    fichaActualizada: "2026-11-22T09:00:00Z",
    versiones: [{ clave: "juridico", version: 3, motivo: "tono más cálido", created_at: "2026-11-19T10:00:00Z" }],
  });
  assert.equal(e[0].tipo, "ficha");
  assert.ok(e.some((x) => x.tipo === "rol_cambiado" && x.titulo.includes("Urgencias")));
  assert.ok(e.some((x) => x.tipo === "rol_archivado" && x.detalle === "ya no sirve"));
  assert.ok(!e.some((x) => x.tipo === "rol_cambiado" && x.titulo.includes("Viejo")), "archivado no cuenta como cambiado");
  assert.deepEqual(e.map((x) => x.cuando), [...e.map((x) => x.cuando)].sort().reverse());
});

test("fechas rotas o ausentes no producen eventos y el tope se respeta", () => {
  assert.deepEqual(armarHistorial({ roles: [{ nombre: "X", created_at: "nada" }], fichaActualizada: null, versiones: [] }), []);
  const muchos = Array.from({ length: 50 }, (_, i) => ({ clave: "a", version: i, created_at: `2026-11-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z` }));
  assert.equal(armarHistorial({ roles: [], fichaActualizada: null, versiones: muchos }).length, 40);
});
