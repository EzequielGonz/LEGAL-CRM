import test from "node:test";
import assert from "node:assert/strict";
import { claveDeAviso, diaAr, fallasParaAvisar, textoDeAviso } from "@/lib/salud/avisar-fallas";
import { armarFallas } from "@/lib/salud/fallas";
import { tiemposDelLatido } from "@/lib/salud/reglas";

const sin = { fallidos24h: 0, seguimientos: 0, bot24h: 0, archivos: 0, retenidos: 0, audios24h: 0 };

test("fallas: se avisa lo que frena el trabajo, no lo que se resuelve solo", () => {
  assert.deepEqual(fallasParaAvisar(armarFallas("juridico", { ...sin, fallidos24h: 4, seguimientos: 30, archivos: 9, audios24h: 2 })), []);
  const claves = fallasParaAvisar(armarFallas("juridico", { ...sin, fallidos24h: 5, bot24h: 1, audios24h: 3, retenidos: 1, seguimientos: 30 })).map((f) => f.clave);
  assert.deepEqual(claves, ["fallidos", "bot", "audios", "retenidos"]);
});

test("fallas: un aviso por tipo, perfil y día; las de todo el sistema, una sola vez", () => {
  const ahora = new Date("2026-11-14T01:30:00Z"); // 13/11 22:30 en Argentina
  assert.equal(diaAr(ahora), "2026-11-13");
  const [bot, retenidos] = fallasParaAvisar(armarFallas("marketing", { ...sin, bot24h: 2, retenidos: 1 }));
  assert.equal(claveDeAviso("marketing", bot, ahora), "falla:marketing:bot:2026-11-13");
  assert.equal(claveDeAviso("marketing", retenidos, ahora), claveDeAviso("juridico", retenidos, ahora));
});

test("fallas: el aviso lleva a Salud del perfil y no nombra a nadie", () => {
  const [bot] = fallasParaAvisar(armarFallas("coberturas_medicas", { ...sin, bot24h: 2 }));
  const t = textoDeAviso("coberturas_medicas", bot);
  assert.equal(t.url, "/salud?perfil=coberturas_medicas#fallas");
  assert.match(t.title, /^Falla del sistema · /);
  assert.match(t.body, /El bot no pudo contestar 2 veces/);
});

test("latido: muestra cuánto tardó y la etapa más lenta, y avisa cerca del límite", () => {
  assert.equal(tiemposDelLatido(null), "");
  assert.equal(tiemposDelLatido({ ms: 3186, etapas: {} }), " Tardó 3,2 s.");
  assert.equal(tiemposDelLatido({ ms: 9000, etapas: { campanas: 800, extraccion: 6100 } }), " Tardó 9,0 s; lo más lento fue búsqueda de negocios (6,1 s).");
  assert.match(tiemposDelLatido({ ms: 55_000, etapas: { marketing: 40_000 } }), /cerca del límite/);
});
