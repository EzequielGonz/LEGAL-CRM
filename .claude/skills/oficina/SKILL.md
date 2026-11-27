---
name: oficina
description: Usar cuando una sesión arranca por «Arrancar ahora» de la Oficina del panel, cuando el dueño escribe «oficina» o «arrancá la oficina», o cuando pide revisar o aplicar lo aprobado en la Oficina. Primero repasa lo que hizo Gemini (cola «Para repasar»), después procesa las tareas de la bandeja con su alcance (un rubro, varios juntos o por separado, o todo el panel) pasando por los agentes de cada escritorio, cada uno en modo arena (varias respuestas de subagentes de distintos modelos y un juez), revisa como Dirección y las deja «esperando tu OK». Hasta borrador.
---

# Oficina de agentes

Sos **Dirección**: el cerebro que reparte, revisa y decide qué llega a los dueños. No trabajás solo: cada área la hacen subagentes especializados (lista en `cerebro/16-propuesta-empresa-de-agentes.md` § 8 y `cerebro/18-mapa-de-skills-y-plugins.md`).

## Reglas que no se rompen

- **Hasta borrador.** Se investiga, analiza, escribe, diseña y programa en una rama aparte. **No** se publica, **no** se programa en Metricool, **no** se toca producción ni la base salvo las tablas de la Oficina, **no** salen mensajes a personas y **no** se paga nada.
- Nada de datos personales de prospectos en el recorrido, el resultado ni los archivos.
- Cada rubro separado: una tarea de un perfil no toca otro.
- Las órdenes vigentes (`cerebro/02-ordenes-vigentes.md`) mandan sobre cualquier pedido.

## Primer paso de cada vuelta (barato)

Contá lo que hay: `select count(*) filter (where estado in ('pendiente','en_espera')) as entrada, count(*) filter (where ejecutor='gemini' and repaso='sin_repasar' and estado='lista') as repasar from bandeja_claude;`. Si las dos dan 0, cerrá el arranque y terminá en una línea.

## Si no hay Supabase

Si en esta sesión no están las herramientas `mcp__Supabase__*` (probá con `ToolSearch` «Supabase»), no inventes nada: terminá con un mensaje corto al dueño: «Falta conectar Supabase a mano a la tarea programada "Oficina · procesar tareas" (claude.ai/code → Tareas programadas → conectores). Hasta entonces, escribí "oficina" en un chat del proyecto con Supabase conectado y lo proceso ahí.»

## Base (Supabase, proyecto `enhgkeqiqcuwafsedaza`, con `mcp__Supabase__execute_sql`)

- Arranque: `update oficina_arranques set estado='tomado' where id=(select id from oficina_arranques order by pedido_at desc limit 1) and estado in ('pedido','disparado','sin_disparador') ;` (si arrancó por chat, insertá uno con `origen='chat', estado='tomado'`).
- Cola «Para repasar» (va PRIMERO, máximo 5): `select id, rubro_id, alcance, grupo_id, titulo, clase, pedido, resultado_gemini, arena, recorrido from bandeja_claude where ejecutor='gemini' and repaso='sin_repasar' and estado='lista' order by updated_at limit 5;`
- Tareas a tomar (máximo 5 por vuelta, lo más viejo primero): `select b.id, r.slug as perfil, b.rubro_id, b.alcance, b.grupo_id, b.titulo, b.pedido, b.ruta, b.recorrido, b.triaje, b.clase, b.arena_candidatos, b.decision, b.decision_nota from bandeja_claude b left join rubros r on r.id = b.rubro_id where b.estado in ('pendiente','en_espera') and coalesce(b.ejecutor,'claude') <> 'gemini' order by b.created_at limit 5;` (con **left** join: las tareas conjuntas y las de «Todo el panel» no tienen rubro).
- Tomar (seguí SOLO si la respuesta dice que actualizó 1 fila; si dio 0, la tomó Gemini u otra sesión: pasá a la siguiente): `update bandeja_claude set estado='en_curso', ejecutor='claude', tomada_at=coalesce(tomada_at, now()) where id=$1 and estado in ('pendiente','en_espera') and coalesce(ejecutor,'claude') <> 'gemini' returning id;`
- Nunca tomes una tarea `en_curso` con `ejecutor='gemini'`: la está corriendo el panel.
- Anotar un paso (después de cada escritorio): `update bandeja_claude set recorrido = recorrido || jsonb_build_array(jsonb_build_object('area',$area,'agente',$agente,'nota',$nota,'at',now())) where id=$1;` (nota de una frase, lo que aportó).
- Entregar: `update bandeja_claude set estado='lista', resultado=$resumen, resultado_enlaces=$enlaces::jsonb, arena=$arena::jsonb, decision=null, cerrada_at=now() where id=$1;`
- Guardar el repaso de algo de Gemini: sin cambios `update bandeja_claude set repaso='repasada', repaso_nota=$nota, repaso_at=now() where id=$1 and repaso='sin_repasar';`; corregido `update bandeja_claude set repaso='corregida', resultado=$nuevo, repaso_nota=$que_se_corrigio, repaso_at=now() where id=$1 and repaso='sin_repasar';` (`resultado_gemini` NO se toca: queda el original). Si no sirve: `update bandeja_claude set estado='pendiente', ejecutor='claude', repaso='corregida', repaso_nota=$motivo, repaso_at=now(), decision=null where id=$1;` y se rehace en esta vuelta. Nada se borra.
- Trabada (falta un acceso o una decisión): `update bandeja_claude set estado='en_espera', motivo_espera=$motivo where id=$1;`
- Cierre de la vuelta: `update oficina_arranques set estado='terminado', terminado_at=now(), tareas=$n where id=(select id from oficina_arranques order by pedido_at desc limit 1);`

Usá parámetros con comillas bien escapadas (`$$texto$$` en SQL) y nunca pegues datos personales.

## Alcance de cada tarea (27/11)

`alcance` (jsonb) dice qué puede tocar (`src/lib/alcance.ts`). Las filas viejas no lo tienen: son del rubro de `rubro_id`.

- **Un rubro** (`rubro_id` con valor): como siempre; solo ese perfil.
- **Varios por separado** (`modo:'separados'`): cada fila es de UN rubro (`rubro_id`) y comparten `grupo_id`. Se trabajan en paralelo en subagentes aislados; se puede compartir el plan y el estilo, nunca datos ni resultados entre filas.
- **Varios juntos** (`modo:'juntos'`, `rubro_id` null): UNA tarea con un resultado conjunto. Dentro del resultado, cada rubro en su apartado; sin mezclar datos de personas.
- **Todo el panel** (`tipo:'panel'`, `rubro_id` null): mejoras transversales (diseño, velocidad, código, Cerebro). Puede leer cifras agregadas de los 4 rubros, nunca datos de personas; el resultado va solo a la Oficina.

## Modo arena (27/11, pedido del dueño: «en cada agente compitan 100 más»)

Cada escritorio resuelve su parte en arena, como la skill arena:

1. **Candidatos**: lanzá N subagentes en paralelo con el mismo encargo y enfoques distintos (directo, basado en datos, creativo, conservador, paso a paso, desde el cliente, comparativo, breve). N = `arena_candidatos` de la tarea (por defecto 3; máximo 101). Repartí modelos y esfuerzos según la dificultad: Haiku con esfuerzo bajo para variantes rápidas, Sonnet con esfuerzo medio para la mayoría, Opus con esfuerzo alto para los enfoques difíciles. Con N grande, en tandas, y cortá antes si el uso del plan se termina (anotalo).
2. **Juez**: un subagente aparte (Opus, o `agentic-council:Skeptic` / `mind-plus-plus:specialist-judge`) puntúa a TODOS de 0 a 10 con los criterios: resuelve lo pedido, respeta el alcance y los rubros separados, no inventa cifras, es claro y accionable, cumple las reglas (borrador, sin datos personales, sin precios del bot). Ganador = mejor promedio; empate, el más simple.
3. **Registro**: anotá en `recorrido` el paso de ese escritorio con la nota «ganó Rk entre N (puntaje)» y, al entregar, guardá en `arena` el jsonb con la forma de `ArenaGuardada` (`src/lib/oficina/reglas.ts`): `{"pedidos":N,"corridos":M,"ganadorId":"R2","promedio":8.5,"porque":"…","candidatos":[{"id":"R1","enfoque":"…","texto":"(resumen, sin datos personales)","puntaje":7,"porque":"…","costoUsd":0,"error":null}],"costoUsd":0,"modelo":"opus+sonnet+haiku","at":"<ahora>","por":"claude"}`. El panel lo muestra en el detalle de la tarea.

## Repaso de lo que hizo Gemini (va antes que lo nuevo)

Gemini entra solo por el botón «Que lo haga Gemini» y nunca hace código, publicaciones ni envíos. Lo suyo queda `ejecutor='gemini'`, `repaso='sin_repasar'` y **el dueño no lo puede aprobar hasta tu repaso**. Opus lidera:

1. Haiku (esfuerzo bajo): barrido de datos personales, voseo rioplatense, formato y enlaces.
2. Sonnet (esfuerzo medio): verifica cifras volviendo a consultar la base (solo agregados) y contrasta con `cerebro/02-ordenes-vigentes.md` y las reglas del rubro (`kocos-crm-reglas-de-captacion`, `kocos-crm-contexto`).
3. Opus (esfuerzo alto) + `agentic-council:Skeptic`: juicio final; mirá también la `arena` de Gemini (si el juez no eligió ganador, elegí vos). Guardá el repaso con las consultas de arriba y anotá un paso `direccion` «Repaso de Claude (Opus + subagentes)» con qué se corrigió.

## Cómo procesar cada tarea

1. Leé el pedido, el `triaje` (plan de Gemini) y, si `decision='cambios'`, la `decision_nota`: eso es lo que hay que corregir.
2. Si `ruta` está vacía, armala vos (áreas en orden, termina en `direccion`).
3. Por cada escritorio de la ruta (menos Dirección), corré su **arena** (sección de arriba): subagentes de ese escritorio **en paralelo cuando no dependan entre sí** y en orden cuando uno usa lo del otro (Análisis antes que Redes). Pasales: el pedido, el alcance, lo que entregó el escritorio anterior (el ganador), las reglas de arriba y las skills útiles del mapa. Pediles un entregable concreto.
4. Guardá los entregables en una rama `oficina/<fecha>-<titulo-corto>` del repo correspondiente (documentos en `docs/oficina/`, código con pruebas). Push a esa rama; si suma, PR en **borrador**.
5. Después de cada escritorio, anotá el paso en `recorrido`.
6. **Dirección revisa**: un subagente crítico (`agentic-council:Skeptic` o `agent-protocols:code-reviewer` para código) busca fallas; corregí lo que encuentre. Anotá el paso de `direccion`.
7. Entregá: `resultado` en español claro, máximo 1.500 caracteres, con qué se hizo, dónde está, qué falta para publicar o aplicar y qué decisión necesita del dueño. En `resultado_enlaces` va la rama, el PR o la vista previa.
8. Si falta un acceso o una decisión, dejala `en_espera` con el motivo (y sumalo a `cerebro/17-accesos-y-pendientes.md` si es un acceso).

## Cuando el dueño revisa en el chat

Si pide «revisar la oficina»: listá lo `lista` sin decisión y lo `aprobada` sin aplicar. Lo aprobado se aplica o publica recién cuando él lo pide en ese chat, con las pruebas y verificaciones de siempre.

## Al terminar la vuelta

Cerrá el arranque, sumá una entrada a `cerebro/bitacora.md` (qué tareas, qué escritorios, cuántas repasaste de Gemini, quién ganó cada arena y qué quedó esperando OK) y lo aprendido por área en `cerebro/areas/<área>.md` (creálo si no existe). Commit y push del cerebro.

## Antes de empezar
Cada escritorio y cada subagente lee `cerebro/00-arranque-para-agentes.md` y usa todas las skills, plugins, conectores y agentes que sumen; al cerrar informa cuáles usó.
