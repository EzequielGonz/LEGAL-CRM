# Informe · recontacto por plantilla y gravedad (22/11)

Distingue lo especificado, implementado, probado, publicado y habilitado. Versión comprobada: rama `captacion/recontacto-plantillas-y-gravedad`.

- **Especificado e implementado**: recontacto del contacto 2 por plantilla de Meta (una por oportunidad y como máximo una por teléfono cada 30 días, tope diario por perfil, calidad, freno, horarios, baja), gravedad en las colas de Jurídico y la migración 0640.
- **Probado**: pruebas unitarias y una prueba de la migración en Postgres local (abajo).
- **Publicado**: no. **Habilitado**: no (la migración no se aplicó; sin ella, el código se comporta como antes).

## Qué se probó

- `npm run typecheck` y `npx tsc -p tests/tsconfig.json --noEmit`.
- Pruebas unitarias `tests/unitarias/*.test.ts` (incluye `recontacto-2211-plantilla`, `recontacto-2211-gravedad-campanas` y `recontacto-2211-revision`: una prueba por arreglo de las dos revisiones independientes).
- `npm run build` (con `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`: este entorno no sale a `fonts.googleapis.com`).
- Migración 0640 en Postgres 16 local: dos corridas seguidas sin error; reemplazo del índice viejo; la función de reserva (`ok`, `ya_recibio` por teléfono y por oportunidad, ventana de 30 días, otro rubro, `tope_dia`, `reserva_perdida`); permisos (`anon` no ejecuta); dos sesiones simultáneas (la segunda espera el candado y recibe `ya_recibio`); relleno de la ventana (solo paso 2, enviadas, últimos 30 días, Jurídico; segunda corrida sin cambios) y la normalización SQL contra los mismos formatos que el código.

## Qué no se probó

- El motor contra una base real (Supabase): las lecturas, los filtros `.or(...)` de PostgREST y el reordenamiento de campañas se verificaron sobre el código, no ejecutados.
- La función de reserva contra el esquema completo de producción (solo tablas mínimas).
- `tests/integracion/correr.sh` (necesita base) y la Preview (comparte base y líneas con producción: probar ahí tiene efectos reales).
- Envíos reales a Meta, el reordenamiento con una cola grande y el presupuesto de tiempo con latencia real.
- `npm run lint` (falla en este entorno por `next/core-web-vitals`).

## Riesgos conocidos

Ver `ENTREGA.md` (autos con calidad baja, Marketing sin línea, costo de las plantillas, tareas en conflicto de producción).
