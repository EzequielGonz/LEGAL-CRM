// Etapa 3 · Contenido: brief por perfil, piezas generadas a la cola según la
// política (apagada → «lista», nunca publicada) y auditoría de landing con
// descarga simulada. Nada sale a ninguna red.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { RedSimulada, esperarApi, prepararSesionDePrueba, pedido, sql } from "./soporte/entorno";
import { GET as briefGet, PUT as briefPut } from "@/app/api/contenido/brief/route";
import { GET as piezasGet, POST as piezasPost } from "@/app/api/contenido/piezas/route";
import { POST as auditar } from "@/app/api/contenido/auditoria/route";

const JURIDICO = "11111111-1111-1111-1111-111111111111";
let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
});
after(() => red.restaurar());
const json = (url: string, method: string, body: unknown) => pedido(url, { method, body: JSON.stringify(body) });

test("brief: se guarda sin PIN (no publica), rechaza logo sin https y calcula faltantes", async () => {
  const vacio: any = await (await briefGet(pedido("http://local/api/contenido/brief?perfil=juridico"))).json();
  assert.equal(vacio.completo, false);
  assert.ok(vacio.pilares.length >= 4);
  assert.equal((await briefPut(json("http://local/api/contenido/brief", "PUT", { perfil: "juridico", nombre_publico: "Estudio de prueba", logo_ref: "http://inseguro.test/logo.png" }))).status, 400);
  const ok = await briefPut(json("http://local/api/contenido/brief", "PUT", { perfil: "juridico", nombre_publico: "Estudio de prueba", servicios: ["Accidentes de tránsito"], publico: "Personas de zona oeste", tono: "cercano", colores: { primario: "#112233", texto: "#ffffff" }, afirmaciones_autorizadas: ["Atendemos consultas por WhatsApp de lunes a viernes"], contacto: { web: "https://ejemplo.test" } }));
  const d: any = await ok.json();
  assert.equal(ok.status, 200, JSON.stringify(d));
  assert.equal(d.completo, true);
  assert.equal(sql(`select completo || ':' || nombre_publico from public.brand_briefs where rubro_id = '${JURIDICO}'`), "true:Estudio de prueba");
});

test("piezas: con política apagada entran a la cola como «lista» (nunca publicada); la vista previa no guarda", async () => {
  const vista = await piezasPost(json("http://local/api/contenido/piezas", "POST", { perfil: "juridico", canales: ["instagram"], semanas: 1, porSemana: 2, soloVista: true }));
  const vd: any = await vista.json();
  assert.equal(vista.status, 200, JSON.stringify(vd));
  assert.equal(vd.piezas.length, 2);
  assert.ok(vd.piezas[0].svg.startsWith("<svg"));
  assert.equal(sql(`select count(*) from public.content_pieces where rubro_id = '${JURIDICO}'`), "0");

  const r = await piezasPost(json("http://local/api/contenido/piezas", "POST", { perfil: "juridico", canales: ["instagram", "facebook"], semanas: 1, porSemana: 2 }));
  const d: any = await r.json();
  assert.equal(r.status, 200, JSON.stringify(d));
  assert.equal(d.piezas.length, 4);
  // Sin CTA configurado en la política, la pieza no tiene cta_url → retenida (problema propio) con motivo legible.
  assert.ok(d.piezas.every((p: any) => p.estado === "retenida" || p.estado === "lista"), JSON.stringify(d.piezas));
  assert.equal(sql(`select count(*) from public.content_pieces where rubro_id = '${JURIDICO}' and estado in ('publicada', 'publicando', 'programada')`), "0");
  const lista: any = await (await piezasGet(pedido("http://local/api/contenido/piezas?perfil=juridico"))).json();
  assert.equal(lista.piezas.length, 4);
  assert.ok(lista.piezas.every((p: any) => typeof p.motivo === "string" && p.motivo.length > 0));
  // Repetir no duplica (misma clave de deduplicación por fecha y título).
  const r2 = await piezasPost(json("http://local/api/contenido/piezas", "POST", { perfil: "juridico", canales: ["instagram", "facebook"], semanas: 1, porSemana: 2 }));
  assert.equal(r2.status, 200);
  assert.equal(sql(`select count(*) from public.content_pieces where rubro_id = '${JURIDICO}'`), "4");
});

test("auditoría: rechaza direcciones privadas y guarda el resultado de una página simulada", async () => {
  assert.equal((await auditar(json("http://local/api/contenido/auditoria", "POST", { perfil: "juridico", url: "http://127.0.0.1:3000/" }))).status, 400);
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: any, init?: any) => {
    if (!String(url).includes("ejemplo.test")) return original(url, init);
    return new Response(`<html><head><title>Estudio en zona oeste · consultas por WhatsApp</title><meta name="viewport" content="width=device-width"></head><body><h1>Consultas</h1><a href="https://wa.me/000">WhatsApp</a></body></html>`, { status: 200 });
  }) as any;
  try {
    const r = await auditar(json("http://local/api/contenido/auditoria", "POST", { perfil: "juridico", url: "https://ejemplo.test/landing" }));
    const d: any = await r.json();
    assert.equal(r.status, 200, JSON.stringify(d));
    assert.ok(d.auditoria.problemas.some((p: any) => p.clave === "descripcion"));
    assert.equal(sql(`select count(*) from public.landing_audits where rubro_id = '${JURIDICO}'`), "1");
  } finally {
    globalThis.fetch = original;
  }
});
