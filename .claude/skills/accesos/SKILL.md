---
name: accesos
description: Usar cuando el dueño escribe «accesos» (solo esa palabra o «sesión de accesos», «darte accesos», «cargar claves», «conectar cuentas»). Recorre cerebro/17-accesos-y-pendientes.md de a un punto: comprueba qué ya está, pide lo que falta por la vía segura, verifica, lo marca en el cerebro y sigue con los pendientes de los dueños y las preguntas abiertas.
---

# Sesión «accesos»

El dueño abrió un chat del proyecto para darte accesos, cerrar pendientes suyos y contestar preguntas. Hablale en español rioplatense, con voseo, corto y en masculino («el dueño»).

## Lo primero, antes que nada

Pedile al dueño que **conecte Supabase a mano**, y no sigas hasta que esté:
1. En esta sesión: claude.ai → Configuración → Conectores → Supabase → conectar (o «Reconectar») con la cuenta del proyecto `enhgkeqiqcuwafsedaza`. Verificá con `mcp__Supabase__list_tables` (o `ToolSearch` «Supabase» si no aparece).
2. En la tarea programada «Oficina · procesar tareas» (claude.ai/code → Tareas programadas): sumarle el conector Supabase y el repositorio LEGAL-CRM. Sin eso, «Arrancar ahora» despierta a los agentes pero no pueden leer la bandeja.

## Antes de empezar

1. Leé `cerebro/17-accesos-y-pendientes.md` completo y `cerebro/02-ordenes-vigentes.md` § «La única restricción».
2. Comprobá el estado real de cada punto ⬜ antes de pedirlo, sin preguntarle:
   - variables de Vercel: solo los **nombres** (`mcp__Vercel__filter_project_envs`, proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`, equipo `team_DGPKq7VRI79P0koUBcsxu1IH`); nunca descifrar valores;
   - conectores: `ListConnectors` o `ToolSearch` con el nombre del servidor;
   - plugins: `ListPlugins`.
   Si algo ya está, marcalo ✅ con la fecha y no lo pidas.
3. Mostrale un resumen de una pantalla: cuántos accesos faltan, cuántos pendientes suyos y cuántas preguntas. Arrancá por el primer acceso ⬜.

## Cada punto

- **Claves o tokens:** nunca en el chat. Usá `request_credential` con el host exacto, o pedile que la cargue en Vercel y vos verificás el nombre. Si un CLI necesita la clave en el entorno, usá un valor de relleno: el proxy pone la real.
- **Conectores con inicio de sesión** (Google, GitHub, PostHog, Canva): decile dónde tocar (claude.ai → Configuración → Conectores) y verificá llamando a una herramienta del conector.
- **Disparo de la Oficina (A1):** cuando te pase la dirección y el token, cargalos como variables de Vercel `OFICINA_DISPARO_URL` y `OFICINA_DISPARO_TOKEN` (de tipo sensible; producción), redeployá y probá «Arrancar ahora» con una tarea de prueba marcada «PRUEBA». Si la API pide un encabezado beta, cargalo en `OFICINA_DISPARO_BETA`.
- Después de cada punto: verificalo de verdad (una llamada que funcione), cambiá ⬜ por ✅ con la fecha en `17`, anotá en `cerebro/bitacora.md` y en `cerebro/06-tecnica-repos-y-accesos.md` qué quedó conectado (sin valores).
- Si el dueño dice «después» o «saltear», dejalo ⬜ con la nota y seguí.

## Pendientes de los dueños y preguntas

- Recorré § 2 de a uno: decile qué hace falta, ofrecé hacer tu parte (por ejemplo, actualizar Vercel después de que él rote una clave) y marcalo.
- Hacé las preguntas de § 3 de a una, con opciones cuando se pueda (`AskUserQuestion`). Pasá cada respuesta a `12-preguntas-para-entender.md` y, si cambia una regla, a `02-ordenes-vigentes.md`. Actualizá `src/lib/cerebro/contenido.ts` (PREGUNTAS_ABIERTAS) si cambian las preguntas que muestra el panel.

## Al cerrar

Commit y push de `cerebro/` (rama de trabajo y `main` si se puede), y un mensaje final corto: qué quedó conectado, qué falta y qué contestó.
