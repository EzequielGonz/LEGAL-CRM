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
| Ya recibió el recontacto por plantilla (mismo teléfono, mismo perfil) | No sale; la tarea se cancela. **Nunca dos veces** (también lo garantiza un índice único en la base) |
| Pidió no recibir (detención o baja vigente) | No sale; se cancela. Si la detención no se pudo leer, no sale y queda pendiente |
| Domingo, antes de las 8 o desde las 21, o día cerrado del calendario | Espera la franja válida |
| Línea con calidad baja en Meta, freno de entrega de la línea, o límite diario de la línea alcanzado | No sale; queda pendiente |
| Tope de 3 automáticos sin respuesta, compuerta (chat tomado, captado, perdido, respondió) | Igual que antes |

- Solo reabre la charla: la plantilla no vende ni cierra nada. Si la persona responde, sigue el bot como hoy.
- El contacto 3 sigue exactamente como estaba.
- El límite diario de la línea suma los primeros mensajes de campaña del día y los recontactos por plantilla.
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

Aditiva y repetible (probada dos veces seguidas en un Postgres local vacío con las tablas mínimas): sin borrados ni cambios de filas existentes, sin permisos nuevos (las tablas ya tienen RLS y sin acceso para la clave pública).

1. Propósito «recontacto» en `template_assignments`.
2. `followup_tasks.canal` + índice único «una vez por persona y perfil» + índice para el conteo del día.
3. Asigna a «recontacto» la plantilla aprobada del contacto 2 de cada línea activa (solo si está aprobada y no tiene ya una).
4. Crea la clave `recontacto_plantilla_meta` con los cuatro perfiles encendidos (si ya existe, no la toca).

Sin la migración, el código publicado se comporta como antes (la clave no existe = apagado). Reversión: en el encabezado del archivo.

## Cómo se enciende y se apaga

- **Encender**: aplicar la migración `0640`. Queda encendido en los cuatro perfiles por Meta.
- **Apagar un perfil** (sin borrar nada):
  ```sql
  update public.system_settings
     set value = jsonb_set(value, '{juridico,activo}', 'false'::jsonb), updated_at = now()
   where key = 'recontacto_plantilla_meta';
  ```
  (cambiar `juridico` por `coberturas_medicas`, `agencia_0km` o `marketing`). Apagado, el contacto 2 sale como antes.
- **Pasarlo a Wasender** cuando esté conectado: `'{juridico,via}'` a `"wasender"` (hoy deja pendiente: falta implementar el envío).
- **Cambiar la plantilla**: Plantillas → línea → propósito «Recontacto».
- **Gravedad**: no tiene llave; aplica a las colas nuevas de Jurídico y a lo pendiente al lanzar o reanudar.

## Riesgos y decisiones pendientes

1. **Encendido al aplicar la migración**: queda activo en los cuatro perfiles. Si se prefiere probar primero en uno solo, apagar los otros tres con el `update` de arriba en el mismo momento.
2. **Autos 0 km no va a recontactar** mientras la línea tenga calidad baja. **Marketing** tampoco, hasta vincular su línea de Meta.
3. **Límite diario**: si la línea llega a su tope, el recontacto queda pendiente; si al día siguiente ya pasó el plazo de 72 h (más la tolerancia de 3 h), queda en conflicto y no sale (no se amplía el plazo).
4. **Costo**: cada recontacto por plantilla es un mensaje de marketing que Meta cobra (fuera de los 1.000 de servicio gratis). No se pagó ni se cambió nada de facturación; el volumen está acotado a una vez por persona y al límite diario de la línea.
5. **«Una sola vez por persona»** se aplica al recontacto por plantilla del contacto 2. Si la persona responde y la charla se vuelve a cortar, el contacto 3 sigue como estaba (decisión a confirmar con el dueño).
6. **Las 12 tareas trabadas en «conflicto» de Jurídico** (y 1 de Coberturas) no se tocaron: es dato de producción y espera decisión (Reintentar o Descartar desde Seguimiento).
7. **Freno en Meta**: se usa el freno de entrega de siempre (muchos fallidos o sin entregar en los últimos envíos de campaña de la línea). El freno por respuesta (<1 %) es de campañas y no aplica al recontacto.

## Verificaciones

`npm run typecheck`, `npx tsc -p tests/tsconfig.json --noEmit`, eslint con la configuración del proyecto sobre lo tocado (`npm run lint` falla en este entorno por `next/core-web-vitals`), `npm run build` y las 719 pruebas unitarias: en verde. Pruebas nuevas: `tests/unitarias/recontacto-2211-plantilla.test.ts` (plantilla fuera de 24 h, nunca dos veces, horarios, baja, perfil sin plantilla no envía, calidad, freno, límite diario, Wasender, textos propuestos, migración) y `tests/unitarias/recontacto-2211-gravedad-campanas.test.ts` (niveles, orden por gravedad, otros perfiles sin cambios, cupo, compatibilidad y reordenamiento sin reenvíos). No se corrió `tests/integracion/correr.sh` (necesita base) ni se probó en la Preview (comparte base y líneas con producción).
