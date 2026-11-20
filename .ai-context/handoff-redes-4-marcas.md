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
| Sin carteles en pantalla («Situación ilustrativa», «no reemplaza una consulta», «Voz generada con IA»): las aclaraciones van en el texto de la publicación y la marca de IA en Metricool | Pedido de la responsable, 20/11 («que no aparezca ningún cartel de carácter ilustrativo») |
| Volumen x2 del 25/11 al 04/12 con variantes (A/B/R) de las mismas historias, separadas por 5 días o más | Pedido de la responsable, 20/11 |
| Todo lo que se mejora en el boceto de VITA va al motor compartido: el boceto es de un solo rubro y quedan otros 3 | Recordatorio de la responsable, 20/11 |

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

---

## 14. Estado al 20/11 03:10 (sesión 2) · LEER PRIMERO al retomar

### Decisiones nuevas de la responsable (20/11, textuales o casi)
- **«Que empiece ya este nuevo cronograma»**: el cronograma doble va del **20/11 al 29/11** (no del 25/11 al 04/12).
- **«Los que ya están programados, dejá que se suban igual»**: el grupo de control 20–24/11 (10 por día y marca: reels 08:30 · 11:00 · 13:30 · 17:00 · 20:30; posts 10:00 · 19:00; carrusel 12:30; historias 09:30 · 18:30) NO se toca, aunque diga «el botón está en el perfil».
- **«No bajamos ningún ritmo, pegamos o pegamos»**: SIN freno por retención o alcance.
- **Patentamientos (ACARA): no se hacen. Aumento de prepagas: no se hace.** Esas filas se reemplazan por otros temas del mismo rubro.
- **Black Friday de Autos: sí, sin números reales.**
- **Todo lo demás aprobado y a publicar** (incluye VITA laboral/despidos y penal, y Coberturas «Lo que dijo la Corte»): aprobación expresa de la responsable del 20/11. Ya no queda nada en borrador por revisión.
- Sin carteles en pantalla («Situación ilustrativa», «no reemplaza una consulta», «Voz generada con IA»): van en el texto de la publicación; marca de IA con `isAiGenerated: true` en reels con voz sintética.
- Logo + nombre de la marca en todas las piezas. 4K cuando se pueda. Planos irreales, caídas, golpes, «dopamina a cada rato», premium y viral. Revisar ortografía de cada pieza.
- Reels de prueba (TRIAL_REEL): probar (en Kocos fallaron antes por mínimo de seguidores). Versiones nuevas reales (otro gancho, escena, voz, música, orden); no trucos para engañar la detección de duplicados.
- «Subí aún más el volumen»: historias pueden subir a 12/día/marca; reels limitados por capacidad de render (4 núcleos: ~5 min por reel 1080/30 cps; ~35 min con desenfoque de movimiento a 60 cps).

### Programado del cronograma nuevo (Metricool, IG + FB)
| Marca | Pieza | Hora 20/11 | id Metricool |
|---|---|---|---|
| VITA 7549864 | Carrusel guía «Antes de firmar» (7 láminas) | 11:20 | 435155423 |
| VITA | Reel «Antes de firmar» v3 (A) | 13:50 | 435155397 |
| Coberturas 7549939 | Reel «La carta» | 13:50 | 435157529 |
| Autos 7552104 | Reel «El ticket del 0 km» | 13:50 | 435160321 |
| Kocos 7242607 | Reel «El celular que no para» | 13:50 | 435161701 |
Las 81 historias destacadas del 20/11 (1:28–1:50) se publicaron todas (verificado 1:53).

### Archivos
- Motor de reels (compartido por las 4 marcas): `.claude/referencias/redes/herramientas/historias-prototipo/` → `historia.html`, `historia/obra.js` (transiciones barrido/zoom, golpes de zoom en palabras destacadas, líneas de velocidad, onda expansiva, marca fija arriba, grado de color), `historia/realce.js` (bokeh, haces de luz, polvo), `historia/personaje.js` (contorno, ojos con pupila, párpados, luz de borde), `historias/{vita,vita-b,cob,autos,mkt}.js`, `historia_guion.py` (guiones y voces), `historia_voz.py` (edge-tts es-AR + Piper daniela; `piper/*.onnx` se baja de HuggingFace, está en .gitignore), `sonido.py` (`vita`, `vita-b`, y `generico` para cob/autos/mkt), `render_h.sh <id> <cps> <escala> <workers>`.
  - Servidor local necesario: `python3 -m http.server 8799` en esa carpeta. edge-tts necesita el parche `_SSL_CTX` con `/root/.ccr/ca-bundle.crt` (ya está en historia_voz.py).
  - Desenfoque de movimiento: render a 60 cps y `ffmpeg -vf "tmix=frames=2:weights='1 1',fps=30"`.
  - No usar `filter: drop-shadow` en SVG de personajes: en 4K corta la imagen en bloques.
- Boceto VITA: `docs/redes/boceto-vita-2026-11-20/` (README, reel, carrusel). Carrusel: `historias-prototipo/carrusel/vita-guia.html` + `revisar-piezas.mjs`.
- Cronograma doble 20–29/11: `docs/redes/calendario-2011-2911-x2/calendario.csv` (632 filas: 272 reels, 320 historias, 40 carruseles; columnas con idea, gancho, palabra, personaje, lugar_ba, conflicto_seg1, giro_irreal, variante_de, cambios). 35 filas dicen «texto a revisar» y hay que escribirles el texto final; las de patentamientos y aumento de prepagas se reemplazan.
- Alojamiento: `apps/web/public/redes/2011/` en `main` de cada landing (estudio-juridico-vita-final → www.estudiojuridicovita.com; coberturas-sociales-landing → www.comparatuobrasocial.com; 0km-kocos-agencia → www.autoskocos.com; agencia-kocos-mkt → www.kocosmkt.com). Vercel publica en ~1 min; verificar 200 antes de programar.
- Generador de historias y carruseles con la identidad de cada marca: `docs/redes/perfil-profesional/herramientas/generar.py` + `datos.py` (temas T por marca).

### Horarios del cronograma nuevo (Buenos Aires)
- Reels 20–24/11: 08:50 · 10:30 · 13:50 · 16:30 · 19:00 · 20:50; 25/11: 08:30 · 10:30 · 13:30 · 16:30 · 19:00 · 20:30; 26–29/11: 07:30 · 09:00 · 10:30 · 12:00 · 13:30 · 17:00 · 19:00 · 20:30.
- Historias 20–24/11: 08:00 · 09:50 · 11:30 · 13:00 · 15:30 · 18:50 · 20:00 · 21:30; 25–29/11: 08:00 · 09:30 · 11:30 · 13:00 · 15:30 · 18:30 · 20:00 · 21:30.
- Carrusel: 11:20 (20–24/11) y 11:00 (25–29/11).

### Pendiente (en orden)
1. Producir y programar el resto del cronograma doble, día por día, con 24–48 h de ventaja: historias y carruseles (estáticos, rápidos) y reels (variantes de las historias base de cada marca con guiones del calendario).
2. VITA versión B («Plata rápida. ¿La agarrás?») como TRIAL_REEL, 5 días o más después de la A o como prueba para no seguidores.
3. Mejorar Autos (palabras destacadas en azul con poco contraste) y sumar planos irreales a Coberturas, Autos y Kocos.
4. Excel del cronograma por rubro y día para la responsable.

## 15. Checkpoint al 20/11 03:25 (pausa por límite de uso) · RETOMAR A LAS 05:55

- **Por qué se frenó:** se agotó el límite de uso de 5 horas (se renueva 08:50 UTC = 05:50 Buenos Aires). Los 3 agentes de fondo se cortaron. La responsable pidió pausar y retomar a las 05:55.
- **Calendario x2 (20–29/11):** TERMINADO y validado (0 errores, 22 avisos aceptables). `docs/redes/calendario-2011-2911-x2/` (calendario.csv, CALENDARIO.md, generar_x2.py, datos_x2.py, validar_x2.py). Cambios: aumento de prepagas → «¿Pagás por cosas que no usás?» (26/11 09:00 y 09:30, idea_id `plan-uso`); ACARA → «¿Contado, prendario o plan?» (28/11 08:30); Black Friday Autos 27/11 sin números; todo «aprobado por la responsable (20/11)». 34 historias tienen solo el título del tema: escribirles el texto final al producir.
- **Decisión extra:** las piezas de Coberturas sobre la actualización de la cuota («antes de pagar, compará») están aprobadas mientras no tengan números ni porcentajes.
- **Programado del cronograma nuevo (Metricool):**
  | Marca | Pieza | Hora 20/11 | id |
  |---|---|---|---|
  | VITA | Carrusel guía «Antes de firmar» | 11:20 | 435155423 |
  | VITA | Reel «Antes de firmar» A | 13:50 | 435155397 |
  | VITA | TRIAL_REEL «Plata rápida» (versión B, solo IG) | 16:30 | 435171038 |
  | Coberturas | Reel «La carta» | 13:50 | 435157529 |
  | Autos | Reel «El ticket del 0 km» | 13:50 | 435160321 |
  | Kocos | Reel «El celular que no para» | 13:50 | 435161701 |
  Nada más del cronograma nuevo está programado todavía (verificado en VITA 20–21/11; las otras marcas tenían solo el reel de las 13:50 al momento de la pausa).
- **Trabajo a medias de los agentes (ya en la rama):** `historias-prototipo/historia/irreal.js` (planos irreales reutilizables para las 4 marcas, en curso), cambios en `historias/{autos,cob,mkt,vita,comun}.js`, `historia_voz.py`, `sonido.py`; `docs/redes/calendario-2011-2911-x2/estaticos/contenido.py` (textos de historias y carruseles, en curso). Revisar que el motor siga funcionando (render de prueba de un cuadro por marca) antes de producir en serie.
- **Archivos alojados en las landings (main, /redes/2011/):** vita-firmar-a.mp4, vita-firmar-portada.jpg, vita-firmar-guia-1..7.jpg, r-vita-b-trial.mp4/.jpg (VITA); cob-carta-a.mp4/portada (Coberturas); autos-ticket-a.mp4/portada (Autos); mkt-celular-a.mp4/portada (Kocos).
- **Al retomar (en este orden):**
  1. Levantar `python3 -m http.server 8799` en historias-prototipo (el equipo se reinició una vez y se cae).
  2. Reactivar a los agentes de reels y de historias y carruseles (o lanzar nuevos con las mismas instrucciones si no se pueden reanudar), con prioridad en lo que sale primero: reels de hoy 19:00 y 20:50 si todavía hay margen, y todo el 21/11.
  3. Antes de programar cada día y marca: getScheduledPosts para no duplicar.
  4. Commit y push frecuentes en LEGAL-CRM (rama claude/happy-wozniak-ajfi1z) y en las landings (main, solo archivos estáticos).
  5. Al final, pasar a la responsable el conteo programado por rubro y día y el Excel del cronograma.
- **Corrección pendiente:** en `estaticos/contenido.py` el agente reemplazó el tema de Coberturas «fallo-corte» por «reintegros», pero la responsable SÍ aprobó «Lo que dijo la Corte». Volver a poner «fallo-corte» (texto del calendario, sin inventar datos). «aumento» → «revisar-plan» está bien.

## 16. Para retomar después de compactar (20/11 03:30)
- **Herramientas de revisión** (copiadas a `historias-prototipo/revision/`):
  - `cuadros.js <id> <dir> <t1,t2,…> [escala]` saca cuadros sueltos del reel. Hoja de contactos: `ffmpeg -pattern_type glob -i "dir/*.jpg" -vf "scale=300:-1,tile=6x2" hoja.png`.
  - `stills.js <dir> nombre=t …` saca imágenes limpias, sin `#ui`, para carruseles y portadas.
  - `render2.sh` y `render3.sh` son ejemplos de cola de render.
  - Revisión del video final: `ffmpeg -i x.mp4 -vf "fps=1,scale=170:-1,tile=12x3" hoja.png` y loudness con `-af ebur128` (objetivo −14 LUFS).
- **Flujo por pieza:**
  1. guion en `historia_guion.py` y voz con `historia_voz.py <id>`;
  2. sonido con `sonido.py <id>`;
  3. render con `render_h.sh <id> 30 1 4`;
  4. revisión de cuadros y ortografía;
  5. copia a la landing en `main`, en `/redes/2011/`;
  6. esperar respuesta 200 de la URL;
  7. `getScheduledPosts` y `createScheduledPost`.
- **Formato en Metricool:**
  - Reels: `instagramData {type: REEL, showReelOnFeed: true, isAiGenerated: true}`, `facebookData {type: REEL}` y `videoThumbnailUrl` con la portada. La hora se pasa con timezone `America/Argentina/Buenos_Aires`; Metricool la muestra en Europe/Madrid, 4 horas más.
  - Reels de prueba: `TRIAL_REEL`, solo Instagram.
- **Texto de cada reel:** gancho, 3 puntos, «Comentá «PALABRA» y te respondemos.» y al final «Situación ilustrativa. Voz generada con IA.». En VITA va además «Información general: no reemplaza una consulta.».
- **Hashtags:**
  - VITA: #accidentedetransito #seguros #abogados #buenosaires #CABA
  - Coberturas: #prepagas #obrasocial #monotributo #saludargentina #buenosaires
  - Autos: #0km #autonuevo #concesionaria #buenosaires #autos
  - Kocos: #pymes #emprendedores #ventas #marketingdigital #buenosaires
- **Correcciones de ortografía ya hechas:** «plata rápida» (no «rápido»); «¿Firmo ya o espero?» sin coma; «¡Hola! ¿Sigue disponible?» y «¡Hola, gracias por escribir!» en Kocos; sin coma en «cada uno que espera se enfría».
- **Lecciones:**
  - Con el fondo claro, la pastilla de marca y los subtítulos necesitan fondo o contorno oscuro (ya en el motor: `paint-order` con contorno de 14 px).
  - Ocultar `#nota` cuando está vacío.
  - Los números de la lista van arriba (`--numTop` 400 px).
  - El calendario no puede quedar cortado en el borde.
  - Los globos de diálogo van debajo de la pastilla de marca (y mínimo 345).

## 17. Producción en paralelo (20/11 05:55 en adelante)
- **Encargo común:** `docs/redes/produccion-2011/ENCARGO-SESION.md`. Guiones por archivo en `historias-prototipo/guiones/*.py` (los carga `historia_guion.py`). Manifiestos en `docs/redes/produccion-2011/manifiestos/`.
- **Sesiones en la nube (reels, una máquina cada una), creadas 05:58–06:00:**
  | Tramo | Rama | Sesión |
  |---|---|---|
  | Autos 20–24/11 | claude/redes-autos-1 | session_01FuLgnhicuPAirHZn4vT48c |
  | Coberturas 20–24/11 | claude/redes-cob-1 | session_01FuLgnmCT4QvBrzXiP5Q58T |
  | Kocos 20–24/11 | claude/redes-mkt-1 | session_01FuLgnkBTFKPWVo584MMXPv |
  | VITA 20–24/11 | claude/redes-vita-1 | session_01FuLgnjhRH4uHSa7R2jXJRk |
  | Autos 25–29/11 | claude/redes-autos-2 | session_01FuLgnjU46up7GgBYA7kyCL |
  | Coberturas 25–29/11 | claude/redes-cob-2 | session_01FuLgnjq3uVbavjFxLrxiuL |
  | Kocos 25–29/11 | claude/redes-mkt-2 | session_01FuLgnkyd8hEuZTeGMuA1yf |
  | VITA 25–29/11 | claude/redes-vita-2 | session_01FuLgnmHMjMRpcqJgTczdhR |
- **Agentes locales en la sesión principal:** reels de hoy 08:50 (`guiones/hoy-0850.py`), reels de hoy 10:30 (`guiones/hoy-1030.py`), historias y carruseles del 20 al 29/11 (`manifiestos/estaticos.csv`).
- **La sesión principal:** controla manifiestos y Metricool (`getScheduledPosts` por marca y día), programa lo que las sesiones dejen en `estado=alojado`, integra las ramas `claude/redes-*` en `claude/happy-wozniak-ajfi1z` y le pasa a la responsable el conteo por rubro y día.
