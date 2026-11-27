# Análisis del panel · navegacion (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

Evaluación de navegación, arquitectura de información y heurística de todo el panel, solo con lectura. Usé el código de /home/user/crm-main y las 70 pantallas del recorrido tour2711 (ya están _rutas.json y _errores.txt).

Puntaje general de UX: 42/100. No hay patrones engañosos: todo lo que envía pide confirmar con «¿Lo hago?». Pero hay 3 lugares donde se mezclan los rubros, contra una orden vigente.

Diagnóstico: el problema no es que falten funciones, es dónde están. Muchas existen pero quedan escondidas en «Más», duplicadas o con varios nombres:
- Jarvis tiene 5 puertas distintas.
- El mismo contacto tiene 3 fichas.
- Las direcciones se arman de 3 formas.
- Contactos y Captados quedan en «Más» o en una pestaña oculta.
- Hoy repite las mismas cifras hasta 3 veces.

Además, las cifras de la semana no coinciden entre pantallas: Jurídico muestra 4 captados en Hoy, Resultados y Perfiles, pero 6 en Jarvis. Eso le saca confianza a todo el panel.

Estructura propuesta:
- Menú de cada perfil: Hoy · Chats · Contactos (Captados como primera pestaña) · Campañas · Resultados · Más.
- Más: Bot IA (con Biblioteca y Comparar adentro), WhatsApp y plantillas, Redes, Salud, Ajustes y Bandeja para Claude.
- Nivel general: una portada que junta Perfiles y Resumen de todo, más Jarvis, Cerebro y Oficina.
- Una sola ficha y una sola forma de dirección; las rutas viejas pasan a redirigir (nada se borra).

Faltan funciones básicas de un CRM: búsqueda global, atajos de teclado, recordatorios por contacto, acciones en lote fuera de Contactos y vistas guardadas.

Límite: el dueño ya descartó el 27/11 que Jarvis cambie código (cerebro/02-ordenes-vigentes.md líneas 312 y 326). Los cambios de código van por la Oficina o la Bandeja.

## Hallazgos

### 1. (a) Mapa real de navegación hoy

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** 9 y recorrido completo
- **Cómo está hoy:** NIVEL GENERAL (/perfiles, al que redirige /): arriba tiene Cerebro, Oficina, Laboratorio de bots, Jarvis (lleva a /asistente) y Resumen de todo; después, las 4 tarjetas de perfil con Entrar al panel, Chats, Contactos, Campañas e Historial (03__perfiles.txt). El Cerebro tiene arriba Perfiles, Oficina, Jarvis y Bandeja (04__cerebro.txt). La Oficina tiene ← Cerebro y Bandeja para Claude (05__oficina.txt).
BARRA DEL PERFIL (menu.ts:165-178, menu-perfil.tsx:192-218): Hoy · Chats · Campañas · Resultados · Salud · Más. Al pie: Cerebro (pestaña nueva), Modo oscuro, Cambiar de perfil y Cerrar sesión.
PESTAÑAS POR SECCIÓN:
- Chats: Activos / Todos los chats / Consultas directas (solo Marketing) / Descartados / Incidencias. Ocultas: Limpieza y Lista.
- Campañas: Campañas / Bases / Extraer negocios (solo Marketing).
- Resultados: Resultados / Historial (el título de esa página dice «Estadísticas»).
- Salud: una sola vista.
HOJA «MÁS» (menu-mas.tsx:34-39 y 75-86):
- Contactos: Etapas / Citas / Seguimiento / Por base (en Marketing, además Prioritarios y Piden presupuesto); «Captados y casos» está oculto.
- Bot IA.
- WhatsApp oficial (Meta): Líneas / Plantillas / Perfil de WhatsApp y redes.
- WhatsApp por QR (Wasender): Líneas / Plantillas.
- Redes: Accesos / Publicaciones / Contenido / Publicidad.
- Ajustes.
- Accesos sueltos: Bandeja para Claude, Asistente general, Biblioteca de agentes, Comparar agentes y Cambiar de perfil (repetido).
SIEMPRE VISIBLES EN EL PERFIL: el orbe de Jarvis (Ctrl+J, marco-perfil.tsx:78), «Hablar con Jarvis» en el encabezado (encabezado-panel.tsx:51-58), el aviso de cambiar el código, la barra de salud y «Más opciones» al pie.
- **Por qué:** El menú se fue simplificando por capas (18/10, 24/10, 22/11) sin retirar lo anterior. Lo que salía de la barra se mandó a «Más» o se ocultó (oculto: true), y los accesos nuevos se sumaron como enlaces sueltos.
- **Evidencia:** src/lib/menu.ts:86-178; src/components/menu-mas.tsx:34-39; src/components/menu-perfil.tsx:122-236; src/components/perfiles/marco-perfil.tsx:47-78; capturas 02__hoy.png y 03__perfiles.png
- **Pasos:**
  1. Usar este mapa como base del menú nuevo (ver la estructura propuesta).
- **Archivos:** `src/lib/menu.ts`, `src/components/menu-mas.tsx`, `src/components/menu-perfil.tsx`

### 2. Jarvis tiene cinco puertas y además existen «Asistente general» y «Pedile algo»

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 2 y 9
- **Cómo está hoy:** Dentro del perfil se llega a Jarvis por:
- el orbe (marco-perfil.tsx:78);
- el botón del encabezado (encabezado-panel.tsx:57);
- el botón del hero de Hoy (hoy-bento.tsx:93);
- la barra del celular (menu-perfil.tsx:128);
- «Asistente general» en Más (menu-mas.tsx:35), que lleva a /asistente: la página se titula Jarvis pero en el menú se llama Asistente general.
Aparte, el Cerebro (cerebro-vista.tsx:228-231) y el Laboratorio (laboratorio-bot.tsx:145) montan otro chat, ChatAsistenteGeneral, con el rótulo «Pedile algo». Varios textos siguen nombrando «Pedile algo» o «el asistente»: bandeja-claude.tsx:108, roles-por-base.tsx:91 y 147, y la página de Redes (19__redes.txt:35 y 41). /jarvis da 404 (_rutas.json n=6). El dueño ve tres asistentes distintos.
- **Por qué:** Jarvis se montó el 22/11 encima del asistente anterior. El componente nuevo escucha el mismo evento (jarvis.tsx:95), pero quedaron el enlace viejo en Más, la página /asistente con otro nombre, los chats sueltos del Cerebro y del Laboratorio y los textos viejos.
- **Evidencia:** menu-mas.tsx:35; src/app/asistente/page.tsx:16 y 92-101; cerebro-vista.tsx:228; laboratorio-bot.tsx:145; _errores.txt línea 1
- **Pasos:**
  1. Dejar un solo nombre, Jarvis, y una sola dirección: crear src/app/jarvis/page.tsx con el contenido de /asistente, y que /asistente redirija a /jarvis conservando ?pedido.
  2. En menu-mas.tsx:35, quitar «Asistente general» de los accesos sueltos (sin borrar la ruta).
  3. Dentro del perfil, dejar el orbe más un único botón en el encabezado. Sacar el BotonJarvis de hoy-bento.tsx:93.
  4. En el Cerebro y el Laboratorio, reemplazar ChatAsistenteGeneral por una llamada a abrirAsistente() con contexto, para que sea el mismo Jarvis y no un chat paralelo.
  5. Cambiar los textos de «Pedile algo» y «el asistente» por «Jarvis» en bandeja-claude.tsx, roles-por-base.tsx, la página de Redes y los comentarios.
  6. Archivar src/components/asistente/asistente-panel.tsx dejando solo el reexporte del evento.
- **Archivos:** `src/components/menu-mas.tsx`, `src/app/asistente/page.tsx`, `src/components/inicio/hoy-bento.tsx`, `src/components/cerebro/cerebro-vista.tsx`, `src/components/perfiles/laboratorio/laboratorio-bot.tsx`, `src/components/bandeja/bandeja-claude.tsx`

### 3. Desde dentro de un perfil se ven datos de los otros rubros (Asistente general y Bandeja)

- **Tipo:** riesgo · **Esfuerzo:** S · **Punto del pedido:** 4, 9 y la regla de rubros separados
- **Cómo está hoy:** En Más, el acceso «Asistente general» abre /asistente?perfil=marketing, pero la página ignora el parámetro: solo lee «pedido» (asistente/page.tsx:51-53). Muestra cifras y propuestas de los 4 perfiles (líneas 41-48), y la propuesta que espera OK es de Jurídico (07__asistente.txt:132-143).
La Bandeja abierta desde Marketing lee las 100 tareas sin filtrar por rubro (bandeja/page.tsx:23-27). También ofrece un selector con los 4 perfiles (línea 34; 08__bandeja.txt:31-35) y muestra una tarea de Estudio Jurídico VITA (08__bandeja.txt:66-70).
En Resumen, la sección «Mis pendientes» manda recordatorios a la Bandeja del perfil que se elija (09__resumen.txt:221-237).
- **Por qué:** Las pantallas generales se montaron dentro del marco del perfil (MarcoPerfil), sin filtrar por rubro_id.
- **Evidencia:** src/app/asistente/page.tsx:41-53; src/app/bandeja/page.tsx:23-39
- **Pasos:**
  1. bandeja/page.tsx: filtrar con .eq('rubro_id', RUBRO_IDS[slug]) cuando se entra desde un perfil. Fijar el selector de perfil al perfil activo y agregar las opciones de alcance «Todo el panel» y «Los 4 rubros» solo en la vista general (Cerebro/Oficina). Esto se alinea con el punto 1.
  2. Dentro del perfil, el Jarvis del orbe ya recibe el slug. Sacar el enlace a /asistente de Más (ver el hallazgo anterior).
  3. Agregar una prueba unitaria que asegure que la Bandeja de un perfil no devuelve tareas de otro rubro_id.
- **Archivos:** `src/app/bandeja/page.tsx`, `src/components/bandeja/bandeja-claude.tsx`, `src/app/asistente/page.tsx`

### 4. Biblioteca y Comparar agentes están fuera de «Bot IA» y no hacen nada

- **Tipo:** existe sin conectar · **Esfuerzo:** M · **Punto del pedido:** 9
- **Cómo está hoy:** - «Comparar agentes» (menu-mas.tsx:37) es una redirección muerta: comparacion-agentes/page.tsx:3-7 dice «se cerró el 21/10» y manda a /agentes. El dueño toca y no pasa nada nuevo.
- «Biblioteca de agentes» (menu-mas.tsx:36) se presenta como «Solo configuración: ninguno responde mensajes» (biblioteca-agentes/page.tsx:71 y 81): solo edita nombre y objetivo. Ningún componente de Bot IA la enlaza; el único acceso es Más.
- Ajustes sigue diciendo «En Agentes IA y Comparación de agentes» (17__configuracion.txt:47-48; (dashboard)/configuracion/page.tsx:134).
- La comparación real existe en otro lado: el Laboratorio tiene «Comparar dos roles con el mismo mensaje» y «Publicar un agente» (12__laboratorio.txt:127 y 139-151).
- **Por qué:** La función se movió al Laboratorio y a Bot IA, pero los accesos viejos quedaron apuntando a pantallas cerradas o de solo configuración.
- **Evidencia:** src/app/comparacion-agentes/page.tsx:3-7; src/app/biblioteca-agentes/page.tsx:71 y 81; src/components/agentes/agentes-perfil-view.tsx:2-10
- **Pasos:**
  1. Convertir Bot IA en una sección con pestañas en menu.ts:161. Para Jurídico la base es /agentes; para los demás, /panel/<slug>/agentes. Pestañas: Cómo anda · Roles · Probar · Comparar · Ficha del negocio · Biblioteca · Historial.
  2. Comparar: llevar el comparador del Laboratorio (mismo mensaje, dos roles o dos versiones, con /api/laboratorio/simular) a una pestaña dentro de Bot IA. Archivar la redirección de comparacion-agentes y que apunte a esa pestaña.
  3. Biblioteca: dejarla como pestaña con acciones reales (publicar, pausar o asignar a un rol con confirmación), usando lo que ya existe en el bloque «Publicar un agente» del Laboratorio.
  4. Sacar los dos enlaces de menu-mas.tsx:36-37 y corregir el texto de Ajustes.
- **Archivos:** `src/lib/menu.ts`, `src/components/menu-mas.tsx`, `src/app/comparacion-agentes/page.tsx`, `src/app/biblioteca-agentes/page.tsx`, `src/components/agentes/agentes-perfil-view.tsx`

### 5. El Laboratorio de bots (general) duplica Bot IA y junta los 4 rubros

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 3 (Laboratorio decorativo) y 4
- **Cómo está hoy:** /laboratorio muestra los 4 bots juntos y permite cambiar de rubro desde la misma pantalla (12__laboratorio.txt:7-55). Repite lo mismo que tiene Bot IA de cada perfil (agentes-perfil-view.tsx:2-10): roles, probar, ficha del negocio e informe. Además se llega por tres caminos: Perfiles, Cerebro (tarjeta LABORATORIO) y Bot IA.
- **Por qué:** El Laboratorio se hizo el 22/11 como pantalla simple general, sin retirar la de cada perfil.
- **Evidencia:** src/app/laboratorio/page.tsx:16-38; 12__laboratorio.txt
- **Pasos:**
  1. Que /laboratorio pase a ser un tablero de solo lectura de los 4 bots (las tarjetas de arriba), donde cada tarjeta lleva a Bot IA de su perfil.
  2. Mudar el simulador, los roles, la ficha y la publicación a las pestañas de Bot IA de cada perfil.
  3. La tarjeta LABORATORIO del Cerebro lleva al tablero.
- **Archivos:** `src/app/laboratorio/page.tsx`, `src/components/laboratorio/laboratorio-simple.tsx`

### 6. Contactos y Captados existen pero no se encuentran

- **Tipo:** existe y no se encuentra · **Esfuerzo:** M · **Punto del pedido:** 8 y 9
- **Cómo está hoy:** - Contactos, la función central de un CRM, está en el grupo «mas» (menu.ts:172). Tiene búsqueda, filtros por origen y área, recorrido de etapas y acciones en lote (tabla-contactos.tsx:21 y 171-179), pero hay que abrir Más para llegar.
- «Captados y casos» está oculto (menu.ts:115). Además, /casos-cerrados redirige a /conversaciones?grupo=captados (cartera.ts:158-159). Hoy los captados aparecen como «Para cerrar» dentro de Chats > Activos (28__conversaciones.txt:45-68), como tarjeta en Hoy, en Resultados, en Resumen y en las tarjetas de Perfiles. No tienen una lista propia con nombre propio.
- **Por qué:** La simplificación del 22/11 dejó la barra en cinco destinos y metió Contactos en Más. Antes, el 13/11, los captados habían salido de su pestaña hacia Hoy y Resultados.
- **Evidencia:** src/lib/menu.ts:109-125 y 172; src/lib/cartera.ts:147-159
- **Pasos:**
  1. Llevar Contactos a la barra en lugar de Salud: en menu.ts, grupo 'trabajo'.
  2. Primera pestaña de Contactos: «Captados». Mostrar solo a quien pidió la llamada, según la regla que define otro agente en el punto 8, con orden por antigüedad y botones Derivar, Abrir chat y Ficha. Después vienen Etapas · Citas · Seguimiento · Por base · Descartados (Descartados se muda desde Chats).
  3. Que cartera.ts:159 redirija los casos viejos a esa pestaña.
  4. Que todos los «19 captados sin derivar» de Hoy, Resumen y Perfiles lleven a esa misma lista.
- **Archivos:** `src/lib/menu.ts`, `src/lib/cartera.ts`, `src/app/contactos/page.tsx`

### 7. «Hoy» repite cifras y tiene controles sin acción

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 10
- **Cómo está hoy:** En Hoy, la misma cifra aparece hasta tres veces:
- Derivados de la semana: en el anillo de la caja grande, en la caja «Derivados» y en las barras (hoy-bento.tsx:129, 150 y 163).
- Escribieron, Captados y Contactados: en sus cajas y otra vez en «La semana, paso a paso» (líneas 142-165; 02__hoy.txt:51-81).
- «Para decidir»: tres veces, como botón del hero «Ver 3 cosas para decidir» (88-91), como tarjeta de vidrio «Para decidir hoy 3» (99-103) y como la lista (169-184).
La tarjeta de vidrio no es un enlace ni un botón: es decorativa. Los atajos Chats/Contactos/Citas/Seguimiento (105-117) repiten el menú. «Hablar con Jarvis» aparece dos veces en la misma pantalla (encabezado y hero). Arriba de todo hay dos avisos fijos («Cambiá el código» y la barra de salud), y el contenido útil (la lista de Para decidir) queda debajo del primer pliegue en 1440x900 (02__hoy.png). Además, /hoy tardó 11,8 a 12,4 s en Jurídico, 0 km y Coberturas (_rutas.json n=2, 31 y 37).
- **Por qué:** El rediseño bento del 22/11 priorizó lo visual (cajas de color, vidrio, paralaje) sobre la tarea. Cada cifra se sumó en su propio componente y nadie quitó las repeticiones.
- **Evidencia:** src/components/inicio/hoy-bento.tsx:80-192; 02__hoy.png; 23__panel_juridico.txt:31-95
- **Pasos:**
  1. Hoy queda en tres bloques. (1) Franja de estado, solo si algo frena, con su botón. (2) «Para hacer» como protagonista, arriba: cada fila con su botón real (Responder N lleva al chat filtrado; Derivar N lleva a Contactos > Captados con «Derivar todos» en lote y confirmación; Retomar campaña). (3) Una tira de tres cifras de la semana (Escribieron · Captados · Derivados) que lleva a Resultados.
  2. Quitar la tarjeta de vidrio de las líneas 99-103, los atajos de las líneas 105-117, el bento «en cajitas» y «paso a paso» (pasan a Resultados) y el BotonJarvis del hero.
  3. Reemplazar el saludo grande por el parte de Jarvis en una línea («3 te esperan, 2 para derivar»).
  4. Medir y bajar el tiempo de /hoy, que debería estar por debajo de 2 s (lo trata el agente de velocidad).
- **Archivos:** `src/components/inicio/hoy-bento.tsx`, `src/app/hoy/page.tsx`, `src/lib/hoy/resumen-hoy.ts`

### 8. Las mismas cifras dan distinto en cada pantalla

- **Tipo:** existe y falla · **Esfuerzo:** L · **Punto del pedido:** 8, 10 y confianza general
- **Cómo está hoy:** Captados de Jurídico esta semana:
- 4 en Hoy (23__panel_juridico.txt:64-65), en Resultados (10__resultados.txt:36) y en la tarjeta de Perfiles (03__perfiles.txt:23-24);
- 6 en Jarvis (07__asistente.txt:61-62).
Captados totales de la semana:
- 8 en Resumen y en Jarvis;
- 6 si se suman las tarjetas de Perfiles (4+0+2+0).
Captados acumulados de Jurídico: 21 en Perfiles y Estadísticas, contra 19 sin derivar más 2 derivados en el embudo de Contactos. Derivados: «9,5 %» en Estadísticas (30__estadisticas.txt:40) contra «0 esta semana» en Hoy. Hay por lo menos cinco fuentes de datos distintas: resumen-hoy, resumenSemanaEnMemoria, profile_metrics, cartera y estadísticas.
- **Por qué:** Cada pantalla calcula sus cifras con su propia consulta y su propia definición de «captado» y de «semana». No hay una función única de métricas.
- **Evidencia:** src/app/asistente/page.tsx:35-38 (resumenSemanaEnMemoria); src/components/inicio/hoy-bento.tsx:36; supabase/migrations/0616_profile_metrics_una_pasada.sql
- **Pasos:**
  1. Crear una sola función pura en src/lib/metricas/semana.ts con una definición escrita: semana de lunes a domingo, hora de Argentina, y captado = pidió la llamada (punto 8).
  2. Que Hoy, Resultados, Perfiles, Resumen, Jarvis y el Cerebro lean de esa función, o de una RPC única en la base.
  3. Agregar una prueba unitaria que compare las cifras de cada pantalla con un mismo conjunto de datos.
- **Archivos:** `src/lib/hoy/resumen-hoy.ts`, `src/lib/asistente/semana-cache.ts`, `src/app/resumen/page.tsx`, `src/app/perfiles/page.tsx`

### 9. Tres formas de armar las direcciones y páginas copiadas por perfil

- **Tipo:** riesgo · **Esfuerzo:** L · **Punto del pedido:** recorrido completo
- **Cómo está hoy:** Conviven tres esquemas:
(1) Jurídico sin prefijo, dentro de (dashboard): /inbox, /prospectos, /agentes, /campanas, /bases, /agenda, /seguimiento, /estadisticas, /configuracion, /casos-cerrados.
(2) Los demás perfiles con /panel/<slug>/..., con páginas copiadas tres veces: agentes, bases, campanas, chats, configuracion, estadisticas, seguimiento, agenda y casos-cerrados en agencia_0km, coberturas_medicas y marketing.
(3) Páginas comunes con ?perfil=: /hoy, /conversaciones, /contactos, /resultados, /salud, /redes, /meta/lineas, /wasender, /bandeja, /incidencias y /descartados.
Hay además rutas que solo redirigen: /inicio, /derivar, /recuperar, /revision, /conversacion/[id], /panel/<slug> y /comparacion-agentes. Hay una de prueba visible (/diseno-muestra). Direcciones que el dueño escribiría de forma natural, como /jarvis, /chats y /citas, dan 404 (_errores.txt).
- **Por qué:** El panel nació para Jurídico y se clonó por perfil. Después se agregaron páginas comunes con ?perfil=, pero las copias nunca se migraron.
- **Evidencia:** Glob de src/app/**/page.tsx (más de 100 páginas); src/lib/navegacion.ts:41-54; _rutas.json n=6, 13, 15 y 22
- **Pasos:**
  1. Llevar todo a un único árbol src/app/panel/[slug]/<sección>, también para Jurídico (/panel/juridico/chats, etcétera), con una sola página por sección.
  2. Archivar las copias por perfil, que quedan como redirect() a la ruta nueva (nada se borra), en una migración por tandas: primero chats y agenda, después campañas y bases.
  3. Agregar alias /jarvis, /chats y /citas con redirect al perfil activo.
  4. Que navegacion.ts:fichaDe e inicioDePerfil devuelvan solo la ruta nueva.
  5. Cuidado: la Preview comparte base de datos. Probar las redirecciones con pruebas unitarias de menu.ts y navegacion.ts antes de publicar.
- **Archivos:** `src/app/(dashboard)`, `src/app/panel`, `src/lib/navegacion.ts`, `src/lib/menu.ts`

### 10. El mismo contacto tiene dos o tres fichas, y /ficha no muestra los datos que sí están en la base

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 5 (no se leen los datos del Excel en la ficha)
- **Cómo está hoy:** Para un contacto de Jurídico, fichaDe() lleva a /prospectos/[id] (navegacion.ts:52-54). Esa página muestra la base de origen, los datos editables, los «Datos recopilados por la IA» (qualification_data), las citas y la lista de conversaciones (prospectos/[id]/page.tsx:60-120). Para Coberturas, 0 km y Marketing, la ficha es /ficha/[id], que solo pide id, nombre, teléfono, email, DNI, origen y rubro (ficha/[id]/page.tsx:24-27) y deja afuera todo lo anterior. Se nota comparando 25__prospectos_9b7b... con 62__ficha_9b7b... (el mismo contacto) y en 38__ficha_18e1.... Marketing tiene una tercera ficha: /panel/marketing/lead/[id].
- **Por qué:** La ficha nueva y apta para teléfono (bloque 1.7) se hizo sin traer las secciones de la ficha vieja, y para los otros tres perfiles es la única que existe.
- **Evidencia:** src/app/ficha/[id]/page.tsx:24-27 y 47-49; src/app/(dashboard)/prospectos/[id]/page.tsx:73-120
- **Pasos:**
  1. Una sola ficha en /ficha/[id] o /panel/[slug]/ficha/[id] con todas las secciones: datos editables, base de origen, todas las columnas del Excel importado (las detalla el agente del punto 5), datos recopilados por la IA, citas, conversaciones, notas y el historial «Qué pasó».
  2. Que /prospectos/[id] y /panel/marketing/lead/[id] redirijan a esa ficha.
  3. Que fichaDe() devuelva una sola ruta.
- **Archivos:** `src/app/ficha/[id]/page.tsx`, `src/app/(dashboard)/prospectos/[id]/page.tsx`, `src/app/panel/marketing/lead/[id]/page.tsx`, `src/lib/navegacion.ts`

### 11. Pantallas con contadores y títulos repetidos

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** 10 y recorrido completo
- **Cómo está hoy:** - Incidencias muestra dos veces los cuatro contadores, Incidencias abiertas / Detenciones / Retenidos / Archivos (18__incidencias.txt:41-56), y repite el título («Incidencias» como pestaña y como h1).
- Chats > Activos muestra «Para cerrar 19» tres veces (28__conversaciones.txt:45-66).
- Campañas, Citas y Consultas directas repiten la pestaña como título (29__campanas.txt:29-31, 49__...agenda.txt:25-31, 60__...consultas_directas.txt:25-30).
- Resultados lleva a «Historial», pero esa página se titula «Estadísticas» (30__estadisticas.txt:29-31).
- **Por qué:** Cada pantalla suma su encabezado y su resumen además de las pestañas del marco (PestanasSeccion), y nadie quitó las repeticiones.
- **Evidencia:** src/components/perfiles/encabezado-panel.tsx:65-123 y las capturas indicadas
- **Pasos:**
  1. Regla: si hay pestañas, el h1 de la página es la pestaña activa y no se repite visualmente.
  2. Incidencias: dejar un solo juego de contadores.
  3. Activos: un solo «Para cerrar», con la lista.
  4. Unificar el nombre: o «Historial» o «Estadísticas».
- **Archivos:** `src/app/incidencias/page.tsx`, `src/app/conversaciones/page.tsx`, `src/app/(dashboard)/estadisticas/page.tsx`

### 12. Avisos fijos arriba de todas las pantallas

- **Tipo:** diseño · **Esfuerzo:** S · **Punto del pedido:** 6 y 10
- **Cómo está hoy:** En todas las pantallas del perfil aparecen el aviso «Cambiá el código de ingreso por uno de 8 números» y la barra «Un problema frena la operación… 7 mensajes retenidos» (todos los .txt del perfil, líneas 20-28). En Hoy, además, se repiten «3 líneas con problema» y el aviso del código (02__hoy.png). Suman de 120 a 140 px fijos antes del contenido.
- **Por qué:** AvisoCodigoAnterior y BarraSalud se montan en MarcoPerfil (marco-perfil.tsx:59-66) sin que se puedan cerrar y sin aparecer una sola vez.
- **Evidencia:** src/components/perfiles/marco-perfil.tsx:56-66
- **Pasos:**
  1. Pasar el aviso del código a un punto en el menú o en Ajustes, que se pueda cerrar por sesión.
  2. Convertir la barra de salud en un semáforo compacto en el encabezado (un punto rojo con «2 problemas») que abre Salud. Que la barra completa aparezca solo en Hoy.
- **Archivos:** `src/components/perfiles/marco-perfil.tsx`, `src/components/salud/barra-salud.tsx`, `src/components/acceso/aviso-codigo-anterior.tsx`

### 13. Cerebro: textos encimados y tarjetas que no hacen nada

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 3
- **Cómo está hoy:** En 04__cerebro.png, la cifra «15.196 contactos que conoce» y las etiquetas SEMANA y DECISIONES de las tarjetas de atrás quedan encimadas sobre la esfera de partículas. Las tarjetas laterales del carrusel se leen deformadas. Los cuadros de selección sobre «ordenale» y «454 mensajes» parecen un error visual. Cada tarjeta tiene «Abrir», pero solo abre información: no hay acciones (eso lo cubre otro agente). Arriba, «Jarvis» lleva a /asistente.
- **Por qué:** Un carrusel 3D con capas superpuestas, sin reservar espacio para el texto de la esfera.
- **Evidencia:** 04__cerebro.png; 04__cerebro.txt:21-117; src/components/cerebro/centro-cerebro.tsx:226
- **Pasos:**
  1. Sacar la cifra de la esfera a una línea propia debajo del buscador.
  2. Reemplazar el carrusel por una grilla de 2x5 tarjetas planas, legibles y con un botón de acción cada una. Dejar el 3D como detalle sutil, de acuerdo con el rediseño.
  3. Que «Jarvis» lleve a /jarvis.
- **Archivos:** `src/components/cerebro/cerebro-vista.tsx`, `src/components/cerebro/centro-cerebro.tsx`, `src/app/cerebro/cerebro.css`

### 14. Perfiles y Resumen de todo hacen lo mismo

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 6 y recorrido completo
- **Cómo está hoy:** /perfiles dice «Lo pendiente de cada perfil, la semana…» y /resumen dice «Lo pendiente de los cuatro perfiles, en un vistazo». Las dos muestran captados sin derivar, gente que pide una persona y cifras de la semana por perfil (03__perfiles.txt y 09__resumen.txt). Resumen repite cada tarea con «Resolver acá» y «Ocultar por hoy» (09__resumen.txt:65-149) y vuelve a mostrar las cifras por perfil (165-219). Las tarjetas de Perfiles muestran nombres de captados en la portada.
- **Por qué:** Resumen de todo se agregó el 22/11 como pantalla aparte en lugar de ser parte de la portada.
- **Evidencia:** src/app/perfiles/page.tsx:48; src/app/resumen/page.tsx:19
- **Pasos:**
  1. Una sola portada general: arriba, la lista «Para hacer hoy» de los 4 perfiles agrupada por perfil; debajo, las 4 tarjetas de entrada.
  2. Que /resumen redirija a la portada.
  3. Mover «Mis pendientes» a recordatorios propios (ver funciones que faltan), no a la Bandeja para Claude.
- **Archivos:** `src/app/perfiles/page.tsx`, `src/app/resumen/page.tsx`, `src/components/resumen/anotar-pedido.tsx`

### 15. Velocidad: /hoy y /salud tardan unos 12 segundos

- **Tipo:** velocidad · **Esfuerzo:** M · **Punto del pedido:** 6 (más velocidad)
- **Cómo está hoy:** Según _rutas.json, la primera carga de /hoy tardó 11.823 ms, la de /panel/agencia_0km (que va a /hoy) 12.327 ms, la de /panel/coberturas_medicas 12.443 ms y la de /salud 11.755 ms. El resto de las pantallas tarda entre 1,5 y 3 s.
- **Por qué:** Sin perfilar todavía. Hay que revisar si Hoy y Salud hacen chequeos a servicios externos (Meta, Wasender) cuando se pide la página.
- **Evidencia:** _rutas.json n=2, 11, 31 y 37
- **Pasos:**
  1. Lo trata el agente de velocidad: revisar qué consultas hace hoy/page.tsx y salud/page.tsx al cargar, cachear los chequeos de líneas y transmitir el contenido por partes.
- **Archivos:** `src/app/hoy/page.tsx`, `src/app/salud/page.tsx`

### 16. Lo que anda bien y hay que cuidar

- **Tipo:** anda bien · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** - El «Volver» recuerda de dónde se vino (navegacion.ts:10-38).
- Todo lo que envía o cambia pregunta «¿Lo hago?» y explica a quién y desde qué línea (07__asistente.txt:136-143).
- El menú se puede personalizar por perfil (menu.ts:75-79).
- «Más» es un diálogo accesible con Escape y foco (menu-mas.tsx:32 y 43).
- Hay enlace «Saltar al contenido» (marco-perfil.tsx:43).
- Contactos tiene filtros y acciones en lote con CSV (tabla-contactos.tsx:171-179).
- Salud explica el problema y ofrece el botón que lo resuelve (11__salud.txt:34-46).
- Resultados tiene un embudo claro con «Ver quiénes» (10__resultados.txt:43-71).
- Campañas aclara que preparar no envía nada.
- **Por qué:** Son decisiones de diseño buenas.
- **Pasos:**
  1. Conservar estos patrones en el rediseño y replicar «Ver quiénes» y «¿Lo hago?» en las pantallas nuevas.

## Propuestas

- **(b) Estructura final, menú del perfil** (M). Barra: Hoy · Chats · Contactos · Campañas · Resultados · Más.
- Chats: Para responder · Todos · Incidencias (· Consultas directas en Marketing).
- Contactos: Captados · Etapas · Citas · Seguimiento · Por base · Descartados (Prioritarios y Piden presupuesto en Marketing).
- Campañas: Campañas · Bases (· Extraer negocios).
- Resultados: Esta semana · Historial.
- Más: Bot IA (Cómo anda · Roles · Probar · Comparar · Ficha del negocio · Biblioteca · Historial), WhatsApp y plantillas (Líneas Meta · Plantillas con asignación manual · Wasender · Perfil de WhatsApp), Redes, Salud, Ajustes y Bandeja para Claude.
- Siempre a mano: Jarvis, con el orbe y un solo botón en el encabezado.
- Se archivan del menú (las rutas quedan como redirección): Asistente general, Comparar agentes, Biblioteca suelta y el segundo «Cambiar de perfil».
- **(b) Estructura final, nivel general** (M). - Inicio: Perfiles y Resumen fusionados, con «Para hacer hoy» de los 4 perfiles más las 4 tarjetas.
- Jarvis (/jarvis): los 4 perfiles juntos.
- Cerebro: Preguntar / Enseñar / Ordenar, memoria, pendientes de los dueños, mapa.
- Oficina: tareas con alcance Perfil / Los 4 rubros / Todo el panel.
- Bandeja general: todas las tareas, filtrables por alcance.
- Tablero de bots: solo lectura, cada tarjeta lleva a Bot IA del perfil.
Los perfiles no muestran nada de otro rubro.
- **(d) P1: búsqueda global con Ctrl+K dentro del perfil activo** (M). Hoy solo se puede buscar dentro de Contactos, que además está en Más. El único atajo que existe es Ctrl+J para Jarvis (jarvis.tsx:84). La propuesta es una paleta que busque contacto (nombre, teléfono, DNI), chat, campaña o base y también acciones («ir a Captados», «nueva campaña»), filtrando por rubro_id del perfil.
- **(d) P1: recordatorios y tareas por contacto** (M). No hay forma de anotar «llamar el jueves» en la ficha. «Mis pendientes» de Resumen manda los recordatorios a la Bandeja para Claude (09__resumen.txt:221-237), que mezcla tareas humanas con tareas para la IA. La propuesta: tabla de recordatorios por contacto (nueva migración con RLS), que aparezcan en Hoy y avisen al número de aviso del perfil.
- **(d) P1: acciones en lote en Captados y Chats** (M). Hoy existen solo en Contactos (tabla-contactos.tsx:171). Sumar en Captados «derivar seleccionados» y «copiar datos para el profesional», y en Chats «tomar», «devolver al bot», «marcar perdido» y «enviar plantilla de reapertura». Todo con confirmación y sin borrar.
- **(d) P2: vistas guardadas y contadores en el menú** (S). Poder guardar filtros de Contactos y Chats (por ejemplo «Civil, landing, sin responder 24 h») y mostrar un número junto a Chats y Contactos (esperan respuesta, captados sin derivar) evita repetir cifras en Hoy.
- **(d) P2: atajos de teclado básicos** (S). G H para Hoy, G C para Chats, G O para Contactos, / para buscar y R para responder en un chat, con una hoja de ayuda que se abre con ?.
- **(d) P2: cronología única del contacto** (M). Que la ficha unificada junte en una línea de tiempo mensajes, cambios de etapa, campañas recibidas, plantillas enviadas, citas y notas. Hoy esa información está repartida entre «Qué pasó con esta persona», la conversación y la campaña.
- **(d) P3: notificaciones dentro del panel** (M). Una campana con lo nuevo desde la última visita (respuestas, captados, líneas caídas, propuestas de Jarvis), en lugar de los avisos fijos arriba de cada pantalla.
- **Orden sugerido de trabajo** (L). 1) Rubros separados en la Bandeja y en el Asistente general, y un solo Jarvis (S-M, riesgo de orden vigente).
2) Menú nuevo con Contactos y Captados en la barra y Bot IA con pestañas.
3) Hoy compacto.
4) Ficha única.
5) Métricas únicas.
6) Árbol de direcciones único.
7) Búsqueda global y recordatorios.

## Preguntas para el dueño

- Barra del perfil: ¿Contactos (con Captados primero) reemplaza a Salud en la barra, y Salud pasa a ser un semáforo en el encabezado? (a) Sí. (b) No, Salud sigue en la barra y Contactos también: serían 6 destinos.
- WhatsApp: ¿juntamos Meta y Wasender en una sección «WhatsApp y plantillas» con pestañas separadas (Oficial / Por QR), o se mantienen como dos secciones (orden del 17/11)? (a) Una sección con dos pestañas. (b) Dos secciones, como ahora.
- Laboratorio de bots general: (a) queda como tablero de solo lectura de los 4 bots y todo lo que se edita pasa a Bot IA de cada perfil (recomendado, cada rubro separado); (b) se archiva del todo.
- Portada: ¿fusionamos Perfiles y Resumen de todo en una sola pantalla de inicio? (a) Sí. (b) No, dejar Resumen aparte.
- Direcciones: ¿aprobás pasar todos los perfiles, también Jurídico, a /panel/<perfil>/..., dejando las direcciones viejas como redirecciones (nada se borra)? (a) Sí, por tandas. (b) Solo las nuevas pantallas.

## Herramientas usadas

- Read (código, 30 textos del recorrido, _rutas.json, _errores.txt y las capturas 02__hoy.png, 03__perfiles.png y 04__cerebro.png)
- Glob (lista de páginas y del recorrido)
- Grep (accesos a Jarvis y al asistente, redirecciones, lotes, atajos, recordatorios)
- Skill intent:evaluate (marco heurístico y de prioridades)
- No usé el CLI de Graphify porque no tenía terminal en esta sesión; ubiqué el código con Grep y Glob
- No usé Supabase: no hizo falta para este análisis
