# Mejoras del 12/11 · puntos 1 a 6 · estado y pendientes

Rama: `mejoras-1211` (sale de `main` en `a930706`). **No se publica en producción**: solo la rama y su Preview de Vercel, hasta que la responsable apruebe.

Decisiones de la responsable (12/11):
- La campaña de Wasender se pausa (hecho en la base el 12/11, 9:38).
- Quien nunca respondió **sí** recibe seguimiento por Wasender (cambia la regla 5; con Meta no se podía).
- Todo junto, en una Preview, listo para aprobar.

## Hecho (punto de control 1)

- [x] Campaña «ART - TEST WASENDER» pausada en la base, con motivo.
- [x] Modo prueba ya no apaga la IA con la entrega repetida de Wasender (`entrada.ts`).
- [x] Estados que llegan antes que el eco se vuelven a aplicar al emparejar; el texto de la falla nombra a Wasender (`entrada.ts`).
- [x] Línea caída: las campañas en curso de esa línea se pausan con el motivo, por el aviso de sesión y también en el motor (`entrada.ts`, `campaigns.ts`). No se reanudan solas.
- [x] Interruptores de Wasender: ya no tapan el texto (`lineas-wasender.tsx`).
- [x] Reglas puras del ritmo nuevo con pruebas: calentamiento, variantes mínimas, primer nombre, espera irregular, desfase en el minuto, freno automático (`src/lib/wasender/ritmo.ts`, `tests/unitarias/wasender-ritmo.test.ts`).

## Pendiente (en este orden)

### A. Ritmo nuevo (punto 4) — conectado al motor (punto de control 2)
- [x] Migración `0604_wasender_ritmo.sql` aplicada el 12/11 (solo agrega `wasender_lineas.calentamiento_desde`; producción no la lee).
- [x] Límite del día = menor entre el elegido y el del calentamiento (`cupoDeLinea`). Se muestra en cada línea.
- [x] Plantilla de campaña con 4 textos distintos como mínimo (`faltantesWasender`).
- [x] Saludo con el primer nombre (`textoDeCampana`).
- [x] Espera irregular y desfase de hasta 20 s dentro del minuto (solo Wasender).
- [x] Verificación del número antes de enviar (`GET /on-whatsapp/{número}`; solo corta si Wasender dice `exists: false`). **Sin probar contra la API real**: la respuesta para un número inexistente no está documentada.
- [x] Freno automático con ventana de 12 h (`frenoDeLinea`).
- [x] El calentamiento se reinicia cuando la línea se vuelve a vincular.
- [ ] Mostrar el calentamiento también en el detalle de la campaña.
- [ ] Redactar variantes de las plantillas de campaña de cada perfil (4 textos por plantilla, cortos, sin «Respondé: …»), como plantillas nuevas inactivas para que la responsable las revise. No editar las existentes.
- [ ] Pruebas unitarias de `cupoDeLinea` y `frenoDeLinea` con base falsa.

### B. Verdad en pantalla (puntos 1 a 3)
- [x] Hoy: «Esperan tu respuesta» y «Captados para derivar» (`src/lib/hoy/colas.ts`, `tablero-hoy.tsx`).
- [x] Hoy: chip por línea de Wasender; la campaña no figura enviando si su línea no puede enviar; el puntaje del bot dice qué mide.
- [x] Salud del sistema: un control por línea de Wasender (`src/lib/wasender/salud.ts`). Cierra la tarea #34.
- [ ] Campañas: la calidad de línea que muestra una campaña pausada de Meta queda vieja (se guarda en `pause_reason`). Solo lectura: mostrar al lado la calidad actual. No tocar el motor de Meta.
- [ ] Destinatarios de avisos de captación (`capture_notice_recipients`, vacío en los 4 perfiles): ubicar la pantalla que los edita y dejar un acceso desde Hoy/Salud cuando está vacío. Los carga la responsable.
- [ ] Reemplazar `window.prompt/confirm` de las pantallas de Wasender por diálogos propios.
- [x] Ficha y chat: si la persona escribió y la IA está apagada en esa conversación, el «siguiente paso» pide responder (antes decía «no hace falta hacer nada»).

### C. Seguimiento y recontacto por Wasender (punto 5) — tarea #33
- [x] Recontacto: los chats que salen por Wasender no dependen de la ventana de 24 h (`planRecontacto` con `sinVentana`, `recontacto/motor.ts`). Meta no cambia.
- [ ] Seguimiento (`seguimiento/motor.ts`, `circuito.ts`): si el chat sale por Wasender (o su línea de Meta fue reemplazada), los contactos 2 y 3 salen por Wasender con plantilla propia (uso «seguimiento»), sin aprobación de Meta. Sigue apagado hasta que la responsable lo prenda (`followup_enabled_since`).
- [ ] Segundo intento a quien nunca respondió (decisión de la responsable del 12/11): uno solo, a los 5 a 7 días, con otro texto, por Wasender, dentro del límite del día y del calentamiento, de lunes a sábado en horario. Regla pura con pruebas + tarea en el tick, apagado por defecto con interruptor por perfil. Actualizar la regla 5 de `.claude/referencias/reglas-comunes.md` con fecha y decisión.
- [ ] Formularios web y presupuestos de Marketing por Wasender (resto de #33).

### D. Orden y accesibilidad (punto 6)
- [x] Títulos iguales a la pestaña («Chats», «Para recuperar»).
- [x] Celular: letra mínima de 13 px, pestañas deslizables con la activa a la vista, botones de lista más altos (`src/app/accesible.css`). **Falta mirarlo en la Preview** en tamaño celular.
- [ ] Celular: al abrir un chat, que lo primero que se vea sea la conversación.
- [ ] Prospectos prioritarios de Marketing: paginar (hoy carga todo, más de 600 controles).
- [ ] Contactos → Cartera: ocultar contadores en cero. Bases vacías o repetidas: proponer archivado (no archivar sin aprobación).
- [ ] Bandeja humana: propuesta de limpieza de los 62 chats y las 55 incidencias (solo listar y proponer; cambios de datos, con aprobación).

### E. Cierre
- [ ] `npm run typecheck`, pruebas unitarias, `npm run lint`, `npm run build`.
- [ ] Publicar la rama, comprobar la Preview y recorrerla (solo mirar).
- [ ] `docs/mejoras-1211/ENTREGA.md`, `INFORME.md`, `MIGRACIONES.md`.
- [ ] Informe a la responsable con el enlace de la Preview y qué cambia al aprobar.

## Revisión de la Preview (12/11, punto de control 5)
- Recorrida en celular y escritorio (solo mirar): Hoy, Salud, Wasender y Para recuperar cargan con 200, sin errores de consola ni desborde.
- Letra menor a 13 px en celular: Hoy pasó de 60 % a 16 %; Para recuperar, a 22 %. Botones chicos en Para recuperar: de 50 a 2.
- «Esperan tu respuesta» muestra 10 chats de Jurídico (del 26/10 en adelante) y «Captados para derivar», 10.
- Falta recorrer: los otros tres perfiles, el detalle de campaña, la ficha y el chat con el cambio del «siguiente paso».
- Para abrir la Preview desde acá hizo falta un enlace temporal de Vercel (vence solo a las 23 h); la app sigue pidiendo el código de acceso.

## No hacer
- No tocar `main` ni producción. No prender envíos, seguimiento ni campañas. No editar lo de Meta.
- No escribir el código de acceso en ningún archivo. Recordar a la responsable que lo cambie.
