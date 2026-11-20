import asyncio, edge_tts, sys
import ssl, edge_tts.communicate as _c
_c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
T = "Ibas a trabajar, y te chocaron. Ojo: también puede ser un accidente laboral."
async def main():
    for v, r, p in [('es-AR-TomasNeural','+0%','+0Hz'),('es-AR-TomasNeural','+6%','-2Hz'),('es-AR-ElenaNeural','+0%','+0Hz'),('es-AR-ElenaNeural','+5%','+1Hz')]:
        c = edge_tts.Communicate(T, v, rate=r, pitch=p)
        await c.save(f"voz/edge-{v.split('-')[2]}-{r}-{p}.mp3")
asyncio.run(main())
