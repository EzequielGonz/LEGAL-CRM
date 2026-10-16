// Etapa 3 · Contenido: brief de marca, generador de piezas (texto + SVG),
// calendario, auditoría de landings (análisis puro) y ejecutor de tareas.
import test from "node:test";
import assert from "node:assert/strict";
import { briefCompleto, disenoSvg, faltantesDelBrief, generarPieza, planCalendario, textoProhibido, type BriefMarca } from "@/lib/contenido/brief";
import { evaluarPieza, estadoInicial } from "@/lib/contenido/politica";
import { analizarHtml, auditarUrl, validarUrlAuditoria } from "@/lib/seo/auditoria";
import { parseTareasServidor } from "@/lib/tareas-servidor";

const brief: BriefMarca = {
  rubro: "juridico",
  nombre_publico: "Estudio de prueba",
  logo_ref: null,
  colores: { primario: "#123456", texto: "#ffffff" },
  servicios: ["Accidentes de tránsito", "Despidos"],
  publico: "Personas de zona oeste con una consulta reciente",
  zonas: "zona oeste",
  tono: "cercano y claro",
  contacto: { web: "https://ejemplo.test" },
  objetivos: "consultas por WhatsApp",
  afirmaciones_autorizadas: ["Atendemos consultas por WhatsApp de lunes a viernes"],
  prohibido: ["sin cargo"],
};

test("brief: faltantes y completitud (logo y color no bloquean)", () => {
  assert.equal(briefCompleto(brief), true);
  const f = faltantesDelBrief(brief);
  assert.ok(f.some((x) => x.startsWith("logo")));
  assert.equal(briefCompleto({ ...brief, servicios: [] }), false);
  assert.ok(faltantesDelBrief({}).length >= 4);
});

test("generador: pieza determinista, sin frases prohibidas, con SVG válido y CTA de la política", () => {
  const a = generarPieza({ brief, canal: "instagram", indicePilar: 0, cta: { tipo: "whatsapp", url: "https://wa.me/000" } });
  const b = generarPieza({ brief, canal: "instagram", indicePilar: 0, cta: { tipo: "whatsapp", url: "https://wa.me/000" } });
  assert.equal(a.texto, b.texto);
  assert.equal(a.svg, b.svg);
  assert.deepEqual(a.motivosRetencion, []);
  assert.match(a.texto, /WhatsApp/);
  assert.match(a.texto, /#juridico/);
  assert.ok(a.svg.startsWith("<svg"));
  assert.match(a.svg, /#123456/);
  assert.match(a.svg, />logo</, "sin logo se dibuja un marcador neutro");
  assert.equal(a.cta_url, "https://wa.me/000");
  assert.deepEqual(textoProhibido(a.texto, brief.prohibido), []);
  // Facebook no lleva hashtags; landing produce artículo.
  assert.doesNotMatch(generarPieza({ brief, canal: "facebook", indicePilar: 1 }).texto, /#/);
  assert.equal(generarPieza({ brief, canal: "landing", indicePilar: 2 }).formato, "articulo");
});

test("generador: brief incompleto o afirmación prohibida → motivos de retención", () => {
  const incompleto = generarPieza({ brief: { ...brief, tono: null }, canal: "instagram", indicePilar: 0 });
  assert.ok(incompleto.motivosRetencion.some((m) => m.startsWith("brief incompleto")));
  const malo = generarPieza({ brief: { ...brief, afirmaciones_autorizadas: ["Resultado garantizado en 30 días"] }, canal: "facebook", indicePilar: 0 });
  assert.ok(malo.motivosRetencion.some((m) => /no autorizadas/.test(m)));
  assert.ok(textoProhibido("Somos el mejor estudio, 12 cuotas").length >= 2);
});

test("generador: con la política apagada la pieza válida queda «lista» (no publica); habilitada y con destino queda programada", () => {
  const p = generarPieza({ brief, canal: "instagram", indicePilar: 0, cta: { tipo: "whatsapp", url: "https://wa.me/000" } });
  const apagada = evaluarPieza(p, { habilitada: false, calendario_pausado: true, destino_ref: null, ctas: [] });
  assert.equal(apagada.publicable, false);
  assert.equal(estadoInicial(apagada, true), "lista");
  assert.ok(apagada.motivos.includes("politica_apagada"));
  const activa = evaluarPieza(p, { habilitada: true, calendario_pausado: false, destino_ref: "cuenta", ctas: [{ tipo: "whatsapp", url: "https://wa.me/000" }] });
  assert.equal(estadoInicial(activa, true), "programada", activa.motivos.join(","));
  // Pieza con problema propio (sin CTA) → retenida aunque la política esté activa.
  const sinCta = evaluarPieza({ ...p, cta_url: null }, { habilitada: true, calendario_pausado: false, destino_ref: "cuenta", ctas: [{ tipo: "whatsapp", url: "https://wa.me/000" }] });
  assert.equal(estadoInicial(sinCta, true), "retenida");
});

test("calendario: lunes/miércoles/viernes, sin fines de semana, hora fija", () => {
  const plan = planCalendario({ desde: new Date("2026-10-14T00:00:00Z"), semanas: 2, canales: ["instagram", "facebook"], porSemana: 3 });
  assert.equal(plan.length, 12);
  for (const s of plan) {
    const d = new Date(s.fecha).getUTCDay();
    assert.ok([1, 3, 5].includes(d), `día ${d}`);
    assert.equal(new Date(s.fecha).getUTCHours(), 14); // 11:00 Argentina
  }
  assert.equal(new Set(plan.map((p) => p.indicePilar)).size, 6);
});

test("svg: escapa el texto y no incrusta enlaces que no sean https", () => {
  const s = disenoSvg({ titular: "<script>alert(1)</script> & co", marca: "M", colores: {}, logoRef: "javascript:alert(1)" });
  assert.doesNotMatch(s, /<script>/);
  assert.doesNotMatch(s, /javascript:/);
  assert.match(s, /&lt;script&gt;/);
});

test("auditoría: rechaza direcciones privadas y dominios no permitidos", () => {
  assert.equal(validarUrlAuditoria("http://localhost:3000").ok, false);
  assert.equal(validarUrlAuditoria("http://192.168.1.1/").ok, false);
  assert.equal(validarUrlAuditoria("http://169.254.169.254/latest").ok, false);
  assert.equal(validarUrlAuditoria("ftp://ejemplo.test").ok, false);
  assert.equal(validarUrlAuditoria("https://user:pass@ejemplo.test").ok, false);
  assert.equal(validarUrlAuditoria("https://otro.test/", ["ejemplo.test"]).ok, false);
  assert.equal(validarUrlAuditoria("https://www.ejemplo.test/landing", ["ejemplo.test"]).ok, true);
});

test("auditoría: análisis del HTML detecta problemas y puntúa", () => {
  const bueno = `<!doctype html><html><head><title>Abogados en zona oeste · Consultá por WhatsApp</title><meta name="description" content="Orientación en accidentes de tránsito y despidos. Escribinos por WhatsApp y una persona te responde."><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://ejemplo.test/"></head><body><h1>Consultas</h1><img src="a.png" alt="Frente"><a href="https://wa.me/000">WhatsApp</a></body></html>`;
  const r = analizarHtml("https://ejemplo.test/", bueno);
  assert.deepEqual(r.problemas, []);
  assert.equal(r.puntaje, 100);
  const malo = `<html><head></head><body><h1>a</h1><h1>b</h1><img src="x.png"></body></html>`;
  const m = analizarHtml("http://ejemplo.test/", malo);
  const claves = m.problemas.map((p) => p.clave);
  for (const k of ["https", "titulo", "descripcion", "viewport", "alt", "contacto", "h1_multiple"]) assert.ok(claves.includes(k), k);
  assert.ok(m.puntaje < 40);
});

test("auditoría: no sigue redirecciones a otro dominio", async () => {
  const fetchImpl = (async (url: string) => {
    if (String(url).includes("ejemplo.test")) return new Response("", { status: 302, headers: { location: "https://otro.test/" } });
    return new Response("<html><title>otro</title></html>", { status: 200 });
  }) as unknown as typeof fetch;
  const r = await auditarUrl("https://ejemplo.test/", { fetchImpl });
  assert.equal(r.status, 302);
  assert.equal(r.titulo, null);
});

test("ejecutor de tareas: apagado por defecto y ante configuración inválida", () => {
  assert.deepEqual({ ...parseTareasServidor(null), configProblem: undefined }, { citas: false, contenido: false, configProblem: undefined });
  assert.ok(parseTareasServidor(undefined).configProblem);
  assert.deepEqual(parseTareasServidor({ value: { citas: true, contenido: "si" } }), { citas: true, contenido: false });
});
