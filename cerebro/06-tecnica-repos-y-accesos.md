---
description: Pila técnica, repos y ramas, base de datos, comandos, cómo publicar, variables (solo nombres) y accesos
actualizado: 20/11/2026
fuentes: Fase 2 §11 y §16, Fase 1 §12, CLAUDE.md, inventario de ramas del 20/11
---

# Técnica, repos y accesos

## Pila

- **CRM:** Next.js 15.5 + React 19, TypeScript, Tailwind; IA con `@google/genai` (Gemini 3.8 Flash). Vercel, funciones en `gru1`, producción `legal-crm-nine.vercel.app` (equipo `team_DGPKq7VRI79P0koUBcsxu1IH`, proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`).
- **Base:** Supabase PostgreSQL, proyecto `enhgkeqiqcuwafsedaza` (sa-east-1). RLS en todas las tablas; acceso desde el servidor con la clave de servicio. Latido `campaigns-tick` por pg_cron cada minuto vía pg_net.
- **Mensajería:** WhatsApp Cloud API de Meta (webhooks `/api/webhooks/whatsapp` y `/meta`), Instagram y Facebook Messaging; Wasender (QR).
- **Otros:** Metricool (redes), Outscraper (bases de Marketing), Resend (correo de formularios, sin activar).
- **Landings:** React Router en monorepo `apps/web`, Vercel en **otra cuenta**, dominios en DonWeb.

## Repos

| Repo | Para qué | Producción |
| --- | --- | --- |
| `EzequielGonz/LEGAL-CRM` | CRM, toda la documentación, este cerebro, motor de reels, calendarios | main → legal-crm-nine.vercel.app |
| `EzequielGonz/estudio-juridico-vita-final` | Landing VITA + piezas de redes | main → estudiojuridicovita.com |
| `EzequielGonz/coberturas-sociales-landing` | Landing Coberturas + piezas | main → comparatuobrasocial.com |
| `EzequielGonz/0km-kocos-agencia` | Landing Autos + piezas | main → autoskocos.com |
| `EzequielGonz/agencia-kocos-mkt` | Landing Kocos Marketing + piezas | main → kocosmkt.com |

Relacionados fuera de la sesión (sumables con `add_repo`): `agencia-0km-kocos` (landing vieja de autos), `scraper-mkt-digital` (extractor de Marketing), `estudiojuridico` y `ESTUDIOJURIDICOVITA-LANDING` (landings viejas de VITA), `leads`, `MapLeads`, `inmobiliaria-boceto`, `AutosMix`. La cuenta tiene 75 repos (66 públicos, 9 privados); el resto son proyectos viejos o de otros clientes.

## Ramas (inventario del 20/11; LEGAL-CRM tiene 88 ramas además de main)

**Integradas (82):** 11 contenidas en main + 69 fusionadas por PR (#5–#39, #41–#75, #78) sin trabajo posterior, entre ellas `feat/chat-adjuntar-pdf` (#75: **adjuntar PDF de hasta 16 MB ya está en producción**) y `adjuntos-chat-presupuesto` (#46). 2 obsoletas sin valor: `test-escritura-claude`, `trabajo-1410`. No se borran (orden «nada se borra»); se pueden ignorar.

**Con trabajo propio sin integrar (6):**

| Rama | Último | Adelante / atrás de main | Qué tiene | Qué hacer |
| --- | --- | --- | --- | --- |
| `claude/pensive-galileo-d6ephy` | 19/11 | 1 / 3 | Panel: Hoy más limpio, Archivar, «Archivados» en Descartados, marco de chats unificado, archivo automático a 30 días (apagado hasta `system_settings.archivo_automatico`). Migración `0634_archivo_de_prospectos.sql` | Renumerar a **0635** (y su mención en `docs/ESTADO.md`), revisar el `drop trigger if exists`, integrar (sin conflicto), probar, publicar |
| `claude/happy-wozniak-ajfi1z` | 20/11 | 43 / 2 | Solo redes y docs: diagnóstico, calendarios, kit de perfil, boceto VITA, motor v3, Google, traspasos (615 archivos). [PR #77](https://github.com/EzequielGonz/LEGAL-CRM/pull/77) abierto | Integrar a main junto con el cerebro |
| `claude/admiring-euler-ctf4sg` | 20/11 | 44 / 2 | happy-wozniak + **cerebro** (rama de esta sesión) | Integrar a main |
| `claude/festive-goldberg-x8t43f` | 20/11 | 44 / 2 | happy-wozniak + `docs/contexto/CONTEXTO-COMPLETO-2026-11-20.md` y su Word | Integrar (es el contexto de Fase 2) |
| `claude/gracious-volta-rv2f3x` | 10/11 | 18 / 124 | 18 commits posteriores al PR #76 que no están en ninguna otra rama: herramientas de reels (plan, espaciar, alojar, registrar), `docs/redes/plan-2026-11-10.json`, `programadas.jsonl` (registro de lo programado en Metricool), `palabras-clave-bot.md`, `docs/competencia/ANALISIS-2026-11-09.md` | **Rescatar**: se fusiona sin conflicto |
| `landings-conexion` | 20/10 | 2 / 166 | [PR #40](https://github.com/EzequielGonz/LEGAL-CRM/pull/40) abierto: aviso por correo con Resend al entrar un formulario (`src/lib/landing-email.ts` + 5 pruebas) | Resolver 1 conflicto (`api/landing/route.ts`) e integrar; se activa al cargar la clave de Resend |

**Landings:** `claude/admiring-euler-ctf4sg` y `claude/gracious-volta-rv2f3x` ya integradas. `claude/happy-wozniak-ajfi1z` = 1 commit «Medición (en curso)» (VITA `de62efd`, Coberturas `4ac2eb6`, Autos `c5012b0e`, Kocos `493322d3`): `analitica.ts` + `medicion.tsx` (GTM/GA4/píxel y verificaciones Google/Bing/Meta, **solo si existe la variable `NEXT_PUBLIC_*`**), `atribucion.ts` (UTM + fbclid 30 min, «(ref: IG-ART-0112)» en WhatsApp, `atribucion` y `llegada` en el formulario), `track.ts` (eventos a dataLayer/gtag/fbq sin repetir), robots con `Disallow: /redes/`, sitemap con fecha real, 12 pruebas. **Comprobado en las 4: npm ci, 12/12 pruebas, typecheck, lint y build en verde.** Antes de integrar: aplicar el parche del CRM (si no, el bot y el prospecto ven el «(ref: …)» como texto), documentar, recorrer en navegador y decidir aviso de cookies para píxel/GA4.

## Código del CRM (main `36f742b`)

- `src/app`: 99 páginas y 137 rutas de API (36 grupos). Zonas: `(dashboard)`, `panel/{agencia_0km,coberturas_medicas,marketing,[slug]}`, `telefono/[slug]`, `hoy`, `asistente`, `bandeja`, `perfiles`, `resultados`, `salud`, `incidencias`, `wasender`, `meta`, `redes`, `piezas`, `landing`, `login`.
- `src/lib`: ~264 archivos en 34 módulos (agentes 28, wasender 21, asistente 20, marketing 14, redes 14, seguimiento 10, plantillas 9, laboratorio 8). `src` ≈ 84 mil líneas.
- `supabase/migrations`: 84 archivos, 0001 → 0634 (cuatro `0511_conocimiento_v2_contenido_parte1..4`, huecos 0006–0099 y 0627–0629). **Próximo número libre: 0635.**
- `tests`: 108 archivos (75 unitarias, 15 de integración).

## Línea base de calidad (main `36f742b`, 20/11)

| Paso | Resultado |
| --- | --- |
| npm ci · typecheck (app y tests) · lint · build · npm audit | OK · 0 errores · sin avisos · OK (1 min 24 s) · 0 vulnerabilidades |
| Pruebas unitarias | **585 de 586**. Falla `tests/unitarias/asistente-catalogo.test.ts`: las rutas `asistente/charlas` y `asistente/charlas/[id]` (PR #78) no están en el catálogo ni en `FUERA_DEL_CATALOGO` de `src/lib/asistente/catalogo.ts` |
| Integración | No corrida (sin Docker en la sesión) |

## Landings: código

Las 4 iguales: monorepo `apps/web`, React Router ^8.3 (modo framework), Vite ^7.3, React ^19.2, Tailwind 3.4, three 0.169, gsap 3.13, framer-motion. En main: sin GA4/GTM/píxel, `VERIFICATION = { google: '', bing: '' }`, robots no bloquea `/redes/`. Piezas en `public/redes`: VITA 165, Coberturas 149, Autos 154, Kocos 149. Rutas: VITA `/accidentes-de-transito`, `/accidentes-laborales` (+ calculadora ART), `/guias`; Coberturas `/prepagas`, `/obras-sociales`, `/guias/cotizador-de-aportes`; Autos `/0km`, `/financiacion`, `/guias/simulador-de-cuotas`; Kocos `/servicios`, `/agencia-de-marketing-digital/:slug`, `/rubros`, `/guias/calculadora-de-automatizacion`.

## Base de datos

- Tablas principales: `rubros`, `contacts`, `conversations`, `messages`, `opportunities`, `campaigns`, `appointments`, `profile_lines`, `wasender_lineas`, `wasender_plantillas`, `wasender_segundos_intentos`, `ai_agents`, `agent_roles`, `agent_library` (+ versiones), `agent_experiments`, `agent_turn_logs`, `incidences`, `contact_detentions`, `webhook_quarantine`, `bandeja_claude`, `system_settings`, `ops_change_log` (todo cambio de datos con el valor anterior).
- **77 migraciones, última `0634_asistente_charlas`** (20/11). Numeradas por etapa (01xx, 02xx, 05xx, 06xx), repetibles sin error, con RLS, sin permisos para la clave pública, sin borrados. La 0300 (Fase 3 descartada) nunca se aplicó. Antes de aplicar una: `list_migrations` para ver el historial real.
- Llaves en `system_settings`: ver `07-estado-verificado.md`.

## Comandos

```bash
npm ci
npm run dev
npm run typecheck && npx tsc -p tests/tsconfig.json --noEmit
npm run lint
npm run build
npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts
bash tests/integracion/correr.sh
npm audit --omit=dev
```

~577 pruebas al 17/11; una falla vieja y ajena («asistente: cada tipo permitido…»).

## Cómo publicar

1. Integrar `origin/main` en la rama de trabajo antes de tocar código (las ramas de sesión suelen venir atrasadas).
2. typecheck, lint, pruebas, build.
3. Publicar a `main` (Vercel construye producción en ~1–2 min) y **después** subir la rama (si se suben las dos seguidas, producción espera en cola).
4. Recorrer como usuaria en producción antes de informar.
5. Migraciones: comprobar historial real, aplicar solo lo nuevo, verificar.

Notas Next 15: `params`, `searchParams`, `cookies()` y `perfilActivo()` con `await`; listas largas con `prefetch={false}`; llamadas largas a Gemini en segundo plano (`after`).

## Variables de entorno (solo nombres; los valores viven en Vercel)

Supabase (URL, clave pública, clave de servicio) · `WHATSAPP_<LÍNEA>` por línea de Meta · Gemini · `FACEBOOK_<CLAVE>_PAGE_ID`, `FACEBOOK_<CLAVE>_PAGE_ACCESS_TOKEN`, `INSTAGRAM_<CLAVE>_BUSINESS_ID` · `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID` · código de acceso · Wasender · Resend · Outscraper. En las landings: GA4, píxel y verificación (preparadas en la rama de medición).

## Accesos y cuentas

- Google del dueño administra Vercel de las landings, Search Console y GA4.
- Dominios: DonWeb. Metricool: un usuario para las 4 marcas.
- Panel: código general que el dueño da en el chat (no se guarda en archivos).
- Claude no puede entrar a la cuenta de Vercel de las landings ni a Search Console/GA4 sin que se autorice el conector o se haga por Cowork.
