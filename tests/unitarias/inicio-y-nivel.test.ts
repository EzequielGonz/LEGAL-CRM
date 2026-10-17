import { test } from "node:test";
import assert from "node:assert/strict";
import { prioridadesDeInicio } from "@/lib/inicio";
import { nivelDe } from "@/lib/nivel";
import { consecuencias, faltaImprescindible, fechaProgramable } from "@/lib/contenido/guiado";

test("nivel: la primera entrada y cualquier valor desconocido abren en Simple", () => {
  assert.equal(nivelDe(undefined), "simple");
  assert.equal(nivelDe(""), "simple");
  assert.equal(nivelDe("experto"), "simple");
  assert.equal(nivelDe("avanzado"), "avanzado");
});

test("inicio: orden por urgencia, enlaces a la lista exacta y «Sin datos» ≠ 0", () => {
  const p = prioridadesDeInicio({
    conteos: { requiere_humano: 2, captado_sin_derivar: null, revision_pendiente: 0 },
    contenidoRetenido: 3,
    enlace: (c) => `/oportunidades?indicador=${c}`,
    enlaceContenido: "/contenido#c-acc",
  });
  assert.equal(p[0].clave, "requiere_humano");
  assert.equal(p[0].href, "/oportunidades?indicador=requiere_humano");
  assert.equal(p.find((x) => x.clave === "captado_sin_derivar")!.cantidad, null);
  assert.equal(p.find((x) => x.clave === "contenido_retenido")!.href, "/contenido#c-acc");
  assert.equal(p.find((x) => x.clave === "seguimiento_caido")!.cantidad, null);
});

test("contenido guiado: consecuencias distintas para borrador, programar y publicar", () => {
  const apagada = consecuencias({ publicable: false, retener: false, motivos: ["politica_apagada", "sin_destino"] });
  assert.equal(apagada.sePublicaria, false);
  assert.match(apagada.programar, /no se publica/);
  assert.equal(apagada.bloqueos.length, 2);
  assert.match(apagada.borrador, /No se programa ni se publica/);
  assert.match(apagada.publicar, /No hay «publicar ahora»/);
  const lista = consecuencias({ publicable: true, retener: false, motivos: [] });
  assert.equal(lista.sePublicaria, true);
  assert.match(lista.programar, /se publica sola/);
  // Un brief incompleto bloquea aunque la política esté habilitada.
  assert.equal(consecuencias({ publicable: true, retener: false, motivos: [] }, ["brief incompleto: tono"]).sePublicaria, false);
});

test("contenido guiado: lo que falta del brief lleva al campo exacto", () => {
  const f = faltaImprescindible(["tono", "logo (se usa un marcador neutro hasta recibirlo)", "color principal"]);
  assert.deepEqual(f.map((x) => x.ancla), ["brief-tono", "brief-color_principal"]);
});

test("contenido guiado: fechas programables entre 10 minutos y 90 días", () => {
  const ahora = new Date("2026-10-17T12:00:00Z");
  assert.equal(fechaProgramable("2026-10-17T12:05:00Z", ahora).ok, false);
  assert.equal(fechaProgramable("2026-10-18T12:00:00Z", ahora).ok, true);
  assert.equal(fechaProgramable("2027-03-01T12:00:00Z", ahora).ok, false);
  assert.equal(fechaProgramable("cualquier cosa", ahora).ok, false);
  assert.equal(fechaProgramable(undefined, ahora).ok, false);
});

test("ficha: siguiente paso según el estado, con la intervención humana primero", async () => {
  const { siguientePasoFicha } = await import("@/lib/inicio");
  assert.match(siguientePasoFicha({ attention_state: "requiere_humano", capture_state: "captado" }).texto, /respondé/);
  assert.equal(siguientePasoFicha({ capture_state: "captado", derivation_state: "no_derivado" }).urgente, true);
  assert.match(siguientePasoFicha({ capture_state: "captado", derivation_state: "derivado" }).texto, /registrá el resultado/);
  assert.match(siguientePasoFicha({ detenido: true, attention_state: "requiere_humano" }).texto, /detenido/);
  assert.match(siguientePasoFicha(null).texto, /no hay nada pendiente/);
});

test("estado corto: prioridad igual que el siguiente paso", async () => {
  const { estadoCorto } = await import("@/lib/inicio");
  assert.equal(estadoCorto({ detenido: true, attention_state: "requiere_humano" }).texto, "Detenido");
  assert.equal(estadoCorto({ attention_state: "requiere_humano", capture_state: "captado" }).texto, "Espera a una persona");
  assert.equal(estadoCorto({ capture_state: "captado", derivation_state: "no_derivado" }).tono, "atencion");
  assert.equal(estadoCorto({ capture_state: "captado", derivation_state: "derivado" }).texto, "Derivado");
  assert.equal(estadoCorto({ contact_state: "sin_contactar", capture_state: "nuevo" }).texto, "Sin contactar");
  assert.equal(estadoCorto({}).texto, "Sin contactar");
});
