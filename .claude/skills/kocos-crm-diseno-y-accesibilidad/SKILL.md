---
name: kocos-crm-diseno-y-accesibilidad
description: Experiencia del panel del CRM y modo teléfono - rediseñar y comprobar cualquier pantalla cuando cambien navegación, recorridos, componentes, estadísticas, formularios, listas, fichas o estados; sistema visual común, accesibilidad (WCAG 2.2 AA, 44 x 44 px, foco visible) y textos en español rioplatense. Usar al crear, cambiar o revisar pantallas, componentes, estilos o recorridos.
---

# Experiencia del panel, diseño y accesibilidad

Cubre el procedimiento «crm-panel-experience» (parche 2.0, sección 25.1). La prioridad es que el panel sea claro, visual, rápido y útil: un cambio de colores sin modificar los recorridos no cumple. Las reglas de negocio están en `.claude/referencias/reglas-comunes.md`.

## Lo que el panel tiene que lograr (parche 2.0, secciones 4 a 13)

- **Al entrar**, cada perfil responde qué resultados hubo, qué conversaciones avanzan y qué necesita acción: captados por derivar, solicitudes humanas comerciales, seguimientos activos y próximos contactos. Las incidencias técnicas e históricas van a un nivel secundario.
- **Mismo menú y estructura en los cuatro perfiles**: Inicio o Estadísticas, Inbox, Prospectos, Captados, Bases, Agenda, Campañas, Agentes IA y Configuración; Resultados web y Contenido automático cuando existan. Marketing aloja sus particularidades dentro de las vistas comunes, sin un segundo CRM. Perfil activo visible en el encabezado con cambio sencillo.
- **Indicadores que abren personas**: cada cifra abre el listado del mismo conjunto, período, campaña, fuente y unidad, con acceso a ficha y conversación. Cero abre una vista vacía con contexto; «Sin datos» se distingue de cero. Nada de tarjetas con aspecto de botón que no funcionan, gráficos ficticios ni botones que abren pantallas vacías.
- **Ficha común** desde cualquier lugar (panel lateral o página completa; pantalla completa en teléfono) con Resumen, Conversación, Datos, Archivos e Historial. Al cerrar, se conservan filtros, orden, período y posición; un borrador no se pierde; una actualización no desplaza al operador.
- **Inbox**: búsqueda evidente en todo el servidor, filtros activos visibles, vistas rápidas (Todas, Requieren una persona, En seguimiento, Captados que volvieron a escribir); los rechazos resueltos no dominan la bandeja.
- **Prospectos**: vistas Todos, Sin contactar, En conversación, Seguimiento, Captados y Detenidos; filtros detallados en panel expandible y guardables; fila con nombre, teléfono legible, etapa, fuente, última actividad y próxima acción; columnas y orden configurables en PC.
- **Bases y Campañas**: panorama con resultados antes del detalle; creación de campaña en tres pasos (base y objetivo; agente y línea; programación y resumen) con lo técnico en Avanzado; una pausa explica su causa en lenguaje práctico.
- **Agenda**: citas, tareas y contactos profesionales, Hoy, Próximos y Pendientes; sin cupos artificiales de disponibilidad de IA; resultado posterior a la derivación separado.
- **Atención humana**: solicitudes reales con persona, motivo, último mensaje útil, estado, antigüedad y acción (Abrir conversación, Tomar, Resolver, Devolver a IA); archivo secundario de detenidos e incidencias.
- **Agentes IA**: biblioteca con principal, cuatro derivados y agentes nuevos; prompts extensos en Avanzado; «Sin evaluación todavía» cuando no hay resultados.
- **Una acción principal por vista** y acciones secundarias en contexto. Un control sin backend se muestra como pendiente con motivo, nunca como función terminada.

## Sistema visual propuesto (a validar en prototipos, no es regla de negocio)

Superficies claras, texto principal oscuro, texto secundario con contraste, un acento configurable por perfil; escala de espacios de 8 px; texto habitual de 14 a 16 px; títulos de pantalla de 24 a 30 px; valores de indicadores mayores que sus etiquetas; tipografía sans serif legible. Evitar zonas vacías sin propósito, textos azules muy claros, formularios nativos sin jerarquía, párrafos de configuración en el centro, animaciones que dificulten leer, y dorado, sombras o efectos que oculten una navegación poco útil. Componentes pulidos en carga, error, éxito, deshabilitado, seleccionado y foco.

Tokens actuales: `slate` redefinido como paleta navy y `gold` para acentos (`tailwind.config.ts`, `src/app/globals.css`); componentes base en `src/components/ui/`. Cambiar un token afecta a todo el panel: en un bloque propio, con capturas antes y después.

## Accesibilidad (objetivo WCAG 2.2 AA, comprobado por criterio)

- Foco visible siempre: `outline-none` solo con un reemplazo `focus-visible` de 3:1 contra el fondo. Hoy los campos usan `.focus-gold` (2,1:1 sobre blanco): no cumple.
- Contraste medido con la paleta actual: `slate-500` sobre blanco 4,98:1 (texto normal, cumple); `slate-400` sobre blanco 3,10:1 y sobre `slate-50` 2,92:1 (solo texto grande o nada); `gold-500` sobre blanco 2,10:1 (ningún texto); `gold-500` sobre `slate-900` 8,08:1.
- Objetivos táctiles de 44 × 44 px en acciones; nombres accesibles (`aria-label` en botones de solo icono, `<label>` en campos, errores con `aria-describedby`); estados que no dependen solo del color; `prefers-reduced-motion`; zoom al 200 % sin scroll horizontal; `lang="es"`, voseo, verbos de acción, sin emoji como iconos; nada de datos personales en capturas.
- Teléfono: listas y tarjetas útiles, detalle expandible, acciones grandes; mantener campaña, resultados, clientes captados y compartir.

## Procedimiento para rediseñar una pantalla

1. Leer la regla vigente en la referencia y el componente real; identificar la acción principal y los datos necesarios.
2. Proponer jerarquía y detalle progresivo; reutilizar el sistema visual, la ficha común y los filtros existentes.
3. Convertir cada indicador de personas en acceso al conjunto correcto (misma definición que el contador).
4. Implementar en el código real, no en un prototipo, y registrar por cada botón qué hace, qué cambia y cómo se verifica.
5. Probar vacío, carga, error, con datos, filtros sin resultados, teclado, teléfono (375 px) y retorno al listado; comparar los cuatro perfiles y el cambio de modo.
6. Entregar pantallas implementadas, cambios de recorrido y evidencia visual con datos sintéticos; listar los criterios WCAG revisados con cumple, no cumple o no comprobado (caso V10 y A02 a A07, A33, A34).

## Skills de terceros que ayudan (ver `.claude/skills/PROCEDENCIA.md`)

`interface-design` (dirección visual del panel), `ui-ux-pro-max` (consultas a su base local: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --domain ux`), `web-design-guidelines` (revisión de un archivo contra las pautas de Vercel), `vercel-react-best-practices` (rendimiento), `frontend-design` (solo landings o piezas de marca). Las guías no reemplazan estas reglas ni las del documento único.
