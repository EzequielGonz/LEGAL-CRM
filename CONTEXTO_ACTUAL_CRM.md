# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 19/10/2026 (Bandeja para Claude en PR #29, Preview lista y migración 0502 aplicada; antes: reorganización 2, perfiles en PC, estado real de las líneas, asistente ampliado, chat de campañas y afinado de diseño publicados: PR #20, #21, #22, #24, #26 y #27). Sin secretos ni datos de prospectos.

## Bloque actual: Bandeja para Claude (19/10, pedido de la responsable)
Detalle en `docs/bandeja-claude/ENTREGA.md`. Rama `bandeja-claude`, PR #29 fusionado a `main` (`4f74085`, 19/10). Ajuste posterior: tarjeta negra y movida arriba de «Pedile algo» (rama `bandeja-posicion`, PR #32). Procedimiento de Claude al recibir «ok»: `.claude/referencias/bandeja-claude.md`.

**Qué cambió**
- Menú (todos los perfiles): tarjeta negra «Bandeja para Claude» abajo en la barra izquierda, justo arriba de «Pedile algo»; muestra cuántas hay abiertas y avisa en ámbar si alguna está en espera.
- Pantalla `/bandeja?perfil=<slug>`: dejar una tarea (perfil, pedido, hasta 5 enlaces), ver estados (pendiente, en curso, en espera, lista, descartada) con resultado y enlaces, y descartar con motivo. Rechaza correos, teléfonos y documentos.
- «En curso» sin avance por más de 6 h se muestra «en espera» (por ejemplo, si se agotó el uso del plan).
- Claude no corre dentro del panel y no hay tarea programada: la responsable abre un chat nuevo de Cowork en el proyecto y dice «ok». El asistente del panel sigue en Gemini.
- Migración `0502_bandeja_claude` (tabla nueva con RLS, sin permisos públicos, sin borrados): **aplicada y verificada** en la base real (en el historial figura en tres entradas, ver `docs/bandeja-claude/MIGRACIONES.md`).

**Evidencia**
1. Implementado: rama `bandeja-claude`, remoto = local (comparación con `git diff`, sin diferencias).
2. Desplegado: Preview `dpl_F9FcwemZjueYihJ3vU6vcinpdbme` READY (`acc91f6`, todo el código; build con typecheck y lint de Next.js sin errores). Producción: PR #29 fusionado a `main` (`4f74085`), **despliegue en producción sin verificar** (la sesión no pudo consultarlo). Una Preview intermedia (`57ab297`) falló porque ese commit todavía no tenía el componente de la pantalla; se resolvió con el commit siguiente.
3. Comprobado automáticamente: unitarias de la bandeja 8/8; base: disparadores y restricción probados en una transacción revertida, 0 filas; asesor de seguridad sin avisos nuevos. La suite completa no se pudo correr en la sesión (npm bloqueado; 8 archivos de pruebas necesitan `@supabase/supabase-js`).
4. Revisado visualmente: **pendiente**.
5. Probado funcionalmente: **no** (crear y descartar una tarea lo puede probar la responsable en la Preview o en producción; una tarea de prueba queda guardada y se descarta con motivo).

**Habilitado**: nada se ejecuta solo; guardar una tarea solo la deja pendiente.

## Bloque anterior: reorganización 2 (18/10, pedido de la responsable)
Detalle en `docs/reorganizacion-2/ENTREGA.md`. Rama `reorganizacion-2`, PR #20 → `main`. Sin migraciones.

**Qué cambió**
- Perfiles en PC: pantalla oscura como antes, sin cifras, con lápiz para editar el perfil interno. Las tarjetas con pendientes pasaron al modo teléfono (renovado).
- Conversaciones: solo oportunidades reales (captados sin derivar, agendaron, hablando, piden persona) en grupos → fichas → chat.
- Contactos: clientes derivados, ventas, citas, reagendadas, Fase 2, seguimiento, repesca. La base fría va a Prospectos, agrupada por base y plegada.
- Revisión: caídos, dejaron de responder (72 h) y perdidos primero; incidencias y quejas a un costado.
- Inicio: sin atención humana; solo lo que se puede cerrar y un resumen chico (semana y última base) con historial.
- Configuración: grupos de abajo como tarjetas plegables. Tarjeta «Horario de atención».
- Agentes (todos los rubros): fuera de lun a sáb 8 a 21 h responde la IA, igual intenta captar y agenda la llamada con un asesor (bloque de código en `agent.ts`, sin tocar prompts de la base).
- Redes › Perfiles: Facebook editable desde el panel con el token de la página en Vercel; Instagram solo lectura (Meta no permite editar biografía ni foto por API), con biografía sugerida y enlace con origen para copiar.
- Pulido visual (`renovacion.css`, burbujas del chat).

**Evidencia**
1. Implementado: rama `reorganizacion-2`, remoto = local (comparación archivo por archivo).
2. Desplegado: Preview `dpl_H7SWxALcp7Q8yC2VkdWXyzBdKLfj` READY (`65f28f3`, todo el código). Producción: `dpl_2gmTG1tVVHUPJdY9F1M4ez7sunUL` READY = `main` `d6ae224` (PR #20 fusionado 18/10). Sin errores de ejecución nuevos al publicar. Rollback: promover `dpl_EDpu2BTUTKMKpXjF6XHBiiNiNBGC` (`b74c1dc`).
3. Comprobado automáticamente: unitarias 190/190; build de Vercel.
4. Revisado visualmente: **pendiente** (la sesión no puede abrir el panel con ingreso).
5. Probado funcionalmente: **no** (sin páginas de Facebook vinculadas; sin contacto real).

**Ajuste posterior (PR #21, pedido de la responsable):** la pantalla de perfiles en PC quedaba con recuadros blancos y nombres invisibles (cada perfil tomaba el fondo claro del tema). Ahora muestra una tarjeta completa por marca, más que la del teléfono: pendientes, semana (mensajes, captados, citas, derivados), última base con embudo, últimos captados y accesos, con lápiz y tres puntos. Preview `dpl_A9sEqNCWddQf1ZndRyavxdSJxUSW` READY (`113b78e`). Producción `dpl_EFD1DzdwnFVRbWyYx5P3truzxGdt` READY = `main` `eb9b8a9`, sin errores nuevos. Revisión visual: pendiente (la hace la responsable).

**Estado real de las líneas de WhatsApp (PR #22, pedido de la responsable):** el panel decía «credenciales cargadas» y todo correcto solo porque existían las variables, aunque en Meta el número de Agencia Kocos figuraba «Pendiente». Ahora `src/lib/whatsapp/estado-linea.ts` le pregunta a Meta (solo lectura, sin enviar ni modificar nada) y el panel muestra por línea «Meta: Conectada / Pendiente / Con problema / Token inválido o vencido / Sin acceso / No se pudo comprobar», con botón «Volver a comprobar con Meta». Solo «Conectada» cuenta como lista: «qué falta para contactar», el selector de línea de las campañas y el lanzamiento (`campaignReadiness`, memoria de 2 min) lo exigen. Conexiones aclara que mira solo las variables del webhook. Un fallo de red al consultar no bloquea. Implementado y publicado: sí (Preview `dpl_48no88zqtYicyfTACi8EeocW1oBq` READY en `1629862`; producción `dpl_3o2HQezCSUJNnHxak6V8msaiwnde` READY = `main` `5a27718`, sin errores de ejecución). Probado: unitarias 198/198 con Meta simulado; **sin llamada real a Meta ni revisión visual**. Habilitado: nada. El estado «Pendiente» del número se resuelve en el Administrador de WhatsApp (verificar y registrar el número, y que el token tenga acceso): lo hace la responsable.

**Asistente ampliado (PR #24, pedido de la responsable):** el asistente del panel ahora puede operar campañas, líneas y agentes, **siempre como propuesta que se confirma**. Consulta (`opciones_campana`, `listar_campanas`, `listar_agentes`) y propone (`proponer_campana` en borrador sobre una base, `proponer_asignar_linea`, `proponer_lanzamiento`, `proponer_asignar_agente`, además de publicaciones, cambio de bot y pausa). Niveles en `src/lib/asistente/permisos.ts`, derivados de la propuesta guardada y nunca del pedido: **cambio** = Confirmar; **contacto** (lanzar o reanudar) = casilla de confirmación reforzada + `campaignReadiness` (incluye Meta) + plantilla viva + pausa general; **PIN** (activar un agente) = `confirmPin`. No existe ninguna herramienta de pago ni de gasto (`TIPOS_QUE_GASTAN` vacío; si se agrega una, va con PIN). Es una IA de uso general (sin límite de temas) y mira hasta 3 imágenes adjuntas (se reducen en el navegador); **no edita ni genera imágenes** (si se quiere, es una decisión aparte por posible costo). Campañas › «Preparar con IA» abre el asistente para armar la campaña por prompt y conversando. Migración `0501_asistente_acciones_ampliadas` (amplía los tipos permitidos de `asistente_acciones`; aplicada y verificada en la base real). Implementado y publicado: sí (Preview `dpl_3kDFYiVoLVbNszQ4B9fC7Ng2Uruo` READY en `e35ff2b`; producción `dpl_44qSoySWbfG6wmZW3PMUDDygpDf6` READY = `main` `e78d478`, sin errores de ejecución). Probado: unitarias 204/204; **sin llamada real a Gemini ni a Meta, sin revisión visual y sin lanzar ninguna campaña**. Habilitado: nada; las campañas siguen pausadas y el asistente no envía por sí solo.

**Chat «Preparar con IA» en Campañas (PR #26, pedido de la responsable):** en vez de abrir el asistente lateral, Campañas despliega un chat en la misma pantalla (`src/components/campanas/chat-campana.tsx`) que acepta hasta 3 adjuntos (imágenes, PDF de hasta 2,5 MB y CSV/TXT/MD) y recomienda una plantilla según el tipo de base con la herramienta `analizar_base` (`src/lib/asistente/base-resumen.ts`, que resume columnas y categorías **sin datos personales**). Deja la campaña como propuesta en borrador y nunca lanza. Implementado y publicado: sí (Preview `dpl_GqNyuPFEWojzrY2SyDjeoeMzVYWi` READY en `6bf654a`; producción `dpl_C8yiUN8s6S69KJ3tFERsrJnZsL8Q` READY = `main` `6459464`, sin errores). Probado: unitarias 206/206; **sin llamada real a Gemini ni a Meta**. Habilitado: nada.

**Afinado de diseño (PR #27, pedido de la responsable):** solo presentación. Nueva capa `src/app/afinado.css` (se carga última): aviso de salud y pestañas alineados a la columna de cada pantalla (antes corridos ~60 px), aviso más fino, menú con íconos más legibles y marca dorada en la página actual, botones con profundidad sutil, mejor contraste en textos chicos. Además: formulario de Metricool que se acomoda al ancho (antes la etiqueta se partía palabra por palabra), «Pedile algo» como único nombre del asistente y contador de captados en la paleta de la marca. Implementado y publicado: sí (Preview `dpl_5B7vNwFTib9HQUKpATqUXF8AKio5` READY en `5eec5b2`; producción `dpl_8m5JfBE978SVtHvyU24YRAriiuai` READY = `main` `8ea0c22`, sin errores de ejecución). Probado: unitarias 206/206. **Revisado visualmente en producción** desde el navegador de la responsable (Opera, solo mirando): Inicio, Redes y Configuración. Rollback: quitar el import de `afinado.css` o promover `dpl_C8yiUN8s6S69KJ3tFERsrJnZsL8Q`.

**Habilitado**: nada nuevo se activa solo. La regla de horario rige en las respuestas de los agentes activos. Facebook requiere las variables por perfil en Vercel.

## Bloques anteriores (cerrados)
- Reorganización 18/10: PR #19 (`b505fe1`), detalle en `docs/reorganizacion-1810/ENTREGA.md`.
- Rediseño integral 17/10: PR #17 (`991c871`). Plantillas: PR #18 (`fb6688f`), enviadas a Meta para los 4 rubros.

## Cómo se registra la evidencia
Implementado → Desplegado (READY) → Comprobado automáticamente → Revisado visualmente → Probado funcionalmente. Un READY solo acredita el segundo.

## Estado operativo (sin cambios por esta entrega)
- Pausa general levantada el 16/10; atención entrante 24 h; 5 agentes activos; latido `campaigns-tick` activo.
- Campañas: 1, pausada, sin iniciar. Seguimiento sin activar. Experimento A/B/C preparado, no corre.
- Migraciones: hasta `0502_bandeja_claude` (19/10).

## Pendientes
- Bandeja para Claude: verificar que producción desplegó `4f74085` (rollback: `dpl_FeydAszMcUu5MJbRJtRKwgPAvyxk` = `d7a0a0c`), decidir el PR #32 de la tarjeta negra y revisar la pantalla y el menú.
- Responsable: vincular Facebook e Instagram por perfil en Vercel (`FACEBOOK_<CLAVE>_PAGE_ID`, `FACEBOOK_<CLAVE>_PAGE_ACCESS_TOKEN`, `INSTAGRAM_<CLAVE>_BUSINESS_ID`), landings y Google Cloud. Después: 1 post diario + historias destacadas con calendario de 1 mes por rubro, y CTA/redes/marca en landings (VITA en Jurídico, CTA de WhatsApp visible en Coberturas).
- Responsable: cargar `METRICOOL_USER_TOKEN` y `METRICOOL_USER_ID` en Vercel; crear y conectar en Metricool las marcas de Coberturas, 0 km y Jurídico (y el Instagram de Kocos); cargar cada blogId en Redes › Publicaciones; pegar el enlace con origen en la biografía de Instagram.
- Responsable: completar en el Administrador de WhatsApp la verificación/registro del número de Agencia Kocos (hoy «Pendiente» en Meta) y confirmar que su token tenga acceso; después usar «Volver a comprobar con Meta».
- Revisión visual: el recorrido en PC ya se hizo (19/10). Falta mirar el modo teléfono y probar el asistente (adjuntos, tarjeta con casilla/PIN, chat de Campañas).
- Diseño, siguiente tanda posible: Configuración muestra dos flechas por grupo (› a la izquierda y ▾ a la derecha); se puede dejar una sola.
- Penal dentro de la línea de Civil con roles separados (decidido, no implementado).
- Landings (Hostinger Horizons, dominio en DonWeb) y sus CTA con origen. Localidades AMBA. Search Console. Variables/corpus (candidato C).
- Meta: estados de las plantillas enviadas; `mkt_apertura_propuesta` y `mkt_presupuesto_listo`.
- Rotar tokens/secretos pegados en el chat (incluido el PIN de ingreso, 19/10).

## Decisiones vigentes
- Nunca iniciar campañas ni contactar sin autorización expresa. Ningún pago sin autorización. Claves solo en Vercel.
- La Preview comparte base con producción: solo se mira.
- Push: `git push` da 403; se usa el conector de GitHub.
- Coberturas compara opciones; no recomienda una prepaga. Avisos a destinatarios: por ahora solo en el panel.
- Fase 3 pausada.
- Atención 24 h en todos los rubros: asesores lun a sáb 8 a 21 h; fuera de esa franja la IA atiende, intenta captar y agenda la llamada con un asesor (18/10).
- El asistente opera todo menos pagos, siempre proponiendo: lanzar campañas pide confirmación reforzada y activar agentes pide PIN; cualquier acción que gaste plata pediría autorización y PIN (19/10).
- Conversaciones y Contactos muestran solo oportunidades reales; la base fría vive en Prospectos, agrupada por base (18/10).
- Bandeja para Claude: Claude trabaja con el plan desde Cowork, sin clave de API ni tarea programada; toma lo pendiente cuando la responsable dice «ok» y todo lo que cambie el panel o el código vuelve como PR o propuesta (19/10).

## Siguiente paso
Verificar el despliegue de `4f74085`, decidir el PR #32 de la tarjeta y revisar la Bandeja. Para usarla: dejar tareas en el panel y decir «ok» en un chat nuevo del proyecto. Redes, landings y Google Cloud siguen en pausa hasta que la responsable los vincule; después, contenido de 1 mes por rubro y landings.

## Dónde leer
`CLAUDE.md` → `.claude/referencias/reglas-comunes.md` → `.claude/referencias/bandeja-claude.md` → `docs/bandeja-claude/ENTREGA.md` → `claude/PUNTO_DE_CONTROL.md`.
