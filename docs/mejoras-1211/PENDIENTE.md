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
- [ ] Hoy: dos colas nuevas, «Respondieron y nadie contestó» (entrante último, IA apagada o sin respuesta) y «Captados para derivar».
- [ ] Hoy: el chip de campaña no dice «enviando» si la línea no puede enviar; explicar «Bot 33/100».
- [ ] Salud del sistema: líneas de Wasender (estado, habilitada, día de calentamiento, fallos de 24 h). Tarea #34.
- [ ] Campañas: la calidad de línea que se muestra en una campaña pausada debe ser la actual.
- [ ] Destinatarios de avisos de captación: revisar la pantalla existente y dejar el acceso a la vista (los carga la responsable).
- [ ] Reemplazar `window.prompt/confirm` de las pantallas de Wasender por diálogos propios.

### C. Seguimiento y recontacto por Wasender (punto 5) — tarea #33
- [ ] Seguimiento (`seguimiento/motor.ts`): si el chat habla por Wasender o su línea de Meta fue reemplazada, sale por Wasender con plantilla propia y sin ventana de 24 h. Sigue apagado hasta que la responsable lo prenda.
- [ ] Recontacto (`recontacto/motor.ts`): por Wasender no depende de la ventana de 24 h.
- [ ] Segundo intento a quien nunca respondió: uno solo, a los 5 a 7 días, con otro texto, por Wasender, dentro del límite diario y del calentamiento. Actualizar la regla 5 en `.claude/referencias/reglas-comunes.md` con fecha y decisión.

### D. Orden y accesibilidad (punto 6)
- [ ] Títulos iguales a la pestaña («Chats», «Para recuperar»).
- [ ] Celular: pestañas que no se corten; el chat abre mostrando la conversación; letra mínima de 13 px en Hoy, Para recuperar y Prospectos.
- [ ] Prospectos prioritarios de Marketing: paginar.
- [ ] Contactos → Cartera: ocultar contadores en cero. Bases vacías o repetidas: proponer archivado (no archivar sin aprobación).
- [ ] Bandeja humana: propuesta de limpieza de los 62 chats y las 55 incidencias (solo listar y proponer; cambios de datos, con aprobación).

### E. Cierre
- [ ] `npm run typecheck`, pruebas unitarias, `npm run lint`, `npm run build`.
- [ ] Publicar la rama, comprobar la Preview y recorrerla (solo mirar).
- [ ] `docs/mejoras-1211/ENTREGA.md`, `INFORME.md`, `MIGRACIONES.md`.
- [ ] Informe a la responsable con el enlace de la Preview y qué cambia al aprobar.

## No hacer
- No tocar `main` ni producción. No prender envíos, seguimiento ni campañas. No editar lo de Meta.
- No escribir el código de acceso en ningún archivo. Recordar a la responsable que lo cambie.
