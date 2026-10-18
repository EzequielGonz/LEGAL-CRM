# Reorganización 2 · 18/10/2026

Pedido de la responsable (segunda tanda del 18/10). Rama `reorganizacion-2`, PR #20 → `main`. Sin migraciones.

## Qué incluye

| Pedido | Qué se hizo | Dónde |
|---|---|---|
| Perfiles en PC como antes | Pantalla oscura con un perfil por marca, sin cifras. El lápiz (al pasar el mouse) edita nombre, nombre interno, logo y color. | `src/app/perfiles/page.tsx`, `src/components/perfiles/selector-pc.tsx` |
| Teléfono como la PC de antes | Tarjetas con pendientes, lápiz y tres puntos; atajos Campaña, Cerrados y Cifras. Barra fija clara y título grande. | `src/app/telefono/page.tsx`, `perfil-selector.tsx`, `phone-header.tsx` |
| Conversaciones = oportunidades reales | Grupos compactos (captados sin derivar, agendaron, hablando, piden persona) → fichas → chat. «Todos los chats» sigue como pestaña. Al marcar derivado pasa a Contactos. | `src/app/conversaciones/page.tsx`, `src/components/cartera/vista-cartera.tsx`, `src/lib/cartera.ts` |
| Contactos = lo importante | Clientes derivados, ventas, citas, reagendadas, Fase 2, seguimiento y repesca, con ficha. | `src/app/contactos/page.tsx` |
| Base fría en Prospectos | Agrupada por base cargada, plegada, con conteos, buscador y los primeros 20 de cada base. | `src/app/prospectos-por-base/page.tsx` |
| Revisión | Primero caídos en seguimiento, dejaron de responder (72 h) y perdidos. Quejas e incidencias a un costado, compactas (la IA ya responde solo una disculpa). | `src/app/recuperar/page.tsx` |
| Inicio | Sin atención humana ni quejas. Captados primero, «Para cerrar» (agendaron, hablando, en seguimiento, derivados sin resultado). Resumen chico: esta semana y última base, con «Ver historial». | `src/app/hoy/page.tsx`, `src/lib/cartera-servidor.ts` |
| Configuración en tarjetas | Los grupos de abajo son tarjetas plegables como las de arriba; el buscador abre las que coinciden. | `src/components/configuracion/*` |
| Horario 24 h (todos los rubros) | Tarjeta «Horario de atención» y regla en el agente: fuera de lun a sáb 8 a 21 h responde la IA, intenta captar igual, saca la información y acuerda día y franja para que un asesor llame y cierre. | `src/lib/horario-atencion.ts`, `src/lib/ai-agent/agent.ts`, `horario-atencion.tsx` |
| Redes: perfiles de Facebook e Instagram | Redes › Perfiles. Facebook editable (presentación, descripción, teléfono, web, mails, foto). Instagram: Meta no permite cambiar biografía ni foto por API; se muestra el perfil, la biografía sugerida y el enlace con origen para copiar, y un botón a la app. | `src/app/redes/perfiles/page.tsx`, `src/components/redes/perfiles-redes.tsx`, `src/lib/redes/facebook-pagina.ts`, `src/app/api/redes/facebook/route.ts` |
| Diseño premium | Bloque «Reorganización 2» en `renovacion.css`: tarjetas de grupo, chips, avatares, botones suaves, controles; burbujas del chat renovadas. | `src/app/renovacion.css`, `conversation-thread.tsx` |

Indicadores nuevos en `src/lib/indicadores.ts`: `piden_persona`, `venta`, `repesca`, `perdido_comercial`, `dejaron_de_responder`. Las vistas reutilizan los indicadores, así que los conteos coinciden con las listas completas (pestaña oculta «Lista»).

## Para vincular (lo hace la responsable)

- Facebook por perfil, en Vercel (nunca en el chat): `FACEBOOK_<CLAVE>_PAGE_ID` y `FACEBOOK_<CLAVE>_PAGE_ACCESS_TOKEN`; Instagram: `INSTAGRAM_<CLAVE>_BUSINESS_ID`. Claves: Jurídico `CIVIL`, 0 km `AGENCIA_0KM`, Coberturas `COBERTURAS_MEDICAS`, Kocos `MARKETING`. El token de página tiene que tener permiso para administrar la página (`pages_manage_metadata`, `pages_read_engagement`) y, para Instagram, `instagram_basic`.

## Pruebas

- Unitarias 190/190 (7 nuevas en `tests/unitarias/cartera-y-horario.test.ts`: vistas, enlaces, semana, horario, una sola condición `or` por indicador).
- Build: Preview `dpl_H7SWxALcp7Q8yC2VkdWXyzBdKLfj` READY con todo el código (`65f28f3`; incluye typecheck y lint de Next).
- No probado: revisión visual (la Preview pide ingreso y el navegador de la sesión no llega a vercel.app) ni edición real de Facebook (no hay páginas vinculadas).

## Revertir

Sin cambios de base. Se revierte promoviendo el despliegue de producción anterior (`b74c1dc`).
