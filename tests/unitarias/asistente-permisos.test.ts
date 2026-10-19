import { test } from "node:test";
import assert from "node:assert/strict";
import { faltaParaConfirmar, nivelDeAccion, TIPOS_ACCION } from "@/lib/asistente/permisos";
import { diasDeEjecucion } from "@/lib/asistente/campanas";
import { elegirPorNombre } from "@/lib/asistente/operaciones";
import { validarImagenes, validarTextos, MAX_IMAGENES } from "@/lib/asistente/motor";
import { resumirColumnas } from "@/lib/asistente/base-resumen";
import { NOMBRES_OPERACIONES } from "@/lib/asistente/operaciones";
import { DECLARACIONES } from "@/lib/asistente/herramientas";

test("asistente: lanzar una campaña exige la confirmación reforzada", () => {
  assert.equal(nivelDeAccion("lanzar_campana"), "contacto");
  assert.ok(faltaParaConfirmar("contacto", {}));
  assert.ok(faltaParaConfirmar("contacto", { confirmar_envio: "true" }), "solo vale el booleano true");
  assert.equal(faltaParaConfirmar("contacto", { confirmar_envio: true }), null);
});

test("asistente: activar un agente pide PIN; apagarlo o pausarlo, no", () => {
  assert.equal(nivelDeAccion("asignar_agente", { estado: "activa" }), "pin");
  assert.equal(nivelDeAccion("asignar_agente", { estado: "apagada" }), "cambio");
  assert.equal(nivelDeAccion("asignar_agente", { estado: "pausada" }), "cambio");
  assert.equal(faltaParaConfirmar("pin", {})?.codigo, "pin");
  assert.equal(faltaParaConfirmar("pin", { pin: "  " })?.codigo, "pin");
  assert.equal(faltaParaConfirmar("pin", { pin: "1234" }), null);
});

test("asistente: crear una campaña, cambiar la línea o publicar no pueden enviar y no piden más que Confirmar", () => {
  for (const t of ["crear_campana", "asignar_linea_campana", "publicaciones", "cambio_agente", "pausar_campana"]) {
    assert.equal(nivelDeAccion(t), "cambio", t);
    assert.equal(faltaParaConfirmar("cambio", {}), null);
  }
  // Un tipo desconocido nunca queda con un nivel más laxo que «cambio» por error de tipeo en el payload.
  assert.equal(nivelDeAccion("lo_que_sea", { estado: "activa" }), "cambio");
});

test("asistente: cada tipo permitido en la base tiene su nivel y el asistente no tiene herramientas de pago", () => {
  assert.equal(TIPOS_ACCION.length, 7);
  const nombres = DECLARACIONES.map((d) => d.name);
  for (const n of NOMBRES_OPERACIONES) assert.ok(nombres.includes(n), `falta declarar ${n}`);
  assert.ok(!nombres.some((n) => /pago|pagar|gasto|presupuesto|publicidad/.test(n)));
  // Ninguna herramienta ejecuta: las que cambian algo son «proponer_*».
  assert.ok(!nombres.some((n) => /^(lanzar|enviar|iniciar|activar)/.test(n)));
});

test("asistente: días de ejecución y búsqueda por nombre", () => {
  assert.deepEqual(diasDeEjecucion([6, 1, 1, 7, 0, "x"]), [1, 6]);
  assert.equal(diasDeEjecucion([1, 2, 3, 4, 5, 6]), null, "lunes a sábado equivale a sin restricción");
  assert.equal(diasDeEjecucion("no"), null);
  const items = [{ id: "a", n: "Base 21 9" }, { id: "b", n: "Base 22 9" }, { id: "c", n: "Accidentes" }];
  assert.equal(elegirPorNombre(items, "accidentes", (x) => x.n).uno?.id, "c");
  assert.equal(elegirPorNombre(items, "BASE 21 9", (x) => x.n).uno?.id, "a");
  assert.equal(elegirPorNombre(items, "base", (x) => x.n).varios?.length, 2);
  assert.equal(elegirPorNombre(items, "nada", (x) => x.n).uno, undefined);
  assert.equal(elegirPorNombre(items, "", (x) => x.n).uno, undefined);
});

test("asistente: imágenes adjuntas se validan por formato y tamaño", () => {
  const ok = { mime: "image/jpeg", datos: "QUJD" };
  assert.equal(validarImagenes([ok, ok, ok, ok, ok]).length, MAX_IMAGENES);
  assert.equal(validarImagenes([{ mime: "text/html", datos: "QUJD" }]).length, 0);
  assert.equal(validarImagenes([{ mime: "image/png", datos: "no es base64!" }]).length, 0);
  assert.equal(validarImagenes([{ mime: "image/png", datos: "A".repeat(6_000_000) }]).length, 0);
  assert.equal(validarImagenes("x").length, 0);
});

test("asistente: el PDF se acepta y los archivos de texto se limitan", () => {
  assert.equal(validarImagenes([{ mime: "application/pdf", datos: "QUJD" }]).length, 1);
  const t = validarTextos([{ nombre: "a.csv", contenido: "x".repeat(50000) }, { nombre: "b.txt", contenido: "y".repeat(50000) }, { nombre: "vacio", contenido: "  " }, 5]);
  assert.equal(t.length, 2);
  assert.equal(t.reduce((a, x) => a + x.contenido.length, 0), 60000);
  assert.deepEqual(validarTextos("no"), []);
});

test("asistente: el resumen de una base muestra categorías y nunca datos personales", () => {
  const filas = [
    { Nombre: "Ana Pérez", Teléfono: "1155550000", Email: "ana@x.com", "Tipo de consulta": "Accidente de tránsito", Observaciones: "llamar tarde" },
    { Nombre: "Luis Gómez", Teléfono: "1155551111", Email: "luis@x.com", "Tipo de consulta": "Accidente de tránsito", Observaciones: "" },
    { Nombre: "Eva Díaz", Teléfono: "1155552222", Email: "eva@x.com", "Tipo de consulta": "Accidente laboral", Observaciones: "" },
  ];
  const r = resumirColumnas(filas);
  assert.equal(r.filas, 3);
  const tipo = r.columnas.find((c) => c.columna === "Tipo de consulta");
  assert.deepEqual(tipo?.valores, [{ valor: "Accidente de tránsito", cantidad: 2 }, { valor: "Accidente laboral", cantidad: 1 }]);
  const texto = JSON.stringify(r);
  for (const dato of ["Ana", "Luis", "1155550000", "ana@x.com", "llamar tarde"]) assert.ok(!texto.includes(dato), dato);
  assert.ok(r.columnas.filter((c) => c.valores).length === 1);
});
