# Charlas guardadas del asistente · migraciones (20/11)

| Archivo | Qué hace | Estado |
| --- | --- | --- |
| `0634_asistente_charlas.sql` | Dos tablas nuevas: `asistente_charlas` (título, lista general o Laboratorio de un perfil, archivada) y `asistente_charla_mensajes` (rol, texto, propuestas como se mostraron, botones). Función `asistente_charla_agregar` (agrega mensajes y pone la charla al día en un paso). Disparadores que impiden borrar. RLS activo, sin permisos para la clave pública; la función solo para la clave de servicio. | Ver INFORME.md |

## Comprobación previa (20/11, sobre la base real, dentro de una transacción revertida)

Migración corrida dos veces seguidas sin error, y después: agregar 2 mensajes → `true`, 2 filas; borrar → bloqueado; charla «general» con perfil → rechazada; rol inválido → rechazado; agregar a una charla archivada → `false`, sin filas; permisos de `anon`/`authenticated` sobre las tablas → ninguno; `anon` puede ejecutar la función → no; `service_role` → sí. Al final se revirtió todo: las tablas no quedaron creadas (`to_regclass` vacío).

## Volver atrás

No hace falta tocar la base: el panel anterior no usa estas tablas. No se borran (regla del proyecto).
