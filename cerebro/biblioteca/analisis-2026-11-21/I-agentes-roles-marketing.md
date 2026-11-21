# Informe I · Agentes, roles, Marketing, líneas y sistema

Recorrido de solo lectura de https://legal-crm-nine.vercel.app el 21/11/2026 (hora de la mañana), en los 4 perfiles, más lectura del código de origin/main (`/home/user/crm-main`, commit 66c457b del 20/11). No se guardó, envió, lanzó ni extrajo nada. Sin nombres ni teléfonos de prospectos. Los números de línea propios van enmascarados.

Convención: **[panel]** = visto en producción; **[código]** = leído en el repo; **[?]** = no verificable desde acá.

---

## Parte 1. Agentes y bots

### 1.1 Por qué la biblioteca dice «apagados» y Bot IA dice «activos»

Son dos cosas distintas que comparten la palabra «agente»:

| | Biblioteca de agentes (`/biblioteca-agentes`) | Bot IA (`/agentes`, `/panel/<perfil>/agentes`) |
| --- | --- | --- |
| Tabla | `agent_library` + `agent_library_versions` | `ai_agents` (campo `active`) |
| Qué es | Solo configuración (nombre, objetivo, límites, modos) con historial de versiones. Un principal + un derivado por rubro | El agente que **responde hoy**: instrucciones, criterios de calificación, datos a recolectar |
| Estado | Fijo «Apagado · versión 1 · preparado». El código **no permite** poner otro estado que «apagado» o «borrador» (`validarCambioAgente`) | Interruptor «Activo» en cada agente: está en **on** en los 5 (civil, penal, coberturas, 0 km, marketing) |
| Responde mensajes | **Nunca**. La propia pantalla dice «ninguno responde mensajes» | Sí: es el que contesta |

Además, en la sección «Agente del perfil» de Bot IA (Etapa 3) cada derivado dice **«Sin evaluación todavía. Sin asignación: no responde»**: las versiones de la biblioteca no están asignadas a ningún área, así que mandan las instrucciones de `ai_agents` («sin asignación activa responde la configuración de arriba, como hasta ahora»). Conclusión: la biblioteca es un andamio de la Etapa 2/3 que no está conectado a la producción; el que importa es `ai_agents`. No hay contradicción, hay dos tablas con el mismo vocabulario. [panel + código]

### 1.2 Los agentes, uno por uno [panel]

Modelo: **gemini-3.8-flash** (proveedor `gemini_api`), el mismo para los 5 agentes; sale de la variable `GEMINI_MODEL` o del valor por defecto del código. Vertex AI (ajuste fino) está sin configurar (faltan `GCP_*`). Un selector del laboratorio permite probar versiones con otros Gemini sin cambiar el de producción.

| Agente (perfil) | Rol según su instrucción | Largo de instrucción | Criterios de calificación | Datos que recolecta |
| --- | --- | --- | --- | --- |
| Civil (Jurídico) | Asesor del equipo del estudio; charla breve, una pregunta por mensaje, propone llamada con un abogado. Flujos por origen: saludo espontáneo, campaña (ART), «dar antes de preguntar», límites | ~9.800 car. | «Tuvo un accidente laboral y quiere que el estudio analice su caso» (no se descarta por antigüedad) | tiempo desde el accidente, lugar, lesión o problema de salud, disponibilidad para reunión |
| Penal (Jurídico) | Primer contacto penal: escucha con discreción, no asesora, logra que acepte que un abogado lo contacte; urgencias van a una persona | ~2.060 | Causa iniciada o riesgo real; fuero aproximado | nombre, teléfono, tipo de consulta, descripción, estado de la causa |
| Coberturas | Asesor que compara obras sociales y prepagas; nunca recomienda ni da precios; cierra con «¿mañana o tarde?» para una llamada de 5 min | ~6.500 | Quiere pagar menos o mejorar cobertura; acepta la llamada | obra social actual, titular o grupo familiar, prestador preferido, franja horaria |
| Autos 0 km | Asesor comercial de agencia multimarca; no vende por chat: consigue el interés y el sí al contacto del vendedor | ~6.100 | Interés en un 0 km; acepta contacto del vendedor | vehículo buscado, forma de pago, vehículo a entregar, franja |
| Marketing | Asesor consultivo de Kocos Marketing. Guion de 11 fases (descubrimiento, confirmación del problema, hacer visible la oportunidad, solución, resultado, personalización, justificación del precio, objeciones, cierre consultivo, detección de lead caliente con umbral 60, no discutir) | ~16.900 | Reconoce el problema, considera razonable la inversión, quiere avanzar en plazo razonable | rubro, problema confirmado, servicio buscado, presupuesto mensual, zona |

Herramientas que menciona el agente de Marketing: `guardar_datos_calificacion`, `consultar_disponibilidad`, `agendar_cita`, `evaluar_calificacion`, `escalar_a_humano`, `pedir_presupuesto`; y «No uses finalizar_consulta». Si hay link de propuesta lo comparte. Incluye una **guía de precios** dentro del prompt (referenciales, sin IVA, mensuales): Esencial $120.000, Presencia Web $180.000, Negocio $250.000, Premium $330.000; automatizaciones y análisis de mercado «según el caso»; publicidad pagada a Google/Meta nunca incluida; web/tienda/app con contrato mínimo de 12 meses; «presentá el pack que se ajuste, no el más caro». Esto contradice la frase del cerebro «la ficha del negocio no tiene precios»: la ficha no, pero el **prompt de Marketing sí** (y la ficha remite a esa guía).

Capas visibles en pantalla: reglas del sistema → **Ficha del negocio** (texto de hasta 6.000 car.; hoy 1.400–1.700 en cada perfil, última edición 24/10) → **Rol por base** → conocimiento por versión (v1/v2). Palabras clave de redes (agregadas el 09/11) viven dentro del prompt de Marketing («Escribinos PALABRA por WhatsApp»).

### 1.3 Roles por base [panel]

Cada perfil tiene bases con un selector «Solo la base general» / «Base general + rol».
- Jurídico: rol «Accidente laboral / ART» (objetivo: llamada de 5 min sin costo con abogado o enviar alta médica). **Solo 1 de 12 bases** lo usa (la «GRAVES 1911» de la campaña vigente); las otras 11 van «solo base general».
- Marketing: rol «Venta consultiva con cierre humano (Kocos Marketing)» (5 puntos: análisis en el mismo chat, presupuesto con `pedir_presupuesto`, cierre humano, objeciones, ventana de 24 h). **Solo 1 de ~46 bases** lo usa.
- Coberturas: existe el rol «Obra social · venta consultiva» (descubrir qué le molesta, validar, mostrar qué gana) pero **0 de 4 bases** lo usan.
- Autos 0 km: **no hay ningún rol guardado**; 2 bases «solo general».

### 1.4 Versiones del conocimiento, A/B y laboratorio

Está en **`/perfiles`, al pie, sección «Conocimiento del bot»** (no dentro de Bot IA). [panel + código]
- Los 4 perfiles «Rige v2» (v1 = bot del 24/10; v2 = biblioteca de ventas, objeciones y conocimiento por rubro). Fichas v2: Jurídico 69 objeciones/18 temas; 0 km 64/7; Coberturas 63/5; Marketing 65/6. Conversaciones del período (30 d): Jurídico v1=3 / v2=47; Coberturas v1=2 / v2=3; 0 km y Marketing 0/0. **Muy poca muestra: la comparación v1-v2 no sirve para decidir.**
- «Laboratorio del bot»: asistente que arma una versión nueva (nombre, modelo, tono, reglas extra), «Cómo viene cada versión» (siguieron la charla / captados / pasaron a una persona sobre 59 charlas en Jurídico: 62,7 / 16,9 / 1,7 por cada 100), «El bot de hoy» con instrucciones editables y «Volver a la anterior», «Probar antes de usar» (charlas inventadas, sin escribir a nadie) y **A/B en campaña real**: «Una parte de las charlas nuevas de la campaña usa esta versión» (por defecto 20 de cada 100, N días). Hoy no hay versiones nuevas creadas en ningún perfil.
- `/comparacion-agentes` redirige a `/agentes`; el texto de Ajustes («las evaluaciones y el experimento, en Comparación de agentes») quedó viejo.

### 1.5 Puntaje y informes que genera cada agente [panel]

«Cómo viene el bot» (puntaje sobre 100, con captación /50, retención /20, trato /15, calidad /15):
- Jurídico 37 (214 conversaciones, 17 captados; captación 8 %, 66 % perdido, 7 % para revisar).
- Marketing 40 (271 conv., 7 captados; 3 % captación, 34 % perdido).
- Coberturas 32 (89 conv., 2 captados; 2 %, 62 % perdido, 1 % enojo).
- 0 km: página con puntaje, sin cifras que reportar en esta pasada.
Todos «Mejorable». Sugerencia fija por perfil (p. ej. «retome cuando la persona duda, sin insistir de más»).

**Informe de mejoras con Gemini** (períodos 7/14/30/60 días): relee conversaciones sin datos personales y propone fichas («sumar al bot» o «crear como rol nuevo»). Último informe: Jurídico 20/11 (25 conversaciones), Coberturas y Marketing 14/11 (46 y 60). Hallazgos repetidos:
- Doble respuesta a negocios con bienvenida + ausencia simultáneas (Marketing, 7 conv.).
- Reacciones con emoji tratadas como «no puedo escuchar audios» (Marketing, Coberturas, 0 km).
- Bucles con contestadores/menús de otros negocios (Marketing, Coberturas).
- Bot que sigue contestando después de la baja o «número equivocado» (Jurídico).
- Cierre con doble pregunta («¿aceptás la llamada y mañana o tarde?») que genera respuestas parciales.
- «Nancy»: el informe de Jurídico lo marca como **invento de nombre**, pero el perfil tiene configurado «Nombre con el que se presenta el agente = Nancy» (Ajustes › Perfil). No es una alucinación: es un dato del perfil que choca con la propuesta de «no inventes nombres de pila». Hay que decidir cuál manda. Marketing tiene también un nombre de persona configurado como presentación.
Varias propuestas ya figuran como «Sumada al bot ✓»; el resto (las que aparecen con «Sumar al bot del perfil») están pendientes.

### 1.6 Horarios, audios, recontacto, seguimiento, detención [panel + código]

- Responde 24 h todos los días. Asesores humanos lunes a sábado 8–21. Lo que inicia la empresa (campañas, seguimientos, reagendas): lunes a sábado 8–21 AR, aunque sea feriado; domingos no; excepciones cargables (0 próximas). La prospección automática de Marketing usa su propia franja 9–20 (texto del panel).
- Audios: el bot los pasa a texto (hasta 5 min y 4 MB); si no puede, pide que escriba. Interruptor «El bot entiende los audios» en Ajustes: **encendido**.
- Recontacto mismo día: 2 h después de quedar sin respuesta, y una vez más 2 h después (`ESPERA_RECONTACTO_MS = 2 h`, mínimo 20 min entre mensajes).
- Seguimiento (contacto 2): entre **48 y 72 h**, por defecto 72 (desde el 13/11); se elige la franja válida más cercana; si ninguna cae en lunes–sábado 8–21 queda como «conflicto». Contacto 3 solo si respondió al 2. Pantalla de Seguimiento de Marketing: programados 0, enviados 0, **soltados 50**, para revisar 0; Jurídico 12 seguimientos no pudieron salir (Salud).
- Caídos: espera 24 h de respuesta; silencio sin seguimiento 96 h; tope 7 días sin enviar.
- Segundo intento (solo Wasender, quien nunca respondió y se le entregó): uno solo, entre 5 y 7 días, vence a los 10.
- **Tope por persona: 3 automáticos sin respuesta** sumando campaña, seguimiento y recuperación, entre todos los perfiles que compartan teléfono (`contacto/tope.ts`).
- Pausa general: **levantada** (respuestas de IA y envíos «Activas»).

---

## Parte 2. Marketing a fondo

### 2.1 Mapa de pantallas [panel]
Hoy (con los dos circuitos), Chats, Contactos (Etapas, Citas, Seguimiento, Prioritarios, Piden presupuesto, Por base), Campañas (+ Bases + Extraer negocios), y rutas sin menú: `/panel/marketing/captacion`, `/extraer`, `/presupuestos`, `/prospectos`, `/consultas-directas`, `/lead/[id]`.

### 2.2 Dos «scrapers» distintos con el mismo proveedor
1. **Extraer negocios** (`/extraer`): formulario con tipo de negocio, cantidad máxima, zona («Toda Argentina» se reparte en las **24 jurisdicciones**, o provincias/localidades) y nombre de base. Tope **500 por extracción** y **1.000 por día** (`system_settings.limites_outscraper`; el día reinicia a medianoche AR; cuentan los pedidos no cancelados). Hoy «disponibles 1000 de 1000». Una extracción = una base (`imported_bases`, área marketing, etiqueta «Google Maps · Extraer negocios»). Se corre **una zona por latido** (máx. 60 resultados por consulta, el cupo se reparte entre zonas restantes); un fallo en una zona no frena las demás. Deduplica por lugar de Google y por teléfono. No contacta a nadie. Requiere `OUTSCRAPER_API_KEY`. 5 extracciones recientes (19/10–31/10): 399, 458, 380, 500 y 498 encontrados, con 356, 253, 143, 429 y 131 nuevos (el resto ya existía).
2. **Captación — Google Maps** (`/captacion`): «+ Buscar negocios», «Barrido masivo (varias ciudades)» y una **cola de búsquedas** (41 listas, 0 pendientes, 0 con error; del 22/10, ~11 negocios por ciudad con los mismos 4 rubros). **El texto de la pantalla dice «API oficial de Google Maps»; el código usa Outscraper** en ambos (`google-places.ts` lo aclara: no se usa Places para no abrir proyecto en Google Cloud). Texto engañoso, no un segundo proveedor.

Qué guarda por negocio (`ScrapedPlace`): place id, nombre, dirección, teléfono, sitio web, rating, cantidad de reseñas, tipos, y extras (cantidad de fotos, ficha verificada, estado del negocio, si tiene horarios, descripción, Facebook, Instagram, email, reseñas por puntaje, URL de Maps).

### 2.3 Análisis del negocio
Dos capas (`analysis.ts`): (1) **reglas deterministas** sobre web + ficha de Google (ej.: sin web propia, web no adaptada a celular o «no segura», ficha sin verificar, sin horarios, pocas fotos, puntaje bajo, pocas reseñas; redes sociales y linktree no cuentan como sitio propio), cada una con peso, severidad (alta ≥12, media ≥7), impacto y mejora; puntaje 0–100 (+5/+10 si tiene 15/50+ reseñas); **prioridad alta ≥60, media ≥35, baja** debajo. (2) **Gemini** redacta el «gancho» (12–100 car., sin links), un resumen y los servicios sugeridos; si Gemini falla igual se completa con textos por reglas.

Cómo se ve un prospecto con análisis [panel `/lead/[id]`]: encabezado con prioridad y puntaje, estado, origen («Dato frío · Google Maps · base»), «Análisis del negocio» con fecha, resumen, gancho del primer mensaje, lista de hallazgos (severidad, problema, impacto, mejora), servicios sugeridos, datos de Maps (puntaje, reseñas, fotos), conversación, estadísticas del prospecto (mensajes de ambos lados, tiempo de respuesta, seguimientos enviados «0 de 2») e historial de eventos. Ficha de prospectos prioritarios: filtros por etapa (Contactado, Aceptó escuchar, Análisis hecho, Propuesta presentada, Pidió presupuesto, Presupuesto enviado, Cerrado aprobado, No interesado), prioridad y estado.

**Dos flujos conviven**: los leads viejos de «Captación» se analizan de entrada (visto: un prospecto analizado el 22/10 con prioridad alta); las bases de «Extraer» reciben la **apertura genérica** y se analizan **recién cuando aceptan escuchar la propuesta** (el panel lo dice). La pantalla de Hoy: «23 aceptaron escuchar», «468 sin contactar».

### 2.4 Apertura y «Ejecutar base» [código + panel]
- «Ejecutar base» (con PIN) crea la campaña con la **línea de Meta de Marketing**, la plantilla **`mkt_apertura_propuesta`**, el agente y estos límites: espera 50–200 s, lotes de 10, pausa de 300 s entre lotes, **150 envíos por día**. Si falta algo o hay pausa general, queda en borrador y dice qué falta. **Es un flujo por Meta con plantilla, no por Wasender.**
- «Envío automático del primer mensaje» (`/prospectos`): **apagado**. Cuando se activa manda solo a prioridad alta o media, de a uno, 9–20 h, máximo por día configurable, requiere plantilla del catálogo aprobada y asignada a la línea; nunca dos veces al mismo negocio.
- Texto de `mkt_apertura_propuesta` (aprobada, 510 envíos, último 31/10): «Hola, ¿cómo estás? Soy [asesor], de Kocos Marketing. Tengo una propuesta para tu negocio. ¿Tenés cinco minutos para que te cuente?» con botones «Sí, contame / Ahora no / No me escriban más».

### 2.5 Consultas directas, Piden presupuesto, cierre
- **Consultas directas** (4 abiertas en Hoy; la lista tiene 4 filas, todas de WhatsApp «consulta directa», una con presupuesto enviado, otra «No interesado», «Sin datos para analizar»): gente que escribe a Kocos. Dos de los números de aviso del equipo (Ajustes) coinciden con estos «consultantes»: hay **pruebas internas mezcladas con consultas reales** y ensucian las métricas.
- **Pide presupuesto** (`/presupuestos`, «Abiertos/Todos»): 7 presupuestos en total (6 «Enviado, la IA retoma para cerrar» y 1 «Listo, espera que la persona escriba»), **0 aprobados** pese a que el historial muestra pedidos con detalle (qué pidió, servicios). Hay formulario «Cargar un presupuesto nuevo» para un cliente que no lo pidió por el agente y «Registrar resultado a mano» (Aprobado/Rechazado/Sin respuesta/Anulado).
- **El PDF NO lo genera el panel.** El equipo **sube** el archivo (pdf, png, jpg, doc/docx, xls/xlsx, a un bucket de Storage) con monto, moneda (ARS/USD), alcance, plazo y notas; más fotos/videos opcionales. No hay generador de factura ni cálculo del «10 % de bienvenida» (el cerebro lo da como parte del producto: es manual). El texto del mensaje de entrega sí lo arma `textoEnvioPresupuesto`.
- Envío: con ventana de 24 h abierta, sale el documento en el momento (o programado a día/hora con validación de calendario); si está cerrada, sale la plantilla **`mkt_presupuesto_listo`** y el archivo se manda apenas la persona responde. **Siempre por Meta** (`sendWhatsAppDocument` usa credenciales de Meta de Marketing; no hay camino Wasender para presupuestos). Después la IA retoma para cerrar y el contacto deja de figurar como «captado para derivar».
- «Captado» en Marketing = `pedir_presupuesto` (avisa a los números de aviso y promete < 24 h). El **cierre lo hace una persona**: el agente nunca pasa alias, CBU ni da la venta por cerrada.

### 2.6 Cifras de Marketing [panel]
Circuito saliente: 1.191 contactados, 267 respondieron, 0 proyectos aprobados. Consultas directas: 4 recibidas. Tasa de respuesta 22,7 %, captación 0,4 %, 1.663 oportunidades, 924 contactados sin respuesta, 168 seguimientos caídos. Campañas: 4, todas Meta, 0 Wasender; «Aberturas y Carpinterías - Octubre 2026» pausada por «domingo» con 347 de 585 enviados, 162 fallaron, 140 respondieron.

---

## Parte 3. Líneas, plantillas y envíos

### 3.1 Estado real de las líneas hoy [panel]

**Meta** (una línea por rubro, más PENAL):
| Perfil | Línea | Estado | Calidad |
| --- | --- | --- | --- |
| Jurídico | CIVIL | Conectada | alta |
| Jurídico | PENAL | Inactiva; **faltan variables** (`WHATSAPP_PENAL_*`, ni WABA ni token) | — |
| Coberturas | COBERTURAS MEDICAS | Conectada | alta |
| Autos 0 km | AGENCIA 0KM | Conectada | **baja** |
| Marketing | MARKETING | **«Sin acceso al número»**: «Meta no encuentra ese número con este token» | — |

Marketing en detalle: el panel dice que mientras falte «los envíos y las respuestas automáticas de este perfil quedan deshabilitados»; el catálogo de plantillas se lee (17 plantillas, cuenta cargada) pero «**la línea NO figura en esa cuenta**»; el perfil de WhatsApp da error de Meta «(#100) Tried accessing nonexisting field (whatsapp_business_profile)», típico de un ID que no es de un número de teléfono. Consecuencia probable: el identificador cargado en `WHATSAPP_MARKETING_PHONE_NUMBER_ID` es incorrecto o el token no tiene ese número. **Marketing hoy no tiene una vía Meta operativa** y su chip por QR está caído (ver abajo). Además los enlaces `wa.me` de Instagram/Facebook/web que arma el panel apuntan al **mismo número (terminado en …2391) que el chip de Wasender de Marketing**, que está desconectado desde el 15/11: las consultas desde redes no tienen hoy un receptor que funcione. [Que ese número sea además el de la línea Meta: **[?]**, el panel no muestra el número de la línea Meta.]

Calidad baja de 0 km: el código pausa las campañas de la línea cuando Meta califica «baja» (`calidad-servidor.ts`) y avisa.

**Wasender** (chips por QR):
- Jurídico: «Asesoria Vita - 2» (área Civil), «Sesión cerrada desde el celular»; «Ver archivadas (1)».
- Marketing: «LINEA - KOCOS MARKETING», «Sesión cerrada desde el celular».
- Coberturas y 0 km: **sin líneas** (consistente con que los chips llegan esta semana).
- En las dos existentes: «Envía mensajes» **OFF**, «Responde el bot» **ON**, «Modo prueba» **ON**, «Avisos internos» OFF, «Reemplaza a la línea de Meta: Ninguna», «Día 8 de calentamiento: hoy hasta 80 mensajes de campaña».
- Salud: Jurídico caída desde el 13/11 13:52, Marketing desde el 15/11 23:09. El código, al detectar la caída, **apaga solo «Envía mensajes»** (`habilitada:false`); después de re-escanear hay que volver a encenderlo a mano (y solo se puede si está «connected»).
- Campañas por Wasender hoy: **0** en Marketing; las de otros perfiles no se revisaron acá.

### 3.2 Plantillas de Meta [panel]
Todas las plantillas de los 4 catálogos figuran **APPROVED** en la última lectura (21/11 06:22): Marketing 17, Jurídico 18, Coberturas 14, 0 km 14. Incluye las `*_sb_*` (sin botones) — **el cerebro las daba «esperando aprobación»: ya están aprobadas** — y `hello_world` (de prueba de Meta). Asignaciones y usos:
- Marketing: primer contacto `kocos_primer_contacto_v2`, `mkt_apertura_propuesta` (510 envíos), `mkt_prospeccion_a` (682; 3 campañas); seguimiento 2 y 3 `mkt_seguimiento_2/3`.
- Jurídico (línea CIVIL): primer contacto `contacto_frio_vita` (743 envíos, texto «por tu consulta sobre el accidente laboral / ART»: el tipo que el cerebro dice que se dejó de usar sigue **asignado a 3 campañas**), `estudio_juridico_vita_asesor` (512), `jur_base_fria_a` (560; último envío 20/11 16:31) y la antigua `estudio_juridico_vita` (1.610 envíos, «escrita a mano» sin elegir del catálogo, último 5/10); seguimiento `jur_seguimiento_2/3`.
- Coberturas: `cob_base_fria_a`, `cob_recupero_a`; seguimiento `cob_seguimiento_2/3`.
- 0 km: `autos_base_fria_a`, `autos_recupero_b` (413 envíos), seguimiento `autos_seguimiento_2/3`; **`hello_world` está asignada como «Primer contacto de campaña»** (rareza a corregir).
- Categorías: casi todas MARKETING; UTILITY solo en reagendar, inicio de fase 2, avisos y form recibido.
Textos de ejemplo (aprobados): `jur_base_fria_a` «…Nos dedicamos a revisar accidentes laborales con ART… ¿Tuviste algún accidente de trabajo en los últimos años?»; `cob_base_fria_a` «…ayudamos a encontrar una prepaga u obra social que te cubra mejor o te cueste menos. ¿Hoy tenés cobertura o estás sin?»; `autos_base_fria_a` «…Ayudamos a conseguir 0 km con financiación y entrega rápida. ¿Estás pensando en cambiar el auto este año?»; seguimiento 2 de los cuatro: «retomo lo que veníamos hablando… ¿Te parece?» con botones «Dale / Ahora no / No me escriban más». Los botones de baja en la propia plantilla siguen existiendo (el cerebro cuenta que 32 de 36 respuestas de Coberturas del 24/10 fueron botones de baja).

### 3.3 Plantillas de Wasender [panel]
Textos propios sin aprobación, con variables `{{nombre}}`, `{{asesor}}`, `{{marca}}`. Cada plantilla de primer mensaje tiene **hasta 60 variantes** y marca «de inicio: rota en campañas»: Marketing 12 (`mkt_fria_anuncios`, `_catalogo`, `_clientes_que_vuelven`, `_competencia`, `_diagnostico` 53, `_fuera_de_horario` 58, `_instagram`, `_pregunta_corta`, `_resenas`, `_respuesta_rapida`, `_turnos`, `_web`) y Jurídico 12 (`jur_fria_alta_temprana`, `_comision_medica`, `_enfermedad`, `_familiar` 38, `_lo_que_cobro` 39, `_moto_bici`, `_peaton_pasajero`, `_plazos`, `_porcentaje`, `_pregunta_corta`, `_rechazo_art`, `_sin_registrar`), más `*_segundo_intento` (4 textos) y copias de las de Meta para seguimiento («copiada de Meta», 1 texto). Las `kocos_repesca_1/2` y `jur_inicio_fase2` están «Para revisar / le faltan 3 textos para salir en campañas». Regla del código: una plantilla de campaña necesita **mínimo 4 textos distintos**, sin partes «[revisar]» y se avisa de variantes casi iguales (umbral de parecido 0,8). Archivadas: 10 en Jurídico.

### 3.4 Cómo elige el panel la línea de envío [código]
1. **Responder**: por la línea por la que la persona escribió por última vez (`decidirSalida`): si el último mensaje entrante trae `metadata.proveedor = wasender` sale por esa línea; si no, por Meta. Si nunca escribió, por la línea del último saliente. Si hay una «equivalencia» (la línea de Meta de ese chat se reemplazó por una de Wasender, marcada a mano) sale por la reemplazante. **Nunca pasa sola de una línea a otra**, ni cae a Meta si Wasender se cae (corta con «línea no disponible»).
2. **Campaña**: una sola línea por campaña (`campaigns.line_id` para Meta, `wasender_line_id` para Wasender), elegida al armarla. **No existe un pool de líneas ni reparto entre varias**; lo que rota es el **texto**: sin plantilla fija, la campaña de Wasender rota entre todas las plantillas de inicio activas (`wasender_rotar_inicio`).
3. **Seguimiento y segundo intento**: la tarea guarda `wasender_line_id` y sale por esa línea con una plantilla propia de uso «seguimiento» (por nombre `…_seguimiento_2/3`, `…_segundo_intento`); el 3 usa la del 2 si no tiene propia.
4. **Avisos internos** al equipo: por Wasender si el perfil tiene una línea marcada «Avisos internos» o si la conexión Meta ya se pasó a Wasender; si no, por Meta.
5. Presupuestos y el resto de documentos: siempre Meta.

### 3.5 Algoritmo de envío [código]
**Meta** (`campaigns.ts`, motor «a pasos»): cada latido por campaña manda como máximo 1 mensaje. Controles en orden: pausa general → días de ejecución (lunes–sábado AR) → configuración de perfil, línea y plantilla (variables nunca vacías) → límite diario de la campaña y de la línea (suma todas las campañas que la usan) → horario 8–21 con calendario → espera al azar entre `min_send_delay` y `max_send_delay` → lotes (`batch_size`) con pausa (`batch_pause_seconds`) → antes de enviar revalida baja, atención humana, ventana, intentos, hora y el **tope de 3 automáticos sin respuesta**. Ritmo por defecto de Marketing: 50–200 s, lotes de 10, pausa 300 s, 150/día. Si la calidad de la línea es baja se pausan sus campañas; freno por respuesta < 1 % también existe.

**Wasender** (`ritmo.ts`, `ritmo-humano.ts`, `campanas.ts`), con el mismo motor pero con estas capas:
- **Calentamiento** por línea (desde `calentamiento_desde`): día 1–3: 20/día; 4–7: 40; 8–14: 80; 15–21: 150; 22 en adelante: 250. El límite efectivo es el menor entre el elegido y el del calentamiento. (Las dos líneas están «día 8» = 80.) Suma todas las campañas de la línea.
- **Plan del día** distinto cada día por línea y fecha (semilla): arranque y cierre variables dentro de 8–21, cupo del día entre 72 % y 100 % del límite (sábado 55–85 %), factor de espera 0,8–1,35, pausa de mediodía (75 % de los días, 35–95 min entre 12:10 y 14:20) y 0–2 pausas cortas.
- **Tandas** de largo variable (de 50 % a 160 % de la elegida, mín. 2) y **pausa entre tandas** de 60 % a 200 % de la elegida (y a veces más; mínimo 1 min). Espera irregular, con una de cada diez más larga (×2 a ×4).
- **Texto**: elección al azar por envío sin repetir plantilla ni textos parecidos a los recientes; saludo con primer nombre solo si parece nombre de persona.
- **Frenos**: con ≥ 10 envíos, pausa si ≥ 30 % fallaron o ≥ 50 % no se entregaron (reanuda a las 12 h del último); con ≥ 100 envíos en 7 días y < 1 % de respuesta, «Freno por respuesta». La campaña se **pausa** (no queda en curso) si la línea no puede enviar.
- Antes de enviar verifica que el número tenga WhatsApp (`estaEnWhatsApp`).
- **Interruptor general**: `WASENDER_HABILITADO=true` en el entorno; sin él no sale nada aunque la línea esté conectada. El estado de esa variable en Producción **[?]** (la documentación decía «solo en Preview»).
- **Modo prueba** (nace en `true`): entre un mensaje y otro cada chat de Wasender queda en **atención humana** para que el recontacto de producción no intente salir por Meta. Mientras esté ON, **los seguimientos y recontactos automáticos de esa línea quedan frenados**: hay que apagarlo para producción real.
- Entrada: el webhook de Wasender entra al mismo camino que Meta (`handleInboundMessage`: contacto, oportunidad, chat, bot), con eco y estados de entrega; la línea pertenece a un perfil.

### 3.6 Lo que dice el dueño («ya está todo integrado») contra lo que hay
Confirmado integrado en código: líneas por QR con alta/baja/archivo, vinculación por QR, calentamiento, modo prueba, campañas, plantillas con variantes, seguimiento, segundo intento, avisos y entrada de mensajes. **Matices importantes para su plan (1 Meta fija por rubro + varios chips):**
1. **No hay pool**: cada campaña usa una única línea de Wasender. Con 4 chips VITA el dueño tendría que crear 4 campañas (o repartir la base a mano en 4 bases) y cada una cuenta contra su límite diario de línea. No hay rotación, balanceo ni reemplazo automático ante una caída.
2. La conversación queda atada a la línea donde empezó: si el chip se cae, esos chats no tienen alternativa (no se pasan a Meta ni a otro chip).
3. Una línea de Wasender solo puede enviar si está «Conectada» y «Envía mensajes» ON; ante cada caída se apaga sola.
4. «Modo prueba» ON bloquea seguimientos.
5. Hoy ninguna de las dos líneas existentes envía (QR caído, switch OFF, test ON).
6. Meta fija para consultas: Jurídico y Coberturas sí lo tienen funcionando; 0 km con calidad baja; **Marketing no**.
7. Un número que ya está en Meta no se puede agregar por QR (validación `esNumeroDeMeta`), correcto para su plan.

---

## Parte 4. Conexiones, Salud, Ajustes, pausa, avisos, tareas, redes, asistente, bandeja

- **Salud** (`/salud`): hoy «2 frenan la operación». Jurídico: 46 mensajes no salieron en 24 h, 12 seguimientos no pudieron salir, el bot no pudo contestar 2 veces, 1 respuesta de IA con error de 19 turnos (falla_modelo: «El modelo no respondió en 20 segundos»). Sistema: **5 mensajes entrantes retenidos en cuarentena** (todo el sistema; uno de Marketing y uno de Jurídico por el mismo motivo, el modelo no respondió en 20 s). Latido «hace 1 min, tardó 1,4 s»; pausa general sin pausa; último mensaje entrante «hace 16 h». Wasender caído en Jurídico y Marketing.
- **Latido `campaigns-tick`** (cada minuto, desde Supabase): campañas → plantillas → seguimiento → recontacto → segundo intento → descartes → caídos → rescate de turnos perdidos → calidad de líneas → Marketing (análisis, búsquedas) → extracciones → citas y contenido (si están encendidas) → avisos de líneas → formularios de landing → presupuestos programados → catálogo de plantillas → fallas. «Tarea externa» inactiva «por decisión»; `vercel.json` no define crons (solo región gru1).
- **Ajustes** (`/configuracion`, igual en los 4, con grupos): Perfil y marca; Perfil, nombres y líneas; Canales (Jurídico 3 de 8 conectados, Marketing 2 de 4: WhatsApp y landing conectados, Instagram y Facebook sin conectar); Plantillas; Agenda, disponibilidad (bloques lunes–viernes 9–13 y 14–18, turnos de 30 min, Civil y Penal); Horario de contacto y calendario; Mensajes de voz; Pausa general; Notificaciones; Acceso y PIN; Tareas del servidor; Conexiones; Mensajes retenidos.
- **Pausa general**: respuestas de IA «Activas» y envíos automáticos «Activos»; reanudar no activa agentes ni lanza campañas.
- **Avisos**: teléfono principal del administrador y 2 números adicionales reciben por WhatsApp «caso calificado»/«nuevo cliente agendado». **Avisos web (VAPID): sin configurar** (faltan `VAPID_PUBLIC_KEY/PRIVATE_KEY`), ningún dispositivo registrado; el navegador de esta prueba lo tenía bloqueado.
- **Tareas del servidor**: «citas apagadas · contenido apagado» (mensaje de inicio de Fase 2 y publicación programada).
- **Conexiones**: WhatsApp Meta variables presentes (no prueba que cada número esté conectado); modelo de agentes presente; **Vertex AI sin configurar; Metricool sin configurar** («las piezas quedan listas y no se publican»); **Search Console sin configurar**; latido con secreto cargado.
- **Acceso**: PIN de 8 dígitos (el de 6 sigue sirviendo, cambiado por última vez el 11/10); sesión 7 días sin uso / 30 en total; 5 intentos por origen y 15 min de espera.
- **Redes**: pestañas Accesos, Publicaciones, Contenido, Publicidad. Instagram y Facebook sin dirección cargada ni vinculación de API; enlaces wa.me por origen (Instagram/Facebook/web); publicaciones: ninguna programada, Metricool sin conectar; Contenido: 0 pendientes/borradores/próximas/publicadas. **Publicidad**: «Apagada · no gasta», configuración (objetivo, tope diario, cuenta, zona, edades, intereses) y botón «Encender (necesita autorización)»; consistente con «no se paga nada sin autorización».
- **WhatsApp oficial › Perfil de WhatsApp y redes** (Marketing): Facebook «Sin vincular», Instagram «Se edita en la app» con biografía sugerida, WhatsApp con error de lectura (ver 3.1).
- **Asistente general `/asistente`**: resumen semanal de 7 cifras por perfil (esta semana: captados 4, todos de Jurídico; 4 chats piden una persona, todos Jurídico), y accesos: lanzar campañas con planillas, cómo vienen los 4 perfiles, mejorar un bot, programar publicaciones, buscar captados, revisar chats que piden una persona. Dice «nada cambia sin tu confirmación».
- **Bandeja para Claude** (`/bandeja`): tareas para Claude con perfil, enlaces (hasta 5) y texto (hasta 4.000 car.); Marketing hoy: 0 abiertas, 1 cerrada (lista).
- **Limpieza del 13/11** (`/limpieza`): 238 personas reubicadas (61 releídas: dijeron que no, 168 dejaron de responder, 6 perdidos que seguían pidiendo una persona, 3 quedan donde estaban), con «Deshacer».
- Páginas que redirigen o no existen: `/telefono`, `/derivar`, `/recuperar` → perfiles o descartados; `/biblioteca`, `/meta`, `/marca`, `/piezas` devuelven 404 sin contenido propio.

---

## Parte 5. Lo que el cerebro tenía mal o no sabía (comparado con `cerebro/03-crm-y-bots.md`)

**Errores o desactualizados**
1. Las plantillas `*_sb_*` «esperando aprobación de Meta»: **ya están APPROVED** en los 4 catálogos.
2. «No hay pantalla Laboratorio propia; la prueba está dentro de Bot IA»: el laboratorio, las versiones v1/v2 y el A/B están en `/perfiles` (sección «Conocimiento del bot»); Bot IA solo tiene el «Probar el bot real». La tabla de secciones los pone en Bot IA.
3. «Las 3 desconectadas»: la tabla decía Asesoria Vita - 2, LINEA - KOCOS MARKETING y Asesoria Vita (archivada); hoy dos activas caídas y una archivada. Correcto, pero falta decir que **Coberturas y 0 km no tienen ninguna línea Wasender** y que la caída apaga sola «Envía mensajes».
4. «La ficha del negocio no tiene precios»: cierto para la ficha, pero el prompt de Marketing contiene la **guía de precios** de los 4 packs.
5. «Presupuesto PDF tipo factura con 10 % de bienvenida»: el sistema **no genera** ni calcula nada; el equipo sube un archivo hecho afuera. Sale solo por Meta.
6. «Marketing: línea Meta MARKETING»: figura en la lista, pero **hoy no tiene acceso al número** y los envíos/respuestas automáticas del perfil están deshabilitados según el propio panel. La tabla de las líneas Meta no lo marca.
7. «Extraer negocios (Outscraper)» vs «Captación — Google Maps»: la segunda pantalla dice «API oficial de Google Maps» pero usa Outscraper. No son dos proveedores.
8. «Wasender: el límite frena el día, no la campaña»: cierto, pero falta la capa de **calentamiento** (20→40→80→150→250), el plan del día aleatorio, el freno por respuesta < 1 % y el apagado automático al caerse.
9. Modelo «Gemini 3.8 Flash (comprobar en ai_agents)»: confirmado como `gemini-3.8-flash` y sale de `GEMINI_MODEL`, no de `ai_agents`.
10. «Recomendación: contacto 2 a las 72 h»: el rango real es 48–72 h con objetivo 72, y el texto de Ajustes todavía dice «más cercana a 60 horas».
11. El cerebro cuenta «5 agentes» sin distinguir la biblioteca (`agent_library`, apagada y sin efecto) de `ai_agents` (los que responden): ver 1.1.

**No sabía (hallazgos nuevos)**
- La biblioteca de agentes está desconectada de producción (`agent_library` vs `ai_agents`).
- Una campaña = una sola línea; no hay pool de chips ni rotación entre líneas (la rotación es de textos).
- Modo prueba ON frena los seguimientos de la línea.
- Los enlaces `wa.me` de redes de Marketing apuntan al número del chip QR caído.
- «Nancy» es el nombre configurado del agente de Jurídico, no un invento (el informe de mejoras lo trata como falla).
- `hello_world` asignada como primer contacto de campaña en 0 km; `contacto_frio_vita` con «por tu consulta…» sigue asignado a 3 campañas de Jurídico; la plantilla `estudio_juridico_vita` fue usada «escrita a mano» 1.610 veces.
- Salud de Jurídico: 46 mensajes que no salieron y 12 seguimientos trabados en las últimas 24 h; 5 mensajes retenidos en cuarentena por «el modelo no respondió en 20 s».
- Roles por base casi sin uso (1 base de 12 en Jurídico, 1 de ~46 en Marketing, 0 en Coberturas, rol inexistente en 0 km).
- Tope por persona de 3 automáticos se cuenta por teléfono entre todos los perfiles.
- Los números de aviso del equipo son también «consultas directas» en Marketing: contamina métricas.
- Marketing «Ejecutar base» usa plantilla Meta, línea Meta y 150 envíos/día: depende de la línea que hoy no tiene acceso.
- Avisos web (VAPID), Metricool, Search Console y Vertex sin configurar.

---

## Parte 6. Preguntas que no se pueden responder mirando el panel

1. ¿Está `WASENDER_HABILITADO=true` en **Producción** (no solo Preview)? El panel no lo muestra.
2. ¿El número del chip QR de Marketing (…2391) es el mismo que el de la línea Meta «MARKETING»? ¿Cuál es el `PHONE_NUMBER_ID` correcto y por qué Meta dice «sin acceso»?
3. ¿Los chips VITA/Marketing/Coberturas/0 km nuevos son números que **no** están en Meta? (el panel lo valida al cargar, pero solo contra líneas con número cargado).
4. ¿Cuántas campañas Wasender históricas existen y con qué resultados? (Marketing: 0; los otros perfiles los cubre otro informe).
5. ¿Qué pasó con los 46 mensajes que no salieron y los 12 seguimientos de Jurídico (causa exacta por línea/plantilla)? Requiere ver los registros de envío y errores.
6. ¿Por qué el modelo no respondió en 20 s (límite, cuota, latencia de Gemini)? ¿Cuántos turnos se pierden por día?
7. ¿La responsable quiere que el nombre del agente sea «Nancy» (y el de Marketing, un nombre de persona) o que se presente institucionalmente?
8. ¿Quién genera hoy el PDF de presupuesto y con qué plantilla/valores (10 % de bienvenida, video < 1 min)? Está fuera del sistema.
9. ¿Cuántos prospectos de Marketing están realmente analizados vs. «sin analizar»? El panel muestra la lista pero no el total por estado.
10. ¿El latido real corre con pg_cron de Supabase (el texto lo afirma) y qué hace la «tarea externa inactiva»? No se ve desde el panel.
11. ¿Hay costo de Outscraper pendiente y crédito disponible? El panel muestra el tope por cupo, no el saldo.
12. ¿Qué versión del conocimiento ve cada conversación en producción hoy (el panel muestra «rige v2», pero con 0 conversaciones recientes en 0 km y Marketing no se puede comprobar con datos).
13. ¿Cuántos mensajes entrantes llegaron a Marketing en el último mes? Con la línea Meta sin acceso y el QR caído, ¿se están perdiendo consultas de redes?
