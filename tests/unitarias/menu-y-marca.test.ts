import { test } from "node:test";
import assert from "node:assert/strict";
import { MARCAS, SLUGS_PERFIL, marcaDe, temaDe } from "@/lib/marca";
import { itemActivo, menuDePerfil } from "@/lib/menu";

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

test("menú unificado: mismos grupos en los cuatro perfiles, sin rutas de Jurídico en los demás", () => {
  for (const s of SLUGS_PERFIL) {
    const g = menuDePerfil(s);
    assert.deepEqual(g.map((x) => x.titulo), ["Trabajo diario", "Captación", "Agentes", "Ajustes"]);
    const hrefs = g.flatMap((x) => x.items.map((i) => i.href));
    assert.equal(new Set(hrefs).size, hrefs.length, `sin duplicados en ${s}`);
    assert.ok(hrefs.some((h) => h.startsWith("/comparacion-agentes?perfil=" + s)));
    if (s !== "juridico") {
      for (const h of hrefs) assert.ok(h.startsWith(`/panel/${s}/`) || h.includes(`perfil=${s}`), `${s}: ${h}`);
    }
  }
  const mk = menuDePerfil("marketing").flatMap((x) => x.items.map((i) => i.label));
  assert.ok(mk.includes("Extraer negocios"));
  assert.ok(mk.includes("Pide presupuesto"));
  assert.ok(!menuDePerfil("agencia_0km").flatMap((x) => x.items.map((i) => i.label)).includes("Extraer negocios"));
});

test("ítem activo: prefijo más largo, sin confundir rutas parecidas", () => {
  const g = menuDePerfil("juridico");
  assert.equal(itemActivo(g, "/oportunidades"), "/oportunidades?perfil=juridico");
  assert.equal(itemActivo(g, "/campanas/123"), "/campanas");
  assert.equal(itemActivo(g, "/casos-cerrados"), "/casos-cerrados");
  assert.equal(itemActivo(g, "/nada"), null);
  const m = menuDePerfil("marketing");
  assert.equal(itemActivo(m, "/panel/marketing/presupuestos"), "/panel/marketing/presupuestos");
  assert.equal(itemActivo(m, "/panel/marketing/prospectos/x"), "/panel/marketing/prospectos");
});
