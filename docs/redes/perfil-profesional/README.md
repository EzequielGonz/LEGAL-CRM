# Perfil profesional de las 4 marcas · guía (20/11/2026)

La responsable pidió (20/11) dejar el perfil y el feed de las 4 marcas muy profesionales, con destacadas que armen un recorrido. Este kit está **preparado, no publicado**: no se cambió nada en Instagram, Facebook ni Metricool.

| Marca | Carpeta | Destacadas | Historias | Portadas de reels |
|---|---|---|---|---|
| VITA Abogados | [`vita/`](vita/README.md) | Empezá acá · Choques · ART · El proceso · Mitos · Contacto | 15 | plantilla + 9 |
| Compara tu Obra Social | [`coberturas/`](coberturas/README.md) | Empezá acá · Comparar · Aportes · El proceso · Mitos · Contacto | 15 | plantilla + 9 |
| Automotores Kocos | [`autos/`](autos/README.md) | Empezá acá · Cómo pagar · Tu usado · Precio final · El retiro · Contacto | 14 | plantilla + 9 |
| Kocos Marketing | [`kocos/`](kocos/README.md) | Empezá acá · Servicios · El proceso · Antes/después · Arreglos · Contacto | 13 | plantilla + 9 |

Cada carpeta tiene su `README.md` con la bio (2 variantes), el nombre que se busca, la categoría, los textos de Facebook, los enlaces con UTM, la lista de destacadas con sus textos y la `perfil-maqueta.png` (cómo quedaría el perfil completo).

## Diseño

- Paleta, tipografías y logos de `.claude/referencias/redes/marcas.md`. Logos originales, sin deformar ni recolorear.
- Portadas de destacadas: ícono de línea propio, centrado dentro de un anillo, en el centro de una imagen de 1080 × 1920. Se ve bien en el círculo chico del perfil (revisado en la maqueta a tamaño de teléfono).
- Historias: una idea por pantalla, logo arriba a la izquierda, título grande y apoyo corto. Respetan las zonas libres de Instagram (250 px arriba y 300 px abajo). Sin etiquetas en mayúsculas sobre el título, sin textos en las esquinas, sin personas, sin emojis.
- Portadas de reels: título dentro del recorte 3:4 de la grilla y alternancia oscura / clara para que la grilla quede en damero.
- Revisión hecha: `revisar-piezas.mjs` sin avisos en las 141 imágenes y hojas a tamaño de teléfono. No se vio en un teléfono real ni la interfaz real de Instagram.

## Pasos para la responsable en el teléfono

Instagram solo deja crear y editar destacadas desde la app.

1. **Pasar las imágenes al teléfono:** las carpetas `destacadas/` de cada marca (sin los archivos `-guia`, que son solo de referencia).
2. **Publicar las historias de una destacada,** en orden (historia-1, historia-2…). En las que tienen versión `-guia`, agregar el sticker de **enlace** sobre el espacio que marca la guía, con el enlace con UTM o el de WhatsApp del `README.md` de la marca.
3. **Crear la destacada:** en el perfil, «Nuevo» (el círculo con +) → elegir esas historias → poner el nombre del `README.md`.
4. **Portada:** «Editar destacada» → «Editar portada» → ícono de galería → elegir `NN-<nombre>-portada.png` y centrar el círculo en el anillo.
5. Repetir con las 6 destacadas, en el orden de la tabla: Instagram muestra primero la última editada, así que conviene cargar de la última (Contacto) a la primera (Empezá acá), o reordenarlas después.
6. **Bio, nombre y categoría:** «Editar perfil». Pegar la variante elegida y el enlace con UTM en «Enlaces».
7. **Botón de WhatsApp en Instagram:** «Editar perfil» → «Opciones de contacto» (en algunas versiones, «Botones de acción» o «Agregar WhatsApp» dentro de «Enlaces») → WhatsApp → número de la marca. Si pide verificación, llega un código a ese WhatsApp.
8. **Portadas de reels nuevas:** al subir un reel, «Editar portada» → «Agregar desde la galería» → la portada de `portadas-reels/`.

## Botón de WhatsApp en Facebook (no existe hoy en ninguna de las 4 páginas)

Desde Meta Business Suite, para cada página:

1. business.facebook.com → elegir la página en el selector de arriba.
2. Ir a la página de Facebook → «Editar» en el botón de acción (debajo de la portada; si no hay botón, «Agregar botón»).
3. Elegir **«Enviar mensaje de WhatsApp»** (o «WhatsApp») → país Argentina → número de la marca.
4. Facebook manda un código de verificación a ese WhatsApp. Lo tiene que leer quien tenga el teléfono de esa línea.
5. Guardar y ver la página como visitante para confirmar que el botón aparece.

## Qué puede hacer Claude in Chrome (con la sesión de Meta iniciada en tu Chrome)

- Cargar el botón de WhatsApp de las 4 páginas (con el código de verificación que le dictes).
- Editar los datos de cada página de Facebook: presentación, descripción, categoría y sitio web con UTM.
- Programar las historias de las destacadas desde Business Suite, si autorizás publicarlas. Las destacadas en sí se arman después en la app.
- No puede: crear destacadas de Instagram ni cambiar sus portadas (solo desde la app), ni verificar números sin el código.

### Pedido listo para pegar en el chat con Claude in Chrome

```text
Usá mi Chrome, donde tengo la sesión iniciada en Meta Business Suite. Tarea: cargar el botón de WhatsApp en las 4 páginas de Facebook. No publiques nada, no cambies otras configuraciones y no mandes mensajes.
Páginas y número de cada una (el de su landing):
1) VITA Abogados (Estudio Jurídico VITA) → WhatsApp de VITA
2) Compara tu Obra Social → WhatsApp de Coberturas
3) Automotores Kocos → WhatsApp de Autos
4) Kocos Marketing → WhatsApp de Kocos Marketing
Te paso los números en el chat solo para esta tarea; no los copies en ningún documento.
Para cada página: business.facebook.com → elegí la página → andá a la página → botón de acción (Editar o Agregar botón) → «Enviar mensaje de WhatsApp» → Argentina → número. Cuando Facebook pida el código de verificación, pará y pedímelo; yo te lo dicto. Guardá y abrí la página como visitante para confirmar que el botón aparece.
Al final, decime por página: si quedó el botón, a qué número apunta (solo los últimos 4 dígitos) y si algo no se pudo hacer y por qué.
```

## Decisiones pendientes de la responsable

1. Qué variante de bio y de texto de Facebook usa cada marca (A o B).
2. Si las historias de las destacadas se publican (en Instagram, publicar una historia la muestra 24 horas a quien la siga). Con 0 a 2 seguidores, el impacto es mínimo.
3. Revisión profesional de los textos jurídicos y de coberturas (o aprobación expresa).
4. Nombre de la marca de autos: «Automotores Kocos» o «Agencia Kocos».
5. Si se suman destacadas propias de laboral y de penal en VITA cuando haya piezas revisadas.

## Herramientas

`herramientas/` tiene el contenido (`datos.py`), el generador de las piezas y la maqueta (`generar.py`), el de los README (`readmes.py`) y la hoja de contactos (`hoja.py`). Para regenerar, hacen falta las fuentes de las landings (`apps/web/public/fonts/*.woff2`) y los logos de `.claude/referencias/redes/logos/` en una carpeta de trabajo; se exporta con `.claude/referencias/redes/herramientas/revisar-piezas.mjs <pagina.html> <salida> 1` y se optimiza con `pngquant`.
