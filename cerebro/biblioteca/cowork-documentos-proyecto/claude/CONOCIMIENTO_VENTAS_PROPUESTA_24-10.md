# Conocimiento de ventas para los 4 agentes · propuesta (24-25/10, sin implementar)

Estado: propuesta con decisiones tomadas; falta el contenido completo y el «dale» para implementar. No se tocó código, base ni configuración.

## Material recibido
- 24/10: resumen pegado en el chat (habla de 148 objeciones y 200 microconversaciones).
- 25/10: Word de 5 páginas = otro resumen (habla de 80 objeciones). Sus enlaces «Descargar Word / TXT» apuntan a `sandbox:/mnt/data/...` del entorno donde se generó: no son accesibles. Falta el documento completo (anexos por rubro, objeciones, ejemplos, suite de pruebas).

## Estado real hoy (verificado 24/10)
- En producción responde: prompt de `ai_agents` + criterio del rubro + rol + ficha del negocio (`rubros.business_sheet`) + `GUIA_CAPTACION_Y_CIERRE`.
- Sistema modular existente (`agentes/modulos.ts`, `agent_modules`, `seleccionarModulos`) INACTIVO: tabla vacía, sin `agent_assignments`.
- Objeciones en los prompts: casi nada.

## Decisiones de la responsable (25/10)
- Precios: el bot puede explicar el concepto (la cuota sola no muestra el costo total; lo arma el asesor) sin dar números, rangos ni cuotas.
- «Ya tengo abogado»: una sola pregunta por si busca una segunda opinión, sin cuestionar al otro abogado; si dice que no, se detiene.
- Estructura pedida: una base general del bot (ventas + algo de cada rubro) que vale para todo el panel, encima el conocimiento del rubro y después los roles de las bases (ya existen). Visible en Perfiles, como el seguimiento en vivo.

## Estructura acordada
1. Base general (todos los rubros): método de objeciones, autonomía, pasos chicos, sus propias palabras, emergencias (911, 144, 137), equivalencias de seguridad.
2. Conocimiento por rubro: fichas de objeción (disparadores, qué puede significar, pregunta, enfoque, siguiente paso, límites) + temas clave + ejemplos (máx. 2 por turno, ilustrativos).
3. Roles de las bases: sin cambios.
4. Datos que cambian: ficha del negocio. Normativa: fichas con fuente y fecha de verificación, solo para saber qué preguntar.
- Prioridad: reglas del sistema > ficha > guion/rol > conocimiento.
- Recuperación por rubro + señal + palabras clave (sin embeddings por ahora).
- Panel: pestaña «Conocimiento» en Perfiles con versión vigente, interruptor por rubro, historial y vuelta atrás.

## No duplicar
Rol, guion, límites, detención, captación, «fronteras», `puntaje.ts`, ficha del negocio, criterio del rubro.

## Verificación
Normas citadas por el documento: se comprueban en Infoleg/JurisprudenciaARG antes de cargarlas (documento generado por otra IA). Simulador + evaluación existentes (sin envíos); regresión + casos nuevos de objeciones; 0 fallos críticos y sin regresión en captación/detención. Después, «Probar el bot real» y encendido por rubro.
