# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 01/11/2026 (PR #52 a #74; pendientes nuevos del 01/11 abajo). Sin secretos ni datos de prospectos.

## Forma de trabajo vigente
- Tarea por tarea; publicar a producción cada tarea cerrada, sin lanzar campañas, envíos ni gastos.
- Push CRM: `git push` da 403 (y `gh` no tiene token válido); se sube con el conector de GitHub (`push_files`, archivos completos) y se verifica con `git show FETCH_HEAD:archivo | cmp`. Archivos muy grandes: partirlos (ej. migración 0511 en 4 partes).
- npm bloqueado por la red: typecheck y lint los hace el build de Vercel (Preview READY antes de mergear). Pruebas con `tsx` global.
- La Preview pide el PIN: la revisión visual se hace en producción.
- Chrome (extensión) falló el 25/10 al crear el grupo de pestañas. Para acciones del panel sin navegador: pedido en `system_settings` que procesa el latido (ej. `plantillas_a_meta`).
- Colores del panel: usar clases del tema claro (bg-white, text-slate-*, border-slate-*); el modo oscuro las invierte (tema-premium.css). No usar clases oscuras fijas (bg-slate-900/70, text-white sueltas): en modo oscuro quedan beige con letra blanca.
- SQL: `apply_migration` para DDL. Todo cambio de datos se registra en `ops_change_log`.
- Landings: el conector de GitHub no tiene permiso de escritura en sus 4 repos.

## FASE 3 · CERRADA (25/10, decisión del dueño)
- La Fase 3 (biblioteca de agentes, simulador, evaluación, trabajos de ajuste, comparaciones, auditorías, tareas del servidor) **no existe más**: no está pausada, está descartada. No retomarla, no proponerla ni preparar nada de ella.
- Nunca se aplicó en la base ni se publicó. Los archivos de `docs/etapa3` y la migración `0300` que figuren en el repositorio o en los documentos del proyecto son material histórico sin vigencia; no aplicar `0300`.
- El conocimiento del bot por versiones (v1/v2) NO es parte de la Fase 3 y sigue vigente.

## BLOQUE: ajustes de Perfiles y plantillas sin botones · publicado (PR #73 y #74)
- main `ca4f1ee`, deploy dpl_EYVdoTXg2jFffwPt7S3CrsbdUR9f READY.
- «En vivo» y «Conocimiento del bot» con colores del tema. Comparativa por rubro desplegable (recuerda lo abierto), reparto v2/v1 editable (10–90 %), buscador y edición de título, disparadores y texto de cada ítem (registro en `ops_change_log`).
- Las 16 plantillas `*_sb_*` quedaron registradas en Meta para revisión (estado PENDING), por el pedido `system_settings.plantillas_a_meta` que procesa el latido por tandas. No se envió ningún mensaje. No se asignan solas (el nombre no sigue la convención de asignación automática): asignarlas a mano en Plantillas cuando Meta las apruebe.

## BLOQUE: conocimiento del bot por versiones (v1/v2) · publicado y habilitado en 50/50 (PR #72)
- v1 = bot del 24/10 sin cambios. v2 = v1 + Biblioteca Maestra de Ventas: 2 bases generales, 4 bases por rubro, 12 temas, 148 fichas de objeción (O002, O003, O014, O018 apagadas). Se suma por debajo de reglas, ficha y rol.
- Base: migraciones 0510 y 0511 (partes 1–4) aplicadas; 166 ítems, 162 activos.
- Habilitado 25/10: los 4 rubros en «v2 comparando con v1 50/50», registrado en `ops_change_log`. Volver atrás: Perfiles › Conocimiento del bot › «Usar v1».
- Regla «ya tengo abogado»: una pregunta por segunda opinión, sin cuestionar al abogado; si dice que no, detener.
- Normas comprobadas en Infoleg (25/10): 24.557 art. 6, 17.418 art. 46, 24.240 art. 11, 26.682 art. 10, 27.348.
- Probado: 34/34 unitarias de conocimiento; auto-recuperación 216/216.
- **Comprobado en producción (25/10, ~03:04 AR):** tras un mensaje de prueba a cada perfil, `agent_turn_logs` guardó versión y fichas. Jurídico y Salud respondieron con v2 (fichas general_venta, general_seguridad y la base del rubro); Marketing y Autos con v1 (sin fichas). Reparto 2 y 2.
- Guía para el programador: `docs/conocimiento/README.md`.

## BLOQUE: detención sin apagar al agente y recontacto · publicado (PR #71)
- Detención: disculpa y queda a disposición; frena campañas, seguimientos y recontactos, pero no apaga al agente (salvo número de una menor o detención no verificada).
- Recontacto a las 2 h, hasta dos veces, dentro de 24 h y en horario.

## BLOQUE: arreglos del bot del 24/10 · publicado (PR #69 y #70)
- Contestadores automáticos, origen/baja con disculpa fija, audios, sin promesas de día u hora, calidad baja en Meta, rescate de turnos, ficha del negocio por rubro (0509), prompts ajustados.

## BLOQUE: redes, ampliación del 24/10 · cerrado
- Del 26/10 al 5/11, 2 de feed + 5 historias por marca y día. PR #68. Metricool: 304 publicaciones.

## Pendiente
- **NUEVO 01/11 · Incidencia «Alumar» (Marketing):** negocio «Alumar - Fábrica de Aberturas en Aluminio y Muebles - Choele Choel» escribió por el perfil Marketing y la conversación quedó trabada en «Tomar por humano» y no avanzó a la etapa «Enviar presupuesto». Desde ahí no deja enviar el presupuesto en PDF. Por diagnosticar: por qué no pasó de etapa y qué impide el envío (estado de la conversación, permisos de la ventana de 24 h de WhatsApp, tipo de archivo). Sin enviarle nada hasta autorización.
- **NUEVO 01/11 · Adjuntar PDF en los chats:** hoy los chats solo permiten adjuntar fotos; se pidió que también se puedan adjuntar PDF (envío de presupuestos). Por definir: límite de tamaño, validación de tipo, y que el envío respete las reglas vigentes (sin envíos masivos ni sin autorización).
- Revisar la comparación v1/v2 con 30+ conversaciones por versión y decidir (Usar v2 o volver a v1).
- Cuando Meta apruebe las `*_sb_*`, asignarlas en Plantillas al propósito que corresponda.
- Cargar precios/stock/condiciones en la ficha del negocio si se quiere que el bot los use (hoy no hay).
- Confirmar el nombre de presentación del bot por rubro. Ejemplos de conversación por rubro.
- Línea CIVIL con calidad baja: campaña ART pausada. Incidencias viejas (225). Base «ART GRAVES» cargada 3 veces.
- SEO: sitemap, indexación, GA4 (faltan los ID), Perfil de Empresa por marca.
- Encender el seguimiento de 48–72 h por perfil (PIN). Plantillas de base fría esperan aprobación de Meta.

## Decisiones vigentes
- Nunca lanzar campañas ni contactar sin autorización expresa. Ningún pago sin autorización. Claves solo en Vercel.
- Fase 3: cerrada y descartada (25/10).
- Conocimiento (25/10): por versiones, se suma por debajo de reglas, ficha y rol. Precios: explicar de qué depende y que la cuota no muestra el costo total, sin números, rangos ni cuotas.
- Detención (24/10): disculpa y queda a disposición; el agente sigue atendiendo si la persona vuelve a escribir (salvo menor).
- Origen de los datos o baja: disculpa automática, sin explicar el origen, y detención.
- El bot no promete día ni hora; la persona que sigue la gestión la asigna el dueño.
- Audios: se pide que escriban. Contestadores automáticos: no se les responde.
- Marketing: cierre de la venta por una persona; el bot nunca pasa datos de pago.
- Rechazos: «Ahora no» → mensaje corto; «No, gracias»/«Ya compré»/«Ya lo resolví» → insiste una vez y detiene; «No me escriban más», enojo o número equivocado → disculpa y detiene.
- Salidas de la empresa: lunes a sábado de 8 a 21 AR. Responde solo Gemini 3.8 Flash.
