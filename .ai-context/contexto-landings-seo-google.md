# Contexto para un chat nuevo · Landings, SEO y Google (4 marcas)

Fecha: 20/11/2026. Este archivo es la fuente de verdad para trabajar en las landings, el SEO y todo lo de Google. El trabajo de contenido de redes (reels y calendario) sigue en otro chat: no lo toques.

## Cómo trabajar (reglas de la responsable)
- Español rioplatense, con voseo. Respuestas cortas, sin releer todo. Avisá en pocas palabras qué estás haciendo.
- Rol: agencia premium. Experto senior en SEO técnico y local, SEO para respuestas de IA (AEO/GEO), CRO, diseño web, analítica y Google (Search Console, Perfil de Empresa, GA4, YouTube).
- Usá todas las skills, plugins y conectores disponibles sin pedir permiso. Solo pedís autorización para pagar algo. Repartí los trabajos grandes entre agentes en paralelo.
- Instrucciones para la responsable: un solo prompt, claro y resumido. Si hay un archivo, que sea Word (.docx).
- Nada se borra. Ningún secreto ni dato personal real. Lo jurídico y lo de coberturas, con revisión profesional.
- Reglas del proyecto en `CLAUDE.md` y `.claude/referencias/reglas-comunes.md`. Skill del proyecto: `kocos-landings-seo-y-conversion`.
- Commit y push sin que te lo pidan. En LEGAL-CRM, rama `claude/happy-wozniak-ajfi1z` ([PR #77](https://github.com/EzequielGonz/LEGAL-CRM/pull/77)). En las landings, su rama `claude/happy-wozniak-ajfi1z`. A `main` de una landing solo se sube cuando está probado. Antes de pushear, `git pull --no-rebase`: el chat de redes también pushea a LEGAL-CRM.

## Skills, plugins y conectores útiles
- **Skills:** kocos-landings-seo-y-conversion, seo-audit, ai-seo, schema, cro, site-architecture, seo-aeo-geo-ultimate:* (seo-local, seo-technical, seo-schema, seo-content, seo-plan, seo-geo, seo-aeo), searchfit-seo:*, seo-gsc-wizard:*, search-visibility-kit:*, web-vitals-auditor:*, frontend-design, ui-ux-pro-max, vercel-react-best-practices, copywriting-kit:landing-page-copy, superpowers:verification-before-completion.
- **Conectores:**
  - Vercel. Las landings están en otra cuenta de Vercel; la cuenta conectada solo tiene el panel.
  - Supabase: el proyecto del CRM es `enhgkeqiqcuwafsedaza`.
  - Search Console y GA4 (search-visibility-kit): piden la credencial de Google de la responsable. Pedile que la conecte en los conectores de claude.ai; no pidas claves en el chat.
  - Windsor.ai: tiene GA4 y Search Console conectados, pero el plan gratis está limitado.
  - Chromium y Playwright ya instalados, para Lighthouse y capturas.
- **Claude in Chrome y Cowork** (proyecto CRM, en la computadora de la responsable): para Search Console, el Perfil de Empresa y YouTube con su sesión. Dejale pedidos listos para pegar.

## Las 4 landings
| Marca | Repo | Dominio | Lighthouse móvil (Rend/Acc/BP/SEO · LCP) |
|---|---|---|---|
| VITA (jurídico: tránsito, ART, laboral y penal) | EzequielGonz/estudio-juridico-vita-final | www.estudiojuridicovita.com | 97/96/100/100 · 2,4 s |
| Compara Tu Obra Social (coberturas) | EzequielGonz/coberturas-sociales-landing | www.comparatuobrasocial.com | 99/100/100/100 · 1,9 s |
| Automotores Kocos (0 km) | EzequielGonz/0km-kocos-agencia | www.autoskocos.com | 98/97/100/100 · 2,1 s |
| Kocos Marketing | EzequielGonz/agencia-kocos-mkt | www.kocosmkt.com | 98/100/100/100 · 2,0 s |

- **Estructura:** monorepo con `apps/web`. El dominio sin www redirige (308) a www. Los archivos de redes están en `apps/web/public/redes/` (126 a 133 por landing, más `redes/perfil/`).
- **Lo que ya está bien:** title y meta, H1, canonical, OG, JSON-LD también en las internas, robots.txt, llms.txt, sitemap con 47 a 80 URL, clave de IndexNow en `/indexnow.txt`, botón de WhatsApp con mensaje prellenado según la página y formulario que manda al CRM la página de origen.

## Diagnóstico (20/11)
1. Ninguna landing está verificada en Search Console ni en Bing: el código de verificación está vacío.
2. No hay medición: ni GA4, ni Tag Manager, ni píxel de Meta, ni estadísticas de Vercel. Los eventos están programados pero no van a ningún lado.
3. Los enlaces de redes no llevan UTM y las landings no las leían.
4. El sitemap tiene lastmod fijo, del 28 al 30/09.
5. En VITA falta quién revisa los textos (nombre y matrícula), clave en temas jurídicos.
6. **Resultados reales:** formularios de las landings, 0 en toda la historia; mensajes con el texto de la web, 1 (Marketing, 26/10); consultas con palabra clave desde redes desde el 10/11, 2 (VITA).

## Medición: trabajo a medio camino (sin terminar ni probar del todo)
- **Landings:** commit «Medición (en curso, sin terminar)» en la rama `claude/happy-wozniak-ajfi1z` de cada repo. Commits: VITA de62efd, Coberturas 4ac2eb6, Autos c5012b0e, Kocos Marketing 493322d3.
  - PR abiertos el 21/11 (sin terminar ni probar, no aprobar todavía): [VITA #1](https://github.com/EzequielGonz/estudio-juridico-vita-final/pull/1), [Coberturas #1](https://github.com/EzequielGonz/coberturas-sociales-landing/pull/1), [Autos #1](https://github.com/EzequielGonz/0km-kocos-agencia/pull/1), [Kocos Marketing #1](https://github.com/EzequielGonz/agencia-kocos-mkt/pull/1). Los commits nuevos en esas ramas los actualizan.
  - Incluye la captura de UTM y fbclid, una referencia corta en WhatsApp y en el formulario (por ejemplo «(ref: IG-ART-0112)»), `robots` con Disallow `/redes/`, sitemap con la fecha real del último commit y GA4 o píxel que se cargan solo si existe la variable de entorno (`medicion.tsx`, `analitica.ts`, `atribucion.ts`, `fechas.ts` y pruebas en `apps/web/tests/`).
  - VITA ya se había comprobado (robots, sitemap y que sin ID no se carga nada). Faltan typecheck, lint, build y pruebas en las otras 3, y revisar todo antes de pasarlo a `main`.
- **CRM:** el reconocimiento de la referencia y de las palabras clave como origen «redes» o «landing» está en el parche `.ai-context/medicion-crm-en-curso.patch` (7 archivos, entre ellos `src/lib/origen-redes.ts` y `tests/unitarias/origen-redes.test.ts`, y cambios en `fuente.ts`, `inbound.ts`, `landing-lead.ts`, `api/landing/route.ts` y `redes/ctas.ts`).
  - Aplicalo con `git apply` sobre la rama, corré `npm run typecheck`, `npx tsc -p tests/tsconfig.json --noEmit`, `npm run lint`, las pruebas unitarias y `npm run build`.
  - Si se necesita una migración, va en `supabase/migrations/` siguiendo las convenciones, y no se aplica sin comprobar.
- Falta escribir `docs/redes/MEDICION-2026-11-20.md`: formato de la referencia, enlaces UTM por marca, red y pieza, variables de entorno y cómo revertir.

## Google: kit listo para cargar
Está en `docs/redes/google/`: un `README.md` general y una carpeta por marca (`vita`, `coberturas`, `autos`, `marketing`) con los textos y las imágenes.
- **Perfil de Empresa** (exige atención en persona):
  - **VITA:** es elegible si atiende en una oficina. Suma laboral (despidos, indemnizaciones, liquidación final, trabajo no registrado) y penal.
  - **Autos:** es elegible si tiene salón u oficina o hace entregas en persona.
  - **Coberturas:** sin confirmar si atiende en persona.
  - **Kocos Marketing:** no es elegible, porque la web dice «100 % a distancia».
- **Qué trae el kit:** categorías, descripción (589 a 691 caracteres), servicios, área de servicio, enlaces con `utm_source=google&utm_medium=organic&utm_campaign=gbp-<marca>`, 4 publicaciones con imagen, el plan de reseñas sin incentivos y la lista de fotos que faltan.
- **Cambio de Google:** en diciembre de 2025 quitó Preguntas y respuestas; las preguntas frecuentes van en los servicios, las publicaciones y la landing.
- **YouTube (Shorts):** nombre, identificador, descripción, banner de 2560×1440 y foto de 800×800 por marca. No se comprobó si los identificadores están libres.
- **Search Console y Bing:** pasos para verificar por DNS o por etiqueta HTML (la variable de entorno ya está preparada en la rama de medición), enviar el sitemap e importar a Bing.
- **Diferencias de datos estructurados para corregir:** VITA sin laboral ni penal en el schema; teléfonos sin el formato +549; Marketing sin teléfono en el schema; Autos y Coberturas con nombres distintos según dónde aparecen.

## Oportunidades SEO por rubro (prioridad)
1. **VITA:** despidos e indemnizaciones, aguinaldo, trabajo no registrado y liquidación final (las búsquedas laborales más grandes), y páginas de penal, que hoy no hay. Todo con revisión profesional.
2. **Coberturas:** aumentos de prepagas de diciembre y enero (con dato oficial), monotributo, prepagas dadas de baja con opción de cambio y comparativas de las marcas más buscadas.
3. **Autos:** precios del mes por modelo con fecha de actualización, los 0 km más baratos del mes, patentar en diciembre o en enero, y plan de ahorro.
4. **Kocos Marketing:** casos de antes y después, y una página por serie de redes (bio, 47 chats, web lenta, checklist de diciembre).
5. **Las 4:** una página por serie de redes con su palabra clave, para que cada reel tenga a dónde llevar.

## Datos que tiene que completar la responsable
- Accesos: Search Console o la cuenta de Google de cada marca, IDs de GA4 o Tag Manager, ID del píxel de Meta y acceso a la cuenta de Vercel donde están las landings.
- Dirección real y horarios de VITA y Autos. Si Coberturas atiende en persona.
- Nombre de la marca de autos: «Automotores Kocos» o «Agencia Kocos». Grafía: «Compara Tu Obra Social» o «Compara tu Obra Social».
- Nombre y matrícula de quien revisa los textos jurídicos y de coberturas.
- Fotos reales de la oficina, el equipo o las entregas.
- Qué cuenta de Google usa cada marca.

## Orden sugerido
1. Terminar y probar la medición en las 4 landings y en el CRM; documentarla; pasarla a `main` cuando esté probada.
2. Pedirle a la responsable los accesos y datos de arriba en un solo prompt y un Word.
3. Verificar las 4 landings en Search Console y en Bing, enviar los sitemaps y avisar a IndexNow.
4. Corregir el schema, los teléfonos y los nombres; poner quién revisa los textos en VITA.
5. Hacer las páginas nuevas por temporada y por serie, con revisión donde corresponda.
6. Perfil de Empresa de VITA y Autos, y canales de YouTube, con Cowork o Claude in Chrome usando el kit.
7. Informe semanal con Search Console, GA4 y el CRM: consultas por página y por origen.
