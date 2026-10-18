import { test } from "node:test";
import assert from "node:assert/strict";
import { MARCAS, SLUGS_PERFIL, marcaDe, temaDe } from "@/lib/marca";
import { itemActivo, menuDePerfil, seccionActiva, seccionesDePerfil } from "@/lib/menu";

test("cada perfil tiene marca, logo https y tema propio; lo desconocido cae en Jurídico", () => {
  for (const s of SLUGS_PERFIL) {
    assert.equal(MARCAS[s].slug, s);
    assert.match(MARCAS[s].logo, /^\/logos\/[a-z0-9_]+\.svg$/);
    assert.equal(temaDe(s), s);
  }
  assert.equal(temaDe("otro"), "juridico");
  assert.equal(temaDe(undefined), "juridico");
  assert.equal(marcaDe("marketing").nombre, "Kocos Marketing");
});

test("menú: seis secciones iguales en los cuatro perfiles, sin rutas de Jurídico en los demás", () => {
  for (const s of SLUGS_PERFIL) {
    const secc = seccionesDePerfil(s);
    assert.deepEqual(secc.map((x) => x.label), ["Inicio", "Conversaciones", "Contactos", "Captación", "Redes y contenido", "Configuración"]);
    const hrefs = secc.flatMap((x) => x.tabs.map((i) => i.href));
    assert.equal(new Set(hrefs).size, hrefs.length, `sin duplicados en ${s}`);
    assert.ok(hrefs.some((h) => h.startsWith("/comparacion-agentes?perfil=" + s)));
    // La agenda vive dentro de Contactos (como «Citas»).
    assert.ok(secc[2].tabs.some((t) => t.label === "Citas"));
    if (s !== "juridico") {
      for (const h of hrefs) assert.ok(h.startsWith(`/panel/${s}/`) || h.includes(`perfil=${s}`), `${s}: ${h}`);
    }
  }
  const mk = menuDePerfil("marketing").flatMap((x) => x.items.map((i) => i.label));
  assert.ok(mk.includes("Extraer negocios"));
  assert.ok(mk.includes("Piden presupuesto"));
  assert.ok(!menuDePerfil("agencia_0km").flatMap((x) => x.items.map((i) => i.label)).includes("Extraer negocios"));
});

test("ítem activo: prefijo más largo, sin confundir rutas parecidas", () => {
  const g = menuDePerfil("juridico");
  assert.equal(itemActivo(g, "/oportunidades"), "/oportunidades?perfil=juridico");
  assert.equal(itemActivo(g, "/campanas/123"), "/campanas");
  assert.equal(itemActivo(g, "/casos-cerrados"), "/casos-cerrados");
  assert.equal(itemActivo(g, "/nada"), null);
  assert.equal(itemActivo(g, "/redes"), "/redes?perfil=juridico");
  assert.equal(itemActivo(g, "/redes/whatsapp"), "/redes/whatsapp?perfil=juridico");
  const m = menuDePerfil("marketing");
  assert.equal(itemActivo(m, "/panel/marketing/presupuestos"), "/panel/marketing/presupuestos");
  assert.equal(itemActivo(m, "/panel/marketing/prospectos/x"), "/panel/marketing/prospectos");
});

test("vistas filtradas: una conversación filtrada va a Conversaciones; sin filtro, a Contactos", () => {
  const secc = seccionesDePerfil("coberturas_medicas");
  assert.equal(seccionActiva(secc, "/oportunidades", "?perfil=coberturas_medicas&indicador=requiere_humano")?.seccion.clave, "conversaciones");
  assert.equal(seccionActiva(secc, "/oportunidades", "perfil=coberturas_medicas")?.seccion.clave, "contactos");
  assert.equal(seccionActiva(secc, "/hoy", "perfil=coberturas_medicas")?.tab.label, "Resumen");
  assert.equal(seccionActiva(secc, "/panel/coberturas_medicas/agenda", null)?.seccion.clave, "contactos");
});
