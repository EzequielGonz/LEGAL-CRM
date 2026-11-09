# Agrega al registro el resultado de cada pedido. Uso: python3 registrar.py 'marca|fecha|tipo|pieza|ok|detalle' ...
import json, sys, datetime
LEDGER = '/home/user/LEGAL-CRM/docs/redes/programadas.jsonl'
with open(LEDGER, 'a') as f:
    for a in sys.argv[1:]:
        m, fe, t, pz, ok, det = a.split('|', 5)
        f.write(json.dumps({'marca': m, 'fecha': fe, 'tipo': t, 'pieza': pz, 'ok': ok == '1', 'detalle': det,
                            'registrado': datetime.datetime.utcnow().isoformat(timespec='seconds') + 'Z'}, ensure_ascii=False) + '\n')
print(sum(1 for _ in open(LEDGER)), 'líneas en el registro')
