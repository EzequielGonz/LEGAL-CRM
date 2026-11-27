# Ayuda para programar en tandas sin perder el hilo.
#   python3 tanda.py reg 9=421772032 10=421772063 ...   registra las líneas del lote con su id de Metricool
#   python3 tanda.py ver 17 24                          muestra esas líneas del lote listas para copiar
#   python3 tanda.py nuevo 40 2026-11-15                arma un lote nuevo (siguiente.py) y lo resume
import json, sys, subprocess
L = [json.loads(l) for l in open('lote.jsonl')] if sys.argv[1] != 'nuevo' else []
if sys.argv[1] == 'reg':
    args = []
    for par in sys.argv[2:]:
        n, i = par.split('='); j = L[int(n) - 1]
        args.append(f"{j['marca']}|{j['date'][:19]}|{j['tipo']}|{j['pieza']}|1|id {i}")
    print(subprocess.run(['python3', '-W', 'ignore', 'registrar.py', *args], capture_output=True, text=True).stdout.strip())
elif sys.argv[1] == 'ver':
    a, b = int(sys.argv[2]), int(sys.argv[3])
    for n in range(a, min(b, len(L)) + 1):
        j = L[n - 1]; print(f"### {n} {j['marca']} {j['tipo']} {j['pieza']} | {j['blogId']} | {j['date']}"); print(j['info'])
elif sys.argv[1] == 'nuevo':
    out = subprocess.run(['python3', 'siguiente.py', sys.argv[2], sys.argv[3]], capture_output=True, text=True).stdout
    open('lote.jsonl', 'w').write(out)
    L = [json.loads(l) for l in out.splitlines() if l.strip()]
    from collections import Counter
    print(len(L), 'en el lote;', dict(Counter(j['date'][:10] for j in L)), dict(Counter(j['marca'] for j in L)))
