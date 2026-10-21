import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluarSalud, lecturaSimple, resumenSalud, type DatosSalud } from "@/lib/salud/reglas";

const base: DatosSalud = {
  ahora: new Date("2026-10-16T12:00:00Z"),
  ultimoLatido: "2026-10-16T11:59:00Z",
  pausa: { ia: false, envios: false },
  cuarentena24h: { cantidad: 0, motivo: null },
  secretoMeta: true,
  ultimoEntrante: "2026-10-16T10:00:00Z",
  perfiles: [{ slug: "marketing", nombre: "Marketing", whatsapp: true, agenteActivo: true, agenteListo: true, faltante: [] }],
  turnos24h: { errores: 0, total: 10 },
  presupuestosAtrasados: 0,
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

test("lectura simple: sin nombres de variables ni tareas internas y con responsable", () => {
  const items = evaluarSalud({
    ahora: new Date("2026-10-17T12:00:00Z"),
    ultimoLatido: null,
    pausa: { ia: true, envios: false },
    cuarentena24h: { cantidad: 2, motivo: "Firma inválida" },
    secretoMeta: false,
    ultimoEntrante: null,
    perfiles: [{ slug: "marketing", nombre: "Marketing", whatsapp: false, agenteActivo: false, agenteListo: false, faltante: ["nombre"] }],
    turnos24h: { errores: 3, total: 10 },
    presupuestosAtrasados: 0,
    avisosMeta: [{ nombre: "Coberturas", sinAvisos: true, resultado: null }],
  });
  for (const i of items) {
    const l = lecturaSimple(i);
    assert.doesNotMatch(l.que, /[A-Z]{2,}_[A-Z]/, `variable a la vista en ${i.clave}`);
    assert.doesNotMatch(l.que, /campaigns-tick|Vercel|Supabase/, `herramienta interna en ${i.clave}`);
    if (l.quien === "tecnico") assert.equal(l.href, null);
  }
  const latido = lecturaSimple(items.find((i) => i.clave === "latido")!);
  assert.equal(latido.quien, "tecnico");
  assert.match(lecturaSimple(items.find((i) => i.clave === "cuarentena")!).que, /^2 mensaje/);
});

test("línea sin avisos de Meta: rojo y explicado sin nombres técnicos", () => {
  const items = evaluarSalud({ ...base, avisosMeta: [{ nombre: "Coberturas", sinAvisos: true, resultado: "Cuenta suscripta" }, { nombre: "Marketing", sinAvisos: false, resultado: null }] });
  const a = items.filter((i) => i.clave.startsWith("avisos_"));
  assert.equal(a.length, 1);
  assert.equal(a[0].estado, "rojo");
  assert.match(lecturaSimple(a[0]).que, /^Coberturas: /);
});
