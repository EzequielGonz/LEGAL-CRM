# Cowork · CRM multirubro: cierre de rediseño y envío de plantillas de WhatsApp a Meta

## 1. Encabezado

- **Título del chat:** CRM multirubro · cierre de rediseño y envío de plantillas de WhatsApp a Meta.
- **Fecha de inicio:** 17/10/2026 (no confirmado: la transcripción conserva solo desde el 17/10 23:32 UTC; lo anterior sale del resumen de compactación).
- **Fecha de fin:** 21/11/2026 (último mensaje registrado 07:30 UTC).
- **Origen:** Cowork, proyecto «crm», repositorio EzequielGonz/LEGAL-CRM, rama `main`. Id de sesión: no figura en el archivo.
- **Perfiles y marcas:** Estudio Jurídico Vita (Civil; Penal diferido), Coberturas médicas (Tu Obra Social), Autos 0 km (Automotores Kocos) y Marketing (Agencia de Marketing Kocos). El archivo nombra como agencia a ORVIAN (ver sección 12).
- **Fuente:** `cerebro/chats/cowork/cowork-f-plantillas-meta-1017.md` (ya redactado; partes reconstruidas del resumen).

## 2. Objetivo

Terminar y publicar el rediseño del panel, cargar las credenciales de WhatsApp de los cuatro rubros y dejar las 33 plantillas propuestas (9 Civil, 8 de 0 km, 8 de Coberturas y 8 de Marketing) enviadas a revisión de Meta mediante un botón del panel. Sin enviar mensajes a personas y sin iniciar campañas.

## 3. Órdenes y decisiones de la responsable

- 17/10 (traspaso, sin hora): «RETOMEMOS EL CHAT CRM MULTIRUBRO STATUS. TERMINA TODO ESTO / LO QUE TENGO QUE HACER YO: 1 YA LO MIRE 2 SI AUTORIZO 3 SI DALE AUTORIZO, TERMINALO POR FAVOR».
- 17/10 (parte reconstruida): «SALTA TODO ESO IMPLEMENTA TODOS LOS CAMBIOS Y SOLAMENTE HACE UNA REVISION VISUAL FINAL Y LISTO. TERMINALO RAPIDO E IMPLEMENTA TODO».
- 17/10: «TERMINA EL BLOQUE 5 TAMBIEN E IMPLEMENTALO FINALIZA TODO MENOS LAS MEDICIONES REVISIONES Y TODO ESO. TERMINA TODO E IMPLEMENTA». El archivo aclara que el bloque 5 quedó cerrado sin ejecutar «por decisión de la responsable», pero el motivo no figura (ver sección 10).
- 17/10: sobre la prueba de navegador comentada antes, decidió omitirla. Después dijo: «La prueba real no hace falta, ya que confirmamos correctamente que funcionan».
- 17/10: «1. AGENCIA DE MARKETING KOCOS - WEBHOOKS YA APLICADOS 2. AUTOMOTORES KOCOS - WEBHOOKS YA APLICADOS 3. TU OBRA SOCIAL - WEBHOOKS YA APLICADOS ¿Que faltaria agregar a vercel en cuanto a credenciales?».
- 17/10: «Excelente. Entonces, ahora mismo el panel estaria funcionando correctamente en lo que seria el contestado con IA y whatsapp (CONFIRMAME ESTO) Despues, necesito que arranquemos con el armado de plantillas para cada rubro. Eso lo haces vos automaticamente?».
- 17/10: «Antes de redactar las plantillas necesito que me digas en que parte del panel apruebo la subida de plantillas a meta. El WABA ID ya estaria subido en el panel.».
- 17/10: «Aca se encuentran estas plantillas. Confirmame que sean estas, si son estas, ENCONTRA LA FORMA PARA SUBIR VOS LAS PLANTILLAS Y DEJARLAS EN REVISION VOS MISMO».
- 17/10: «Aca hay algo para solucionar? Lo que es civil es lo que esta actualmente en el panel. Tema penal, eso lo agregamos mas adelante.».
- 17/10: «Ahora hago lo mismo para: 0km, coberturas y markering?».
- 17/10 23:53 UTC (captura): «Este error me aparecio en el perfil de marketing».
- 21/11 07:29 UTC: «y». Respuesta ambigua; no está claro a qué se refiere (ver sección 10).
- 21/11 (pedido de cierre): generar este archivo, sin escribir en GitHub, sin commits, pushes ni ramas sin un «dale» explícito.

## 4. Correcciones de la responsable

- El identificador que dio primero para Civil era el del número de teléfono y no el de la cuenta de WhatsApp Business; lo corrigió con un segundo mensaje.
- Aclaró que lo cargado en el panel es Civil y que Penal se agrega más adelante.
- Recortó el alcance de los pedidos («SALTA TODO ESO…» y «FINALIZA TODO MENOS LAS MEDICIONES REVISIONES»). Son cortes sobre pruebas y verificaciones.
- Preguntó si la prueba de navegador era imprescindible y luego la dio por innecesaria.

## 5. Qué se hizo, con estado

Escala: especificado / implementado / probado / publicado / habilitado.

- **Rediseño, bloques 1 a 4:** implementado (PR #17, `991c871`, según el archivo «commit en main»). Preview revisada por la responsable. Despliegue de producción sin verificar. Pruebas de navegador del bloque 4 omitidas.
- **Bloque 5 (verificación integral):** no implementado; cerrado sin ejecutar.
- **Botón «Enviar desde <línea>» (PR #18, `fb6688f`):** implementado. Preview de Vercel con éxito. Producción sin verificar. La responsable lo usó.
- **Credenciales de WhatsApp de cuatro rubros en Vercel:** cargadas por la responsable (solo nombres de variables en la sección 11). Redeploy hecho por la responsable. La variable de WABA de Civil estaba vacía y se completó. La responsable confirma que funcionan.
- **Webhooks de Meta:** aplicados por la responsable en Agencia Kocos, Automotores Kocos y Tu Obra Social. Confirmados por la responsable. Eventos sin firma van a cuarentena.
- **Línea 0 km en `profile_lines`:** registrada por la responsable desde el panel, con «Agente» y «Campañas» tildados. Visto en captura.
- **Líneas de Coberturas y Marketing:** asignadas por la responsable (informado). Sin captura.
- **Envío a revisión de Civil (9):** hecho. Verificado solo con capturas anteriores; el estado de aprobación no se leyó.
- **Envío de 0 km (8):** hecho. El panel mostró «8 enviadas a revisión». No se leyó después.
- **Envío de Marketing:** el primer intento dio «No se pudo enviar.» sin detalle. La responsable informó 9 plantillas en la cuenta (se supone 8 propuestas más una de fábrica, sin verificar). Causa del error no confirmada; probablemente un corte por tiempo.
- **Envío de Coberturas (8):** informado por la responsable. Sin captura ni verificación.
- **Aprobación por Meta de las plantillas:** **no comprobada**. Depende de la revisión de Meta y no hubo lectura posterior.

Nada del chat figura como publicado en producción, habilitado o probado funcionalmente sin evidencia. Las campañas siguen pausadas y no se enviaron mensajes a personas.

## 6. Archivos, rutas, repos, PR, commits y enlaces

- `src/lib/plantillas/enviar.ts` (nuevo): arma el pedido a Meta (vista previa o envío), omite las plantillas existentes y corta ante errores de token o de cuenta.
- `src/app/api/plantillas/enviar-a-meta/route.ts` (nuevo): ruta POST protegida por sesión.
- `src/components/plantillas/enviar-propuestas.tsx` (nuevo): botón por línea activa.
- `src/components/plantillas/templates-section.tsx` (modificado): monta el botón sobre el gestor.
- `docs/rediseno/PLAN.md` (actualizado en el commit `4e0a5ee`, en la rama del PR #17).
- Referencias leídas: `src/lib/plantillas/meta.ts`, `index.ts`, `propuestas.ts` (33 propuestas), `src/lib/profiles.ts`, `src/lib/rubros.ts`, `docs/plantillas/meta_payloads.json`, `CLAUDE.md`.
- Documentos del proyecto «crm» actualizados el 17/10: `claude/PUNTO_DE_CONTROL.md` y `claude/CONTEXTO_ACTUAL_CRM.md`.
- Sin ids de Metricool ni publicaciones programadas en este chat.

## 7. Datos del negocio

- Cuatro rubros con línea propia: Civil (cuenta cargada), Penal (pendiente, diferido), 0 km (línea registrada) y Coberturas y Marketing (asignadas por la responsable).
- Cantidades de plantillas por rubro: Civil 9, 0 km 8, Coberturas 8, Marketing 8 propuestas (9 en la cuenta).
- Agencia: el archivo la llama ORVIAN; ver sección 12.

## 8. Pendiente, a medias o bloqueado

1. Leer el estado de las plantillas (aprobadas, en revisión o rechazadas) en los cuatro perfiles. Se pidieron capturas el 17/10 y el 21/11 y no llegaron.
2. Verificar con captura el envío de Coberturas y confirmar que Marketing tiene sus 8 propuestas.
3. Corregir las plantillas rechazadas, si las hay (hace falta el motivo que muestra el panel).
4. Verificar el despliegue de producción de `fb6688f`. El permiso de listado de despliegues fue bloqueado.
5. Causa del error «No se pudo enviar.» de Marketing: no confirmada. Mejorar el mensaje de error o evaluar `maxDuration`.
6. Decidir si «Campañas» queda tildado en las líneas nuevas mientras se espera la aprobación.
7. Penal: línea y cuenta diferidas por decisión de la responsable.
8. Plantillas `mkt_apertura_propuesta` y `mkt_presupuesto_listo`, `META_APP_SECRET` y otros pendientes del proyecto (ver el resumen de contexto).
9. Candidato C (`GCP_*`, corpus y ajuste, con tope de USD 30) y experimento A/B/C sin iniciar.
10. Deuda conocida: pruebas de navegador del bloque 4, medición de caché y bloque 5.
11. Rotar tokens y secretos pegados en el chat durante la sesión: [secreto: tokens y claves pegados en el chat — hay que cambiarlos].

## 9. Aprendizajes

- El `git push` directo dio 403 en esta sesión. Los PR #17 y #18 se hicieron con el conector de GitHub (según el resumen; no verificado en el registro).
- El botón «Enviar desde» necesita que la línea esté registrada en `profile_lines`. Cargar solo las variables no alcanzó: solo existía Civil y los botones de 0 km, Coberturas y Marketing no aparecían hasta registrar cada línea.
- El error «No se pudo enviar.» de Marketing no tuvo detalle, por eso no se pudo diagnosticar.

## 10. Preguntas abiertas

- ¿Qué quiso decir la responsable con «y» del 21/11 07:29 UTC?
- ¿Por qué se cerró el bloque 5 sin ejecutar, si la orden decía «TERMINA EL BLOQUE 5 TAMBIEN E IMPLEMENTALO»? El archivo no tiene el motivo.
- ¿Qué pasó con las 9 plantillas de Marketing frente a las 8 propuestas?
- ¿Se mantiene «Campañas» tildado en las líneas nuevas?

## 11. Ramas y cambios (explícito)

- **Rama `rediseno-b4`, PR #17 → `main`:** rediseño de bloques 1 a 4. Commit en `main`: `991c871`. Commit de `docs/rediseno/PLAN.md`: `4e0a5ee`. Estado de fusión según el archivo: «commit en main». Acción: ninguna pendiente salvo verificar el despliegue de producción.
- **PR #18 → `main`:** botón «Enviar desde <línea>». Commit `fb6688f`. Preview de Vercel con éxito. Acción: verificar producción.
- **Migraciones:** hasta `0400_rediseno_logo_panel` (aditiva, ya aplicada antes del chat). Ninguna nueva en este chat. Consulta de solo lectura a `profile_lines`: al 17/10 solo existía la línea de Civil.
- **Despliegues:** Preview del PR #18 con éxito. Producción de `fb6688f` sin verificar.
- **Variables de Vercel (solo nombres):** `WHATSAPP_<ÁREA>_PHONE_NUMBER_ID`, `WHATSAPP_<ÁREA>_ACCESS_TOKEN` y `WHATSAPP_<ÁREA>_WABA_ID` para CIVIL, PENAL (incompleta), AGENCIA_0KM, COBERTURAS_MEDICAS y MARKETING; `META_APP_SECRET` y `META_APP_SECRETS`; `WHATSAPP_VERIFY_TOKEN`. Pendientes opcionales: `GCP_*`, variables de VAPID, `SESSION_SECRET` y `LANDING_*`. Los valores no se leyeron ni se reproducen.
- **Configuración fuera del código:** webhooks de Meta aplicados por la responsable. Redeploy de Vercel hecho por la responsable. No hay cambios en Supabase, Metricool ni Google en este chat.
- **Qué quedó encendido o apagado por este chat:** nada se encendió para envíos. Las campañas siguen pausadas. Las plantillas están enviadas a revisión de Meta según los paneles de Civil y 0 km, y sin verificar en Marketing y Coberturas.
- **Escrituras en GitHub:** ninguna en el cierre del 21/11.

## 12. CONTRADICE

- **CONTRADICE:** el resumen previo daba por probable que el botón «Enviar desde» apareciera con solo cargar las variables. En la práctica hacía falta registrar cada línea en `profile_lines` antes de que aparecieran los botones.
- **CONTRADICE:** se indicó dejar «Campañas» sin tildar en las líneas nuevas. La línea de 0 km quedó con «Agente» y «Campañas» tildados por decisión de la responsable. La pausa general sigue siendo lo que impide los envíos.
- **CONTRADICE:** el pedido del 21/11 afirma que hasta ahora no se pudo escribir en GitHub (403). Según el resumen, solo falló el `git push` directo, y la escritura por el conector de GitHub funcionó (PR #17 y #18). No se volvió a comprobar en este cierre.
- **CONTRADICE:** Marketing muestra 9 plantillas frente a 8 propuestas. Se supone una de fábrica, sin comprobar.
- **CONTRADICE:** el archivo nombra la agencia como ORVIAN, pero la corrección de la responsable del 20/10 fue «ORVIAN NO, KOCOS MARKETING ES» (ver el chat de landings). Usar Kocos Marketing.
- **CONTRADICE:** el archivo dice «Panel en Next.js 14». `CLAUDE.md` del repo dice Next.js 15.5. Verificar cuál es la versión real.
- **CONTRADICE:** las migraciones de este chat están numeradas `04xx` (0400). `CLAUDE.md` pide numeración por etapa (`01xx`, `02xx`). Revisar la convención.
