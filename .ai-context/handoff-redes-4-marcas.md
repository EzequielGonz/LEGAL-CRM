# active-memory handoff: Redes de las 4 marcas (VITA, Coberturas, Autos, Kocos) · estrategia, reels y perfiles

**Handoff #1** · 2026-11-20 · Lineage: #1 (2026-11-20): diagnóstico de redes, landings y SEO; estrategia y calendario 25/11–04/12; kit de perfil y Google; palabras clave en bots; 44 de Kocos a borrador; 81 historias de destacadas programadas; boceto de reels VITA en curso.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: None active. If the user types /amcodeword, start every reply with the phrase they choose (default "Yes Boss!").
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** que las 4 marcas tengan presencia seria en Instagram, Facebook, landings y Google (y después TikTok y YouTube Shorts), con reels animados de calidad de agencia premium, perfiles profesionales y recorrido medido reel → perfil/landing → WhatsApp/comentario → consulta en el CRM.
- **Done looks like:** boceto de reels aprobado por la responsable → calendario 25/11–04/12 producido y programado en Metricool; destacadas armadas; medición instalada; metas al 21/12 revisadas cada lunes.
- **Why it matters / context:** en 30 días se publicaron más de 750 piezas con 0 mensajes; vistas de 1–3 s; cuentas con 0–3 seguidores.

## 2. About the user (as relevant to this work)
- La «responsable»: dueña del CRM multirubro (repo `EzequielGonz/LEGAL-CRM`, Next.js + Supabase + API de Meta, en Vercel) y de las 4 marcas.
- Usa Metricool (las 4 marcas conectadas), Claude en escritorio, Claude in Chrome y Cowork (proyecto «CRM») con los perfiles de Instagram abiertos.
- No es técnica: quiere resultados, decisiones claras y que Claude haga todo.

## 3. Style & communication
- **Language:** español rioplatense con voseo, en las respuestas, los documentos y las piezas.
- **Tone:** directo, de experto senior: marketing, diseño, community manager, estratega de redes y diseño gráfico; «agencia de marketing completa totalmente premium».
- **Reply length:** corto. La responsable pidió «sin releer todo de nuevo, sigamos todo recto».
- **Formatting:** listas cortas y tablas. Cada informe distingue especificado, implementado, probado, publicado y habilitado.
- **Working style:** usar todas las skills, plugins y conectores disponibles sin pedir permiso; trabajos grandes en agentes en paralelo; avisar en pocas palabras qué se está haciendo; subir todo con commit y push a la rama sin que lo pida.
- **Instrucciones para ejecutar:** en un solo prompt claro y resumido. Si hay archivo, que sea **Word (.docx)**.
- **Avoid:** pedir permiso para usar herramientas (solo para pagos), releer todo, respuestas largas, proponer borrar.

## 4. Hard rules (word for word)
1. «usa todas las skills plugins conectores, todo lo que tengas disponible, sin pedir permiso, solo si hay que ejecutar un pago»
2. «aun no programes publicidad paga, esperemos que pegue algun reel»
3. «el boton y la bio, dejalos asi como ya estan tranqui»
4. Nada se borra: se archiva o se pasa a borrador con motivo y forma de revertir (regla del proyecto, CLAUDE.md).
5. Ningún secreto ni dato personal real en chat, código, documentos ni piezas. No se usan casos de clientes: las historias son ilustrativas, con el rótulo «Situación ilustrativa».
6. Lo jurídico y lo de coberturas necesita revisión profesional o aprobación expresa de la responsable; sin precios, resultados ni promesas.
7. Antes de programar o reintentar en Metricool, consultar `getScheduledPosts` para no duplicar; reprogramar solo la red que falló.
8. Reels: ningún texto dice «el botón está en el perfil» (el botón no existe). Cierre: «Comentá PALABRA» o «Respondé esta historia con PALABRA».
9. Ninguna pieza repetida tal cual. Las versiones A y B cambian el gancho, la portada y el orden, y van separadas por 5 días o más.
10. Voz sintética → marca de contenido con IA (`isAiGenerated`).
11. Commits en la rama `claude/happy-wozniak-ajfi1z`, con el pie `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y `Claude-Session: https://claude.ai/code/session_01FuLgnj5dyMXat2HmKarMfG`.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Propuso reels con objetos y tipografía animada | «tienen que ser con personajes animados, un guion, una ciudad, una historia real, algo realmente de calidad y bien hecho» |
| 2 | Propuso bajar el volumen; la auditoría de Chrome sugirió 1 reel/día y una persona real | Más reels y más volumen, animados, sin caras. Se mantiene la suba por etapas con freno si no mejora la retención |
| 3 | Preguntó si borrar lo programado o publicado | No se borra nada |
| 4 | Pidió un boceto por rubro (4) | «un boceto de los reels y nuevo rediseño de posteos de un solo perfil» → VITA |
| 5 | Planeó cambiar la bio y cargar el botón de WhatsApp | Dejarlos como están; solo sumar destacadas |
| 6 | Programó las historias de destacadas para el 21/11 de 7:00 a 8:45 | «publicalas ahora mismo» → se hicieron el 20/11 de 1:28 a 1:50 |
| 7 | Dio una guía larga con varios archivos | Un solo prompt con instrucciones específicas; archivos en Word |
| 8 | Dijo que no podía asignar la tarea a Cowork | Cowork en el proyecto CRM tiene los perfiles abiertos: dejarle el prompt listo para pegar |

## 6. Decisions
| Decision | Why |
|---|---|
| Video 100 % en código y gratis, con el motor propio «al máximo» (Three.js/R3F con postprocesado, GSAP, Remotion, Theatre.js, recursos CC0; voz Piper es_AR-daniela-high, Kokoro o edge-tts es-AR) | Decisión de la responsable: pagos más adelante |
| Mini historias animadas: personaje recurrente por marca, Buenos Aires, 20–40 s, conflicto en el segundo 1 | Decisión de la responsable |
| Personajes: VITA, trabajador/a de barrio; Coberturas, monotributista o familia; Autos, pareja joven con su primer 0 km; Kocos, dueña de pyme | Biblia de personajes en preparación |
| Series: VITA «Antes de firmar» y «El minuto después»; Coberturas «La carta», «Tu recibo explicado» y «Lo que dijo la Corte»; Autos «El ticket del 0 km» y «Revisá esto al retirar»; Kocos «El celular que no para» y «Antes / después» | Análisis de videos que rinden |
| Volumen por marca: reels 3/día del 25 al 30/11 (8:30, 13:30, 20:30), 4/día del 01 al 04/12 (+17:00), 5 si el 01/12 mejora la retención; historias 4/día (9:30, 12:00, 18:30, 21:30); carrusel día por medio a las 11:00 | Estrategia aprobada |
| Del 20 al 24/11 queda lo ya programado (grupo de control) | Recomendación aceptada |
| Las 44 de Kocos en IG del 25 al 29/11 pasan a borrador | «como vos recomiendes» |
| VITA suma laboral (despidos, indemnizaciones) y penal | «si suma TODO» |
| Feed y estética del kit de perfil aprobados | «si el feed me gusta asi esta bien» |
| 12 palabras clave sumadas al final del rol de los bots, sin pisar | «suma todo palabras clave… sin pisar nada» |
| TikTok, YouTube y accesos de medición: pendientes, dentro de los 10 días | Decisión de la responsable |
| Programar todo el calendario recién cuando se apruebe el boceto | Decisión de la responsable |
| Piezas en 4K Ultra HD (2160×3840 en reels) siempre que se pueda | Pedido de la responsable, 20/11 |
| Logo y nombre de la marca en todos los reels, posteos e historias | Pedido de la responsable, 20/11 |
| Reels con planos rápidos e irreales que enganchen: caídas, golpes de cámara, escalas imposibles, efectos de impacto; personajes con mucha más definición | Pedido de la responsable, 20/11 (referencia de ritmo: videos de julianeaborna; se toman recursos, no se copia) |
| Las 81 historias de destacadas del 20/11 se publicaron todas | Verificado en Metricool el 20/11 a la 1:53 |

## 7. Changed / rejected
- Cierre «el botón está en el perfil» → «Comentá PALABRA» (el botón no existe)
- Boceto de 1 reel por rubro → boceto de un solo perfil, VITA: 1 reel + rediseño de un carrusel
- Historias de destacadas el 21/11 7:00–8:45 → el 20/11 de 1:28 a 1:50
- ❌ Publicidad paga (por ahora)
- ❌ Generadores pagos de video y voz (Veo, Kling, Runway, ElevenLabs) por ahora
- ❌ Reels con persona real o cara a cámara
- ❌ Bajar a 1 reel por día (recomendación de la auditoría de Chrome)
- ❌ Borrar lo publicado o programado
- ❌ Cambiar la bio o el botón de WhatsApp
- ❌ Windsor (el plan gratis permite 1 cuenta y hay 8)
- ❌ Reprogramar las 44 de Kocos tal cual (repeticiones del estilo viejo)

## 8. Data & facts (exact)

**Marcas**
| Marca | Metricool brandId | Instagram | Dominio | Área del bot |
|---|---|---|---|---|
| VITA (Estudio Jurídico) | 7549864 | @estudiojuridicovita | www.estudiojuridicovita.com | civil (+ penal) |
| Compara Tu Obra Social (Coberturas) | 7549939 | @comparatuobrasocial | www.comparatuobrasocial.com | coberturas_medicas |
| Automotores Kocos (Autos 0 km) | 7552104 | @autoskocos | www.autoskocos.com | agencia_0km |
| Kocos Marketing | 7242607 | @kocosmkt | www.kocosmkt.com | marketing |

- Zona horaria al programar: `America/Argentina/Buenos_Aires` (Metricool muestra Europe/Madrid).
- Supabase: proyecto `enhgkeqiqcuwafsedaza`. Enums: `message_direction` = {entrante, saliente}; `area_type` = {civil, penal, agencia_0km, coberturas_medicas, marketing}.

**Punto de partida (10–19/11)**
| Marca | Seguidores IG / FB | Reproducciones de reels IG (reels en 0) | Reproducciones de reels FB (promedio) |
|---|---|---|---|
| VITA | 2 / 1 | 349 (37 de 50) | 4.022 (80) |
| Coberturas | 0 / 1 | 50 (28 de 50) | 1.780 (36) |
| Autos | 0 / 3 | 86 (22 de 50) | 6.858 (137) |
| Kocos | 0 / 0 | 63 en 28 reels | 475 (9,5) |
- Visualización promedio 1–3 s. Posts, carruseles e historias con alcance de 0 o 1. Consultas con palabra clave desde el 10/11: 2 (VITA: «ALTA» y «ART»). Formularios de las landings: 0 desde siempre.
- Temas que más retuvieron: VITA trayecto, culpa, 24 h y ART; Coberturas monotributo, cambio de prepaga y recibo; Autos usado, plan de ahorro, votación y anticipo; Kocos consulta.
- Fallas: VITA IG 10/11 (2, «account is restricted»); Kocos IG 13/11 17:00 al 17/11 20:30 (44, desconexión). Desde el 18/11 todo publica bien. Auditoría de Chrome: las cuentas no tienen restricciones; @kocosmkt tuvo 2 contenidos eliminados en octubre.
- Landings: Lighthouse móvil 97–100, LCP 1,9–2,4 s. Sin GA4, píxel de Meta ni verificación en Search Console o Bing.

**Metas al 21/12**: visualización ≥ 6 s; reproducciones en FB ×3; menos del 20 % de reels de IG en 0; ≥ 5 envíos, guardados y comentarios cada 1.000 reproducciones; ≥ 25 seguidores nuevos por semana y marca; ≥ 20 consultas con origen redes o landing.

**Calendario 25/11–04/12**: 316 publicaciones = 136 reels + 160 historias + 20 carruseles; 34 reels por marca. Condicionados:
- Coberturas «Lo que dijo la Corte»: revisión antes del 25/11 a las 13:30.
- Autos Black Friday (27/11): visto bueno antes del 26/11.
- Aumento de prepagas (01/12): con dato oficial.
- Patentamientos de ACARA (03/12).
- TikTok y YouTube: cuando existan las cuentas.

**Palabras clave sumadas el 20/11**: civil DESPIDO, LIQUIDACION, AGUINALDO, REGISTRO, REFORMA, TELEGRAMA, CERTIFICADO, PENAL · penal PENAL · coberturas BAJA, CORTE · agencia_0km ENERO · marketing CHECKLIST. Largo de las instrucciones antes → después: agencia 5.592 → 6.108; civil 8.019 → 9.530; coberturas 5.837 → 6.504; marketing 16.308 → 16.881; penal queda en 2.056.

**Historias de destacadas** (IG, 20/11, alojadas en `/redes/perfil/` de cada landing):
| Cuenta | Destacadas (hora) |
|---|---|
| VITA (21) | Empezá acá 1:28–1:31 · Choques 1:32–1:35 · ART 1:36–1:39 · El proceso 1:40–1:42 · Mitos 1:43–1:45 · Contacto 1:46–1:48 |
| Coberturas (21) | Empezá acá 1:30–1:33 · Comparar 1:34–1:37 · Aportes 1:38–1:41 · El proceso 1:42–1:44 · Mitos 1:45–1:47 · Contacto 1:48–1:50 |
| Autos (20) | Empezá acá 1:31–1:34 · Cómo pagar 1:35–1:38 · Tu usado 1:39–1:41 · Precio final 1:42–1:44 · El retiro 1:45–1:47 · Contacto 1:48–1:50 |
| Kocos (19) | Empezá acá 1:32–1:34 · Servicios 1:35–1:37 · El proceso 1:38–1:40 · Antes/después 1:41–1:43 · Arreglos 1:44–1:47 · Contacto 1:48–1:50 |

**Herramientas pagas (solo informativo)**: Veo 3.1 Fast ~3,6 USD por video de 30 s; Kling 2.5 Turbo ~1,2 USD (plan ~9 USD/mes); Hailuo ~2,4 USD; Runway Gen-4 Turbo ~3,6 USD (plan 15 USD/mes); ElevenLabs ~0,10 USD (plan 6 USD/mes); Gemini TTS ~0,01 USD. Se pagan con tarjeta internacional: ~+51 % en pesos o ~+21 % con dólares propios.

**Google**: Perfil de Empresa elegible para VITA y Autos si atienden en persona; Coberturas, sin confirmar; Kocos no es elegible («100 % a distancia»). Google quitó Preguntas y respuestas en diciembre de 2025.

## 9. People, terms & names
- **People:** «la responsable» = dueña y quien aprueba todo.
- **Terms & nicknames:** «rubros» = las 4 marcas; «boceto» = muestra para aprobar; «feed» = grilla y perfil; «Cowork» = sesión de Claude Cowork de la responsable, proyecto «CRM»; «grupo de control» = lo programado del 20 al 24/11.
- **Names in use:** dudas de nombre: «Automotores Kocos» o «Agencia Kocos»; «Compara Tu Obra Social» o «Compara tu Obra Social».

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Diagnóstico | final | `docs/redes/DIAGNOSTICO-2026-11-20.md` + `analisis-2026-11-20/` | incluye la auditoría de Chrome |
| Estrategia | final | `docs/redes/ESTRATEGIA-2026-11-20.md` | punto 12: auditoría de Chrome; punto 13: decisiones |
| Análisis de videos | final | `docs/redes/analisis-2026-11-20/videos-que-rinden-2026-11-20.md` | |
| Calendario 25/11–04/12 | borrador | `docs/redes/calendario-2511-0412/` (CALENDARIO.md, calendario.csv, guiones/, validar.py) | falta reescribir los guiones como mini historias y sumar personajes.md |
| Kit de perfil | final y aprobado | `docs/redes/perfil-profesional/` | bios A y B sin elegir; bio y botón no se tocan |
| Historias de destacadas | programadas | Metricool, 20/11 1:28–1:50 | verificar que se publicaron |
| Tarea de Cowork | lista | `docs/redes/perfil-profesional/TAREA-COWORK-DESTACADAS.md` + `Destacadas-instagram-4-marcas.docx` | la responsable la ejecuta |
| Perfiles de Google | final, sin cargar | `docs/redes/google/` | faltan datos de la responsable |
| Palabras clave de los bots | aplicado en producción | `docs/redes/palabras-clave-bot-2026-11-20.md` | con copia previa y registro de cambios |
| 44 de Kocos | en borrador | `docs/redes/kocos-44-borrador-2026-11-20.json` | para revertir: draft=false |
| Boceto de reels de VITA (reel + carrusel) | en curso, detenido acá | código en `.claude/referencias/redes/herramientas/historias-prototipo/` (sin node_modules ni renders) | seguir desde ese código en el chat nuevo: estaba ajustando el encuadre, la luz y las poses de VITA |
| Medición (UTM, ref en WhatsApp, robots, sitemap, GA4/píxel preparados) | en curso | ramas `claude/happy-wozniak-ajfi1z` de las 4 landings + worktree del CRM | VITA probada; faltan 3; sin merge a main |
| Pull request | abierto | [EzequielGonz/LEGAL-CRM#77](https://github.com/EzequielGonz/LEGAL-CRM/pull/77) | solo documentos |
| Tarea programada «Informe de resultados» | programada | trig_018N1mFkkgyxyFcaZuaAkkYG, 20/11 10:00 BA, otra sesión | escribe en la rama claude/gracious-volta-rv2f3x |
| Recordatorio de la sesión anterior | borrado | — | el trabajo sigue solo en el chat nuevo |

## 11. Next steps
1. **Next action:** producir el boceto de VITA: 1 reel de mini historia (personaje de barrio en Buenos Aires, serie «Antes de firmar» o «El minuto después», cierre «Comentá PALABRA», 1080×1920) y el rediseño de 1 carrusel de 5 a 7 láminas con la estética aprobada. Mandárselo a la responsable.
2. Verificar con `getScheduledPosts` que las 81 historias del 20/11 (1:28–1:50) se hayan publicado; avisar las que fallaron.
3. Reescribir los guiones del 25 al 27/11 como mini historias y crear `calendario-2511-0412/personajes.md`.
4. Cuando apruebe el boceto: producir los reels del 25 al 27/11 y siguientes, y programar todo el calendario en Metricool sin duplicar.
5. Terminar la medición en las 3 landings restantes y en el CRM, y hacer el merge cuando se apruebe.
6. Revisar el 01/12 con Metricool y el CRM; decidir si se sube a 5 reels por día.

## 12. Open questions ⚠️
- Quién revisa lo jurídico y lo de coberturas, con nombre y matrícula. Urgente: el fallo de la Corte antes del 25/11 a las 13:30; lo laboral y penal antes del 26/11.
- Visto bueno a lo nuevo de Autos y Kocos, en especial Black Friday, antes del 26/11.
- Quién responde a mano los comentarios con palabra clave (el bot solo atiende WhatsApp).
- Bio variante A o B por marca: hoy no se toca, queda para después.
- Nombre de la agencia de autos: «Automotores Kocos» o «Agencia Kocos».
- Coberturas: ¿atiende en persona? (define el Perfil de Empresa de Google).
- Dirección y horarios de VITA y Autos para Google.
- Pendientes: cuentas de TikTok y YouTube; accesos a Search Console, GA4, píxel de Meta y Vercel de las landings.

## 13. Re-attach checklist
- [ ] Nada que adjuntar: todo está en el repo `EzequielGonz/LEGAL-CRM`, rama `claude/happy-wozniak-ajfi1z` ([PR #77](https://github.com/EzequielGonz/LEGAL-CRM/pull/77)). El chat nuevo tiene que abrirse sobre ese repo y esa rama.
- [ ] Opcional: el resultado de Cowork sobre las destacadas, si ya lo ejecutaste.

---
<sub>Audit: 13/13 sections · 11 rules · 8 corrections · 60+ data points · secrets removed: none found · generated by active-memory</sub>
