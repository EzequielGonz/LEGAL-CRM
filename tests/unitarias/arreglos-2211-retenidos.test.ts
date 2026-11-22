import test from "node:test";
import assert from "node:assert/strict";
import { filtroRetenidosDelPerfil, resumenRetenidosDelPerfil, retenidoEsDelPerfil, rotuloPerfilDeRetenido, rubroDeRetenidoPorArea } from "@/lib/definiciones/retenidos";
import { RUBRO_IDS } from "@/lib/rubros";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";
import { evaluarSalud, type DatosSalud } from "@/lib/salud/reglas";

test("22/11: el rubro de un retenido sale del área de la línea; Penal es de Jurídico", () => {
  assert.equal(rubroDeRetenidoPorArea("penal"), RUBRO_IDS.juridico);
  assert.equal(rubroDeRetenidoPorArea("civil"), RUBRO_IDS.juridico);
  assert.equal(rubroDeRetenidoPorArea("marketing"), RUBRO_IDS.marketing);
  assert.equal(rubroDeRetenidoPorArea(null), null);
  assert.equal(rubroDeRetenidoPorArea("inventada"), null);
});

test("22/11: cada panel ve solo sus retenidos; los sin perfil solo en Jurídico", () => {
  assert.equal(retenidoEsDelPerfil(RUBRO_IDS.marketing, "marketing"), true);
  assert.equal(retenidoEsDelPerfil(RUBRO_IDS.marketing, "juridico"), false);
  assert.equal(retenidoEsDelPerfil(RUBRO_IDS.juridico, "agencia_0km"), false);
  assert.equal(retenidoEsDelPerfil(null, "juridico"), true);
  for (const s of ["agencia_0km", "coberturas_medicas", "marketing"] as const) assert.equal(retenidoEsDelPerfil(null, s), false, `sin perfil no se ve en ${s}`);
});

test("22/11: el filtro de consulta coincide con la regla", () => {
  assert.deepEqual(filtroRetenidosDelPerfil("marketing"), { tipo: "eq", valor: RUBRO_IDS.marketing });
  const j = filtroRetenidosDelPerfil("juridico");
  assert.equal(j.tipo, "or");
  assert.match(j.valor, /rubro_id\.is\.null/);
});

test("22/11: una sola cuenta de retenidos: pendientes del perfil, sin tope de horas", () => {
  const rows = [
    { rubro_id: RUBRO_IDS.juridico, reviewed_at: null, detail: "modelo no respondió" },
    { rubro_id: null, reviewed_at: null, detail: "línea sin asignar" },
    { rubro_id: RUBRO_IDS.juridico, reviewed_at: "2026-11-01T00:00:00Z", detail: "ya revisado" },
    { rubro_id: RUBRO_IDS.marketing, reviewed_at: null, detail: "otro" },
  ];
  assert.deepEqual(resumenRetenidosDelPerfil(rows, "juridico"), { cantidad: 2, motivo: "modelo no respondió" });
  assert.deepEqual(resumenRetenidosDelPerfil(rows, "marketing"), { cantidad: 1, motivo: "otro" });
  assert.deepEqual(resumenRetenidosDelPerfil(rows, "coberturas_medicas"), { cantidad: 0, motivo: null });
  assert.equal(rotuloPerfilDeRetenido(null), "Sin perfil asignado");
  assert.equal(rotuloPerfilDeRetenido(RUBRO_IDS.agencia_0km), "Autos 0 km");
});

const base = (extra: Partial<DatosSalud> = {}): DatosSalud => ({
  ahora: new Date("2026-11-22T12:00:00Z"),
  ultimoLatido: "2026-11-22T11:59:00Z",
  pausa: { ia: false, envios: false },
  cuarentena24h: { cantidad: 0, motivo: null },
  secretoMeta: true,
  ultimoEntrante: "2026-11-22T11:00:00Z",
  perfiles: [],
  turnos24h: { errores: 0, total: 0 },
  presupuestosAtrasados: 0,
  ...extra,
});

test("22/11: en Salud los retenidos son de cada perfil y no aparecen en los otros", () => {
  const items = evaluarSalud(base({ retenidosPorPerfil: { juridico: { cantidad: 4, motivo: "x" }, marketing: { cantidad: 0, motivo: null }, coberturas_medicas: { cantidad: 0, motivo: null }, agencia_0km: { cantidad: 0, motivo: null } } }));
  const juridico = itemsDelPerfil(items, "juridico").find((i) => i.clave === "cuarentena");
  const marketing = itemsDelPerfil(items, "marketing").find((i) => i.clave === "cuarentena");
  assert.equal(juridico?.estado, "rojo");
  assert.match(juridico?.titulo ?? "", /^4 /);
  assert.equal(marketing?.estado, "verde", "Marketing no ve los retenidos de Jurídico");
  assert.doesNotMatch(marketing?.detalle ?? "", /24 h/, "la definición no tiene tope de 24 horas");
  assert.equal(items.filter((i) => i.clave === "cuarentena").length, 4, "un control por perfil");
});
