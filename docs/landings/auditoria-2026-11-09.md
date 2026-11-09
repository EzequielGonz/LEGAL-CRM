# Auditoría de las cuatro landings · 09/11/2026

Alcance: estudiojuridicovita.com, comparatuobrasocial.com, autoskocos.com y kocosmkt.com.

Qué se hizo:
- **Rastreo técnico** de las 259 URL de los sitemaps.
- **Lighthouse móvil:** una corrida de laboratorio por inicio. El medidor online de Google (PageSpeed Insights) no respondió por falta de cupo, así que no hay datos de campo de usuarios reales.
- **Capturas a 390 px** y lectura de títulos, botones, formularios y textos.

Solo se miró: no se cambió nada en las landings.

## Resumen

Lo técnico está sano: todas las páginas responden, tienen título y descripción únicos, un solo H1, canonical correcto y ninguna imagen rota.

Lo que frena son tres cosas:
1. **El mensaje es genérico.** Ningún título principal nombra el problema concreto de la persona.
2. **Hay fricción para consultar:** formularios de 6 a 9 campos y, en Kocos Marketing, el primer botón de WhatsApp aparece recién a 3.760 px.
3. **Hay detalles que restan confianza:** proyectos «Próximamente» bajo el título «Proyectos que hablan por nosotros», el nombre «Agencia Kocos» contra «Automotores Kocos» y el logo de VITA que no es el original.

## 1. Rendimiento y calidad (Lighthouse móvil, laboratorio)

| Sitio | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | FCP | CLS | Peso |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VITA | 78 | 95 | 100 | 92 | 4,1 s | 3,7 s | 0 | 646 KiB |
| Compara tu Obra Social | 76 | 95 | 100 | 92 | 4,8 s | 3,2 s | 0 | 427 KiB |
| Autos (autoskocos.com) | 89 | 95 | 100 | 92 | 3,0 s | 2,9 s | 0 | 378 KiB |
| Kocos Marketing | 86 | 100 | 100 | 92 | 3,6 s | 2,6 s | 0 | 289 KiB |

Objetivo: LCP de 2,5 s o menos. Las causas comunes a los cuatro sitios:

- **Recursos que bloquean el dibujo de la página:** la hoja de Google Fonts y el CSS de la app. El ahorro estimado es de 1,03 s en VITA, 650 ms en Coberturas, 430 ms en Marketing y 260 ms en Autos.
  - **Solución:** fuentes alojadas en el propio sitio, con `preload` de la que usa el título y `font-display: swap`.
- **Imágenes más pesadas o más grandes que lo que se muestra:** se pueden ahorrar 380 KiB en VITA, 217 en Coberturas, 116 en Autos y 67 en Marketing.
  - **Solución:** AVIF o WebP más chicas, con `srcset` por ancho de pantalla.
- **SEO 92 en los cuatro:** se debe solo a `robots.txt`, por la línea `Content-Signal` que agregamos para indicar el uso por IA.
  - Google ignora las líneas que no conoce, así que no perjudica la indexación; solo baja el puntaje de Lighthouse.
  - Hay que decidir si se mantiene o se quita.
- **Contraste insuficiente:**
  - VITA: textos chicos del hero y las etiquetas de sección.
  - Coberturas: un caso.
- **Nombres accesibles que no coinciden con el texto visible:** logo del encabezado y enlace «Ir a especialidades» en VITA, y un caso en Marketing.
- **Enlace sin nombre:** uno en Autos.
- Durante el rastreo, un recurso del inicio de VITA respondió 502 una sola vez y no se repitió. Hay que vigilarlo.

## 2. Mensaje: lo que hoy suena genérico

### Títulos principales (H1)

Los títulos propuestos son orientativos. En VITA y Coberturas requieren revisión profesional antes de publicarse.

| Sitio | H1 actual | Problema | Propuesta |
| --- | --- | --- | --- |
| VITA | Defendemos tus derechos cuando más lo necesitás. | Podría ser de cualquier estudio; no dice choque, ART ni accidente | «¿Te chocaron o te accidentaste trabajando? Antes de firmar nada, consultanos.» |
| Coberturas | Encontrá la cobertura médica que mejor se adapta a vos. | Frase de categoría; no menciona aportes, edad ni zona | «Compará prepagas y obras sociales con un asesor: según tu edad, tu zona y tus aportes.» |
| Autos | Tu próximo 0KM puede estar más cerca de lo que pensás. | Promesa vaga; no dice qué hace distinta a la agencia | «Tu 0 km con el precio llave en mano claro: contado, prendario, plan de ahorro o con tu usado.» |
| Marketing | Tu marca merece una presencia que esté a la altura. | No dice qué se vende; el diferencial (WhatsApp, CRM, automatización) no aparece | «Respondé cada consulta de WhatsApp a tiempo y que ninguna venta se enfríe.» |

### Otros problemas del mensaje

- **Etiquetas sobre el título en los cuatro sitios:** «Asesoramiento legal especializado», «Tu bienestar empieza con una buena elección», «TU PRÓXIMO CAMINO EMPIEZA ACÁ». Son relleno y la responsable pidió no usarlas.
- **Títulos de sección intercambiables entre marcas:** por ejemplo, en Coberturas, «Encontrá la cobertura que necesitás», «Encontrar tu cobertura puede ser más simple» y «Encontrá una cobertura que se adapte a vos» en la misma página. Cada sección tendría que responder una duda distinta.
- **Sin señales verificables de confianza:** matrícula, dirección, horario, reseñas reales de Google o cómo es la primera consulta. Solo se suman con datos autorizados; no se inventan.

## 3. Conversión

| Sitio | WhatsApp en la primera pantalla | Formulario | Observaciones |
| --- | --- | --- | --- |
| VITA | Sí (y flotante) | 6 campos | Correcto. El botón flotante tapa el texto del pie en el celular. |
| Coberturas | Sí (y flotante) | 9 campos | Formulario largo para un primer contacto. |
| Autos | Sí (y flotante) | 9 campos | Formulario largo. La foto del hero queda tan oscura que no se ve el auto. |
| Marketing | **No**: el primero está a 3.760 px | 9 campos, sin `name` ni `autocomplete` | El botón del hero no es de WhatsApp y la burbuja flotante usa un ícono de chat genérico. |

Propuestas:
- **Formulario corto:** nombre, teléfono y motivo. Lo demás, opcional o en la conversación.
- **WhatsApp con palabra clave por origen:** por ejemplo `?text=FIRMA` desde el reel de VITA. Así el CRM sabe qué pieza trajo la consulta.

## 4. Confianza y coherencia de marca

- **Marketing:**
  - La sección «Proyectos que hablan por nosotros» muestra dos tarjetas «PRÓXIMAMENTE» y enseguida dice «¿Querés resultados como estos?». Resta credibilidad. Hay que sacarla o mostrar trabajos reales. Las otras tres landings podrían servir, si son trabajos de Kocos y se autoriza mostrarlas.
  - Publica precios ($299.000, $499.000 y $699.000). Las reglas comunes indican que en Marketing no se dan precios ni rangos en la captación. Hay que confirmar si la landing es una excepción autorizada.
  - En el celular, el H1 tiene un interletrado tan cerrado que las palabras se pegan: «Tumarca», «queestéala».
- **Autos:** el encabezado dice «AGENCIA KOCOS»; el CRM y la responsable dicen «Automotores Kocos».
- **Logos de las landings que no coinciden con los originales** que entregó la responsable:
  - VITA: versión reconstruida con relleno crema.
  - Coberturas y Autos: ampliaciones con un borde claro.
  - Los originales están en `.claude/referencias/redes/logos/originales/`.

## 5. Cómo llamar la atención (más allá del diseño)

- **El hero repite el gancho de la serie de redes.** Por ejemplo, VITA: «¿Te ofrecieron firmar un acuerdo? Escribinos FIRMA». Quien llega desde un reel reconoce el mismo mensaje y la misma imagen.
- **Herramientas cortas que terminan en WhatsApp:**
  - Coberturas: «¿Te conviene derivar tus aportes?», tres preguntas.
  - Autos: «Checklist del precio llave en mano».
  - VITA: «Qué hacer en las primeras 24 horas después de un choque».
  - Ninguna promete resultados ni precios.
- **Mismo lenguaje visual que las piezas:** tipografías de marca, el objeto del mensaje (documento, recibo, etiqueta de precio, celular) y un solo llamado a la acción por sección.

## 6. Prioridades

1. **Esta semana:**
   - Reescribir el H1 y el hero de los cuatro sitios y quitar las etiquetas sobre el título.
   - Poner WhatsApp en el hero de Marketing.
   - Quitar «Próximamente» de Marketing.
   - Corregir el interletrado del H1 de Marketing.
   - Usar los logos originales y unificar el nombre de la marca de autos.
2. **Siguiente:**
   - Formularios de tres campos.
   - Fuentes propias con `preload`.
   - Imágenes AVIF con `srcset`.
   - Contraste y nombres accesibles.
   - Palabra clave de WhatsApp por origen.
3. **Después:**
   - Herramientas cortas por rubro.
   - Decidir `Content-Signal` en `robots.txt`.
   - Medir LCP de campo cuando haya datos de Search Console o del Informe de experiencia de Chrome (CrUX).

Cada cambio de texto jurídico o médico pasa por revisión profesional. Ningún cambio se publica sin autorización de la responsable.
