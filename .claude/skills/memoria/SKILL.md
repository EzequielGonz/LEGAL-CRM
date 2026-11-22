---
name: memoria
description: Usar cuando el dueño escribe «memoria» (o «actualizá mi perfil», «cargá la memoria en claude.ai», «arreglá mi memoria»). Se conecta a su Chrome con Claude in Chrome y reemplaza en claude.ai sus preferencias personales, su memoria y las instrucciones y el conocimiento del proyecto «CRM COMPLETO» con los textos de cerebro/19 y cerebro/20, guardando antes una copia de lo que había.
---

# Sesión «memoria»

El dueño quiere que su cuenta de claude.ai quede con todo el conocimiento del proyecto. Lo hacés vos desde su Chrome, no él a mano. Hablale en rioplatense, corto, en masculino.

## Antes de tocar nada

1. Leé `cerebro/19-perfil-y-memoria-claude-ai.md` (los tres textos) y comprobá que existe `cerebro/20-conocimiento-para-claude-ai.md`. Si `19` es más viejo que la última entrada de `cerebro/bitacora.md` o que `02-ordenes-vigentes.md`, primero actualizalo con lo nuevo (sin perder nada de lo que ya tiene).
2. Cargá la skill `anthropic-skills:chrome-browser` y seguila. Si solo está `enable__mcp__claude-in-chrome`, llamalo. Cargá en una sola búsqueda: `tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `read_page`, `find`, `form_input`, `computer`, `get_page_text`, `file_upload`, `tabs_close_mcp`.
3. **Si esta sesión corre en la nube (claude.ai/code en el navegador o el celular), no hay Claude in Chrome**: la extensión solo se conecta en Claude Code en la compu, en la app de escritorio o en Cowork. El Chromium de la nube no tiene sus sesiones y no sirve para esto. En ese caso no busques otros caminos: hacé el **plan B** de abajo.

## Plan B (sesión en la nube): prompt para Claude in Chrome

1. Asegurate de que `19` y `20` estén al día y subidos a `main`.
2. Generá `cerebro/biblioteca/prompt-memoria-claude-in-chrome.md`: un solo prompt para pegar en el panel lateral de **Claude in Chrome** (la extensión, en su Chrome, logueado en claude.ai). El prompt trae adentro los tres textos completos de `19` y le pide a la extensión: abrir claude.ai/settings, copiar lo que hay a una nota antes de cambiar, reemplazar preferencias personales, cargar la memoria (por la pantalla de Memoria o diciéndoselo a Claude en un chat nuevo), reemplazar las instrucciones del proyecto «CRM COMPLETO», subir el archivo `20` (que él descarga antes) y verificar con la pregunta de prueba.
3. Mandale el archivo con `SendUserFile` y explicale en 4 pasos: instalar o abrir Claude in Chrome, descargar `20` (enlace de GitHub en modo raw o el archivo que le mandás), pegar el prompt en el panel lateral, aprobar los permisos de claude.ai cuando los pida.
4. Si los campos tienen límites, el prompt indica qué recortar primero (lo menos importante, al final de cada grupo).

## Qué cambiar (siempre: leer lo que hay, guardarlo, reemplazar, verificar)

Nada se borra sin copia: antes de reemplazar cada texto, copiá lo que había a `cerebro/biblioteca/claude-ai-antes-<AAAA-MM-DD>.md`.

1. **Preferencias personales**: claude.ai → Configuración → General (o Perfil) → campo de preferencias personales. Reemplazá todo por el bloque § 1 de `19`. Guardá.
2. **Memoria**: claude.ai → Configuración → Capacidades → Memoria → ver o editar. Si el panel deja editar, pedile que reemplace la memoria con el bloque § 2 de `19`. Si solo se edita conversando, abrí un chat nuevo de claude.ai (fuera de proyectos), pegá el bloque § 2 con la frase «Reemplazá todo lo que recordás sobre mí por esto, y olvidá lo que lo contradiga:» y comprobá después en el panel de Memoria que quedó. Si el texto es más largo de lo que acepta, cargalo en partes por grupo.
3. **Proyecto «CRM COMPLETO»**: claude.ai → Proyectos → «CRM COMPLETO» → Instrucciones: reemplazá por el bloque § 3 de `19`. En Conocimiento del proyecto: subí `cerebro/20-conocimiento-para-claude-ai.md` (si había una versión anterior del mismo archivo, dejala y sumá la nueva con la fecha en el nombre; no borres archivos del dueño).
4. Si algún campo tiene límite de caracteres, recortá lo menos importante y anotá qué quedó afuera en `19` (§ «Lo que no entró»).

## Verificar y cerrar

- Releé cada campo después de guardar y comparalo con el texto de `19`.
- Abrí un chat nuevo dentro del proyecto y preguntá: «¿Quién soy, qué marcas tengo y qué no tenés que hacer nunca?». La respuesta tiene que coincidir con el cerebro (y tratarlo en masculino).
- Cerrá las pestañas que abriste. Anotá en `cerebro/bitacora.md` qué se cargó y cuándo, y en `19` la fecha de la última carga. Commit y push del cerebro (rama de trabajo y `main`).
- Si algo falló (permiso del sitio, campo que no aparece, extensión que no responde después de 2 o 3 intentos), pará y decile qué pasó y qué tiene que tocar él.
