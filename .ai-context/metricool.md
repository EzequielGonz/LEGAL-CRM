## Metricool: publicaciones orgánicas de las 4 marcas — traspaso (20/11/2026)

**Cuentas (Metricool, brandId → Instagram):**
- 7549864 VITA → @estudiojuridicovita (Jurídico)
- 7549939 Compara Tu Obra Social → @comparatuobrasocial (Coberturas)
- 7552104 Automotores Kocos → @autoskocos (Agencia 0 km)
- 7242607 Kocos Marketing → @kocosmkt (Marketing)
- Las cuatro publican también en su Facebook.
- La zona horaria de las marcas figura Europe/Madrid; se programa con America/Argentina/Buenos_Aires.

**Decisiones:**
- **Primera tanda (creada del 21 al 25/10, salió hasta el 05/11):** traía 2 «reels de prueba» (TRIAL_REEL) por día solo en Instagram.
  - En Kocos fallaron los 22 porque la cuenta no cumple el mínimo de seguidores. No se repiten: cada uno era copia de un reel ya publicado.
  - No se revisó si pasó lo mismo en las otras tres marcas.
- **Del 06 al 09/11 no hubo publicaciones** (hueco entre tandas).
- **Tanda principal: 600 publicaciones del 10 al 24/11** (pedido del 09/11), 150 por marca:

  | Formato | Por día y marca | Horarios (Buenos Aires) |
  |---|---|---|
  | Reels | 5 | 8:30, 11:00, 13:30, 17:00, 20:30 |
  | Posts | 2 | 10:00, 19:00 |
  | Carrusel | 1 | 12:30 |
  | Historias | 2 | 9:30, 18:30 |

  - Reglas: ninguna pieza sale más de 2 veces y nunca antes de 7 días (una sola excepción: Coberturas, 21/11 a las 19:00, a los 6 días y 9 horas).
  - Los reels con voz llevan la marca de contenido con IA.
  - Cada texto cierra con «el botón está en el perfil» y una palabra clave. Las palabras clave se sumaron al final del rol del bot de cada rubro, sin tocar lo anterior.
  - Lo aprendido del análisis de competencia se aplicó desde el 17/11.
  - Los archivos están alojados en `public/redes/` de cada landing.
  - Plan: `docs/redes/plan-2026-11-10.json`. Estado: `docs/redes/ESTADO-2026-11-09.md`.
- **Textos de VITA y Coberturas:** la responsable los aprobó el 10/11, sin revisión profesional.
- **10/11, VITA en Instagram:** quedó «restringida». La responsable la destrabó y las 2 publicaciones fallidas se reprogramaron solo para Instagram ese mismo día, a las 14:30 y a las 15:00.
- **13/11 a las 19:00, Kocos en Instagram:** se desconectó de Metricool. Fallaron 44 publicaciones en Instagram (Facebook sí salió).
  - El 18/11 se reprogramaron solo para Instagram, con el mismo texto, archivo y hora, del 25 al 29/11 (10, 10, 10, 10 y 4). Las 44 quedaron pendientes.
  - Lista: `scratchpad/metricool_fallidas.json` y `plan_reprogramar.json`, en la carpeta temporal de la sesión, que puede borrarse.
  - La responsable reconectó Instagram el 18/11.

**Alternativas descartadas:**
- **Audio en tendencia de Instagram:** no se puede poner por la API. La versión «tendencia» sale con música y efectos propios.
- **Reprogramar los 22 reels de prueba:** Instagram los rechaza en Kocos y además eran duplicados.
- **Reprogramar las 44 de Kocos del 18 al 24/11:** esos días ya tenían 10 publicaciones por día, por eso se pasaron al 25–29/11.

**Pendiente o sin resolver:**
- **Confirmar que Kocos publica de nuevo en Instagram:** revisar el estado de las publicaciones desde el 18/11 a las 8:30. No se verificó.
- **No se revisaron fallas de las otras 3 marcas** después del 10/11. Conviene listar las que tengan estado ERROR en VITA, Coberturas y Autos.
- **Calendario del 25/11 en adelante:** después del 24/11 no hay nada programado, salvo las 44 de Kocos en Instagram. Se había decidido no programar más hasta tener el informe de rendimiento.
- **Informe de rendimiento por marca:** tarea programada para el 20/11 a las 10:00 (`trig_018N1mFkkgyxyFcaZuaAkkYG`). Con ese informe se definen volumen y temas.
- **Zona horaria en Metricool:** pasarla a Buenos Aires (es solo para ver el calendario; las publicaciones ya salen bien).
- **Botón de WhatsApp en los 4 perfiles de Instagram y Facebook:** los textos remiten a él y no se confirmó que esté.

**Convenciones:**
- Nada se publica ni se programa sin autorización de la responsable o un pedido explícito.
- Antes de programar o reintentar, consultar `getScheduledPosts` para no duplicar.
- Reprogramar solo la red que falló.
- Las afirmaciones jurídicas y de coberturas necesitan revisión profesional, salvo aprobación expresa de la responsable.
- Textos en español rioplatense, con voseo.
