// Etapa 2 · Bloque 4 — Biblioteca de agentes: PIN, versiones y nada activo.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { RedSimulada, esperarApi, prepararSesionDePrueba, pedido, sql } from "./soporte/entorno";
import { GET, PATCH } from "@/app/api/agentes/biblioteca/route";

const PIN = process.env.ACCESS_PIN && /^[0-9]{6}$/.test(process.env.ACCESS_PIN) ? process.env.ACCESS_PIN : "482915";
let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
});
after(() => red.restaurar());
const patch = (body: unknown) => PATCH(pedido("http://local/api/agentes/biblioteca", { method: "PATCH", body: JSON.stringify(body) }));

test("bloque 4: cinco agentes apagados; editar pide PIN, crea una versión y no toca al agente que responde", async () => {
  const res = await GET(pedido("http://local/api/agentes/biblioteca"));
  const data: any = await res.json();
  assert.equal(data.agentes.length, 5);
  assert.ok(data.agentes.every((a: any) => a.estado === "apagado"));
  const agentesAntes = sql(`select coalesce(string_agg(area || ':' || active || ':' || md5(system_prompt), ',' order by area), '') from public.ai_agents`);

  assert.notEqual((await patch({ clave: "marketing", cambios: { objetivo: "Nuevo objetivo de prueba" }, pin: "000001" })).status, 200);
  assert.equal(sql(`select version from public.agent_library where clave = 'marketing'`), "1");

  const ok = await patch({ clave: "marketing", cambios: { objetivo: "Nuevo objetivo de prueba" }, motivo: "prueba", pin: PIN });
  assert.equal(ok.status, 200);
  assert.equal(sql(`select version || ':' || estado || ':' || objetivo from public.agent_library where clave = 'marketing'`), "2:apagado:Nuevo objetivo de prueba");
  assert.equal(sql(`select count(*) from public.agent_library_versions where clave = 'marketing'`), "2");

  assert.equal((await patch({ clave: "marketing", cambios: { estado: "activo" }, pin: PIN })).status, 400);
  assert.throws(() => sql(`update public.agent_library set estado = 'activo' where clave = 'marketing'`), "la base tampoco acepta «activo»");
  assert.throws(() => sql(`delete from public.agent_library_versions where clave = 'marketing'`), "el historial no se borra");
  assert.equal(sql(`select coalesce(string_agg(area || ':' || active || ':' || md5(system_prompt), ',' order by area), '') from public.ai_agents`), agentesAntes);
});
