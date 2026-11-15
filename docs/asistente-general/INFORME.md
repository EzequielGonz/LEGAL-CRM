# Asistente general · informe de pruebas (15/11)

| | Estado |
|---|---|
| Especificado | Sí (pedido de la responsable del 15/11 y criterios del coordinador) |
| Implementado | Sí, en la rama del agente |
| Probado | Pruebas unitarias, tipos, lint y build en verde. Sin prueba en navegador ni contra la base |
| Publicado | No |
| Habilitado | No: falta aplicar la migración 0626 y publicar |

## Probado

- `tests/unitarias/asistente-general.test.ts` (20 pruebas; de la segunda pasada: ejemplos sin domicilios ni observaciones, adopción de una base solo propia y completa, lanzamiento vencido, lectura de filas solo por identificador dentro de su carpeta, y que no escucha ni monta el asistente de perfil): perfil pedido y nunca adivinado; herramientas del perfil con `perfil` sin tocar las del asistente de perfil; enmascarado (teléfonos, documentos, números dentro de textos, nombres, correos; fechas visibles); resumen de una planilla sin datos personales; repetidos entre planillas; el servidor vuelve a enmascarar y descarta ids inválidos; división en bases de hasta 5000; límite y entrenamiento con la regla del formulario; cuerpo de la campaña igual al del formulario (Wasender, rotación de plantillas de inicio, ritmo de entrenamiento); días estimados sin domingos; ajustes del boceto (línea de otro perfil rechazada, límite inválido, entrenamiento); resumen con «LANZA» y «DESCONECTADA»; nivel de confirmación; pasos pendientes para reintentar sin repetir; la migración contiene todos los tipos y no borra.
- Instrucciones del asistente de perfil: texto comparado antes y después del cambio, idéntico en los 4 perfiles × 2 modos.
- Suite completa: 530 pruebas en verde (se sumaron las 3 rutas nuevas a la lista de infraestructura de `asistente-catalogo.test.ts`).
- `npm run typecheck`, `tsc -p tests/tsconfig.json`, eslint sobre lo tocado y `npm run build`.

## No probado

- En el navegador (no hay sesión ni variables en este entorno): diálogo, foco, Escape, teléfono a 375 px, modo claro/oscuro y zoom al 200 %. Se revisó el código contra WCAG 2.2 AA, sin renderizar.
- Contra Supabase y Gemini reales: subida firmada del JSON, análisis de una planilla, importación, creación por `/api/campaigns` con la sesión, suma de partes y lanzamiento. Hace falta un entorno aislado con datos ficticios y Wasender simulado.
- La migración 0626 (no se aplicó).

## Riesgos para que decida la responsable

- **Filas completas guardadas**: cada planilla adjunta queda como JSON en el depósito privado `bases-originales` (`asistente-general/<id>/filas.json`), sin vencimiento, aunque nunca se confirme el plan. Contiene datos personales de la planilla. Por la regla «nada se borra» no se eliminan solas: hace falta decidir si se archivan o se vencen (por ejemplo, a los 30 días) y con qué motivo.
- **Base cortada a mitad**: si una importación se corta (por tiempo), la base queda incompleta; el asistente no la usa y pide archivarla desde Bases antes de reintentar.
