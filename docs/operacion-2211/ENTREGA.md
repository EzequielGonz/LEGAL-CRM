# Operación y costos · 22/11 · Entrega

Rama `arreglos/operacion-2211` (sale de `main`). Tres mejoras de operación que autorizó el dueño (hallazgos 21/11, §3 ítems 4, 5 y 10). No toca estilos, captación, cifras ni rubros. Ninguna migración está aplicada: las aplica quien administra (ver `MIGRACIONES.md`).

Estado de cada cosa: **especificado** sí, **implementado** sí, **probado** con pruebas unitarias (no contra la base ni contra Gemini reales), **publicado** no (solo la rama), **habilitado** no (hay que aplicar 0638 y 0639 y publicar).

## 1. Tope diario de gasto de Gemini por perfil, con aviso al 80 %

**Cómo se mide.** El panel ya guardaba por turno los tokens de entrada, de salida y de razonamiento (`agent_turn_logs`), pero `costo_usd` quedaba vacío en producción (solo se calculaba para candidatos de experimento). Ahora el gasto se estima con tokens por un precio por millón configurable. Una función de la base (`gasto_gemini_resumen`, migración 0638) suma el día y el mes por rubro en una sola consulta. El recontacto del bot también llama a la IA y no dejaba registro: ahora registra tokens con `uso = 'recontacto'`.

**Valores por defecto** (en `src/lib/presupuesto/reglas.ts`, configurables):

| Valor | Por defecto |
|---|---|
| Presupuesto del mes (todos los bots) | USD 30 |
| Aviso | al 80 % del mes (USD 24) |
| Tope diario por perfil | USD 0,40 (el promedio es USD 1,00 por día en total). **Solo aviso por defecto** (integración 22/11, pedido de Dirección: los precios por token son estimados y sin verificar): mide y avisa en Salud y a los dispositivos, pero no corta al bot |
| Precio de entrada | USD 0,30 por millón de tokens |
| Precio de salida (incluye razonamiento) | USD 2,50 por millón |
| Freno general (`frenar`) | encendido: el tope del **mes** frena (apagado = solo mide y avisa) |
| Freno diario (`frenoDiario`) | **apagado**: el tope del día es solo aviso; con `true` también corta a ese perfil hasta la medianoche |

**Qué pasa al llegar al tope del mes** (o al del día, solo si `frenoDiario` está en `true`) (`src/lib/ai-agent/agent.ts`, antes de la primera llamada al modelo):
- El bot no se corta en seco: responde con el **cierre de reserva del rubro** que ya existía (el mismo que sale si el modelo no da un cierre válido), el chat pasa a una persona con su tarea de atención (mismo camino que «consulta fuera de alcance») y el turno queda registrado con `error = 'tope_gasto_dia: …'` o `tope_gasto_mes: …`.
- Como el chat queda pausado para la IA, no se repite ni se manda más de una vez a la misma persona.
- El recontacto automático no sale mientras haya tope (no llama al modelo y no marca nada).
- Por debajo del tope no cambia nada: la decisión es «libre».
- Si no se puede leer el gasto (la base falla), el bot **sigue** como hoy (un monitor caído no corta conversaciones) y se deja el error en el registro del servidor.

**Avisos y Salud.** El latido (minuto :07 de cada 10) avisa a los dispositivos al llegar al 80 % del mes (una vez por mes), al tope del mes (una vez por mes) y al tope diario de cada perfil (una vez por perfil y día); sin datos de personas. En Salud: un control «Gasto de IA del mes» (verde, amarillo desde el 80 %, rojo al 100 %) y un control amarillo por perfil que llegó a su tope de hoy, visible solo en ese perfil.

**Configuración.** Se guarda en `system_settings` con la clave `presupuesto_gemini` (ver ejemplo en `MIGRACIONES.md`). Sin esa fila rigen los valores por defecto.

**Límites a tener en cuenta.**
- La lectura del gasto se guarda en memoria un minuto: un perfil puede pasarse por los turnos de ese minuto.
- Cuentan todos los usos con perfil (bot en vivo, recontacto, análisis, evaluaciones). Los usos de IA que no pasan por `agent_turn_logs` (asistente «Pedile algo», Laboratorio, informes de mejora, transcripción de audios) **no** se miden todavía.
- El tope del día usa el día en hora de Argentina; el del mes, el mes calendario de Argentina.

## 2. Tiempo máximo en el recontacto y campañas sin dormir en serie

**Causa.** (a) El recontacto llamaba a Gemini sin tiempo máximo: una llamada colgada ocupaba el latido. (b) `tickAllActiveCampaigns` recorría las campañas en serie y cada campaña de Wasender dormía hasta 20 s antes de enviar: con tres campañas se gastaba todo el latido (60 s) y lo demás quedaba sin tiempo.

**Arreglo.**
- Recontacto (`src/lib/recontacto/motor.ts`): la llamada al modelo tiene 12 s de tiempo máximo y el envío 15 s, sin reintentos dentro del latido. Si el modelo falla por algo pasajero (tiempo agotado, 429, 5xx), el turno se **libera** y se vuelve a tomar en el próximo latido, hasta 2 intentos en total; después queda en «error». Una falla del **envío** nunca se reintenta (podría haber salido). El presupuesto de 15 s del paso sigue.
- Campañas (`src/lib/campaigns.ts` y `src/lib/concurrencia.ts`): corren hasta 5 líneas a la vez; las campañas de una misma línea siguen en serie (comparten cupo y ritmo); tiempo máximo de 30 s por línea y no se empiezan líneas nuevas pasados 35 s. Lo que no alcanza queda como «busy» y sigue en el próximo latido. El bloqueo por campaña (`campaign_tick_lock`, 120 s) evita que una ejecución cortada se pise con la siguiente. Un error en una campaña ya no tumba al latido entero.

**Pendiente a observar.** El desfase al azar de 20 s de Wasender sigue existiendo (es parte del ritmo humano); ahora no se suma entre líneas. Conviene mirar en Salud el tiempo de la etapa «campañas» tras publicar.

## 3. Job de pg_cron del latido versionado y alerta de atraso

**Versionado** (migración 0639). El job `campaigns-tick` (cada minuto, `net.http_post` con 55 s de tiempo máximo) queda definido en el repo, **sin el secreto**: se lee en cada corrida desde Supabase Vault (secreto `crm_cron_secret`, cargado a mano una vez, fuera del repo). Si falta Vault o el secreto, la migración no toca el job vigente. Se leyó la definición actual con el conector de Supabase (solo lectura): `campaigns-tick`, `* * * * *`, activo; el secreto estaba escrito en el comando y se reemplazó por un marcador antes de escribir nada.

**Alerta de atraso.**
- Salud: amarillo cuando el latido lleva entre 3 y 5 minutos sin correr (el rojo a los 5 sigue igual); amarillo durante una hora después de un hueco de más de 4 minutos (el latido registra el hueco).
- Aviso a los dispositivos cuando el latido vuelve después de 10 minutos o más sin correr (uno por hora como mucho). Un latido detenido del todo no puede avisar por sí mismo: eso lo cubre el rojo de Salud al abrir el tablero. Un aviso desde afuera del servidor (por ejemplo un monitor externo gratuito sobre `/api/campaigns/tick`) requeriría un servicio nuevo: **no se hizo, decide el dueño**.

## Archivos

Nuevos: `src/lib/presupuesto/{reglas,servidor,salud}.ts`, `src/lib/concurrencia.ts`, `src/lib/salud/latido-atraso.ts`, `supabase/migrations/0638_gasto_gemini_tope.sql`, `supabase/migrations/0639_latido_pg_cron.sql`, `tests/unitarias/presupuesto-gemini-2211.test.ts`, `tests/unitarias/operacion-latido-2211.test.ts`.
Modificados (cambios acotados): `src/lib/ai-agent/agent.ts` (compuerta del tope), `src/lib/recontacto/{motor,reglas}.ts`, `src/lib/campaigns.ts` (`tickAllActiveCampaigns`), `src/app/api/campaigns/tick/route.ts`, `src/lib/salud/{index,reglas,por-perfil,avisar-fallas}.ts` (se suman controles sin tocar los existentes), `src/lib/experimento/servicio.ts` (tipo de `uso`).

## Qué se probó y qué no

Probado (unitarias, 27 casos nuevos en 2 archivos; en total 630 en verde): reglas del tope (libre, aviso al 80 %, tope del día, tope del mes, freno apagado, por debajo del tope no frena), costo por tokens, configuración inválida, mes y día en hora de Argentina, controles de Salud (y que aparezcan solo en su perfil), la concurrencia con tiempo máximo (una tarea colgada no atrasa a las demás, error aislado, presupuesto de tiempo), agrupación por línea, decisión de liberar o marcar error en el recontacto, hueco y atraso del latido.

No probado: la compuerta dentro de `runAgentTurn` con una base real, la migración 0638 y 0639 en una base real (no se aplicaron), el comportamiento contra Gemini y Wasender reales, el aviso a dispositivos. Verificaciones: `typecheck` (app y pruebas), `build` y las 630 pruebas unitarias en verde; `npm run lint` no carga su configuración dentro de esta copia aislada (resuelve el `.eslintrc` del directorio superior), así que se corrió `eslint` con la configuración de la copia sobre los archivos tocados, sin hallazgos.

## Decisiones que necesita el dueño

1. ¿Los precios por millón de tokens y los USD 0,40 diarios por perfil son razonables? Los precios son una estimación (no se verificó la tarifa vigente del modelo): conviene cargar la real en `presupuesto_gemini`.
2. ¿Medir también el asistente, el Laboratorio, los informes de mejora y la transcripción de audios? Hoy no entran en el gasto.
3. ¿Aviso externo por si el latido se detiene del todo?
