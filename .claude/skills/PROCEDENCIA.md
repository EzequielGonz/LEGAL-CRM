# Procedencia de las skills de terceros

Copias fijas, revisadas el 12/10/2026 y confirmadas el 13/10/2026, para que cualquier sesión de Claude Code que abra este repositorio las tenga sin instalar nada. Cada carpeta conserva la licencia de su autor. Las skills propias del proyecto empiezan con `kocos-` y no son de terceros.

**Regla de uso.** Estas skills son guías generales. Si alguna contradice una regla del proyecto, prevalecen las skills `kocos-*`, `CLAUDE.md` y el documento único. Ninguna autoriza por sí sola cambios de negocio, envíos, entrenamientos pagos ni publicaciones en producción.

| Skill | Repositorio | Ruta de origen | Commit y fecha | Licencia | Cambios en esta copia |
| --- | --- | --- | --- | --- | --- |
| `frontend-design` | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | `plugins/frontend-design/skills/frontend-design` | `f359d43` · 10/10/2026 | Apache 2.0 (`LICENSE.txt`) | Ninguno |
| `interface-design` | [Dammyjay93/interface-design](https://github.com/Dammyjay93/interface-design) | `.claude/skills/interface-design` | `2f9be32` · 20/06/2026 | MIT | Se agregó el `LICENSE` del repositorio |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `.claude/skills/ui-ux-pro-max` | `7246805` · 12/10/2026 | MIT | `LICENSE` agregado; nota del proyecto al principio de `SKILL.md`; sin `scripts/tests` ni `scripts/validate_data.py`, que son herramientas de desarrollo del autor |
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `skills/react-best-practices` | `063bee9` · 28/08/2026 | MIT, declarada en `SKILL.md` (el repositorio no trae archivo de licencia) | La carpeta toma el nombre que declara la skill; contenido igual al original |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) y [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | `skills/web-design-guidelines` y `command.md` | `063bee9` · 28/08/2026 y `434b7f9` · 05/10/2026 | MIT (`references/LICENSE`) | Nota del proyecto en `SKILL.md`; copia local de las pautas en `references/command.md` para cuando no se puedan descargar |
| `seo-audit`, `ai-seo`, `schema`, `site-architecture`, `cro` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `skills/<nombre>` | `1efedbc` · 08/10/2026 | MIT | `LICENSE` agregado en cada carpeta; sin la carpeta `evals` |
| `supabase-postgres-best-practices` | [supabase/agent-skills](https://github.com/supabase/agent-skills) | `skills/supabase-postgres-best-practices` | `c9be0e9` · 02/10/2026 | MIT | Se agregó el `LICENSE` del repositorio |

## Comprobaciones

- Cada `SKILL.md` tiene nombre y descripción, y el nombre coincide con su carpeta.
- Claude Code descubre las skills de `.claude/skills` al abrir el repositorio.
- `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --domain ux` responde con la base local, sin red.
- Ninguna skill trae archivos `.ts` o `.tsx`. Igual, `tsconfig.json` excluye `.claude` para que nada de acá entre en la compilación.

## Complementos pedidos en el parche 2.0 (sección 20) y lo que existe de verdad

Comprobado el 13/10/2026 en el catálogo de complementos de esta cuenta de Claude. Ninguno se instaló por este trabajo: las instrucciones útiles se trasladaron a las skills `kocos-*`.

| Pedido en el Word | Qué existe en Claude | Dónde quedó el procedimiento |
| --- | --- | --- |
| Software Architect | No existe con ese nombre. El complemento «Engineering» (Anthropic, activo en la sesión) trae `architecture`, `system-design`, `code-review`, `deploy-checklist`, `testing-strategy` y `tech-debt` | Contratos, dependencias y evolución compatible: `kocos-crm-contexto` y `kocos-crm-reglas-de-captacion` |
| Software and AI Copilot | No existe con ese nombre; es el trabajo normal de Claude Code sobre el repositorio | Revisión, implementación incremental y pruebas: `kocos-crm-pruebas-de-aceptacion` |
| Cloudflare RLS | Existe el complemento «Cloudflare» (comunidad, no activo). No aplica: el proyecto no tiene fronteras Cloudflare y el parche prohíbe introducir Workers o D1 por disponer del complemento | Aislamiento y accesos según Supabase y PostgreSQL reales: `kocos-crm-pruebas-de-aceptacion` y `supabase-postgres-best-practices` |
| Platform Engineering Copilot | No existe con ese nombre | Entornos, credenciales, costos y recuperación: `kocos-crm-contexto` (entrega) y `kocos-crm-pruebas-de-aceptacion` |
| UI UX Designer | No existe con ese nombre. El complemento «Design» (Anthropic, disponible, no activo) trae `accessibility-review`, `design-critique`, `design-system` y `ux-copy` | Flujos, sistema visual, estados y accesibilidad: `kocos-crm-diseno-y-accesibilidad`, con `interface-design`, `ui-ux-pro-max` y `web-design-guidelines` |
| Superdesign | Existe en el catálogo (socio, no activo); necesita su lienzo conectado | Si se activa, sus propuestas se llevan al código y se comprueban; sin él, se usan el sistema visual y los prototipos del proyecto |
| Skill creator | Existe en el catálogo (Anthropic, no activo) y como skill de la sesión | Las skills de este repositorio se validan con `python3 -I` sobre `.claude/skills` y con tareas concretas (`kocos-crm-pruebas-de-aceptacion`) |

## Herramientas que no se incorporaron como skill

| Herramienta | Situación | Alternativa en uso |
| --- | --- | --- |
| Complemento de Vercel | No se incorpora (parche 2.0, sección 18.2) | Conexión directa de Vercel en la sesión de Claude y entornos aislados temporales |
| Supabase de solo lectura | La conexión directa de la sesión puede leer y escribir | Solo consultas de lectura desde Claude; las migraciones las aplica una persona en el editor SQL |
| Playwright y Chrome DevTools como servidores MCP | No instalados en el proyecto | Navegador automatizado local para copias del panel, cuando haya dependencias instaladas |
| Context7 y Figma | Disponibles en el catálogo de conectores, sin instalar | Documentación oficial y diseños compartidos a mano |
| Search Console | Sin conector en esta sesión | Integración por la API oficial con autorización OAuth de la propiedad (preparada en `kocos-landings-seo-y-conversion`); una exportación manual solo como comprobación puntual |

## Cómo actualizar una skill

1. Clonar el repositorio de origen en un commit nuevo y comparar con la copia (`diff -r`).
2. Conservar la licencia y las notas del proyecto, y no agregar scripts que necesiten red o claves.
3. Actualizar esta tabla con el commit, la fecha y los cambios.
