import re,json,sys
t=open(sys.argv[1]).read()
sec=t[t.index('# PARTE X ·'):t.index('# PARTE XI ·')]
rubro=None; out=[]
for blk in re.split(r'\n(?=## |### )',sec):
    h=blk.split('\n',1)[0]
    if h.startswith('## '):
        n=h[3:].strip()
        rubro={'OBJECIONES TRANSVERSALES':'comun','ESTUDIO JURÍDICO VITA':'juridico','AUTOMOTORES KOCOS':'agencia_0km','COMPARA TU OBRA SOCIAL':'coberturas_medicas','KOCOS MARKETING':'marketing'}.get(n,rubro)
        continue
    m=re.match(r'### (O\d+) «(.+)»',h)
    if not m: continue
    def f(lbl):
        mm=re.search(r'\*\*'+lbl+r':\*\*\s*(.+)',blk); return mm.group(1).strip() if mm else None
    out.append(dict(id=m.group(1),rubro=rubro,frase=m.group(2),significados=f('Posibles significados'),pregunta=f('Pregunta que permite distinguir la objeción'),respuesta=f('Respuesta ilustrativa y contextual'),evitar=f('Error o práctica a evitar')))
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
print(len(out),{r:sum(1 for o in out if o['rubro']==r) for r in set(o['rubro'] for o in out)}, sum(1 for o in out if None in o.values()))
