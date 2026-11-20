# Landings y SEO: auditoría del 20/11/2026

Solo lectura: no se cambió código ni se desplegó nada. Se revisaron los repos clonados en `scratchpad/landings/` (último commit de cada uno: 09/11) y los sitios publicados.

## Dominios de producción

Los cuatro sitios responden 200 y los sirve Vercel, pero desde otra cuenta: en el equipo conectado solo aparece `legal-crm`, así que no hay acceso a sus estadísticas de Vercel.

| Marca | Dominio | Contenido | Formulario va a |
|---|---|---|---|
| VITA | www.estudiojuridicovita.com | 64 páginas (65 URL en el sitemap) | Webhook del CRM, perfil `juridico`, con origen y referer |
| Coberturas | www.comparatuobrasocial.com | 66 páginas (67 URL) | Webhook del CRM, perfil `coberturas_medicas` |
| Autos | www.autoskocos.com | 79 páginas (80 URL) | Webhook del CRM, perfil `agencia_0km` |
| Kocos Marketing | www.kocosmkt.com | 45 páginas (47 URL) | Webhook del CRM, perfil `marketing` |

Los números de WhatsApp de las cuatro landings coinciden con canales cargados en el CRM.

## 1. SEO técnico (medido)

Lighthouse en móvil (v12.8.2):

| Landing | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| VITA | 97 | 96 | 100 | 100 | 2,4 s | 20 ms | 0 |
| Coberturas | 99 | 100 | 100 | 100 | 1,9 s | 0 ms | 0 |
| Autos | 98 | 97 | 100 | 100 | 2,1 s | 10 ms | 0 |
| Marketing | 98 | 100 | 100 | 100 | 2,0 s | 0 ms | 0 |

En las cuatro, sin excepción:
- Title y meta description con intención y zona.
- Un H1 por página, canonical, Open Graph con imagen de 1200 × 630 y HTML renderizado en el servidor.
- `robots.txt` que permite todo, incluido OAI-SearchBot, y `llms.txt`.
- Sitemap completo.
- Datos estructurados: LegalService, InsuranceAgency, AutoDealer o ProfessionalService, más Article, BreadcrumbList y FAQPage en las internas.

Problemas técnicos encontrados:
- **`VERIFICATION = { google: '', bing: '' }` en las cuatro:** no están verificadas en Search Console ni en Bing. No se sabe si Google las indexó ni para qué búsquedas aparecen. Este es el problema principal.
- **`<lastmod>` del sitemap viejo:** todo figura con fecha del 28 al 30/09, así que Google no ve cambios recientes.
- **VITA sin revisor:** `REVIEWER = { name: '', matricula: '' }`, entonces no aparece «Revisado por…» y el Article no tiene autor. En temas jurídicos (YMYL) eso resta mucha confianza para Google y para los buscadores con IA.
- **`TIKTOK_URL` vacío** en las tres que lo tienen, porque todavía no hay cuentas de TikTok.

## 2. Contenido y palabras clave por rubro

| Rubro | Qué cubre hoy | Qué falta |
|---|---|---|
| VITA | Accidentes de tránsito en el AMBA (12 guías y 20 zonas) y accidentes laborales o ART en todo el país (14 guías, calculadora, 6 oficios y 6 provincias) | Despidos e indemnizaciones, que es la búsqueda laboral más grande, más aguinaldo, trabajo no registrado y liquidación final. Solo conviene si el estudio atiende esos temas; hay que confirmarlo. También falta derecho penal (el perfil Penal existe en el CRM) y una página por cada pieza de redes |
| Coberturas | 10 prepagas, 3 comparativas, 6 perfiles, 25 zonas, derivación de aportes y cotizador | Contenido de actualidad: aumentos de prepagas de diciembre y enero, y monotributo (está en redes, falta en la web). Páginas «X vs Y» de las marcas más buscadas |
| Autos | 0 km por segmento, 10 marcas, 13 modelos, financiación y plan de ahorro, 28 zonas y simulador | Precios del mes por modelo (se buscan todos los meses y quedan viejos si no se actualizan), «autos más baratos» del mes y temas de diciembre y enero (vacaciones, patentamiento por año modelo) |
| Marketing | 12 servicios, 12 rubros, 10 ciudades, 8 guías y calculadora | Casos y antes y después con datos reales. Las piezas de redes («bio», «47 chats», «web lenta») no tienen página de destino |

## 3. Conversión y medición

- **Botón de WhatsApp:** está en las cuatro (entre 5 y 14 enlaces `wa.me` en la home). En las internas, el mensaje dice de qué página viene, por ejemplo «Hola, vi "Plan de ahorro" en su web…».
- **Formulario:** manda al CRM (`/api/landing`) con `origen` (la página) y `llegada` (el referer).
- **Sin ninguna analítica:** no hay GA4, GTM, píxel de Meta, Vercel Analytics ni Clarity. Los eventos `click_whatsapp` y `lead_enviado` están programados, pero no hay dónde recibirlos.
- **Sin UTM:** ningún repo lee `utm_*`, y los textos de redes no llevan enlace con UTM. Dentro de Instagram el referer suele llegar vacío o como `l.instagram.com`.

Lo que se midió en el CRM, solo con conteos:

| Medición | Resultado |
|---|---|
| Envíos del formulario de las landings (`landing_submissions`) | 0 en toda la historia, en las cuatro |
| Contactos con `source = 'landing'` | 0 |
| Oportunidades con `first_source = 'landing'` desde el 01/10 | 0 (todas son de base importada o no informadas) |
| Mensajes de WhatsApp con el texto que pre-carga la web | 1 en total (Marketing, 26/10); ninguno desde el 10/11 |
| Palabras clave de redes en WhatsApp desde el 10/11 | 2, ambas de VITA («ALTA» y «ART»), contra 4 del 27/10 al 09/11 |

**Conclusión:** hoy ni las landings ni las redes generan consultas medibles. Como no hay analítica, no se puede saber si es por falta de visitas o por falta de conversión.

## 4. Carpeta `public/redes`

Entre 126 y 133 archivos por landing, con imágenes y videos de las publicaciones programadas hasta el 25/11. Se sirven bien (prueba: `autoskocos.com/redes/autos-anticipo-b-his0.jpg` → 200 image/jpeg). Metricool ya copió los archivos a su propio almacenamiento. Las URL aparecen en el sitemap y conviene sumar `Disallow: /redes/` en robots.

## 5. Datos reales que no se pudieron medir

- **Vercel Web Analytics:** los proyectos de las landings no están en el equipo conectado; la única cuenta visible tiene solo `legal-crm`.
- **Search Console y GA4** (search-visibility-kit): la credencial del servidor no está configurada (falta el archivo de la cuenta de servicio de Google). Además, los sitios no tienen código de verificación.
- **Indexación real en Google:** no se comprobó.

## 6. Prioridades

1. **Verificar las cuatro en Search Console y Bing** (completar `VERIFICATION` o usar DNS), enviar los sitemaps y activar IndexNow. Las claves ya están.
2. **Medir:**
   - Sumar GA4 (con GTM o directo) y el píxel de Meta.
   - Activar Vercel Analytics en el proyecto donde están alojadas.
   - Usar los eventos que ya existen.
   - Cada clic en WhatsApp se registra antes de abrir `wa.me`.
3. **Enlaces de redes con UTM:**
   - En la bio, un enlace por perfil del tipo `/?utm_source=instagram&utm_medium=bio&utm_campaign=<marca>`.
   - En las historias con enlace, `utm_content=<pieza>`.
   - Las landings guardan los `utm_*` y los mandan al formulario y al texto de WhatsApp, por ejemplo «(ref: IG-<pieza>)».
   - El CRM los guarda en `first_source_detail`.
4. **Una página de destino por serie de redes**, con su palabra clave: por ejemplo `/redes/firmas-o-no` y `/guias/aumento-prepagas-diciembre`. El reel lleva a la página y la página lleva a WhatsApp con un mensaje prellenado que identifica la pieza.
5. **E-E-A-T:** cargar el revisor con nombre y matrícula en VITA y, en Coberturas, quién asesora y con qué registro (si corresponde).
6. **Actualizar `lastmod`** con la fecha real de cada cambio y sumar contenido estacional por rubro.
7. **Nuevo silo «Despidos»** en VITA, solo si el estudio atiende esos casos (confirmarlo con la responsable).

## Cadena redes → landing → WhatsApp → CRM, medida

```text
Publicación (palabra clave + enlace con UTM en bio o historia)
  → landing: guarda utm_source, utm_campaign y utm_content en sessionStorage y dispara page_view en GA4 y el píxel
  → clic en WhatsApp: evento click_whatsapp con la pieza; mensaje prellenado que termina en «(ref: IG-PIEZA)»
  → CRM: el bot reconoce la referencia o la palabra clave y guarda first_source = 'redes',
    detalle = red · pieza · campaña
  → informe: consultas y captaciones por pieza
```

Lo de la landing es un cambio chico en `leads.ts` y en `whatsappUrl()`. En el CRM hay que sumar el reconocimiento de la referencia y guardar el origen.
