---
description: Traspaso para compactar (22/11, cierre). Rediseño simple y premium, Jarvis, Oficina 3D, recontacto 72 h publicado, regla de arranque obligatoria. LEER PRIMERO al retomar.
actualizado: 2026-11-22
---

# Traspaso · 22/11 (cierre)

Al retomar, leé en este orden:
1. `00-arranque-para-agentes.md`: regla número uno para Claude y para todos los subagentes.
2. Este archivo.
3. Lo último de `02-ordenes-vigentes.md`.
4. `14-estilo-del-dueno.md`, con la tabla de errores.

Claude trabaja como **director ejecutivo**: reparte en subagentes, revisa, junta, publica y verifica.

## Cupo y modelos

- El cupo semanal de **Opus se agotó**. Vuelve el **26/11 a las 22:00 UTC**. Los agentes trabajan con `model: "sonnet"`, que anda.
- El dueño pidió los mejores modelos: desde el 26/11, Opus.

## Dónde está cada cosa

- **Repos:**
  - `/home/user/LEGAL-CRM`, rama `cerebro-chats`. Cada push va también a `claude/admiring-euler-ctf4sg`.
  - `/home/user/crm-main`, rama `claude/cerebro-panel`, con push a **`main`** (producción).
  - Para que los agentes con worktree funcionen, primero `cd /home/user/LEGAL-CRM`. Desde `/home/user` el worktree falla.
- **Servicios:** Supabase `enhgkeqiqcuwafsedaza`; Vercel `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`, equipo `team_DGPKq7VRI79P0koUBcsxu1IH`, dominio legal-crm-nine.vercel.app.
- **Código de ingreso:** el dueño lo da en el chat. Se pasa solo como variable `PANEL_CODE` y **nunca** se escribe en archivos.
- **Scripts útiles** en el scratchpad de la sesión:
  - `humo.js` y `estado-actual.js`: Playwright contra producción.
  - Usan `PANEL_CODE` y swiftshader para WebGL.
- **Build local sin red a Google Fonts:**
  - `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx next build --no-lint`;
  - o `NEXT_FONT_GOOGLE_MOCKED_RESPONSES=<mock>`.
  - `npm run lint` falla en los worktrees por la ruta de la configuración de ESLint. No es del código.

## Publicado hoy (main, verificado)

| Qué | Commit | Estado |
|---|---|---|
| Recontacto 72 h por plantilla de Meta + gravedad en campañas de Jurídico | merge de `captacion/recontacto-plantillas-y-gravedad` (716b731 + 16f3c28 + 0a4cc1e) | Publicado. Migración **0640 aplicada**. Solo Jurídico encendido, con `max_dia` 40; 4 asignaciones «recontacto»; 2 tareas rellenadas en la ventana de 30 días; 5 contactos 2 pendientes en Jurídico al aplicar. Dos revisiones independientes, sin bloqueantes. |
| Oficina 3D (react-three-fiber diferido + diorama CSS en celular + lista accesible) | 9b467a7 | Publicada. Prueba de humo en producción: /cerebro, /perfiles, /inicio y /salud en 1440 y 390 px, sin errores ni desborde; la escena dibuja |
| Regla número uno: `cerebro/00-arranque-para-agentes.md` + `CLAUDE.md` + hook de arranque + skill `oficina` | b2cce2f | Publicada |
| Biblioteca complementaria de los 4 rubros (Word + paquete) en `cerebro/biblioteca/complementaria-2211/` | 27b9760 | Solo material extra. Las 135 fichas siguen **inactivas** (el alta directa las crearía activas: no usarla sin OK) |

**Para vigilar el recontacto:**
- tareas `followup_tasks` con `canal='plantilla_recontacto'`;
- que no salga nada dos veces;
- que respete el tope de 40 por día y el horario de lunes a sábado de 8 a 21.

Encender otro perfil: `jsonb_set` en `system_settings.recontacto_plantilla_meta`, solo con OK. Autos tiene calidad baja y Marketing no tiene línea en Meta.

## Ramas de diseño (sin publicar todavía)

| Rama | Qué | Estado |
|---|---|---|
| `diseno/fundacion-2211` | Tokens `premium.css` y componentes `src/components/premium/*` (Anillo, Medidor, Tarjeta, Cifra, SaludoJarvis, Bento, Boton, Encabezado, Escena3D, VerMas, Pastilla), más `/diseno-muestra` | Terminada. **Ojo:** trae un fondo mesh y esferas que el dueño rechazó («ese fondo raro no»). Los agentes de pantallas tienen orden de no usarlo |
| `diseno/jarvis-2211` | Jarvis secretario: orbe en todo el panel (Ctrl+J), sugerencias por pantalla, parte del día con 3 anillos, acciones con «¿Lo hago?», nunca lanza ni envía | **Repaso terminado**, commit 43cd738: sin mesh, trato al dueño en masculino, prompt v1.1, 44 px, contrastes medidos, docs. Al integrar, mergear después de marco-hoy y quedarse con lo de marco-hoy si choca |
| `diseno/marco-hoy-2211` | Menú de 5 destinos (Hoy, Chats, Campañas, Resultados, Salud) + «Más» + Hoy en bento; mergea Jarvis | **Terminada**, commit 429df4c. Trae Jarvis mergeado y sin fondo mesh (`panel-premium.css` reasigna tokens al panel). Hoy en bento con datos reales. Alto en celular: unas 2,2 pantallas. Hay que confirmar con el dueño el denominador del anillo grande |
| `diseno/chats-campanas-2211` | Chats y Campañas con anillos, botón «Dejar lista» | **Terminada**, commit ca5de44. Sin mesh. Falta la línea de salud en Campañas, porque no hay ese dato |
| `diseno/resultados-salud-cerebro-2211` | Embudo en anillos, medidor de Salud y Cerebro corto (Oficina arriba, resto plegado) | **Terminada**, commit 9f208f6, ya con main mergeado. Sin mesh (`premium-clasico.css`). El cerebro bajó de 9558 a unos 2658 px, la mayor parte es la Oficina 3D. Los 3 anillos salen de `contenido.ts` |
| `diseno/oficina-3d-repaso-2211` | Repaso de la Oficina publicada: herramientas, festejo del escritorio que termina su parte y docs | **Terminada**, commit 8bf4301: festeja el escritorio que dejó su parte, fondo sobrio, menos botones, AA y memo. Falta la revisión fairmind independiente |

## Lo que sigue (orden del dueño: «repasá que cumplan todo y si pasan, publicá»)

1. **Integrar** en una rama nueva desde `main`. Orden de merge:
   1. `marco-hoy`, que ya trae Jarvis y la fundación;
   2. `chats-campanas`;
   3. `resultados-salud-cerebro`;
   4. `oficina-3d-repaso`.
   Correr typecheck, pruebas unitarias y build.
2. **Revisión final con agentes personalizados independientes** (el dueño pidió usar TODOS los que sumen), en paralelo:
   - **Diseño contra el estilo del dueño:**
     - `design:design-critique` (skill) y el agente `agentic-council:Artisan`;
     - `agentic-council:Advocate`, sobre experiencia y simpleza;
     - el skill `design-council:design-council` si está;
     - `ui-consistency:verifying` y `vectorlab-ux-skills:anti-slop`, contra lo genérico.
   - **Accesibilidad:** `fairmind-design:fairmind-accessibility-orchestrator`, que coordina WCAG, contraste, teclado y lector de pantalla, y `agent-protocols:accessibility-specialist`.
   - **Código y seguridad:** `agent-protocols:code-reviewer`, `agent-protocols:security-auditor` (las rutas de Jarvis) y `agentic-council:Skeptic` (que Jarvis nunca lance ni envíe y que los rubros no se mezclen).
   - **Rendimiento:** `web-vitals-auditor:perf-forensics` (peso de la escena 3D y de cada ruta) y `agent-protocols:performance-engineer`.
   - **Producto y simpleza:** `agentic-council:Strategist` (¿cada pantalla tiene un objetivo?) y `agent-architecture-designer` «Audytor WCAG» o «Inspektor jakości» (QA Quality).
3. **Lista de criterios:**
   - **Diseño:**
     - estética clásica del panel, **sin fondo raro**;
     - anillos para las estadísticas y animaciones simples;
     - sombras suaves y 3D sobrio;
     - cada pantalla con 1 objetivo y de 1 a 1,5 alturas;
     - textos simples, nada genérico.
   - **Funcionamiento:**
     - nada se borra: lo que sale de la vista va a «Más»;
     - rubros separados;
     - Jarvis nunca lanza ni envía;
     - sin error #418 de hidratación;
     - accesibilidad AA con modo oscuro.
   - **Expectativas del dueño:** la Oficina como el video, Jarvis ayuda en todo, se ve premium.
4. **Si pasa:**
   - push a `main`;
   - prueba de humo en producción (`humo.js` ampliado a las 7 pantallas, compu y celular, consola limpia);
   - actualizar `07`, `08`, la bitácora y el traspaso;
   - **no mandar capturas** (el dueño lo pidió).

## Después (el dueño lo dejó para más adelante)

- **Propuesta de gestión de teléfonos:** investigación lista en `biblioteca/telefonos-investigacion-2211.md`. Wasender no se reconecta solo cuando pide QR. Se automatizan la detección, la pausa de campañas, el aviso y el reintento en un toque, con una pantalla «Teléfonos». Wasender para 13 chips cuesta USD 50 a 60 por mes: pedir OK.
- **Biblioteca complementaria:** matriz de duplicados y conflictos contra las fichas vigentes antes de activar algo.

## claude.ai (Claude in Chrome)

- La memoria y las preferencias quedaron cargadas.
- Proyecto «CRM COMPLETO»: las instrucciones (TEXTO C) se guardaron, pero **los archivos del núcleo no entraron en «Contexto»**. El dueño los sube a mano.
- Hay un chat creado por error, «CRM de captación multirubro». Queda, por decisión del dueño.

## Recordatorios

- Hay agentes que re-suscriben el PR EzequielGonz/LEGAL-CRM#80. Si llegan avisos, dar de baja; el PR queda para después.
- Pendientes del dueño en `17`: cambiar el código de ingreso (URGENTE), repo privado, rotar claves y Vault, conectores de la tarea programada.

## Notas para la integración

- Las 3 ramas de pantallas crearon cada una su propio CSS para reasignar los tokens al panel: `panel-premium.css` (marco y Hoy), `chats-campanas.css` y `premium-clasico.css` (Resultados, Salud y Cerebro). Al integrar, unificar en uno solo para no duplicar.
- La fundación y `diseno-muestra` traen Geist e Instrument Serif y el mesh. Marco y Hoy ya los sacó de Jarvis y de la muestra. Revisar que el layout no siga cargando fuentes que no se usan.
- Ningún agente corrió revisores independientes (no pueden lanzar subagentes): la revisión con agentes especialistas la lanza Claude desde el chat principal, como dice el paso 2.
- Herramientas que reportaron poco uso: `fairmind-design:*`, `vectorlab-ux-skills:*` y `ui-ux-pro-max`. Hay que cubrirlas en la revisión final.
- El repaso de Jarvis y el de la Oficina siguen corriendo cuando se escribe esto. Si Jarvis repasado choca con lo que ya mergeó marco-hoy, prevalece marco-hoy (sin mesh) y se suman solo las mejoras.
