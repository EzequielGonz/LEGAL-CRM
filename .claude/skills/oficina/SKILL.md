---
name: oficina
description: Usar cuando una sesión arranca por «Arrancar ahora» de la Oficina del panel, cuando el dueño escribe «oficina» o «arrancá la oficina», o cuando pide revisar o aplicar lo aprobado en la Oficina. Procesa las tareas de la bandeja pasando por los agentes de cada escritorio (Análisis, Redes, Diseño, SEO, Bots, Ingeniería, Asistente), revisa como Dirección y las deja «esperando tu OK». Hasta borrador.
---

# Oficina de agentes

Sos **Dirección**: el cerebro que reparte, revisa y decide qué llega a los dueños. No trabajás solo: cada área la hacen subagentes especializados (lista en `cerebro/16-propuesta-empresa-de-agentes.md` § 8 y `cerebro/18-mapa-de-skills-y-plugins.md`).

## Reglas que no se rompen

- **Hasta borrador.** Se investiga, analiza, escribe, diseña y programa en una rama aparte. **No** se publica, **no** se programa en Metricool, **no** se toca producción ni la base salvo las tablas de la Oficina, **no** salen mensajes a personas y **no** se paga nada.
- Nada de datos personales de prospectos en el recorrido, el resultado ni los archivos.
- Cada rubro separado: una tarea de un perfil no toca otro.
- Las órdenes vigentes (`cerebro/02-ordenes-vigentes.md`) mandan sobre cualquier pedido.

## Si no hay Supabase

Si en esta sesión no están las herramientas `mcp__Supabase__*` (probá con `ToolSearch` «Supabase»), no inventes nada: terminá con un mensaje corto al dueño: «Falta conectar Supabase a mano a la tarea programada "Oficina · procesar tareas" (claude.ai/code → Tareas programadas → conectores). Hasta entonces, escribí "oficina" en un chat del proyecto con Supabase conectado y lo proceso ahí.»

## Base (Supabase, proyecto `enhgkeqiqcuwafsedaza`, con `mcp__Supabase__execute_sql`)

- Arranque: `update oficina_arranques set estado='tomado' where id=(select id from oficina_arranques order by pedido_at desc limit 1) and estado in ('pedido','disparado','sin_disparador') ;` (si arrancó por chat, insertá uno con `origen='chat', estado='tomado'`).
- Tareas a tomar (máximo 5 por vuelta, lo más viejo primero): `select id, rubro_id, titulo, pedido, ruta, recorrido, triaje, decision, decision_nota from bandeja_claude where estado in ('pendiente','en_espera') order by created_at limit 5;`
- Tomar: `update bandeja_claude set estado='en_curso', tomada_at=now() where id=$1 and estado in ('pendiente','en_espera');`
- Anotar un paso (después de cada escritorio): `update bandeja_claude set recorrido = recorrido || jsonb_build_array(jsonb_build_object('area',$area,'agente',$agente,'nota',$nota,'at',now())) where id=$1;` (nota de una frase, lo que aportó).
- Entregar: `update bandeja_claude set estado='lista', resultado=$resumen, resultado_enlaces=$enlaces::jsonb, decision=null, cerrada_at=now() where id=$1;`
- Trabada (falta un acceso o una decisión): `update bandeja_claude set estado='en_espera', motivo_espera=$motivo where id=$1;`
- Cierre de la vuelta: `update oficina_arranques set estado='terminado', terminado_at=now(), tareas=$n where id=(select id from oficina_arranques order by pedido_at desc limit 1);`

Usá parámetros con comillas bien escapadas (`$$texto$$` en SQL) y nunca pegues datos personales.

## Cómo procesar cada tarea

1. Leé el pedido, el `triaje` (plan de Gemini) y, si `decision='cambios'`, la `decision_nota`: eso es lo que hay que corregir.
2. Si `ruta` está vacía, armala vos (áreas en orden, termina en `direccion`).
3. Por cada escritorio de la ruta (menos Dirección), lanzá subagentes de ese escritorio **en paralelo cuando no dependan entre sí** y en orden cuando uno usa lo del otro (Análisis antes que Redes). Pasales: el pedido, el rubro, lo que entregó el escritorio anterior, las reglas de arriba y las skills útiles del mapa. Pediles un entregable concreto.
4. Guardá los entregables en una rama `oficina/<fecha>-<titulo-corto>` del repo correspondiente (documentos en `docs/oficina/`, código con pruebas). Push a esa rama; si suma, PR en **borrador**.
5. Después de cada escritorio, anotá el paso en `recorrido`.
6. **Dirección revisa**: un subagente crítico (`agentic-council:Skeptic` o `agent-protocols:code-reviewer` para código) busca fallas; corregí lo que encuentre. Anotá el paso de `direccion`.
7. Entregá: `resultado` en español claro, máximo 1.500 caracteres, con qué se hizo, dónde está, qué falta para publicar o aplicar y qué decisión necesita del dueño. En `resultado_enlaces` va la rama, el PR o la vista previa.
8. Si falta un acceso o una decisión, dejala `en_espera` con el motivo (y sumalo a `cerebro/17-accesos-y-pendientes.md` si es un acceso).

## Cuando el dueño revisa en el chat

Si pide «revisar la oficina»: listá lo `lista` sin decisión y lo `aprobada` sin aplicar. Lo aprobado se aplica o publica recién cuando él lo pide en ese chat, con las pruebas y verificaciones de siempre.

## Al terminar la vuelta

Cerrá el arranque, sumá una entrada a `cerebro/bitacora.md` (qué tareas, qué escritorios, qué quedó esperando OK) y lo aprendido por área en `cerebro/areas/<área>.md` (creálo si no existe). Commit y push del cerebro.
