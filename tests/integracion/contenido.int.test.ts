// Etapa 2 · Bloque 5 — Cola de publicación con destinos simulados: sin
// duplicados, reconciliación de inciertas, token vencido y pausa. Nada sale.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { RedSimulada, esperarApi, prepararSesionDePrueba, pedido, sql } from "./soporte/entorno";
import { crearPieza, publicarVencidas, reconciliarIncierta, type Publicador } from "@/lib/contenido/cola";
import { PATCH as politica } from "@/app/api/contenido/politica/route";
import { POST as pedir } from "@/app/api/contenido/route";
import { GET as conectarGsc } from "@/app/api/seo/search-console/conectar/route";

const MARKETING = "44444444-4444-4444-4444-444444444444";
const PIN = process.env.ACCESS_PIN && /^[0-9]{6}$/.test(process.env.ACCESS_PIN) ? process.env.ACCESS_PIN : "482915";
const CTA = "https://perfil.prueba.invalid/contacto";
let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
});
after(() => {
  sql(`update public.content_policies set habilitada = false, calendario_pausado = true, destino_ref = null, ctas = '[]' where rubro_id = '${MARKETING}'`);
  red.restaurar();
});
const json = (body: unknown, method = "PATCH") => pedido("http://local/api", { method, body: JSON.stringify(body) });

function simulado(respuestas: Array<"ok" | "incierta" | "401">) {
  const publicadas = new Map<string, { id: string; url: string }>();
  let llamadas = 0;
  const p: Publicador = {
    async publicar(pieza) {
      const r = respuestas[llamadas++] ?? "ok";
      if (r === "401") throw Object.assign(new Error("token vencido"), { status: 401 });
      const res = { id: `post-${pieza.id.slice(0, 8)}`, url: `https://destino.prueba.invalid/${pieza.id}` };
      publicadas.set(pieza.dedupe_key, res);
      if (r === "incierta") throw Object.assign(new Error("sin respuesta"), { tipo: "sin_respuesta" });
      return res;
    },
    async buscar(key) {
      return publicadas.get(key) ?? null;
    },
  };
  return { p, publicadas, llamadas: () => llamadas };
}

test("con la política apagada nada se programa ni se publica; reanudar pide PIN y cuenta conectada", async () => {
  const r = await crearPieza({ rubroId: MARKETING, canal: "facebook", formato: "post", texto: "¿Tu negocio necesita una web que reciba consultas? Te contamos cómo trabajamos.", cta_url: CTA, programadaPara: new Date(Date.now() - 60_000).toISOString() });
  assert.equal(r.estado, "lista");
  const { p, llamadas } = simulado([]);
  await publicarVencidas({ publicador: p });
  assert.equal(llamadas(), 0);

  const sinPin = await politica(json({ perfil: "marketing", canal: "facebook", cambios: { calendario_pausado: false } }));
  assert.notEqual(sinPin.status, 200);
  const sinCuenta = await politica(json({ perfil: "marketing", canal: "facebook", cambios: { calendario_pausado: false }, pin: PIN }));
  assert.equal(sinCuenta.status, 409);
  const pausar = await politica(json({ perfil: "marketing", canal: "todos", cambios: { calendario_pausado: true } }));
  assert.equal(pausar.status, 200, "pausar no pide PIN");
});

test("A28/A29: publica una vez con identificador; incierta se reconcilia sin duplicar; token vencido pausa el canal", async () => {
  sql(`update public.content_policies set habilitada = true, calendario_pausado = false, destino_ref = 'pagina-de-prueba', proveedor = 'manual', ctas = '[{"tipo":"landing","url":"${CTA}"}]' where rubro_id = '${MARKETING}' and canal = 'facebook'`);
  const antes = new Date(Date.now() - 60_000).toISOString();
  const a = await crearPieza({ rubroId: MARKETING, canal: "facebook", formato: "post", texto: "Pieza A de prueba: cómo ordenar las consultas que llegan por redes.", cta_url: CTA, programadaPara: antes });
  const repetida = await crearPieza({ rubroId: MARKETING, canal: "facebook", formato: "post", texto: "Pieza A de prueba: cómo ordenar las consultas que llegan por redes.", cta_url: CTA, programadaPara: antes });
  assert.equal(a.estado, "programada");
  assert.equal(repetida.duplicada, true);
  const b = await crearPieza({ rubroId: MARKETING, canal: "facebook", formato: "post", texto: "Pieza B de prueba: preguntas frecuentes sobre automatizaciones.", cta_url: CTA, programadaPara: antes });
  const sensible = await crearPieza({ rubroId: MARKETING, canal: "facebook", formato: "post", texto: "Promoción: 30% de descuento este mes.", cta_url: CTA, programadaPara: antes });
  assert.equal(sensible.estado, "retenida");

  const sim = simulado(["ok", "incierta"]);
  const r1 = await publicarVencidas({ publicador: sim.p });
  assert.deepEqual(r1.map((x) => x.resultado).sort(), ["incierta", "publicada"]);
  assert.equal(sql(`select estado || '|' || coalesce(proveedor_id, '-') from public.content_pieces where id = '${a.id}'`).split("|")[0], "publicada");
  assert.ok(sql(`select url_publicada from public.content_pieces where id = '${a.id}'`).startsWith("https://destino.prueba.invalid/"));
  assert.equal(sql(`select estado from public.content_pieces where id = '${b.id}'`), "incierta");

  // Repetir sin reconciliar no hace nada; reconciliar encuentra la pieza en el destino y no la vuelve a publicar.
  await publicarVencidas({ publicador: sim.p });
  assert.equal(sim.llamadas(), 2);
  assert.equal(await reconciliarIncierta(b.id!), true);
  const r2 = await publicarVencidas({ publicador: sim.p });
  assert.deepEqual(r2.map((x) => `${x.resultado}:${x.detalle ?? ""}`), ["publicada:reconciliada"]);
  assert.equal(sim.llamadas(), 2, "no hubo una segunda publicación");
  assert.equal(sim.publicadas.size, 2);

  const c = await crearPieza({ rubroId: MARKETING, canal: "facebook", formato: "post", texto: "Pieza C de prueba: qué medimos en una campaña de redes.", cta_url: CTA, programadaPara: antes });
  const vencido = simulado(["401"]);
  const r3 = await publicarVencidas({ publicador: vencido.p });
  assert.deepEqual(r3.map((x) => x.resultado), ["token_vencido"]);
  assert.equal(sql(`select estado from public.content_pieces where id = '${c.id}'`), "error");
  assert.equal(sql(`select calendario_pausado from public.content_policies where rubro_id = '${MARKETING}' and canal = 'facebook'`), "t");
  assert.ok(Number(sql(`select count(*) from public.content_publish_attempts`)) >= 4);
});

test("pedidos de mejora y Search Console sin conectar", async () => {
  const ok = await pedir(json({ perfil: "marketing", tipo: "mejorar_contenido", pedido: "Más piezas sobre automatizaciones" }, "POST"));
  assert.equal(ok.status, 200);
  const vacio = await pedir(json({ perfil: "marketing", pedido: "" }, "POST"));
  assert.equal(vacio.status, 400);
  const gsc = await conectarGsc(pedido("http://local/api/seo/search-console/conectar?perfil=marketing"));
  assert.equal(gsc.status, 409);
  const body: any = await gsc.json();
  assert.ok(body.faltan.includes("SEARCH_CONSOLE_ENABLED=true"));
});
