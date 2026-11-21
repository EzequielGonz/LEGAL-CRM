---
description: Landings de las 4 marcas, SEO, medición, Search Console, Perfil de Empresa y YouTube
actualizado: 20/11/2026 06:00
fuentes: Fase 2 §8.5 y §10, Fase 1 §10, .ai-context/contexto-landings-seo-google.md, docs/landings/auditoria-2026-11-09.md, docs/redes/google/
---

# Landings, SEO y Google

## Cómo están hechas

- Las 4 nacieron en Hostinger Horizons: monorepo con `apps/web` (React Router), código en `apps/web/src` (components, constants, content, hooks, lib, routes, styles). Publicadas en Vercel **en otra cuenta** (la cuenta de Vercel conectada a Claude solo tiene el panel). Dominios comprados en DonWeb. El dominio sin www redirige a www.
- Cada una: title y meta, H1 único, canonical, OG, JSON-LD (también internas), robots.txt, llms.txt, sitemap (259 URL entre las 4 al 21/10: Jurídico 64, Coberturas 66, Autos 79, Marketing 45), clave de IndexNow, silos por zona y tema.
- **Formulario → CRM**: `legal-crm-nine.vercel.app/api/landing?perfil=<perfil>` con nombre, apellido, teléfono, email, tipo, descripción, página de origen y red de llegada. Aviso por correo con Resend preparado (se activa cargando clave y remitente en Vercel).
- **WhatsApp con mensaje prellenado** según la página y frase fija que el CRM reconoce como fuente «Landing» (+ «(llegué desde Instagram/Facebook/Google/TikTok)» si se conoce):

| Landing | Frase fija | GA4 (ID existente) |
| --- | --- | --- |
| estudiojuridicovita.com | «desde la web de Estudio Jurídico Vita» | G-R1RL5L36L5 |
| comparatuobrasocial.com | «desde la web de Compara Tu Obra Social» | G-6JPYRX8218 |
| autoskocos.com | «desde la web de Agencia Kocos» | G-PKGLJLZGNG |
| kocosmkt.com | «desde la web de Kocos Marketing» | G-1381XE2GJ4 |

- Las landings también **alojan las piezas de redes** en `apps/web/public/redes/` (Metricool las toma de ahí).
- Historia de VITA: nació en azul oscuro y dorado, 3D y parallax, WhatsApp y formulario (07/09); 17/09 fotos de Civil y Penal, botones redondeados, sin sección de Instagram.

## Estado comprobado (20/11 06:00, desde afuera)

| Dato | VITA | Coberturas | Autos | Kocos |
| --- | --- | --- | --- | --- |
| Registro DNS `google-site-verification` | Sí | Sí | Sí | Sí |
| → Search Console | **Verificada como dominio** | Verificada | Verificada | Verificada |
| Etiqueta GA4 / GTM / píxel en la home | No | No (403 a robots) | No | No (403 a robots) |
| Verificación de Bing (msvalidate) | No | No | No | No |

Coberturas y Kocos devuelven 403 a pedidos automáticos (curl): revisar si es un firewall de Vercel/bot protection que también bloquee a Googlebot o a Metricool. Ver `09-decisiones-abiertas.md`.

## Diagnóstico

- Lighthouse móvil: 09/11 Rendimiento 76–89, LCP 3,0–4,8 s → Fase 2 (fin de noviembre) 97–100, LCP 1,9–2,4 s.
- Search Console (90 días al 24/10): VITA 0 impresiones, Coberturas 2, Autos 1, Marketing 2. Google solo veía las home. Faltaba cargar sitemap y pedir indexación.
- Sin GA4 en el código, sin Tag Manager, sin píxel de Meta, sin estadísticas de Vercel. Enlaces de redes sin UTM. Sitemap con fechas fijas 28–30/09.
- Resultados reales: 0 formularios; 1 mensaje con el texto de la web (Marketing, 26/10).
- Lo que frena la conversión (09/11): mensaje genérico (ningún título nombra el problema), formularios de 6–9 campos, en Marketing el primer WhatsApp a 3.760 px, tarjetas «Próximamente», nombres y logos que no coinciden, precios publicados en Marketing, interletrado del H1 de Marketing en celular, etiquetas sobre el título.
- Datos estructurados a corregir: VITA sin laboral ni penal; teléfonos sin +549; Marketing sin teléfono; nombres distintos en Autos y Coberturas. En VITA falta quién revisa los textos.

## Medición a medio camino

- Landings: commit «Medición (en curso)» en la rama `claude/happy-wozniak-ajfi1z` de cada repo (VITA de62efd, Coberturas 4ac2eb6, Autos c5012b0e, Kocos 493322d3): captura de UTM y fbclid, referencia corta en WhatsApp y formulario (p. ej. «(ref: IG-ART-0112)»), robots con `Disallow: /redes/`, sitemap con fecha real, GA4 o píxel que se cargan solo si existe la variable. **VITA probada; faltan las otras 3.**
- CRM: parche `.ai-context/medicion-crm-en-curso.patch` (7 archivos, entre ellos `src/lib/origen-redes.ts`) que reconoce la referencia y las palabras clave como origen «redes» o «landing». Falta aplicarlo, probarlo y escribir `docs/redes/MEDICION-2026-11-20.md`.
- Eventos GA4 previstos: `clic_whatsapp`, `clic_cta_formulario`, `formulario_enviado` (sin datos personales).

## Títulos propuestos (a aprobar)

| Sitio | Hoy | Propuesta |
| --- | --- | --- |
| VITA | Defendemos tus derechos cuando más lo necesitás. | ¿Te chocaron o te accidentaste trabajando? Antes de firmar nada, consultanos. |
| Coberturas | Encontrá la cobertura médica que mejor se adapta a vos. | Compará prepagas y obras sociales con un asesor: según tu edad, tu zona y tus aportes. |
| Autos | Tu próximo 0KM puede estar más cerca de lo que pensás. | Tu 0 km con el precio llave en mano claro: contado, prendario, plan de ahorro o con tu usado. |
| Marketing | Tu marca merece una presencia que esté a la altura. | Respondé cada consulta de WhatsApp a tiempo y que ninguna venta se enfríe. |

## Estrategia SEO

| Marca | Foco | Búsquedas largas | Zona |
| --- | --- | --- | --- |
| VITA | abogado accidente de tránsito, abogado ART; despidos e indemnizaciones, aguinaldo, trabajo no registrado, liquidación final, penal | «me chocaron y no tengo seguro», «accidente in itinere qué hacer», «la ART me dio el alta y sigo con dolor» | Tránsito AMBA · laboral país |
| Coberturas | comparar prepagas, cambiar de obra social; monotributo; prepagas dadas de baja; comparativas de marcas | «derivar aportes a prepaga», «prepaga para familia con hijos» | AMBA |
| Autos | 0 km financiado, plan de ahorro; precios del mes por modelo con fecha; los 0 km más baratos; patentar en diciembre o enero | «entregar usado como parte de pago», «[modelo] 0 km precio» | AMBA, prioridad CABA |
| Kocos | agencia de marketing digital, chatbot WhatsApp con IA; casos antes/después | «automatizar WhatsApp para mi negocio», «CRM para [rubro]» | Nacional |
| Las 4 | Una página por serie de redes con su palabra clave (para que cada reel tenga a dónde llevar) y por temporada | | |

Plan: (1) activar sitemap + indexación de home y 5–10 claves, Bing e IndexNow, GA4 con eventos; (2) Perfil de Empresa (VITA y Autos); (3) autoridad local: reseñas sin incentivos, citaciones; Kocos puede mostrar las otras 3 como casos; (4) preguntas frecuentes que responden en la primera oración y firma del profesional que revisa; (5) conversión: formulario de 3 campos, WhatsApp en el hero, herramientas cortas que terminan en WhatsApp («¿Te conviene derivar tus aportes?», «Checklist del precio llave en mano», «Qué hacer en las primeras 24 h después de un choque»); (6) medición quincenal (impresiones sin clics → título; clics sin consultas → llamado).

## Google y YouTube (kit listo en `docs/redes/google/`)

- **Perfil de Empresa:** elegible VITA y Autos si atienden en persona; Coberturas sin confirmar; Kocos no (100 % a distancia). El kit trae categorías, descripción, servicios, área, enlaces con UTM (`utm_source=google&utm_medium=organic&utm_campaign=gbp-<marca>`), 4 publicaciones, plan de reseñas y fotos que faltan. Google quitó Preguntas y respuestas en diciembre de 2025.
- **YouTube Shorts:** nombre, identificador, descripción, banner 2560×1440 y foto 800×800 por marca. No se comprobó si los identificadores están libres.
- Cuenta de Google que administra Vercel de las landings, Search Console y GA4: la del dueño (ver accesos en `06-tecnica-repos-y-accesos.md`).
