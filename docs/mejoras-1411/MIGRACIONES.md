# Migraciones del 14/11

Antes de aplicar se comprobó el historial de la base: la última era `0614_embudo_por_dia` (y `0616` antes de la segunda vuelta). Todas son repetibles y no borran ni cambian datos.

| Migración | Qué hace | Cómo revertir |
|---|---|---|
| `0615_ritmo_humano_wasender` | Índice parcial `messages_wasender_linea_inicio_idx` para leer rápido los últimos primeros mensajes de cada línea de Wasender | `drop index if exists public.messages_wasender_linea_inicio_idx;` (la elección del texto sigue funcionando, un poco más lenta) |
| `0617_informes_mejora_bot` (segunda vuelta) | Tabla `bot_informes_mejora` para los informes de la IA sobre las conversaciones. RLS activado, sin permisos para la clave pública | La tabla no se usa sola: alcanza con no generar informes. No se borra (regla del proyecto) |
| `0618_informes_mejora_en_segundo_plano` | Suma el estado `procesando` al informe (se completa en segundo plano) | Volver a la restricción `estado in ('listo','error')` cuando no haya filas `procesando` |
| `0616_profile_metrics_una_pasada` | `profile_metrics` reescrita en una sola pasada. Antes y después se comparó el resultado de los cuatro perfiles (huella md5 del JSON sin `calculado_en`): idéntico | Volver a crear la función con el texto de `0109_etapa1_metricas.sql` |

## Cambios de datos (registrados en `ops_change_log`)

| Registro | Qué | Cómo deshacerlo |
|---|---|---|
| `wasender_crear_plantilla` (48) | 12 plantillas de inicio nuevas por perfil (`…_fria_…`, `grupo = 'inicio'`, activas) | Archivar la plantilla desde Líneas y plantillas → Plantillas de Wasender, con motivo |
| 290 · `conocimiento_v2_altas_1411` | 12 fichas nuevas en `bot_knowledge_items` (versión 2, `fuente = 'mejora 14/11'`) | Bot IA → Conocimiento → desactivar; o `update bot_knowledge_items set activo = false where fuente = 'mejora 14/11'` |
| 291 · `conocimiento_ajuste_1411` (segunda vuelta) | 4 fichas del 14/11 alineadas con la ficha del negocio y las instrucciones de los agentes (todas las marcas, usado como parte de pago, guía de packs) | Volver al texto de `before` del registro 291 |
| 292 · `wasender_campana_a_rotacion` | La campaña pausada de Wasender con plantilla fija pasa a rotación al azar. No se lanzó ni se reanudó | `wasender_rotar_inicio = false` y la plantilla de `before` |
| 293 · `wasender_archivar_plantillas` | 40 plantillas de inicio viejas archivadas con motivo | `archivada_at = null`, `activa = true` en los id de `before` |
| `bot_informes_mejora` | Informes de prueba de los cuatro perfiles generados en producción (solo lectura de conversaciones; no se aplicó ninguna propuesta) | Quedan como historial |
