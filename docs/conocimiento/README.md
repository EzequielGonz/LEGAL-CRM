# Conocimiento del bot por versiones · 25/10/2026

## Qué incluye

- **v1** = el bot como estaba el 24/10 (reglas del sistema, guion de `ai_agents`, criterio del rubro, rol de la base o campaña y ficha del negocio). No tiene ítems: con v1 el pedido al modelo queda exactamente igual que antes.
- **v2** = v1 sin cambios + un bloque de conocimiento que se suma **por debajo** de las reglas, el rol y la ficha (el bloque lo dice explícitamente). Contenido (166 ítems; fuente en `docs/conocimiento/v2/`: `extraer_fichas.py` saca las 148 fichas del Word a `fichas_origen.json`, `generar.py` arma `v2.json` y la migración 0511 en cuatro partes):
  - Base general (2): cómo vender por WhatsApp (diagnóstico de objeciones, autonomía, pasos chicos, sus palabras, precio sin números) y límites/seguridad/emergencias (911, 144, 137; jerarquía de autoridad; no pedir datos sensibles; otros negocios del grupo).
  - Base por rubro (4) y temas (14) que se suman solo si la charla los toca (ART, tránsito, sucesiones, familia, laboral/civil, penal; financiación, usado/gastos; régimen de salud, continuidad; métricas, tecnología).
  - 148 fichas de objeción del Word (O001–O148), adaptadas: qué puede haber detrás, pregunta para entender, enfoque y qué evitar, más la nota de la regla vigente cuando corresponde. Cuatro quedan apagadas porque ya las resuelve una regla determinista: O002 y O003 (origen), O014 (baja) y O018 (ahora no).
- **Selección por turno** (`src/lib/conocimiento/seleccion.ts`, pura): base general + base del rubro siempre; hasta 2 temas y 3 fichas del rubro o comunes, por disparadores del último mensaje (peso 3) y los dos anteriores (peso 1). Nunca mezcla rubros. Tope 12.000 caracteres.
- **Versión por rubro** (`bot_knowledge_assignment`): v1, v2 o «Comparar 50/50» (reparto estable por conversación). Cada respuesta registra versión y fichas en `agent_turn_logs`.
- **Perfiles › Conocimiento del bot**: versión vigente, comparación v1/v2 con resultados reales (conversaciones, siguieron la charla, captación, pasaron a una persona, bajas, retenidas, tokens), veredicto que no declara ganador con menos de 30 conversaciones por versión ni con diferencias que pueden ser azar (prueba de dos proporciones), fichas más usadas, y contenido editable (editar, apagar/encender). Todo cambio queda en `ops_change_log` con el valor anterior.
- **Probar el bot real**: selector de versión para probar v1 y v2 con los mismos mensajes; muestra qué temas y fichas tuvo en cuenta.
- **Asistente del panel**: consulta `comparar_versiones_bot`.
- **Regla «ya tengo abogado»** (decisión 25/10): se agrega «sin cuestionar a su abogado; si dice que no, detener».
- **Plantillas sin botones**: 16 borradores (4 por rubro) en `src/lib/plantillas/propuestas.ts` (`*_sb_*`). No se enviaron a Meta.

## Normas usadas (comprobadas en Infoleg el 25/10)

Ley 24.557 art. 6 (trayecto), Ley 17.418 art. 46 (aviso del siniestro en tres días), Ley 24.240 art. 11 (garantía legal: 6 meses nuevos, 3 usados), Ley 26.682 art. 10 (sin carencia para PMO; preexistencias por declaración jurada, no son motivo de rechazo, valor diferencial autorizado), Ley 27.348 (vigente). La Ley 27.802 (Modernización Laboral, 06/03/2026) existe y está vigente; no se cargó porque el bot no la necesita para preguntar. El bot no cita normas para asesorar.

## Migraciones

- `0510_conocimiento_versiones.sql`: tablas `bot_knowledge_versions`, `bot_knowledge_items`, `bot_knowledge_assignment` (RLS, sin permisos públicos), columnas `knowledge_version` y `knowledge_items` en `agent_turn_logs`, funciones `conocimiento_estadisticas` y `conocimiento_fichas` (solo lectura, sin permisos públicos). Arranca todo en v1.
- `0511_conocimiento_v2_contenido_parte1.sql` a `parte4.sql`: contenido de v2 (así figuran en el historial de la base), generado con `python3 -I docs/conocimiento/v2/generar.py`. `on conflict do nothing`: no pisa ítems editados.
- Volver atrás: en Perfiles, «Usar v1» (o `update bot_knowledge_assignment set version = 1, comparar_con = null, porcentaje = 100`). No hace falta borrar nada.

## Pruebas

- `tests/unitarias/conocimiento.test.ts`: contenido completo, normalización, no mezcla de rubros, fichas apagadas, 26 situaciones de la batería T01–T60 del Word, tope, reparto 50/50 estable, veredicto con pocos datos / diferencia clara / azar.
- Auto-recuperación: cada una de las 144 fichas activas se recupera con su propia frase en su rubro (216/216 contando las comunes en los cuatro); «hola», «ok gracias», «👍» solo traen las bases.

## Guía para el programador

1. `npm ci`, `npm run typecheck`, `npx tsc -p tests/tsconfig.json --noEmit`, `npm run lint` y las unitarias.
2. Si se cambia el contenido de v2, editar `docs/conocimiento/v2/*.py`, regenerar y crear una migración nueva para los ítems nuevos (los existentes se editan desde el panel o con un `update` registrado en `ops_change_log`).
3. Una v3 = insertar la fila en `bot_knowledge_versions` y sus ítems; el panel y las estadísticas la toman (los botones hoy ofrecen v1 y v2).
