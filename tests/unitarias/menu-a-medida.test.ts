import { test } from "node:test";
import assert from "node:assert/strict";
import { seccionesDePerfil } from "../../src/lib/menu";
import { aplicarMenuPersonal, fusionarMenu, validarMenuPersonal } from "../../src/lib/personalizacion/menu";

// 13/11 · El asistente puede cambiar «secciones»: el menú de cada perfil, por separado y con vuelta atrás.

const fabrica = seccionesDePerfil("marketing");
const etiquetas = (s: { label: string }[]) => s.map((x) => x.label);

test("sin nada guardado, el menú es el de fábrica", () => {
  assert.deepEqual(seccionesDePerfil("marketing", null), fabrica);
  assert.deepEqual(aplicarMenuPersonal(fabrica, {}), fabrica);
  assert.deepEqual(etiquetas(fabrica), ["Hoy", "Chats", "Contactos", "Campañas", "Bot IA", "Líneas y plantillas", "Redes", "Ajustes"]);
});

test("renombrar, ocultar y mover una sección", () => {
  const f = fusionarMenu(null, [{ seccion: "Contactos", nombre: "Clientes" }, { seccion: "redes", oculta: true }, { seccion: "Campañas", posicion: 1 }], fabrica);
  assert.equal(f.ok, true);
  if (!f.ok) return;
  const menu = seccionesDePerfil("marketing", f.valor);
  assert.deepEqual(etiquetas(menu.filter((s) => s.grupo === "trabajo")), ["Campañas", "Hoy", "Chats", "Clientes"]);
  assert.equal(menu.find((s) => s.clave === "redes")?.oculta, true);
  assert.equal(menu.find((s) => s.clave === "contactos")?.href, fabrica.find((s) => s.clave === "contactos")?.href, "cambia el nombre, no a dónde lleva");
  assert.equal(f.descripcion.length, 3);
  // Mover no saca a «Configurar» de su lugar.
  assert.deepEqual(etiquetas(menu).slice(4), ["Bot IA", "Líneas y plantillas", "Redes", "Ajustes"]);
});

test("se puede seguir nombrando a una sección por su nombre nuevo, y volver al original", () => {
  const a = fusionarMenu(null, [{ seccion: "Chats", nombre: "Mensajes" }], fabrica);
  assert.ok(a.ok);
  const b = fusionarMenu(a.ok ? a.valor : null, [{ seccion: "Mensajes", nombre: "" }], fabrica);
  assert.ok(b.ok);
  assert.deepEqual(seccionesDePerfil("marketing", b.ok ? b.valor : null), fabrica);
});

test("Hoy y Ajustes no se pueden ocultar: sin ellas no hay cómo volver", () => {
  for (const seccion of ["Hoy", "Ajustes"]) {
    const f = fusionarMenu(null, [{ seccion, oculta: true }], fabrica);
    assert.equal(f.ok, false);
  }
  // Aunque el dato guardado lo diga, al leerlo se ignora.
  const forzado = seccionesDePerfil("marketing", { secciones: { inicio: { oculta: true }, configuracion: { oculta: true } } });
  assert.ok(!forzado.some((s) => s.oculta));
});

test("renombrar una pestaña", () => {
  const f = fusionarMenu(null, [{ seccion: "Hoy", pestana: "Resultados", nombre_pestana: "Números" }], fabrica);
  assert.ok(f.ok);
  const hoy = seccionesDePerfil("marketing", f.ok ? f.valor : null).find((s) => s.clave === "inicio")!;
  assert.ok(hoy.tabs.some((t) => t.label === "Números"));
  assert.equal(fusionarMenu(null, [{ seccion: "Hoy", pestana: "No existe", nombre_pestana: "X" }], fabrica).ok, false);
});

test("lo que no se entiende se rechaza o se descarta: nunca rompe el menú", () => {
  assert.equal(fusionarMenu(null, [], fabrica).ok, false);
  assert.equal(fusionarMenu(null, [{ seccion: "Facturación", nombre: "X" }], fabrica).ok, false);
  assert.equal(fusionarMenu(null, [{ seccion: "Chats", posicion: 99 }], fabrica).ok, false);
  assert.equal(fusionarMenu(null, [{ seccion: "Chats", nombre: "A" }], fabrica).ok, false);
  assert.deepEqual(validarMenuPersonal({ secciones: { "<script>": { nombre: "x" }, chats: "no", contactos: { nombre: "  <b>Clientes</b>  " } }, orden: [1, "contactos", "contactos"] }), {
    secciones: { contactos: { nombre: "b Clientes /b" } },
    orden: ["contactos"],
  });
  assert.deepEqual(aplicarMenuPersonal(fabrica, { orden: ["no_existe"] } as any).map((s) => s.clave), fabrica.map((s) => s.clave));
});

test("cada perfil tiene su menú: el de Marketing no toca el de Jurídico", () => {
  const f = fusionarMenu(null, [{ seccion: "Chats", nombre: "Mensajes" }], fabrica);
  assert.ok(f.ok);
  assert.ok(etiquetas(seccionesDePerfil("juridico")).includes("Chats"));
});
