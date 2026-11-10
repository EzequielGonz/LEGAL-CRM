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

## `0601_wasender_plantillas_origen`

Aplicada el 10/11/2026. Antes se comprobó que las columnas no existían y que la tabla estaba vacía.

**Qué agrega** a `wasender_plantillas`:
- **`origen`:** `panel` o `meta`.
- **`meta_nombre`:** nombre de la plantilla de Meta de la que se copió.
- **Dos índices únicos:**
  - una plantilla de Meta se copia una sola vez por perfil;
  - dos plantillas activas del mismo perfil no comparten nombre.

Solo agrega. Se puede repetir sin error. Las plantillas de Meta se leen y no se modifican.

## `0602_wasender_campanas`

Aplicada el 10/11/2026. Figura como `20261110183838`. Antes se comprobó que las columnas no existían y que la última migración era la `0601`.

**Qué agrega** (solo agrega, se puede repetir sin error):
- **En `campaigns`:**
  - `proveedor`: `meta` por defecto, o `wasender`;
  - `wasender_line_id`;
  - `wasender_plantilla_id`.
  Las 16 campañas existentes quedaron en `meta`, sin cambios.
- **En `wasender_lineas`:** `limite_diario`, de 1 a 1000 o vacío.

**Cómo revertir:** no se borra nada. Sin campañas de Wasender, las columnas quedan vacías y el motor sigue igual para Meta.

## `0603_wasender_equivalencias`

Aplicada el 10/11/2026. Figura como `20261110235642`. Antes se comprobó que las columnas no existían y que la última migración era la `0602`.

**Qué agrega** en `wasender_lineas` (solo agrega, se puede repetir sin error):
- **`reemplaza_linea_meta_id` y `reemplaza_desde`:** qué línea de Meta reemplaza y desde cuándo.
- **`para_avisos`:** si los avisos internos del perfil salen por esta línea.
- **Dos índices únicos:**
  - una línea de Meta la reemplaza una sola línea de Wasender activa;
  - hay una sola línea de avisos por perfil.

Al aplicarla, ninguna línea tenía equivalencia: todo sigue saliendo como antes.

**Cómo revertir:** quitar la equivalencia desde la pantalla. La línea de Meta nunca se modificó.
