# Asistente general · informe de pruebas (15/11)

| | Estado |
|---|---|
| Especificado | Sí (pedido de la responsable del 15/11 y criterios del coordinador) |
| Implementado | Sí, en la rama del agente |
| Probado | Pruebas unitarias, tipos, lint y build en verde. Sin prueba en navegador ni contra la base |
| Publicado | No |
| Habilitado | No: falta aplicar la migración 0626 y publicar |

## Probado

- `tests/unitarias/asistente-general.test.ts` (15 pruebas): perfil pedido y nunca adivinado; herramientas del perfil con `perfil` sin tocar las del asistente de perfil; enmascarado (teléfonos, documentos, números dentro de textos, nombres, correos; fechas visibles); resumen de una planilla sin datos personales; repetidos entre planillas; el servidor vuelve a enmascarar y descarta ids inválidos; división en bases de hasta 5000; límite y entrenamiento con la regla del formulario; cuerpo de la campaña igual al del formulario (Wasender, rotación de plantillas de inicio, ritmo de entrenamiento); días estimados sin domingos; ajustes del boceto (línea de otro perfil rechazada, límite inválido, entrenamiento); resumen con «LANZA» y «DESCONECTADA»; nivel de confirmación; pasos pendientes para reintentar sin repetir; la migración contiene todos los tipos y no borra.
- Instrucciones del asistente de perfil: texto comparado antes y después del cambio, idéntico en los 4 perfiles × 2 modos.
- Suite completa: 525 pruebas en verde (se sumaron las 3 rutas nuevas a la lista de infraestructura de `asistente-catalogo.test.ts`).
- `npm run typecheck`, `tsc -p tests/tsconfig.json`, eslint sobre lo tocado y `npm run build`.

## No probado

- En el navegador (no hay sesión ni variables en este entorno): diálogo, foco, Escape, teléfono a 375 px, modo claro/oscuro y zoom al 200 %. Se revisó el código contra WCAG 2.2 AA, sin renderizar.
- Contra Supabase y Gemini reales: subida firmada del JSON, análisis de una planilla, importación, creación por `/api/campaigns` con la sesión, suma de partes y lanzamiento. Hace falta un entorno aislado con datos ficticios y Wasender simulado.
- La migración 0626 (no se aplicó).
