# Cerebro del negocio dentro del panel (21/11)

Pedido de los dueños: el cerebro de Claude como pantalla del panel, con el mismo diseño, que lea el panel y que se conecte con Claude por una bandeja.

## Qué incluye

- **`/cerebro`** dentro del marco del panel (mismo menú, tema por perfil, tipografía y barra de salud). Secciones:
  - **Lo que veo hoy en el panel**: lecturas que el cerebro saca solo de las cifras vivas de la semana (perfil sin enviar, captados sin derivar, chats que piden una persona, caída de respuestas), más la salud del sistema en vivo, los últimos pedidos a Claude y el resumen de la semana del asistente.
  - Alertas, preguntas abiertas para los dueños.
  - **Hablale a Claude**: pedido a la Bandeja para Claude (misma tabla y validaciones), con la foto de la semana adjunta (solo cifras).
  - **Asistente del panel** (el mismo «Pedile algo» general) y **Laboratorio de bots** (el mismo de Perfiles).
  - Lo que entiende del negocio, pendientes, propuestas y lo que corrigió.
- Acceso **arriba de todo en Perfiles** y una tarjeta en el menú lateral, arriba de la Bandeja.
- Contenido en `src/lib/cerebro/contenido.ts` (texto, sin datos de personas ni claves), con pruebas en `tests/unitarias/cerebro-contenido.test.ts`.
- `asistente/charlas` y `asistente/charlas/[id]` quedan registradas fuera del catálogo del asistente (la prueba del catálogo fallaba desde el 20/11).

## Qué no hace

- No cambia nada del panel: solo lee. El único botón que escribe es «Mandar a Claude», que crea una tarea en la bandeja.
- Sin migraciones ni variables nuevas.

## Probado

- `npm run typecheck`, `npm run lint`, `npm run build` y las 592 pruebas unitarias.

## Cómo revertir

Revertir el commit: no hay cambios en la base.
