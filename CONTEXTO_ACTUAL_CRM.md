# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 16/10/2026 (noche, diseño premium publicado). Sin secretos ni datos de prospectos.

## Bloque 16/10 (cierre): diseño premium del panel — PUBLICADO (PR #8)
- **Pedido**: subir un nivel el diseño desde el ingreso hasta el CRM completo (detalles, animaciones suaves, lámpara de inicio trabajada) y verlo directo en el panel. Solo presentación; landings, Meta y Fase 3 siguen en espera.
- **Hecho**: lámpara interactiva (cordón con resorte, cono de luz, polvo, teclado), tarjeta del PIN, Inicio, Perfiles, menú, tarjetas, insignias y capa global en `src/app/premium.css` (importada en `layout.tsx`; se revierte quitando ese import). Detalle en `docs/estetica/DISENO_PREMIUM_1610.md`.
- **Probado**: la escena del ingreso en un navegador real con datos sintéticos (clic, arrastre largo y corto, teclado, PC y teléfono); el panel en los 4 perfiles con CSS compilado; Preview de la rama READY con el build de Next. **No probado**: `lint` y `typecheck` por separado, «reducir movimiento» en un navegador, navegación con sesión real y dispositivos reales.
- **Publicado**: fusionado a `main` con el PR #8 por pedido expreso de la responsable (16/10). Es solo visual: no cambia datos, envíos, pausas ni migraciones.
- **Siguiente paso**: que la responsable lo mire en el panel y pida ajustes finos.

## Bloque 16/10 (noche): comparación de agentes, Marketing, estética y auditoría — CERRADO
- **Publicado**:
  - PR #4: estética por perfil (paletas `data-tema`, menú unificado, logos).
  - PR #5, squash `e0e8c32`: comparación A/B/C, Extraer negocios, Ejecutar base, Pide presupuesto, venta consultiva y correcciones de la auditoría.
  - Preview de la rama READY con el chequeo de tipos de Next. Unitarias 144/144.
  - 0310 y 0311 aplicadas, repetidas y revertidas en Postgres local.
- **No aplicado**: migraciones 0310 y 0311 y SQL 14. El código publicado funciona igual sin ellas: avisa «falta aplicar la migración».
- **No habilitado**, comprobado el 16/10:
  - pausa general activa, 0 agentes activos, 0 campañas en curso;
  - latido `campaigns-tick` inactivo;
  - 0 canales conectados.
- **Decisiones aplicadas**:
  - A = prompt actual + `gemini-3.6-flash`.
  - B = biblioteca + `gemini-3.8-flash`.
  - C = 3.5 Flash ajustado en Vertex, con tope de USD 30 y PIN.
  - Asignación fija y equilibrada por estrato (rubro|fuente|frío/actual).
  - Informes 7/14/21/28 desde el latido; un voto por informe; el empate pide decisión.
  - Un fallo fatal detiene al candidato y responde A.
  - «Pide presupuesto» = captado; aprobado = cerrado.
  - Apertura genérica sin afirmar investigación; análisis profundo con fuentes al aceptar.
  - Topes de Outscraper: 500 por extracción y 1000 por día.
- **Auditoría**: `docs/etapa3/AUDITORIA_1610.md`.
  - Críticos:
    - `META_APP_SECRET` sin valor efectivo (2 webhooks en cuarentena; último entrante el 1/10);
    - latido inactivo;
    - sin líneas, plantillas ni asignaciones;
    - perfil de Marketing sin marca (SQL 14).
  - Recomendado: Vercel Pro, índices de FK, ficha e Inbox con el marco del perfil, revisión del prompt y las plantillas viejas de Marketing, casos semilla en el corpus de C.
- **Pendientes de la responsable o el programador**:
  1. Aplicar 0310, 0311 y SQL 14.
  2. Variables `GCP_*` y `GCP_BUCKET`.
  3. Corregir `META_APP_SECRET`.
  4. Plantillas `mkt_apertura_propuesta` y `mkt_presupuesto_listo` en Meta, más su asignación.
  5. Activar el latido.
  6. Arrancar el experimento (PIN).
  7. Levantar las pausas: decisión de ellas.
- **Siguiente paso**: esperar la aplicación del SQL y las decisiones de arranque. Nada se habilita solo.

## Bloque 16/10 (tarde): landings, marca y fuentes
- Publicado: PR #3 (`065a7e1`) — `/api/landing` acepta formularios de las 4 landings (perfil por parámetro), CORS solo para sus dominios, fuente «landing». Unitarias 122/122; Preview READY.
- Preparado, sin aplicar: `14_datos_de_marca_y_fuentes.sql` (marca, asesor, líneas, textos identificadores de fuente landing/instagram/facebook, canales landing, brief de marca). Probado en base local desde cero y repetido.
- Landings (repos `estudio-juridico-vita-final`, `coberturas-sociales-landing`, `0km-kocos-agencia`, `agencia-kocos-mkt`): contacto, redes, mensaje prearmado «Hola, vengo de la web de <marca>.» y formularios → CRM. El conector de GitHub no tiene permiso de escritura en esos repos → entregados como ZIP/parche. Hosting de las landings sin confirmar (Hostinger Horizons).
- Decisiones de Vita 16/10: experimento A/B/C en todos los perfiles y canales (entrantes, campañas y bases frías) pero toda campaña o contacto se inicia solo con su autorización; A = bot actual con gemini-3.6-flash; C = Gemini 3.5 Flash ajustado, presupuesto USD 30; conversaciones reales con nombre autorizadas para entrenamiento (sin contactar); Marketing con números scrapeados: riesgo asumido; «Pide presupuesto» = Captado, «Cerrado» = presupuesto aprobado; reportes de plantillas dentro de Comparación de agentes.
- Costo de ajuste (precios oficiales): USD 10 por 1M de tokens de entrenamiento × épocas; endpoint ajustado = 1,5× el precio base de 3.5 Flash (USD 1,50/9,00 por 1M).

## Publicado 16/10
- PR #2 `etapa3` → `main` (merge `0a4fd30`), deploy de producción READY, sin errores de ejecución. SQL 0199–0300 aplicado por la responsable; verificación de seguridad: 14 controles en 0. Pausas, agentes, seguimiento, publicación y ejecutor siguen apagados.

## Estado al 15/10 (bloque: integración Etapa 3 + Gemini 3.8 + plantillas + redes)
- Autorización 15/10: la responsable pidió implementar directamente (código, base, configuración y despliegue) conservando las pausas. Restricción: autorización antes de cualquier pago.
- Gemini 3.8: `MODELO_POR_DEFECTO = gemini-3.8-flash`, `identificadorModelo()` único; sin temperature/top_p/top_k; FunctionResponse con `id`. En Vercel `GEMINI_MODEL=gemini-3.8-flash` y `GEMINI_API_KEY` nueva (Production).
- Base: respaldo completo en el esquema privado `respaldo_20261015` (43 tablas + definiciones de políticas y funciones).
- Plantillas WhatsApp: 33 propuestas (apertura A/B/C, Fase 2, seguimiento 2 y 3, reagendamiento, aviso interno y formulario por rubro), con payloads para Meta; más 2 de Marketing del 16/10 (35). Catálogo real vacío.
- Redes: estrategia y calendario de 30 días (lun/mié/vie 11:00, desde 19/10) con 48 piezas 1080×1350 y textos por red. Borrador: faltan identidad, logo y CTA. Metricool: solo la marca «Kocos Marketing» con Facebook.

## Decisiones vigentes
- Pausa general activa, agentes apagados, tarea programada inactiva, campañas pausadas, seguimiento apagado. Publicar código no habilita envíos.
- Nunca iniciar campañas ni contactar sin autorización expresa. Ningún pago sin autorización (ajuste de C: USD 30; si hace falta más, avisar).
- Claves solo en Vercel, nunca en el chat.
- La Preview comparte base y líneas con producción: solo se mira. Pruebas con efectos: entorno aislado.
- Push a GitHub: `git push` bloqueado por el proxy; se usa el conector de GitHub (`push_files`) y se verifica con `git fetch` + diff.

## Historial resumido (13/10)
- Etapa 2 (0200–0207) y Etapa 3 (0300) construidas el 13/10, publicadas el 16/10 con PR #2. Detalle en `docs/etapa2/ENTREGA.md`, `docs/etapa3/ENTREGA.md` e `INFORME.md` de cada etapa.
- Bloques 1–5 de la Etapa 2: reglas de base y captación, panel con indicadores clickeables, operación diaria (fuente, pedido de texto, búsqueda), biblioteca de agentes, contenido y SEO (políticas apagadas).
- Etapa 3: biblioteca ampliada, simulador, evaluación, corpus, validador R07 en `agent.ts`, Agentes IA unificado, Contenido con brief y auditoría de landing.

## Entorno de pruebas de Claude
PostgreSQL 16 local en 55432 (`tests/integracion/preparar_base.sh` crea `crm_pruebas`); unitarias con `tsx --tsconfig tests/sin-npm/tsconfig.json --test tests/unitarias/*.test.ts`.

## Dónde leer (solo lo pertinente)
`CLAUDE.md` → `.claude/referencias/reglas-comunes.md` (secciones 3 a 7) → skill `kocos-crm-reglas-de-captacion` → `.claude/referencias/casos-de-aceptacion.md` → `docs/etapa3/BLOQUE_1610.md` y `AUDITORIA_1610.md`.
