---
description: Protocolo obligatorio para Claude y para cada subagente antes de empezar cualquier tarea. Herramientas, cerebro y reglas. Lo pidió el dueño el 22/11.
actualizado: 2026-11-22
---

# Arranque obligatorio: Claude y todos los subagentes

Orden del dueño (22/11): «siempre tienen que estar esas reglas marcadas, para vos, para los subagentes, para todos. Hay demasiadas herramientas que no estamos usando y nos alarga mucho el trabajo».

**Todo agente** lee este archivo antes de empezar: el chat principal, los subagentes, las copias aisladas, los escritorios de la Oficina y las tareas programadas. Quien delega pega en el pedido esta línea:

> Antes de empezar, leé `cerebro/00-arranque-para-agentes.md` y cumplilo. Al final, informá qué skills, plugins, conectores y agentes usaste y qué aportó cada uno.

## 1. El cerebro completo está disponible para todos

- Está en `cerebro/`, en la rama `cerebro-chats` y en `main`. Arrancá por `README.md` (índice).
- Leé siempre:
  - `02-ordenes-vigentes.md`: lo más nuevo, al final;
  - `14-estilo-del-dueno.md`: gustos y la tabla de errores que no se repiten.
- Leé también el archivo del área que toca la tarea:
  - Diseño: `14` y `biblioteca/rediseno-2211/`.
  - Bots: `03`.
  - Redes: `04`.
  - Landings: `05`.
  - Técnica: `06`.
  - Estado real: `07`.
- Para conocimiento sectorial de los 4 rubros, consultá `biblioteca/complementaria-2211/`. Es material extra: no cambia reglas.
- No releas todo de cero. Usá el índice y buscá con grep lo que necesitás.

## 2. Herramientas: usar todas las que sumen, siempre

1. **Mapa:** en `18-mapa-de-skills-y-plugins.md` buscá tu escritorio y usá todas las skills, plugins y agentes que aporten. No hace falta pedir permiso.
2. **Buscar más al empezar:**
   - skills con `SearchSkills` o `coding-skills:find-skill`;
   - plugins con `SearchPlugins`;
   - herramientas diferidas con `ToolSearch`. Muchos conectores aparecen recién al buscarlos.
3. **Conectores habilitados en este proyecto:**
   - Supabase: base, solo lectura salvo que la tarea lo pida.
   - Vercel: despliegues, errores y logs.
   - GitHub.
   - Metricool: redes.
   - A1 Gallery y 21st: referencias y componentes de diseño.
   - Figma, Adobe y Canva: diseño de piezas.
   - Gmail y Calendar: Jarvis.
   - PostHog y Firecrawl: solo con OK del dueño.
   - Lo que pida pago o plan (por ejemplo Mobbin) no se usa sin autorización.
4. **Por tipo de tarea, como mínimo:**
   - **Diseño o pantallas:**
     - skills: `frontend-design`, `kocos-crm-diseno-y-accesibilidad`, `interface-design`, `web-design-guidelines`, `vercel-react-best-practices`, `ui-ux-pro-max`, `ui-consistency:*`, `design:design-critique`, `design:accessibility-review` y `vectorlab-ux-skills:*`;
     - referencias con A1 Gallery (`a1-gallery:design-researcher`) y 21st;
     - revisión con `fairmind-design:fairmind-accessibility-orchestrator`.
   - **Código:**
     - skills: `superpowers:test-driven-development`, `superpowers:verification-before-completion`, `backend-design:*` y `supabase-postgres-best-practices`;
     - revisión con `agent-protocols:code-reviewer`, `agent-protocols:security-auditor` y `agentic-council:Skeptic`.
   - **Bots y captación:**
     - skills: `kocos-crm-reglas-de-captacion` y `kocos-agentes-entrenamiento-y-evaluacion`;
     - agentes «Traktuje prompt jak kod» y `agentic-council:Oracle`.
   - **Redes y contenido:**
     - skills: `kocos-contenido-y-publicacion`, `social-media-skills:*`, `brand-voice:*` y `humanizer`;
     - Metricool.
   - **SEO y landings:**
     - skills: `kocos-landings-seo-y-conversion` y `seo-aeo-geo-ultimate:*`;
     - agentes `searchfit-seo:*`.
5. Las skills del proyecto (`kocos-*`) mandan sobre las de terceros.

## 3. Reglas que nunca se saltean

- No se paga nada sin autorización expresa del dueño.
- Nada se borra: se archiva o pasa a «Más» o a borrador.
- Los rubros van separados.
- Las campañas y la publicidad las lanzan los dueños.
- Las claves van solo en Vercel. El código de ingreso al panel nunca se escribe en archivos.
- No hay datos de prospectos en documentos, pruebas ni capturas.
- La Preview comparte base con producción.
- Diseño (22/11):
  - simple y fácil, con estadísticas circulares y animaciones simples;
  - estética clásica del panel más detalles premium: sombras suaves, relieve y 3D sobrio;
  - **sin fondo raro**;
  - accesible AA, con modo oscuro.
- Al terminar:
  - verificar de verdad (typecheck, pruebas y build);
  - informar qué se especificó, qué se implementó, qué se probó y qué se publicó;
  - informar qué herramientas se usaron.
- Lo aprendido se anota en el cerebro (bitácora o archivo del área). Una corrección del dueño va a la tabla de errores de `14`.

## 4. Agentes personalizados (usarlos, no solo los generales)

Hay unos 280 agentes instalados por plugins. Hay que elegir el especialista, no un agente general:

- **Diseño:**
  - `a1-gallery:design-researcher` para referencias medidas;
  - `agentic-council:Artisan`, `agentic-council:Advocate` y la skill `design-council`;
  - `fairmind-design:*` para verificar el diseño y la accesibilidad;
  - `agent-protocols:accessibility-specialist`.
- **Código:**
  - `agent-protocols:code-reviewer`, `agent-protocols:security-auditor`, `agent-protocols:test-engineer` y `agent-protocols:performance-engineer`;
  - `backend-design:*` para esquema, seguridad e incidentes;
  - `web-vitals-auditor:perf-forensics`;
  - `claude-security:claude-security` para la revisión completa.
- **Decisiones:**
  - `agentic-council:Skeptic` como abogado del diablo, más `Strategist` y `Steward`;
  - `mind-plus-plus:specialist-judge`.
- **Análisis y redes:**
  - `mind-plus-plus:marketing-*`;
  - `brand-voice:*`;
  - en `agent-architecture-designer`: «Strateg Tresci Social» y «Pisarz w Twoim Glosie».
- **SEO:** `searchfit-seo:*` y `ai-advisors:ai-visibility-auditor`.

Cada tarea grande termina con al menos 2 revisores independientes de especialidades distintas.


## Regla del 27/11: usar todo lo instalado
Antes de empezar, buscá qué plugins, conectores, herramientas MCP, skills y agentes personalizados sirven para tu tarea (`ToolSearch`, `SearchSkills`, listado de agentes) y usalos sin esperar permiso, salvo lo que cueste plata (eso siempre con autorización expresa). Guardá lo importante también en la memoria (Cognee). Al cerrar, decí qué usaste.
