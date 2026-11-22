# Migraciones · recontacto por plantilla y gravedad (22/11)

Una sola: `supabase/migrations/0640_recontacto_plantilla_meta.sql`. **Sin aplicar** (la aplica el dueño).

## Qué hace

Todo en una transacción (`begin; … commit;`), repetible y sin borrados de datos. Sin permisos nuevos: las tablas ya tienen RLS y sin acceso para la clave pública; las funciones nuevas solo las ejecuta `service_role`.

1. Propósito `recontacto` en `template_assignments`.
2. `followup_tasks.canal` y `followup_tasks.telefono_clave`; índice único **por oportunidad** (`followup_tasks_recontacto_por_oportunidad`; reemplaza al perpetuo `followup_tasks_recontacto_una_vez` si una versión anterior lo hubiera creado); índices por teléfono y por línea/día.
3. `followup_recontacto_reservar(...)`: reserva con candado por rubro y teléfono; comprueba la ventana de 30 días y el tope diario del rubro.
4. `recontacto_clave_telefono(text)`: la misma normalización que `normalizePhoneAR` (dígitos; sin 54; sin 9 si quedan más de 10; sin 0 inicial; «11 15…» a «11…»; `549` + dígitos).
5. Relleno: los contactos 2 de Jurídico **enviados en los últimos 30 días** reciben `canal = 'plantilla_recontacto'` y su `telefono_clave`, para que cuenten en la ventana. Solo filas sin marca; no cambia estado, fecha ni mensaje.
6. Asigna a «recontacto» la plantilla aprobada del contacto 2 de cada línea activa.
7. Crea `recontacto_plantilla_meta` en `system_settings`: **solo Jurídico encendido**, `max_dia: 40` en cada perfil. Si la clave existe, no se toca.

## Aplicar

1. Revisar que el despliegue con el código de esta rama esté publicado (sin la migración, el código se comporta como antes: clave inexistente = apagado).
2. Correr el archivo completo en el editor SQL de Supabase (una sola vez; si se corre de nuevo, no cambia nada).
3. Comprobar en la base: `select value from system_settings where key = 'recontacto_plantilla_meta';` y que `template_assignments` tenga el propósito `recontacto` en las líneas con plantilla aprobada.
4. Encender otro perfil, cuando el dueño lo decida: `update public.system_settings set value = jsonb_set(value, '{coberturas_medicas,activo}', 'true'::jsonb), updated_at = now() where key = 'recontacto_plantilla_meta';`

## Revertir

Sin borrar nada (lo que queda no se usa si la clave está apagada):

```sql
update public.system_settings set value = '{}'::jsonb, updated_at = now() where key = 'recontacto_plantilla_meta';
update public.template_assignments set active = false, deactivated_at = now() where purpose = 'recontacto' and active;
```

La columna `canal`, `telefono_clave`, los índices y las funciones pueden quedar. El relleno de la ventana de 30 días solo marca columnas nuevas; si se quisiera deshacer: `update public.followup_tasks set canal = null, telefono_clave = null where canal = 'plantilla_recontacto' and status = 'enviada' and step = 2 and message_id is not null and sent_at < '<fecha de aplicación>';` (los envíos hechos por el recontacto después de la fecha no se tocan).

## Probada

Postgres 16 local vacío con las tablas mínimas: dos corridas seguidas sin error, también partiendo del índice perpetuo de la versión anterior. Ver `INFORME.md`.
