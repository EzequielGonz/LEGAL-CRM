---
description: Foto del estado real (base, Vercel, Metricool, webs) con fecha y fuente, y cómo volver a comprobarlo
verificado: 20/11/2026 05:48–06:00 (Buenos Aires), solo lectura
fuentes: Supabase enhgkeqiqcuwafsedaza (SELECT, advisors, list_migrations), Vercel (deployments, runtime errors), Metricool (getScheduledPosts en zona Buenos Aires), DNS y home de las 4 webs
---

# Estado verificado

Si esta foto tiene más de 24 h, volver a comprobar antes de afirmar algo (consultas al final).

## Encendido

| Qué | Estado | Dato |
| --- | --- | --- |
| Perfiles | 4 activos | juridico, coberturas_medicas, agencia_0km, marketing |
| Bots | 5 activos | Civil, Penal, Coberturas, Agencia 0KM, Marketing · Gemini 3.8 Flash · conocimiento v2 al 100 %, sin A/B · `agent_assignments` vacía |
| automation_pause | Sin pausa | |
| audios_a_texto | 4 perfiles | |
| recontacto_ia | 4 perfiles | desde 24/10 |
| caidos_automaticos | Activo | desde 13/11 |
| publicidad | **Deshabilitada** | `habilitada: false` |
| tareas_servidor | Citas y contenido **apagados** | |
| Latido | OK | `campaigns-tick` por pg_cron cada minuto: 1.440 corridas en 24 h, 0 fallas; último 05:48 (2,1 s) |
| Outscraper | 1.000/día, 500 por extracción | |

## Líneas

| Meta | Activa | Calidad |
| --- | --- | --- |
| CIVIL | Sí | Alta |
| COBERTURAS MEDICAS | Sí | Alta |
| AGENCIA 0KM | Sí | **Baja desde 26/10** |
| MARKETING | Sí | Sin dato |
| PENAL | No | — |

**Según el panel (consulta en vivo a Meta, 20/11 06:00):** CIVIL conectada, calidad alta · PENAL «faltan variables» · Coberturas conectada, alta · AGENCIA 0KM conectada, **calidad baja** · **MARKETING «Sin acceso al número»: envíos y respuestas automáticas deshabilitados** → explica que Marketing no reciba nada desde el 06/11. Hay que revisar el token o el permiso del número en Meta Business. Salud de Marketing dice «4 en orden» y no lo avisa (bug).

Puntaje del bot en captación y trato (Salud): Jurídico 35/100, Coberturas 32, Autos 46, Marketing 40.

Wasender: las 3 `logged_out`, `habilitada=false`, modo de prueba encendido. «Asesoria Vita» archivada; «Asesoria Vita - 2» (estado del 13/11); «LINEA - KOCOS MARKETING» (16/11). Hay que escanear el QR (el dueño).

## Campañas

- **En curso:** «Campaña Graves 1911» — Jurídico, CIVIL, Meta, plantilla `jur_base_fria_a`, 182 destinatarios. Creada y arrancada el 19/11 21:44 (fuera de ventana) → **0 envíos todavía**; debería empezar 08:00 del 20/11, tope 200/día, tandas de 10.
- **Pausadas:** ART TEST WASENDER 10/11 (Jurídico, Wasender, 1.232, línea desconectada) · ART Graves Reactivación (Jurídico, Meta, 542, calidad baja 27/10) · 24/10 0km (Autos, Meta, 1.763, calidad baja 26/10) · obrasociaal (Coberturas, Meta, 446, **error 131042 de pago** 27/10) · Campaña Social Octubre (Coberturas, Meta, 237) · Aberturas y Carpinterías (Marketing, Meta, 585, 01/11).
- Archivadas: 2. Finalizadas: 12 (últimas «ART GRAVES 13/11» 378, cerró 19/11 11:48; «GRAVES META 12/11» 192).

## Volumen

| Perfil | Nuevo (sin contactar + sin respuesta) | En conversación | Captado | Perdido | Total |
| --- | --- | --- | --- | --- | --- |
| Jurídico | 7.648 (4.613 + 3.035) | 52 | 15 | 137 | 7.852 |
| Coberturas | 1.227 (451 + 776) | 32 | 2 | 55 | 1.316 |
| Autos 0 km | 1.831 (1.265 + 566) | 43 | 4 | 20 | 1.898 |
| Marketing | 1.392 (468 + 924) | 171 | 7 | 93 | 1.663 |
| **Total** | 12.098 | 298 | **28** | 305 | **12.729** |

| Perfil | Mensajes 7 días (entran / salen) | Último entrante |
| --- | --- | --- |
| Jurídico | 99 / 636 | 19/11 17:26 |
| Coberturas | 4 / 2 | 13/11 |
| Marketing | 0 / 0 | **06/11** |
| Autos | 0 / 0 | **26/10** |

## Alertas abiertas

1. **26 % de fallas en inicios de campaña de Jurídico** (143 de 541 en 7 días): 76 «Message undeliverable», 54 «no entregado para mantener la salud del ecosistema» (señal de Meta de que la base o la plantilla generan rechazo), 1 de facturación.
2. **Autos y Marketing sin entrantes hace 25 y 14 días.** Marketing: la línea de Meta figura «Sin acceso al número» (token o permiso). Autos: conectada con calidad baja; probar un WhatsApp entrante.
3. **10 seguimientos en `conflicto`** (9 Jurídico, 1 Coberturas) desde el 16/11 — bug de las 72 h. 14 programados de Jurídico entre 20/11 08:19 y 21/11 20:58.
4. **6 avisos de captación `sin_destinatario`** (último 19/11 17:26): faltan destinatarios de avisos por perfil.
5. **1 incidencia abierta de amenaza legal** (18/11) para revisar en Incidencias de Jurídico.
6. 4 turnos de IA con «el modelo no respondió en 20 s» (último 17/11).
7. Coberturas tiene una campaña pausada por error de pago de Meta (131042): revisar método de pago de la cuenta de WhatsApp Business.
8. Supabase advisors: `pg_net` en el esquema `public` (WARN) y protección contra contraseñas filtradas de Auth apagada (WARN; el panel no usa Auth de Supabase, impacto bajo). 126 tablas con RLS sin políticas (esperado: acceso solo por clave de servicio).

## Producción y código

- 22/11 noche: tabla `cerebro_conocimiento` creada (migración 0650, RLS activo, sin permisos públicos, 0 filas). Versión con las cinco partes de la quinta vuelta en `main` (ver bitácora).

- Vercel producción: último despliegue 20/11 05:25 `36f742b` (READY). Sin errores de runtime en 24 h.
- Migraciones: **77 aplicadas, última `0634_asistente_charlas`** (20/11 05:22). Ojo: la rama de trabajo `claude/admiring-euler-ctf4sg` llega solo a `0633` (está 43 commits detrás de main).
- Bandeja para Claude: **0 tareas abiertas** (la única quedó «lista» el 20/11 05:26).

## Redes (Metricool, zona Buenos Aires)

- 20/11: VITA 34 (21 historias de destacadas ya publicadas + 13 pendientes, incluido el TRIAL_REEL 16:30), Coberturas 32 (21 + 11), Autos 31 (20 + 11), Kocos 30 (19 + 11).
- 21–24/11: 10 por día y marca (grupo de control de la tanda de 600).
- **25–30/11: VITA, Coberturas y Autos sin nada programado.** Kocos: 44 borradores solo IG (25–29/11), no se publican.
- Errores desde 10/11: VITA 2 (restricción 10/11, republicados OK); Kocos 44 (IG desconectado 13/11 17:00 → 17/11 20:30; volvió 18/11). Coberturas y Autos: 0.
- **El cronograma doble 20–29/11 está casi sin producir**: solo 6 piezas nuevas programadas para el 20/11.

## Webs

- Las 4 tienen registro DNS `google-site-verification` → verificadas en Search Console como dominio.
- Ninguna tiene GA4, GTM ni píxel en la home; ninguna verificada en Bing.
- Coberturas y Kocos responden 403 a pedidos automáticos (revisar protección contra bots).

## Cómo volver a comprobar

```sql
-- llaves y latido
select key, value, updated_at from system_settings order by key;
-- campañas activas o pausadas
select r.slug, c.name, c.status, c.created_at from campaigns c join rubros r on r.id = c.rubro_id where c.status not in ('finalizada','archivada') order by c.created_at desc;
-- seguimiento en conflicto
select status, count(*) from follow_up_tasks group by status;
```
(Verificar nombres de tablas y columnas en `supabase/migrations` antes de correr; la tabla de seguimiento puede llamarse distinto.) Metricool: `getScheduledPosts` por blogId con zona `America/Argentina/Buenos_Aires`. Vercel: `list_deployments` del proyecto del panel y `get_runtime_errors`. Webs: `https://dns.google/resolve?name=<dominio>&type=TXT`.
