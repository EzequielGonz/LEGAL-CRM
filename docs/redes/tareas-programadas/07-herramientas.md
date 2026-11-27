# 07 · Herramientas disponibles para redes (inventario al 27/11/2026)

Regla del dueño: no se paga nada sin su autorización. Lo que consume créditos o plan pago queda como «no usar sin autorización». Los saldos se leyeron con herramientas de solo lectura; no se generó, publicó ni creó nada.

Descartado de entrada por la regla de contenido: imágenes hechas con IA, fotos de stock con texto, caras reales (ni avatares ni presentadores IA).

## Tabla (solo lo útil)

| Herramienta | Para qué nos sirve | Gratis o pago | En qué paso de la corrida |
|---|---|---|---|
| Metricool (conector, 4 marcas ya cargadas) | Estadísticas por marca, mejores horarios (`getBestTimeToPostByNetwork`), publicaciones programadas. Solo se leen datos | Gratis para leer (cuenta existente). Programar o publicar lo decide el dueño | Análisis y calibración; horarios |
| Skills `social-media-skills:*` (hook-writer, reels-script, carousel-writer, story-writer, caption-writer, instagram-seo, content-calendar, platform-specs-and-validation, analytics-and-reporting) | Guiones, ganchos, carruseles, historias, calendario y medidas por plataforma | Gratis (instrucciones, no gastan) | Guiones y ganchos; copy; diseño de piezas |
| `humanize-kit:humanize-ig` y `humanize-kit:humanize` | Sacar el tono «escrito por IA» de captions y textos | Gratis | Copy (último paso antes de programar) |
| `slop-patterns:check-ui` y conector slop-patterns (`check_design`, `search_patterns`) | Control anti «diseño hecho por IA» sobre el HTML de posts, carruseles e historias | Gratis (biblioteca abierta) | Control de calidad del diseño |
| `uxkin:no-ui-slop`, `vectorlab-ux-skills:anti-slop`, `slop-stopper:final-review` | Segunda mirada anti-IA y revisión final | Gratis | Control de calidad del diseño |
| `manifold:*` skills (analyze-viral-reel, find-instagram-hooks, find-reels-trends, audit-instagram-account) | Método para estudiar competencia y ganchos que funcionan | Las skills son gratis; las llamadas de datos del conector manifold gastan créditos prepagos | Competencia (solo con autorización) |
| Conector manifold (`instagram_get_reels`, `instagram_get_profile`, `ads_search_ads`) | Reels y perfiles de competidores, biblioteca de anuncios | PAGO: créditos prepagos por llamada, sin confirmación. No usar sin autorización | Competencia |
| vidIQ (`vidiq_ig_profile_reels`, `vidiq_instagram_tiktok_outlier_search`, `vidiq_tiktok_trending_sound_search`) | Reels que rinden por encima de su cuenta, sonidos en tendencia | Plan gratis con 70 créditos que se renuevan el 09/12 (150 máx). Cada búsqueda descuenta: pedir ok antes de gastar | Competencia; ganchos; ideas |
| Ubersuggest (conector + skills `ubersuggest:*`) | Palabras clave, auditoría del sitio, ideas de contenido | Plan gratis con tope: 1 proyecto, 25 palabras, 3 reportes por día, 2 competidores. Lo de IA (generar artículos) fuera | SEO de las landings |
| `gsc-wizard`, `search-visibility-kit:seo-audit`, `seo-audit`, `schema`, `ai-seo` (skills del proyecto) | Auditoría y datos de Search Console, schema, visibilidad en buscadores | Skills gratis; los conectores piden sesión de Google | SEO de las landings |
| Streamline (conector, plan gratis) | Íconos vectoriales para escenas, en un solo Set por marca | Gratis solo en assets no premium; el SVG premium es de pago, no descargarlo | Íconos para escenas y piezas |
| Icons8 (conector, plan gratis) | Íconos en PNG y animados en GIF/APNG | Gratis solo PNG/GIF/APNG; SVG y Lottie requieren plan con acceso MCP (no lo tenemos) | Íconos para escenas |
| LottieFiles (conector, `schema_details` + `graphql_execute` de lectura) | Buscar animaciones públicas para tomar ideas de movimiento | Buscar es gratis; revisar la licencia de cada archivo antes de usarlo | Animaciones vectoriales |
| SVGator (conector, plan Free, nivel 0) | Animar SVG propios (íconos, marcas) y exportar | Plan gratis, con límites de exportación sin comprobar. Crear proyectos cuenta como edición: pedir ok | Animaciones vectoriales |
| Fonts (Monotype: `recommend_fonts`, `detect_font_regions`) | Recomendar tipografías por estilo; identificar una fuente en una imagen | Gratis para consultar; las fuentes comerciales se licencian aparte | Diseño de piezas |
| Fuentes de Google Fonts y three.js (en el motor Atlas) | Tipografías y escenas 3D propias | Gratis | Reels 3D y piezas |
| `naksha:design-reel`, `naksha:motion-design`, `naksha:social-content`, `motion-reel`, `animation-studio`, `remotion:*` | Guía de movimiento y estructura de reels (complementa el motor propio) | Skills gratis. Remotion: ver licencia antes de uso comercial | Reels; diseño de piezas |
| `brand-md:brand`, `naksha:brand-kit`, `brand-voice:*` | Fijar marca y voz por perfil y vigilar coherencia | Gratis | Copy; diseño de piezas |
| `social-media-skills:ai-music-and-sound` (guía) y música de la biblioteca de Meta/Instagram | Criterio para elegir música y sonidos | Gratis (guía). Generadores de música: ver descartados | Música |
| `windsor-ai:instagram-report`, `supermetrics-marketing:instagram` | Informes de Instagram desde cuentas conectadas | Requieren plan o sesión propia; sin confirmar. Metricool ya cubre esto | Análisis (alternativa) |

(18 filas; el resto de skills genéricas de la lista no suma al trabajo de redes.)

## Usar desde ya

1. **Metricool para leer estadísticas y horarios.** Llamar `getBrandSettings` (ya devuelve las 4 marcas con su Instagram), luego `getAnalyticsAvailableMetrics` y `getAnalyticsDataByMetrics` por marca, y `getBestTimeToPostByNetwork`. Solo lectura; no tocar `createScheduledPost` sin pedido del dueño.
2. **Cadena de copy: `social-media-skills:hook-writer` y `reels-script` → `caption-writer` → `humanize-kit:humanize-ig`.** El gancho va en los primeros 3 segundos y en la primera línea; al final, pasar el texto por humanize. Voseo rioplatense, sin promesas de resultado en Jurídico y Coberturas.
3. **Control anti-IA antes de programar:** pasar el HTML de cada pieza por `slop-patterns:check_design` (o `slop-patterns:check-ui`) y por `vectorlab-ux-skills:anti-slop`. Si marca patrones, se corrigen y se vuelve a pasar. Anotar en el informe qué patrones salieron.
4. **Íconos por marca desde Streamline gratis:** `get_user_context`, `search_families`, elegir un Set por marca, `search_assets`, bajar solo los no premium. Si falta uno, Icons8 en PNG o dibujarlo propio en SVG. Anotar el crédito si la licencia lo pide.
5. **SEO de las landings con Ubersuggest gratis:** `keyword_suggestions` y `domain_overview` con los tres reportes diarios. Priorizar una consulta por landing; no crear proyecto sin ok.
6. **vidIQ como lupa de competencia, con tope:** hasta 70 créditos; usar `vidiq_ig_profile_reels` sobre 2 o 3 competidores por rubro, y registrar lo gastado. Pedir ok antes de pasar de 20 créditos por corrida.

## Descartado

Todo generador de imagen, video, avatar, voz o música con IA (creative-claw con 100 créditos, abracadabrax, ElevenLabs en plan pago, Kling con 0 créditos, apiai con 0 dólares, admakeai con 30 créditos, ugc-video-ads, anime-story, logo-maker, vidIQ generate_*, Adobe Firefly y Express): van contra la orden de no usar imágenes de IA, ni caras reales, y varios gastan créditos. También quedan afuera por no sumar a redes: Unsplash y stock con texto, Shopify, QuickBooks, Vercel, Railway, Wix, Figma, Lucid, Qase y los conectores de ads (adcopilot, Meta Ads vía Windsor): las campañas las lanza la responsable.

Pendiente de revisar: los conectores que piden iniciar sesión (Canva, ai-video-editor, Supermetrics, Windsor, Ayrshare, entre otros) no se pudieron consultar.
