import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcularMetricas,
  candidatoEfectivo,
  canalDe,
  costoTurno,
  desdeEquilibrio,
  elegirCandidato,
  estratoDe,
  ganadorPorVotos,
  informesVencidos,
  recomendar,
  requisitosGanador,
  verificarCandidatos,
  type CandidatoExp,
  type FilaOportunidad,
  type FilaTurno,
} from "@/lib/experimento/reglas";
import { armarJwt, estimarCostoAjuste, leerCuentaServicio, recursoEndpoint } from "@/lib/agentes/vertex";
import { generateKeyPairSync, createVerify } from "node:crypto";

const CANDS: CandidatoExp[] = [
  { letra: "A", proveedor: "gemini_api", modelo: "gemini-3.6-flash", contexto: "actual", estado: "listo", listo_at: "2026-10-20T00:00:00Z" },
  { letra: "B", proveedor: "gemini_api", modelo: "gemini-3.8-flash", contexto: "biblioteca", estado: "listo", listo_at: "2026-10-20T00:00:00Z", precio_entrada_millon: 0.75, precio_salida_millon: 3.75 },
  { letra: "C", proveedor: "vertex", modelo: null, contexto: "biblioteca", estado: "pendiente" },
];

test("canal y estrato: base fría, campaña o entrante; frío vs actual", () => {
  assert.equal(canalDe({ importedBaseId: "x" }), "base_fria");
  assert.equal(canalDe({ campaignId: "c" }), "campana");
  assert.equal(canalDe({}), "entrante");
  assert.equal(estratoDe({ rubro: "marketing", fuente: "instagram", canal: "entrante" }), "marketing|instagram|actual");
  assert.equal(estratoDe({ rubro: "juridico", fuente: null, canal: "base_fria" }), "juridico|sin_dato|frio");
});

test("asignación equilibrada por estrato, determinista y solo entre candidatos listos", () => {
  assert.equal(elegirCandidato("o1", ["A", "B"], { A: 3, B: 1 }), "B");
  const a = elegirCandidato("o-123", ["A", "B"], {});
  assert.equal(elegirCandidato("o-123", ["A", "B"], {}), a, "mismo id → misma elección en empate");
  assert.equal(elegirCandidato("x", [], {}), null);
  // 1000 oportunidades simuladas quedan equilibradas (diferencia ≤ 1).
  const conteo: Record<string, number> = { A: 0, B: 0 };
  for (let i = 0; i < 1000; i++) conteo[elegirCandidato(`op${i}`, ["A", "B"], conteo as any)!]++;
  assert.ok(Math.abs(conteo.A - conteo.B) <= 1);
  // El equilibrio se cuenta desde que el último candidato quedó listo.
  assert.equal(desdeEquilibrio([...CANDS.slice(0, 2), { ...CANDS[2], estado: "listo", listo_at: "2026-10-25T00:00:00Z" }], "2026-10-20T00:00:00Z"), "2026-10-25T00:00:00Z");
});

test("candidato detenido o pendiente → responde A y queda marcado como reemplazo", () => {
  assert.deepEqual(candidatoEfectivo("B", CANDS), { letra: "B", reemplazo: false });
  assert.deepEqual(candidatoEfectivo("C", CANDS), { letra: "A", reemplazo: true });
  const sinA = CANDS.map((c) => (c.letra === "A" ? { ...c, estado: "detenido" as const } : c));
  assert.deepEqual(candidatoEfectivo("A", sinA), { letra: null, reemplazo: true });
  assert.deepEqual(candidatoEfectivo(null, CANDS), { letra: null, reemplazo: false });
});

test("costo: tarifa por millón; sin tarifa no se inventa", () => {
  assert.equal(costoTurno(CANDS[1], 1_000_000, 100_000), 1.125);
  assert.equal(costoTurno(CANDS[0], 1000, 1000), null);
});

test("verificación: candidatos idénticos y modelo informado distinto", () => {
  assert.deepEqual(verificarCandidatos(CANDS.slice(0, 2), { A: ["gemini-3.6-flash-001"], B: ["gemini-3.8-flash"] }), []);
  const dup = verificarCandidatos([CANDS[1], { ...CANDS[1], letra: "C" }]);
  assert.ok(dup.some((x) => x.includes("idénticos")));
  const mal = verificarCandidatos(CANDS.slice(0, 2), { A: ["gemini-3.8-flash"] });
  assert.ok(mal.some((x) => x.includes("A respondió con un modelo distinto")));
});

function op(i: number, cand: "A" | "B", extra: Partial<FilaOportunidad> = {}): FilaOportunidad {
  return { id: `o${i}`, candidato: cand, rubro: i % 2 ? "juridico" : "marketing", asignado_at: "2026-10-21T00:00:00Z", contact_state: "respondio", capture_state: "en_conversacion", derivation_state: "no_derivado", attention_state: "ia", historical_result: null, detenida: false, baja: false, cita: false, ...extra };
}

test("métricas con denominadores visibles, por perfil, costo por captado y fallos", () => {
  const ops = [op(1, "A", { capture_state: "captado" }), op(2, "A"), op(3, "B", { capture_state: "captado", derivation_state: "derivado" }), op(4, "B", { contact_state: "contactado_sin_respuesta", detenida: true, baja: true })];
  const turnos: FilaTurno[] = [
    { candidato: "B", rubro: "juridico", resultado: "enviado", latencia_ms: 1200, tokens_entrada: 1000, tokens_salida: 100, costo_usd: 0.002, uso: "conversacion", created_at: "2026-10-21T00:00:00Z" },
    { candidato: "B", rubro: "marketing", resultado: "retenido", latencia_ms: 800, tokens_entrada: 1000, tokens_salida: 100, costo_usd: 0.002, uso: "conversacion", created_at: "2026-10-21T00:00:00Z" },
    { candidato: "A", rubro: "juridico", resultado: "enviado", latencia_ms: 900, tokens_entrada: 900, tokens_salida: 90, costo_usd: null, uso: "conversacion", created_at: "2026-10-21T00:00:00Z" },
  ];
  const m = calcularMetricas(["A", "B"], ops, turnos, [{ candidato: "B", gravedad: "leve", rubro: "juridico" }]);
  assert.deepEqual(m.global.A!.tasa_captacion, { valor: 50, numerador: 1, denominador: 2 });
  assert.equal(m.global.B!.bajas, 1);
  assert.equal(m.global.B!.fallos_cumplimiento, 1);
  assert.equal(m.global.B!.costo_operacion_usd, 0.004);
  assert.equal(m.global.B!.costo_por_captado_usd, 0.004);
  assert.equal(m.global.A!.costo_operacion_usd, null, "sin tarifa → sin dato");
  assert.equal(m.global.A!.turnos_sin_tarifa, 1);
  assert.equal(m.porRubro.juridico.B!.incidentes.leve, 1);
  assert.equal(m.global.B!.tasa_respuesta.denominador, 2);
});

test("recomendación: muestra chica, fatales afuera, separada del voto", () => {
  const base = calcularMetricas(["A", "B"], [op(1, "A"), op(2, "B")], [], []);
  const r = recomendar(base.global);
  assert.equal(r.candidato, null);
  assert.ok(r.avisos.some((x) => x.includes("muestra chica")));
  const muchos: FilaOportunidad[] = [];
  for (let i = 0; i < 40; i++) muchos.push(op(i, "A", { capture_state: i < 4 ? "captado" : "en_conversacion" }));
  for (let i = 40; i < 80; i++) muchos.push(op(i, "B", { capture_state: i < 52 ? "captado" : "en_conversacion" }));
  const m = calcularMetricas(["A", "B"], muchos, [], []);
  assert.equal(recomendar(m.global).candidato, "B");
  const conFatal = calcularMetricas(["A", "B"], muchos, [], [{ candidato: "B", gravedad: "fatal" }]);
  const r2 = recomendar(conFatal.global);
  assert.notEqual(r2.candidato, "B");
  assert.ok(r2.avisos.some((x) => x.includes("fatal")));
});

test("informes 7/14/21/28: solo los vencidos y no repetidos", () => {
  const inicio = "2026-10-20T00:00:00Z";
  assert.deepEqual(informesVencidos(inicio, new Date("2026-10-26T23:00:00Z"), []), []);
  assert.deepEqual(informesVencidos(inicio, new Date("2026-10-27T00:00:01Z"), []), [7]);
  assert.deepEqual(informesVencidos(inicio, new Date("2026-11-18T00:00:00Z"), [7, 14]), [21, 28]);
});

test("voto: mayoría gana; empate o votos faltantes piden decisión", () => {
  assert.equal(ganadorPorVotos(["B", "B", "A", "C"]).ganador, "B");
  assert.equal(ganadorPorVotos(["A", "B", "A", "B"]).ganador, null);
  assert.match(ganadorPorVotos(["A", "B"]).motivo, /Faltan 2/);
});

test("requisitos para aplicar el ganador", () => {
  assert.deepEqual(requisitosGanador(CANDS[1], 0, { vertex: false }), []);
  assert.ok(requisitosGanador({ ...CANDS[2], modelo: "projects/x/endpoints/1", estado: "listo" }, 0, { vertex: false }).some((x) => x.includes("Vertex")));
  assert.ok(requisitosGanador({ ...CANDS[1], estado: "detenido" }, 1, { vertex: true }).length >= 2);
});

test("Vertex: cuenta de servicio, JWT RS256 verificable, endpoint y estimación de costo", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const json = JSON.stringify({ client_email: "svc@proy.iam.gserviceaccount.com", private_key: pem });
  const cuenta = leerCuentaServicio({ GCP_SERVICE_ACCOUNT_JSON: Buffer.from(json).toString("base64") });
  assert.ok(cuenta);
  assert.equal(leerCuentaServicio({ GCP_SERVICE_ACCOUNT_JSON: "no-es-json" }), null);
  const jwt = armarJwt(cuenta!, 1_800_000_000);
  const [h, c, f] = jwt.split(".");
  const ok = createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(f.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
  assert.ok(ok);
  const claim = JSON.parse(Buffer.from(c.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
  assert.equal(claim.scope, "https://www.googleapis.com/auth/cloud-platform");
  assert.equal(claim.exp - claim.iat, 3600);
  assert.equal(recursoEndpoint("123", { GCP_PROJECT_ID: "p", GCP_REGION: "us-central1" }), "projects/p/locations/us-central1/endpoints/123");
  const est = estimarCostoAjuste(["x".repeat(3500)], 3);
  assert.deepEqual(est, { tokens: 1000, usd: 0.03 });
});
