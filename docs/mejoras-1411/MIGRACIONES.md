# Migraciones del 14/11

Antes de aplicar se comprobó el historial de la base: la última era `0614_embudo_por_dia`. Las dos son repetibles y no borran ni cambian datos.

| Migración | Qué hace | Cómo revertir |
|---|---|---|
| `0615_ritmo_humano_wasender` | Índice parcial `messages_wasender_linea_inicio_idx` para leer rápido los últimos primeros mensajes de cada línea de Wasender | `drop index if exists public.messages_wasender_linea_inicio_idx;` (la elección del texto sigue funcionando, un poco más lenta) |
| `0616_profile_metrics_una_pasada` | `profile_metrics` reescrita en una sola pasada. Antes y después se comparó el resultado de los cuatro perfiles (huella md5 del JSON sin `calculado_en`): idéntico | Volver a crear la función con el texto de `0109_etapa1_metricas.sql` |

## Cambios de datos (registrados en `ops_change_log`)

| Registro | Qué | Cómo deshacerlo |
|---|---|---|
| `wasender_crear_plantilla` (48) | 12 plantillas de inicio nuevas por perfil (`…_fria_…`, `grupo = 'inicio'`, activas) | Archivar la plantilla desde Líneas y plantillas → Plantillas de Wasender, con motivo |
| 290 · `conocimiento_v2_altas_1411` | 12 fichas nuevas en `bot_knowledge_items` (versión 2, `fuente = 'mejora 14/11'`) | Bot IA → Conocimiento → desactivar; o `update bot_knowledge_items set activo = false where fuente = 'mejora 14/11'` |
