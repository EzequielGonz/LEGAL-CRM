---
description: Diario de sesiones y aprendizajes. Lo más nuevo arriba. Una entrada corta por vuelta de trabajo.
---

# Bitácora




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

## 22/11 · Sesión «accesos»
- Supabase conectado en la sesión (verificado con list_tables).
- A2 ✅: GA4 y Search Console disponibles por Windsor.ai (4 propiedades, 4 dominios).
- A3 ✅: Metricool devuelve las 4 marcas y analítica por día.
- A7 ✅: Gmail y Google Calendar conectados en claude.ai; verificado con `list_labels` y `list_calendars` (cuenta del estudio, sin leer correos).
- A4 ✅: el conector GitHub de claude.ai responde (`get_me`). El plugin «github» aparte sigue fallando, pero no hace falta.
- A5: PostHog responde (`project-get`), pero el proyecto es nuevo y no recibió ningún evento: hay que instalar el código en las landings.
- A6 ✅: clave de Firecrawl por formulario seguro; prueba de scrape OK. Uso solo con OK.
- A8 ⬜: el Vercel conectado solo tiene el proyecto `legal-crm`; las landings siguen en otra cuenta, no se ven.
- A9 🟡: `RESEND_API_KEY` existe en Production. Falta `LANDING_EMAIL_FROM`. Siguen sin existir `OFICINA_DISPARO_*`.
- A10 ⬜: Canva y Cloudflare siguen pidiendo autenticación; no aparecen herramientas.
- A11: Skill Arena = `Jakeschincariol/arena-skill` (MIT, Python estándar, sin red). Instalación frenada por el sistema de permisos; pendiente.
- A1 en curso: el dueño arma el disparo por API de la tarea «Oficina · procesar tareas».
