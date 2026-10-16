# Herramientas para trabajar en el CRM · Entrega 1

Fecha: 13/10/2026. No cambia el panel, la base ni ningún comportamiento: agrega instrucciones y guías para las sesiones de Claude que trabajan en este repositorio.

## Qué incluye

| Archivo o carpeta | Para qué |
| --- | --- |
| `CLAUDE.md` | Instrucciones de entrada: reglas que no se negocian, comandos y convenciones |
| `.claude/skills/kocos-*` (6) | Reglas del proyecto: contexto, captación y contacto, diseño y accesibilidad, pruebas de aceptación, landings y SEO, agentes y evaluación |
| `.claude/skills/` de terceros (11) | Guías de diseño, accesibilidad, React, Postgres y SEO, con su licencia |
| `.claude/skills/PROCEDENCIA.md` | Origen, commit, licencia y cambios de cada skill de terceros |
| `tsconfig.json` | Excluye `.claude` de la compilación, por precaución |

## Comprobado (13/10)

- Las 17 skills tienen nombre y descripción válidos, y el nombre coincide con su carpeta.
- Claude Code descubre las seis skills `kocos-*` al abrir el repositorio.
- El buscador local de `ui-ux-pro-max` responde sin red.
- Ningún archivo nuevo tiene secretos, teléfonos ni datos personales.
- Subido después de la Etapa 2, el resultado es idéntico a aplicar los dos parches sobre `fb5cdc3`. El único archivo en común con el ZIP de la Etapa 2 es `tsconfig.json`.

## Cómo aplicarlo

El ZIP trae **solo los archivos nuevos o cambiados**, no el proyecto completo, así que no pisa la Etapa 2.

1. Subí `kocos-pipeline-herramientas-1.zip` a la rama `etapa2` **después** del ZIP de la Etapa 2 (o a una rama propia creada desde `main`). El flujo «Aplicar pipeline Kocos» lo descomprime. Si lo subís antes, el ZIP de la Etapa 2 devuelve `tsconfig.json` a la versión anterior; no rompe nada, porque `.claude` no tiene archivos TypeScript, pero se pierde esa precaución.
2. La compilación de la Preview tiene que terminar bien, igual que siempre.
3. Se publica con el mismo pull request de la rama.

Reversión: borrar `CLAUDE.md` y `.claude/`, y volver `tsconfig.json` a la versión anterior. No hay nada en la base.

## Lo que no incluye

La auditoría inicial del panel está en el documento de análisis compartido y no en el repositorio, porque el repositorio es público y la auditoría describe puntos de seguridad todavía abiertos.
