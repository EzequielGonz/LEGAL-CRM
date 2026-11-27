# Tareas programadas de redes · ARRANQUE (leer esto primero)

Cada tarea programada del 27/11 al 07/12 empieza acá y sigue estos pasos en orden, sin esperar instrucciones. Todo lo que hace falta está en esta carpeta.

Repo `EzequielGonz/LEGAL-CRM`, rama `claude/brave-hawking-nzsr60`. Hay otra sesión trabajando en paralelo: tocar solo `docs/redes/`, el motor de reels (`.claude/referencias/redes/herramientas/historias-prototipo/`) y las líneas de redes del cerebro.

## Archivos de la carpeta

| Archivo | Para qué |
|---|---|
| `README.md` | Arranque, pasos y reglas duras (este archivo) |
| `01-ritmo-y-horarios.md` | Qué hay que tener publicado por marca y por día, y a qué hora |
| `02-analisis-y-calibracion.md` | Análisis de estadísticas, perfiles y competencia: antes y a mitad de cada corrida |
| `03-reels-motor-atlas.md` | Cómo se hace un reel, paso a paso, con los comandos |
| `04-posts-carruseles-historias.md` | Cómo se hacen el post, el carrusel y las historias |
| `05-alojar-y-programar.md` | Subir a la landing, comprobar y programar en Metricool |
| `06-calendario-de-corridas.md` | Las 21 corridas con fecha, hora e id, y su estado |

## Pasos de cada corrida

1. **Arranque (5 min).** Leé `cerebro/00-arranque-para-agentes.md`, esta carpeta entera y la última entrada del calendario (`06`). Si la corrida anterior dejó algo a medias, terminalo primero.
2. **Análisis previo** (`02`, parte A). Escribí `docs/redes/tanda-2811-0712/calibracion-<ddmm>-<hhmm>.md` y decidí qué cambia en esta corrida.
3. **Faltantes.** `getScheduledPosts` de las 4 marcas, desde hoy hasta el 07/12, cruzado con `docs/redes/programadas.jsonl`. Armá la tabla de lo que falta por día, marca y tipo contra el ritmo de `01`.
4. **Producción, primera mitad.** El primer reel de cada marca (guion con subagentes y render con `03`), para el día más cercano que tenga huecos.
5. **Análisis a mitad de corrida** (`02`, parte B). Mirá los números más nuevos y ajustá los guiones que faltan. Anotalo en la misma calibración.
6. **Producción, segunda mitad.** El segundo reel de cada marca y, si queda tiempo, los faltantes del día más cercano: más reels, post, carrusel e historias (`04`).
7. **Revisión antes de programar** (lista de abajo), alojamiento y programación (`05`).
8. **Cierre.**
   - Commit y push.
   - Marcá la corrida en `06` como hecha, con lo que se programó.
   - Actualizá `cerebro/traspaso-sesion-2026-11-27-redes.md`.
   - Informe al dueño con la verdad, en tabla corta: especificado, implementado, probado, publicado y programado, y qué no se pudo ver.

**Mínimo por corrida: 2 reels nuevos por marca, programados.** Si el tiempo no alcanza para todo, se cumple eso primero y lo demás queda anotado como faltante en `06`.

## Revisión antes de programar (cada pieza)

- [ ] El cierre dice solo **«Escribinos por WhatsApp.»** en la voz, en la placa final y en el copy. Sin palabra clave, sin «comentá», sin prometer guías.
- [ ] Nunca «El botón está en el perfil».
- [ ] El copy termina con «Situación ilustrativa. Voz generada con IA.». VITA suma «Información general: no reemplaza una consulta.».
- [ ] Rubros separados: cada pieza solo en su marca, con sus colores, su logo y sus hashtags.
- [ ] Nombres de marca: «Automotores Kocos» o «Autos Kocos» (nunca «Agencia Kocos»); «Kocos Marketing» (nunca «ORVIAN»).
- [ ] Sin caras reales y sin carteles de aclaración en los reels.
- [ ] Hora libre en la grilla (`01`) y sin duplicar lo que ya está en Metricool.
- [ ] El video responde 200 en la landing.

## Reglas duras

- **No se paga nada.** Nada de créditos, planes, publicidad, generadores ni servidores. ElevenLabs Starter ya está pago: se usa, pero sin comprar más. Si se acaba, voz gratis (`03`). Herramientas con créditos pagos (Manifold, Kling y similares): no.
- Nada se borra: se archiva o pasa a borrador.
- No tocar la bio ni el botón de las redes.
- Nunca claves, códigos ni datos de prospectos en archivos o mensajes.
- Lo que ya está programado no se toca: se completa alrededor.
- Usar todas las skills, subagentes y conectores que sumen, y decir cuáles se usaron. Para los guiones: subagentes con roles de editor, licenciado en marketing, estratega de redes y experto en copy, ganchos y retención (todos senior).
- Cuidar el consumo: una sola generación de voz por pieza.
