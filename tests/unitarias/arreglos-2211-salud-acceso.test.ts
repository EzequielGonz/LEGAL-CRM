import test from "node:test";
import assert from "node:assert/strict";
import { evaluarSalud, type DatosSalud } from "@/lib/salud/reglas";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";

const base: DatosSalud = {
  ahora: new Date("2026-11-22T12:00:00Z"),
  ultimoLatido: "2026-11-22T11:59:00Z",
  pausa: { ia: false, envios: false },
  cuarentena24h: { cantidad: 0, motivo: null },
  secretoMeta: true,
  ultimoEntrante: "2026-11-22T11:00:00Z",
  perfiles: [],
  turnos24h: { errores: 0, total: 0 },
  presupuestosAtrasados: 0,
};

test("22/11: Marketing no puede decir «en orden» si Meta no le da acceso al número", () => {
  const items = evaluarSalud({ ...base, accesoLineas: [{ slug: "marketing", nombre: "Marketing", linea: "MARKETING", estado: "sin_acceso", ok: false, etiqueta: "Sin acceso al número" }] });
  const marketing = itemsDelPerfil(items, "marketing").find((i) => i.clave === "acceso_marketing");
  assert.equal(marketing?.estado, "rojo");
  assert.match(marketing?.titulo ?? "", /Marketing/);
  assert.match(marketing?.detalle ?? "", /no recibe ni contesta/i);
  assert.equal(marketing?.perfil, "marketing");
  // Y no aparece en los otros perfiles.
  assert.equal(itemsDelPerfil(items, "juridico").some((i) => i.clave === "acceso_marketing"), false);
});

test("22/11: con acceso confirmado, el control está en verde", () => {
  const items = evaluarSalud({ ...base, accesoLineas: [{ slug: "juridico", nombre: "Jurídico", linea: "CIVIL", estado: "conectada", ok: true, etiqueta: "Conectada" }] });
  assert.equal(items.find((i) => i.clave === "acceso_juridico")?.estado, "verde");
});

test("22/11: si no se pudo comprobar, no se dice que está en orden ni que está roto", () => {
  const items = evaluarSalud({ ...base, accesoLineas: [{ slug: "agencia_0km", nombre: "Autos 0 km", linea: "AUTOS", estado: "no_comprobado", ok: false, etiqueta: "Estado desconocido" }] });
  const i = items.find((x) => x.clave === "acceso_agencia_0km");
  assert.equal(i?.estado, "amarillo");
  assert.match(i?.detalle ?? "", /no se pudo comprobar/i);
});

test("22/11: dos líneas del mismo perfil no se pisan", () => {
  const items = evaluarSalud({
    ...base,
    accesoLineas: [
      { slug: "juridico", nombre: "Jurídico", linea: "CIVIL", estado: "conectada", ok: true, etiqueta: "Conectada" },
      { slug: "juridico", nombre: "Jurídico", linea: "PENAL", estado: "token_invalido", ok: false, etiqueta: "Token inválido o vencido" },
    ],
  });
  const claves = items.filter((i) => i.clave.startsWith("acceso_")).map((i) => i.clave);
  assert.equal(new Set(claves).size, claves.length);
  assert.equal(claves.length, 2);
});
