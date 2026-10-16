// Etapa 3 · Agentes IA sobre la base: crear derivado, asignar (con PIN y
// solo versiones publicadas), simular y evaluar con el generador simulado,
// sembrar/exportar corpus, preparar y autorizar un trabajo de ajuste (sin
// proveedor), tareas del servidor apagadas por defecto y tick que las respeta.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { RedSimulada, esperarApi, fijarPausa, prepararSesionDePrueba, pedido, sql, CON_PAUSA } from "./soporte/entorno";
import { POST as crear } from "@/app/api/agentes/crear/route";
import { GET as asignacionesGet, POST as asignar } from "@/app/api/agentes/asignaciones/route";
import { POST as publicar } from "@/app/api/agentes/publicar/route";
import { GET as modeloGet } from "@/app/api/agentes/modelo/route";
import { POST as simular } from "@/app/api/agentes/simulador/route";
import { POST as evaluar } from "@/app/api/agentes/evaluacion/route";
import { GET as corpusGet, POST as corpusPost, PATCH as corpusPatch } from "@/app/api/agentes/corpus/route";
import { GET as ajusteGet, POST as ajustePost } from "@/app/api/agentes/ajuste/route";
import { POST as pedidos } from "@/app/api/agentes/pedidos/route";
import { GET as tareasGet, POST as tareasPost } from "@/app/api/acceso/tareas-servidor/route";
import { POST as tick } from "@/app/api/campaigns/tick/route";
import { RUBRO_IDS } from "@/lib/rubros";

const PIN = process.env.ACCESS_PIN && /^[0-9]{6}$/.test(process.env.ACCESS_PIN) ? process.env.ACCESS_PIN : "482915";
let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  await fijarPausa(CON_PAUSA);
  process.env.CRON_SECRET = "secreto-de-prueba";
  delete process.env.GEMINI_API_KEY;
});
after(() => red.restaurar());
const json = (url: string, method: string, body: unknown) => pedido(url, { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } });

test("3A: crear derivado copia solo configuración, pide PIN y nace apagado/preparado", async () => {
  assert.notEqual((await crear(json("http://local/api/agentes/crear", "POST", { clave: "juridico_oeste", nombre: "Jurídico oeste", rubroId: RUBRO_IDS.juridico, pin: "000001" }))).status, 200);
  const r = await crear(json("http://local/api/agentes/crear", "POST", { clave: "juridico_oeste", nombre: "Jurídico oeste", rubroId: RUBRO_IDS.juridico, pin: PIN }));
  assert.equal(r.status, 200, JSON.stringify(await r.clone().json()));
  assert.equal(sql(`select rol || ':' || estado || ':' || publicacion || ':' || version || ':' || creado_desde from public.agent_library where clave = 'juridico_oeste'`), "derivado:apagado:preparado:1:principal@1");
  assert.equal(sql(`select count(*) from public.agent_library_versions where clave = 'juridico_oeste'`), "1");
  assert.equal((await crear(json("http://local/api/agentes/crear", "POST", { clave: "juridico_oeste", nombre: "Otro", rubroId: RUBRO_IDS.juridico, pin: PIN }))).status, 409);
  // El informe del modelo no expone claves.
  const inf: any = await (await modeloGet(pedido("http://local/api/agentes/modelo"))).json();
  assert.equal(inf.proveedor, "gemini_api");
  assert.equal(inf.claveConfigurada, false);
  assert.ok(!("GEMINI_API_KEY" in inf));
});

test("3A: asignar activa exige versión publicada; publicar exige evaluación aprobada; nada de eso envía", async () => {
  const mensajesAntes = sql(`select count(*) from public.messages`);
  const activa = await asignar(json("http://local/api/agentes/asignaciones", "POST", { rubroId: RUBRO_IDS.juridico, area: "civil", clave: "juridico_oeste", version: 1, estado: "activa", pin: PIN }));
  assert.equal(activa.status, 409);
  const sinEval = await publicar(json("http://local/api/agentes/publicar", "POST", { clave: "juridico_oeste", version: 1, publicacion: "publicado", pin: PIN }));
  assert.equal(sinEval.status, 409);
  const apagada = await asignar(json("http://local/api/agentes/asignaciones", "POST", { rubroId: RUBRO_IDS.juridico, area: "civil", clave: "juridico_oeste", version: 1, estado: "apagada", pin: PIN }));
  assert.equal(apagada.status, 200);
  assert.equal(sql(`select estado from public.agent_assignments where area = 'civil'`), "apagada");
  // Cada confirmación de PIN queda registrada (también la que después se rechazó por regla de negocio).
  assert.equal(sql(`select count(*) from public.access_events where kind = 'asignacion_agente'`), "2");
  const cruzado = await asignar(json("http://local/api/agentes/asignaciones", "POST", { rubroId: RUBRO_IDS.marketing, area: "marketing", clave: "juridico_oeste", version: 1, estado: "apagada", pin: PIN }));
  assert.equal(cruzado.status, 409, "no se cruzan perfiles");
  const principal = await asignar(json("http://local/api/agentes/asignaciones", "POST", { rubroId: RUBRO_IDS.juridico, area: "civil", clave: "principal", version: 1, estado: "apagada", pin: PIN }));
  assert.equal(principal.status, 400, "el principal no se asigna");
  const lista: any = await (await asignacionesGet(pedido("http://local/api/agentes/asignaciones"))).json();
  assert.equal(lista.asignaciones.length, 1);
  assert.equal(sql(`select count(*) from public.messages`), mensajesAntes);
});

test("3B: simular un caso guarda la corrida con sus turnos y la evaluación; sin clave usa el generador simulado", async () => {
  const mensajesAntes = sql(`select count(*) from public.messages`);
  const citasAntes = sql(`select count(*) from public.appointments`);
  const r = await simular(json("http://local/api/agentes/simulador", "POST", { clave: "juridico_oeste", casoId: "W09" }));
  const d: any = await r.json();
  assert.equal(r.status, 200, JSON.stringify(d));
  assert.ok(d.runId);
  assert.equal(sql(`select estado || ':' || modelo_proveedor from public.simulation_runs where id = '${d.runId}'`), "terminada:simulado");
  assert.ok(Number(sql(`select count(*) from public.simulation_turns where run_id = '${d.runId}'`)) >= 3);
  assert.equal(sql(`select count(*) from public.eval_results where run_id = '${d.runId}'`), "1");
  assert.equal(sql(`select count(*) from public.eval_cases`), "16");
  assert.ok(Array.isArray(d.evaluacion.fallos_criticos));
  // El generador por defecto no detiene ante el enojo → baja_ignorada queda registrada como fallo, no se maquilla.
  assert.ok(d.evaluacion.fallos_criticos.includes("baja_ignorada"));
  assert.equal(sql(`select count(*) from public.messages`), mensajesAntes, "el simulador no escribe mensajes reales");
  assert.equal(sql(`select count(*) from public.appointments`), citasAntes, "ni citas reales");
  const libre = await simular(json("http://local/api/agentes/simulador", "POST", { clave: "principal", mensajes: ["Hola, quería consultar por un choque."], area: "civil" }));
  assert.equal(libre.status, 200);
  assert.equal(((await libre.json()) as any).evaluacion, null);
});

test("3B: la evaluación resume por rol y deja ultima_evaluacion; publicar sigue bloqueado si hay fallos críticos", async () => {
  const r = await evaluar(json("http://local/api/agentes/evaluacion", "POST", { clave: "juridico_oeste" }));
  const d: any = await r.json();
  assert.equal(r.status, 200, JSON.stringify(d));
  assert.equal(d.detalle.length, 16);
  assert.ok(Object.keys(d.porRol).length >= 4);
  const ue = JSON.parse(sql(`select ultima_evaluacion::text from public.agent_library where clave = 'juridico_oeste'`));
  assert.equal(ue.casos, 16);
  assert.ok(ue.fallos_criticos > 0, "con el guion neutro hay fallos críticos: no se puede publicar");
  assert.equal((await publicar(json("http://local/api/agentes/publicar", "POST", { clave: "juridico_oeste", version: 1, publicacion: "publicado", pin: PIN }))).status, 409);
  // Pausar/preparar sí se permite.
  assert.equal((await publicar(json("http://local/api/agentes/publicar", "POST", { clave: "juridico_oeste", version: 1, publicacion: "pausado", pin: PIN }))).status, 200);
});

test("3C: corpus sembrado, revisión, exportación validada y trabajo de ajuste trazable sin proveedor", async () => {
  const s = await corpusPost(json("http://local/api/agentes/corpus", "POST", { accion: "sembrar" }));
  const sd: any = await s.json();
  assert.equal(s.status, 200, JSON.stringify(sd));
  assert.equal(sd.casos, 16);
  assert.ok(sd.modulos >= 10);
  const g: any = await (await corpusGet(pedido("http://local/api/agentes/corpus"))).json();
  assert.equal(g.casos.length, 16);
  assert.equal(g.plan.totalAprobados, 0);
  const setId = g.sets[0].id;
  // Sin aprobados, preparar un trabajo falla con 409.
  assert.equal((await ajustePost(json("http://local/api/agentes/ajuste", "POST", { accion: "preparar", setId, objetivo: "Prueba", modeloBase: "gemini-2.5-flash" }))).status, 409);
  // Aprobamos los de entrenamiento.
  for (const c of g.casos.filter((x: any) => x.particion === "entrenamiento")) {
    assert.equal((await corpusPatch(json("http://local/api/agentes/corpus", "PATCH", { id: c.id, revision: "aprobado" }))).status, 200);
  }
  const e = await corpusPost(json("http://local/api/agentes/corpus", "POST", { accion: "exportar", setId, particion: "entrenamiento" }));
  const ed: any = await e.json();
  assert.equal(e.status, 200, JSON.stringify(ed));
  assert.ok(ed.lineas.length > 0);
  assert.equal(ed.validacion.ok, true, ed.validacion.errores.join("; "));
  assert.equal(ed.hash.length, 64);
  const p = await ajustePost(json("http://local/api/agentes/ajuste", "POST", { accion: "preparar", setId, objetivo: "Prueba", modeloBase: "gemini-2.5-flash", estimacionUsd: 12 }));
  const pd: any = await p.json();
  assert.equal(p.status, 200, JSON.stringify(pd));
  assert.equal(pd.trabajo.estado, "preparado");
  assert.equal(pd.trabajo.hash_corpus, ed.hash);
  assert.equal((await ajustePost(json("http://local/api/agentes/ajuste", "POST", { accion: "autorizar", jobId: pd.trabajo.id, limiteUsd: 0, pin: PIN }))).status, 400);
  assert.equal((await ajustePost(json("http://local/api/agentes/ajuste", "POST", { accion: "autorizar", jobId: pd.trabajo.id, limiteUsd: 20, pin: "000001" }))).status, 401);
  const a = await ajustePost(json("http://local/api/agentes/ajuste", "POST", { accion: "autorizar", jobId: pd.trabajo.id, limiteUsd: 20, pin: PIN }));
  assert.equal(a.status, 200, JSON.stringify(await a.clone().json()));
  assert.equal(sql(`select estado || ':' || limite_usd || ':' || coalesce(proveedor_job_id, '-') from public.tuning_jobs where id = '${pd.trabajo.id}'`), "autorizado:20.00:-", "autorizado pero sin trabajo creado en el proveedor");
  assert.equal(sql(`select count(*) from public.access_events where kind = 'ajuste_autorizado'`), "1");
  const l: any = await (await ajusteGet(pedido("http://local/api/agentes/ajuste"))).json();
  assert.equal(l.vertex.configurado, false);
  assert.throws(() => sql(`delete from public.tuning_jobs where id = '${pd.trabajo.id}'`));
  // Pedir mejora queda registrado y no cambia al agente.
  assert.equal((await pedidos(json("http://local/api/agentes/pedidos", "POST", { clave: "juridico_oeste", pedido: "Que pregunte la zona antes" }))).status, 200);
  assert.equal(sql(`select version from public.agent_library where clave = 'juridico_oeste'`), "1");
});

test("ejecutor de tareas: apagado por defecto, se enciende solo con PIN y el tick lo respeta", async () => {
  const mensajesAntes = sql(`select count(*) from public.messages`);
  const t0: any = await (await tareasGet(pedido("http://local/api/acceso/tareas-servidor"))).json();
  assert.deepEqual({ citas: t0.citas, contenido: t0.contenido }, { citas: false, contenido: false });
  const r1 = await tick(pedido("http://local/api/campaigns/tick", { method: "POST", headers: { authorization: "Bearer secreto-de-prueba" } }));
  const d1: any = await r1.json();
  assert.equal(r1.status, 200, JSON.stringify(d1));
  assert.deepEqual(d1.servidor, { citas: "apagado", contenido: "apagado" });
  assert.equal((await tareasPost(json("http://local/api/acceso/tareas-servidor", "POST", { citas: true, pin: "000001" }))).status, 401);
  assert.equal((await tareasPost(json("http://local/api/acceso/tareas-servidor", "POST", { citas: true, contenido: true, pin: PIN }))).status, 200);
  assert.equal(sql(`select count(*) from public.access_events where kind = 'ejecutor_tareas'`), "1");
  const r2 = await tick(pedido("http://local/api/campaigns/tick", { method: "POST", headers: { authorization: "Bearer secreto-de-prueba" } }));
  const d2: any = await r2.json();
  assert.equal(r2.status, 200);
  // Encendido pero con pausa general: las citas no reservan tareas y el contenido no tiene piezas vencidas.
  assert.deepEqual(d2.servidor.citas, []);
  assert.ok(Array.isArray(d2.servidor.contenido));
  assert.equal(sql(`select count(*) from public.messages`), mensajesAntes, "el tick con pausa general no envía nada");
  await tareasPost(json("http://local/api/acceso/tareas-servidor", "POST", { citas: false, contenido: false, pin: PIN }));
});
