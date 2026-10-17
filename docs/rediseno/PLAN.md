# Rediseño integral del CRM · plan por bloques (17/10/2026)

Pedido de la responsable del 17/10, basado en la auditoría del panel publicado. Objetivo: un CRM sobrio y profesional, con la operación diaria simple y toda la configuración disponible en apartados avanzados.

**Se conserva**: datos, reglas comerciales, agentes, estados internos, historial, archivos originales con todas sus columnas, integraciones, logos originales sobre placa negra, paletas aprobadas, vistas previas sin publicación, separación entre mensajes y personas en las métricas y el estado operativo vigente (pausa general levantada el 16/10, campañas sin iniciar). El rediseño no envía mensajes, no inicia campañas y no cambia la base salvo que un bloque lo diga y se pruebe aparte.

## Niveles de evidencia
Implementado → Desplegado → Comprobado automáticamente → Revisado visualmente → Probado funcionalmente. Cada bloque cierra declarando cuáles alcanzó y con qué límites. Un despliegue READY no acredita los demás.

## Bloques

| # | Bloque | Alcance |
|---|---|---|
| 1 | Navegación y accesibilidad base | Contexto de regreso en toda la cadena lista → ficha → conversación; Oportunidades dentro del panel; diálogo de seguimiento en vivo; etiquetas asociadas; anclas de Salud; desborde horizontal; contraste del placeholder. |
| 2 | Marca y fuente única | Fuente de marca coherente (menú, selectores, Contenido, Configuración) con vista previa, origen y superficies afectadas; claves de color (`principal`/`primario`); marca maestra en SVG con variante monocroma; favicon, icono de app, manifest y Apple Touch; títulos «Pantalla · Marca»; tamaño óptico de los cuatro logos. |
| 3 | Configuración completa y pantallas habituales | Ajustes del perfil y generales con navegación interna, búsqueda y secciones avanzadas (Perfil y marca, Canales y WhatsApp, Agenda y horarios, Automatizaciones, Agentes, Notificaciones, Acceso, Sistema e integraciones), guardado con alcance explícito; menú común por tareas; Salud y alerta global compactas; Estadísticas uniformes; Fichas unificadas; Inbox, Seguimiento, Agenda, Casos, Bases, Campañas, Contenido, Agentes, Resultados, Comparación y Revisión reorganizadas; Marketing con entrada común a sus dos circuitos; Teléfono. |
| 4 | Sistema visual y movimiento | Inter para la operación y Playfair solo en marca e ingreso; escala 14–16 px, metadatos desde 12 px, títulos 28–32 px; cifras tabulares; cabecera, márgenes y anchos comunes; botones, pestañas y estados completos; iconos sin emojis; colores de marca por función con contraste comprobado; se quitan inclinaciones 3D, luz que sigue al cursor y animaciones ambientales; consolidación de `premium.css`, `estudio.css`, `inmersivo.css` y `escena.css`; `prefers-reduced-motion`. |
| 5 | Verificación integral | Cuatro perfiles, escritorio y teléfono, desde 320 px, zoom, teclado, movimiento reducido; registro de límites y pendientes. |

## Niveles de detalle: Simple y Avanzado (pedido del 17/10)
- **Selector global** «Simple / Avanzado» en la cabecera de todas las pantallas del perfil (y en la barra del teléfono), con la misma posición en todos lados. Grupo de opciones con flechas, opción activa marcada con texto y forma, aviso para lector de pantalla y sin animación con movimiento reducido.
- **Primera entrada en Simple.** La elección se recuerda por navegador (cookie `crm_nivel`, un año) y se conserva entre secciones y perfiles. No es configuración del negocio: no se guarda en la base.
- **Solo presentación.** Las dos vistas usan los mismos datos, permisos, validaciones y reglas. Cambiar no guarda, no envía, no publica, no activa automatizaciones, no evalúa, no entrena y no genera gastos. Nada se desmonta: se conservan perfil, sección, registro, búsqueda, filtros, página y borradores.
- **Simple** responde qué pasa, qué requiere atención, qué hacer ahora y cuál es el siguiente paso. **Avanzado** conserva toda la configuración y capacidad.
- **«Personalizar» / «Ver configuración completa»**: pasan a Avanzado y abren el grupo o campo exacto (abre secciones plegadas y lleva el foco), con regreso. `?nivel=avanzado` en un enlace hace lo mismo.
- **Contenido primero:** crear contenido con recorrido guiado (qué decir, canal, datos imprescindibles, vista previa, siguiente acción), piezas que requieren atención, borradores, calendario, publicadas y resultados. Si falta un dato imprescindible, «Completar configuración» abre ese campo. «Guardar borrador», «Programar» y «Publicar» se explican con condiciones y consecuencias; publicar sigue sujeto a la política habilitada por la responsable.

## Estado por bloque
| Bloque | Estado | Commit |
|---|---|---|
| 1 | Implementado, en Preview y comprobado en el entorno aislado: 47/47 sobre `566ade8`. Revisión visual pendiente | `568edea` |
| 2 | Implementado: fuente única de marca, `logo_panel` (migración 0400 aplicada), favicon e iconos, manifest, títulos «Pantalla · Marca». Comprobado en el entorno aislado (N6, N7). Revisión visual pendiente | `5531880`…`566ade8` |
| 3 | En curso: selector, Inicio, Contenido guiado, Configuración en 8 grupos, ficha. Faltan Salud, Estadísticas, Bases, Campañas, Inbox, Seguimiento/Agenda, Agentes, Comparación, Revisión, Teléfono y circuitos de Marketing. Lo hecho: 45/45 en el entorno aislado (N1–N12) | hasta `566ade8` |
| 4 | Pendiente | — |
| 5 | Pendiente | — |

## Matriz de hallazgos → bloque

| Hallazgo de la auditoría | Bloque |
|---|---|
| Oportunidades sin menú; «Cambiar de lista» ocupa el primer pantallazo; «Volver» lleva a `/inicio` | 1 |
| Prospectos: la ficha debe conservar búsqueda, filtros y página; filtros activos visibles | 1 |
| Ficha → «Ver conversación» pierde el origen; Inbox → ficha completa pierde el regreso | 1 |
| Seguimiento en vivo: foco afuera, Escape no cierra, Tab llega al fondo | 1 |
| 90 de 94 campos de Configuración sin etiqueta asociada | 1 (etiquetas) y 3 (reorganización) |
| `/configuracion#tareas` no existe | 1 |
| Desborde de 61 px a 1363 px | 1 |
| Placeholder `#9F9993` sobre blanco (2,82:1) | 1 |
| Logos de `MARCAS` prevalecen sobre la configuración; «falta color primario» con paletas cargadas | 2 |
| Marca general genérica; favicon «E»; título «Panel de Captación Legal» en todos los perfiles | 2 |
| Playfair en encabezados operativos; tamaños chicos; cifras editoriales | 4 |
| Anchos y componentes distintos entre módulos; emojis en cabeceras | 4 |
| Ingreso con lámpara protagonista y partículas | 4 |
| Selector de dispositivo antes de entrar | 3 |
| Selector de perfiles con logos desparejos y estadísticas vacías | 2 y 3 |
| Menú distinto por perfil sin justificación (Estadísticas e Inbox solo en Jurídico) | 3 |
| Salud: barra y tablero con cifras distintas; mezcla de bloqueo, apagado, pendiente y experimento | 3 |
| Alerta global con instrucciones técnicas en casi todas las pantallas | 3 |
| Estadísticas: tarjetas con y sin detalle; Marketing con otra estructura | 3 |
| Fichas con dos presentaciones y acciones al mismo nivel | 3 |
| Inbox con alerta que desplaza y estado vacío grande | 3 |
| Seguimiento: explicación y edición del intervalo antes de la cola | 3 |
| Agenda tabular mezclada | 3 |
| Casos / Clientes cerrados con nombres distintos | 3 |
| Bases: calidad en una línea, sin búsqueda libre | 3 |
| Campañas: «Reanudar» sin línea ni plantilla confirmadas | 3 |
| Contenido sin menú, bloques vacíos y formulario extenso | 3 |
| Agentes IA: qué responde hoy vs. biblioteca | 3 |
| «Ver resultados» abre una evaluación nueva | 3 |
| Comparación de agentes en una sola página extensa | 3 |
| Revisión con incidencias repetidas por persona | 3 |
| Configuración: Jurídico con más de 200 controles, otros perfiles cortos | 3 |
| Marketing: dos circuitos, cola vs. envío automático, horarios 9–20 vs. 8–21, plantillas reales, borrador vs. envío en Presupuestos, responsable y vencimiento | 3 |
| Teléfono: «Guardar base (no envía mensajes)» como acción principal de «Iniciar campaña» | 3 |
| Movimiento: 3D, luz al cursor, animaciones continuas | 4 |

## Cómo se comprueba cada bloque
- Automático: `typecheck`, `lint`, unitarias y `build` (en un Sandbox temporal de Vercel, porque esta sesión no alcanza el registro de npm).
- Visual y de teclado: navegador automatizado contra la app levantada en el Sandbox con una base local de datos inventados (sin datos reales, sin Meta), en 320, 390, 768, 1280, 1363 y 1440 px, zoom 200 % y movimiento reducido.
- Funcional con efectos: solo en ese entorno aislado. La Preview comparte base con producción: ahí solo se mira.
- Teléfono físico y la versión publicada con la sesión real: los revisa la responsable; no se dan por comprobados desde el escritorio.
