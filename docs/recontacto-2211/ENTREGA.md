# Recontacto de las 72 h por plantilla y gravedad en campañas · 22/11

Rama `captacion/recontacto-plantillas-y-gravedad` (desde `main`). Estado: **especificado, implementado y probado con pruebas unitarias; no publicado ni habilitado.** La migración `0640` está escrita y **sin aplicar**. No se mandó ningún mensaje, no se lanzó, pausó ni reprogramó ninguna campaña y no se escribió en la base de producción (solo `SELECT`, sin copiar datos personales).

Pedidos del dueño (22/11, textual):

- A) «el segundo contacto a las 72 h… acá el límite es Meta, es relanzar una campaña de recontacto automático con plantillas de Meta, mientras se migre a Wasender y no cierre ventas de conversación; mientras tanto hacelo desde plantillas y automático.»
- B) «esa etiqueta de gravedad se conecte a las campañas, de una forma en la que los mensajes que primero envíe y se centre más sea en esos lesionados.»

## A · Recontacto de las 72 h por plantilla de Meta

### Cómo salía antes

El contacto 2 del seguimiento (`src/lib/seguimiento/motor.ts`) ya salía por Meta con la plantilla del propósito «seguimiento» de la línea, sin mirar la ventana de 24 h, el límite diario de la línea, su calidad ni el freno. Por Wasender sale con texto del bot (ahí no hay ventana). El arreglo de la tolerancia de 3 h (`docs/arreglos-2211`) es lo que hizo que el contacto 2 empezara a salir (2 enviados al 21/11).

### Qué cambia

En el contacto 2 de una conversación de Meta, con el perfil encendido:

| Situación | Qué pasa |
| --- | --- |
| Ventana de 24 h abierta (la persona escribió hace menos de 24 h) | Como antes |
| Ventana cerrada (lo normal a las 48–72 h) | Sale la plantilla **aprobada** del propósito nuevo «Recontacto» de la línea |
| El perfil no tiene plantilla de recontacto | **No sale nada**: la tarea queda pendiente con el motivo |
| Ya recibió un recontacto por plantilla en los **últimos 30 días** (mismo teléfono normalizado, mismo perfil) | No sale; la tarea se cancela con motivo y **la oportunidad NO pasa a «caído»** (revisión 22/11). Una vez por oportunidad lo garantiza el índice único; una por teléfono cada 30 días, la reserva con candado |
| Pidió no recibir (detención o baja vigente) | No sale; se cancela. Si la detención no se pudo leer, no sale y queda pendiente |
| Domingo, antes de las 8 o desde las 21, o día cerrado del calendario | Espera la franja válida |
| Línea con calidad baja en Meta, calidad **imposible de leer**, freno de entrega de la línea, límite diario de la línea o tope diario del perfil (`max_dia`, 40 por defecto) alcanzado | No sale; queda pendiente y corre su hora 45 min (ver «Revisión independiente») |
| Tope de 3 automáticos sin respuesta, compuerta (chat tomado, captado, perdido, respondió) | Igual que antes |

- Solo reabre la charla: la plantilla no vende ni cierra nada. Si la persona responde, sigue el bot como hoy.
- El contacto 3 sigue exactamente como estaba.
- El límite diario de la línea suma los primeros mensajes de campaña del día y los recontactos por plantilla. Además rige un tope por perfil (`max_dia`, día en hora argentina), aunque la línea no tenga límite diario.
- **Wasender**: punto de extensión en el motor (`via: "wasender"` en la configuración del perfil). Hoy deja la tarea pendiente con el motivo; cuando el perfil se pase a Wasender, ese es el lugar para mandar el recontacto por `processTaskWasender`. No está implementado.
- Con el perfil apagado (o sin la clave), el contacto 2 sale exactamente como antes.

Archivos: `src/lib/seguimiento/recontacto-plantilla.ts` (reglas puras), `src/lib/seguimiento/recontacto-plantilla-servidor.ts` (lecturas), `src/lib/seguimiento/motor.ts` (conexión), `src/lib/plantillas/catalogo.ts` (propósito «Recontacto», asignable desde Plantillas como los demás).

### Plantillas encontradas por perfil (lectura de la base, 22/11)

Todas las líneas de Meta tienen aprobada la plantilla del contacto 2. Son adecuadas para el recontacto: cortas, en rioplatense, sin precios y con el botón «No me escriban más». La migración las asigna también al propósito «Recontacto» (misma plantilla, mismas variables).

| Perfil | Línea | Plantilla que queda para recontacto | Botones | Observación |
| --- | --- | --- | --- | --- |
| Jurídico | Civil | `jur_seguimiento_2` | Sí, sigamos · Ahora no · No me escriban más | Lista |
| Coberturas | Coberturas médicas | `cob_seguimiento_2` | Dale · Ahora no · No me escriban más | Lista |
| Autos 0 km | Agencia 0 km | `autos_seguimiento_2` | Dale · Ahora no · No me escriban más | **La línea tiene calidad baja en Meta desde el 26/10: no va a salir nada hasta que mejore** |
| Marketing | Marketing | `mkt_seguimiento_2` | Dale · Ahora no · No me escriban más | La línea de Meta de Marketing sigue sin vincular (pendiente del dueño): no sale hasta que esté. La variable va con el nombre del contacto («retomo lo que conversamos sobre {{1}}»), que en Marketing suele ser el nombre del negocio |

No falta ninguna. Igual se dejan propuestas por si se quiere una plantilla propia de recontacto, distinta del contacto 2 (categoría Marketing, idioma `es_AR`, variable `{{1}}` = nombre del contacto). Están también en `TEXTO_PROPUESTO` del código.

| Perfil | Nombre sugerido | Cuerpo | Botones |
| --- | --- | --- | --- |
| Jurídico | `jur_recontacto_72h` | Hola {{1}}, te escribo de nuevo por tu consulta. Si querés, la retomamos para que el estudio la revise sin costo. Si preferís que no te escribamos más, tocá «No me escriban más». | Sí, retomemos · Ahora no · No me escriban más |
| Coberturas | `cob_recontacto_72h` | Hola {{1}}, te escribo de nuevo por tu cobertura. Si querés, lo retomamos y un asesor te compara opciones sin compromiso. Si preferís que no te escribamos más, tocá «No me escriban más». | Sí, retomemos · Ahora no · No me escriban más |
| Autos 0 km | `autos_recontacto_72h` | Hola {{1}}, te escribo de nuevo por el 0 km. Si querés, lo retomamos y un vendedor te cuenta opciones según lo que buscás. Si preferís que no te escribamos más, tocá «No me escriban más». | Sí, retomemos · Ahora no · No me escriban más |
| Marketing | `mkt_recontacto_72h` | Hola {{1}}, te escribo de nuevo por la propuesta para tu negocio. Si te sirve, la retomamos y el equipo te la prepara. Si preferís que no te escribamos más, tocá «No me escriban más». | Sí, retomemos · Ahora no · No me escriban más |

Si se cargan en Meta y se aprueban: en Plantillas, asignarlas a la línea con el propósito «Recontacto» y desactivar la asignación anterior de ese propósito.

## B · Gravedad en las campañas de Jurídico

- Al armar la cola de una campaña de Jurídico (desde una base, una selección o «agregar base»), cada destinatario entra con la prioridad de su gravedad, en este orden: **fallecimiento, amputación, fractura, otras lesiones de cuidado** (luxación, quemadura, traumatismo, herida, desgarro, etc.), **lesiones leves** (contusión, esguince, lo «superficial» y cualquier otro diagnóstico) y, al final, **sin lesión anotada**. La gravedad sale del diagnóstico de cada fila, no del nombre de la base.
- La cola ya salía por prioridad y después por orden de carga (`campaign_claim_next`): mientras haya lesionados pendientes, el cupo del día se va en ellos, primero los más graves; cubiertos los lesionados, sigue el resto. Nadie queda afuera.
- Lo que falta enviar se reordena **al lanzar o reanudar** una campaña de Jurídico (lo aprieta el dueño): solo cambia la prioridad de los pendientes. Lo enviado, lo que se está enviando y lo que está a revisar no se toca: nunca hay reenvío ni duplicado. Si el reordenamiento falla, la campaña sale con el orden que tenía.
- Coberturas, Autos y Marketing quedan exactamente igual.
- Compatibilidad: antes la prioridad era 0 (grave) o 1 (normal). Los valores nuevos (−3 a 3) dejan el 0 viejo detrás de los graves nuevos y delante de cualquier no grave; el 1 viejo queda junto a «otra lesión» hasta que se reordena.
- Hoy las colas pendientes de Jurídico (dos campañas pausadas, 192 por Meta y 1.147 por Wasender) están todas en 1: se reordenan recién cuando el dueño las reanude.

Archivos: `src/lib/bases/gravedad.ts` (niveles, orden, cupo y cambios: puros), `src/lib/campaign-recipients.ts` (cola y reordenamiento), `src/lib/campaigns.ts` (al lanzar), `src/app/api/campaigns/route.ts` y `plan/route.ts` (área de la campaña para la selección manual).

## Migración `0640_recontacto_plantilla_meta.sql`

Aditiva y repetible, dentro de `begin; … commit;` (probada dos veces seguidas en un Postgres 16 local vacío con las tablas mínimas, incluida la sustitución del índice de la versión anterior): sin borrados de datos ni cambios de filas existentes, sin permisos nuevos (las tablas ya tienen RLS y sin acceso para la clave pública; la función solo la ejecuta la clave de servicio).

1. Propósito «recontacto» en `template_assignments`.
2. `followup_tasks.canal` y `followup_tasks.telefono_clave` (teléfono normalizado); índice único **por oportunidad** (`followup_tasks_recontacto_por_oportunidad`, reemplaza al perpetuo por persona) e índices para el conteo por teléfono y por día.
3. Función `followup_recontacto_reservar`: candado (advisory lock) por rubro y teléfono; dentro del candado comprueba la ventana de 30 días y el tope diario del rubro, y deja la marca. Devuelve `ok`, `ya_recibio`, `tope_dia` o `reserva_perdida`.
4. Asigna a «recontacto» la plantilla aprobada del contacto 2 de cada línea activa (solo si está aprobada y no tiene ya una).
5. Crea la clave `recontacto_plantilla_meta` con **solo Jurídico encendido**; Coberturas, Autos 0 km y Marketing con `activo: false`; `max_dia: 40` en cada perfil (si ya existe, no la toca).

Sin la migración, el código publicado se comporta como antes (la clave no existe = apagado; si la función no existe, el recontacto queda pendiente y no sale). Reversión: en el encabezado del archivo.

## Cómo se enciende y se apaga

- **Encender**: aplicar la migración `0640`. Queda encendido **solo Jurídico** (por Meta, 40 por día).
- **Encender otro perfil** (sin borrar nada):
  ```sql
  update public.system_settings
     set value = jsonb_set(value, '{coberturas_medicas,activo}', 'true'::jsonb), updated_at = now()
   where key = 'recontacto_plantilla_meta';
  ```
  (`false` para apagar; perfiles: `juridico`, `coberturas_medicas`, `agencia_0km`, `marketing`). Apagado, el contacto 2 sale como antes.
- **Cambiar el tope diario del perfil**: `'{juridico,max_dia}'` a `25`, por ejemplo.
- **Pasarlo a Wasender** cuando esté conectado: `'{juridico,via}'` a `"wasender"` (hoy deja pendiente: falta implementar el envío).
- **Cambiar la plantilla**: Plantillas → línea → propósito «Recontacto».
- **Gravedad**: no tiene llave; aplica a las colas nuevas de Jurídico y a lo pendiente al lanzar o reanudar.

## Revisión independiente (22/11): qué se corrigió

1. **Tareas pendientes que trababan el motor.** `runDueFollowups` ahora lee primero las `programada` y con lo que sobra las `pendiente` (una pendiente nunca ocupa el lugar de una programada). Toda salida del recontacto que deja la tarea pendiente (calidad baja o ilegible, tope diario, sin plantilla, lectura fallida, Wasender, fuera de horario, error de reserva) corre `scheduled_at` a ahora + 45 min, con tope en la base + 75 h (`proximoIntento`).
2. **Gravedad en las campañas.** El reordenamiento mira las mismas fuentes con que se encola (la fila de la base y `qualification_data` del contacto) y vale la más grave; nunca baja una fila que ya estaba en prioridad ≤ 0 (solo puede subir); si falla una lectura aborta sin tocar nada; escribe de a 150 ids (`ID_CHUNK`). Sigue leyendo y escribiendo solo `pendiente`: no reenvía nada.
3. **Una vez por oportunidad y una por teléfono cada 30 días** (decisión del director). Ya recibió dentro de 30 días: tarea cancelada con motivo, oportunidad sin pasar a «caído» (se limpia el próximo contacto programado; si no responde, la cierra el motor de caídos como siempre). Índice único por oportunidad; la ventana se aplica en código y dentro de la función de reserva.
4. **Mismo teléfono en dos contactos o con/sin el «9».** La persona es el teléfono normalizado (`normalizePhoneAR`, `claveTelefono`), guardado en `telefono_clave` de la tarea; la reserva usa un candado por teléfono, así dos latidos simultáneos no mandan a la misma persona (probado con dos sesiones: la segunda esperó el commit de la primera y recibió `ya_recibio`).
5. **Tope diario por perfil**: `max_dia` en la clave `recontacto_plantilla_meta` (40 por defecto), contado por día argentino, con o sin límite diario de la línea; se vuelve a comprobar dentro del candado.
6. **Migración 0640** en `begin; … commit;`, solo Jurídico encendido.
7. **Menores**: si no se puede leer la calidad de la línea (error, sin registro, sin dato o lectura de más de 3 h) no se envía; en el choque de la reserva la tarea se cancela y la oportunidad queda sin `followup_next_at` colgado; en gravedad «sin lesiones/sin lesión» no cuenta como leve y «rotura/ruptura» solo cuenta si habla de una parte del cuerpo.

Pruebas nuevas: `tests/unitarias/recontacto-2211-revision.test.ts` (una por arreglo; lo que toca la base se verifica sobre el código y la migración).

## Riesgos y decisiones pendientes

1. **Encendido al aplicar la migración**: queda activo solo en Jurídico. Los otros tres se encienden con el `update` de arriba cuando el dueño lo decida.
2. **Autos 0 km no va a recontactar** mientras la línea tenga calidad baja (además, hoy está apagado). **Marketing** tampoco, hasta vincular su línea de Meta (también apagado).
3. **Límite diario**: si la línea llega a su tope, el recontacto queda pendiente; si al día siguiente ya pasó el plazo de 72 h (más la tolerancia de 3 h), queda en conflicto y no sale (no se amplía el plazo).
4. **Costo**: cada recontacto por plantilla es un mensaje de marketing que Meta cobra (fuera de los 1.000 de servicio gratis). No se pagó ni se cambió nada de facturación; el volumen está acotado a una vez por persona y al límite diario de la línea.
5. **Una vez por oportunidad y una por teléfono cada 30 días** (decisión del director, 22/11). El contacto 3 sigue como estaba. Si el mismo teléfono tiene tareas viejas sin `telefono_clave` (anteriores a la 0640), no cuentan para la ventana: hoy no hay ninguna, porque la migración no se aplicó.
6. **Las 12 tareas trabadas en «conflicto» de Jurídico** (y 1 de Coberturas) no se tocaron: es dato de producción y espera decisión (Reintentar o Descartar desde Seguimiento).
7. **Freno en Meta**: se usa el freno de entrega de siempre (muchos fallidos o sin entregar en los últimos envíos de campaña de la línea). El freno por respuesta (<1 %) es de campañas y no aplica al recontacto.

## Verificaciones

Sobre la revisión del 22/11 (commit de esta rama):

- `npm ci`, `npm run typecheck` y `npx tsc -p tests/tsconfig.json --noEmit`: en verde.
- Pruebas unitarias (`tsx --test tests/unitarias/*.test.ts`): 734 de 734 en verde (37 de `recontacto-2211-*`, 15 nuevas).
- `npm run build`: en este entorno falla al bajar las tipografías de Google (sin salida a `fonts.googleapis.com`, ajeno al cambio); con `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` apuntando a un mock de las fuentes, el build termina bien.
- Migración `0640` en un Postgres 16 local (vacío, tablas mínimas y el índice viejo de la versión anterior): dos corridas seguidas sin error; el índice perpetuo se reemplaza; la función devuelve `ok`, `ya_recibio` (mismo teléfono, otra oportunidad; dentro de 30 días), `ok` (a los 31 días y en otro rubro), `tope_dia`, `reserva_perdida` y `ya_recibio` por la misma oportunidad; `anon` no puede ejecutarla; con dos sesiones simultáneas la segunda espera el candado y recibe `ya_recibio`.
- Sin base de producción ni Preview: no se aplicó nada, no se envió nada.

Entrega anterior: eslint con la configuración del proyecto sobre lo tocado (`npm run lint` falla en este entorno por `next/core-web-vitals`) y pruebas `recontacto-2211-plantilla` y `recontacto-2211-gravedad-campanas`. No se corrió `tests/integracion/correr.sh` (necesita base) ni se probó en la Preview (comparte base y líneas con producción).

### Qué no se probó

- El motor contra una base real: las lecturas (`yaRecibioRecontacto`, `recontactosHoyDelRubro`, `calidadDeLinea`, filtros `.or(...)` de PostgREST) y el reordenamiento de campañas se verificaron sobre el código, no contra Supabase. La función de reserva sí se probó en Postgres local, pero sin las tablas reales del esquema completo.
- `tests/integracion/correr.sh` y la Preview (efectos reales).
