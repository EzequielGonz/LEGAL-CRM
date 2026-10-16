# Etapa 2 · Migraciones

| Archivo | Bloque | Qué hace | Estado (13/10) |
| --- | --- | --- | --- |
| `0200_etapa2_calendario.sql` | 2.0 | Tabla `contact_calendar_exceptions`: día cerrado u horario más corto, siempre dentro de 8 a 21; una excepción vigente por día; se archiva con motivo y no se borra. RLS activo y acceso solo con la clave de servicio | Sin aplicar en producción |
| `0201_etapa2_seguimiento.sql` | 2.3 | En `rubros`, espera del seguimiento (60 h, entre 48 y 72) y fecha de activación (vacía = apagado). Propósito de plantilla `seguimiento_3` y evento de acceso `seguimiento_automatico`. En `opportunities`, marca de agotamiento y base de repesca. Tabla `followup_tasks` con funciones de reserva atómica (`followup_claim`), compuerta en la base antes de enviar (`followup_gate`), cierre con la reserva vigente (`followup_finish`), devolución sin contar el intento (`followup_release`), recuperación de ejecuciones cortadas (`followup_recover_stale`) y lista paginada de candidatas (`followup_candidates`). Todo solo para la clave de servicio; nada se borra | Sin aplicar en producción |

## Cambios de la 0201 en la corrección del 13/10

- `followup_gate` exige que la línea de la tarea sea del perfil, del área de la conversación, esté activa y sea la misma de la conversación cuando esta tiene una; y que conversación, contacto y oportunidad sean los de la tarea. Si no, responde `linea_incompatible` o `datos_incompatibles` y no se envía.
- `followup_release` (nueva) devuelve una tarea reservada sin contar el intento y sin dejar la marca de envío iniciado.
- `followup_candidates` cambia de parámetros: `(p_limit, p_now, p_after_at, p_after_id)`. Solo devuelve interrupciones posteriores a la activación, de las últimas 72 horas y no escritas por una persona del equipo, más las oportunidades que ya están en el circuito; excluye las interrupciones cuya tarea se descartó o falló, y se recorre por páginas. La versión anterior `followup_candidates(integer)` se elimina al aplicar.

**Si ya se aplicó la 0201 anterior en algún lado**, se corre esta igual: las columnas y la tabla ya existentes se saltean (`if not exists`), las funciones se reemplazan y no se toca ninguna fila. En producción no hace falta: al 13/10 no existe ninguna de las dos tablas.

## Orden

`0199` (si falta) → `select public.etapa1_reconciliar_posteriores();` → `0200` → `0201`. 0200 y 0201 no dependen de 0199: cada tabla nueva quita por sí misma el acceso de la clave pública.

## Comprobaciones del 13/10

- **Orden de producción ensayado sobre una copia de producción sin 0200 ni 0201:** 0199, reconciliación, 0200 y 0201 corregida, sin errores. Después: 0 políticas abiertas y 0 tablas con permisos para la clave pública; las dos tablas nuevas con RLS; las seis funciones de seguimiento sin permiso para la clave pública; 0 perfiles activos, 0 tareas y 0 candidatas; «BASE 21 9» pausada con 725 en cola y 200 enviados; pausa general activa.
- **Actualización sobre la versión anterior:** la 0201 corregida se aplicó dos veces sobre bases que tenían la 0201 del 12/10 (la copia de ensayo y la copia restaurada), sin errores; quedan las seis funciones nuevas y ninguna versión vieja.
- **Se pueden repetir:** 0200 y 0201 aplicadas dos veces seguidas, sin errores.
- **Compatibles con la versión publicada:** `fb5cdc3` pasa sus 39 pruebas de integración sobre una base con 0200 y la 0201 corregida.
- **Reversión probada:** `revertir_0200_0201.sql` se detiene si hay datos de la Etapa 2; sin datos, quita todo, y después 0200 y 0201 se vuelven a aplicar sin errores.
- **Desde cero en el entorno aislado de Vercel:** la base de pruebas se armó con todas las migraciones, de 0100 a 0201, sobre PostgreSQL 18.6, sin errores, y la API de pruebas (PostgREST 12.2.3) las tomó sin problemas.

Ninguna migración envía mensajes, activa tareas ni cambia filas existentes salvo agregar la espera inicial de 60 horas a cada perfil.
