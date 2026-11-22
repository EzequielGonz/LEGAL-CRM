import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canalDelContacto,
  configDelRubro,
  decidirRecontacto,
  PERFILES_RECONTACTO,
  TEXTO_PROPUESTO,
  TEXTO_SIN_PLANTILLA,
  TEXTO_YA_RECIBIO,
  type DatosRecontacto,
} from "@/lib/seguimiento/recontacto-plantilla";
import { purposeInfo } from "@/lib/plantillas/catalogo";

/** Instante a partir de una hora de pared argentina (UTC-3). */
const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};
const H = 3600 * 1000;
const LUNES_10 = art("2026-11-23", 10);

const ENCENDIDO = { activo: true, via: "meta_plantilla" as const, maxDia: 40 };

const base = (over: Partial<DatosRecontacto> = {}): DatosRecontacto => ({
  ahora: LUNES_10,
  hayPlantilla: true,
  yaRecibio: false,
  baja: null,
  calidadLinea: "alta",
  freno: null,
  limiteDiario: 100,
  enviadosHoy: 10,
  maxDia: 40,
  recontactosHoyRubro: 3,
  ...over,
});

// ---------------------------------------------------------------------------
// Canal: fuera de la ventana de 24 h, plantilla de recontacto
// ---------------------------------------------------------------------------

test("22/11: fuera de la ventana de 24 h el contacto 2 sale con la plantilla de recontacto", () => {
  const c = canalDelContacto({ config: ENCENDIDO, paso: 2, ultimoEntranteAt: new Date(LUNES_10.getTime() - 72 * H), ahora: LUNES_10 });
  assert.equal(c.canal, "plantilla_recontacto");
  // Sin ningún mensaje de la persona tampoco hay ventana.
  assert.equal(canalDelContacto({ config: ENCENDIDO, paso: 2, ultimoEntranteAt: null, ahora: LUNES_10 }).canal, "plantilla_recontacto");
});

test("22/11: dentro de la ventana, en el contacto 3 o con el rubro apagado, sigue como hoy", () => {
  const dentro = canalDelContacto({ config: ENCENDIDO, paso: 2, ultimoEntranteAt: new Date(LUNES_10.getTime() - 2 * H), ahora: LUNES_10 });
  assert.equal(dentro.canal, "como_hoy");
  const paso3 = canalDelContacto({ config: ENCENDIDO, paso: 3, ultimoEntranteAt: new Date(LUNES_10.getTime() - 72 * H), ahora: LUNES_10 });
  assert.equal(paso3.canal, "como_hoy");
  const apagado = canalDelContacto({ config: { activo: false, via: "meta_plantilla", maxDia: 40 }, paso: 2, ultimoEntranteAt: null, ahora: LUNES_10 });
  assert.equal(apagado.canal, "como_hoy");
});

test("22/11: la ventana cierra justo a las 24 h del último mensaje de la persona", () => {
  const casi = canalDelContacto({ config: ENCENDIDO, paso: 2, ultimoEntranteAt: new Date(LUNES_10.getTime() - 24 * H + 60_000), ahora: LUNES_10 });
  const justo = canalDelContacto({ config: ENCENDIDO, paso: 2, ultimoEntranteAt: new Date(LUNES_10.getTime() - 24 * H), ahora: LUNES_10 });
  assert.equal(casi.canal, "como_hoy");
  assert.equal(justo.canal, "plantilla_recontacto");
});

test("22/11: punto de extensión de Wasender: con `via: wasender` no sale por plantilla de Meta", () => {
  const c = canalDelContacto({ config: { activo: true, via: "wasender", maxDia: 40 }, paso: 2, ultimoEntranteAt: null, ahora: LUNES_10 });
  assert.equal(c.canal, "wasender");
});

test("22/11: configuración por rubro: solo un `activo: true` explícito lo enciende", () => {
  assert.deepEqual(configDelRubro(null, "juridico"), { activo: false, via: "meta_plantilla", maxDia: 40 });
  assert.deepEqual(configDelRubro({}, "juridico"), { activo: false, via: "meta_plantilla", maxDia: 40 });
  assert.deepEqual(configDelRubro({ juridico: { activo: "si" } }, "juridico"), { activo: false, via: "meta_plantilla", maxDia: 40 });
  assert.deepEqual(configDelRubro({ juridico: { activo: true } }, "juridico"), { activo: true, via: "meta_plantilla", maxDia: 40 });
  assert.deepEqual(configDelRubro({ juridico: { activo: true, via: "wasender" } }, "juridico"), { activo: true, via: "wasender", maxDia: 40 });
  assert.deepEqual(configDelRubro({ juridico: true }, "juridico"), { activo: true, via: "meta_plantilla", maxDia: 40 });
  // Rubros separados: encender uno no enciende otro.
  assert.equal(configDelRubro({ juridico: { activo: true } }, "marketing").activo, false);
});

// ---------------------------------------------------------------------------
// Reglas antes de enviar
// ---------------------------------------------------------------------------

test("22/11: con todo en orden, sale", () => {
  assert.deepEqual(decidirRecontacto(base()), { salir: true });
});

test("22/11: rubro sin plantilla de recontacto: no sale nada (queda pendiente)", () => {
  const d = decidirRecontacto(base({ hayPlantilla: false }));
  assert.deepEqual(d, { salir: false, destino: "pendiente", motivo: TEXTO_SIN_PLANTILLA });
});

test("22/11: nunca dos veces: si ya lo recibió se cancela; si no se puede saber, no sale", () => {
  assert.deepEqual(decidirRecontacto(base({ yaRecibio: true })), { salir: false, destino: "cancelar", motivo: TEXTO_YA_RECIBIO, caer: false });
  const duda = decidirRecontacto(base({ yaRecibio: null }));
  assert.equal(duda.salir, false);
  assert.equal(duda.salir === false && duda.destino, "pendiente");
});

test("22/11: baja: nunca a quien pidió no recibir; si la detención no se pudo leer, tampoco sale", () => {
  const baja = decidirRecontacto(base({ baja: "Pidió no ser contactado" }));
  assert.equal(baja.salir === false && baja.destino, "cancelar");
  // La baja manda aunque falte la plantilla o la línea esté mal: lo que no va a salir nunca, primero.
  const bajaSinPlantilla = decidirRecontacto(base({ baja: "Pidió no ser contactado", hayPlantilla: false, calidadLinea: "baja" }));
  assert.equal(bajaSinPlantilla.salir === false && bajaSinPlantilla.destino, "cancelar");
  const sinLeer = decidirRecontacto(base({ bajaSinComprobar: true }));
  assert.equal(sinLeer.salir === false && sinLeer.destino, "pendiente");
});

test("22/11: horarios: lunes a sábado de 8 a 21, sin domingos", () => {
  const domingo = decidirRecontacto(base({ ahora: art("2026-11-22", 12) }));
  assert.equal(domingo.salir === false && domingo.destino, "esperar");
  const noche = decidirRecontacto(base({ ahora: art("2026-11-23", 21, 30) }));
  assert.equal(noche.salir === false && noche.destino, "esperar");
  const temprano = decidirRecontacto(base({ ahora: art("2026-11-23", 7, 59) }));
  assert.equal(temprano.salir === false && temprano.destino, "esperar");
  assert.deepEqual(decidirRecontacto(base({ ahora: art("2026-11-23", 8) })), { salir: true });
  assert.deepEqual(decidirRecontacto(base({ ahora: art("2026-11-28", 20, 59) })), { salir: true }); // sábado
});

test("22/11: horarios: un día cerrado del calendario tampoco sale", () => {
  const cerrado = decidirRecontacto(base({ calendar: { startHour: 8, endHour: 21, exceptions: [{ day: "2026-11-23", closed: true }] } }));
  assert.equal(cerrado.salir === false && cerrado.destino, "esperar");
});

test("22/11: calidad baja, freno y tope diario de la línea frenan (queda pendiente)", () => {
  const calidad = decidirRecontacto(base({ calidadLinea: "BAJA" }));
  assert.equal(calidad.salir === false && calidad.destino, "pendiente");
  const freno = decidirRecontacto(base({ freno: "Freno automático: 8 de los últimos 20 envíos fallaron." }));
  assert.equal(freno.salir === false && freno.destino, "pendiente");
  const tope = decidirRecontacto(base({ limiteDiario: 100, enviadosHoy: 100 }));
  assert.equal(tope.salir === false && tope.destino, "pendiente");
  assert.deepEqual(decidirRecontacto(base({ limiteDiario: 100, enviadosHoy: 99 })), { salir: true });
  assert.deepEqual(decidirRecontacto(base({ limiteDiario: null, enviadosHoy: null })), { salir: true });
  const sinLeer = decidirRecontacto(base({ limiteDiario: 50, enviadosHoy: null }));
  assert.equal(sinLeer.salir === false && sinLeer.destino, "pendiente");
});

// ---------------------------------------------------------------------------
// Plantillas propuestas, propósito y migración
// ---------------------------------------------------------------------------

test("22/11: textos propuestos: uno por rubro, cortos, sin precios y con opción de baja", () => {
  for (const p of PERFILES_RECONTACTO) {
    const t = TEXTO_PROPUESTO[p];
    assert.ok(t, p);
    assert.ok(t.cuerpo.length <= 300, `${p}: corto`);
    assert.ok(/No me escriban más/.test(t.cuerpo) && t.botones.includes("No me escriban más"), `${p}: con opción de baja`);
    assert.ok(!/\$|\d|precio|cuota|gratis/i.test(t.cuerpo.replace("{{1}}", "").replace("0 km", "")), `${p}: sin precios ni números`);
    assert.ok(/querés|preferís/.test(t.cuerpo), `${p}: rioplatense`);
    assert.ok(t.botones.length <= 3, `${p}: hasta 3 botones`);
  }
});

test("22/11: el propósito «recontacto» existe y se puede asignar desde Plantillas", () => {
  const info = purposeInfo("recontacto");
  assert.ok(info);
  assert.equal(info!.enabled, true);
});

test("22/11: la migración 0640 es aditiva, repetible y deja la garantía de una sola vez en la base", () => {
  const sql = readFileSync(join(__dirname, "../../supabase/migrations/0640_recontacto_plantilla_meta.sql"), "utf8");
  const codigo = sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");
  assert.ok(!/\bdelete\s+from\b|\btruncate\b|\bdrop\s+table\b|\bdrop\s+column\b/i.test(codigo), "sin borrados");
  assert.match(codigo, /add column if not exists canal/);
  assert.match(codigo, /create unique index if not exists followup_tasks_recontacto_por_oportunidad/);
  assert.match(codigo, /'recontacto'/);
  assert.match(codigo, /on conflict \(key\) do nothing/);
  assert.match(codigo, /t\.status = 'APPROVED'/);
});
