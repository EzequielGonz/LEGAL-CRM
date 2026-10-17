# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 17/10/2026 15:15 UTC (reconciliación con evidencia y arranque del rediseño integral). Sin secretos ni datos de prospectos.

## Cómo se registra la evidencia (desde el 17/10)
Cada cambio declara por separado cinco niveles. Un despliegue READY solo acredita el segundo.
1. **Implementado**: el código está en `main` (commit).
2. **Desplegado**: Vercel lo publicó en producción (id del despliegue, READY).
3. **Comprobado automáticamente**: typecheck, lint, unitarias, build o consultas a la base, con resultado.
4. **Revisado visualmente**: alguien miró la versión publicada (o su Preview), con dispositivo, ancho y fecha.
5. **Probado funcionalmente**: se ejecutó el recorrido o la acción y se observó el efecto esperado.

## Estado operativo comprobado (17/10, 15:12 UTC, consultas de solo lectura a la base)
- **Producción**: `dpl_HqzDKxM7ViGxxd6WkSCDqKUukN7P` READY = `176e067` (PR #16).
- **Migraciones aplicadas en la base** (historial de Supabase, 16/10 entre 22:11 y 22:50 UTC): `0310_etapa3_comparacion_agentes`, `0311_marketing_extraer_y_presupuestos`, `0312_indices_claves_foraneas`, `14_datos_de_marca_y_fuentes`, `operacion_1610_levantar_pausas`, `marketing_prompt_sin_investigacion_previa`, `marketing_prompt_presupuesto_24h`, `latido_espera_55s`. **El contexto anterior las daba como pendientes: era un error.**
- **Pausa general levantada** el 16/10 22:36 UTC por pedido de la responsable («sin iniciar campañas»): `ai_replies_paused=false`, `outbound_automations_paused=false`. Atención entrante 24 h encendida en los rubros.
- **Agentes**: los 5 activos (civil, penal, coberturas médicas, autos 0 km, marketing).
- **Latido `campaigns-tick`**: activo, cada minuto. 996 corridas en 24 h, 0 fallidas, sin huecos de más de 5 min desde el 16/10 22:37. Último latido registrado por la app: 17/10 15:12 UTC (`ok: true`). Respuestas HTTP: todas 200 desde las 09:13 UTC (la base solo conserva 6 h).
- **Latido «hace 14 horas» visto en la auditoría**: no se reproduce ahora. No hay evidencia para el tramo 22:37–09:13 UTC (Vercel Hobby retiene 1 h de registros; `net._http_response`, 6 h). Si vuelve a aparecer, anotar la hora exacta para cruzarla con `cron.job_run_details`.
- **Campañas**: 1, pausada. **Experimento A/B/C**: 1, estado «preparado» (no corre). **Turnos de agente registrados**: 0. **Mensajes desde que se levantó la pausa**: 0 entrantes, 0 salientes. Último entrante: 1/10.
- **Webhooks en cuarentena**: 2 (los mismos de la auditoría). `META_APP_SECRET`: no se puede leer su valor desde la sesión; sigue como pendiente hasta que entre un webhook firmado.
- **Marca en la base** (`brand_briefs`, 4 perfiles, `completo=true`): los colores se guardan con la clave `principal`, pero `src/lib/contenido/brief.ts` busca `primario`. Esa es la causa de «falta color primario» en los cuatro formularios de Contenido.

## Correcciones al registro
- **PR #16** (`176e067`, logos sobre placa negra): se fusionó 7 segundos después de abrirse. Se implementó y se desplegó (READY). **No hubo revisión visual de la versión publicada ni prueba funcional.** Solo se revisó local con datos de ejemplo. La entrada anterior que decía «verificado en producción en PC y teléfono» era incorrecta: salió de un resumen y no de la evidencia.
- **PR #13 a #15**: las revisiones en producción con Sandbox y PIN quedaron registradas por la sesión del 17/10, pero no se guardaron capturas. Se consideran «revisado visualmente (sin capturas archivadas)».

## Bloque en curso: rediseño integral (pedido del 17/10)
Plan, matriz de hallazgos y criterios de aceptación en `docs/rediseno/PLAN.md`. Orden: 1) navegación, regreso, diálogo, etiquetas y anclas; 2) marca, títulos, favicon y fuente única de configuración; 3) configuración completa y pantallas habituales simples; 4) tipografía, componentes, composición y movimiento; 5) verificación en los cuatro perfiles, escritorio y teléfono. Se conservan datos, reglas, agentes, estados, archivos originales, integraciones y el estado operativo actual.

## Bloque 17/10 (4): logos sobre placa negra — DESPLEGADO, sin revisión (PR #16, `176e067`)
- Implementado: los logos (fondo transparente) se muestran sobre negro en el selector, el menú, la barra del teléfono y la vista Teléfono. Solo diseño.
- Desplegado: `dpl_HqzDKxM7ViGxxd6WkSCDqKUukN7P` READY. Revisión visual de la versión publicada y prueba funcional: **no hechas**.

## Bloque 17/10 (3): logos reales y lámpara solo en el ingreso — PUBLICADO (PR #15, `eb3b348`)
- Logos reales enviados por la responsable en `public/logos/*.svg` (imagen embebida); `MARCAS` apunta ahí y el menú los prioriza (`brand_briefs.logo_ref` sin tocar: cambiar el logo desde la configuración ya no cambia el menú). Paletas de marca sin cambios; el selector muestra la paleta al pie de cada logo y toma la paleta del perfil elegido. Logo general simple (`marca-panel.tsx`, cuatro piezas con el acento de cada perfil) en ingreso, inicio y perfiles. La lámpara queda solo en el ingreso.
- Revisado visualmente en producción según la sesión del 17/10 (PC 1440 y teléfono 390, Sandbox temporal detenido; sin capturas archivadas).

## Bloque 17/10 (2): ingreso grafito y sala por perfil — PUBLICADO (PR #14, `fba01f8`)
- Tarjeta de ingreso grafito con texto claro y acentos de latón; PIN con etiqueta a 8 px de separación, campo y botón de 48 px alineados, un solo borde y sin segmentos de progreso; pared lisa. El selector de perfiles toma la paleta del perfil elegido.
- Revisado visualmente en producción según la sesión del 17/10 (PC 1440 y teléfono 390): ingreso con PIN OK y paleta y logo correctos en los 4 perfiles.

## Bloque 17/10: sala de la lámpara e identidad por perfil — PUBLICADO (PR #13, `e9eef18`)
- Lámpara protagonista del ingreso con sala anclada a su base; pantallas comunes con `data-tema="neutro"` (grafito y latón) y sello propio; VITA solo en Jurídico; logos de `MARCAS` sin filtros; PIN con etiqueta y foco visible.
- Desplegado `dpl_7wLHgVqsgkU7HY1YDUv4EKpLG7NT`. Revisado visualmente en la Preview con Sandbox (PC 1440/1280 y teléfono 390). No comprobado: teléfono físico y «reducir movimiento».

## Bloque 16/10 (cierre 4): fondo geométrico 3D e íconos propios — PUBLICADO (PR #12, `87e76a6`)
- SVG de escena, ilustraciones 3D, `icono-seccion.tsx` como familia única (trazo 1.6), `src/app/escena.css`. Se quitaron auroras y manchas; emojis reemplazados en barra de salud, derivar caso y `/telefono`. Desplegado `dpl_GD25vqn2a8m4mzsC3RXCNTVWc3oC`. Revisión con datos sintéticos en local.

## Bloque 16/10 (cierre 3): rediseño «Estudio» y capa inmersiva — PUBLICADO (PR #10 y #11)
- `estudio.css`, `inmersivo.css` y `efectos-3d.tsx` (luz que sigue al puntero). El rediseño integral del 17/10 pide quitar esa capa dentro del CRM.

## Bloque 16/10 (cierre 2): mejora visual integral y rendimiento — PUBLICADO (PR #9, `f5a3f61`)
- Funciones en `gru1` junto a la base `sa-east-1`; `xlsx`/`papaparse` con carga diferida; marca del perfil en caché 5 min y barra de salud en caché 60 s; `next/font`; `loading.tsx`; `controles.css`. La base no es el cuello (conteos de 50–140 ms).

## Bloque 16/10 (cierre): diseño premium del panel — PUBLICADO (PR #8)
- Lámpara interactiva, tarjeta del PIN, Inicio, Perfiles, menú y `premium.css`. Detalle en `docs/estetica/DISENO_PREMIUM_1610.md`.

## Bloque 16/10 (noche): comparación de agentes, Marketing, estética y auditoría — CERRADO
- Publicado: PR #4 (estética por perfil) y PR #5 (`e0e8c32`: comparación A/B/C, Extraer negocios, Ejecutar base, Pide presupuesto, venta consultiva). Unitarias 144/144.
- Decisiones: A = prompt actual + `gemini-3.6-flash`; B = biblioteca + `gemini-3.8-flash`; C = 3.5 Flash ajustado en Vertex, tope USD 30 y PIN; asignación fija y equilibrada por estrato; informes 7/14/21/28; un fallo fatal detiene al candidato y responde A; «Pide presupuesto» = captado, aprobado = cerrado; apertura genérica sin afirmar investigación; topes de Outscraper 500 por extracción y 1000 por día.
- Auditoría: `docs/etapa3/AUDITORIA_1610.md`.
- **Pendientes reales al 17/10** (ya resueltos: 0310, 0311, 0312, SQL 14, latido y pausas):
  1. Variables `GCP_*` y `GCP_BUCKET` (para el candidato C).
  2. Corregir `META_APP_SECRET` (2 webhooks en cuarentena).
  3. Plantillas `mkt_apertura_propuesta` y `mkt_presupuesto_listo` en Meta, más líneas y asignaciones.
  4. Arrancar el experimento (PIN): decisión de la responsable.

## Bloque 16/10 (tarde): landings, marca y fuentes
- PR #3 (`065a7e1`): `/api/landing` acepta los formularios de las 4 landings, CORS solo para sus dominios, fuente «landing». SQL 14 aplicado el 16/10.
- Landings en repos propios (`estudio-juridico-vita-final`, `coberturas-sociales-landing`, `0km-kocos-agencia`, `agencia-kocos-mkt`), entregadas como ZIP/parche. Hosting sin confirmar (Hostinger Horizons).
- Decisiones de Vita 16/10: experimento A/B/C en todos los perfiles y canales, pero toda campaña o contacto se inicia solo con su autorización; conversaciones reales autorizadas para entrenamiento (sin contactar); Marketing con números scrapeados: riesgo asumido; reportes de plantillas dentro de Comparación de agentes.
- Costo de ajuste: USD 10 por 1M de tokens de entrenamiento × épocas; endpoint ajustado = 1,5× el precio base de 3.5 Flash.

## Publicado 16/10
- PR #2 `etapa3` → `main` (`0a4fd30`). SQL 0199–0300 aplicado por la responsable; verificación de seguridad: 14 controles en 0.

## Estado al 15/10
- Autorización 15/10: implementar directamente (código, base, configuración y despliegue). Restricción: autorización antes de cualquier pago.
- Gemini 3.8 por defecto; `GEMINI_MODEL` y `GEMINI_API_KEY` en Vercel (Production).
- Respaldo de la base en el esquema privado `respaldo_20261015`.
- Plantillas WhatsApp: 35 propuestas con payloads para Meta; catálogo real vacío.
- Redes: calendario de 30 días con 48 piezas (borrador).

## Decisiones vigentes
- Estado operativo actual (decisión de la responsable del 16/10): pausa general levantada, agentes activos, latido activo, atención entrante 24 h; **campañas pausadas y sin iniciar**; seguimiento por perfil sin activar. El rediseño no cambia nada de esto.
- Nunca iniciar campañas ni contactar sin autorización expresa. Ningún pago sin autorización (ajuste de C: USD 30).
- Claves solo en Vercel, nunca en el chat.
- La Preview comparte base y líneas con producción: solo se mira. Pruebas con efectos: entorno aislado con datos ficticios.
- Push a GitHub: `git push` bloqueado por el proxy; se usa el conector de GitHub (`push_files`) y se verifica con `git fetch` + diff.
- Un PR no se fusiona sin registrar qué niveles de evidencia alcanzó.

## Historial resumido (13/10)
- Etapa 2 (0200–0207) y Etapa 3 (0300) construidas el 13/10, publicadas el 16/10. Detalle en `docs/etapa2/` y `docs/etapa3/`.

## Entorno de pruebas de Claude
PostgreSQL 16 local en 55432 (`tests/integracion/preparar_base.sh` crea `crm_pruebas`); unitarias con `tsx --tsconfig tests/sin-npm/tsconfig.json --test tests/unitarias/*.test.ts`.

## Dónde leer (solo lo pertinente)
`CLAUDE.md` → `.claude/referencias/reglas-comunes.md` (secciones 3 a 7) → skill `kocos-crm-reglas-de-captacion` → `.claude/referencias/casos-de-aceptacion.md` → `docs/rediseno/PLAN.md` → `docs/etapa3/AUDITORIA_1610.md`.
