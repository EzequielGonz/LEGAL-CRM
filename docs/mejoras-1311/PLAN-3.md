# Plan 3 · 13/11 · pedido de la responsable y estado

## Pedido (textual)

> los seguimientos necesito que hagas una ruta automatica, cuando insistir, cuando desistir, etc. Y ya dejalo prendido.
> Las plantillas necesito que tomes 10 distintas de inicio de conversación que ya hayan y en caso de no haberlas las crees. 10 plantillas distintas por rubro y 40 variables sobre la misma plantilla pero con cambios minimos en palabras o lo que sea para formar ese algoritmo antibloqueo.
> proba los botones con casos viejos no hay problema, cuando entras a la ficha del cliente no es tan funcional, no puede retomar el bot solo... hay demasiado para pulir.
> La mejora del bot, no hagas una version nueva, mejora la v2, agregale todo lo que sirva para objeciones, mejorar captación, etc etc sin editar ni borrar lo actual, sumandole más información y herramientas.
> Las funciones de wasender mañana las probamos en horario normal.
> los hallazgos que encontraste tienen todo el sentido, hay cosas no funcionales, que te mezclan y te hacen perderte en el panel, hay que ordenar, simplificar y hacer rutas simples. Mejorar el diseño, mejorar la velocidad de carga, hacer una mejora integral de todo […] SIEMPRE PRIORIZANDO EL DETALLE Y PROLIJIDAD EXHAUSTIVA. No olvides mejorar sobre todo la simplificacion, organización y algo del diseño, es muy tecnico, muy 2010...

Agregados durante el trabajo:

> El seguimiento, que no se tenga que activar ni cargar manualmente, el agente que reconozca cuando hacerlo, cuando no, que sea automatico.
> las estadisticas que sumaste son basicas, no puedo ver nada, quien se derivo, quien se cerro, no puedo ver nada, solo numeros, tiene que ser todo funcional, entra al panel y usalo como si realmente fueras a trabajar […] no sabes ni de donde salen los clientes cerrados
> guarda un punto de control antes de que se te acabe el limite de uso y programa una tarea para terminar todo si es que no terminas para 8:51 am.

## Bloques y estado (actualizado 13/11 5:10, hora de Argentina)

| # | Bloque | Estado |
|---|--------|--------|
| 1 | Seguimiento automático: el bot decide antes de cada contacto 2 y 3; por Wasender redacta el mensaje | **Publicado y encendido** en los 4 perfiles desde el 12/11 8:00 (registro 172 de `ops_change_log`). Ya hay 2 contactos programados en Jurídico para el sábado 14/11 |
| 1b | Cierre automático de descartes a las 6 h | **Publicado y funcionando** (cerró 3 el 13/11 4:20) |
| 1c | Migración 0606 | **Aplicada** |
| 1d | Pantalla «Seguimiento» con la ruta a la vista | **Publicado** |
| 1e | Segundo intento por Wasender (5 a 7 días) | **Encendido** para primeros mensajes desde el 13/11; plantillas `…_segundo_intento` activadas |
| 2 | «Resultados»: cada cifra de Hoy se abre con las personas, su origen y quién las derivó o cerró | **Publicado y recorrido en producción** |
| 3 | Plantillas de inicio: 10 por perfil, 40 variantes; rotación en campañas de Wasender | **Publicado y cargado** (40 plantillas activas, grupo «inicio»). Textos en `PLANTILLAS-INICIO.md` |
| 4 | Bot v2: 14 fichas nuevas (solo altas) y reacciones sin pedido de texto | Fichas **cargadas**; el arreglo de reacciones **publicado**. Ver `BOT-V2.md` |
| 5 | Ficha: «Quién atiende», «Devolver al bot», botones claros | **Publicado**; falta probar «Devolver al bot» con un caso viejo en producción y dejarlo como estaba |
| 6 | Velocidad | Pendiente (Hoy tarda 4,5 a 6,7 s) |
| 7 | Orden: una sola definición de atención humana, captados sin derivar en dos pantallas, Incidencias sin contar detenciones, una sola «Prospectos», Ajustes en pestañas, pantallas vacías, Prioritarios paginado, encabezado del inbox | Pendiente |
| 8 | Diseño: lista de chats, tablas viejas («Captados y casos» sigue siendo una tabla solo de Jurídico), formularios | Pendiente |
| 9 | Informe final | Pendiente |

## Decisiones tomadas

- El seguimiento arranca con fecha de activación 12/11 8:00 (hora de Argentina) para que entren quienes respondieron a la campaña de Meta de ese día. Nada anterior entra solo.
- Los plazos y topes del circuito no cambian (reglas comunes §5): lo nuevo es que el bot puede decidir **no** escribir. Si el bot no puede decidir (apagado, error), vale la regla de siempre.
- Por Meta el contacto 2 y 3 sale con la plantilla aprobada (fuera de las 24 h Meta no admite texto libre). Por Wasender lo redacta el bot.
- Las tareas en segundo plano no escriben en la base ni hacen git: sus resultados se revisan antes de aplicar.

## Cómo retomar

1. `git status` y `git log --oneline -5` en la rama `mejoras-1211`.
2. Leer los informes de `docs/mejoras-1311/` que ya existan.
3. Seguir la tabla de arriba en orden; al terminar cada bloque, actualizarla.
4. Publicar: `git push origin mejoras-1211:main`, esperar el despliegue y recorrer producción.

## Notas para retomar

- Las tareas en segundo plano del principio se cortaron por el límite de uso y no dejaron nada: todo lo de arriba se hizo en la sesión principal.
- Caso viejo elegido para probar «Devolver al bot»: conversación `c18c12b1-d190-4ee8-9e3a-8fc913536a24` (Jurídico, último mensaje nuestro del 26/10). Estado original: `ai_enabled = false`, `status = requiere_atencion_humana`, oportunidad `a2186219-69a8-4051-9153-7e92b61b5d99` con `attention_state = ia`. Después de la prueba hay que dejarlo igual.
- La prueba que falla en la suite («asistente: cada tipo permitido…») es anterior y ajena a estos cambios.
