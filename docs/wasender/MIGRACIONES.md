# Wasender · migraciones

## `0600_wasender`

Aplicada el 10/11/2026 en la base real del panel. Figura en el historial como `20261110134520 0600_wasender`.

**Antes de aplicarla se comprobó:**
- que existe `public.prevent_hard_delete`;
- que el tipo `area_type` tiene las cinco áreas;
- que existen las columnas de toma del chat;
- que no había ninguna tabla ni columna de Wasender.

**Qué agrega** (solo agrega, sin `drop` ni borrados):
- **Tablas nuevas:** `wasender_lineas`, `wasender_plantillas` y `wasender_eventos`. Todas tienen:
  - RLS sin permisos para `anon` ni `authenticated`;
  - disparador que impide borrar.
- **Columnas opcionales en `conversations`:** `wasender_line_id` y `wasender_toma_automatica_at`. Meta no las usa y quedan vacías en sus chats.
- **Función** `wasender_tocar()`, que mantiene `updated_at` al día.

Se puede repetir sin error: usa `if not exists` y `or replace`.

**Comprobación después de aplicarla** (solo lectura):

```sql
select
  (select string_agg(table_name, ',') from information_schema.tables where table_schema = 'public' and table_name like 'wasender%') as tablas,
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'conversations' and column_name like 'wasender%') as columnas,
  (select count(*) from information_schema.role_table_grants where table_schema = 'public' and table_name like 'wasender%' and grantee in ('anon', 'authenticated')) as permisos_publicos;
```

Resultado del 10/11: 3 tablas con RLS, 2 columnas y 0 permisos públicos.

**Cómo revertir:** no se borra nada.
- Si se descarta Wasender, el código de `main` no usa estas tablas ni columnas, y quedan vacías e inofensivas.
- Las líneas se archivan con motivo desde el panel.
- Para dejar de recibir, se desconectan las sesiones en Wasender.
