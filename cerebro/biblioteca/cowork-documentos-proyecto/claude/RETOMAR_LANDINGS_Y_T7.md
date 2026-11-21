# Retomar: subir landings y empezar T7 (22/10)

## Estado
- CRM en producción: `main` `687663c` (T1–T6 + indicador real de canales). Nada pendiente de subir.
- Landings: cambios listos pero NO subidos. GitHub devolvió 403 («Resource not accessible by integration») al escribir en los 4 repos, tanto por `git push` como por el conector (`push_files`). La lectura sí funciona.
- Paquete: `entrega-landings-2110.zip` (enviado en el chat del 21/10): `archivos/<repo>/apps/...` (archivos completos modificados), `<repo>.patch`, `LEEME_PROGRAMADOR.md`, `ESTRATEGIA_SEO_LANDINGS.md` (también en `claude/LANDINGS_SEO_ESTRATEGIA.md`).

## Repos (owner EzequielGonz, rama main)
- `estudio-juridico-vita-final`, `coberturas-sociales-landing`, `0km-kocos-agencia`, `agencia-kocos-mkt`.
- Todos: React Router/Horizons, código en `apps/web/src`. Estilos nuevos en `apps/web/src/styles/ajustes.css`, enlazados en `root.tsx` (después de `articulos.css`). No se toca `index.css`.

## Qué cambia por repo
- VITA: FIRM_NAME «VITA Abogados» + FIRM_LONG_NAME junto al logo (`site-header.tsx`); `brand.ts` con SITE_URL https://estudiojuridicovita.com, tel/WA 5491138582311, mail, IG, FB; `leads.ts` → webhook `https://legal-crm-nine.vercel.app/api/landing?perfil=juridico` (+ `llegada`); WhatsApp con mensaje propio en hero, traffic, workplace, contact, final-cta.
- Coberturas: `brand.ts` (comparatuobrasocial.com, 5491172900587…), `leads.ts` webhook perfil=coberturas_medicas con `paraCrm`, `seccion-cta.tsx` nuevo, botones `button-whatsapp` en hero/contact-buttons/faq/contact-form, 3 SeccionCta en `routes/home.tsx`.
- 0 km: `brand.ts` (autoskocos.com, 5491140674772…), `leads.ts` webhook perfil=agencia_0km con `paraCrm`, `seccion-cta.tsx`, 3 SeccionCta y flotante con mensaje.
- Marketing: `constants/site.ts` CONTACT con WA 5491172502391 (línea del CRM), phone, mail, IG, FB; footer con tel y mail; `leads.ts` webhook perfil=marketing; `seccion-cta.tsx`, 3 SeccionCta en home.

## Cómo subir en el chat nuevo
1. Probar escritura con 1 archivo chico (`apps/web/src/styles/ajustes.css` de VITA) vía `push_files` a `main`.
2. Si anda: subir el resto por repo desde los archivos del zip (pedir el zip si no está en el entorno), y verificar SHA de cada blob contra el repo.
3. Si da 403: en GitHub → Installed GitHub Apps → app del conector de Claude → «Contents: Read and write» + aceptar permisos pendientes + los 4 repos en Repository access.
4. Después de publicar: probar un formulario ficticio por landing (entra al CRM con fuente «landing») y cargar `sitemap.xml` + solicitar indexación en Search Console (las 4 propiedades de dominio ya están verificadas; 0 impresiones en 28 días al 22/10).

## Pendientes ajenos
- Meta: aprobación de `form_recibido_autos` y `form_recibido_cob`.
- Instagram/Facebook de Coberturas, Autos y Marketing: faltan `FACEBOOK_<AREA>_PAGE_ACCESS_TOKEN` en Vercel.

## Siguiente tarea
T7: estrategia de contenido de 15 días para los 4 rubros en Metricool (marcas conectadas: Kocos Marketing 7242607, Estudio Juridico Vita 7549864, Compara Tu Obra Social 7549939, Automotores Kocos 7552104; FB + IG). Pausar para validar la estrategia antes de programar. No publicar sin aprobación.
