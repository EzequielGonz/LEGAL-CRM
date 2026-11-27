---
description: Diario de sesiones y aprendizajes. Lo más nuevo arriba. Una entrada corta por vuelta de trabajo.
---

# Bitácora

## 22/11 (noche) — Vuelta 6: lo visible

- **Pedido:** «sigue todo igual… súper básico… la oficina nada que ver con el video… el cerebro tiene todo abajo… usá las marcas que te hice (bento de colores, vidrio, neumorfismo, gradient mesh, parallax, carteles), no el fondo».
- **Error de la vuelta 5:** se publicó sin mirar en pantalla. Regla nueva: ningún agente termina sin capturas en Preview con sesión comparadas con la referencia; el orquestador mira producción antes de informar.
- **Publicado (`b625c87`) y mirado en producción:** Oficina edificio 3D con muebles, living con pool y cocina, panel de equipo y canal en vivo, modo «Recorrer»; Cerebro con Preguntale/Enseñale/Ordenale arriba y anillo 3D de pantallas de color; Hoy y Resumen en bento de colores con carteles, parallax y botones neumórficos; Jarvis con bento de gráficos y orbe vivo. Sin errores en 30 pantallas.


## 22/11 (noche) — Graphify en todos lados, verificado

- **Pedido:** «¿lo sumaste a todas las ramas y todo el proyecto?» (la sesión Accesos dijo que en `main` no había mapa: falso, está desde `d56ca67`; su búsqueda cortaba la lista a 10 renglones).
- **Hecho:** mapa del CRM regenerado con las migraciones SQL (6.911 nodos, 12.405 aristas). En los 4 repos de landings Graphify estaba solo en `claude/admiring-euler-ctf4sg`; ahora está en `main` de los cuatro (skill, hook de arranque y mapa en `mapa-codigo/`).
- **Ramas viejas:** de las 109 del CRM, las de trabajo terminadas no se tocan; toda sesión nueva arranca de `main` y lo recibe.


## 22/11 (noche) — Quinta vuelta: todo funcional y pulido de punta a punta

- **Pedido:** «nada tiene función, es todo decoración»; Oficina como edificio 3D del reel; Contactos con lo perdido; Resumen, Jarvis, Laboratorio y Cerebro que hagan cosas; pulido ultra premium; carga más rápida.
- **Hecho (5 agentes en copias separadas, integrados en `integracion/rediseno-2211`):** Oficina edificio 3D con salas por sector y agentes que llevan tareas al Cerebro; Contactos con buscador, filtros, acciones por fila y en lote, CSV; Citas con calendario y crear/mover/cancelar; Resumen accionable; estética nueva en «Más»; Jarvis con acciones por pantalla; Laboratorio con simulador y comparación de roles; Cerebro con «Preguntale» y «Enseñale algo» (tabla `cerebro_conocimiento`, migración 0650 aplicada); sombras, tipografía y chat pulidos.
- **Verificado:** typecheck, lint, 887 pruebas, build. El primer despliegue a producción falló por una caída pasajera de Google Fonts en Vercel (la Preview del mismo commit quedó READY); se republica.
- **Recorrido en producción (`2dc44a9`):** 30 pantallas en 1440 y 390 px, todas 200, sin errores de consola ni desborde horizontal; un chat abierto con sus mensajes sin errores. Resumen bajó de 2,7 s a 0,8–1,3 s de respuesta (la comparación semanal se guarda 2 min); el resto entre 0,2 y 0,8 s.
- **Aprendido:** los agentes no ven el panel con sesión; todo lo visual se confirma en el recorrido posterior.





## 22/11 — Pedido de supercerebro y empresa de agentes

- **Pedido:** cerebro director de agentes por área, Jarvis en el panel, evaluar 5 herramientas y 8 videos, pasar pendientes y preguntas.
- **Hecho:** propuesta en `16-propuesta-empresa-de-agentes.md`; dos agentes en segundo plano (videos y herramientas); traspaso en `traspaso-sesion-2026-11-22.md`.

## 21/11 (noche) — Cerebro dentro del panel

- **Pedido:** «hacé una página aparte como la del panel, vinculala, que lea todo, con bandeja, asistente y laboratorio; terminalo y publicalo».
- **Hecho:** `/cerebro` en el marco del panel; acceso arriba de todo en Perfiles y en el menú lateral. Lee cifras de la semana y salud en vivo, muestra los pedidos a Claude, «Hablale a Claude» crea tareas en la bandeja con la foto de la semana, y suma el asistente general y el laboratorio de bots. Contenido en `src/lib/cerebro/contenido.ts` (actualizarlo en cada vuelta junto con `15-hallazgos`). Entrega en `docs/cerebro-panel/ENTREGA.md`.
- **Ojo:** al cambiar alertas, pendientes o preguntas del cerebro, actualizar también `src/lib/cerebro/contenido.ts`.
- **Corrección del dueño (misma noche):** no lo quería dentro del marco de los perfiles ni con tarjeta en el menú. Quedó como pantalla aparte con la escena animada del cerebro (esfera, frases con cifras vivas, contador), acceso solo en Inicio con una píldora chica que late y abre pestaña nueva. Publicado en producción (`main` 94b5fdc) y revisado en computadora y celular.

## 21/11 (noche) — Relectura completa y cruce de informes

- **Pedido:** «¿leíste todo el contexto de este chat y de las sesiones de CRM COMPLETO?».
- **Hecho:** releí los 69 mensajes del dueño de este chat desde el registro completo; trato en masculino en todo el cerebro (~400 «la responsable»); lectura de las 8 subsesiones de reels y de la cola de «Metricool context»; cruce de H, I, J, K y L en `15-hallazgos-21-11.md`; órdenes que faltaban en `02`; informes en `biblioteca/analisis-2026-11-21/`.
- **Límite honesto:** «Metricool context» no se pudo leer entera (≈600 páginas de eventos); el resto salió de los archivos de su rama. Los 248 mensajes de «Contexto del proyecto» no se recontaron uno por uno.
- **Aprendido:** no confiar en «leído» sin contar mensajes; los volcados de otras sesiones arrastraban el femenino.

## 21/11/2026 · Lectura de «Metricool context», subsesiones de redes y verificación de volcados

- **Pedido:** leer completo el chat de reels y Metricool de las 4 marcas, las 8 subsesiones «Redes · <marca> · reels» y comparar los volcados de 5 chats de Code con los mensajes del dueño. Solo lectura.
- **Hecho:** 2 volcados nuevos en `cerebro/chats/` (`2026-11-20-code-metricool-context-4-brands.md` y `2026-11-20-code-redes-subsesiones-reels.md`) y el análisis de faltantes en `cerebro-privado/analisis/L-sesiones-faltantes.md`. Las 8 subsesiones se leyeron completas: se cortaron juntas por el límite de uso a los 7 minutos y entregaron 6 reels en total (el resto no).
- **Límite:** «Metricool context» tiene unas 600 páginas de eventos (12 páginas cubrían 30 minutos); se leyeron las más nuevas y lo que la propia sesión escribió en su rama. Los 5 chats de verificación se miraron solo en su página más nueva: sin mensajes del dueño después del 21/11 05:55 UTC. La comparación completa quedó pendiente.
- **Falta en el cerebro (ver L):** excepción del «3 %» de Coberturas («deja asi»), 4 PR de landings en borrador hasta probar la medición, órdenes del 20/11 17:15 y 17:20, estado de 392 piezas programadas (25 de 272 reels) y permisos que bloquearon a las sesiones en la nube.


## 21/11/2026 · Análisis completo en curso

- **Pedido:** entender todo a detalle sin tocar nada: código, panel, 5 repos con ramas y PR, Supabase y Vercel; Cowork es historia; preguntas al final.
- **Hecho:** 7 subagentes lanzados (ver `traspaso-sesion-2026-11-21-b.md`); se cortaron por el límite de 5 h y se retomaron; repo LEGAL-CRM comprobado público.
- **Quedó:** cruzar los 7 informes, actualizar el cerebro y armar preguntas.

## 21/11/2026 · Chats volcados y cruzados

- **Pedido:** leer solo los 7 chats de la carpeta «CRM COMPLETO», más lo que pase de Claude común y Cowork; lanzar los reels pendientes.
- **Hecho:** 8 chats de Claude común (exportación de datos), 5 de Cowork y 6 de Code volcados a `cerebro-chats` con subagentes Haiku, sin claves; cruce en `13-lo-aprendido-de-los-chats.md`.
- **Decidido:** los reels los sigue el agente del chat «Metricool context» (tarea «Retomar reels tras el límite»); no se lanzan sesiones paralelas.
- **Quedó:** revisar a fondo los resúmenes, comprobar Metricool por día y marca, actualizar los archivos 01–11 con lo confirmado.

## 21/11/2026 · Chats unificados y traspaso

- **Pedido:** unificar todos los chats en una sola rama (`cerebro-chats`) y releer; cuidar el uso de créditos.
- **Hecho:** plantilla única y prompt para pegar en cada chat; se verificó que los chats de Code cayeron por «se acabó el crédito de uso extra»; 1 chat volcado (Panel Jurídico); traspaso de sesión escrito (`traspaso-sesion-2026-11-21.md`).
- **Aprendido:** leer transcripciones con `list_events` no reanuda el chat ni gasta su crédito; filtrar `user`+`result` evita los bloques de razonamiento, que son lo más caro. Claude común no es accesible desde Code.
- **Quedó:** volcar 19 chats de Code, resolver Claude común, pasar a leer todo.

## 20/11/2026 · 09:00–09:30 · Aprendizaje continuo y preguntas

- **Órdenes nuevas:** releer y entender el negocio en cada sesión, aprender y actualizar el cerebro en el momento, sumar roles/skills/plugins solos. Nombres: Kocos Marketing (sin ORVIAN); autos «Automotores Kocos» o «Autos Kocos», nunca «Agencia Kocos». Pasar a main el cerebro y las ramas de documentos. Por ahora, entender; las instrucciones vienen después.
- **Hecho:** hook de arranque (`.claude/settings.json` + `.claude/hooks/cerebro-al-arrancar.sh`) que carga el cerebro solo; protocolo de aprendizaje continuo en `README.md`; 51 preguntas en `12-preguntas-para-entender.md` y en Word.
- **Aprendido:** un build puede fallar por la descarga de fuentes de Google en el entorno (`next/font`); reintentar antes de culpar al cambio.

## 20/11/2026 · 05:45–06:30 · Armado del cerebro

- **Pedido:** cruzar el contexto de Fase 1 (Cowork) y Fase 2 (Code), armar memoria/cerebro, preguntar lo necesario, recorrer el panel, conectar repos y ramas, quitar restricciones salvo pagos.
- **Hecho:** cerebro en `cerebro/` (12 archivos); cruce con 19 contradicciones resueltas; estado verificado en base, Vercel, Metricool y DNS; CLAUDE.md actualizado a «única restricción: pagos».
- **Respuestas del dueño:** destacadas ya armadas a mano; campañas las lanza él siempre; cerebro en LEGAL-CRM; Search Console «no sé» → comprobado por DNS: verificadas.
- **Aprendido:** la doc del 20/11 coincidía con la base en los 9 puntos chequeados, pero no decía que la campaña en curso no había enviado nada, que el calendario se corta el 24/11 en 3 marcas, ni el 26 % de fallas de entrega en Jurídico.
- **Recorrido del panel (105 pantallas, solo lectura):** todo responde; línea de Meta de Marketing «sin acceso al número»; 11 bugs anotados en el pendiente 15. `/telefono` ya redirige.
- **Inventario de ramas:** 82 integradas, 6 con trabajo propio (rescatar `gracious-volta`, publicar `pensive-galileo` como 0635, PR #40 de Resend); adjuntar PDF ya estaba en producción; main 585/586 pruebas (falla el catálogo del asistente).
- **Documentos viejos** con aviso arriba que remite al cerebro.
- **Quedó:** producción del cronograma doble (P0), línea de Marketing, integrar ramas de documentos a main, rama del 19/11, medición. Ver `08-pendientes-y-plan.md`.

## Aprendizajes permanentes

- Antes de informar «encendido», mirar la base: la documentación puede estar bien y aun así omitir lo importante.
- Una campaña creada fuera de la franja 8–21 queda «en curso» sin enviar hasta la próxima ventana.
- Metricool muestra Europe/Madrid: siempre consultar y programar en Buenos Aires.
- La rama de trabajo asignada a cada sesión puede venir muy atrasada respecto de main (43 commits el 20/11): integrar main antes de tocar código o migraciones.
- El dueño prefiere decisiones tomadas con una recomendación clara, no menús largos.
- Salud del panel puede decir «en orden» con una línea sin acceso: para saber si una línea anda, mirar `/meta/lineas` (consulta en vivo a Meta), no solo Salud.
- El clon de la sesión puede venir superficial (10 commits): `git fetch --unshallow` antes de comparar ramas.

## 21/11 — Preguntas respondidas y análisis exhaustivo
- El dueño respondió las 55 preguntas. Correcciones: es hombre; son dos dueños y desarrolladores; derivan a mano; Wasender y Meta ya están integrados para enviar; el recorrido anterior del panel había sido superficial.
- Lancé un análisis exhaustivo con agentes (H, I, J, K y el estilo). J confirmó en el código el error de las 72 h, la causa de los retenidos que aparecen en todos los perfiles y las 5 consultas distintas detrás de «esperan a una persona».
- La página del cerebro está en su versión 4, con estilo de esfera de partículas, tablero de pendientes y respuestas.
- Las tareas programadas del cerebro se eliminaron a pedido del dueño. La propuesta del cerebro como software con API quedó anotada sin aplicar.
- Aprendizaje: leer el código antes de afirmar que algo falta; recorrer el panel como usuario, leyendo chats y configuración.

## 2026-11-22 (tarde) · Oficina de agentes, sesión «accesos» y mapa de plugins

- El dueño eligió: Gemini en el panel más Claude para lo complejo; los agentes trabajan solo cuando toca «Arrancar ahora»; hasta borrador.
- Hecho: la Oficina en `/cerebro` (escritorios por área, mesa de entrada ordenada por Gemini, recorrido por sectores, «Esperando tu OK» con aprobar, pedir cambios o descartar). Migración `0636_oficina_agentes.sql` (solo suma columnas y la tabla `oficina_arranques`). 11 pruebas nuevas; 603 en total pasan.
- Skill `oficina` (cómo procesa Claude cada vuelta) y skill `accesos` (el dueño escribe «accesos» en un chat del proyecto). Lista en `17-accesos-y-pendientes.md`.
- Mapa de los 275 plugins por escritorio en `18-mapa-de-skills-y-plugins.md` (167 en el núcleo, 51 con aporte mínimo y 57 que no aplican).
- Instalados por el dueño: claude-code-setup, PostHog, Firecrawl, skill-creator y Claude Code Cost. PostHog y Firecrawl se usan solo con OK. No activar la captura de sesiones de PostHog.
- La API de Claude no está en el panel: no hay clave en Vercel. Claude trabaja con el plan de claude.ai.
- Falta para que el botón dispare solo: el token de la tarea programada (A1 en `17`).

## 2026-11-22 (noche) · Seguridad, captación y operación

- **Seguridad:** el agente de captación avisó de una «instrucción» dentro de `15-hallazgos-21-11.md`. Era un fragmento de un comando de Claude, pegado por error al final del archivo en una sesión anterior, y traía el código de acceso del panel. Además el código estaba como ejemplo en `tests/unitarias/acceso-y-webhooks.test.ts` desde el 11/10. Se sacó de `main` y `cerebro-chats` (071f646e / 052819b). Sigue en el historial y en ramas viejas: cambiar el código pasó a urgente (P7 en `17`).
- **Lección:** antes de cada commit del cerebro, revisar que ningún archivo termine con restos de llamadas de herramientas (`</content>`, `<parameter`) y buscar el código y teléfonos con grep.
- Terminaron los frentes de operación (tope de Gemini, tiempos del latido y job versionado) y de captación (72 h, rubros, evidencia, cifras, Hoy, Salud). Un integrador los junta y los revisa. El freno diario de Gemini queda solo como aviso, porque los precios por token no están verificados; el del mes (USD 30) sí frena.
- Sesión «memoria» creada (skill). Un agente reescribe `19` con todo el historial y arma `20`, el conocimiento completo para el proyecto de claude.ai.

## 2026-11-22 (noche, cierre) · Publicado: rediseño del panel, captación, cifras y operación

- **Publicado en producción** (`main` 8c1a94c, Vercel READY). Junta tres frentes, revisados por un integrador:
  - rediseño visual de todo el panel (tipografía y estilo del cerebro, bento, animaciones, celular, contraste);
  - captación y cifras (72 h, rubros separados, evidencia de captación, una definición por cifra, por qué para cada perfil, Salud);
  - operación (tope de Gemini: el mes frena en USD 30, el día solo avisa; tiempos máximos en recontacto y campañas; aviso si el latido se atrasa).
- **Migraciones aplicadas:** 0636 (Oficina), 0637, 0638 y 0639. La 0639 quedó en espera porque falta el secreto en Vault (A12 en `17`); el latido sigue como estaba y anda.
- **Verificado en producción** (computadora y celular, 390 px): Perfiles, Salud, Resultados, Bot IA, Bandeja y Cerebro abren con 200 y sin desborde. Apareció el error de React #418 (hidratación) en Perfiles, Salud, Bot IA y Bandeja: lo arregla un agente en `arreglos/hidratacion-2211`.
- **Pendiente de decisión del dueño:** precios reales por token de Gemini; si el asistente, el Laboratorio y los audios cuentan para el tope; la etiqueta de gravedad conectada a las campañas.
- **Memoria completa** lista: `19` (147 recuerdos), `20` (conocimiento completo) y el prompt para Claude in Chrome en `biblioteca/`.

## 22/11 cierre: biblioteca complementaria (extra)
- El dueño subió la «Biblioteca complementaria CRM 4 rubros» (Word y paquete). Se guardó tal cual en `biblioteca/complementaria-2211/` como material extra de consulta. No se cambió ni se pisó nada del cerebro, las fichas, los prompts ni los bots. Las 135 fichas propuestas siguen inactivas: el mecanismo de alta las crearía activas, así que no se usa hasta hacer la comparación y tener el OK.

## 22/11 cierre: rediseño, Jarvis, Oficina 3D, recontacto y regla de arranque
- Publicados en main: el recontacto de las 72 h (con la 0640 aplicada y solo Jurídico encendido), la Oficina 3D y la regla número uno (`00-arranque-para-agentes.md`).
- En ramas: la fundación visual, Jarvis, el menú con Hoy, Chats y Campañas, y Resultados, Salud y Cerebro. Falta integrarlas, pasar la revisión final con agentes especialistas y publicar si cumplen. Detalle en `traspaso-sesion-2026-11-22-c.md`.
- Correcciones del dueño: «ese fondo raro no» (estética clásica más detalles); «usá TODAS las herramientas y agentes personalizados, el cerebro completo para todos».
## 22/11 noche: repaso de la Oficina 3D
- Festeja el escritorio que terminó su parte (no siempre Dirección). Fondo neutro del panel, sin colores raros. Detalle en `docs/oficina-3d-2211/`. Pendiente: pasar la revisión por `fairmind-design:fairmind-accessibility-orchestrator` (no estuvo disponible en la copia aislada).

## 22/11 · Rediseño publicado (commit 823d77c en main)

- **Integrado:** marco-hoy + Jarvis repaso + chats-campañas + resultados-salud-cerebro + oficina-3d-repaso en `integracion/rediseno-2211`. Conflictos: Jarvis quedó con la versión del repaso; `VerMas` con una sola prop (`abiertoAlInicio`). Las piezas premium usan las fuentes clásicas del panel (no se cargan Geist ni Instrument).
- **Revisión independiente (5 agentes en paralelo):** Artisan (diseño), accessibility-specialist, code-reviewer, Skeptic (producto) y perf-forensics. Arreglado antes de publicar:
  - Seguridad: Jarvis vetaba solo por palabras («lanzar», «enviar»); `marketing_ejecutar_base` y otras que hacen salir mensajes pasaban. Ahora están vedadas, hay prueba sobre todo el catálogo y la ruta de confirmación devuelve 403 si la confirmación viene de Jarvis.
  - Jarvis en oscuro: el tema invierte la escala slate y la hoja salía clara con textos pastel ilegibles. Hoja oscura de verdad, botón principal con texto oscuro, foco dorado 700, foco devuelto al cerrar, tope de 20 turnos.
  - Hoy: anillos con el color de cada perfil (estaba Jurídico fijo) y atajos a Contactos, Citas y Seguimiento (pasaron a «Más»).
  - Resultados y Salud: sin dato muestra «—» (no 0 ni 100 %).
  - Claro: dorado 600/700 en arcos e íconos; pista del anillo sin sombra negra. Oficina: sin blur sobre el canvas.
- **Verificado:** typecheck, 824 pruebas, build; humo con sesión en 10 pantallas a 1440 y 390 en Preview y en producción: todo 200, sin desborde, consola limpia, Jarvis presente, canvas 3D en /cerebro, sin fondo mesh.
- **Queda para otra vuelta (no bloquea):** unificar los 3 CSS de mapeo (`.pp`, `.cc`, `.pm-clasico`); sacar de `premium.css` el mesh que ya no se monta; Cerebro todavía largo (11 pestañas detrás de «Ver más»); textos técnicos en Salud («Meta», «Wasender»); conteo «Responder a N» de Hoy mezcla posibles captaciones; Jarvis carga su hoja completa en todas las pantallas (cargar perezosa); probar la Oficina 3D en un celular real; lector de pantalla a mano.

## 22/11 · Tercera vuelta publicada (main 98b2bb6+)
- Jarvis puede hacer TODO con confirmación (ver `02`); lo que envía o publica pide confirmación reforzada o código.
- `/asistente` (Jarvis general): mismo aspecto que el Jarvis del panel, gráficos de la semana (anillos y barras por perfil), chips de pedidos y `?pedido=` precargado.
- `/laboratorio`: pestañas por rubro, «Cómo anda el bot» en anillos y lenguaje simple, roles por rubro (crear con plantillas, pedir mejora, archivar, usar en campaña) y ficha del negocio, todo con confirmación. Lo técnico quedó detrás de «Ver más». Falta: publicar agentes de la biblioteca (pide PIN).
- `/cerebro`: «Lo que el cerebro recomienda hoy» (botón Hacerlo → Jarvis), «Reglas vigentes» con proponer cambio a la Bandeja.
- `/resumen`: anillo total, comparación semanal, «Pedile a Jarvis que lo haga» por fila, propuestas por confirmar.
- Humo en producción con sesión a 1440 y 390: 6 pantallas 200, consola limpia.

## 22/11 · Cuarta vuelta
- Oficina 3D por sectores, Jarvis con `consultar_cerebro`, Graphify en los 5 repos y en el entorno, propuesta de granja de teléfonos. Recorrido real: Resumen, Contactos y Citas casi sin acciones (ver `traspaso-sesion-2026-11-22-d.md`).

## 22/11 · Vuelta 6 · Cerebro como centro de mando (rama `rediseno5/parte7`)
- Pedido del dueño: «el cerebro no tiene funciones, está todo abajo, tiene que ser distinto».
- Arriba de todo, barra para hablarle con tres modos en botones en relieve: **Preguntale** (respuesta en el lugar, con fuente de cada parte), **Enseñale** (guarda en la memoria, con confirmación) y **Ordenale** (crea el pedido en la Oficina, Gemini lo reparte por escritorios; después «Arrancar ahora» o «Mejor que lo haga Jarvis», todo con confirmación).
- Debajo, anillo 3D de 11 pantallas de colores alrededor del núcleo (la esfera, que late cuando piensa): Pendientes, Oficina, Jarvis, Recomienda, Aprendido, Decisiones, Semana, Salud, Laboratorio, Mapa del código (Graphify) y Pedidos a Claude. Se gira arrastrando, con rueda o flechas; la de adelante se abre a pantalla completa como bento de colores y vidrio con su función operable. Celular y «menos movimiento»: bento en lista.
- Piezas del video marcado: carteles con la palabra clave en serif itálica recuadrada, bento de colores vivos, vidrio sobre círculos de color dentro de la tarjeta, degradé de nubes por marca, capas en parallax y botones neumórficos. Fondo de la página oscuro y limpio.
- No se perdió nada: las secciones viejas (`#alertas`, `#preguntas`, `#corregi`…) abren su pantalla nueva. Código: `src/lib/cerebro/anillo.ts` (con pruebas), `src/components/cerebro/centro-cerebro.tsx`, `barra-mando.tsx`, `pantallas-cerebro.tsx`, `bento-cerebro.tsx`, `src/app/cerebro/centro.css`.

## 22/11 · Revisión de accesos (Google y Meta)
- Vercel (solo nombres): Resend y remitente, Gemini, Wasender, Outscraper, Meta (app, verificación), WhatsApp de los 4 perfiles, página y cuenta de Instagram solo de Civil y Penal. Faltan `OFICINA_DISPARO_*`.
- Metricool: 4 marcas, lectura de métricas de reels funcionando. Mejor pieza de VITA en noviembre: «Choque: nunca digas esto» (1.575 vistas, 74 % de tasa de vista); la mayoría de los reels dio 0 de alcance.
- Windsor: GA4 y Search Console conectados pero con lecturas pausadas por el plan gratis (1 cuenta). AdCopilot sin Google conectado.

## 23/11 · Graphify también en el cerebro y la memoria
- Nuevo mapa de los documentos en `cerebro/mapa-cerebro/` (cerebro, bitácora, traspasos, chats volcados, biblioteca, `CLAUDE.md` y `.claude/referencias/`). El del código sigue en `cerebro/mapa-codigo/`. El arranque de cada sesión avisa de los dos.
- Se arma sin modelo de lenguaje (títulos y secciones); no contiene claves ni datos de prospectos.

## 27/11 · Recorrido propio del panel, propuesta de reorganización y muestra de diseño
- Claude recorrió el panel publicado como dueño: 148 pantallas de las cuatro cuentas más una segunda pasada abriendo formularios, sin enviar ni guardar nada.
- Hallazgos: el embudo aparece en seis lugares, hay nueve listas de las mismas personas, tres pantallas del bot y cinco lugares para pedir algo; las cifras se contradicen entre pantallas; Hoy tarda de 11 a 14 segundos en frío.
- Propuesta en `cerebro/24-reorganizacion-y-muestra-2711.md`: cuatro secciones por perfil (Bandeja, Campañas, Contactos, Resultados) más Configuración; afuera, Inicio, Jarvis, Cerebro y Oficina.
- Colores: el dueño rechazó los pasteles («infantiles y de colegio»). Propuesta «grafito y latón», dos tipografías. Muestra enviada en siete imágenes (pidió fotos, no una muestra navegable). Espera su OK.

## 27/11 · El dueño rechaza la muestra drástica; plan por tandas escrito
- La muestra «grafito y latón» (pantallas nuevas, planas) fue rechazada: quiere el panel como está, mejorado un poco, y que funcione. Asentado en `02`, `23` y `24`.
- Lección: antes de proponer diseño, leer el dossier entero; lo único que aprobó en voz alta fue la estética clásica con detalles finos, la Oficina 3D y las animaciones.
- Plan del pedido en `22-plan-panel-2711.md`, con el análisis completo por área en `biblioteca/analisis-2026-11-27/` (111 hallazgos).
- Al momento de escribir esto no hay código cambiado del pedido del 27/11.

## 27/11 · Terminó el análisis del panel
- Trece subagentes: doce áreas y una revisión final de completitud. Informes en `biblioteca/analisis-2026-11-27/` (incluye `seguridad.md` y `critica.md`).
- El plan `22` suma el orden por fases con dueño único por archivo y tres correcciones de la revisión. Sigue sin código: el dueño pidió aprobar primero el paso a paso.
