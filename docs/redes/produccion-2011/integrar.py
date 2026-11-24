#!/usr/bin/env python3
"""Integra las entregas de las sesiones en la nube (ramas claude/redes-*) en las landings.

Para cada fila de manifiesto con estado=renderizado (o alojado sin registro), copia
entregas/<tramo>/<id>.mp4 y .jpg de la rama a apps/web/public/redes/2011/ de la landing
de la marca (main), hace commit y push por landing, comprueba que la URL responda 200 y
anota la fila en registro.csv con estado=alojado. Programar en Metricool lo hace la
sesión principal con las filas de registro.csv en estado=alojado.

Uso: python3 docs/redes/produccion-2011/integrar.py [--sin-push]
"""
import csv, io, os, subprocess, sys, time, urllib.request, ssl

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(RAIZ, '..', '..', '..'))
HOME = os.path.dirname(REPO)
REG = os.path.join(RAIZ, 'registro.csv')
MARCAS = {
    'vita': ('estudio-juridico-vita-final', 'www.estudiojuridicovita.com', 7549864),
    'cob': ('coberturas-sociales-landing', 'www.comparatuobrasocial.com', 7549939),
    'autos': ('0km-kocos-agencia', 'www.autoskocos.com', 7552104),
    'mkt': ('agencia-kocos-mkt', 'www.kocosmkt.com', 7242607),
}
TRAMOS = [f'{m}-{n}' for m in MARCAS for n in (1, 2)]
CAMPOS = ['tramo', 'id', 'fecha', 'hora', 'marca', 'blogId', 'video_url', 'portada_url', 'palabra', 'texto', 'estado', 'metricool_id']


def sh(*a, cwd=REPO, check=True, binario=False):
    r = subprocess.run(a, cwd=cwd, capture_output=True)
    if check and r.returncode:
        raise RuntimeError(f"{' '.join(a)}: {r.stderr.decode()[-400:]}")
    return r.stdout if binario else r.stdout.decode()


def registro():
    if not os.path.exists(REG):
        return {}
    return {(r['tramo'], r['id']): r for r in csv.DictReader(open(REG, newline=''))}


def guardar(reg):
    with open(REG, 'w', newline='') as f:
        w = csv.DictWriter(f, CAMPOS); w.writeheader()
        for r in sorted(reg.values(), key=lambda r: (r['fecha'], r['hora'], r['tramo'])):
            w.writerow({k: r.get(k, '') for k in CAMPOS})


def ok200(url):
    ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt') if os.path.exists('/root/.ccr/ca-bundle.crt') else None
    try:
        req = urllib.request.Request(url, method='HEAD')
        return urllib.request.urlopen(req, timeout=20, context=ctx).status == 200
    except Exception:
        return False


def main():
    push = '--sin-push' not in sys.argv
    reg = registro()
    ramas = [f'claude/redes-{t}' for t in TRAMOS]
    for b in ramas:
        sh('git', 'fetch', '-q', 'origin', f'+{b}:refs/remotes/origin/{b}', check=False)
    nuevos = {m: [] for m in MARCAS}
    for t in TRAMOS:
        b = f'origin/claude/redes-{t}'
        man = sh('git', 'show', f'{b}:docs/redes/produccion-2011/manifiestos/{t}.csv', check=False)
        if not man.strip():
            continue
        for r in csv.DictReader(io.StringIO(man)):
            rid = (r.get('id') or '').strip(); m = t.split('-')[0]
            est = r.get('estado', '').strip()
            if rid and (t, rid) in reg and est == 'programado' and r.get('metricool_id'):
                reg[(t, rid)].update(estado='programado', metricool_id=r['metricool_id'], fecha=r.get('fecha', ''), hora=r.get('hora', ''))
            if not rid or (t, rid) in reg or est not in ('renderizado', 'producido', 'alojado'):
                continue
            landing, sitio, blog = MARCAS[m]
            dst = os.path.join(HOME, landing, 'apps/web/public/redes/2011')
            os.makedirs(dst, exist_ok=True)
            try:
                for ext in ('mp4', 'jpg'):
                    data = None
                    for carpeta in ('entregas', 'salidas', 'salida', 'media'):
                        try:
                            data = sh('git', 'show', f'{b}:docs/redes/produccion-2011/{carpeta}/{t}/{rid}.{ext}', binario=True); break
                        except RuntimeError:
                            pass
                    if data is None:
                        raise RuntimeError(f'no está {rid}.{ext}')
                    open(os.path.join(dst, f'{rid}.{ext}'), 'wb').write(data)
            except RuntimeError as e:
                print(f'FALTA {t} {rid}: {e}'); continue
            fila = {k: r.get(k, '') for k in CAMPOS}
            fila.update(tramo=t, id=rid, blogId=str(blog), estado='copiado',
                        video_url=f'https://{sitio}/redes/2011/{rid}.mp4', portada_url=f'https://{sitio}/redes/2011/{rid}.jpg')
            reg[(t, rid)] = fila; nuevos[m].append(rid)
    for m, ids in nuevos.items():
        if not ids or not push:
            continue
        landing = os.path.join(HOME, MARCAS[m][0])
        sh('git', 'add', 'apps/web/public/redes/2011', cwd=landing)
        sh('git', 'commit', '-qm', f'Redes: reels del cronograma ({", ".join(ids)})', cwd=landing)
        for i in range(4):
            sh('git', 'pull', '-q', '--rebase', 'origin', 'main', cwd=landing, check=False)
            if subprocess.run(['git', 'push', '-q', 'origin', 'main'], cwd=landing).returncode == 0:
                break
            time.sleep(2 ** (i + 1))
        print(f'{m}: subidos {len(ids)}')
    # comprobar URLs de lo copiado
    pend = [r for r in reg.values() if r['estado'] == 'copiado']
    if pend and push:
        time.sleep(75)
    for r in pend:
        if ok200(r['video_url']) and ok200(r['portada_url']):
            r['estado'] = 'alojado'
    guardar(reg)
    por = {}
    for r in reg.values():
        por[r['estado']] = por.get(r['estado'], 0) + 1
    print('registro:', por)
    for r in sorted(reg.values(), key=lambda r: (r['fecha'], r['hora'])):
        if r['estado'] == 'alojado':
            print('A PROGRAMAR', r['fecha'], r['hora'], r['tramo'], r['id'], r['video_url'])


if __name__ == '__main__':
    main()
