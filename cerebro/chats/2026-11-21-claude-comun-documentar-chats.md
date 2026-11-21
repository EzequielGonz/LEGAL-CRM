# Documentar chats del proyecto (Claude común)

Estados usados: especificado / implementado / probado / publicado / habilitado. Los datos que vienen solo del texto del chat están marcados «según el chat». Fuente: `cerebro/chats/claude-comun/2026-11-21-documentar-chats.md`.

## 1. Encabezado

- **Título del chat:** «Documentar chats del proyecto».
- **Inicio:** 2026-11-21 06:10. **Fin:** 2026-11-21 06:27. 14 mensajes.
- **Origen:** Claude común (exportación del 21/11/2026).
- **Id de sesión:** no consta.
- **Marcas o perfiles:** proyecto «crm». Todos los chats del proyecto. Prioridad de lectura: «Sistema automatizado captación jurídica».

## 2. Objetivo

Leer todos los chats del proyecto, del más viejo al más nuevo, y crear un documento en Claude Docs por chat, titulado `AAAA-MM-DD-claude-<tema-corto>`, con 12 secciones. Después, dar la lista de títulos.

## 3. Órdenes y decisiones de la responsable (textuales)

- **2026-11-21 06:10:** «Usá la búsqueda de chats anteriores para leer TODOS los chats de este proyecto, uno por uno, del más viejo al más nuevo. No resumas de más: prefiero que sobre a que falte.»
- **2026-11-21 06:10:** «frena todos los chats del proyecto, que no se ejecute nada mas.»
- **2026-11-21 06:10:** «la sesion con mas prioridad de lectura es sistema automatizado captacion juridica»
- **2026-11-21 06:13:** «por que solo podes leer esos y no todos? no revises que hay, agregalo con las instrucciones dadas»
  - Reemplaza a la propuesta de Claude de revisar primero `cerebro-chats` y después armar solo lo que faltara.
- **2026-11-21 06:13:** «espera.»
- **2026-11-21 06:15:** «estan todas en la misma carpeta de este chat. como te las paso asi las lees?»
- **2026-11-21 06:24:** «como los subo al documento? ayudame la id de sesion sirve?»
- **2026-11-21 06:25:** «pero hay chats muy muy largos, dame algo mas facil»
- **2026-11-21 06:27:** «a ver fijate si esta la carpeta completa de crm»

## 4. Correcciones que hizo

- **06:13:** pidió no revisar lo que hay en `cerebro-chats` y agregar directo con las instrucciones. Claude había propuesto revisar antes.
- **06:25:** pidió una forma más fácil que copiar a mano. Claude propuso exportar datos.

## 5. Qué se hizo, con estado

- **Freno (06:11-06:13):** Claude paró lo que pudo controlar y no creó ningún documento. **Implementado** (según el chat).
- **Relevamiento:** 33 chats en el proyecto. Se pueden leer 6 (los 5 mencionados más «Greeting»). La búsqueda marca 27 como «no se pueden leer ni buscar desde acá». Leyó la primera mitad de «Alternativas a la API de Meta». **Probado** (según el chat).
- **Tarea programada:** intentó pausarla y los permisos lo bloquearon. **No realizado.**
- **Revisión de la memoria:** el ZIP de «Exportar datos» de la memoria trae 14 notas (88 KB): `profile.md`, 9 notas generales (entre ellas SEO de las landings, captación legal, CRM multirubro, captación en frío, AutosMix y Hotel Avenida) y 4 en `projects/crm/`. No trae conversaciones. **Verificado** (según el chat).
- **Documentos Claude Docs:** ninguno creado. La última respuesta del chat dice que no creó documentos.
- **Sesión prioritaria:** ofrece armar su documento desde las notas del 07/10, marcado «reconstruido de notas, no del chat». **No realizado.**

## 6. Todo lo concreto

- **Sesiones citadas por el chat, según la búsqueda:**
  - Legibles: «Contexto completo del proyecto», «Migrar proyecto de Cowork a Code», «Auditoría de cuentas Instagram y Facebook», «Pedido de asistente IA», «Alternativas a la API de Meta» y «Greeting».
  - No legibles (según la búsqueda): «Sistema automatizado captación jurídica» (la prioritaria), «Bandeja para Claude», «Automatización completa de procesos», «Tareas de mejora CRM», «Estudio jurídico Vita calidad», «Landings deployment T7» y «Alumar presupuesto PDF», entre otras.
- **Sesión prioritaria:** «Sistema automatizado captación jurídica», iniciada alrededor del 07/10 con última actividad el 15/10 (según el chat). Su enlace está en la transcripción original.
- **Tarea programada «Retomar reels tras el límite»:** activa, próxima ejecución el 21/11 a las 07:23. Según el chat, retomaría el agente que programa reels en Metricool del 21 al 29/11. Estado: **encendida** (según el chat), no pausada.
- **Cinco sesiones movidas alrededor de las 02:57** (según el chat): «Contexto completo del proyecto», «Migrar proyecto de Cowork a Code», «Auditoría de cuentas Instagram y Facebook», «Pedido de asistente IA» y «Alternativas a la API de Meta». Según el chat, las primeras cuatro tenían pedido el volcado a `cerebro-chats`.

## 7. Datos del negocio que aparecieron

- Ninguno nuevo. El chat solo menciona el alcance de la sesión prioritaria (notas del 07/10): objetivo, áreas Civil y Penal, orden de construcción acordado, importación de bases, paso a multirubro y Outscraper.

## 8. Pendiente, a medias o bloqueado

- **Tarea programada «Retomar reels tras el límite»:** sigue activa. La responsable tiene que desactivarla o borrarla en sus tareas programadas de claude.ai (el chat no pudo pausarla por permisos).
- **Chats del proyecto:** según el chat, Claude no puede detener las otras conversaciones. La responsable tiene que abrir cada una y frenarla.
- **Lectura de 27 sesiones:** no se pudo, por el tipo de sesión (no confirmado). Solo la responsable puede abrirlas.
- **Exportación de conversaciones:** falta el `conversations.json` de «Configuración > Privacidad > Exportar datos». El ZIP de memoria no sirve.
- **Documentos:** ninguno creado.

## 9. Aprendizajes

- La búsqueda de chats no lee 27 sesiones aunque estén en la misma carpeta. Claude supone que son sesiones de Cowork o Code (no confirmado).
- El ID de sesión no sirve para leer el contenido: el bloqueo está en el tipo de sesión.
- La exportación de «Exportar datos» de la memoria no trae conversaciones. Hay que pedir la exportación de datos de la cuenta.
- Copiar a mano y subir a la base de conocimiento del proyecto se descartó por lo largo de los chats.

## 10. Preguntas abiertas

- ¿Frenás la tarea programada «Retomar reels tras el límite»?
- ¿Cuál de los chats del proyecto ya subió su volcado a `cerebro/chats/` en `cerebro-chats`? (el chat no lo revisó)
- ¿Querés el documento de la sesión de captación jurídica armado desde las notas, marcado como reconstruido?
- ¿Enviás el `conversations.json` de la exportación de datos?

## 11. Ramas y cambios

- **Repo:** el chat no escribió en GitHub. No hay commit, rama ni PR de este chat.
- **Claude Docs:** no se creó ningún documento.
- **Estado de `cerebro/chats/` en la rama `cerebro-chats` (verificado hoy):** hay 1 archivo de Code (`2026-11-19-code-rediseno-panel-juridico.md`) y la carpeta `claude-comun/` con las transcripciones crudas. No hay documentos de síntesis todavía.
- **Migraciones, despliegues y configuración:** ninguno.
- **Qué quedó encendido por este chat:** la tarea programada «Retomar reels tras el límite» (21/11 07:23, Metricool, reels del 21 al 29/11), según el chat. No hay más encendidos atribuidos.

## 12. CONTRADICE

- **Documentos creados:** el 06:13 y el 06:27 el chat dice que no creó ningún documento. El 06:24 dice «voy armando los documentos a medida que lleguen». Lo que vale es el 06:27: no hay documentos.
- **Chats que pudieron haber subido resumen:** el chat dice que «varios chats ya pueden haber subido su resumen a `cerebro/chats/`». Revisado: solo hay transcripciones crudas en `claude-comun/`, sin resúmenes. Esto no coincide con lo que supone el chat.
