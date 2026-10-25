"""Genera v2.json y la migración de contenido a partir de contenido.py,
disparadores.py y fichas_origen.json (catálogo O001–O148 del Word).
Uso: python3 -I generar.py  (desde esta carpeta)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contenido import GENERAL, RUBRO, VERIFICADO  # noqa
from disparadores import D, NOTAS, EXCLUIDAS, NOTA_RUBRO  # noqa

aqui = os.path.dirname(os.path.abspath(__file__))
fichas = json.load(open(os.path.join(aqui, "fichas_origen.json")))
items = []
for i, g in enumerate(GENERAL):
    items.append(dict(clave=g["clave"], capa="general", rubro=None, titulo=g["titulo"], disparadores=[], contenido=g["contenido"].strip(), fuente=g["fuente"], verificado=g.get("verificado"), activo=True, orden=i))
for slug, lista in RUBRO.items():
    for i, r in enumerate(lista):
        items.append(dict(clave=r["clave"], capa=r["capa"], rubro=slug, titulo=r["titulo"], disparadores=r.get("disparadores", []), contenido=r["contenido"].strip(), fuente=r["fuente"], verificado=r.get("verificado"), activo=True, orden=i))
for i, f in enumerate(fichas):
    oid = f["id"]
    if oid not in D and oid not in EXCLUIDAS:
        raise SystemExit(f"Falta disparador para {oid}")
    partes = [f"«{f['frase']}». Puede ser: {f['significados']}", f"Para entender (si hace falta): «{f['pregunta']}»", f"Enfoque, con tus palabras: {f['respuesta']}", f"Evitá: {f['evitar']}"]
    nota = NOTAS.get(oid) or EXCLUIDAS.get(oid)
    if nota:
        partes.append(nota)
    if f["rubro"] in NOTA_RUBRO:
        partes.append(NOTA_RUBRO[f["rubro"]])
    items.append(dict(clave=oid, capa="objecion", rubro=f["rubro"], titulo=f["frase"], disparadores=D.get(oid, []), contenido="\n".join(partes), fuente=f"Biblioteca Maestra, ficha {oid}", verificado=None, activo=oid not in EXCLUIDAS, orden=i))

claves = [x["clave"] for x in items]
assert len(claves) == len(set(claves)), "claves repetidas"
json.dump(items, open(os.path.join(aqui, "v2.json"), "w"), ensure_ascii=False, indent=1)

def q(s):
    if s is None:
        return "null"
    assert "$k$" not in s
    return f"$k${s}$k$"
def arr(a):
    return "array[" + ",".join(q(x) for x in a) + "]::text[]" if a else "'{}'::text[]"
filas = []
for x in items:
    filas.append(f"  (2, {q(x['clave'])}, {q(x['capa'])}, {q(x['rubro'])}, {q(x['titulo'])}, {arr(x['disparadores'])}, {q(x['contenido'])}, {q(x['fuente'])}, {q(x['verificado']) + '::date' if x['verificado'] else 'null'}, {str(x['activo']).lower()}, {x['orden']})")
# Cuatro partes (así se aplicaron en la base: 0511_conocimiento_v2_contenido_parte1..4).
PARTES = 4
tam = -(-len(filas) // PARTES)
mig = os.path.join(aqui, "..", "..", "..", "supabase", "migrations")
for n in range(PARTES):
    trozo = filas[n * tam:(n + 1) * tam]
    sql = f"""-- 25/10 · Contenido de la versión 2 del conocimiento del bot (Biblioteca Maestra de Ventas), parte {n + 1} de {PARTES}.
-- Generado por docs/conocimiento/v2/generar.py. Repetible sin error: inserta lo que falta y
-- no pisa ítems que el equipo ya editó (on conflict do nothing).
-- En total {len(items)} ítems: {sum(1 for x in items if x['capa']=='general')} generales, {sum(1 for x in items if x['capa']=='rubro')} de base por rubro, {sum(1 for x in items if x['capa']=='tema')} temas, {sum(1 for x in items if x['capa']=='objecion')} fichas de objeción ({sum(1 for x in items if not x['activo'])} inactivas porque las resuelve una regla del sistema). Esta parte: {len(trozo)}.
insert into public.bot_knowledge_items (version, clave, capa, rubro, titulo, disparadores, contenido, fuente, verificado_el, activo, orden) values
""" + ",\n".join(trozo) + "\non conflict (version, clave) do nothing;\n"
    open(os.path.join(mig, f"0511_conocimiento_v2_contenido_parte{n + 1}.sql"), "w").write(sql)
print(len(items), "ítems;", sum(len(x["contenido"]) for x in items), "caracteres")
