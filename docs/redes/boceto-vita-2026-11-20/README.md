# Boceto VITA · 20/11 · reel de mini historia + carrusel guía

Para aprobar. Nada de esto está publicado ni programado.

## Reel «Antes de firmar» (31 s, 1080 × 1920, 30 fps)

- **Archivos:** `reel-antes-de-firmar.mp4` (con voz) y `reel-antes-de-firmar-sinvoz.mp4` (para sumar el audio en tendencia desde la app). Portada: `carrusel/portada-reel.png`.
- **Ficha:** destinatario, alguien a quien chocaron y el seguro del otro le ofrece un acuerdo · objetivo, que mire hasta el final y comente · mensaje, antes de firmar, esperá · apoyo, tres cosas para revisar · acción, «Comentá FIRMA».
- **Historia:** Nico, trabajador de barrio, en una esquina de noche con el auto chocado (segundo 0: golpe, flash y vibración del celular). Le llega «Te ofrecemos un acuerdo, necesitamos tu firma hoy». Pasa por la oficina de la aseguradora y el sello «ESPERÁ» cae sobre la propuesta. Sigue en su living con el Obelisco en la ventana y el calendario que pasa de HOY a MAÑANA, camina por una avenida con el colectivo 152 hasta VITA y cierra con «Menos mal que no firmé».
- **Sonido:** ambiente por escena, golpe, sello, colectivo, papel, música de marca que baja con la voz. Mezcla a −14,6 LUFS.
- **Voz:** sintética (edge-tts es-AR, Elena y Tomás). En Metricool va `isAiGenerated: true`. El rótulo «Voz generada con IA» está en el cierre.
- **Rótulos:** «Situación ilustrativa» todo el reel; «Información general: no reemplaza una consulta» en el cierre.

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
> Situación ilustrativa. Información general: no reemplaza una consulta.
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
