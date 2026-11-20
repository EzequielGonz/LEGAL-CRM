---
description: El equipo virtual (roles), qué skills, plugins, conectores y agentes usar por tipo de tarea, y su estado de conexión
actualizado: 20/11/2026
---

# Equipo y herramientas

Regla de la responsable (15/11 y 20/11): usar **todo** lo disponible que sume calidad, sin pedir permiso salvo pagos; al empezar cada tarea buscar más (`SearchSkills`, `SearchPlugins`, `coding-skills:find-skill`, `skill-discovery:scan`); trabajos grandes repartidos entre agentes en paralelo (copias separadas si tocan código), revisión cruzada y segunda opinión de otro modelo (`codex-review:*`, `codex-dispatch` si están disponibles). Al delegar, pasar la lista de skills útiles y permiso para usar otras.

## Roles del equipo (Claude los asume o los reparte)

| Rol | Se ocupa de | Skills y plugins de cabecera |
| --- | --- | --- |
| Director/a de operaciones (orquestador) | Leer el cerebro, priorizar, repartir, cerrar con estados de evidencia, actualizar memoria | superpowers:dispatching-parallel-agents, superpowers:subagent-driven-development, megapowers:orchestrating, agent-protocols:planning-and-task-breakdown, superpowers:verification-before-completion |
| Ingeniero full stack senior (CRM) | Next.js 15, rutas, reglas en `src/lib`, latido, Meta/Wasender | kocos-crm-contexto, kocos-crm-reglas-de-captacion, vercel-react-best-practices, backend-design:*, superpowers:test-driven-development, superpowers:systematic-debugging, code-review, simplify |
| DBA | Migraciones, RLS, consultas, rendimiento | supabase:supabase, supabase-postgres-best-practices, backend-design:review-migration, backend-design:schema-reviewer (agente) |
| Seguridad | Auditorías, secretos, sesiones, inyección en prompts | security-review, claude-security (agente), agent-protocols:security-and-hardening, backend-design:security-reviewer |
| QA | Pruebas, casos A01–A35, recorrido como usuaria | kocos-crm-pruebas-de-aceptacion, run, agent-protocols:browser-testing-with-devtools, ui-consistency:verifying |
| Diseñador de producto (panel) | Vidrio/3D, accesibilidad, consistencia | kocos-crm-diseno-y-accesibilidad, ui-consistency:*, interface-design, ui-ux-pro-max, frontend-design, web-design-guidelines, vectorlab-ux-skills:*, design:accessibility-review |
| Ingeniero de IA (bots) | Prompts, fichas, Laboratorio, evaluación | kocos-agentes-entrenamiento-y-evaluacion, claude-api (si toca Claude), agentic-council:oracle-* , agent-design:* |
| Director creativo + motion designer | Guiones, personajes, reels animados, ritmo viral | kocos-contenido-y-publicacion, animation-studio, remotion:*, social-media-skills:reels-script, hook-writer, short-form-video-script, video-shotcraft |
| Diseñador gráfico | Carruseles, historias, portadas | `.claude/referencias/redes/direccion-de-arte.md`, social-media-skills:carousel-writer, design-and-templates, thumbnail-design, brand-studio:* |
| Estratega de redes / community manager | Calendario, palabras clave, comentarios, informes | social-media-skills:content-calendar, analytics-and-reporting, instagram-growth, tiktok-growth, youtube-shorts, Metricool (MCP) |
| Redactor rioplatense | Textos de piezas, bots, landings | humanizer, megapowers:humanizing-prose, copywriting-kit:*, writing-skills:plain-language, slop-stopper:final-review |
| SEO y landings | SEO técnico, schema, contenido, conversión | kocos-landings-seo-y-conversion, seo-audit, ai-seo, schema, site-architecture, cro, seo-aeo-geo-ultimate:*, searchfit-seo:* |
| Performance / medición | UTM, GA4, píxel, embudos | product-tracking-skills:*, search-visibility-kit:* (GSC/GA4 si se autoriza), dataviz |
| Investigador de tendencias | Referencias, formatos que pegan | anthropic-skills:deep-research, social-media-skills:viral-reverse-engineering, trend-jacking, vidIQ (solo funciones sin créditos) |
| Abogado de contenido (VITA) | Chequear normas citadas, límites del Colegio | MCP JurisprudenciaARG (normas e Infoleg; nunca citar de memoria) |

## Agentes especializados útiles

general-purpose (paralelo), Explore (búsquedas amplias), Plan, agent-protocols:code-reviewer / security-auditor / test-engineer / accessibility-specialist, backend-design:incident-investigator, claude-security:claude-security, fairmind-design:* (accesibilidad), agentic-council:* (segundas opiniones por especialidad), web-vitals-auditor:perf-forensics, searchfit-seo:seo-auditor.

## Conectores y su estado (20/11)

| Conector | Estado | Uso |
| --- | --- | --- |
| Supabase (MCP) | **Funciona** | Base del CRM: SQL, migraciones, advisors, logs |
| Vercel (MCP) | **Funciona** (solo la cuenta del panel) | Despliegues, errores, logs. Las landings están en otra cuenta |
| Metricool (MCP) | **Funciona** | Programar y leer publicaciones de las 4 marcas |
| GitHub | MCP falló al conectar en esta sesión; git por proxy funciona (fetch/push a ramas `claude/*`) | Repos y PR |
| Claude Docs | Disponible | Documentos vivos para la responsable |
| JurisprudenciaARG | Disponible | Normas y fallos argentinos con fuente |
| Playwright + Chromium | Preinstalado | Recorrer el panel y las webs, capturas |
| Windsor.ai | Disponible, plan gratis 1 cuenta | Descartado para métricas |
| vidIQ, generadores de imagen/video (Abracadabrax, Kling, CreativeClaw, etc.) | Disponibles | **Gastan créditos: solo con autorización** |
| Search Console / GA4 (search-visibility-kit) | Requiere autorizar la cuenta de Google | Medición de las webs |
| Canva, Adobe y otros que piden OAuth | Sin autorizar | Se autorizan desde los conectores de claude.ai |

## Herramientas del entorno

- Node/npm, Python, pandoc, python-docx (Word para la responsable), ffmpeg y edge-tts (motor de reels: comprobar al arrancar), Playwright.
- Disco por sesión limitado: borrar `fr/` del motor y worktrees al terminar.
- Render de reels: 5–6 min cada uno en 4 núcleos; para volumen, repartir en hasta 8 sesiones en la nube (`create_session`) con el mismo pedido.

## Para Cowork / Claude in Chrome (escritorio de la responsable)

Lo que necesita su sesión (Business Suite, apps de Instagram, Search Console con su cuenta, QR de Wasender): se le deja un **prompt listo para pegar**, corto y por pasos.
