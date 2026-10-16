---
name: kocos-landings-seo-y-conversion
description: Landings de los cuatro perfiles, su entrada al CRM y el SEO automático - inventario y conexión de propiedad, eventos de clic, formulario, oportunidad y aceptación, fuente, auditoría y mejoras ejecutadas dentro de una política habilitada, pedidos en lenguaje natural desde el panel, Search Console por API, rendimiento y medición sin datos del lead. Usar al auditar, crear o cambiar una landing, su formulario, su SEO, su medición o el servicio de mejoras automáticas.
---

# Landings, SEO automático y conversión

Cubre el procedimiento «crm-seo-automation» (parche 2.0, sección 25.5) y las secciones 15 y 16. Las reglas generales están en `.claude/referencias/reglas-comunes.md` (sección 10). El operador no administra SEO: ve resultados, consultas, captaciones, conversiones y costos cuando hay datos, y pide mejoras con lenguaje natural; el sistema ejecuta lo rutinario dentro del alcance autorizado, presenta lo hecho y conserva reversión.

## Antes de tocar una landing: inventario y acceso

Por cada landing: perfil, dominio y URL canónica, plataforma y framework, repositorio y rama, quién publica y cómo, formularios y destino, botones de WhatsApp y su línea, medición instalada, indexabilidad y responsable. El acceso al proyecto y al repositorio correctos se pide por una vía segura ya disponible (sesión autorizada, integración del repositorio, CLI o API), nunca con secretos pegados en el chat y sin incorporar el complemento de Vercel. Mientras falten URLs o conexiones de Coberturas, Autos y Marketing, se avanza en lo independiente y se deja preparada la configuración. En este repositorio solo existe `/landing` (Jurídico), con `noindex` heredado del panel.

## Entrada al CRM (bloques 1.15 y 2.8)

Clic, formulario enviado, oportunidad creada y aceptación son eventos distintos; ninguno es Captado por sí solo. Identificador de solicitud para no duplicar; primera fuente conservada; la fuente sale de evidencia validada en el servidor, si no «No informada». Formulario con lo mínimo, validación en el servidor, límite por origen y sin promesas. Un formulario no verificado no habilita seguimiento.

## Política de publicación (cambio expreso del parche 2.0)

- Se define **una vez por perfil**: páginas y alcance autorizados, tipos de cambio rutinario (títulos, descripciones, encabezados, enlaces internos, imágenes, correcciones técnicas, variantes de contenido sobre hechos aprobados), frecuencia y catálogo de hechos autorizados.
- Dentro de esa política, las mejoras válidas **se publican automáticamente**, con versión anterior guardada, motivo y prueba posterior. No se pide aprobación individual por cada metadato.
- Se **retienen con motivo**: afirmaciones nuevas sensibles (jurídicas, médicas, comerciales) o sin evidencia, cambios de marca, servicio, dominio, precio, disponibilidad, privacidad o estructura de captación, y conflictos de marca. El resto sigue publicándose.
- Prohibido: páginas repetidas por localidad, reseñas o profesionales inventados, datos estructurados que no coinciden con lo visible, posiciones o plazos garantizados, Indexing API para landings comunes.

## Circuito automático

1. Inventariar y validar propiedad y conexión de cada landing.
2. Auditar accesibilidad, enlaces, códigos de respuesta, metadatos, encabezados, imágenes, duplicados e indexabilidad; priorizar lo que impide consultar y las páginas con demanda real.
3. Convertir un pedido del panel («quiero más consultas de accidentes laborales desde esta landing») en una tarea con perfil, página, alcance, hipótesis y resultado esperado.
4. Preparar el cambio, validar contenido, técnica, enlaces y formulario, publicar según la política, registrar versión y medir período y conjunto adecuados.
5. Operación propuesta: comprobación técnica diaria y revisión de oportunidades semanal, con cuotas y deduplicación; sin experimentos simultáneos que se tapen entre sí.

## Search Console por API (integración preparada, no reemplazada por exportaciones)

- Conexión con la API oficial de Search Console mediante autorización OAuth de una cuenta con acceso a la propiedad correcta (flujo oficial, secretos en el servidor, permisos de solo lectura `webmasters.readonly`), con registro de propiedad, permisos, caducidad y última comprobación, y desconexión por perfil.
- Datos que se usan: consultas, impresiones, clics, páginas y sitemaps por propiedad y período; inspección de URL como estado, no como orden de indexación.
- Hasta que una persona autorice la propiedad, el módulo queda listo y muestra qué resultado está pendiente; una exportación manual sirve solo como comprobación puntual, no como operación habitual.

## Rendimiento y medición

Medir antes de optimizar, la misma página antes y después. Objetivos de campo en el percentil 75: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1; las pruebas de laboratorio diagnostican. La analítica nunca recibe nombre, teléfono, consulta ni datos del caso. Mostrar consultas recibidas, captados, derivados y resultados confirmados por separado; CPR y CPL solo con el resultado definido y la inversión atribuible; sin inversión conectada, «Sin costo informado»; orgánico sin costo cero ni ROAS. Al abrir una métrica de búsqueda se muestran páginas y consultas agregadas, nunca visitantes identificados.

## Landings con conversión de calidad (sección 16)

Propuesta principal clara, proceso explicado, CTA, formulario mínimo, preguntas frecuentes y evidencia real; imágenes con derecho de uso; móvil, teclado, errores y carga lenta probados. Jurídico: revisión y contacto profesional sin indemnizaciones aseguradas; Coberturas: comparar con un asesor sin planes no autorizados; Autos: interés y preferencias sin stock ni financiación garantizados; Marketing: servicios y análisis sin precios ni plazos no aprobados. Experimentos con hipótesis, una variable y métrica de consulta o captación, sin urgencia falsa ni datos personales.

## Skills de terceros que ayudan (ver `PROCEDENCIA.md`)

`seo-audit`, `ai-seo`, `schema` (solo con información real y visible), `site-architecture`, `cro`, `frontend-design`. Si alguna recomienda reseñas, urgencia falsa, precios o páginas por localidad, no se aplica.

## Entrega

Inventario actualizado; antes y después sin datos personales; prueba del evento de entrada con datos inventados (V09); auditoría repetible (V13); casos A04, A27 y A28; publicación solo dentro de la política habilitada o con autorización expresa.
