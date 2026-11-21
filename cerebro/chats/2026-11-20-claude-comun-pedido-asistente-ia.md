# Pedido de asistente IA (Claude común)

Estados usados: especificado / implementado / probado / publicado / habilitado. Los datos que vienen solo del texto del chat están marcados «según el chat». Fuente: `cerebro/chats/claude-comun/2026-11-20-pedido-asistente-ia.md`.

## 1. Encabezado

- **Título del chat:** «Pedido de asistente IA».
- **Inicio:** 2026-11-20 08:03. **Fin:** 2026-11-21 05:57 (última actualización de la exportación). 21 mensajes.
- **Origen:** Claude común (exportación del 21/11/2026).
- **Id de sesión:** no consta.
- **Marcas o perfiles:** perfil Estudio Jurídico. Toca el panel general (asistente IA) y el Laboratorio del bot.

## 2. Objetivo

Resolver el pedido de la Bandeja «Asistente IA (panel general), perfil Estudio Jurídico»: que las charlas con el asistente queden guardadas. Al abrirlo debe mostrar las charlas anteriores, dejar elegir una y seguirla donde quedó, o empezar una nueva.

## 3. Órdenes y decisiones de la responsable (textuales)

- **2026-11-20 08:05 (repetido 08:07):** «el laboratorio que tambien lo guarde, y el diseño del laboratorio y todas las funciones y todo que sea mas sencillo, no tan complicado porfa, termina y publica todo»
  - Esta orden fue **reemplazada** por la siguiente en lo que toca al rediseño del Laboratorio.
- **2026-11-20 08:08:** «NO TOQUES NI ALTERES NADA DE LO QUE YA EXISTE»
- **2026-11-20 08:09:** «eso si hacelo todo, pero lo demás no toques nada en el sentido defuncionalidades etc etc»
  - Lectura: sí hacer el historial de charlas (en ambos lugares); no tocar nada más. El rediseño del Laboratorio **quedó afuera**.
- **2026-11-20 08:10:** «usa todos los skills plugins y conectores que tenes disponibles para hacerlo de la mejor manera, toma el rol de experto en diseño, software, programador, ingeniero, todo todo senior»
- **2026-11-20 08:11:** «usa subagentes que hagan tareas por vos y orquesta todo, como si fueses el cerebro»
- **2026-11-20 08:12:** «las skills asignadas solo por las reglas no, todas todas, incluso propone nuevas»
- **2026-11-20 08:12:** «no hay limites con eso, las reglas viejas olvidalas»
- **2026-11-20 08:19:** «hacelo rapido, no releas todo. retoma. graciasss»
- **2026-11-21 05:56:** pidió volcar el contexto del chat a `cerebro-chats` en el formato de 12 puntos, con la regla «Escribí SOLO en esa rama: no toques main ni ninguna otra rama ni otro archivo.»

## 4. Correcciones que hizo

- **Rediseño del Laboratorio:** Claude había propuesto un plan y freno antes de tocar lo existente. La responsable contestó que no se altere nada de lo que ya existe, y que se haga solo el historial. Queda descartado el rediseño y la simplificación de funciones del Laboratorio.
- **Reglas viejas:** pidió olvidar las reglas viejas. Claude dijo que mantenía las de cuidado (ver CONTRADICE).

## 5. Qué se hizo, con estado

- **Plan inicial (20/11 08:03):** tabla nueva para charlas y mensajes, sin borrar nada; botón «Charlas anteriores»; botón de charla nueva; el asistente del Laboratorio no se tocaba. **Especificado.**
- **Bandeja:** el pedido pasó a «en espera» (20/11 08:08) y al cierre quedó como «lista». **Implementado** (según el chat).
- **Base de datos:** tabla nueva para charlas y mensajes, cerrada al público, sin borrado (las charlas se archivan). Primero se probó con una transacción que se deshace sola; después se aplicó en la base real. Comprobó que guarda, que no mezcla perfiles, que no se puede borrar y que nadie externo tiene acceso. **Implementado y probado** (según el chat).
- **Código:** las charlas se guardan después de cada respuesta, tanto en el asistente general como en el Laboratorio (cada perfil tiene su lista). Botón «Charlas anteriores» con «Quitar» (archiva, no borra). «Nueva charla» arranca una charla guardada nueva. Fotos, PDF y planillas no se guardan. **Implementado** (según el chat).
- **Pruebas del código:** 9 pruebas nuevas, todas pasan. **Probado** (según el chat).
- **Revisión de seguridad:** la hizo un ayudante aparte. No encontró nada grave; se corrigieron los puntos importantes que marcó. **Probado** (según el chat).
- **Publicación:** Vercel armó Preview y Producción sin errores (según el chat). **Publicado.** **Habilitado:** no comprobado en el panel de producción. El chat dice «falta que lo mires vos».
- **Documento del proyecto:** `CONTEXTO_ACTUAL_CRM.md` actualizado (según el chat). **Implementado.**
- **Skill nueva para el procedimiento de la Bandeja:** propuesta en la tarjeta del chat. No consta que se haya creado. **Especificado.**
- **Ayudantes:** el de seguridad terminó. El de la pantalla se cortó por el límite de uso; la pantalla la hizo Claude directo.

## 6. Todo lo concreto

- **PR #78** en `EzequielGonz/LEGAL-CRM`: «Asistente: charlas guardadas y retomables (general y Laboratorio)». Según `git` del repo, el commit `77325da` (#78) está en `origin/main`. El estado exacto del PR no pude consultarlo (gh devolvió 403).
- **Migración:** `supabase/migrations/0634_asistente_charlas.sql` (existe en el repo; aplicada en la base según el chat, hora no consta).
- **Pedido de la Bandeja:** pasó a «lista», con enlace al cambio.
- **Pantallas:** asistente general y Laboratorio del bot (cada perfil con su propia lista de charlas).
- **Botones:** «Charlas anteriores», «Quitar», «Nueva charla» (el chat dice también «Charla nueva»).

## 7. Datos del negocio que aparecieron

- Perfil: Estudio Jurídico.
- Recomendación del chat para la tarea: modelo Opus con esfuerzo alto, porque toca la base de producción, el servidor y la pantalla.

## 8. Pendiente, a medias o bloqueado

- **Mirar producción:** la responsable tiene que comprobar el asistente en el panel de producción.
- **Rediseño y simplificación del Laboratorio:** no se hizo. Según el chat, sería otra tarea, si la responsable la pide.
- **Skill propuesta:** no consta que se haya creado.
- **Número de migración y hora de aplicación:** el número es 0634; la hora exacta no consta (la respuesta final es del 20/11 08:26).

## 9. Aprendizajes

- Cuando un pedido mezcla «agregar» y «cambiar lo existente», conviene separarlos antes de tocar nada. Claude frenó a preguntar y la responsable aclaró.
- Probar la base con una transacción que se deshace sola antes de aplicarla de verdad funcionó (según el chat).
- Un ayudante se cortó por límite de uso. Claude hizo la tarea directo y lo dijo en el informe.

## 10. Preguntas abiertas

- ¿Querés el rediseño del Laboratorio como tarea aparte?
- ¿Revisás el asistente en producción?
- ¿El botón se llama «Nueva charla» o «Charla nueva»? El chat usa los dos nombres.
- ¿Qué reglas de cuidado siguen vigentes, si la responsable pidió olvidar las viejas? (ver CONTRADICE)

## 11. Ramas y cambios

- **Repo:** `EzequielGonz/LEGAL-CRM`, PR #78. La rama de origen no consta. Según `git`, los commits `fc5460b`, `77325da` (squash de #78) y `36f742b` (contexto en `CONTEXTO_ACTUAL_CRM.md`) están en el historial. `77325da` está en `origin/main`. La rama de origen del PR no consta, así que no puedo decir si hay algo sin integrar; `36f742b` no verifiqué si está en main.
- **Commits del chat (según git):**
  - `fc5460b`: charlas guardadas y retomables (general y Laboratorio).
  - `77325da`: #78, el mismo cambio integrado a main (2026-11-20).
  - `36f742b`: contexto de las charlas guardadas en `CONTEXTO_ACTUAL_CRM.md` (2026-11-20).
- **Archivos tocados:** `CONTEXTO_ACTUAL_CRM.md`, `supabase/migrations/0634_asistente_charlas.sql`, y el código del asistente y del Laboratorio. Las carpetas exactas no constan en la exportación.
- **Migración:** `0634_asistente_charlas`. Se aplicó en la base real el 20/11 (hora no consta). Según el chat, nadie externo tiene acceso a la tabla; no revisé las políticas RLS.
- **Despliegues:** Vercel Preview y Producción, sin errores (según el chat). El nombre del proyecto Vercel no consta.
- **Configuración fuera del código:** ninguna declarada.
- **Qué quedó encendido por este chat:** charlas guardadas en el asistente general y en el Laboratorio, en producción según el chat. No comprobado en el panel.

## 12. CONTRADICE

- **Reglas de cuidado:** Claude dijo que seguía con «no hago envíos, gastos ni cambios en los bots sin que me lo pidas». `CLAUDE.md` dice que la única restricción es no pagar, y que lo demás se implementa, prueba y publica sin pedir «dale». La responsable pidió olvidar las reglas viejas.
- **Verificación:** el chat declara «publicado» sin haber mirado producción. `CLAUDE.md` pide comprobar en la base antes de informar qué está encendido.
- **Migración 0634:** el chat dice que se aplicó en la base real el mismo día. No hay contradicción con el repo; la hora exacta es lo que no consta.
