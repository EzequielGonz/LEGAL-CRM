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

## Ramas que importan (LEGAL-CRM tiene ~89 ramas remotas)

| Rama | Qué tiene | Estado |
| --- | --- | --- |
| `main` | Producción | Último `36f742b` (20/11 05:25) |
| `claude/admiring-euler-ctf4sg` | Rama de esta sesión: = `happy-wozniak` + el cerebro | 43 commits detrás de main en código; solo suma documentos |
| `claude/happy-wozniak-ajfi1z` | Redes, motor de reels, calendarios, traspasos ([PR #77](https://github.com/EzequielGonz/LEGAL-CRM/pull/77), solo documentos) | Sin integrar |
| `claude/pensive-galileo-d6ephy` | Ajustes del panel 19/11 (Hoy, Archivar, Archivados) | 3 por delante / 1 detrás; migración a renumerar |
| `claude/festive-goldberg-x8t43f` | Contexto completo en Word (20/11) | Solo documento |
| `feat/chat-adjuntar-pdf`, `adjuntos-chat-presupuesto` | Adjuntar PDF en chats | Ver inventario |

En las 4 landings: `main` (piezas en `/redes/`), `claude/happy-wozniak-ajfi1z` (medición en curso), `claude/gracious-volta-rv2f3x` (vieja, 10/11).

El detalle rama por rama (integradas / con trabajo propio) se completa con el inventario del 20/11 abajo.

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

- Google de la responsable administra Vercel de las landings, Search Console y GA4.
- Dominios: DonWeb. Metricool: un usuario para las 4 marcas.
- Panel: código general que la responsable da en el chat (no se guarda en archivos).
- Claude no puede entrar a la cuenta de Vercel de las landings ni a Search Console/GA4 sin que se autorice el conector o se haga por Cowork.
