import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aplicacionParaVolver,
  graficoVersiones,
  modeloEnPalabras,
  pedidoVersionDelAsistente,
  resumenPrueba,
  validarInstrucciones,
  variableDeProveedor,
  versionesDelPerfil,
  versionVigente,
} from "@/lib/laboratorio/simple";
import { proporciones, totalSemana, variacion } from "@/lib/asistente/semana-reglas";
import { nivelDeAccion, TIPOS_ACCION } from "@/lib/asistente/permisos";
import { DECLARACIONES_LABORATORIO } from "@/lib/laboratorio/asistente";
import { validarProveedor } from "@/lib/laboratorio/reglas";

const v = (version: number, extra: Record<string, unknown> = {}) => ({ version, nombre: `V${version}`, rubros: ["juridico"], modelo: null, laboratorio: version > 2, estado: "borrador", ...extra }) as any;

test("laboratorio simple: la que rige primero, después las nuevas del perfil, sin archivadas", () => {
  const lista = versionesDelPerfil([v(1), v(2), v(3), v(4, { rubros: ["marketing"] }), v(5, { estado: "archivada" }), v(6)], "juridico", 2);
  assert.deepEqual(lista.map((x) => [x.version, x.rige]), [[2, true], [6, false], [3, false]]);
  assert.equal(versionVigente([{ rubro: "juridico", version: 3 }], "juridico"), 3);
  assert.equal(versionVigente([], "marketing"), 2);
});

test("laboratorio simple: volver a la anterior usa el último cambio de versión del perfil", () => {
  const a = [
    { id: "a", tipo: "version_perfil", rubro: "juridico", aplicada_at: "2026-11-10T10:00:00Z" },
    { id: "b", tipo: "version_perfil", rubro: "juridico", aplicada_at: "2026-11-12T10:00:00Z" },
    { id: "c", tipo: "rol_perfil", rubro: "juridico", aplicada_at: "2026-11-13T10:00:00Z" },
    { id: "d", tipo: "version_perfil", rubro: "marketing", aplicada_at: "2026-11-14T10:00:00Z" },
  ];
  assert.equal(aplicacionParaVolver(a, "juridico")?.id, "b");
  assert.equal(aplicacionParaVolver(a, "agencia_0km"), null);
});

test("laboratorio simple: resumen corto de la prueba, primero lo que hay que mirar", () => {
  const r = resumenPrueba([
    { titulo: "Saludo", variante: "nueva", turnos: [{ rol: "persona", texto: "Hola" }, { rol: "bot", texto: "¡Hola! ¿En qué te ayudo?" }], evaluacion: { ok: true } },
    { titulo: "Precio", variante: "nueva", turnos: [{ rol: "persona", texto: "¿Cuánto sale?" }, { rol: "bot", texto: "Sale $5000" }], evaluacion: { ok: false, nota: "Mencionó un precio." } },
    { titulo: "Precio", variante: "activa", evaluacion: { ok: true } },
    { titulo: "Caída", variante: "nueva", error: "falló" },
  ]);
  assert.equal(r.bien, 1);
  assert.equal(r.revisar, 1);
  assert.equal(r.sinCorrer, 1);
  assert.match(r.frase, /^1 de 2 respuestas salieron bien/);
  assert.equal(r.ejemplos[0].titulo, "Precio");
  assert.equal(resumenPrueba([]).frase, "Todavía no hay respuestas para mostrar.");
});

test("laboratorio simple: gráfico con la que rige y las nuevas; avisa si no alcanza", () => {
  const c = (version: number, conversaciones: number, suficiente: boolean) => ({ version, conversaciones, tasa_sigue: 50, tasa_captacion: 10, tasa_escalado: 5, suficiente });
  const g = graficoVersiones([c(1, 10, true), c(2, 100, true), c(3, 5, false)], 2, { 3: "Breve" });
  assert.equal(g.metricas.length, 3);
  assert.deepEqual(g.metricas[0].barras.map((b) => b.version), [2, 3]);
  assert.match(g.metricas[0].barras[0].etiqueta, /rige ahora/);
  assert.equal(g.alcanza, false);
  assert.equal(graficoVersiones([c(2, 100, true), c(3, 80, true)], 2).alcanza, true);
  assert.equal(graficoVersiones([], 2).hayDatos, false);
});

test("laboratorio simple: la versión del asistente es copia de la que rige, solo del perfil, con modelo de la lista", () => {
  const r = pedidoVersionDelAsistente({ nombre: "Más breve", tono: "corto", fichas: [{ titulo: "Horario", frases: ["horario"], texto: "Atendemos de 9 a 18." }] }, "juridico", 2, ["gemini-2.5-flash"]);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.pedido.base_version, 2);
    assert.deepEqual(r.pedido.rubros, ["juridico"]);
    assert.equal((r.pedido.fichas as any[])[0].rubro, "juridico");
  }
  assert.equal(pedidoVersionDelAsistente({ nombre: "X1", modelo: "gemini-9-ultra" }, "juridico", 2, ["gemini-2.5-flash"]).ok, false);
  assert.equal(pedidoVersionDelAsistente({ nombre: "Nada" }, "juridico", 2, []).ok, false);
});

test("laboratorio simple: modelos con nombre amigable", () => {
  assert.match(modeloEnPalabras("gemini-2.5-flash-lite").nombre, /Liviano/);
  assert.match(modeloEnPalabras("gemini-2.5-flash").nombre, /Rápido/);
  assert.match(modeloEnPalabras("gemini-2.5-pro").nombre, /Completo/);
});

test("laboratorio simple: instrucciones del bot de base sin sumar teléfonos ni correos", () => {
  const base = "Sos el asistente del estudio. Respondé con amabilidad y preguntá el nombre. Tel del estudio 1100000000.";
  assert.equal(validarInstrucciones("corto").ok, false);
  assert.equal(validarInstrucciones(`${base} Agregado sin datos.`, base).ok, true, "el teléfono que ya estaba se conserva");
  assert.equal(validarInstrucciones(`${base} Escribí a alguien@ejemplo.com`, base).ok, false);
});

test("laboratorio simple: proveedor con la variable LAB_PROVEEDOR_ derivada del nombre", () => {
  const variable = variableDeProveedor("Otro Proveedor ñ");
  assert.equal(variable, "LAB_PROVEEDOR_OTRO_PROVEEDOR_N_API_KEY");
  assert.ok(validarProveedor({ nombre: "Otro", endpoint: "https://api.ejemplo.com/v1", variable_clave: variable }).ok);
});

test("laboratorio simple: herramientas del asistente y tipos de propuesta (un clic, nunca contacto)", () => {
  const nombres = DECLARACIONES_LABORATORIO.map((d) => d.name);
  for (const n of ["proponer_version_bot", "probar_version_bot", "proponer_usar_version", "proponer_volver_version"]) assert.ok(nombres.includes(n), n);
  for (const t of ["version_bot_crear", "version_bot_usar", "version_bot_volver"]) {
    assert.ok((TIPOS_ACCION as readonly string[]).includes(t), t);
    assert.equal(nivelDeAccion(t), "cambio");
  }
});

test("resumen de la semana: flecha y porcentaje contra la semana anterior", () => {
  assert.equal(variacion(12, 10).texto, "+20 %");
  assert.equal(variacion(5, 10).flecha, "baja");
  assert.equal(variacion(3, 3).texto, "igual");
  assert.equal(variacion(4, 0).texto, "nuevo");
  assert.equal(variacion(4, null).flecha, "sin_dato");
  const fila = (n: number | null) => Object.fromEntries(["enviados", "respondieron", "captados", "citas", "derivados", "campanas", "piden"].map((k) => [k, { actual: n, anterior: n }])) as any;
  assert.equal(totalSemana([fila(1), fila(2)]).captados.actual, 3);
  assert.equal(totalSemana([fila(1), fila(null)]).captados.actual, null, "si un perfil no se leyó, no hay total engañoso");
  assert.deepEqual(proporciones([10, 5, 0, null]), [100, 50, 0, 0]);
});
