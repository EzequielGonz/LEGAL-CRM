# Migraciones del 13/11

## 0606_seguimiento_automatico_y_rotacion — APLICADA el 13/11

Archivo: `supabase/migrations/0606_seguimiento_automatico_y_rotacion.sql`. Repetible sin error. No borra nada.

- `rubros.followup_enabled_since` con valor por defecto `now()` (un perfil nuevo nace con el seguimiento encendido).
- `wasender_plantillas.grupo` (`inicio` o nulo), con su restricción y un índice parcial.
- `campaigns.wasender_rotar_inicio` (falso por defecto: las campañas existentes no cambian).

Para revertir: `alter table rubros alter column followup_enabled_since drop default;` y dejar de usar las dos columnas (no hace falta quitarlas).

## Cambios de datos (registrados en `ops_change_log`)

| Registro | Qué | Cómo deshacerlo |
|----------|-----|-----------------|
| 172 | Seguimiento encendido en los cuatro perfiles (`followup_enabled_since = 2026-11-12 11:00 UTC`), segundo intento desde el 13/11 y cuatro plantillas `…_segundo_intento` activadas | Contactos → Seguimiento → Ajustes del seguimiento → apagar; o `update rubros set followup_enabled_since = null, segundo_intento_desde = null` |
| `conocimiento_v2_altas` | 14 fichas nuevas en `bot_knowledge_items` (versión 2, `fuente = 'mejora 13/11'`) | Bot IA → Conocimiento → desactivar la ficha; o `update bot_knowledge_items set activo = false where fuente = 'mejora 13/11'` |
| `wasender_crear_plantilla` / `wasender_editar_plantilla` (40) | 13 plantillas de inicio nuevas y 27 existentes con variantes sumadas, todas con `grupo = 'inicio'` | Archivar la plantilla desde la pantalla, o quitarle la marca «Plantilla de inicio» |
| `prueba_ficha_devolver_al_bot` | Prueba con un caso viejo; quedó como estaba | — |

## Migraciones de la corrida del 13/11 a la noche — APLICADAS

Antes de aplicar se comprobó el historial de la base: la última era `0611_asistente_operaciones_y_menu`. Las tres son repetibles y no borran nada.

| Migración | Qué hace | Cómo revertir |
|---|---|---|
| `0612_embudo_etapas` | Función de lectura `embudo_etapa`: personas que conversaron, oportunidades reales y ventas de un período | `drop function public.embudo_etapa(text, uuid, text[], timestamptz, timestamptz, text[]);` (el embudo muestra «—» en esas tres etapas) |
| `0613_hallazgos_de_rutas` | Función `reemplazar_disponibilidad` (los horarios de la agenda se cambian en una sola operación y los anteriores quedan inactivos); estado `cancelada` en las búsquedas de negocios; `notification_phones.archived_at` y `archived_reason` | Volver a la versión anterior de las rutas. Las columnas y el estado nuevo no molestan si quedan |
| `0614_embudo_por_dia` | Función de lectura `embudo_por_dia`: contactados, personas que respondieron y captados por día | `drop function public.embudo_por_dia(uuid, text[], timestamptz, timestamptz);` (el gráfico deja de mostrarse) |
