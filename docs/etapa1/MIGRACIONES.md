# Etapa 1 — Detalle de migraciones

Todas son aditivas salvo `0199` (cierre de la clave pública), que se aplica después de publicar la versión nueva.
Las pruebas de integración aplican todas, en orden, sobre la estructura previa a la Etapa 1 (ver `tests/README.md`).
Orden de aplicación: por número. Cada una se probó antes en una copia restaurada del respaldo.

| Archivo | Bloque | Qué hace | Producción |
|---|---|---|---|
| `0100_etapa1_preparacion.sql` | 1.0 | Respaldo dentro de la base (`respaldo_etapa1` + función de huella), registro operativo de solo agregar (`ops_change_log`), `system_settings` con la pausa general, historial de prompts de solo lectura, agentes en pausa y tarea programada inactiva | Aplicada 9/10 |
| `0101_etapa1_acceso_y_seguridad.sql` | 1.1 | PIN (hash), límites por origen (5 fallos → 15 min), registro de accesos, mensajes retenidos, tipo de mensaje, deduplicación (índice único + duplicado histórico marcado) y función para encender/apagar la tarea programada desde la pausa general | Aplicada 10/10 |
| `0102_etapa1_estados_de_entrega.sql` | 1.3 | Estado de entrega y lectura en mensajes + historial de eventos de estado | Aplicada 10/10 |
| `0103_etapa1_modelo_oportunidades_detencion.sql` | 1.2–1.3 | Normalización de teléfono, detenciones, oportunidades, historial con autor, incidencias, límite del formulario público | Aplicada 10/10 |
| `0104_etapa1_reconciliacion_5_1.sql` | 1.3 | Reconciliación 5.1 (una sola vez, idempotente) + función de reconciliación posterior | Aplicada 10/10 00:55 UTC |
| `0105_etapa1_disparadores_oportunidad.sql` | 1.3 | La base mantiene al día la oportunidad con cada contacto y mensaje nuevo | Aplicada 10/10 |
| `0106_etapa1_archivar.sql` | P. 20 | Archivado de bases y campañas, motivo de pausa, bloqueo de borrado de bases, campañas y perfiles | Aplicada 10/10 |
| `0107_etapa1_perfiles_y_lineas.sql` | 1.4 | Nombre del perfil o marca y nombre de presentación del agente (vacíos hasta cargarlos a mano), líneas por perfil (`profile_lines`) con su asignación a agente y campañas, línea y días de ejecución en campañas, línea en conversaciones | Aplicada 10/10 |
| `0108_etapa1_detenidos_en_lote.sql` | 1.2 | Consulta en lote de detenidos por contacto y por teléfono (campañas e importación) | Aplicada 10/10 |
| `0109_etapa1_metricas.sql` | 1.5 | `profile_metrics`: un solo cálculo de cifras por perfil, con numerador y denominador | Aplicada 10/10 |
| `0110_etapa1_inbox.sql` | 1.5 | Último mensaje de cada conversación en una consulta + índice por conversación y fecha (Inbox paginado) | Aplicada 10/10 |
| `0111_etapa1_importacion_y_calidad.sql` | 1.6 | Huella del archivo (protección contra doble importación), resumen de la carga, marcas por fila (contactado anteriormente, detención, conflicto), calidad de la respuesta y `base_quality` | Aplicada 10/10 |
| `0112_etapa1_coincidencias_y_cifras_de_campana.sql` | 1.6, 1.8 | Tipo de coincidencia por fila y detalle del contacto anterior (fecha, campaña, línea), índice por contacto, `contacts_last_outbound` y `campaign_metrics` (cifras de campaña iguales en PC y teléfono) | Aplicada 10/10 |
| `0113_etapa1_avisos_web.sql` | 1.9 | Dispositivos con avisos web (`push_subscriptions`) e historial por aviso y dispositivo (`push_deliveries`, con clave única por evento para no duplicar); solo la clave de servicio accede; no se borran | Aplicada 10/10 |
| `0114_etapa1_catalogo_de_plantillas.sql` | 1.8, P. 22 y 39 | Catálogo de plantillas leído de Meta (`whatsapp_templates`, con estado real, idioma, variables y fecha en que dejó de figurar), historial de lecturas (`whatsapp_template_syncs`), asignación por perfil, línea y propósito (`template_assignments`), plantilla del catálogo en campañas (`campaigns.template_id`; el nombre escrito antes queda como referencia y deja de ser obligatorio), uso histórico por nombre (`template_name_usage`) y campañas nuevas desde las 8 (horario general de lunes a sábado de 8 a 21). Solo la clave de servicio accede; nada se borra | Aplicada 10/10 |
| `0115_etapa1_estados_de_envio.sql` | Revisión 10/10, punto 2 | Dos estados nuevos del destinatario de campaña: `enviando` (reservado por una sola ejecución) y `revisar` (no se sabe si Meta aceptó el mensaje; no se reenvía solo). Va sola porque un valor nuevo de un tipo enumerado no se puede usar en la misma transacción en que se agrega | Aplicada 11/10 |
| `0116_etapa1_envios_seguros.sql` | Revisión 10/10, puntos 2, 3 y 5 | Campañas: bloqueo por campaña con vencimiento, reserva atómica del destinatario (`FOR UPDATE SKIP LOCKED`), marca de inicio antes de llamar a Meta, cierre solo con la reserva vigente, recuperación de ejecuciones cortadas (sin marca → vuelve a la cola; con marca → a revisar) y decisión de revisión con confirmación para los inciertos. Conversaciones: compuerta de la IA en la base (pausa general con la misma regla que el código y chat tomado por una persona), toma del chat antes del envío manual y permiso de un solo uso para el acuse final. `campaign_metrics` informa aparte "en envío" y "a revisar" | Aplicada 11/10 |
| `0117_etapa1_adjuntos_originales.sql` | P. 24 (alcance acotado) | `message_attachments` (cada original vinculado a mensaje, conversación, ficha y perfil; estado, huella SHA-256, tamaño, plazo de descarga), reserva de un solo proceso por adjunto, bucket privado `adjuntos-originales` (tope 50 MB, sin acceso público). Solo la clave de servicio accede; no se borra | Aplicada 11/10 |
| `0199_etapa1_cierre_rls.sql` | 1.1 | Quita las políticas abiertas y los permisos de la clave pública | **Pendiente: después de publicar** |

## Después de publicar la versión nueva

1. Confirmar que el despliegue terminó bien y que se puede ingresar con el PIN.
2. Aplicar `0199_etapa1_cierre_rls.sql` (la clave pública deja de leer y escribir tablas).
3. Ejecutar `select public.etapa1_reconciliar_posteriores();` para crear lo que falte por mensajes entrantes posteriores a la migración (deja una incidencia por cada uno; hasta el 10/10 no entró ninguno).

## Comprobaciones de 0115, 0116 y 0117 (11/10)

- **Desde cero, como en las pruebas reproducibles**: sobre la estructura de producción previa a la Etapa 1 (sin datos) se aplicaron 0100 → 0117 y 0199 en orden, sin errores (`tests/integracion/preparar_base.sh`). Las 39 pruebas de integración corren sobre esa base.
- **Sobre la copia restaurada**: 0115 a 0117 aplicadas; "BASE 21 9" sigue con 925 destinatarios, 725 en cola, 200 enviados y 10 personas que responden.
- **En producción**: 0115 sola y después 0116 y 0117. Las 15 funciones nuevas o reemplazadas tienen la misma huella (md5 de su definición) que en la base de pruebas armada con los archivos del repositorio. La tabla de adjuntos tiene RLS, sin acceso para la clave pública, y no se puede borrar; el bucket es privado con tope de 50 MB. Estado después de aplicar: pausa general activa (IA y envíos), 0 agentes activos, tarea programada inactiva, "BASE 21 9" pausada con 725 en cola, 0 destinatarios en envío o a revisar, 1.818 mensajes (sin cambios).
- **Compatibilidad con la versión publicada hoy** (7c721bf): solo agregan columnas, valores, funciones, una tabla y un bucket; esa versión no los usa y sigue funcionando igual. Las funciones nuevas se pueden volver a aplicar sin efectos (`create or replace`, `if not exists`).

## Comprobaciones hechas en la copia restaurada

- 0100 a 0114 se aplicaron primero sobre la copia y después en producción, con el mismo resultado. 0114 se aplicó dos veces sobre la copia sin errores (se puede repetir).
- 0114 en producción: 3 tablas con acceso solo para la clave de servicio (la clave pública no lee nada), 4 disparadores (3 impiden borrar y 1 controla que la línea sea del perfil), "BASE 21 9" sin cambios (pausada, 725 en cola, su plantilla escrita queda como referencia) y uso histórico de `estudio_juridico_vita` igual a una consulta directa (1.610 envíos, el último el 5/10).
- Las funciones nuevas se compararon con consultas directas: `profile_metrics` (4.266 oportunidades y contactos, 70 respondieron, 55 detenidos, 1.707 mensajes enviados) y `campaign_metrics` ("BASE 21 9": 925 destinatarios, 725 en cola, 200 enviados, 10 personas que responden) coinciden con producción.
- Ninguna migración envía mensajes. Cambios sobre filas que ya existían: 0100 (agentes y tarea programada en pausa, con registro en `ops_change_log`) y 0101 (marca del único mensaje duplicado histórico). 0104 solo agregó oportunidades, detenciones e incidencias: las columnas originales quedaron idénticas al respaldo.
