# Charlas guardadas del asistente · informe (20/11)

| Parte | Especificado | Implementado | Probado | Publicado | Habilitado |
| --- | --- | --- | --- | --- | --- |
| Base (0634) | sí | sí | sí: en transacción revertida (2 veces seguidas, sin error) y después de aplicarla (crear, agregar, otra lista rechazada, nulos, permisos) | aplicada en la base real | sí (solo la usa el panel nuevo) |
| Reglas y API | sí | sí | unitarias 9/9 | ver PR | — |
| Pantalla (asistente y Laboratorio) | sí | sí | sintaxis comprobada; tipos y build los corre Vercel; sin recorrido navegando en esta sesión | ver PR | — |

- Revisión de seguridad por un agente aparte: sin críticos. Se corrigieron: creación en una sola transacción, control de lista al agregar, topes de tamaño (cuerpo, propuestas, enlaces, 500 mensajes por charla), nulos, `security invoker` explícito, enlaces a `/api/` excluidos, estado y tipo de las propuestas refrescados desde la base. Pendiente decidir: deduplicar un reintento perdido de guardado (poco probable) y bloquear TRUNCATE (igual que el resto del repo).
- Asesor de seguridad de Supabase: sin avisos nuevos (solo el aviso informativo «RLS sin políticas», igual que todas las tablas: el acceso es solo con la clave de servicio).
- No se pudo correr `npm ci` en la sesión (red de paquetes cerrada): tipos, lint y build quedan a cargo de Vercel en el PR.
