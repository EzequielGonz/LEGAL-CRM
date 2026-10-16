import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarFuente, redDeLlegada } from "@/lib/fuente";
import { normalizarLead } from "@/lib/landing-lead";

const IDS = [{ texto: "vengo de la web de Estudio Jurídico VITA", fuente: "landing" as const }];

test("mensaje prearmado de la landing con la red de llegada", () => {
  const con = detectarFuente({ channelType: "whatsapp", body: "Hola, vengo de la web de Estudio Jurídico VITA (llegué desde Instagram). Tuve un accidente de tránsito.", identificadores: IDS });
  assert.deepEqual(con, { fuente: "landing", detalle: "mensaje prearmado · llegó desde Instagram" });
  const sin = detectarFuente({ channelType: "whatsapp", body: "Hola, vengo de la web de Estudio Juridico VITA. Tuve un accidente laboral.", identificadores: IDS });
  assert.deepEqual(sin, { fuente: "landing", detalle: "mensaje prearmado" });
});

test("formulario: la red de llegada solo acepta valores conocidos", () => {
  assert.equal(redDeLlegada("instagram"), "Instagram");
  assert.equal(redDeLlegada("FACEBOOK"), "Facebook");
  assert.equal(redDeLlegada("<script>"), null);
  const lead = normalizarLead({ nombre: "Ana", telefono: "1144445555", tipo: "Accidente laboral", descripcion: "x", origen: "/", llegada: "facebook" }, "juridico");
  assert.ok(!("error" in lead) && lead.llegada === "Facebook");
});
