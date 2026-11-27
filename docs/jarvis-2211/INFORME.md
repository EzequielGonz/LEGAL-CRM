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

## Vuelta 6 (22/11, noche): Jarvis vivo, con gráficos y más funciones

Pedido del dueño: «Jarvis lo mismo, antes estaba con gráficos de estadísticas mejor armado», «que Jarvis pueda hacer TODO, preguntándome antes siempre», y aplicar las marcas que hizo sobre el video de diseño (bento de colores, vidrio sobre círculos, botones neumórficos, gradient mesh en tarjeta, parallax y carteles), **sin** fondo de manchas en el panel.

### Qué cambia a la vista

- **Orbe flotante vivo** (`jv-orbe-vivo.tsx`, canvas 2D, sin WebGL): respira, el plasma gira, brilla y el reflejo sigue al mouse; al pensar, hablar o escuchar se ilumina y le salen ondas. Contador rojo con lo que espera el OK. Quieto con «reducir movimiento»; se pausa fuera de pantalla o con la pestaña oculta.
- **Modo Jarvis inmersivo** (`jarvis-hoja.tsx`): vidrio a pantalla completa sobre el panel desenfocado. Siempre modal (foco atrapado, Esc cierra, el foco vuelve al orbe o a donde estaba; Ctrl/Cmd+J abre y cierra).
  - Bento de colores con gráficos animados (`jv-bento.tsx`, `jv-graficos.tsx`): saludo en tarjeta gradient mesh con cartel palabra por palabra; mensajes de la semana (área por día); captados (barritas por día); esperan respuesta (aro); derivados; respondieron (porcentaje); semana contra la anterior; campañas recientes (enviados y respuestas).
  - A la derecha: acciones como botones neumórficos, «Esperan tu OK» en tarjetas de vidrio sobre círculos de color que flotan, e historial del día en línea de tiempo.
  - Charla: la respuesta se escribe en vivo (el texto completo se lee una sola vez con lector de pantalla), tarjetas ricas (barras, personas con nombre corto, estado de líneas), onda del micrófono al dictar y lectura en voz alta apagable (Web Speech API, sin servicios pagos).
- **/asistente** como pantalla completa con el mismo lenguaje: cabecera mesh con parallax y orbe grande, bento de los cuatro perfiles (respuestas por perfil, chats que piden una persona, captados, derivados, citas, semana contra la anterior), charla y, a la derecha, botones neumórficos y propuestas de vidrio por perfil.

### Funciones nuevas (siempre como propuesta con «¿Lo hago?»)

- Catálogo: `oficina_pedir_tarea` (POST `/api/oficina`, deja la tarea en la mesa de entrada; los agentes arrancan solo con «Arrancar ahora») y `cerebro_ensenar` (POST `/api/cerebro/conocimiento`, con la validación de siempre: sin datos de personas ni claves). Salen de `FUERA_DEL_CATALOGO`; arrancar la Oficina y aprobar entregas siguen siendo del dueño en persona.
- En todas las pantallas (`ACCIONES_SIEMPRE`): agendar una cita, mover a alguien de etapa, pedirle una tarea a la Oficina, enseñarle algo al cerebro y consultar el cerebro. Se suman a las acciones de cada pantalla (responder a los que esperan, armar campaña con una base, derivar captados…).
- Prompt v1.2: enseña esas funciones con sus herramientas y que los gráficos los arma el panel.
- `seguridad.ts` sin cambios: lo que hace salir mensajes sigue con confirmación reforzada.

### Datos

- `GET /api/jarvis/tablero?perfil=`: solo conteos del perfil pedido (enviados y captados por día en hora de Argentina, la semana contra la anterior desde `resumenSemanaEnMemoria`, hasta 3 campañas). Caché de 2 minutos en el servidor y en la sesión.
- Las tarjetas de la charla salen de lo que devolvieron las herramientas de lectura (`tarjetasDeResultados`): no se inventa ningún número.

### Pruebas

- `tests/unitarias/jarvis-tablero.test.ts`: días de Argentina, camino del gráfico, proporciones, nombre corto, tarjetas, carteles, acciones nuevas, operaciones del catálogo y prompt v1.2.
- `respuestaSinIA`: sin clave de IA (como en las vistas previas) o con el tope de gasto, «¿cómo viene la semana?» se contesta con los números del tablero y una tarjeta de barras; cualquier otro pedido explica por qué no puede pensar la respuesta. Nunca inventa.

### Verificado en la vista previa de la rama `rediseno5/parte9` (22/11)

- Capturas a 1440 y 390 del orbe (con contador y la etiqueta «Jarvis Ctrl J» al pasar el mouse), del modo Jarvis abierto con el bento y los gráficos con datos reales, de una respuesta de solo lectura («¿cómo viene la semana?») con su tarjeta, y de `/asistente`.
- Teclado: Ctrl+J abre, el foco va al campo de texto, Tab no sale del diálogo, Esc cierra y el foco vuelve al orbe. Con «reducir movimiento» todo aparece quieto en su valor final. Sin desborde horizontal en 390. En consola, solo el aviso de la barra de Vercel de las vistas previas.
- No se confirmó ninguna propuesta (la vista previa comparte base con producción).
- No verificado: la charla con la IA de verdad (la vista previa no tiene la clave de Gemini), el dictado y la voz en un navegador con micrófono y parlantes.
