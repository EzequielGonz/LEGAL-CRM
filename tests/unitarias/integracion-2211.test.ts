import test from "node:test";
import assert from "node:assert/strict";
import { insertarRetenido } from "@/lib/webhooks/security";
import { rubroDePerfilPedido } from "@/lib/definiciones/avisos";
import { RUBRO_IDS } from "@/lib/rubros";
import { evaluarSalud, lecturaSimple, type DatosSalud } from "@/lib/salud/reglas";
import { estadoDeCampana } from "@/lib/definiciones/campanas";

// Integración 22/11: si el código se publica antes de aplicar 0637, el retenido igual se guarda.
test("retenido: sin la columna rubro_id en la base, se guarda igual sin ella", async () => {
  const intentos: Record<string, unknown>[] = [];
  const err = await insertarRetenido({ source: "whatsapp", rubro_id: "x" } as any, async (f: any) => {
    intentos.push(f);
    return "rubro_id" in f ? { message: "Could not find the 'rubro_id' column of 'webhook_quarantine' in the schema cache" } : null;
  });
  assert.equal(err, null);
  assert.equal(intentos.length, 2);
  assert.equal("rubro_id" in intentos[1], false);
});

test("retenido: con la columna, un solo intento y conserva el perfil", async () => {
  const intentos: Record<string, unknown>[] = [];
  const err = await insertarRetenido({ source: "meta", rubro_id: "x" } as any, async (f: any) => {
    intentos.push(f);
    return null;
  });
  assert.equal(err, null);
  assert.deepEqual(intentos, [{ source: "meta", rubro_id: "x" }]);
});

test("retenido: otro error no se reintenta (se informa)", async () => {
  let n = 0;
  const err = await insertarRetenido({ source: "meta", rubro_id: null } as any, async () => {
    n++;
    return { message: "permission denied" };
  });
  assert.equal(n, 1);
  assert.equal(err?.message, "permission denied");
});

test("avisos: el perfil que manda el panel solo acepta los cuatro perfiles (no claves heredadas)", () => {
  assert.equal(rubroDePerfilPedido("marketing"), RUBRO_IDS.marketing);
  assert.equal(rubroDePerfilPedido("toString"), null);
  assert.equal(rubroDePerfilPedido("constructor"), null);
  assert.equal(rubroDePerfilPedido("__proto__"), null);
  assert.equal(rubroDePerfilPedido(42), null);
  assert.equal(rubroDePerfilPedido(undefined), null);
});

// Integración con el rediseño: los textos de Salud usan los plurales de `textos/pantalla.ts` (sin «(s)»).
const baseSalud: DatosSalud = {
  ahora: new Date("2026-11-22T12:00:00Z"),
  ultimoLatido: "2026-11-22T11:59:30Z",
  pausa: { ia: false, envios: false },
  cuarentena24h: { cantidad: 0, motivo: null },
  secretoMeta: true,
  ultimoEntrante: "2026-11-22T11:00:00Z",
  perfiles: [],
  turnos24h: { errores: 0, total: 0 },
  presupuestosAtrasados: 0,
};

test("Salud: plurales claros, sin «(s)», en singular y en plural", () => {
  const uno = evaluarSalud({ ...baseSalud, retenidosPorPerfil: { juridico: { cantidad: 1, motivo: null } }, turnos24h: { errores: 1, total: 5 }, presupuestosAtrasados: 1 });
  const varios = evaluarSalud({ ...baseSalud, retenidosPorPerfil: { juridico: { cantidad: 3, motivo: null } }, turnos24h: { errores: 2, total: 5 }, presupuestosAtrasados: 4 });
  for (const i of [...uno, ...varios]) assert.doesNotMatch(`${i.titulo} ${i.detalle}`, /\((s|es)\)/, i.titulo);
  assert.ok(uno.some((i) => i.titulo === "1 mensaje entrante retenido sin revisar"));
  assert.ok(varios.some((i) => i.titulo === "3 mensajes entrantes retenidos sin revisar"));
  assert.ok(uno.some((i) => i.titulo === "1 respuesta de la IA con error en 24 h"));
  assert.ok(varios.some((i) => i.titulo === "4 presupuestos pedidos hace más de 20 h"));
  const ret = varios.find((i) => i.clave === "cuarentena" && i.estado === "rojo")!;
  assert.match(lecturaSimple(ret).que, /^3 mensajes que entraron quedaron retenidos/);
  const ret1 = uno.find((i) => i.clave === "cuarentena" && i.estado === "rojo")!;
  assert.match(lecturaSimple(ret1).que, /^1 mensaje que entró quedó retenido/);
  const err = varios.find((i) => i.clave === "errores_ia")!;
  assert.match(lecturaSimple(err).que, /La IA tuvo 2 errores al responder/);
});

test("Hoy: la campaña pausada dice el motivo con palabras claras (lógica de captación + texto del rediseño)", () => {
  const c = { status: "pausada", nombre: "Graves", prospectos: 10, enviados: 0, fallidos: 0, fallidos24h: 0 };
  assert.deepEqual(estadoDeCampana({ ...c, pauseReason: "domingo" }), { tono: "amarillo", texto: "Campaña «Graves» pausada a mano con la nota «domingo»" });
  assert.equal(estadoDeCampana({ ...c, pauseReason: "calidad baja de la línea" }).texto, "Campaña «Graves» pausada · calidad baja de la línea");
  assert.equal(estadoDeCampana({ ...c, pauseReason: null }).texto, "Campaña «Graves» pausada a mano, sin motivo anotado");
});
