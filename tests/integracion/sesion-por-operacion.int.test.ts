// Etapa 1 · Bloque 1.12 — Sesión y autorización en cada operación del
// servidor. Base de pruebas con datos inventados; ninguna prueba envía nada.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { NextRequest } from "next/server";
import { COOKIE_SESION, RedSimulada, SIN_PAUSA, db, esperarApi, fijarPausa, pedido, prepararSesionDePrueba } from "./soporte/entorno";
import { AGENCIA, crearCampana } from "./soporte/campanas";
import { SESSION_COOKIE, invalidateSessionVersionCache, signSession, validateSession } from "@/lib/acceso/session";
import { requireSession } from "@/lib/acceso/autorizacion";
import { middleware } from "@/middleware";
import { GET as listarCalendario, POST as agregarExcepcion } from "@/app/api/calendario/route";
import { POST as agregarBase } from "@/app/api/campaigns/[id]/agregar-base/route";
import { PATCH as editarLinea } from "@/app/api/perfiles/[id]/lineas/[lineId]/route";
import { GET as inbox } from "@/app/api/inbox/route";

let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  await fijarPausa(SIN_PAUSA);
});
after(() => red.restaurar());

const SIN_COOKIE = { cookie: "" };
const excepcionFutura = () => ({ day: `2031-03-${String(3 + Math.floor(Math.random() * 20)).padStart(2, "0")}`, closed: true, note: "prueba 1.12" });

async function excepciones(): Promise<number> {
  const { count } = await db().from("contact_calendar_exceptions").select("id", { count: "exact", head: true });
  return count ?? 0;
}

test("1.12: sin sesión, una lectura y una escritura privadas se rechazan con 401 y no cambian nada", async () => {
  const antes = await excepciones();
  const lectura = await listarCalendario(pedido("http://local/api/calendario", { headers: SIN_COOKIE }));
  assert.equal(lectura.status, 401);
  assert.equal((await lectura.json()).code, "sesion_ausente");

  const escritura = await agregarExcepcion(
    pedido("http://local/api/calendario", { method: "POST", headers: SIN_COOKIE, body: JSON.stringify(excepcionFutura()) })
  );
  assert.equal(escritura.status, 401);
  assert.equal(await excepciones(), antes, "no se guardó ninguna excepción");
});

test("1.12: una cookie alterada o firmada con otra clave no vale", async () => {
  const [cuerpo, firma] = COOKIE_SESION.replace(`${SESSION_COOKIE}=`, "").split(".");
  const alterado = Buffer.from(JSON.stringify({ v: 999, iat: 1700000000, sid: "x" })).toString("base64url");
  for (const cookie of [`${SESSION_COOKIE}=${alterado}.${firma}`, `${SESSION_COOKIE}=${cuerpo}.${firma.slice(0, -3)}abc`, `${SESSION_COOKIE}=basura`]) {
    const res = await listarCalendario(pedido("http://local/api/calendario", { headers: { cookie } }));
    assert.equal(res.status, 401, cookie.slice(0, 30));
    assert.equal((await res.json()).code, "sesion_invalida");
  }
  // La firma correcta sigue valiendo.
  assert.equal((await listarCalendario(pedido("http://local/api/calendario"))).status, 200);
});

test("1.12: una sesión revocada (cerrada en todos los dispositivos) deja de valer en cada ruta, aunque el middleware no corra", async () => {
  const s = db();
  const { data: row } = await s.from("access_pin").select("session_version").eq("id", true).single();
  const vieja = COOKIE_SESION;
  const { error } = await s.from("access_pin").update({ session_version: row!.session_version + 1 }).eq("id", true);
  assert.equal(error, null);
  invalidateSessionVersionCache();
  try {
    const res = await inbox(pedido("http://local/api/inbox", { headers: { cookie: vieja } }));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).code, "sesion_revocada");
    // Con la versión nueva vuelve a entrar.
    const nueva = await prepararSesionDePrueba();
    const ok = await inbox(pedido("http://local/api/inbox", { headers: { cookie: `${SESSION_COOKIE}=${nueva}` } }));
    assert.equal(ok.status, 200);
  } finally {
    await prepararSesionDePrueba();
  }
});

test("1.12: si la base no responde al comprobar la revocación, la operación se rechaza con un error recuperable y la cookie se conserva", async () => {
  invalidateSessionVersionCache();
  red.fallasSesion = 1;
  const antes = await excepciones();
  const res = await agregarExcepcion(pedido("http://local/api/calendario", { method: "POST", body: JSON.stringify(excepcionFutura()) }));
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.code, "sesion_no_comprobable");
  assert.equal(body.reintentar, true);
  assert.equal(res.headers.get("retry-after"), "5");
  assert.equal(res.headers.get("set-cookie"), null, "no borra ni cambia la cookie");
  assert.equal(await excepciones(), antes, "no se guardó nada");

  // La base vuelve: la misma cookie sigue valiendo sin volver a ingresar.
  const despues = await listarCalendario(pedido("http://local/api/calendario"));
  assert.equal(despues.status, 200);

  // Y con la versión en memoria vencida, la comprobación directa también lo dice.
  invalidateSessionVersionCache();
  red.fallasSesion = 2;
  const check = await validateSession(COOKIE_SESION.replace(`${SESSION_COOKIE}=`, ""));
  assert.equal(check.status, "no_comprobable");
  const guard = await requireSession(pedido("http://local/api/inbox"));
  assert.equal(guard.ok, false);
});

test("1.12: el middleware también falla cerrado: 503 recuperable para páginas y API, y al ingreso sin cookie", async () => {
  invalidateSessionVersionCache();
  red.fallasSesion = 2;
  const pagina = await middleware(new NextRequest("http://local/prospectos", { headers: { cookie: COOKIE_SESION } }) as any);
  assert.equal(pagina.status, 503);
  assert.match(pagina.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await pagina.text(), /No se pudo comprobar la sesión/);
  assert.equal(pagina.headers.get("set-cookie"), null);

  const api = await middleware(new NextRequest("http://local/api/inbox", { headers: { cookie: COOKIE_SESION } }) as any);
  assert.equal(api.status, 503);
  assert.equal((await api.json()).code, "sesion_no_comprobable");

  const sinCookie = await middleware(new NextRequest("http://local/prospectos?q=a") as any);
  assert.equal(sinCookie.status, 307);
  assert.match(sinCookie.headers.get("location") ?? "", /\/login\?next=%2Fprospectos%3Fq%3Da$/);

  const apiSinCookie = await middleware(new NextRequest("http://local/api/inbox") as any);
  assert.equal(apiSinCookie.status, 401);

  // Las rutas públicas siguen pasando sin sesión (el webhook se protege con su firma).
  const publica = await middleware(new NextRequest("http://local/api/webhooks/whatsapp") as any);
  assert.equal(publica.status, 200);

  const conSesion = await middleware(new NextRequest("http://local/prospectos", { headers: { cookie: COOKIE_SESION } }) as any);
  assert.equal(conSesion.status, 200);
});

test("1.12: una sesión sin PIN guardado no vale (no hay versión contra la cual comprobarla)", async () => {
  const token = await signSession({ v: 1, iat: Math.floor(Date.now() / 1000), sid: "sin-pin" });
  const s = db();
  const { data: fila } = await s.from("access_pin").select("*").eq("id", true).single();
  await s.from("access_pin").delete().eq("id", true);
  invalidateSessionVersionCache();
  try {
    const res = await inbox(pedido("http://local/api/inbox", { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).code, "sesion_revocada");
  } finally {
    await s.from("access_pin").insert(fila!);
    await prepararSesionDePrueba();
  }
});

test("1.12: recursos de otro perfil se rechazan en el servidor sin efectos ni datos cruzados", async () => {
  const s = db();
  const { campaignId } = await crearCampana("otro perfil", 1);
  // Una base de Marketing (otro perfil) no se puede agregar a una campaña de Autos.
  const base = await s
    .from("imported_bases")
    .insert({ area: "marketing", name: `PRUEBA base ajena ${randomUUID().slice(0, 8)}`, source_label: "prueba", total_rows: 0 })
    .select("id")
    .single();
  assert.equal(base.error, null);
  await s.from("campaigns").update({ status: "pausada" }).eq("id", campaignId);
  const { count: antes } = await s.from("campaign_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId);
  const res = await agregarBase(
    pedido(`http://local/api/campaigns/${campaignId}/agregar-base`, { method: "POST", body: JSON.stringify({ base_id: base.data!.id }) }),
    { params: { id: campaignId } }
  );
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /perfiles distintos/);
  const { count: despues } = await s.from("campaign_contacts").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId);
  assert.equal(despues, antes, "no se agregó ningún destinatario");

  // Una línea de Autos no se edita a través del perfil de Marketing.
  const { data: linea } = await s.from("profile_lines").select("id, label").eq("rubro_id", AGENCIA).limit(1).single();
  const MARKETING = "44444444-4444-4444-4444-444444444444";
  const { data: perfilMarketing } = await s.from("rubros").select("id").eq("id", MARKETING).maybeSingle();
  const otroPerfil = perfilMarketing?.id ?? randomUUID();
  const cruzada = await editarLinea(
    pedido(`http://local/api/perfiles/${otroPerfil}/lineas/${linea!.id}`, { method: "PATCH", body: JSON.stringify({ label: "Cambiada desde otro perfil" }) }),
    { params: { id: otroPerfil, lineId: linea!.id } }
  );
  assert.equal(cruzada.status, 404);
  const { data: igual } = await s.from("profile_lines").select("label").eq("id", linea!.id).single();
  assert.equal(igual!.label, linea!.label, "la línea no cambió");

  // Y sin sesión, ni siquiera llega a mirar la campaña.
  const sinSesion = await agregarBase(
    pedido(`http://local/api/campaigns/${campaignId}/agregar-base`, { method: "POST", headers: SIN_COOKIE, body: JSON.stringify({ base_id: base.data!.id }) }),
    { params: { id: campaignId } }
  );
  assert.equal(sinSesion.status, 401);
});

test("1.12: el texto de búsqueda no puede alterar el filtro del servidor", async () => {
  // Una búsqueda con comas y paréntesis (sintaxis del filtro) responde 200 con el texto limpio, no con un error de PostgREST.
  const res = await inbox(pedido(`http://local/api/inbox?q=${encodeURIComponent('Pérez,phone.ilike.*)(')}`));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.items), "devuelve la lista (vacía o no), no un error del filtro");
});
