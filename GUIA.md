# Bloque 4 · rediseño (sistema visual y movimiento)

Rama destino: `rediseno-b4` (sobre `rediseno-b3` = 23d3ab7). No aplicar sobre `main`.
Commit de origen: 8fe7a8b (local de Cowork), con el parche completo en `rediseno-b4.patch`.

## Contenido
- Archivos nuevos o modificados (ya en su versión final), en su ruta original del repo.
- `borrar.txt`: 5 archivos a eliminar (premium.css, estudio.css, inmersivo.css, escena.css, efectos-3d.tsx).
- `cambios.txt`: lista completa de cambios (estado + ruta).
- `rediseno-b4.patch`: mismo cambio en formato parche, para `git apply`.

## Cómo aplicar (opción A: parche)
1. `git checkout rediseno-b4` (desde 23d3ab7).
2. `git apply --check rediseno-b4.patch` y luego `git apply rediseno-b4.patch`.
3. Commit y push a `rediseno-b4`.

## Cómo aplicar (opción B: archivos)
1. Copiar los archivos de esta carpeta sobre el repo, en sus rutas.
2. Borrar los 5 archivos de `borrar.txt`.
3. Commit y push a `rediseno-b4`.

## Verificación antes de integrar
- `npm run typecheck && npx tsc -p tests/tsconfig.json --noEmit`
- `npm run lint`
- `npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts`
- `npm run build`
Las pruebas de navegador (B1, B2-3, B3, B4, marca-agente) se corren en el entorno aislado; no se ejecutan contra producción.

## Reversión
Volver a 23d3ab7 (`git reset --hard 23d3ab7` en la rama local, o no integrar `rediseno-b4`).

## Estado
Implementado y no verificado todavía: typecheck, lint, build y pruebas de navegador pendientes. No está publicado ni habilitado. No incluye cambios de envíos, campañas, agentes ni seguimiento.
