import { test } from "node:test";
import assert from "node:assert/strict";
import readXlsxFile from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";
import { filasAObjetos } from "../../src/lib/bases/parse-file";

// 13/11 (seguridad): la importación de bases dejó de usar «xlsx». Estas pruebas
// fijan que una planilla se lee igual que antes. Los datos son inventados.

test("la primera fila son los títulos y las celdas vacías quedan como texto vacío", () => {
  const filas = filasAObjetos([
    ["Nombre", "Teléfono", "Zona"],
    ["Persona Uno", 5491100000001, null],
    [null, null, null],
    ["Persona Dos", "5491100000002", "Lanús"],
  ]);
  assert.deepEqual(filas, [
    { Nombre: "Persona Uno", Teléfono: 5491100000001, Zona: "" },
    { Nombre: "Persona Dos", Teléfono: "5491100000002", Zona: "Lanús" },
  ]);
});

test("títulos vacíos o repetidos no pisan columnas", () => {
  const [f] = filasAObjetos([
    ["Nombre", null, "Nombre", "  "],
    ["a", "b", "c", "d"],
  ]);
  assert.deepEqual(f, { Nombre: "a", __EMPTY: "b", Nombre_1: "c", __EMPTY_1: "d" });
});

test("las fechas quedan como texto legible y una hoja sin datos no rompe", () => {
  const [f] = filasAObjetos([["Fecha", "Hora"], [new Date("2026-11-13T00:00:00.000Z"), new Date("2026-11-13T15:30:00.000Z")]]);
  assert.deepEqual(f, { Fecha: "2026-11-13", Hora: "2026-11-13T15:30:00.000Z" });
  assert.deepEqual(filasAObjetos([]), []);
  assert.deepEqual(filasAObjetos([["Solo títulos"]]), []);
});

test("ida y vuelta: lo que se descarga como Excel se vuelve a leer igual", async () => {
  const datos = [
    [{ value: "Nombre", fontWeight: "bold" as const }, { value: "Rating" }, { value: "Sitio web" }],
    ["Negocio de prueba", 4.5, "https://ejemplo.test"],
    ["Otro negocio", "", ""],
  ];
  const buffer = await writeExcelFile(datos as any, { sheet: "Negocios" }).toBuffer();
  const hojas = await readXlsxFile(buffer);
  assert.equal(hojas[0].sheet, "Negocios");
  assert.deepEqual(filasAObjetos(hojas[0].data as unknown[][]), [
    { Nombre: "Negocio de prueba", Rating: 4.5, "Sitio web": "https://ejemplo.test" },
    { Nombre: "Otro negocio", Rating: "", "Sitio web": "" },
  ]);
});
