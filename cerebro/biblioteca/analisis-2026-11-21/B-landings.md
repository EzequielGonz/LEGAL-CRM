# B · Las 4 landings (análisis de solo lectura)

Fecha del análisis: 21/11/2026. Se leyó `origin/main` de cada repo (con `git show` y `git ls-tree`, sin tocar la rama local ni ningún archivo) y se hicieron GET a los sitios públicos (sin enviar formularios). Contrastado contra `cerebro/05-landings-seo-google.md` y `04-redes-y-contenido.md`. No se copió ninguna clave.

Commits leídos de `origin/main`: VITA `6c409eb`, Coberturas `69869f1`, Autos `38f89da0`, Kocos `8a51967c`.

## 0. Hallazgos que cambian lo que dice la memoria

1. **El 403 a curl ya no se reproduce.** Coberturas y Kocos responden 200 a `curl` sin user-agent, con user-agent de navegador y con el de Googlebot (home y `robots.txt`). El punto de `09-decisiones-abiertas` sobre un firewall que bloquea bots se puede cerrar con esta comprobación del 21/11 (fue puntual o ya se corrigió).
2. **La «frase fija» de WhatsApp que el CRM reconoce como fuente Landing NO está en ninguna de las 4 landings en `main` ni en producción.** La memoria dice «desde la web de Estudio Jurídico Vita», etc. En el código y en el HTML publicado los mensajes son otros: VITA «Hola VITA Abogados, tuve un accidente de tránsito…», Coberturas «Hola, vi la web y quiero comparar coberturas.», Autos «Hola, quiero asesoramiento para comprar un 0 km.», Kocos «Hola Kocos Marketing, vi la web y quiero consultar por mi proyecto.». La prueba del CRM (`tests/unitarias/fuente-llegada.test.ts`) espera «vengo de la web de Estudio Jurídico VITA». Resultado: un WhatsApp que sale de la landing probablemente **no se atribuye a «Landing»** en el CRM. Lo único que sí atribuye hoy es el formulario (`/api/landing?perfil=…`). Verificar contra la base y corregir en la rama de medición (la «referencia corta» `(ref: …)` va en esa dirección, pero está sin integrar).
3. **Medición: sigue en cero en producción.** Ninguna home publicada trae `gtag`, `googletagmanager`, `fbq`, `dataLayer` ni Clarity; los IDs GA4 de la tabla de la memoria no están en el código de `main`. `track()` solo empuja a `dataLayer` si alguien lo instaló, y nadie lo instaló.
4. **El trabajo de medición vive en una rama por repo sin integrar** (`claude/happy-wozniak-ajfi1z`, 1 commit cada una) y `main` siguió avanzando con piezas de redes, así que habrá que rebasar. Las demás ramas (`gracious-volta-rv2f3x`) están al día con `main` (0 commits propios). La rama de trabajo local `claude/admiring-euler-ctf4sg` existe solo en local en los 4 repos (no figura en remoto).
5. **Los sitemaps siguen con `lastmod` fijo** (28/09 VITA y Coberturas, 29/09 Autos, 30/09 Kocos) y **`robots.txt` no bloquea `/redes/`**: los ~350 archivos de reels e historias por repo (231–347 MB cada uno) son rastreables y se sirven desde el dominio de la marca.
6. **Kocos tiene el repo contaminado**: se commitearon `node_modules/` en la raíz (≈35.300 archivos), `apps/web/node_modules`, `apps/web/build` y `dist/`. El pack pesa ~415 MB (Autos 257 MB). `apps/web/.env` está versionado en Autos y Kocos (solo comentarios, sin variables ni claves: se comprobó). Conviene sacar todo eso del índice (`git rm -r --cached`) en el trabajo que toque esos repos.
7. **Los títulos de home de la memoria están desactualizados.** La home publicada de VITA ya no dice «Defendemos tus derechos…» sino «¿Tuviste un accidente de tránsito o un accidente laboral?» con dos botones de WhatsApp por caso. Las otras tres también ya cambiaron (ver cada ficha). Los «títulos propuestos» de la memoria no son lo que está en línea.

## 1. Base común (las 4 nacen del mismo molde)

- **Stack:** monorepo de Hostinger Horizons: `apps/web` con React Router 7 (modo framework, SSR), Vite, Tailwind y shadcn/ui, TypeScript; rutas en `apps/web/src/routes.ts`, contenido en `src/content/*.server.ts` (silos), meta en `lib/seo.ts` + `lib/page-meta.ts`, JSON-LD en `lib/schema.ts`. Fuentes autoalojadas (`public/fonts`). Publicado en Vercel (otra cuenta); dominio sin www → 308 a `www` (verificado en las 4).
- **Residuo de Horizons:** `plugins/visual-editor`, `plugins/horizons-runtime`, `session-journal` (editor visual y telemetría del hosting) siguen en el repo; `apps/pocketbase` (VITA y Kocos) quedó sin uso porque los formularios van al CRM; `lib/pocketbase-client*` y `horizons-preview-scripts.tsx` también. Es código muerto o de riesgo para el build.
- **Formulario → CRM:** `lib/leads.ts` con `LEADS_PROVIDER = 'webhook'` y `POST https://legal-crm-nine.vercel.app/api/landing?perfil=<perfil>` con JSON (`nombre, apellido, telefono, email?, tipo, descripcion, origen` = ruta de la página, `llegada` = `document.referrer`). Perfiles: `juridico`, `coberturas_medicas`, `agencia_0km`, `marketing`. Sin UTM ni referencia en el cuerpo (en `main`).
- **Eventos:** `lib/track.ts` → `dataLayer.push({event: click_llamar | click_whatsapp | lead_enviado})`. Sin GTM/GA4 cargado no mide nada.
- **SEO técnico común (verificado en vivo):** `<title>` y `meta description` únicos por página; `canonical` absoluto con `www`; `og:*` y `twitter:card=summary_large_image` con imagen 1200×630; `robots.txt` con `Allow: /` y lista nominal de bots de respuesta de IA permitidos (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot, etc.) y bots de entrenamiento bloqueados (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, Amazonbot, Bytespider…); `Sitemap:` declarado; `llms.txt` estático en `public/` (12–20 KB, con todas las URL y su resumen); `/indexnow.txt` devuelve la clave (200) y existe `scripts/indexnow.mjs`; 404 real en rutas inexistentes; `VERIFICATION = { google: '', bing: '' }` vacío en las 4 (Search Console está verificada por DNS, Bing no).
- **Datos estructurados:** `WebSite` + negocio (`LegalService`, `InsuranceAgency`, `AutoDealer`, `ProfessionalService`) en la home; en cada interna `Article` + `BreadcrumbList` + `FAQPage` (+ el negocio). Las FAQ de las internas tienen solo 1 o 2 preguntas.
- **`public/redes/`:** además de las piezas, cada repo hospeda `redes/2011/` (≈200 archivos) y `redes/perfil/` (~20). Ver conteos en la tabla final.

## 2. VITA · estudiojuridicovita.com (repo `estudio-juridico-vita-final`)

- **Marca y contacto (`constants/brand.ts`):** «VITA Abogados · Estudio Jurídico»; WhatsApp y teléfono 11 3858-2311 (`5491138582311`); email en Gmail; IG `@estudiojuridicovita`; FB por `profile.php`. `ADDRESS` vacía (solo región «Buenos Aires»); `REVIEWER = { name:'', matricula:'' }`: **nadie firma la revisión legal**, algo que el SEO jurídico pide.
- **Páginas y rutas (65 URL en el sitemap):** `/` · `/accidentes-de-transito` (+33 URL: 13 temas y ~20 zonas AMBA: CABA, La Matanza, Lomas, Quilmes, Lanús, Avellaneda, Morón, Merlo, Moreno, San Martín, 3 de Febrero, Vicente López, San Isidro, Tigre, Pilar, Alte. Brown, E. Echeverría, F. Varela, Berazategui, La Plata) · `/accidentes-laborales` (+28: ART, alta médica, Comisión Médica, incapacidad, enfermedades, rubros —construcción, repartidores, gastronomía, comercio, salud, transporte— y provincias CABA, PBA, Córdoba, Santa Fe, Mendoza, Tucumán) · `/accidentes-laborales/calculadora-indemnizacion-art` · `/guias` (+glosario, documentos para reclamar). **No hay página de despidos, aguinaldo, trabajo no registrado general, liquidación final ni penal**, que la memoria pone como foco SEO (y las redes ya publican esos temas).
- **Home (en línea):** título «Abogados de accidentes de tránsito y laborales | VITA Abogados»; H1 «¿Tuviste un accidente de tránsito o un accidente laboral?»; bajada «Te explicamos qué podés reclamar antes de que firmes cualquier acuerdo.»; dos tarjetas CTA que abren WhatsApp con mensaje por caso («Hola VITA Abogados, tuve un accidente de tránsito y quiero consultar mi caso.» / «…accidente laboral y quiero consultar por mi reclamo a la ART.»); enlace «Prefiero dejar mis datos en el formulario». Secciones: Qué podés reclamar tras un choque · Cómo sigue un reclamo a la ART · Antes de firmar un acuerdo, consultanos · Cómo es la consulta · Contanos tu caso (formulario) · Tu situación merece ser escuchada. WhatsApp flotante.
- **Formulario:** 6 campos (nombre, apellido, teléfono, email, tipo de consulta, descripción), todos obligatorios → CRM `perfil=juridico`. En artículos: bloque mitad, lateral, formulario final y banda azul (textos en `constants/cta.ts`: «¿Te pasó algo parecido?», «Consultá tu caso», «Quiero que me contacten»).
- **SEO:** schema `LegalService` con `areaServed` CABA/PBA/Argentina; sin laboral/penal como servicio; `telephone` sin el formato +549 completo en algunos datos (según la memoria). Sin dirección ni revisor.
- **Medición:** nada en `main`. Rama `claude/happy-wozniak-ajfi1z` (de62efd): `lib/atribucion.ts` (241 líneas: UTM+fbclid, 30 min en sessionStorage, código `RED-CAMPAÑA-PIEZA`, referencia `(ref: IG-ART-0112)` en WhatsApp y formulario), `lib/analitica.ts` y `components/medicion.tsx` (GTM/GA4/píxel solo si hay variable de entorno válida; con GTM no carga GA4 para no duplicar), `track.ts` con antirrebote y envío a `gtag`/Meta, `robots` con `Disallow: /redes/`, sitemap con fecha real (`__FECHA_CONTENIDO__`/`__FECHA_PORTADA__` por commit), `tests/medicion.test.ts`. Es la única de las 4 «probada».
- **Redes:** 351 archivos en `public/redes` (347 MB; 53 mp4 = 313 MB; 277 jpg; 21 png), carpetas `2011/` (197) y `perfil/` (21); ~37 son historias.
- **Ramas:** `gracious-volta-rv2f3x` 0 sin integrar; `happy-wozniak-ajfi1z` 1 commit sin integrar (medición).
- **Problemas:** ver §7.

## 3. Compara Tu Obra Social · comparatuobrasocial.com (repo `coberturas-sociales-landing`)

- **Marca y contacto:** «Compara Tu Obra Social»; WhatsApp 11 7290-0587 (`5491172900587`); email Hotmail; IG `@comparatuobrasocial`.
- **Páginas (67 URL):** `/` · `/prepagas` (52 URL: marcas y planes, preexistencias, etc.) · `/obras-sociales` (10) · `/guias` (4) · cotizador (`/cotizador`, `seo-cotizador.tsx`). Contenido: `marcas`, `obras-sociales`, `prepagas`, `zonas`, `guias`. Zona: AMBA. El schema de la home lleva 18 `AdministrativeArea` (una por partido).
- **Home (en línea):** título «Prepagas y obras sociales en CABA y GBA | Compara Tu Obra Social»; H1 «Compará prepagas y obras sociales con un asesor»; bajada «Respondé cuatro preguntas y mandanos tu perfil por WhatsApp. Comparamos las opciones para tu edad, tu zona, tu familia y…». Secciones: «Tu 3 % puede ir a la cobertura que elijas» (aportes) · «Comparamos cada opción con las mismas preguntas» · «¿Te pasa alguna de estas?» · «Cómo te asesoramos» · formulario «Contanos qué cobertura estás buscando» · FAQ · cierre. WhatsApp: «Hola, vi la web y quiero comparar coberturas.»
- **Formulario:** 9 campos (nombre, apellido, teléfono, email, qué busca, para quién, cuántas personas, cobertura actual, detalle); los 3 selects y el resto obligatorios → CRM `perfil=coberturas_medicas`, `tipo` = lo que busca. Es el formulario más largo y el que más fricción mete (la memoria pide bajarlo a 3 campos).
- **SEO:** `InsuranceAgency`; títulos internos a veces sin marca (p. ej. «Preexistencias en prepagas: qué dice la ley»); FAQ con 1 pregunta en la página muestreada. Aclara «Información general» en las secciones (bien para YMYL).
- **Medición:** igual que VITA: nada en `main`; rama `happy-wozniak` (4ac2eb6) **sin probar**.
- **Redes:** 344 archivos (231 MB; 45 mp4 = 201 MB; 278 jpg; 21 png), `2011/` 197 y `perfil/` 21; ~38 historias.
- **Ramas:** `gracious-volta` 0; `happy-wozniak` 1 commit (medición).
- **Pendiente comercial:** el «Perfil de Empresa» está sin confirmar (según memoria).

## 4. Automotores Kocos · autoskocos.com (repo `0km-kocos-agencia`)

- **Marca y contacto:** «Agencia Kocos» (nombre de negocio distinto al de la marca Kocos Marketing y distinto al del repo/carpeta); WhatsApp 11 4067-4772 (`5491140674772`); email Hotmail; IG `@autoskocos`.
- **Páginas (80 URL):** `/` · `/0km` (61 URL: modelos y marcas —`marcas-modelos.server.ts`— y categorías como `autos-chicos`) · `/financiacion` (9) · `/guias` (9) · `/guias/simulador-de-cuotas`. Zona: AMBA con prioridad CABA (15 `AdministrativeArea` en el schema).
- **Home (en línea):** título «Autos 0km en CABA: financiación y plan de ahorro | Agencia Kocos»; H1 «Comprá tu 0 km con tu usado, en cuotas o de contado»; pestañas por forma de pago, cada una con botón «Consultar por <forma>» que abre WhatsApp con mensaje propio; secciones «El precio que importa es el final» (precio llave en mano), «Tu usado puede ser parte del pago», «Cómo empezamos», formulario «Contanos qué vehículo estás buscando», FAQ, cierre «Empezá a buscar tu próximo 0KM». WhatsApp: «Hola, quiero asesoramiento para comprar un 0 km.» Esta es la home más alineada con el título propuesto por la memoria («0 km con el precio llave en mano claro: contado, prendario, plan de ahorro o con tu usado»).
- **Formulario:** 8–9 campos (nombre, apellido, teléfono, qué busca, unidad, anticipo, usado, plazo, consulta); el email no se pide (sí se acepta en el CRM) → CRM `perfil=agencia_0km`.
- **SEO:** `AutoDealer`; `/0km/*` con títulos «<tema> | Agencia Kocos». Sin precios por modelo con fecha (la estrategia de la memoria los pide: «[modelo] 0 km precio»).
- **Medición:** nada en `main`; rama `happy-wozniak` (c5012b0e) sin probar.
- **Redes:** 351 archivos (240 MB; 48 mp4 = 207 MB; 283 jpg; 20 png), `2011/` 199 y `perfil/` 20; ~37 historias.
- **Ramas:** `gracious-volta` 0; `happy-wozniak` 1 commit (medición). `apps/web/.env` versionado (solo comentarios); `.react-router/types` también versionado.

## 5. Kocos Marketing · kocosmkt.com (repo `agencia-kocos-mkt`)

- **Marca y contacto (`constants/site.ts`):** «Kocos Marketing»; WhatsApp 11 7250-2391 (`5491172502391`, línea conectada al CRM); email Hotmail; IG `@kocosmkt`; TikTok y LinkedIn vacíos.
- **Páginas (47 URL):** `/` · `/servicios` (13) · `/rubros` (13) · `/agencia-de-marketing-digital/:ciudad` (10) · `/guias` (10) · `/guias/calculadora-de-automatizacion`. Es la única con alcance nacional; las otras tres son AMBA.
- **Home (en línea):** título «Agencia de marketing digital y desarrollo web | Kocos Marketing»; H1 «Web, redes y WhatsApp en un mismo sistema»; bajada «Diseñamos tu web, ordenamos las consultas de WhatsApp con un CRM y automatizamos lo repetitivo, para que ninguna consulta quede…». Secciones: «Trabajos publicados» (muestra VITA y Coberturas como casos: capturas `public/img/trabajos/*`, una oportunidad de enlace cruzado) · enfoque · «Lo hacemos simple» · **planes con precio publicado ($299.000, $499.000, $699.000)** · «Así trabajamos» · «Más que diseño» · FAQ · formulario «Hablemos de tu próximo paso». WhatsApp: «Hola Kocos Marketing, vi la web y quiero consultar por mi proyecto.» / «…quiero ordenar mis consultas y mi web.»
- **Formulario:** formato distinto de las otras: `full_name, whatsapp, email, business, industry, instagram, need, budget (rangos de $500.000 a >$5.000.000), message` → CRM `perfil=marketing` (el CRM lo normaliza: «Negocio», «Rubro», «Necesidad», «Inversión estimada»). Los campos no aparecen en el HTML del servidor (se pintan en el cliente): conviene verificar accesibilidad y que funcione sin JS esperado.
- **SEO:** `ProfessionalService` + `Service` en `/servicios/*`; títulos internos sin marca (p. ej. «Landing pages que convierten: diseño y desarrollo»); la home no declara teléfono en el schema (según memoria).
- **Medición:** nada en `main`; rama `happy-wozniak` (493322d3) sin probar.
- **Redes:** 352 archivos (305 MB; 51 mp4 = 276 MB; 282 jpg; 19 png), `2011/` 205 y `perfil/` 19; ~34 historias.
- **Ramas:** `gracious-volta` 0; `happy-wozniak` 1 commit (medición).
- **Higiene del repo:** `node_modules/` raíz commiteado (~35.300 archivos), más `apps/web/node_modules`, `apps/web/build` y `dist/`; pack de ~415 MB. Cada `git fetch`/clon tarda minutos (en esta sesión el fetch superó los 2 minutos y hubo que reintentar).

## 6. Origen de leads hacia el CRM (cómo llega cada cosa hoy)

| Camino | Qué envía | Cómo lo reconoce el CRM | Atribución a red/pieza |
| --- | --- | --- | --- |
| Formulario de la landing | JSON con campos de la marca, `origen` = ruta, `llegada` = referrer | `/api/landing?perfil=…` → `first_source: landing`, detalle «formulario <ruta>» + «llegó desde <referrer>» | Solo por referrer; sin UTM ni pieza (en `main`) |
| WhatsApp desde la landing | Mensaje prellenado propio de cada página | Debería coincidir con la frase fija configurada en el CRM («vengo de la web de …») | **No coincide con lo publicado** (hallazgo 2) |
| Comentar la palabra clave en la red | — | Palabra clave del cronograma | Fuera de las landings |

Pendiente (según memoria): parche `.ai-context/medicion-crm-en-curso.patch` en el CRM para reconocer `(ref: IG-ART-0112)` y palabras clave; no aplicado.

## 7. Problemas y oportunidades (priorizados)

**Críticos**
1. WhatsApp sin frase fija: el CRM no puede marcar «Landing». Decidir una frase única por marca, ponerla en `whatsappUrl()` de las 4 y probarla contra `detectarFuente` (también cubre la referencia `(ref: …)`).
2. Medición en cero: integrar la rama `happy-wozniak` (rebasar sobre `main`, que cambió por las redes), probar en las 3 que faltan, cargar las variables de entorno en Vercel (GA4/GTM/píxel) y recién ahí hablar de datos. Eventos: clic WhatsApp, clic en CTA, formulario enviado, sin datos personales.
3. `robots.txt` sin `Disallow: /redes/` y ~350 archivos pesados por repo servidos desde el dominio: riesgo de gastar presupuesto de rastreo e indexar piezas sin valor SEO (mp4 de hasta decenas de MB). La rama de medición ya lo corrige.
4. Repo de Kocos con `node_modules`/`dist`/`build` versionados (415 MB) y `.env` versionado (hoy sin secretos; riesgo a futuro) en Autos y Kocos.

**Altos**
5. `sitemap.xml` con `lastmod` estático (28–30/09): corregir con fecha real (ya hecho en la rama) y avisar a Search Console; sumar `lastmod` de las páginas nuevas por serie.
6. Search Console: verificar que cada sitemap esté cargado y pedir indexación de la home y 5–10 claves; sin Bing (`msvalidate`) ni IndexNow enviado: la clave está publicada pero nadie corre `scripts/indexnow.mjs` tras cada publicación.
7. Cobertura temática de VITA incompleta frente a la estrategia (laboral: despidos, aguinaldo, trabajo no registrado, liquidación final; penal) y de las redes (que ya hablan de «plata rápida», «firmás o no», aguinaldo): cada serie necesita su landing con la palabra clave del reel (la memoria lo pide). Lo mismo para Coberturas (monotributo, derivar aportes, prepaga dada de baja) y Autos (usado, anticipo, plan de ahorro con fecha).
8. Formularios largos (VITA 6, Autos 8–9, Coberturas 9, Kocos 9 campos): bajar a 3 (nombre, teléfono, consulta) y dejar el resto para el chat.
9. Datos de confianza: VITA sin revisor ni matrícula ni dirección; Perfil de Empresa sin crear; cero reseñas; Kocos publica precios.
10. FAQ de las internas con 1–2 preguntas: ampliar a 4–6 con respuesta en la primera oración (mejor para AI Overviews y `FAQPage`).

**Medios**
11. Schema: teléfonos con +549, `telephone` en Kocos, nombres consistentes (en Autos el negocio se llama «Agencia Kocos» y en Coberturas el negocio de schema es `InsuranceAgency`), `Person` revisor en VITA.
12. Títulos internos sin marca en Coberturas y Kocos (por el tope de 65 caracteres): aceptable, pero revisar que no queden idénticos entre páginas.
13. Código muerto de Horizons (`visual-editor`, `horizons-runtime`, `pocketbase`, `horizons-preview-scripts`): sacarlo reduce superficie y tiempo de build.
14. Enlazado interno cruzado: Kocos ya muestra VITA y Coberturas como casos; sumar enlaces desde las 4 hacia `guias` por serie y UTM en cada enlace de bio/redes (sin tocar bios ni botones de perfil).
15. `llms.txt` estático de 12–20 KB por sitio: se desactualiza cada vez que se suma una página; generarlo desde el contenido.
16. Rendimiento: la memoria da Lighthouse móvil 97–100 con LCP 1,9–2,4 s (fin de noviembre); no se re-midió en esta lectura. Los HTML pesan 29–48 KB, sin cache de HTML (`max-age=0, must-revalidate`).

**Oportunidades**
- Reutilizar el motor de series: una página por serie de redes con `utm_campaign`/`utm_content` y el mismo identificador en el reel, el comentario y el WhatsApp (referencia `(ref: …)`).
- Herramientas que ya existen (calculadora ART, cotizador, simulador de cuotas, calculadora de automatización): son el mejor imán; falta botón de WhatsApp al final del resultado y evento medido.
- Casos cruzados en Kocos: mostrar resultados medidos de VITA/Coberturas/Autos cuando haya datos de GA4.

## 8. Tabla comparativa

| | VITA | Coberturas | Autos | Kocos |
| --- | --- | --- | --- | --- |
| Dominio / negocio | estudiojuridicovita.com · VITA Abogados | comparatuobrasocial.com · Compara Tu Obra Social | autoskocos.com · Agencia Kocos | kocosmkt.com · Kocos Marketing |
| Repo / `origin/main` | estudio-juridico-vita-final · 6c409eb | coberturas-sociales-landing · 69869f1 | 0km-kocos-agencia · 38f89da0 | agencia-kocos-mkt · 8a51967c |
| Stack | React Router 7 SSR + Vite + Tailwind/shadcn (Horizons), Vercel | igual | igual | igual |
| URL en sitemap (en vivo) | 65 (tránsito 33, laborales 28, guías 3) | 67 (prepagas 52, obras sociales 10, guías 4) | 80 (0km 61, financiación 9, guías 9) | 47 (servicios 13, rubros 13, ciudades 10, guías 10) |
| H1 de la home | ¿Tuviste un accidente de tránsito o un accidente laboral? | Compará prepagas y obras sociales con un asesor | Comprá tu 0 km con tu usado, en cuotas o de contado | Web, redes y WhatsApp en un mismo sistema |
| WhatsApp | 11 3858-2311 · mensaje por caso | 11 7290-0587 · «vi la web…» | 11 4067-4772 · por forma de pago | 11 7250-2391 · «vi la web…» |
| Frase fija «desde la web de…» | No | No | No | No |
| Formulario → CRM (`perfil`) | `juridico` · 6 campos | `coberturas_medicas` · 9 | `agencia_0km` · 8–9 | `marketing` · 9 (formato propio) |
| Schema | LegalService + Article + FAQ + Breadcrumb | InsuranceAgency + igual | AutoDealer + igual | ProfessionalService + Service + igual |
| robots / llms.txt / IndexNow | sí / sí / sí | sí / sí / sí | sí / sí / sí | sí / sí / sí |
| `Disallow: /redes/` | No (en rama) | No (en rama) | No (en rama) | No (en rama) |
| `lastmod` del sitemap | fijo 28/09 | fijo 28/09 | fijo 29/09 | fijo 30/09 |
| GA4 / GTM / píxel en producción | No | No | No | No |
| Search Console | Dominio verificado | Verificada | Verificada | Verificada |
| Bing (`msvalidate`) | No | No | No | No |
| Rama de medición | de62efd · probada | 4ac2eb6 · sin probar | c5012b0e · sin probar | 493322d3 · sin probar |
| Ramas sin integrar | happy-wozniak (1) | happy-wozniak (1) | happy-wozniak (1) | happy-wozniak (1) |
| `public/redes` | 351 arch. · 347 MB · 53 mp4 | 344 · 231 MB · 45 mp4 | 351 · 240 MB · 48 mp4 | 352 · 305 MB · 51 mp4 |
| Reels (mp4) / historias (jpg `his*`) / carruseles y fijas | 53 / ~37 / resto jpg | 45 / ~38 / resto | 48 / ~37 / resto | 51 / ~34 / resto |
| Principal problema | Faltan laboral general y penal; sin revisor | Formulario de 9 campos; FAQ de 1 pregunta | Sin precios por modelo con fecha | Repo con `node_modules`; precios publicados |
| Principal oportunidad | Páginas por serie de redes (ART, alta, firma) | Aportes y monotributo con herramienta + WhatsApp | Llave en mano y usado con simulador | Casos cruzados con datos reales |

Notas de método: los conteos de reels/historias salen de nombres de archivo (`.mp4`; `his`/`story`/`historia`), no de abrir cada pieza. Los datos «en vivo» se tomaron el 21/11 con GET simples; no se envió ningún formulario ni se tocó ningún repo (solo `git fetch` de lectura).
