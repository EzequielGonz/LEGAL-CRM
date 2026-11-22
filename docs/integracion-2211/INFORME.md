# Integración 22/11 · informe

Rama `integracion/arreglos-2211`, sale de `origin/main` (71f646e, con los commits de seguridad) y vuelve a traer `main` al final (8b07fef). **No se publicó en `main`, no se aplicó ninguna migración y no se tocó la base de producción.**

Estado: especificado sí · implementado sí · probado con pruebas unitarias, `build` y las tres migraciones en un Postgres 16 local descartable (no contra la base real) · publicado **no** (solo esta rama) · habilitado **no** (faltan migraciones y publicar).

## 1. Qué se juntó

| Rama | Commits | Qué trae | Entrega |
| --- | --- | --- | --- |
| `arreglos/operacion-2211` | 1 | Tope de gasto de Gemini, tiempos máximos en recontacto y campañas en paralelo por línea, alerta de atraso del latido, job de pg_cron versionado (0638, 0639) | `docs/operacion-2211/ENTREGA.md`, `MIGRACIONES.md` |
| `arreglos/captacion-y-cifras-2211` | 8 | Seguimiento a 72 h con tolerancia, estado del chat, Penal solo en Jurídico, retenidos y avisos por perfil, evidencia de captación con el mensaje real, cifras con una sola definición, Salud con el acceso real de Meta (0637) | `docs/arreglos-2211/ENTREGA.md`, `INFORME.md` |
| `diseno/rediseno-panel-2211` | 14 | Rediseño visual de todo el panel (`diseno.css`, `ui/diseno.tsx`, `textos/pantalla.ts`) | `docs/rediseno-2211/ENTREGA.md` |
| `main` (al día) | 2 | Solo `cerebro/` y la skill `memoria` | — |

Las tres ramas salieron de `f798717`, antes de los commits de seguridad de `main`. Ninguna toca `cerebro/`, `.claude/` ni `tests/unitarias/acceso-y-webhooks.test.ts`: esos archivos quedan **idénticos a `main`** (comprobado con `git diff origin/main HEAD -- cerebro .claude tests/unitarias/acceso-y-webhooks.test.ts`, vacío). No vuelve nada de `cerebro/15-hallazgos-21-11.md` ni el número de ejemplo viejo. El botón Archivar del 19/11 (`claude/pensive-galileo-d6ephy`) **no** está incluido.

## 2. Conflictos y cómo se resolvieron

| Archivo | Choque | Resolución |
| --- | --- | --- |
| `src/lib/salud/index.ts` | Importaciones: operación suma `resumenPresupuesto`; captación suma acceso real de líneas y retenidos por perfil | Se quedan las dos. El resto del archivo se juntó solo y se revisó a mano: Salud lee el gasto de IA, el hueco del latido, los retenidos por perfil y el acceso real de Meta a la vez |
| `src/components/inicio/tablero-hoy.tsx` | Captación cambió la lógica del chip de campaña (estado único con avance y fallidos de 24 h) y sumó los motivos de paro; diseño cambió el estilo (Bento, ChipEstado, colas) y el texto del motivo de pausa | **Lógica de captación, estilo de diseño.** El texto «ad»/«domingo» del rediseño se llevó a la definición única (`definiciones/campanas.ts` usa `motivoPausaLegible`) |

Sin conflicto de texto pero con dos intenciones sobre Salud: `salud/reglas.ts` y `por-perfil.ts` suman a la vez los controles por perfil (retenidos, acceso de líneas) y los globales (gasto del mes, atraso del latido). Se comprobó que el gasto del mes se ve en los cuatro perfiles y el tope del día solo en el suyo.

## 3. Cambios propios de la integración

1. **Tope diario de Gemini solo como aviso** (pedido de Dirección). `ConfigPresupuesto.frenoDiario` (por defecto `false`): el tope diario por perfil mide y avisa (Salud y dispositivos) pero **no corta al bot**, porque los precios por token son estimados y sin verificar. El tope del **mes (USD 30) sigue frenando**. Se enciende con `system_settings.presupuesto_gemini = {"frenoDiario": true}`. Textos de Salud y del aviso dicen «Es solo un aviso: el bot sigue respondiendo». Pruebas en `presupuesto-gemini-2211.test.ts`.
2. **Hoy sin chip del bot ni «También hoy»** (orden del 19/11). Se dejaron de leer en Hoy las métricas del perfil (`getProfileMetrics`), «Citas próximas» y «Derivados sin resultado» (siguen en Resultados y en Chats). Se pierde el atajo «El bot se trabó» que vivía en ese bloque (la lista sigue con `?grupo=bot_trabado`).
3. **Plurales sin «(s)»** en todo lo que arma `src/lib/salud*` y el gasto de IA, con `cantidad()` de `textos/pantalla.ts`.
4. Arreglos de la revisión (sección 4).

## 4. Revisión con ojos frescos

En esta sesión **no estaban disponibles** los agentes `agent-protocols:code-reviewer`, `agent-protocols:security-auditor`, `backend-design:schema-reviewer` ni el de accesibilidad (no hay herramienta para lanzar subagentes). La revisión se hizo a mano con esos cuatro enfoques sobre todo lo que cambian las tres ramas, y las migraciones se corrieron dos veces seguidas en un Postgres 16 local con tablas mínimas (y un `cron`/`vault`/`net` simulados para 0639).

| # | Hallazgo | Gravedad | Qué se hizo |
| --- | --- | --- | --- |
| R1 | `quarantineWebhook` inserta `rubro_id`; si el código se publica **antes** de 0637, el insert falla y el mensaje retenido no se guarda (queda solo en el registro de Vercel) | Grave (mensaje entrante perdido) | Corregido: si la base no tiene la columna, se guarda sin ella (`insertarRetenido`). Prueba en `integracion-2211.test.ts` |
| R2 | `push/suscripcion` validaba el perfil con `in`: «toString» o «constructor» pasaban como perfil | Menor (ruta con sesión) | Corregido con `rubroDePerfilPedido` (solo claves propias). Prueba |
| R3 | 0638 elegía la restricción a reemplazar con `ilike '%uso%'`: frágil si otra restricción contiene «uso» | Menor | Corregido: palabra completa (`~* '\muso\M'`). Probado repetible |
| R4 | 0639: `cron.schedule` solo actualiza el job del mismo usuario; aplicada con otro usuario, crearía un **segundo latido** por minuto | Media | Corregido: si el job vigente es de otro usuario, no lo toca y avisa. Probado con cron simulado |
| R5 | `MIGRACIONES.md`: la comprobación «sin secreto escrito» (`not like '%Bearer %'`) da siempre falso con el comando nuevo (`'Bearer ' \|\|` desde Vault) | Menor (falsa alarma) | Corregido en el documento |
| R6 | Accesibilidad: la cifra de cada cola de Hoy tenía `aria-label` en un `<p>`, que los lectores no anuncian | Menor | Corregido: cifra oculta al lector y frase «N personas en la lista» |
| R7 | Mensaje dos veces con el tope del mes: el bot manda el cierre de reserva y pasa el chat a una persona (`consulta_fuera_alcance` pausa la IA en ese chat), así que el siguiente mensaje de esa persona no dispara otro cierre | Revisado, sin cambio | — |
| R8 | Recontacto: si el **envío** se pasa de 15 s, queda en «error» y no se reintenta (el envío pudo salir): no hay doble mensaje; si falla el **modelo**, se libera hasta 2 intentos (solo costo, no mensaje) | Revisado, sin cambio | — |
| R9 | Campañas en paralelo: una campaña que se pasa de 30 s sigue corriendo en segundo plano con su bloqueo (120 s); una reserva cortada con marca de inicio va a revisión y no se reenvía (`campaign_recover_stale`): sin doble envío | Revisado, sin cambio | Riesgo de tiempos en sección 7 |
| R10 | Consultas sin filtro de perfil: las nuevas filtran por `rubro_id` o áreas del perfil (retenidos, fallas, cifras, Hoy, líneas, avisos). Lo global a propósito: gasto del mes, latido, pausa general | Revisado | — |
| R11 | Migraciones: 0637 y 0638 repetibles (dos corridas sin error), sin borrados de datos, RLS heredada, `gasto_gemini_resumen` sin permiso para `anon`/`authenticated` (comprobado) | Revisado | — |
| R12 | Secretos y datos personales: sin claves, tokens, teléfonos ni nombres reales en el código, pruebas o documentos nuevos. 0639 tiene la URL pública del panel (no es secreta) y lee el secreto de Vault | Revisado | — |
| R13 | Antes de 0637, `/incidencias` (vista Retenidos) y la cuenta de retenidos en Fallas filtran por `rubro_id` sin respaldo: muestran vacío / cero hasta aplicar 0637 (Salud sí tiene respaldo) | Media | Sin cambio: se resuelve aplicando 0637 **antes** de publicar (orden abajo) |
| R14 | Antes de 0638, los turnos de recontacto (`uso = 'recontacto'`) no se registran (el registro nunca interrumpe) y el gasto queda por debajo | Menor | Sin cambio: aplicar 0638 antes de publicar |
| R15 | Accesibilidad del rediseño: foco visible, «reducir movimiento» respetado (revelados, luces, contador), luces siempre con texto, contador que no pisa el valor real, 44 px táctiles, enlaces de Salud con la cifra en su nombre | Revisado, sin graves | Lector de pantalla y zoom 200 % no probados |

## 5. Verificación (sobre `HEAD` de la rama)

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | sin errores |
| `npx tsc -p tests/tsconfig.json --noEmit` | sin errores |
| Lint | `npm run lint` no carga en la copia aislada (toma el `.eslintrc.json` de la carpeta de arriba); `npx eslint --no-eslintrc -c .eslintrc.json --ext .ts,.tsx src`: sin hallazgos |
| `npm run build` | compila (mismo aviso del `.eslintrc` de arriba) |
| Pruebas unitarias | **692 de 692** en verde. Una corrida temprana (antes de los cambios de integración) dio 679/680 y no se repitió en 6 corridas más: posible prueba sensible a la hora, a vigilar |
| Migraciones 0637–0639 | dos corridas seguidas en Postgres 16 local, sin errores; 0639 con `cron`/`vault`/`net` simulados (sin secreto, con secreto, job de otro usuario) |

## 6. Orden exacto para publicar

1. **Vault** (a mano, una vez, quien administra; el valor es el `CRON_SECRET` de Vercel, no se escribe en archivos ni chat): `select vault.create_secret('<CRON_SECRET>', 'crm_cron_secret', 'Secreto del latido');`
2. **0637** `0637_captacion_y_cifras_por_rubro.sql` (columnas `rubro_id` en retenidos y dispositivos, `evidence_message_id` en captaciones).
3. **0638** `0638_gasto_gemini_tope.sql` (uso «recontacto», índice, función del gasto).
4. **0639** `0639_latido_pg_cron.sql`, **como el mismo usuario dueño del job actual** (normalmente `postgres`). Si emite un `NOTICE` de que falta algo, no tocó nada.
5. Publicar la rama (merge a `main`).
6. (Opcional) `presupuesto_gemini` en `system_settings` solo si se quieren valores distintos; sin fila rigen los de fábrica (`frenoDiario: false`).

Las migraciones van **antes** del código (R13, R14). Si hubiera que publicar primero, el panel no se rompe (los respaldos de R1, Salud, avisos y captación lo cubren), pero Retenidos se ve vacío hasta aplicar 0637.

## 7. Qué comprobar en producción después de publicar

1. Latido: `select count(*) from cron.job where jobname = 'campaigns-tick'` = **1**; `command like '%vault.decrypted_secrets%'`; a los 2 minutos `system_settings.ultimo_latido` avanza y `cron.job_run_details` en `succeeded`. Si el panel responde 401, el secreto de Vault no coincide con `CRON_SECRET`.
2. Salud: latido en verde; «Gasto de IA del mes» con una cifra razonable; ningún perfil con «tope diario» que corte (debe decir «solo un aviso»).
3. `select * from gasto_gemini_resumen(...)` devuelve filas por rubro; un turno de recontacto deja una fila con `uso = 'recontacto'`.
4. Retenidos: cada perfil ve solo los suyos; Jurídico además los «sin perfil». Un retenido nuevo llega con `rubro_id`.
5. Hoy en los 4 perfiles: sin chip del bot, sin «También hoy», chip de campaña con avance real; Perfiles sin «En vivo».
6. Tiempo de la etapa «campañas» en Salud (no debería pasar de ~30 s) y que la etapa «rescate» siga corriendo.
7. Un bot que responde un entrante en cada perfil (con la Preview hay efectos reales: probar con un número propio).

## 8. Riesgos que quedan

- **Precios por token sin verificar**: el gasto es una estimación; el freno del mes podría actuar antes o después de los USD 30 reales. Cargar la tarifa real en `presupuesto_gemini`.
- **Usos de IA fuera de `agent_turn_logs`** (asistente, Laboratorio, informes de mejora, transcripción de audios) no cuentan para el tope.
- **Tiempos del latido**: las campañas pueden ocupar hasta ~30 s (más si hay más de 5 líneas); el rescate de turnos perdidos solo corre si el latido va por debajo de 20 s. No es peor que antes (las campañas iban en serie), pero conviene mirarlo.
- Un **turno de tope del mes** queda con `error = 'tope_gasto_mes…'` y cuenta en «Fallas del bot» de 24 h de ese perfil.
- **Rediseño sin recorrer con sesión real** (solo réplica local), sin lector de pantalla ni zoom 200 %.
- La revisión fue a mano: no hubo segunda opinión de los agentes pedidos ni de otro modelo.
- Una prueba unitaria falló una vez sin repetirse.
