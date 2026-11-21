# H · Recorrido del panel como lo usa el dueño (producción, sábado 21/11/2026, ~06:45)

Solo lectura. Entré con el código por variable de entorno (no quedó escrito en ningún lado) y recorrí `legal-crm-nine.vercel.app` perfil por perfil. Esta vez **leí conversaciones**: abrí 86 chats: 39 de Jurídico (Civil, tres de ellos por Wasender), 15 de Coberturas, 14 de Autos 0 km y 18 de Marketing. Todos por `/inbox/[id]`, sin tocar «Tomar el chat», «Marcar…», «Derivar», «Reanudar» ni nada que guarde.

Qué sí toqué, para que se sepa: abrí desplegables y la fórmula «Preparar una campaña» (sin crearla), expandí «Personalizar ritmo», y en **un** chat tildé a mano las casillas de «Datos para pasarle a quien lo atiende» para ver el texto que sale (es una vista previa del navegador; el panel dice que copiar o compartir no cambia nada). No puedo asegurar que abrir un chat no lo marque como leído por el lado del panel.

En este informe no hay nombres, teléfonos, mails ni DNI. Cuando cito al bot o a un prospecto va sin nombre. Los guiones y capturas con datos personales quedaron fuera.

**Aviso de fechas:** casi todos los chats de Coberturas, Autos y Marketing son de octubre y principios de noviembre (esos perfiles no envían desde el 22/10–02/11). Los de Jurídico son de septiembre a ayer (20/11). Varias cosas que el cerebro dice «arregladas» se arreglaron entre medio, así que al citar un comportamiento pongo la fecha del chat.

---

## 1. Campañas y bases

### 1.1 Días y horario de envío (el dueño dice lunes a sábado de 8 a 21 h)

**Confirmado, y se ve en cuatro lugares:**

1. **Ajustes → «Agenda, disponibilidad, horarios y excepciones» → «Horario de atención · todos los perfiles»** (está plegado, hay que abrirlo). Texto fijo, no editable: «Campañas, seguimientos y reagendamientos salen de lunes a sábado de 8 a 21 (nunca de noche ni en domingo)». También dice: respuesta del bot 24 h todos los días; asesores humanos lunes a sábado 8–21; fuera de horario «igual se capta» y se deja agendado el llamado para el próximo horario hábil.
2. **En cada campaña**, la línea de «Listo / Falta»: «Destinatarios: N · envía de lunes a sábado, de 8 a 21 h».
3. **En cada campaña**, el selector «Días de ejecución» (Lun–Sáb, sin domingo). Con ningún día marcado vale «lunes a sábado». Ninguna de las campañas que abrí tiene días marcados a mano.
4. **En Seguimiento**, el texto de la ruta: «en horario (lunes a sábado de 8 a 21)».

**Matices que el cerebro no tiene:**
- **Marketing → «Prioritarios»** (primer mensaje automático a negocios ya analizados) dice **«de 9 a 20 hs»**, no 8–21. Está «apagado» hoy.
- Una campaña de Marketing figura **pausada con motivo «domingo»** (Aberturas y Carpinterías, última actividad 02/11). Es decir, una pausa por domingo que después nadie levantó. Hoy además tiene la línea sin acceso (ver 1.4).
- Lo que se **ve en los datos**: en noviembre Jurídico mandó primeros mensajes solo martes a viernes (10–13/11: 30, 51, 22, 149; 17–20/11: 144, 44, 61, 136). **Ningún lunes ni sábado** de noviembre salió nada, y ningún domingo. No es el sistema el que se limita: las campañas las lanza la responsable a mano, y las lanzó en esos días. El panel no muestra ninguna programación automática de «arrancá el lunes a las 8».
- En la tanda del 20/11 los primeros mensajes salieron entre ~11:24 y 16:31 (los que alcancé a ver). Todo dentro de 8–21.

### 1.2 Tope, tandas, ritmo

- **Tope diario por campaña** («Máximo de mensajes por día», editable aun en curso, placeholder «Sin límite propio»). Valores de las 11 campañas donde leí el campo: 50, 80, 100, 150, 200 (la más común), 300; dos de Marketing sin tope.
- **Ninguna campaña está en «modo entrenamiento»** (dice «Sin modo entrenamiento (ritmo elegido a mano)» en todas).
- **Modo entrenamiento (al crear):** viene tildado por defecto: 20 por día durante 7 días, lotes de 5, esperas largas; «al día 7 te pedimos el resultado para decidir si subir; nada se sube solo». Valores precargados en «Personalizar»: **90–300 s entre mensajes, 5 por lote, 900 s de pausa entre lotes, 20 por día.**
- **Ritmo por defecto sin entrenamiento** (texto del panel): cada mensaje espera al azar **50–200 s**, hasta **10 por lote**, **pausa de 5 min** entre lotes; «se parece a una persona mandando a mano»; corre solo en segundo plano, no hace falta dejar la pantalla abierta.
- **Lo que se vio en la práctica (Meta, 20/11):** un primer mensaje cada 2–5 minutos, irregular (16:12, 16:16, 16:18, 16:20, 16:23, 16:28, 16:31…). 136 en el día.
- Wasender: el límite diario y las tandas se ven en las pantallas de Wasender (las cubre otro agente). En la campaña de Wasender solo aparece «Máximo de mensajes por día» y la plantilla «Al azar entre las 12 plantillas de inicio (677 textos)».

### 1.3 Método, línea, plantilla

- Al crear, **lo primero es «¿Por dónde sale?»**: WhatsApp oficial (Meta) o WhatsApp por QR (Wasender). Se puede cambiar después **mientras no esté en curso**; los destinatarios no cambian al pasar de uno a otro.
- Campos: Base (o «elegir después»), Nombre, **Línea** (Meta: «CIVIL» en Jurídico; «Asignar después» deja la campaña en borrador y no se puede lanzar), **Plantilla del catálogo de la línea** (solo aprobadas por Meta y asignadas a la línea para campañas), **Rol del bot en esta campaña** (pisa al de la base; Jurídico tiene «Accidente laboral / ART», Coberturas «Obra social · venta consultiva», Marketing «Venta consultiva con cierre humano»), y el recuadro de entrenamiento.
- «Crear campaña (no envía nada)». Lanzar es otro paso: «Lanzar campaña…» con confirmación. Todo coincide con «las campañas las lanza la responsable».
- **«Falta antes de lanzar»** funciona como lista de verificación real (línea archivada, línea sin acceso, calidad baja, etc.).
- **Todas las campañas que existen salieron por Meta**, salvo una prueba por Wasender (Jurídico, «ART – TEST WASENDER», 81 enviados de 1.232, 3 respuestas; pausada el 12/11 porque la línea se desconectó, el 13/11 13:52 según Salud).

Plantillas que vi con texto:
- Jurídico `jur_base_fria_a`: «Hola [Nombre], soy [agente], del Estudio Jurídico VITA. Nos dedicamos a revisar accidentes laborales con ART: muchas personas cobran menos de lo que les corresponde o reciben el alta con secuelas. ¿Tuviste algún accidente de trabajo en los últimos años?». No menciona fracturas ni lesión.
- Coberturas `cob_recupero_a`: «…Hace un tiempo consultaste por tu cobertura médica. ¿Te interesa que revisemos alternativas…?» (afirma una consulta previa; ver 2.2).
- Autos `autos_base_fria_a`: «…Ayudamos a conseguir 0 km con financiación y entrega rápida. ¿Estás pensando en cambiar el auto este año?».
- Marketing `mkt_apertura_propuesta`: «Hola, ¿cómo estás? Soy [agente], de Kocos Marketing. Tengo una propuesta para tu negocio. ¿Tenés cinco minutos para que te cuente?».
- Wasender (Jurídico, 11/11): «Hola, [APELLIDO NOMBRE completo tal cual viene en la base]. ¿Cómo estás? Soy Nancy, del equipo de Estudio Jurídico VITA. Te escribo por una consulta que realizaste anteriormente relacionada con un accidente laboral… Respondé: «Mi caso ya esta resuelto» o «Mi caso esta pendiente»». Dos defectos visibles: saluda con el nombre invertido y completo, y afirma una consulta previa.

### 1.4 Campañas existentes y resultados (cada una abre su página con embudo)

Cada campaña muestra: Prospectos, Pendientes, Con envío, Respondieron, Sin respuesta, Seguimiento, Caídos, Cierres; «Tasa de respuesta» (respondieron / con envío) y «Cierres sobre respuestas»; «N mensajes enviados en total (plantillas y respuestas) · N envíos fallidos · N destinatarios detenidos»; «Última actividad»; tabla de destinatarios filtrable (Todos, Pendientes, Con envío, Respondieron, Fallidos, A revisar) con estado Leído/Entregado/Falló. Si hubo fallas, un bloque **«Por qué fallaron los envíos»** agrupa por código de Meta con causa y qué hacer.

| Perfil | Campaña | Estado | Enviados / total | Fallaron | Respondieron | Cierres |
|---|---|---|---|---|---|---|
| Jurídico | Graves 1911 (19–20/11) | Finalizada | 136/182 | 46 | 10 | 2 |
| Jurídico | ART GRAVES 13/11 | Finalizada | 251/378 | 127 | 20 | 1 |
| Jurídico | GRAVES META 12/11 | Finalizada | 169/192 | 23 | 20 | 3 |
| Jurídico | ART TEST WASENDER 10/11 | Pausada (QR caída) | 81/1.232 | 4 | 3 | 0 |
| Jurídico | ART Graves 29/10 | Finalizada | 146/163 | 17 | 18 | 4 |
| Jurídico | ART Graves – Reactivación | Pausada auto (calidad baja de CIVIL) | 335/542 | 15 | 39 | 5 |
| Jurídico | ART GRAVES FRIO | Finalizada | 97/140 | 43 | 14 | 0 |
| Jurídico | ART GRAVES | Finalizada | 203/320 | 117 | 16 | 0 |
| Coberturas | Obra Social Frío – Oct | Finalizada | 285/381 | 96 | 72 | 0 |
| Coberturas | Recupero OSS | Finalizada | 174/246 | 72 | 8 | 0 |
| Coberturas | obrasociaal | Pausada (error 131042: problema de pago de la cuenta de WhatsApp Business) | 60/446 | 125 | 3 | 0 |
| Coberturas | Campaña Social – Oct | Pausada (motivo mostrado: «ad») | 2/237 | 45 | 0 | 0 |
| Autos | 24/10 0km | Pausada auto (calidad baja de AGENCIA 0KM) | 383/1.763 | 115 | 63 | 4 |
| Autos | Asesoramiento | Finalizada | 133/133 | 0 | 2 | 0 |
| Marketing | Aberturas y Carpinterías – Oct | Pausada («domingo»; línea «sin acceso al número») | 347/585 | 162 | 140 | 4 |
| Marketing | Envío masivo 23/10 #3 | Finalizada | 172/318 | 146 | 65 | 0 |
| Marketing | Base 20/10 – 50 contactos | Finalizada | 228/356 | 128 | 61 | 0 |
| Marketing | Base #2 | Finalizada | 2/8 | 6 | 1 | 0 |

Lecturas:
- **Los fallos son enormes**: de ~25 % (Graves 1911) a más del 90 % (Campaña Social de Coberturas: 45 fallos de 47 intentos) de los intentos. Los códigos de Graves 1911: 131026 «no entregable» (34), 131049 «Meta limitó por experiencia del usuario» (8), 130472 «número dentro de un experimento de Meta» (4). En las bases compradas muchos números no tienen WhatsApp.
- **Solo Jurídico envió esta semana.** Última actividad: Coberturas 02/11, Autos 26/10, Marketing 02/11. Tres de los cuatro perfiles están parados desde hace 19–26 días.
- Estado de las líneas Meta hoy (en «Hoy»): CIVIL calidad alta, COBERTURAS calidad alta, **AGENCIA 0KM calidad baja**, **MARKETING «sin acceso al número»** (el token no encuentra el identificador del número). La pausa por pago de Coberturas figura en la campaña, pero Hoy la muestra como «calidad alta».
- «Agendados» en la lista de campañas se llama «Cierres» en el detalle; en Jurídico son captados, no citas (ver 4.5: **0 citas en los cuatro perfiles**).

### 1.5 Bases: cómo se carga y qué columnas tienen

- **Cómo se carga:** `Campañas → Bases → «Cargar una base»` (CSV o Excel) o, dentro de una campaña, «O cargar una base nueva (CSV o Excel) / Elegir archivo». En mi sesión el botón «Cargar una base» de la pantalla Bases **no abrió nada visible** (sin selector de archivo ni formulario); no lo pude comprobar más sin subir un archivo. La carga desde la página de campaña sí muestra el selector.
- «Cargar una base nunca envía mensajes; el archivo original queda guardado sin modificar» (hay «Descargar archivo original»). Después hay que sumar contactos a una campaña aparte, con confirmación.
- **Informe de carga** de cada base: «182 nuevos + 2 duplicados + 0 inválidos = 184 (coincide con las 184 filas)»; desglose en repetidos dentro del archivo / ya en bases anteriores / contactos existentes / filas a corregir (sin teléfono, quedan guardadas con su motivo) / ya contactados antes / teléfono detenido / nombre distinto al del contacto existente.
- **«Calidad de la base»**: contactados, respondieron (%), detenidos y cuatro contadores sobre quienes respondieron: **números equivocados** (3 de 11, 27 %), **consultas negadas**, **contestadores automáticos**, **desconocido**.
- **Vista de planilla** con filtros por estado (Todas, Nuevos, Repetidas en el archivo, En bases anteriores, Contactos existentes, Requieren corrección, Teléfono a revisar, Contactados antes, Detenidos, Conflictos).
- **Columnas por rubro:**
  - **Jurídico (lista tipo SRT/ART):** CUIL, SEXO, MOVIL 1, 2 y 3, DOMICILIO, LOCALIDAD, PROVINCIA, ASEGURADORA, **DIAGNOSTICO**, CODIGO POSTAL, APELLIDO Y NOMBRE, FECHA DE NACIMIENTO. Son datos de salud y de identidad. El diagnóstico (p. ej. «Fractura del peroné solamente», «Contusión de la cadera», «Efectos del ruido sobre el oído interno») se copia al chat como dato; el panel **no clasifica la gravedad**.
  - **Coberturas:** solo NOMBRE y TELEFONO; las demás columnas aparecen como `__EMPTY` (el Excel tenía columnas sin título).
  - **Autos:** MARCA, NOMBRE, TELÉFONO, CIUDAD / UBICACIÓN, MODELO / PUBLICACIÓN.
  - **Marketing (Google Maps / «Extraer negocios»):** NOMBRE, RATING, TELEFONO, DIRECCION, SITIO_WEB, CATEGORIAS, GOOGLE_PLACE_ID, CANTIDAD_RESENAS. Ya viene sin archivo, con fecha de extracción.
- **Bases que hay:** Jurídico 12 (todas Civil; de 141 a 1.489 filas; respondieron 0–39 de los contactados), Coberturas 4 (246–446 filas), Autos 2 (una de 2.171 filas con 409 duplicados, otra de 1), Marketing 11 (dos de ~500 filas y nueve de 11 por ciudad). Hay tres bases «ART GRAVES» idénticas de 320 filas cargadas el 19/10 (dos con 0 contactos nuevos): duplicados de carga que quedaron.
- **Penal no tiene nada**: «Civil: 7.852 · Penal: 0 oportunidades», ninguna base ni chat Penal. La línea PENAL no figura en esta recorrida.
- Detalle menor: la fecha de carga de «GRAVES 1911» aparece como 19/11 21:41 en el listado y 20/11 12:41 en el detalle; una de las dos está corrida.

---

## 2. Chats: qué se ve y qué hace el bot de verdad

### 2.1 La pantalla (igual en los cuatro rubros)

- **Chats → Activos**: Para cerrar (captados), Te escribieron, Oportunidades reales, Hablando ahora, Posible captación a revisar, Agendaron. En Jurídico hoy: 15 / 6 / 3 / 7 / 0 / 0.
- **Todos los chats** (`/inbox`): Jurídico tiene **3.421 conversaciones**, 40 por página. Filtros: base, respuesta (Respondieron / Sin respuesta), rubro (Civil / Penal), canal (WhatsApp todos / Meta / Wasender / Instagram / Facebook / Landing) y atención (Requiere atención humana / Atención humana en curso / Gestionado por IA / Detenidos).
- **Descartados**: Caídos (J 40, C 27, M 168), Perdidos (J 79, C 1, M 66), No quieren que les escriban (J 63, C 58, M 27), Quedaron sin respuesta (C 1, M 1). Autos: no tomé el total. Más «el 13/11 se reubicó a cada persona según lo que dice su chat».
- **Dentro de un chat**: la conversación (con «Agente IA», «Admin» para lo que escribe una persona del panel, «Leído/Entregado/No entregado» y el código de Meta si falló) y a la derecha: **Etapa**, **De dónde vino** (campaña y base), **Qué sigue**, **Quién atiende** (El bot / Una persona del equipo / Nadie: detenido), botones (Tomar el chat, Marcar como captado/derivado, Cerrar como perdido, Seguimiento completado/caído, No escribirle más), **Datos para pasarle a quien lo atiende**, **Archivos que mandó**, **Qué pasó con esta persona** (línea de tiempo con cada cambio de etapa y quién lo hizo: «El bot», «El sistema») y **Datos recopilados por la IA**.
- Hay **dos vocabularios de estado a la vez**: en el encabezado del chat («Nuevo», «En conversación», «Calificado», «No califica», «Esperando prospecto», «Cerrado (ganado)», «Cerrado (perdido)») y en la «Etapa» del panel («Respondió», «Captado: falta derivar», «Espera a una persona», «Perdido», «Detenido», «Derivado»). No siempre coinciden: un captado al que escribió «no me contacten» figura como «Cerrado (ganado)» en el encabezado y «Espera a una persona» en la etapa. «Ganado» sin venta confunde.

### 2.2 Jurídico (Civil) — 39 chats leídos, de 09/2026 a 20/11

**Cómo se presenta.** Hoy el bot arranca con el nombre de pila sacado de la base («Hola [Nombre], buenas tardes…») y se presenta con nombre propio de persona: si le preguntan «¿quién sos?», contesta «Soy Nancy, asesora del Estudio Jurídico VITA. Nos especializamos en reclamos por accidentes laborales y ART». En los chats de septiembre (flujo viejo) decía «Soy el asistente virtual del estudio jurídico» y mandaba un **cuestionario numerado de 4 preguntas** (¿hace cuánto?, ¿dónde?, ¿qué lesión?, ¿qué día y horario?) y cerraba «un profesional se va a estar contactando». Esos dos chats de septiembre siguen en «Atención humana» hace dos meses.

**Qué pregunta y cómo califica (patrón estable en noviembre).** Responde en 5–15 segundos y hace **una pregunta por mensaje**:
1. «¿Tuviste algún accidente de trabajo / seguís con molestias / te dieron el alta?»
2. «¿Llegaste a cobrar la indemnización? ¿hace cuánto fue?»
3. «Para ver tu caso puntual, ¿te parece que un abogado del equipo te pegue una llamada rápida de 5 minutos? No tiene costo. ¿Te queda mejor a la mañana o a la tarde?»
4. Si la persona dice «mañana», «a la tarde», «ok», «sí» o «cuando quieran»: **«Perfecto, ya quedó registrado. Un profesional del estudio se va a comunicar con vos desde este mismo número o uno alternativo del estudio…»** → pasa a **captado** y el chat queda «de una persona».

Califica con **2 o 3 preguntas**, a veces ninguna (un «Si» alcanza). Si la persona no contesta, hace el recontacto del mismo día a las ~2 h y ~4 h («cuando tengas un ratito contame…», «te dejo un saludo y quedo a disposición»).

**¿Detecta la gravedad de las lesiones (fracturas)? No.**
- Ninguna de las 39 conversaciones tiene una pregunta sobre fractura, cirugía, yeso, internación, días de reposo o porcentaje de incapacidad. Pregunta por alta, secuelas e indemnización, no por qué lesión fue ni cuán seria.
- En «Datos recopilados por la IA» el campo `diagnostico` **viene de la base** (columna DIAGNOSTICO), no de lo que dijo la persona. Aparece como dato aunque en la charla nunca se habló de eso. Solo vi **una** vez de 39 que el bot use el diagnóstico de la base en la conversación («¿te quedaron secuelas o molestias en el ojo?»).
- Lo que la persona cuenta queda en otro campo (`lesion o problema de salud`) en texto libre. No hay un campo ni una etiqueta «grave / leve» en ninguna pantalla, filtro o ficha.
- Las bases se llaman «GRAVES» y «Lesiones graves fracturas completas», pero lo que trae el diagnóstico es muy mixto: fracturas (peroné, calcáneo, columna lumbar, cuello de fémur, metatarso), y también distensión muscular, cervicalgia, quemaduras de menos del 10 %, tenosinovitis, esguinces, hipoacusia por ruido, «contacto con enfermedades transmisibles» y «herida de la cabeza». La campaña no filtra por gravedad.
- Resultado en los 14 captados que leí: desgarro muscular grado 1 (dos veces en la misma persona), epicondilitis, secuelas psicológicas, un siniestro vial con **solo daños materiales** (fuera de ART), una persona **indemnizada hace 10 años** cuya ART cubre hoy una cirugía por complicación, traumatismo de ojo (dos, según la base), quemadura leve (según la base), esguince de dedo del pie, golpe en el estómago con alta no notificada, cefalea con mareos, una lesión lumbar que la SRT dictaminó sin secuelas y uno sin lesión especificada. Solo en un caso aparece algo de tipo fractura/cirugía (la complicación de una osteosíntesis de hace 10 años). Ningún captado contó una fractura reciente.

**Evidencia que queda al captar.** En Resultados se lee «**Lo captó el bot · [última frase de la persona]**» (ej. «Si», «Ok», «Ahora estoy disponible», «A la tarde si puede ser», «Sí no hay problema», «si quiere que me llame yo no tengo drama»). En la línea de tiempo del chat: «Etapa: captado · El bot · [frase]» y «Quién atiende: requiere humano · El sistema · Mensaje posterior de una persona captada». O sea que **la «evidencia de aceptación» es la última palabra de la persona**, a veces un monosílabo; no se guarda un resumen ni la oferta a la que contestó.

**Cómo maneja lo difícil (bien):**
- «Ya tengo abogado/a»: una sola pregunta de segunda opinión sin costo; si la persona dice «no gracias» o «ya firmé el contrato», se despide, queda **«Detenido · Ya tiene abogado»** y no se le escribe más.
- «¿De dónde sacaron mi número?» / «dejen de molestarme»: «Te pido disculpas… desde acá no tengo el detalle de cómo nos llegó tu contacto, pero ya registré tu pedido y no te vamos a volver a escribir». Queda detenido «Pidió no ser contactado». Con amenaza de denuncia: detenido por «Enojo» + incidencia («Amenaza o denuncia») ✓.
- «Número equivocado», «es mi mujer, te paso el de él»: se disculpa y detiene («Número equivocado»).
- «¿Qué % se quedan?»: «lo explica el abogado en la llamada». No da cifras ✓.
- Audios: **desde el 19/11 transcribe y contesta bien** (un audio largo sobre una revisión de la ART de dos meses fue respondido coherentemente). Antes (29/10 y 13/11) respondió «no puedo escuchar audios» aunque hoy el panel muestra la transcripción de ese mismo audio.
- Da información legal general sin citar normas: «los accidentes in itinere están cubiertos por la ART», «lo que se evalúa ante la Comisión Médica es el porcentaje de incapacidad», «las secuelas psicológicas derivadas de un hecho laboral sí se pueden evaluar».

**Respuestas malas o riesgosas que encontré:**
1. **Captado falso por mensaje automático/ambiguo (20/11).** Un mensaje de «licencia médica, contactarse a este teléfono/mail» fue contestado con «ya quedó registrado, un profesional va a comunicarse» y quedó **captado**. Minutos después la misma persona escribió «No. Por el momento que no me contacte nadie. No requiero el servicio»; el modelo **no respondió en 20 s**, el sistema lo contó como falla de IA, y el chat sigue en «Para cerrar» y en «Captados para derivar», con el encabezado «Cerrado (ganado)». Es uno de los 4 captados de «esta semana».
2. **Captados sin caso**: indemnizado hace 10 años; siniestro vial solo con daño material; desgarro grado 1. El bot capta sin chequear si hay algo reclamable.
3. **Mensajes duplicados**: dos despedidas idénticas en 4 segundos (20/11).
4. **Estado equivocado**: «Esperando prospecto»/«El bot atiende» cuando quien escribió fue un contestador de otro negocio o un sticker; esos chats aparecen en «Atención humana» como si hiciera falta contestar.
5. **El modelo falla por tiempo**: 5 eventos del 17 al 20/11 con «El modelo no respondió en 20 segundos» (Incidencias → Mensajes retenidos). Entre ellos un «no estoy interesada», un «ya me recuperé, de ser necesario me contactaré», el «es mi nieta», un «número equivocado» y el caso 1. Algunos igual recibieron respuesta; otros no.
6. **Wasender (11/11)**: «Hola, [APELLIDO NOMBRE completo]… por una consulta que realizaste anteriormente» (las bases son compradas). Las tres respuestas fueron «ya está resuelto» / «ya tengo abogado» y los tres quedaron perdidos con el chat «de una persona», sin respuesta.
7. Hay un captado «escribió por su cuenta» (sin campaña) del 27/10 que no leí y que, por el nombre y la fecha, parece el mismo chat de prueba del equipo que veo en Marketing. No lo confirmé.
8. **Nombre de persona**: «Nancy» (Jurídico, Coberturas y también en Autos, «Hola Nancy») y «Leonardo Gonzalez» (Marketing). No encontré ningún chat donde alguien pregunte «¿sos un bot?», así que no pude ver qué responde.

### 2.3 Coberturas médicas — 15 chats leídos (22/10 al 13/11)

- **Presentación:** «¡Hola! Soy Nancy de Compara tu Obra Social. Comparamos coberturas médicas para ayudarte a pagar menos o encontrar mejores prestadores. ¿Hoy tenés alguna obra social o prepaga, o estás sin cobertura?».
- **Flujo:** obra social/prepaga actual → «¿solo para vos o para sumar a tu grupo familiar?» → «un asesor te llama 5 minutos con las opciones ya comparadas, ¿a la mañana o a la tarde?» → «Ya le paso tus datos al equipo y un asesor se va a comunicar con vos».
- **¿Detecta grupos familiares? Sí, los pregunta y los guarda** como dato «titular o grupo familiar» («Titular y 2 hijas», «Grupo familiar»). Pero **no pide la composición fina**: no pregunta cuántos son, edades, ni si hay aportes/relación de dependencia/ingresos. Sí guarda «prestador preferido» (ej. Hospital Británico), «obra social actual» y «franja horaria». Los dos captados son de ese estilo.
- **Mal (octubre):** ante «¿quién sos?/mentira, yo no consulté» el bot respondió que «los contactos los administra el equipo de marketing y suele figurar por una consulta que entró por redes sociales o internet (Facebook, Instagram o formularios web), a veces de hace un tiempo». **Inventa un origen** que el cerebro prohíbe, y la plantilla `cob_recupero_a` ya decía «hace un tiempo consultaste». Resultado en esos chats: «ya te denuncié», «no me escriban más».
- **Mal:** conversa con **contestadores y menús de otros negocios** (bucles tipo «elegí una de las opciones… superaste los intentos»), contesta «no puedo escuchar audios» tres veces a un mensaje «unsupported», y a un afiliado que preguntaba por su obra social lo dejó detenido como «número equivocado».
- **Bien:** una sola insistencia tras «ya tengo cobertura» («podemos compararte sin costo si podés pagar menos») y corte tras el segundo «no»; «No me escriban más» → «no te vamos a escribir más» y detención inmediata.
- Cifras: 89 respondieron de 521 contactados (17,1 %), 30 conversaron, **2 captados** (ambos de octubre), 0 derivados.

### 2.4 Autos 0 km — 14 chats leídos (24–26/10)

- **Flujo:** saludo → «¿qué modelo o tipo de 0 km tenés en mente?» → «¿al contado, financiado o entregando un usado?» → «¿qué auto tenés, marca, modelo y año?» → «¿te escribe un vendedor por acá o te llama? ¿mañana o tarde?» → «Ya le paso tus datos a un asesor». Datos que guarda: forma de pago, vehículo buscado, vehículo para entregar, canal preferido, franja horaria.
- **Afirma cosas que la ficha no sustenta**, justo lo que el cerebro dice que no pasa («sin stock, cuotas ni financiación inventados»): «Trabajamos con todas las marcas de 0 km (Fiat, Volkswagen, Toyota, Renault, Peugeot, Chevrolet, Ford…)», «hay opciones de financiación muy accesibles», «**Sí, contamos con opciones de financiación solo con DNI**», «Tomamos modelos de varios años… se tasa re bien», «Bicis por ahora no tomamos, solo autos usados», «No hay inconveniente con la distancia» (a alguien de Chubut cuando la ficha dice AMBA). Tono informal: «¡Un caño la Berlingo!», «¡Qué nave!».
- Un captado dijo «en realidad no tenía en mente cambiar mi auto…», preguntó marcas y cerró con «ok, fale»: **captado con interés flojo**.
- **Mal:** a un sticker respondió «no puedo escuchar audios…» (26/10); mensajes de cierre dobles; **la ubicación del captado salió del código de área y quedó mal** (la ficha dice una provincia, la persona había dicho otra), así que el «Barrio» que se le pasa al vendedor no usa lo que la persona contó. No vi que use las columnas MARCA y MODELO de la base.
- **Bien:** el humano tomó un chat y mandó una foto de una SUV; «No gracias» → una insistencia y corte; «prefiero que me borren» → «ya registré tu pedido».
- Cifras: 67 respondieron de 516 contactados (13,0 %), 33 conversaron, **4 captados, 0 derivados**. Los cuatro esperan desde el 24–26/10.

### 2.5 Marketing — 18 chats leídos (21/10 al 06/11)

- **Presentación:** «Soy Leonardo Gonzalez, de Kocos Marketing» y habla del negocio con **datos reales de Google Maps** (reseñas, fotos, sitio web, horario): «estuve mirando la ficha de ustedes… hoy figura con una sola foto, sin horarios y sin web propia». Pregunta cómo les llegan las consultas (boca a boca / redes) y ofrece «una propuesta con presupuesto».
- **Califica y guarda mucho más:** zona, rating, dirección, sitio, rubro, **«sales intent score»** (10 a 65), «problema confirmado», «servicio buscado», objeción principal. Al aceptar: «Ya le pasé los detalles al equipo técnico… va a estar listo en menos de 24 horas».
- **Presupuesto**: cuando preguntan «¿de cuánto estamos hablando?» no da cifra y pasa a una persona; la persona (Admin) mandó el **PDF y un video** por el mismo chat en ~2 horas.
- **Mal:** **contesta a respuestas automáticas de otros negocios como si fueran personas** («Dale, no hay problema, entiendo que es un mensaje automático»), con mensajes duplicados, y entra en bucles con menús («elegí una opción… superaste los intentos»). Ante un contestador que daba el mail de «la encargada de marketing» respondió «ya le escribimos a la encargada a ese correo»; no vi evidencia de que ese mail se haya enviado. Un captado dijo «dale pasame por acá» el 27/10 11:18 y **nadie le contestó en 25 días** aunque el chat figura «Quién atiende: El bot» y captado.
- **Chats de prueba mezclados:** un chat del propio equipo (charla casual con Admin y un «soy número destinatario») aparece en Hoy como **«Oportunidad real · escribió 7 veces»**.
- Cifras: 271 respondieron de 749 contactados (**36,2 %**), 105 conversaron, 7 captados, 5 derivados, 0 ventas, 93 perdidos.

---

## 3. Captados: cómo se ve uno y qué trae para pasárselo al profesional

**Dónde aparecen:** Hoy → «Captados para derivar» (con «Más de 24 h» y los botones Derivar / Responder / Chat); Chats → Activos → «Para cerrar»; Resultados → «Captados»; Contactos → Etapas → «5. Captados»; y la **ficha** (`/ficha/[id]`), que repite el panel derecho del chat.

**Cómo se ve:** nombre, teléfono, DNI (Jurídico, sale de la base), y en el panel: Etapa («Captado: falta derivar» o «Espera a una persona»), **De dónde vino** (campaña y base, o «Escribió por su cuenta»), **Qué sigue**, **Quién atiende** (una persona del equipo, el bot se calló), botones «Marcar como derivado», «Cerrar como perdido», «No escribirle más», y la línea de tiempo («Qué pasó con esta persona»).

**«Datos para pasarle a quien lo atiende» (lo que el dueño copia y manda por WhatsApp):**
- Es un desplegable con **casillas, todas destildadas por defecto**. Sin tocar nada, el texto que sale son **tres líneas**: `Nombre y apellido`, `Barrio`, `Teléfono`. Nada de qué le pasó, qué se le prometió ni cuándo llamar.
- Hay que **tildar a mano cada campo** para sumarlo. Tildando todo sale una lista `Campo: valor`, sin encabezado ni resumen. Ejemplo real de un captado de Jurídico: Nombre, Barrio, Teléfono, DNI/CUIL, Área: Civil, Diagnóstico, Situación de alta ART, Tiempo desde accidente, Lesión o problema de salud, Disponibilidad para reunión.
- Campos disponibles por rubro:
  - **Jurídico:** DNI/CUIL, Área, Diagnóstico, Situación/alta ART, Tiempo desde accidente, Lesión o problema de salud, Disponibilidad para reunión; según el caso también Hechos, Cobertura ART, Empleo actual, Estado actual, Contacto alternativo, Domicilio, Secuelas, Indemnización ART, Aseguradora, Tipo de consulta.
  - **Coberturas:** Email, Área, Franja horaria, Prestador preferido, Obra social actual, Titular o grupo familiar.
  - **Autos:** Área, Forma de pago, Canal preferido, Vehículo buscado, Vehículo para entregar, Franja horaria.
  - **Marketing:** Área, Rating, Dirección, Sitio web, Rubro buscado, Servicio buscado, Rubro del negocio, Sales intent score, Problema confirmado, Segmentos de público, Objeción principal.
- Botones **Copiar** y **Compartir…**. Texto del panel: «Copiar o compartir no cambia nada. Cuando se lo hayas pasado, tocá «Marcar como derivado»». O sea que **pasárselo al abogado, asesor o vendedor es 100 % manual**; el panel no manda nada al profesional ni tiene (que yo vea) un destinatario por rubro cargado. No probé «Derivar» (guarda).
- «Barrio» no es un barrio: en Jurídico es la localidad que vino de la base o lo que dijo la persona (a veces entre paréntesis, «(Lomas de Zamora)»), en Autos y Marketing es provincia o ciudad, en Coberturas queda «—» con el cartel «Falta: barrio. Se puede compartir y derivar igual». En Autos una vez quedó la provincia equivocada.
- **«Falta: …» es una lista fija, no lo que realmente falta.** En captados con lesión, tiempo y alta ya cargados sigue diciendo «Falta: relato, lesión, lugar del accidente, denuncia, ART, asistencia, alta o tratamiento». En Marketing, «Falta: negocio, necesidad, sitio web o redes» aunque «Datos recopilados» ya tiene negocio, sitio y problema.
- Para que el profesional entienda el caso hay que **leer el chat**: el desplegable no trae la frase de aceptación ni la franja pedida con claridad (viene como «disponibilidad para reunión: A la tarde» sin día).
- **Cuánto esperan hoy sin derivar:** Jurídico 15 (13 con «Más de 24 h»; el más viejo, 27/10, hace 25 días), Autos 4 (24–26/10), Coberturas 2 (24 y 29/10), Marketing 2 (27/10). Son 23 personas. Derivados en total: 7 (Jurídico 2, Marketing 5), **ventas concretadas: 0 en los cuatro perfiles**, y 7 derivados siguen «Sin resultado registrado».

---

## 4. Seguimiento, Incidencias, Resultados, Hoy y Contactos

### 4.1 Hoy (lo primero que mira el dueño)

Pestañas: Resumen · Resultados · Historial · Salud del sistema. El Resumen de Jurídico, de arriba abajo:
- Aviso fijo para cambiar el código de ingreso (6 → 8 dígitos) y «1 problema(s) frenan la operación».
- Saludo, fecha y la frase «**13 personas captadas esperan el llamado hace más de 24 horas**».
- **Tablero de hoy:** línea CIVIL (calidad alta), campaña pausada (con motivo), «Bot · 37 de 100 en captación y trato» (el significado de «37 de 100» no está explicado), Wasender desconectada («hay que escanear el QR»).
- **Atención humana (5):** «Escribieron y el bot no les contesta: respondeles vos». Hoy son 3 «Oportunidad real» **viejas** (dos de septiembre, una del 24/10, escribieron 6, 6 y 3 veces), un contestador de otro negocio y un sticker. Los dos últimos no necesitan respuesta.
- **Captados para derivar (15):** lista con «Derivar», «Responder»/«Chat».
- **También hoy:** «El bot se trabó» (5, «No supo qué responder») y «Derivados sin resultado» (2, «Anotá cómo terminó cada uno»).
- **Qué está haciendo el bot:** 7 en charla, 4 en seguimiento.
- «Más opciones» está vacío.

Decisiones que permite: a quién responder ya, a quién derivar ya, qué línea o campaña está parada, qué chat el bot no pudo. Qué **no** permite: ver qué pasó **ayer** o en el día (no hay informe diario), ni priorizar por calidad del caso (solo «Más de 24 h»).

Coberturas, Autos y Marketing muestran lo mismo con cifras chicas (Atención humana 0 / 1 / 3; captados 2 / 4 / 2). Marketing agrega **«Los dos circuitos de Marketing»**: 1) Extraer la base (468 sin contactar), 2) Cargarla y lanzar la apertura («Ejecutar base», con PIN), 3) los 23 que aceptaron escuchar reciben análisis IA y venta en el chat.

**Informes diarios: no hay.** Busqué «informe», «reporte» y «resumen del día» en Hoy, Historial, Resultados, Seguimiento, Salud y Bandeja de Jurídico: nada. Lo más parecido es la tabla **«Día por día»** de Resultados (primeros mensajes / respondieron / captados por día, lunes a sábado) y los números de la semana en Chats → Activos. El resumen semanal por perfil que cita el cerebro vive en el Asistente general, que no recorrí.

### 4.2 Resultados

- Cabecera: «Captados · esta semana» (lun 16 al sáb 21), con pestañas Esta semana / Semana pasada / Este mes / Mes pasado / Desde siempre.
- **Embudo del período**, cada cifra con porcentaje sobre la anterior y comparación con el período previo: Contactados (recibieron el primer mensaje) → Respondieron → Conversaron → Oportunidades reales → Captados → Derivados → Ventas, más «cerrados sin avanzar (perdidos)». Cada cifra tiene «Ver quiénes».
- **Día por día** (gráfico y tabla), **De dónde vienen** (campaña o base de la que salió cada persona) y la lista de personas con **la frase que valió como captación**.
- Cifras «desde siempre»: Jurídico contactados 1.618, respondieron 214 (13,2 %), conversaron 105, captados 17, derivados 2, ventas 0, perdidos 142. Coberturas 521 / 89 (17,1 %) / 30 / 2 / 0 / 0. Autos 516 / 67 (13,0 %) / 33 / 4 / 0 / 0. Marketing 749 / 271 (36,2 %) / 105 / 7 / 5 / 0 / 93.
- Semana de Jurídico (16–21/11): contactados 385 (+53 %), respondieron 32 (8,3 %), conversaron 18, captados 4, derivados 0 (antes 2), perdidos 15 (−78 %). Por campaña: Graves 1911 dio 2 captados, ART GRAVES 13/11 y Reactivación 1 cada una.
- Decisiones: ver qué campaña/base rinde, cuántos captó el bot por día y dónde se cae el embudo.
- **Las cifras no cierran entre pantallas**: Jurídico dice 1.618 contactados en Resultados pero 3.421 conversaciones (3.207 sin respuesta + 214 que respondieron) en Contactos/Historial, y por eso la tasa de respuesta es 13,2 % en una pantalla y **6,3 %** en la otra. Coberturas 17,1 % vs 10,3 %. Marketing 36,2 % vs 22,7 %. «Una sola definición por cifra», como dice el cerebro, no se cumple.

### 4.3 Seguimiento (en el panel de Jurídico es `/seguimiento`; en los demás `/panel/[perfil]/seguimiento`)

Arriba: «El seguimiento funciona solo. No hay que activar ni cargar nada». Cuatro contadores (Programados / Enviados / Soltados / Para revisar) y «La ruta»: mismo día (2 h y 2 h más); a los 2 o 3 días (48–72 h) una sola vez; último intento solo si respondió al anterior; «nunca respondió»: 5–7 días, **solo por Wasender**; cuándo se suelta (dijo que no / ya lo resolvió / ya tiene quien lo atienda / número equivocado, o a las 6 h si el bot no lo cerró).

Hoy dice:
- **Jurídico:** Programados 11 (el primero, sáb 21/11 a las 20:00, el último lun 23/11 14:28), **Enviados 0** («Todavía no salió ningún seguimiento»), Soltados 40 (32 por «Dejó de responder (limpieza del 13/11)», 5 por «No se pudo enviar el seguimiento» y 3 por «El bot no insistió (contacto 2)»), **Necesitan revisión 12**: todos «Contacto 2 · **Conflicto de horario** · Venció el plazo de 72 horas sin una franja válida: no se envía y queda para revisión» (algunos de este viernes 20/11, con horas como 18:24 y 18:57, que están dentro del horario). Botones Reintentar / Descartar.
- **Coberturas:** Programados 0, Enviados 0, Soltados 27, 1 para revisar. **Autos:** 0 / 0 / 39 / 0. **Marketing:** 0 / 0 / 50 / 0.
- Es decir: **el «contacto 2 a las 72 h» no mandó ningún mensaje en ninguno de los cuatro perfiles**. El recontacto del mismo día (2 h y 4 h) sí funciona y se ve en los chats, pero no figura en «Enviados recientes». El bug de «conflicto de horario» del cerebro sigue vivo (12 casos hoy, 10 el 16/11).
- «Generar base para campaña manual» (los que llegaron al tercer contacto sin avanzar): 0.
- Decisión que permite: reintentar o descartar a mano los conflictos; no permite ver cuánto rindió el seguimiento porque nunca salió.

### 4.4 Incidencias (Chats → Incidencias, `/incidencias?perfil=…`)

Cuatro vistas: **Incidencias abiertas**, **Detenciones vigentes** («registro, no es pendiente»), **Mensajes retenidos** y **Archivos sin guardar**.
- **Jurídico:** 1 incidencia abierta («Amenaza o denuncia», 18/11, con «Resuelta» y «Descartar», cada acción pide nota y queda registrada), **137 detenciones vigentes** (motivos: Ya tiene abogado, Número equivocado, Pidió no ser contactado, Enojo por el contacto, Desinterés; botón «Levantar»), 5 mensajes retenidos, 0 archivos. Coberturas: 0 incidencias, 51 detenciones. Marketing: 0 incidencias, 31 detenciones. Autos: 0 y 19.
- **Mensajes retenidos (5, sin revisar desde el 17/11):** eventos de Meta que no se procesaron solos. Los cinco de Jurídico dicen «Error al guardar · El modelo no respondió en 20 segundos». «Reprocesar» los pasa otra vez por el circuito.
- Ver 2.2 (1): un caso de la lista afecta a un captado.
- Es una **cola de decisión humana**: reprocesar, levantar una detención, resolver una amenaza. No es un listado de problemas de calidad del bot.

### 4.5 Contactos

Pestañas: **Etapas · Citas · Seguimiento · Por base** (+ **Prioritarios** y **Piden presupuesto** en Marketing).
- **Etapas** (Jurídico, 7.852 personas): 1. Sin contactar 4.431 → 2. Sin respuesta 3.207 → 3. Respondieron 214 → 4. En conversación 55 → 5. Captados 17 → 6. Derivados 2. Debajo: Clientes derivados (2), En seguimiento (4), Ventas concretadas, Citas próximas, Citas reagendadas, **Fase 2**, En repesca (los cuatro últimos, vacíos). Coberturas: 1.316 personas (451 / 776 / 89 / 32 / 2 / 0). Marketing: 1.663 (468 / 924 / 271 / 171 / 7 / 5).
- **Citas (`/agenda`):** **0 citas en los cuatro perfiles**. Además muestra tres colas: Captados sin derivar (15), Seguimientos (69), Atención humana (14). El bot nunca agenda una cita real: «mañana/tarde» queda como texto en «disponibilidad para reunión». Las franjas se configuran en Ajustes → «Disponibilidad — Civil / Penal…», con la que nadie parece estar usando.
- **Por base:** cada base con contactos / sin contactar / sin respuesta / respondieron / captados (ej.: GRAVES 1911: 182 / 0 / 172 / 10 / 2; la base «4», 1.228 contactos, tiene 1.143 sin contactar).
- **Marketing → Piden presupuesto:** «Prometimos el presupuesto en menos de 24 h», lista de 7 pedidos de hace entre 590 y 730 horas, 6 en «Enviado (la IA retoma para cerrar)», con «Registrar resultado a mano». **Prioritarios:** negocios de Google Maps analizados por oportunidad (alta/media/baja); envío automático «apagado».
- **Historial** (`/estadisticas`, pestaña de Hoy): «Cómo va el perfil: 7.852 oportunidades · 17 captadas · tasa de respuesta 6,3 % · tasa de captación 0,2 % · derivados 11,8 %», cuatro botones (Esperan a una persona 14 / Captados sin derivar 15 / Contactados sin respuesta 3.207 / Seguimientos caídos 40), «Próximas citas: no hay», y «Ver todas las cifras» con 15 indicadores. Son acumulados, no historia por día.

---

## 5. Cosas raras que el dueño vería usando el panel (resumen)

1. **El captado más reciente de Jurídico es un falso captado** que el propio sistema marcó como falla de IA y que sigue en la lista para derivar.
2. La **evidencia de captación es la última palabra de la persona** y el «Datos para pasar» sale con tres líneas si no se tilda cada campo.
3. «Falta: …» y «Cerrado (ganado)» confunden (ver 2.1 y 3).
4. **Seguimiento a 72 h: 0 enviados** y 12 conflictos.
5. **Tres perfiles parados** (Coberturas por pago de Meta, Autos por calidad baja, Marketing por línea sin acceso/«domingo») sin que Hoy lo diga con claridad: Coberturas figura con calidad alta; el motivo de pausa se ve solo dentro de la campaña.
6. «Atención humana» mezcla casos reales viejos (dos meses) con contestadores y stickers.
7. Las **cifras difieren** entre Resultados, Historial, Contactos y Agenda (contactados, tasa de respuesta, «esperan una persona» 14 vs 5).
8. **Fuga entre rubros:** Incidencias → «Mensajes retenidos» muestra **los mismos 5 mensajes de Jurídico (con teléfono, nombre de WhatsApp y texto) dentro de los paneles de Coberturas, Autos y Marketing**, y la pantalla Salud lo rotula «de todo el sistema». Choca con «cada rubro separado: nada de un perfil se ve ni se abre desde otro». Además el encabezado de todos los perfiles dice «1 mensaje retenido» y la lista tiene 5.
9. **Campaña de Marketing pausada por «domingo»** que nadie reanudó; Coberturas con pausa por motivo «ad».
10. «Cargar una base» en la pantalla Bases no respondió en mi sesión.
11. Las bases de Jurídico traen CUIL, DNI y diagnóstico (datos de salud). En 4 de los chats de noviembre que leí la persona preguntó de dónde sacamos su número, amenazó con denunciar o habló de «fuga de datos», y hoy hay 137 detenciones vigentes en Jurídico. Lo dejo como dato, no lo evalúo.

---

## 6. Lo que el cerebro tenía mal o no sabía

Comparado contra `cerebro/03-crm-y-bots.md` (actualizado 20/11). Va en tres bloques: lo que está desactualizado o es falso, lo que no estaba, y lo que se confirma.

### 6.1 Desactualizado o falso

1. **«Jurídico frío: se capta cuando Fase 2 obtiene aceptación del análisis y del contacto profesional».** En los chats no hay Fase 1/Fase 2. Es un flujo corto: 2–3 preguntas → «¿llamada rápida de 5 minutos, mañana o tarde?» → cualquier «sí/ok/a la tarde» → «ya quedó registrado» = captado. La pestaña «Fase 2» de Contactos está vacía. La regla «Fase 1 agendada no es captado» no tiene dónde aplicarse: no se agenda nada (Citas = 0 en los cuatro perfiles).
2. **«Captado es un evento único con evidencia de aceptación».** La evidencia que muestra el panel es la **última frase** de la persona. Aceptó con «Si», «Ok», «Ahora estoy disponible». Y hay un captado que en realidad era un mensaje automático/ambiguo (licencia médica con teléfono y mail) seguido de «que no me contacte nadie».
3. **«Una sola definición por cifra» en Resultados.** No: Resultados da 1.618 contactados en Jurídico y Contactos/Historial 3.421; la tasa de respuesta es 13,2 % o 6,3 % según la pantalla (Coberturas 17,1 % / 10,3 %; Marketing 36,2 % / 22,7 %).
4. **«Contestador automático: no responde» / «Sticker: no pide que lo escriba».** En octubre, en Marketing y Coberturas, el bot contestó a respuestas automáticas de otros negocios (y a menús) como si fueran personas, con mensajes duplicados. En Autos (26/10) un sticker recibió «no puedo escuchar audios». En noviembre en Jurídico sí se calla ante un contestador y un sticker, pero esos chats caen en «Atención humana» como si pidieran respuesta; y un mensaje de licencia médica fue tratado como aceptación.
5. **«Si preguntan de dónde sacamos el número: “no tenemos el registro”».** Cierto en Jurídico y Autos. **No** en Coberturas (24/10): inventó que «los contactos los administra el equipo de marketing, suele figurar por una consulta que entró por redes sociales o internet (Facebook, Instagram o formularios web)», apoyado en la plantilla `cob_recupero_a` («hace un tiempo consultaste por tu cobertura médica»). El cerebro dice que esas plantillas «se dejaron»: siguen siendo las de la campaña con más respuestas de Coberturas.
6. **«Autos: sin stock, cuotas ni financiación inventados».** El bot dijo «financiación solo con DNI», «opciones de financiación muy accesibles», «todas las marcas», «se tasa re bien», «bicis no tomamos», «no hay inconveniente con la distancia».
7. **«Contacto 2 a las 72 h».** Corre «solo» pero **no salió ni un mensaje en ningún perfil** («Todavía no salió ningún seguimiento»); el bug de «conflicto de horario» sigue vivo: **12 casos hoy en Jurídico** (el cerebro cuenta 10 el 16/11, 9 de Jurídico y 1 de Coberturas), varios de este viernes.
8. **«Pendientes: adjuntar PDF en los chats (hoy solo fotos)».** El cuadro de escribir dice «Adjuntar foto, video o PDF», y en los chats de Marketing se ve el PDF del presupuesto y el video enviados por «Admin». No sé si se mandaron desde el chat o desde «Piden presupuesto», pero el pendiente está al menos parcialmente resuelto.
9. **«Las 3 líneas de Wasender desconectadas».** En los paneles se ven 2 (Jurídico: «Asesoria Vita - 2», sin enviar ni recibir desde el 13/11 13:52; Marketing: «LINEA - KOCOS MARKETING»). Solo hubo una campaña por Wasender (prueba de Jurídico, 81 enviados).
10. **«Incidencias: solo amenazas legales y quejas de captados».** Incidencias tiene cuatro vistas; las más cargadas son «Detenciones vigentes» (J 137, C 51, M 31, A 19) y «Mensajes retenidos» (5).
11. **«Cada rubro separado».** «Mensajes retenidos» muestra los 5 mensajes de Jurídico (con teléfono y texto) en los paneles de los otros tres rubros.
12. **«Código de ingreso: 6 dígitos hoy; se decidió pasar a 8».** Hoy ya se puede cambiar: hay un aviso fijo en la cabecera de todas las pantallas («el de 6 números todavía sirve, pero los nuevos tienen 8»).

### 6.2 Cosas que el cerebro no sabía (nuevas)

- **El bot no mide ni pregunta la gravedad de la lesión.** El «diagnóstico» sale de la base (código tipo SRT/ART), no de la charla; las bases «GRAVES/fracturas» incluyen mucho no grave; ningún filtro o etiqueta separa fracturas.
- **Coberturas sí detecta grupo familiar** (pregunta «¿solo vos o sumar al grupo familiar?» y guarda «titular y 2 hijas»), pero no pide cantidad exacta, edades ni aportes.
- **«Datos para pasarle…»:** destildado por defecto; por defecto salen solo nombre, barrio y teléfono; la ficha dice «Falta: …» con una lista fija que no refleja lo cargado.
- **Tres perfiles sin enviar desde hace 19–26 días** y por razones distintas: Coberturas (error 131042, problema de pago de la cuenta de WhatsApp Business, más campaña con pausa «ad»), Autos (calidad baja de la línea, pausa automática, «baja desde 26/10»), Marketing (la línea MARKETING «sin acceso al número»; pausa por «domingo»). Hoy no lo dice en el tablero: Coberturas figura con calidad alta.
- **Los fallos de envío son altísimos** y el panel los explica por código de Meta (131026 no entregable, 131049 límite por experiencia del usuario, 130472 experimento de Meta, 131042 pago).
- **Hay 23 captados esperando para derivar** (hasta 25 días), 7 derivados sin resultado y **0 ventas**.
- **Seguimiento: el recontacto del mismo día sí funciona** (2 h y 4 h después) pero no figura como «Enviado».
- **«El modelo no respondió en 20 segundos»**: 5 eventos del 17 al 20/11 en una cola de «Mensajes retenidos» que nadie revisa; uno de ellos produjo el falso captado.
- **Calidad de la base:** el informe de carga marca números equivocados, consultas negadas y contestadores entre quienes respondieron (en la base de ayer, 3 de 11 equivocados).
- **Tablero de «Marketing»**: el bot usa datos de Google Maps (rating, reseñas, sitio, fotos, horarios) y guarda «sales intent score» (10 a 65); el flujo «Piden presupuesto» ya tiene 7 pedidos viejos con presupuesto enviado y sin cierre.
- **Marketing: «Prioritarios» manda de 9 a 20 h** (no 8–21) y está apagado.
- **Un chat de prueba del propio equipo** aparece como «Oportunidad real» en Hoy de Marketing (y quizá en captados de Jurídico).
- **Dos vocabularios de estado** (encabezado del chat vs Etapa) y «Cerrado (ganado)» sin venta.
- «Atención humana» mezcla oportunidades reales de hace dos meses con contestadores y stickers.
- La plantilla de Wasender saluda con el apellido-nombre completo de la base y afirma una consulta previa.
- La base de Coberturas trae solo nombre y teléfono; la de Autos trae marca/modelo de publicación, que el bot no usa en las charlas que vi.
- **Cómo se presenta el bot:** en noviembre con nombre de persona («Nancy, asesora del Estudio» en Jurídico y Coberturas; «Leonardo Gonzalez, asesor» en Marketing); en septiembre decía «soy el asistente virtual». El cerebro dice que si preguntan si es IA responde la verdad; en 86 chats nadie lo preguntó, así que no lo pude comprobar.
- **El panel distingue «Agente IA» de «Admin»** (lo que escribe una persona del panel) en cada mensaje: sirve para auditar quién habló. Hay chats donde Admin y el bot se alternan.

### 6.3 Confirmado (para no dudar)

Horario de salida lunes a sábado de 8 a 21; campañas que solo se lanzan a mano; ritmo con esperas al azar y lotes; modo entrenamiento 20/día; «Por qué fallaron»; qué falta para lanzar; detenciones y baja inmediata; «ya tengo abogado» → una pregunta de segunda opinión y corte; números equivocados; enojo/amenaza → detención + incidencia; precio → no da cifra (Marketing pasa a persona y manda PDF/video); derivar es manual; Jurídico es el único perfil con tracción esta semana; Marketing responde más (36 %).

---

## 7. Preguntas que no se pueden responder mirando el panel

1. **¿Qué modelo y qué versión de instrucciones contestan hoy?** El panel solo dice «Bot · 37 de 100 en captación y trato» (¿qué es ese puntaje?) y los errores de «el modelo». No hay versión visible en los chats.
2. **¿Abrir un chat lo marca como leído o cambia algo?** No lo puedo saber desde el lado del navegador.
3. **¿Qué envía «Derivar» y «Compartir…»?** Si hay un destinatario por rubro cargado, si «Compartir…» abre WhatsApp, si se notifica al profesional. No toqué esos botones (guardan o envían).
4. **¿Qué hace «Reprocesar» con los 5 mensajes retenidos?** ¿Responde hoy un mensaje de hace 4 días? ¿Responde a quien ya pidió que no lo contacten?
5. **¿Por qué falló cada «contacto 2»?** El panel dice «conflicto de horario» pero hay horas dentro de 8–21; no muestra el cálculo del plazo.
6. **¿Qué sale a las 20:00 del sábado?** Hay 6 «Contacto 2 programado» para el sábado 21/11 entre 20:00 y 20:58 y 5 para el lunes. No puedo anticipar si salen.
7. **¿Qué pasa si la persona pregunta «¿sos un bot?»** No hubo ningún caso en 86 chats.
8. **¿Respeta realmente el horario 8–21 y el domingo cerrado?** Los datos coinciden (todo lo que vi salió 11:24–16:31 de martes a viernes), pero no hay ninguna campaña en curso para observar el corte, y las campañas las lanza la responsable.
9. **¿De dónde salieron las bases y con qué base legal?** Traen CUIL/DNI/diagnóstico; el panel no guarda ni muestra el origen ni la autorización.
10. **¿Cuánto cuesta cada campaña por Meta?** No hay costo por envío, por campaña ni por respuesta en ninguna pantalla.
11. **¿Cuántos de los captados fueron atendidos por el profesional y con qué resultado?** «Derivados sin resultado» está en blanco y «Ventas = 0»: o no se anota o no hubo; no se distingue.
12. **¿Qué hace el profesional con el mensaje?** El panel no recibe devolución del abogado/asesor/vendedor.
13. **¿Qué porcentaje de los captados eran de verdad un caso?** El bot no guarda un puntaje de calidad del lead en Jurídico (en Marketing sí: «sales intent score»).
14. **¿Cuántos mensajes de prueba o del propio equipo hay mezclados en las cifras?** No se pueden excluir en Resultados.
15. **¿Funciona el botón «Cargar una base» de Bases?** No abrió nada en mi navegador; no sé si es un error o falta de interacción.
16. **¿Qué texto tienen `contacto_frio_vita` y `estudio_juridico_vita_asesor`?** El panel solo muestra el texto de la plantilla elegida en cada campaña; las dos de Jurídico más usadas en octubre y noviembre no las vi completas.
17. **¿Qué pasó con las Wasender?** Qué plantillas, qué ritmo de calentamiento y por qué se cae la línea: lo cubre otro agente.
18. **¿Qué hace el Asistente general con los informes?** No recorrí `/asistente`; el «resumen semanal» del cerebro no lo vi.
19. **¿Está activo Penal?** No hay ningún chat, base ni oportunidad Penal (0); no puedo saber si es decisión o falta de datos.
