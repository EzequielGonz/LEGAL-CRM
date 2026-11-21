import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALERTAS,
  CORRECCIONES,
  ENTIENDO,
  PENDIENTES,
  PREGUNTAS_ABIERTAS,
  PROPUESTAS,
  conteoAlertas,
  fotoParaClaude,
  lecturasDelPanel,
  pedidoDesdeCerebro,
  pendientesDe,
  type PerfilSemana,
} from "../../src/lib/cerebro/contenido";
import { CIFRAS_SEMANA } from "../../src/lib/asistente/semana-reglas";
import { MAX_PEDIDO, pareceDatoPersonal } from "../../src/lib/bandeja-claude";

// 21/11: Cerebro del negocio en el panel. Cifras ficticias.
function cifras(v: Partial<Record<string, [number | null, number | null]>>) {
  return Object.fromEntries(CIFRAS_SEMANA.map(({ clave }) => [clave, { actual: v[clave]?.[0] ?? 0, anterior: v[clave]?.[1] ?? 0 }])) as PerfilSemana["cifras"];
}

const SEMANA: PerfilSemana[] = [
  { perfil: "juridico", cifras: cifras({ enviados: [300, 280], captados: [4, 2], derivados: [1, 1], piden: [3, 0], respondieron: [40, 38] }) },
  { perfil: "coberturas_medicas", cifras: cifras({ enviados: [0, 0], respondieron: [2, 10] }) },
  { perfil: "agencia_0km", cifras: cifras({ enviados: [0, 0] }) },
  { perfil: "marketing", cifras: cifras({ enviados: [50, 60], respondieron: [9, 8] }) },
];

test("el contenido no tiene datos personales ni trato en femenino", () => {
  const textos = [
    ...ENTIENDO,
    ...PREGUNTAS_ABIERTAS,
    ...ALERTAS.flatMap((a) => [a.titulo, a.detalle]),
    ...CORRECCIONES.flatMap((c) => [c.decia, c.real]),
    ...PROPUESTAS.flatMap((p) => [p.titulo, p.porque]),
    ...PENDIENTES.flatMap((c) => c.items.map((i) => i.texto)),
  ];
  for (const t of textos) {
    assert.equal(pareceDatoPersonal(t), null, t);
    assert.doesNotMatch(t, /la responsable|la dueña/i, t);
  }
});

test("pendientesDe filtra por perfil y deja los de todos", () => {
  const claude = PENDIENTES.find((c) => c.clave === "claude")!;
  const vita = pendientesDe(claude, "juridico");
  assert.ok(vita.every((p) => p.rubro === "todos" || p.rubro === "juridico"));
  assert.ok(vita.some((p) => p.rubro === "juridico"));
  assert.ok(!pendientesDe(claude, "agencia_0km").some((p) => p.rubro === "juridico"));
  assert.equal(pendientesDe(claude, "todos").length, claude.items.length);
});

test("conteoAlertas suma por gravedad", () => {
  const c = conteoAlertas(ALERTAS);
  assert.equal(c.alta + c.media + c.info, ALERTAS.length);
});

test("lecturasDelPanel detecta perfiles parados, captados sin derivar y caídas", () => {
  const l = lecturasDelPanel(SEMANA);
  assert.ok(l.some((x) => x.includes("Sin mensajes enviados") && x.includes("Coberturas") && x.includes("0 km")));
  assert.ok(l.some((x) => x.startsWith("VITA: 3 captados")));
  assert.ok(l.some((x) => x.includes("piden una persona") && x.includes("VITA 3")));
  assert.ok(l.some((x) => x.includes("menos de la mitad") && x.includes("Coberturas")));
});

test("lecturasDelPanel sin novedades", () => {
  const tranquilo = SEMANA.map((p) => ({ ...p, cifras: cifras({ enviados: [10, 10], respondieron: [3, 3] }) }));
  assert.deepEqual(lecturasDelPanel(tranquilo), ["Esta semana no veo nada fuera de lo normal en las cifras."]);
});

test("la foto de la semana pasa la validación de la bandeja y entra en el pedido", () => {
  const foto = fotoParaClaude(SEMANA, "2026-11-14");
  const pedido = pedidoDesdeCerebro("revisá Coberturas", foto);
  assert.ok(pedido.startsWith("Desde el cerebro: revisá Coberturas"));
  assert.equal(pareceDatoPersonal(pedido), null);
  assert.ok(pedido.length < MAX_PEDIDO);
  assert.equal(pedidoDesdeCerebro("  hola ", null), "Desde el cerebro: hola");
});
