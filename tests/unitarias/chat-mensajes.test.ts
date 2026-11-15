import test from "node:test";
import assert from "node:assert/strict";
import { COLUMNAS_HILO, LIMITE_HILO, enOrdenCronologico, ultimosMensajes } from "@/lib/chat-mensajes";

test("los últimos mensajes llegan del más nuevo al más viejo y se dan vuelta", () => {
  assert.deepEqual(enOrdenCronologico([{ id: 3 }, { id: 2 }, { id: 1 }]), [{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.deepEqual(enOrdenCronologico(null), []);
});

test("el hilo pide los últimos 300, en orden descendente, con las columnas que dibuja", async () => {
  const llamadas: Record<string, unknown> = {};
  const q: any = {
    select: (c: string) => ((llamadas.select = c), q),
    eq: (k: string, v: string) => ((llamadas.eq = [k, v]), q),
    order: (k: string, o: { ascending: boolean }) => ((llamadas.order = [k, o.ascending]), q),
    limit: (n: number) => ((llamadas.limit = n), Promise.resolve({ data: [{ id: "b" }, { id: "a" }] })),
  };
  const filas = await ultimosMensajes({ from: () => q }, "conv-ficticia");
  assert.deepEqual(filas.map((f) => f.id), ["a", "b"]);
  assert.equal(llamadas.limit, LIMITE_HILO);
  assert.deepEqual(llamadas.order, ["created_at", false]);
  assert.deepEqual(llamadas.eq, ["conversation_id", "conv-ficticia"]);
  for (const c of ["body", "metadata", "delivery_status", "delivery_error", "duplicate_of", "audio_texto_estado"]) assert.ok(COLUMNAS_HILO.includes(c), c);
});
