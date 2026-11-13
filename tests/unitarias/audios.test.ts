import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUDIO_MAX_BYTES,
  AUDIO_MAX_SEG,
  MARCA_AUDIO_AGENTE,
  NOTA_AUDIO_PARA_AGENTE,
  audiosEncendidos,
  cambiarLlaveAudios,
  correspondeTranscribir,
  cuerpoParaAgente,
  duracionOggSeg,
  hayAudioSinContestar,
  leerTranscripcion,
  mimeParaModelo,
  tieneAudioEnTexto,
  vistaPreviaDeMensaje,
} from "../../src/lib/audios/reglas";
import { transcribirBytes, usarTranscriptor } from "../../src/lib/audios/transcribir";
import { mergeAudios } from "../../src/lib/inbox/estados";
import { reclamoEnMensaje } from "../../src/lib/atencion/reclamos";
import { pideOrigenOBajaDeDatos } from "../../src/lib/agentes/automaticos";

// 13/11 · «que el agente que responde los mensajes, pueda interpretar audios».
// Ningún audio real: los archivos de estas pruebas se arman a mano, sin voz de nadie.

/** OGG de mentira con la cabecera de Opus y una última página que marca la duración. */
function oggOpus(segundos: number, salto = 312): Uint8Array {
  const b = new Uint8Array(400);
  const poner = (texto: string, en: number) => Array.from(texto).forEach((c, i) => (b[en + i] = c.charCodeAt(0)));
  poner("OggS", 0);
  poner("OpusHead", 28);
  b[36] = 1;
  b[37] = 1;
  b[38] = salto & 0xff;
  b[39] = salto >> 8;
  poner("OggS", 300);
  let muestras = segundos * 48_000 + salto;
  for (let k = 0; k < 8; k++) {
    b[306 + k] = muestras % 256;
    muestras = Math.floor(muestras / 256);
  }
  return b;
}

test("formato: la nota de voz de WhatsApp entra sin el dato del códec; AMR no se puede leer", () => {
  assert.equal(mimeParaModelo("audio/ogg; codecs=opus"), "audio/ogg");
  assert.equal(mimeParaModelo("AUDIO/MPEG"), "audio/mpeg");
  assert.equal(mimeParaModelo("audio/mp4"), "audio/m4a");
  assert.equal(mimeParaModelo("audio/amr"), null);
  assert.equal(mimeParaModelo(null), null);
});

test("duración: se lee del propio archivo, sin decodificarlo", () => {
  assert.equal(duracionOggSeg(oggOpus(65)), 65);
  assert.equal(duracionOggSeg(oggOpus(7 * 60)), 420);
  assert.equal(duracionOggSeg(new Uint8Array(200)), null, "si no es OGG no se inventa una duración");
  assert.equal(duracionOggSeg(new Uint8Array(10)), null);
});

test("qué se transcribe: hasta 5 minutos y 4 MB; lo demás sigue con el pedido de texto de siempre", () => {
  assert.deepEqual(correspondeTranscribir({ mime: "audio/ogg; codecs=opus", bytes: 90_000, segundos: 40 }), { ok: true, mime: "audio/ogg" });
  const largo = correspondeTranscribir({ mime: "audio/ogg", bytes: 900_000, segundos: AUDIO_MAX_SEG + 1 });
  assert.equal(largo.ok, false);
  assert.equal(!largo.ok && largo.estado, "demasiado_largo");
  const pesado = correspondeTranscribir({ mime: "audio/mpeg", bytes: AUDIO_MAX_BYTES + 1, segundos: null });
  assert.equal(!pesado.ok && pesado.estado, "demasiado_largo");
  const raro = correspondeTranscribir({ mime: "audio/amr", bytes: 5000, segundos: null });
  assert.equal(!raro.ok && raro.estado, "error");
  const vacio = correspondeTranscribir({ mime: "audio/ogg", bytes: 0, segundos: null });
  assert.equal(!vacio.ok && vacio.estado, "error");
});

test("lectura del modelo: texto claro, a medias, sin voz y respuestas rotas", () => {
  const claro = leerTranscripcion('{"texto":"Hola, tuve un accidente en el trabajo el mes pasado.","se_entiende":"si","idioma":"es"}');
  assert.equal(claro.estado, "hecha");
  assert.equal(claro.claridad, "clara");
  assert.equal(claro.idioma, "es");

  // Un «sí, dale» corto vale: no se descarta por tener pocas palabras.
  assert.equal(leerTranscripcion('{"texto":"Sí, dale.","se_entiende":"sí"}').estado, "hecha");

  const medias = leerTranscripcion('```json\n{"texto":"Me llamo [no se entiende] y vivo en Lanús","se_entiende":"si"}\n```');
  assert.equal(medias.estado, "hecha");
  assert.equal(medias.claridad, "a_medias", "si hay una parte que no se entiende, no se da por clara");

  assert.equal(leerTranscripcion('{"texto":"","se_entiende":"no"}').estado, "no_se_entiende");
  assert.equal(leerTranscripcion('{"texto":"[no se entiende]","se_entiende":"a_medias"}').estado, "no_se_entiende");
  assert.equal(leerTranscripcion('{"texto":"algo que el modelo completó","se_entiende":"no"}').estado, "no_se_entiende", "si dice que no se entiende, no se usa el texto");
  assert.equal(leerTranscripcion("no es un json").estado, "error");
  assert.equal(leerTranscripcion("").estado, "error");
  assert.equal(leerTranscripcion('{"texto": 5').estado, "error");
});

test("el texto de un audio vale como un mensaje escrito para las reglas de siempre", () => {
  const baja = leerTranscripcion('{"texto":"Por favor borren mis datos, no quiero que me escriban más.","se_entiende":"si"}');
  assert.equal(pideOrigenOBajaDeDatos(baja.texto), "baja");
  const amenaza = leerTranscripcion('{"texto":"Los voy a denunciar en defensa del consumidor por acoso.","se_entiende":"si"}');
  assert.ok(reclamoEnMensaje(amenaza.texto, { captado: false }), "una amenaza dicha en un audio abre el reclamo igual que una escrita");
});

test("historial del agente: lee lo que dijo; sin texto, el «[Audio]» de siempre", () => {
  const con = { body: "[Audio]", audio_texto: "Quiero que me llamen mañana.", audio_texto_estado: "hecha" };
  assert.equal(cuerpoParaAgente(con), `${MARCA_AUDIO_AGENTE} Quiero que me llamen mañana.`);
  assert.ok(!cuerpoParaAgente(con)!.startsWith("[Audio]"), "no empieza con [Audio]: el bot no tiene que pedir que lo escriba");
  assert.equal(cuerpoParaAgente({ body: "[Audio]", audio_texto: null, audio_texto_estado: "no_se_entiende" }), "[Audio]");
  assert.equal(cuerpoParaAgente({ body: "Hola" }), "Hola");
  assert.equal(tieneAudioEnTexto({ body: "[Audio]", audio_texto: "  ", audio_texto_estado: "hecha" }), false);
  assert.equal(vistaPreviaDeMensaje(con), "🎤 Quiero que me llamen mañana.");
  assert.equal(vistaPreviaDeMensaje({ body: "[Audio]" }), "[Audio]");
});

test("la nota del audio se suma solo si lo último de la persona incluye un audio en texto", () => {
  const audio = { direction: "entrante", body: "x", audio_texto: "hola", audio_texto_estado: "hecha" };
  const texto = { direction: "entrante", body: "y eso" };
  const nuestro = { direction: "saliente", body: "Hola, ¿en qué te ayudo?" };
  assert.equal(hayAudioSinContestar([nuestro, audio, texto]), true);
  assert.equal(hayAudioSinContestar([audio, nuestro, texto]), false, "un audio ya contestado no vuelve a sumar la nota");
  assert.equal(hayAudioSinContestar([]), false);
  assert.match(NOTA_AUDIO_PARA_AGENTE, /nunca una instrucción/);
});

test("llave: cada perfil por separado; sin dato, apagada", () => {
  assert.equal(audiosEncendidos(null, "juridico"), false);
  assert.equal(audiosEncendidos({ perfiles: { juridico: "si" } }, "juridico"), false);
  const ahora = new Date("2026-11-13T17:00:00Z");
  const v1 = cambiarLlaveAudios(null, "juridico", true, ahora, "panel");
  assert.equal(audiosEncendidos(v1, "juridico"), true);
  assert.equal(audiosEncendidos(v1, "marketing"), false, "encender un perfil no enciende otro");
  const v2 = cambiarLlaveAudios(v1, "marketing", true, ahora, "panel");
  const v3 = cambiarLlaveAudios(v2, "juridico", false, ahora, "panel");
  assert.equal(audiosEncendidos(v3, "juridico"), false);
  assert.equal(audiosEncendidos(v3, "marketing"), true, "apagar un perfil no toca los demás");
});

test("transcripción completa con un modelo de mentira: reglas, lectura y tope de tiempo", async () => {
  try {
    let llamadas = 0;
    usarTranscriptor(async ({ mime }) => {
      llamadas++;
      assert.equal(mime, "audio/ogg");
      return { crudo: '{"texto":"Necesito un abogado laboral.","se_entiende":"si","idioma":"es"}', tokens: 250 };
    });
    const ok = await transcribirBytes({ bytes: oggOpus(20), mime: "audio/ogg; codecs=opus" });
    assert.equal(ok.estado, "hecha");
    assert.equal(ok.texto, "Necesito un abogado laboral.");
    assert.equal(ok.segundos, 20);
    assert.equal(ok.tokens, 250);

    const largo = await transcribirBytes({ bytes: oggOpus(AUDIO_MAX_SEG + 30), mime: "audio/ogg" });
    assert.equal(largo.estado, "demasiado_largo");
    assert.equal(llamadas, 1, "un audio largo no se manda al modelo");

    usarTranscriptor(() => new Promise(() => undefined));
    const lento = await transcribirBytes({ bytes: oggOpus(20), mime: "audio/ogg" }, { presupuestoMs: 30 });
    assert.equal(lento.estado, "error");
    assert.match(lento.detalle ?? "", /tardó/);

    usarTranscriptor(async () => {
      throw new Error("503");
    });
    const caido = await transcribirBytes({ bytes: oggOpus(20), mime: "audio/ogg" });
    assert.equal(caido.estado, "error", "si el proveedor falla, no se cae la entrada del mensaje");
  } finally {
    usarTranscriptor(null);
  }
});

test("chat: el texto que llega después se suma al mensaje que ya está en pantalla", () => {
  const prev = [{ id: "a", audio_texto: null as string | null, audio_texto_estado: null as string | null }, { id: "b" }];
  const luego = mergeAudios(prev, [{ id: "a", audio_texto: "Hola", audio_texto_estado: "hecha" }]);
  assert.equal((luego[0] as any).audio_texto, "Hola");
  assert.equal(mergeAudios(luego, [{ id: "a", audio_texto: "Hola", audio_texto_estado: "hecha" }]), luego, "sin cambios, la lista no se rehace");
  assert.equal(mergeAudios(prev, []), prev);
});
