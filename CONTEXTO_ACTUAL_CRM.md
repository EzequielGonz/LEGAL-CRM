# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 18/10/2026 (reorganización 18/10 integrada en el PR #19). Sin secretos ni datos de prospectos.

## Bloque actual: reorganización 18/10 (pedido de la responsable)
Detalle en `docs/reorganizacion-1810/ENTREGA.md`. Rama `reorganizacion-1810`, PR #19 → `main`.

**Qué cambió**
- Renovación visual de todo el panel en `src/app/renovacion.css` (se carga al final; `globals.css`, `panel.css` y `marca.ts` sin cambios).
- Menú de 6 secciones iguales en los 4 perfiles: Inicio, Conversaciones, Contactos (con Citas), Captación, Redes y contenido, Configuración. Pestañas por sección.
- Se quitó el selector Simple/Avanzado: lo avanzado se despliega con «Más opciones» y se pliega al cambiar de pantalla.
- Inicio: captados sin derivar primero, con su cita (Fase 2 marcada).
- Perfiles: tarjetas con pendientes, lápiz (nombre, nombre interno, logo, color) y tres puntos (campañas y publicaciones).
- Asistente IA del panel: propone y ejecuta solo con «Confirmar» (publicaciones, cambio de bot con deshacer, pausar campaña).
- Puntaje 0–100 de los bots con resultados reales.
- Redes: calendario Metricool (posteo, historia, carrusel; sin videos), perfil de empresa de WhatsApp por línea, plantillas por archivo ruteadas por perfil, publicidad configurada y apagada, enlaces de WhatsApp con origen por red.
- Migración `0500_asistente_y_redes` (tabla `asistente_acciones`, depósito `marca`, ajuste `publicidad` apagado): **aplicada en la base** (historial de Supabase, comprobado 18/10).

**Evidencia**
1. Implementado: rama `reorganizacion-1810`, remoto = local (comparación archivo por archivo con `git fetch` + diff).
2. Desplegado: Preview `dpl_132XR4NMHoqCG62J9G5z8t3CE6QY` READY (`ea31b39`, todo el código). Producción: ver sección siguiente.
3. Comprobado automáticamente: unitarias 183/183 (tsx); build de Vercel sin errores (incluye typecheck y lint de Next).
4. Revisado visualmente: **pendiente**. La sesión no puede abrir la Preview con sesión del panel (pide ingreso) y el navegador local no llega a vercel.app. Lo revisa la responsable.
5. Probado funcionalmente: **no**. Asistente, Metricool y perfil de WhatsApp no se ejecutaron contra servicios reales.

**Habilitado**: nada nuevo se activa solo. Publicaciones necesitan `METRICOOL_USER_TOKEN` y `METRICOOL_USER_ID` en Vercel, blogId por perfil y «Publicar solo» activado. Publicidad apagada.

## Bloques anteriores (cerrados)
- Rediseño integral 17/10: PR #17 (`991c871`). Plantillas: PR #18 (`fb6688f`), enviadas a Meta para los 4 rubros.

## Cómo se registra la evidencia
Implementado → Desplegado (READY) → Comprobado automáticamente → Revisado visualmente → Probado funcionalmente. Un READY solo acredita el segundo.

## Estado operativo (sin cambios por esta entrega)
- Pausa general levantada el 16/10; atención entrante 24 h; 5 agentes activos; latido `campaigns-tick` activo.
- Campañas: 1, pausada, sin iniciar. Seguimiento sin activar. Experimento A/B/C preparado, no corre.
- Migraciones: hasta `0500_asistente_y_redes`.

## Pendientes
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

## Siguiente paso
Revisión visual de la responsable. Después: Penal dentro de Civil, o landings.

## Dónde leer
`CLAUDE.md` → `.claude/referencias/reglas-comunes.md` → `docs/reorganizacion-1810/ENTREGA.md` → `claude/PUNTO_DE_CONTROL.md`.
