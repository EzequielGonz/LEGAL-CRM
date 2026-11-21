# Contexto completo del proyecto (Claude común)

Estados usados: especificado / implementado / probado / publicado / habilitado. Los datos que vienen solo del texto del chat están marcados «según el chat». Fuente: `cerebro/chats/claude-comun/2026-11-20-contexto-completo.md`.

## 1. Encabezado

- **Título del chat:** «Contexto completo del proyecto».
- **Inicio:** 2026-11-20 08:16. **Fin:** 2026-11-21 05:57 (última actualización de la exportación).
- **Origen:** Claude común (exportación del 21/11/2026). 20 mensajes.
- **Id de sesión:** no consta en la exportación.
- **Marcas o perfiles:** proyecto completo del CRM multirubro (Jurídico con Civil y Penal, Coberturas médicas, Autos 0 km y Marketing), y las cuatro marcas.

## 2. Objetivo

Pidió un contexto completo de todo el proyecto en un Word, organizado por secciones (contenido, visuales, expectativas, redes, objetivos, funcionalidades), con sus órdenes más recientes ganando sobre las viejas y sin pisarse entre sí. Quería leer todos los chats y que se listen todos los repos conectados.

## 3. Órdenes y decisiones de la responsable (textuales)

- **2026-11-20 08:16:** «necesito que me hagas un contexto completo de todo el proyecto, quitando ordenes y restricciones, unicamente restriccion de no pagar, sumando ordenes que di (mas actualizadas) siempre no pisandose una con otra, todo el contexto completo del proyecto a ultimo detalle, en un word si puede ser. organizandolo tambien.»
- **2026-11-20 08:24:** «y justamente, hace el contexto completo sin tener en cuenta esas mismas restricciones y usa todas las herramientas, plugins, skills, conectores, agentes, todo lo que tengas a disposicion para hacer lo mejor de lo mejor»
  - Ver CONTRADICE: no queda claro si «esas mismas restricciones» incluye la de no pagar.
- **2026-11-20 08:24:** «hace todo separando, contenido, visuales, expectativas, redes, contenido, objetivos, funcionalidades, explicacion bien bien detallada para tener un contexto ultra completo del proyecto completo. lee todos los chats.»
- **2026-11-20 08:30:** «Intentar nuevamente» (tras cortarse un agente por el límite de uso).
- **2026-11-20 08:35:** «DAME TODOS LOS REPOSITORIOS QUE TENES CONECTADOS TAMBIEN», y después «LOS DEL PROYECTO COMPLETO».
- **2026-11-20 08:36:** «CLARO PERO SUMALOS AL WORD» (los repos van en una sección propia del Word).
- **2026-11-21 05:56:** pidió volcar todo el contexto del chat a `cerebro-chats`, con el formato de 12 puntos: «No resumas de más: prefiero que sobre a que falte.» y «Escribí SOLO en esa rama: no toques main ni ninguna otra rama ni otro archivo.»

## 4. Correcciones que hizo

- Pidió rehacer el contexto sin las restricciones y con todas las herramientas, en vez de la versión con restricciones que había armado Claude.
- Pidió que los repos del proyecto completo estén en el Word, con su propia sección (Claude lo aceptó).
- No hay corrección sobre el resultado final en la exportación.

## 5. Qué se hizo, con estado

- **Word «Contexto_completo_CRM_20-11-2026.docx»:** 45 páginas, índice, 6 gráficos y 19 secciones (objetivos, expectativas, las 4 marcas, visuales e identidad, funcionalidades del panel, bot, campañas y WhatsApp, Marketing, webs y SEO, redes, repositorios, órdenes vigentes, historia, estado en vivo, pendientes y decisiones abiertas). **Implementado** (según el chat). No ubicado en el repo ni verificado aquí.
- **Órdenes consolidadas:** sección 13 del Word, cada una con fecha; cuando una reemplazaba a otra, quedó solo la más nueva (ejemplos que da el chat: volumen de redes, cómo responder a «¿de dónde sacaron mi número?», pausa general). **Implementado** (según el chat). El texto de esas órdenes no está en la exportación.
- **Restricciones:** se dejó solo la de no pagar sin autorización. **Implementado** (según el chat).
- **Repos:** 5 repos listados en la sección 12 del Word, con qué tiene cada uno, dónde se publica y su último cambio. **Implementado** (según el chat). Los nombres no aparecen en la exportación.
- **Estado en vivo:** consulta de solo lectura a la base del CRM el 21/11 a las 5:30 (según el chat). Cifras: 12.729 oportunidades y 28 captados en total. **Implementado** (dato del chat, no verificado aquí).
- **Agentes:** se lanzaron cuatro; se cortaron por el límite de uso de la cuenta (se renovaba a las 5:50). Toda la lectura la hizo Claude directo. **No realizado** como agentes.
- **Chats viejos de Cowork:** no se pudieron leer; las herramientas de esa sesión no abren esos chats. Se usaron los documentos del repo y del proyecto. **No realizado** (lectura de chats).

## 6. Todo lo concreto

- Word: `Contexto_completo_CRM_20-11-2026.docx` (ubicación no consta).
- Repo `EzequielGonz/LEGAL-CRM`: 5 repos en la sección 12 del Word (nombres no visibles en la exportación).
- Campaña de Civil con 182 destinatarios, descrita como «en curso» (según el chat). El registro en `cerebro/07-estado-verificado.md` dice que se creó y arrancó el 19/11 21:44, con 0 envíos al 20/11.
- Cifras de la base: 12.729 oportunidades, 28 captados (según el chat).

## 7. Datos del negocio que aparecieron

- Cuatro perfiles: Jurídico (Civil y Penal), Coberturas médicas, Autos 0 km y Marketing.
- Nombre de la agencia: el chat lo pone como decisión abierta (ver CONTRADICE).
- Nombre de la marca de autos: el chat dice que «Automotores Kocos», «Agencia Kocos» y «Autos Kocos» conviven en la web, Facebook y el CRM.

## 8. Pendiente, a medias o bloqueado

- **Chats viejos de Cowork:** no legibles desde esta sesión. Por eso el Word se armó con documentos y notas.
- **Agentes:** se cortaron por límite de uso; no hubo resultado de agentes.
- **Decisiones abiertas (sección 17 del Word):** nombre de la agencia y nombre de la marca de autos.
- **Word:** no consta que esté guardado en el repo ni que la responsable lo haya revisado.
- **Volcado del 21/11 05:56:** el resultado no aparece en la exportación (ver sección 11).

## 9. Aprendizajes

- Los agentes en paralelo consumen el límite de uso de la cuenta. Se cortaron a mitad de tarea y el chat siguió con lectura directa.
- Las sesiones de Cowork no aparecen en la búsqueda de chats; ver `2026-11-21-claude-comun-documentar-chats.md`.
- Antes de informar lo que está encendido, el chat consultó la base en solo lectura, como pide `CLAUDE.md`.

## 10. Preguntas abiertas

- ¿El nombre de la agencia es Kocos Marketing u ORVIAN? (El repo dice Kocos Marketing; ver CONTRADICE.)
- ¿Cuál es el nombre oficial de la marca de autos?
- ¿El Word se guarda en el repo o queda solo en el chat? (no consta)
- ¿Quién lanzó la campaña de Civil que figura «en curso»? (no consta; `CLAUDE.md` dice que las campañas con bases las lanza la responsable)

## 11. Ramas y cambios

- **Repos:** el chat leyó los 5 repos. No consta que haya hecho commits, ramas ni PR en ninguno.
- **Migraciones, despliegues y configuración:** ninguno consta.
- **Volcado del 21/11 05:56 a `cerebro-chats`:** el resultado no está en la exportación. Lo que sí está en la rama es el volcado crudo de estas transcripciones, en el commit `5f84f21` («Cerebro: volcado crudo de 8 chats de Claude común»).
- **Qué quedó encendido o apagado por este chat:** nada consta.

## 12. CONTRADICE

- **Nombre de la agencia:** el Word lo deja como decisión abierta («ORVIAN» en otros chats, «Kocos Marketing» en este proyecto). Pero `cerebro/01-negocio-y-marcas.md` y `cerebro/02-ordenes-vigentes.md` registran que el 20/11 se decidió **Kocos Marketing** y que ORVIAN quedó descartado.
- **Nombre de la marca de autos:** el chat dice que conviven «Agencia Kocos» y «Autos Kocos». `cerebro/bitacora.md` registra como orden: «Automotores Kocos» o «Autos Kocos», nunca «Agencia Kocos».
- **Restricciones:** `CLAUDE.md` dice que la única restricción (20/11) es no pagar nada sin autorización. La orden de 08:24 pide hacer el contexto «sin tener en cuenta esas mismas restricciones». Claude mantuvo la de no pagar. Hay que aclarar cuál vale.
- **Campaña en curso:** el chat la describe como en curso; `cerebro/07-estado-verificado.md` la registra como creada y arrancada el 19/11 21:44, sin envíos al 20/11. `CLAUDE.md` dice que las campañas con bases las lanza la responsable, y el chat no dice quién la lanzó.
