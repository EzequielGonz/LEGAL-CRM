# Diagnóstico de redes, landings y SEO · 20/11/2026

Pedido de la responsable (20/11): antes de seguir con el contenido, entender todo lo que se subió y lo que rindió hasta hoy en Instagram, Facebook, landings y SEO, y después sumar TikTok. Este documento es solo análisis: **no se programó, publicó ni cambió nada**.

Fuentes: Metricool (estado y métricas de las 4 marcas), base del CRM (consultas y conversaciones, solo totales), los 4 repositorios de landings y Lighthouse en móvil, e investigación pública de competencia. El detalle está en `analisis-2026-11-20/`.

| Estado | Qué |
| --- | --- |
| Medido | Estado de las 1.240 publicaciones del 10 al 29/11, métricas por reel del 10 al 19/11, seguidores, consultas en el CRM, puntajes de Lighthouse |
| No medido | Bio, botón de WhatsApp, destacadas y estado de cuenta en Instagram (hace falta la sesión de Meta), visitas a las landings (no hay medición instalada), posicionamiento en Google (las landings no están verificadas en Search Console) |

## 1. Qué se publicó

- **Ritmo de publicación:**
  - Del 22 al 24/10: 1 por día.
  - Del 25/10 al 05/11: 4 por día, más 2 reels de prueba por día que fallaron en Kocos.
  - Del 06 al 09/11: nada.
  - Desde el 10/11: 10 por día y por marca (5 reels, 2 posts, 1 carrusel y 2 historias), en Instagram y Facebook.
- **Del 10 al 19/11:** salió todo, menos 2 publicaciones de VITA en Instagram el 10/11 (cuenta restringida; se reenviaron y salieron) y 44 de Kocos en Instagram, del 13/11 a las 17:00 al 17/11 a las 20:30, porque Instagram estaba desconectado. Coberturas y Autos no tuvieron fallas.
- **Kocos:** desde el 18/11 vuelve a publicar bien en Instagram.
- **Lo que queda programado:**
  - Del 20 al 24/11: 50 publicaciones por red y por marca.
  - Del 25 al 29/11: solo las 44 de Kocos en Instagram.
  - Después del 29/11: nada.

## 2. Qué rindió (10 al 19/11)

| Marca | Seguidores IG / FB | Reels IG: reproducciones (sin ninguna) | Reels FB: reproducciones (promedio) |
| --- | --- | --- | --- |
| VITA | 2 / 1 | 349 (37 de 50 en 0) | 4.022 (80) |
| Coberturas | 0 / 1 | 50 (28 de 50 en 0) | 1.780 (36) |
| Autos | 0 / 3 | 86 (22 de 50 en 0) | 6.858 (137) |
| Kocos | 0 / 0 | 63 en 28 reels | 475 (9,5) |

- **Posts, carruseles e historias:** alcance de 0 o 1 en las dos redes.
- **Tiempo de visualización:** en promedio, 1 a 3 segundos.
- **Interacción:** comentarios, guardados, compartidos y clics, prácticamente 0.
- **Facebook, reels con música contra reels con voz:** los de música rindieron más en Autos (155 contra 125), Coberturas (53 contra 24) y Kocos (17 contra 5). En VITA empataron.
- **Temas que más rindieron:**
  - VITA: trayecto, culpa, las primeras 24 h y ART.
  - Coberturas: monotributo, cambio de prepaga y recibo de sueldo.
  - Autos: usado como parte de pago, plan de ahorro, votación y anticipo.
  - Kocos: consulta.
- **Horarios:** en Facebook, 17:00 y 20:30 levemente mejores; el fin de semana, mejor que los días hábiles.

## 3. Qué trajo (consultas en el CRM)

- **Palabras clave de redes por WhatsApp desde el 10/11:** 2, las dos de VITA («ALTA» y «ART»). En Coberturas, Autos y Kocos, 0.
- **Formularios enviados desde las landings:** 0 en toda la historia, en las 4.
- **Mensajes con el texto que pone la web:** 1 en total (Marketing, 26/10).
- **Conversaciones nuevas iniciadas por la persona:**
  - VITA: 11 a 13 por semana. No cambió con las redes; vienen de otros canales.
  - Coberturas: 3.
  - Autos: ninguna en el período.

## 4. Landings y SEO

- **Técnica:** muy buena. Lighthouse en móvil da de 97 a 100, con carga de 1,9 a 2,4 s, datos estructurados, sitemap, robots y llms.txt. El botón de WhatsApp y el formulario ya llevan la página de origen al CRM.
- **Problemas, iguales en las cuatro:**
  1. No están verificadas en Google ni en Bing: no se sabe si están indexadas ni para qué búsquedas aparecen.
  2. No hay ninguna medición (GA4, Tag Manager, píxel de Meta ni estadísticas de Vercel). Los eventos de clic están programados pero no llegan a ningún lado.
  3. Los enlaces de redes no llevan etiquetas que digan de qué red y publicación viene cada visita.
  4. El sitemap tiene fechas viejas (fines de septiembre).
  5. En VITA falta quién revisa los textos (nombre y matrícula).

## 5. Diagnóstico

1. **El problema no es el tema ni el horario: es la base.** Son cuentas nuevas sin seguidores, con 10 publicaciones por día, muy parecidas entre sí, varias marcadas como contenido hecho con IA, y con una restricción y una desconexión en el medio. Instagram casi no las distribuye. Es una hipótesis, coherente con todos los datos.
2. **Facebook sí reparte un poco** (hasta unas 200 reproducciones por reel), pero nadie se queda a mirar más de 1 a 3 segundos ni pasa al perfil. El gancho no detiene a la gente y el siguiente paso no se ve.
3. **El recorrido hasta la consulta está cortado o no se mide.** No está confirmado el botón de WhatsApp en los perfiles, «el botón está en el perfil» pide un paso de más, no hay etiquetas en los enlaces y las landings no miden nada.
4. **Más volumen igual no va a cambiar el resultado.** Antes de programar desde el 25/11, hay que arreglar la base y la medición.

## 6. Propuesta (para que decida la responsable)

**A. Arreglar la base (semana del 24/11), sin costo:**
- Revisar en el teléfono o con Chrome la bio, el enlace, el botón de WhatsApp, el estado de cuenta, que sean cuentas profesionales y que estén vinculadas a su página de Facebook. Hay un pedido listo para Claude en Chrome.
- Verificar las 4 landings en Search Console y Bing y enviar los sitemaps. Instalar GA4 y el píxel de Meta, y activar las estadísticas de Vercel en la cuenta donde están alojadas.
- Poner enlaces con etiquetas por red y pieza, y una referencia corta en el mensaje de WhatsApp para que el CRM registre el origen «redes» con la red y la pieza.

**B. Contenido desde el 25/11: menos y mejor**
- **Por marca:**
  - 1 reel por día en los días hábiles, con prioridad a la versión con música y sin voz de IA.
  - 3 carruseles tipo guía por semana.
  - 2 o 3 historias interactivas por día: encuestas, preguntas o «respondé con PALABRA».
- **Gancho:** escrito en pantalla en el primer segundo, con el tema adelante («Aguinaldo:», «Prepaga:», «0 km:»). Ninguna pieza se repite sin cambiar el gancho, la portada y el orden.
- **Cierre:**
  - Con «respondé o comentá PALABRA» en lugar de «el botón está en el perfil».
  - Probarlo primero en Kocos Marketing, respondiendo a mano. La automatización de mensajes, más adelante.
- **Lugares de actualidad:** dejar 1 o 2 por semana y por marca para la noticia del momento, con fuente. Por ejemplo:
  - Black Friday el 27/11.
  - El aguinaldo hasta el 18/12.
  - El aumento de prepagas de diciembre cuando se publique.
  - Las 27 prepagas dadas de baja.
  - Los patentamientos de noviembre.
- **Lo jurídico y lo de coberturas** sigue necesitando revisión profesional o la aprobación expresa de la responsable.

**C. Las 44 de Kocos del 25 al 29/11.** Son repeticiones a 10 por día en la cuenta con menos alcance. Recomendación: no publicarlas así. Conviene dejarlas como borrador o cambiarlas por el plan B. Lo decide la responsable.

**D. Audiencia inicial.** Con 0 seguidores, lo orgánico tarda. Una promoción chica en Facebook o Instagram de las 2 o 3 piezas que mejor rindieron, con destino a WhatsApp, aceleraría la medición. Es un gasto: queda solo como sugerencia.

**E. TikTok, después de A.** Una cuenta por marca, con las mejores piezas de Facebook reeditadas y sin marcas de agua. Metricool programa en TikTok. Hay que agregar los enlaces en las landings y en el CRM.

**F. SEO:**
- Páginas por temporada y por serie de redes:
  - Coberturas: aumento de diciembre y monotributo.
  - Autos: precios del mes y los 0 km más baratos.
  - VITA: trayecto y ART.
  - Marketing: casos de antes y después.
- **Despidos y laboral en VITA**, solo si el estudio confirma que atiende esos casos.
- **Penal**, que hoy no tiene páginas.

## 7. Pendientes que no se pudieron ver

- Bio, botón, destacadas, estado de cuenta y bandeja de mensajes en Instagram y Facebook. Pedido listo para Claude en Chrome, en el chat del 20/11.
- Tráfico real de las landings y búsquedas en Google: hace falta la medición o el acceso a la cuenta de Vercel donde están alojadas y a Search Console.
- Métricas de los reels de vidIQ y de cuentas de competencia: piden créditos.
