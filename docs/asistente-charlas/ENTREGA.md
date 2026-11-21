# Charlas guardadas del asistente · entrega (20/11)

Pedido de la Bandeja para Claude: «que las charlas del asistente IA queden guardadas y se puedan retomar». La responsable sumó el Laboratorio y pidió no tocar ninguna función existente.

## Qué incluye (todo agregado; nada existente cambia de comportamiento)

- **Guardado automático**: después de cada respuesta del asistente se guarda el pedido y la respuesta. La primera vez se crea la charla (título = primer pedido). Si falla el guardado, aparece un aviso chico y el chat sigue igual.
- **Al abrir el asistente con el chat vacío**: «Charlas anteriores» con las 5 últimas y «Ver todas». Tocar una la abre completa y se sigue donde quedó (el asistente recibe toda la conversación anterior).
- **Botón «Charlas anteriores»** arriba del chat: lista completa (hasta 30), la abierta marcada, «Quitar» con segundo toque de confirmación (se archiva, no se borra) y «Volver a la charla».
- **Laboratorio del bot**: lo mismo, con una lista aparte por perfil; al cambiar de perfil empieza una charla nueva (no se mezclan).
- **Propuestas**: al abrir una charla, cada propuesta muestra su estado actual (confirmada, descartada, en curso). El servidor sigue controlando el nivel de confirmación al confirmar.
- «Nueva charla» hace lo mismo que antes y además empieza una charla guardada nueva.

No se guardan imágenes, PDF ni filas de planillas. Al retomar una charla con planillas, hay que volver a adjuntarlas si se quiere seguir trabajando con ellas.

## Archivos

- `supabase/migrations/0634_asistente_charlas.sql` (tablas, funciones `asistente_charla_crear` y `asistente_charla_agregar`, sin borrados).
- `src/lib/asistente/charlas.ts` (reglas puras) y `charlas-servidor.ts` (datos).
- `src/app/api/asistente/charlas/route.ts` y `[id]/route.ts` (con `requireSession`).
- `src/components/asistente/charlas-anteriores.tsx` (nuevo) y agregados en `chat-asistente-general.tsx` (dos líneas existentes reemplazadas por equivalentes: la respuesta se arma en una variable para poder guardarla, y la lista del chat se oculta mientras se ve «Charlas anteriores»).
- `tests/unitarias/asistente-charlas.test.ts`.

## Guía para el programador

1. La migración 0634 ya está aplicada en la base real (20/11).
2. Fusionar el PR → Vercel publica. Probar: /asistente → escribir algo → recargar → aparece en «Charlas anteriores» → abrirla y seguir. En Perfiles → Laboratorio, lo mismo por perfil.
3. Supresión de datos de una charla (si alguien lo pide): ver el comentario en la migración (se reemplaza el texto; no se borran filas).
