import test from "node:test";
import assert from "node:assert/strict";

import { detectColumns, resolveRowFields } from "@/lib/bases/mapping";
import { validateRows, checkRow, headersOf } from "@/lib/bases/validate";
import { rowsFingerprint, normName } from "@/lib/bases/import";

test("importación: propone columnas por encabezado", () => {
  assert.deepEqual(detectColumns(["Apellido y Nombre", "Teléfono de contacto", "DNI", "Localidad"]), {
    name: "Apellido y Nombre",
    phone: "Teléfono de contacto",
    dni: "DNI",
  });
  assert.deepEqual(detectColumns(["Col A", "Col B"]), { name: null, phone: null, dni: null });
});

test("importación: la columna elegida a mano manda sobre la detección", () => {
  const row = { Telefono: "", "Cel alternativo": "11 5555-1234", Nombre: "ANA PEREZ" };
  assert.equal(resolveRowFields(row).phone_raw, null);
  assert.equal(resolveRowFields(row, { phone: "Cel alternativo" }).phone_raw, "11 5555-1234");
  assert.equal(checkRow(row, 1, { phone: "Cel alternativo" }).phone, "5491155551234");
});

test("importación: filas utilizables + inválidas suman el total, con motivo", () => {
  const rows = [
    { Nombre: "Ana", Telefono: "011 15 5555-1234" },
    { Nombre: "Ana bis", Telefono: "+54 9 11 5555 1234" }, // mismo teléfono: repetida en el archivo
    { Nombre: "Sin tel", Telefono: "" },
    { Nombre: "Corto", Telefono: "12345" },
    { Nombre: "Otra zona", Telefono: "0351 15 123 4567" }, // 15 fuera de CABA: baja confianza
    { Nombre: "Cero inicial", Telefono: "01144445555", Extra: "columna desconocida" },
  ];
  const v = validateRows(rows);
  assert.equal(v.total, 6);
  assert.equal(v.utilizables + v.invalidas, v.total);
  assert.equal(v.invalidas, 2);
  assert.equal(v.repetidas_en_archivo, 1);
  assert.equal(v.a_revisar, 1);
  assert.equal(v.telefonos_distintos, 3);
  const motivos = v.ejemplos.map((e) => e.reason);
  assert.ok(motivos.includes("Sin teléfono"));
  assert.ok(motivos.some((m) => m.startsWith("Teléfono con formato irreconocible")));
  assert.deepEqual(headersOf(rows), ["Nombre", "Telefono", "Extra"]);
  // el cero inicial no se pierde: se normaliza sin inventar dígitos
  assert.equal(checkRow(rows[5], 6).phone, "5491144445555");
});

test("importación: misma huella para el mismo contenido, distinta si cambia algo", () => {
  const a = [{ Nombre: "Ana", Telefono: "1155551234" }];
  const b = [{ Telefono: "1155551234", Nombre: "Ana" }]; // mismas columnas en otro orden
  const c = [{ Nombre: "Ana", Telefono: "1155551235" }];
  assert.equal(rowsFingerprint(a), rowsFingerprint(b));
  assert.notEqual(rowsFingerprint(a), rowsFingerprint(c));
});

test("importación: conflicto de nombre ignora mayúsculas, tildes y orden", () => {
  assert.equal(normName("PÉREZ Ana"), normName("ana perez"));
  assert.notEqual(normName("Ana Pérez"), normName("Juan Pérez"));
});
