import { test } from "node:test";
import assert from "node:assert/strict";
import { chatsQueEsperan } from "@/lib/hoy/colas";

const chat = (id: string) => ({ id, contact_id: `c-${id}`, last_message_at: null });
const msj = (conversation_id: string, direction: string, created_at: string, body = "texto ficticio") => ({ conversation_id, direction, created_at, body });

test("hoy: espera respuesta solo el chat cuyo último mensaje es de la persona", () => {
  const filas = chatsQueEsperan(
    [chat("a"), chat("b"), chat("c"), chat("d")],
    [
      msj("a", "saliente", "2026-11-10T10:00:00Z"),
      msj("a", "entrante", "2026-11-10T11:00:00Z", "¿Me pueden llamar?"),
      msj("b", "entrante", "2026-11-10T09:00:00Z"),
      msj("b", "saliente", "2026-11-10T09:30:00Z"),
      msj("c", "entrante", "2026-11-09T08:00:00Z"),
    ]
  );
  // «b» ya fue contestado; «d» no tiene mensajes en la ventana. Primero el que más esperó.
  assert.deepEqual(filas.map((f) => f.conversationId), ["c", "a"]);
  assert.equal(filas[1].texto, "¿Me pueden llamar?");
  assert.equal(filas[1].contactId, "c-a");
});

test("hoy: los detenidos y los perdidos no entran en la cola", () => {
  const filas = chatsQueEsperan([chat("a"), chat("b")], [msj("a", "entrante", "2026-11-10T11:00:00Z"), msj("b", "entrante", "2026-11-10T12:00:00Z")], new Set(["a"]));
  assert.deepEqual(filas.map((f) => f.conversationId), ["b"]);
});
