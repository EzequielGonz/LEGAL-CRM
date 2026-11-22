import test from "node:test";
import assert from "node:assert/strict";
import { insertarRetenido } from "@/lib/webhooks/security";
import { rubroDePerfilPedido } from "@/lib/definiciones/avisos";
import { RUBRO_IDS } from "@/lib/rubros";

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
