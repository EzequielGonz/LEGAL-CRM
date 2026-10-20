import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ejecutarPasoNumero,
  etiquetaEstadoNumero,
  filaANumero,
  interpretarErrorNumero,
  listarNumerosDeCuenta,
  pasoSiguiente,
  validarCodigo,
  validarMetodo,
} from "@/lib/whatsapp/verificar-numero";

const ENV = { WHATSAPP_PRUEBA_WABA_ID: "900000000000001", WHATSAPP_PRUEBA_ACCESS_TOKEN: "token-ficticio-de-prueba" };

function meta(numeros: unknown[], respuestaPaso: { status: number; cuerpo: unknown } = { status: 200, cuerpo: { success: true } }) {
  const llamadas: { url: string; metodo: string; cuerpo: string | undefined; auth: string | undefined }[] = [];
  const fetchImpl = async (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
    llamadas.push({ url, metodo: init.method, cuerpo: init.body, auth: init.headers.Authorization });
    if (init.method === "GET") return { ok: true, status: 200, text: async () => JSON.stringify({ data: numeros }) };
    return { ok: respuestaPaso.status < 300, status: respuestaPaso.status, text: async () => JSON.stringify(respuestaPaso.cuerpo) };
  };
  return { fetchImpl, llamadas };
}

const PENDIENTE = { id: "111122223333444", display_phone_number: "+54 9 11 0000-0000", status: "PENDING", code_verification_status: "NOT_VERIFIED" };

test("número: validaciones de código, PIN y método", () => {
  assert.equal(validarCodigo("123456"), "123456");
  assert.equal(validarCodigo("123 456"), "123456");
  assert.equal(validarCodigo("123-456"), "123456");
  assert.equal(validarCodigo("12345"), null);
  assert.equal(validarCodigo("1234567"), null);
  assert.equal(validarCodigo("abcdef"), null);
  assert.equal(validarMetodo("SMS"), "SMS");
  assert.equal(validarMetodo("VOICE"), "VOICE");
  assert.equal(validarMetodo("EMAIL"), null);
});

test("número: el paso que sigue depende de lo que informa Meta", () => {
  assert.equal(pasoSiguiente({ estado: "PENDING", codigo: "NOT_VERIFIED" }), "pedir_codigo");
  assert.equal(pasoSiguiente({ estado: "PENDING", codigo: "EXPIRED" }), "pedir_codigo");
  assert.equal(pasoSiguiente({ estado: "PENDING", codigo: "VERIFIED" }), "registrar");
  assert.equal(pasoSiguiente({ estado: "CONNECTED", codigo: "EXPIRED" }), null);
  assert.match(etiquetaEstadoNumero({ estado: "PENDING", codigo: "VERIFIED" }), /falta registrarlo/);
  assert.equal(etiquetaEstadoNumero({ estado: "CONNECTED", codigo: null }), "Conectado");
});

test("número: lista los números de la cuenta de la línea y no expone el token", async () => {
  const { fetchImpl, llamadas } = meta([PENDIENTE, { id: "no es un id" }]);
  const r = await listarNumerosDeCuenta("WHATSAPP_PRUEBA", { env: ENV, fetchImpl });
  assert.equal(r.ok, true);
  assert.equal(r.datos?.length, 1);
  assert.equal(r.datos?.[0].id, "111122223333444");
  assert.match(llamadas[0].url, /\/900000000000001\/phone_numbers/);
  assert.equal(llamadas[0].auth, "Bearer token-ficticio-de-prueba");
  assert.ok(!JSON.stringify(r).includes("token-ficticio"));
  const sinAcceso = await listarNumerosDeCuenta("WHATSAPP_OTRA", { env: {}, fetchImpl });
  assert.equal(sinAcceso.ok, false);
  assert.match(sinAcceso.mensaje, /WHATSAPP_OTRA_WABA_ID/);
});

test("número: pedir código, confirmar y registrar llaman a Meta con lo correcto", async () => {
  const a = meta([PENDIENTE]);
  const r1 = await ejecutarPasoNumero("WHATSAPP_PRUEBA", { accion: "pedir_codigo", numeroId: PENDIENTE.id, metodo: "SMS" }, { env: ENV, fetchImpl: a.fetchImpl });
  assert.equal(r1.ok, true);
  const post1 = a.llamadas.find((l) => l.metodo === "POST")!;
  assert.match(post1.url, /\/111122223333444\/request_code$/);
  assert.deepEqual(JSON.parse(post1.cuerpo!), { code_method: "SMS", language: "es_AR" });

  const b = meta([PENDIENTE]);
  const r2 = await ejecutarPasoNumero("WHATSAPP_PRUEBA", { accion: "verificar", numeroId: PENDIENTE.id, codigo: "123 456" }, { env: ENV, fetchImpl: b.fetchImpl });
  assert.equal(r2.ok, true);
  assert.deepEqual(JSON.parse(b.llamadas.find((l) => l.metodo === "POST")!.cuerpo!), { code: "123456" });
  assert.ok(!JSON.stringify(r2).includes("123456"));

  const c = meta([PENDIENTE]);
  const r3 = await ejecutarPasoNumero("WHATSAPP_PRUEBA", { accion: "registrar", numeroId: PENDIENTE.id, pin: "654321" }, { env: ENV, fetchImpl: c.fetchImpl });
  assert.equal(r3.ok, true);
  const post3 = c.llamadas.find((l) => l.metodo === "POST")!;
  assert.match(post3.url, /\/111122223333444\/register$/);
  assert.deepEqual(JSON.parse(post3.cuerpo!), { messaging_product: "whatsapp", pin: "654321" });
  assert.ok(!JSON.stringify(r3).includes("654321"));
});

test("número: solo actúa sobre números de la cuenta de la línea y con datos válidos", async () => {
  const { fetchImpl, llamadas } = meta([PENDIENTE]);
  const ajeno = await ejecutarPasoNumero("WHATSAPP_PRUEBA", { accion: "pedir_codigo", numeroId: "999988887777666" }, { env: ENV, fetchImpl });
  assert.equal(ajeno.ok, false);
  assert.match(ajeno.mensaje, /no figura en la cuenta/);
  assert.equal(llamadas.some((l) => l.metodo === "POST"), false);
  for (const pedido of [
    { accion: "verificar" as const, numeroId: PENDIENTE.id, codigo: "12" },
    { accion: "registrar" as const, numeroId: PENDIENTE.id, pin: "abc" },
    { accion: "pedir_codigo" as const, numeroId: PENDIENTE.id, metodo: "EMAIL" },
    { accion: "pedir_codigo" as const, numeroId: "../../x" },
  ]) {
    const r = await ejecutarPasoNumero("WHATSAPP_PRUEBA", pedido, { env: ENV, fetchImpl });
    assert.equal(r.ok, false);
  }
  assert.equal(llamadas.some((l) => l.metodo === "POST"), false);
});

test("número: los errores de Meta se traducen a textos propios", async () => {
  assert.match(interpretarErrorNumero("verificar", 400, 100, null), /código/);
  assert.match(interpretarErrorNumero("registrar", 400, 100, null), /PIN/);
  assert.match(interpretarErrorNumero("pedir_codigo", 401, 190, null), /token/);
  assert.match(interpretarErrorNumero("pedir_codigo", 403, 200, null), /permiso/);
  const { fetchImpl } = meta([PENDIENTE], { status: 400, cuerpo: { error: { code: 100, message: "texto de Meta que no se copia" } } });
  const r = await ejecutarPasoNumero("WHATSAPP_PRUEBA", { accion: "verificar", numeroId: PENDIENTE.id, codigo: "123456" }, { env: ENV, fetchImpl });
  assert.equal(r.ok, false);
  assert.ok(!r.mensaje.includes("texto de Meta"));
  assert.equal(filaANumero({ id: "x" }), null);
});
