import test from "node:test";
import assert from "node:assert/strict";
import { dispositivoRecibeAviso, filtrarDispositivos } from "@/lib/definiciones/avisos";
import { RUBRO_IDS } from "@/lib/rubros";

test("22/11: un aviso de un perfil solo llega a los dispositivos de ese perfil", () => {
  assert.equal(dispositivoRecibeAviso(RUBRO_IDS.marketing, RUBRO_IDS.marketing), true);
  assert.equal(dispositivoRecibeAviso(RUBRO_IDS.juridico, RUBRO_IDS.marketing), false);
  assert.equal(dispositivoRecibeAviso(RUBRO_IDS.agencia_0km, RUBRO_IDS.coberturas_medicas), false);
});

test("22/11: un aviso del sistema llega a todos; un dispositivo sin perfil no pierde avisos", () => {
  assert.equal(dispositivoRecibeAviso(RUBRO_IDS.juridico, null), true);
  assert.equal(dispositivoRecibeAviso(null, RUBRO_IDS.marketing), true);
});

test("22/11: filtrar la lista de dispositivos", () => {
  const ds = [{ id: "a", rubro_id: RUBRO_IDS.juridico }, { id: "b", rubro_id: RUBRO_IDS.marketing }, { id: "c", rubro_id: null }];
  assert.deepEqual(filtrarDispositivos(ds, RUBRO_IDS.marketing).map((d) => d.id), ["b", "c"]);
  assert.deepEqual(filtrarDispositivos(ds, null).map((d) => d.id), ["a", "b", "c"]);
});
