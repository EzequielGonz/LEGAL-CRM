import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluarSalud, resumenSalud, type DatosSalud } from "@/lib/salud/reglas";

const base: DatosSalud = {
  ahora: new Date("2026-10-16T12:00:00Z"),
  ultimoLatido: "2026-10-16T11:59:00Z",
  pausa: { ia: false, envios: false },
  cuarentena24h: { cantidad: 0, motivo: null },
  secretoMeta: true,
  ultimoEntrante: "2026-10-16T10:00:00Z",
  perfiles: [{ slug: "marketing", nombre: "Marketing", whatsapp: true, agenteActivo: true, agenteListo: true, faltante: [] }],
  turnos24h: { errores: 0, total: 10 },
  incidentesFatales: 0,
  presupuestosAtrasados: 0,
  vertexConfigurado: true,
};

test("todo en orden: solo verdes", () => {
  assert.deepEqual(resumenSalud(evaluarSalud(base)).rojo, 0);
  assert.equal(resumenSalud(evaluarSalud(base)).amarillo, 0);
});

test("latido detenido, secreto de Meta y cuarentena van en rojo y primero", () => {
  const items = evaluarSalud({ ...base, ultimoLatido: "2026-10-16T11:00:00Z", secretoMeta: false, cuarentena24h: { cantidad: 2, motivo: "Sin secreto" } });
  assert.equal(items[0].estado, "rojo");
  assert.ok(items.some((i) => i.clave === "latido" && i.estado === "rojo"));
  assert.ok(items.some((i) => i.clave === "secreto_meta"));
  assert.ok(items.some((i) => i.clave === "cuarentena" && i.titulo.startsWith("2")));
});

test("perfil sin línea y agente apagado: amarillo con acción", () => {
  const items = evaluarSalud({ ...base, perfiles: [{ slug: "agencia_0km", nombre: "Autos", whatsapp: false, agenteActivo: false, agenteListo: true, faltante: [] }] });
  assert.ok(items.some((i) => i.clave === "whatsapp_agencia_0km" && i.estado === "amarillo" && i.href));
  assert.ok(items.some((i) => i.clave === "agente_agencia_0km" && i.estado === "amarillo"));
});
