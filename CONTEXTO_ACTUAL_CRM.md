# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 13/10/2026. Sin secretos ni datos de prospectos.

## Versión base
- Producción y GitHub `main`: `fb5cdc3` (Etapa 1 publicada). Nada de lo de abajo está publicado.
- Esta copia de trabajo = `fb5cdc3` + cambios sin publicar (ZIP `kocos-copia-de-trabajo-1310.zip`).

## Qué contiene la copia de trabajo (cinco estados)
| Parte | Especificado | Implementado | Probado | Publicado | Habilitado |
| --- | --- | --- | --- | --- | --- |
| Etapa 2 · 2.0 horarios y calendario (migración 0200) | sí | sí | sí, también con dependencias reales (12/10) | no | no |
| Etapa 2 · 2.3 circuito de seguimiento (0201) | sí | sí | sí, también con dependencias reales | no | no (apagado en los 4 perfiles) |
| Bloque 1.12 sesión comprobada en cada operación privada | sí | sí | sí, con reemplazos locales (73 unitarias, 61 integración) | no | — |
| Migración 0202 (funciones sin acceso público) | sí | sí | sí, sobre copia de la base | no | — |
| Skills `kocos-*`, `CLAUDE.md`, `.claude/referencias/` | sí | sí | sí | no | — |
| Bloque 1 nuevo: `src/lib/contacto/origen.ts`, `src/lib/captacion/reglas.ts` | sí | **recién empezado** (solo reglas puras, sin pruebas ni uso) | no | no | no |

Migraciones de la base real: 0199, 0200, 0201 y 0202 **no aplicadas**. Orden previsto: 0199 → `select etapa1_reconciliar_posteriores();` → 0200 → 0201 → 0202 (ver `docs/etapa2/MIGRACIONES.md`).

## Decisiones vigentes
- Pausa general activa, agentes apagados, tarea programada inactiva, campañas pausadas, seguimiento apagado. Publicar código no habilita envíos.
- Fase 3 (entrenamiento, fine tuning, reformulación) **pausada**. Instalar skills no autoriza etapas, envíos, publicaciones ni gastos.
- Entrega por un único ZIP + guía de máximo 5 pasos + SQL en orden. Claude no escribe en GitHub. La responsable decidió dejar la seguridad (0202 y verificación final) **para el final**.
- La Preview comparte base y líneas con producción: solo se mira. Pruebas con efectos: entorno aislado (sandbox de Vercel, datos ficticios, Meta simulado).
- Todo el parche 2.0 **menos el entrenamiento** se integra en esta etapa, sumando sobre lo existente (no se rehace nada).

## Plan pendiente (en orden)
1. **Bloque 1 · Reglas de base + captación:** origen de tarea; entrantes 24 h (perfil+agente habilitados, sin pausa, sin chat tomado) vs salidas de la empresa L–S 8–21; resultado posterior a la derivación (dimensión propia, sin secuencias); clasificación de atención humana (12.2) y disculpa con detención; captación por rubro (2.1, 2.2 ruta jurídica Fase 1/2 y ruta rápida, 2.4 coberturas/autos con zona en 3 valores); avisos de captación por evento único (2.9). Migración 0203. Pruebas A08, A09, A13–A15, A17–A20.
2. **Bloque 2 · Panel:** navegación y sistema visual, estadísticas clickeables con la misma consulta que su lista, ficha común (2.5) con resultado posterior y atención humana, flujos más simples, accesibilidad y teléfono. Sin capturas.
3. **Bloque 3 · Operación diaria:** búsqueda en bandeja/prospectos, panorama de bases y campañas, creación guiada de campañas (queda pausada), agenda sin cupos de IA; fuente (2.8), adjuntos (2.6), marketing (2.7).
4. **Bloque 4 · Biblioteca de agentes:** solo configuración y vista; apagados; sin simulador ni fine tuning.
5. **Bloque 5 · SEO y contenido:** política de autopublicación con retención, cola con deduplicación, Search Console por API con OAuth; todo sin conectar ni habilitar.
6. **Cierre:** verificación con dependencias reales, seguridad (0202), ZIP único, parche, huellas, SQL en orden, guía de 5 pasos, informe.

## Siguiente paso
Continuar el bloque 1 desde los dos archivos de reglas puras: agregar pruebas unitarias, migración 0203 y conectar al flujo entrante (`src/lib/inbound.ts`, `src/lib/ai-agent/`), al motor de seguimiento y a la API de oportunidades.

## Dónde leer (solo lo pertinente)
`CLAUDE.md` → `.claude/referencias/reglas-comunes.md` (secciones 3 a 7) → skill `kocos-crm-reglas-de-captacion` → `.claude/referencias/casos-de-aceptacion.md`.
