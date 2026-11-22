import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  claveTelefono,
  configDelRubro,
  decidirRecontacto,
  desdeVentanaRecontacto,
  MAX_DIA_POR_DEFECTO,
  proximoIntento,
  REINTENTO_MIN,
  TEXTO_CALIDAD_SIN_LEER,
  TEXTO_TOPE_DIA,
  TEXTO_YA_RECIBIO,
  TOPE_REINTENTO_HORAS,
  VENTANA_RECONTACTO_DIAS,
  type DatosRecontacto,
} from "@/lib/seguimiento/recontacto-plantilla";
import { cambiosDePrioridad, nivelDeGravedad, PRIORIDAD_POR_NIVEL, prioridadMasGrave } from "@/lib/bases/gravedad";

/**
 * Revisión independiente del 22/11 sobre la rama del recontacto: una prueba por arreglo.
 * Lo que toca la base (lecturas, RPC) se verifica sobre el código fuente y la migración; las reglas, en puro.
 */
const raiz = join(__dirname, "../..");
const leer = (ruta: string) => readFileSync(join(raiz, ruta), "utf8");
const sinComentarios = (txt: string) =>
  txt
    .split("\n")
    .filter((l) => !l.trim().startsWith("--") && !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.trim().startsWith("/*"))
    .join("\n");

const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};
const H = 3600 * 1000;
const LUNES_10 = art("2026-11-23", 10);
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
// 1 · Tareas pendientes que trababan el motor
// ---------------------------------------------------------------------------

test("revisión 1: una tarea pendiente por motivo del recontacto corre su hora ahora + 45 min", () => {
  const baseAt = new Date(LUNES_10.getTime() - 50 * H);
  assert.equal(REINTENTO_MIN, 45);
  assert.equal(proximoIntento(LUNES_10, baseAt).getTime(), LUNES_10.getTime() + 45 * 60_000);
});

test("revisión 1: la nueva hora tiene tope en la base + 75 h", () => {
  assert.equal(TOPE_REINTENTO_HORAS, 75);
  const baseAt = new Date(LUNES_10.getTime() - 74.5 * H);
  const tope = baseAt.getTime() + 75 * H;
  assert.equal(proximoIntento(LUNES_10, baseAt).getTime(), tope);
  // Si el tope ya pasó, la tarea sigue vencida (el motor la resuelve como conflicto de plazo) y no se corre más allá.
  const vieja = new Date(LUNES_10.getTime() - 80 * H);
  assert.ok(proximoIntento(LUNES_10, vieja).getTime() <= LUNES_10.getTime());
});

test("revisión 1: el motor mira primero las «programada» y después las «pendiente», y corre la hora al dejar pendiente", () => {
  const motor = leer("src/lib/seguimiento/motor.ts");
  assert.match(motor, /const programadas = await leer\("programada", max\)/);
  assert.match(motor, /const r = await leer\("pendiente", faltan\)/);
  assert.ok(motor.indexOf('leer("programada", max)') < motor.indexOf('leer("pendiente", faltan)'));
  assert.doesNotMatch(motor, /\.in\("status", \["programada", "pendiente"\]\)\s*\n\s*\.lte\("scheduled_at"/);
  // Todas las salidas «pendiente» del recontacto corren scheduled_at.
  assert.match(motor, /markPending\(supabase, task, decision\.motivo, \{ line_id: line\.id, \.\.\.reintentoDelRecontacto\(task, ahoraRecontacto\) \}\)/);
  assert.match(motor, /markPending\(supabase, task, TEXTO_WASENDER_PENDIENTE, reintentoDelRecontacto\(task, clock\(\)\)\)/);
});

// ---------------------------------------------------------------------------
// 2 · Reordenamiento por gravedad
// ---------------------------------------------------------------------------

test("revisión 2a: nunca baja de prioridad una fila que ya estaba en <= 0; sí puede subir", () => {
  const cambios = cambiosDePrioridad([
    { id: "a", status: "pendiente", prioridad: 0, diagnostico: "" }, // grave viejo sin dato: se queda
    { id: "b", status: "pendiente", prioridad: -1, diagnostico: "Contusión de la rodilla" }, // fractura que ahora se lee leve: se queda
    { id: "c", status: "pendiente", prioridad: 0, diagnostico: "Amputación traumática" }, // sube
    { id: "d", status: "pendiente", prioridad: -3, diagnostico: "Fractura de pierna" }, // fallecimiento no baja a fractura
  ]);
  assert.deepEqual(Object.fromEntries(cambios), { [PRIORIDAD_POR_NIVEL.amputacion]: ["c"] });
});

test("revisión 2a: vale la fuente más grave (fila de la base o contacto) y sin fuentes no es grave", () => {
  assert.equal(prioridadMasGrave([{ diagnostico: null }, { diagnostico: "Fractura de tibia" }]), PRIORIDAD_POR_NIVEL.fractura);
  assert.equal(prioridadMasGrave([{ diagnostico: "Contusión" }, { diagnostico: "Fallecimiento" }]), PRIORIDAD_POR_NIVEL.fallecimiento);
  assert.equal(prioridadMasGrave([]), PRIORIDAD_POR_NIVEL.sin_lesion);
  const cambios = cambiosDePrioridad([{ id: "x", status: "pendiente", prioridad: 1, fuentes: [{ diagnostico: "" }, { diagnostico: "Fractura de cúbito" }] }]);
  assert.deepEqual(Object.fromEntries(cambios), { [PRIORIDAD_POR_NIVEL.fractura]: ["x"] });
});

test("revisión 2b y 2c: el reordenamiento aborta si falla una lectura y escribe de a 150 solo pendientes", () => {
  const src = leer("src/lib/campaign-recipients.ts");
  const fn = src.slice(src.indexOf("export async function reordenarPendientesPorGravedad"));
  assert.match(src, /const ID_CHUNK = 150;/);
  assert.doesNotMatch(fn, /chunk\([^)]*,\s*500\)/);
  // Cada lectura de contactos y de filas de base revisa el error y corta antes de escribir.
  assert.match(fn, /from\("contacts"\)\.select\("id, qualification_data"\)\.in\("id", part\);\s*\n\s*if \(error\) throw/);
  assert.match(fn, /from\("imported_base_rows"\)[\s\S]*?\.range\(from, from \+ PAGE - 1\);\s*\n\s*if \(error\) throw/);
  assert.ok(fn.indexOf("if (error) throw new Error(`No se pudieron leer los contactos") < fn.indexOf(".update({ priority: prioridad })"));
  // Sin reenvío: pendiente en la lectura y en la escritura.
  assert.match(fn, /\.eq\("status", "pendiente"\)\s*\n\s*\.order\("id"\)/);
  assert.match(fn, /\.update\(\{ priority: prioridad \}\)\.in\("id", part\)\.eq\("status", "pendiente"\)/);
  assert.match(fn, /chunk\(ids, ID_CHUNK\)/);
});

// ---------------------------------------------------------------------------
// 3 · Una vez por oportunidad y una por teléfono cada 30 días
// ---------------------------------------------------------------------------

test("revisión 3: ya recibió en los últimos 30 días: se cancela con motivo y la oportunidad NO cae", () => {
  const d = decidirRecontacto(base({ yaRecibio: true }));
  assert.deepEqual(d, { salir: false, destino: "cancelar", motivo: TEXTO_YA_RECIBIO, caer: false });
  assert.match(TEXTO_YA_RECIBIO, /30 días/);
  // La baja sí hace caer (pidió no recibir).
  const baja = decidirRecontacto(base({ baja: "Pidió no ser contactado" }));
  assert.equal(baja.salir === false && baja.destino === "cancelar" && baja.caer, true);
  assert.equal(VENTANA_RECONTACTO_DIAS, 30);
  assert.equal(LUNES_10.getTime() - desdeVentanaRecontacto(LUNES_10).getTime(), 30 * 24 * H);
});

test("revisión 3: el índice único de la 0640 es por oportunidad, no perpetuo por persona", () => {
  const sql = sinComentarios(leer("supabase/migrations/0640_recontacto_plantilla_meta.sql"));
  assert.match(sql, /drop index if exists public\.followup_tasks_recontacto_una_vez/);
  assert.match(sql, /create unique index if not exists followup_tasks_recontacto_por_oportunidad\s+on public\.followup_tasks \(opportunity_id\)/);
  assert.doesNotMatch(sql, /create unique index[^;]*\(rubro_id, contact_id\)/);
  // La ventana se aplica en código, no en el índice.
  const motor = leer("src/lib/seguimiento/motor.ts");
  assert.match(motor, /cancelarRecontacto\(supabase, task, decision\.motivo, \{ caer: decision\.caer \}\)/);
});

// ---------------------------------------------------------------------------
// 4 · Teléfono normalizado y candado
// ---------------------------------------------------------------------------

test("revisión 4: el mismo teléfono con o sin el «9», con 54, con 0 o con espacios da la misma clave", () => {
  const claves = ["+54 9 11 5555-1234", "5491155551234", "541155551234", "011 5555-1234", "1155551234", "+54 (11) 5555 1234", "11 15 5555 1234"].map(claveTelefono);
  assert.equal(new Set(claves).size, 1, claves.join(" | "));
  assert.equal(claves[0], "5491155551234");
  assert.notEqual(claveTelefono("1155551235"), claves[0]);
  assert.equal(claveTelefono(null), "");
});

test("revisión 4: la reserva usa un candado por teléfono dentro de la base (RPC con advisory lock)", () => {
  const sql = sinComentarios(leer("supabase/migrations/0640_recontacto_plantilla_meta.sql"));
  assert.match(sql, /create or replace function public\.followup_recontacto_reservar/);
  assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\('recontacto-tel:'/);
  assert.match(sql, /add column if not exists telefono_clave text/);
  assert.match(sql, /grant execute on function public\.followup_recontacto_reservar\([^)]*\) to service_role/);
  assert.match(sql, /revoke all on function public\.followup_recontacto_reservar\([^)]*\) from public, anon, authenticated/);
  const motor = leer("src/lib/seguimiento/motor.ts");
  assert.match(motor, /await reservarRecontacto\(\{ tarea: id, token, telefono: contact\.phone/);
  const srv = leer("src/lib/seguimiento/recontacto-plantilla-servidor.ts");
  assert.match(srv, /\.eq\("telefono_clave", clave\)/);
  assert.doesNotMatch(srv, /\.eq\("phone"/);
});

// ---------------------------------------------------------------------------
// 5 · Tope diario por rubro
// ---------------------------------------------------------------------------

test("revisión 5: `max_dia` por perfil (40 por defecto) y rige aunque la línea no tenga límite diario", () => {
  assert.equal(MAX_DIA_POR_DEFECTO, 40);
  assert.equal(configDelRubro({ juridico: { activo: true, max_dia: 25 } }, "juridico").maxDia, 25);
  assert.equal(configDelRubro({ juridico: { activo: true } }, "juridico").maxDia, 40);
  assert.equal(configDelRubro({ juridico: { activo: true, max_dia: "mucho" } }, "juridico").maxDia, 40);
  assert.equal(configDelRubro({ juridico: { activo: true, max_dia: -5 } }, "juridico").maxDia, 40);
  assert.equal(configDelRubro({ juridico: { activo: true, max_dia: 7.9 } }, "juridico").maxDia, 7);
  assert.equal(configDelRubro({ juridico: true }, "juridico").maxDia, 40);

  const tope = decidirRecontacto(base({ limiteDiario: null, enviadosHoy: null, maxDia: 40, recontactosHoyRubro: 40 }));
  assert.deepEqual(tope, { salir: false, destino: "pendiente", motivo: TEXTO_TOPE_DIA(40) });
  assert.deepEqual(decidirRecontacto(base({ limiteDiario: null, enviadosHoy: null, maxDia: 40, recontactosHoyRubro: 39 })), { salir: true });
  const sinLeer = decidirRecontacto(base({ recontactosHoyRubro: null }));
  assert.equal(sinLeer.salir === false && sinLeer.destino, "pendiente");
  // Cuenta en hora argentina y dentro del candado de la reserva.
  const srv = leer("src/lib/seguimiento/recontacto-plantilla-servidor.ts");
  assert.match(srv, /recontactosHoyDelRubro[\s\S]*startOfArgentinaDay\(ahora\)/);
  const sql = sinComentarios(leer("supabase/migrations/0640_recontacto_plantilla_meta.sql"));
  assert.match(sql, /return 'tope_dia'/);
});

// ---------------------------------------------------------------------------
// 6 · Migración: transacción y solo Jurídico encendido
// ---------------------------------------------------------------------------

test("revisión 6: la 0640 va en una transacción y enciende SOLO Jurídico", () => {
  const sql = sinComentarios(leer("supabase/migrations/0640_recontacto_plantilla_meta.sql"));
  assert.match(sql, /^\s*begin;/m);
  assert.match(sql, /^\s*commit;\s*$/m);
  assert.ok(sql.indexOf("begin;") < sql.indexOf("create or replace function") && sql.lastIndexOf("commit;") > sql.indexOf("insert into public.system_settings"));
  assert.match(sql, /'juridico', jsonb_build_object\('activo', true,/);
  for (const p of ["coberturas_medicas", "agencia_0km", "marketing"]) {
    assert.match(sql, new RegExp(`'${p}', jsonb_build_object\\('activo', false,`), p);
  }
  assert.match(sql, /'max_dia', 40/);
  assert.match(sql, /on conflict \(key\) do nothing/);
  assert.ok(!/\bdelete\s+from\b|\btruncate\b|\bdrop\s+table\b|\bdrop\s+column\b/i.test(sql), "sin borrados de datos");
});

// ---------------------------------------------------------------------------
// 7 · Menores
// ---------------------------------------------------------------------------

test("revisión 7a: si no se puede leer la calidad de la línea, no se envía", () => {
  for (const calidad of [null, "", "  "]) {
    const d = decidirRecontacto(base({ calidadLinea: calidad }));
    assert.deepEqual(d, { salir: false, destino: "pendiente", motivo: TEXTO_CALIDAD_SIN_LEER });
  }
  // «sin calificar» es un dato de Meta (línea nueva): se lee y no frena.
  assert.deepEqual(decidirRecontacto(base({ calidadLinea: "sin calificar" })), { salir: true });
  assert.deepEqual(decidirRecontacto(base({ calidadLinea: "media" })), { salir: true });
  const srv = leer("src/lib/seguimiento/recontacto-plantilla-servidor.ts");
  const fn = srv.slice(srv.indexOf("export async function calidadDeLinea"));
  assert.match(fn, /if \(error\) return null;/);
  assert.match(fn, /CALIDAD_VIGENTE_MS/);
});

test("revisión 7b: en el choque de la reserva la oportunidad queda consistente (sin próximo contacto colgado)", () => {
  const motor = leer("src/lib/seguimiento/motor.ts");
  assert.match(motor, /if \(reserva === "ya_recibio"\) return cancelarRecontacto\(supabase, task, TEXTO_YA_RECIBIO, \{ caer: false, token \}\)/);
  const fn = motor.slice(motor.indexOf("async function cancelarRecontacto"), motor.indexOf("async function processTaskWasender"));
  assert.match(fn, /followup_next_at: null/);
  // Con `caer: false` no se toca el estado de seguimiento (no pasa a «caído»).
  const sinCaer = fn.slice(fn.indexOf("} else {"));
  assert.doesNotMatch(sinCaer, /followup_state/);
});

test("revisión 7c: «sin lesiones» no es leve y «rotura/ruptura» solo cuenta si habla de una parte del cuerpo", () => {
  for (const t of ["Sin lesiones", "sin lesión", "Sin lesiones aparentes", "No presenta lesiones", "Ninguna lesión"]) {
    assert.equal(nivelDeGravedad(t), "sin_lesion", t);
  }
  assert.equal(nivelDeGravedad("Contusión leve"), "lesion_leve");
  assert.equal(nivelDeGravedad("Rotura de ligamento cruzado"), "lesion");
  assert.equal(nivelDeGravedad("Ruptura del manguito rotador"), "lesion");
  assert.equal(nivelDeGravedad("Rotura de tendón del hombro"), "lesion");
  // Sin parte del cuerpo no es una lesión de cuidado: queda como un diagnóstico cualquiera (leve).
  assert.equal(nivelDeGravedad("Ruptura de contrato"), "lesion_leve");
  assert.equal(nivelDeGravedad(null, "rotura de un vidrio"), "sin_lesion");
  // Lo ya existente no cambia.
  assert.equal(nivelDeGravedad("Luxación de hombro"), "lesion");
  assert.equal(nivelDeGravedad("Traumatismo superficial de la cabeza"), "lesion_leve");
});

// ---------------------------------------------------------------------------
// Segunda revisión (22/11)
// ---------------------------------------------------------------------------

test("segunda revisión I-1: el tope de 3 automáticos se mira antes de reservar y, si llega tarde, cierra la tarea y libera la marca", () => {
  const motor = leer("src/lib/seguimiento/motor.ts");
  const meta = motor.slice(motor.indexOf("async function processTask(supabase"));
  const pre = meta.indexOf("if (await frenaPorTope(task.contact_id, supabase)) return noInsistir(supabase, task, TEXTO_TOPE);");
  assert.ok(pre > 0, "pre-chequeo");
  assert.ok(pre < meta.indexOf("await reservarRecontacto("), "antes de reservar");
  assert.ok(pre < meta.indexOf('rpc("followup_claim"'), "antes del claim");
  // Si igual llega después de la reserva, se cierra con el token (updateTask no toca una tarea 'enviando').
  assert.match(meta, /frenaPorTope\(task\.contact_id, supabase\)\) return noInsistir\(supabase, task, TEXTO_TOPE, token\)/);
  const fn = motor.slice(motor.indexOf("async function noInsistir"), motor.indexOf("async function cancelarRecontacto"));
  assert.match(fn, /await finish\(supabase, task\.id, token, "cancelada", reason\)/);
  assert.match(fn, /update\(\{ canal: null, telefono_clave: null \}\)/);
  // Entre la reserva y el envío ningún otro return deja la tarea 'enviando' con la marca: compuerta, hora y fallas cierran con token.
  const tramo = meta.slice(meta.indexOf("await reservarRecontacto("), meta.indexOf("sendWhatsAppTemplate("));
  const returns = tramo.split("\n").filter((l) => /\breturn\b/.test(l) && !/^\s*(\/\/|\*)/.test(l));
  for (const l of returns) assert.match(l, /ocupada|cancelarRecontacto|pendiente|frenada|noInsistir\(.*token\)|applyTiming\(supabase, task, third, token\)/, l);
});

test("segunda revisión I-2: la edad de la calidad se valida por línea (`leidoAt`), no por la hora global", () => {
  const cal = leer("src/lib/whatsapp/calidad-servidor.ts");
  assert.match(cal, /leidoAt\?: string/);
  assert.equal((cal.match(/leidoAt: ahora\.toISOString\(\)/g) ?? []).length, 2);
  // Al conservar la lectura vieja (Meta no respondió) no se renueva.
  assert.match(cal, /if \(antes\) nuevo\.lineas\[l\.id\] = antes;/);
  const srv = leer("src/lib/seguimiento/recontacto-plantilla-servidor.ts");
  const fn = srv.slice(srv.indexOf("export async function calidadDeLinea"), srv.indexOf("/** Campañas de Meta de la línea. */"));
  assert.match(fn, /linea\?\.leidoAt/);
  assert.doesNotMatch(fn, /v\.at\b/);
});

test("segunda revisión I-3: la ruta de lanzamiento tiene maxDuration y el reordenamiento un presupuesto de 20 s", () => {
  assert.match(leer("src/app/api/campaigns/[id]/launch/route.ts"), /export const maxDuration = 60;/);
  const src = leer("src/lib/campaign-recipients.ts");
  assert.match(src, /PRESUPUESTO_REORDEN_MS = 20_000/);
  const fn = src.slice(src.indexOf("export async function reordenarPendientesPorGravedad"));
  // Corta entre grupos (un grupo se escribe entero) y antes de escribir si se agotó leyendo.
  assert.match(fn, /if \(sinTiempo\(\)\) return corte;/);
  assert.match(fn, /if \(sinTiempo\(\)\) \{\s*\n\s*cortado = true;\s*\n\s*break;/);
  assert.ok(fn.indexOf("return corte;") < fn.indexOf(".update({ priority: prioridad })"));
  assert.match(fn, /escritos\.set\(prioridad, ids\)/);
});

test("segunda revisión M-1: las filas de base se leen de a 50 contactos y paginadas", () => {
  const src = leer("src/lib/campaign-recipients.ts");
  const fn = src.slice(src.indexOf("export async function reordenarPendientesPorGravedad"));
  assert.match(fn, /chunk\(contactIds, 50\)/);
  assert.match(fn, /\.order\("id"\)\s*\n\s*\.range\(from, from \+ PAGE - 1\)/);
  assert.match(fn, /if \(filasBase\.length < PAGE\) break;/);
});

test("segunda revisión M-2: la 0640 rellena la clave y el canal de los contactos 2 de Jurídico de los últimos 30 días", () => {
  const sql = sinComentarios(leer("supabase/migrations/0640_recontacto_plantilla_meta.sql"));
  assert.match(sql, /create or replace function public\.recontacto_clave_telefono/);
  const upd = sql.slice(sql.indexOf("update public.followup_tasks t"));
  assert.match(upd, /t\.rubro_id = '11111111-1111-1111-1111-111111111111'/);
  assert.match(upd, /t\.step = 2/);
  assert.match(upd, /t\.status = 'enviada'/);
  assert.match(upd, /t\.sent_at >= now\(\) - interval '30 days'/);
  assert.match(upd, /t\.canal is null\s+and t\.telefono_clave is null/);
  assert.ok(!/delete\s+from/i.test(sql));
});

test("segunda revisión M-7: el detalle de la campaña ordena la prioridad ascendente como el envío real", () => {
  const v = leer("src/components/campanas/campaign-detail-view.tsx");
  assert.match(v, /\.order\("priority", \{ ascending: true \}\)/);
  assert.doesNotMatch(v, /\.order\("priority", \{ ascending: false \}\)/);
});

test("segunda revisión M-4: la entrega trae INFORME.md y MIGRACIONES.md", () => {
  const informe = leer("docs/recontacto-2211/INFORME.md");
  const migraciones = leer("docs/recontacto-2211/MIGRACIONES.md");
  assert.match(informe, /No se probó/i);
  assert.match(migraciones, /Revertir/i);
  assert.match(migraciones, /0640_recontacto_plantilla_meta\.sql/);
});
