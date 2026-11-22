---
description: Qué skills, plugins y agentes usa cada escritorio de la empresa de agentes, con qué aportan a los 4 rubros, qué no aplica y qué necesita cuenta o pago
actualizado: 2026-11-22
---

# Mapa de skills, plugins y agentes por escritorio

**Regla de uso.** Al empezar cualquier tarea, el escritorio busca acá qué skills y agentes aplican y usa todos los que sumen. Si una skill de terceros contradice a una skill del proyecto (`kocos-*`), prevalece la del proyecto. Nada que cueste plata o publique se usa sin el OK de los dueños: la columna «Requiere cuenta o pago» avisa dónde está el límite.

Este mapa baja a escritorios lo que `11-equipo-y-herramientas.md` define por rol y lo que `16-propuesta-empresa-de-agentes.md` propone como organigrama. Fuente: inventario de 22/11 de los plugins instalados. El inventario tiene 278 plugins instalados con 275 nombres distintos: `figma`, `operations` y `searchfit-seo` figuran dos veces.

Cómo leer la última columna: **No** = se usa ya, sin cuenta ni costo. **Cuenta; costo a confirmar** = hay que conectar una cuenta propia y no se verificó el plan. **Pago o créditos: solo con OK** = gasta plata, hay que pedir autorización antes. Un plugin puede aparecer en varios escritorios con un aporte distinto.

## Dirección (cerebro)

Prioriza, reparte, revisa y guarda memoria. Lo que importa acá: cerrar cada vuelta con evidencia y no repetir errores.

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `superpowers` | Ordena cada vuelta: pensar antes de hacer, plan escrito, reparto a agentes en paralelo y verificación antes de dar algo por hecho, para que los informes distingan especificado, implementado, probado, publicado y habilitado. | `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:dispatching-parallel-agents`, `superpowers:subagent-driven-development`, `superpowers:verification-before-completion` | No |
| `megapowers` | Corridas largas con revisión independiente y cierre verificado; `grill-me` interroga una decisión del dueño antes de ejecutarla. | `megapowers:orchestrating`, `megapowers:grill-me`, `megapowers:independent-review`, `megapowers:autonomous-run`, `megapowers:verify-and-finish` | No |
| `agent-protocols` | Plan, especificación y cierre con listas de control; sirve para partir un pendiente de `08-pendientes-y-plan.md` en pasos chicos y cerrables. | `agent-protocols:plan`, `agent-protocols:spec`, `agent-protocols:ship`, `agent-protocols:planning-and-task-breakdown`, `agent-protocols:context-engineering` | No |
| `agentic-council` | Segunda opinión por especialidad antes de decisiones caras: alcance mínimo de una idea, impacto estimado, modos de falla de un cambio en los bots. | `agentic-council:council`, `agentic-council:brainstorm`, `agentic-council:deepen`, `agentic-council:handover`, `agentic-council:strategist-mvp-scoping`, `agentic-council:strategist-impact-estimation` | No |
| `16-minds` | Debate de 16 perfiles para decisiones abiertas de `09-decisiones-abiertas.md` (nombre de una oferta, tono, prioridad); aconseja, no decide: decidel dueño. | `16-minds:cast`, `16-minds:mind`, `16-minds:pair`, `16-minds:minds`, `16-minds:voice-decide`, `16-minds:voice-vote` | No |
| `wizard` | Convierte un procedimiento que se repite (cierre de vuelta, informe del lunes) en un «hechizo» reutilizable por cualquier escritorio. | `wizard:using-wizard`, `wizard:build-spell`, `wizard:cast-spell`, `wizard:list-spells`, `wizard:chaining-spells`, `wizard:pressure-testing-a-spell` | No |
| `agent-architecture-designer` | 60 subagentes y 62 equipos prearmados (investigación, revisión, plan y ejecución) para armar rápido el equipo de una tarea grande. | `agent-architecture-designer:five-minds-strategic`, `agent-architecture-designer:decision-research`, `agent-architecture-designer:plan-exec`, `agent-architecture-designer:reflect`, `agent-architecture-designer:kb-constructor` | No |
| `context-handoff` | Escribe el traspaso de sesión (decisiones, alternativas descartadas, qué sigue) en el formato de `traspaso-sesion-*.md`. | `context-handoff:handoff`, `context-handoff:handoff-writing` | No |
| `active-memory` | Checkpoint y traspaso para pasar a un chat nuevo sin perder reglas ni correcciones; refuerza el cierre de vuelta del `README.md` del cerebro. | `active-memory:amcheckpoint`, `active-memory:amhandoff`, `active-memory:amcodeword` | No |
| `task-observer` | Convierte cada corrección del dueño en regla duradera (tabla de errores de `14-estilo-del-dueno.md`) para no repetirla. | `task-observer:task-observer`, `task-observer:learn`, `task-observer:preferences` | No |
| `agent-recovery` | Retoma una vuelta cortada (sesión caída, límite de uso) reconstruyendo el estado desde el repo y el cerebro, sin rehacer lo ya hecho. | `agent-recovery:agent-resume-plan`, `agent-recovery:agent-state-reconstruct`, `agent-recovery:agent-resume-check` | No |
| `agent-context-kit` | Ordena directivas, instructivos y scripts del cerebro; sirve para podar `CLAUDE.md` y los 17 documentos sin perder reglas. | `agent-context-kit:context-refactor`, `agent-context-kit:directives`, `agent-context-kit:how-tos`, `agent-context-kit:scripts` | No |
| `skill-discovery` | Inventario de skills e instrucciones instaladas, para cumplir «buscar más al empezar» y detectar duplicados o skills de terceros sin procedencia. | `skill-discovery:scan`, `skill-discovery:inventory` | No |
| `coding-skills` | Buscador de skills (`find-skill`) para sumar herramientas al empezar cada tarea, como pide `CLAUDE.md`. | `coding-skills:find-skill`, `coding-skills:start-here` | No |
| `kocos-cowork` | Las skills del proyecto empaquetadas para Cowork: contexto, reglas de captación, diseño, pruebas, landings y entrenamiento de agentes. Mandan sobre cualquier skill de terceros. | `kocos-cowork:kocos-crm-contexto`, `kocos-cowork:kocos-crm-reglas-de-captacion`, `kocos-cowork:kocos-crm-diseno-y-accesibilidad`, `kocos-cowork:kocos-crm-pruebas-de-aceptacion`, `kocos-cowork:kocos-landings-seo-y-conversion`, `kocos-cowork:kocos-contenido-premium`, `kocos-cowork:kocos-agentes-entrenamiento-y-evaluacion` | No |
| `kocos-eficiencia` | Tres skills breves para no repetir trabajo, mantener contexto corto y chequear el cierre antes de informar. | `kocos-eficiencia:kocos-contexto-breve`, `kocos-eficiencia:kocos-ahorro-operativo`, `kocos-eficiencia:kocos-calidad-y-cierre` | No |
| `product-management` | Especificaciones, hoja de ruta y resumen para los dueños de lo que hay que decidir; ordena pedidos nuevos antes de llegar a la bandeja. | `product-management:write-spec`, `product-management:roadmap-update`, `product-management:sprint-planning`, `product-management:stakeholder-update`, `product-management:brainstorm` | Los conectores opcionales (Jira, Notion, etc.) requieren cuenta; las skills solas no |
| `operations` | Instructivos de operación (`runbook`), registro de riesgos y estado de situación para guardar cómo se opera el CRM, los bots y el latido. Hay dos plugins con este nombre: este es el de procesos; el otro (KYC) está en «No aplican». | `operations:runbook`, `operations:process-doc`, `operations:risk-assessment`, `operations:status-report`, `operations:change-request` | Conectores opcionales con cuenta |
| `agent-estimate` | Estima esfuerzo y arma olas de trabajo para los pendientes, con rangos en vez de promesas. | `agent-estimate` | No |
| `claude-code-audit-stack` | El agente `claim-auditor` revisa las afirmaciones de un informe (porcentajes contra puntos, probabilidades encadenadas) antes de mostrarlo a los dueños. | `claude-code-audit-stack:claim-auditor`, `claude-code-audit-stack:remote-agent-dispatcher` | No |
| `codex-review` | Segunda opinión de otro modelo sobre un plan o un cambio, como pide `CLAUDE.md` para trabajos grandes. | `codex-review:plan`, `codex-review:code` | Cuenta y CLI de Codex (OpenAI); costo a confirmar |
| `codex-dispatch` | Reparte tareas acotadas a Codex con carpeta y permisos fijos, para trabajo en paralelo en copias separadas. | `codex-dispatch:codex-dispatch` | Cuenta y CLI de Codex (OpenAI); costo a confirmar |
| `mattpocock-skills` | `grilling` obliga a aclarar una idea con preguntas antes de tocar nada, y `writing-for-agents` mejora las instrucciones que se delegan. | `mattpocock-skills:grilling`, `mattpocock-skills:writing-for-agents`, `mattpocock-skills:research` | No |
| `zizi-skills` | Plan, estado y cierre de proyecto en lenguaje llano: útil para el resumen que se le entrega al dueño al cerrar la vuelta. | `zizi-skills:planning`, `zizi-skills:status-update`, `zizi-skills:project-manager`, `zizi-skills:done`, `zizi-skills:plain-language` | No |
| `memory-toolkit` | `park` aparca ideas que no son de esta vuelta sin perderlas, y `session-end` ayuda a cerrar con el formato del cerebro. | `memory-toolkit:park`, `memory-toolkit:session-end`, `memory-toolkit:session-start` | No |
| `ai-employees` | Muestra cómo se arma una carpeta por «empleado» con rutinas programadas (SEO, redes, avisos); sirve de modelo para los escritorios, sin instalar los suyos. | `ai-employees:hire` | No |

## Análisis

Cifras de campañas, bots, redes y landings. Metricool (conector, no plugin) sigue siendo la fuente de redes; Supabase, la de bots. Todos los plugins de abajo **leen**; lanzar campañas o gastar lo hace el dueño.

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `windsor-ai` | Conector ya activo en esta cuenta: junta Meta Ads, Instagram, Facebook, GA4 y Search Console en un informe diario, semanal o mensual por rubro. Escribir en las plataformas (pausar, publicar) pide confirmación expresa. | `windsor-ai:performance-review`, `windsor-ai:social-report`, `windsor-ai:instagram-report`, `windsor-ai:google-search-console`, `windsor-ai:google-analytics-4`, `windsor-ai:wasted-spend`, `windsor-ai:windsor-insights` | Cuenta Windsor y cuentas de cada plataforma; plan a confirmar |
| `supermetrics-marketing` | Informes semanales, ritmo de gasto, embudo y revisión de seguimiento de eventos para campañas de Meta y Google. | `supermetrics-marketing:weekly-performance`, `supermetrics-marketing:budget-pacing`, `supermetrics-marketing:funnel-audit`, `supermetrics-marketing:tracking-check`, `supermetrics-marketing:exec-summary` | Cuenta paga de Supermetrics |
| `adzviser` | Reporte conversacional de rendimiento y de SEO, y revisión de ritmo de presupuesto de las campañas de los 4 rubros. | `adzviser:reporting`, `adzviser:performance-review`, `adzviser:budget-pacing`, `adzviser:seo-review`, `adzviser:competitor-research` | Cuenta; costo a confirmar |
| `dataslayer-marketing-skills` | Auditoría de campañas pagas, informe por canal y rendimiento de contenido en un solo paquete con agentes en paralelo. | `dataslayer-marketing-skills:ds-paid-audit`, `dataslayer-marketing-skills:ds-channel-report`, `dataslayer-marketing-skills:ds-content-perf`, `dataslayer-marketing-skills:ds-seo-weekly`, `dataslayer-marketing-skills:ds-audit` | Cuenta; costo a confirmar |
| `socialinsider` | Comparación de cuentas propias contra competidoras en Instagram, Facebook, TikTok y YouTube, y recap de campañas. | `socialinsider:competitor-benchmark`, `socialinsider:profile-audit`, `socialinsider:campaign-recap` | Cuenta paga de Socialinsider |
| `adcopilot` | Lectura de Search Console y GA4, velocidad de página, auditoría de seguimiento de conversiones y gasto desperdiciado en Google Ads. Toda escritura se propone primero y las campañas nuevas nacen pausadas. | `adcopilot:audit`, `adcopilot:daily`, `adcopilot:weekly`, `adcopilot:measure`, `adcopilot:adcopilot-seo` | Cuenta Google (Ads, GA4, Search Console) por OAuth |
| `adspirer-advertising-agent` | Revisión de rendimiento y de gasto desperdiciado en Google, Meta y TikTok; resumen diario del estado de las campañas. | `adspirer-advertising-agent:performance-review`, `adspirer-advertising-agent:wasted-spend`, `adspirer-advertising-agent:adspirer-digest`, `adspirer-advertising-agent:adspirer-dashboard` | Cuenta Adspirer y cuentas de anuncios |
| `advisorppc` | Auditoría puntual de Google Ads y armado de reportes de pauta; solo lectura mientras el dueño no autorice otra cosa. | `advisorppc:google-ads-audit`, `advisorppc:ppc-reporting`, `advisorppc:getting-connected` | Cuenta Google Ads por OAuth |
| `adwhispr-ads` | Espía de anuncios de la competencia (los de más tiempo al aire, ángulos ganadores, palabras clave) para Autos 0 km, Coberturas y Marketing. | `adwhispr-ads:competitor-research`, `adwhispr-ads:longest-running-ads`, `adwhispr-ads:winning-angle-extractor`, `adwhispr-ads:competitor-keyword-spy`, `adwhispr-ads:niche-ad-report`, `adwhispr-ads:weekly-ad-review` | Cuenta; costo a confirmar |
| `hyper-marketing` | Biblioteca de anuncios de Meta, investigación de competidores y de clientes, e informes de analítica. `twilio` y envíos de correo frío no se usan: el canal es la API oficial de Meta. | `hyper-marketing:meta-ads-library`, `hyper-marketing:competitor-intel`, `hyper-marketing:customer-research`, `hyper-marketing:analytics-insights`, `hyper-marketing:seo-research` | Cuenta; costo a confirmar |
| `agency-mcp` | Informe y auditoría para el rubro Marketing (agencia Kocos) cuando se atiende a un cliente: auditoría, revisión semanal y reporte. | `agency-mcp:client-audit`, `agency-mcp:client-report`, `agency-mcp:weekly-review`, `agency-mcp:start` | Cuenta; costo a confirmar |
| `fullstory` | Repeticiones de sesiones y análisis de fricción en las landings: dónde se traba quien llena el formulario o toca el botón de WhatsApp. | `fullstory:friction-analysis`, `fullstory:session-review`, `fullstory:general-analysis`, `fullstory:idea-generation` | Cuenta paga de Fullstory |
| `product-tracking-skills` | Plan de eventos y medición (UTM, píxel, GA4) para que cada landing y cada bot reporten de dónde viene cada prospecto. | `product-tracking-skills:product-tracking-design-tracking-plan`, `product-tracking-skills:product-tracking-audit-current-tracking`, `product-tracking-skills:product-tracking-implement-tracking`, `product-tracking-skills:product-tracking-generate-implementation-guide` | No |
| `ux-superpowers` | Perfiles de prospecto y «trabajos a resolver» por rubro (quién consulta por una obra social, por un 0 km, por una sucesión) para orientar mensajes y bots. | `ux-superpowers:persona-builder`, `ux-superpowers:jobs-to-be-done`, `ux-superpowers:user-journey`, `ux-superpowers:ux-discover`, `ux-superpowers:insight-synthesizer` | No |
| `market-researcher` | Panorama del sector y análisis de competidores por rubro, con fuentes; útil para el plan de Marketing y para precios de referencia en Autos. | `market-researcher:sector-overview`, `market-researcher:competitive-analysis`, `market-researcher:idea-generation` | No |
| `comparative-landscape-brief` | Resumen comparativo de competidores y vigilancia de señales (cambios de oferta, lanzamientos) para los 4 rubros. | `comparative-landscape-brief:competitive-brief-generator`, `comparative-landscape-brief:signal-watch`, `comparative-landscape-brief:comparative-landscape-brief` | No |
| `brightdata-plugin` | Investigación en vivo y escucha de marca: qué dicen de la competencia y de nosotros en la web, y comparación de precios de planes y autos publicados. | `brightdata-plugin:competitive-intel`, `brightdata-plugin:brand-listening`, `brightdata-plugin:live-research`, `brightdata-plugin:price-comparison`, `brightdata-plugin:search` | Cuenta de Bright Data; uso con costo, solo con OK |
| `marketing-ideas` | Decide qué ideas de marketing merecen plata y cómo probarlas barato: ficha de prueba, repago y ranking. Alinea con la regla de no pagar nada sin autorización. | `marketing-ideas:idea-shortlist`, `marketing-ideas:idea-ranking`, `marketing-ideas:idea-payback-check`, `marketing-ideas:idea-test-card`, `marketing-ideas:idea-readout` | No |
| `marketing` | Plan de campaña, informe de rendimiento y revisión de marca con plantillas listas; los conectores opcionales leen analítica. | `marketing:campaign-plan`, `marketing:performance-report`, `marketing:competitive-brief`, `marketing:brand-review` | Conectores opcionales con cuenta |
| `search-visibility-kit` | Lectura de Search Console y GA4 y aviso de indexación (IndexNow) para el informe mensual de visibilidad. | `search-visibility-kit:onboard-site`, `search-visibility-kit:seo-audit`, `search-visibility-kit:setup-google-access`, `search-visibility-kit:indexnow` | Cuenta Google por OAuth |
| `seo-gsc-wizard` | Informe semanal de Search Console: oportunidades rápidas, canibalización entre landings, contenido que decae y salud de indexación. | `seo-gsc-wizard:weekly-report`, `seo-gsc-wizard:quick-wins`, `seo-gsc-wizard:cannibalization`, `seo-gsc-wizard:content-decay`, `seo-gsc-wizard:indexing-health` | Cuenta Google por OAuth; Bing opcional |
| `claude-code-cost` | Reporte del gasto de Claude Code por proyecto y por día, para el control de costos que piden los dueños. | `claude-code-cost:report`, `claude-code-cost:by-project`, `claude-code-cost:by-month` | No |

## Redes y contenido

Estrategia por rubro, bocetos, producción y programación en Metricool. Nada se publica sin que el dueño apruebe el boceto, y no se toca la bio ni el botón de los perfiles. Los generadores de imagen y video gastan créditos: antes de usarlos, mostrar qué se va a generar y cuánto cuesta.

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `social-media-skills` | El núcleo de redes: calendario, pilares, ganchos, guiones de Reels y TikTok, carruseles, hashtags, informes y rutina de interacción por rubro. Cuidar los límites de cada rubro y de la matrícula en VITA. | `social-media-skills:content-calendar`, `social-media-skills:content-pillars`, `social-media-skills:hook-writer`, `social-media-skills:reels-script`, `social-media-skills:carousel-writer`, `social-media-skills:analytics-and-reporting`, `social-media-skills:instagram-growth`, `social-media-skills:viral-reverse-engineering` | No |
| `vidiq` | Investigación de YouTube Shorts, TikTok e Instagram: tendencias, outliers, ideas de video y títulos. Usar solo lo que no gasta créditos. | `vidiq:vidiq-trend-radar`, `vidiq:vidiq-shorts-inspiration`, `vidiq:vidiq-video-ideas`, `vidiq:vidiq-competitor-watchlist`, `vidiq:vidiq-comment-insights` | Cuenta de vidIQ; algunas funciones gastan créditos |
| `viralhunt` | Rastrea contenido que se está viralizando en las redes para proponer formatos al estratega. Su `publish` no se usa sin OK de los dueños. | `viralhunt:trending`, `viralhunt:viralhunt`, `viralhunt:review`, `viralhunt:stats` | Cuenta; costo a confirmar |
| `watch-video` | Mira un video (archivo o enlace) y lo describe, para desarmar por qué funciona una pieza de referencia. | `watch-video` | No |
| `humanizer` | Pasa textos que suenan a máquina a un tono humano rioplatense sin cambiar el contenido; ya figura en el rol de redactor. | `humanizer` | No |
| `humanize-kit` | `humanize-ig` limpia epígrafes de Instagram y `voice-profiler` fija la voz de cada marca para que las cuatro no suenen igual. | `humanize-kit:humanize-ig`, `humanize-kit:humanize`, `humanize-kit:voice-profiler` | No |
| `slop-stopper` | Revisión final contra el «relleno de IA» antes de programar una pieza o publicar una landing. | `slop-stopper:final-review` | No |
| `writing-skills` | `plain-language` y `de-ai` para textos claros y sin pose; los estilos de personajes (Yoda, Shrek y otros) no se usan en piezas reales. | `writing-skills:plain-language`, `writing-skills:de-ai`, `writing-skills:brevity-briefing`, `writing-skills:business-writing` | No |
| `writing-with-agents` | Cadena de redacción (arquitecto, carpintero, juez) con rúbrica de calidad para notas largas y guiones. | `writing-with-agents:content-strategy`, `writing-with-agents:flowers-cycle`, `writing-with-agents:quality-rubric`, `writing-with-agents:seo-writer`, `writing-with-agents:judge` | No |
| `online-writing` | Titulares, ideación y mejora de textos para publicaciones propias; las skills en alemán no aplican. | `online-writing:headlines`, `online-writing:ideate`, `online-writing:improve-writing`, `online-writing:tldr` | No |
| `copy-that-sells` | Titulares, anuncios gráficos y textos de venta directa para piezas de Autos 0 km y Coberturas médicas. | `copy-that-sells:copy-that-sells` | No |
| `brand-voice` | Convierte materiales dispersos de cada marca en una guía de voz aplicable y la hace cumplir en cada texto nuevo. | `brand-voice:discover-brand`, `brand-voice:generate-guidelines`, `brand-voice:enforce-voice` | Conectores (Drive, Notion, etc.) con cuenta; las skills solas no |
| `community-marketing` | Revisa una publicación antes de ponerla en un grupo o foro: reglas del lugar y que no parezca promoción encubierta. Clave para grupos de Facebook de cada rubro. | `community-marketing:community-post-check`, `community-marketing:venue-rules`, `community-marketing:community-blueprint`, `community-marketing:community-health` | No |
| `klaket` | Genera publicaciones y un paquete de lanzamiento a partir de un producto; queda como borrador, el dueño lo lanza. | `klaket:social-posts`, `klaket:launch-kit`, `klaket:landing-page` | Pago o créditos: solo con OK |
| `admakeai` | Diseña creativos publicitarios y textos de anuncio y arma borradores de campaña de Meta (sin lanzarlos). Los lanza el dueño. | `admakeai:admakeai-api` | Pago o créditos: solo con OK |
| `ugc-video-ads` | Video publicitario corto con presentador de IA. Evaluar siempre si corresponde avisar que es IA, y no usarlo en VITA ni con promesas médicas. | `ugc-video-ads` | Pago o créditos: solo con OK |
| `abracadabrax-ai-video-generator` | Clips cortos verticales a partir de texto para Reels y TikTok de Marketing y Autos 0 km (sin partir de imágenes propias). | `abracadabrax-ai-video-generator` | Pago o créditos: solo con OK |
| `abracadabrax-image-video` | Imágenes y videos desde texto para fondos y escenas genéricas de piezas. | `abracadabrax-image-video` | Pago o créditos: solo con OK |
| `abracadabrax-social-media-image` | Imágenes ya pensadas para cada red (formato y texto en la imagen) para el boceto que se aprueba antes de producir. | `abracadabrax-social-media-image` | Pago o créditos: solo con OK |
| `clipwave-video-image-maker` | Alternativa de imagen y video desde texto, para comparar resultados con el generador principal antes de elegir. | `clipwave-video-image-maker` | Pago o créditos: solo con OK |
| `aitopia` | Miniaturas de YouTube, video corto, UGC y kit de marca; sirve para el canal de Marketing. | `aitopia:aitopia-youtube-thumbnail`, `aitopia:aitopia-short-video`, `aitopia:aitopia-brand-kit`, `aitopia:aitopia-generate` | Pago o créditos: solo con OK |
| `canva` | Cambiar de tamaño una pieza a cada red, revisar la marca y producir variantes en lote desde una plantilla aprobada. | `canva:resize-for-social-media`, `canva:brand-check`, `canva:bulk-create`, `canva:edit-design`, `canva:get-design-feedback` | Cuenta de Canva por OAuth (pendiente de autorizar, ver `11-equipo-y-herramientas.md`) |
| `small-business` | `social-content-engine` y `marketing-monday` arman la tanda semanal de contenido; las demás skills de la suite se reparten en otras áreas. | `small-business:social-content-engine`, `small-business:marketing-monday`, `small-business:content-strategy`, `small-business:brand-style` | Conectores opcionales con cuenta |
| `marketing` | `content-creation` y `email-sequence` para borradores de piezas y secuencias; `brand-review` chequea contra la guía de marca. | `marketing:content-creation`, `marketing:draft-content`, `marketing:email-sequence`, `marketing:brand-review` | Conectores opcionales con cuenta |
| `windsor-ai` | Leer cómo rindió cada publicación (`social-media-insights`) para que Redes rehaga la estrategia con lo que funcionó. Publicar o comentar desde acá solo con confirmación. | `windsor-ai:social-media-insights`, `windsor-ai:facebook-organic`, `windsor-ai:instagram`, `windsor-ai:tiktok-organic`, `windsor-ai:youtube` | Ver Análisis |

## Diseño y animación

Panel, landings y piezas. La guía de estilo del dueño (`14-estilo-del-dueno.md`) y `direccion-de-arte.md` mandan sobre cualquier referencia. No se usa Figma en este proyecto, por eso esos plugins están en «No aplican».

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `frontend-design` | Dirección estética para panel y landings con carácter propio, sin look genérico de IA. | `frontend-design:frontend-design` | No |
| `kocos-especialistas` | Diez especialistas de interfaz, accesibilidad y buenas prácticas de React y PostgreSQL; el proyecto manda si contradicen a `kocos-crm-diseno-y-accesibilidad`. | `kocos-especialistas:interface-design`, `kocos-especialistas:ui-ux-pro-max`, `kocos-especialistas:web-design-guidelines`, `kocos-especialistas:frontend-design`, `kocos-especialistas:cro` | No |
| `ui-consistency` | Evita que cada pantalla nueva del panel se desvíe del estilo de las existentes y verifica accesibilidad al final. | `ui-consistency:verifying`, `ui-consistency:planning`, `ui-consistency:conventions`, `ui-consistency:accessibility`, `ui-consistency:finding-patterns` | No |
| `consistent-ui` | Detecta desvíos de espaciado, color y tipografía en todo el código del panel y las landings. | `consistent-ui:consistent-ui` | No |
| `vectorlab-ux-skills` | Microtextos, errores, estados vacíos, formularios y movimiento reducido: aplica directo a mensajes del panel y de las landings, en voseo. | `vectorlab-ux-skills:ux-audit`, `vectorlab-ux-skills:forms`, `vectorlab-ux-skills:errors`, `vectorlab-ux-skills:empty-states`, `vectorlab-ux-skills:reduced-motion`, `vectorlab-ux-skills:anti-slop` | No |
| `design-skills` | Crítica de diseño, auditoría de accesibilidad, mapa de recorrido y redacción de interfaz. | `design-skills:design-critique`, `design-skills:accessibility-audit`, `design-skills:journey-mapping`, `design-skills:ux-writing`, `design-skills:design-elevation` | No |
| `design` | Crítica, revisión de accesibilidad y textos de interfaz; sus conectores de diseño no se usan porque no hay Figma. | `design:design-critique`, `design:accessibility-review`, `design:ux-copy`, `design:design-handoff` | Conectores opcionales con cuenta |
| `design-steward` | Lleva una devolución de diseño hasta el arreglo verificado: briefing, alineación, ejecución y chequeo. | `design-steward:brief`, `design-steward:audit`, `design-steward:execute`, `design-steward:verify`, `design-steward:review` | No |
| `design-superpowers` | Dirección de diseño, revisión y mapa del diseño existente; ayuda a fijar la guía de estilo del dueño. | `design-superpowers:design`, `design-superpowers:design-review`, `design-superpowers:map-design`, `design-superpowers:creative` | No |
| `design-drift` | Fija el sistema de diseño de cada rubro y avisa si una pieza se aleja; refuerza «cada rubro separado» en lo visual. | `design-drift:lock`, `design-drift:check`, `design-drift:diff`, `design-drift:fetch` | No |
| `design-council` | Consulta de estilo desde cinco miradas de diseño (Ive, Rams, Hadid, Ingels y Norman) para decisiones de dirección visual. | `design-council:design-council` | No |
| `fairmind-design` | Diez subagentes de accesibilidad y convenciones de tokens, con referencia rápida de WCAG para revisar el panel. | `fairmind-design:a11y-audit`, `fairmind-design:wcag-quick-reference`, `fairmind-design:design-verify`, `fairmind-design:design-token-conventions` | No |
| `perception-first-design` | Marco de psicología de la percepción para jerarquía y legibilidad de pantallas. | `perception-first-design:pfd`, `perception-first-design:analyze`, `perception-first-design:evaluate` | No |
| `ux-ui-audit` | Auditoría con medición real en el navegador: contraste, tamaño de toques y foco, para el panel y las landings. | `ux-ui-audit:ux-ui-audit` | No |
| `ux-agent-skills` | Audita y especifica recorridos críticos (por ejemplo, de la landing al WhatsApp) para personas y para agentes. | `ux-agent-skills:ux-audit`, `ux-agent-skills:usability-audit`, `ux-agent-skills:spec-cuj`, `ux-agent-skills:audit-cuj` | No |
| `superdesign` | Diseña o rediseña pantallas y gráficos de marketing con vista previa. | `superdesign:superdesign` | No |
| `brush` | El agente diseña en SVG y se ve en vivo en el navegador: logos simples, íconos y gráficos limpios para piezas. | `brush:brush` | No |
| `bauhaus-digital` | Estilo ordenado para tableros y diapositivas del panel de análisis. | `bauhaus-digital:bauhaus-digital` | No |
| `21st` | Busca componentes y temas ya hechos (botones, tarjetas, formularios) y trae su código para el panel y las landings. | `21st:21st-ui` | Cuenta de 21st; la IA alojada puede costar |
| `a1-gallery` | Galería de sitios reales con medidas de tipografía, color y espaciado: referencia numérica para landings de cada rubro. | `a1-gallery:design-reference`, `a1-gallery:section-rebuild`, `a1-gallery:tokens`, `a1-gallery:pairings`, `a1-gallery:reference` | Cuenta; costo a confirmar |
| `mobbin` | Pantallas y flujos de apps reales (formularios, onboarding, chats) como referencia para el panel. | `mobbin:search`, `mobbin:redesign-screen`, `mobbin:plain-writing` | Cuenta de Mobbin; plan a confirmar |
| `refero` | Investigación de interfaces de productos reales con evidencia. | `refero:refero-design` | Cuenta; costo a confirmar |
| `image-deep-research` | Busca imágenes de referencia abiertas para tableros de ánimo y dirección de arte. | `image-deep-research:image-deep-research` | No |
| `image-generation` | Guía de redacción de prompts de imagen para cualquier generador, para pedir piezas coherentes con `direccion-de-arte.md`. | `image-generation:image-generation` | No |
| `brand-studio` | Estrategia, brief y revisión de identidad de marca para las cuatro marcas, sin tocar bio ni botón de los perfiles. | `brand-studio:brand-strategy`, `brand-studio:brand-brief`, `brand-studio:brand-identity-system`, `brand-studio:brand-review`, `brand-studio:brand-studio-router` | No |
| `brand-md` | Genera un `BRAND.md` por marca (VITA, Compara Tu Obra Social, Autos 0 km, Kocos) que cualquier escritorio lee antes de producir. | `brand-md:brand` | No |
| `blueprint-studio` | Imágenes y recursos con la marca puesta y un gimnasio de estilos para afinar el look de cada rubro. | `blueprint-studio:brand-manager`, `blueprint-studio:style-gym`, `blueprint-studio:asset-generator`, `blueprint-studio:start` | Pago o créditos: solo con OK |
| `codesign` | Motor de diseño que exporta PDF imprimible y mp4 con audio; sirve para carruseles, portadas y reels con control exacto. | `codesign:handbook`, `codesign:create`, `codesign:animate`, `codesign:brand`, `codesign:resize`, `codesign:launch-video` | Cuenta IMG.LY; generar recursos con IA puede costar |
| `remotion` | Reels y videos animados programados en código (ritmo, subtítulos, marca) con salida reproducible; ya está en la lista del rol de motion designer. | `remotion:remotion-best-practices`, `remotion:remotion-create`, `remotion:remotion-captions`, `remotion:remotion-render`, `remotion:remotion-saas` | No |
| `video-shotcraft` | Recetas de planos y movimientos para videos de producto con Remotion; sirve para Autos 0 km. | `video-shotcraft:video-shotcraft` | No |
| `motion-reel` | Videos de presentación de calidad de showreel armados desde código; ideal para el portafolio de la agencia Kocos. | `motion-reel:motion-reel` | No |
| `animation-studio` | Cortos animados a mano dibujados en código para piezas de marca con personaje propio. | `animation-studio:animation-studio` | No |
| `animatedwebs` | Fondos, héroes y degradados animados para landings y portadas; más de 1.600 plantillas. | `animatedwebs:animatedwebs-hero`, `animatedwebs:animatedwebs-backgrounds`, `animatedwebs:animatedwebs-gradients`, `animatedwebs:animatedwebs-components`, `animatedwebs:animatedwebs-style` | Cuenta; costo a confirmar |
| `it-reelsmaker` | Edita videos verticales de cámara a cámara (Reels, Shorts, TikTok): cortes, subtítulos y ritmo. | `it-reelsmaker:it-reelsmaker` | No |
| `video-cleanup` | Limpia el audio de una voz grabada (ruido, volumen, estéreo) y mejora la imagen antes de subir. | `video-cleanup:video-cleanup` | No |
| `ai-video-editor` | Genera tomas y las corta en una línea de tiempo multipista para videos de varios planos. | `ai-video-editor:video-editing`, `ai-video-editor:video-generation`, `ai-video-editor:ai-video-edit`, `ai-video-editor:ai-video-shot` | Pago o créditos: solo con OK |
| `kling-ai` | Imagen y video generados desde texto o imagen para piezas de impacto. | `kling-ai:kling-ai-generate-video`, `kling-ai:kling-ai-generate-image`, `kling-ai:kling-ai` | Pago o créditos: solo con OK |
| `creative-claw` | Anuncios en video y variantes desde fotos de producto, avatares y voz en off, para Autos 0 km (siempre con fotos reales autorizadas). | `creative-claw:creativeclaw-create-ugc-ad`, `creative-claw:creativeclaw-product-photoshoot`, `creative-claw:creativeclaw-create-reels`, `creative-claw:creativeclaw-generate-voiceover`, `creative-claw:creativeclaw-plan-video` | Pago o créditos: solo con OK |
| `adobe-for-creativity` | Quitar fondos de fotos de unidades, variantes por red, tipografías, kit de marca, limpieza de audio y PDF desde datos. | `adobe-for-creativity:adobe-product-photo-cutout`, `adobe-for-creativity:adobe-create-social-variations`, `adobe-for-creativity:adobe-fonts`, `adobe-for-creativity:adobe-brand-kit`, `adobe-for-creativity:adobe-cleanup-audio`, `adobe-for-creativity:adobe-resize-photos-and-videos` | Cuenta Adobe; varias funciones gastan créditos |
| `canva` | Producción de piezas en plantillas de marca aprobadas y revisión de marca antes de programar. | `canva:brand-check`, `canva:edit-design`, `canva:resize-for-social-media` | Cuenta de Canva por OAuth |
| `apiai` | Herramientas de imagen y video como quitar fondo y filtros por lote, para limpiar fotos de unidades. | `apiai:apiai` | Pago o créditos: solo con OK |
| `abracadabrax-background-music-generator` | Música instrumental de fondo para Reels de Marketing y Autos 0 km, sin problemas de derechos. | `abracadabrax-background-music-generator` | Pago o créditos: solo con OK |
| `render-visual-skill` | Tarjetas para redes, diagramas, diapositivas y fragmentos de código como imágenes limpias. | `render-visual-skill:render-visual` | No |
| `aitopia` | Edición y generación de imágenes y video con kit de marca y anuncios de producto. | `aitopia:aitopia-edit`, `aitopia:aitopia-product-ad`, `aitopia:aitopia-ugc-video`, `aitopia:aitopia-upload` | Pago o créditos: solo con OK |

## SEO y landings

SEO técnico, contenido, visibilidad en IA y conversión. Contenido legal y de salud: nada de promesas de resultado y revisar contra las reglas del Colegio y de cada rubro.

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `seo-audit` | Auditoría de SEO técnico y de página, con plan de arreglos y revisión de datos de Search Console. | `seo-audit:seo-audit`, `seo-audit:seo-page-audit`, `seo-audit:seo-fix-plan`, `seo-audit:technical-seo-code-audit`, `seo-audit:search-console-data-review` | No |
| `ai-seo` | Mide si ChatGPT, Perplexity y Google IA nombran a la marca y qué contenido falta, con auditoría de `llms.txt` y acceso de rastreadores. | `ai-seo:ai-seo-audit`, `ai-seo:ai-answer-gap`, `ai-seo:ai-page-audit`, `ai-seo:ai-visibility-report`, `ai-seo:llms-txt-crawler-access`, `ai-seo:ai-offsite-plan` | No |
| `searchfit-seo` | Paquete gratuito: grupos de palabras clave, enlaces internos, SEO técnico, datos estructurados y briefs. Aparece instalado dos veces (mismo nombre). | `searchfit-seo:seo-audit`, `searchfit-seo:keyword-clustering`, `searchfit-seo:internal-linking`, `searchfit-seo:technical-seo`, `searchfit-seo:schema-markup`, `searchfit-seo:content-brief` | No |
| `seo-aeo-geo-ultimate` | Router de 27 skills de SEO para buscadores y para IA; `seo-local` y `seo-schema` para negocios con zona de atención. | `seo-aeo-geo-ultimate:seo-audit`, `seo-aeo-geo-ultimate:seo-local`, `seo-aeo-geo-ultimate:seo-schema`, `seo-aeo-geo-ultimate:seo-technical`, `seo-aeo-geo-ultimate:seo-plan`, `seo-aeo-geo-ultimate:seo-action-plan`, `seo-aeo-geo-ultimate:ai-visibility-monitor` | No |
| `seo-geo-consultant` | Consultoría de SEO y de visibilidad en IA en un solo paso para la estrategia mensual. | `seo-geo-consultant:seo-geo-consultant` | No |
| `seo-gsc-wizard` | Prioriza qué landing tocar según lo que mide Search Console: oportunidades rápidas y canibalización. | `seo-gsc-wizard:quick-wins`, `seo-gsc-wizard:cannibalization`, `seo-gsc-wizard:site-audit` | Cuenta Google por OAuth |
| `search-visibility-kit` | Conecta Search Console y GA4 para auditar y avisar de URLs nuevas por IndexNow. | `search-visibility-kit:seo-audit`, `search-visibility-kit:indexnow`, `search-visibility-kit:onboard-site` | Cuenta Google por OAuth |
| `adcopilot` | Inspección de URLs, pedido de indexación, sitemaps y velocidad de página desde Search Console y PageSpeed. | `adcopilot:adcopilot-seo`, `adcopilot:audit`, `adcopilot:measure` | Cuenta Google por OAuth |
| `claude-site-audit` | Auditoría de SEO, accesibilidad e IA con informe en PDF y nota: sirve como entregable para clientes de la agencia Kocos. | `claude-site-audit:site-audit` | No |
| `aeo` | Asesor de visibilidad en motores de IA: qué cambiar para que una landing sea citada. | `aeo:aeo` | No |
| `aeo-brand-scan` | Chequeo gratuito de cómo nombran las IA a cada marca; punto de partida del informe mensual. | `aeo-brand-scan:scan` | No |
| `aeotester` | Puntúa la visibilidad en IA y arregla automáticamente detalles de la página. | `aeotester:audit`, `aeotester:fix` | No |
| `citable` | Audita qué tan citable es el sitio por ChatGPT, Claude y Perplexity. | `citable:ai-search-audit` | No |
| `ai-advisors` | Informe de cómo representan a la marca los buscadores de IA y de tráfico de rastreadores de IA. | `ai-advisors:ai-search-visibility`, `ai-advisors:aeo-audits`, `ai-advisors:ai-traffic-and-crawlers`, `ai-advisors:visibility-report`, `ai-advisors:aeo-fixes` | Cuenta; costo a confirmar |
| `ai-visibility-tracker` | Seguimiento de visibilidad, oportunidades de palabras clave y de enlaces para varios sitios a la vez. | `ai-visibility-tracker:ai-visibility-tracker`, `ai-visibility-tracker:keyword-opportunities`, `ai-visibility-tracker:visibility-action-plan`, `ai-visibility-tracker:link-opportunities`, `ai-visibility-tracker:visibility-trends` | Cuenta; costo a confirmar |
| `brandvane` | Convierte la investigación de SEO y la evidencia de visibilidad en IA en próximos pasos concretos. | `brandvane:seo-opportunities`, `brandvane:ai-evidence`, `brandvane:content-brief`, `brandvane:rank-changes` | Cuenta; costo a confirmar |
| `datafluxor` | Investigación de resultados de Google y de visibilidad en IA para palabras clave de cada rubro. | `datafluxor:seo-research` | Cuenta; costo a confirmar |
| `optise-helix-aeo-toolkit` | Escribe respuestas directas al comienzo de la página (`bluf`) y audita por qué las IA no citan una landing. | `optise-helix-aeo-toolkit:optise-helix-bluf-writer`, `optise-helix-aeo-toolkit:optise-helix-race-audit`, `optise-helix-aeo-toolkit:optise-helix-fitq-audit`, `optise-helix-aeo-toolkit:optise-helix-prompt-pack-builder` | No |
| `blogr` | Revisa el plan de contenidos, actualiza artículos viejos y los reutiliza para otras redes; revisión semanal de SEO. | `blogr:content-plan-review`, `blogr:weekly-seo-review`, `blogr:refresh-article`, `blogr:repurpose-article` | Cuenta; costo a confirmar |
| `seo-article-writer-faq` | Artículos con preguntas frecuentes, datos estructurados `FAQPage` y metadatos; en VITA y Coberturas se revisan contra las reglas del Colegio y de salud. | `seo-article-writer-faq:seo-article-writer`, `seo-article-writer-faq:seo-article-audit` | No |
| `seo-writers` | Flujo editorial que exige evidencia: auditoría de experiencia y confiabilidad (E-E-A-T), tono honesto y revisión final; clave para contenidos legales y de salud. | `seo-writers:run-seo-writing-workflow`, `seo-writers:audit-eeat`, `seo-writers:audit-tone-honesty`, `seo-writers:chief-editor-review`, `seo-writers:final-integration-check`, `seo-writers:cold-reader-review` | No |
| `website-quality-checker` | Evalúa la página con las pautas de calidad de Google, en especial para temas que afectan salud y dinero (Coberturas médicas, VITA). | `website-quality-checker:website-quality-checker` | No |
| `web-vitals-auditor` | Mide velocidad y estabilidad de las landings (Lighthouse, imágenes, fuentes, peso del código) en cada cambio. | `web-vitals-auditor:full-audit`, `web-vitals-auditor:lighthouse-audit`, `web-vitals-auditor:image-audit`, `web-vitals-auditor:font-audit`, `web-vitals-auditor:vitals-diagnose` | No |
| `copywriting-kit` | Escribe y corrige textos de landing orientados a la consulta por WhatsApp, y revisa la prueba de lectura antes de publicar. | `copywriting-kit:landing-page-copy`, `copywriting-kit:copy-edit`, `copywriting-kit:copy-diagnose`, `copywriting-kit:copy-proof-check`, `copywriting-kit:brand-voice` | No |
| `marketing-psychology` | Revisa que la persuasión no cruce a engaño: chequeo de patrones oscuros, grado de evidencia y encuadre de precios; protege a VITA y Coberturas de reclamos riesgosos. | `marketing-psychology:dark-pattern-check`, `marketing-psychology:evidence-check`, `marketing-psychology:persuasion-audit`, `marketing-psychology:price-framing`, `marketing-psychology:behavior-diagnosis` | No |
| `website-design` | Diseña landings con aspecto de producto real, con sistema de diseño y revisión de página. | `website-design:landing-page`, `website-design:web-design-system`, `website-design:web-review`, `website-design:design-system`, `website-design:review-page` | Cuenta; costo a confirmar |
| `8b-ai-website-builder` | Arma páginas animadas desde una descripción y permite probar variantes de dirección visual antes de pasar a código propio. | `8b-ai-website-builder:site` | Pago o créditos: solo con OK |
| `critic-layer` | Marcar notas sobre la página viva como sobre una hoja impresa, para cerrar devoluciones de landings con el dueño. | `critic-layer:critic-layer`, `critic-layer:brief`, `critic-layer:verify` | No |
| `klaket` | `landing-page` produce un borrador de página y `launch-kit` el paquete de textos; hay que pasarlo por las reglas de captación. | `klaket:landing-page`, `klaket:launch-kit` | Pago o créditos: solo con OK |
| `agency-mcp` | `local-seo-gbp` y `seo-content` para ficha de Google Business y SEO local de la agencia y de clientes. | `agency-mcp:local-seo-gbp`, `agency-mcp:seo-content`, `agency-mcp:seo-audit`, `agency-mcp:keyword-research` | Cuenta; costo a confirmar |
| `a1-gallery` | `section-rebuild` toma una sección real de un sitio y la reconstruye con medidas, útil para héroes y secciones de formularios. | `a1-gallery:section-rebuild`, `a1-gallery:design-reference` | Cuenta; costo a confirmar |
| `animatedwebs` | Héroes y fondos animados para landings sin pesar de más; se mide con `web-vitals-auditor`. | `animatedwebs:animatedwebs-hero`, `animatedwebs:animatedwebs-site` | Cuenta; costo a confirmar |

## Bots y captación

Calidad de los bots de WhatsApp, plantillas y Laboratorio. Los canales son la API oficial de Meta; nada de prospección en frío ni de bases de terceros sin consentimiento.

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `kocos-cowork` | `kocos-crm-reglas-de-captacion` y `kocos-agentes-entrenamiento-y-evaluacion` son el marco de este escritorio; mandan sobre todo lo demás. | `kocos-cowork:kocos-crm-reglas-de-captacion`, `kocos-cowork:kocos-agentes-entrenamiento-y-evaluacion`, `kocos-cowork:kocos-crm-pruebas-de-aceptacion` | No |
| `agent-design` | Decide si un proceso necesita agente y arma su especificación; sirve para diseñar bots nuevos o fichas por rubro. | `agent-design:agent-process-scope`, `agent-design:agent-architecture-decide`, `agent-design:agent-build-spec` | No |
| `agent-debugging` | Diagnostica una conversación de bot que salió mal a partir de trazas y transcripciones, y verifica la reparación. | `agent-debugging:agent-incident-diagnose`, `agent-debugging:agent-failure-repair`, `agent-debugging:agent-repair-verify` | No |
| `prompt-fixer` | Vuelve preciso un prompt flojo con pocas preguntas; para ajustar fichas y plantillas del Laboratorio. | `prompt-fixer:prompt-fixer` | No |
| `autoresearch-ai-plugin` | Ciclo de probar-medir-mejorar para afinar un prompt contra el Laboratorio de evaluación; correr solo en la copia de pruebas. | `autoresearch-ai-plugin:run-autoresearch`, `autoresearch-ai-plugin:autoresearch` | No |
| `agentic-council` | Los especialistas `oracle-*` cubren prompts, evaluación y recuperación de contexto de los bots; `skeptic-*` busca casos borde. | `agentic-council:oracle-prompt-engineering`, `agentic-council:oracle-ai-evaluation`, `agentic-council:oracle-rag-architecture`, `agentic-council:skeptic-edge-case-enumeration`, `agentic-council:skeptic-failure-mode-analysis` | No |
| `marketing-psychology` | Chequea que los guiones de los bots no usen presión indebida ni prometan lo que no se puede (cobertura, plazos, resultados legales). | `marketing-psychology:dark-pattern-check`, `marketing-psychology:evidence-check` | No |
| `sales` | Calificación de consultas, manejo de objeciones y preparación de llamada como insumo para guiones del bot y de la persona que recibe la derivación. | `sales:lead-triage`, `sales:handle-objection`, `sales:call-prep`, `sales:draft-outreach`, `sales:call-summary` | Conectores de CRM con cuenta; las skills solas no |
| `sales-enablement` | Banco de preguntas de calificación y entrenamiento de quien atiende lo que el bot deriva. | `sales-enablement:question-bank`, `sales-enablement:call-coaching`, `sales-enablement:demo-runbook`, `sales-enablement:ramp-plan` | No |
| `small-business` | `speed-to-lead`, `lead-triage` y `reactivate` son modelos de respuesta rápida y de reactivación de consultas frías, a adaptar a las reglas de captación. | `small-business:speed-to-lead`, `small-business:lead-triage`, `small-business:reactivate`, `small-business:call-list`, `small-business:review-reputation` | Conectores opcionales con cuenta |
| `aca-native-mcp-skills` | Perfil de cliente ideal, puntaje de respuestas positivas, ideas de imán de leads y revisión de textos para evitar spam; se usa como criterio, no para enviar. | `aca-native-mcp-skills:aca-icp-onboarding`, `aca-native-mcp-skills:aca-positive-reply-scoring`, `aca-native-mcp-skills:aca-lead-magnet-brainstorm`, `aca-native-mcp-skills:aca-lead-quality`, `aca-native-mcp-skills:aca-copy-spam-checker`, `aca-native-mcp-skills:aca-experiment-design` | Los envíos requieren cuenta del servicio; no se usan sin OK |
| `writing-skills` | `plain-language` para mensajes de bot cortos, claros y con voseo. | `writing-skills:plain-language`, `writing-skills:brevity-briefing` | No |

## Ingeniería

Errores, pruebas, seguridad, base y despliegue. Producción solo con OK; la Preview comparte base y líneas con producción.

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `superpowers` | Pruebas primero, depuración sistemática, ramas de trabajo aisladas y revisión de código recibido y pedido. | `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:using-git-worktrees`, `superpowers:requesting-code-review`, `superpowers:receiving-code-review`, `superpowers:finishing-a-development-branch` | No |
| `megapowers` | Implementación con pruebas primero, depuración y cierre verificado; efectos seguros para no tocar la base ni los bots por error. | `megapowers:test-first-implementation`, `megapowers:systematic-debugging`, `megapowers:safe-effects`, `megapowers:verify-and-finish`, `megapowers:independent-review` | No |
| `backend-design` | Disciplina de servidor: autorización, idempotencia de webhooks, seguridad de migraciones y consultas; encaja con las reglas de `CLAUDE.md` sobre RLS y rutas privadas. | `backend-design:review-migration`, `backend-design:auth-and-authorization`, `backend-design:idempotency-and-side-effects`, `backend-design:migration-safety`, `backend-design:query-discipline`, `backend-design:hunt-n-plus-one` | No |
| `supabase` | Plugin oficial con buenas prácticas de Postgres para migraciones numeradas, RLS y rendimiento. | `supabase:supabase`, `supabase:supabase-postgres-best-practices` | No |
| `kocos-especialistas` | `vercel-react-best-practices` y `supabase-postgres-best-practices` como especialistas de código de Next.js y de base. | `kocos-especialistas:vercel-react-best-practices`, `kocos-especialistas:supabase-postgres-best-practices`, `kocos-especialistas:web-design-guidelines` | No |
| `coding-skills` | Errores que pasan la revisión y fallan en producción: husos horarios y fechas, reintentos que se multiplican, paginación, índices y migraciones sin cortes. | `coding-skills:clocks-and-time`, `coding-skills:retry-amplification`, `coding-skills:keyset-pagination`, `coding-skills:index-design`, `coding-skills:expand-contract`, `coding-skills:parse-dont-validate` | No |
| `10x-Team` | Roles de equipo (arquitecto, DBA, QA, seguridad, SRE) para repartir una tarea técnica grande. | `10x-Team:principal-architect`, `10x-Team:dba`, `10x-Team:qa-engineer`, `10x-Team:security-engineer`, `10x-Team:sre` | No |
| `agent-protocols` | Ciclo completo de ingeniería con agentes: revisión, pruebas, refuerzo de seguridad, rendimiento y control de versiones. | `agent-protocols:test-driven-development`, `agent-protocols:code-review-and-quality`, `agent-protocols:security-and-hardening`, `agent-protocols:browser-testing-with-devtools`, `agent-protocols:git-workflow-and-versioning`, `agent-protocols:debugging-and-error-recovery` | No |
| `zizi-skills` | Seguridad, optimización de base y depuración con método de cierre. | `zizi-skills:security-and-hardening`, `zizi-skills:database-optimization`, `zizi-skills:debugging-and-error-recovery`, `zizi-skills:tdd-skill`, `zizi-skills:i18n` | No |
| `engineering` | Revisión de código, depuración, lista de despliegue y respuesta a incidentes con plantilla. | `engineering:code-review`, `engineering:debug`, `engineering:deploy-checklist`, `engineering:incident-response`, `engineering:testing-strategy`, `engineering:tech-debt` | Conectores opcionales (Datadog, PagerDuty) con cuenta |
| `claude-security` | Escaneo profundo de vulnerabilidades del propio código con verificación de cada hallazgo; complementa `security-review`. | `claude-security:claude-security` | No |
| `security-guidance` | Avisos automáticos al editar (inyección, XSS, SSRF, claves en el código) y revisión de cada commit; protege la regla de claves solo en Vercel. | `security-guidance` | No |
| `agentkeeper` | Detecta claves expuestas, inyección de instrucciones y patrones de exfiltración en la configuración de Claude Code. | `agentkeeper:scan`, `agentkeeper:secrets`, `agentkeeper:audit`, `agentkeeper:policies` | No |
| `security-watchdog` | Escanea cada plugin de terceros nuevo antes de confiar en él; refuerza `PROCEDENCIA.md`. | `security-watchdog:scan-plugin`, `security-watchdog:plugin-security` | No |
| `claude-code-toolkit` | Comandos para pipeline de construcción con varios agentes, tareas en paralelo y auditoría de seguridad. | `claude-code-toolkit:build`, `claude-code-toolkit:dispatch`, `claude-code-toolkit:security-audit`, `claude-code-toolkit:plan` | No |
| `claude-code-audit-stack` | `bot-deploy-verifier` detecta reinicios omitidos después de publicar cambios en los bots. | `claude-code-audit-stack:bot-deploy-verifier` | No |
| `code-simplifier` | Agente que simplifica código sin cambiar lo que hace, al cerrar una entrega. | `code-simplifier:code-simplifier` | No |
| `aictrl` | Revisión de código, creación de PR e incidencias, análisis de causa raíz y pulido de interfaz. | `aictrl:code-review`, `aictrl:create-pr`, `aictrl:root-cause-analysis`, `aictrl:ui-polish`, `aictrl:measurement-plan` | Cuenta de aictrl para las funciones conectadas |
| `github` | Conector oficial para PR, incidencias, revisiones y Actions; hoy figura con error de formato en el encabezado de autorización (ver «Necesitan cuenta»). | `github` | Token de GitHub |
| `gitkraken` | Contexto de git (historial, ramas, PR) y composición de commits ordenados. | `gitkraken` | Cuenta de GitKraken para funciones de PR e incidencias |
| `ci-optimizer` | Acelera y asegura GitHub Actions: caches faltantes y pasos innecesarios en la corrida de pruebas. | `ci-optimizer:ci-optimizer`, `ci-optimizer:ci-check`, `ci-optimizer:ci-timings` | No |
| `betterstack` | Registros, tiempo en línea y errores para vigilar el latido y los webhooks de Meta con alertas. | `betterstack:uptime-monitors`, `betterstack:logs-query`, `betterstack:errors-query`, `betterstack:investigate-incident`, `betterstack:health-check` | Cuenta de Better Stack; hay plan gratis limitado |
| `web-vitals-auditor` | Agentes forenses de rendimiento y presupuestos de peso para las páginas y el panel. | `web-vitals-auditor:bundle-analyze`, `web-vitals-auditor:budget-generate`, `web-vitals-auditor:doctor` | No |
| `modern-web-guidance` | Mantiene al agente al día con las prácticas web actuales (APIs nuevas del navegador) antes de escribir código. | `modern-web-guidance:modern-web-guidance` | No |
| `mattpocock-skills` | Diagnóstico de errores, pruebas primero, modelado del dominio y resolución de conflictos de fusión. | `mattpocock-skills:diagnosing-bugs`, `mattpocock-skills:tdd`, `mattpocock-skills:domain-modeling`, `mattpocock-skills:code-review`, `mattpocock-skills:resolving-merge-conflicts` | No |
| `senior-engineering-partner` | Revisor estricto y de pareja para Python, Bash y JavaScript, con fases y seguridad primero; útil para los scripts de `tests/integracion/correr.sh`. | `senior-engineering-partner` | No |
| `codex-review` | Segunda opinión de otro modelo sobre el código antes de publicar un cambio grande. | `codex-review:code` | Cuenta y CLI de Codex; costo a confirmar |
| `agentic-council` | `skeptic-threat-model`, `architect-schema-design` y `craftsman-e2e-testing` para cambios sensibles de seguridad, base y pruebas. | `agentic-council:skeptic-threat-model`, `agentic-council:architect-schema-design`, `agentic-council:craftsman-e2e-testing`, `agentic-council:craftsman-testing-strategy`, `agentic-council:guardian-data-classification` | No |

## Asistente personal (Jarvis)

Ponerlos al día: qué pasó, qué falta, qué decidir. Jarvis dentro del panel corre con Gemini; estas skills sirven para que Claude prepare el contenido de sus resúmenes y para las sesiones de Claude.

| Plugin | Qué aporta acá | Skills y agentes clave | Requiere cuenta o pago |
| --- | --- | --- | --- |
| `small-business` | Resumen del lunes (`monday-brief`), gestor de bandeja de entrada y panorama del negocio con los conectores de Gmail, Calendar y Drive: base de lo que Jarvis cuenta al abrir el panel. | `small-business:monday-brief`, `small-business:inbox-manager`, `small-business:business-pulse`, `small-business:growth-pulse`, `small-business:smb-router` | Cuentas de Google por OAuth; lo contable (QuickBooks, Shopify) no se conecta |
| `productivity` | Lista de tareas y memoria de contexto para armar «qué falta y qué hay que decidir». | `productivity:task-management`, `productivity:memory-management`, `productivity:start`, `productivity:update` | Conectores opcionales con cuenta |
| `mind-plus-plus` | Segundo cerebro: captura de ideas, resumen diario, preparación de reuniones y revisión semanal; modelo para el resumen de Jarvis. | `mind-plus-plus:daily-brief`, `mind-plus-plus:weekly-review`, `mind-plus-plus:capture-idea`, `mind-plus-plus:meeting-prep`, `mind-plus-plus:new-decision` | No |
| `gia-chief-of-staff` | Jefe de gabinete: resumen del día, triage de correo y seguimiento de pendientes. | `gia-chief-of-staff:ops-check` | No |
| `enterprise-search` | Búsqueda en todas las herramientas conectadas (correo, chat, documentos) para responder «¿dónde estaba eso?». | `enterprise-search:search`, `enterprise-search:digest`, `enterprise-search:knowledge-synthesis`, `enterprise-search:search-strategy` | Conectores con cuenta por cada fuente |
| `desktop-commander` | Acceso a archivos y terminal de la compu del dueño para ordenar carpetas y buscar documentos, con permisos acotados. | `desktop-commander:desktop-commander-overview`, `desktop-commander:knowledge-base`, `desktop-commander:terminal`, `desktop-commander:computer-health-check` | No |
| `sales` | `daily-briefing`, `end-of-day` y `schedule-meeting` sirven de molde para el resumen diario y para agendar. | `sales:daily-briefing`, `sales:end-of-day`, `sales:schedule-meeting`, `sales:weekly-wrap` | Conectores con cuenta |
| `16-minds` | `voice-ask` pregunta a los 16 perfiles una duda del dueño y devuelve una síntesis corta. | `16-minds:voice-ask`, `16-minds:minds` | No |
| `operations` | `status-report` da el formato corto de «estado de situación» para quien no sigue el detalle técnico. | `operations:status-report` | No |

## Aporte mínimo

No son del núcleo, pero suman en un detalle concreto. El dueño pidió aprovechar todo, aunque sea en un mínimo detalle.

| Plugin | Detalle en el que suma |
| --- | --- |
| `abracadabrax-product-photo-generator` | Escenas y fondos genéricos de producto para posteos de Autos 0 km; no sirve para fotos de unidades reales, porque solo parte de texto. |
| `abracadabrax-song-maker` | Tema musical o jingle propio sin derechos para un Reel de la agencia Kocos. |
| `activecampaign` | Criterios de entregabilidad y plantillas de secuencias de seguimiento como referencia al diseñar los seguimientos del CRM propio; la cuenta no se conecta (hoy falla por configuración). |
| `adaptive-agent` | `skill-review` revisa si una skill propia se está quedando vieja. |
| `agent-formal-verify` | Probar con rigor la máquina de estados del traspaso del bot a una persona (que ningún prospecto quede sin dueño). |
| `agent-ingest-audit-optimize` | Auditar un material externo antes de convertirlo en regla o skill propia. |
| `agentone-token-compression` | Comprimir un texto muy largo (un volcado de chats) antes de leerlo. |
| `ai-integration-architect` | Lista de chequeo al planificar una integración nueva de IA con el CRM (qué datos salen, qué se registra). |
| `ai-memory-reader` | Abrir `CLAUDE.md` y `cerebro/` en una app de lectura cómoda para el dueño; su disponibilidad en el sistema operativo hay que confirmarla. |
| `ai-mentor` | Descubrir funciones de Claude Code que todavía no se usan en el proyecto. |
| `alexandria` | Enseña el código del CRM paso a paso a quien se sume y archiva lo aprendido. |
| `ansvar-compliance-skills` | `dpia` como plantilla para evaluar el impacto sobre datos personales de prospectos y `threat-model` para el panel; el marco es europeo, se usa solo el método. |
| `arrows-sales-skills` | `arrows-crm-hygiene` y `arrows-deal-nudge` como ideas de higiene del CRM y de empujes de seguimiento. |
| `ayrshare` | Respaldo si Metricool no cubriera una red: `validate_post` y `recommend_hashtags` para chequear piezas antes de programar. No se duplica la programación. |
| `cache-guard` | Avisa antes de mandar un mensaje que costaría mucho más de lo habitual. |
| `caveman` | Modo de respuesta ultra corto para tareas internas de bajo riesgo; no se usa en textos del proyecto. |
| `cc-token-statusline` | Barra con el uso de contexto y de cuota mientras se trabaja. |
| `claude-backup` | Copia de seguridad de la configuración de Claude Code (skills, plugins). |
| `claude-context-optimizer` | `cco-claudemd` ayuda a podar `CLAUDE.md` y `cco-overhead` mide qué pesa en cada sesión. |
| `claude-patterns` | Detecta decisiones o pasos que se repiten en las sesiones y los propone como skill nueva. |
| `claude-performance` | Resumen semanal de cómo rinde el uso de Claude Code. |
| `claude-usage-statusline` | Porcentaje de uso y cuenta regresiva hasta el próximo reinicio del límite. |
| `claude-vitals` | Panel de signos vitales de la sesión (contexto, agentes activos, costo). |
| `chat-search` | Buscar en conversaciones anteriores una decisión que no quedó en el cerebro. |
| `cloudflare` | `turnstile-spin` suma una verificación anti-robots a los formularios de las landings, y `web-perf` ayuda a medir velocidad. No se muda el alojamiento. |
| `content-studio` | Redacción de opiniones y publicaciones de perfil profesional si se decidiera abrir LinkedIn; hoy no hay. |
| `context-dev` | Leer páginas y documentos de la web como contexto para una investigación puntual. |
| `controllerai` | Ideas de flujos visuales de automatización para comparar con lo que ya hace el latido; no se conecta. |
| `cowork-mem` | Memoria entre sesiones de Cowork, si el dueño trabaja ahí; el cerebro sigue mandando. |
| `cowork-plugin-management` | `create-cowork-plugin` y `cowork-plugin-customizer` para mantener el plugin `kocos-cowork`. |
| `dumbline` | Semáforo en la línea de estado que avisa cuando el contexto ya está demasiado cargado. |
| `github-cli-health-check` | Chequeo diario de que `gh` funciona, útil para no descubrir en medio de un cierre que no se puede subir. |
| `inhabited-design` | Evaluar una página nueva con personas simuladas del perfil del prospecto antes de mostrarla. |
| `liquid-glass` | Criterios del material «vidrio» (legibilidad, contraste) como inspiración del panel; el código es de SwiftUI y no se usa. |
| `logo-maker` | Explorar ideas de logo; las marcas existentes no se cambian sin OK, y el resultado es imagen, no vectorial. |
| `meshy-3d-agent` | Elementos 3D decorativos para piezas de Marketing; no modelan vehículos reales. |
| `miro` | Dibujar el embudo de captación en un tablero para explicarlo a los dueños. |
| `saleshandy` | Armado de listas B2B solo para la agencia Kocos buscando clientes; la campaña la lanza el dueño. |
| `scanmalware` | `get_safe_browsing` y estudio de dominios para revisar la reputación de los dominios de las landings y los enlaces sospechosos que mandan prospectos. |
| `sales-follow-up` | Tres ángulos de seguimiento a partir de un correo; sin pasar datos personales de prospectos a servicios externos. |
| `setup-audit` | Revisar la configuración de Claude Code contra riesgos comunes. |
| `soundweaver` | Aviso sonoro opcional de nuevo prospecto en el panel, siempre con control para silenciarlo. |
| `token-efficiency-audit` | Auditar qué skills del proyecto pesan de más. |
| `token-saver` | Archivar o limpiar sesiones largas para gastar menos. |
| `token-shield` | Reglas de caché de prompts, aplicables a los prompts largos de los bots. |
| `token-usage` | Atribuir el gasto de tokens a la tarea que lo consumió. |
| `video-to-code-skill` | Convertir una grabación de pantalla del dueño (un error del panel) en cuadros y transcripción para analizarlo. |
| `viral-launch-pipeline` | Plan de lanzamiento por etapas para una línea nueva, como lista de verificación. |
| `vpai` | Listas de empresas B2B para la agencia Kocos, con las mismas condiciones que `saleshandy`. |
| `zapier` | Conectar una app no cubierta (por ejemplo, avisos a una planilla) si algún día hiciera falta. |
| `postiz` | Respaldo de programación en 28 redes si Metricool no alcanza; mismo cuidado que `ayrshare`. |

## No aplican

Revisados uno por uno: hoy no suman nada a los 4 rubros. Si el negocio cambia (por ejemplo, un rubro inmobiliario o una app móvil), se vuelven a mirar.

- `3doptix`: Diseño óptico y simulación de rayos; nada que ver con captación.
- `above-security`: Investigación de amenazas internas e identidades de empresas grandes.
- `accelerate-ai-toolkit`: Solo funciona con sitios de la plataforma Accelerate (WordPress); las landings van en Next.js y Vercel.
- `agent-memory`: Memoria paralela comprimida; ya hay una sola memoria, el cerebro, y dos fuentes de verdad generan contradicciones.
- `agent-recall`: Otra memoria paralela (grafo en SQLite); mismo motivo.
- `agentforce-adlc`: Agentes de Salesforce; el bot es propio, sobre Meta y Gemini.
- `agentpricing`: Tasación inmobiliaria en italiano; no hay rubro inmobiliario.
- `agentui-tools`: Plataforma alternativa de alojamiento con base y usuarios; el proyecto ya está en Vercel y Supabase.
- `ai-ready-ds`: Audita sistemas de diseño de Figma; no usamos Figma.
- `airship`: Notificaciones push para apps móviles; no hay app.
- `anamnese-core`: Memoria en la nube compartida con otros servicios; sacaría datos del cerebro fuera del repo y, además, hoy no conecta.
- `apodictic`: Edición de ficción y de ensayos largos; no hay libros ni manuscritos.
- `aws-core`: La infraestructura es Vercel y Supabase; no se corre nada en AWS.
- `base44`: Constructor de aplicaciones alternativo; no se migra.
- `botify`: SEO técnico de sitios empresariales de gran escala; las landings son pocas.
- `carta-crm`: CRM para inversores y fondos; no hay rondas de inversión.
- `cerebrium`: Despliegue de modelos en GPU; los bots usan APIs de modelos ya alojados.
- `claude-for-msft-365-install`: Instalación de Claude en Office de Microsoft; no se usa Office 365.
- `claude2figma`: Cumplimiento del sistema de diseño entre Claude y Figma; no usamos Figma.
- `code-modernization`: Modernización de sistemas heredados (COBOL, .NET); el código es nuevo.
- `cognee-memory`: Memoria de grafo paralela; mismo motivo que `agent-memory`.
- `contentasoft-ai-video-enhancer`: Corre en una PC con Windows y hoy no conecta; no hay un flujo que lo necesite.
- `contentasoft-cad-converter`: Conversión de archivos CAD 3D; no hay.
- `context-vault`: Memoria persistente con servicio local; duplica el cerebro.
- `datadog`: Observabilidad empresarial; los registros se leen en Vercel y Supabase (y Better Stack si se suma) y hoy no conecta.
- `datarobot-agent-skills`: Plataforma de aprendizaje automático empresarial; no se entrenan modelos.
- `design-dev-bridge`: Puente entre Figma y código; no usamos Figma.
- `design-is-code`: Convierte diagramas UML en pruebas de Java; el proyecto es TypeScript.
- `figma`: Conector y skills de Figma (instalado dos veces con el mismo nombre); el diseño se hace en código y no hay archivos de Figma.
- `figma-suite`: Sincronización de tokens y componentes con Figma; no usamos Figma.
- `figma-to-code`: Pasa marcos de Figma a componentes; no hay marcos de Figma.
- `finestructure`: Plataforma alternativa de alojamiento y agentes de WhatsApp por otro canal; el canal oficial es la API de Meta y el alojamiento es Vercel.
- `geoai`: Ciencia de datos geoespaciales (satélites, LIDAR); no hay análisis geográfico.
- `ghost-writer`: Escritura colaborativa de libros.
- `github-portfolio-builder`: Evalúa perfiles de GitHub como portafolio de trabajo.
- `linear`: Seguimiento de incidencias en Linear; los pendientes viven en `08-pendientes-y-plan.md` y la Bandeja.
- `memories`: Diario de sesiones paralelo al cerebro.
- `memory-agent`: Memoria universal en markdown que compite con el cerebro.
- `memory-bank`: Memoria estructurada paralela; duplica el cerebro.
- `claude-memory`: Otro sistema de memoria categorizada; duplica el cerebro.
- `merch`: Búsqueda de merchandising de proveedores éticos; hoy no conecta y no hay merchandising.
- `mobile-app-design`: Diseño de aplicaciones nativas de iPhone; el panel es web.
- `mobile-design-system`: Sistema de diseño para una app móvil nueva; no hay app.
- `obsidian-notes`: Notas en formato Obsidian; no se usa Obsidian.
- `obsidian-sync`: Sincroniza markdown con una bóveda de Obsidian; no se usa.
- `opensearch-agent-skills`: Despliegue de OpenSearch; no se usa.
- `operations`: El segundo plugin con este nombre hace análisis de documentos KYC (identificación de clientes bancarios); no aplica. El de procesos sí está en Dirección.
- `pbip-accessibility`: Accesibilidad de informes de Power BI; no se usa Power BI.
- `pencil-dev-skill`: Herramienta de diseño específica (pencil.dev); no se usa.
- `qt-development-skills`: Desarrollo de aplicaciones de escritorio con Qt.
- `quality-supervisor`: Inteligencia de pruebas sobre la plataforma Qase; las pruebas viven en el repo.
- `rayden-ui-design-skill`: Biblioteca de componentes propia de otra empresa.
- `render`: Alojamiento en Render; el despliegue es en Vercel.
- `reverse-engineering`: Ingeniería inversa de software; no corresponde.
- `stackhawk-api`: Escaneo de seguridad de aplicaciones con la plataforma StackHawk; requiere cuenta ajena al proyecto.
- `study-planner`: Planificador de estudio personal en alemán.
- `vanta`: Cumplimiento SOC 2 y similares de empresas de software.
- `wix`: Constructor de sitios; las landings ya van en el propio código.

## Necesitan cuenta, acceso o pago

Lista para la sesión de accesos: plugins con servidor MCP que requieren que el dueño conecte una cuenta o pague. «Pidió autorización al iniciar» o «falló al conectar» son estados vistos en la sesión del 22/11; «sin verificar» significa que no se comprobó. Los datos de acceso no se escriben en ningún archivo del repositorio: se cargan en los conectores o en las variables de Vercel.

| Plugin | Qué hay que conectar o pagar | Escritorio | Estado o nota |
| --- | --- | --- | --- |
| `windsor-ai` | Cuenta Windsor con las plataformas conectadas (Meta, Instagram, GA4, Search Console) | Análisis y Redes | Conector ya presente en la sesión; confirmar qué cuentas están enlazadas |
| `search-visibility-kit` | Google (Search Console y GA4) por OAuth; IndexNow sin cuenta | SEO y Análisis | Hoy el servidor de analítica agotó el tiempo al conectar |
| `seo-gsc-wizard` | Google (Search Console, GA4) y opcional Bing | SEO y Análisis | Alto valor: es lo que mide qué landing rinde |
| `adcopilot` | Google Ads, GA4, Search Console y Tag Manager por OAuth | Análisis y SEO | Lectura libre; escribir en Ads requiere el OK del dueño |
| `adspirer-advertising-agent` | Cuenta Adspirer con cuentas de anuncios (Google, Meta, TikTok) | Análisis | Pidió autorización al iniciar |
| `advisorppc` | Google Ads por OAuth | Análisis | Pidió autorización al iniciar |
| `adwhispr-ads` | Cuenta AdWhispr | Análisis | Pidió autorización al iniciar |
| `adzviser` | Cuenta Adzviser con las fuentes de datos | Análisis | Pidió autorización al iniciar |
| `supermetrics-marketing` | Cuenta paga de Supermetrics | Análisis | Sin verificar |
| `socialinsider` | Cuenta paga de Socialinsider | Análisis | Sin verificar |
| `fullstory` | Cuenta de Fullstory con el código en las landings | Análisis | Sin verificar; requiere instalar el código de seguimiento |
| `hyper-marketing` | Cuenta Hyper | Análisis | Sin verificar |
| `agency-mcp` | Cuentas de Google y Meta de los clientes | Análisis y SEO | Pidió autorización al iniciar; solo agencia Kocos |
| `brightdata-plugin` | Cuenta de Bright Data (uso con costo) | Análisis | Pago: no usar sin OK |
| `marketing` | Conectores opcionales (analítica, CRM) | Análisis y Redes | Las skills sirven sin conectar |
| `vidiq` | Cuenta vidIQ y, si se quiere, canal de YouTube | Redes | Parte de las funciones gastan créditos |
| `viralhunt` | Cuenta ViralHunt | Redes | No usar `publish` sin OK |
| `ayrshare` | Cuenta paga de Ayrshare | Redes (respaldo) | Solo si Metricool no cubre una red |
| `klaket` | Cuenta de Klaket | Redes y SEO | Pago o créditos |
| `admakeai` | Cuenta AdMakeAI con créditos y conexión a Meta | Redes | Pago; los lanza el dueño |
| `ugc-video-ads` | Cuenta ManyMotions con créditos | Redes | Pago |
| `abracadabrax-ai-video-generator` | Cuenta Abracadabrax con créditos | Redes | Pago |
| `abracadabrax-background-music-generator` | Cuenta Abracadabrax con créditos | Diseño | Pago |
| `abracadabrax-image-video` | Cuenta Abracadabrax con créditos | Redes | Pago |
| `abracadabrax-product-photo-generator` | Cuenta Abracadabrax con créditos | Mínimo | Pago |
| `abracadabrax-social-media-image` | Cuenta Abracadabrax con créditos | Redes | Pago |
| `abracadabrax-song-maker` | Cuenta Abracadabrax con créditos | Mínimo | Pago |
| `clipwave-video-image-maker` | Cuenta ManyMotions con créditos | Redes | Pago |
| `logo-maker` | Cuenta ManyMotions con créditos | Mínimo | Pago |
| `aitopia` | Cuenta AITOPIA con créditos | Redes y Diseño | Pidió autorización al iniciar |
| `canva` | Cuenta de Canva por OAuth | Redes y Diseño | Pendiente de autorizar según `11-equipo-y-herramientas.md` |
| `adobe-for-creativity` | Cuenta Adobe (parte de las funciones son gratis, otras gastan créditos) | Diseño | Conector Adobe presente; cada función dice su costo |
| `codesign` | Cuenta IMG.LY para generar recursos con IA | Diseño | El motor básico no gasta |
| `creative-claw` | Cuenta Creative Claw con créditos | Diseño | Pidió autorización al iniciar |
| `kling-ai` | Cuenta Kling con créditos | Diseño | Pago |
| `ai-video-editor` | Cuenta con créditos de generación | Diseño | Pidió autorización al iniciar |
| `apiai` | Cuenta apiai.me | Diseño | Pidió autorización al iniciar |
| `blueprint-studio` | Cuenta Blueprint Studio | Diseño | Pidió autorización al iniciar |
| `21st` | Cuenta 21st | Diseño | La IA alojada puede costar |
| `a1-gallery` | Cuenta A1 Gallery | Diseño | Sin verificar |
| `mobbin` | Cuenta Mobbin | Diseño | Sin verificar |
| `refero` | Cuenta Refero | Diseño | Sin verificar |
| `animatedwebs` | Cuenta AnimatedWebs | Diseño y SEO | Pidió autorización al iniciar |
| `8b-ai-website-builder` | Cuenta 8b con créditos | SEO y landings | Pago |
| `website-design` | Cuenta del servicio de diseño de sitios | SEO y Diseño | Sin verificar |
| `ai-advisors` | Cuenta AI Advisors | SEO | Sin verificar |
| `brandvane` | Cuenta Brandvane | SEO | Pidió autorización al iniciar |
| `blogr` | Cuenta Blogr | SEO | Pidió autorización al iniciar |
| `datafluxor` | Cuenta Datafluxor | SEO | Pidió autorización al iniciar |
| `brand-voice` | Conectores (Drive, Notion u otros) y la cuenta de Box configurada | Redes | Pidió autorización al iniciar |
| `design` | Conectores de diseño opcionales | Diseño | Las skills sirven sin conectar |
| `product-management` | Conectores opcionales (Jira, Notion, etc.) | Dirección | Las skills sirven sin conectar |
| `operations` | Conectores opcionales | Dirección | Las skills sirven sin conectar |
| `sales` | Conectores de CRM, correo y calendario | Bots y Jarvis | Las skills sirven sin conectar |
| `small-business` | Gmail, Calendar y Drive por OAuth (QuickBooks y Shopify no se conectan) | Jarvis | Alto valor para el resumen diario |
| `productivity` | Conectores opcionales | Jarvis | Las skills sirven sin conectar |
| `enterprise-search` | Una cuenta por cada fuente que se quiera buscar | Jarvis | Pidió autorización (Guru) al iniciar |
| `zapier` | Cuenta de Zapier | Mínimo | Solo si se necesita |
| `github` | Token de GitHub bien formado | Ingeniería | Falló al conectar: encabezado de autorización con formato incorrecto |
| `engineering` | Datadog y PagerDuty opcionales | Ingeniería | Datadog falló al conectar; no hacen falta |
| `aictrl` | Cuenta aictrl | Ingeniería | Pidió autorización al iniciar |
| `betterstack` | Cuenta Better Stack | Ingeniería | Pidió autorización; hay plan gratis limitado |
| `cloudflare` | Cuenta Cloudflare (solo para Turnstile) | Mínimo | Pidió autorización al iniciar |
| `scanmalware` | Cuenta ScanMalware | Mínimo | Sin verificar |
| `saleshandy` | Cuenta paga de Saleshandy | Mínimo | Solo agencia Kocos; lo lanza el dueño |
| `ansvar-compliance-skills` | Cuenta Ansvar | Mínimo | Pidió autorización al iniciar |
| `controllerai` | Cuenta Controller AI | Mínimo | Pidió autorización al iniciar |
| `activecampaign` | Cuenta de ActiveCampaign y URL configurada | Mínimo | Falló: dirección sin configurar; no se conecta |
| `miro` | Cuenta de Miro | Mínimo | Sin verificar |
| `context-dev` | Cuenta context.dev | Mínimo | Pidió autorización al iniciar |
| `claude-patterns` | Servidor propio sin cuenta externa conocida | Mínimo | Sin verificar |
| `claude-performance` | Servidor propio sin cuenta externa conocida | Mínimo | Sin verificar |
| `figma-to-code` | Cuenta de Figma | No aplican | No se conecta |
| `figma` | Cuenta de Figma | No aplican | No se conecta |

Prioridad sugerida para la sesión de accesos: primero lo que da lectura de datos propios (Search Console y GA4, Windsor, Metricool, Gmail y Calendar para Jarvis), después referencias de diseño, y al final los generadores con créditos, que solo se contratan si los dueños lo deciden.
