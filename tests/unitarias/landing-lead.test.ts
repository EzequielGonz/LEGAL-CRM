import test from "node:test";
import assert from "node:assert/strict";
import { normalizarLead, origenPermitido } from "@/lib/landing-lead";

test("landing: CORS solo para los dominios propios", () => {
  assert.equal(origenPermitido("https://estudiojuridicovita.com"), true);
  assert.equal(origenPermitido("https://www.kocosmkt.com"), true);
  assert.equal(origenPermitido("http://kocosmkt.com"), false);
  assert.equal(origenPermitido("https://kocosmkt.com.evil.io"), false);
  assert.equal(origenPermitido("https://otro.com"), false);
  assert.equal(origenPermitido("https://otro.com", ["otro.com"]), true);
  assert.equal(origenPermitido(null), false);
});

test("landing: formato de las landings con perfil", () => {
  const r = normalizarLead({ nombre: "Ana", apellido: "Pérez", telefono: "1140000000", tipo: "Accidente laboral", descripcion: "Me lastimé", origen: "/accidentes-laborales" }, "juridico");
  assert.ok(!("error" in r));
  if (!("error" in r)) {
    assert.equal(r.area, "civil");
    assert.equal(r.nombre, "Ana Pérez");
    assert.equal(r.pagina, "/accidentes-laborales");
  }
  const p = normalizarLead({ nombre: "Ana", telefono: "1", tipo: "Consulta penal", descripcion: "x" }, "juridico");
  assert.ok(!("error" in p) && p.area === "penal");
  const m = normalizarLead({ nombre: "Ana", telefono: "1", descripcion: "Quiero una web" }, "marketing");
  assert.ok(!("error" in m) && m.area === "marketing");
  assert.deepEqual(normalizarLead({ nombre: "Ana", telefono: "1", descripcion: "x" }, "otro"), { error: "Perfil inválido" });
  assert.deepEqual(normalizarLead({ nombre: "Ana", descripcion: "x" }, "marketing"), { error: "Faltan campos requeridos" });
});

test("landing: formato histórico del CRM", () => {
  const r = normalizarLead({ full_name: "Ana", phone: "1", area: "penal", consulta: "x" }, null);
  assert.ok(!("error" in r) && r.area === "penal");
  assert.deepEqual(normalizarLead({ full_name: "Ana", phone: "1", area: "marketing", consulta: "x" }, null), { error: "Área inválida" });
});

test("landing: formato de Marketing con presupuesto", () => {
  const r = normalizarLead({ full_name: "Ana", whatsapp: "1140000000", business: "Panadería", need: "Web", budget: "Prefiero conversarlo", message: "Hola" }, "marketing");
  assert.ok(!("error" in r));
  if (!("error" in r)) {
    assert.equal(r.area, "marketing");
    assert.match(r.consulta, /Inversión estimada: Prefiero conversarlo/);
    assert.match(r.consulta, /Negocio: Panadería/);
  }
});
