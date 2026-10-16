# Comprobación de las skills del proyecto (13/10/2026)

Tres tareas de prueba corridas con Claude Code 2.1.296 sobre este repositorio, sin editar archivos. Se registra la respuesta completa como evidencia de qué skill cargó y cómo se usó. Ningún dato real.

## Prueba 1

**Pedido:** «rediseñá la tarjeta Captados sin derivar de Estadísticas para que abra la lista».

**Respuesta:**

> 1. **Skill:** `kocos-crm-diseno-y-accesibilidad`. El pedido rediseña una tarjeta de Estadísticas y cambia un recorrido de pantalla, que es lo que esa skill cubre. Apliqué el procedimiento «crm-panel-experience».
> 2. **Referencia común:** `.claude/referencias/reglas-comunes.md` (v1.0, 13/10/2026). La leí. Las secciones relevantes son la 3 (Captado y Derivado son cosas distintas; derivar es manual) y la 1 (los cinco estados de evidencia para el informe).
> 3. **Regla de indicadores:** cada cifra que cuenta personas abre el listado del mismo conjunto, con el mismo período, campaña, fuente y unidad, y con acceso a la ficha y la conversación. Cero abre una vista vacía con contexto. «Sin datos» se distingue de cero. No puede haber tarjetas con aspecto de botón que no abren nada.
> 4. **Casos de aceptación:** la skill remite a V10 y A02–A07, A33 y A34. Los saqué de la skill. No abrí `casos-de-aceptacion.md`, así que no verifiqué esa correspondencia ni el estado de cada caso.
> 5. **Qué probar antes de entregar:**
>    - El contador y el listado usan la misma definición: Captado y No derivado.
>    - Que el listado conserve filtros, orden, período y posición al volver.
>    - Los estados vacío, carga, error, con datos y sin resultados.
>    - Teclado, foco visible, objetivo táctil de 44×44 px y teléfono a 375 px.
>    - Los cuatro perfiles y el cambio de modo.
>    - Una tabla de criterios WCAG 2.2 AA con cumple, no cumple o no comprobado.
>    - Las pruebas unitarias del conteo en `src/lib/`, `typecheck`, `lint` y `build`.
>    - Todo con datos ficticios y Meta simulado, sin datos reales.
> 6. **Qué NO haría:** no editaría archivos ahora, porque es una tarea de prueba. Tampoco cambiaría los tokens globales dentro de este bloque, ni marcaría Derivado al compartir una ficha. No tocaría pausas, agentes ni campañas, ni escribiría en GitHub. Y no publicaría ni afirmaría «habilitado» sin autorización y evidencia.

## Prueba 2

**Pedido:** un prospecto escribe un domingo a las 23:40 a la línea de Coberturas y a esa hora hay un seguimiento programado para otra persona.

**Respuesta:**

> 1. Cargué `kocos-crm-reglas-de-captacion` y leí `reglas-comunes.md` (v1.0, 13/10/2026), sección 4.
> 2. **Respuesta al prospecto:** la IA puede responder. Es una respuesta a un entrante y esa política rige las 24 horas, todos los días, dentro de la ventana del canal. Los domingos y las 23:40 no la bloquean. Esto vale si el perfil Coberturas y su agente están habilitados, y si no hay pausa general ni chat tomado por una persona.
> 3. **Seguimiento:** no sale. Es una salida iniciada por la empresa y esas solo van de lunes a sábado de 8 a 21 (hora de Argentina). Un domingo a las 23:40 queda fuera de la franja, y el servidor lo revalida justo antes de enviar. La tarea no se manda por la política entrante, porque cada tarea lleva su origen y se aplica la política de ese origen. Además, el seguimiento hoy está apagado.
> 4. **Condición adicional hoy:** hoy hay que levantar la pausa general y encender el agente, y eso solo lo decide la responsable. Mientras siga la pausa y los agentes apagados, la IA no responde. La política entrante 24 h no levanta la pausa. Además, el origen de tarea y la política entrante 24 h figuran como "pendiente de implementar" en la skill.
> 5. **Caso de aceptación:** A08, "Respuesta entrante de noche o domingo". Su estado es Especificado y depende de la clasificación de origen de tarea. Para el seguimiento fuera de franja no encontré un caso A específico, y lo más cercano son los de horario (C08, V04–V08). Solo busqué por palabras clave y no los abrí.

## Prueba 3

**Pedido:** «que todos los textos nuevos de la landing de Coberturas se publiquen solos».

**Respuesta:**

> 1. **Skill cargada:** `kocos-landings-seo-y-conversion`. Leí también `reglas-comunes.md` (sección 10), que es donde está la política de publicación.
> 2. **Qué se publica solo y qué se retiene:** dentro de una política habilitada para Coberturas, las mejoras rutinarias (títulos, descripciones, encabezados, enlaces internos, imágenes, correcciones técnicas y variantes sobre hechos aprobados) se publican sin aprobación individual. Cada una queda con versión anterior, motivo y prueba posterior. Se retienen con motivo las afirmaciones nuevas sensibles o sin evidencia, los cambios de marca, servicio, dominio, precio, disponibilidad, privacidad o estructura de captación, y los conflictos de marca. Eso no frena el resto. Por eso "todos los textos nuevos solos" no se puede cumplir tal cual: solo se publican los que cumplen la política.
> 3. **Search Console:** por la API oficial, con OAuth de una cuenta que tenga acceso a la propiedad correcta, en solo lectura (`webmasters.readonly`). Los secretos quedan en el servidor. Se registran propiedad, permisos, caducidad y última comprobación, y se puede desconectar por perfil. Hasta que la responsable autorice la propiedad, el módulo queda listo y muestra "resultado pendiente". Una exportación manual sirve solo como comprobación puntual. Una URL o un botón no acreditan la conexión: hay que verificarla con una lectura de prueba.
> 4. **Afirmación nueva sobre cobertura médica:** se retiene con motivo y no se publica sola. Es una afirmación sensible, y además Coberturas no admite planes, precios ni cobertura garantizada. Solo pasa si está en el catálogo de hechos autorizados o si la responsable la valida.
> 5. **Qué necesito de la responsable:**
>    - La política de Coberturas definida y habilitada una sola vez: páginas y alcance, tipos de cambio rutinario, frecuencia y catálogo de hechos autorizados.
>    - La URL, el dominio y el repositorio de la landing de Coberturas. Hoy el repositorio solo tiene `/landing` (Jurídico), con `noindex` heredado.
>    - La autorización OAuth de la propiedad en Search Console.
>    - Una decisión expresa de que se publique en producción, porque publicar código no habilita nada por sí solo. Hasta entonces entrego el ZIP con el informe de los cinco estados y no publico nada.
> 
> Es una tarea de prueba y no edité ningún archivo.

## Resultado

- Prueba 1 cargó `kocos-crm-diseno-y-accesibilidad` y la referencia común; aplicó la regla de indicador y listado y listó las pruebas previas a la entrega.
- Prueba 2 cargó `kocos-crm-reglas-de-captacion`; distinguió la respuesta entrante (24 horas) del seguimiento (8 a 21) y recordó que la pausa general sigue mandando. El caso A09 cubre el seguimiento fuera de franja; la skill ahora lo cita de forma explícita.
- Prueba 3 cargó `kocos-landings-seo-y-conversion`; separó lo que se publica solo de lo que se retiene, y pidió la política, la landing y la autorización de Search Console antes de habilitar.
