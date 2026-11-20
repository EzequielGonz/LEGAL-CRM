# Cronograma x2 · 20/11 al 29/11/2026

**Qué es:** el calendario base (`../calendario-2511-0412/`) con el doble de publicaciones, corrido 5 días para que arranque hoy, 20/11. Es solo planificación: **no se programó ni se publicó nada** y la carpeta original no se tocó.

- Las 316 piezas del calendario base siguen igual, en su mismo día relativo (el día 1 del base, 25/11, ahora es el 20/11).
- Las 316 nuevas son variantes de esas piezas o *remakes* de los reels que mejor rindieron del 10 al 19/11.
- **Grupo de control:** lo que ya está programado en Metricool del 20 al 24/11 sale igual y este cronograma se suma. Para no pisarlo, esos días todo horario nuevo que coincide con el del grupo de control se corre 20 minutos (140 publicaciones).
- Todos los horarios son de Buenos Aires.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `calendario.csv` | 632 filas. Tiene las columnas del base más estas: <ul><li>`variante_de`: pieza madre.</li><li>`cambios`: qué cambia.</li><li>`personaje`, `lugar_ba`, `conflicto_seg1` y `giro_irreal`: la mini historia.</li></ul> En historias y carruseles, `conflicto_seg1` trae la idea en una línea y `giro_irreal`, el recurso visual. |
| `generar_x2.py` y `datos_x2.py` | `generar_x2.py` arma el calendario reutilizando `generar.py` e `historias.py` del base, que solo se leen. `datos_x2.py` tiene los ganchos, los remakes, los personajes, los lugares y los giros. |
| `validar_x2.py` y `resultado-validacion.txt` | Validador y su última salida: **0 errores**. Controla:<ul><li>los totales por formato, marca y día;</li><li>los horarios, incluido el corrimiento por el grupo de control;</li><li>los 5 días entre piezas de la misma idea y los más de 5 días de cada remake;</li><li>el tope de 6 por tema;</li><li>los textos prohibidos, los cierres y las columnas;</li><li>que todo esté aprobado y que no queden patentamientos ni aumento de prepagas;</li><li>que las 316 piezas del base sigan en su día.</li></ul> |

Para correrlo: `python3 generar_x2.py && python3 validar_x2.py`.

## Volumen por día y por marca (igual en las 4 marcas)

| Día | Reels | Historias | Carrusel | Total por marca | Total de las 4 marcas |
| --- | --- | --- | --- | --- | --- |
| Vie 20/11 al mié 25/11 (6 días) | 6 | 8 | 1 | 15 | 60 por día |
| Jue 26/11 al dom 29/11 (4 días) | 8 | 8 | 1 | 17 | 68 por día |
| **Total en 10 días** | **68** | **80** | **10** | **158** | **632** |

**Horarios:**

| Formato | Días | Horarios |
| --- | --- | --- |
| Reels | 21 al 25/11 | 08:30 · 10:30 · 13:30 · 16:30 · 19:00 · 20:30 |
| Reels | 26 al 29/11 | 07:30 · 09:00 · 10:30 · 12:00 · 13:30 · 17:00 · 19:00 · 20:30 |
| Historias | todos | 08:00 · 09:30 · 11:30 · 13:00 · 15:30 · 18:30 · 20:00 · 21:30 |
| Carrusel | todos | 11:00 |

Del 20 al 24/11 se corren 20 minutos:
- reels: 08:50 · 13:50 · 19:20 · 20:50;
- historias: 09:50 · 18:50;
- carrusel: 11:20.

**Totales:**
- 632 publicaciones: 272 reels, 320 historias y 40 carruseles.
- Contando Instagram y Facebook por separado, son **1.264**.
- Si se abren TikTok y YouTube Shorts, suman 544 subidas de reels más.

**Historias del día:**
- Mantienen los tipos del base: encuesta, dato o mito con pregunta, lista o «detrás de escena» y «Respondé esta historia con PALABRA».
- Las cuatro nuevas (08:00, 13:00, 15:30 y 20:00) acompañan a los reels nuevos de ese día.

## Cómo se hacen las variantes

| Qué cambia | Qué no cambia |
| --- | --- |
| Gancho escrito de nuevo: los primeros 3 segundos | Idea y mensaje |
| Portada | Palabra clave |
| Orden de escenas | Afirmaciones: las mismas de la pieza madre, aprobadas por la responsable el 20/11 |
| Apertura o giro irreal (los dos en las B nuevas) | Personaje y serie |
| Uno de estos: primer plano, música, cámara o paleta (dentro de la marca) | Cierre: «Comentá PALABRA» o «Respondé esta historia con PALABRA» |

- **Versión B:** una idea que en el base sale una sola vez. Son 46 reels nuevos.
- **Versión R (remake):** un reel del 10 al 19/11 rehecho en el estilo nuevo, con mini historia y personaje. Son 90. La columna `referencia` dice qué pieza vieja es, cuándo salió por última vez y cuántas reproducciones tuvo.
- **Regla de los 5 días:** dos piezas de la misma idea y el mismo formato nunca salen el mismo día ni a menos de 5 días.
  - Los remakes salen más de 5 días después de la última vez que salió su pieza vieja.
  - Ninguna variante repite el gancho ni el giro de su madre.
- **Tope:** 6 reels por tema y por marca en los 10 días. Cada marca llega al tope en varios temas: es el máximo posible con la regla de los 5 días.
- **Sin carteles en pantalla:** «Situación ilustrativa» o «Historia ilustrativa con personajes animados» van solo en el texto de la publicación. Cada fila lo aclara en `cierre`.
- **Sin precios, resultados ni promesas.** Ningún texto dice «el botón está en el perfil».

**Aviso:** Instagram reduce la distribución del contenido repetido o poco original. Por eso cada variante cambia los primeros 3 segundos, la portada y el orden, y la palabra clave sirve para medir qué versión trae consultas.

## Agenda y decisiones de la responsable (20/11)

**Todo quedó aprobado.** Eso incluye lo laboral y lo penal de VITA y «Lo que dijo la Corte» de Coberturas. Las 632 filas tienen `revision` = «aprobado por la responsable (20/11)», sin borradores ni condiciones de aprobación. En los textos se sacaron las marcas «(texto a revisar)».

| Fecha | Marca | Pieza | Qué se decidió |
| --- | --- | --- | --- |
| 21/11 13:50 | Coberturas | Lo que dijo la Corte | Aprobada, sale sin condición |
| 26/11 09:00 | Coberturas | Aumento de prepagas de diciembre | **No se hace.** En el mismo horario va «¿Pagás por cosas que no usás?» (plan-uso, versión B), y su encuesta de las 09:30 cambia igual |
| 27/11 09:00 y 11:00 | Autos | Black Friday (reel y carrusel) | **Sí se hace**, el día de Black Friday y sin números reales: precio llave en mano y oferta por escrito |
| 27/11 12:00 | Kocos | Remake «Hoy es Black Friday: 200 chats…» | Fijado al día de Black Friday |
| 28/11 08:30 | Autos | Patentamientos de ACARA | **No se hace.** En el mismo horario va «¿Contado, prendario o plan?» |
| 28 y 29/11, 17:00 y 20:30 | Las 4 | Lugares de actualidad | Única condición que queda, igual que en el base: si hay una noticia del rubro con fuente en las 48 h previas, va esa; si no, la pieza prevista |

- **Cyber Monday (30/11):** queda fuera del período. Las piezas de Kocos que lo nombran salen antes, como anticipo.
- **TikTok y YouTube Shorts:** siguen condicionados a que existan las cuentas.

**Textos que hay que desarrollar en la producción:** algunas historias del base traían solo el título del tema, con la marca «texto a revisar». Ahora quedan como tema sin la marca, por ejemplo «Lo que pocos saben: Aportes sobre el aguinaldo». Antes de animarlas, se escriben con los datos aprobados del tema.

## Ideas por marca (los 5 mejores conceptos)

**VITA**
1. **TRAYECTO.** Nico choca a 3 cuadras del depósito, en Av. Sáenz y Perito Moreno. La moto queda congelada en el aire y la cámara la rodea en 360°.
2. **FIRMA.** Le deslizan a Nico un acuerdo «para firmar hoy» en un bar de Pompeya. Él queda diminuto sobre un contrato gigante, cae una lapicera enorme y él cae entre las hojas hasta su sillón.
3. **ART.** Sole abre la carta con «rechazado» en su cocina de Floresta. La carta se despliega como una alfombra kilométrica.
4. **CHOQUE.** Golpe de chapa en Av. Montes de Oca y un cronómetro dorado de 24 h crece hasta tapar la avenida.
5. **CULPA.** Sole, el cúter y «fue culpa mía». El sello dorado cae del cielo como un meteorito con «ESPERÁ».

**Coberturas**
1. **MONO.** La cuota del monotributo de Lucía se parte como una pizza y una porción vuela hasta la obra social.
2. **APORTES.** El recibo de Gabriel se despliega en acordeón hasta el techo y el «3 %» cae como una moneda gigante.
3. **COMPARAR.** El aviso de aumento le llega a Vero mientras corta el pan. Una barra sale del celular y crece como un rascacielos.
4. **65.** Elsa sopla las velas y la torta se vuelve un calendario que gira hacia atrás los años de antigüedad.
5. **CARTILLA.** Guardia a las 2 de la mañana: la sala de espera se estira como un túnel infinito.

**Autos**
1. **LLAVE.** El ticket de Leo sale sin parar, cruza el showroom y llega a Av. Juan B. Justo.
2. **0KM.** Juli quiere un 0 km y Mati, un usado. La pantalla partida se rompe como un vidrio.
3. **USADO.** «El gris» sube como en un elevador de taller y la carpeta del service hace la diferencia.
4. **SORTEO.** Le prometen a Mati el auto «en la cuota 2» y un bombo de sorteo gigante rueda por la cuadra.
5. **LLAVE · Black Friday (27/11).** Tres preguntas antes de entusiasmarte, sin números reales: precio llave en mano y oferta por escrito.

**Kocos Marketing**
1. **ORDEN.** Hoy es Black Friday: el celular naranja vibra tan fuerte que la torta queda suspendida en el aire.
2. **CRM.** 21:03: las agujas del reloj de Dulce Almagro vuelan hasta el sillón de Romina.
3. **RESPUESTAS.** Entra un «¿precio?» y la respuesta «por privado» se congela en escarcha.
4. **BIO.** El link de la bio lleva a la torta de Pascuas del año pasado.
5. **GOOGLE.** Un pin de mapa gigante cae sobre Almagro y la cámara baja en picada hasta la vidriera.

## Lo que hubo que resolver

- **Faltaron ideas de los temas pedidos para los remakes.** El tope de 6 por tema y la regla de los 5 días no alcanzan para llenar todo con los temas que pidió la responsable. Primero se llenaron esos temas hasta el tope y después se siguió con los siguientes del 10 al 19/11:
  - VITA: alta, «nunca digas», daños, sin seguro y firma.
  - Coberturas: aumento, preexistencia, familia, 65 y cartilla.
  - Autos: retiro, llave en mano, seguro y sorteo.
  - Kocos: bio, precio, web, seguimiento, Google, ausencia, chats y API.
- **Temas derivados en Coberturas y Autos.** Para llegar al total exacto se usaron 5 remakes de piezas viejas con un tema derivado, como ya hacía el base:
  - Coberturas: carencias (de «cambio»), plan a medida (de «aumento») y opción de cambio (de «recibo»);
  - Autos: primer 0 km (de «anticipo»).
- **Variantes antes que su madre.** Algunas variantes B salen antes que su pieza madre, siempre a 5 días o más. Pasa cuando la madre está entre el 25 y el 29/11. Por ejemplo, «aguinaldo-anticipo» sale el 20/11 y su madre, el 26/11.
- **Lo laboral y lo penal se adelanta.** Algunas variantes de despido, aguinaldo y penal salen antes del primer despido y el primer penal del base, que ahora son el 23/11 y el 24/11. Ya están aprobadas.
- **No se conoce el contenido del grupo de control.** El cronograma no comprueba la regla de los 5 días contra lo programado del 20 al 24/11. Antes de programar, hay que mirarlo en Metricool con `getScheduledPosts`.
- **Producción.** Son 136 reels más que en el base. Los del 20 y 21/11 son los más ajustados para el motor propio.
- **Fechas, horas e `idea_id` congelados.** Otros agentes ya producen y programan desde `calendario.csv`. Después de las decisiones del 20/11 solo cambiaron:
  - los textos;
  - la revisión;
  - las condiciones que se levantaron;
  - las 2 filas del aumento de prepagas: el reel y su encuesta, en los mismos horarios.
