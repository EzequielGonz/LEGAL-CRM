# 22 · Plan del panel (pedido del 27/11)

> **APROBADO por el dueño el 27/11.** Se ejecuta desde las 9:00 (Argentina). Sus decisiones están en `02-ordenes-vigentes.md`, sección «Aprobación del plan y decisiones del dueño, 27/11», y **mandan sobre «Opciones que tomo si el dueño no dice otra cosa» de este documento**: Oficina sin límite de alcance y con respuestas que compiten (arena); plantilla directa desde el chat con la ventana cerrada, sin tope; ficha sin ocultar datos; sin código para enviar; internet del Cerebro encendido; los captados actuales los decide él; Marketing siempre intenta la llamada.

**Estado al 27/11, dicho sin vueltas: de este pedido todavía no hay nada implementado en el código.** Hasta acá se hizo el relevamiento: 140 hallazgos (con la revisión final y seguridad) con pasos y archivos, por área, en `cerebro/biblioteca/analisis-2026-11-27/`; el recorrido propio del panel (`24-…`); y el dossier de gustos (`23-…`). Este documento ordena la ejecución.

## Lo que ya decidió el dueño (manda sobre todo lo demás)

| Tema | Decisión |
|---|---|
| Jarvis y el código | No cambia código: «dejá, olvidate que cambie el código». Lo deja como pedido en la Bandeja para Claude. |
| Penal y Civil | Queda una sola línea: la de Civil. |
| Qué es un captado | Sale de los chats y del entrenamiento que ya existe: captado es quien pidió o aceptó la llamada o el contacto de una persona. |
| Gemini | Se mantiene el tope de USD 30 por mes, compartido con los bots. |
| Diseño | **No es un rediseño drástico.** Queda tal cual está y se mejora un poco. Las animaciones y el Cerebro le encantan: lo que falta es que funcionen. Los colores pastel de las cajas no van («infantiles y de colegio»). |

## Tandas de trabajo

Cada tanda toca archivos distintos, así pueden avanzar en paralelo en copias separadas. Todas cierran con verificación (tipos, lint, pruebas unitarias) y revisión cruzada antes de publicar.

| Tanda | Punto del pedido | Qué se hace | Detalle |
|---|---|---|---|
| **1 · Oficina** | 1 | Selector de alcance con «Los 4 rubros» (una tarea por rubro) y «Todo el panel». Aviso honesto cuando Claude no está conectado (hoy dice «arrancó» y no arrancó). Botón «Que lo haga Gemini» con su resultado marcado «hecho por Gemini, sin repasar», que no se puede aprobar hasta el repaso. Cola de repaso para Claude. Avance y resultado visibles. Bandeja de cada perfil solo con lo de ese perfil. | `oficina.md` A1, A2, B, C, D, E, F, G |
| **2 · Jarvis** | 2 y 9 | Un solo Jarvis con dos alcances (perfil y los cuatro perfiles). Adjuntar Excel, imágenes y PDF. Memoria del cerebro completa y filtrada por rubro. Proponer «reabrir con plantilla» y siempre preguntar antes. Se retira el «asistente general» de menús y textos (se archiva, no se borra): quedan Jarvis y Bandeja para Claude. | `jarvis.md` 1 a 5, 7, 8 |
| **3 · Cerebro que funcione** | 3 | «Preguntale» responde con IA sobre toda la memoria y dice de dónde sale. «Enseñale» se nota al preguntar. «Ordenale» crea la tarea con el alcance elegido y muestra su estado real. Pendientes de los dueños: marcar hecho, responder y delegar, guardado en la base. Salud dentro del Cerebro con sus botones de arreglo. Mapa con búsqueda que lleva al archivo. Laboratorio con cifras reales. Texto encimado corregido. Aprende solo: informe semanal del panel (velocidad, bots, diseño) que se suma a la memoria sin pisar. La animación no se toca. | `cerebro.md` 1 a 12 |
| **4 · Chats y ficha** | 5 | Botón «Reabrir con plantilla» en el chat y en la ficha cuando pasaron 24 horas, con vista previa y confirmación. La ficha muestra todas las columnas del Excel. El bot también las recibe. «Qué sigue» deja de mandar a responder cuando la ventana está cerrada. | `chats.md` 1, 3, 4, 7 |
| **5 · Plantillas y línea única** | 7 | Asignación manual de plantillas a la vista, ordenada por uso (primer mensaje, seguimiento, recontacto, reapertura), con cuál sale hoy. Penal se une a Civil: una sola línea y un solo bot de Jurídico; lo de Penal se archiva. | `chats.md` 2, 5, 6 · `bots.md` 8 |
| **6 · Bots por rubro** | 4 y 9 | Cada rubro ve y toca solo sus bots (rutas y selectores filtrados, con comprobación en el servidor). Biblioteca y Comparar agentes pasan a pestañas dentro de «Bot IA» y hacen algo: asignar versión, comparar dos versiones con las mismas preguntas. El Laboratorio general se reparte por perfil. | `bots.md` 1 a 7, 9, 10 |
| **7 · Captados** | 8 | El bot solo marca captado con prueba de que pidió o aceptó la llamada o el contacto. Lista única de captados con esa prueba a la vista y el estado de la llamada. Reclasificación de los 36 actuales con «Deshacer» por fila, sin borrar nada. | `captados.md` 1 a 5, 9 |
| **8 · Hoy compacto y velocidad** | 10 y 6 | Hoy: «Para decidir» arriba con sus botones, cada cifra una sola vez y con enlace, botones que hoy solo recargan corregidos. Una sola fuente para las cifras, así dejan de contradecirse entre pantallas. Hoy y Salud pasan de 12 segundos a menos de 3 (lecturas en paralelo y caché corto). Avisos fijos en una sola línea. | `captados.md` 6, 7, 8 · `velocidad.md` 1 a 4, 7 · `navegacion.md` |
| **9 · Retoque visual** | 6 | Mismo panel, mismos bloques y animaciones. Cajas sin pastel (tonos profundos con letra clara y anillo dorado). Tarjetas de perfiles: bordes, logos al tamaño correcto y color de marca bien leído. Tipografía: de cinco familias a las dos de siempre, bien cargadas. Contrastes que hoy fallan. Entrada 3D en lugar de la lámpara. Va después de que el dueño elija entre las variantes de color. | `diseno-auditoria.md` 1 a 6, 8, 10 |

**Orden.** Primero 1, 2, 3 y 4 juntas (son lo que más reclamó). Después 5, 6, 7 y 8. La 9 cuando elija el color.

## Orden de ejecución, corregido por la revisión final

La revisión final (`biblioteca/analisis-2026-11-27/critica.md`) comprobó en el código lo que dijeron los especialistas y encontró que varias tandas querían tocar los mismos archivos. Para que no se pisen, la ejecución queda en fases, con dueño único por archivo:

| Fase | Qué | Cuándo |
|---|---|---|
| 0 · Contratos | Reparto de números de migración, tipo de alcance compartido y lista de archivos de cada fase. Un solo agente, antes de todo. | Primero |
| A1 a A8 | Las tandas 1 a 8 de arriba, en paralelo, cada una con sus archivos: Oficina y Bandeja · Jarvis · Cerebro · Plantillas y línea única · Bots · Captados · Velocidad y cifras · Chats y ficha. | En paralelo |
| B1 | Menús y navegación: un solo agente toca `menu.ts` y `menu-mas.tsx` después de integrar las fases A. | Después de A |
| B2 | Hoy compacto, usando las cifras únicas y la lista de captados ya hechas. | Después de A |
| B3 | Jarvis dispara conversaciones con plantilla y el bot usa los datos del Excel. | Después de A6 y A8 |
| C | Retoque visual. | Cuando el dueño elija el color |
| D | Repaso cruzado con varios modelos, pruebas y cierre. | Al final de cada fase |

**Tres cosas que la revisión corrigió.**
- El tope de gasto de Gemini ya existe y funciona para los bots y Jarvis; falta conectarlo a la Oficina y a «Preguntale».
- En los datos no hay mezcla de rubros: cada conversación está en su rubro. La mezcla que ve el dueño está en las pantallas (Bot IA, Laboratorio general) y en el texto base común de los bots.
- El cartel de Hoy «Campaña con fallas · X no salieron» es falso: suma las fallas de todo el perfil en 24 horas, no las de esa campaña. Entra en la tanda 8.

**Límite real de «Gemini si no hay uso en Claude».** El panel no puede saber cuánto uso le queda al plan de Claude. Lo que sí puede ver es si Claude tomó la tarea. Por eso Gemini entra por botón, o si el dueño lo pide, cuando Claude no la tomó en 30 minutos.

**Internet para el Cerebro.** La búsqueda de Google desde Gemini puede cobrarse fuera del cupo gratis. Queda apagada hasta que el dueño decida.

**Seguridad (16 hallazgos en `seguridad.md`).** Lo urgente sigue siendo cambiar el código de ingreso. Además: enviar a personas pasa a pedir el código (hoy alcanza con una casilla), Salud deja de mostrar el nombre de un prospecto en una alerta y lo aprendido se filtra por rubro.

## Opciones que tomo si el dueño no dice otra cosa

- Gemini en la Oficina entra solo cuando se aprieta «Que lo haga Gemini»; no arranca solo.
- Lo hecho por Gemini no se puede aprobar hasta que Claude lo repase.
- «Los 4 rubros» crea una tarea por rubro, cada una con su resultado. «Todo el panel» puede comparar cifras agregadas, sin datos de personas.
- Reabrir con plantilla: una por contacto cada 72 horas, con confirmación cada vez y dentro del horario de 8 a 21.
- La ficha muestra todo el Excel; diagnóstico y lesión quedan detrás de «ver datos sensibles».
- Captado incluye aceptar que lo contacte un asesor por WhatsApp, no solo una llamada telefónica.
- Marketing: pedir presupuesto queda como «Interesado»; captado es quien pide reunión o llamada.
- La lista única de captados vive dentro de Contactos.

## Lo que necesita al dueño

1. **Que los pedidos lleguen a Claude:** cargar en Vercel `OFICINA_DISPARO_URL` y `OFICINA_DISPARO_TOKEN` (salen de la tarea programada «Oficina · procesar tareas» en claude.ai/code). Sin eso, Claude solo toma tareas cuando alguien escribe «oficina» en un chat. El panel va a decirlo claro en vez de mostrar «arrancó».
2. **Cambiar el código de ingreso** (urgente: quedó en el historial y el repositorio es público).
3. **Plantilla de reapertura:** si hace falta una nueva por rubro, Claude la deja lista y el dueño la manda a revisión de Meta.
4. Elegir la variante de color del retoque visual.

## Reglas que no cambian

Nada se borra (se archiva). Rubros separados. Campañas y publicidades las lanza el dueño. Nada pago sin autorización. Producción y Preview comparten base: las pruebas no envían mensajes reales. No se pisa el trabajo de la sesión de redes (`docs/redes/`, `.claude/referencias/redes/`).
