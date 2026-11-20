# Presencia en Google de las 4 marcas: guía para la responsable

Preparado el 20/11/2026. Todo está listo para cargar, pero **no se publicó nada**: desde la sesión de Claude en la nube no se puede entrar a la cuenta de Google. Lo hace la responsable o Claude in Chrome en su computadora, con el pedido del final.

| Marca | Perfil de Empresa de Google | YouTube | Search Console y Bing |
| --- | --- | --- | --- |
| VITA | Elegible si atiende en una oficina o se reúne en persona con los clientes | Listo | Listo para verificar |
| Coberturas | Depende de que haya atención en persona; hoy no se sabe | Listo | Listo para verificar |
| Autos | Elegible si hay salón u oficina, o entregas en persona. Antes hay que unificar el nombre | Listo | Listo para verificar |
| Kocos Marketing | **No elegible** con lo que dice la web hoy (trabajo 100 % a distancia) | Listo | Listo para verificar |

Cada carpeta (`vita/`, `coberturas/`, `autos/`, `marketing/`) tiene un `README.md` con los textos para copiar y pegar, y estas imágenes:

| Imagen | Medida | Uso |
| --- | --- | --- |
| `youtube-banner.png` | 2560 × 1440 | Banner de YouTube. El texto queda dentro de la zona segura de 1546 × 423 |
| `perfil-800.png` | 800 × 800 | Foto de perfil de YouTube y logo del Perfil de Empresa |
| `google-portada.png` | 1024 × 576 | Portada del Perfil de Empresa |
| `google-publicacion-1.png` a `-4.png` | 1200 × 900 | Primeras 4 publicaciones del Perfil de Empresa |

## Paso 1. Search Console y Bing (las 4 marcas, unos 15 minutos)

Es lo más importante: hoy no sabemos si Google indexó las landings ni para qué búsquedas aparecen.

1. **Verificar cada dominio.** Entrar a search.google.com/search-console › Agregar propiedad, y elegir una de dos opciones:
   - **Opción A, recomendada: propiedad de dominio** (`estudiojuridicovita.com`, `comparatuobrasocial.com`, `autoskocos.com`, `kocosmkt.com`). Google da un registro TXT que se agrega en el DNS del dominio. Si los dominios están en Vercel, se carga en la cuenta de Vercel donde están las landings (Domains › el dominio › DNS Records › TXT), que no es la del CRM. Si están en otro proveedor, se carga en ese proveedor.
   - **Opción B: prefijo de URL** (`https://www.<dominio>/`) con etiqueta HTML. Google da un código, que se pega en `VERIFICATION.google` de `brand.ts` (en Marketing, `site.ts`) o en la variable de entorno que define `docs/redes/MEDICION-2026-11-20.md`, si ese cambio ya está publicado. Después hay que publicar la landing y tocar «Verificar».
2. **Enviar el sitemap.** En Sitemaps, cargar `https://www.<dominio>/sitemap.xml`. Se comprobó el 20/11: el sitemap responde en los 4 dominios y figura en `robots.txt`.
3. **Bing.** Entrar a bing.com/webmasters, tocar «Importar desde Google Search Console» y autorizar: trae los sitios y los sitemaps solo.
4. **IndexNow, para que Bing indexe al instante.** La clave ya se publica en `https://www.<dominio>/indexnow.txt` (se comprobó el 20/11: responde en los 4). Cuando cambie una página, Claude puede avisar con una llamada a `api.indexnow.org` con `keyLocation` apuntando a ese archivo.
5. **Después de 3 o 4 días**, revisar en Search Console las páginas indexadas, las búsquedas y los errores. Claude lo puede leer si se le da acceso a la propiedad.

## Paso 2. Perfil de Empresa (VITA y Autos ya; Coberturas y Marketing, solo si cumplen)

**Reglas de Google que no se negocian:**
- Atención en persona en el horario publicado.
- El nombre real, sin agregarle palabras clave.
- Una sola ficha por negocio.
- Nada de oficinas virtuales.
- Fotos reales.

Si se rompe alguna, Google suspende la ficha.

1. Entrar a business.google.com › Agregar empresa, con la cuenta de Google de la marca (la misma de YouTube, si se puede).
2. Cargar el nombre, la categoría principal, la dirección o el área de servicio, el teléfono y la web con UTM de cada README.
3. **Verificar.** Google suele pedir un video corto con el cartel o la placa, el lugar de atención y algo que pruebe que es tu negocio. A veces ofrece un código por teléfono o por correo. La verificación la hace la responsable.
4. Ya verificado, completar el resto:
   - categorías secundarias;
   - descripción;
   - servicios;
   - horarios;
   - atributos;
   - logo y portada;
   - fotos reales.
5. Publicar las 4 novedades iniciales, con su confirmación.
6. **Después, 1 novedad por semana** con el tema de la serie de redes de esa semana.

**Preguntas y respuestas.** Google quitó esa sección de los perfiles (se anunció el 03/12/2025) y la reemplazó por un botón «Preguntar» que responde con IA a partir del perfil, las reseñas y la web. Por eso las preguntas frecuentes de cada README van en los servicios, en las publicaciones y en las preguntas frecuentes de la landing.

## Reseñas: cómo pedirlas sin romper las reglas

- **A quién:** solo a clientes reales que ya recibieron el servicio. Lo hace una persona del equipo, uno por uno, con el enlace «Pedir reseñas» del panel. Nunca de forma masiva ni a bases importadas.
- **Mensaje sugerido:** «Gracias por confiar en nosotros. Si querés contar cómo fue tu experiencia, nos ayuda mucho que dejes tu opinión en Google: <enlace>. Es opcional».
- **Prohibido por Google:**
  - dar descuentos, regalos o cualquier beneficio a cambio;
  - pedirle la reseña solo a quien está conforme;
  - que escriban empleados o familiares;
  - escribir reseñas falsas.
- **Responder todas dentro de las 48 horas**, en un tono tranquilo:
  - **VITA y Coberturas:** nunca confirmar que alguien es cliente ni mencionar datos del caso o de salud.
  - **Reseñas negativas:** disculpa breve y ofrecer seguir por privado.
  - **Reseñas falsas:** se denuncian desde el panel.

## Paso 3. YouTube (canal de Shorts por marca)

1. Con la cuenta de Google de la marca, entrar a youtube.com › Crear canal y cargar el nombre y el identificador de cada README.
2. En YouTube Studio › Personalización, cargar el banner, la foto de perfil, la descripción y los enlaces.
3. En Configuración › Canal, poner país Argentina, las palabras clave y «No es contenido para niños».
4. Conectar el canal en Metricool para programar los Shorts junto con los reels.
5. En cada video realista hecho con IA, marcar «contenido alterado o sintético». YouTube lo exige.

## Antes de empezar, la responsable tiene que definir

1. **Dirección real y horarios** de VITA y de Autos. De Coberturas y Marketing, solo si hay atención en persona.
2. **El nombre de la agencia de autos:** «Automotores Kocos» o «Agencia Kocos». Después se unifica en la web.
3. **Cómo se escribe «Compara tu Obra Social»:** «tu» con minúscula o con mayúscula.
4. **Nombre y matrícula** de la persona que revisa los textos jurídicos de VITA, para la web.
5. **Fotos reales** de la oficina, el equipo o las entregas.
6. **Cuentas de Google:** cuál usa cada marca para el Perfil de Empresa, YouTube y Search Console.

## Cambios sugeridos en las landings (no se hicieron)

Hay otro trabajo tocando las landings por la medición, así que estos cambios no se hicieron para no pisarlo:
- **VITA:** sumar a `knowsAbout` despidos, indemnizaciones laborales, trabajo no registrado y derecho penal.
- **Las cuatro:** cargar el teléfono en formato internacional en el schema (`+549…`).
- **Marketing:** agregar el teléfono al schema.
- **Las cuatro:** completar la dirección y los horarios cuando estén.
- **Las cuatro:** sumar a `sameAs` el canal de YouTube y el Perfil de Google.
- **Autos y Coberturas:** unificar el nombre.

## Pedido listo para Claude in Chrome

Para pegar en un chat nuevo de Claude de escritorio, con la extensión de Chrome conectada y la sesión de Google de la marca iniciada:

```text
Usá mi Chrome. Tengo sesión iniciada en la cuenta de Google de <MARCA>. Vas a cargar lo que está preparado en docs/redes/google/<marca>/README.md del repositorio EzequielGonz/LEGAL-CRM (te lo pego abajo junto con las imágenes). Reglas: solo cargar exactamente esos textos e imágenes; no publiques novedades ni respondas reseñas sin preguntarme antes; no cambies nada que no esté en el documento; no aceptes pagos, pruebas gratuitas ni anuncios; si Google pide verificar (video, código o llamada), pará y avisame.
1) Search Console: agregá la propiedad del dominio, mostrame el registro TXT o el código HTML que da Google y esperá. Cuando esté verificada, enviá el sitemap https://www.<dominio>/sitemap.xml.
2) Bing Webmaster Tools: importá los sitios desde Search Console.
3) YouTube Studio (si el canal ya existe): cargá banner, foto, descripción, enlaces, palabras clave, país Argentina y "No es contenido para niños".
4) Perfil de Empresa (solo si el README dice que es elegible y yo te confirmo dirección y horarios): creá o completá el perfil con nombre, categorías, descripción, servicios, área, contacto, logo y portada. Las 4 publicaciones dejalas listas y publicalas solo si te lo confirmo.
Al final, devolveme qué quedó cargado, qué quedó pendiente y cualquier aviso de Google, sin datos personales.
```

## Fuentes

- Pautas de Google para representar tu empresa: https://support.google.com/business/answer/3038177
- Pautas de elegibilidad y propiedad de Google: https://support.google.com/business/answer/13763036
- Cambio de preguntas y respuestas por el botón «Preguntar»: https://www.seroundtable.com/google-maps-qa-feature-ask-40594.html y https://whitespark.ca/blog/with-google-qa-gone-you-need-a-maps-ask-a-question-strategy/
