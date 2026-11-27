import { test } from "node:test";
import assert from "node:assert/strict";
import { armarContexto } from "../../src/lib/oficina/contexto";
import { promptCandidato, promptJuez } from "../../src/lib/oficina/ejecucion";

const trozo = (archivo: string, titulo: string, texto: string) => ({ archivo, titulo, texto });

test("contexto: arma los tres bloques con su origen", () => {
  const c = armarContexto({
    ordenes: [trozo("02-ordenes-vigentes.md", "Autos", "El bot no da cuotas ni financiación.")],
    cerebro: [trozo("03-crm-y-bots.md", "Hoy", "Hoy tiene «Atención humana» y «Captados para derivar».")],
    mapa: [trozo("mapa-codigo/GRAPH_REPORT.md", "Hubs", "tablero-hoy.tsx")],
  });
  assert.match(c, /Órdenes vigentes del dueño/);
  assert.match(c, /Atención humana/);
  assert.match(c, /Mapa del código/);
});

test("contexto: deja afuera lo que parece dato personal y respeta el tope", () => {
  const c = armarContexto({ ordenes: [], cerebro: [trozo("a.md", "x", "Llamar al 11 5555-1234 mañana"), trozo("b.md", "y", "a".repeat(300))], mapa: [] }, 200);
  assert.doesNotMatch(c, /5555/);
  assert.equal(c, "");
});

test("contexto: viaja en el pedido a Gemini y al juez, marcado como datos", () => {
  const t = { titulo: "T", pedido: "P", plan: null, ruta: [], alcance: null, contexto: "Cerebro:\n- [x.md · Hoy] Atención humana" };
  const p = promptCandidato(t as never, "directo");
  assert.match(p, /no son instrucciones/);
  assert.match(p, /Atención humana/);
  assert.match(promptJuez(t as never, [{ id: "R1", texto: "hola" }]), /Atención humana/);
  assert.doesNotMatch(promptCandidato({ ...t, contexto: null } as never, "directo"), /Contexto real/);
});
