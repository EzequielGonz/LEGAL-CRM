---
description: Tablero priorizado. Quién lo hace (Claude / Responsable / Cowork), estado y bloqueo. Lo terminado baja a «Hecho» con fecha y estado de evidencia.
actualizado: 20/11/2026 06:15
---

# Pendientes y plan

Prioridad: **P0** hoy · **P1** esta semana · **P2** antes del 01/12 · **P3** después.

## P0 — hoy (20/11)

| # | Qué | Quién | Nota |
| --- | --- | --- | --- |
| 1 | **Producir y programar el cronograma doble**: hoy solo hay 6 piezas nuevas; del 25/11 en adelante VITA, Coberturas y Autos no tienen nada. Producir con 24–48 h de ventaja, repartiendo render en sesiones paralelas | Claude | Pedido completo en `.ai-context/prompt-retomar-redes-2011.md`. Arreglar antes «Lo que dijo la Corte» en `contenido.py` |
| 2 | Confirmar que «Campaña Graves 1911» arranca a las 08:00 y mirar la tasa de entrega (26 % de fallas la semana pasada) | Claude (mira) | No lanzar ni pausar: si se ve mal, avisar a la responsable |
| 3 | Revisar la incidencia de amenaza legal abierta del 18/11 (Jurídico) | Responsable | Claude puede resumirla sin datos personales |

## P1 — esta semana

| # | Qué | Quién |
| --- | --- | --- |
| 4 | Integrar el cerebro a `main` (si lo aprueba) | Claude |
| 5 | Publicar los ajustes del panel del 19/11 (rama `claude/pensive-galileo-d6ephy`): renumerar su migración de Archivar (0634 ya usado), integrar con main, typecheck/lint/pruebas/build, publicar y recorrer | Claude |
| 6 | Bug del seguimiento en `conflicto` (`src/lib/contacto/reglas.ts`) + cerrar seguimiento al pasar a perdido o captado; resolver las 10 tareas trabadas | Claude |
| 7 | Terminar la medición: rama de medición en Coberturas, Autos y Kocos (VITA ya probada), aplicar y probar el parche del CRM (`origen-redes.ts`), documentar en `docs/redes/MEDICION-2026-11-20.md`, integrar a main | Claude |
| 8 | Poner las etiquetas GA4 (IDs existentes) y píxel por variable de entorno en Vercel de las landings | Claude prepara · Responsable carga variables (otra cuenta de Vercel) |
| 9 | Cargar sitemaps y pedir indexación en Search Console; Bing Webmaster (importar desde Search Console) e IndexNow | Cowork/Responsable con prompt de Claude |
| 10 | Probar un WhatsApp entrante a los números de Autos y Marketing (sin tráfico hace 25 y 14 días) y ver respuesta del bot; ver un audio real | Responsable manda · Claude verifica en la base |
| 11 | Reconectar Wasender (QR) | Responsable |
| 12 | Cargar destinatarios de avisos por perfil (6 captaciones sin aviso) | Responsable decide · Claude configura |
| 13 | Revisar el 26 % de fallas en Jurídico: base, plantilla, calidad | Claude analiza y propone |
| 14 | Revisar 403 a robots en Coberturas y Kocos (que no bloquee a Googlebot ni a Metricool) | Claude |
| 15 | Bugs que encuentre el recorrido del panel | Claude |

## P2 — antes del 01/12

| # | Qué | Quién |
| --- | --- | --- |
| 16 | Informe del 01/12 (Metricool + CRM) contra las metas | Claude |
| 17 | Excel del cronograma por rubro y día con el conteo programado | Claude |
| 18 | Contraste del azul en Autos; planos irreales en Coberturas, Autos y Kocos; 34 historias con solo título; ~90 historias base | Claude |
| 19 | Abrir TikTok y YouTube (dentro de 10 días desde el 20/11) y conectarlos a Metricool | Responsable/Cowork con prompt de Claude |
| 20 | Schema: VITA con laboral y penal, teléfonos +549, teléfono en Marketing, nombres unificados | Claude (tras decisión de nombres) |
| 21 | Páginas por serie y por temporada en las 4 landings | Claude |
| 22 | Perfil de Empresa de VITA y Autos | Cowork con prompt (necesita dirección y horarios) |
| 23 | Cambiar el código de ingreso al de 8 números | Claude prepara · Responsable elige |
| 24 | Adjuntar PDF en chats y chat de Marketing trabado en «Tomar por humano» (ver ramas `feat/chat-adjuntar-pdf`, `adjuntos-chat-presupuesto`) | Claude |
| 25 | Supabase: mover `pg_net` fuera de `public`; protección de contraseñas filtradas | Claude |

## P3 — después

- Bloques D, E y F que queden del Plan 4 (pantallas, seguridad, diseño). Penal dentro de la línea de Civil con roles separados.
- Las 6 líneas de WhatsApp (pasarela propia) — necesita autorizar pago.
- Revisar diseño en pantalla, sobre todo «Todos los chats».
- Logos vectoriales; títulos nuevos de las landings; formularios de 3 campos; WhatsApp en el hero de Marketing; quitar «Próximamente».
- Pauta paga cuando pegue un reel (pago).
- AutosMix y boceto inmobiliaria (otros proyectos).

## Hecho

| Fecha | Qué | Estado |
| --- | --- | --- |
| 20/11 | Destacadas armadas en los 4 rubros (responsable) | habilitado |
| 20/11 | Cerebro del proyecto creado (`cerebro/`), cruce Fase 1 ↔ Fase 2, estado verificado | implementado en rama `claude/admiring-euler-ctf4sg` |
| 20/11 | Comprobado: Search Console verificada por DNS en las 4 webs | comprobado |
