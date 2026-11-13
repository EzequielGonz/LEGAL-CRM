---
description: Estado operativo vigente del panel (qué está encendido y qué no), decisiones recientes de la responsable y cómo retomar el trabajo en curso
scope: root
covers: [estado, memoria, seguimiento, wasender, plantillas, bot, despliegue, pendientes, decisiones]
---

# Estado del proyecto · memoria de trabajo

Se actualiza al cierre de cada vuelta de trabajo. Sin datos personales, claves ni códigos de acceso. Ante una contradicción, mandan `CLAUDE.md` y `.claude/referencias/reglas-comunes.md`.

Última actualización: 13/11/2026.

## Qué está encendido hoy

- **Seguimiento automático** (contactos 2 y 3) en los cuatro perfiles, desde el 12/11 8:00. Antes de cada contacto el bot decide si corresponde insistir. No se apaga ni se vuelve a encender sin que la responsable lo pida.
- **Segundo intento por Wasender** para primeros mensajes enviados desde el 13/11.
- **Cierre automático de descartes** a las 6 horas.
- **Recontacto del mismo día** (2 h + 2 h), desde el 24/10.
- **Bot: conocimiento versión 2** predefinido en los cuatro perfiles. La versión 1 se conserva.

## Qué está apagado o en pausa

- La campaña de Wasender de Jurídico está pausada y la línea de Wasender, desconectada (hay que escanear el QR). No se reanuda sola.
- Las campañas las lanza la responsable. Publicar código no lanza nada.

## Decisiones de la responsable que siguen valiendo

- Lo hecho para Meta no se pisa ni se rehace; Wasender se suma al lado.
- Nada se borra: se archiva con motivo.
- El bot insiste una sola vez; cuando alguien se pierde, sale de la vista de trabajo.
- Mejorar el bot es sumar fichas a la versión 2, no crear otra versión ni editar las existentes.
- Se trabaja con el modelo principal. Otro modelo, solo en tareas secundarias muy sencillas y sin margen de error.
- El aviso de captación queda pendiente hasta que la responsable lo pida.
- El panel tiene que poder usarse sin saber cómo está hecho: cada cifra se abre y muestra personas; textos en palabras, sin nombres internos.
- **13/11, madrugada (Plan 4):** alguien pasa a Caídos cuando, después de dejar de contestar, a los 3 días recibe un mensaje más y pasan 24 horas sin respuesta; los que ya llevan más tiempo van directo. Incidencia de una persona es solo amenaza legal o denuncia, o queja de un cliente captado; enojo, rechazo, «ya tengo abogado» o «no me escriban» pasan solos a Perdidos o No contactar. Las fallas del sistema se avisan en un lugar propio, separado. Lo ya cargado se reclasifica solo, con motivo y con lista para deshacer. Diseño «bien llamativo» (vidrio, 3D, movimiento) tomando ideas de la referencia que mandó.
- **Cada rubro va separado** (13/11): cada perfil con sus funciones y su contenido; nada de un perfil se ve ni se abre desde otro. Manda sobre cualquier pantalla o función nueva.
- **Asistente del panel con permiso para todo** (13/11): que pueda hacer todo lo que hace el panel, cambiar secciones y pedir cambios de código. Detalle y resguardos en `PLAN-4.md`, bloque G.
- Producción se publica directo (`git push origin mejoras-1211:main`) después de typecheck, lint, pruebas y build, y se recorre como usuaria antes de informar.

## Dónde está cada cosa

- Plan y pendientes de la vuelta en curso: `docs/mejoras-1311/PLAN-4.md` (lo último que pidió la responsable; va primero) y `docs/mejoras-1311/PLAN-3.md` (lo anterior que sigue pendiente).
- Qué se probó y qué no: `docs/mejoras-1311/INFORME.md`. Migraciones y cómo deshacer cambios de datos: `docs/mejoras-1311/MIGRACIONES.md`.
- Bitácora detallada de la última vuelta (commits, archivos, cambios en la base, medidas, guiones de prueba): `docs/mejoras-1311/BITACORA.md`.
- Análisis del bot y fichas agregadas: `docs/mejoras-1311/BOT-V2.md`.
- Plantillas de inicio (texto fuente y generador de variantes): `docs/mejoras-1311/plantillas-inicio.mjs`, `generar-variantes.mjs`.

## Cómo retomar

1. `git status` y `git log --oneline -5` en la rama `mejoras-1211` (tiene que coincidir con `main`).
2. Leer `PLAN-4.md` completo y seguir su orden (A a F); después «Lo que queda para la próxima vuelta» en `PLAN-3.md`.
3. Cargas grandes de datos (plantillas, variantes): por la API del panel con una sesión iniciada, no pegando SQL largo.
4. Las pruebas con efectos se hacen con casos viejos y se dejan como estaban, con registro en `ops_change_log`.

## Aprendizajes de esta vuelta

- Las tareas en segundo plano se cortan si la cuenta llega al límite de uso: guardar un punto de control en la rama antes de lanzarlas y no depender de que terminen.
- `followup_enabled_since` define desde cuándo entran conversaciones al seguimiento: lo anterior nunca entra solo.
- La falla «asistente: cada tipo permitido…» de la suite es anterior y ajena.
