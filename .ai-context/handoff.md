# Traspaso · LEGAL-CRM · 18/11/2026

Repo `/home/user/LEGAL-CRM`, rama `mejoras-1211` = `main` (último commit publicado: `f581a9e`).
Publicar: `git push origin mejoras-1211:main` y después `git push origin mejoras-1211`.
Supabase `enhgkeqiqcuwafsedaza` · Vercel proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt` (team `team_DGPKq7VRI79P0koUBcsxu1IH`), prod `legal-crm-nine.vercel.app`.
Antes de tocar código: `git fetch origin main` (el 15/11 otra sesión publicó 44 commits, Next 15.5 incluido) y `npm ci`.

## Pedido nuevo de la responsable (18/11), sin empezar
1. **Errores en el panel: botones que redirigen a otro lado.** No hay detalle de cuáles. Pedirle pantalla y botón, o recorrer las 4 secciones con capturas. Sospecha: links con `?perfil=` o rutas viejas tras la separación Meta/Wasender del 17/11 y el pase a Next 15.
2. **El panel anda lento.** Medir antes de cambiar. En los logs de prod hay errores `campaign_metrics ... fetch failed` al revalidar caché en `/campanas/[id]`.
3. **Metricool, Instagram de Kocos Marketing:** algunas publicaciones programadas fallaron. Hay que listar las fallidas (`getScheduledPosts`), reintentarlas o reprogramarlas (`updateScheduledPost`/`createScheduledPost`). Publicar en una red es externo: confirmar con la responsable antes de reprogramar si la fecha original ya pasó.

## Hecho en esta sesión (17/11), publicado
- **Método de envío editable en una campaña existente** (Meta ↔ Wasender, solo pausada; los destinatarios no cambian). Archivos: `api/campaigns/[id]/route.ts`, `campaign-setup*.tsx`. «ART GRAVES - 13/11» ya pasó a Meta: línea CIVIL, plantilla `jur_base_fria_a` (aprobada), 150/día, sigue **pausada**. La responsable no confirmó que la haya reanudado.
- **Fix «qué falta para lanzar»:** se rearma al guardar la configuración (`key` en `CampaignControls`). Antes seguía pidiendo la línea de Wasender.
- **Meta y Wasender separados en los 4 perfiles:**
  - Menú: «WhatsApp oficial (Meta)» con la nueva página `/meta/lineas`, plantillas y perfil; «WhatsApp por QR (Wasender)» con líneas y plantillas.
  - Campañas: el método se elige primero; la lista lleva insignia y filtro `?metodo=`.
  - Chats: insignia por fila, «Entró por…» en el hilo (`src/lib/inbox/entro-por.ts`) y filtro de canal `whatsapp_meta`/`whatsapp_wasender`.
  - Salud: un bloque para Meta y otro para Wasender.
  - Pruebas: pasan 577.

## Estado verificado (17/11)
- No hubo mensajes entrantes ni salientes en ningún perfil desde el 13/11 21:47 UTC. Sin cuarentena ni errores; el endpoint del webhook responde y el latido corre. Es probable que sea por falta de campañas, pero **no está confirmado**: falta que la responsable mande un WhatsApp de prueba desde su teléfono a cada número de Meta y revisar que entre y que el bot conteste.
- Calidad en Meta: Civil alta, Coberturas alta, Agencia 0 km **baja** desde el 26/10, Marketing sin dato.
- **Wasender:** las 3 líneas tienen la sesión cerrada. Marketing y «Asesoria Vita - 2» se conectan y WhatsApp las cierra a los segundos (no lo causa el panel). «Asesoria Vita» está archivada («Reconeccion»). Hay que volver a escanear el QR, y lo hace la responsable.

## Pendientes abiertos
- **Bug de seguimiento:** el 16/11, 10 tareas (9 de Jurídico y 1 de Coberturas) quedaron en `conflicto`: «Venció el plazo de 72 horas sin una franja válida». Se programan después del plazo. Ver `src/lib/contacto/reglas.ts` (`decideAtExecution`/`chooseFollowupSlot`) y `src/lib/seguimiento/motor.ts`. No se corrigió. Las 5 tareas de personas en Perdidos no enviaron nada.
- Propuesta anterior sin respuesta: cerrar el seguimiento al pasar a Perdidos o a captado (hay oportunidades `perdido`/`captado` con `followup_state='activo'`).
- Informe programado para el 20/11 (`trig_018N1mFkkgyxyFcaZuaAkkYG`).

## Reglas vigentes (no negociables)
- Sin contacto real con prospectos ni envíos de prueba a personas.
- No lanzar ni reanudar campañas: lo hace la responsable.
- Nada se borra: se archiva con motivo.
- Ningún secreto ni el PIN en archivos, commits o informes.
- Ningún dato personal real en el código, las pruebas ni los informes.
- Cada rubro va separado.
- No pisar lo hecho con Meta.
- Informes cortos, distinguiendo implementado / probado / publicado / habilitado.
- Sin PR. Commits con el trailer de la sesión.
