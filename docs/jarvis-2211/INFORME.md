# Jarvis · informe (22/11/2026)

Versión comprobada: rama `diseno/jarvis-2211` (el commit exacto va en el mensaje de entrega).

## Estados

| Estado | Resultado |
| --- | --- |
| Especificado | Pedido del dueño del 22/11, la orden del reel 2 y la corrección más nueva: «ese fondo raro no, manteniendo la estética clásica del panel pero sumando detalles». |
| Implementado | Todo lo de `ENTREGA.md`. |
| Probado | Ver abajo. |
| Publicado | No. Solo está en la rama. |
| Habilitado | No aplica: no enciende nada. Jarvis usa la IA solo si hay clave de Gemini y presupuesto. |

## Verificaciones

- `npm run typecheck` y `npx tsc -p tests/tsconfig.json --noEmit`: sin errores.
- Pruebas unitarias: pasan todas, incluidas 30 nuevas de Jarvis (pantallas y sugerencias, parte del día, separación por rubro, decisión de confirmar, vedados, validación de la redacción, trato al dueño y ausencia de mesh).
- `npm run build`: compila.
- Capturas con Playwright de un harness con datos de ejemplo (componentes reales empaquetados con esbuild, fetch simulado): orbe cerrado, parte del día, respuesta con tarjeta «¿Lo hago?» y borrador, a 1440 y 390 px, y modo claro. Sin errores de página ni de consola. Con «reducir movimiento» las cifras aparecen en su valor final y no hay animación.

## No probado

- Jarvis con Gemini real y con la base real. Las consultas del parte (captados, contactos nuevos, propuestas pendientes, líneas) no se corrieron contra la base.
- `npm run lint`: no corre en la copia aislada porque no encuentra `.eslintrc.json`; es un problema del entorno.
- Pruebas de integración (`tests/integracion/correr.sh`) y `npm audit`.
- Lector de pantalla real y navegación con teclado a mano.

## Accesibilidad (WCAG 2.2 AA, por criterio)

| Criterio | Resultado |
| --- | --- |
| 1.4.3 Contraste de texto | Cumple. Medido en claro y oscuro: texto 13,9:1; secundario 7,3:1 y 7,7:1; terciario 5,6:1 en ambos; botón principal (texto `slate-950` sobre `gold-500`) 8,0:1. |
| 1.4.11 Contraste de no texto | Cumple. El arco de los anillos usa `gold-700` en claro (corregido desde `gold-600`, que daba 2,9:1) y `gold-400` en oscuro (8,1:1). |
| 2.4.7 Foco visible | Cumple: contorno de 3 px en toda la hoja y en el orbe. |
| 2.5.8 Tamaño del objetivo | Cumple: botones, sugerencias y campos de al menos 44 px. |
| 2.1.1 Teclado | Cumple por construcción: botones y enlaces nativos, atajo Ctrl/Cmd+J, Escape cierra. No se probó con teclado a mano. |
| 4.1.2 Nombre, rol, valor | Cumple: diálogo con nombre, `role="log"` para la charla, anillos con `role="img"` y etiqueta con el número; cifra como texto. |
| 2.3.3 / reducir movimiento | Cumple: sin animaciones con `prefers-reduced-motion`. |
| 1.4.10 Reflujo (celular) | Cumple a 390 px, sin scroll horizontal; las sugerencias deslizan dentro de su fila. |
| Lector de pantalla real | No comprobado. |

## Prompt de Jarvis (versión 1.1, 22/11)

Capas: identidad, tarea, trato, reglas duras, datos no órdenes, formato, dos ejemplos y casos límite. Vive en `src/lib/jarvis/prompt.ts` y su versión se anota acá.

| Versión | Cambio |
| --- | --- |
| 1.0 | Primer bloque con rol, pantalla, estilo y límites. |
| 1.1 | Se ordena en capas con ejemplos y casos límite. Se agrega el trato: quien habla es hombre, sin nombre inventado ni femenino. Los datos de chats y bases se declaran no confiables. |

La redacción opcional del parte se valida antes de mostrarse: se descarta si tiene números que no están en los datos, formato, más de 3 frases o más de 420 caracteres.

## Críticas de diseño aplicadas

- Se sacó el mesh y las esferas de color. El orbe pasó al azul del panel con relieve y el acento del perfil.
- Se sacó la tipografía ajena (Geist, Instrument Serif) para usar la del panel.
- Se subieron los objetivos táctiles a 44 px.
- Se cambió el color del arco en modo claro para llegar a 3:1.
- Una sola estrategia de profundidad: sombras suaves en capas más borde fino con brillo.

## Pendientes

- Probar Jarvis con la clave de Gemini real y la base.
- Revisar con el dueño el parte del día contra la base real: cómo se cuentan «captados» y «contactos nuevos».
- Carga diferida de la hoja (`next/dynamic`) si el peso en cada pantalla del panel molesta; hoy es un componente chico.
- El parte automático al abrir el panel se resolvió con un punto de aviso en el orbe, para no tapar la pantalla de golpe.
- Las operaciones del catálogo cuya clave contiene lanzar, reanudar, publicar o enviar quedan fuera de Jarvis (por ejemplo, «publicar agente»).

## Herramientas usadas en esta vuelta

Ver el informe final del agente.
