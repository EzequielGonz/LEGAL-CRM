# Casos de aceptación A01–A35 (parche 2.0, sección 22)

Versión 1.0 · 13/10/2026. Cada caso se comprueba sobre la versión que se entrega, con datos sintéticos y, para acciones con efectos, en un entorno aislado. Existir en el Word no es estar aprobado. La columna «Correspondencia» vincula cada caso con los casos de control anteriores (C01–C12 del documento único, V01–V14 del parche 1.0) y con las pruebas que ya existen en `tests/`. El estado es el de la copia de trabajo al 13/10/2026 y se actualiza en cada entrega.

| ID | Prueba | Resultado esperado | Correspondencia | Pruebas existentes | Estado |
| --- | --- | --- | --- | --- | --- |
| A01 | Ingreso, cambio de modo y perfil | Sesión conservada; identidad y datos del perfil correcto | V01 | `acceso-y-webhooks`, `sesion-por-operacion` | Probado (sesión); cambio de modo y perfil, pendiente en vivo |
| A02 | Abrir los cuatro perfiles | Menú y CRM común, sin rutas vacías presentadas como terminadas | V10 | — | Especificado (bloque de experiencia) |
| A03 | Abrir cada indicador de oportunidades | Listado del mismo conjunto, período y unidad; acceso a ficha | V10 | — | Especificado |
| A04 | Abrir tasas y métricas externas | Denominador y detalle reales, sin visitantes identificables | V13 | — | Especificado |
| A05 | Regresar desde ficha o chat | Filtros, orden y posición conservados | V10 | — | Especificado |
| A06 | Buscar un registro fuera de la página visible | Búsqueda total en el servidor y conteo correcto | V11 | `sesion-por-operacion` (texto seguro) | Implementado en Inbox y Prospectos; la cobertura de columnas importadas, pendiente |
| A07 | Búsqueda vacía, sin resultados y error | Estados distintos y acción clara; error ≠ cero | V10 | — | Especificado |
| A08 | Respuesta entrante de noche o domingo | La IA responde si está habilitada y el canal lo permite | nuevo (política entrante 24 h) | — | Especificado; depende de la clasificación de origen de tarea |
| A09 | Campaña o seguimiento fuera de franja | No envía; revalida hora y políticas al ejecutar | C08, V04, V05 | `calendario`, `seguimientos-marketing` («corrección 2») | Probado |
| A10 | Dos conversaciones simultáneas | Atención independiente, orden por chat y contexto separado | V12 | `intervencion-humana` (parcial) | Implementado sin probar de punta a punta |
| A11 | Frío que nunca respondió | Sin segundo contacto automático | C09, V05 | `seguimientos-marketing` | Probado |
| A12 | Segundo sin respuesta o respondido | Detener en el primero; tercero solo con respuesta y nuevo estancamiento | V05 | `seguimiento-circuito`, `seguimientos-marketing` | Probado |
| A13 | Cita incumplida | Un reagendamiento válido una hora después del inicio enviado | C03 | — | Especificado (bloque 2.2) |
| A14 | Rechazo, enojo o número equivocado | Disculpa y detención; archivo secundario sin pendiente humano innecesario | C05, V08 | `pausa-general`, `intervencion-humana` (detención) | Implementado en parte (detención); la disculpa automática y la vista secundaria, especificadas |
| A15 | Pide humano o precio fuera de alcance | Solicitud comercial real y pausa automática del chat | C07, V08 | `intervencion-humana` | Probado (pausa del chat); la clasificación de motivos, especificada |
| A16 | Corrección de migración o reclamo de datos | Clasificación y conservación; sin borrado ni reactivación | V03 | migración 5.1 (`etapa1_reconciliacion`) | Implementado sin probar de punta a punta |
| A17 | Captación incompleta o fuera de AMBA | Captado si aceptó, con advertencia y grupo identificable | C06, V06 | — | Especificado (bloques 2.1 y 2.4) |
| A18 | Fase 1 jurídica y consulta actual | Agendar no capta; la consulta actual usa la ruta rápida | C03, C04 | — | Especificado (bloque 2.2) |
| A19 | Compartir ficha | Texto y campos elegidos; el barrio no se inventa; derivación separada | V08 | `estados-entrega` (ficha), bloque 1.7 | Probado en parte (compartir ≠ derivar); casillas de campos, especificado |
| A20 | Derivado con resultado pendiente | Agenda y seguimiento posterior sin alterar la captación | nuevo (sección 10) | — | Especificado |
| A21 | Importación con ceros, desconocidos y repetidos | Conservación, diagnóstico y conflictos, sin envíos | V11 | `bases` (unitarias), `campanas-envio-seguro` | Probado en parte |
| A22 | Base con varias campañas | Acumulados coherentes y detalle por campaña sin duplicación | V10 | — | Especificado |
| A23 | Crear, pausar y reanudar campañas | Resumen sencillo, causas claras y ningún envío repetido | V04 | `campanas-envio-seguro`, `pausa-general` | Probado (sin repetir envíos); el resumen, especificado |
| A24 | Nueva versión del principal | Derivados y diferencias trazables; publicación controlada | V12 | — | Especificado (Etapa 3) |
| A25 | Dataset y ajuste | Datos revisados, división sin fuga, presupuesto y trabajo único | V12 | — | Especificado (Etapa 3) |
| A26 | Modelo ajustado y anterior | Comparación sobre los mismos casos; los errores críticos bloquean la activación | V12 | — | Especificado (Etapa 3) |
| A27 | Pedir una mejora SEO desde el panel | Tarea con alcance, validación, cambio y resultado, sin editor técnico | V13 | — | Especificado |
| A28 | Pieza automática correcta o sensible sin evidencia | Publicar la autorizada; retener u omitir la no verificable | V13 | — | Especificado |
| A29 | Token vencido o publicación incierta | Reconexión o reconciliación; sin cuenta ajena ni duplicados | nuevo (sección 17) | — | Especificado |
| A30 | Perfil, línea o recurso incompatibles | Rechazo en el servidor y cero envío o exposición cruzada | V02, V03 | `sesion-por-operacion`, `seguimientos-marketing` («corrección 1») | Probado |
| A31 | Pausa o baja mientras el modelo redacta | Mensaje retenido, historial conservado | V04 | `intervencion-humana`, `pausa-general` | Probado (campañas y seguimiento); el agente de respuestas, implementado sin probar de punta a punta |
| A32 | 200 candidatos antiguos y uno nuevo válido | Planificación del válido sin bloqueo ni reactivación antigua | V05 | `seguimientos-marketing` («corrección 3») | Probado |
| A33 | Teclado, teléfono y movimiento reducido | Acciones operables, foco visible y lectura sin desplazamiento innecesario | V10 | — | Especificado (bloque 1.13); el foco actual no cumple |
| A34 | Guardar falla o la API rechaza el cambio | Error visible; nunca «Guardado» sin confirmación real | V10 | — | Especificado |
| A35 | Publicación o restauración del proyecto | Estado operativo conservado; migraciones y tareas no se repiten | V14 | migraciones repetibles, `revertir_0200_0201.sql` | Probado en la base; el despliegue, comprobado solo en Preview |

Además de estos casos, cada entrega corre la compilación con las dependencias reales, los tipos, el lint, las pruebas unitarias e integración, y revisa los recorridos y botones de las pantallas tocadas. Una prueba con Meta simulado no demuestra entrega real; una pantalla vacía no valida un cierre completo.
