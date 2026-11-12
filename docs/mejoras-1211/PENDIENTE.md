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

## Hecho después (puntos de control 2 a 9)
Ver `ENTREGA.md`. En resumen: ritmo nuevo conectado al motor, recontacto, seguimiento y segundo intento por Wasender, ocho plantillas nuevas inactivas, Hoy con una sola cola, Chats y Contactos reorganizados, Salud con Wasender, accesibilidad en celular.

## Pendiente
- [ ] Aplicar la migración 0605 al aprobar (ver `MIGRACIONES.md`).
- [ ] Aviso de captación: la tabla `capture_notices` existe desde la etapa 2, pero **no hay pantalla para cargar destinatarios ni código que envíe el aviso**. Por eso los 23 avisos quedaron «sin destinatario». Hace falta construir las dos cosas (decisión de la responsable: a qué números y por qué línea).
- [ ] Interruptor en pantalla para prender el segundo intento por perfil (hoy solo se prende en la base).
- [ ] Formularios web y presupuestos de Marketing por Wasender (resto de la tarea #33).
- [ ] Celular: que el chat abra mostrando la conversación.
- [ ] Prospectos prioritarios de Marketing: paginar.
- [ ] Reemplazar `window.prompt/confirm` de las pantallas de Wasender.
- [ ] Todos los chats: la lista arranca pegada a las pestañas; falta un encabezado y accesos rápidos.
- [ ] Bandeja humana e incidencias (268 cosas esperando decisión en Jurídico): propuesta de limpieza; los cambios de datos, con aprobación.
- [ ] Bases vacías o repetidas: proponer archivado.
- [ ] Probar de punta a punta con un chip conectado (tarea #29) y contra la API real la verificación del número.
- [ ] Pruebas unitarias de `cupoDeLinea` y `frenoDeLinea` con base falsa; pruebas de integración.

## Revisión de la Preview (12/11, punto de control 5)
- Recorrida en celular y escritorio (solo mirar): Hoy, Salud, Wasender y Para recuperar cargan con 200, sin errores de consola ni desborde.
- Letra menor a 13 px en celular: Hoy pasó de 60 % a 16 %; Para recuperar, a 22 %. Botones chicos en Para recuperar: de 50 a 2.
- «Esperan tu respuesta» muestra 10 chats de Jurídico (del 26/10 en adelante) y «Captados para derivar», 10.
- Falta recorrer: los otros tres perfiles, el detalle de campaña, la ficha y el chat con el cambio del «siguiente paso».
- Para abrir la Preview desde acá hizo falta un enlace temporal de Vercel (vence solo a las 23 h); la app sigue pidiendo el código de acceso.

## No hacer
- No tocar `main` ni producción. No prender envíos, seguimiento ni campañas. No editar lo de Meta.
- No escribir el código de acceso en ningún archivo. Recordar a la responsable que lo cambie.
