# Jarvis, el secretario del panel · entrega (22/11/2026)

Rama: `diseno/jarvis-2211`, partida de `origin/main`. No toca `main`. Sin migración de base: no hay `MIGRACIONES.md` porque no cambia ninguna tabla ni función.

## Qué incluye

**Presencia en todo el panel**
- Un orbe flotante abajo a la derecha (en el celular queda por encima de la barra inferior) que abre una hoja lateral. Atajo Ctrl/Cmd+J.
- Se monta una sola vez, en `src/components/perfiles/marco-perfil.tsx`, el marco que envuelve las pantallas. No se tocó la navegación.
- Reemplaza al panel del asistente en ese marco. Los botones «Preguntale al asistente» que ya existían abren Jarvis. La página `/asistente` sigue en «Más» y el componente viejo no se borró.
- La charla se recuerda al cambiar de pantalla (en el navegador, por perfil).

**Sabe dónde estás**
- Recibe la ruta y el perfil, y ofrece 3 sugerencias de un toque según la pantalla (Chats, Campañas, Salud y 15 más).
- Cada rubro va separado: si la ruta dice un perfil distinto del que manda el navegador, el servidor rechaza el pedido.

**Parte del día**
- Saludo («Buen día.», sin nombre), 2 o 3 frases, 3 anillos (captados hoy, chats esperando, tareas para tu OK) y hasta 3 cosas «para decidir».
- Se arma con datos de la base, sin gastar tokens. Gemini solo redacta las frases si hay presupuesto y se valida lo que devuelve. Una vez por día, cerrable.

**Hace cosas**
- Lleva a la pantalla correcta, busca y resume chats, deja borradores de respuesta (tarjeta con «Copiar», sin enviar), crea tareas en la Bandeja o la Oficina, muestra el estado de las líneas y explica una cifra.
- Todo lo que cambia algo lleva la tarjeta «¿Lo hago?» (Sí / No). Si puede hacer salir mensajes pide un tilde extra; si gasta o enciende un bot, el código de acceso.
- **Nunca** lanza campañas, publica ni le escribe a nadie. Esas herramientas no las tiene y, si una propuesta de ese tipo se cuela, el servidor la descarta.
- Voz opcional con la Web Speech API del navegador (sin servicios pagos).

**Estética (corrección del dueño, la más nueva)**
- Se sacó el gradient mesh y las esferas de color. Fondo, colores y tipografía son los del panel de siempre: escalas `slate` y `gold` del perfil, Inter Tight, modo claro y oscuro.
- Detalles premium sobrios: sombras suaves en capas, relieve (brillo de borde superior), anillos con relieve, entradas escalonadas y un orbe con un anillo de luz que respira. El vidrio sutil va solo en la hoja de Jarvis.
- Con «reducir movimiento» no hay ninguna animación.

## Archivos

Nuevos:
- `src/lib/jarvis/`: `pantallas.ts`, `parte.ts`, `seguridad.ts`, `prompt.ts`, `herramientas.ts`, `servidor.ts`.
- `src/app/api/jarvis/mensaje/route.ts` y `src/app/api/jarvis/parte/route.ts`. Las dos piden sesión (`requireSession`), validan el perfil y están en `FUERA_DEL_CATALOGO`.
- `src/components/jarvis/`: `jarvis.tsx`, `jv-parte.tsx`, `jv-anillo.tsx`, `jv-confirmar.tsx`, `almacen.ts`, `jarvis.css`.
- `tests/unitarias/jarvis-pantallas.test.ts`, `jarvis-parte.test.ts`, `jarvis-seguridad.test.ts`.
- `docs/jarvis-2211/ENTREGA.md` e `INFORME.md`.

Tocados:
- `src/components/perfiles/marco-perfil.tsx`: monta Jarvis.
- `src/lib/asistente/motor.ts`: agrega `conversarConJarvis` y un parámetro opcional de uso en el bucle.
- `src/lib/asistente/catalogo.ts`: las dos rutas en `FUERA_DEL_CATALOGO`.
- `src/components/asistente/asistente-panel.tsx`: solo exporta `EVENTO_ASISTENTE` y `textoResultado`.

## Gasto y seguridad

- Antes de llamar a Gemini se mira el tope de gasto (USD 30 al mes). Con tope, Jarvis no piensa y lo dice.
- El gasto queda en `agent_turn_logs` (uso `analisis`), como el resto de la IA del panel.
- El texto de la persona viaja como mensaje de usuario. En las instrucciones del sistema solo entran la ruta saneada y el nombre del perfil.
- Sin datos de prospectos en registros ni pruebas.

## Cómo revertir

Es código sin migración: revertir el commit, o restaurar en `marco-perfil.tsx` el `AsistentePanel` en lugar de `Jarvis`. «Instant Rollback» en Vercel si ya se publicó.
