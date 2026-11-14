# Entrega del 14/11

Rama `claude/relaxed-cerf-5oncz1`, publicada en `main` (producción: legal-crm-nine.vercel.app).

Pedido de la responsable (14/11): algoritmo de inicio de conversación por Wasender sin patrón repetitivo, «que se mande al azar todo», de lunes a sábado sin días de descanso; más plantillas y bastantes más variantes para bases frías en cada perfil; más velocidad sin tocar nada estético ni funcional; mejorar el bot v2 a partir de los chats, solo sumando. Meta no se toca.

## Qué incluye

1. **Ritmo humano de Wasender** (`src/lib/wasender/ritmo-humano.ts`, solo Wasender):
   - Tandas de largo variable (entre la mitad y 1,6 veces lo elegido) y pausas entre tandas de largo variable (60 % a 200 %, a veces más).
   - **Plan del día por línea**, distinto cada día: hora de arranque entre 6 y 100 minutos después de abrir el horario (nunca en punto), hora de cierre entre 8 y 85 minutos antes; tres de cada cuatro días, una pausa al mediodía (35 a 95 minutos, entre las 12:10 y las 14:20); a veces una o dos pausas cortas a cualquier hora; un día más ágil y otro más tranquilo; la cantidad del día entre el 72 % y el 100 % del límite (sábados, 55 % a 85 %). Sin días de descanso: lunes a sábado.
   - **Texto al azar en cada envío**: plantilla y variante al azar, sin repetir las últimas 3 plantillas de la línea ni un texto parecido a los últimos 40 enviados.
   - **Aviso de variantes casi iguales** en la pantalla de plantillas.
   - El segundo intento por Wasender respeta el mismo plan del día.
2. **Plantillas de inicio para bases frías**: 12 nuevas por perfil (48 en total), con 38 a 60 textos cada una, armadas con estructuras distintas y filtradas para que se diferencien de verdad. Por perfil quedan 22 plantillas y entre 1.090 y 1.133 textos (antes, 10 y 413). Generador en `plantillas-frias.mjs`.
3. **Velocidad**:
   - Los enlaces de listas (fichas, chats, campañas, filtros, paginadores) ya no se precargan solos: cada pantalla disparaba decenas de pedidos al servidor y a la base que competían con la carga. El menú y el selector de perfil se siguen precargando.
   - La marca y el menú se leen en paralelo.
   - `profile_metrics` hace una sola pasada: el mismo resultado, unas tres veces más rápido.
4. **Bot v2** (solo altas): 12 fichas nuevas por rubro, ocho señales nuevas de contestador automático, y ya no pide «escribilo en texto» ante stickers ni mensajes no compatibles. Detalle en `BOT-V2-1411.md`.

## Qué no se tocó

- Nada de Meta (plantillas, campañas, envío, ritmo).
- Ninguna plantilla ni ficha existente se editó ni se borró.
- Ninguna campaña se lanzó ni se reanudó. Publicar no habilita envíos.

## Qué queda habilitado

- Las plantillas nuevas están activas y entran en la rotación de las campañas de Wasender que tengan «rotar plantillas de inicio».
- Las fichas nuevas están activas en los cuatro perfiles.
- El ritmo humano rige para toda campaña de Wasender en cuanto haya una línea conectada y la campaña esté en curso. Hoy no hay ninguna línea conectada.
