import asyncio, ssl, edge_tts, edge_tts.communicate as c, subprocess
c._SSL_CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
c.escape = lambda s: s
async def go(txt, out):
    await edge_tts.Communicate(txt, 'es-AR-TomasNeural').save(out)
    print(out, subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out],capture_output=True,text=True).stdout.strip())
asyncio.run(go("Ibas a trabajar, y te chocaron.", 'voz/t_plain.mp3'))
asyncio.run(go("Ibas a trabajar,<break time='600ms'/> <prosody rate='-25%' pitch='-8%'>y te chocaron.</prosody>", 'voz/t_ssml.mp3'))
asyncio.run(go("<emphasis level='strong'>Ojo</emphasis>: también puede ser un accidente laboral.", 'voz/t_emph.mp3'))
