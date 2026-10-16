# Etapa 2 · Migraciones (entrega única del 13/10)

Todas son **aditivas y repetibles**: se pueden correr dos veces sin error y la versión publicada (`fb5cdc3`) sigue funcionando con todas aplicadas (sus 39 pruebas de integración pasan sobre una base con 0199 a 0207, con imitaciones de las bibliotecas). Ninguna envía mensajes, activa tareas ni habilita nada.

## Orden exacto (editor SQL de Supabase, cada archivo completo)

| # | Archivo | Qué hace |
| --- | --- | --- |
| 1 | `0199_etapa1_cierre_rls.sql` | Cierre de RLS de la Etapa 1 (quita las 23 políticas públicas y los permisos de la clave pública) |
| 2 | `select public.etapa1_reconciliar_posteriores();` | Reconciliación de la Etapa 1 (una sola vez, después de 0199) |
| 3 | `0200_etapa2_calendario.sql` | Excepciones del calendario de contacto |
| 4 | `0201_etapa2_seguimiento.sql` | Circuito de seguimiento (apagado en los 4 perfiles) |
| 5 | `0202_etapa1_funciones_sin_acceso_publico.sql` | Funciones antiguas sin permiso público; `search_path` fijo |
| 6 | `0203_etapa2_reglas_base.sql` | Origen de las salidas, atención entrante 24 h (apagada), resultado posterior, captación como evento único con avisos, zona en tres valores, atención humana clasificada, citas de IA y único reagendamiento |
| 7 | `0204_etapa2_operacion_diaria.sql` | Fuente acreditada, textos identificadores por perfil, búsqueda en columnas importadas (con carga inicial), pedido de texto ante adjuntos |
| 8 | `0205_etapa2_biblioteca_agentes.sql` | Biblioteca de agentes (5 agentes apagados, historial de versiones) |
| 9 | `0206_etapa2_contenido_y_seo.sql` | Contenido automático (políticas apagadas, calendario en pausa), cola de publicación, resultados, pedidos y Search Console |
| 10 | `0207_etapa2_cierre_seguridad.sql` | **Seguridad al final**: RLS en todas las tablas, sin permisos para la clave pública, `search_path` fijo en toda función |
| 11 | `docs/etapa2/sql/verificar_seguridad.sql` | Comprobación de solo lectura: **todas las cifras deben dar 0** |

**Importante: el SQL va antes que el código.** El código nuevo lee columnas de 0203–0206. Si se publicara antes, los mensajes se guardan igual (sin origen), pero algunas pantallas nuevas mostrarían error hasta aplicar el SQL.

Antes de empezar, comprobá la versión real de la base (qué tablas y funciones ya existen). Al 13/10 no está aplicada ninguna de 0199 a 0207.

## Reversión

- **Código:** «Instant Rollback» en Vercel al despliegue anterior.
- **0203–0206:** `docs/etapa2/sql/revertir_0203_0207.sql`. Se **detiene sin tocar nada** si ya hay datos de estos bloques (captaciones, citas de IA, fuentes, mensajes con origen, piezas, pedidos, versiones editadas, conexiones). 0207 no se revierte (solo quita permisos públicos).
- **0200–0201:** `docs/etapa2/sql/revertir_0200_0201.sql` (mismo criterio).
- 0199 y 0202 no se revierten (son seguridad).

## Comprobaciones hechas (13/10, base de pruebas local: PostgreSQL 16.15 + PostgREST 12.2.3)

- Todas las migraciones aplicadas desde cero sobre la estructura previa a la Etapa 1, sin errores; 0203 a 0207 aplicadas dos veces seguidas, sin errores.
- `verificar_seguridad.sql`: 0 en los diez controles (tablas sin RLS, permisos públicos, políticas abiertas, funciones públicas, funciones sin `search_path`, seguimiento activado, 24 h activada, publicación habilitada, agentes no apagados, pausa levantada).
- Reversión: sin datos, quita todo y 0203–0207 se vuelven a aplicar sin errores; con un dato, se detiene y no borra nada.
- Versión publicada `fb5cdc3` sobre la base con todo aplicado: 39 de 39 pruebas de integración.
- **No comprobado:** la aplicación sobre una copia de la base real con estas migraciones nuevas (0203–0207) y la verificación con las dependencias reales (ver `INFORME.md`).

Historial de la entrega anterior: `historial/MIGRACIONES-entrega1-verificada.md`.
