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

import { elegirPlantilla, faltantesSeguimiento, textoDePlantilla } from "@/lib/seguimiento/wasender";

const pl = (nombre: string, uso: string, extra: Record<string, unknown> = {}) => ({ id: nombre, nombre, uso, cuerpo: "Hola {{nombre}}", variantes: [] as string[], activa: true, archivada_at: null, ...extra });

test("seguimiento por Wasender: la plantilla se elige por nombre y por uso", () => {
  const lista = [pl("jur_seguimiento_2", "seguimiento"), pl("jur_seguimiento_3", "seguimiento"), pl("jur_recupero_laboral_a", "seguimiento"), pl("jur_segundo_intento", "campana"), pl("form_recibido_jur", "seguimiento")];
  assert.equal(elegirPlantilla(lista, "seguimiento_2")?.nombre, "jur_seguimiento_2");
  assert.equal(elegirPlantilla(lista, "seguimiento_3")?.nombre, "jur_seguimiento_3");
  assert.equal(elegirPlantilla(lista, "segundo_intento")?.nombre, "jur_segundo_intento");
  // El contacto 3 usa la del 2 si no tiene la propia; inactivas, archivadas o con «[revisar]» no cuentan.
  assert.equal(elegirPlantilla([pl("jur_seguimiento_2", "seguimiento")], "seguimiento_3")?.nombre, "jur_seguimiento_2");
  assert.equal(elegirPlantilla([pl("jur_seguimiento_2", "seguimiento", { activa: false })], "seguimiento_2"), null);
  assert.equal(elegirPlantilla([pl("jur_seguimiento_2", "seguimiento", { cuerpo: "Turno [revisar 1]" })], "seguimiento_2"), null);
  assert.equal(elegirPlantilla([pl("jur_segundo_intento", "seguimiento")], "segundo_intento"), null);
});

test("seguimiento por Wasender: no sale si la línea es de otro perfil o área, está caída o falta la plantilla", () => {
  const ENV = { WASENDER_HABILITADO: "true" };
  const linea = { id: "l", nombre: "Chip", rubro_id: "r1", area: "civil", habilitada: true, estado: "connected", api_key_cifrada: "v1.x", archivada_at: null, limite_diario: null, calentamiento_desde: null };
  const base = { linea, rubroId: "r1", area: "civil", plantilla: pl("jur_seguimiento_2", "seguimiento"), proposito: "seguimiento_2" as const, perfil: { brand_name: "Marca ficticia", agent_presentation_name: "Asesor ficticio" } };
  assert.equal(faltantesSeguimiento(base, ENV), null);
  assert.match(faltantesSeguimiento({ ...base, rubroId: "r2" }, ENV) ?? "", /otro perfil/);
  assert.match(faltantesSeguimiento({ ...base, area: "penal" }, ENV) ?? "", /otra área/);
  assert.match(faltantesSeguimiento({ ...base, linea: { ...linea, estado: "logged_out" } }, ENV) ?? "", /no está conectada/);
  assert.match(faltantesSeguimiento({ ...base, plantilla: null }, ENV) ?? "", /_seguimiento_2/);
  assert.match(faltantesSeguimiento({ ...base, linea: null }, ENV) ?? "", /ya no existe/);
  assert.match(faltantesSeguimiento(base, {}) ?? "", /apagado en este entorno/);
});

test("seguimiento por Wasender: el texto usa el primer nombre", () => {
  assert.equal(textoDePlantilla({ cuerpo: "Hola {{nombre}}, soy {{asesor}}.", variantes: [] }, { nombre: "MARIA LAURA GOMEZ", asesor: "Asesor ficticio", marca: "" }, "x"), "Hola Maria, soy Asesor ficticio.");
});
