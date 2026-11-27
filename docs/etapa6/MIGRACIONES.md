# Etapa 6 · Reparto de números de migración (27/11)

Fase 0. Se reserva el reparto **antes** de abrir las copias de trabajo para que ninguna tanda pise a otra. La última migración que existe en `integracion/rediseno-2211` es la **0650** (`0650_cerebro_conocimiento.sql`); la carpeta salta de 0640 a 0650.

## Rangos reservados

| Tanda | Rango | Qué lleva |
|---|---|---|
| Oficina | 0651-0653 | alcance, `grupo_id`, `rubro_id` nullable, ejecutor, repaso, `resultado_gemini`, uso `'oficina'` en `agent_turn_logs` |
| Captados | 0654-0656 | revocar captado con motivo, vista `captados_vista` |
| Cerebro | 0657-0659 | `cerebro_fragmentos` (texto completo y trigramas, vector opcional), `cerebro_pendientes`, uso `'cerebro'` en `agent_turn_logs` |
| Plantillas y línea única | 0660-0662 | `'reapertura'` en el CHECK de propósitos, `messages.template_id`, plantilla preferida (índice único parcial), Penal archivado y `line_id` de Civil en las conversaciones sin línea |
| Jarvis | 0663-0664 | `origen`, `nivel`, `confirmado_con` y `pedido_literal` en `asistente_acciones`, registro de acciones |
| Bots | 0665 | solo si hace falta: `ai_agents` de Penal `active=false` con motivo |
| Chats y ficha | 0666-0667 | columnas de origen del Excel (marca de origen de la base), lo que pida la reapertura desde el chat |
| Recordatorios | 0668 | recordatorios por contacto (visibles en Hoy) |
| Libres | 0669 en adelante | sin dueño; antes de usarlas, anotar acá quién las toma |

Los números **0641-0649** quedan sin usar a propósito (no reutilizarlos).

## Reglas para cada migración

1. Repetible: `if not exists` o bloque `do $$`, y se puede correr dos veces sin error.
2. Con RLS activado y **sin permisos** para `anon` ni `authenticated` (el panel entra con la clave de servicio).
3. **Sin `DELETE` ni `DROP` de datos**: lo que sale de la vista se archiva con motivo.
4. Con `set lock_timeout = '5s';` al principio y un comentario que diga qué hace y cómo se revierte.
5. Rubros separados: toda tabla nueva con datos de personas o de trabajo lleva `rubro_id` (salvo lo que es del panel entero, que se marca así).
6. **Nadie aplica nada a la base desde su copia**: producción y Preview comparten base. Las aplica la integración, en orden, y se comprueba después con una consulta de agregados.

## Antes de aplicar

Volver a correr `ls supabase/migrations`: la sesión de redes también puede sumar números. Si aparece uno dentro de un rango reservado que no es de esta tabla, se renumera el de redes, no el reservado.

## Reversión

Cada archivo documenta la suya en el encabezado. Como ninguna borra datos, revertir es sacar la columna, la restricción o la función nueva; los datos cargados con ellas se conservan en una copia antes de quitar nada.
