import { test } from "node:test";
import assert from "node:assert/strict";
import { itemsDelPerfil } from "@/lib/salud/por-perfil";
import type { ItemSalud } from "@/lib/salud/reglas";

const item = (clave: string, detalle = ""): ItemSalud => ({ clave, estado: "amarillo", titulo: clave, detalle });

test("salud por perfil: lo global en todos, lo propio solo en su perfil", () => {
  const items = [
    item("latido"),
    item("pausa"),
    item("errores_ia", "De 40 turnos. Último: una persona (Jurídico). Error."),
    item("presupuestos"),
    item("agente_marketing"),
    item("whatsapp_coberturas_medicas"),
  ];
  const claves = (slug: string) => itemsDelPerfil(items, slug).map((i) => i.clave);
  assert.deepEqual(claves("juridico"), ["latido", "pausa", "errores_ia"]);
  assert.deepEqual(claves("marketing"), ["latido", "pausa", "presupuestos", "agente_marketing"]);
  assert.deepEqual(claves("coberturas_medicas"), ["latido", "pausa", "whatsapp_coberturas_medicas"]);
  // Sin perfil identificado en el error, se muestra en todos.
  assert.equal(itemsDelPerfil([item("errores_ia", "De 3 turnos.")], "agencia_0km").length, 1);
});
