# Post, carrusel e historias

Por marca y por día: 1 post, 1 carrusel y 2 historias. Cada pieza usa un tema distinto de los reels de ese día.

| Pieza | Formato | Cómo se hace |
|---|---|---|
| Post | 1 imagen 1080×1350 | Un cuadro del motor Atlas de la escena de la marca (`node render.js <id> prueba <t>`) con el gancho en la escena. También sirve el motor de carruseles con una sola lámina |
| Carrusel | 5 a 7 imágenes 1080×1350 | Motor de carruseles (`historias-prototipo/carrusel/`, `exportar.js`) con el estilo de cada marca. Lámina 1: gancho polémico. Láminas del medio: 1 idea por lámina. Última: «Escribinos por WhatsApp» |
| Historia | 1 imagen 1080×1920 (o video corto de un reel) | Cuadro del reel del día o lámina propia. Una de las dos con encuesta o pregunta en el texto. Cierre: «Escribinos por WhatsApp» |

- **Copy** del post y del carrusel: gancho, 2 o 3 líneas de valor, «Escribinos por WhatsApp.», «Situación ilustrativa.» si hay una escena y 3 a 5 hashtags de la marca.
- **Sin caras reales**, sin fotos de stock con tipografía encima y sin imágenes hechas con IA (el dueño las rechazó): todo sale de los motores propios.
- Los archivos van con los reels: `apps/web/public/redes/<ddmm>/<marca>-<ddmm>-post.jpg`, `-carrusel-1.jpg` … y `-historia-1.jpg`.
