// Corrección 6 — Domicilio compartido como barrio.
// Antes: findBarrio reconocía "domicilio" como barrio y, con domicilio y
// barrio presentes, podía devolver la dirección completa según el orden de
// los campos. Ahora el campo barrio tiene prioridad y el domicilio queda
// como dato opcional, que se elige a mano al compartir.
import test from "node:test";
import assert from "node:assert/strict";
import { barrioRank, buildShareText, findBarrio, isAddressKey, optionalShareFields } from "@/lib/ficha";

const DOMICILIO = "Av. Siempre Viva 742, Piso 3";

test("6: con domicilio y barrio, sale el barrio en cualquier orden de los campos", () => {
  assert.equal(findBarrio(null, { Domicilio: DOMICILIO, Barrio: "Lanús Oeste" }), "Lanús Oeste");
  assert.equal(findBarrio(null, { Barrio: "Lanús Oeste", Domicilio: DOMICILIO }), "Lanús Oeste");
  assert.equal(findBarrio({ domicilio: DOMICILIO, barrio: "Bernal" }, null), "Bernal");
  assert.equal(findBarrio({ barrio: "Bernal", domicilio: DOMICILIO }, null), "Bernal");
  // Domicilio en la ficha y barrio en la base original.
  assert.equal(findBarrio({ domicilio: DOMICILIO }, { BARRIO: "Quilmes" }), "Quilmes");
});

test("6: el domicilio nunca se usa como barrio", () => {
  assert.equal(findBarrio(null, { Domicilio: DOMICILIO }), null);
  assert.equal(findBarrio({ "Dirección": DOMICILIO, Calle: "Mitre", Altura: "100" }, null), null);
  for (const k of ["Domicilio", "domicilio_completo", "Dirección", "Calle", "Piso", "Depto"]) {
    assert.equal(barrioRank(k), null, k);
    assert.equal(isAddressKey(k), true, k);
  }
});

test("6: prioridad del barrio: barrio, localidad, partido, ciudad, zona", () => {
  assert.equal(findBarrio(null, { Zona: "Sur", Ciudad: "CABA", Partido: "Lanús", Localidad: "Gerli", Barrio: "Villa Diamante" }), "Villa Diamante");
  assert.equal(findBarrio(null, { Zona: "Sur", Ciudad: "CABA", Partido: "Lanús", Localidad: "Gerli" }), "Gerli");
  assert.equal(findBarrio(null, { Zona: "Sur", Ciudad: "CABA", Partido: "Lanús" }), "Lanús");
  assert.equal(findBarrio(null, { Zona: "Sur", Ciudad: "CABA" }), "CABA");
  assert.equal(findBarrio({ "Barrio / Partido": "Quilmes" }, null), "Quilmes");
  // Ante la misma prioridad, primero lo cargado en la ficha.
  assert.equal(findBarrio({ barrio: "Bernal" }, { Barrio: "Quilmes" }), "Bernal");
  assert.equal(findBarrio({}, {}), null);
  assert.equal(findBarrio(null, null), null);
  assert.equal(findBarrio({ barrio: "   " }, { Barrio: "Quilmes" }), "Quilmes", "un barrio vacío no cuenta");
});

test("6: el domicilio completo queda como opción para compartir, sin elegir por defecto", () => {
  const opciones = optionalShareFields({
    dni: "20111222",
    email: null,
    areaLabel: "Civil",
    qualificationData: { lesion: "Fractura", barrio: "Bernal", localidad: "Quilmes" },
    baseRow: { Nombre: "Persona De Prueba", Telefono: "1100000000", Barrio: "Bernal", Domicilio: DOMICILIO, Observaciones: "no se ofrece" },
  });
  assert.deepEqual(
    opciones.map((o) => o.key),
    ["dni", "area", "q:lesion", "b:Domicilio"],
    "barrio y localidad no se repiten como extra; de la base solo se ofrece el domicilio"
  );
  const domicilio = opciones.find((o) => o.key === "b:Domicilio")!;
  assert.equal(domicilio.value, DOMICILIO);

  // Por defecto el texto lleva nombre, barrio y teléfono: el domicilio no.
  const base = buildShareText({ fullName: "Persona De Prueba", barrio: "Bernal", phone: "5491100000000", extras: [] });
  assert.equal(base, "Nombre y apellido: Persona De Prueba\nBarrio: Bernal\nTeléfono: +5491100000000");
  assert.doesNotMatch(base, /Siempre Viva/);
  // Solo si se elige a mano.
  const elegido = buildShareText({ fullName: "Persona De Prueba", barrio: "Bernal", phone: "5491100000000", extras: [domicilio] });
  assert.match(elegido, /Domicilio: Av\. Siempre Viva 742, Piso 3$/);
});

test("6: el mismo domicilio en la ficha y en la base se ofrece una sola vez", () => {
  const opciones = optionalShareFields({
    qualificationData: { domicilio: DOMICILIO },
    baseRow: { Domicilio: `  ${DOMICILIO} ` },
  });
  assert.deepEqual(opciones.map((o) => o.key), ["q:domicilio"]);
});
