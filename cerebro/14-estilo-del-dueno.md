---
description: Cómo trabaja y qué espera el dueño del proyecto. Comunicación, diseño, reels por marca, voz de cada marca, autorizaciones y errores que lo molestaron. Cada ejemplo con su fuente.
actualizado: 21/11/2026
fuentes: chats volcados en cerebro/chats/ (Code, Cowork y Claude común), historiales subidos el 21/11 (reels, Cowork, exportación de Claude común), 02-ordenes-vigentes.md, 12-preguntas-para-entender.md, 13-lo-aprendido-de-los-chats.md, .claude/referencias/redes/, .ai-context/
---

# Estilo del dueño

Para que cualquier sesión futura de Claude trabaje como a él le gusta. Si algo de acá choca con `02-ordenes-vigentes.md` o con una orden nueva, manda lo más nuevo.

## Quién es

- Son **dos dueños, desarrolladores**, que entran al panel desde PC y celular. **El que escribe en los chats es hombre** (lo aclaró el 21/11 al responder «productora»; ver `02-ordenes-vigentes.md`, bloque B).
- Regla práctica: **nunca en femenino** y nunca «el dueño», «la usuaria» ni «productora». Usá «el dueño» o «los dueños», o hablale directo con voseo. Los documentos viejos del cerebro y de `cerebro/chats/` siguen diciendo «el dueño»: es un error heredado, no un dato. No los copies.
- Del otro dueño no está confirmado el género: si dudás de quién habla o decide, «los dueños».
- Entienden código, pero **piden explicaciones simples**. Quieren decidir ellos lo de negocio (campañas, plata, publicidad) y que Claude haga el resto de punta a punta.

## Cómo leer las fuentes de este archivo

| Sigla | Qué es |
| --- | --- |
| C-redes | `cerebro/chats/2026-11-20-code-perfiles-redes-vita.md` (órdenes textuales del 20/11, boceto de VITA y calendario doble) |
| C-ctx | `cerebro/chats/2026-11-01-code-contexto-del-proyecto.md` (órdenes de agosto a noviembre: reels, landings, bot) |
| C-traspaso | `cerebro/chats/2026-11-13-code-traspaso-legal-crm.md` (13 a 15/11: bots, Wasender, laboratorio, asistente) |
| C-panel | `cerebro/chats/2026-11-19-code-rediseno-panel-juridico.md` (19/11: pedido de simplificar Hoy y Chats) |
| 02 / 12 / 13 | `cerebro/02-ordenes-vigentes.md`, `12-preguntas-para-entender.md`, `13-lo-aprendido-de-los-chats.md` |
| H-reels | Historial subido el 21/11 «2026-10-21-claude-redes-reels-crm» (chat del 24/10: primeros bocetos de reels) |
| H-cowork | Historiales de Cowork subidos el 21/11 (`historial-completo-chat_N.md`: 1 Etapa 2/Gemini, 4 rediseño del panel, 6 CRM y Kocos, 7 landings/redes, 8 bot 24/10) |
| H-claude | Exportación de datos de Claude común (`conversations.json`): chats de septiembre a noviembre |
| Redes | `.claude/referencias/redes/` y `.ai-context/` |

Límite de lo que leí: los mensajes de las sesiones de Code de la nube se leyeron por los volcados de `cerebro/chats/` y por las páginas de eventos que alcanzaron a traer los mensajes directos (la lista mezcla resultados de herramientas y es muy ruidosa). El texto crudo del pedido del 21/11 de la esfera de partículas no lo vi: viene del encargo de este archivo.

---

## 1. Cómo se comunica y qué espera de Claude

### Cómo escribe

- Mensajes cortos, en minúscula, sin vueltas, a veces con errores de tipeo. Ejemplos: «retoma y finaliza» (21/11, sesión de reels), «retoma», «dale», «arranca», «listo, segui donde quedaste y termina» (C-traspaso, 15/11).
- Cuando algo importa, **escribe en mayúsculas**: «NO TOQUES NI ALTERES NADA DE LO QUE YA EXISTE» (H-claude, 20/11, pedido del asistente IA); «DAME TODOS LOS REPOSITORIOS QUE TENES CONECTADOS TAMBIEN» (C-ctx, 20/11 08:35).
- Pide **todo en un mismo mensaje largo** con varias órdenes numeradas o seguidas (C-panel, 19/11: 16 órdenes en un solo mensaje; C-traspaso, 14/11 06:11 y 07:17). Claude tiene que contestar punto por punto y no perder ninguno.
- Responde las preguntas de Claude con **una frase**, a veces con «no entiendo»: «no entiendo nada, ¿qué queda en borrador? ¿Por qué frenarías?» (C-redes, 20/11 06:02); «no entiendo...» (H-cowork, chat 1, contestando un formulario de opciones).

### Qué espera

- **Ejecución, no consulta.** «Ejecuta y aplica los puntos 1 a 5» (C-traspaso, 14/11); «listo aplica las tres propuestas recomendadas» (15/11); «Pero lo estás ejecutando así? Arranca es dale» (15/11 07:36); «publicá todo» (14/11 08:36). Si hay una decisión de negocio, Claude propone y él contesta con una palabra.
- **Rol de agencia premium y de ingeniero senior, con todo lo disponible.** «usa todos los skills plugins y conectores que tenes disponibles… toma el rol de experto en diseño, software, programador, ingeniero, todo todo senior» (H-claude, 20/11). «usa subagentes que hagan tareas por vos y orquesta todo, como si fueses el cerebro». «las skills asignadas solo por las reglas no, todas todas, incluso propone nuevas». «no hay límites con eso, las reglas viejas olvidalas». Está en `CLAUDE.md`.
- **Velocidad y continuidad.** «hacelo rápido, no releas todo. retoma. graciasss» (H-claude, 20/11); «respondeme simple sin leer todo para ahorrar» (C-traspaso, 15/11 05:42). Para eso existe el cerebro: leer lo mínimo (`README.md`, 02, 07, 08) y seguir derecho.
- **Que termine solo, sin frenar.** «Empeza con el bloque 1 aplicalo y termina con todos los bloques sin frenar» (C-traspaso, 15/11 05:34); «no frenes» dos veces el 24/10 (H-cowork, chat 8); «bueno decile que arranque… que no frene, lo haga de corrido con el mismo modelo» (H-cowork, chat 1).
- **Que se cuide el consumo.** Pregunta seguido cuánto tarda y cuánto cuesta («cuánto tardás aprox para terminar esto», «9 horas sigue siendo muchísimo», «¿qué es tanto lo que se hizo… que tarda tanto?», H-cowork chat 1 y C-traspaso 13/11 19:13). Si se corta por el límite, quiere que Claude **frene, deje un checkpoint y programe la retoma**: «cuando detectes eso, frena, deja un checkpoint y programa para cuando se reestablezca el límite» (C-redes, 20/11 07:23; el 21/11 hay una tarea programada de retoma).
- **Checkpoints guardados a detalle.** «guarda todo a detalle 100% detalle que compacto la sesión» (C-redes, 20/11 06:06); «antes que usar un chat nuevo, guarda todo para compactar esta sesión» (06:24). Commit y push sin que lo pida (`02`).
- **Informes que digan la verdad del estado.** Especificado, implementado, probado, publicado, habilitado, con la versión comprobada (`02`, `CLAUDE.md`). Corrigió una vez que «un despliegue READY solo acredita el despliegue» (H-cowork, chat 4).

### Qué le molesta (ver también la sección 6)

- Que Claude **pregunte lo que ya está en el repo o en las instrucciones**: «Ya está todo hecho en las indicaciones de los agentes eso… ¿no lo viste?» (C-traspaso, 14/11 07:17); «pero si ya tenés logos, paleta de colores, todo» (H-reels, 24/10); «no tengo nada, fijate vos» (24/10).
- Que Claude **frene o proponga bajar el ritmo**: «no no bajamos ningún ritmo, pegamos o pegamos» (C-redes, 20/11 06:06).
- Que Claude **se ponga técnico o enrede**: «demasiado complicado… no sé ni cómo usarlo» (laboratorio del bot, 15/11 08:40); «no entendí» (09/11 06:46, C-ctx).
- Que le den **proceso en vez de resultado**: «Nada de ZIP ni paquetes para el programador» (19/10, `02`); «mandarme capturas no hace falta en el bloque 2» (H-cowork, chat 1).

### Cómo corrige

- **Directo y corto, con el contraejemplo.** «No hay nada programado.» (08/11 07:34, cuando Claude dijo que sí había piezas); «no me gusta nada, ni el estilo del contenido, ni la fuente, ni los dibujos, no hay voz, no hay nada premium» (08/11 08:22); «Son horribles. Parecen hechas por un niño» (06/10, flyers de otro proyecto; H-claude).
- **Dice qué quería en su lugar, casi siempre al mismo tiempo.** «ORVIAN NO, KOCOS MARKETING ES» (19/10, H-cowork chat 7). «En metricool no tenemos acceso a la API» (mismo chat). «Dejalo así como está» (aviso «estará disponible próximamente»).
- **Pisa su propia orden vieja con la nueva** y espera que Claude no mezcle: «las reglas viejas olvidalas»; la regla es «manda la más nueva» (`02`). Ejemplo: el 15/11 08:23 pidió verificaciones «rápidas, no tan exhaustivas» después de haber pedido un análisis «totalmente exhaustivo» a las 05:03 (C-traspaso).
- **Cambia una decisión de Claude a favor de publicar:** «black friday mandale, pero sin números reales… el resto todooo subí y publicá todo» (C-redes, 20/11 06:06).
- A veces **frena y pide control**: «Frená un segundo, dejate un punto de retorno» (24/10, H-cowork chat 8) y «ok hacé un checkpoint hasta acá, no hagas más nada» (C-redes, 20/11 06:21). Ahí Claude deja el punto de retorno y no sigue.

---

## 2. Estilo de diseño (panel, landings, páginas)

### Lo que le gusta

- **Premium, con «factor wow», nada genérico ni «hecho por IA».** «no tiene un diseño premium… buscale la vuelta al diseño de las landing» (09/11 11:52, C-ctx). «muchos detalles así en las landing los hacen parecer muy hechas por IA… sigue viéndose muy IA» (09/11 06:58). Pidió pensar como «desarrollador UI UX profesional, diseñador gráfico profesional» (09/11 08:52).
- **Panel llamativo, con vidrio y profundidad (13/11).** «bien llamativo»: vidrio, 3D, tarjetas que se inclinan, fondos animados, cifras que cuentan, gráficos con relieve. Referencia: el Instagram code.xr y su Topmate («Glassy Dashboard/Sidebar/Navigation Tabs»). **Modo oscuro por defecto** (`02`, panel y diseño; C-traspaso 13/11). Esto **reemplaza** el rediseño de octubre «sin 3D, paleta neutra» (`chats/2026-10-17-cowork-rediseno-panel-simple-avanzado.md`).
- **Reel de una esfera de partículas con palabras resaltadas en un recuadro (21/11).** Pidió una página con ese estilo (referencia que él trae del reel; texto crudo del pedido no leído). Cómo tomarlo: es el nivel de dirección de arte que busca, una sola idea visual grande (la esfera), palabras clave que se prenden dentro de un recuadro, mucho movimiento y profundidad. Antecedente en el repo: el plan del ingreso con lámpara protagonista y partículas (`docs/rediseno/PLAN.md`). Se toma como recurso, no se copia el reel.
- **Que el estilo de cada marca se reconozca.** Para la referencia visual de Automotores Kocos mandó 6 láminas de carrusel: fondo azul marino, títulos en mayúsculas gruesas, números con contorno, indicador de progreso (H-reels, 24/10).
- **Mucho más definido, 4K.** «si puede ser en 4k ultra hd mejor aún»; «los personajes y animaciones que tengan mucha más definición calidad y resolución» (C-redes, 20/11 04:47 y 04:49). Logo o nombre del rubro siempre que se pueda (04:48).
- **Lo que ya existe y anda, se respeta.** «conservando totalmente el diseño y animaciones generales, emprolijalos» (08/11 08:40); «no toques nada del diseño» (28/09, SEO de VITA, H-claude); «Incidencias dejarlo tal cual como está / Contactos / Campañas, dejarlo tal como está» (C-panel, 19/11, puntos 13 a 15).

### Lo que rechazó

| Qué hizo Claude | Qué dijo / qué quería | Fuente |
| --- | --- | --- |
| Landings con fotos genéricas y header flojo | «el header de vita está horrible… las fotos que tiene son horribles… autoskocos también sigue siendo genérica» | C-ctx, 09/11 08:52 |
| Piezas con números de página (01/05), etiquetas chicas sobre el título y línea decorativa | Sacarlos y subir a «estilo más premium, como un editor profesional» | C-ctx, 08/11 07:46 |
| Cartel de CTA en historias que no lleva a nada | «No sirve, no te lleva a nada, ahí perderíamos clientes» | C-ctx, 08/11 07:56 |
| Laboratorio del bot con formularios técnicos, muchas secciones | «demasiado complicado… esta demasiado técnico, con funciones que no sirven»; «no, lo técnico tampoco va escondido, simplificalo con gráficos sencillos, fáciles de leer» | C-traspaso, 15/11 08:40 y 08:41 |
| Selector Simple/Avanzado en el panel | Lo avanzado en desplegables; mismo menú en los 4 perfiles | `02` |
| Hoy con «personas, no mensajes», chip «Bot 35 de 100», «También hoy» y «En vivo» | «sacarlo», «eso sacarlo», «sería algo innecesario» | C-panel, 19/11, órdenes 1, 4, 5, 7 |
| «Ver los 13» que no llevaba a la lista | Que lleve al listado de captados para derivar | C-panel, orden 6 |
| «Todos los chats» con problemas de margen y padding | Arreglarlo (se verifica desde su Chrome) | C-panel, orden 10 |
| Flyers de AutosMix (otro proyecto) | «Son horribles. Parecen hechas por un niño»; «RE-HACELOS TODOS DE NUEVO»; dio un estilo de referencia | H-claude, 06/10 (AutosMix está fuera del proyecto, pero muestra el gusto) |
| Reels de prueba: texto sobre fondo de color, sin voz ni música | Rehacerlos con el estilo de las láminas de cada marca | H-reels, 24/10 |

### Cómo pide un diseño

1. Da una **referencia concreta** (una cuenta de Instagram, un reel, una lámina).
2. Pide **«con todo lo disponible»** (skills, plugins, agentes, herramientas de diseño).
3. Espera **un solo perfil/rubro primero** y después los demás con el mismo motor (ver sección 3).
4. Recorre desde su Chrome o pide capturas: «para verificarlo podés entrar al panel desde mi Chrome» (C-panel, orden 10). Si Claude no puede entrar, lo dice y no afirma que verificó.

---

## 3. Reels y contenido por marca

### Flujo vigente (decidido 21/11, `02` bloques F a J)

**Boceto de un solo rubro (reel, posteo, carrusel o historia) → el dueño aprueba el diseño → se produce → se programa en Metricool.**
- Ejemplo del flujo completo: «Paso 1, boceto: hacé el boceto de UN solo perfil, VITA» → «el concepto me gusta, toda la base está perfecta, pero hay que pulir muchísimo más» → «listo, todo eso publicalo y programalo en metricool, pero que sea del 20/11, que empiece ya» (C-redes, 20/11 04:30, 05:33, 05:41). Esa última frase se tomó como el «aprobado».
- El 20/11 05:38 recordó: «acordate que esto es solo un boceto de un solo rubro, hay otros 3 rubros más». Un boceto por rubro **no** es lo que quiere (`02`, tabla «Lo que no quiere»).
- **Producción solo si lo pide o da permiso.** Hasta nuevo aviso el cerebro trabaja en solo lectura (`02`, 21/11 tarde).
- Referencias de reels: «las pasa después» (21/11). Hasta entonces la referencia es julianeaborna (recursos, no copia).

### Formato y duración

- Mini historia animada, **20 a 40 s**, 1080×1920, 30 fps; 4K (2160×3840) cuando se pueda (`02`, C-redes 04:47; Redes `direccion-de-arte.md`). El 24/10 los reels de prueba eran de 19 s y los de la tanda vieja de ~15 s: se superaron.
- **Personajes animados, guion, una ciudad (Buenos Aires), una historia creíble.** **Sin caras reales ni personas grabadas.** «no vamos a grabar a nadie, hacelo tipo dibujo en 4k» (C-ctx, 08/11 07:32). La auditoría de Chrome del 20/11 propuso cara real y se rechazó (`02`).
- Voz rioplatense natural. Se aprobó el formato con voz: «me encantó el nuevo formato de reels, con voz» (C-ctx, 09/11 07:44; cuando faltaba en VITA pidió sumarla).
- **Logo y nombre de la marca en todas las piezas** (C-redes, 04:48).
- **Sin carteles en pantalla**: nada de «Situación ilustrativa» ni «Voz generada con IA» dentro del video. Eso va en el texto de la publicación (C-redes, 05:33; `02`).

### Ganchos y ritmo

- **Conflicto en el segundo 1**, tema escrito en pantalla, un cambio visual cada 1,5 a 3 s, subtítulos grandes (Redes `indicaciones-chat-nuevo-redes.md`; `04`).
- «planos rápidos e irreales que enganchen, caídas, efectos wow, que te dejen realmente pensando, como videos de julianeaborna» (C-redes, 04:52). «dopamina a cada rato» (05:33, y 09/11 «necesitamos despertar dopamina»).
- Sonido y pausas de cine: «lo mismo en las ediciones de los videos, pausas, sonidos para sumar efecto» (05:47).
- Cada gancho tiene que pedir una acción real: «tienen que responder la historia o escribirnos por whatsapp» (09/11 05:56). Cierre: **«Comentá PALABRA»** o «Respondé esta historia con PALABRA». **Nunca «el botón está en el perfil»** (no existe). **No se toca la bio ni el botón**: «el botón y la bio, dejalos así como ya están» (C-redes, 20/11).
- Ejemplos de ganchos que él aprobó o que rindieron: VITA «Antes de firmar», «¿Firmás o no?», «Plata rápida. ¿La agarrás?»; Coberturas «La carta», «Tu recibo explicado», «Lo que dijo la Corte»; Autos «El ticket del 0 km», «¿Contado, prendario o plan?»; Kocos «El celular que no para», «Este chat perdió una venta» (`04`, `series-y-volumen.md`).

### Volumen

- «No bajamos ningún ritmo, pegamos o pegamos» (20/11 06:06). Cronograma doble 20 al 29/11 (632 piezas); hasta 4 historias extra por día y marca y 1 TRIAL_REEL (`04`, `02`).
- «hacé cosas para generar contenido orgánico real real… subí aún más el volumen» (06:00). Las versiones B y R se hacen con **cambios reales** (gancho, escena, voz, música u orden); el pedido de «reversionar para que Meta no detecte duplicados» se anotó contra la regla de originalidad y queda **a definir** (`13`, hallazgo 8).
- Antes de programar: consultar `getScheduledPosts` para no duplicar; zona `America/Argentina/Buenos_Aires`.
- Ortografía revisada pieza por pieza: «fijate errores tipográficos, hacé un análisis de cada uno» (05:45).

### Qué aprobó y qué pidió rehacer

| Qué | Resultado | Fuente |
| --- | --- | --- |
| Boceto de VITA (reel «Antes de firmar» + carrusel de 7 láminas) | «el concepto me gusta, toda la base está perfecta», pero pulir detalles, realismo, premium; sin carteles ilustrativos | C-redes, 20/11 05:33 |
| Feed y estética del kit de perfil (destacadas, portadas, grilla) | Aprobados | `02` (20/11) |
| Temas: VITA laboral y penal, «Lo que dijo la Corte», Black Friday de Autos 27/11 (sin números reales), cuota de Coberturas sin números | Aprobados | `02`, C-redes 06:06 y 06:18 |
| ACARA/patentamientos y aumento de prepagas | «nada»; se reemplazan por «¿Contado, prendario o plan?» y «¿Pagás por cosas que no usás?» | `02`, C-redes 06:06 |
| Reels de texto sobre fondo de color (24/10) | Rehacer con estilo de marca | H-reels |
| Primeros reels y carruseles de noviembre | «no me gusta nada…»; rehacer con voz, estilo y adaptación al 100 % a cada rubro | C-ctx, 08/11 y 09/11 |
| Las 44 piezas de Kocos del 25 al 29/11 (estilo viejo) | A borrador, rehacer con el motor nuevo | `02` |
| Las destacadas | Publicadas y armadas **a mano por él** en los 4 rubros | `02`, H-claude 20/11 |
| Bajar a 1 reel por día, cara real, cargar botón de WhatsApp (auditoría de Chrome 20/11) | Rechazado | `02` |
| Programar destacadas para el día siguiente | «publicalas ahora mismo» | `02` |

### Para tener en cuenta

- Contenido de VITA: sin promesas de indemnización, resultado ni plazos; sin comparar con colegas ni ofrecer honorarios (`marcas.md`).
- Sin precios, cuotas, stock ni plazos inventados. Si una pieza lleva cifras (por ejemplo «200 chats» de Kocos), confirmar que sean reales antes (C-redes, preguntas abiertas).
- Publicidad paga: no por ahora («esperemos que pegue algún reel»). Sin generadores pagos.
- Solo publica Metricool; Instagram y Facebook no se publican desde el panel (`02`).

---

## 4. Voz de cada marca

Detalle completo, paletas y límites en `01-negocio-y-marcas.md` y `.claude/referencias/redes/marcas.md`. Acá, lo que cambia cómo escribís.

| Marca | Cómo habla | Qué evitar | Palabras clave |
| --- | --- | --- | --- |
| **VITA Abogados · Estudio Jurídico** (perfil `juridico`, Civil y Penal unificados) | Sereno, claro y firme. Explica, no asusta ni promete. Voseo. Humor solo leve y nunca sobre el accidente. Playfair + Manrope. Personaje: trabajador o trabajadora de barrio | Promesas, honorarios, comparar con colegas, villanizar aseguradoras reales | FIRMA, SEGURO, TRAYECTO, ART, ALTA, DAÑOS; desde 20/11 DESPIDO, LIQUIDACION, AGUINALDO, REGISTRO, REFORMA, TELEGRAMA, CERTIFICADO, PENAL |
| **Compara Tu Obra Social** (`coberturas_medicas`) | Cercano, práctico y tranquilizador; sin tecnicismos. Manrope sola. Personaje: monotributista o familia. Nunca excluye por edad | Recomendar una prepaga puntual, planes, precios, promesas médicas | APORTES, COMPARAR, PLAN; BAJA y CORTE desde 20/11 |
| **Automotores Kocos** (`agencia_0km`) | Directo, enérgico, humor del mundo del auto; transparente con costos y trámites. Archivo + Plus Jakarta Sans. Personaje: pareja joven con su primer 0 km | «Agencia Kocos» (nunca), stock, precios, cuotas, tasas inventadas | LLAVE, PLAN, 0KM; ENERO |
| **Kocos Marketing** (`marketing`) | Picante, concreto, orientado a negocio; antes y después, ejemplos del día a día. Outfit + Manrope. Personaje: dueña de pyme | «ORVIAN» (descartado), precios o resultados inventados | CRM, BIO, ORDEN, IA; CHECKLIST |

Reglas de voz comunes:
- Español rioplatense con voseo, frases cortas. Sin clichés («¿Sabías que…?», «Te contamos todo», «No te lo pierdas»).
- Una marca nunca usa colores, logo ni frases de otra.
- Correcciones puntuales ya registradas: «plata rápida» (no «rápido»); «¿Firmo ya o espero?» sin coma; «¡Hola! ¿Sigue disponible?»; «¡Hola, gracias por escribir!» (`04`).
- Asesor que se presenta en los bots de los 4 perfiles: Leonardo Gonzalez. **Es un nombre de presentación, no una persona que atiende** (`02`).
- Los bots dicen que son IA **solo si les preguntan** y tienen que sonar lo más humanos posible; **nunca dan precios**; Coberturas nunca recomienda una prepaga puntual (`02`).
- Textos nuevos que lo nombran a él: «el dueño» o «los dueños» (nunca «la responsable» ni en femenino: es hombre).

---

## 5. Forma de trabajo y autorizaciones

### La única restricción

- **No se paga nada sin autorización expresa**: créditos, planes, publicidad, generadores pagos (Veo, Kling, Runway, ElevenLabs, vidIQ con créditos), servidores, dominios. Presupuesto ya autorizado: Gemini USD 30 por mes, con **aviso al llegar al 80 %** (`02`, `12`). Para herramientas nuevas: Claude **propone** y deciden juntos, con tope razonable (no USD 1.000).
- Lo demás se implementa, prueba, publica y verifica directo, sin pedir «dale» por cada paso (`CLAUDE.md`, 15/10 y 20/11).

### Producción y autorización explícita

- **Producción (Vercel, base, Metricool) solo si el dueño lo pide o si Claude pide autorización y la recibe.** Hasta nuevo aviso (21/11) el cerebro trabaja en solo lectura (`02`).
- Las **campañas con bases y las publicidades las lanza él** (confirmado 20/11). Claude las deja completas, con «qué falta para lanzar» en cero (`02`). Publicar código no lanza nada.
- La Preview de Vercel comparte base y líneas con producción: probar ahí tiene efectos reales (`CLAUDE.md`).
- «Nada se borra»: se archiva o pasa a borrador, con motivo y forma de revertir (`02`, 13/11). «Nada se activa solo» (el archivo automático a 30 días quedó implementado y **apagado**, C-panel).
- Cada rubro separado: nada de un perfil se ve ni se abre desde otro (13/11).
- No tocar la bio ni el botón de los perfiles de redes; los edita él a mano.
- Claves solo en Vercel; el código de ingreso al panel no se guarda en archivos; datos de prospectos fuera de documentos y pruebas (`CLAUDE.md`).

### Mejoras de los bots: se proponen, sumando, sin borrar

- Regla del dueño (21/11): toda mejora va **como propuesta con su información, sumando a la base existente (sin borrar ni rehacer) y con autorización** (`02`, bloque D y E; `12`, pregunta 28).
- Antecedentes: «sin eliminar, editar ni cambiar lo que hay, siempre sumando cosas, al bot v2» (14/11 06:11, C-traspaso); «no hagas ningún cambio sobre lo que ya existe y está funcionando, que esto sea manual» (15/11 07:26); «solo agregá al rol del bot… sumalo nada más, como contexto, sin tocar nada de lo que existe» (09/11 09:12, C-ctx).
- Palabras clave de redes en el rol de los bots: se suman al final (`02`, 20/11).
- Los informes del bot son una pantalla del panel; el Laboratorio permite versiones nuevas (v3…), otros modelos de Gemini, roles y A/B, y **no cambia nada activo sin acción manual** (`02`, 15/11).

### Cómo informar y pedirle cosas

- Español rioplatense con voseo, **simple y corto**, listas cortas y tablas. Avisá en pocas palabras qué estás haciendo.
- **Instrucciones para él o para Cowork/Claude in Chrome: un solo prompt claro, listo para pegar.** Si hay un archivo, **Word (.docx)** (`02`). «pero hay chats muy muy largos, dame algo más fácil» (H-claude, 21/11).
- Cada informe: especificado, implementado, probado, publicado, habilitado, con versión comprobada. Cuando no pudiste verlo (pantalla, sonido, interfaz real), decilo.
- Antes de afirmar qué está encendido, comprobalo en la base (`CLAUDE.md`).
- Si hay duda de interpretación, **preguntá una vez, concreto, y seguí con lo que sí está claro**. Ejemplo bueno: C-panel dejó sin hacer «ordenar los casos: derivados, no derivados, perdidos» porque era ambiguo, y lo preguntó; él contestó «así como está ahora está bien» (`12`, pregunta 35).

---

## 6. Errores de Claude que lo molestaron

Para no repetirlos. Cada uno con su fuente.

| Error | Qué pasó / qué dijo él | Fuente |
| --- | --- | --- |
| **Tratarlo en femenino** | Los chats, los volcados y el cerebro hablaban de «el dueño», «la usuaria», «productora». Lo corrigió al contestar «productora» y aclaró que quien responde es hombre | `02` (bloque B, 21/11); `12` |
| **Recorrer el panel por encima** | El recorrido del 20/11 «no leyó chats ni configuración» y se repite «como usuario real». El 21/11 pidió un análisis «exhaustivo (agentes, roles, scraper, conversaciones)» y leer «cada archivo y cada respuesta». Antes ya había pedido: «usa el panel como si fueses dueño, revisá todo y buscá algo a mejorar» (14/11 07:17) | `02` (21/11 bloques B y C, tarde); `C-traspaso` |
| **Decir que faltaba integrar Wasender cuando ya estaba** | El panel **ya envía por Wasender o por Meta**, con plantillas y algoritmo de envío: «No es una tarea pendiente; lo que falta es conectar más líneas». Claude también había dicho el 17/11 que «el CRM usa solo Meta», y el repo tiene `src/lib/wasender`. Antes de proponer algo nuevo, revisar el repo | `02` (bloque D y E); `13` (contradicciones) |
| **Proponer bajar el ritmo o pasar piezas a borrador** | «no entiendo nada, ¿qué queda en borrador? ¿Por qué frenarías?» → «no no bajamos ningún ritmo, pegamos o pegamos» | C-redes, 20/11 06:02 y 06:06 |
| **Afirmar que había algo programado cuando no** | «No hay nada programado.» | C-ctx, 08/11 07:34 |
| **Pedir material que ya estaba** | Pidió fotos, clips y confirmaciones; dijo que no tenía logos ni paleta: «no tengo nada, fijate vos», «pero si ya tenés logos, paleta de colores, todo» (estaban en `src/lib/marca.ts` y en el repo) | H-reels, 24/10 |
| **Dar un boceto en texto en lugar del video** | «pero hacé vos el video, hacé un boceto de cada rubro» | H-reels, 24/10 |
| **Usar rubros de la memoria vieja** | Armó bocetos de hotel y prepagas en lugar de los 4 rubros del CRM | H-reels, 24/10 |
| **Llamar «ORVIAN» a su agencia** | «ORVIAN NO, KOCOS MARKETING ES» (19/10). Las memorias de Claude se contradecían sobre el nombre; vale **Kocos Marketing** (decidido 20/11) | H-cowork chat 7; `02` |
| **Preguntar lo que ya estaba en las indicaciones de los agentes** | «Ya está todo hecho en las indicaciones de los agentes eso… ¿no lo viste?» | C-traspaso, 14/11 07:17 |
| **Proponer un día de descanso para Wasender** | «días de descanso no pondría, sí o sí de lunes a sábados» | C-traspaso, 14/11 06:11 |
| **El bot cortaba sin saludar ni agradecer al captar** | Quería que responda, agradezca y reafirme que un profesional se comunica; adaptado a cada rubro | C-traspaso, 15/11 04:45 y 04:46 |
| **El recontacto no funcionaba y se mostraba la hora en 12 h** | «Habíamos dicho que si no respondía, se le volvía a enviar mensaje… eso tampoco se está respetando.» Hora «02:14» donde era 14:14 | H-cowork chat 8 (24/10) |
| **Apagar el agente ante «no quiero que me hablen más»** | Debía disculparse y quedar a disposición, no apagarse | H-cowork chat 8 |
| **Plan de Metricool con API que no tienen** | «En metricool no tenemos acceso a la API»; también «vos ya las tenés» (las redes) | H-cowork chat 7 |
| **Laboratorio del bot y asistente demasiado complicados** | «no sé ni cómo usarlo»; pidió gráficos sencillos | C-traspaso, 15/11 |
| **Estadísticas «solo números»** | Faltaba quién se derivó, quién se cerró y de dónde vienen los clientes | C-ctx, 13/11 07:01 |
| **Mezclar enojos y «no me escriban» con incidencias reales** | Incidencia = solo amenaza legal o queja de un captado | `02` (13/11) |
| **Tardar sin avisar** | «¿Por qué tardás tanto? No frenes.» (24/10); preguntas de tiempo y costo | H-cowork chat 8; C-traspaso 13/11 |
| **Tratar la consulta de un solo rubro como un pedido de los cuatro (o al revés)** | «recordá que esto es solo un boceto de un solo rubro, hay otros 3 más»; «relée bien el contexto de cada rubro y adaptá el contenido 100 % a ese rubro» | C-redes 05:38; C-ctx 08/11 08:40 |
| **Contenido «genérico» o «muy hecho por IA»** | «no quiero contenido genérico»; «sigue viéndose muy IA» | C-ctx, 08/11 y 09/11 |
| **Decir que no se le podía pasar una tarea a Cowork** | Quería un prompt listo para pegar | `02` (tabla «Lo que no quiere») |
| **Rediseño de «mínimos detalles» presentado como rediseño completo; pantallas largas y con demasiadas funciones** | «no tiene ningún rediseño gráfico, solo mínimos detalles»; «demasiado extenso, demasiadas funciones… que sea fácil, sencillo, con estadísticas circulares, animaciones simples» | este chat, 22/11 cierre |

Errores de proceso para no repetir (lo que aprendió Claude, no un reproche textual): leer el repo y el cerebro **antes** de preguntar; verificar en la base antes de decir «está encendido»; no repetir exigencias viejas que él ya reemplazó; no copiar al cerebro un dato de un resumen de un modelo chico sin confirmarlo (`13`).

---

## Cómo arrancar una sesión con él (resumen de 6 pasos)

1. Leé `README.md`, `02`, `07` y `08` y seguí derecho; no releas todo.
2. Tratalo en masculino o en plural neutro («el dueño», «los dueños»). Voseo, corto, simple.
3. Antes de preguntar, buscá en el repo, el cerebro y la base.
4. Con un pedido de diseño o contenido: **un solo rubro primero**, boceto, él aprueba, después producís y programás. Si no pidió producir, no producís.
5. Nada de pagos; nada de producción sin su pedido o su autorización; las mejoras de bots, como propuesta que suma.
6. Cerrá con un informe con estados reales y, si él pide pasarle algo a Cowork, un prompt listo para pegar.
