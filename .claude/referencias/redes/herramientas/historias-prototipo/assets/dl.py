import json, os, sys, urllib.request, ssl
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'proto-reels'}), context=ctx).read()
for mid in ['alarm_clock_01', 'clipboard', 'street_lamp_01', 'concrete_road_barrier', 'office_notepads']:
    f = json.loads(get(f'https://api.polyhaven.com/files/{mid}'))
    g = f['gltf']['1k']['gltf']; os.makedirs(mid, exist_ok=True)
    open(f'{mid}/{mid}.gltf', 'wb').write(get(g['url']))
    for rel, inc in g['include'].items():
        p = os.path.join(mid, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(get(inc['url']))
    print('modelo', mid, len(g['include']))
for hid in ['studio_small_09', 'shanghai_bund', 'potsdamer_platz', 'brown_photostudio_02']:
    try:
        f = json.loads(get(f'https://api.polyhaven.com/files/{hid}')); u = f['hdri']['2k']['hdr']['url']
        open(f'{hid}_2k.hdr', 'wb').write(get(u)); print('hdri', hid)
    except Exception as e: print('falla', hid, e)
