import { test } from "node:test";
import assert from "node:assert/strict";
import { consultarEstadoLinea, consultarEstadosLineas, interpretarError, interpretarNumero, vaciarMemoriaEstados } from "@/lib/whatsapp/estado-linea";

const ENV = { WHATSAPP_PRUEBA_PHONE_NUMBER_ID: "111222333444555", WHATSAPP_PRUEBA_ACCESS_TOKEN: "token-ficticio-de-prueba" };

function meta(status: number, cuerpo: unknown) {
  const llamadas: { url: string; auth: string | undefined }[] = [];
  const fetchImpl = async (url: string, init: { headers: Record<string, string> }) => {
    llamadas.push({ url, auth: init.headers.Authorization });
    return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(cuerpo) };
  };
  return { fetchImpl, llamadas };
}

test("línea: un número «Pendiente» en Meta no se muestra como correcto", () => {
  const r = interpretarNumero({ status: "PENDING", display_phone_number: "+54 9 11 0000-0000", verified_name: "Agencia de prueba" });
  assert.equal(r.estado, "pendiente");
  assert.equal(r.ok, false);
  assert.match(r.etiqueta, /Pendiente/);
});

test("línea: conectada y verificada es la única que queda correcta", () => {
  assert.equal(interpretarNumero({ status: "CONNECTED", code_verification_status: "VERIFIED", quality_rating: "GREEN" }).ok, true);
  assert.equal(interpretarNumero({ status: "CONNECTED", quality_rating: "GREEN" }).calidad, "alta");
  const sinVerificar = interpretarNumero({ status: "CONNECTED", code_verification_status: "NOT_VERIFIED" });
  assert.equal(sinVerificar.ok, false);
  assert.equal(sinVerificar.estado, "pendiente");
});

test("línea: bloqueada, desconectada o restringida no es apta", () => {
  for (const status of ["BANNED", "DISCONNECTED", "RESTRICTED", "FLAGGED", "DELETED", "MIGRATED"]) {
    const r = interpretarNumero({ status });
    assert.equal(r.estado, "con_problema", status);
    assert.equal(r.ok, false);
  }
  assert.equal(interpretarNumero({}).estado, "no_comprobado");
  assert.equal(interpretarNumero({ status: "ALGO_NUEVO" }).ok, false);
});

test("línea: errores de Meta se traducen sin copiar su mensaje", () => {
  assert.equal(interpretarError(400, 190, null).estado, "token_invalido");
  assert.equal(interpretarError(401, null, null).estado, "token_invalido");
  assert.equal(interpretarError(400, 100, 33).estado, "sin_acceso");
  assert.equal(interpretarError(404, null, null).estado, "sin_acceso");
  assert.equal(interpretarError(500, 2, null).estado, "no_comprobado");
});

test("línea: sin variables no se llama a Meta", async () => {
  const { fetchImpl, llamadas } = meta(200, {});
  const r = await consultarEstadoLinea("WHATSAPP_NADA", { env: {}, fetchImpl });
  assert.equal(r.estado, "sin_credenciales");
  assert.equal(llamadas.length, 0);
  const soloId = await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: { WHATSAPP_PRUEBA_PHONE_NUMBER_ID: "1" }, fetchImpl });
  assert.match(soloId.detalle, /ACCESS_TOKEN/);
});

test("línea: consulta solo lectura al número con el token en el encabezado y sin filtrarlo", async () => {
  const { fetchImpl, llamadas } = meta(200, { status: "PENDING", display_phone_number: "+54 9 11 0000-0000" });
  const r = await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl });
  assert.equal(r.estado, "pendiente");
  assert.equal(llamadas.length, 1);
  assert.match(llamadas[0].url, /^https:\/\/graph\.facebook\.com\/v[\d.]+\/111222333444555\?fields=/);
  assert.ok(!llamadas[0].url.includes(ENV.WHATSAPP_PRUEBA_ACCESS_TOKEN));
  assert.equal(llamadas[0].auth, `Bearer ${ENV.WHATSAPP_PRUEBA_ACCESS_TOKEN}`);
  assert.ok(!JSON.stringify(r).includes(ENV.WHATSAPP_PRUEBA_ACCESS_TOKEN));
});

test("línea: token vencido, error de red y varias líneas", async () => {
  const vencido = meta(400, { error: { message: "Error validating access token", code: 190, error_subcode: 463 } });
  assert.equal((await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl: vencido.fetchImpl })).estado, "token_invalido");

  const caido = async () => {
    throw new Error("sin red");
  };
  const r = await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl: caido });
  assert.equal(r.estado, "no_comprobado");
  assert.equal(r.ok, false);

  const ok = meta(200, { status: "CONNECTED", code_verification_status: "VERIFIED" });
  const varias = await consultarEstadosLineas(["WHATSAPP_PRUEBA", "WHATSAPP_PRUEBA", "WHATSAPP_OTRA"], { env: ENV, fetchImpl: ok.fetchImpl });
  assert.deepEqual(Object.keys(varias).sort(), ["WHATSAPP_OTRA", "WHATSAPP_PRUEBA"]);
  assert.equal(varias.WHATSAPP_PRUEBA.ok, true);
  assert.equal(varias.WHATSAPP_OTRA.estado, "sin_credenciales");
  assert.equal(ok.llamadas.length, 1);
});

test("línea: la memoria de 2 minutos evita consultas repetidas y nunca guarda un «no se pudo comprobar»", async () => {
  vaciarMemoriaEstados();
  const ok = meta(200, { status: "CONNECTED", code_verification_status: "VERIFIED" });
  await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl: ok.fetchImpl, memoria: true });
  await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl: ok.fetchImpl, memoria: true });
  assert.equal(ok.llamadas.length, 1);
  await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl: ok.fetchImpl });
  assert.equal(ok.llamadas.length, 2, "sin memoria siempre consulta");

  vaciarMemoriaEstados();
  let intentos = 0;
  const falla = async () => {
    intentos++;
    throw new Error("sin red");
  };
  await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl: falla, memoria: true });
  await consultarEstadoLinea("WHATSAPP_PRUEBA", { env: ENV, fetchImpl: falla, memoria: true });
  assert.equal(intentos, 2);
  vaciarMemoriaEstados();
});
