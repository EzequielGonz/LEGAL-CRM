import test from "node:test";
import assert from "node:assert/strict";
import { normalizarAlcance, validarAlcance, expandirTareas, etiquetaAlcance } from "@/lib/alcance";
import { elegirGanador, topeDeCandidatos, MAX_CANDIDATOS_ARENA } from "@/lib/arena";

test("alcance: normaliza, ordena y quita repetidos", () => {
  const a = normalizarAlcance({ tipo: "rubros", rubros: ["marketing", "juridico", "marketing"], modo: "juntos" });
  assert.deepEqual(a, { tipo: "rubros", rubros: ["juridico", "marketing"], modo: "juntos" });
});

test("alcance: varios rubros sin modo van separados; uno solo es juntos", () => {
  assert.equal((normalizarAlcance({ tipo: "rubros", rubros: ["juridico", "agencia_0km"] }) as any).modo, "separados");
  assert.equal((normalizarAlcance({ tipo: "rubros", rubros: ["marketing"], modo: "separados" }) as any).modo, "juntos");
});

test("alcance: entradas viejas y basura", () => {
  assert.deepEqual(normalizarAlcance("panel"), { tipo: "panel" });
  assert.equal((normalizarAlcance("cuatro_rubros") as any).rubros.length, 4);
  assert.deepEqual(normalizarAlcance("marketing"), { tipo: "rubros", rubros: ["marketing"], modo: "juntos" });
  for (const x of [null, undefined, 3, "penal", { tipo: "rubros", rubros: [] }, { tipo: "rubros", rubros: ["penal"] }, { tipo: "otro" }]) assert.equal(normalizarAlcance(x), null);
});

test("alcance: validación en español", () => {
  assert.deepEqual(validarAlcance({ tipo: "panel" }), []);
  assert.equal(validarAlcance({ tipo: "rubros", rubros: [] }).length, 1);
  assert.equal(validarAlcance({ tipo: "rubros", rubros: ["juridico", "marketing"] }).length, 1);
  assert.equal(validarAlcance(undefined).length, 1);
});

test("alcance: expandir tareas", () => {
  const cuatro = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;
  const juntos = expandirTareas({ tipo: "rubros", rubros: [...cuatro], modo: "juntos" });
  assert.equal(juntos.length, 1);
  assert.equal(juntos[0].rubro, null);
  assert.equal(juntos[0].rubros.length, 4);
  const sep = expandirTareas({ tipo: "rubros", rubros: [...cuatro], modo: "separados" });
  assert.deepEqual(sep.map((t) => t.rubro), [...cuatro]);
  assert.deepEqual(expandirTareas({ tipo: "panel" }), [{ rubro: null, rubros: [], clave: "panel" }]);
  assert.equal(expandirTareas({ tipo: "rubros", rubros: ["marketing"], modo: "juntos" })[0].rubro, "marketing");
});

test("alcance: etiquetas", () => {
  assert.equal(etiquetaAlcance({ tipo: "panel" }), "Todo el panel");
  assert.equal(etiquetaAlcance({ tipo: "rubros", rubros: ["marketing"], modo: "juntos" }), "Marketing");
  assert.match(etiquetaAlcance({ tipo: "rubros", rubros: ["juridico", "coberturas_medicas", "agencia_0km", "marketing"], modo: "separados" }), /^Los 4 rubros, por separado/);
  assert.match(etiquetaAlcance({ tipo: "rubros", rubros: ["juridico", "marketing"], modo: "juntos" }), /Jurídico \+ Marketing, juntos/);
});

test("arena: gana el mejor promedio y descarta lo que falló", () => {
  const r = elegirGanador([
    { id: "a", puntajes: [{ juez: "j", puntaje: 6 }] },
    { id: "b", puntajes: [{ juez: "j", puntaje: 9 }, { juez: "k", puntaje: 7 }] },
    { id: "c", puntajes: [{ juez: "j", puntaje: 10 }], error: "falló" },
    { id: "d", puntajes: [{ juez: "j", puntaje: NaN }] },
  ])!;
  assert.equal(r.ganador.id, "b");
  assert.deepEqual(r.ranking.map((x) => x.id), ["b", "a"]);
  assert.equal(elegirGanador([]), null);
});

test("arena: empate se resuelve por costo y después por orden", () => {
  const p = [{ juez: "j", puntaje: 8 }];
  assert.equal(elegirGanador([{ id: "x", puntajes: p, costoUsd: 0.02 }, { id: "y", puntajes: p, costoUsd: 0.01 }])!.ganador.id, "y");
  assert.equal(elegirGanador([{ id: "x", puntajes: p }, { id: "y", puntajes: p }])!.ganador.id, "x");
});

test("arena: el tope nunca pasa el presupuesto", () => {
  assert.equal(topeDeCandidatos(5, 0.01), MAX_CANDIDATOS_ARENA);
  assert.equal(topeDeCandidatos(0.5, 0.01, { costoJuezUsd: 0.1 }), 40);
  assert.equal(topeDeCandidatos(0.1, 0.03, { costoJuezUsd: 0.02 }), 2);
  assert.equal(topeDeCandidatos(0.04, 0.03, { costoJuezUsd: 0.02 }), 1, "sin lugar para el juez corre uno solo");
  assert.equal(topeDeCandidatos(0.02, 0.03), 0);
  assert.equal(topeDeCandidatos(0, 0.01), 0);
  assert.equal(topeDeCandidatos(5, 0), 0);
  assert.equal(topeDeCandidatos(NaN, 0.01), 0);
  assert.equal(topeDeCandidatos(10, 0.01, { maximo: 5 }), 5);
  for (const [rest, costo, juez] of [[0.3, 0.07, 0.05], [1.234567, 0.000123, 0.01], [29.99, 0.3333, 0.2]]) {
    const n = topeDeCandidatos(rest, costo, { costoJuezUsd: juez });
    assert.ok(n * costo + (n > 1 ? juez : 0) <= rest + 1e-12, `se pasa con ${rest}/${costo}`);
  }
});
