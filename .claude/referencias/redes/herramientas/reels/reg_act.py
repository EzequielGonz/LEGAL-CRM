# Anota en el registro las actualizaciones hechas en Metricool. Uso: python3 reg_act.py N=ID_NUEVO ...
# (N = número de la lista de actualizaciones.json). No borra la línea anterior: agrega una nueva con el motivo.
import json, sys, subprocess
A = json.load(open('actualizaciones.json'))
args = []
for par in sys.argv[1:]:
    n, i = par.split('='); o = A[int(n) - 1]
    args.append(f"{o['marca']}|{o['fecha']}|{o['tipo']}|{o['nuevo']}|1|id {i} (actualizada: antes {o['antes']}, id {o['id']}; repetía imagen a menos de 7 días)")
print(subprocess.run(['python3', '-W', 'ignore', 'registrar.py', *args], capture_output=True, text=True).stdout.strip())
