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
