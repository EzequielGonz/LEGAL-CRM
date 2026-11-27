# Reels con el motor Atlas, paso a paso

Carpeta del motor: `.claude/referencias/redes/herramientas/historias-prototipo/atlas/` (de acá en adelante, `atlas/`).

Contrato guion ↔ escena: `docs/redes/tanda-2811-0712/tanda1/CONTRATO.md`. Ahí están el formato del plan, los objetos de cada marca y los 12 efectos.

| Marca | Escena | Estilo |
|---|---|---|
| VITA | `escenas/vita.js` | Teatrito de cartulina con Nico |
| Coberturas | `escenas/coberturas.js` | Plastilina |
| Autos | `escenas/autos.js` | Estudio de producto |
| Marketing | `escenas/marketing.js` | Cartel de paletas de aeropuerto |

## 1. Guion (subagentes)

- Un subagente guionista por marca, con roles senior de editor, marketing, estrategia de redes y copy, ganchos y retención. Cada uno recibe:
  - la calibración de la corrida (`02`);
  - los planes que ya existen, para no repetir tema;
  - el contrato.
- Escribe `atlas/planes/<marca>-<ddmm>-<letra>.json`. Letras: `a` y `b` son de la tanda base; las corridas usan `c` en adelante.
- Voz de 50 a 68 palabras (20 a 25 s). La primera frase es el gancho; la última empalma con la primera (loop).
- **Cierre: «Escribinos por WhatsApp.»** en la voz, `"cierre": "Escribinos por WhatsApp"` y lo mismo en el copy. Sin palabra clave para comentar.
- `palabra` queda solo como palabra del sello o del contenido (por ejemplo, NUNCA o FALSO).
- Validar cada plan antes de grabar: cada `beats[].palabra` tiene que aparecer en la voz.

## 2. Voz

- ElevenLabs `creative_generate_speech`, modelo `eleven_flash_v2_5`, `generations_count: 1`. Nunca repetir la llamada para reintentar.
- Voces: Claudiio `hVXoK5zuQfMOQB7NrIFY` (VITA), Sol `ijxn8I4NzJccD2Sa7lcj` (Coberturas), Franco `jbWMqMKDKL7X0v1DXTHH` (Autos) y Santo `CNBiCLtxaJJKQwl4Hq2q` (Marketing).
- Esperar con `creative_get_flow_run_status` y bajar el audio. Después, ffmpeg con `atempo=1.12` y 0,5 s de silencio al principio, a `atlas/audio/<id>-voz.wav`.
- Al empezar, `account_get_usage`. Si quedan menos de 3.000 caracteres, la voz pasa a la gratis (edge-tts con `voz.py`) y se avisa en el informe. **No se compran créditos.**

## 3. Tiempos de cada palabra

```bash
cd .claude/referencias/redes/herramientas/historias-prototipo/atlas
```

- Escribir `audio/<id>-palabras.json` con `{id, voz_fin, total: voz_fin + 1.2, palabras, textos, palabra, gancho}`. Como base, el formato de `voz.py`.
- Después:

```bash
python3 alinear.py <id> "<voz>" audio/<id>-voz.wav
```

## 4. Prueba de cuadros, render y mezcla

```bash
RAPIDO=1 node render.js <id> prueba 1 6 12 18 24
```

- Mirá las imágenes de `prueba/`: gancho visible desde el cuadro 1, nada cortado, karaoke legible y placa final «escribinos por / WhatsApp».

```bash
RAPIDO=1 node render.js <id> 30 3
```

- Unos 5 min por reel. Se pueden correr 2 reels a la vez.

```bash
python3 mezcla.py <id>
```

```bash
ffmpeg -y -framerate 30 -i fr/<id>/%05d.jpg -i audio/<id>-mezcla.wav -c:v libx264 -crf 21 -maxrate 14M -bufsize 28M -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart out/<id>.mp4
```

- Tapa: un cuadro del gancho con ffmpeg a `out/<id>.jpg`.
- Antes de subir, mirá 3 cuadros del mp4 final (principio, medio y cierre).

## Notas

- Las carpetas `audio/`, `fr/`, `prueba/`, `out/` y `fonts/` no van en git. Si faltan las fuentes, se bajan de `raw.githubusercontent.com/google/fonts`.
- No levantar `python3 -m http.server`: Playwright entrega los archivos solo.
- Capacidad: 8 reels por corrida son 40 a 60 min de máquina.
