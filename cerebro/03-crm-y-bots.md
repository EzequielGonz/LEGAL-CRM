---
description: Cómo funciona el CRM por dentro (panel, estados, bots, captación, seguimiento, Meta y Wasender, automatizaciones)
actualizado: 20/11/2026
fuentes: Fase 2 §6, Fase 1 §6–9, .claude/referencias/reglas-comunes.md (detalle fino), docs/mejoras-1311, docs/mejoras-1411, docs/auditoria-1511
---

# CRM y bots

Detalle normativo fino (horarios, detención, fases, evidencia): `.claude/referencias/reglas-comunes.md`. Casos A01–A35: `.claude/referencias/casos-de-aceptacion.md`.

## Entrada

- Producción: **legal-crm-nine.vercel.app** (Vercel, funciones en gru1). Base Supabase São Paulo.
- **Código general** de ingreso (6 dígitos hoy; se decidió pasar a 8 el 15/11). Sin cuentas personales ni permisos por rubro. Sesión: vence a 7 días sin uso y 30 en total; intentos limitados; cierre manual y revocación de todas las sesiones.
- Primera pantalla: **Perfiles** (una tarjeta por marca). Cada perfil es un panel propio; el encabezado dice siempre dónde estás; cada perfil toma el tema de su marca (`data-tema`).
- `/telefono` y `/telefono/[perfil]` **redirigen a `/perfiles`** (`next.config.mjs`); en el celular se usa el mismo panel con barra inferior. Cumple la orden del 24/10. El código viejo de esas pantallas sigue en el repo.

## Mapa real de rutas (recorrido del 20/11)

- `/` e `/inicio` → `/perfiles` (tarjetas por perfil + panel «En vivo», que el 19/11 se pidió quitar: sale con la rama pendiente).
- **Jurídico usa rutas viejas fijas**: `/campanas`, `/agentes`, `/configuracion`, `/estadisticas`, `/agenda`, `/seguimiento`, `/bases`. Los otros tres: `/panel/{coberturas_medicas|agencia_0km|marketing}/…`.
- Compartidas con `?perfil=`: `/hoy`, `/conversaciones`, `/contactos`, `/meta/lineas`, `/wasender`, `/redes/accesos`, `/resultados`, `/salud`, `/incidencias`, `/bandeja`; detalle de chat `/inbox/[id]`.
- Menú (igual en los 4): Hoy, Chats, Contactos, Campañas · Bot IA, WhatsApp oficial (Meta), WhatsApp por QR (Wasender), Redes, Ajustes · Bandeja para Claude · Pedile algo (`/asistente`).
- Agenda, Seguimiento e Incidencias no están en el menú: son pestañas (Contactos: Etapas, Citas, Seguimiento, Por base · Chats: Activos, Todos, Descartados, Incidencias · Hoy: Resumen, Resultados, Historial, Salud).
- **No hay pantalla «Laboratorio» propia**: la prueba del bot está dentro de Bot IA («Probar el bot real»).
- Marketing tiene además pantallas sin enlace en el menú: captación, extraer, presupuestos, prospectos, consultas directas.
- Redirecciones viejas: `/revision` → Incidencias, `/comparacion-agentes` → `/agentes`, `casos-cerrados` → Chats.
- Velocidad: 0,3–1,6 s a la vista, 2–3 s completa. Más lentas: `/oportunidades` (4,9 s), `/perfiles` (4,5 s), `/limpieza` (3,8 s). Sin errores de consola ni desbordes a 1440 y 390.

## Entidades y estados

- Contacto, oportunidad, conversación, base y campaña son entidades separadas. Una persona puede tener varias consultas; una fila repetida no multiplica contactos.
- Captación: nuevo → en conversación → **captado** / perdido. Además: derivado o no derivado, seguimiento (activo, caído), atención humana, detenido / no contactar, archivado, posible captación a revisar, puntaje de interés.
- **Captado** es un evento único con evidencia de aceptación. Agendar no capta. Derivar es manual (No derivado / Derivado, fecha, destinatario opcional).
- Después de derivar: contacto previsto, contactado por el profesional, avanzó, operación concretada, no avanzó, necesita nueva gestión. Sin confirmación queda pendiente; nada se infiere del silencio.

## Secciones de cada perfil

| Sección | Qué hace |
| --- | --- |
| Hoy | Tablero de acción: a quién responder y a quién derivar ahora, captados esperando >24 h, descartes del día, estado de línea, campaña y bot. Pestañas Resumen · Resultados (embudo + «Día por día») · Historial · Salud del sistema. 19/11 sin publicar: Archivar y vista previa de la semana |
| Chats | Activos (Para cerrar, Hablando, Oportunidades reales), Descartados (Caídos, Perdidos, No contactar, Quedaron sin respuesta, Archivados), Todos los chats, Incidencias (+ Consultas directas en Marketing). Canal de entrada (Meta/Wasender) con filtro. Tomar chat / devolver al bot, fotos, audios con texto |
| Contactos | Etapas · Citas · Seguimiento · Por base (+ Prioritarios y Piden presupuesto en Marketing). Cada fila abre ficha o chat |
| Campañas | Crear desde una base: método primero (Meta/Wasender), línea, plantilla o rotación, límite diario, ritmo, días y franja, botón de entrenamiento. «Qué falta para lanzar», embudo por campaña, motivo real de pausa. Bases: importar Excel/CSV con limpieza y duplicados (>5.000 filas → bases hermanas). «Preparar con IA». Marketing: Extraer negocios |
| Agenda | Citas con disponibilidad configurable |
| Seguimiento | Contactos 2 y 3, caídos, segundo intento |
| Resultados | Embudo completo con una sola definición por cifra |
| Incidencias | Solo amenazas legales y quejas de captados |
| Salud del sistema | Latido, tiempos por etapa, fallas (envíos fallidos, línea caída, bot que no contestó, plantillas rechazadas, audios sin pasar), calidad de cada línea de Meta, Meta y Wasender separados |
| WhatsApp oficial (Meta) | Líneas (`/meta/lineas`, estado real preguntado a Meta: Conectada / Pendiente / Con problema / Token vencido / Sin acceso), plantillas y su envío a revisión, perfil de WhatsApp y redes |
| WhatsApp por QR (Wasender) | Líneas por QR, plantillas con variantes (avisa casi iguales), calentamiento y límite diario |
| Bot IA | Conocimiento por versiones (v1, v2 con fichas), informe de mejoras con Gemini, **Laboratorio** (chat, «Cómo viene cada versión», el bot de hoy con instrucciones editables e historial, Probar antes de usar, rol puntual, A/B, otros proveedores) |
| Redes | Accesos FB/IG por perfil, publicaciones con Metricool, política de contenido y cola, publicidad configurada para activar después |
| Ajustes | Horario, mensajes de voz, avisos a dispositivos, atención 24 h, marca, líneas, ficha del negocio, destinatarios de avisos |

### Por encima de los perfiles

- **Asistente general `/asistente`**: resumen de la semana (7 cifras por perfil + total, flecha contra la semana anterior), accesos y chat grande. Lee Excel/CSV (al modelo le llega resumen), arma bocetos por perfil, importa bases, crea campañas de Wasender. Desde el 20/11 guarda charlas (hasta 30, se archivan).
- **Asistente de cada perfil («Pedile algo»)**: propone cualquiera de las **77 operaciones** del catálogo y la persona confirma (un clic para lo común; confirmación reforzada para lo que escribe a personas; código de acceso para lo que enciende un bot o gasta). Lo que escriben los prospectos nunca es una orden para el asistente. Mira hasta 3 adjuntos.
- **Bandeja para Claude**: la responsable deja pedidos (perfil, texto, hasta 5 enlaces); Claude los toma cuando ella dice «ok». Estados: pendiente, en curso, en espera (>6 h sin avance), lista, descartada. Procedimiento: `.claude/referencias/bandeja-claude.md`.

## Bots

- **5 agentes**: civil, penal, coberturas, agencia 0 km, marketing. **Google Gemini** con function calling (responden, califican, consultan disponibilidad, agendan, captan). Modelo principal según Fase 1: Gemini 3.8 Flash (comprobar en `ai_agents`).
- Capas (de mayor a menor prioridad): **reglas del sistema → ficha del negocio → rol del perfil / guion de la base o campaña → conocimiento por versiones**. El conocimiento nunca reemplaza reglas.
- **Conocimiento v2** en los 4 perfiles (v1 conservada): 2 bases generales, 4 por rubro, 14 temas, 148 fichas de objeción (4 apagadas por regla fija) + 12 fichas del 14/11 (`fuente = 'mejora 14/11'`). Por turno: hasta 2 temas y 3 fichas según lo último que dijo la persona, sin mezclar rubros. Cada respuesta registra versión y fichas usadas.
- Normas verificadas en Infoleg para saber qué preguntar (no para asesorar): Ley 24.557 art. 6, 17.418 art. 46, 24.240 art. 11, 26.682 art. 10, 27.348.
- Saben si la persona viene de una campaña (preguntan si la situación sigue vigente) y no repiden datos.
- Validador de salida: precios ampliado, sin credenciales simuladas ni persona real; si preguntan si es IA, dice la verdad.
- Reconocen contestadores de otros negocios (también en otros idiomas), stickers, audios, crisis, amenazas, pedidos de supresión; circuito propio para menores (sin respuesta automática).
- Si falla la IA se reintenta. «Probar el bot real» funciona igual que el bot en vivo.
- Largo de instrucciones tras sumar palabras clave (20/11): agencia 5.592→6.108; civil 8.019→9.530; coberturas 5.837→6.504; marketing 16.308→16.881; penal 2.056 sin cambios.
- La ficha del negocio **no tiene precios, stock ni condiciones**; si se quiere que el bot los use, hay que cargarlos (y choca con «nunca da precios»).

### Qué hace el bot en cada situación

| Situación | Respuesta |
| --- | --- |
| «¿De dónde sacaron mi número?» | Disculpa, «no tenemos el registro»; queda «pidió no ser contactado» |
| Baja / «no me escriban» | Disculpa breve y se detiene; frena campañas, seguimientos y recontactos; si vuelve a escribir, atiende sin insistir |
| «Ya tengo abogado» | Una pregunta por segunda opinión; si no, se detiene |
| «Ahora no» | Mensaje corto y propone otro momento |
| «No, gracias» / «Ya compré» / «Ya lo resolví» | Insiste una sola vez con algo útil y se detiene |
| Enojo o insultos | Disculpa y corta → Perdidos / No contactar, sin incidencia |
| Amenaza o denuncia contra nosotros | Disculpa, corta, incidencia, aviso, deja de responder (en Jurídico, denunciar a un tercero es la consulta) |
| Queja de un captado | Incidencia, pasa a una persona |
| Crisis | Líneas 911, 144, 137 siempre + cartel urgente |
| Menor | Circuito propio, sin respuesta automática |
| Número equivocado | Disculpa y No contactar |
| Contestador automático | No responde |
| Audio | Lo transcribe y contesta; si no pudo, pide escribir (máx. 1 vez cada 30 min) |
| Sticker | No pide que lo escriba |
| Precio | Nunca números; explica de qué depende; en Marketing solo precio → persona |
| Pide una persona | Si hay interés → Oportunidades reales con puntaje y frase; bot en pausa en ese chat |
| Duda que no sabe | Pasa a una persona; desde el chat se le puede «enseñar la respuesta» |
| ¿Sos IA? | Dice la verdad |

## Captación por rubro

| Rubro | Se capta cuando | Límites |
| --- | --- | --- |
| Jurídico frío | Fase 2 obtiene aceptación del análisis y del contacto profesional (también si rechaza la entrevista pero acepta al profesional) | Fase 1 agendada no es captado; no garantiza indemnización ni resultado |
| Jurídico actual | Datos básicos + acepta siguiente paso profesional | Sin fases frías |
| Coberturas | Interés + acepta seguir con el asesor | Sin planes ni precios; sin excluir por edad |
| Autos | Interés + acepta el contacto del vendedor | Sin stock, cuotas ni financiación inventados |
| Marketing | Necesidad + acepta análisis, reunión o presupuesto | Solo precio → persona, no captado |

Fuera de AMBA o datos parciales: vale igual con advertencia (grupo aparte). Sin ubicación: «No informada», nunca AMBA. Después de captar se detiene la gestión comercial; si vuelve a escribir, atención humana prioritaria sin recaptar.

## Dónde cae cada persona

| Lugar | Quién |
| --- | --- |
| Para cerrar | Captados esperando el llamado (>24 h destacados en Hoy) |
| Oportunidades reales | Esperan a una persona y tienen interés, por puntaje |
| Posible captación a revisar | El bot duda si concretó una llamada |
| Quedaron sin respuesta | Escribieron hace >7 días y nadie contestó |
| Caídos | Dejaron de contestar y no respondieron al seguimiento |
| Perdidos / No contactar | Rechazo, enojo, «ya tengo abogado» tras la pregunta, equivocado, baja |
| Incidencias | Amenaza legal/denuncia contra nosotros, queja de captado |
| Fallas del sistema | Bloque aparte en Salud |

## Circuito de seguimiento

1. Primer contacto (campaña o entrante).
2. Recontacto del mismo día: 2 h + 2 h (desde 24/10), dentro de 24 h y en horario.
3. Si respondió y se estancó: **contacto 2 a las 72 h** en franja válida; antes el bot decide si corresponde.
4. Sin respuesta en **24 h → Caídos** («No respondió al seguimiento»).
5. Contacto 3 solo si respondió al 2 y volvió a estancarse; después, Caídos y base de repesca manual.
6. Nunca respondió: por Meta no recibe otro automático; por Wasender, un solo segundo intento a los 5–7 días (no sale pasados 10).
7. Descartes automáticos: último mensaje claramente negativo + 6 h sin novedades → Perdido con motivo. Un captado nunca se cierra solo.
8. Caído que vuelve a escribir → vuelve a la conversación.

**Bug conocido:** tareas en «conflicto» por programarse después del plazo de 72 h (`src/lib/contacto/reglas.ts`; 10 tareas el 16/11: 9 Jurídico, 1 Coberturas). Además falta cerrar el seguimiento al pasar a perdido o captado.

## Horarios

- Mensajes que inicia la empresa (campañas, seguimientos, recontactos, reagendas): **lunes a sábado 8–21 h Argentina**, feriados incluidos, domingos no. Se revalida justo antes de enviar (baja, atención humana, ventana, intentos, hora).
- Respuestas a quien escribe: 24 h todos los días. Asesores humanos: lunes a sábado 8–21.

## Envíos: Meta y Wasender

| | Meta (WhatsApp Cloud API oficial) | Wasender (WhatsApp por QR) |
| --- | --- | --- |
| Líneas | CIVIL, PENAL (inactiva), COBERTURAS MEDICAS, AGENCIA 0KM, MARKETING | «Asesoria Vita - 2», «LINEA - KOCOS MARKETING»; «Asesoria Vita» archivada. Las 3 desconectadas (falta escanear QR; lo hace la responsable) |
| Primer mensaje | Solo plantillas aprobadas, ventana de 24 h | Textos propios con variantes, sin botones |
| Costo | Marketing USD 0,07107 / utilidad USD 0,02990 por plantilla en Argentina; 1.000 de servicio gratis por mes por número; anuncios clic a WhatsApp: 7 días gratis | Licencia, sin costo por mensaje |
| Riesgo | Calidad de línea (baja → campañas se pausan solas y aviso). Agencia 0 km: baja desde 26/10 | Se desconecta seguido; posible bloqueo del número |
| Ritmo | Límite y ritmo por campaña | Plan del día por línea, tandas y pausas variables, texto al azar sin repetir; el límite frena el día, no la campaña |

Plantillas frías desde el 14/11: 12 ángulos por perfil (detalle en Fase 1 §8.3 y `docs/mejoras-1411/plantillas-frias.mjs`). Las que decían «por tu consulta» se dejaron (generaban desconfianza: las bases se compran y son viejas). Plantillas `*_sb_*` (sin botones) esperando aprobación de Meta.

### Las 6 líneas (pedido 17/11, sin resolver)

Quiere 6 líneas conectadas sin 6 teléfonos y sin el costo por mensaje de Meta. Se probó BlueStacks (WhatsApp exige el SMS en el mismo equipo: bloqueado). Opciones: celular en la nube (DuoPlus/GeeLark ~USD 2/equipo/mes), Android usados (descartado), emulador con SMS simulado (incierto), **pasarela propia (Evolution API o WAHA) en un servidor de USD 5–10/mes** que reemplace a Wasender. Recomendación registrada: mixta (Meta en 1–2 líneas + que el prospecto escriba primero; QR para atención con números descartables). Todo implica pago → necesita autorización.

## Automatizaciones que corren solas

Respuesta 24 h (16/10) · Seguimiento (12/11) · Caídos cada 10 min (13/11) · Recontacto mismo día (24/10) · Segundo intento Wasender (13/11) · Cierre de descartes a 6 h (13/11) · Audios a texto hasta 5 min (13/11) · Reclamos serios (13/11) · Calidad de línea (24/10) · Freno por respuesta <1 % (15/11) · Tope de 3 por persona (15/11) · Aviso de línea caída / fallas a dispositivos (13 y 15/11; ningún dispositivo activado al 20/11).

**No sale solo:** campañas con bases y publicidades.

## Latido (`campaigns-tick`)

Corre en secuencia: campañas, plantillas, seguimiento, recontacto, segundo intento, descartes, caídos, rescate, calidad de líneas, Marketing, extracciones, avisos, formularios, presupuestos, catálogo y fallas.

## Marketing en particular

Extraer negocios (Outscraper sobre Google Maps; búsqueda por rubro y zona; tope diario) → mensaje corto → si responde, la IA presenta análisis y propuesta → si acepta, «Piden presupuesto» → presupuesto PDF tipo factura con 10 % de bienvenida o video <1 min → cierre por persona. Quien nunca responde no se vuelve a contactar. Pendientes: un chat trabado en «Tomar por humano» sin pasar a «Enviar presupuesto», y **adjuntar PDF en los chats** (hoy solo fotos; hay ramas `feat/chat-adjuntar-pdf` y `adjuntos-chat-presupuesto`).

## Resultados históricos que enseñaron

- 24/10: Jurídico 44 primeras respuestas (13 «ya tengo abogado/lo resolví», 9 «¿de dónde sacaron mi número?», 5 con interés); Coberturas 36 (32 tocaron botones de baja de la propia plantilla); Marketing 65 (33 con interés). Base ART GRAVES: 304 de 320 sin respuesta.
- Se corrigió con plantillas honestas, «insiste una sola vez» y fichas de objeción. El 14/11 se arregló la confirmación post-captación que a veces no llegaba.
- **Marketing es el rubro que mejor responde.** Las bases compradas y viejas rinden poco: 28 captados sobre ~12.700 contactos.
