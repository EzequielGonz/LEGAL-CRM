import test from "node:test";
import assert from "node:assert/strict";
import { cantidad, estadoDeTono, motivoPausaLegible, nombreConexion, pluralDe } from "@/lib/textos/pantalla";

test("cantidad: singular, plural y cero sin «(s)»", () => {
  assert.equal(cantidad(1, "campaña"), "1 campaña");
  assert.equal(cantidad(3, "campaña"), "3 campañas");
  assert.equal(cantidad(0, "problema"), "0 problemas");
  assert.equal(cantidad(2, "control"), "2 controles");
  assert.equal(cantidad(2, "conversación"), "2 conversaciones");
  assert.equal(cantidad(1200, "persona"), "1.200 personas");
  assert.equal(cantidad(null, "fila"), "0 filas");
  assert.equal(cantidad(2, "punto para revisar"), "2 puntos para revisar");
  assert.equal(cantidad(4, "mes", "meses"), "4 meses");
});

test("pluralDe: casos del panel", () => {
  assert.equal(pluralDe("vez"), "veces");
  assert.equal(pluralDe("línea"), "líneas");
  assert.equal(pluralDe("evento"), "eventos");
  assert.equal(pluralDe("crisis"), "crisis");
});

test("motivo de pausa: las notas sueltas no parecen datos del sistema", () => {
  assert.equal(motivoPausaLegible("ad"), "pausada a mano con la nota «ad»");
  assert.equal(motivoPausaLegible("domingo"), "pausada a mano con la nota «domingo»");
  assert.equal(motivoPausaLegible(null), "pausada a mano, sin motivo anotado");
  assert.equal(motivoPausaLegible("  "), "pausada a mano, sin motivo anotado");
  assert.equal(motivoPausaLegible("Pausada desde el panel"), "pausada a mano desde el panel");
  const largo = "Meta califica la línea CIVIL con calidad baja. Esperá a que mejore";
  assert.equal(motivoPausaLegible(`${largo}.`), largo);
});

test("nombre de conexión sin el prefijo interno", () => {
  assert.equal(nombreConexion("WHATSAPP_CIVIL"), "Civil");
  assert.equal(nombreConexion("WHATSAPP_AGENCIA_0KM"), "Agencia 0km");
  assert.equal(nombreConexion("WHATSAPP_COBERTURAS_MEDICAS"), "Coberturas medicas");
  assert.equal(nombreConexion(""), "sin nombre");
});

test("estado de la luz a partir del tono", () => {
  assert.equal(estadoDeTono("verde"), "ok");
  assert.equal(estadoDeTono("amarillo"), "aviso");
  assert.equal(estadoDeTono("rojo"), "mal");
  assert.equal(estadoDeTono("gris"), "apagado");
  assert.equal(estadoDeTono(undefined), "apagado");
});
