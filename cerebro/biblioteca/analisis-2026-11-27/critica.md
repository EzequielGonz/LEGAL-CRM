# Revisión final de completitud del análisis (27/11)

Un subagente revisó los doce informes contra el pedido, el código y las respuestas del dueño. Donde contradice a un especialista, **vale esta revisión**.

## Resumen

Revisión de completitud, hecha en modo solo lectura sobre /home/user/crm-main (rama integracion/rediseno-2211, commit 1d30ea6), con agregados de Supabase y la carpeta tour2711 ya completa (142 archivos, con _rutas.json y _errores.txt).

**Antes que nada, tres cosas que cambian lo que dijeron los especialistas:**
1. El plan del 27/11 ya existe: cerebro/22-plan-panel-2711.md tiene 53 líneas y 9 tandas. El especialista del Cerebro dijo que no existía, y se equivocó.
2. El dueño respondió ese mismo 27/11, y sus respuestas mandan sobre varias propuestas (02-ordenes-vigentes.md:312, 324-340):
   - Jarvis no cambia código.
   - Queda solo la línea de Civil.
   - No se le pregunta qué es un captado: se relee la definición y se hace cumplir.
   - El tope de Gemini es el mismo y se comparte con los bots.
   - El diseño NO se rehace: «dejarlo tal cual está ahora pero mejorarlo un poco». Las animaciones del Cerebro y la Oficina 3D no se tocan.
3. Por eso quedan desautorizadas, en parte o del todo, las propuestas de navegación (cambiar el carrusel del Cerebro por una grilla plana), de dirección de arte (paletas A y B, Manrope) y las partes de Jarvis que hablan de rama y vista previa desde el propio Jarvis.

**Cobertura del pedido.** Los 10 puntos están cubiertos en general. Quedaban cinco huecos, que investigué y devuelvo como hallazgos:
- El cartel «Campaña con fallas · X no salieron» de Hoy es falso. Cuenta las fallas de todo el perfil en 24 h, no las de la campaña (src/lib/definiciones/campanas.ts:40-42).
- Punto 4 («los bots se mezclan»): en los datos en vivo no hay mezcla. La base da 100 % de coincidencia entre área y rubro, y el conocimiento del bot se filtra por rubro. La mezcla está en Bot IA, el Laboratorio y el prompt «principal».
- «Gemini ejecuta si no hay uso de Claude» tiene un límite real: el panel no puede saber cuánto uso le queda al plan de Claude.
- Para que el Cerebro aprenda de internet ya hay búsqueda de Google desde Gemini en src/lib/marketing/analysis.ts. Hay que confirmar si tiene costo fuera del cupo gratis.
- La definición de captado escrita en reglas-comunes.md y en la skill («aceptó el siguiente paso») choca con la del 27/11 y hay que actualizarla.

**Las 5 afirmaciones más riesgosas, verificadas:**
- **Números de migración: el especialista de la Oficina se equivocó.** La última no es 0640: es 0650. Además, tres especialistas reservaron 0660 y dos reservaron 0661.
- **Tope de Gemini: el especialista del Cerebro se equivocó.** El tope existe (presupuesto/reglas.ts, 0638, chequearTopeGemini en 6 archivos). Lo que falta es medir el triaje de la Oficina y el «Preguntale».
- **leerAprendido no filtra por rubro: confirmado.**
- **Los tres atajos que captan sin pedir aceptación: confirmados** en agent.ts:907, 974 y 1044.
- **/api/oficina/arrancar: confirmado.** Responde 200 cuando falta el disparador, y la barra del Cerebro lo muestra como «Los agentes ya arrancaron».

**Otras comprobaciones:**
- graph.json no viaja con el despliegue: next.config.mjs incluye solo los .md.
- La Bandeja de cada perfil muestra las tareas de todos los rubros: bandeja/page.tsx:23-27 no filtra.

**Plan de ejecución.** En las propuestas va el orden por tandas, con qué archivos le toca a cada una:
- una fase 0 que reserva migraciones y contratos;
- una fase A con 8 tandas en paralelo sin archivos compartidos;
- una fase B de integración (menús, Hoy, Jarvis con plantillas y el bot con los datos del Excel);
- una fase C de retoque visual, cuando el dueño elija el color;
- una fase D de repaso.

Así nadie pisa archivos calientes como agent.ts, menu.ts, menu-mas.tsx, motor.ts, cerebro-vista.tsx o next.config.mjs. Ninguna tanda toca docs/redes, .claude/referencias/redes ni src/app/redes.

## Verificaciones, contradicciones y huecos

### 1. VERIFICACIÓN 1 · Números de migración: la última es 0650, no 0640, y hay números repetidos entre especialistas
- **Tipo:** riesgo · **Esfuerzo:** S · **Punto:** Todos (base de datos)
- **Qué se comprobó:** VEREDICTO: la afirmación de la Oficina («el último es 0640») es FALSA. `ls supabase/migrations` termina en 0638_gasto_gemini_tope, 0639_latido_pg_cron, 0640_recontacto_plantilla_meta y 0650_cerebro_conocimiento. Además los especialistas chocan entre sí: Jarvis propone 0660_cerebro_fragmentos y 0661_bandeja_codigo; el Cerebro, 0660_cerebro_memoria; Chats, 0660_reapertura_plantilla, 0661_plantilla_preferida y 0670_unificar_penal; Captados, 0651; Seguridad, «07xx».
- **Por qué:** Cada especialista numeró por su lado sin mirar a los demás ni la carpeta real.
- **Evidencia:** ls supabase/migrations | tail; índice de los especialistas
- **Riesgo:** Dos migraciones con el mismo número rompen el orden de aplicación o se pisan al integrar las ramas.
- **Pasos:**
  1. Fase 0: reservar rangos en docs/etapa6/MIGRACIONES.md antes de abrir copias. Oficina 0651-0653; Captados 0654-0656; Cerebro 0657-0659; Plantillas, reapertura y Penal 0660-0662; Jarvis y registro de acciones 0663-0664; Bots 0665 (si hace falta).
  2. Cada migración repetible (if not exists o bloque do $$), con RLS, sin permisos para anon/authenticated y sin DELETE.
  3. Antes de aplicarlas, volver a correr `ls supabase/migrations`, porque la sesión de redes también puede sumar números.
- **Archivos:** `supabase/migrations/`, `docs/etapa6/MIGRACIONES.md`

### 2. VERIFICACIÓN 2 · Tope de Gemini: existe y funciona para los bots y Jarvis; falta en la Oficina y en «Preguntale»
- **Tipo:** existe sin conectar · **Esfuerzo:** S · **Punto:** 1 y 3 (Gemini en la Oficina y Cerebro que aprende)
- **Qué se comprobó:** VEREDICTO: es FALSA la afirmación del especialista del Cerebro («no existe tope de gasto ni registro de consumo»). Existen src/lib/presupuesto/reglas.ts (CLAVE_PRESUPUESTO_GEMINI, evaluarPresupuesto, costoEstimadoUsd), src/lib/presupuesto/servidor.ts y la migración 0638_gasto_gemini_tope.sql. chequearTopeGemini se usa en api/jarvis/mensaje, api/laboratorio/simular, ai-agent/agent.ts, recontacto/motor.ts y jarvis/servidor.ts. Tiene razón la Oficina: triar() y el «Preguntale» no pasan por el tope ni registran el gasto. Seguridad también tiene razón en algo: si no se puede medir el gasto, hoy se deja seguir.
- **Por qué:** El registro por turno (agent_turn_logs) solo acepta los usos conversacion, analisis, evaluacion_plantillas y recontacto. La Oficina y el Cerebro nunca se sumaron.
- **Evidencia:** grep -rln chequearTopeGemini src; grep export src/lib/presupuesto/*.ts
- **Riesgo:** Si se construye una segunda tabla de gasto, el tope se cuenta dos veces o se fragmenta.
- **Pasos:**
  1. No crear una tabla ia_consumo nueva (propuesta del Cerebro). Reusar agent_turn_logs y ampliar el check de `uso` con 'oficina' y 'cerebro', con la misma técnica de la 0638 (migración 0651 de la Oficina; el Cerebro suma 'cerebro' en la 0657).
  2. Pasar triar() (lib/oficina/servidor.ts) y el futuro responder.ts del Cerebro por chequearTopeGemini y registrarTurno.
  3. El tope sigue siendo uno solo, de USD 30, compartido con los bots (orden del 27/11). El «subtope del 30 %» de Seguridad va solo como aviso, salvo que el dueño diga otra cosa.
- **Archivos:** `src/lib/presupuesto/reglas.ts`, `src/lib/presupuesto/servidor.ts`, `src/lib/oficina/servidor.ts`, `supabase/migrations/0638_gasto_gemini_tope.sql`

### 3. VERIFICACIÓN 3 · Lo aprendido por el Cerebro se lee sin filtrar por rubro (confirmado)
- **Tipo:** riesgo · **Esfuerzo:** S · **Punto:** 2, 3 y 4 (rubros separados)
- **Qué se comprobó:** VEREDICTO: CONFIRMADO. En src/lib/cerebro/conocimiento-servidor.ts:11, leerAprendido hace select de cerebro_conocimiento con .is('archivada_at', null) sin ningún filtro por rubro_id. preguntarAlCerebro (líneas 20-25) lo junta con los .md. Jarvis de un perfil lo consume vía consultar_cerebro. Hoy hay 1 fila, así que el daño es potencial, pero crece apenas se use «Enseñale».
- **Por qué:** La función nació para el Cerebro general y después se reusó desde Jarvis, que vive dentro de un perfil.
- **Evidencia:** sed -n 1,40p src/lib/cerebro/conocimiento-servidor.ts
- **Pasos:**
  1. Contrato de fase 0: preguntarAlCerebro(pregunta, max, opciones?: {rubroId?: string | null}). Con rubroId, `.or('rubro_id.is.null,rubro_id.eq.<id>')`; sin rubroId (Cerebro general), todo, etiquetado por perfil.
  2. Lo implementa la tanda del Cerebro (dueña del archivo); Jarvis solo pasa ctx.rubroId.
  3. Prueba unitaria: lo enseñado para Coberturas no aparece al preguntar desde Autos 0 km.
- **Archivos:** `src/lib/cerebro/conocimiento-servidor.ts`, `src/lib/jarvis/servidor.ts`, `tests/unitarias/`

### 4. VERIFICACIÓN 4 · Tres atajos captan sin exigir aceptación (confirmado; las líneas se corrieron unas pocas)
- **Tipo:** existe y falla · **Esfuerzo:** M · **Punto:** 8 (Captados)
- **Qué se comprobó:** VEREDICTO: CONFIRMADO. src/lib/ai-agent/agent.ts:907 (finalizar_consulta de Civil, «Aceptó el contacto del profesional»), 974 (registrar_resultado_marketing) y 1044 (pedir_presupuesto) llaman a evidenciaDeCaptacion(..., { exigirAceptacion: false }). Captados citó 907, 976 y 1046. Además, la skill kocos-crm-reglas-de-captacion y .claude/referencias/reglas-comunes.md definen captado como «interés + aceptación del siguiente paso con evidencia». Esa definición es más amplia que la del dueño del 27/11: captado es quien «pidió o aceptó la llamada o el contacto de una persona» (cerebro/22-plan-panel-2711.md).
- **Por qué:** Las reglas viejas (16/10: Marketing capta al pedir presupuesto) y la segunda llave aceptacionReal, que es demasiado permisiva.
- **Evidencia:** grep -n exigirAceptacion src/lib/ai-agent/agent.ts; skill kocos-crm-reglas-de-captacion
- **Riesgo:** Si se corrige el código y no la referencia, una sesión futura «corrige» el código de vuelta a la regla vieja.
- **Pasos:**
  1. Tanda Captados: sacar exigirAceptacion:false en las 3 llamadas. Lo de Marketing con presupuesto queda como «Interesado» (opción del plan 22).
  2. Llamar a la función pura `pidioContactoHumano()` y no `pidioLaLlamada()`. Tiene que aceptar también «que me escriba un asesor por WhatsApp» (opción del plan 22). Un «sí» suelto o un relato no alcanzan.
  3. Actualizar en la misma tanda .claude/referencias/reglas-comunes.md (secciones 3 a 7) y la skill .claude/skills/kocos-crm-reglas-de-captacion/SKILL.md con la definición nueva, porque si no la próxima sesión la revierte.
  4. No preguntarle al dueño la definición: él dijo que ya está en los chats y en el entrenamiento.
- **Archivos:** `src/lib/ai-agent/agent.ts`, `src/lib/agentes/aceptacion.ts`, `src/lib/captacion/`, `/home/user/LEGAL-CRM/.claude/skills/kocos-crm-reglas-de-captacion/SKILL.md`, `.claude/referencias/reglas-comunes.md`

### 5. VERIFICACIÓN 5 · «Arrancar» responde 200 sin disparador y la barra del Cerebro dice que los agentes arrancaron (confirmado)
- **Tipo:** existe y falla · **Esfuerzo:** S · **Punto:** 3 (los pedidos a Claude no llegan) y 1
- **Qué se comprobó:** VEREDICTO: CONFIRMADO. En src/app/api/oficina/arrancar/route.ts, la última línea devuelve `status: disparo.estado === 'fallo' ? 502 : 200`, así que 'sin_disparador' sale con 200. En src/components/cerebro/barra-mando.tsx:175-176 se muestra el resultado con el texto por defecto «Los agentes ya arrancaron. Mirá cómo avanzan en la Oficina.». disparar() (lib/oficina/servidor.ts:74) lee OFICINA_DISPARO_URL. vercel.json solo tiene `regions` y ningún cron.
- **Por qué:** Falta la configuración del dueño (URL y token del disparo) y además el panel tapa la falta con un mensaje de éxito.
- **Evidencia:** cat src/app/api/oficina/arrancar/route.ts; grep arranque barra-mando.tsx
- **Pasos:**
  1. Tanda Oficina: con 'sin_disparador' devolver 503 y un mensaje honesto. barra-mando.tsx (tanda Cerebro) mira `arranque.estado` y lo muestra en rojo.
  2. GET /api/oficina devuelve disparo.conectado (booleano, nunca el valor).
  3. Paso del dueño: cargar OFICINA_DISPARO_URL y OFICINA_DISPARO_TOKEN en Vercel.
- **Archivos:** `src/app/api/oficina/arrancar/route.ts`, `src/components/cerebro/barra-mando.tsx`, `src/lib/oficina/servidor.ts`

### 6. CONTRADICCIÓN · Jarvis y el código: el dueño lo descartó el 27/11; manda Navegación y Seguridad, no Jarvis
- **Tipo:** diseño · **Esfuerzo:** S · **Punto:** 2
- **Qué se comprobó:** El especialista de Jarvis afirma que «la orden del 27/11 (02-ordenes-vigentes.md:312) lo pide explícitamente» y propone proponer_tarea_codigo con rama, PR y merge aprobados desde Jarvis. Es FALSO: la línea 312 dice «No cambia código (el dueño lo descartó el 27/11: «olvidate que cambie el código»); los cambios de código los pide por la Oficina o la Bandeja», y la línea 326 lo repite. El plan 22 también.
- **Por qué:** El especialista leyó la propuesta vieja del 22/11 (biblioteca/propuesta-lineas-codigo-agentes-2211.md) como si estuviera vigente.
- **Evidencia:** sed -n 300,345p cerebro/02-ordenes-vigentes.md
- **Pasos:**
  1. Jarvis solo deja el pedido (bandeja_pedir_cambio u oficina_pedir_tarea) con pedido_literal y nivel de confirmación reforzado (Seguridad).
  2. El circuito de rama y vista previa sigue valiendo, pero del lado de la Oficina y Claude: la skill `oficina` trabaja en la rama claude/oficina-<id> y deja la URL de la vista previa en resultado_enlaces. Eso no necesita columnas nuevas de PR en una primera vuelta.
  3. Descartar la migración 0661_bandeja_codigo de Jarvis. Si hace falta, sus campos (rama, vista_previa_url) van en la migración de la Oficina (0651).
- **Archivos:** `cerebro/02-ordenes-vigentes.md`, `src/lib/asistente/catalogo.ts`, `.claude/skills/oficina/SKILL.md`

### 7. CONTRADICCIÓN · Rediseño: el dueño pidió retocar, no rehacer; parte de Diseño y de Navegación queda afuera
- **Tipo:** diseño · **Esfuerzo:** M · **Punto:** 6
- **Qué se comprobó:** 02-ordenes-vigentes.md:332-340, «Corrección del dueño sobre el diseño, 27/11 (manda sobre lo anterior)»: «dejarlo tal cual está ahora pero mejorarlo un poco, no así de drástico»; «la animación del Cerebro y la Oficina 3D no se tocan; se les suma función»; «nada de pantallas nuevas planas con tablas y botones»; fuera los pasteles. cerebro/24-reorganizacion-y-muestra-2711.md declara RECHAZADA la dirección «grafito y latón». Choques concretos:
- Navegación propone reemplazar el carrusel del Cerebro por una grilla de 2x5 tarjetas planas. Va en contra de la orden.
- Dirección de arte propone las paletas A y B y Manrope. Quedan como insumo para la variante de color, no como dirección.
- La Auditoría propone tokens.css y archivar las 15 hojas. Solo vale si el resultado visible es el mismo panel, retocado.
- El Cerebro y Velocidad proponen «reducir la escala o los puntos de la esfera». Solo vale si no se nota.
- **Por qué:** Los especialistas trabajaron sobre el pedido original y no sobre la corrección posterior del mismo día.
- **Evidencia:** 02-ordenes-vigentes.md:332-340; 24-…:3
- **Pasos:**
  1. Tanda de retoque (fase C): pasteles a tonos profundos, tipografía de 5 familias a 2, contrastes AA, tarjetas de perfil (bordes, logos, color de marca bien leído desde colores.principal), entrada 3D en lugar de la lámpara. Sin cambiar la estructura de las pantallas.
  2. En el Cerebro solo se corrige el texto encimado (sacar .cz-nucleo__txt del plano 3D y bajar la opacidad del dorso) sin tocar la animación.
  3. Hoy compacto: compactar y sacar repeticiones dentro del mismo lenguaje visual. No se arma una tabla plana nueva.
- **Archivos:** `cerebro/02-ordenes-vigentes.md`, `cerebro/24-reorganizacion-y-muestra-2711.md`, `src/app/cerebro/centro.css`

### 8. CONTRADICCIONES menores resueltas: dónde vive la lista de captados, /jarvis contra /asistente, límites de reapertura y plan 22
- **Tipo:** diseño · **Esfuerzo:** S · **Punto:** 2, 5 y 8
- **Qué se comprobó:** (a) Lista de captados: Captados propone /captados?perfil=X; Navegación y el plan 22, una pestaña dentro de Contactos. Gana el plan 22 («La lista única de captados vive dentro de Contactos»).
(b) Jarvis propone convertir /asistente en Jarvis a pantalla completa; Navegación propone crear /jarvis y que /asistente redirija. Gana /jarvis como dirección canónica, porque /jarvis da 404 (_rutas.json n=6, _errores.txt) y es lo que escribe el dueño. /asistente queda como redirect conservando ?pedido.
(c) Reapertura con plantilla: Chats no pone límite; Seguridad pone 5 por día por perfil y 1 por contacto cada 7 días; el plan 22, 1 por contacto cada 72 h, de 8 a 21 y con confirmación. Gana el plan 22. El tope diario de Seguridad queda como pregunta.
(d) El Cerebro dijo que 22-plan-panel-2711.md no existe: existe (53 líneas, commit 1d30ea6) y define 9 tandas.
- **Por qué:** Propuestas hechas en paralelo sin leer el plan ni entre sí.
- **Evidencia:** cerebro/22-plan-panel-2711.md «Opciones que tomo»
- **Pasos:**
  1. Usar el plan 22 como base y las tandas de las propuestas de esta revisión como reparto de archivos.
  2. Llevar (c) a las preguntas para el dueño.
- **Archivos:** `cerebro/22-plan-panel-2711.md`, `src/app/asistente/page.tsx`

### 9. HUECO · El cartel «Campaña con fallas · X no salieron» de Hoy es falso: suma las fallas de todo el perfil
- **Tipo:** existe y falla · **Esfuerzo:** S · **Punto:** 10 (Hoy sin carteles funcionales) y 6 (confianza en las cifras)
- **Qué se comprobó:** src/lib/definiciones/campanas.ts:39-42: si la campaña tiene enviados === 0 y fallidos24h > 0, muestra en rojo «Campaña con fallas · 0 de N enviados, X no salieron». Pero fallidos24h sale de contarFallidos24h (src/lib/salud/fallas.ts:44-49), que cuenta TODOS los mensajes salientes con delivery_status 'fallido' de las áreas del perfil en 24 h: respuestas a mano, bot, seguimientos y recontacto, no los de esa campaña. Por eso una campaña que espera el horario de envío (destinatarios pendientes, sin error) aparece «con fallas». Coincide con lo que registra cerebro/24-…md §1 («78 no salieron» cuando los 205 estaban pendientes) y con los 3 fallos 131047 de envíos a mano que detectó Chats. Ningún especialista lo señaló como causa.
- **Por qué:** Se reutilizó la cifra de Salud (por perfil) como si fuera de la campaña.
- **Evidencia:** sed -n 25,50p src/lib/definiciones/campanas.ts; grep contarFallidos24h src/lib/salud/fallas.ts
- **Pasos:**
  1. En campanas.ts, separar las dos cifras: `fallidosCampana24h` (campaign_recipients o mensajes con campaign_id de esa campaña) para el estado de la campaña, y dejar fallidos24h solo para Salud.
  2. Si enviados === 0 y no hay fallos propios, el texto es «Campaña lista · espera el horario (lun a sáb 8 a 21)».
  3. Prueba unitaria de estadoDeCampana con fallos ajenos a la campaña: tiene que dar verde o gris, no rojo.
- **Archivos:** `src/lib/definiciones/campanas.ts`, `src/lib/salud/fallas.ts`, `src/components/inicio/tablero-hoy.tsx`, `tests/unitarias/`

### 10. HUECO · Punto 4 «los bots se mezclan»: en los datos en vivo NO hay mezcla; la mezcla está en Bot IA, el Laboratorio y el prompt común
- **Tipo:** anda bien · **Esfuerzo:** S · **Punto:** 4
- **Qué se comprobó:** Lo comprobé con agregados de Supabase: todas las conversaciones y oportunidades tienen el área que corresponde a su rubro (conversaciones: agencia_0km 633, civil→juridico 3.864, coberturas 869, marketing 1.195; oportunidades: 1.898, 10.260, 1.320 y 1.718), sin ninguna fila cruzada ni nula. El conocimiento del bot en vivo se filtra por rubro (src/lib/conocimiento/servicio.ts:75, rubroDeConocimiento). La identidad del contacto lleva área (clave única area, channel_type, external_user_id). Lo que sí mezcla es lo que encontró Bots: casos de prueba de los 4 rubros, listas globales en /api/agentes/*, el Laboratorio con los 4 juntos, el agente «principal» editable desde cualquier perfil, y el principal concatenado en agent.ts:322-329 (inactivo hoy porque agent_assignments tiene 0 filas). Encenderlo propagaría a los 4 rubros cualquier cambio en el principal.
- **Por qué:** El dueño ve mezcla en las pantallas de configuración y prueba, no en las respuestas a prospectos.
- **Evidencia:** SQL de agregados conversations y opportunities por área y rubro; sed -n 300,335p agent.ts
- **Pasos:**
  1. Tanda Bots: aplicar el helper soloDelPerfil a TODOS los GET y POST de /api/agentes/* y devolver 403 si el recurso es de otro rubro.
  2. Antes de encender una asignación de la biblioteca, dejar el principal en solo lectura dentro de los perfiles (se edita en Configuración con aviso de «cambia en los 4»).
  3. Prueba de regresión: un contacto con el mismo teléfono en dos rubros genera dos identidades y dos conversaciones, cada una con su bot.
- **Archivos:** `src/lib/ai-agent/agent.ts`, `src/lib/conocimiento/servicio.ts`, `src/app/api/agentes/`

### 11. HUECO · «Gemini ejecuta si no hay uso de Claude»: el panel no puede saber cuánto uso le queda a Claude
- **Tipo:** diseño · **Esfuerzo:** S · **Punto:** 1
- **Qué se comprobó:** No existe ninguna API ni variable que le diga al panel si el plan de Claude tiene uso disponible. Hoy lo único que el panel ve es: disparar() → 'sin_disparador' o 'fallo' (lib/oficina/servidor.ts:73-93), oficina_arranques sin terminado_at y bandeja_claude sin tomada_at. El plan 22 decide por defecto «Gemini entra solo cuando se aprieta «Que lo haga Gemini»», y la Oficina propone además un modo automático por espera (p_espera_min).
- **Por qué:** Es un límite técnico real: el uso del plan de Claude no es visible desde Vercel.
- **Evidencia:** lib/oficina/servidor.ts:70-76; cerebro/22-plan-panel-2711.md «Opciones que tomo»
- **Pasos:**
  1. Fase 1 (por defecto): botón «Que lo haga Gemini» por tarea, deshabilitado para las clases codigo, publicacion y envio.
  2. Señal automática opcional (con OK del dueño): si el disparo devuelve sin_disparador o fallo, o si una tarea pendiente lleva más de N minutos sin tomada_at después de un arranque, la Oficina ofrece (o, en modo automático, asigna) ejecutor='gemini'.
  3. Latido de Claude: la skill `oficina` escribe system_settings 'claude_bandeja_ultimo_paso'; la Oficina muestra «Claude miró hace X» y usa ese dato como señal.
- **Archivos:** `src/lib/oficina/servidor.ts`, `src/lib/oficina/reglas.ts`, `.claude/skills/oficina/SKILL.md`

### 12. HUECO · Cerebro que aprende de internet: la búsqueda de Google desde Gemini ya existe, pero puede tener costo fuera del cupo gratis
- **Tipo:** riesgo · **Esfuerzo:** S · **Punto:** 3 (entrar a internet y aprender)
- **Qué se comprobó:** src/lib/marketing/analysis.ts ya usa la herramienta googleSearch de Gemini (es el único archivo de src con googleSearch), así que el canal existe y se puede reusar. Pero la búsqueda de Google desde Gemini puede facturarse aparte de los tokens cuando se pasa del cupo gratis, y hoy costoEstimadoUsd (presupuesto/reglas.ts:93) solo cuenta tokens. Eso choca con «no se paga nada sin autorización» y con el tope de USD 30. Seguridad agrega que el contenido de la web tiene que pasar por un lector sin herramientas (cuarentena) antes de llegar a un modelo con herramientas.
- **Por qué:** Ningún especialista revisó el costo de la búsqueda ni que ya hubiera una implementación.
- **Evidencia:** grep -rln googleSearch src
- **Riesgo:** Un gasto que no pasa por el tope y que el dueño no autorizó.
- **Pasos:**
  1. Antes de encenderlo, confirmar en la consola de Google AI el cupo gratis de la búsqueda y dejar el aprendizaje web apagado por defecto (system_settings) hasta el OK del dueño.
  2. Si se enciende: solo una lista de dominios permitidos por rubro, contador propio de búsquedas por día, lector sin herramientas y resultado como 'aprendizaje propuesto' con fuente (nunca pisa lo anterior).
  3. El recorrido del panel y la lectura del código completo corren en una tarea programada de Claude (no en Vercel). Hay que versionar el script del recorrido de solo lectura en scripts/recorrido/ (hoy está solo en el scratchpad).
- **Archivos:** `src/lib/marketing/analysis.ts`, `src/lib/presupuesto/reglas.ts`, `src/lib/cerebro/`

### 13. HUECO · Mapa de archivos compartidos entre tandas: estos se pisan si no se reparte la autoría
- **Tipo:** riesgo · **Esfuerzo:** S · **Punto:** Plan de ejecución (todas)
- **Qué se comprobó:** El plan 22 dice que «cada tanda toca archivos distintos», pero cruzando los hallazgos aparecen archivos que quieren tocar varias tandas a la vez:
- menu-mas.tsx: Jarvis saca «Asistente general»; Bots saca Biblioteca y Comparar; Navegación lo reordena.
- src/lib/menu.ts: Bots (pestañas de Bot IA), Captados (pestaña en Contactos) y Navegación.
- cerebro-vista.tsx: el Cerebro (salud, laboratorio, pendientes) y Jarvis (reemplazar ChatAsistenteGeneral).
- src/lib/ai-agent/agent.ts: Captados (líneas 900-1165) y Chats (datos del Excel en el contexto, 264-331).
- src/lib/asistente/motor.ts, herramientas.ts y catalogo.ts: Jarvis, la Oficina (alcance en oficina_pedir_tarea), Chats (plantilla a una persona) y Seguridad.
- ficha-section.tsx: Chats (datos del Excel) y Captados (prueba de captación).
- next.config.mjs: el Cerebro (graph.json) y Velocidad o Navegación (redirects).
- tablero-hoy.tsx: Hoy compacto y Velocidad.
- agentes/page.tsx y agentes-perfil-view.tsx: Bots y la unificación de Penal.
- src/lib/plantillas: Plantillas (preferida) y Chats (propósito reapertura).
- **Por qué:** Las tandas del plan 22 se definieron por tema, no por archivo.
- **Evidencia:** Cruce de los archivos citados en los 12 índices
- **Pasos:**
  1. Asignar cada archivo caliente a UNA sola tanda (ver propuestas) y que las demás consuman un contrato definido en la fase 0.
  2. Todo lo de menús va a una tanda de integración de la fase B.
  3. Lo que cruza agent.ts va en serie: primero Captados, después «datos del Excel para el bot».
- **Archivos:** `src/components/menu-mas.tsx`, `src/lib/menu.ts`, `src/components/cerebro/cerebro-vista.tsx`, `src/lib/ai-agent/agent.ts`, `src/lib/asistente/motor.ts`, `next.config.mjs`, `src/components/ficha/ficha-section.tsx`

## Orden de ejecución propuesto (fases y archivos de cada una)

### FASE 0 · Contratos y reservas (1 agente, Sonnet esfuerzo medio, en serie antes de todo)
Evita que las tandas paralelas se pisen. Deja el reparto de migraciones en docs/etapa6/MIGRACIONES.md (Oficina 0651-0653, Captados 0654-0656, Cerebro 0657-0659, Plantillas, reapertura y Penal 0660-0662, Jarvis y registro 0663-0664, Bots 0665). Crea src/lib/alcance.ts con el tipo Alcance ('rubro' | 'cuatro_rubros' | 'panel') y resolverDestino(), puros y con prueba; los usan la Oficina, el «Ordenale» del Cerebro y Jarvis. Fija por escrito la firma preguntarAlCerebro(pregunta, max, {rubroId}), la de templateOptions(linea, 'reapertura') y el destino de la lista de captados (/contactos?perfil=X&vista=captados). No toca pantallas.

### FASE A1 · Oficina y Bandeja (Opus o Sonnet esfuerzo alto)
Puntos 1, 3 (pedidos a Claude) y 9 (Bandeja por perfil). Archivos que son solo suyos: src/app/oficina/**, src/components/oficina/** (sin tocar la escena 3D), src/lib/oficina/**, src/lib/bandeja-claude.ts, src/app/api/oficina/**, src/app/api/bandeja-claude/**, src/app/bandeja/page.tsx, src/components/bandeja-claude.tsx, .claude/skills/oficina/SKILL.md, .claude/referencias/bandeja-claude.md y las migraciones 0651-0653 (alcance, grupo_id, rubro_id nullable, ejecutor, repaso, resultado_gemini, uso 'oficina' en agent_turn_logs). Hace: selector de alcance, departamento como destino real, 503 honesto sin disparador, botón Gemini con tope, bloqueo de «Aprobar» sin repaso, avance visible, Bandeja filtrada por rubro y el texto «Pedile algo» de bandeja-claude.tsx:108.

### FASE A2 · Jarvis único, adjuntos, memoria y seguridad de acciones (Opus esfuerzo alto)
Puntos 2 y 9, sin cambiar código (orden del 27/11). Archivos que son solo suyos: src/lib/jarvis/**, src/components/jarvis/** (incluye jarvis.tsx: retrasar el pedido de /api/jarvis/parte hasta que el navegador esté libre), src/app/api/jarvis/**, src/lib/asistente/motor.ts, herramientas.ts, catalogo.ts, permisos.ts, panel-operaciones.ts, src/app/api/asistente/acciones/**, src/components/asistente/chat-asistente-general.tsx (de ahí se extrae AdjuntarArchivos) y la migración 0663-0664 (origen, nivel, confirmado_con y pedido_literal en asistente_acciones). Hace: alcance perfil o general en un solo motor, Excel/CSV/PDF/imagen, recursoDelRubro al confirmar, PANEL_URL fija, límite por minuto, y oficina_pedir_tarea y bandeja_pedir_cambio con nivel reforzado y alcance de la fase 0. NO toca menús ni cerebro-vista.tsx.

### FASE A3 · Cerebro funcional (Opus esfuerzo alto, con un subagente Haiku para el barrido de textos)
Punto 3. Archivos que son solo suyos: src/app/cerebro/**, src/components/cerebro/** (cerebro-vista, barra-mando, tablero-pendientes, pantallas-cerebro, hablar-con-claude), src/lib/cerebro/**, src/app/api/cerebro/**, src/lib/cerebro/conocimiento-servidor.ts (filtro por rubro), next.config.mjs (solo outputFileTracingIncludes con los dos graph.json), centro.css (solo el texto encimado) y las migraciones 0657-0659 (cerebro_fragmentos con texto completo y trigramas, vector opcional; cerebro_pendientes; uso 'cerebro'). Hace: «Preguntale» con IA y citas dentro del tope; «Enseñale» que se nota; «Ordenale» con alcance; pendientes accionables (y corrige que lo general caiga en Marketing, tablero-pendientes.tsx:15); salud con botones; mapa navegable; laboratorio con cifras reales. NO toca la animación del anillo ni la esfera. La ventana de Jarvis queda con un lugar reservado hasta la fase B.

### FASE A4 · Plantillas por uso y línea única de Jurídico (Sonnet esfuerzo alto)
Punto 7. Archivos que son solo suyos: src/lib/plantillas/** (preferida en purposeTemplateCheck y templateOptions, propósito 'reapertura'), src/components/plantillas/**, src/app/meta/lineas/** (pestaña «Plantillas por uso»), src/app/api/plantillas/**, src/lib/webhooks/process.ts, src/lib/whatsapp/client.ts, src/lib/landing-lead.ts, src/app/landing/page.tsx, src/lib/definiciones/lineas.ts y las migraciones 0660-0662 (reapertura en el CHECK, messages.template_id, preferida con índice único parcial, archivado de lo Penal y line_id de Civil en las 1.694 conversaciones sin línea, sin DELETE). No toca src/app/redes/** para no cruzarse con la sesión de redes, ni agentes/page.tsx (eso es de A5).

### FASE A5 · Bots por rubro, con Biblioteca y Comparar dentro de Bot IA (Sonnet esfuerzo alto)
Puntos 4 y 9. Archivos que son solo suyos: src/app/api/agentes/** (con el helper _comun.ts soloDelPerfil), src/components/agentes/** (agentes-perfil-view con pestañas, sin solo-avanzado, roles-por-base.tsx con el texto viejo), src/app/(dashboard)/agentes/page.tsx y src/app/panel/*/agentes/page.tsx (Penal unificado: areas=['civil']), src/app/biblioteca-agentes/** y src/app/comparacion-agentes/** (como redirects a las pestañas), src/app/laboratorio/**, src/components/perfiles/laboratorio/** (sacar ChatAsistenteGeneral de laboratorio-bot.tsx:145), src/lib/laboratorio/**, src/lib/agentes/biblioteca.ts y la migración 0665 si hace falta (ai_agents penal active=false con motivo). NO toca menu.ts ni menu-mas.tsx.

### FASE A6 · Captados: regla, prueba y reclasificación (Opus esfuerzo alto más Sonnet para pruebas)
Punto 8. Archivos que son solo suyos: src/lib/ai-agent/agent.ts (toda la región de captación) y tools.ts, src/lib/agentes/aceptacion.ts y evidencia.ts, src/lib/captacion/** (pidioContactoHumano, lectura.ts listarCaptados), src/lib/definiciones/estado-chat.ts, intake-flow.ts, marketing/leads.ts, limpieza/servidor.ts, api/oportunidades/**, ficha-actions.tsx, scripts/reclasificar-captados.ts (en seco por defecto), .claude/referencias/reglas-comunes.md y la skill kocos-crm-reglas-de-captacion, más las migraciones 0654-0656 (revocar con motivo, captados_vista). Entrega la vista de la lista; la pantalla la monta la fase B.

### FASE A7 · Velocidad del servidor y cifras honestas (Sonnet esfuerzo medio, midiendo primero)
Puntos 6 (velocidad) y 10. Archivos que son solo suyos: src/lib/salud/index.ts (lectura rápida sin Meta y accesoLineas expuesto), src/lib/salud/fallas.ts (alerta sin nombre de la persona), src/app/salud/page.tsx (Suspense y «Volver a comprobar»), src/lib/whatsapp/estado-linea.ts (tope de 2,5 s y memoria de 'no_comprobado'), src/lib/acceso/pagina.tsx (React.cache de la sesión), src/lib/definiciones/campanas.ts (fallos propios de la campaña, hallazgo nuevo) y src/lib/metricas/semana.ts (fuente única de las cifras de la semana, pura y con prueba). Antes de tocar, mide con Server-Timing o con los logs de Vercel.

### FASE A8 · Chats y ficha: reabrir con plantilla y datos del Excel (Sonnet esfuerzo alto)
Punto 5. Archivos que son solo suyos: src/components/inbox/conversation-thread.tsx (botón «Reabrir con plantilla», rótulos «Del Excel» y «Los anotó la IA»), src/app/api/conversations/[id]/** (envío de plantilla con confirmación y límite de 72 h), src/lib/chat/reapertura.ts (pura, con reloj inyectado), src/components/ficha/ficha-section.tsx (bloque «Datos del Excel» con los datos sensibles detrás de «ver»), src/lib/ficha/datos-excel.ts, src/lib/ficha.ts (siguientePasoFicha con la ventana), src/lib/bases/import.ts (marca de origen). Consume templateOptions('reapertura') de A4 por contrato. NO toca agent.ts.

### FASE B1 · Integración de navegación y menús (Sonnet esfuerzo medio, después de integrar A1 a A8)
Puntos 2, 8 y 9. Archivos que son solo suyos: src/lib/menu.ts (pestañas de Bot IA y Contactos con «Captados» primero), src/components/menu-mas.tsx (sacar «Asistente general», Biblioteca y Comparar), menu-perfil.tsx, accesos-centrales.tsx, encabezado-panel.tsx, src/app/jarvis/page.tsx nueva y /asistente como redirect, src/app/contactos/** (pantalla de captados sobre listarCaptados de A6), cerebro-vista.tsx y centro-cerebro.tsx (solo cambiar ChatAsistenteGeneral por la hoja de Jarvis en modo general y el botón a /jarvis), y next.config.mjs (redirects de /chats y /citas). Revisa con grep que no quede ningún «Pedile algo».

### FASE B2 · Hoy compacto (Sonnet esfuerzo alto)
Punto 10. Archivos que son solo suyos: src/app/hoy/page.tsx, src/components/inicio/** (hoy-bento, tablero-hoy: sacar la segunda consulta a Meta; botones que actúan en el lugar con lista-en-lugar.tsx), src/lib/resumen-hoy.ts. Usa metricas/semana.ts (A7), listarCaptados (A6) y la lectura rápida de salud (A7). Compacta dentro del mismo lenguaje visual, sin pantalla plana nueva (corrección del dueño).

### FASE B3 · Jarvis dispara conversaciones y el bot usa los datos del Excel (Sonnet esfuerzo alto, en serie después de A6 y A8)
Puntos 2 y 5. Suma a Jarvis la herramienta proponer_plantilla_a_persona (motor.ts y herramientas.ts, reusando reapertura.ts de A8 y templateOptions de A4) con confirmación reforzada. Después agrega en agent.ts y prompt.ts el bloque «Datos que trajo la base (no confirmados)» con la lista blanca por rubro, más su evaluación (skill kocos-agentes-entrenamiento-y-evaluacion). Va en serie porque agent.ts ya lo tocó A6.

### FASE C · Retoque visual (cuando el dueño elija la variante de color)
Punto 6, como retoque y no como rediseño. Archivos: las hojas de estilo globales (pasteles --vv-* a tonos profundos y contrastes AA), src/components/perfiles/selector-pc.tsx y src/app/perfiles/page.tsx (colores.principal en lugar de colores.panel, bordes y una sola sombra), src/components/ui/logo-perfil.tsx y src/lib/marca.ts (escala óptica también para el logo cargado), src/app/layout.tsx (de 5 familias a 2; Playfair fuera o con itálica real), src/app/oficina/oficina.css (nombres de fuente reales), y src/app/login/page.tsx con src/components/acceso/entrada-3d.tsx (con next/dynamic y ssr:false; la lámpara se archiva). Prohibido tocar las animaciones de centro.css, cerebro.css y la Oficina 3D. Fotos de antes y después a 1440 y 375.

### FASE D · Repaso cruzado, pruebas y cierre (Opus como líder, con subagentes de varios modelos)
Cumple la orden de orquestación del 27/11. Haiku con esfuerzo bajo barre datos personales, voseo y textos viejos. Sonnet con esfuerzo medio corre typecheck, lint, las pruebas unitarias y la integración, y los casos A01-A35 (kocos-crm-pruebas-de-aceptacion). Opus con esfuerzo alto, más agentic-council:Skeptic, revisa rubros separados, confirmaciones y tope de Gemini. Cierra con docs/etapa6/ENTREGA.md, INFORME.md y MIGRACIONES.md, y con la actualización de cerebro/07-estado-verificado.md (hoy dice «0 tareas abiertas» y la Bandeja tiene 1 pendiente) y de 08-pendientes. Cada informe distingue especificado, implementado, probado, publicado y habilitado.

### Función nueva propuesta · Búsqueda global y «ir a» con Ctrl+K, por perfil
Un faltante básico de CRM que marcó Navegación y que nadie diseñó. Una sola caja que busca contacto, chat, campaña o pantalla dentro del perfil activo (rubros separados), y en el nivel general solo pantallas. Reusa src/lib/jarvis/pantallas.ts. Iría en la fase B1.

### Función nueva propuesta · Recordatorios propios por contacto («volver a llamar el jueves»)
Hoy los «Mis pendientes» de Resumen se mandan a la Bandeja para Claude, que es para otra cosa. Una tabla de recordatorios por contacto y perfil, visible en Hoy, ordena el trabajo diario sin depender de Claude. Necesita una migración en el rango de A6 o de B2.

## Preguntas para el dueño

- Gemini en la Oficina: ¿(a) solo cuando aprietes «Que lo haga Gemini» en una tarea (lo que el plan toma por defecto), o (b) también automático si Claude no toma la tarea en 30 minutos o si el disparo no está conectado? Código, publicar y enviar quedan siempre para Claude.
- Para que los pedidos lleguen a Claude: ¿activamos el disparo de la tarea programada «Oficina · procesar tareas» (cargás URL y token en Vercel) y, además, (a) una vuelta de respaldo cada 3 horas en días hábiles o (b) solo cuando alguien aprieta «Arrancar»? Cada vuelta usa uso de tu plan de Claude, sin costo extra.
- Reabrir un chat con plantilla de Meta: el plan deja 1 por contacto cada 72 h, de 8 a 21 y con confirmación. ¿Le sumamos un tope diario por perfil, por ejemplo (a) 5, (b) 20, o (c) sin tope diario? Cada envío por Meta se cobra según la categoría de la plantilla.
- Cerebro que aprende de internet: la búsqueda de Google desde Gemini puede cobrarse si se pasa del cupo gratis. ¿(a) Lo dejamos apagado hasta confirmar que entra gratis, (b) lo encendemos solo con una lista de sitios permitidos por rubro y dentro de los USD 30, o (c) que lo haga una tarea programada de Claude en lugar de Gemini?
- Reclasificar los 36 captados actuales: alrededor de 20 no tienen prueba de que hayan pedido o aceptado el contacto. ¿(a) Pasan solos a «Interesados» con «Deshacer» por fila, o (b) quedan en «Prueba a revisar» y los decidís vos uno por uno?
- Retoque visual: ¿qué variante de color querés para las cajas que hoy son pastel? (a) tonos profundos con letra clara y anillo dorado (la del plan), (b) grafito neutro frío, o (c) oscuro cálido marfil.
