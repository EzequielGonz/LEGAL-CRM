import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { aparece, normalizar, seleccionar, versionParaConversacion, MAX_CARACTERES, type ItemConocimiento, type RubroConocimiento } from "../../src/lib/conocimiento/seleccion";
import { veredicto, tasas, sumar, MINIMO_CONVERSACIONES } from "../../src/lib/conocimiento/estadisticas";

// El mismo contenido que carga la migración 0511 en cuatro partes (generada por docs/conocimiento/v2/generar.py): se lee del SQL.
function leerMigracion(): ItemConocimiento[] {
  const dir = join(__dirname, "../../supabase/migrations");
  const sql = readdirSync(dir).filter((f) => /^0511_conocimiento_v2_contenido_parte\d\.sql$/.test(f)).sort().map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
  const v = (x: string) => (x === "null" ? null : x.replace(/^\$k\$|\$k\$(::date)?$/g, ""));
  const filas = sql.split(/\n  \(2, /).slice(1);
  return filas.map((f) => {
    const campos = f.match(/\$k\$[\s\S]*?\$k\$|array\[[\s\S]*?\]::text\[\]|'\{\}'::text\[\]|null|true|false|\d+(?=\)(,|\non))/g) ?? [];
    const [clave, capa, rubro, titulo, disp, contenido, , , activo, orden] = campos;
    const disparadores = disp.startsWith("array[") ? [...disp.matchAll(/\$k\$([\s\S]*?)\$k\$/g)].map((m) => m[1]) : [];
    return { clave: v(clave)!, capa: v(capa) as any, rubro: v(rubro) as any, titulo: v(titulo)!, disparadores, contenido: v(contenido)!, activo: activo === "true", orden: Number(orden) };
  });
}
const ITEMS: ItemConocimiento[] = leerMigracion();
const sel = (rubro: RubroConocimiento, ...entrantes: string[]) => seleccionar({ items: ITEMS, rubro, entrantes });

test("el contenido v2 tiene 148 fichas (4 apagadas porque las resuelve una regla), base general y base de cada rubro", () => {
  assert.equal(ITEMS.filter((i) => i.capa === "objecion").length, 148);
  assert.deepEqual(ITEMS.filter((i) => i.capa === "objecion" && !i.activo).map((i) => i.clave).sort(), ["O002", "O003", "O014", "O018"]);
  assert.equal(ITEMS.filter((i) => i.capa === "general").length, 2);
  for (const r of ["juridico", "agencia_0km", "coberturas_medicas", "marketing"]) assert.ok(ITEMS.some((i) => i.capa === "rubro" && i.rubro === r), r);
  for (const i of ITEMS) assert.ok(i.contenido.length >= 10 && i.contenido.length <= 4000, i.clave);
});

test("normalizar y disparadores: tildes, palabras completas y prefijos", () => {
  assert.equal(normalizar("¿Está CARÍSIMO?"), "esta carisimo");
  assert.ok(aparece(normalizar("me quiero divorciar"), "divorci*"));
  assert.ok(!aparece(normalizar("se llama Carolina"), "caro"));
  assert.ok(aparece(normalizar("es caro"), "caro"));
});

test("siempre van la base general y la del rubro; nunca de otro rubro", () => {
  const s = sel("agencia_0km", "hola");
  assert.ok(s.claves.includes("general_venta") && s.claves.includes("general_seguridad") && s.claves.includes("autos_base"));
  const salud = sel("agencia_0km", "estoy embarazada y quiero saber si la prepaga me cubre la cirugía");
  for (const i of salud.items) assert.ok(i.rubro === null || i.rubro === "agencia_0km" || i.rubro === "comun", `${i.clave} es de ${i.rubro}`);
});

test("las fichas que resuelve una regla no se recuperan (origen y baja)", () => {
  const s = sel("juridico", "¿De dónde sacaron mi número? No me escriban más");
  assert.ok(!s.claves.includes("O002") && !s.claves.includes("O014"));
});

// Situaciones de la batería T01–T60 del Word: la pieza esperada tiene que llegar al bot.
const CASOS: [string, RubroConocimiento, string, string[]][] = [
  ["G04", "coberturas_medicas", "¿Sos un robot?", ["O004"]],
  ["G06", "marketing", "Solo quiero el precio, no me hagas preguntas", ["O017"]],
  ["G10", "agencia_0km", "Lo tengo que hablar con mi esposa", ["O010"]],
  ["G11", "juridico", "Me están apurando, no me presiones", ["O026"]],
  ["J01", "juridico", "La ART me dio el alta ayer y sigo con dolor", ["O029", "juridico_art"]],
  ["J02", "juridico", "La ART rechazó mi accidente", ["O030", "juridico_art"]],
  ["J03", "juridico", "Choqué, el seguro no responde y me llegó una carta documento", ["juridico_transito"]],
  ["J06", "juridico", "Detuvieron a mi hermano hace dos horas", ["O046", "juridico_penal"]],
  ["J08", "juridico", "La casa está a nombre de mi abuelo fallecido", ["O049", "juridico_sucesiones"]],
  ["J10", "juridico", "Ya tengo abogado", ["O036"]],
  ["J11", "juridico", "¿Cuánto voy a cobrar exacto por mi lesión?", ["O038"]],
  ["A01", "agencia_0km", "Me ofrecen una cuota más baja, ¿qué tasa tienen ustedes?", ["autos_financiacion"]],
  ["A02", "agencia_0km", "Me dijeron que con el plan me lo entregan en cuota 3", ["O079", "autos_financiacion"]],
  ["A03", "agencia_0km", "Me piden que transfiera la seña a un CBU", ["O074"]],
  ["A05", "agencia_0km", "Tengo Veraz, ¿me aprueban igual?", ["O064"]],
  ["A06", "agencia_0km", "¿Cuánto me toman el usado?", ["O066", "autos_usado_gastos"]],
  ["A11", "agencia_0km", "¿Cuánto gasta de combustible?", ["O081"]],
  ["S01", "coberturas_medicas", "Quiero conservar mi clínica", ["O090"]],
  ["S02", "coberturas_medicas", "Estoy en tratamiento y quiero cambiar porque es caro", ["O117", "salud_continuidad"]],
  ["S05", "coberturas_medicas", "Soy monotributista, ¿cualquier prepaga me toma?", ["O099", "salud_regimen"]],
  ["S06", "coberturas_medicas", "¿Hay carencia?", ["O105", "salud_regimen"]],
  ["S07", "coberturas_medicas", "Tengo una enfermedad preexistente", ["O094"]],
  ["M01", "marketing", "Tengo muchos leads pero no cierro", ["O132"]],
  ["M04", "marketing", "Quiero algo como Mercado Libre", ["O139"]],
  ["M07", "marketing", "No quiero compartir la contraseña de Facebook", ["O147"]],
  ["M11", "marketing", "¿Me garantizan estar primero en Google?", ["O141"]],
];
for (const [id, rubro, msg, esperado] of CASOS) {
  test(`batería ${id}: «${msg}» trae ${esperado.join(" y ")}`, () => {
    const s = sel(rubro, msg);
    for (const e of esperado) assert.ok(s.claves.includes(e), `faltó ${e}; vino ${s.claves.join(", ")}`);
  });
}

test("el bloque respeta el tope, dice que no cambia las reglas y no pasa de 3 fichas ni 2 temas", () => {
  const s = sel("juridico", "me echaron, trabajaba en negro, tuve un accidente yendo al trabajo, la ART me dio el alta, me llegó una carta documento y es caro");
  assert.ok(s.texto.length <= MAX_CARACTERES + 200);
  assert.match(s.texto, /no cambia las reglas del sistema/);
  assert.ok(s.items.filter((i) => i.capa === "objecion").length <= 3);
  assert.ok(s.items.filter((i) => i.capa === "tema").length <= 2);
});

test("el último mensaje pesa más que los anteriores", () => {
  const s = sel("agencia_0km", "¿Cuánto gasta de combustible?", "¿Me toman el usado?");
  assert.ok(s.claves.indexOf("O066") >= 0);
});

test("versión por conversación: sin asignación v1, sin comparar la vigente, con 50/50 estable y repartida", () => {
  assert.equal(versionParaConversacion(null, "x"), 1);
  assert.equal(versionParaConversacion({ version: 2, comparar_con: null, porcentaje: 100 }, "x"), 2);
  const a = { version: 2, comparar_con: 1, porcentaje: 50 };
  assert.equal(versionParaConversacion(a, "abc"), versionParaConversacion(a, "abc"));
  const ids = Array.from({ length: 400 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`);
  const dos = ids.filter((id) => versionParaConversacion(a, id) === 2).length;
  assert.ok(dos > 140 && dos < 260, String(dos));
});

test("veredicto: con pocos datos no declara ganador; con diferencia clara la informa", () => {
  const base = { turnos: 0, escalados: 0, detenidos: 0, retenidos: 0, tokens_promedio: null, latencia_promedio: null };
  const poco = veredicto({ ...base, version: 1, conversaciones: 10, siguieron: 5, captados: 1 }, { ...base, version: 2, conversaciones: 12, siguieron: 9, captados: 4 });
  assert.equal(poco.tono, "datos");
  assert.match(poco.texto, new RegExp(String(MINIMO_CONVERSACIONES)));
  const claro = veredicto({ ...base, version: 1, conversaciones: 400, siguieron: 160, captados: 20 }, { ...base, version: 2, conversaciones: 400, siguieron: 220, captados: 48 });
  assert.equal(claro.tono, "mejor");
  const igual = veredicto({ ...base, version: 1, conversaciones: 100, siguieron: 50, captados: 10 }, { ...base, version: 2, conversaciones: 100, siguieron: 52, captados: 11 });
  assert.equal(igual.tono, "igual");
  assert.equal(tasas(sumar([{ ...base, version: 2, conversaciones: 4, siguieron: 2, captados: 1 }], 2)).tasa_captacion, 25);
});
