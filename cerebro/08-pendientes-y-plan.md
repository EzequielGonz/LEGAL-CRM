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
| 3b | **Línea de Meta de Marketing «Sin acceso al número»**: el bot de Marketing no recibe ni contesta. Revisar token/permiso del número en Meta Business y, si hace falta, renovar la variable en Vercel | Responsable (Meta Business) + Claude (variable y verificación) | Prompt para Cowork listo a pedido |

## P1 — esta semana

| # | Qué | Quién |
| --- | --- | --- |
| 4 | Integrar a `main` las ramas de documentos: cerebro (`admiring-euler`), redes (`happy-wozniak`, PR #77), contexto en Word (`festive-goldberg`) y **rescatar los 18 commits de `gracious-volta`** (herramientas de reels y registro de lo programado) | Claude (si lo aprueba) |
| 4b | Arreglar la prueba rota en main (`asistente-catalogo.test.ts`: sumar `asistente/charlas` al catálogo o a `FUERA_DEL_CATALOGO`) | Claude |
| 5 | Publicar los ajustes del panel del 19/11 (rama `claude/pensive-galileo-d6ephy`): renumerar su migración de Archivar a **0635**, revisar el `drop trigger`, integrar con main, typecheck/lint/pruebas/build, aplicar migración, publicar y recorrer | Claude |
| 5b | Integrar el aviso por correo de formularios (PR #40 `landings-conexion`, 1 conflicto) — queda apagado hasta cargar la clave de Resend | Claude |
| 5c | ~~Poner al día los documentos viejos que contradicen lo vigente (`kocos-crm-contexto`, `reglas-comunes` §2 y §9, `CONTEXTO_ACTUAL_CRM.md`, `docs/ESTADO.md`): aviso arriba que remite al cerebro~~ (hecho 20/11) | Claude |
| 6 | Bug del seguimiento en `conflicto` (`src/lib/contacto/reglas.ts`) + cerrar seguimiento al pasar a perdido o captado; resolver las 10 tareas trabadas | Claude |
| 7 | Terminar la medición: rama de medición en Coberturas, Autos y Kocos (VITA ya probada), aplicar y probar el parche del CRM (`origen-redes.ts`), documentar en `docs/redes/MEDICION-2026-11-20.md`, integrar a main | Claude |
| 8 | Poner las etiquetas GA4 (IDs existentes) y píxel por variable de entorno en Vercel de las landings | Claude prepara · Responsable carga variables (otra cuenta de Vercel) |
| 9 | Cargar sitemaps y pedir indexación en Search Console; Bing Webmaster (importar desde Search Console) e IndexNow | Cowork/Responsable con prompt de Claude |
| 10 | Probar un WhatsApp entrante a los números de Autos y Marketing (sin tráfico hace 25 y 14 días) y ver respuesta del bot; ver un audio real | Responsable manda · Claude verifica en la base |
| 11 | Reconectar Wasender (QR) | Responsable |
| 12 | Cargar destinatarios de avisos por perfil (6 captaciones sin aviso) | Responsable decide · Claude configura |
| 13 | Revisar el 26 % de fallas en Jurídico: base, plantilla, calidad | Claude analiza y propone |
| 14 | Revisar 403 a robots en Coberturas y Kocos (que no bloquee a Googlebot ni a Metricool) | Claude |
| 15 | Bugs del recorrido del panel (20/11), en orden: **(a)** Salud no revisa el acceso de las líneas de Meta (Marketing dice «4 en orden» sin acceso); **(b)** Wasender muestra «Día 7 de calentamiento: puede enviar 40» con la sesión cerrada hace días; **(c)** detalle de chat con estados contradictorios («Cerrado (ganado)» + «Requiere atención humana»), encabezado cortado al abrir y «Más opciones» tapando donde se escribe; **(d)** PENAL rotulada «PENAL · Civil» y ofrecida como «asignar» en los otros 3 perfiles (rompe «rubros separados»); **(e)** nombres internos en pantalla (`WHATSAPP_*`, motivos «ad», «domingo»); **(f)** Salud: «4 retenidos» vs «sin cuarentena», encabezado «Hoy», plurales «(s)»; **(g)** Contactos Jurídico suma 7.921 vs título 7.852; «En seguimiento 5» vs «Programados 14»; **(h)** Hoy muestra la campaña «enviando» 0/182 mientras Salud dice 17 fallidos en 24 h; **(i)** celular: aviso del PIN enorme, pestañas cortadas sin señal de deslizar, aviso de Wasender truncado, íconos sin texto; **(j)** contraste 1,91:1 en «Tareas para Claude»; **(k)** Perfiles: nombres truncados en «En vivo» (se quita con la rama del 19/11) y Autos muestra «Última base: vita · 1 cargados» (base de prueba) | Claude |

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
| 24 | Chat de Marketing trabado en «Tomar por humano» sin pasar a «Enviar presupuesto» (adjuntar PDF ya está en producción desde el PR #75: verificar que se use) | Claude |
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
