# Análisis del panel · cerebro (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

Analicé el Cerebro dentro del panel en modo solo lectura: código en src/app/cerebro, src/components/cerebro, src/lib/cerebro, src/lib/jarvis/cerebro-memoria*, las rutas /api/cerebro/*, /api/oficina/arrancar y /api/bandeja-claude, la migración 0650, la captura 04__cerebro (más _rutas.json y 12__laboratorio) y agregados de Supabase. Ningún archivo del repo se tocó.

En una frase: el Cerebro es una vitrina bien armada encima de un motor que casi no existe. Lo que el dueño ve como «0 funcional» tiene estas causas, comprobadas en el código y en la base:

1. **Preguntale no usa IA.** Hace una búsqueda por palabras sueltas sobre los .md del cerebro y devuelve hasta 5 pedazos crudos de hasta 1400 caracteres. No arma ninguna respuesta. No depende de Gemini, así que no hay ni error silencioso ni problema de clave: directamente no hay generación.
2. **Enseñale anda.** La tabla cerebro_conocimiento existe y tiene 1 fila (una regla cargada por el operador). Lo que el dueño ve como roto es que después la pregunta no lo devuelve como respuesta.
3. **Ordenale crea la tarea, pero nadie la ejecuta.** Solo acepta un rubro (ni 4 rubros ni todo el panel). La tarea va a bandeja_claude y «Arrancar» nunca llega a Claude: el último arranque, del 25/11, quedó «sin_disparador» porque faltan OFICINA_DISPARO_URL y OFICINA_DISPARO_TOKEN en Vercel. Encima la ruta responde 200 y la pantalla lo muestra en verde, como si hubiera salido bien.
4. **Pedidos a Claude: no hay quien los lea.** La Bandeja tiene 3 filas y 1 pendiente desde el 25/11. La última vez que Claude tomó una fue el 20/11. No hay cron en vercel.json ni tarea programada.
5. **Pendientes, preguntas, alertas y propuestas están escritos a mano** en src/lib/cerebro/contenido.ts (ACTUALIZADO = «21/11/2026»). «Ya lo hice» solo guarda en el navegador (localStorage) y deja una propuesta en la Bandeja; además un pendiente general cae en la bandeja de Marketing, lo que rompe la separación de rubros.
6. **Salud del panel solo muestra la lista.** No muestra las acciones (`accion`/`href`) que los controles ya traen y que /salud sí usa. Las alertas son texto fijo que termina en «No toqué ninguna».
7. **Laboratorio: el 4 es fijo en el código y el simulador no está adentro.** La pantalla incrusta ConocimientoBot, no el simulador. El laboratorio completo muestra los 4 rubros juntos.
8. **El mapa solo se mira.** Es un resumen de GRAPH_REPORT.md del 22/11; buscar un barrio no lleva a ninguna parte. El graph.json no se incluye en el despliegue (el panel publicado solo lleva los .md).
9. **La pantalla Jarvis del Cerebro incrusta el asistente virtual** (ChatAsistenteGeneral). El botón «Jarvis» de arriba lleva a /asistente, y /jarvis devolvió 404 en el recorrido.
10. **Texto superpuesto debajo de la animación.** Dentro del anillo 3D, la cifra «15.196 contactos que conoce» de la esfera queda encima de los títulos del dorso de las tarjetas de atrás (SEMANA, DECISIONES). La esfera no tiene fondo y las etiquetas del dorso se ven a través.

Con estos datos diseñé el «Cerebro que aprende solo» en 8 partes. Cada una dice qué corre en el panel (Gemini, Vercel, pg_cron) y qué en tareas programadas de Claude. Hay tres límites técnicos reales:
- Una función de Vercel no puede reescribir su propio código: los cambios de código salen como rama, Preview y PR que arma Claude.
- El panel no puede recorrerse solo con un navegador de forma barata: eso lo hace una tarea programada de Claude.
- Hoy no hay ningún tope de gasto de Gemini ni registro de consumo. Hay que construirlo antes de que el cerebro empiece a aprender solo.

Un dato a favor: pg_cron y pg_net ya están instalados en la base (pg_cron con 1 tarea activa) y vector, pg_trgm y unaccent están disponibles para activar sin costo. El documento cerebro/22-plan-panel-2711.md que citan las órdenes del 27/11 todavía no existe en esta copia del repo.

## Hallazgos

### 1. «Preguntale» no responde: busca palabras sueltas y devuelve pedazos crudos de los .md

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 3 · Cerebro: no deja responder preguntas
- **Cómo está hoy:** src/components/cerebro/barra-mando.tsx:104-117 llama a POST /api/cerebro/preguntar. src/app/api/cerebro/preguntar/route.ts:14 llama a preguntarAlCerebro(pregunta, 5); su comentario lo dice: «Solo lee, sin IA». src/lib/cerebro/conocimiento-servidor.ts:20-25 junta buscarEnCerebro (src/lib/jarvis/cerebro-memoria.ts:52-70: cuenta palabras en común, el título vale doble) sobre todos los .md de cerebro/ hasta 3 niveles de carpetas (chats, traspasos, biblioteca) más lo aprendido. Devuelve hasta 6 pedazos de 1400 caracteres sin redactar nada. No usa Gemini, así que no hay clave, tope ni modelo que falle: directamente no hay generación. Los .md sí viajan con el despliegue (next.config.mjs:30-37, outputFileTracingIncludes para /api/cerebro/** y /cerebro).
- **Por qué:** Se armó como buscador provisorio sin modelo de lenguaje y sin ranking por relevancia. Una pregunta natural («¿por qué no envía Coberturas?») trae traspasos viejos y chats con palabras sueltas en común, y el dueño recibe texto pegado, no una respuesta. Lo enseñado entra solo con 2 resultados y compite por palabras.
- **Evidencia:** route.ts línea 7 (comentario «Solo lee, sin IA»); cerebro-memoria.ts:52 (buscarEnCerebro por palabras); 04__cerebro.png: la barra «Preguntale: Busca en toda la memoria y te dice de dónde sale».
- **Riesgo:** Al sumar Gemini aparece gasto: necesita el tope y el registro de consumo del hallazgo de Gemini antes de prenderlo.
- **Pasos:**
  1. Migración nueva 0660_cerebro_memoria.sql: tabla cerebro_fragmentos (fuente, ruta, rubro_id nulo = general, alcance, titulo, texto, hash, version, fts tsvector en español con unaccent, embedding vector(768) opcional, vigente, archivada_at), con índices GIN en fts y pg_trgm y RLS con solo service_role.
  2. src/lib/cerebro/recuperar.ts (función pura más servidor): búsqueda híbrida (texto completo, trigramas y vector si está activo), filtrada por alcance y rubro (desde un rubro solo ve ese rubro más lo general), con preferencia por lo más nuevo y por lo enseñado.
  3. src/lib/cerebro/responder.ts: Gemini (identificadorModelo() de src/lib/agentes/modelo.ts) con la instrucción «respondé solo con estos fragmentos y citá [n]». Devuelve JSON {respuesta, citas[{fuente, ruta, fecha}], confianza}. Si no hay clave o se alcanzó el tope, cae a la lista actual con el aviso «sin IA».
  4. Reescribir /api/cerebro/preguntar para que use recuperar más responder, y registrar cada pregunta y su respuesta en cerebro_preguntas y el gasto en ia_consumo.
  5. barra-mando.tsx: mostrar la respuesta redactada arriba y las citas desplegables debajo, más los botones «Enseñale una corrección» y «Convertir en orden».
  6. Pruebas unitarias para recuperar (filtro por rubro y orden) y para el armado del prompt (que no lleve datos personales).
- **Archivos:** `src/app/api/cerebro/preguntar/route.ts`, `src/lib/cerebro/conocimiento-servidor.ts`, `src/lib/jarvis/cerebro-memoria.ts`, `src/lib/jarvis/cerebro-memoria-servidor.ts`, `src/components/cerebro/barra-mando.tsx`, `next.config.mjs`

### 2. «Enseñale» guarda bien, pero lo enseñado no se nota al preguntar

- **Tipo:** existe y no se encuentra · **Esfuerzo:** S · **Punto del pedido:** 3 · Cerebro: no se puede enseñar
- **Cómo está hoy:** barra-mando.tsx:120-145 pide confirmación y hace POST /api/cerebro/conocimiento. La ruta (src/app/api/cerebro/conocimiento/route.ts:19-34) valida y guarda en cerebro_conocimiento (0650). En la base hay 1 fila vigente (tipo regla, creada por el operador). Lo leen la pantalla «Aprendido» y Jarvis (src/lib/jarvis/servidor.ts:233), pero solo con la búsqueda por palabras.
- **Por qué:** El guardado funciona. Al preguntar, lo enseñado aparece solo si comparte palabras exactas, así que el dueño siente que no aprendió. Además el límite de 4000 caracteres no deja enseñar documentos ni Excel, y no hay versionado: si se enseña algo que contradice algo anterior, no queda registrado que lo reemplaza.
- **Evidencia:** Supabase: cerebro_conocimiento total=1, vigente=1, tipo regla/operador.
- **Pasos:**
  1. Al guardar en cerebro_conocimiento, crear también su fragmento en cerebro_fragmentos (fuente 'ensenado', con prioridad).
  2. Sumar la columna reemplaza_a (uuid) y una opción «corrige a…» al enseñar: lo viejo queda archivado y enlazado, nunca pisado.
  3. Permitir adjuntar .md, .txt, .pdf o .xlsx (Supabase Storage, bucket privado): se parte en fragmentos y se rechazan filas con datos personales (pareceDatoPersonal).
  4. En la respuesta, marcar «lo enseñaste vos el dd/mm».
- **Archivos:** `src/app/api/cerebro/conocimiento/route.ts`, `src/lib/cerebro/conocimiento.ts`, `supabase/migrations/0650_cerebro_conocimiento.sql`

### 3. «Ordenale» crea la tarea pero nunca llega a Claude, y la pantalla dice que arrancó

- **Tipo:** existe sin conectar · **Esfuerzo:** M · **Punto del pedido:** 3 · Cerebro: no se puede ordenar · 1 · Oficina, alcance y quién ejecuta
- **Cómo está hoy:** barra-mando.tsx:147-162 hace POST /api/oficina con {perfil, pedido}. La ruta exige un solo perfil (src/app/api/oficina/route.ts:28, rubroIdDePerfil), así que no hay alcance «4 rubros» ni «todo el panel», y bandeja_claude.rubro_id es NOT NULL (0502_bandeja_claude.sql:20). «Arrancar» llama a /api/oficina/arrancar → disparar() (src/lib/oficina/servidor.ts:73-76): sin OFICINA_DISPARO_URL ni OFICINA_DISPARO_TOKEN devuelve 'sin_disparador'. La ruta responde 200 en ese caso (arrancar/route.ts:38, solo 'fallo' da 502) y barra-mando.tsx:176 lo muestra en la caja verde de éxito. En la base el último arranque (25/11 20:08) quedó 'sin_disparador'.
- **Por qué:** Falta configurar en Vercel el disparo hacia Claude (una tarea de Claude Code que se pueda disparar por URL). Tampoco hay tarea programada de respaldo, y el error se presenta como éxito.
- **Evidencia:** Supabase: oficina_arranques → terminado 1, sin_disparador 1; el último fue 'sin_disparador' (25/11).
- **Riesgo:** Cada arranque consume el plan de Claude: mantener la espera de 15 min (puedeArrancar).
- **Pasos:**
  1. arrancar/route.ts: con 'sin_disparador' devolver 503 y mostrar en rojo «Falta conectar a Claude; la tarea queda en la mesa de entrada».
  2. Conectar el disparo: crear una tarea programada de Claude sin horario, que solo se dispara (fire_trigger), con instrucciones «leer bandeja_claude pendiente/en_espera y trabajar», y cargar su URL de disparo y su token en Vercel (OFICINA_DISPARO_URL y OFICINA_DISPARO_TOKEN; la clave nunca va al repo).
  3. Respaldo: tarea programada de Claude cada 3 h (fuera de 6 a 9 h del Pacífico), que trabaja lo pendiente aunque nadie toque «Arrancar».
  4. Alcance (compartido con la Oficina): migración que agrega bandeja_claude.alcance ('rubro','cuatro_rubros','panel') y deja rubro_id nulo cuando el alcance no es un rubro (CHECK: rubro_id obligatorio si alcance = 'rubro'). Sumar el selector «Un rubro / Los 4 rubros / Todo el panel» en barra-mando.tsx y en la Oficina.
  5. Ejecutor Gemini cuando Claude no está disponible (pedido 1): la tarea queda «hecha por Gemini, sin repasar» y entra a la cola de repaso de Claude.
- **Archivos:** `src/components/cerebro/barra-mando.tsx`, `src/app/api/oficina/route.ts`, `src/app/api/oficina/arrancar/route.ts`, `src/lib/oficina/servidor.ts`, `supabase/migrations/0502_bandeja_claude.sql`

### 4. «Pedidos a Claude» no llegan: se escriben en bandeja_claude y nadie los lee

- **Tipo:** existe sin conectar · **Esfuerzo:** S · **Punto del pedido:** 3 · Los pedidos a Claude no llegan
- **Cómo está hoy:** src/components/cerebro/hablar-con-claude.tsx:41-46 hace POST /api/bandeja-claude: sí escribe en bandeja_claude. Quien la lee, según .claude/referencias/bandeja-claude.md: «Claude no corre dentro del panel y no hay tarea programada: las toma cuando la responsable abre un chat… y dice ok». vercel.json no tiene crons. En la base: 3 filas (1 pendiente, 1 lista, 1 descartada); la última llegó el 25/11 y la última tomada fue el 20/11. cerebro/07-estado-verificado.md:82 todavía dice «0 tareas abiertas».
- **Por qué:** Por diseño el consumidor es manual (alguien escribe «ok» en un chat). No hay disparo configurado ni tarea programada. Además el formulario obliga a elegir un rubro (no existe «todo el panel») y no muestra cuándo miró Claude la bandeja por última vez.
- **Evidencia:** Supabase: bandeja_pendiente 1, bandeja_ultima 2026-11-25, bandeja_ultima_tomada 2026-11-20.
- **Pasos:**
  1. Mismo disparo y tarea de respaldo cada 3 h del hallazgo anterior; la tarea marca en_curso, lista o en_espera con resultado, como dice bandeja-claude.md.
  2. Latido: la tarea de Claude escribe system_settings 'claude_bandeja_ultimo_paso' y la pantalla muestra «Claude miró la bandeja hace X» o «Claude no miró desde dd/mm».
  3. Cuando un pedido se guarda, si hay disparo, se dispara al instante (con la misma espera de 15 min).
  4. Opción de alcance «Todo el panel» en HablarConClaude (depende de la columna alcance).
  5. Actualizar 07-estado-verificado.md con el conteo real (lo hace la sesión que cierre la vuelta).
- **Archivos:** `src/components/cerebro/hablar-con-claude.tsx`, `src/app/api/bandeja-claude/route.ts`, `.claude/referencias/bandeja-claude.md`, `vercel.json`

### 5. «Pendientes de los dueños» están escritos a mano: no se pueden marcar, responder ni delegar

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 3 · En Pendientes de los dueños no se puede hacer nada
- **Cómo está hoy:** PENDIENTES, PREGUNTAS_ABIERTAS, ALERTAS, PROPUESTAS y CORRECCIONES son constantes en src/lib/cerebro/contenido.ts:78-160, con ACTUALIZADO='21/11/2026' en la línea 57 (la captura muestra «MEMORIA AL 21/11/2026»). src/components/cerebro/tablero-pendientes.tsx:35-52: «Ya lo hice» solo existe en la columna de los dueños, deja una PROPUESTA en la Bandeja y guarda «hecho» en localStorage (línea 46), que se pierde en otro dispositivo; el pendiente sigue en la lista. Las 5 preguntas abiertas no tienen dónde responderse. No hay botón para delegar. Error de rubros: PERFIL_DE todos→'marketing' (tablero-pendientes.tsx:15), así que un pendiente general cae en la bandeja de Marketing; en pantallas-cerebro.tsx:26 todos→'juridico'.
- **Por qué:** El contenido se pensó como resumen de la memoria que Claude actualiza en el código en cada vuelta. No hay tabla ni API: cualquier cambio necesita un despliegue.
- **Evidencia:** 04__cerebro.txt: «PENDIENTES 7 urgentes · 21 en total · 5 preguntas» y «MEMORIA AL 21/11/2026».
- **Riesgo:** Hoy mandar un pendiente general a la bandeja de Marketing rompe la regla de rubros separados.
- **Pasos:**
  1. Migración: tabla cerebro_pendientes (columna duenos|claude|despues|pregunta, texto, rubro_id nulo, alcance, urgente, estado abierto|hecho|delegado|archivado, respuesta, delegado_a oficina|bandeja|jarvis, bandeja_id, autor, cerrado_at) con RLS, sin borrados; carga inicial desde contenido.ts.
  2. API /api/cerebro/pendientes (GET, POST y PATCH con requireSession): marcar hecho (con confirmación, queda en ops_change_log), responder (la respuesta también se guarda en cerebro_conocimiento como regla con la fuente «respuesta del dueño dd/mm»), delegar (crea una tarea de Oficina o Bandeja con su alcance y la enlaza) y archivar.
  3. tablero-pendientes.tsx: leer de la API, sacar localStorage y sumar los botones Hecho, Responder, Delegar y Archivar, más un formulario para agregar un pendiente.
  4. Corregir PERFIL_DE: lo general va con alcance 'panel', no a Marketing ni a Jurídico.
  5. La tarea nocturna de Claude sincroniza cerebro/08-pendientes-y-plan.md con la tabla en las dos direcciones, solo agregando.
  6. ACTUALIZADO pasa a calcularse: la fecha más nueva entre fragmentos y pendientes.
- **Archivos:** `src/lib/cerebro/contenido.ts`, `src/components/cerebro/tablero-pendientes.tsx`, `src/components/cerebro/pantallas-cerebro.tsx`, `src/components/cerebro/cerebro-vista.tsx`

### 6. «Salud del panel» dentro del Cerebro solo lista: las acciones existen pero no se muestran

- **Tipo:** existe sin conectar · **Esfuerzo:** M · **Punto del pedido:** 3 · Salud del panel: no se puede accionar
- **Cómo está hoy:** cerebro-vista.tsx:380-391 muestra solo lecturaSimple(i).que, sin la acción. En cambio src/components/salud/salud-vista.tsx:43-45 y 171-177 sí usan i.accion e i.href (los controles ya traen qué hacer). Las «Alertas para ustedes» son ALERTAS fijas en contenido.ts y terminan en «No toqué ninguna» (línea 399). /salud tardó 11.755 ms en el recorrido (_rutas.json n=11).
- **Por qué:** La pantalla del Cerebro se armó como resumen visual y descartó el campo de acción; tampoco hay acciones de servidor para corregir nada desde ahí.
- **Evidencia:** 04__cerebro.txt: «SALUD 4 cosas para revisar · 8 de 12 controles en verde»; _rutas.json: /salud 11755 ms.
- **Pasos:**
  1. cerebro-vista.tsx: mostrar por cada control su accion e href con un botón, más «Que lo arregle la Oficina» (tarea con alcance y rubro del control) y «Preguntale al cerebro por qué».
  2. Catálogo de arreglos directos seguros, con confirmación y registro, para los controles que lo permiten (marcar retenidos como revisados, reintentar latido, reprocesar errores), reutilizando lo que ya expone src/lib/asistente/panel-operaciones.ts.
  3. Reemplazar ALERTAS fijas por alertas calculadas (salud más el informe del recorrido) guardadas en cerebro_informes.
  4. Velocidad: cachear leerSalud 60 s (unstable_cache) y cargar la pantalla Salud con Suspense, para no frenar /cerebro.
- **Archivos:** `src/components/cerebro/cerebro-vista.tsx`, `src/lib/salud/index.ts`, `src/lib/salud/reglas.ts`, `src/components/salud/salud-vista.tsx`

### 7. Laboratorio dentro del Cerebro: cifra fija y sin simulador

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 3 · El Laboratorio de bots es decoración
- **Cómo está hoy:** cerebro-vista.tsx:156 tiene numero: 4 fijo. En las líneas 421-442 la pantalla incrusta ConocimientoBot (versiones y rendimiento por /api/perfiles/conocimiento) y un enlace a /laboratorio, pero no el simulador ni las pruebas. En 12__laboratorio.txt la página completa muestra los 4 bots juntos (VITA, Obra Social, Automotores, Marketing), con datos reales: 39 y 4 charlas, 5 % y 25 % derivadas a una persona.
- **Por qué:** La tarjeta promete «versiones, rendimiento y pruebas» y abre una ventana de conocimiento, mientras el probador real vive en otra página donde se mezclan los rubros.
- **Evidencia:** cerebro-vista.tsx:156; 12__laboratorio.txt.
- **Pasos:**
  1. Contar los bots activos desde la base, no con el 4 fijo.
  2. Incrustar el probador «Probar en un toque» con un selector de rubro obligatorio (un rubro a la vez) y mostrar la calidad del rol con el botón «Proponer mejora», que deja una propuesta para tu OK, no un cambio directo.
  3. Que el informe de bots del aprendizaje automático (punto 4 del diseño) alimente esta pantalla: qué rol falla, qué falta y la mejora propuesta.
- **Archivos:** `src/components/cerebro/cerebro-vista.tsx`, `src/components/perfiles/conocimiento-bot.tsx`, `src/app/laboratorio`

### 8. El mapa del Cerebro solo se mira: el resumen es del 22/11 y no lleva a ninguna parte

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 3 · El mapa del Cerebro no tiene función
- **Cómo está hoy:** src/app/cerebro/page.tsx:122-128 lee solo cerebro/mapa-codigo/GRAPH_REPORT.md (Graphify, 22/11: 6911 piezas, 12.405 conexiones). MapaCodigo (pantallas-cerebro.tsx:211-261) muestra cifras, piezas centrales y un buscador de barrios que filtra una lista sin enlaces ni acciones. graph.json no viaja con el despliegue (next.config.mjs solo incluye *.md), y cerebro/mapa-cerebro tampoco se usa.
- **Por qué:** Se pensó como cartel informativo. Sin graph.json en el despliegue no se puede explicar una pieza ni seguir caminos.
- **Evidencia:** 04__cerebro.txt: «MAPA 6.911 piezas del código · 12.405 conexiones · Graphify»; GRAPH_REPORT.md fechado 2026-11-22.
- **Pasos:**
  1. Sumar cerebro/mapa-codigo/graph.json y cerebro/mapa-cerebro/graph.json a outputFileTracingIncludes de /api/cerebro/**.
  2. /api/cerebro/mapa?q=: explicar una pieza (archivo, vecinos, barrio), igual que graphify explain, más el camino entre dos piezas.
  3. Al tocar un barrio o pieza: «Preguntale sobre esto» (recuperación con fuente código), «Pedir mejora a la Oficina» y «Pedir cambio de código a Claude» (Bandeja con alcance panel).
  4. Grafo visual liviano (SVG o canvas propio; la CSP bloquea scripts externos, así que nada de CDN).
  5. La tarea nocturna regenera el mapa y la fecha queda visible.
- **Archivos:** `src/components/cerebro/pantallas-cerebro.tsx`, `src/lib/cerebro/anillo.ts`, `src/app/cerebro/page.tsx`, `next.config.mjs`

### 9. Texto superpuesto debajo de la animación: la cifra de la esfera choca con los dorsos de las tarjetas

- **Tipo:** existe y falla · **Esfuerzo:** S · **Punto del pedido:** 3 · Texto debajo de la animación superpuesto
- **Cómo está hoy:** En 04__cerebro.png, «15.196 / CONTACTOS QUE CONOCE» queda encima de «SEMANA» y «DECISIONES», que son los dorsos de las tarjetas de atrás. centro.css:120: .cz-nucleo ocupa de top:-385px a +35px dentro del anillo 3D (preserve-3d); el canvas de la esfera es transparente y .cz-pant__dorso (centro.css:138) imprime el título en mayúsculas con opacidad 0,55, que se ve a través. Además .cz-pista está definida dos veces (centro.css:162 y 299) y en 1440x900 la pista y los saltos quedan fuera de pantalla.
- **Por qué:** La esfera y su texto viven en el mismo espacio 3D que las tarjetas de atrás, sin fondo y con un alto que se solapa con la franja superior de las tarjetas.
- **Evidencia:** 04__cerebro.png (zona central superior); centro.css:120, 138, 162, 299.
- **Pasos:**
  1. Sacar .cz-nucleo__txt del anillo 3D: va como capa 2D superpuesta, centrada sobre la escena, o como subtítulo bajo la barra de mando.
  2. Ocultar el texto del dorso cuando la tarjeta está lejos: .cz-pant__dorso { opacity: calc(var(--cerca) * .55) } o quitar el texto del dorso.
  3. Subir el núcleo (top ≈ -440px) o reducir la escala de la esfera para que no se cruce con el borde superior de las tarjetas (ALTO).
  4. Unificar las dos reglas .cz-pista y verificar a 1440x900, 1280x720 y celular (la vista en lista no tiene este problema).
- **Archivos:** `src/app/cerebro/centro.css`, `src/components/cerebro/centro-cerebro.tsx`

### 10. Dentro del Cerebro, «Jarvis» es el asistente virtual

- **Tipo:** existe y falla · **Esfuerzo:** S · **Punto del pedido:** 2 y 9 · Debería quedar solo Jarvis
- **Cómo está hoy:** centro-cerebro.tsx:226-228: el botón «Jarvis» lleva a /asistente (el asistente virtual). cerebro-vista.tsx:221-231: la pantalla Jarvis incrusta ChatAsistenteGeneral bajo el título «Asistente del panel». En el recorrido /jarvis devolvió 404 (_rutas.json n=6). Las propuestas de Jarvis sí se leen de asistente_acciones (page.tsx:93-112).
- **Por qué:** El Cerebro se armó antes de la decisión del 27/11 de dejar solo Jarvis y sigue apuntando al asistente viejo.
- **Evidencia:** _rutas.json: /jarvis 404; 04__cerebro.txt: botones Oficina, Jarvis, Bandeja.
- **Pasos:**
  1. Cambiar el botón y la pantalla para que usen el componente de Jarvis (la ruta que use Jarvis por perfil, o una de alcance panel) y archivar el acceso a /asistente desde el Cerebro.
  2. Que Jarvis use la misma recuperación con citas del Cerebro (herramienta preguntarAlCerebro mejorada).
  3. Coordinar con el equipo que analiza Jarvis (punto 2) para que /jarvis exista o redirija.
- **Archivos:** `src/components/cerebro/centro-cerebro.tsx`, `src/components/cerebro/cerebro-vista.tsx`

### 11. No hay tope de gasto ni registro de consumo de Gemini

- **Tipo:** riesgo · **Esfuerzo:** M · **Punto del pedido:** 1 y 3 · Gemini ejecuta y el cerebro aprende solo (tope de USD 30, aviso al 80 %)
- **Cómo está hoy:** No existe tabla de consumo de IA en la base. Hay 18 archivos que usan GEMINI_API_KEY (jarvis, asistente, oficina, laboratorio, recontacto, agentes y otros) sin un contador común. contenido.ts:102 lo dice como propuesta: «Tope de gasto de Gemini… Hoy no hay freno». Modelos en el código: gemini-3.5-flash y gemini-3.8-flash.
- **Por qué:** Cada módulo llama a Gemini por su cuenta, sin capa común de medición.
- **Evidencia:** Supabase information_schema: no hay tablas de gasto ni consumo; grep de GEMINI_API_KEY en src.
- **Riesgo:** Sin el tope, el aprendizaje automático y la búsqueda en internet pueden pasar los USD 30 sin aviso.
- **Pasos:**
  1. Migración: tabla ia_consumo (proveedor, modelo, origen, rubro_id, tokens_entrada, tokens_salida, usd_estimado, created_at) con RLS, más una vista del mes.
  2. src/lib/ia/medidor.ts: envoltorio único de generateContent que estima el costo con usageMetadata, corta con un mensaje claro al llegar a USD 30 y avisa al 80 % (salud más un pendiente para los dueños).
  3. Pasar las llamadas a Gemini por el envoltorio, empezando por el Cerebro, Jarvis y la Oficina.
- **Archivos:** `src/lib/agentes/modelo.ts`, `src/lib/jarvis/servidor.ts`, `src/lib/oficina/servidor.ts`, `src/lib/asistente/motor.ts`

### 12. Velocidad de /cerebro: 2,9 s, con 9 lecturas en serie antes de mostrar nada

- **Tipo:** velocidad · **Esfuerzo:** S · **Punto del pedido:** 6 · Más velocidad
- **Cómo está hoy:** src/app/cerebro/page.tsx:52-62 espera con Promise.all 9 lecturas (semana, contactos, salud, bandeja, rubros, oficina, aprendido, propuestas, grafo) antes de pintar. leerSalud es pesada (/salud tardó 11,7 s). El recorrido midió /cerebro en 2882 ms.
- **Por qué:** Todo se resuelve en el servidor antes del primer pintado, sin streaming.
- **Evidencia:** _rutas.json: /cerebro 2882 ms, /salud 11755 ms.
- **Pasos:**
  1. Pintar primero el encabezado y la barra de mando, y cargar cada pantalla del anillo con su propio Suspense, o leer las cifras con /api/cerebro/resumen después de pintar.
  2. Cachear salud y grafo (60 s y hasta el próximo despliegue) con unstable_cache.
  3. Bajar el costo de la esfera: menos puntos y pausa cuando la pestaña no está visible.
- **Archivos:** `src/app/cerebro/page.tsx`, `src/lib/salud/index.ts`

## Propuestas

- **Paso 0, el arreglo urgente: que lo que se pide llegue a Claude** (S). Conectar el disparo (OFICINA_DISPARO_URL y TOKEN hacia una tarea de Claude que se dispara por URL), devolver error en rojo cuando falta, sumar la tarea de respaldo cada 3 h y mostrar el latido «Claude miró la bandeja hace X». Sin esto, Ordenale, Pedidos a Claude, Pendientes delegados y el repaso de lo que hizo Gemini siguen sin llegar a nadie.
- **Cerebro que aprende solo · 1) Ingesta del código completo (tarea de Claude)** (M). Una función de Vercel no tiene el código fuente ni puede correr Graphify. Una tarea programada nocturna de Claude, con el repo, corre graphify update y un script nuevo, scripts/cerebro/ingestar.ts. El script parte graph.json en un fragmento por archivo y por barrio, con qué hace, qué exporta, de quién depende y su ruta. Solo inserta fragmentos con un hash nuevo (version+1) y marca la versión anterior como reemplazada, sin borrarla. Lo escribe por Supabase con la clave de servicio dentro de la tarea; la clave nunca va al repo.
- **2) Ingesta de todos los documentos del cerebro (panel más Claude)** (S). Los .md ya viajan con el despliegue. Una ruta /api/cerebro/reaprender (con requireSession y con CRON_SECRET para la ejecución automática) compara el hash de cada sección contra cerebro_fragmentos y solo agrega lo nuevo o cambiado. La puede disparar un botón «Releer la memoria», un cron diario de Vercel o pg_cron con pg_net (ya instalados y gratis). La tarea nocturna de Claude suma docs/, .claude/referencias y los chats nuevos sin datos personales.
- **3) Aprendizaje de cada rubro desde la base (pg_cron, sin IA ni datos personales)** (M). Una función SQL cerebro_aprender_rubros() se programa cada noche con pg_cron, ya activo. Calcula por rubro solo agregados: mensajes, respuestas, captados que pidieron llamada, derivados, tiempos, plantillas usadas, derivaciones a una persona por rol y horas pico. Cada noche guarda una foto nueva como fragmento tipo 'rubro' con su rubro_id (nunca pisa la anterior), así el cerebro compara semana contra semana. Opcional: Gemini redacta la lectura en lenguaje simple dentro del tope.
- **4) Recorrido propio del panel con informe (tarea semanal de Claude)** (M). Recorrer pantallas necesita un navegador; dentro de Vercel sería caro y lento. Se reutiliza el recorrido del 27/11 (solo lectura, sin tocar botones con efecto): capturas, tiempos (_rutas.json), errores de consola y lectura de bots desde el Laboratorio. Subagentes revisan diseño con ui-design-review y kocos-crm-diseno-y-accesibilidad, velocidad con web-vitals-auditor y bots con kocos-agentes-entrenamiento-y-evaluacion. El informe (qué mejorar, diseño, velocidad, bots) se guarda en cerebro_informes y como fragmentos, y cada recomendación queda como pendiente con el botón «Mandar a la Oficina». En el panel, una versión liviana diaria: tiempos de las consultas de salud y estado de los bots.
- **5) Aprender de internet** (M). En el panel: Gemini con búsqueda de Google, solo cuando el dueño pregunta algo que no está en la memoria. Se pide confirmación porque tiene costo por consulta y queda dentro del tope. En la tarea nocturna de Claude: búsqueda web por rubro (novedades de prepagas, ART y jurisprudencia vía el conector JurisprudenciaARG, ventas 0 km, tendencias de marketing). Cada hallazgo se guarda con su URL, fecha y rubro, marcado según la respuesta del dueño (sin validar o validado).
- **6) Memoria que solo suma** (S). Las tablas cerebro_fragmentos, cerebro_conocimiento y cerebro_informes solo admiten INSERT. Un trigger rechaza UPDATE de texto y todo DELETE; solo se puede completar archivada_at o reemplazada_por. Cada versión guarda hash, fuente y fecha. La pantalla «Aprendido» muestra la línea de tiempo («antes decía… ahora dice…», quién lo cambió) y permite volver a una versión anterior agregando una nueva, sin borrar.
- **7) Respuesta con recuperación y citas** (M). /api/cerebro/preguntar arma la respuesta en 4 pasos. 1) Recupera de forma híbrida (texto completo en español con unaccent, trigramas y vector si se aprueba), filtrando por alcance: desde un perfil, solo ese rubro más lo general. 2) Gemini redacta solo con esos fragmentos. 3) Devuelve la respuesta, las citas [n] con archivo o pantalla y fecha, y la confianza. 4) Si no encuentra, lo dice y ofrece «Enseñale» o «Buscar en internet». Todo queda registrado en cerebro_preguntas e ia_consumo. Jarvis usa la misma función.
- **8) Órdenes que crean tareas reales y acciones directas con confirmación** (L). Gemini clasifica cada orden de Ordenale en tres tipos. (a) Tarea para la Oficina, con alcance rubro, 4 rubros o panel. (b) Pedido de código para Claude: rama, Preview y PR; Vercel no puede reescribirse solo, así que el resultado vuelve a la Bandeja con el enlace de la Preview y un botón de aprobación. (c) Acción directa del catálogo que ya existe en asistente/panel-operaciones, mostrada como tarjeta «esto voy a hacer» con confirmación y registro en ops_change_log. Lo que envía, gasta o publica siempre pregunta antes (22/11).
- **Qué corre dónde (resumen)** (M). En el panel (Vercel más Gemini, dentro del tope): preguntar con citas, enseñar, ordenar, clasificar órdenes, releer los .md, la lectura simple de los rubros y la búsqueda en internet a pedido. En la base (pg_cron, gratis): las fotos nocturnas por rubro y los avisos de tope. En tareas programadas de Claude (plan actual): la ingesta del código con Graphify, el recorrido semanal con informe, la búsqueda web nocturna, la Bandeja cada 3 h, el repaso de todo lo que hizo Gemini (Opus orquesta subagentes) y los PR de cambios de código.
- **Función nueva: «Informe del Cerebro» diario, semanal y mensual en Perfiles** (M). Cumple el pendiente del 21/11 (informes en Perfiles) y usa las fotos por rubro y el recorrido: qué cambió, qué mejorar y qué preguntas tiene el cerebro para los dueños. Cada recomendación sale con un botón que la manda a la Oficina.
- **Función nueva: preguntas del Cerebro para los dueños** (S). Cuando el cerebro detecta contradicciones (por ejemplo, dos órdenes opuestas) o le falta un dato, crea una pregunta en cerebro_pendientes. La respuesta del dueño se guarda como regla versionada, igual que pide la orden de que la memoria «siempre suma».

## Preguntas para el dueño

- Lo que el Cerebro aprenda de internet: ¿(a) entra solo a la memoria con la marca «de internet, sin validar» y lo usa enseguida, o (b) queda en una lista para tu OK antes de usarlo?
- Para buscar en la memoria: ¿(a) búsqueda de texto completo en Postgres, gratis, o (b) sumar embeddings de Gemini (centavos por mes, dentro de los USD 30) para entender preguntas dichas con otras palabras? Recomiendo (b) con el tope armado primero.
- Cambios de código pedidos desde el Cerebro o desde Jarvis: ¿(a) Claude arma rama, Preview y PR, y vos aprobás la publicación con un botón en el panel, o (b) los cambios chicos (textos, colores) se publican solos después del repaso de Claude?
- ¿Cada cuánto aprende solo? (a) todas las noches, (b) cada 6 horas o (c) noche más cada vez que se publica una versión nueva del panel.
- ¿Puedo conectar el disparo automático de la Oficina y la Bandeja hacia Claude (una tarea de Claude Code que se dispara por URL, sin costo extra, con lo que ya tienen en el plan) y sumar una tarea de respaldo cada 3 horas que lea la Bandeja aunque nadie toque «Arrancar»?

## Herramientas usadas

- Graphify (graphify explain sobre cerebro/mapa-codigo/graph.json; GRAPH_REPORT.md)
- Bash (lectura de código con cat, grep y sed)
- Read (captura 04__cerebro.png)
- Supabase MCP execute_sql (solo agregados y esquema: cerebro_conocimiento, bandeja_claude, oficina_arranques, extensiones, cron.job)
- ToolSearch (carga de la herramienta de Supabase)
- Skill kocos-crm-contexto
- Recorrido del 27/11 en scratchpad (04__cerebro.txt, 12__laboratorio.txt, _rutas.json, _errores.txt)
