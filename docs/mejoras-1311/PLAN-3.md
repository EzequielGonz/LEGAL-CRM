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

## Bloques y estado (actualizado 13/11 5:50, hora de Argentina)

Todo lo de esta tabla está **publicado en producción** (`main` = `mejoras-1211`). Detalle de qué se probó y qué no: `INFORME.md`.

| # | Bloque | Estado |
|---|--------|--------|
| 1 | Seguimiento automático (el bot decide; por Wasender redacta), pantalla con la ruta, descartes automáticos, segundo intento | Hecho y encendido |
| 2 | «Resultados»: cada cifra con sus personas, origen y quién lo hizo | Hecho |
| 3 | Plantillas de inicio 10 × 40 por perfil y rotación en campañas de Wasender | Hecho y cargado |
| 4 | Bot v2: 14 fichas nuevas; reacciones sin pedido de texto | Hecho |
| 5 | Ficha: quién atiende, devolver al bot, etapa y origen, botones claros | Hecho y probado con un caso viejo |
| 6 | Velocidad: marco inmediato en Hoy, Chats y Contactos; métricas en memoria | Hecho y medido |
| 7 | Orden: lista de chats en palabras y con filtros plegados, Incidencias sin detenciones, menú de Contactos | Hecho |

## Lo que queda para la próxima vuelta (en este orden)

1. Mirar el primer seguimiento real (sábado 14/11 desde las 20:44): qué decidió el bot en cada caso (`followup_tasks.status_reason` y Contactos → Seguimiento → Soltados / Enviados).
2. Con la línea de Wasender conectada (la responsable dijo «mañana las probamos en horario normal»): campaña con «Rotar las plantillas de inicio», seguimiento redactado por el bot, segundo intento, y las funciones pendientes de «Líneas y plantillas» (probar una plantilla con un nombre de ejemplo, envío de prueba al teléfono del equipo, últimos fallos de la línea).
3. **«Atención humana», a medio unificar.** Los filtros «Esperan tu respuesta» y «Los atiende una persona» de «Todos los chats» ya miran el estado real del chat, igual que la ficha. Medido en producción el 13/11 en Jurídico: el filtro da 7 y Hoy muestra 9 (3 en «Atención humana» + 6 captados con «Te escribió»). La diferencia de 2 sale de que Hoy suma además a quienes el bot derivó a una persona en los últimos 7 días (`personas.listas.por_cerrar`, por el estado de la oportunidad) aunque el último mensaje del chat sea nuestro. Falta decidir una sola regla: o Hoy deja de marcar «Te escribió» cuando ya se le contestó, o el filtro suma también a los derivados por el bot. Recomendado: lo primero (que «Te escribió» signifique siempre que la última palabra es de la persona) y mostrar a los otros como «Para cerrar».
4. Reemplazar o retirar la tabla vieja «Captados y casos» (quedó sin pestaña; solo existe por su dirección y solo sirve para Jurídico).
5. Aviso de captación: pantalla y envío (falta que la responsable diga a quién y por qué línea).
6. **Pasada de modernización pantalla por pantalla (pedido expreso del 13/11: «más moderno, rápido, funcional, entendible»).** Usar estas skills, en este orden, y corregir en la misma pasada lo que marquen:
   - `vectorlab-ux-skills:ux-audit` (compuerta de diez puntos, con capturas a 375 y 1280), más `page-patterns`, `forms`, `empty-states`, `loaders`, `errors`, `labels` y `verbs` de la misma familia cuando la pantalla los toque.
   - `vercel-react-best-practices` para la carga: marco inmediato con `Suspense` (como ya tienen Hoy y la cartera), componentes de cliente pesados con `dynamic()`, nada de consultas en serie.
   - `supabase-postgres-best-practices` para las consultas lentas: `pg_stat_statements` mostró `profile_metrics` (ya en memoria un minuto) y `campaign_metrics` (140 ms, 20.000 llamadas: revisar quién la llama y guardarla igual).
   - `design:accessibility-review` al terminar cada pantalla.
   Pantallas que faltan, de más usada a menos: detalle de una campaña y lista de campañas; conversación abierta (hilo del chat); Agenda / Citas; «Por base»; Bot IA (probar el bot y conocimiento); Líneas de Wasender; Ajustes; Redes (Accesos, Publicaciones, Contenido, Publicidad); Salud del sistema; los paneles `/panel/<perfil>/…` que todavía usan tablas viejas («Prioritarios» de Marketing sin paginar, «Captados y casos»).
   En cada una: qué decide la persona ahí, un solo botón principal, textos en palabras (sin ids ni nombres internos), estados vacíos que digan qué hacer, y cada número que se pueda abrir.
7. Medir el efecto de las fichas nuevas del bot (informe programado del 20/11).

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
