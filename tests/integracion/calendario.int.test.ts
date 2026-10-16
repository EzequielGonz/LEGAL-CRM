// Etapa 2 · Bloque 2.0 — Calendario de contacto: excepciones cargadas a mano
// desde el panel y su efecto sobre las campañas. Base de pruebas con datos
// inventados y Meta simulado.
import test, { after, before } from "node:test";
import assert from "node:assert/strict";

import { RedSimulada, SIN_PAUSA, db, esperarApi, fijarPausa, pedido, prepararSesionDePrueba } from "./soporte/entorno";
import { crearCampana, estadoDestinatarios } from "./soporte/campanas";
import { tickCampaign } from "@/lib/campaigns";
import { GET as listar, POST as agregar } from "@/app/api/calendario/route";
import { PATCH as archivar } from "@/app/api/calendario/[id]/route";


let red: RedSimulada;
before(async () => {
  red = new RedSimulada();
  await esperarApi();
  await prepararSesionDePrueba();
  await fijarPausa(SIN_PAUSA);
});
after(() => red.restaurar());

const json = (body: unknown, method = "POST") => pedido("http://local/api/calendario", { method, body: JSON.stringify(body) });
/** Instante a partir de una hora de pared argentina (UTC-3). */
const art = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 3, mm));
};

test("2.0: el panel carga excepciones válidas y rechaza las que amplían el horario, las pasadas o las repetidas", async () => {
  const dia = "2031-03-14"; // viernes
  const malas = [
    { day: "2031-02-30", closed: true },
    { day: dia, closed: false, start_hour: 7, end_hour: 12 },
    { day: dia, closed: false, start_hour: 12, end_hour: 22 },
    { day: dia, closed: false, start_hour: 14, end_hour: 10 },
    { day: dia, closed: false },
    { day: "2020-01-02", closed: true },
  ];
  for (const b of malas) {
    const r = await agregar(json(b));
    assert.equal(r.status, 400, JSON.stringify(b));
  }
  const ok = await agregar(json({ day: dia, closed: true, note: "Cierre del estudio (prueba)" }));
  assert.equal(ok.status, 200);
  const creada = (await ok.json()).exception;
  assert.equal(creada.closed, true);

  const repetida = await agregar(json({ day: dia, closed: false, start_hour: 9, end_hour: 12 }));
  assert.equal(repetida.status, 409);

  const lista = await (await listar(pedido("http://local/api/calendario"))).json();
  assert.ok(lista.upcoming.some((e: any) => e.id === creada.id));

  // Archivar (no se borra) y volver a cargar ese día con otro horario.
  const a = await archivar(json({ archive: true, reason: "Prueba" }, "PATCH"), { params: { id: creada.id } });
  assert.equal(a.status, 200);
  const otra = await archivar(json({ archive: true }, "PATCH"), { params: { id: creada.id } });
  assert.equal(otra.status, 404, "ya estaba archivada");
  const nueva = await agregar(json({ day: dia, closed: false, start_hour: 9, end_hour: 12 }));
  assert.equal(nueva.status, 200);

  const { data: fila } = await db().from("contact_calendar_exceptions").select("archived_at, archive_reason").eq("id", creada.id).single();
  assert.ok(fila!.archived_at);
  assert.equal(fila!.archive_reason, "Prueba");
  const borrado = await db().from("contact_calendar_exceptions").delete().eq("id", creada.id);
  assert.ok(borrado.error, "no se puede borrar");
  const { count } = await db().from("ops_change_log").select("id", { count: "exact", head: true }).like("action", "calendario_%");
  assert.ok((count ?? 0) >= 3, "cada cambio queda en el registro operativo");
});

test("2.0: una campaña no envía un día cerrado por excepción y respeta un horario más corto", async () => {
  // Miércoles 7/10/2026 cerrado; jueves 8/10/2026 solo de 9 a 11.
  const s = db();
  const r1 = await s.from("contact_calendar_exceptions").insert({ day: "2026-10-07", closed: true, note: "prueba" });
  const r2 = await s.from("contact_calendar_exceptions").insert({ day: "2026-10-08", closed: false, start_hour: 9, end_hour: 11, note: "prueba" });
  assert.ifError(r1.error);
  assert.ifError(r2.error);

  const { campaignId, destinatarios } = await crearCampana("calendario", 1);
  const cerrado = await tickCampaign(campaignId, { now: art("2026-10-07", 12) });
  assert.equal(cerrado.action, "outside_send_window");
  assert.match(cerrado.detail ?? "", /excepciones del calendario/);
  assert.match(cerrado.detail ?? "", /jueves/, "vuelve a abrir el jueves a las 9");

  const fueraDelCorto = await tickCampaign(campaignId, { now: art("2026-10-08", 12) });
  assert.equal(fueraDelCorto.action, "outside_send_window");
  assert.equal(red.enviosA(destinatarios[0].phone).length, 0);

  const dentro = await tickCampaign(campaignId, { now: art("2026-10-08", 10) });
  assert.equal(dentro.action, "sent");
  assert.equal(red.enviosA(destinatarios[0].phone).length, 1);
  const estados = await estadoDestinatarios(campaignId);
  assert.equal([...estados.values()][0].status, "enviado");
});
