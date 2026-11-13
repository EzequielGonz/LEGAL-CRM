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

## Bloques y estado (se actualiza al avanzar)

| # | Bloque | Estado |
|---|--------|--------|
| 1 | Seguimiento automático: el bot decide antes de cada contacto 2 y 3 (`src/lib/seguimiento/criterio*.ts`, enganchado en `motor.ts`); por Wasender redacta el mensaje y la plantilla es respaldo | Implementado, sin publicar |
| 1b | Cierre automático de descartes (quien dice que no / ya lo resolvió) desde el latido, cada 10 min, a las 6 h (`src/lib/hoy/descartes-motor.ts`) | Implementado y con pruebas, sin publicar |
| 1c | Encendido sin interruptor: migración 0606 **aplicada el 13/11** (valor por defecto, columna `grupo` en plantillas de Wasender y `wasender_rotar_inicio` en campañas). Falta el paso de datos: poner `followup_enabled_since = '2026-11-12T11:00:00Z'` en los 4 perfiles **después de publicar** el código, con registro en `ops_change_log` | A medias |
| 1d | Pantalla «Seguimiento» con la ruta a la vista (`RUTA_SEGUIMIENTO`) y qué pasó con cada persona | Pendiente |
| 2 | Estadísticas de Hoy que se abren: cada cifra lleva a la lista de personas (quién, cuándo, de qué base o campaña, quién derivó o cerró, motivo) y a los casos cerrados con su origen | Pendiente |
| 3 | Plantillas de inicio: 10 por rubro, 40 variantes; grupo «inicio» y rotación en campañas de Wasender | Redacción en curso (tarea en segundo plano → `plantillas-inicio.json`); falta generador, migración y rotación |
| 4 | Bot v2: fichas nuevas (solo altas) y selección mejorada | En curso (tarea en segundo plano → `BOT-V2.md` y `conocimiento-v2-agregados.sql`, sin aplicar) |
| 5 | Ficha del cliente: probar botones con casos viejos, «Devolver al bot», simplificar | En curso (tarea en segundo plano → `FICHA.md`) |
| 6 | Velocidad: diagnóstico con arreglos listos | En curso (tarea en segundo plano → `RENDIMIENTO.md`); falta aplicar |
| 7 | Orden: una sola definición de atención humana, captados sin derivar en dos pantallas, Incidencias sin contar detenciones, una sola «Prospectos», Ajustes en pestañas, pantallas vacías, Prioritarios paginado, encabezado del inbox | Pendiente |
| 8 | Diseño: lista de chats, ficha, tablas y formularios menos técnicos (sin nombres crudos de plantillas ni textos internos a la vista) | Pendiente |
| 9 | Verificar (typecheck, lint, pruebas, build), publicar, recorrer producción como usuaria e informar | Pendiente |

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

## Punto de control · 13/11 4:30 (hora de Argentina)

- Las cuatro tareas en segundo plano (plantillas, bot v2, ficha y velocidad) se cortaron por el límite de uso de la cuenta antes de entregar archivos. No dejaron cambios en el repo. Hay que relanzarlas o hacerlas a mano: los encargos completos están en la conversación y se resumen en la tabla (bloques 3 a 6).
- Lo implementado hasta acá pasa typecheck y sus pruebas (`tests/unitarias/seguimiento-criterio.test.ts`). No está publicado en producción.
- El seguimiento sigue **apagado** en la base hasta publicar.
