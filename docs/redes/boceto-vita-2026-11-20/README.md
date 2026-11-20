# Boceto VITA · 20/11 · reel de mini historia + carrusel guía

Para aprobar. Nada de esto está publicado ni programado.

## Reel «Antes de firmar» v3 (31 s, 1080 × 1920, 30 fps con desenfoque de movimiento)

- **Archivos:** `reel-antes-de-firmar.mp4` (versión A) y `reel-antes-de-firmar-B.mp4` (versión B: otro gancho, «Plata rápida. ¿La agarrás?», otra primera frase, apertura con un adelanto de la caída y paleta más cálida; sale a 5 días o más de la A). La versión sin voz, para sumar el audio en tendencia desde la app, se genera con la publicación. Portada: `carrusel/portada-reel.png`, sobre el plano del contrato gigante.
- **Ficha:** destinatario, alguien a quien chocaron y el seguro del otro le ofrece un acuerdo · objetivo, que mire hasta el final y comente · mensaje, antes de firmar, esperá · apoyo, tres cosas para revisar · acción, «Comentá FIRMA».
- **Historia:** Nico, trabajador de barrio, de noche en una esquina con el auto chocado. Arranca con golpe, flash, temblor y líneas de velocidad en el segundo 0. Le llega «Te ofrecemos un acuerdo, necesitamos tu firma hoy» y pasa por la oficina de la aseguradora.
- **Giro irreal:** Nico aparece diminuto sobre la propuesta gigante y una lapicera enorme cae del cielo y se clava al lado. El sello «ESPERÁ» cae con onda expansiva. El papel se abre y Nico cae entre renglones y hojas («Lo que firmás puede cerrar tu reclamo»), hasta aterrizar de golpe en el sillón de su living, con el Obelisco en la ventana.
- **Cierre:** el calendario pasa de HOY a MAÑANA, Nico camina por una avenida con el colectivo 152 hasta VITA y dice «Menos mal que no firmé».
- **Ritmo:** cortes rápidos con barrido o golpe de zoom entre todos los planos.
- **Marca:** «VITA Abogados» con el logo arriba todo el reel, y el logo con el nombre en el cierre.
- **Personajes:** más definidos que en el prototipo: contorno, ojos con blanco y pupila, párpados, sombras y luz de borde.
- **Resolución:** este archivo es la vista previa en 1080 × 1920. La versión 4K Ultra HD (2160 × 3840) se está renderizando y se suma al terminar.
- **Sonido:** ambiente por escena, golpe, sello, colectivo, papel, música de marca que baja con la voz. Mezcla a −14,6 LUFS.
- **Voz:** sintética (edge-tts es-AR, Elena y Tomás). En Metricool va `isAiGenerated: true`. El rótulo «Voz generada con IA» está en el cierre.
- **Realce v3:** grado de color de cine, bokeh fuera de foco, haces de luz con polvo en suspensión, golpe de zoom en cada palabra clave, brillo que recorre «FIRMA» y desenfoque de movimiento real (render a 60 cps mezclado a 30).
- **Sin carteles en pantalla** (decisión de la responsable del 20/11). «Situación ilustrativa», «Información general: no reemplaza una consulta» y «Voz generada con IA» van en el texto de la publicación, y la marca de IA va en Metricool (`isAiGenerated`).
- **Motor compartido:** los efectos están en `historia/obra.js`, `historia/realce.js` y `historia/personaje.js`, así que valen para las 4 marcas.

**Texto de la publicación:**

> ¿Te chocaron y el seguro del otro te ofrece un acuerdo rápido? Antes de firmar, esperá.
>
> Lo que firmás puede cerrar tu reclamo. Antes de firmar, tres cosas:
> 1. Pedí la propuesta por escrito.
> 2. No firmes el mismo día.
> 3. Consultá antes con un abogado.
>
> Comentá «FIRMA» y te respondemos.
>
> Situación ilustrativa. Información general: no reemplaza una consulta. Voz generada con IA.
>
> #accidentedetransito #seguros #abogados #buenosaires #CABA

## Carrusel guía «Antes de firmar el acuerdo del seguro» (7 láminas, 1080 × 1350)

1. Portada: el título y la propuesta con el sello «ESPERÁ».
2. La situación: escena del reel.
3. El riesgo.
4. Paso 1.
5. Paso 2.
6. Paso 3, con la escena del reel.
7. Resumen para guardar y «Comentá FIRMA».

La lámina 3 usa el plano de la caída del reel. Todas las láminas llevan el logo con «VITA Abogados».

**Qué cambia respecto del estilo anterior:**

- El personaje y las escenas del reel aparecen en las láminas: el carrusel y el reel se reconocen como una misma serie.
- Un hilo dorado une las láminas al deslizar.
- Cada paso tiene su objeto ilustrado.
- La última lámina es una lista para guardar.
- Se mantiene la estética del feed aprobado: azul noche y crema, Playfair Display y Manrope, dorado.

**Texto de la publicación:**

> Antes de firmar el acuerdo del seguro, guardá esto.
>
> Lo que firmás puede cerrar tu reclamo: si después aparece una lesión, quizás ya no puedas pedir más.
>
> Comentá «FIRMA» y te respondemos.
>
> Situación ilustrativa. Información general: no reemplaza una consulta.
>
> #accidentedetransito #seguros #abogados #buenosaires

## Estado

| | |
|---|---|
| Especificado | sí |
| Implementado | sí. Código en `.claude/referencias/redes/herramientas/historias-prototipo/` (`historias/vita.js` y `carrusel/vita-guia.html`). |
| Probado | Revisado fotograma por fotograma (cada 0,5 s) y a tamaño de teléfono. `revisar-piezas.mjs` no marca desbordes ni textos cortados; los avisos que quedan son intencionales (el rótulo sobre la foto, el hilo que sale del borde). |
| Publicado / habilitado | no |

- **No se pudo verificar:** el color en una pantalla real, la escucha con auriculares y cómo queda dentro de la interfaz real de Instagram.
- **Afirmaciones:** son las ya escritas en `guiones.py`. Siguen pendientes de revisión profesional o de tu aprobación expresa.
