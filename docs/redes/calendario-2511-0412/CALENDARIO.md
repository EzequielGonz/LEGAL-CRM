# Calendario de redes · 25/11 al 04/12/2026

Este documento es solo planificación: **no se programó ni se publicó nada.** Del 20 al 24/11 queda lo que ya estaba programado, como grupo de control. Todos los horarios son de Buenos Aires.

Se armó con:
- `ESTRATEGIA-2026-11-20.md`, `DIAGNOSTICO-2026-11-20.md` y `analisis-2026-11-20/` (rendimiento por reel del 10 al 19/11, competencia y videos que rinden);
- las fichas `marcas.md` y `direccion-de-arte.md`;
- los textos aprobados el 10/11.

Decisiones de la responsable del 20/11 que se aplicaron:
1. **VITA suma laboral y penal.** Lo laboral es fuerte desde el 01/12 por el aguinaldo; el primer despido sale el 28/11 y el primer penal, el 29/11. Todo lo nuevo queda «pendiente: revisión profesional».
2. **Las 44 de Kocos en Instagram del 25 al 29/11 pasan a borrador.** Esos horarios los toman los reels del estilo nuevo.
3. **TikTok y YouTube Shorts quedan condicionales.** Los reels se suben ahí cuando existan las cuentas.
4. **Producción solo con el motor gratis**, llevado al máximo (Three.js, Remotion o GSAP, edge-tts). Nada de generadores pagos.
5. **Ningún texto dice «el botón está en el perfil»**, porque el botón no existe. El validador lo controla.
6. **Repeticiones controladas.** En VITA un mismo tema había salido hasta 8 veces en 10 días; ahora el tope es de **3 reels por tema y por marca**.
7. **Kocos, sin promesas ni cifras de resultados.** @kocosmkt tuvo 2 contenidos eliminados en octubre: no se usa la interfaz ni los logos de WhatsApp, Instagram o Google, y no se prometen ventas.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `calendario.csv` | Una fila por publicación: 316 filas con fecha, hora, marca, redes, formato, serie, tema, idea, gancho, palabra, cierre, referencia, revisión, versión y condición |
| `guiones/vita.md`, `coberturas.md`, `autos.md`, `kocos.md` | Guiones escena por escena de los 36 reels del 25, 26 y 27/11, más los carruseles de esos días y las pautas de sus historias |
| `generar.py` | Fuente del calendario: ideas y orden por día. Se cambia ahí y se vuelve a generar |
| `validar.py` y `resultado-validacion.txt` | Validador y su última salida |

## Volumen por marca y por día (igual en las 4 marcas)

| Día | Reels | Horarios de los reels | Historias (09:30 · 12:00 · 18:30 · 21:30) | Carrusel guía (11:00) |
| --- | --- | --- | --- | --- |
| Mié 25/11 | 3 | 08:30 · 13:30 · 20:30 | 4 | 1 |
| Jue 26/11 | 3 | igual | 4 | — |
| Vie 27/11 (Black Friday) | 3 | igual | 4 | 1 |
| Sáb 28/11 | 3 | igual | 4 | — |
| Dom 29/11 | 3 | igual | 4 | 1 |
| Lun 30/11 (Cyber Monday) | 3 | igual | 4 | — |
| Mar 01/12 | 4 | 08:30 · 13:30 · 17:00 · 20:30 | 4 | 1 |
| Mié 02/12 | 4 | igual | 4 | — |
| Jue 03/12 | 4 | igual | 4 | 1 |
| Vie 04/12 | 4 | igual | 4 | — |
| **Total por marca** | **34** | | **40** | **5** |

- **Más volumen de reels:** desde el 01/12 se puede pasar a 5 por día si el informe de ese día muestra mejor retención, es decir, tiempo medio de visualización por encima de 3 s y menos reels de Instagram en 0.
- **Historias:**
  - 09:30, encuesta: el resultado se muestra al día siguiente.
  - 12:00, dato o mito, con sticker de pregunta.
  - 18:30, lista de control o «detrás de escena» de la escena 3D, en días alternados.
  - 21:30, «respondé esta historia con PALABRA».
- **Redes:**
  - Los reels van a Instagram y Facebook, y a TikTok y YouTube Shorts cuando existan las cuentas.
  - Las historias y los carruseles van a Instagram y Facebook.

**Totales de las 4 marcas:** 136 reels, 160 historias y 20 carruseles, es decir, 316 publicaciones. Contando cada red por separado, son 632 en Instagram y Facebook, más 272 reels en TikTok y YouTube si se abren las cuentas.

## Comparación con el 10–19/11

| Por marca, en 10 días | 10–19/11 | 25/11–04/12 |
| --- | --- | --- |
| Reels | 50 | 34, todos con estilo nuevo |
| Ideas distintas en reels | pocas: en VITA un tema salió hasta 8 veces | 23 o 24, con un tope de 3 por tema |
| Repeticiones | la misma pieza a los 7 días | solo versiones A y B, con otro gancho, otra portada y otro orden, separadas 5 días o más |
| Posts sueltos | 20 | 0: no tuvieron alcance |
| Carruseles | 10 | 5, tipo guía para guardar |
| Historias | 20, con alcance 0 | 40, interactivas: encuesta, pregunta y respuesta |
| Cierre | «el botón está en el perfil» (el botón no existe) | «Comentá PALABRA» o «Respondé con PALABRA» |
| Duración del reel | sin dato medido | 20 a 25 s, según el análisis de videos (20 a 45 s en Instagram) |
| Primer segundo | título | tema escrito («ART:», «Monotributo:», «0 km:») y algo en movimiento |

Los reels bajan de 5 a 3 o 4 por día a propósito: con 0 a 3 seguidores, publicar mucho contenido parecido no se distribuía. El volumen se sube cuando los datos lo justifiquen.

## Series por marca (estética y sonido)

| Marca | Serie | Estética (motor gratis) | Objeto y sonido | Reels |
| --- | --- | --- | --- | --- |
| VITA | **El minuto después** | Diorama 3D en miniatura (esquina, ruta, taller) con el tiempo congelado, cámara que orbita y cronómetro dorado. Siluetas de maqueta sin rasgos | Cronómetro y golpe de sello | 16 |
| VITA | **Antes de firmar** | Escritorio azul noche con luz dorada lateral y un papel o un celular en primer plano. El sello dorado golpea con «ESPERÁ». Incluye «Te despidieron: los primeros 7 días» y «Te citaron: 3 cosas antes de ir» | Sello y papel | 18 |
| Coberturas | **La carta** | La carta o el aviso de la prepaga llega al celular. Una lupa menta recorre la letra chica y una barra crece | Lupa, vibración y «tic» | 23 |
| Coberturas | **Tu recibo explicado** | Recibo o cuota del monotributo en 3D (datos ficticios), que se despliega como acordeón | Lupa y papel | 10 |
| Coberturas | **Lo que dijo la Corte** | Titular con fuente y fecha, y 3 renglones de «qué te cambia» | Martillo de juez en verde | 1 (condicionado) |
| Autos | **El ticket del 0 km** | Una impresora de ticket suma renglones hasta «PRECIO LLAVE EN MANO». Las votaciones son pantallas partidas con cuenta regresiva. Autos en silueta sin logo | Llave que gira, motor e impresora | 26 |
| Autos | **Revisá esto al retirar** | Showroom nocturno en primera persona, pasos del 1 al 5 y luz rasante sobre la chapa | Linterna y puerta | 8 |
| Kocos | **El celular que no para** | Celular naranja 3D que vibra, burbujas que se apilan y un contador «sin responder», hasta un silencio de golpe cuando se arregla | Ping propio que se acelera | 14 |
| Kocos | **Antes / después** | Pantalla partida con barrido naranja: lo de antes, en gris y tachado | Barrido y ping | 20 |

**Voz:** edge-tts con las voces de Argentina (Elena para VITA y Coberturas, Tomás para Autos y Kocos), con prosodia conversacional: ritmo, pausas y entonación de pregunta. Va marcada como contenido hecho con IA. **Sin caras ni personas reales**: siluetas sin rasgos.

## Temas por marca (reels en los 10 días)

Los temas se priorizaron por las reproducciones promedio de los reels de Facebook del 10 al 19/11, y se sumó la agenda.

- **VITA:**
  - **Los que mejor rindieron:** trayecto 3 (171 reproducciones promedio, el 1.º), culpa 3 (116), primeras 24 h 3 (106) y «nunca digas» 3 (mejor retención: 3,0 s).
  - **Otros temas ya probados:** alta 3, ART 2.
  - **Temas flojos con un gancho nuevo:** sin seguro 2, firma 2 y daños 1.
  - **Nuevos, pendientes de revisión:** despido 2, aguinaldo 2, liquidación 1, trabajo no registrado 1, reforma laboral 1, carta documento 1, certificado de trabajo 1, penal 2 y choque con heridos y causa penal 1.
- **Coberturas:**
  - **Los que mejor rindieron:** monotributo 3 (71 reproducciones promedio y 3,0 s de retención), cambio de prepaga 3 (59) y aportes o recibo 3 (58).
  - **Aumento:** 3, uno condicionado al dato oficial.
  - **Temas flojos con un gancho nuevo:** cartilla 3, familia 2, preexistencia 2 y 65 años 2.
  - **Agenda nueva:** opción de cambio de obra social 3, prepagas dadas de baja 2, fallo de la Corte 1, aguinaldo 1, vacaciones 1, derivar aportes 1 y reintegros 1.
- **Autos:**
  - **Los que mejor rindieron:** usado 3 (210 reproducciones promedio, el 1.º), plan de ahorro 3 (180), anticipo o cuota 3 (161), votación de 0 km o usado 2 (161), retiro 3 (158) y llave en mano 3 (134).
  - **Agenda:** Black Friday 1, diciembre o enero 2 y patentamientos 1, condicionado.
  - **Nuevos, pendientes de revisión del equipo:** formas de pago 2, garantía 1, híbrido 1, documentación 1, gastos fijos 1 y primer viaje a la ruta 1.
- **Kocos:**
  - **Los que mejor rindieron:** consulta 3 (27 reproducciones promedio, el 1.º), precio 3, web 3, Google 3 y seguimiento 3.
  - **Agenda:** Black Friday y Cyber Monday 3, fiestas y mensaje de ausencia 3.
  - **Nuevos, pendientes de revisión del equipo:** checklist de diciembre, aguinaldo, reseñas, pedidos, mensajes de Instagram y estados.

## Lo condicionado y la actualidad

| Fecha | Marca | Pieza | Condición | Respaldo |
| --- | --- | --- | --- | --- |
| 26/11 13:30 | Coberturas | Lo que dijo la Corte | Revisión profesional del alcance del fallo antes del 25/11 a las 13:30 | «Tu obra social la podés elegir». El 01/12 a las 20:30 pasa a lugar de actualidad |
| 27/11 08:30 | Autos | Black Friday 0 km (reel y carrusel) | Visto bueno del equipo antes del 26/11 | Se adelanta «Cómo se adjudica un plan»; el carrusel pasa a «Tu usado como parte de pago» |
| 01/12 08:30 | Coberturas | Aumento de prepagas de diciembre | Porcentaje oficial publicado 24 h antes | «¿Pagás por cosas que no usás?» (B) |
| 03/12 08:30 | Autos | Patentamientos de noviembre (ACARA) | Ranking publicado 24 h antes | «¿Contado, prendario o plan?» |
| 03/12 17:00 | VITA · Kocos | Lugar de actualidad | Noticia del rubro con fuente en las 48 h anteriores | VITA: «Firma» (B). Kocos: «¿Tu web se ve bien en el celular?» |
| 04/12 17:00 y 20:30 | Coberturas · Autos | Lugar de actualidad | Igual que el anterior | Coberturas: reintegros. Autos: primer viaje a la ruta |
| Todo el período | Las 4 | TikTok y YouTube Shorts | Que existan las cuentas | Solo Instagram y Facebook |

## Revisión y aprobación antes de producir

- **Aprobado (texto del 10/11):** 220 publicaciones. Son textos que la responsable aprobó el 10/11 sin revisión profesional; se reutilizan con otro gancho y otra imagen.
- **Pendiente: revisión profesional:**
  - VITA: 31 publicaciones (13 reels), sobre laboral y penal.
  - Coberturas: 24 (11 reels).
- **Pendiente: revisión del equipo:**
  - Autos: 20 (9 reels).
  - Kocos: 17 (7 reels).
- **Condicionado a un dato oficial:** 4.
- **Fechas para no atrasar la producción:**
  - Las piezas pendientes del 28/11 al 01/12 necesitan la revisión antes del 26/11.
  - Las del 02 al 04/12, antes del 30/11.

## Palabras clave nuevas (hay que sumarlas al rol del bot)

Las demás palabras ya las conoce el bot (cargadas el 09/11). Estas son nuevas:
- **VITA:** DESPIDO, LIQUIDACION, AGUINALDO, REGISTRO, REFORMA, TELEGRAMA, CERTIFICADO y PENAL.
- **Coberturas:** BAJA y CORTE.
- **Autos:** ENERO.
- **Kocos:** CHECKLIST.

Los comentarios con palabra clave en Instagram y Facebook se responden a mano dentro del día: el bot atiende WhatsApp y no los comentarios.

## Riesgos

- **«Comentá PALABRA» y Facebook:** Facebook baja el alcance de los pedidos de comentarios que considera cebo («engagement bait»). Por eso el texto ofrece algo concreto («te respondemos», «te pasamos la lista») y no pide comentar por comentar. Si el informe del 01/12 muestra menos reproducciones en Facebook, el cierre de Facebook pasa a «Escribinos «PALABRA» por mensaje».
- **Lo jurídico y de coberturas sin revisión no sale.** Cada pieza pendiente tiene su respaldo aprobado.
- **Datos ficticios en recibos, chats y fichas:** nunca datos reales. El texto de la publicación aclara «Situación ilustrativa» cuando corresponde.

## Validación

Para correrla: `python3 generar.py && python3 validar.py`. Controla:
- el volumen y los horarios por día y por marca;
- los carruseles en sus días;
- que cada fila tenga palabra, revisión, gancho y cierre;
- que ningún texto mencione el botón;
- que las versiones B estén a 5 días o más de la A, con otro gancho;
- el tope de 3 reels por tema;
- que no haya historias iguales a menos de 5 días.

Última salida (20/11):

```
Validación de calendario.csv
- Filas: 316 · reels: 136 · historias: 160 · carruseles: 20
- Autos: 34 reels, 24 ideas distintas, 10 versiones B, tema más repetido: 3 veces
- Coberturas: 34 reels, 23 ideas distintas, 11 versiones B, tema más repetido: 3 veces
- Kocos Marketing: 34 reels, 24 ideas distintas, 10 versiones B, tema más repetido: 3 veces
- VITA: 34 reels, 24 ideas distintas, 10 versiones B, tema más repetido: 3 veces
- Revisión: aprobado (texto del 10/11): 220 · condicionado: dato oficial publicado: 4 · pendiente: revisión del equipo: 37 · pendiente: revisión profesional: 55
- Condicionados o de actualidad: 8
Resultado: OK, sin errores
```

## Decisiones que necesita la responsable

1. **Quién revisa lo jurídico (VITA) y lo de coberturas, y cuándo.**
   - Antes del 25/11 a las 13:30: el fallo de la Corte.
   - Antes del 26/11: las piezas de laboral y penal del 28/11 al 01/12.
2. **Visto bueno del equipo a las piezas nuevas de Autos y Kocos**, empezando por Black Friday, antes del 26/11.
3. **Sumar las 12 palabras clave nuevas al rol del bot**, sin tocar lo anterior.
4. **Quién responde a mano los comentarios con palabra clave**, todos los días.
5. **Confirmar que las 44 de Kocos ya están en borrador** antes de programar el 25/11. Esta tarea no tocó Metricool.
