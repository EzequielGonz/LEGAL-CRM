# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 18/10/2026 (reorganización 2, PR #20). Sin secretos ni datos de prospectos.

## Bloque actual: reorganización 2 (18/10, pedido de la responsable)
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
2. Desplegado: ver PR #20 y el registro de producción en `claude/CONTEXTO_ACTUAL_CRM.md` del proyecto.
3. Comprobado automáticamente: unitarias 190/190; build de Vercel.
4. Revisado visualmente: **pendiente** (la sesión no puede abrir el panel con ingreso).
5. Probado funcionalmente: **no** (sin páginas de Facebook vinculadas; sin contacto real).

**Habilitado**: nada nuevo se activa solo. La regla de horario rige en las respuestas de los agentes activos. Facebook requiere las variables por perfil en Vercel.

## Bloques anteriores (cerrados)
- Reorganización 18/10: PR #19 (`b505fe1`), detalle en `docs/reorganizacion-1810/ENTREGA.md`.
- Rediseño integral 17/10: PR #17 (`991c871`). Plantillas: PR #18 (`fb6688f`), enviadas a Meta para los 4 rubros.

## Cómo se registra la evidencia
Implementado → Desplegado (READY) → Comprobado automáticamente → Revisado visualmente → Probado funcionalmente. Un READY solo acredita el segundo.

## Estado operativo (sin cambios por esta entrega)
- Pausa general levantada el 16/10; atención entrante 24 h; 5 agentes activos; latido `campaigns-tick` activo.
- Campañas: 1, pausada, sin iniciar. Seguimiento sin activar. Experimento A/B/C preparado, no corre.
- Migraciones: hasta `0500_asistente_y_redes`.

## Pendientes
- Responsable: vincular Facebook e Instagram por perfil en Vercel (`FACEBOOK_<CLAVE>_PAGE_ID`, `FACEBOOK_<CLAVE>_PAGE_ACCESS_TOKEN`, `INSTAGRAM_<CLAVE>_BUSINESS_ID`), landings y Google Cloud. Después: 1 post diario + historias destacadas con calendario de 1 mes por rubro, y CTA/redes/marca en landings (VITA en Jurídico, CTA de WhatsApp visible en Coberturas).
- Responsable: cargar `METRICOOL_USER_TOKEN` y `METRICOOL_USER_ID` en Vercel; crear y conectar en Metricool las marcas de Coberturas, 0 km y Jurídico (y el Instagram de Kocos); cargar cada blogId en Redes › Publicaciones; pegar el enlace con origen en la biografía de Instagram.
- Revisión visual de la Preview/producción.
- Penal dentro de la línea de Civil con roles separados (decidido, no implementado).
- Landings (Hostinger Horizons, dominio en DonWeb) y sus CTA con origen. Localidades AMBA. Search Console. Variables/corpus (candidato C).
- Meta: estados de las plantillas enviadas; `mkt_apertura_propuesta` y `mkt_presupuesto_listo`.
- Rotar tokens/secretos pegados en el chat.

## Decisiones vigentes
- Nunca iniciar campañas ni contactar sin autorización expresa. Ningún pago sin autorización. Claves solo en Vercel.
- La Preview comparte base con producción: solo se mira.
- Push: `git push` da 403; se usa el conector de GitHub.
- Coberturas compara opciones; no recomienda una prepaga. Avisos a destinatarios: por ahora solo en el panel.
- Fase 3 pausada.
- Atención 24 h en todos los rubros: asesores lun a sáb 8 a 21 h; fuera de esa franja la IA atiende, intenta captar y agenda la llamada con un asesor (18/10).
- Conversaciones y Contactos muestran solo oportunidades reales; la base fría vive en Prospectos, agrupada por base (18/10).

## Siguiente paso
Revisión visual de la responsable y vinculación de redes, landings y Google Cloud. Después: contenido de 1 mes por rubro y landings.

## Dónde leer
`CLAUDE.md` → `.claude/referencias/reglas-comunes.md` → `docs/reorganizacion-2/ENTREGA.md` → `claude/PUNTO_DE_CONTROL.md`.
