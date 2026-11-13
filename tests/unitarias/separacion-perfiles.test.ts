import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { equivalenteEnPerfil, esRutaRaizJuridico, perfilDeReferente, perfilDeRuta, rutaDePerfil } from "../../src/lib/perfil-ruta";
import { itemsDelPerfil } from "../../src/lib/salud/por-perfil";
import type { ItemSalud } from "../../src/lib/salud/reglas";

// 13/11 · «que cada rubro sea separado […] que no se mezcle nada con nada».

test("separación: una dirección dice de qué perfil es", () => {
  assert.equal(perfilDeRuta("/panel/marketing/chats", null), "marketing");
  assert.equal(perfilDeRuta("/panel/agencia_0km", null), "agencia_0km");
  assert.equal(perfilDeRuta("/inbox/abc", null), "juridico");
  assert.equal(perfilDeRuta("/campanas", null), "juridico");
  assert.equal(perfilDeRuta("/hoy", "coberturas_medicas"), "coberturas_medicas");
  assert.equal(perfilDeRuta("/hoy", null), null, "una pantalla común sin perfil no se atribuye a ninguno");
  assert.equal(perfilDeRuta("/hoy", "inventado"), null);
  assert.equal(perfilDeRuta("/ficha/abc", null), null);
  assert.equal(perfilDeRuta("/panel/inventado/chats", null), null);
});

test("separación: la misma sección en cada perfil", () => {
  assert.equal(rutaDePerfil("juridico", "chats"), "/inbox");
  assert.equal(rutaDePerfil("juridico", "chats", "c1"), "/inbox/c1");
  assert.equal(rutaDePerfil("marketing", "chats", "c1"), "/panel/marketing/chats/c1");
  assert.equal(rutaDePerfil("agencia_0km", "campanas"), "/panel/agencia_0km/campanas");
  assert.equal(rutaDePerfil("juridico", "configuracion"), "/configuracion");
});

test("separación: una pantalla de Jurídico pedida desde otro perfil se abre en ese perfil", () => {
  assert.equal(equivalenteEnPerfil("/campanas", "", "agencia_0km"), "/panel/agencia_0km/campanas");
  assert.equal(equivalenteEnPerfil("/inbox", "?atencion=esperan", "marketing"), "/panel/marketing/chats?atencion=esperan");
  assert.equal(equivalenteEnPerfil("/configuracion", "?nivel=avanzado", "coberturas_medicas"), "/panel/coberturas_medicas/configuracion?nivel=avanzado");
  assert.equal(equivalenteEnPerfil("/prospectos", "", "agencia_0km"), "/contactos?perfil=agencia_0km");
  assert.equal(equivalenteEnPerfil("/prospectos", "", "marketing"), "/panel/marketing/prospectos");
  // Desde Jurídico, o sin saber de dónde se viene, no se toca.
  assert.equal(equivalenteEnPerfil("/campanas", "", "juridico"), null);
  assert.equal(equivalenteEnPerfil("/campanas", "", null), null);
  // Un elemento por id resuelve su propio perfil en la pantalla.
  assert.equal(equivalenteEnPerfil("/inbox/c1", "", "marketing"), null);
  // Pantallas comunes: no son de la raíz de Jurídico.
  assert.equal(equivalenteEnPerfil("/hoy", "", "marketing"), null);
  assert.equal(esRutaRaizJuridico("/hoy"), false);
  assert.equal(esRutaRaizJuridico("/seguimiento"), true);
});

test("separación: el perfil de la página desde la que se navega", () => {
  const o = "https://panel.ejemplo";
  assert.equal(perfilDeReferente(`${o}/panel/marketing/chats`, o), "marketing");
  assert.equal(perfilDeReferente(`${o}/hoy?perfil=agencia_0km`, o), "agencia_0km");
  assert.equal(perfilDeReferente(`${o}/inbox`, o), "juridico");
  assert.equal(perfilDeReferente(`${o}/ficha/abc`, o), null);
  assert.equal(perfilDeReferente("https://otro.sitio/panel/marketing", o), null, "otro sitio no cuenta");
  assert.equal(perfilDeReferente(null, o), null);
  assert.equal(perfilDeReferente("no es una dirección", o), null);
});

test("separación: Salud muestra en cada perfil lo propio y lo de todo el sistema", () => {
  const it = (clave: string, extra: Partial<ItemSalud> = {}): ItemSalud => ({ clave, estado: "rojo", titulo: clave, detalle: "", ...extra });
  const items = [
    it("latido"),
    it("pausa"),
    it("wasender_1", { perfil: "juridico" }),
    it("wasender_2", { perfil: "agencia_0km" }),
    it("agente_marketing"),
    it("calidad_agencia_0km"),
    it("avisos_Jurídico"),
    it("avisos_Autos 0 km"),
    it("presupuestos"),
  ];
  const claves = (slug: string) => itemsDelPerfil(items, slug).map((i) => i.clave);
  assert.deepEqual(claves("agencia_0km"), ["latido", "pausa", "wasender_2", "calidad_agencia_0km", "avisos_Autos 0 km"]);
  assert.deepEqual(claves("juridico"), ["latido", "pausa", "wasender_1", "avisos_Jurídico"]);
  assert.deepEqual(claves("marketing"), ["latido", "pausa", "agente_marketing", "presupuestos"]);
  assert.deepEqual(claves("coberturas_medicas"), ["latido", "pausa"]);
});

function archivos(dir: string, salida: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) archivos(p, salida);
    else if (/\.(ts|tsx)$/.test(n)) salida.push(p);
  }
  return salida;
}

const RAIZ = join(__dirname, "..", "..", "src");
const TODOS = archivos(RAIZ);
const rel = (p: string) => p.slice(RAIZ.length + 1).replace(/\\/g, "/");

test("separación: ninguna pantalla cae en Jurídico cuando falta el perfil", () => {
  // Respaldos permitidos: no eligen de quién se muestran personas (tema visual por defecto, catálogos, textos).
  const PERMITIDOS = new Set(["lib/marca.ts", "lib/rubros.ts", "lib/wasender/salud.ts", "lib/agentes/servicio.ts", "app/api/agentes/corpus/route.ts", "app/piezas/[id]/[archivo]/route.tsx", "components/ficha/ficha-section.tsx"]);
  const malos: string[] = [];
  for (const f of TODOS) {
    if (PERMITIDOS.has(rel(f))) continue;
    const lineas = readFileSync(f, "utf8").split("\n");
    lineas.forEach((l, i) => {
      if (/(\?\?|\|\|)\s*"juridico"/.test(l) || /esSlugPerfil\([^)]*\)\s*\?[^:]*:\s*"juridico"/.test(l)) malos.push(`${rel(f)}:${i + 1}`);
    });
  }
  assert.deepEqual(malos, [], "usar perfilActivo() de @/lib/perfil-activo en lugar de caer en Jurídico");
});

test("separación: fuera del panel de Jurídico no hay enlaces fijos a sus pantallas", () => {
  const RUTAS = "inbox|campanas|bases|seguimiento|agenda|agentes|estadisticas|casos-cerrados|revision";
  const patron = new RegExp(`href=\\{?[\`"]/(${RUTAS})([/?#\`"]|\\$)`);
  const malos: string[] = [];
  for (const f of TODOS) {
    const r = rel(f);
    if (r.startsWith("app/(dashboard)/") || r.startsWith("app/api/")) continue;
    readFileSync(f, "utf8")
      .split("\n")
      .forEach((l, i) => {
        if (patron.test(l)) malos.push(`${r}:${i + 1}`);
      });
  }
  assert.deepEqual(malos, [], "armar el enlace con rutaDePerfil() o /conversacion/<id>");
});
