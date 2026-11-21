# 2026-10-21-claude-redes-reels-crm

Documento del 21 de noviembre de 2026. Autora del pedido: Vita.

## 1. Encabezado

| Dato | Detalle |
| --- | --- |
| Título del chat | (no confirmado) el chat no tiene título visible; tema: redes sociales y reels de los 4 rubros del CRM multirubro |
| Inicio | 2026-10-21 (primeros archivos de entrega con fecha 21/10; carpeta de sesión creada ese día) |
| Fin | 2026-10-24 (último intercambio sobre reels, 23:14 hora del servidor). Este pedido de documentación es del 2026-11-21 |
| Proyecto | «crm» (Project de Claude), repo LEGAL-CRM |
| Marcas / perfiles | VITA Abogados (tránsito y laboral), Compara tu Obra Social (coberturas médicas), Automotores Kocos (0 km), Kocos Marketing (agencia). En Metricool: Instagram y Facebook de cada una |
| Modelo | Durante la parte documentada se pasó de Haiku 5.5 a Sonnet 5.5 (cambio hecho por la usuaria con /model el 2026-11-21) |

Nota: la parte anterior al resumen automático (21 al 24/10) solo se conserva en el resumen y en los documentos del Project; lo que no se pudo confirmar va marcado «(no confirmado)».

## 2. Objetivo

Vita pidió organizar y sumar contenido de redes para los 4 rubros del CRM multirubro, y en el tramo final de este chat, armar reels cortos con gancho para esos rubros.

- **Para qué:** que cada perfil gane seguidores que puedan ser clientes y que escriban por WhatsApp, donde responde el agente del CRM. Se mide por mensajes que llegan, no por «me gusta» (Estrategia de redes 15 días).
- **Tramo del 24/10:** ver un boceto de reel, luego un video real por rubro (0 km, estudio jurídico, marketing y coberturas médicas), y por último que Claude use los logos y la paleta de cada marca que ya existen en el proyecto.
- **Hoy (21/11):** dejar por escrito todo lo ocurrido, sin ejecutar nada más.

## 3. Órdenes y decisiones

### Textuales (visibles en este chat)

| Fecha | Orden o decisión |
| --- | --- |
| 2026-10-24 | «a ver, armame un boceto, un reel corto, que pegue que tenga gancho y esas cosas» |
| 2026-10-24 | «pero hace vos el video, haceme un boceto de cada rubro» |
| 2026-10-24 | «no tengo nada, fijate vos, mostrame un video de los 4 rubros, 0km, estudio juridico, marketing y coberturas medicas» |
| 2026-10-24 | «pero si ya tenes logos, paleta de colores, todo, pasame contexto de este chat porfa» |
| 2026-10-24 | Sin texto: envió una imagen con 6 láminas del carrusel de Automotores Kocos (0 km) como referencia de estilo (a continuación del pedido anterior) |
| 2026-11-21 | «Solo documentá, no ejecutes nada más: nada de envíos, publicaciones, programaciones, commits ni cambios de configuración.» |

### Del tramo anterior al resumen (no hay texto literal en este chat; resumen de lo registrado)

Estas líneas salen de los documentos del Project y de lo que quedó registrado de Vita; no son citas textuales.

| Fecha | Orden o decisión (resumen) | Fuente |
| --- | --- | --- |
| 2026-10-21 | Trabajar el CRM tarea por tarea; publicar a producción cada tarea cerrada, sin lanzar campañas, envíos ni gastos | memoria del Project |
| 2026-10-24 | Alcance orgánico por rubro y por día: 2 de feed + 5 historias, carrusel lunes y jueves, lunes a sábado, por 15 días «reemplaza a» 1 posteo + 1 historia por día | memoria del Project |
| 2026-10-24 | Por ahora sin videos ni reels en redes (solo posteos, historias y carruseles). Reemplazada después por el pedido de reels (ver abajo) | memoria del Project y resumen del chat |
| 2026-10-24 | «Pedido de Vita: sumar reels a los 4 rubros, 2 nuevos por día por rubro + 2 repeticiones en días distintos (4 por día), hasta donde hay publicaciones programadas (5/11)» «reemplaza a» el «sin videos» | REELS_ESTRATEGIA_24-10.md (redactado por Claude) |
| 2026-10-24 | Claude define los CTA de landings y redes, uno por rubro y canal, para identificar el origen de cada lead | memoria del Project |
| 2026-10-20 | La publicación en Instagram y Facebook la hace Claude directamente vía Metricool, no el panel | memoria del Project |
| 2026-10-15 | Acceso total sobre el proyecto sin pedir confirmación por acción; única restricción: autorización antes de cualquier pago. Regla fija: nunca iniciar campañas ni contactar prospectos sin autorización expresa | memoria del Project |
| 2026-10-24 | Sin ZIP, resúmenes ni archivos de entrega: que Claude implemente directo | memoria del Project (fecha no confirmada) |

Nota: Claude propuso mantener lo anterior como «pendiente de confirmación» antes de programar reels; el pedido de confirmación quedó sin respuesta textual visible en este chat.

## 4. Correcciones

| Qué no le gustó | Qué quería en su lugar |
| --- | --- |
| Recibió un boceto en texto del reel | Que Claude haga el video, no solo el boceto: «pero hace vos el video» |
| Un solo boceto de un rubro (hotel) | Un boceto por rubro |
| Claude le pidió fotos, clips y confirmaciones | «no tengo nada, fijate vos»: que Claude decida y resuelva con lo que hay |
| Claude dijo que no tenía logos ni paleta de las otras tres marcas | «pero si ya tenes logos, paleta de colores, todo»: esos datos ya existen en el proyecto (`src/lib/marca.ts` y los logos del repo, según REELS_ESTRATEGIA_24-10.md) y había que buscarlos ahí en vez de preguntar |
| Los 4 videos de prueba eran texto sobre fondo de color genérico | Que usen el estilo de las láminas de cada marca: la imagen de referencia mostraba fondo azul marino, títulos en mayúsculas gruesas, números con contorno 01/02/03 e indicador de progreso |
| Claude eligió rubros de la memoria de proyectos viejos (hotel, etc.) | Los 4 rubros del CRM: 0 km, estudio jurídico, marketing y coberturas médicas |

## 5. Qué se hizo, con estado

Estados: especificado, implementado, probado, publicado, habilitado. Solo se marca lo que tiene evidencia.

| Qué | Estado | Evidencia |
| --- | --- | --- |
| Estrategia de redes de 15 días para los 4 rubros (120 publicaciones: 1 posteo + 1 historia por día por rubro) | Especificado y programado en Metricool | `estrategia-redes-15-dias.md` del 21/10; el «Plan aprobado» figura en el resumen del chat |
| Ampliación de redes del 26/10 al 5/11: 2 de feed + 5 historias por marca y día (PR #68) | Cerrado, 304 publicaciones en Metricool | CONTEXTO_ACTUAL_CRM.md (actualizado el 01/11); no verificado de nuevo hoy |
| Hojas de muestras de carruseles (0 km, coberturas, jurídico, marketing) y portadas de destacadas | Implementado y entregado en el chat | 4 PNG y `muestras-redes.png` del 21/10 |
| Boceto en texto de un reel (hotel) | Especificado, descartado por Vita | Chat del 24/10 23:06 |
| Bocetos de 5 rubros en texto (hotel, 0 km, jurídico, prepagas, marketing) | Especificado, reemplazado | Chat del 24/10 23:07 |
| 4 MP4 de prueba de 19 s (0 km, jurídico, marketing, coberturas), 1080x1920, 30 fps, texto animado sobre color, sin música ni voz | Implementado y probado (duración 19 s verificada con ffprobe); no publicado | Chat del 24/10 23:12; entregados con SendUserFile |
| Rehacer esos 4 videos con el estilo de las láminas de cada marca | Especificado, no implementado | Claude pidió confirmar nombres de marca y logos; sin respuesta en este chat |
| Producción de 96 reels únicos (24 por rubro), ~15 s, paleta de `marca.ts`, base musical propia | Implementado (según documento del Project); revisión visual por parte de Vita no confirmada | REELS_ESTRATEGIA_24-10.md, creado el 24/10 23:41 |
| Alojamiento de los reels en Vercel Blob `reels-redes` (~323 MB de 1 GB) | Implementado según documento del Project | REELS_ESTRATEGIA_24-10.md |
| Programación en Metricool de 184 reels (46 por rubro): 13:30 y 20:30 en Instagram y Facebook, y repetición como Trial Reel a las 10:00 y 17:00 desde el 26/10 | **Programado: 184/184**, cada alta con id y estado PENDING; **publicado: no confirmado** (primera salida prevista 25/10 13:30) | REELS_ESTRATEGIA_24-10.md; esa parte no figura en el registro de este chat (que termina el 24/10 23:14), por lo que no se pudo contrastar |
| Este documento | Implementado | Doc de Claude Docs; no se ejecutó ninguna otra acción |

## 6. Lo concreto: archivos, documentos y artefactos

### Archivos entregados en el chat

| Archivo | Fecha | Qué es |
| --- | --- | --- |
| `entrega-landings-2110.zip` | 2026-10-21 | Entrega de landings (a verificar contenido; no se leyó hoy) |
| `muestras-redes.png` | 2026-10-21 | Muestras de piezas de redes |
| `hoja-agencia_0km.png`, `hoja-coberturas_medicas.png`, `hoja-juridico.png`, `hoja-marketing.png` | 2026-10-21 | Hoja de carrusel por rubro (la de 0 km: 6 láminas, fondo azul marino, marca Automotores Kocos) |
| `estrategia-redes-15-dias.md` | 2026-10-21 | Estrategia de redes y calendario de 15 días por rubro |
| `reel_0km.mp4` (file_uuid ce03f878-9dae-4acf-8e79-a07adc7c79b4) | 2026-10-24 | Reel de prueba, 19 s |
| `reel_estudio_juridico.mp4` (8f6ae8da-d90e-4895-8224-87ded4c7063a) | 2026-10-24 | Reel de prueba, 19 s |
| `reel_marketing.mp4` (e01f922b-25a7-481a-ab0b-591e0c658104) | 2026-10-24 | Reel de prueba, 19 s |
| `reel_coberturas.mp4` (038da66c-f4db-4933-a3aa-dd5094a59736) | 2026-10-24 | Reel de prueba, 19 s |
| `calendario_reels.csv` | 2026-10-24 | Textos y horarios de los reels programados (citado por el doc del Project; no está en este espacio de trabajo) |

Generador de los 4 reels de prueba: script `make.py` en la carpeta de trabajo de la sesión (Pillow para cuadros + ffmpeg para el MP4).

### Documentos del Project «crm» relacionados

- `claude/REDES_ESTRATEGIA_15_DIAS.md` (21/10)
- `claude/REELS_ESTRATEGIA_24-10.md` (24/10 23:41)
- `claude/CONTEXTO_ACTUAL_CRM.md` (actualizado el 01/11)
- `claude/PUNTO_DE_CONTROL.md` (17/10)

### Metricool y alojamiento

- Programación de reels: 184 altas con estado PENDING. Los ids individuales de Metricool no están en este chat (quedaron en `calendario_reels.csv` y en la respuesta de cada alta). (no confirmado)
- Ampliación de redes 26/10 al 5/11: 304 publicaciones (CONTEXTO_ACTUAL_CRM.md).
- Vercel Blob: store `store_VSQc3OOWUqT7ZEBj`, nombre `reels-redes`, público, región gru1, plan Hobby. Videos en `descargas/reels_todos/reels/<rubro>_NN.mp4` (subidos por Vita desde el panel). Opcional pendiente: borrar `descargas/reels_todos.zip` (no se usa).
- Horarios por cuenta (hora Argentina): VITA :00, Coberturas :07, Autos :14, Marketing :21.

### Este documento

- Doc de Claude Docs: https://claude.ai/artifact/2q4WUWvHwx4auFXX45UjHD

## 7. Datos del negocio

| Tema | Dato |
| --- | --- |
| Perfiles públicos | Estudio Juridico VITA (estudiojuridicovita.com, IG @estudiojuridicovita), Kocos Marketing (kocosmkt.com, @kocosmkt), Compara tu Obra Social (comparatuobrasocial.com, @comparatuobrasocial), Automotores Kocos (autoskocos.com, @autoskocos); cada uno con página de Facebook propia |
| Asesor | Leonardo Gonzalez es el asesor que se presenta en los 4 perfiles |
| Contenido por rubro | VITA: accidentes de tránsito y laborales. Coberturas: comparación de prepagas y obras sociales. Autos: 0 km, plan de ahorro, usado como anticipo. Marketing: web, redes y automatización |
| Reglas de contenido | Sin precios, plazos, resultados ni promesas. Coberturas no recomienda una prepaga en particular. VITA no da asesoramiento legal específico. Cada texto cierra con una pregunta y el link de la bio a la web |
| Captación | Palabra clave por posteo hacia WhatsApp («IA», «0KM», etc.) para saber de qué posteo vino cada consulta |
| Volumen de redes | Plan original: 1 posteo + 1 historia por día y rubro (120). Desde el 24/10: 2 de feed + 5 historias por día, lunes a sábado, carrusel lunes y jueves. Reels: 4 por día por rubro (2 nuevos + 2 repeticiones) |
| Horarios Metricool | Reels 13:30 y 20:30; repeticiones 10:00 y 17:00 desde el 26/10; sin datos propios: posteo 12:30 e historia 19:30 (hora de Argentina); escalonado por cuenta: VITA :00, Coberturas :07, Autos :14, Marketing :21 |
| Herramientas y proveedores | Metricool con plan pago (4 perfiles con Facebook e Instagram, sin acceso a la API según Vita); Vercel (Blob y Hobby); GitHub (EzequielGonz/LEGAL-CRM, rama `main`); dominios en DonWeb; WhatsApp con API de Meta |
| Presupuesto | Tope de 30 USD mensuales para Google/Gemini de los agentes del panel. Ningún pago sin autorización expresa |
| Estilo visual de Automotores Kocos | Fondo azul marino, azul brillante de acento, títulos en mayúsculas gruesas, números con contorno, indicador de progreso, botón «Cotizá por WhatsApp» |
| Medición a 15 días | Mensajes de WhatsApp por rubro y palabra clave (CRM); alcance, guardados y compartidos (Metricool); seguidores nuevos |

No se registran teléfonos ni correos de contacto de las marcas en este documento.

## 8. Pendiente, a medias o bloqueado

| Tema | Estado | Por qué |
| --- | --- | --- |
| Rehacer los 4 reels de prueba con el estilo y la paleta de cada marca | A medias | Claude preguntó nombres de marca y logos; Vita respondió que ya estaban en el proyecto, y ese paso no se ejecutó en este chat |
| Confirmar que los 184 reels programados salieron | Pendiente de verificar | El documento del Project dice «Publicado: todavía no» al 24/10; no hay lectura posterior en este chat |
| Aprobación de Vita de textos de los reels antes de programar | No confirmada | Claude la pidió el 24/10; no consta respuesta textual en este chat |
| Logos de calidad para video | Bloqueado en parte | Los logos del repo son de 128 px, no aptos para video (se usó monograma con el acento de la marca) |
| Borrar `descargas/reels_todos.zip` del Blob | Opcional | No se usa |
| Destacadas de Instagram | A cargo de Vita | No se pueden programar; se arman desde la app con las historias ya publicadas (portadas entregadas) |
| Testimonios de las destacadas | Bloqueado | Solo se completan con testimonios reales |
| Otros pendientes del CRM (incidencia Alumar, adjuntar PDF en chats, comparación v1/v2, plantillas `*_sb_*`, SEO, etc.) | Fuera de este chat | Están en `CONTEXTO_ACTUAL_CRM.md`; no se tocaron aquí |

## 9. Aprendizajes

- **Qué funcionó:** generar cuadros con Pillow y armar el MP4 con ffmpeg dio 4 videos verticales de 19 s verificables con ffprobe, sin dependencias nuevas.
- **Error de render:** renderizar los 4 videos en una sola llamada superó el límite de 2 minutos y el cuarto quedó sin generar. Se resolvió renderizando ese video por separado.
- **Error de criterio:** ante «hacé vos el video», Claude contestó con bocetos en texto y pidió material. Convino hacer el video primero y preguntar después.
- **Error de contexto:** Claude afirmó que no tenía logos ni paleta, cuando `src/lib/marca.ts` y los logos del repo ya los tenían. Antes de pedirle material a Vita hay que revisar el repo y los documentos del Project.
- **Memoria vs. pedido actual:** Claude usó rubros de la memoria (hotel, prepagas) y no los 4 rubros vigentes del CRM. Ante un pedido de un rubro hay que partir de los 4 perfiles del proyecto.
- **Registro del chat:** tras el resumen automático, el detalle del 21 al 24/10 solo queda en los documentos del Project; conviene escribir en ellos cada decisión y cada id apenas ocurren.

## 10. Preguntas abiertas

- ¿Qué nombre va en los reels de marketing: Kocos Marketing u otro? En la memoria hay dos versiones (ver sección 12).
- ¿Los 4 videos de prueba de 19 s se reemplazan por los 96 reels del Project, o son piezas distintas? (no confirmado)
- ¿Vita aprobó los textos de los reels antes de la programación de los 184? No consta respuesta textual en este chat.
- ¿Salieron los reels desde el 25/10 13:30 y qué alcance tuvieron?
- ¿Se mantiene el plan de redes del 15/10 o rige la ampliación del 24/10 (2 de feed + 5 historias por día)?
- ¿Dónde quedó el título oficial de este chat? No hay uno visible.

## 11. Ramas y cambios

En la parte visible de este chat (24/10 y 21/11) no hubo commits, ramas, PR, migraciones, despliegues ni cambios de configuración. En este documento tampoco se ejecutó nada de eso.

| Tema | Detalle |
| --- | --- |
| Repo | EzequielGonz/LEGAL-CRM, rama `main` |
| PR de redes (según CONTEXTO_ACTUAL_CRM.md) | #68, ampliación de redes del 24/10 (publicado) |
| Marca y paleta | `src/lib/marca.ts` (paleta por rubro, según REELS_ESTRATEGIA_24-10.md) |
| Servicios usados para los reels | Metricool (programación), Vercel Blob (almacenamiento `reels-redes`) |
| Variables | Se nombra solo el prefijo `WHATSAPP_AGENCIA_0KM` (línea de Agencia 0 km, de otro tramo del proyecto). Sin valores |
| Credenciales | Ninguna aparece en este chat. Nota del Project (17/10): [secreto: credenciales pegadas en un chat anterior — hay que cambiarlas]; sin valores |
| Acciones de hoy | Se creó este documento en Claude Docs y se abrió en pantalla; sin envíos, publicaciones, programaciones, commits ni cambios de configuración |

## 12. Contradicciones

- **CONTRADICE:** «por ahora sin videos/reels en redes» (memoria del Project) frente al pedido del 24/10 de sumar reels a los 4 rubros (REELS_ESTRATEGIA_24-10.md) y a los 4 videos hechos en este chat. La orden posterior prevalece; no consta una orden textual de Vita que reemplace la anterior.
- **CONTRADICE:** nombre de la agencia de marketing. La memoria de proyecto dice Kocos Marketing y que Vita «no reconoce el nombre ORVIAN»; la memoria de cuenta dice que la agencia se llama ORVIAN y que «no es Kocos». La estrategia de redes usa Kocos Marketing.
- **CONTRADICE:** estado de la Fase 3 del CRM: el Project la daba por pausada, y CONTEXTO_ACTUAL_CRM.md la da por cerrada y descartada el 25/10. No toca a este chat, pero figura en la documentación.
- **CONTRADICE:** volumen de redes. El plan inicial era 1 posteo + 1 historia por día y rubro (120 publicaciones); la ampliación del 24/10 es 2 de feed + 5 historias por día (304 publicaciones en Metricool del 26/10 al 5/11).
- **CONTRADICE:** «no quiere ZIP, resúmenes ni archivos de entrega» frente a la entrega del 21/10 (`entrega-landings-2110.zip` y archivos de estrategia).
- **CONTRADICE:** Claude dijo que no tenía logos ni paleta de las otras marcas, pero el Project y el repo (`marca.ts`) los tienen.
- **CONTRADICE:** el reel «19 s, texto sobre color, sin música» de este chat frente al estándar del Project (~15 s, paleta de marca, base musical, 3 pasos numerados).
- **CONTRADICE:** el resumen del chat dice que los reels «no entraron» al plan y que no se programaron; el documento del Project, del mismo día, dice 184 reels programados.
