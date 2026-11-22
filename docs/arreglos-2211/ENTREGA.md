# Arreglos 22/11 · captación, cifras y separación por rubro

Rama `arreglos/captacion-y-cifras-2211` (desde `main`). Solo lógica, consultas y textos que son resultado de la lógica: no se tocaron estilos. Nada se aplicó en producción: no hay envíos, campañas ni datos tocados. La migración `0637` está escrita y **sin aplicar**.

## Qué incluye

| # | Arreglo | Estado | Dónde |
|---|---|---|---|
| 1 | Contacto 2 a las 72 h, conflicto y cierre del seguimiento | hecho | `src/lib/contacto/reglas.ts`, `src/lib/opportunities.ts` |
| 2 | Retenidos por perfil, Penal solo en Jurídico, avisos por rubro | hecho (con migración) | `src/lib/definiciones/{retenidos,lineas,avisos}.ts`, `src/lib/push.ts`, `src/app/incidencias/page.tsx` |
| 3 | Evidencia de captación con el id del mensaje real | hecho (con migración) | `src/lib/captacion/evidencia.ts`, `src/lib/ai-agent/agent.ts` |
| 4 | Una definición por cifra | hecho | `src/lib/definiciones/{cifras,campanas}.ts` |
| 5 | «Hoy» dice por qué está parado el perfil | hecho | `src/lib/definiciones/parado.ts`, `src/components/inicio/tablero-hoy.tsx` |
| 6 | Salud: acceso de las líneas, Wasender, retenidos | hecho | `src/lib/salud/*`, `src/lib/definiciones/ritmo.ts` |
| 7 | Estados contradictorios en el detalle del chat | parcial | `src/lib/definiciones/estado-chat.ts` |
| 8 | Etiqueta de gravedad y prioridad por perfil | propuesto (lógica lista, sin conectar) | `src/lib/bases/gravedad.ts` |

## Migración

`supabase/migrations/0637_captacion_y_cifras_por_rubro.sql`: aditiva y repetible, sin borrados ni cambios de datos. Agrega `webhook_quarantine.rubro_id`, `capture_events.evidence_message_id` y `push_subscriptions.rubro_id`. Aplicarla **antes** de publicar: la pantalla de Revisión pide la columna `rubro_id` (Salud y los avisos tienen un camino de reserva si falta). Reversión en el encabezado del archivo.

## Decisiones que quedan para el dueño

1. **Retenidos sin perfil** (anteriores a la migración o de una línea sin asignar): se ven solo en Jurídico, rotulados «Sin perfil asignado». Los 5 que hoy aparecen en los cuatro paneles quedan en Jurídico.
2. **Dispositivos con avisos**: los ya registrados no tienen perfil y siguen recibiendo todo (para no perder avisos urgentes). Los nuevos guardan el perfil desde el que se activan. Para separar los viejos hay que reactivarlos desde cada perfil.
3. **Gravedad por perfil** (ítem 8): la etiqueta y la prioridad por perfil están hechas y probadas pero no conectadas a la creación de campañas. Decidir si se activa (afectaría solo campañas nuevas de Coberturas, Autos y Marketing, que pasarían a prioridad normal).
4. **Captación por presupuesto, aprobación de Marketing y contacto del profesional**: ahora también exigen el mensaje real de una persona (no un contestador ni un rechazo). Si falta, la captación no se registra y queda en el log.
5. **Detalle de chat** (ítem 7): se decidió qué estado se muestra y se aplicó a la ficha y a las listas; el encabezado del chat sigue mostrando el estado del contacto (ver INFORME).

## Datos de producción

Solo se leyó con `SELECT` el conteo de oportunidades y contactos de Jurídico (7.852 = 7.852). No se copió ningún dato personal.
