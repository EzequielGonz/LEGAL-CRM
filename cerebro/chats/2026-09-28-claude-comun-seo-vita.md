# Estrategia SEO invisible para estudio jurídico de accidentes (y réplicas para coberturas, 0 km y marketing)

## 1. Encabezado

- **Título del chat:** «Estrategia SEO invisible para estudio jurídico de accidentes». El mismo chat sumó después coberturas médicas, 0 km y marketing.
- **Inicio:** 28/09/2026 20:00. **Fin:** 30/09/2026 11:29 (última actividad). Exportación del 21/11/2026. La zona horaria no figura en la exportación (no confirmado).
- **Origen:** Claude común. 33 mensajes.
- **Perfiles o marcas que toca:**
  - Jurídico: estudio de accidentes de tránsito y laborales (VITA según `cerebro/05`).
  - Coberturas médicas: asesor que vende y compara prepagas y obras sociales.
  - Autos 0 km: agencia multimarca («Agencia Kocos» / «Autos Kocos» según la auditoría del 20/11).
  - Marketing: Kocos Marketing.
- Son cuatro sitios separados. El chat no mezcla contenido ni rubros entre ellos.

## 2. Objetivo

Armar, para cuatro sitios del dueño, una capa de SEO completa: silos, artículos o guías, calculadoras, metadatos, schema y sitemaps. Todo sin tocar el diseño de la home, solo sumando secciones al header y manteniendo la misma estética. Cada sitio debía quedar con CTA a mitad y al final, un formulario «te contactamos» y puntos de conexión para cargar WhatsApp, redes y base de datos después.

Alcance pedido: AMBA (CABA y conurbano) para tránsito, coberturas y 0 km. Todo el país para laborales (ART) y marketing.

## 3. Órdenes y decisiones del dueño

- **28/09 20:00 (accidentes):** «no quiero que toques nada del diseño, unicamente que pienses una estrategia gigante para integrarle un SEO enorme, que tenga articulos, blog, metadatos, titulos, todo escondido, nada nada que toque el diseño principal de la pagina».
- **28/09 20:00:** «de accidentes LABORALES SI PODEMOS ABARCAR TODO TODO EL PAIS AHI SI METERLE PALABRAS CLAVE Y FULL SEO». Para tránsito, «para buenos aires argentina, con mas prioridad, amba».
- **28/09 20:07:** «el home mantenlo intacto y suma todo lo que me dijiste pero manteniendo tal cual el diseño del home, junto con los colores, deja todo listo para agregarle whatsapp instagram y facebook». Y: «El formulario despues se conecta a supabase u otra».
- **28/09 20:07:** «el formulario va a una base de datos el cual le escribe un asesor, es una firma no un solo abogado».
- **28/09 20:09:** «sisi, incluso que el publico entre del header con las dos areas, no tengo problema».
- **28/09 20:37 (coberturas):** «replicar… para coberturas medicas, obras sociales y prepagas… no tocar nada del home y en el header integrar las dos secciones… agrega ctas y un formulario como el que ya esta y despues se integra redes, nro de telefono y base de datos».
- **28/09 20:38:** «Asesor/broker que vende y compara planes de prepaga». Sitio: «Un sitio nuevo (te paso su zip)».
- **28/09 20:40:** «la idea es que sean en relacion de dependencia, con alto poder adquisitivo y grupos familiares tambien, todo, menos jubilados, de hasta 60 años en su posibilidad. cualquier cosa, derivacion, cambio, afiliacion todo».
- **28/09 20:41:** «y que la prioridad sea solo amba, no bs as en general, solo amba».
- **28/09 20:42:** «si afuera la plata» (La Plata queda afuera).
- **29/09 20:44 (0 km):** «armemos una estrategia igual a las dos anteriores pero para hacer un SEO para una landing de ventas de 0km tambien apuntando solamente al amba, no la plata, haciendo hincapie en caba».
- **29/09 20:46:** «Agencia multimarca (no oficial)». Formas de compra: «contado, financiacion, credito prendario, plan de ahorro, usado como parte de pago, todas las maneras, para todas las marcas». Y: «No tocar el home, solo agregar alguna sección en el header, y esas nuevas secciones articulos y todo mantengan la misma estetica y todo del home».
- **30/09 11:12 (marketing):** «replicar todo lo que venimos haciendo… agregale algo solo en el header, manteniendo la estetica intacta y dejando para rellenar despues wpp ig fb y base de datos con el formulario para contactarlos».
- **30/09 11:13:** zona: «Todo el país priorizando negocios con alto poder adquisitivo, no solo ofrecer paginas web sino tambien automatizaciones o proyectos mas grandes». Rubros: «A TODOS.»

## 4. Correcciones que hizo el dueño

- **«Invisible».** El dueño pidió «todo escondido». Claude lo redefinió (28/09 20:02): nada de texto oculto por CSS, cloaking ni páginas-puerta. «Invisible» quedó como páginas en subrutas, metadatos, schema y sitemaps que el visitante no ve en la home. El dueño no lo objetó y siguió. Es una redefinición aceptada de hecho, no por escrito.
- **Firmante.** Claude había pedido la matrícula del abogado firmante. El dueño corrigió: es una firma. Claude pasó a «equipo legal del estudio» con un campo opcional «revisado por Dr./Dra. + matrícula».
- **Alcance geográfico.** Claude había propuesto La Plata y zonas amplias. El dueño: «solo amba, no bs as en general» (20:41) y «si afuera la plata» (20:42). Se aplicó después a coberturas, 0 km («no la plata») y marketing.
- **Home.** Claude escribió «no toco ni una línea de su diseño ni de su contenido» (20:08). Luego sí tocó la home (ver sección 12). El dueño aceptó el header con las dos áreas, pero no pidió cambios en footer, título ni metadatos.

## 5. Qué se hizo, con estado

Estado de evidencia tomado del propio chat. Lo que viene de `cerebro/05` se marca aparte.

1. **Estrategia de silos** (tránsito, ART/laborales, prepagas, obras sociales, 0 km, financiación, servicios, rubros). **Especificado** en el chat: 28/09 20:02, 20:41; 29/09 20:47; 30/09 11:13.
2. **Sitio de accidentes (VITA).** **Implementado** y entregado como proyecto zip alrededor de las 20:33 del 28/09. **Probado** solo en entorno simulado: `react-router` y `lucide-react` simulados, `pocketbase` con stub, calculadora ART compilada con esbuild, capturas de escritorio y mobile, sitemap de 65 URLs, sin enlaces internos rotos. No se corrió `npm ci` ni `typecheck`. **Publicado:** no consta en el chat; `cerebro/05` registra sitemap de 64 páginas al 21/10 (no verificado aquí). **Habilitado:** no. El formulario no guardaba consultas hasta conectar base.
3. **Sitio de coberturas (prepagas y obras sociales).** **Implementado** sobre el zip recibido el 28/09 20:42; entrega alrededor de las 20:56. **Probado** igual que el anterior, incluido el cotizador de aportes en navegador simulado (según el chat). Sitemap de 67 URLs. **Publicado:** no consta aquí. **Habilitado:** no.
4. **Sitio de 0 km (Agencia Kocos).** **Implementado** (entrega alrededor del 29/09 21:33). **Probado** en entorno simulado: simulador de cuotas con números de prueba, rutas compiladas, loaders ejecutados. Sitemap de 80 URLs, La Plata devuelve 404 y el schema es `AutoDealer`. **Publicado:** no consta aquí. **Habilitado:** no.
5. **Sitio de marketing (Kocos Marketing).** **Implementado** (entrega alrededor del 30/09 11:29). **Probado:** renderizado, calculadora de ahorro y migración de PocketBase aplicada sobre una base limpia con PocketBase incluido en el proyecto, con un envío real de prueba. Sitemap de 47 URLs. **Publicado:** no consta aquí. **Habilitado:** no. El formulario sigue en PocketBase y Supabase está pendiente.
6. **Header de cada sitio.** Se sumaron dos secciones en cada uno:
   - Accidentes: «Accidentes de tránsito» y «Accidentes laborales» (en pantallas medianas, «Tránsito» y «Laborales»).
   - Coberturas: «Prepagas» y «Obras sociales».
   - 0 km: «0KM» y «Financiación», en reemplazo de «Vehículos».
   - Marketing: «Servicios» (lleva a la sección nueva) y «Rubros».
   - Probado en todos los anchos, según el chat.
7. **Formulario de la home.** Ahora envía a `lib/leads.ts`. Sin base conectada se comporta como antes. Si hay base y el envío falla, avisa en vez de mostrar «gracias».

## 6. Todo lo concreto

**Archivos de configuración en cada proyecto** (los zips no tienen ruta de repo en el chat):
- `constants/brand.ts`: dominio, teléfono, WhatsApp, Instagram, Facebook (accidentes, coberturas, 0 km). En marketing, `constants/site.ts`, que ya existía y ahora centraliza WhatsApp, Instagram, Facebook, TikTok, LinkedIn y dominio.
- `constants/cta.ts`: textos de los CTA.
- `lib/leads.ts`: destino de las consultas. Hoy PocketBase; Supabase se cambia en una línea.
- `supabase/consultas.sql`: tabla con estado y notas para el asesor. No aplicada.
- `README-SEO.md`: checklist de lanzamiento.

**Accidentes (VITA):**
- Pilares `/accidentes-de-transito/` y `/accidentes-laborales/`.
- 12 guías de tránsito, 20 páginas por zona (CABA y 19 partidos), 14 guías laborales, calculadora de indemnización ART, 6 páginas por oficio.
- 6 provincias publicadas en el silo laboral; el resto en borrador (ver sección 12).
- Sitemap de 65 URLs.

**Coberturas:**
- `/prepagas`: 10 marcas (OSDE, Swiss Medical, Galeno, Omint, Medifé, Sancor, Medicus, Avalian, Hospital Italiano y Hospital Alemán), 3 comparativas, 6 perfiles, 7 guías, 25 zonas.
- `/obras-sociales`: derivación de aportes, cambio de obra social, trabajo nuevo, sumar a la familia, cuánto se aporta, obra social o prepaga, personal de dirección, cambio de trabajo, PMO.
- Guías con cotizador de aportes, glosario y lista de documentos.
- Sitemap de 67 URLs.

**0 km:**
- `/0km`: 6 segmentos, 10 marcas, 13 modelos, 3 comparativas, 28 zonas (CABA con 12 barrios y 15 partidos del AMBA).
- `/financiacion`: contado, prendario, tasa 0 %, plan de ahorro, sorteo y licitación, usado como parte de pago, requisitos para dependencia y monotributo.
- Simulador de cuotas y guías de compra, patentamiento, seguro, entrega y garantía.
- Sitemap de 80 URLs.

**Marketing:**
- `/servicios`: 12 servicios y 10 ciudades (ejemplo de ruta: `/agencia-de-marketing-digital/cordoba`).
- `/rubros`: 12 rubros.
- 8 guías para decisores.
- Calculadora de ahorro por automatización.
- Migración de PocketBase: tres opciones nuevas en «¿Qué necesitás?» (E-commerce, Automatización o IA, Software a medida) y el campo `origen`. Número de migración no indicado.
- Sitemap de 47 URLs.

**Ningún dato de redes, Metricool, campañas ni publicaciones programadas aparece en este chat.**

## 7. Datos del negocio

- **VITA (accidentes):** es una firma con varios abogados, no un solo profesional. El formulario va a una base y lo atiende un asesor. Tránsito en AMBA; laborales en todo el país. La matrícula del revisor es opcional.
- **Coberturas:** asesor o broker que vende y compara prepagas y obras sociales. Público: relación de dependencia, ingresos medios y altos, familias, hasta 60 años. Excluye jubilados y PAMI. Zonas: CABA (Palermo, Belgrano, Recoleta, Núñez, Caballito, Villa Urquiza), zona norte (Vicente López, San Isidro, Tigre, Nordelta, Pilar) y oeste y sur (Morón, Ituzaingó, Lomas, Adrogué, Quilmes). Las marcas se nombran con la aclaración «somos asesores, no la prepaga».
- **0 km:** agencia multimarca independiente, no concesionario oficial. Formas de compra: contado, financiación, crédito prendario, plan de ahorro y usado como parte de pago. Zonas: CABA con foco en barrios y 15 partidos (cuáles, no confirmado). Modelos de la página: Hilux, Cronos, Ranger, 208, Tera, Tracker, Amarok, Taos, Territory, Corolla Cross, Yaris, 2008 y Strada.
- **Marketing:** servicios de web, e-commerce, rediseño, mantenimiento, redes, contenido, estrategia, automatizaciones, asistentes de WhatsApp con IA, CRM y software a medida. Público: dueños y gerentes de empresas medianas y grandes de todo el país. No se afirmaron casos ni clientes.
- **Ejemplo de calculadora (marketing):** 8 h × 3 personas × 48 semanas × 50 % = 576 h y $5.760.000 por año. Es un caso de prueba, no un dato del negocio.
- **Proveedores y stack:** PocketBase es la base actual de los sitios. Supabase tiene el SQL listo pero no está aplicado. El proyecto de accidentes se exportó de Hostinger Horizons (React Router con SSR).

## 8. Pendiente, a medias o bloqueado

- Cargar WhatsApp, Instagram, Facebook, teléfono y dominio en `constants/brand.ts` (o `site.ts` en marketing). Sin datos, los botones de WhatsApp llevan al formulario. Dominio de accidentes: pendiente.
- Conectar Supabase (aplicar `supabase/consultas.sql` y cambiar `lib/leads.ts`) o un webhook. Sin base, el formulario no guarda.
- Correr `npm ci` y `npm run typecheck` en los cuatro proyectos. No se hizo: no había dependencias en el entorno.
- Revisión legal antes de publicar: un abogado del estudio (normas, plazos, fórmula ART) y el equipo de coberturas (derivación, cambio, carencias).
- Checklist de `README-SEO.md`: Search Console, Bing Webmaster Tools, IndexNow, Google Business Profile.
- Casos de éxito para marketing: decisión del dueño, no se afirmaron.
- Revisar la lista de modelos 0 km cada pocos meses.
- [secreto: credenciales de superusuario de PocketBase pasadas por variables de entorno para la prueba de marketing (valor no copiado). Hay que cambiarlas si se reutilizaron (no confirmado).]

## 9. Aprendizajes

- Sin acceso a npm, el entorno simuló dependencias. Eso detectó errores reales: título centrado en un artículo (accidentes), selector cortado en mobile, header que desbordaba entre 851 y 900 px (coberturas; se ocultó «Inicio»), menos de 3 enlaces relacionados (0 km; se mejoró el relleno), género gramatical («el Fiat Cronos»), y secciones de la home que quedaban invisibles al volver de un artículo.
- El formulario de la home nunca guardó consultas. Lo detectó Claude al revisar coberturas. Se cambió para que avise si el envío falla.
- Las calculadoras (ART, cotizador de aportes, simulador de cuotas, ahorro por automatización) fueron el punto que Claude marcó como imán de tráfico y backlinks. Es una afirmación del chat, no medida.
- Claude advirtió que Google penaliza el texto oculto y las páginas repetidas por ciudad (doorway pages). Por eso cada zona se hizo con contenido propio.

## 10. Preguntas abiertas

- ¿Qué base usan finalmente: PocketBase (la actual) o Supabase?
- ¿Cuándo y en qué dominios se publican los cuatro sitios?
- ¿Quién revisa los textos legales, con nombre y matrícula?
- ¿Se suman casos de éxito a marketing?
- ¿Coberturas: qué prepagas comercializan de verdad? Claude pidió confirmarlo. El dueño respondió «algo bien general»; las 10 marcas no están confirmadas.
- ¿Se incluye La Plata en alguna zona? Quedó afuera por defecto.

## 11. Ramas y cambios

- **Repo y rama:** ninguno en este chat. El código se entregó en zips dentro del chat. No hay commits, PR ni rama. Habría que confirmar dónde quedaron los zips y si se integraron a un repo (no confirmado).
- **Commits:** ninguno.
- **Archivos tocados:** los de la sección 6, en cada proyecto de sitio.
- **Migraciones:** una migración de PocketBase en marketing (número no indicado). Se aplicó sobre una base limpia de prueba. En producción no consta (no confirmado).
- **Despliegues:** ninguno en el chat. `cerebro/05` registra sitemaps de los cuatro sitios al 21/10 (no verificado aquí).
- **Configuración externa:** ninguna en este chat. No se tocaron Vercel, Supabase, Meta, Metricool, Google ni redes.
- **Encendido o apagado:** nada quedó encendido por este chat según el texto. Los formularios siguen sin base conectada.

## 12. CONTRADICE

- **Home intacta vs. cambios reales.** Claude escribió «no toco ni una línea de su diseño ni de su contenido» (28/09 20:08). Después cambió el título, los metadatos y el footer de la home, corrigió el observador de animaciones y conectó el formulario. El header sí fue aceptado. Footer, título y metadatos no fueron pedidos. Marketing (30/09) dice «Simplifico el título de la home». Coberturas dice «Mejoré los metadatos para Google». 0 km dice «Metadatos: los orienté a autos 0km en CABA». Esto contradice el «no tocar el home» del dueño.
- **Provincias en borrador de accidentes.** Un mensaje dice «64 páginas publicadas (más 17 provincias en borrador)». El mensaje final dice «6 provincias publicadas… Las otras 18 provincias quedan en borrador». Son 17 o 18 (no confirmado).
- **0 km, «13 modelos… (lo verifiqué)».** El chat no muestra ninguna verificación de ventas 2026 (no confirmado).
- **Schema laboral de VITA.** El chat declara `LegalService` con `areaServed` en Argentina para laboral. `cerebro/05` (línea 44) dice que los datos estructurados de VITA deben corregirse porque no tienen «laboral ni penal». Revisar en el sitio real.
- **Precios en marketing.** `cerebro/05` (línea 43) menciona «precios publicados en Marketing». El chat de marketing no informa precios publicados; solo un ejemplo de calculadora (no confirmado).
- **Publicación.** El chat no marca ningún sitio como publicado, pero `cerebro/05` registra sitemaps de los cuatro al 21/10. Esa memoria es posterior; manda lo verificado en la base o el hosting, no el chat.
- **«Invisible».** El dueño escribió «todo escondido». En el chat quedó como SEO legítimo y el dueño no lo confirmó por escrito. No es un hecho contradicho, pero la expectativa de «escondido» no quedó resuelta.
