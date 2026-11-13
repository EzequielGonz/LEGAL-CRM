import { test } from "node:test";
import assert from "node:assert/strict";
import { reclamoEnMensaje, senalDeAmenaza, senalDeQueja } from "../../src/lib/atencion/reclamos";
import { nivelDeInteres, puntajeDeInteres } from "../../src/lib/atencion/interes";

// 13/11 · una incidencia es un reclamo serio: amenaza legal contra nosotros o queja de un cliente captado.

test("reclamos: amenaza dirigida a quien le escribe", () => {
  for (const t of [
    "Los voy a denunciar por acosarme",
    "si me vuelven a escribir les mando carta documento",
    "Voy a denunciarlos en defensa del consumidor",
    "dejen de molestar o los denuncio",
    "Mi abogado los va a contactar",
    "Esto es acoso, voy a hacer la denuncia",
    "Si siguen llamando hago la denuncia en la policía",
    "LES VOY A MANDAR UNA CARTA DOCUMENTO",
  ]) {
    assert.ok(senalDeAmenaza(t), `tenía que marcar: ${t}`);
  }
});

test("reclamos: en Jurídico, denunciar a un tercero es la consulta, no una amenaza", () => {
  for (const t of [
    "Quiero denunciar a mi ART",
    "¿Me conviene hacer la demanda?",
    "Ya hice la denuncia policial del choque",
    "Me mandaron carta documento del trabajo",
    "Tuve un accidente y la aseguradora no me paga, quiero iniciar un juicio",
    "Mi abogado anterior no me contesta",
    "Me despidieron y quiero demandar a la empresa",
    "no me interesa, gracias",
    "",
  ]) {
    assert.equal(senalDeAmenaza(t), null, `no tenía que marcar: ${t}`);
  }
});

test("reclamos: queja de un cliente captado", () => {
  for (const t of ["Nadie me llamó todavía", "Sigo esperando que me contacten", "quedaron en llamarme ayer", "Pésima atención la verdad", "quiero hacer un reclamo", "hace dos semanas que espero"]) {
    assert.ok(senalDeQueja(t), `tenía que marcar: ${t}`);
  }
  for (const t of ["Gracias, espero el llamado", "Perfecto, mañana estoy", "¿A qué hora me llaman?"]) {
    assert.equal(senalDeQueja(t), null, `no tenía que marcar: ${t}`);
  }
});

test("reclamos: la queja solo es incidencia si la persona ya es cliente", () => {
  assert.equal(reclamoEnMensaje("nadie me llamó", { captado: false }), null, "de un prospecto es una conversación más");
  assert.equal(reclamoEnMensaje("nadie me llamó", { captado: true })?.tipo, "queja_cliente_captado");
  assert.equal(reclamoEnMensaje("los voy a denunciar", { captado: false })?.tipo, "amenaza_legal");
  assert.equal(reclamoEnMensaje("los voy a denunciar, nadie me llamó", { captado: true })?.tipo, "amenaza_legal", "la amenaza va primero");
  assert.equal(reclamoEnMensaje("no me escriban más", { captado: false }), null, "un pedido de no contacto no es incidencia");
  assert.equal(reclamoEnMensaje("son unos pesados, me tienen harto", { captado: false }), null, "el enojo no es incidencia");
});

test("interés: ordena a los que más cerca están de cerrar y dice por qué", () => {
  const ahora = new Date("2026-11-13T15:00:00Z");
  const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000);
  const alto = puntajeDeInteres({ ahora, motivo: "pide_persona", captado: false, entrantes: ["hola", "cuanto sale la cuota del cronos", "soy de moron, mi dni es 30123456"], ultimoEntranteAt: hace(2) });
  assert.equal(alto.puntaje, 100, "40 + 25 + 20 + 10 + 15, con tope en 100");
  assert.match(alto.porQue, /^Pidió hablar con una persona; preguntó precio o condiciones; dejó sus datos; escribió 3 veces; escribió en las últimas 24 horas\.$/);
  const medio = puntajeDeInteres({ ahora, motivo: null, captado: false, entrantes: ["me pueden llamar a la tarde?"], ultimoEntranteAt: hace(40) });
  assert.equal(medio.puntaje, 30);
  const bajo = puntajeDeInteres({ ahora, motivo: null, captado: false, entrantes: ["ok"], ultimoEntranteAt: hace(400) });
  assert.equal(bajo.puntaje, 0);
  assert.equal(bajo.porQue, "Respondió, sin señales claras de interés.");
  const captado = puntajeDeInteres({ ahora, motivo: "mensaje_posterior_captado", captado: true, entrantes: ["dale, mañana a las 10"], ultimoEntranteAt: hace(1) });
  assert.equal(captado.puntaje, 45);
  assert.ok(alto.puntaje > captado.puntaje && captado.puntaje > medio.puntaje && medio.puntaje > bajo.puntaje);
  assert.equal(nivelDeInteres(100), "alto");
  assert.equal(nivelDeInteres(45), "medio");
  assert.equal(nivelDeInteres(0), "bajo");
  assert.equal(nivelDeInteres(null), null);
});
