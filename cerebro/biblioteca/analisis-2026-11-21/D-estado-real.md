# D · Estado real del sistema (foto solo lectura)

Fecha de la foto: 21/11/2026 05:15 (Buenos Aires). Comparada contra `cerebro/07-estado-verificado.md` (20/11 05:48-06:00).
Fuentes: Supabase enhgkeqiqcuwafsedaza (SELECT, advisors, list_migrations), Vercel prj_liUp46HbkMc0lPlhX1hX5CVLwsYt, Metricool (getScheduledPosts, zona Buenos Aires). Solo cifras agregadas, sin datos personales.

## 1. Migraciones

- Aplicadas: **77**. Última: `0634_asistente_charlas` (20/11 05:22 BA). Igual que el 20/11: no hubo migraciones nuevas.
- Nombres duplicados: **0** (77 nombres distintos).
- Cosas a saber: el prefijo `0502` aparece 3 veces (`bandeja_claude`, `_tocar`, `_disparadores`) y `0511` 4 veces (partes 1 a 4), es numeración por partes, no duplicado. `0619_rendimiento_panel_1511` se aplicó después de `0620`-`0622` (orden de aplicación distinto del numérico). La numeración salta de 0312 a 0400 y de 0626 a 0630 (sin 0627-0629): huecos de numeración, no errores.

## 2. Volúmenes por perfil (base)

| Perfil | Contactos | Nuevo (sin contactar + sin respuesta) | En conversación | Captado | Perdido |
| --- | --- | --- | --- | --- | --- |
| Jurídico | 7.852 | 7.638 | 55 | 17 | 142 |
| Coberturas | 1.316 | 1.227 | 32 | 2 | 55 |
| Autos 0 km | 1.898 | 1.831 | 43 | 4 | 20 |
| Marketing | 1.663 | 1.392 | 171 | 7 | 93 |
| **Total** | **12.729** | 12.088 | 301 | **30** | 310 |

(Estados de captación en `opportunities`, la misma definición que la foto del 20/11. Las oportunidades coinciden 1 a 1 con los contactos.)

Captaciones (`capture_events`): Jurídico 17 (2 nuevas desde la foto del 20/11, la última el 20/11 14:45 BA), Coberturas 2 (última 29/10), Autos 4 (última 26/10), Marketing 7 (última 27/10).

### Mensajes de los últimos 7 días (entrantes / salientes) por perfil y línea

| Perfil | Línea | Entrantes | Salientes | Último entrante |
| --- | --- | --- | --- | --- |
| Jurídico | CIVIL | 74 | 630 | 20/11 15:04 BA |
| Jurídico | PENAL (inactiva) | 0 | 0 | nunca |
| Coberturas | COBERTURAS MEDICAS | 0 | 0 | 13/11 11:30 BA |
| Autos | AGENCIA 0KM | 0 | 0 | **26/10** 18:20 BA |
| Marketing | MARKETING | 0 | 0 | **06/11** 10:04 BA |

Últimas 24 h: Jurídico 23 entrantes / 199 salientes; resto en 0.

Estado de entrega de los 630 salientes de Jurídico (7 días): leído 317, entregado 131, enviado 7, **fallido 175 (27,8 %)**. Errores de Meta en esos fallos: 131026 «Message undeliverable» 102, 131049 «no entregado para mantener la salud del ecosistema» 61, 130472 10, 131042 (pago) 2.

## 3. Campañas (por área y estado; destinatarios, enviados, fallidos)

| Área | Estado | Campañas | Destinatarios | Enviados | Fallidos | Pendientes |
| --- | --- | --- | --- | --- | --- | --- |
| Civil (Jurídico) | finalizada | 6 | 1.375 | 1.002 | 373 | 0 |
| Civil (Jurídico) | pausada | 3 | 2.699 | 616 | 19 | 2.064 |
| Coberturas | finalizada | 2 | 627 | 459 | 168 | 0 |
| Coberturas | pausada | 2 | 683 | 62 | 170 | 451 |
| Autos | finalizada | 1 | 133 | 133 | 0 | 0 |
| Autos | pausada | 2 | 1.764 | 383 | 115 | 1.266 |
| Marketing | finalizada | 3 | 682 | 402 | 280 | 0 |
| Marketing | pausada | 1 | 585 | 347 | 162 | 76 |

- **En curso: 0.** «Campaña Graves 1911» (Jurídico, CIVIL, Meta, `jur_base_fria_a`, 182) arrancó el 20/11 00:44 UTC y **finalizó el 20/11 19:33 UTC (16:33 BA) con los 182 enviados**; los 182 salieron en las últimas 24 h.
- Pausadas: 8 (Wasender ART TEST 1.232, 32 a 82 con envío; `contacto_frio_vita` 542 por calidad baja; `estudio_juridico_vita` 925 pausada sin motivo cargado desde el 21/09; Coberturas 446 por error 131042 de pago y 237; Autos 1.763 por calidad baja y una de 1 destinatario que cortó por «error»; Marketing 585). El 20/11 se habían listado 6: las 2 que faltaban son las antiguas de 925 y de 1 destinatario.
- Estados de destinatario (todas las campañas): pendiente 3.857, leído 1.501, fallo 1.287, entregado 708, enviado 630, respondió 565.

## 4. Seguimientos (`followup_tasks`)

| Perfil | Estado | Cant. | Rango |
| --- | --- | --- | --- |
| Jurídico | programada | 11 | 21/11 20:00 BA a 23/11 14:28 BA |
| Jurídico | **conflicto** | 12 | 16/11 a 20/11 |
| Jurídico | cancelada | 15 | 14/11 a 23/11 |
| Coberturas | **conflicto** | 1 | 16/11 |

Autos y Marketing: 0 seguimientos.

## 5. Incidencias y avisos

- Incidencias abiertas: **1** (Jurídico, `amenaza_legal`, 18/11). Descartadas 55.
- Avisos de captación (`capture_notices`): **30 de 30 en `sin_destinatario`**, 0 enviados (Jurídico 17, Marketing 7, Autos 4, Coberturas 2). El último, de Jurídico, el 20/11 14:45 BA.

## 6. Líneas de WhatsApp

`profile_lines`:

| Perfil | Línea | Activa | Responde con bot | Para campañas | Último entrante | Último saliente |
| --- | --- | --- | --- | --- | --- | --- |
| Jurídico | CIVIL | Sí | Sí | Sí | 20/11 15:04 BA | 20/11 16:31 BA |
| Jurídico | PENAL | **No** | Sí | Sí | nunca | nunca |
| Coberturas | COBERTURAS MEDICAS | Sí | Sí | Sí | 13/11 11:30 BA | 13/11 11:30 BA |
| Autos | AGENCIA 0KM | Sí | Sí | Sí | 26/10 18:20 BA | 26/10 20:52 BA |
| Marketing | MARKETING | Sí | Sí | Sí | 06/11 10:04 BA | 06/11 08:12 BA |

`calidad_lineas` (último chequeo 21/11 05:09 BA): AGENCIA 0KM **baja desde 26/10** (campaña `24/10 0km` pausada), MARKETING sin dato. `avisos_meta`: MARKETING con cuenta suscripta (21/10), CIVIL sin intento registrado.

Wasender (3): las 3 `logged_out`, `habilitada=false`, modo prueba encendido. «Asesoria Vita» archivada; «Asesoria Vita - 2» (13/11 16:52 UTC) y «LINEA - KOCOS MARKETING» (16/11). Sin cambios.

## 7. Configuración clave (`system_settings`, sin cambios desde el 20/11)

| Llave | Valor |
| --- | --- |
| automation_pause | **Sin pausa** (`ai_replies_paused=false`, `outbound_automations_paused=false`; levantada 16/10) |
| audios_a_texto | 4 perfiles encendidos (13/11) |
| recontacto_ia | 4 perfiles encendidos (desde 24/10) |
| caidos_automaticos | Activo (desde 13/11) |
| publicidad | **Deshabilitada** (`habilitada=false`, sin perfiles) |
| tareas_servidor | citas **apagado**, contenido **apagado** |
| limites_outscraper | 1.000/día, 500 por extracción |
| ultimo_latido | ok, 21/11 05:14 BA, 7,6 s |

- Bots (`ai_agents`): **5 activos** (Civil, Penal, Coberturas Médicas, Agencia 0KM, Marketing). Agente Civil actualizado el 20/11 04:54 BA; los otros 4 el 20/11 01:07 BA.
- Latido: `campaigns-tick` por pg_cron, **1.440 corridas en 24 h, 0 fallas**, última 21/11 05:15 BA. Etapas del último ciclo en ms (seguimiento 2.152, recontacto 1.750, campañas 1.079, formularios 1.046, marketing 746).
- La fila `ultimo_latido` tiene `updated_at` del 16/10 aunque el contenido es de hoy: no sirve para medir frescura, hay que leer `value.at`.

## 8. Advisors de Supabase

Seguridad (igual que el 20/11):
- WARN `extension_in_public`: `pg_net` en el esquema `public`.
- WARN `auth_leaked_password_protection`: protección contra contraseñas filtradas apagada (impacto bajo: el panel no usa Auth de Supabase).
- INFO `rls_enabled_no_policy`: 126 tablas (esperado, acceso solo con clave de servicio; incluye las de los esquemas `respaldo_etapa1`).

Rendimiento (solo INFO, ningún WARN):
- 10 claves foráneas sin índice: `bot_knowledge_assignment` (2), `campaigns.wasender_plantilla_id`, `limpieza_movimientos` (3), `wasender_segundos_intentos` (4).
- 69 tablas sin clave primaria, todas en los esquemas de respaldo `respaldo_etapa1` y `respaldo_20261015`.
- 88 índices sin uso.

## 9. Vercel

Producción:
- Último despliegue: **20/11 10:58 BA, commit `66c457b` en `main`** («Merge origin/claude/admiring-euler-ctf4sg»), READY. Reemplaza al `36f742b` (20/11 05:25 BA) de la foto anterior. Anteriores: `77325da` (#78, charlas guardadas del asistente) y `bf0b396`.
- Errores de despliegue recientes: ninguno. Los 5 últimos en ERROR son de ramas de octubre.

Previews (target null) en las últimas 24 h: al menos 11, todas READY, de las ramas `cerebro-chats`, `claude/admiring-euler-ctf4sg` y `claude/happy-wozniak-ajfi1z` (la última, 21/11 04:54 BA). La Preview comparte base y líneas con producción.

Errores de runtime en producción, últimas 24 h: **1 grupo, 1 ocurrencia**: `TiempoAgotadoError` «el modelo no respondió en 20 segundos» en `/api/webhooks/whatsapp` (vista 17/11, última ocurrencia 20/11 14:42 BA, desplegado `7bS3Q6t`). Sin otros errores.

## 10. Metricool: piezas programadas por marca y día (21 al 29/11)

Pendientes de publicar, zona Buenos Aires. Reel = REEL, historia = STORY, carrusel = publicación con más de una imagen, post = publicación de una imagen. «Borr.» = borrador (no se publica).

| Día | VITA | Coberturas | Autos | Kocos Marketing |
| --- | --- | --- | --- | --- |
| 21/11 | **26** (8 reels, 14 historias, 2 carruseles, 2 posts) | **26** (8, 14, 2, 2) | **26** (8, 14, 2, 2) | **29** (11 reels, 14 historias, 2 carruseles, 2 posts) |
| 22/11 | **23** (5 reels, 14 historias, 2 carruseles, 2 posts) | s/d | s/d | s/d |
| 23/11 | s/d | s/d | s/d | s/d |
| 24/11 | s/d | s/d | s/d | s/d |
| 25/11 | 13 (12 historias, 1 carrusel) | 13 (igual) | 13 (igual) | 13 (12 historias, 1 carrusel) **+ 10 borradores** solo IG |
| 26/11 | 13 | 13 | 13 | s/d |
| 27/11 | 13 | 13 | 13 | s/d |
| 28/11 | 13 | 13 | 13 | s/d |
| 29/11 | 13 | 13 | 13 | s/d |

Notas de medición:
- 25 al 29/11 de VITA, Coberturas y Autos: 65 piezas por marca, exactamente 13 por día (12 historias + 1 carrusel), todas Facebook + Instagram, 0 borradores, **0 reels**.
- Kocos 25/11: 13 programadas (12 historias + 1 carrusel, FB + IG) y 10 borradores solo Instagram, que no se publican (5 reels, 2 historias, 2 posts, 1 carrusel). Kocos 26 al 29/11 no se pudo medir: la respuesta de Metricool supera el límite de tamaño incluso de a 4 días.
- 22 al 24/11: las consultas de rango superaron el límite; solo se midió 22/11 de VITA. Por el patrón (10 piezas base de la tanda del 9/11, de las cuales 5 reels, 2 historias, 2 posts y 1 carrusel, más las 13 nuevas) lo esperable es 23 por día y marca para 23 y 24/11, y 22/11 en las otras 3 marcas, **pero no está verificado**. s/d = sin dato medido.
- Piezas agregadas desde el 20/11: 12 historias + 1 carrusel por día y marca para 21 al 29/11 (cargadas el 20/11 10:58 a 11:07 BA y 20:56 BA), más reels con voz generada con IA el 21/11 (08:50, 10:30, 13:50 en VITA, Coberturas y Autos; 6 en Kocos), cargados entre el 20/11 17:17 y el 21/11 02:57 BA.

## 11. Qué cambió respecto del 20/11

1. **Campaña Graves 1911 terminó**: 182 de 182 enviados (20/11 hasta las 16:33 BA). Ya no hay campañas en curso. Jurídico dio 2 captaciones nuevas el 20/11 (15 a 17) y los avisos de esos casos también quedaron `sin_destinatario`.
2. **Jurídico**: 74 entrantes y 630 salientes en 7 días (antes 99 / 636); fallidos 175 de 630 (27,8 %, antes 26 %). Estados de oportunidad: nuevo 7.648 a 7.638, en conversación 52 a 55, captado 15 a 17, perdido 137 a 142. Coberturas, Autos y Marketing sin variación.
3. **Seguimientos en conflicto: 10 a 13** (12 Jurídico, 1 Coberturas); programados 14 a 11. El bug de las 72 h sigue sin resolverse.
4. **Producción**: nuevo despliegue `66c457b` en `main` (20/11 10:58 BA) sobre `36f742b`; sin errores de despliegue. Un solo error de runtime (timeout del modelo) en 24 h.
5. **Redes**: el hueco del 25 al 30/11 se cubrió: VITA, Coberturas y Autos tienen 13 piezas por día del 25 al 29/11 (antes 0), Kocos también 13 por día el 25/11 además de sus borradores. El 21/11 hay 26 piezas por marca (29 en Kocos) contra las 10 de antes. Siguen sin reels programados del 25 al 29/11.
6. Sin cambios: migraciones (77, última 0634), `system_settings`, 5 bots activos, líneas Meta y Wasender, advisors, 1 incidencia abierta, latido OK (1.440/1.440).

## 12. Alertas

1. **Marketing sin entrantes desde el 06/11 (15 días) y Autos desde el 26/10 (26 días)**; Coberturas 8 días. Solo CIVIL recibe tráfico. Marketing figura con «Sin acceso al número» en Meta (token o permiso, a revisar en Meta Business); Autos con calidad baja desde el 26/10.
2. **Fallas de entrega altas**: 27,8 % de los salientes de Jurídico de 7 días fallaron (131026 y 131049 dominan: base o plantilla que Meta rechaza para cuidar el ecosistema). La campaña de 182 que terminó ayer conviene revisarla antes de lanzar otra.
3. **13 seguimientos en `conflicto`** (desde el 16/11), subió de 10; 11 programados vencen entre hoy 20:00 y el 23/11 14:28.
4. **Avisos de captación: 30 de 30 sin destinatario, 0 enviados**. Cada captación nueva (hubo 2 ayer) no avisa a nadie. Falta cargar destinatarios por perfil.
5. **1 incidencia abierta de amenaza legal** (18/11) sin resolver, ya con 3 días.
6. Cobertura de pago: campaña de Coberturas pausada por error 131042 (pago de la cuenta de WhatsApp Business) sin resolver; 2 fallos más de ese tipo en los últimos 7 días.
7. Destinatarios pendientes: 2.064 destinatarios de Jurídico en campañas pausadas, 1.266 en Autos, 451 en Coberturas y 76 en Marketing: no salen mientras haya calidad baja o error de pago.
8. Kocos: 10 borradores del 25/11 (y más del 26 al 29, sin medir) solo IG, que no se publican.
9. Metricool: no se pudo verificar 22 al 24/11 (salvo 22/11 de VITA) ni Kocos 26 al 29/11 por el tamaño de respuesta.
10. Las 3 líneas de Wasender siguen en `logged_out`: escanear el QR (la responsable).
11. Higiene: `pg_net` en `public` y protección de contraseñas filtradas apagada (WARN, impacto bajo); 88 índices sin uso y 10 claves foráneas sin índice (INFO). La Preview comparte base con producción y hay varias activas.
