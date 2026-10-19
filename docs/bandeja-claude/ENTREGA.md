# Bandeja para Claude · entrega 19/10/2026

Pedido de la responsable (19/10). Rama `bandeja-claude`. Migración `0502_bandeja_claude`.

## Qué incluye

- **Menú (todos los perfiles):** abajo de la barra izquierda, justo arriba de «Pedile algo», la tarjeta negra «Bandeja para Claude». Muestra cuántas tareas hay abiertas y, si alguna quedó en espera, un punto ámbar y «N en espera».
- **Pantalla `/bandeja?perfil=<slug>`:** formulario (perfil, pedido de hasta 4000 caracteres, hasta 5 enlaces de referencia) y lista con estados: en espera (arriba, con aviso y motivo), en curso, pendientes; listas y descartadas plegadas. Se puede descartar con motivo lo pendiente o en espera. Nada se borra.
- **Sin datos personales de prospectos:** el pedido, los enlaces y el motivo rechazan correos, teléfonos y documentos (fechas, rangos de años y precios pasan). Enlaces solo `https://`, sin enlaces de WhatsApp a personas ni credenciales.
- **«En espera» aunque Claude no llegue a escribir:** una tarea «en curso» sin avance por más de 6 h se muestra «en espera» (por ejemplo, si se agotó el uso del plan).
- **API:** `GET/POST /api/bandeja-claude` (con `?resumen=1` para el menú) y `PATCH /api/bandeja-claude/[id]` (`accion: "descartar"`, con actualización condicional). Todas con `requireSession` y la clave de servicio.
- **Procedimiento de Claude:** `.claude/referencias/bandeja-claude.md` (qué hacer cuando la responsable dice «ok», con las consultas exactas y los límites). Enlazado desde `CLAUDE.md`.

## Qué no hace

- Claude no corre dentro del panel ni hay tarea programada: guardar una tarea no ejecuta nada. El asistente del panel sigue en Gemini.
- No envía, no publica, no gasta y no toca las pausas vigentes. Lo que cambie el panel o el código vuelve como PR o propuesta para confirmar.

## Archivos

- `supabase/migrations/0502_bandeja_claude.sql`
- `src/lib/bandeja-claude.ts` (reglas puras) · `tests/unitarias/bandeja-claude.test.ts`
- `src/app/api/bandeja-claude/route.ts` · `src/app/api/bandeja-claude/[id]/route.ts`
- `src/app/bandeja/page.tsx` · `src/components/bandeja/bandeja-claude.tsx`
- `src/components/menu-perfil.tsx` (entrada del menú, con su ícono)
- `.claude/referencias/bandeja-claude.md` · `CLAUDE.md`
