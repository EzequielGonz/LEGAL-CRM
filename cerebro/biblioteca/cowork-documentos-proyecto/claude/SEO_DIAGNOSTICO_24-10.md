# Diagnóstico SEO y Analytics de las landings (24/10/2026)

Fuente: Search Console y GA4 de las 4 propiedades, leídos con Windsor.ai (solo lectura). En esta sesión no había acceso a Chrome.

## Lo que muestran los datos
| Landing | Search Console (90 días) | GA4 (90 días) |
|---|---|---|
| estudiojuridicovita.com | 0 impresiones, 0 clics | 0 sesiones |
| comparatuobrasocial.com | 2 impresiones (home, posición media 14), 0 clics | 0 sesiones |
| autoskocos.com | 1 impresión (home, posición 74), 0 clics | 0 sesiones |
| kocosmkt.com | 2 impresiones (home, posición 1,5), 0 clics | 0 sesiones |

- Google tiene vista solo la home de 3 sitios. Las páginas internas (zonas, guías, modelos y obras sociales) todavía no aparecen. VITA no aparece en ninguna búsqueda.
- **GA4 no registra nada porque ninguna de las 4 landings tiene la etiqueta de Google Analytics.** Se revisó el código de los 4 repos en `main`: no hay `gtag` ni `googletagmanager`. Mientras falte, no se pueden medir visitas, origen ni conversiones.
- La parte técnica está bien: los 4 repos tienen `sitemap.xml`, `robots.txt`, datos estructurados (`schema.ts`), metadatos (`seo.ts`) y páginas de contenido por zona y tema.

## Prioridades (en orden)
1. **Cargar el sitemap y pedir indexación** en las 4 propiedades de Search Console (`/sitemap.xml`; inspeccionar la home y 5 a 10 páginas clave → «Solicitar indexación»). Sin esto Google tarda semanas en descubrir las páginas internas. Requiere Chrome con permiso para search.google.com o la API con una cuenta de servicio.
2. **Instalar GA4 en las 4 landings.** Hace falta el ID de medición (G-XXXXXXX) de cada propiedad: GA4 › Administrar › Flujos de datos › Web. No es secreto. Con eso se agrega el script en `root.tsx` de cada repo, más eventos de conversión: clic en WhatsApp, envío de formulario y clic en teléfono. Los repos de landings siguen sin permiso de escritura desde acá; se sube con el editor web de GitHub o con el permiso «Contents: Read and write».
3. **Perfil de Empresa de Google** para cada marca, con dirección o zona de servicio, horarios, fotos, enlace a la landing y reseñas. Para servicios locales en AMBA, es lo que más rápido trae consultas desde Google y Maps.
4. **Enlaces externos:** perfiles de IG y FB con el enlace a la web (ya figura en las descripciones de Metricool), directorios del rubro (colegio de abogados, guías de autos y salud) y enlaces cruzados entre las 4 landings donde tenga sentido.
5. **Contenido:** a medida que entren impresiones, sumar guías sobre las consultas que aparezcan en Search Console. No conviene publicar páginas masivas sin datos.

## Sobre la «posición global»
Los 4 servicios se venden en AMBA y Argentina. El objetivo realista y rentable es aparecer primero en búsquedas locales, por ejemplo «abogado accidente de tránsito CABA», «comparar prepagas AMBA», «0 km plan de ahorro» o «agencia de marketing WhatsApp». Posicionar a nivel mundial no trae clientes que se puedan atender. Marketing es la única marca con alcance nacional.
