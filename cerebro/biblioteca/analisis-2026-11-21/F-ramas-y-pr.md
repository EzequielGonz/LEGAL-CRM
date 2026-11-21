---
descripcion: Inventario verificado de ramas y pull requests de los 5 repos, qué contiene cada uno y qué trabajo falta integrar
verificado: 21/11/2026 (git fetch --all --prune en los 5 clones, sin tocar ramas de trabajo; PR leídos por la API de GitHub)
reemplaza_a: inventario del 20/11 en cerebro/06-tecnica-repos-y-accesos.md
---

# F · Ramas y pull requests de los 5 repos

Solo lectura: no se hizo commit, push, merge ni cierre de PR. Sin claves.

## Resumen en 8 líneas

1. Los 5 repos son **públicos** (`private: false` en la API). `cerebro-chats` de LEGAL-CRM tiene volcados crudos de chats; la autorización dice «el repo pasa a privado», pero hoy sigue público. Pasarlo a privado va antes que cualquier otra cosa.
2. `LEGAL-CRM`: 93 ramas remotas además de `main` (66c457b, 566 commits). **77 de los 80 PR están fusionados**; abiertos: #40, #77 y #80.
3. Respecto del inventario del 20/11 cambió: `claude/gracious-volta-rv2f3x` y `claude/festive-goldberg-x8t43f` ya están en main; `asistente-charlas` (#78) y `claude/admiring-euler-ctf4sg` (#79) se fusionaron el 20/11; aparecieron `cerebro-chats` y 4 ramas `claude/redes-*`.
4. Trabajo propio sin integrar en LEGAL-CRM: `claude/happy-wozniak-ajfi1z` (36 commits, 644 archivos, PR #77), `cerebro-chats` (17 commits), `claude/admiring-euler-ctf4sg` (15 commits posteriores al #79), 4 ramas de reels, `claude/pensive-galileo-d6ephy` (archivo de prospectos) y `landings-conexion` (PR #40).
5. **Riesgo de migraciones:** `claude/pensive-galileo-d6ephy` trae `0634_archivo_de_prospectos.sql` y main ya tiene `0634_asistente_charlas.sql` (PR #78). Hay que renumerar a 0635 antes de integrar. Es el único número repetido nuevo; el único prefijo repetido en main es 0511 (cuatro partes a propósito).
6. Las 4 landings tienen cada una 3 ramas remotas: `main`, `gracious-volta` (integrada, 0 adelante) y `happy-wozniak` con **1 commit de medición** (UTM, GA4/GTM/Píxel, referencia en WhatsApp; 14 archivos, +618 −14), sin conflictos y con un PR abierto (#1) en cada repo.
7. El PR #80 de LEGAL-CRM está armado al revés (de `main` hacia `claude/happy-wozniak-ajfi1z`); no integra la rama `cerebro-chats` ni el cerebro nuevo. Conviene cerrarlo y abrir uno nuevo (la decisión es de la responsable).
8. `docs/` de LEGAL-CRM y `cerebro/06` tenían contadores viejos (88 ramas, 77 migraciones, main 36f742b; hoy 93 ramas y 84 archivos de migración); los valores vigentes están abajo.

---

## 1. LEGAL-CRM

- Producción: `main` → `legal-crm-nine.vercel.app`. Último commit de main: `66c457b` (20/11, «Merge … admiring-euler-ctf4sg», que es el merge del PR #79).
- 566 commits en main; primer commit 7/9/2026. Mayor actividad: 8/9 (35), 23–24/9 (71), 16–17/10 (70), 24/10 (21), 13/11 (62), 20/11 (55).
- 93 ramas remotas distintas de main: **82 integradas** (76 por PR fusionado y 6 sin PR con 0 commits adelante), **9 con trabajo propio sin integrar** y **2 abandonadas o descartables** (ver tablas).
- Migraciones en main: 84 archivos, de 0001 a **0634_asistente_charlas**. Próximo número libre: **0635**.

### 1.1 Ramas con trabajo propio sin integrar

| Rama | Último commit | Adelante / atrás de main | Qué toca | Integra limpio | Qué hace |
| --- | --- | --- | --- | --- | --- |
| `claude/happy-wozniak-ajfi1z` | 21/11 06:08, Claude, «Redes: avance de reels antes del corte por límite» | 36 / 29 | 644 archivos: 617 en `.claude/` (piezas, guiones, voces, calendarios), 24 en `docs/`, 3 en `.ai-context/`. Sin `src/` ni migraciones | Sí (0 conflictos) | Producción de redes 20–29/11: estáticos del 25 al 29/11 de las 4 marcas, 10 reels del 21/11 programados, historias y carruseles, traspasos, tipografías del motor de reels, aprobación del 3 % de aporte legal en Coberturas. Es el [PR #77](https://github.com/EzequielGonz/LEGAL-CRM/pull/77). |
| `cerebro-chats` | 21/11, Claude, «Cerebro: documentos del Project «crm» de Cowork e historiales completos» | 17 / 0 | 62 archivos, +16.654 líneas: `cerebro/chats/` (41), `cerebro/biblioteca/` (16), `13-lo-aprendido`, bitácora, traspaso del 21/11, pendientes | Sí; es descendiente directa de main | Memoria ampliada: síntesis y **volcados crudos** de chats de Claude común, Code y Cowork. Incluye todo `claude/admiring-euler-ctf4sg` (+2 commits). Sin PR. |
| `claude/admiring-euler-ctf4sg` | 21/11, Claude, «Cerebro: cruce de los chats volcados (13-lo-aprendido) y bitácora» | 15 / 0 | 37 archivos, +13.234 líneas, todo en `cerebro/` | Sí | Rama de la sesión del cerebro. El PR #79 la fusionó el 20/11; los 15 commits de después (volcados, síntesis, plantilla de chats, traspaso) **no están en main**. Es ancestro de `cerebro-chats`, así que alcanza con integrar `cerebro-chats`. |
| `claude/pensive-galileo-d6ephy` | 19/11 22:58, Claude, «Rediseño panel: Hoy más limpio, archivar prospectos…» | 1 / 73 | 20 archivos, +313 −78: 9 `src/app`, 4 `src/lib`, 4 `src/components`, 1 prueba, 1 migración | Sí, pero con número de migración repetido | Panel: Hoy más limpio, botón Archivar, «Archivados» dentro de Descartados, marco de chats unificado, archivo automático a 30 días (apagado hasta `system_settings.archivo_automatico`). Migración `0634_archivo_de_prospectos.sql` (columnas `archived_at/by/reason`, índice y disparador que desarchiva si la persona vuelve a escribir). Sin PR. |
| `landings-conexion` | 20/10, Ezequiel, «Landings: el formulario avisa por correo a la casilla del rubro» | 2 / 236 | `src/app/api/landing/route.ts`, `src/lib/landing-email.ts`, 1 prueba | **No**: 1 conflicto en `api/landing/route.ts` | Aviso por correo con Resend a la casilla de cada rubro al entrar un formulario. Sin `RESEND_API_KEY` ni `LANDING_EMAIL_FROM` no envía nada y no registra datos del contacto. [PR #40](https://github.com/EzequielGonz/LEGAL-CRM/pull/40) abierto, `mergeable: false` (dirty). |
| `claude/redes-autos-1` | 20/11 14:06, Claude | 3 / 29 | 39 archivos (`.claude/`, `docs/`) | Sí | Kit de Autos, guiones del 20 al 23/11, fuentes Archivo y Plus Jakarta, reels `autos-documentacion-b` y `autos-plan-cuota-a`. Sesión en paralelo, sin PR. |
| `claude/redes-autos-2` | 20/11 09:05, Claude | 2 / 29 | 9 archivos | Sí | Motor de reels: suma Archivo, Plus Jakarta Sans y Outfit (salían en Times) y captura rápida de cuadros. |
| `claude/redes-cob-1` | 20/11 13:57, Claude | 2 / 29 | 16 archivos | Sí | Kit de Coberturas, servir sin servidor y reel `cob-reintegros-b`. |
| `claude/redes-mkt-1` | 20/11 14:06, Claude | 3 / 29 | 22 archivos | Sí | Reels `mkt-catalogo-b`, `mkt-web-movil-b`, `mkt-precio-a`, kit de historias Kocos y fuente Outfit. |

Los 4 commits de las ramas `redes-*` **no están** dentro de `happy-wozniak` (solo comparten el commit base `70bd3db`, el encargo para sesiones en paralelo). Para sumarlas hay que integrarlas aparte, y los cambios del motor de reels de `redes-autos-2` se pisan en intención con los de `370cfcf` en `happy-wozniak` (mismas fuentes); no dieron conflicto de texto contra main.

### 1.2 Ramas descartables y ramas sin PR que ya están en main

| Rama | Último | Qué es | Qué hacer |
| --- | --- | --- | --- |
| `test-escritura-claude` | 15/10 | 1 commit, `TEST_ESCRITURA.txt`, «prueba de escritura (borrable)» | Borrable (la responsable decide: la regla dice archivar, no borrar). |
| `trabajo-1410` | 14/10, bot | 2 commits (carga manual y «Aplicar pipeline de Marketing»), 345 archivos; trae migraciones `0200–0202` | Antecesora de las etapas 1–3, ya reemplazadas por los PR #1 y #2. Las migraciones 0200–0202 existen en main. Archivar. |
| `rediseno-b1-navegacion`, `rediseno-b3` | 17/10 | 0 adelante: todo en main | Sin trabajo propio. |
| `claude/relaxed-cerf-5oncz1` | 15/11 | 0 adelante: todo en main | Sin trabajo propio. |
| `mejoras-1211`, `wasender-integracion`, `claude/festive-goldberg-x8t43f` | 10–20/11 | 0 adelante: todo en main | Sin trabajo propio (`wasender-integracion` es el bloque 2 de Wasender; el contexto Word de `festive-goldberg` entró el 20/11). |

### 1.3 Ramas integradas por PR (77 PR fusionados)

Todas fusionadas por PR. Las que aparecen con commits «adelante» en git (squash) tienen su contenido en main; el último commit de cada una es anterior a la fecha del PR, salvo `claude/gracious-volta-rv2f3x` (PR #76, 9/11, y un commit del 10/11 que entró después por merge `891334b`) y `claude/admiring-euler-ctf4sg` (ver 1.1).

| Rama | PR | Fusionado | Qué hizo |
| --- | --- | --- | --- |
| `etapa1-correcciones` | #1 | 2026-10-11 | Etapa1 correcciones |
| `etapa3` | #2 | 2026-10-16 | Etapa 2 + Etapa 3 + Gemini 3.8 Flash |
| `landings-crm` | #3 | 2026-10-16 | Landings → CRM: formularios de los 4 perfiles |
| `estetica-por-perfil` | #4 | 2026-10-16 | Estética por perfil: paletas de marca, menú unificado con logo |
| `bloque-1610` | #5 | 2026-10-16 | Bloque 16/10: comparación de agentes A/B/C, Marketing (Extraer negocios y Pide presupuesto) y audito |
| `contexto-1610` | #6 | 2026-10-16 | Contexto actual: cierre del bloque 16/10 |
| `salud-y-operacion-1610` | #7 | 2026-10-16 | Tablero de salud, ingreso con lámpara, latido solo con encabezado y conversación con el marco de su  |
| `diseno-premium-1610` | #8 | 2026-10-16 | Diseño premium del panel: lámpara interactiva, ingreso, inicio, menú y capa global |
| `mejora-visual-rendimiento` | #9 | 2026-10-17 | Mejora visual integral y rendimiento del panel |
| `rediseno-estudio` | #10 | 2026-10-17 | Rediseño visual «Estudio» del panel completo |
| `capa-inmersiva` | #11 | 2026-10-17 | Capa inmersiva: profundidad 3D, luz dinámica y fondos con volumen |
| `escena-iconos` | #12 | 2026-10-17 | Fondo de geometría 3D en grafito e íconos propios |
| `sala-lampara` | #13 | 2026-10-17 | Sala de la lámpara, identidad por perfil e ingreso preciso |
| `ingreso-grafito` | #14 | 2026-10-17 | Ingreso grafito, PIN de 48 px y sala con la paleta de cada perfil |
| `logos-reales` | #15 | 2026-10-17 | Logos reales por perfil, logo general del panel y lámpara solo en el ingreso |
| `logos-fondo-negro` | #16 | 2026-10-17 | Logos de perfil sobre placa negra |
| `rediseno-b4` | #17 | 2026-10-17 | Rediseño integral: bloques 1 a 4 (navegación, marca, pantallas, sistema visual) + selector Simple/Av |
| `plantillas-enviar-a-meta` | #18 | 2026-10-17 | Plantillas: enviar propuestas a revisión de Meta desde el panel |
| `reorganizacion-1810` | #19 | 2026-10-18 | Reorganización 18/10: panel renovado, asistente IA y redes desde el panel |
| `reorganizacion-2` | #20 | 2026-10-18 | Reorganización 2 (18/10): cartera de oportunidades, perfiles, horario 24 h y redes |
| `perfiles-pc` | #21 | 2026-10-18 | Perfiles en la computadora: tarjetas completas con cifras |
| `estado-real-lineas` | #22 | 2026-10-19 | Estado real de las líneas de WhatsApp (el panel pregunta a Meta) |
| `contexto-estado-lineas` | #23 | 2026-10-19 | Contexto: registra el estado real de las líneas de WhatsApp (PR #22) |
| `asistente-completo` | #24 | 2026-10-19 | Asistente completo: campañas, líneas y agentes con confirmación, IA general con imágenes y «Preparar |
| `contexto-asistente` | #25 | 2026-10-19 | Contexto: registra el asistente ampliado (PR #24) |
| `chat-campanas-ia` | #26 | 2026-10-19 | Campañas: «Preparar con IA» como chat dentro de la pantalla, con adjuntos y recomendación según la b |
| `afinado-diseno` | #27 | 2026-10-19 | Diseño: afinado premium del panel (solo presentación) |
| `contexto-afinado` | #28 | 2026-10-19 | Contexto: chat de Campañas (#26) y afinado de diseño (#27) |
| `bandeja-claude` | #29 | 2026-10-19 | Bandeja para Claude: tareas para Claude desde el panel (migración 0502) |
| `afinado-diseno-2` | #30 | 2026-10-19 | Diseño (tanda 2): modo teléfono, cifras de campaña y Configuración (solo presentación) |
| `contexto-afinado-2` | #31 | 2026-10-19 | Contexto: afinado de diseño, tanda 2 (#30) |
| `bandeja-posicion` | #32 | 2026-10-19 | Bandeja para Claude: tarjeta negra arriba de «Pedile algo» |
| `linea-codigo-vencido` | #33 | 2026-10-19 | Líneas: «Conectada» aunque el código de verificación figure vencido |
| `inicio-campanas-activas` | #34 | 2026-10-19 | Inicio: campañas en curso con acceso directo (todos los perfiles) |
| `ajustes-perdidos-estadisticas` | #35 | 2026-10-19 | Perdidos automáticos, estadísticas reales y bases ya cargadas (todos los perfiles) |
| `limite-diario-kocos-contexto` | #36 | 2026-10-19 | Límite diario editable en cualquier estado (panel y asistente), contexto del asistente y circuito de |
| `kocos-analisis-automatico` | #37 | 2026-10-19 | Kocos: análisis IA automático para bases extraídas y venta consultiva en el mismo chat |
| `verificar-numero` | #38 | 2026-10-20 | Líneas: verificar y registrar el número pendiente desde el panel |
| `fix-plantillas-archivo-aviso` | #39 | 2026-10-20 | Plantillas por archivo: aviso final fiel a la respuesta de Meta |
| `t1-agentes-responden` | #41 | 2026-10-21 | T1 · Agentes que responden en todas las líneas, sin comparación y con roles por base |
| `t2-t6-chats-perfiles-cierre` | #42 | 2026-10-21 | T2–T6: chats por perfil, base en Marketing, entrada directa a perfiles, formularios a los 5 min y gu |
| `redes-piezas-15-dias` | #43 | 2026-10-21 | Redes: piezas del plan de 15 días como imágenes públicas para Metricool |
| `presupuesto-programado-y-hora` | #44 | 2026-10-22 | Presupuestos de Marketing con envío programado + hora del panel en Buenos Aires |
| `presupuesto-escribe-antes` | #45 | 2026-10-22 | Presupuesto programado: si el cliente escribe antes, sale en ese momento y la IA retoma la venta |
| `adjuntos-chat-presupuesto` | #46 | 2026-10-22 | Fotos y videos en los chats y en el presupuesto |
| `perfiles-cifras-en-vivo` | #47 | 2026-10-22 | Perfiles: las estadísticas se actualizan solas |
| `perfiles-campana-enviando` | #48 | 2026-10-22 | Perfiles: «Campaña enviando» en lugar de «Última base» |
| `salud-detenido-no-es-error` | #49 | 2026-10-24 | Salud: contacto detenido a mitad de la respuesta = bloqueado, no error |
| `errores-explicados` | #50 | 2026-10-24 | Envíos: errores de Meta explicados y pausa por error de cuenta vía webhook |
| `salud-error-ia-directo` | #51 | 2026-10-24 | Salud: error de la IA con prospecto, explicación y enlace directo al chat |
| `bot-insiste-una-vez` | #52 | 2026-10-24 | Bot: insiste una vez con algo útil y explica el origen del contacto |
| `plantillas-base-fria` | #53 | 2026-10-24 | Plantillas: aperturas honestas para base fría |
| `reorg-parte-1` | #54 | 2026-10-24 | Reorganización 1/3: Hoy por personas, menú Trabajo/Configurar, modo oscuro premium |
| `reorg-bot-ia` | #55 | 2026-10-24 | Reorganización 2/3: Bot IA (base general + rol, probar el bot real) y ajustes del modo oscuro |
| `reorg-parte-3` | #56 | 2026-10-24 | Reorganización 3/3: campañas claras, salud por perfil y bugs |
| `reorg-cierre` | #57 | 2026-10-24 | Cierre de la reorganización: scraper en hora AR y chats |
| `reorg-chat` | #58 | 2026-10-24 | Un solo chat, asistente con chats, Instagram por enlace y ajustes |
| `chat-alto` | #59 | 2026-10-24 | Chats del perfil: alto correcto, sin corrimiento |
| `hora-24` | #60 | 2026-10-24 | Horas AR de 24 h en todo el panel y «Escribieron» por personas |
| `prompt-comun` | #61 | 2026-10-24 | Bot: instrucciones en un módulo común y turnos ofrecidos en hora AR |
| `recontacto-24h` | #62 | 2026-10-24 | Recontacto del bot en las 24 h y asignación automática de plantillas |
| `bot-general-y-rol-campana` | #63 | 2026-10-24 | Bot general con venta consultiva para quien escribe por su cuenta y rol por campaña |
| `plantillas-y-botones` | #64 | 2026-10-24 | El bot lee las plantillas y sus botones; «ahora no» sin insistir |
| `correccion-ahora-no` | #65 | 2026-10-24 | Corrección del «Ahora no» en las bases que corren |
| `sin-respuestas-dobles` | #66 | 2026-10-24 | El bot no responde dos veces cuando llegan dos mensajes seguidos |
| `perfiles-en-vivo` | #67 | 2026-10-24 | Perfiles: seguimiento en vivo de los cuatro rubros |
| `redes-ampliacion-2410` | #68 | 2026-10-24 | Redes: ampliación del 24/10 (2 de feed y 5 historias por día y marca) |
| `bot-24-10-contestadores-y-calidad` | #69 | 2026-10-24 | Bot 24/10: contestadores automáticos, pedidos de datos, sin promesas de horario, calidad de líneas,  |
| `bot-24-10-origen-sin-explicar` | #70 | 2026-10-24 | Origen del contacto: disculpa y detención también en la regla de rechazo; no opinar sobre decisiones |
| `bot-24-10-deteccion-y-recontacto` | #71 | 2026-10-24 | Detención sin apagar al agente; recontacto revisa las respuestas recientes; hora 24 h en el chat |
| `conocimiento-v2` | #72 | 2026-10-25 | Conocimiento del bot por versiones (v1/v2) + plantillas sin botones |
| `conocimiento-colores` | #73 | 2026-10-25 | Perfiles: colores del tema, comparativa desplegable y editable; pedido de plantillas a Meta por el l |
| `plantillas-pedido-por-tandas` | #74 | 2026-10-25 | Pedido de plantillas a Meta por tandas (evita el corte de 60 s del latido) |
| `feat/chat-adjuntar-pdf` | #75 | 2026-11-01 | Chat: adjuntar PDF (documento de WhatsApp) |
| `claude/gracious-volta-rv2f3x` | #76 | 2026-11-09 | Claude/gracious volta rv2f3x |
| `asistente-charlas` | #78 | 2026-11-20 | Asistente: charlas guardadas y retomables (general y Laboratorio) |
| `claude/admiring-euler-ctf4sg` | #79 | 2026-11-20 | Redes: diagnóstico del 20/11 (contenido, rendimiento, landings y SEO) |

### 1.4 Pull requests

80 PR en total: **77 fusionados** (listados con su rama en 1.3, de #1 el 11/10 a #79 el 20/11) y **3 abiertos**.

| PR | Título | Estado | Rama → base | Creado | Resumen y qué falta |
| --- | --- | --- | --- | --- | --- |
| [#40](https://github.com/EzequielGonz/LEGAL-CRM/pull/40) | Landings: aviso por correo de los formularios a la casilla de cada rubro | Abierto, `mergeable: false` | `landings-conexion` → `main` | 20/10 | `POST /api/landing` avisa por correo (Resend) a la casilla del rubro: Jurídico, Agencia 0 km, Coberturas y Marketing. Solo aviso; sin `RESEND_API_KEY`/`LANDING_EMAIL_FROM` no envía y un fallo no bloquea la respuesta. 2 commits, 3 archivos, sin migración. **Falta:** resolver el conflicto en `src/app/api/landing/route.ts` (la rama es de hace 236 commits), pasar pruebas y, para que funcione, cargar las dos variables en Vercel (sin valores en el repo) y verificar el dominio de envío (Resend sigue «sin activar», ver cerebro/06). |
| [#77](https://github.com/EzequielGonz/LEGAL-CRM/pull/77) | docs: análisis de redes, estrategia y calendario 25/11–04/12 | Abierto, `mergeable: true` (clean) | `claude/happy-wozniak-ajfi1z` → `main` | 20/11 | Diagnóstico de 1.240 publicaciones, estrategia, calendario y herramientas de validación; hoy acumula 36 commits más de producción de redes (reels y estáticos hasta el 29/11). La PR dice 79 commits y 1.245 archivos porque cuenta lo anterior al merge #79. **Falta:** decisión de integrar (no hay conflictos), revisar que no haya datos personales de prospectos en `.claude/` y que `docs/` quede consistente con el cerebro. |
| [#80](https://github.com/EzequielGonz/LEGAL-CRM/pull/80) | Cerebro del proyecto: memoria centralizada y charlas guardadas | Abierto, clean | **`main` → `claude/happy-wozniak-ajfi1z`** (invertido) | 21/11 | El cuerpo describe el cerebro y las charlas guardadas, pero el contenido ya está en main (#78 y #79) y la dirección es al revés: lo que haría es traer main a la rama de redes. **Falta:** decidir si se cierra (es lo razonable) o se usa como vía para actualizar `happy-wozniak` con main antes de integrar #77. No integra `cerebro-chats`. |

Fusionados recientes que cambiaron el panorama: #76 (9/11, redes y piezas), #78 (20/11, charlas guardadas del asistente, migración 0634) y #79 (20/11, diagnóstico de redes y cerebro).

---

## 2. Línea de tiempo de lo integrado a main (LEGAL-CRM)

| Fecha | Qué entró |
| --- | --- |
| 7–16/9 | Primeros commits subidos por carga manual («Add files via upload»): bandeja, conversaciones y pantallas de campañas; 35 commits el 8/9 |
| 23–24/9 | Segunda tanda grande (71 commits), ediciones directas de páginas del panel |
| 4–11/10 | Importación de bases y configuración de Coberturas (4/10), flujo de GitHub Actions «Kocos pipeline» (7/10); PR #1 (etapa 1 correcciones, 11/10) |
| 16/10 | PR #2 Etapa 2 + 3 con Gemini 3.8 Flash; #3 landings → CRM; #4 estética por perfil; #5 bloque 16/10 (guía de entrega y auditoría); #6–#9 contexto, diseño premium, salud y operación |
| 17/10 | PR #10–#18: rediseño «Estudio», ingreso con escena, logos reales, botón de plantillas a revisión de Meta. 48 commits |
| 18–19/10 | PR #19–#39: reorganización, estado real de las líneas, asistente con IA general, Bandeja para Claude (#29), campañas activas en inicio, verificación del número, corrección de plantillas por archivo |
| 20–22/10 | PR #38–#48: entrega de verificación, T1 agentes responden (0504), T2–T6 chats y cierre, presupuestos programados y adjuntos |
| 24/10 | PR #49–#71: reorganización 1–3 y modo oscuro, horas AR de 24 h, el bot (insiste una vez, ahora no, recontacto, rol por campaña, 14/14 del bot 24/10). 21 commits |
| 25/10 | PR #72–#74: conocimiento del bot por versiones (0510, 0511 en cuatro partes) y pedido de plantillas por tandas |
| 1/11 | PR #75: adjuntar PDF de hasta 16 MB en el chat |
| 9–10/11 | PR #76 y bloque Wasender 2 (líneas de Meta reemplazadas por Wasender); reenvío a Instagram de piezas de VITA |
| 12–15/11 | Rediseño del panel (menú plegable, barra inferior en el celular, gráfico del período), informe del bot y corrección de la confirmación después de captar; Laboratorio del bot y asistente general (migraciones 0626, 0630–0633); 62 commits el 13/11 |
| 20/11 | PR #78 charlas guardadas (0634); PR #79 diagnóstico de redes y **cerebro/** (16 documentos y 2 Word); contexto completo en Word; aprendizaje continuo y hook de arranque. 55 commits |

Lo que **no** está en main al 21/11: la producción de redes del 20–21/11 (`happy-wozniak` y `redes-*`), los volcados de chats (`cerebro-chats`), el archivo de prospectos (`pensive-galileo`) y el aviso por correo de formularios (`landings-conexion`).

---

## 3. Las 4 landings

Las cuatro tienen exactamente la misma estructura de ramas. Todas están en GitHub como repos públicos, rama por defecto `main`, y se publican desde `main` en Vercel (cuenta aparte de la del CRM).

| Repo | main | Commits en main | Primer commit | Dominio de producción |
| --- | --- | --- | --- | --- |
| `estudio-juridico-vita-final` | `6c409eb` (21/11, «Redes: reel vita-art-rechazo-a») | 42 | 15/10 | estudiojuridicovita.com |
| `coberturas-sociales-landing` | `69869f1` (21/11, «Redes: reel cob-fallo-corte-a») | 41 | 15/10 | comparatuobrasocial.com |
| `0km-kocos-agencia` | `38f89da0` (21/11, «Redes: reel autos-retiro-chasis-a») | 38 | 15/10 | autoskocos.com |
| `agencia-kocos-mkt` | `8a51967c` (21/11, «Reels 21/11: videos y portadas en redes/2011») | 42 | 5/10 | kocosmkt.com |

### 3.1 Ramas (iguales en los 4 repos)

| Rama | Último commit | Adelante / atrás de main | Estado | Qué hace |
| --- | --- | --- | --- | --- |
| `claude/gracious-volta-rv2f3x` | 9/11, Claude, «Redes: archivos para las publicaciones programadas hasta el 2026-11-25» | 0 / 15–17 | **Integrada** | Piezas y archivos de redes alojados en `redes/` para las publicaciones programadas. Todo en main. |
| `claude/happy-wozniak-ajfi1z` | 20/11 05:45, Claude, «Medición (en curso, sin terminar): UTM y referencia en WhatsApp y formulario, robots sin /r…» | 1 / 15–17 | **Con trabajo propio** | Medición de visitas: `atribucion.ts` (captura `utm_source/medium/campaign/content/term` y `fbclid`, 30 minutos), `analitica.ts` y `medicion.tsx` (GTM, GA4, Píxel de Meta), referencia en el mensaje de WhatsApp y en el formulario (`leads.ts`, `track.ts`), robots y sitemap sin `/r`, 138 líneas de prueba (`medicion.test.ts`). 14 archivos, +618 −14. |

La rama de sesión `claude/admiring-euler-ctf4sg` que existía el 20/11 en los 4 repos ya no existe en el remoto (la `--prune` la borró).

Commit de `happy-wozniak` por repo: VITA `de62efd`, Coberturas `4ac2eb6`, Autos `c5012b0e`, Kocos `493322d3`. Mismo contenido, sin conflictos al fusionar con main en los cuatro (probado con `git merge-tree`, sin modificar nada).

Qué hay en main de cada landing, en orden: 15/10 y 21/10 conexión con el CRM y SEO (home, root, leads), 8/11 imágenes propias y dominio canónico con `www`, 9/11 rediseño premium de la home (VITA: medalla de oro 3D; Coberturas: credencial 3D; Autos: ruta 3D; Kocos: cinta del logo 3D) y pulido visual con fuentes propias, 20–21/11 solo piezas de redes (reels).

### 3.2 Pull requests

Un PR por repo, los 4 abiertos, creados el 21/11 por la propia sesión, de `claude/happy-wozniak-ajfi1z` a `main`, 1 commit, 14 archivos, +618 −14, `mergeable: true` (clean).

| Repo | PR | Título | Estado |
| --- | --- | --- | --- |
| `estudio-juridico-vita-final` | [#1](https://github.com/EzequielGonz/estudio-juridico-vita-final/pull/1) | Add attribution tracking and analytics integration | Abierto |
| `coberturas-sociales-landing` | [#1](https://github.com/EzequielGonz/coberturas-sociales-landing/pull/1) | Add visit attribution tracking and analytics integration | Abierto |
| `0km-kocos-agencia` | [#1](https://github.com/EzequielGonz/0km-kocos-agencia/pull/1) | Add attribution tracking and analytics integration | Abierto |
| `agencia-kocos-mkt` | [#1](https://github.com/EzequielGonz/agencia-kocos-mkt/pull/1) | Add attribution tracking and analytics integration (20/11) | Abierto |

Resumen del cuerpo (igual en los 4): sistema de atribución que lee UTM y referente, guarda 30 minutos, genera una referencia corta que se agrega al mensaje de WhatsApp y al formulario, e integra GTM, GA4 y Píxel de Meta. Sin claves en el texto.

**Qué falta para integrarlos:**
1. El commit se llama «en curso, sin terminar»: terminar y probar (`apps/web/tests/medicion.test.ts` es la única prueba; correr typecheck y build en cada landing).
2. Las variables con los IDs de GTM, GA4 y Píxel viven en Vercel de las landings (otra cuenta) y la responsable debe cargarlas; sin IDs la medición no emite nada.
3. Compatibilidad con el CRM: el formulario ahora manda `llegada` como nombre corto de la red (antes mandaba la URL del referente) y un objeto `atribucion` con UTM y referencia. `normalizarLead` del CRM ya usa `llegada` (`redDeLlegada`) y descarta lo demás, así que no rompe nada, pero la atribución completa y la referencia **no se guardan** en el CRM hasta que se agregue ese campo (código y probablemente migración, número libre 0635 o posterior).
4. Merge desde la web de GitHub o con permiso de la responsable; luego esperar el despliegue de Vercel (en el pasado hubo que forzarlo: commits «Publicar en producción tras reconectar Vercel con GitHub», 9/11).
5. Verificar en producción (robots/sitemap sin `/r`, que la home no cambie y que el formulario siga llegando al CRM).

---

## 4. Trabajo SIN integrar que vale la pena rescatar

Orden sugerido por valor y riesgo (la decisión de integrar es de la responsable; nada de esto se tocó).

| # | Qué | Dónde | Valor | Riesgo y condición |
| --- | --- | --- | --- | --- |
| 1 | Volcados y síntesis de chats (memoria de Claude) | LEGAL-CRM `cerebro-chats` (incluye los 15 commits de `admiring-euler` posteriores al #79) | Alto: es la memoria nueva del proyecto, 62 archivos | **Privacidad:** los repos son públicos y esta rama trae historiales crudos de chats y documentos del Project «crm». Pasar el repo a privado **antes** de integrar o subir más. Revisar que no haya claves, teléfonos ni datos de prospectos. Fácil de integrar (descendiente de main, sin conflictos). |
| 2 | Archivo de prospectos y Hoy más limpio | LEGAL-CRM `claude/pensive-galileo-d6ephy` (1 commit, 20 archivos) | Alto: pedido de la responsable del 19/11; ya diseñado y con prueba | **Migración repetida:** su `0634_archivo_de_prospectos.sql` choca con `0634_asistente_charlas.sql` que ya está en main y aplicada. Renumerar a `0635` (o la siguiente libre), comprobar en la base real si alguna de las dos columnas/disparador ya existe (es repetible, usa `if not exists`), recién después integrar. Está 73 commits atrás de main: rehacer el merge y correr typecheck, lint, pruebas y build. Toca `api/campaigns/tick/route.ts` (latido, producción compartida con Preview). El archivo automático a 30 días queda apagado hasta cargar `system_settings.archivo_automatico`. |
| 3 | Producción de redes 20–29/11 | LEGAL-CRM `claude/happy-wozniak-ajfi1z` (PR #77, 36 commits) | Alto: 260 piezas del 25 al 29/11, 10 reels del 21/11 programados | Sin conflictos. 644 archivos casi todos en `.claude/`: pesa y mezcla guiones con salidas. Revisar datos personales. Los registros de programación (`programadas.jsonl`) deben coincidir con lo realmente programado en Metricool: comprobarlo antes de integrar. |
| 4 | Reels y kits de las sesiones en paralelo | LEGAL-CRM `redes-autos-1`, `redes-autos-2`, `redes-cob-1`, `redes-mkt-1` | Medio: 3 + 2 + 2 + 3 commits con reels y kits por marca, y arreglo de fuentes del motor (salían en Times) | No están dentro de `happy-wozniak`. Integrar después del punto 3 para no duplicar el cambio de tipografías (`370cfcf` en happy y `52caabf` en `redes-autos-2`). Revisar al integrar que no se pisen los índices de reels. |
| 5 | Medición de visitas en las 4 landings | `claude/happy-wozniak-ajfi1z` en cada landing, PR #1 de cada repo | Alto para la captación: sin UTM ni píxel hoy no se sabe de dónde viene cada consulta | Commit marcado «en curso, sin terminar». Depende de IDs de GTM/GA4/Píxel que carga la responsable en la cuenta de Vercel de las landings. La atribución completa no llega al CRM hasta que el CRM la guarde (§3.2). Probar build en los 4 antes. |
| 6 | Aviso por correo de formularios | LEGAL-CRM `landings-conexion` (PR #40) | Medio: la responsable se entera de cada consulta nueva en su casilla | Conflicto en `api/landing/route.ts` (el handler cambió mucho desde el 20/10: pasó a `normalizarLead`, hash de origen y límite por hora). Requiere Resend activo, variables en Vercel y dominio de envío (todo pago o con cuenta: pedir autorización antes). Hoy el plan de Resend figura «sin activar». |
| 7 | PR #80 mal orientado | LEGAL-CRM | Bajo | Cerrarlo o recrearlo bien; si se integra tal cual solo actualiza `happy-wozniak` con main. |

### Riesgos transversales

1. **Repos públicos con documentos internos.** Verificado con la API: los 5 repos tienen `private: false`. `cerebro/` ya está en main (README, órdenes vigentes, estado verificado, pendientes). El bloque de `cerebro-chats` amplía la exposición. Es lo primero a resolver.
2. **Número de migración repetido (0634).** Ver punto 2. No hay otros números repetidos entre ramas y main: las migraciones de las ramas viejas (0200–0202, 0310–0312, 0500–0511) ya están en main bajo el mismo nombre. Solo `0511` tiene cuatro archivos con el mismo prefijo, a propósito (partes 1 a 4 del contenido v2). Los huecos de numeración (0006–0099 y 0627–0629) siguen sin explicar; 0300 nunca se aplicó. Próximo libre: **0635**.
3. **Ramas que se pisan en `src/app/api/campaigns/tick/route.ts`:** solo `pensive-galileo` la toca hoy; cualquier merge debe probarse en un entorno aislado porque la Preview comparte base y líneas con producción.
4. **Ramas atrasadas:** `happy-wozniak`, `redes-*` y `cerebro-chats` tienen 0 a 29 commits de atraso: bajo riesgo. `pensive-galileo` (73) y `landings-conexion` (236) ya no se pueden integrar sin rehacer el merge.
5. **Las ramas por PR parecen «sin integrar» en git** porque se fusionaron en modo squash: `git branch --merged` no las detecta y marca 77 ramas como pendientes. La forma confiable de saberlo es el estado del PR (todos fusionados salvo #40, #77, #80), no el comando.
6. **Limpieza (no hecha, solo informada):** unas 80 ramas ya integradas siguen vivas en el remoto. Por la regla «nada se borra», lo prudente es dejarlas o archivarlas con una etiqueta; la responsable decide.

---

## 5. Qué actualizar en `cerebro/06-tecnica-repos-y-accesos.md`

- Cantidad de ramas de LEGAL-CRM: 93 (no 88); integradas 82, con trabajo propio 9, descartables 2.
- `claude/gracious-volta-rv2f3x` y `claude/festive-goldberg-x8t43f`: ahora **integradas** (merges `891334b` y `c60400c` del 20/11).
- `asistente-charlas` (#78) y `claude/admiring-euler-ctf4sg` (#79): fusionadas el 20/11; la segunda tiene 15 commits posteriores sin integrar.
- Nuevas: `cerebro-chats`, `claude/redes-autos-1`, `claude/redes-autos-2`, `claude/redes-cob-1`, `claude/redes-mkt-1`; PR nuevos #79 y #80.
- Main de LEGAL-CRM: `66c457b` (no `36f742b`); migraciones: 84 archivos, última `0634_asistente_charlas`; el `0634` de `pensive-galileo` choca.
- Landings: la rama `claude/admiring-euler-ctf4sg` ya no existe en el remoto; los 4 PR #1 de medición están abiertos desde el 21/11.
- Agregar que los 5 repos son públicos.
