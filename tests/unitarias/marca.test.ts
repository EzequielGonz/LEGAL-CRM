import { test } from "node:test";
import assert from "node:assert/strict";
import { MARCAS, ROLES, SLUGS_PERFIL, colorPrincipal, contraste, logoValido, normalizarColores, resolverMarca, tituloPestana } from "@/lib/marca";
import { faltantesDelBrief } from "@/lib/contenido/brief";

test("marca: `principal` es la clave canónica y `primario` se lee como alias", () => {
  assert.equal(colorPrincipal({ principal: "#112250" }), "#112250");
  assert.equal(colorPrincipal({ primario: "#0e4eb2" }), "#0E4EB2");
  assert.equal(colorPrincipal({ principal: "#112250", primario: "#000000" }), "#112250");
  assert.equal(colorPrincipal({}), null);
  assert.equal(colorPrincipal(null), null);
});

test("marca: normalizar conserva todas las claves válidas y descarta lo inválido", () => {
  const c = normalizarColores({ principal: "#112250", claro: "#e7e2ce", acento: "#C9A85A", roto: "rojo", "x y": "#000000", primario: "#ffffff" });
  assert.deepEqual(c, { principal: "#112250", claro: "#E7E2CE", acento: "#C9A85A" });
});

test("marca: el brief con `principal` (como está en la base) ya no pide color", () => {
  const b = { nombre_publico: "X", servicios: ["a"], publico: "p", tono: "t", logo_ref: "https://x/l.png", colores: { principal: "#112250" } as any };
  assert.ok(!faltantesDelBrief(b).some((f) => f.startsWith("color")));
  assert.ok(faltantesDelBrief({ ...b, colores: {} }).includes("color principal"));
});

test("marca: logo del panel — lo guardado en Configuración manda; si no, el original", () => {
  const original = resolverMarca("marketing", null);
  assert.equal(original.logoPanel, MARCAS.marketing.logo);
  assert.equal(original.origenLogo, "original");
  const propio = resolverMarca("marketing", { logo_panel: "https://cdn.example.com/nuevo.png", logo_ref: "https://landing/logo.png", nombre_publico: "Otra marca" });
  assert.equal(propio.logoPanel, "https://cdn.example.com/nuevo.png");
  assert.equal(propio.origenLogo, "configuracion");
  assert.equal(propio.nombre, "Otra marca");
  assert.equal(propio.logoPiezas, "https://landing/logo.png");
  // El logo de la landing (logo_ref) NO reemplaza al del panel.
  assert.equal(resolverMarca("juridico", { logo_ref: "https://landing/logo.png" }).logoPanel, MARCAS.juridico.logo);
  // Un valor inválido no rompe: vuelve al original.
  assert.equal(resolverMarca("juridico", { logo_panel: "javascript:alert(1)" }).logoPanel, MARCAS.juridico.logo);
});

test("marca: logos aceptados", () => {
  assert.equal(logoValido("/logos/juridico.svg"), "/logos/juridico.svg");
  assert.equal(logoValido("https://x.com/a.png"), "https://x.com/a.png");
  for (const no of ["http://x.com/a.png", "/otra/ruta.svg", "//x.com/a.png", "https://x.com/a b.png", "", null, 3]) assert.equal(logoValido(no as any), null, String(no));
});

test("marca: roles de color con contraste comprobado (WCAG 2.2 AA)", () => {
  for (const s of SLUGS_PERFIL) {
    const r = ROLES[s];
    assert.ok(contraste(r.texto, r.superficie) >= 4.5, `${s} texto`);
    assert.ok(contraste(r.textoSuave, r.superficie) >= 4.5, `${s} texto suave`);
    assert.ok(contraste(r.bordeControl, r.superficie) >= 3, `${s} borde de control`);
    assert.ok(contraste(r.textoSeleccion, r.seleccion) >= 4.5, `${s} selección`);
    assert.ok(contraste(r.textoAccion, r.accion) >= 4.5, `${s} acción`);
    assert.ok(contraste(r.textoMenu, r.menu) >= 4.5, `${s} menú`);
    // Cada rol sale de la paleta aprobada (o blanco para la superficie de lectura).
    const paleta = [...MARCAS[s].paleta.map((c) => c.toUpperCase()), "#FFFFFF"];
    for (const [rol, v] of Object.entries(r)) assert.ok(paleta.includes(v.toUpperCase()), `${s}.${rol} ${v} fuera de la paleta`);
  }
});

test("marca: escala óptica uniforme y moderada", () => {
  for (const s of SLUGS_PERFIL) assert.ok(MARCAS[s].escalaOptica >= 0.85 && MARCAS[s].escalaOptica <= 1.1, s);
});

test("marca: título de pestaña «Pantalla · Marca»", () => {
  assert.equal(tituloPestana("Inbox", "marketing"), "Inbox · Kocos Marketing");
  assert.equal(tituloPestana("Perfiles"), "Perfiles · Panel central");
});

test("marca: el nombre del panel sale de brand_briefs, nunca de rubros.brand_name (identidad del agente)", () => {
  // Una fila con brand_name (como la de rubros) no cambia el nombre visible del panel.
  const conAgente = resolverMarca("marketing", { brand_name: "Nombre con el que se presenta el agente" } as any);
  assert.equal(conAgente.nombre, MARCAS.marketing.nombre);
  const conAmbos = resolverMarca("marketing", { nombre_publico: "Marca del panel", brand_name: "Marca del agente" } as any);
  assert.equal(conAmbos.nombre, "Marca del panel");
});
