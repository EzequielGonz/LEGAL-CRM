# Migrar proyecto de Cowork a Code (Claude común)

Estados usados: especificado / implementado / probado / publicado / habilitado. Los datos que vienen solo del texto del chat están marcados «según el chat». Fuente: `cerebro/chats/claude-comun/2026-11-21-migrar-cowork-a-code.md`.

## 1. Encabezado

- **Título del chat:** «Migrar proyecto de Cowork a Code».
- **Inicio:** 2026-11-21 05:43. **Fin:** 2026-11-21 05:57. 4 mensajes.
- **Origen:** Claude común (exportación del 21/11/2026).
- **Id de sesión:** no consta.
- **Marcas o perfiles:** proyecto CRM (repo `EzequielGonz/LEGAL-CRM`).

## 2. Objetivo

Preguntó cómo pasar un proyecto completo de Cowork a Claude Code. Después, en el mismo chat, pidió el volcado del contexto a `cerebro-chats` (ver punto 3).

## 3. Órdenes y decisiones del dueño (textuales)

- **2026-11-21 05:43:** «como migro un proyecto completo de aca cowork a code?»
- **2026-11-21 05:56:** pidió volcar todo el contexto del chat a `cerebro/chats/` en la rama `cerebro-chats`, con el formato de 12 puntos. Textual: «Escribí SOLO en esa rama: no toques main ni ninguna otra rama ni otro archivo.» y «prefiero que sobre a que falte.»

## 4. Correcciones que hizo

- No hay correcciones en la exportación.

## 5. Qué se hizo, con estado

- **Respuesta sobre la migración:** según el chat, no hay botón para pasar un proyecto entero. Los proyectos existen solo en Cowork, según el chat (no verificado aquí). **Especificado** como guía.
- **Pasos propuestos:** clonar el repo en Claude Code; poner las reglas en un `CLAUDE.md` en la raíz; copiar los documentos del proyecto a una carpeta `docs/`; los conectores, skills y plugins siguen a la cuenta; los servidores MCP locales de la app de escritorio hay que agregarlos de nuevo. **Especificado.**
- **Tareas de Cowork:** el chat menciona «Download task data» y `/port-task-data` según una guía de terceros, y dice que no pudo confirmarlo en la ayuda oficial. **No confirmado.**
- **Paquete ofrecido:** un `CLAUDE.md` con las reglas vigentes y una carpeta `docs/` con los 16 documentos. No consta que se haya armado. **Especificado.**

## 6. Todo lo concreto

- Repo: `EzequielGonz/LEGAL-CRM`.
- Documentos del proyecto citados por el chat: `CONTEXTO_ACTUAL_CRM.md`, `PUNTO_DE_CONTROL.md`, y los de landings y SEO (16 en total, según el chat).

## 7. Datos del negocio que aparecieron

- Ninguno relevante más allá de los documentos del proyecto.

## 8. Pendiente, a medias o bloqueado

- **Paquete `CLAUDE.md` + `docs/`:** ofrecido, no confirmado como hecho.
- **Memoria del proyecto e historial de conversaciones:** no se pasan con la migración (según el chat). El chat recomienda tener `CONTEXTO_ACTUAL_CRM.md` al día antes de migrar.
- **Volcado del 21/11 05:56:** el resultado no aparece en la exportación.

## 9. Aprendizajes

- Cowork y Code no comparten la memoria del proyecto ni el historial. Los conectores y plugins sí, si se usa la misma cuenta (según el chat).

## 10. Preguntas abiertas

- ¿Existe la opción «Download task data» en Cowork? (no confirmado)
- ¿Querés el paquete con `CLAUDE.md` y `docs/`? (el repo ya tiene un `CLAUDE.md` en la raíz; ver CONTRADICE)

## 11. Ramas y cambios

- **Repos:** el chat no escribió en ningún repo. No consta commit, rama ni PR.
- **Migraciones, despliegues y configuración:** ninguno.
- **Qué quedó encendido o apagado por este chat:** nada.

## 12. CONTRADICE

- **Reglas que el chat dice que tiene el proyecto:** «una tarea por vez», «Fase 3 en pausa», «no iniciar agentes sin autorización».
  - `CLAUDE.md` dice que los trabajos grandes usan agentes en paralelo y que Claude trabaja sin pedir permiso «dale» por cada paso.
  - `cerebro/02-ordenes-vigentes.md` dice que la Fase 3 quedó «cerrada y descartada» (25/10). El chat dice «en pausa». `cerebro/06-tecnica-repos-y-accesos.md` dice que la migración 0300 de la Fase 3 nunca se aplicó.
  - `.claude/referencias/bandeja-claude.md` dice «sin activar agentes» en el contexto de la Bandeja. No hay una regla general en ese sentido en `CLAUDE.md`.
- **Crear `CLAUDE.md`:** el chat propone crearlo en la raíz. Ya existe un `CLAUDE.md` en la raíz del repo, con otras reglas.
- **Proyectos solo en Cowork:** lo dice el chat, según la ayuda de Anthropic. No verificado.
