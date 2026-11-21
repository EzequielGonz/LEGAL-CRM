# Historia del proyecto CRM multirubro en Cowork (sept–nov 2026)

Fecha del análisis: 21/11/2026. Análisis solo de lectura. Sin claves, PIN, tokens, teléfonos, correos ni datos de prospectos.

Estados que se usan: **E** especificado · **I** implementado · **P** probado · **Pub** publicado · **H** habilitado. Cuando la fuente no lo confirma, se marca «no confirmado».

## 0. Alcance y vacíos de las fuentes

- **No hay material de septiembre.** La fuente más temprana es del 11/10 (producción en `fb5cdc3`, Etapa 1 publicada), con un resumen de compactación del 13/10 que arrastra lo anterior. La línea de tiempo arranca en octubre y no en septiembre.
- **Leído completo:** los 16 documentos del Project (`biblioteca/cowork-documentos-proyecto/`, incluido `CONTEXTO_COMPLETO_CRM.md` del 13/10 y los 15 de `claude/`), las 10 síntesis de `cerebro/chats/*cowork*.md` y `cerebro/chats/2026-11-21-claude-comun-migrar-cowork-a-code.md`, y los 5 historiales crudos de `cowork-crudos/`.
- **Cobertura parcial:** el historial crudo `cowork-h-chat7.md` se leyó completo hasta el bloque final; en el tramo final (cierre del 21/11) se revisaron los turnos de usuario y asistente, no cada salida de herramienta.
- **Historias crudas no leídas en detalle:** los 5 `.jsonl` de `cerebro/chats/cowork/` (incluido `cowork-a`, de 199 KB). Se usó solo su resumen de compactación del 13/10, que es la única fuente de lo anterior a esa fecha.
- **Rutas:** los documentos también aparecen en `/home/user/LEGAL-CRM/cerebro/biblioteca/` y `cerebro/chats/cowork/`. El contenido es el mismo que el leído.

## 1. Línea de tiempo (oct–nov 2026; no hay sept)

| Fecha | Hito | Estado y evidencia |
|---|---|---|
| Antes del 9/10 | Pausa general activa desde el 9/10. Último mensaje real en la base el 5/10. Incidencias viejas del 9/10 (importación). | Verificado en base el 13/10 (CONTEXTO_COMPLETO, sec. 7). |
| 11/10 | Producción `fb5cdc3`: Etapa 1 (plataforma: PIN, oportunidades, perfiles, importación, ficha, teléfono, envíos seguros, avisos web). Migración `0199` no aplicada. | Pub, según documento. |
| 12/10 | Etapa 2 entrega 1 («etapa2-verificada») con dependencias reales en sandbox de Vercel (bloques 2.0 y 2.3). Entrega original del 12/10 y «corregida» quedan superadas. | I y P (sandbox). Pub no. |
| 13/10 | Parche de actualización 2.0 (Word del 13/10, v2.0): 24/7 para entrantes, origen de tareas, rediseño del panel, bot de entrenamiento, SEO y contenido. La responsable ordena: todo entra en esta etapa salvo entrenamiento; la seguridad (0202) va al final. | E. |
| 13/10 | Bloque 1.12 (sesión y autorización por operación) autorizado y hecho en copia de trabajo: `requireSession` en 62 rutas, `requirePageSession`, middleware fail-closed, migración `0202`. Probado en local y en copia tipo producción. | I y P local. Pub no. |
| 13/10 | Skills `kocos-*` reescritas, `CLAUDE.md` con 9 reglas, `reglas-comunes.md` v1.0 y A01–A35. Copia de trabajo de 854 archivos. | I en copia. Pub no. |
| 13/10 tarde | `CONTEXTO_COMPLETO_CRM.md` declara bloques 1 a 5 «implementados y probados con imitaciones» (90 unitarias, 80 integración). La síntesis del chat de origen los deja como especificados. Se verificó con dependencias reales solo la entrega del 12/10. | Contradictorio, no confirmado contra el repo. |
| 13/10 | Sandbox de verificación con dependencias reales se cae dos veces; el control de permisos bloquea la subida del código como «salida de datos». | Bloqueo. |
| 14/10 | Paquete `kocos-pipeline-trabajo-1410` (855 archivos) como resguardo en rama aparte, sin PR. | I. Pub no. |
| 15/10 | Chat de accesos: lectura de GitHub, Vercel y Supabase OK; escritura en GitHub da 403. La responsable pasa de «cada acción con dale» a «acceso total, solo pagos» y luego vuelve a pedir «dale» por acción. Un token de GitHub queda pegado en el chat (ver sec. 3). | P lectura. Escritura no. |
| 15/10 | Etapa 3 (agentes, simulador, evaluación, ajuste fino) y actualización a Gemini 3.8 Flash entregadas como ZIP. | I en copia. Pub no. |
| 16–17/10 | Rediseño del panel bloques 1 a 4: PR #17 (`991c871`). PR #18 botón «Enviar desde <línea>» (`fb6688f`). Credenciales de WhatsApp de cuatro rubros cargadas en Vercel. Webhooks de Meta aplicados (Agencia, Automotores, Tu Obra Social). | Pub, según chat. Producción de `fb6688f` sin verificar. |
| 17/10 | 33 plantillas propuestas enviadas a revisión de Meta desde el botón del panel: Civil 9, 0 km 8, Coberturas 8, Marketing 8 (en cuenta 9). Aprobación de Meta no comprobada. Sin mensajes a personas. | E/I; aprobación no leída. |
| 17/10 | Rediseño Simple/Avanzado: bloques 1 a 4 en rama `rediseno-b4`, 9 archivos borrados vía conector. Bloque 5 (verificación integral) no ejecutado, decisión de la responsable. Pruebas de navegador omitidas. | I; P parcial. Pub no. |
| 17/10 | Regla de modelos: Haiku para correr y reportar, Sonnet para corregir código, Opus solo para juicio visual. Se pide frenar y avisar antes de cambiar. | Operativa. |
| 19/10 | PR #27–#37 (campañas): #33 líneas «Conectada» con código vencido; #34 campañas activas en Inicio; #35 Perdido automático y «Hablando ahora» a 72 h (merge `96bd775`); #36 límite diario editable en cualquier estado y contexto del asistente (`a91d16a`, migración `0503` aplicada); #37 análisis IA automático al decir «sí» (`0cca938`). | Pub (merges y READY), P unitarias 214/214. Pantalla no verificada. |
| 19/10 | Línea de Kocos Marketing figura PENDING en Meta. Diagnóstico: probable falta de registro del número en la API. | No resuelta. Sin estado posterior confirmado. |
| 19/10 | PR #29 «Bandeja para Claude» (migración `0502` aplicada). | Pub no confirmado. |
| 19–20/10 | Landings: PR #40 con aviso por correo de formularios (`landings-conexion`), sin fusionar en la fuente. Prompts para Hostinger Horizons de las 4 landings. Search Console verificado en los 4 dominios (declaración de la responsable). Sitemaps existentes (65, 80, 67, 47 URL). GA4 IDs recibidos (20/10). | I en rama; Pub no. Landings no tocadas. |
| 20/10 | Corrección del nombre de agencia: «ORVIAN NO, KOCOS MARKETING ES». Metricool sin API para el plan: Cowork programa directo vía conexión. Se descarta pedir token de Metricool. | Corrección vigente (ver sec. 3). |
| 21/10 | Estrategia de redes de 15 días para los cuatro rubros (1 posteo y 1 historia por día, 120 piezas). Muestras de carruseles. | E, programada en Metricool. |
| 22/10 | Plan T7: estrategia de contenido, marcas de Metricool (documento dice cuatro marcas conectadas, con FB e IG). Análisis de scraper: dos herramientas que hacen lo mismo con Outscraper; barrido de 41 ciudades y extracción que duplican bases. | Análisis. |
| 24/10 | Diagnóstico del panel en vivo, plan de reorganización («versión final para aprobar») y análisis de captación con chats reales. Propuesta de conocimiento de ventas. | E. |
| 24/10 | Bot: PR #69 (fichas de negocio por rubro, migración `0509`, regla de contestadores y origen), PR #70 (regla ORIGEN). | Pub, según resumen. |
| 24/10 | PR #71: detención sin apagar al agente; recontacto a las 2 h revisa primero las respuestas recientes; hora de 24 h en el chat. Merge `3f82376`, producción READY 21:02 UTC. Reactivación del agente en 40 chats detenidos con ventana de 24 h abierta. | Pub y H desde 21:02 UTC. Efecto no medido con corte limpio. |
| 24/10 | Reels: 96 piezas únicas (24 por rubro), 184 programadas en Metricool con estado PENDING. Primera salida prevista 25/10 13:30. | Programado 184/184. Publicado no confirmado. |
| 24/10 | Redes ampliadas (PR #68): 2 de feed y 5 historias por marca y día, del 26/10 al 5/11. | Cerrado con 304 publicaciones, según contexto del 1/11. |
| 25/10 | Fase 3 (biblioteca de agentes, simulador, evaluación, ajuste de modelos) **cerrada y descartada** por decisión de la responsable. Migración `0300` no se aplica. | Decisión vigente. |
| 25/10 | Conocimiento del bot por versiones: v1 (sin cambios) y v2 (v1 más Biblioteca Maestra de Ventas: 2 bases generales, 4 por rubro, 12 temas, 148 fichas de objeción). Migraciones `0510` y `0511`. Habilitado 50/50 en los cuatro rubros. | P unitarias 34/34; comprobado en producción (`agent_turn_logs`). |
| 25/10 | Normas comprobadas en Infoleg: 24.557 art. 6; 17.418 art. 46; 24.240 art. 11; 26.682 art. 10; 27.348. | Verificado. |
| ~1/11 | PR #73 y #74: perfiles y plantillas sin botones; 16 plantillas `*_sb_*` registradas en Meta (PENDING). Se asignan a mano cuando Meta apruebe. | Pub; aprobación pendiente. |
| 1/11 | Contexto actual (PR #52 a #74). Incidencias nuevas: caso de un negocio de Marketing trabado en «Tomar por humano» que no puede recibir presupuesto en PDF; pedido de adjuntar PDF en chats. | Pendiente. |
| 20/11 | `CLAUDE.md` del repo: única restricción es no pagar sin autorización; Claude implementa, prueba, publica y verifica directo; agencia = Kocos Marketing. | Vigente. |
| 21/11 | Cierre de chats: pedidos de archivo con reglas de «no escribir en GitHub, no commits, no ramas sin dale». Claude Docs, respaldo en `cerebro-chats`, guía para migrar de Cowork a Code (proyectos no se pasan; conectores sí). | Cierre documental. |

## 2. Objetivos de fondo (lo que se repite)

**Del negocio**
- Captar prospectos para cuatro perfiles con la misma estructura: Jurídico (Civil y Penal), Coberturas médicas, Autos 0 km y Marketing. Cada perfil con datos separados, nada se borra (se archiva con motivo) y ningún perfil se ve desde otro.
- Conversación por WhatsApp (API oficial de Meta) con agente de IA que califica y deriva a una persona. La captación se mide por personas, no por mensajes.
- Marketing (Kocos Marketing) como agencia que vende web, redes, automatización de WhatsApp con IA y CRM. Su circuito: extraer base, apertura, análisis IA automático solo para quien responde que sí, y venta consultiva en el mismo chat.
- Presencia orgánica: redes con seguidores que puedan ser clientes y SEO local (AMBA), no posicionamiento global.
- Reputación frente a Meta: plantillas honestas (sin «consultaste» a bases frías), calidad de línea vigilada y pausa de campañas si baja.

**Del CRM**
- Un solo chat, una sola ruta por sección en los cuatro perfiles, un solo cálculo por indicador y hora de Buenos Aires en todo el panel.
- Panel de mando en Inicio: atender ya, campaña, línea, bot.
- Trabajo cada vez menos manual: análisis automático, asistente «Pedile algo» que lee chats y propone acciones con confirmación.
- Trazabilidad: `ops_change_log` para cambios de datos, estados «especificado → habilitado» en cada informe, Preview con base compartida que solo se mira.
- Seguridad: sesión validada por operación, claves solo en Vercel, sin datos reales en pruebas.

**Hacia dónde apunta**
- Control de todo el proyecto desde el chat (código, landings, SEO, redes, agentes, Meta, Google). Pedido por la responsable el 15/10; hoy limitado por la regla de pagos y de no lanzar campañas sin autorización.
- Vender el mismo circuito a otros clientes de Kocos Marketing (el «circuito de Kocos»).

## 3. Reglas y decisiones viejas que fueron reemplazadas

| Regla vieja | Qué la reemplazó | Cuándo |
|---|---|---|
| La agencia es ORVIAN. | Kocos Marketing («ORVIAN NO, KOCOS MARKETING ES»). Luego `CLAUDE.md` la fija como Kocos Marketing. **Atención:** los pedidos de cierre del 21/11 siguen diciendo «agencia ORVIAN». Ver sec. 6. | 20/10; `CLAUDE.md` 20/11. |
| Claude nunca escribe en GitHub; todo va por ZIP y el programador integra. | 15/10: «acceso total, solo pagos»; minutos después, «cada acción en GitHub con dale». Luego `CLAUDE.md` (20/11): sin dale por cada paso, única restricción pagos. Los pedidos de cierre del 21/11 vuelven a pedir dale para ramas y commits. | 13/10 → 15/10 → 20/11 → 21/11 (sin resolver). |
| Claude solo entrega ZIP y el programador publica a `main`. | Desde 17/10 Claude escribe en ramas con el conector de GitHub y abre PR. `CLAUDE.md` 20/11: Claude publica y verifica directo. Un PR a `main` sigue requiriendo autorización según algunos chats. | 17/10; 20/11. |
| Campañas y seguimiento: envíos solo de lunes a sábado 8 a 21 para todo. | Parche 2.0 (13/10): respuestas a entrantes 24 h cuando el perfil y el agente están habilitados; las salidas iniciadas por la empresa siguen de 8 a 21. Bandera `inbound_24h_enabled` apagada el 13/10. | 13/10. |
| Detención apaga al agente. «No quiero que me hablen más» cierra el chat. | Detención con disculpa y queda a disposición; frena campañas, seguimientos y recontactos. Solo bloquean respuestas el número de una menor o una detención no comprobable. | 24/10 (PR #71). |
| Recontacto revisaba siempre los chats más viejos y nunca llegaba a los recientes. | Recontacto a las 2 h, hasta dos veces, dentro de 24 h y en horario, revisando primero las respuestas recientes del agente. | 24/10 (PR #71). |
| Análisis IA a toda la base extraída. | Análisis automático solo para quien responde que quiere una propuesta. | 19/10 (#37). |
| El límite diario de envío solo se edita en borrador. | Editable en cualquier estado, también desde el asistente con confirmación. | 19/10 (#36). |
| Pedir token de API de Metricool para programar. | Cowork programa directo a través de la conexión de la sesión. Metricool sin API en el plan. | 20/10. |
| Redes: 1 posteo y 1 historia por día por rubro (120 piezas). | 2 de feed y 5 historias por día (lun a sáb, carrusel lun y jue) y después 4 reels por día por rubro. | 24/10 (PR #68 del 26/10 al 5/11; reels 25/10 en adelante). |
| «Por ahora sin videos ni reels» (memoria del Project). | Reels por pedido de la responsable del 24/10. | 24/10. |
| CTA de Kocos Marketing: «Ver planes». | «Consultar por WhatsApp» al número del CRM. | 20/10. |
| Número de WhatsApp de la landing de Kocos Marketing (otra característica). | Número de la línea cargada en el CRM. | 20/10. |
| Plantillas de base fría con «tu consulta» y botones «No me escriban más». | Plantillas honestas, sin «consultaste», con botones «Sí, quiero comparar» y «Más adelante» (propuesta). Las `*_sb_*` quedan en revisión de Meta. | 24/10 propuesta; ~1/11 registradas. |
| El bot se rinde a la primera (despedida ante «ya tengo abogado» o «ahora no»). | Insiste una vez: segunda opinión gratis, otro momento, respuesta única a «de dónde salió mi número». Si insisten, se disculpa y se queda callado. | 24/10 propuesta; 25/10 regla de abogado. |
| El bot no da precios. | El bot explica el concepto (la cuota sola no muestra el costo total) sin números, rangos ni cuotas. | 25/10. |
| Estadísticas por mensajes. | Estadísticas por personas, en 5 categorías (por cerrar, pidió persona, bot trabado, se enfrió, no interesados). | 24/10 (propuesta aprobada en el chat). |
| Tres sistemas de bot superpuestos (configuración que responde hoy, biblioteca sin asignar, roles). | Base general única más conocimiento por rubro y roles que se suman. Conocimiento por versiones v1/v2. | 25/10. |
| Fase 3: biblioteca de agentes, simulador, evaluación, ajuste de Gemini (candidato C, tope USD 30). | Cerrada y descartada. No retomar, no preparar nada. | 25/10. |
| Seguridad: middleware de sesión por ruta. | `requireSession` en cada operación; 503 recuperable si no se puede comprobar; no se cierra sesión ante falla de base. | 13/10 (1.12, en copia). |
| Migraciones numeradas `01xx` y `02xx` (`CLAUDE.md`). | Chats usan `0199–0207`, `0300` (descartada), `0400`, `0502–0511`. Numeración real no coincide con la regla escrita. | Sin resolver. |
| Next.js 14.2.35 (con aviso crítico). | `CLAUDE.md` 20/11 dice Next.js 15.5. Versión real no confirmada. | Sin resolver. |
| Pausa de envíos, campañas y seguimiento. | Se mantienen pausadas hasta autorización expresa. Seguimiento de 48 a 72 h apagado por perfil, sin decisión. | Vigente. |
| Modelo: Haiku para correr, Sonnet para corregir, Opus para diseño visual. | Cambios de modelo por comando durante los chats. La atribución de commits no coincide con el modelo configurado (19/10). | 17/10; sin cerrar. |

Secretos que aparecieron en los chats (no reproducidos aquí): PIN de acceso al panel pegado en el chat (debe cambiarse; no confirmado), token de GitHub pegado el 15/10 (debe revocarse; no confirmado), y un valor de PIN de prueba como default en el código de pruebas (debe quitarse).

## 4. Ideas, planes y pedidos sin hacer que podrían seguir vigentes

**Panel y producto**
- Inicio como tablero de mando (atender ya, campaña, línea, bot) igual en los cuatro perfiles. E según plan del 24/10; ejecución no confirmada.
- Menú único y mismas rutas para los cuatro perfiles. Hoy Jurídico usa `/campanas` y otros `/panel/<perfil>/…`.
- Un solo chat: hoy hay tres pantallas (`/inbox`, `/panel/…/chats`, `/conversacion`).
- Asistente «Pedile algo» con permisos ampliados: leer y responder chats, marcar captado o derivado, tomar o detener contactos, cargar bases y presupuestos, reanudar campañas, editar la base y los roles del bot. Siempre con confirmación antes de enviar o cambiar.
- Adjuntar PDF en los chats (para presupuestos), con límite de tamaño, validación de tipo y sin envíos masivos (pedido del 1/11).
- Diseño: decisión contradictoria. El 24/10 se aprobó un tema oscuro con dorado y títulos serif, con modo claro. El 17/10 se trabajó con tema claro y clases de Tailwind de tema claro. Falta definir uno.
- Limpieza sin borrar: archivar bases duplicadas (ART GRAVES cargada tres veces; ART NUEVOS; LEVES sin usar), archivar las 55 o 225 incidencias viejas del 9/10, avisos solo del perfil, técnico pasa a «Avanzado», quitar «asignar» de líneas de otros perfiles, corregir «PENAL · Civil», bloques de disponibilidad vacíos y 404 de rutas sin `?perfil`.
- Datos coherentes: campañas con «Finalizada» que tienen envíos pendientes, conteos 542 contra 564, hora de campaña corrida (23/10 03:30 cuando fue 15:30).
- Webhook: el panel muestra «No entran mensajes hace 19 días» (19/10). Se ofreció revisar; no se hizo.
- Bloque 5 de verificación integral (cuatro perfiles, 320–1440 px, teclado, movimiento reducido) y pruebas de navegador del bloque 4: no ejecutados.
- Medición de caché con y sin `no-store`: sin resultado confiable.
- Dependencias: Next.js (advisory crítico) y `xlsx` 0.18.5 sin fix en npm; prueba de Next 15.5 y SheetJS 0.20.3 sin resultado.
- Verificación con dependencias reales de la Etapa 2 consolidada: no terminada. La Preview es el único camino previsto.
- Pipeline: `git push` directo da 403 («repo no está en el conjunto autorizado de la sesión»). El conector de GitHub sí escribe. Esto no se resolvió.
- Rama `trabajo-1410` y `etapa1-correcciones` existen en remoto; no se sabe quién las creó. Rama `rediseno-b4` y `rediseno-b1-navegacion` pendientes de integrar.

**Captación y bot**
- Línea de Kocos Marketing PENDING en Meta: falta confirmar el registro del número. Sin estado posterior.
- Línea de Civil con calidad baja en Meta: la campaña ART quedó pausada; revisar plantillas.
- Plantillas `*_sb_*` pendientes de aprobación de Meta; asignarlas a mano. `mkt_apertura_propuesta` aprobada pero sin asignar (24/10).
- Caso de Alumar (Marketing, 1/11): diagnosticar por qué no pasó de «Enviar presupuesto» y qué impide el PDF. Sin enviar nada hasta autorización.
- Comparar v1 y v2 del conocimiento con 30 o más conversaciones por versión y decidir cuál queda.
- Cargar precios, stock y condiciones en la ficha de negocio si se quiere que el bot los use (hoy no hay).
- Nombre de presentación del bot por rubro: dos opciones en discusión.
- Ejemplos de conversación (3 a 5 por rubro) para completar las fichas.
- Autos: si el bot insiste una vez ante «ya compré», se mantiene la regla.
- Jurídico: ejecutor programado para la cita de IA y transcripción de audios (con costo, sin autorizar).
- Agenda: sin cupos de IA; citas con tipo IA o profesional todavía no existen en el modelo.
- Atención humana: consolidar cuatro números distintos para lo mismo («piden persona», «atención humana», etc.).
- Bases de Coberturas y Autos: lista de localidades que cuentan como AMBA (pendiente de la responsable). Hoy la zona es un valor de tres estados.
- Identificadores de landing («desde la web de …») para cargar en el panel con fuente «Landing». Sin eso las consultas quedan como «No informada».
- Seguimiento de 48 a 72 h: encender por perfil con PIN (pendiente de decisión).

**Landings y SEO**
- Aplicar los cuatro prompts en Hostinger Horizons, una landing por vez. Ninguna aplicada hasta el 22/10.
- Aviso por correo de formularios (PR #40): crear cuenta de correo transaccional, verificar dominio, cargar claves solo en Vercel. Sin fusionar.
- GA4: instalar los IDs en cada landing y marcar los eventos clave. El SEO de 24/10 muestra 0 sesiones porque ninguna landing tenía la etiqueta.
- Enviar sitemaps en Search Console e indexar la home y 5 a 10 páginas clave. Impresiones bajas (0 a 2 por sitio en 90 días al 24/10).
- Perfil de Empresa de Google por marca, reseñas, citaciones en directorios, enlaces cruzados entre Kocos Marketing y los otros tres.
- `llms.txt` y firma de artículos legales con el profesional revisor (`REVIEWER` en `brand.ts`).
- kocosmkt.com mezcla www y sin www: dejar uno solo.
- Search Console por API con OAuth, no por exportaciones manuales (regla del parche 2.0).

**Contenido y redes**
- Destacadas de Instagram: las arma la responsable desde la app. Testimonios solo reales.
- Verificar que los 184 reels hayan salido desde el 25/10 y el alcance.
- Metricool: conectar Instagram de Kocos Marketing; crear o conectar marcas de Jurídico, 0 km y Coberturas; cargar el calendario de un mes por rubro con aprobación previa.
- Biografías con el enlace de origen del panel: `CLAUDE.md` dice no tocar bio ni botón de perfiles de redes. Conflicto a resolver.
- Google Cloud: el pedido de «vincular las páginas de los 4 rubros» nunca se definió (Search Console, Analytics, cuenta de servicio).

**Entrenamiento e IA**
- Nada de Fase 3. Si se reabre, es decisión nueva de la responsable.
- Precios: solo explicar el concepto, sin números.

**Seguridad y operación**
- Rotar el PIN de acceso y el token de GitHub pegados en chats.
- Revisar que `SESSION_SECRET` no use la clave de servicio como respaldo (riesgo señalado el 13/10).
- Variables de Vercel que faltaban en Preview: `VAPID_*`, `SESSION_SECRET`, `GEMINI_*` (14/10). Estado no confirmado.
- Sin Vercel plugin (instrucción 13/10); el conector de Vercel sí se usa.

## 5. Datos del negocio útiles

**Marcas y perfiles** (dominios públicos; sin teléfonos ni correos)
- **Jurídico:** Estudio Jurídico Vita (nombre principal; «Vita Abogados» solo como apoyo). Áreas Civil y Penal (Penal diferido, línea y cuenta sin cargar al 17/10). Temas: accidentes de tránsito, accidentes laborales con ART, in itinere, enfermedad laboral, moto/bici/peatón. Dominio de landing: estudiojuridicovita.com. Perfil del CRM: `juridico`.
- **Coberturas médicas:** Compara Tu Obra Social (comparatuobrasocial.com). Comparación de prepagas y obras sociales, derivación de aportes. Perfil: `coberturas_medicas`.
- **Autos 0 km:** Automotores Kocos / Agencia Kocos 0 km (autoskocos.com). 0 km con financiación, plan de ahorro, usado como anticipo, patentamiento. Perfil: `agencia_0km`.
- **Marketing:** Kocos Marketing (kocosmkt.com). Web, redes, automatización de WhatsApp con IA, CRM, SEO local, landings. Alcance nacional. Perfil: `marketing`.
- **Asesor:** un asesor firma los cuatro perfiles; el nombre de presentación del bot está en discusión (dos opciones).

**Servicios y criterios de captación**
- Captado = interés y aceptación del siguiente paso, con evidencia guardada. Agendar no capta; compartir no deriva; derivar es manual.
- Jurídico frío: Fase 1 agenda; Fase 2 obtiene el relato y capta al aceptar el análisis y el contacto profesional. Jurídico actual: ruta rápida.
- Coberturas: interés más aceptación del asesor. Sin planes ni precios.
- Autos: interés más aceptación del vendedor. Sin stock ni cuotas.
- Marketing: necesidad más siguiente paso aceptado. Sin precios ni plazos. Solo preguntar precio va a una persona y no capta. El cierre lo hace una persona; el bot nunca pasa datos de pago.
- Datos parciales o fuera de AMBA no impiden captar; sin ubicación = «sin confirmar», nunca AMBA.
- Después de captar se detiene la gestión comercial. Si vuelve a escribir, atención humana prioritaria.

**Horarios y cadencias**
- Salidas iniciadas por la empresa (campañas, seguimientos, reagendamientos, recuperaciones): lunes a sábado de 8 a 21 hora Argentina, feriados incluidos, domingos no. Revalidadas justo antes de llamar a Meta.
- Respuestas a entrantes: 24 horas, cuando el perfil y el agente están habilitados (bandera apagada al 13/10).
- Recontacto a quien no responde: a las 2 h, hasta dos veces, dentro de 24 h y en horario.
- Seguimiento: segundo contacto entre 48 y 72 h (60 h por defecto), tercero solo tras respuesta y nuevo estancamiento. Máximo tres ciclos. Sin respuesta al segundo, se detiene.
- Citas: un solo reagendamiento, una hora después del mensaje de inicio realmente enviado.

**Reglas de conversación**
- No prometer día ni hora; la persona que sigue la gestión la asigna la responsable.
- Audios: el bot pide que escriban. Contestadores automáticos: no se les responde.
- «Ahora no»: mensaje corto y otro momento. «No, gracias», «ya compré», «ya lo resolví»: insiste una vez y detiene. «No me escriban más», enojo o número equivocado: disculpa y detiene (la detención no apaga al agente desde el 24/10).
- Pedido de origen de datos o de baja: disculpa automática sin explicar el origen (los datos salen de Meta), y detención.
- Ya tiene abogado: una pregunta por si busca segunda opinión, sin cuestionar al otro abogado; si dice que no, detener.
- Emergencias: 911, 144 y 137 (base general de conocimiento).
- Precios: el bot explica de qué depende el precio y que la cuota sola no muestra el costo total; nunca números, rangos ni cuotas.
- Normas citadas solo con fuente verificada: Ley 24.557 art. 6; Ley 17.418 art. 46; Ley 24.240 art. 11; Ley 26.682 art. 10; Ley 27.348 (verificadas en Infoleg el 25/10).

**Cifras de operación (última medición en fuentes)**
- Bases: ART GRAVES 320 contactos, 304 sin respuesta. ART NUEVOS PRIORIDAD 1: 434, con 35 respuestas. LEVES: 441 o 450 (conteo no coincide).
- Captación del 24/10: Coberturas 36 primeras respuestas, 32 con «Ahora no» o «No me escriban más» (botones de la plantilla vieja). Marketing 65 primeras respuestas, 33 con interés posible, el que mejor funciona (3 captados). Jurídico 44 primeras respuestas, 13 «ya tengo abogado», 9 que no consultaron.
- Puntaje del bot (24/10): Jurídico 20/100, Coberturas 30, Marketing 51.
- 0 km (24/10): 133 envíos, 2 respuestas, 0 captados.
- Calidad de línea: Civil con calidad baja; Kocos Marketing PENDING en Meta.
- Redes: plan de 15 días (120 piezas) reemplazado por 2 de feed y 5 historias diarias (304 publicaciones, 26/10 a 5/11). Reels: 4 por día por rubro (2 nuevos y 2 repeticiones), 184 programados. Horarios Metricool: reels 13:30 y 20:30; repeticiones 10:00 y 17:00; desfase por cuenta VITA :00, Coberturas :07, Autos :14, Marketing :21. Posteos sin datos: 12:30 y historias 19:30.
- Destacadas de Instagram por rubro: Quiénes somos, Cómo trabajamos, Preguntas frecuentes, Testimonios (solo reales) y Contacto.
- Reglas de contenido: sin precios, plazos, resultados ni promesas. Coberturas no recomienda una prepaga. VITA no da asesoramiento específico. Cada texto cierra con una pregunta y el enlace de la bio a la web.
- Landings: silos de contenido de 64 (Jurídico), 66 (Coberturas), 79 (Autos) y 45 (Marketing) páginas. Sitemaps con 65, 80, 67 y 47 URL.
- Presupuesto: ningún gasto autorizado. Tope USD 30 de la Fase 3 quedó descartado con ella.

**Herramientas y proveedores** (sin credenciales)
- Metricool: plan sin API. Antes estaba conectada solo una página de Facebook (Kocos Marketing). El 22/10 el documento de plan dice cuatro marcas conectadas. Conflicto a confirmar.
- Vercel (proyecto `legal-crm`, Preview y producción), Supabase (`legal-crm`, sa-east-1), GitHub (`EzequielGonz/LEGAL-CRM`, `main` es producción), Vercel Blob (`reels-redes`, ~323 MB de 1 GB), dominios en DonWeb con nameservers de Vercel, WhatsApp Cloud API de Meta, Gemini (modelo en código: `gemini-3.8-flash`; `env.example` dice 2.5, no confirmado).
- Correo de avisos de landings: Resend (pendiente de crear).

## 6. Preguntas que conviene hacerle a la responsable

**Identidad y reglas**
1. ¿La agencia es Kocos Marketing o ORVIAN? La corrección del 20/10 y `CLAUDE.md` dicen Kocos Marketing, pero los pedidos de cierre del 21/11 dicen «agencia ORVIAN».
2. ¿Qué regla rige para GitHub? Opciones: (a) sin dale por cada paso (`CLAUDE.md` 20/11), (b) dale para ramas y commits (pedido de cierre del 21/11). ¿Y para PR a `main`?
3. ¿El repo `EzequielGonz/LEGAL-CRM` queda autorizado en la sesión para escribir? Hoy `git push` da 403 aunque el conector sí escribe.
4. ¿Se confirma que el token pegado el 15/10 y el PIN pegado en chats fueron revocados y cambiado el PIN?
5. ¿Qué pasó con las migraciones `0199–0207` y `0400` en la base real? Los documentos de octubre no confirman qué está aplicado.
6. ¿La numeración de migraciones se ajusta a `01xx` y `02xx` de `CLAUDE.md`, o se acepta la real?
7. ¿Next.js queda en 14.2.35 (con advisory crítico) o se pasa a 15.5? ¿Se aprueba la prueba de SheetJS 0.20.3?

**Captación y bot**
8. ¿Qué pasó con la línea de Kocos Marketing en Meta (PENDING)? ¿Se registró el número?
9. ¿Se aprueban las 16 plantillas `*_sb_*` en Meta? ¿Cuáles asignar a cada rubro?
10. ¿Se encienden los recontactos y el seguimiento de 48 a 72 h por perfil? (requiere PIN)
11. ¿Se mantiene la versión v2 del conocimiento o vuelve a v1? (criterio: 30 o más conversaciones por versión)
12. ¿Cuál es el nombre de presentación del bot por rubro? ¿Se aportan 3 a 5 conversaciones de ejemplo por rubro?
13. ¿La lista de localidades AMBA para Coberturas y Autos (hoy «sin confirmar»)?
14. ¿Qué precios, stock o condiciones se cargan en la ficha de negocio? Hoy el bot no tiene ninguno.
15. ¿Se mantiene la regla de insistir una vez en «ya compré» para Autos?
16. Caso Alumar (Marketing): ¿qué quiere que pase con el presupuesto en PDF? ¿Se autoriza adjuntar PDF en chats?
17. ¿Qué hacer con la base ART GRAVES (cargada tres veces) y las incidencias viejas? ¿Archivar?
18. ¿Se resuelve la calidad baja de Civil y se reactiva la campaña ART, o queda pausada?
19. ¿Un solo número para «atención humana» en el panel, y qué personas reciben los avisos por perfil?

**Panel, datos y diseño**
20. ¿Tema oscuro dorado con serif (propuesta del 24/10) o tema claro (rediseño del 17/10)?
21. ¿Se aprueba el plan de reorganización del 24/10 (menú único, Inicio como tablero, Bot IA como sección, asistente con permisos)? ¿En qué orden?
22. ¿Se revisa el webhook? El panel muestra «No entran mensajes hace 19 días» desde el 19/10.
23. ¿Se hace el bloque 5 de verificación integral y las pruebas de navegador que se omitieron el 17/10, o se da por cerrado?

**Landings, SEO y redes**
24. ¿Se aplican los cuatro prompts en Hostinger Horizons? ¿Quién los pega?
25. ¿Se crea la cuenta de correo transaccional para los avisos de formularios y se aprueba el PR #40?
26. ¿Se instalan los IDs de GA4 en las landings? ¿Se enviaron los sitemaps a Search Console?
27. ¿Qué se quiere vincular en Google Cloud? Search Console, Analytics, Google Business u otro.
28. ¿Cuál es la página de Facebook correcta de Kocos Marketing? Hay dos identificadores; la responsable dijo que es la misma.
29. ¿Se cargan las cuatro frases de origen de landing («desde la web de …») en el panel?
30. ¿Se conecta Instagram de Kocos Marketing en Metricool y se crean las marcas de Jurídico, 0 km y Coberturas? ¿Se aprueba el calendario de un mes por rubro?
31. ¿Se publicaron los 184 reels desde el 25/10 y con qué alcance?
32. Biografías de Instagram con enlace de origen: `CLAUDE.md` dice no tocar la bio. ¿La cambia la responsable?

**Entrenamiento y costos**
33. Fase 3 cerrada y descartada el 25/10: ¿queda así o hay algo que se quiera rescatar (conocimiento por versiones ya quedó)?
34. Cualquier gasto (Google Cloud, Supabase plan pago, Vertex, transcripción de audios, Metricool con API) requiere autorización expresa. ¿Hay alguno aprobado?
