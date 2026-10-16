# Etapa 3 · Migraciones

Una sola migración nueva, **aditiva y repetible**: `supabase/migrations/0300_etapa3_agentes_y_entrenamiento.sql`. Se aplica **después** de 0199–0207 (Etapa 2) y se vuelve a correr `0207` al final (barrido genérico de seguridad). Ninguna envía mensajes, activa tareas ni habilita nada: `tareas_servidor` nace apagado, no hay asignaciones, no hay trabajos de ajuste.

## Orden exacto (editor SQL de Supabase, cada archivo completo)

| # | Archivo | Qué hace |
| --- | --- | --- |
| 01–10 | los de la Etapa 2 (ver `docs/etapa2/MIGRACIONES.md`) | 0199, reconciliación, 0200–0207 |
| 11 | `0300_etapa3_agentes_y_entrenamiento.sql` | Biblioteca ampliada (instrucciones, modelo, publicación, claves libres), asignaciones, módulos, pedidos, simulador, casos y resultados de evaluación, corpus, trabajos de ajuste, comparaciones, brief de marca, auditorías; tipos de evento con PIN; `tareas_servidor` apagado; RLS, sin borrados y sin permisos públicos |
| 12 | `0207_etapa2_cierre_seguridad.sql` (otra vez) | Barrido final: RLS, permisos y `search_path` sobre todo lo nuevo |
| 13 | `docs/etapa3/sql/verificar_seguridad.sql` | Solo lectura: **las 14 cifras deben dar 0** |

Antes de empezar, comprobá la versión real de la base. Al 13/10 no hay nada de 0199 a 0300 aplicado.

## Reversión

- **Código:** «Instant Rollback» en Vercel.
- **0300:** `docs/etapa3/sql/revertir_0300.sql`. Se **detiene sin tocar nada** si ya hay datos de la etapa (agentes creados, asignaciones, corridas, resultados, corpus, trabajos, briefs, auditorías, pedidos, eventos con PIN). Vuelve la lista cerrada de claves de 0205 y los tipos de evento de 0203; quita `tareas_servidor`.
- Etapa 2: `docs/etapa2/sql/revertir_0203_0207.sql` y `revertir_0200_0201.sql`.

## Comprobaciones hechas (13/10, base de pruebas local: PostgreSQL 16.15 + PostgREST 12.2.3)

- Todo aplicado desde cero (estructura previa a la Etapa 1 → 0300) sin errores; 0300 aplicada dos veces seguidas sin errores.
- Reversión sin datos: quita todo y 0300 se vuelve a aplicar; con datos se detiene (comprobado en las pruebas de integración: `tuning_jobs` y demás tablas no admiten borrado).
- `verificar_seguridad.sql`: 0 en los 14 controles (los 10 de la Etapa 2 más asignaciones activas, publicadas sin evaluación, trabajos en el proveedor y ejecutor encendido).
- **No comprobado:** aplicación sobre una copia de la base real.
