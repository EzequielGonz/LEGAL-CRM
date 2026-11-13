// Genera el cuerpo y 40 variantes de cada plantilla de inicio y escribe el SQL.
// Uso: node docs/mejoras-1311/generar-variantes.mjs
import { writeFileSync } from "node:fs";
import { PLANTILLAS } from "./plantillas-inicio.mjs";

const CANTIDAD = 40;
const PERMITIDAS = new Set(["nombre", "asesor", "marca"]);

function partes(spintax) {
  const out = [];
  const re = /\[([^\[\]]*)\]/g;
  let i = 0, m;
  while ((m = re.exec(spintax))) {
    if (m.index > i) out.push([spintax.slice(i, m.index)]);
    out.push(m[1].split("|"));
    i = m.index + m[0].length;
  }
  if (i < spintax.length) out.push([spintax.slice(i)]);
  return out;
}

// Generador determinista (mismo resultado en cada corrida).
function azar(semilla) {
  let a = 0;
  for (const c of semilla) a = (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function armar(ps, eleccion) {
  let k = 0;
  return ps.map((p) => (p.length === 1 ? p[0] : p[eleccion[k++]])).join("");
}

function variantesDe(t) {
  const ps = partes(t.spintax);
  const grupos = ps.filter((p) => p.length > 1);
  const total = grupos.reduce((n, g) => n * g.length, 1);
  if (total < CANTIDAD + 1) throw new Error(`${t.nombre}: solo ${total} combinaciones`);
  const base = grupos.map(() => 0);
  const cuerpo = armar(ps, base);
  const r = azar(t.nombre);
  // Candidatas: muchas elecciones al azar; se eligen las 40 más distintas entre sí
  // (y del cuerpo), para que cada mensaje cambie en varios lugares a la vez.
  const candidatas = new Map();
  for (let i = 0; i < 4000 && candidatas.size < Math.min(total - 1, 1500); i++) {
    const e = grupos.map((g) => Math.floor(r() * g.length));
    if (e.every((x) => x === 0)) continue;
    candidatas.set(e.join(","), e);
  }
  const lista = [...candidatas.values()];
  const dist = (a, b) => a.reduce((n, x, i) => n + (x !== b[i] ? 1 : 0), 0);
  const elegidas = [];
  const minimo = lista.map((e) => dist(e, base));
  while (elegidas.length < CANTIDAD) {
    let mejor = -1;
    for (let i = 0; i < lista.length; i++) if (minimo[i] > 0 && (mejor < 0 || minimo[i] > minimo[mejor])) mejor = i;
    if (mejor < 0) throw new Error(`${t.nombre}: no alcanzan las candidatas`);
    const e = lista[mejor];
    elegidas.push(e);
    for (let i = 0; i < lista.length; i++) minimo[i] = Math.min(minimo[i], dist(lista[i], e));
  }
  const variantes = elegidas.map((e) => armar(ps, e));
  // Comprobaciones.
  const todas = [cuerpo, ...variantes];
  if (new Set(todas).size !== todas.length) throw new Error(`${t.nombre}: variantes repetidas`);
  for (const x of todas) {
    if (/[\[\]]/.test(x)) throw new Error(`${t.nombre}: quedó un corchete`);
    for (const m of x.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)) if (!PERMITIDAS.has(m[1])) throw new Error(`${t.nombre}: variable ${m[1]}`);
    if (/\{(?!\{)|(?<!\})\}/.test(x.replace(/\{\{[a-z]+\}\}/g, ""))) throw new Error(`${t.nombre}: llave suelta`);
    if (/ {2}| ,| \./.test(x)) throw new Error(`${t.nombre}: espacios o signos sueltos en «${x.slice(0, 60)}»`);
    if (x.length > 1000) throw new Error(`${t.nombre}: demasiado largo`);
  }
  return { cuerpo, variantes, total };
}

const q = (s) => `'${s.replace(/'/g, "''")}'`;
const sql = [
  "-- Plantillas de inicio de Wasender (13/11): 10 por perfil, 40 variantes cada una.",
  "-- Generado por docs/mejoras-1311/generar-variantes.mjs. Repetible sin error.",
  "-- A las que ya existían solo se les SUMAN variantes (el cuerpo no cambia y las",
  "-- variantes que tenían se conservan); las nuevas se crean si no existen.",
];
const resumen = {};
const muestra = [];
for (const [slug, lista] of Object.entries(PLANTILLAS)) {
  if (lista.length !== 10) throw new Error(`${slug}: ${lista.length} plantillas`);
  resumen[slug] = [];
  for (const t of lista) {
    const v = variantesDe(t);
    resumen[slug].push({ nombre: t.nombre, existente: t.existente, combinaciones: v.total });
    muestra.push(`## ${slug} · ${t.nombre}${t.existente ? "" : " (nueva)"} — ${t.angulo}\n\n${v.cuerpo}\n\nVariantes de ejemplo:\n- ${v.variantes[0].replace(/\n/g, " ⏎ ")}\n- ${v.variantes[19].replace(/\n/g, " ⏎ ")}\n- ${v.variantes[39].replace(/\n/g, " ⏎ ")}\n`);
    const json = q(JSON.stringify(v.variantes));
    const rubro = `(select id from public.rubros where slug = ${q(slug)})`;
    if (t.existente) {
      sql.push(
        `update public.wasender_plantillas p set variantes = (select jsonb_agg(x.v order by x.orden) from (select distinct on (e.v) e.v, e.orden from jsonb_array_elements_text(coalesce(p.variantes, '[]'::jsonb) || ${json}::jsonb) with ordinality as e(v, orden) order by e.v, e.orden) x), grupo = 'inicio', activa = true, updated_at = now() where p.rubro_id = ${rubro} and p.nombre = ${q(t.nombre)} and p.archivada_at is null and p.cuerpo = ${q(v.cuerpo)};`
      );
    } else {
      sql.push(
        `insert into public.wasender_plantillas (rubro_id, nombre, uso, cuerpo, variantes, activa, origen, grupo) select ${rubro}, ${q(t.nombre)}, 'campana', ${q(v.cuerpo)}, ${json}::jsonb, true, 'panel', 'inicio' where not exists (select 1 from public.wasender_plantillas where rubro_id = ${rubro} and nombre = ${q(t.nombre)});`
      );
    }
  }
}
const aqui = new URL(".", import.meta.url).pathname;
writeFileSync(aqui + "plantillas-inicio.sql", sql.join("\n") + "\n");
writeFileSync(aqui + "PLANTILLAS-INICIO.md", `# Plantillas de inicio por Wasender · 13/11\n\n10 por perfil. Cada una tiene su texto base y 40 variantes con cambios mínimos (saludo, verbo, conectores, cierre). Acá va el texto base y tres variantes de muestra de cada una; las 40 se ven en Líneas y plantillas → Plantillas de Wasender.\n\n${muestra.join("\n")}`);
console.log(JSON.stringify(resumen));
