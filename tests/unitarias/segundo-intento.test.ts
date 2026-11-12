import { test } from "node:test";
import assert from "node:assert/strict";
import { diasDeEspera, planSegundoIntento } from "@/lib/seguimiento/segundo-intento";

const base = { porWasender: true, primerEnvioAt: "2026-11-02T15:00:00Z", estadoPrimerEnvio: "entregado", respondio: false, detenido: false, segundosHechos: 0, semilla: "contacto-ficticio" };

test("segundo intento: cada persona tiene su día entre 5 y 7, siempre el mismo", () => {
  const dias = new Set(Array.from({ length: 60 }, (_, i) => diasDeEspera(`c-${i}`)));
  assert.deepEqual([...dias].sort(), [5, 6, 7]);
  assert.equal(diasDeEspera("x"), diasDeEspera("x"));
});

test("segundo intento: espera hasta su día y después corresponde enviar", () => {
  const dias = diasDeEspera(base.semilla);
  const antes = planSegundoIntento(base, new Date("2026-11-06T15:00:00Z"));
  assert.equal(antes.accion, "esperar");
  const despues = planSegundoIntento(base, new Date(Date.parse(base.primerEnvioAt) + dias * 86_400_000 + 60_000));
  assert.equal(despues.accion, "enviar");
});

test("segundo intento: nunca por Meta, ni a quien respondió, está detenido, no recibió el primero o ya tuvo el suyo", () => {
  const ahora = new Date("2026-11-09T16:00:00Z");
  const motivo = (cambio: Partial<typeof base>) => (planSegundoIntento({ ...base, ...cambio }, ahora) as any).motivo;
  assert.equal(motivo({ porWasender: false }), "no_es_wasender");
  assert.equal(motivo({ respondio: true }), "respondio");
  assert.equal(motivo({ detenido: true }), "detenido");
  assert.equal(motivo({ estadoPrimerEnvio: "fallo" }), "no_entregado");
  assert.equal(motivo({ estadoPrimerEnvio: "enviado" }), "no_entregado");
  assert.equal(motivo({ segundosHechos: 1 }), "ya_se_hizo");
  assert.equal(motivo({ primerEnvioAt: null }), "sin_primer_envio");
  assert.equal((planSegundoIntento(base, new Date("2026-11-13T15:00:01Z")) as any).motivo, "vencido");
});
