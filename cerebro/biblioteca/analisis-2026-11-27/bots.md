# Análisis del panel · bots (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

Bots IA, Laboratorio, Biblioteca y Comparar. Lo que el dueño ve como "decoración" es en su mayor parte real pero mal puesto. (1) Biblioteca y Comparar están fuera de "Bot IA": la Biblioteca es una página suelta, solo de configuración, y su agente nunca responde. Comparar agentes está cerrado con un redirect desde el 21/10. (2) Casi todo lo funcional de "Bot IA" (probar, resultados, crear, asignar) está dentro de `solo-avanzado`: se oculta por defecto y el nivel vuelve a "simple" en cada navegación. (3) El Laboratorio simple es real: simulador con Gemini, roles, ficha y pedidos. Pero la capa de versiones, A/B, aplicaciones y simulaciones masivas tiene 0 filas, así que se ve vacía. (4) El mezclado de rubros existe en varias rutas y selectores: casos de prueba de los 4 rubros en cualquier perfil, el agente "principal" compartido, y listas globales (corridas, evaluaciones, pedidos, historial). (5) Penal: hoy son solo 1 fila `ai_agents` (penal) más el área en el código. No tiene roles, bases ni campañas propias, así que unificarlo con Civil es barato. Supabase (solo agregados): no hay filas en `agent_assignments`, `eval_results`, `simulation_runs`, `bot_lab_*`, `agent_requests` ni `agent_roles` de Penal. Las 5 filas de `agent_library` están todas "apagado/preparado".

## Hallazgos

### 1. Biblioteca de agentes: existe, pero fuera de Bot IA, sin efecto sobre el bot y con una base común compartida

- **Tipo:** existe sin conectar · **Esfuerzo:** M · **Punto del pedido:** 9 y 4
- **Cómo está hoy:** `src/app/biblioteca-agentes/page.tsx` es una página aparte (el perfil sale de ?perfil= o de ?volver=). Lee TODA `agent_library` sin filtro (líneas 27-30) y filtra en memoria los derivados por rubro. El agente `principal` (base común de los 4 rubros) se muestra completo en cualquier perfil. `/api/agentes/biblioteca` GET sí filtra con `rubro_id is null or = X` (route.ts:26), pero el principal sigue entrando. Su propio texto dice «Solo configuración: ninguno responde mensajes». `BibliotecaEditor` edita nombre y objetivo con PIN. En la base: 5 filas (principal + 1 por rubro), todas apagado/preparado, y 0 en `agent_assignments`.
- **Por qué:** El bot real lee `ai_agents` por área (agent.ts:174). La biblioteca solo entra si hay una `agent_assignments` activa para el área (agent.ts:319-322), y hay 0 asignaciones. Por eso editar la biblioteca no cambia nada que el dueño perciba. Además está en otra ruta con otro marco, no en la pestaña de Bot IA. Se ve como un panel muerto.
- **Pasos:**
  1. Crear pestaña «Biblioteca» dentro de Bot IA (ver hallazgo de pestañas) que reuse `BibliotecaEditor` y la tarjeta de la página.
  2. Mostrar el principal como «Base común (solo lectura aquí)» sin editor en los perfiles, o solo en Configuración, para que no se pueda tocar la base de otro rubro desde un perfil.
  3. Cambiar `biblioteca-agentes/page.tsx` a un redirect hacia la pestaña del perfil (se archiva la página, no se borra: queda el redirect).
  4. Hacer que la Biblioteca sea la fuente de las instrucciones que sí responden: botón «Usar este agente en el área» que cree la fila en `agent_assignments` (ya existe `asignarVersion`, agentes-etapa3 `Asignar`). Con el gate actual: evaluación sin fallos críticos y comercial ≥14.

### 2. Comparar agentes: cerrado con redirect desde el 21/10; hoy no existe como función

- **Tipo:** no existe · **Esfuerzo:** M · **Punto del pedido:** 9
- **Cómo está hoy:** `src/app/comparacion-agentes/page.tsx` solo hace `redirect()` a /agentes o /panel/<perfil>/agentes (comentario: «se cerró el 21/10: responde siempre el modelo vigente»). Hay piezas reales sin interfaz: `correrEvaluacion` (servicio.ts), tabla `model_comparisons` (leída en /api/agentes/evaluacion:21), prueba de dos variantes en `/api/laboratorio/simular` (roles: [a,b], máx 2) y 'Comparar dos roles con el mismo mensaje' en el Laboratorio simple (lo que la captura 12__laboratorio.txt llama «Comparar dos roles con el mismo mensaje»). `lab_pruebas_ab` y versiones de conocimiento v1/v2 existen en el servicio (`comparativa`, `crearPruebaAB`).
- **Por qué:** La función se retiró pero el menú y los textos la siguen nombrando. Las piezas que lo harían funcionar están dispersas: el simulador de 2 roles en el Laboratorio, A/B en `ConocimientoBot` detrás de «Ver más», y evaluación en Etapa3.
- **Pasos:**
  1. Pestaña «Comparar» en Bot IA: 2 columnas con selector A/B entre (a) el bot general, (b) cada rol vigente del perfil, (c) la versión de conocimiento (v2 vs. propuesta). Mismo mensaje o caso de control, respuestas lado a lado.
  2. Reutilizar `POST /api/laboratorio/simular` (ya valida que el rol sea del perfil y respeta el tope de Gemini) y sumarle `version` opcional (`probarBotReal` ya acepta `version`/`modelo`/`extras`, ver servicio.ts:677).
  3. Agregar botones «Gana A / Gana B / Empate» que guarden en `model_comparisons` (tabla ya existente, sin escritor visible) para que el historial tenga valor.
  4. Dejar `comparacion-agentes` como redirect a la pestaña.
- **Archivos:** `src/app/comparacion-agentes/page.tsx`, `src/app/api/laboratorio/simular/route.ts`, `src/lib/ai-agent/probar-real.ts`, `src/components/agentes/ (nuevo comparar-bots.tsx)`

### 3. Lo funcional de Bot IA queda oculto por defecto (clase solo-avanzado + reinicio de nivel)

- **Tipo:** existe y no se encuentra · **Esfuerzo:** M · **Punto del pedido:** 9 y 3
- **Cómo está hoy:** `agentes-perfil-view.tsx`: `<AgentesEtapa3>` va dentro de `<div className="solo-avanzado">` (línea ~89) y la configuración también. `marca.css:83` oculta `.solo-avanzado` con `[data-nivel="simple"]`; `nivel.tsx` resetea a «simple» en cada cambio de pathname (salvo ?nivel=avanzado). En `agentes-etapa3.tsx` los botones Pedir mejora/Crear/Asignar tienen además `solo-avanzado` y el link a la Biblioteca (línea 79) también. Resultado: la pantalla por defecto muestra Puntaje, Probar bot real, Informe de mejoras, Ficha, Roles y un ResumenSeccion; las acciones de Biblioteca/Asignar/Crear no están.
- **Por qué:** El diseño «Simple/Avanzado» (18/10) escondió justo las herramientas que el dueño pide ahora. Las ve como inexistentes.
- **Pasos:**
  1. Reemplazar el apilado vertical por pestañas (ver propuesta): Cómo anda · Probar · Roles · Biblioteca · Comparar · Historial, todas visibles. Sin solo-avanzado en ninguna.
  2. Mover «Quién responde hoy» (ResumenSeccion) y el editor de instrucciones a una pestaña «Cómo anda» o a un panel «Instrucciones» plegable.
  3. Eliminar los `solo-avanzado` de agentes-etapa3 y agentes-perfil-view.
- **Archivos:** `src/components/agentes/agentes-perfil-view.tsx`, `src/components/agentes/agentes-etapa3.tsx`, `src/app/marca.css`

### 4. Mezcla de rubros: selectores y listas globales en los endpoints de agentes

- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto del pedido:** 4
- **Cómo está hoy:** Sin filtro por rubro: (a) `Probar` (agentes-etapa3.tsx:152-180) lista TODOS los casos de control de los 4 rubros (`/api/agentes/simulador` GET devuelve `CASOS` completos, simulador/route.ts:22) y solo etiqueta «(rubro)»; (b) `/api/agentes/simulador` GET lee `simulation_runs` sin filtro (línea ~19); (c) `/api/agentes/evaluacion` GET lee `eval_results` y `model_comparisons` sin filtro (evaluacion/route.ts:20-21); (d) `/api/agentes/pedidos` GET lee `agent_requests` sin filtro, últimos 100 (pedidos/route.ts:17); (e) `/api/agentes/asignaciones` GET y `/api/agentes/modelo` GET leen `agent_assignments` de todas las áreas (asignaciones:19, modelo:17); (f) `/api/agentes/corpus` y `/api/agentes/ajuste` leen `training_*`/`tuning_jobs` globales; (g) `correrSimulacion` (servicio.ts:177-190) toma siempre el agente `principal` y deriva el rubro de `caso?.rubro ?? ag.rubro_id`: se puede probar un agente de Coberturas desde el perfil de Autos si se manda esa clave (el POST no valida pertenencia al perfil); (h) `SelectorAgente` ofrece «Principal (base común)» en todos los perfiles; (i) `/api/laboratorio/historial` lee `agent_library_versions` global y filtra por `agent_library` del rubro más `rubro is null` (historial/route.ts:22-23), así que arrastra la base común; (j) `resumenLaboratorio` y `bibliotecaRoles` (servicio.ts:109-116 y 349-353) devuelven roles, bases y campañas de los 4 rubros y recién después filtra el cliente (`/api/perfiles/laboratorio?vista=resumen|biblioteca`); (k) `PuntajeBots` y `InformeMejoras` sí filtran por rubro (informe-mejoras.ts:122 usa AREAS_POR_PERFIL; `bot_informes_mejora` tiene rubro_id).
- **Por qué:** Los endpoints de la Etapa 3 se pensaron como una consola global de «el agente»; el filtro por perfil se agregó solo en Biblioteca GET y roles. El cliente es quien filtra, y varios selectores ni eso.
- **Pasos:**
  1. Crear un helper único `soloDelPerfil(perfil)` en `src/app/api/agentes/_comun.ts` que valide el slug con `esSlugPerfil` y devuelva rubroId y áreas; exigir `?perfil=` en TODOS los GET de /api/agentes/* y rechazar 400 si falta.
  2. Simulador: filtrar `CASOS` por `rubro === perfil`; filtrar `simulation_runs` por `rubro_id`; POST: comprobar que `agent_library.rubro_id` del agente sea el del perfil (o null solo si es el principal en modo lectura) o devolver 403.
  3. Evaluación: agregar `agente_clave in (claves del rubro)` o el campo rubro; `model_comparisons` por rubro.
  4. Pedidos (`agent_requests`): guardar y filtrar por rubro (columna nueva o por agente_clave del rubro).
  5. Selector: ofrecer solo los agentes del perfil; ocultar «Principal» en los perfiles (queda como herencia invisible).
  6. `resumenLaboratorio` y `bibliotecaRoles`: aceptar `perfil` y filtrar en servidor (rubro_id, y por áreas del rubro en bases y campañas).
  7. Historial: quitar `rubro_id is null` del filtro y mostrar los cambios de la base común aparte, marcados «base común».
- **Archivos:** `src/app/api/agentes/simulador/route.ts`, `src/app/api/agentes/evaluacion/route.ts`, `src/app/api/agentes/pedidos/route.ts`, `src/app/api/agentes/asignaciones/route.ts`, `src/app/api/agentes/modelo/route.ts`, `src/app/api/agentes/_comun.ts`, `src/lib/agentes/servicio.ts`, `src/lib/laboratorio/servicio.ts`, `src/app/api/laboratorio/historial/route.ts`, `src/components/agentes/agentes-etapa3.tsx`

### 5. Mezcla de rubros por diseño: un solo prompt «principal» alimenta a los 4 y el menú «Bot IA» de Jurídico muestra Civil y Penal juntos

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 4 y 7
- **Cómo está hoy:** `agent_library` tiene 1 fila `principal` con rubro_id null; `correrSimulacion` y la asignación activa del bot real (agent.ts:321-322) concatenan `principal.instrucciones + agente.instrucciones`. Cualquier cambio en el principal impacta a los 4 rubros. En Jurídico, `src/app/(dashboard)/agentes/page.tsx` pasa `areas={["civil","penal"]}`, así que se ven dos editores (`AgentEditor`, uno por fila de `ai_agents`) y los textos dicen «Cada área tiene su propio agente». `AREAS_DEL_RUBRO.juridico` y `AREAS_DE_PERFIL` también incluyen penal; los casos de laboratorio permiten tipo de consulta `penal` solo en Jurídico (reglas.ts:56-58).
- **Por qué:** Penal y Civil se modelaron como dos áreas con dos filas `ai_agents` y dos líneas de Meta. La base común compartida es una decisión de la Etapa 2 que hoy contradice «rubros separados».
- **Pasos:**
  1. No editar el principal desde ningún perfil. Mantenerlo como herencia solo de límites generales (ya lo es en `limitesEfectivos`), con aviso «cambia en los 4 rubros» y PIN, desde Configuración.
  2. Para Jurídico, ver hallazgo de unificación Penal+Civil.
- **Archivos:** `src/lib/agentes/servicio.ts`, `src/lib/ai-agent/agent.ts`, `src/app/(dashboard)/agentes/page.tsx`

### 6. Laboratorio: qué es real y qué parece decoración

- **Tipo:** anda bien · **Esfuerzo:** M · **Punto del pedido:** 3
- **Cómo está hoy:** REAL y guardando: (1) Simulador `POST /api/laboratorio/simular` llama a `probarBotReal` con el prompt, la ficha y los roles reales; Gemini real, respeta el tope de gasto (`chequearTopeGemini`), no escribe nada. Salida: turnos y modelo (laboratorio-herramientas.tsx:46). Corre solo con `areas[0]`: en Jurídico solo prueba Civil, nunca Penal. (2) Roles por perfil: crear, archivar, asignar a campaña (laboratorio-simple.tsx:287, 328, 426, vía /api/agentes/roles; hay 4 vigentes y 1 archivado). (3) Ficha del negocio (guardar/deshacer, /api/agentes/ficha). (4) «Pedir mejora» → `agent_requests` (0 filas: nadie lo usó o no se ve el estado). (5) Calidad del rol (`calidad-rol.ts`): puntaje de 4 puntos por reglas fijas, guiado a «Mejorar con Jarvis» (abre Jarvis con texto; no aplica). (6) Tablero (`laboratorio-tablero.tsx`): cifras reales de `/api/perfiles/conocimiento?dias=7` (en la captura 12__laboratorio.txt: 39 y 4 charlas, derivación 5% y 25%). (7) Historial (`/api/laboratorio/historial`, lee `ops_change_log`). VISUAL/VACÍO: toda la capa avanzada (`conocimiento-bot.tsx`, `perfiles/laboratorio/laboratorio-bot.tsx`, 624 líneas): versiones v1/v2, A/B, aplicar versión, simulaciones masivas, proveedores, roles generales: `bot_lab_versiones`, `bot_lab_pruebas_ab`, `bot_lab_aplicaciones`, `bot_lab_simulaciones`, `bot_lab_roles_generales` tienen 0 filas, y está detrás de «Ver más» (laboratorio/page.tsx). «Publicar un agente» (herramientas:127-180) publica `agent_library`, que no responde (0 asignaciones) y exige evaluación previa (0 `eval_results`).
- **Por qué:** La pantalla simple se quedó con lo que se usa; la parte potente quedó escondida y sin datos, o dependiendo de pasos previos que nadie hizo (evaluar, asignar). Dentro del Cerebro, el bloque «Laboratorio» incrusta `ConocimientoBot` en una ventana decorativa («Probá antes de que rija») con un link a /laboratorio: el dueño lo percibe como adorno porque no hay un botón que ejecute algo desde ahí.
- **Pasos:**
  1. Pasar el Laboratorio a ser la pestaña «Probar» y «Cómo anda» de Bot IA de cada perfil (misma lógica, filtrada por rubro). La ruta /laboratorio queda como atajo que pregunta rubro o redirige a /panel/<perfil>/agentes.
  2. En el Cerebro, reemplazar la ventana por tarjetas por rubro con 3 botones que HAGAN algo: «Probar mensaje» (abre el simulador embebido del rubro), «Correr los casos de control» y «Ver qué mejoraría» (genera informe). Sin navegar.
  3. Probar Penal: en el selector de Probar de Jurídico agregar «Consulta civil / penal» (hoy `areas[0]`).
  4. Marcar las funciones vacías: «Todavía no hay versiones: creá la primera» con un botón de un toque en vez de tabla vacía.
- **Archivos:** `src/app/laboratorio/page.tsx`, `src/components/laboratorio/laboratorio-simple.tsx`, `src/components/laboratorio/laboratorio-herramientas.tsx`, `src/components/cerebro/cerebro-vista.tsx`, `src/components/perfiles/conocimiento-bot.tsx`, `src/components/perfiles/laboratorio/laboratorio-bot.tsx`

### 7. Mover Biblioteca y Comparar dentro de «Bot IA» con pestañas y filtradas por rubro

- **Tipo:** diseño · **Esfuerzo:** L · **Punto del pedido:** 9
- **Cómo está hoy:** Hoy `AgentesPerfilView` (src/components/agentes/agentes-perfil-view.tsx) apila 7 bloques: PuntajeBots, ProbarBotReal, InformeMejoras, FichaNegocio, RolesPorBase, ResumenSeccion, AgentesEtapa3 (solo avanzado) y editores `ai_agents`. Se usa desde 4 páginas: `(dashboard)/agentes/page.tsx` (Jurídico), `panel/coberturas_medicas|agencia_0km|marketing/agentes/page.tsx`. No hay pestañas. La captura de Laboratorio ya usa un `tablist` accesible para elegir perfil (laboratorio-simple.tsx:125-150), que se puede reutilizar.
- **Por qué:** Crecimiento por bloques; nadie consolidó.
- **Pasos:**
  1. Pestañas (hash o ?pestana=, con role tablist como en laboratorio-simple): «Cómo anda» = PuntajeBots + tarjeta «Quién responde hoy» + Informe de mejoras; «Probar» = ProbarBotReal + simulador de dos variantes + «Probar con una charla real anonimizada»; «Roles» = RolesPorBase + calidad del rol; «Biblioteca» = tarjetas derivadas del rubro + `BibliotecaEditor` + ficha del negocio; «Comparar» = nuevo; «Historial» = `/api/laboratorio/historial` + `agent_library_versions` del rubro + botón «Volver a esta versión».
  2. Hacer que `AgentesPerfilView` reciba `perfil` y pase siempre `rubroId`/`areas` a cada pestaña (ya los recibe).
  3. Quitar de menus (`menu-mas.tsx`, `accesos-centrales.tsx`, `perfiles/page.tsx`) los enlaces a /biblioteca-agentes y /comparacion-agentes.
  4. Carga perezosa por pestaña (no montar todo): mejora la velocidad.
- **Archivos:** `src/components/agentes/agentes-perfil-view.tsx`, `src/app/(dashboard)/agentes/page.tsx`, `src/app/panel/*/agentes/page.tsx`, `src/components/menu-mas.tsx`, `src/components/perfiles/accesos-centrales.tsx`, `src/app/perfiles/page.tsx`

### 8. Penal unificado con Civil: un solo bot de Jurídico

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 7 y 4
- **Cómo está hoy:** Existen por separado: 2 filas `ai_agents` (civil y penal, ambas activas); 1 derivado `agent_library` de Jurídico (clave `juridico`, no hay `penal` ni `civil` separados, `CLAVES_AGENTE` en biblioteca.ts:11); roles `agent_roles` de Jurídico: 1 vigente con área civil y ninguno penal; bases y campañas: 16 civil y 0 penal (imported_bases) y 11 civil y 0 penal (campaigns). Casos de control: W01-W04 y C13/C15/C17 usan área civil. Código con distinción civil/penal: `AREAS_DEL_RUBRO.juridico = [civil, penal]` (reglas.ts:32), `TIPOS_CONSULTA` civil y penal (reglas.ts:44-45), `tipoConsultaValido`, `AREAS_DE_PERFIL`, `NOMBRE_AREA` y `areas={["civil","penal"]}` (agentes/page.tsx), `AREAS_POR_PERFIL` (informe-mejoras.ts), `bot-base.ts` (agentesDe). `asignacionActiva(area)` busca por área.
- **Por qué:** Dos líneas de Meta (WHATSAPP_CIVIL_* y WHATSAPP_PENAL_*) obligaron a dos áreas. La orden del dueño (27/11): queda la línea de Civil; las conversaciones de Penal pasan a esa; nada se borra.
- **Pasos:**
  1. Bot: archivar (no borrar) la fila `ai_agents` penal: `active=false` y nota «unificado con Civil el 27/11» o mover su `system_prompt` a `ai_agent_prompt_history` y dejar el de Civil como único. Revisar si el prompt penal tiene criterios propios que se deban sumar al de Civil (como una sección «Consultas penales») antes de apagarlo.
  2. Códigos: en `agentes/page.tsx` pasar `areas={["civil"]}` y, en pantalla, llamarlo «Jurídico» (sin sufijo). Dejar `penal` en el tipo `Area` para no romper contactos históricos, pero `AREAS_DE_PERFIL` y `AREAS_DEL_RUBRO` para el selector ofrecer solo `civil`.
  3. Rol por tipo de consulta: mantener «civil» y «penal» como etiquetas de tema (no de línea) y agregar la clasificación al rol general «Jurídico». Los roles ya son por rubro (no por área), así que no hay que migrar roles.
  4. Migración `supabase/migrations/02xx_penal_en_civil.sql` repetible: `update conversations/contacts set area='civil' where area='penal'` solo si el canal Meta es el de Civil (coordinar con el punto 7 de Meta); `update agent_assignments set estado='archivada'` en penal (0 filas hoy). Sin borrados, con registro en `ops_change_log`. Documentar en `docs/etapaN/MIGRACIONES.md`.
  5. Biblioteca: un solo derivado «Jurídico» (ya es así: 1 fila).
  6. Un solo bot de Jurídico: el prompt de Civil sumará temas penales (flagrancia, excarcelación, defensor) con límites de «no dar consejo, derivar a abogado»; revisar con la skill kocos-agentes-entrenamiento-y-evaluacion y los casos de control antes de apagar Penal.
- **Archivos:** `src/lib/laboratorio/reglas.ts`, `src/lib/cartera-servidor.ts`, `src/app/(dashboard)/agentes/page.tsx`, `src/lib/agentes/informe-mejoras.ts`, `src/lib/laboratorio/bot-base.ts`, `src/lib/agentes/roles.ts`, `supabase/migrations/ (nueva)`, `docs/etapaN/MIGRACIONES.md`

### 9. El dueño percibe el Laboratorio como decoración: faltan acciones y la UI muestra tablas vacías

- **Tipo:** diseño · **Esfuerzo:** M · **Punto del pedido:** 3
- **Cómo está hoy:** La captura 12__laboratorio.png/.txt muestra Tablero (4 tarjetas), «Probar en un toque», «Calidad del rol» con 1 de 4 puntos y botón «Mejorar este rol con Jarvis», roles, simulador y ficha. Todo con botones reales, pero: «Mejorar con Jarvis» no aplica sino que abre Jarvis con el pedido; «Pedir mejora» solo guarda un pedido (`agent_requests`, 0 filas); lo avanzado (versiones, A/B) está detrás de «Ver más» y vacío. No hay botón que aplique una mejora con un toque.
- **Por qué:** Cada herramienta propone pero ninguna cierra el ciclo medir a corregir a verificar. El texto repite «no se envía nada» y «te pide confirmar», lo que refuerza que es de juguete.
- **Pasos:**
  1. Agregar «Aplicar esta mejora» a la calidad del rol: el modelo redacta el texto faltante, se muestra el antes/después y, con confirmación, se guarda como nueva copia del rol (`rol_copia_editada` ya existe en laboratorio route.ts:147) y se puede volver atrás (`volver_atras`).
  2. Mostrar «Último cambio» y «Volver a la versión anterior» con un toque (`volverInstrucciones` ya existe en bot-base.ts).
  3. Cerrar el ciclo del informe de mejoras: `InformeMejoras` ya aplica sugerencias a conocimiento y roles (informe-mejoras.ts:220-277); conectarlo al puntaje del Laboratorio.
- **Archivos:** `src/components/laboratorio/laboratorio-tablero.tsx`, `src/lib/laboratorio/calidad-rol.ts`, `src/lib/laboratorio/bot-base.ts`, `src/app/api/perfiles/laboratorio/route.ts`

### 10. Riesgo de seguridad de rubros: rutas /api/agentes/* con requireSession pero sin comprobar relación recurso-perfil

- **Tipo:** riesgo · **Esfuerzo:** S · **Punto del pedido:** 4
- **Cómo está hoy:** Convención del proyecto: «toda ruta privada llama a requireSession y comprueba las relaciones entre recursos». `simulador` POST acepta cualquier `clave`; `evaluacion` POST cualquier `clave`; `publicar` y `biblioteca` PATCH exigen PIN pero no perfil. `probar-real` sí valida que base y campaña sean del área (probar-real/route.ts:30-36).
- **Por qué:** Las rutas de la Etapa 3 son de la consola global.
- **Pasos:**
  1. Aplicar el mismo helper de perfil de los pasos del hallazgo de mezcla y devolver 403 si `agent_library.rubro_id` no es del perfil pedido.
  2. Agregar prueba unitaria en `tests/unitarias/` para que el simulador rechace un agente de otro rubro.
- **Archivos:** `src/app/api/agentes/simulador/route.ts`, `src/app/api/agentes/evaluacion/route.ts`, `src/app/api/agentes/publicar/route.ts`, `src/app/api/agentes/biblioteca/route.ts`

## Propuestas

- **Probar con una charla real anonimizada** (M). Ya hay `bot_informes_mejora` y `informe-mejoras.ts` que leen conversaciones reales por rubro; se puede reusar para tomar los mensajes del cliente, quitar datos personales (regex de teléfono ya existe en biblioteca.ts) y correr `probarBotReal`. Prueba con casos que de verdad pasan, no con los 16 inventados.
- **Puntaje de calidad por rol y por rubro (0 a 100) con tendencia** (M). `puntaje.ts`, `calidad-rol.ts` y `eval_results` ya calculan piezas sueltas; unificarlas en un solo número visible en la pestaña «Cómo anda» y en la tarjeta del rubro, con flecha de tendencia. Hoy hay 0 `eval_results`, así que un botón «Medir ahora» lo arranca.
- **«Sugerir mejora» con un toque** (M). Cuando falta un punto de calidad (saludo, datos mínimos, no prometer), un botón llama a Gemini, redacta el párrafo, muestra antes/después y aplica como copia del rol con vuelta atrás. Cierra el ciclo medir, corregir, verificar. Respeta el tope de USD 30/mes compartido.
- **Volver a una versión anterior con un toque** (S). `volverInstrucciones`, `volver_atras` y `agent_library_versions`/`ai_agent_prompt_history` ya guardan el historial; falta el botón visible en la pestaña «Historial» con vista de diferencias. Baja el miedo a tocar.
- **Casos de control por rubro con botón «Correr todos» y semáforo** (S). Los 16 casos existen (W01 a C18) y la evaluación también, pero ocultos y mezclados. Mostrar solo los del rubro (Jurídico: 7, Coberturas: 3, Autos: 3, Marketing: 3 aprox.) y un semáforo por caso.
- **Alertas del bot en el Cerebro** (M). Si la derivación a persona sube o baja fuerte, o un rol queda sin usar, el Cerebro avisa y propone correcciones con un botón, en lugar de decorar el bloque Laboratorio.

## Preguntas para el dueño

- Base común (agente «principal»): ¿(a) la dejamos solo como herencia invisible de límites generales, editable solo desde Configuración con PIN; (b) la sacamos y cada rubro tiene su propio texto completo; o (c) la dejamos como está? Recomiendo (a).
- Penal en Civil: antes de apagar el bot de Penal, ¿querés que su prompt actual se sume al de Civil como sección «consultas penales» (recomendado), o que Civil quede tal cual y lo penal lo ordenemos después?
- Biblioteca de agentes: hoy ninguno responde (0 asignaciones). ¿Querés que la Biblioteca pase a ser donde se elige quién responde (publicar y asignar desde ahí, con evaluación previa), o que quede solo como borrador de ideas junto al bot actual?
- Probar con una charla real: ¿te sirve que se tome una conversación real ya cerrada, anonimizada (sin nombres, teléfonos ni correos), y se reproduzcan los mensajes del cliente con el bot actual y con una versión nueva?

## Herramientas usadas

- Bash (lectura de código, grep, sed)
- Graphify no se usó: se leyó el código directo con Bash
- Supabase execute_sql vía ToolSearch (solo SELECT con agregados sobre ai_agents, agent_library, agent_assignments, agent_roles, bot_lab_*, simulation_runs, eval_results, agent_requests, bot_informes_mejora, imported_bases, campaigns)
- Capturas del recorrido: 12__laboratorio.txt y _rutas.json (solo texto; no copié datos personales)
- cerebro/00-arranque-para-agentes.md y cerebro/02-ordenes-vigentes.md (Órdenes del 27/11)
- No se llamaron skills con la herramienta Skill: no hubo tiempo en esta pasada
