# active-memory handoff: Panel LEGAL-CRM (Plan 4 y corrida de la tarde del 13/11)

**Handoff #1** · 2026-11-13 · Lineage: #1 (2026-11-13): Plan 4 completo salvo subida de Next y fases siguientes del diseño; audios, asistente con permiso para todo, seguridad y diseño fase 1 publicados.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: None active. If the user types /amcodeword, start every reply with the phrase they choose (default "Yes Boss!").
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** dejar el panel de captación LEGAL-CRM (cuatro perfiles) sin mezcla entre rubros, con datos claros, oportunidades reales bien detectadas, asistente que pueda hacer todo, bot que entienda audios, auditoría exhaustiva y diseño «bien llamativo».
- **Done looks like:** la responsable usa el panel y ve cada rubro separado, listas que sirven, estadísticas confiables y un diseño con vidrio, movimiento y profundidad; todo publicado y recorrido en producción.
- **Why it matters / context:** el panel se usa a diario para captar clientes por WhatsApp; los errores de clasificación hacían perder oportunidades reales.

## 2. About the user (as relevant to this work)
- Responsable del panel (cuenta «Vita»). No programa: quiere informes cortos, en palabras simples.
- Maneja cuatro perfiles: Jurídico (áreas civil y penal), Coberturas médicas, Autos 0 km, Marketing.
- Escribe breve, desde el celular, y a veces manda mensajes mientras Claude trabaja.

## 3. Style & communication
- **Language:** español rioplatense con voseo, en respuestas, textos de interfaz, comentarios y documentos.
- **Tone:** directo, sin relleno.
- **Reply length:** corta. Informe final breve; el detalle va en los documentos del repo.
- **Formatting:** viñetas y alguna tabla chica; sin identificadores técnicos innecesarios.
- **Working style:** no frenar para preguntar; avanzar, verificar, publicar y recorrer producción. Avisos cortos de progreso.
- **Avoid:** informes largos, releer todo desde cero, hacer hincapié en un solo tema dejando otros pendientes, mostrar claves internas.

## 4. Hard rules (word for word)
1. «que cada rubro sea separado eso es importante, cada uno con sus funciones y contenido, que no se mezcle nada con nada. acordate eso»
2. «no pises ni rehagas ni edites lo que ya esta hecho con meta.»
3. Código de acceso del panel: `[secret removed: re-enter it]`. Solo por variable de entorno en la línea de comandos (`PANEL_PIN=…`), nunca en archivos, commits ni informes. Recordarle que lo cambie al terminar.
4. «Sin contacto real con prospectos, sin envíos de prueba a personas»; pruebas con efectos solo con casos viejos y restaurados, con registro en `ops_change_log`.
5. «Nada se borra: se archiva con motivo.» Migraciones solo después de comprobar el historial real.
6. «Ningún secreto en el chat, el código, los registros ni los informes. No se descifran variables de entorno. No se piden tokens ni claves pegados en el chat.» Nunca listar variables de Vercel.
7. «Ningún dato personal real en pruebas, ejemplos, capturas ni corpus.» (Las capturas del scratchpad tienen datos reales: no compartir ni subir.)
8. «Cada informe distingue especificado, implementado, probado, publicado y habilitado.»
9. Bot: mejorar sumando, sin editar ni borrar lo actual.
10. «por ahora deja pendiente el aviso de captacion» (no tocar).
11. «mantene el modelo fable, solo para tareas muy muy pero muy sencillas y sin ningun margen de error utiliza algun otro modelo en tarea secundaria». Actualizado el 13/11: «para cosas sencillas como capturas de pantalla o algo muy simple, usa modelos más basicos […]» y «no tiene que ser el mas basico tampoco, pero que lo haga bien bien» → delegar lo simple a un agente con modelo intermedio (sonnet) y revisar el resultado.
12. No crear tareas programadas nuevas sin confirmación; la tarea que revisa la Bandeja sola: «por el momento no».
13. Asistente: «dale permisos a TODO […] que pueda hacer TODO» y después «el asistente déjalo así» (propone y la persona confirma).
14. Email de la usuaria: privado. Sin IDs de modelo en commits ni código. No crear PR.
15. Publicar: `git push origin mejoras-1211:main` y después `git push origin mejoras-1211`, en comandos separados (los comandos compuestos con push fueron rechazados).
16. Trailer de commits: `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` y `Claude-Session: https://claude.ai/code/session_01FuLgnjHoiZTXHqrkcEnPGW` (en un chat nuevo, usar el trailer que indique ese chat).

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Dejó el bloque para la hora programada | «ya inicia no frenes»: empezar ya, sin esperar |
| 2 | Dedicó mucho tiempo a los audios | «no hagas tanto hincapie en los audios, termina tambien las tareas anteriores» |
| 3 | Hacía él mismo capturas y tareas simples | Delegar lo simple a un modelo intermedio que lo haga bien; el principal hace lo difícil |
| 4 | Iba dejando para después diseño y seguridad | «acordate que aca hay cambios que estas dejando pasar...» (no saltear pendientes del informe anterior) |
| 5 | Iba a releer todo para el cierre | «no releas todo de 0 […] hace corto el informe» |
| 6 | Preguntó por la extensión de Wasender | «yo me encargo» (bloque H no se hace) |

## 6. Decisions
| Decision | Why |
|---|---|
| Caídos: a los 3 días otro mensaje; sin respuesta en 24 h, a Caídos | Decisión de la responsable |
| Incidencias: solo «amenaza legal o denuncia» y «queja de un cliente captado»; fallas del sistema aparte | Decisión de la responsable |
| Limpieza: reclasificar solo, sin mensajes ni borrados | Decisión de la responsable |
| Diseño: «Bien llamativo» | Decisión de la responsable |
| Ante la duda de un captado: marca «Posible captación a revisar» | Decisión de la responsable |
| Audios encendidos en los cuatro perfiles | Lo pidió ella |
| Asistente ejecuta por la misma ruta que la pantalla, con tres niveles de confirmación | Para no saltear validaciones |
| Modo por defecto sigue oscuro | Cambiarlo es decisión de ella (pendiente) |
| `xlsx` reemplazado por `read-excel-file` y `write-excel-file` | Avisos sin arreglo en el registro; la instalación desde otra dirección fue rechazada |

## 7. Changed / rejected
- «Para recuperar» → se retiró; los que dejan de contestar van a Caídos (Descartados).
- «Piden una persona» → «Oportunidades reales».
- Tabla vieja «Captados y casos» → redirige a las listas de Contactos.
- Corrida a las 14:51 → se empezó antes por pedido de la responsable; la tarea programada ya se disparó y quedó atendida.
- ❌ Wasender con código de ocho caracteres: el proveedor no lo ofrece por su interfaz; la responsable se encarga.
- ❌ Tarea programada que revise la Bandeja sola.
- ❌ `npm audit fix` (rompe el build) e instalar `xlsx` desde el sitio de su autor (rechazado).
- ❌ Módulo nuevo en la biblioteca de agentes para audios → se suma una nota al final de las instrucciones.

## 8. Data & facts (exact)
- Repo: `/home/user/LEGAL-CRM`, rama `mejoras-1211` = `main`. Último commit: `368ad82`.
- Producción: `legal-crm-nine.vercel.app`. Vercel: equipo `team_DGPKq7VRI79P0koUBcsxu1IH`, proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`. Supabase: `enhgkeqiqcuwafsedaza`.
- Rubros: jurídico `11111111…`, agencia_0km `22222222…`, coberturas_medicas `33333333…`, marketing `44444444…`.
- Migraciones de la tarde: `0610_audios_a_texto`, `0611_asistente_operaciones_y_menu`. Anteriores del día: `0607`, `0608`, `0609`.
- `ops_change_log`: 217, 218, 219 (limpieza), 230 (prueba de audios).
- Pruebas: 442 pasan. Recorrido de producción: 106 pantallas en escritorio y 40 en celular, 0 problemas.
- Catálogo del asistente: 77 operaciones; 35 rutas fuera a propósito.
- Audios: hasta 5 minutos y 4 MB; tope 20 s al recibir, 45 s desde el botón. 15 audios históricos; 3 transcriptos de prueba (6, 15 y 15 s).
- Avisos de dependencias: de 4 a 2 (`next` 14.2.35 y su `postcss`); primera versión sin avisos: Next 15.5.28.
- Limpieza (mañana): esperando persona 94 → 18; oportunidades reales 7; 265 a Caídos; incidencias 55 → 0.
- Tareas programadas vigentes: `trig_016fRYSEWByrNRk8BS3tfK8H` (domingo 15/11, 9:00 ART, primer seguimiento real) y `trig_018N1mFkkgyxyFcaZuaAkkYG` (informe del 20/11).

## 9. People, terms & names
- **People:** la responsable (cuenta «Vita»): dueña del panel y de todas las decisiones.
- **Terms & nicknames:** «rubro» = perfil; «Caídos» = dejaron de contestar; «Oportunidades reales» = esperan a una persona con interés; «Para cerrar» = captados sin derivar; «Bandeja para Claude» = pedidos de código; «llave» = interruptor en `system_settings`.
- **Names in use:** `src/lib/audios/{reglas,transcribir}.ts`; `src/lib/asistente/{catalogo,catalogo-tipos,panel-operaciones}.ts`; `src/lib/personalizacion/{menu,servidor}.ts`; `src/app/vidrio.css`; `src/components/ui/efectos-vidrio.tsx`; `src/components/resultados/embudo-periodo.tsx`; `src/components/ui/dialogo-confirmar.tsx`; llaves `audios_a_texto`, `caidos_automaticos`; tipos de propuesta `operacion_panel`, `personalizar_menu`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| A. Mezcla entre perfiles | final | publicado | — |
| B. Reglas nuevas | final | publicado | Reclamo y «posible captación» sin caso real |
| C. Limpieza | final | lote `limpieza-1311` | Cada movimiento se puede deshacer |
| D. Pantallas | final | publicado | Faltan 3 etapas en el embudo |
| E. Auditoría y seguridad | avanzado | `docs/mejoras-1311/AUDITORIA.md` | Falta subir Next (§9), latido, aviso por falla |
| F. Diseño | fase 1 final | `vidrio.css` | Faltan menú plegable, barra inferior, gráfico, portada |
| G. Asistente | final | publicado y probado | — |
| H. Wasender con código | no se hace | — | La responsable se encarga |
| I. Audios | final, encendido | publicado | Falta ver un audio real entrando |
| Documentos | al día | `docs/mejoras-1311/PLAN-4.md`, `AUDITORIA.md`, `BITACORA.md`, `docs/ESTADO.md` | Fuente de verdad del detalle |

## 11. Next steps
1. **Next action:** leer `docs/mejoras-1311/PLAN-4.md` (tabla «Estado» y línea «Lo que sigue») y hacer la subida de Next a 15.5 según `AUDITORIA.md` §9, en una rama aparte, mirando en vista previa antes de publicar.
2. Fases siguientes del diseño (menú plegable, barra inferior en el celular, gráfico grande, portada de perfiles).
3. Etapas que faltan en el embudo: «conversaron», «oportunidad real», «ventas».
4. Hallazgos del inventario de rutas (`AUDITORIA.md` §8.5).
5. Tiempos del latido y aviso a dispositivos por una falla del sistema.

## 12. Open questions ⚠️
- ¿El panel pasa a modo claro por defecto o sigue oscuro? (hoy: oscuro)
- ¿Llegó bien la respuesta del bot al mandar un audio real a una línea? (la responsable tiene que probarlo)
- ¿Ya cambió el código de acceso? Si lo cambió, hay que pedírselo de nuevo por la vía segura para recorrer producción.

## 13. Re-attach checklist
Nothing to attach. (Todo está en el repositorio; este archivo no está en un commit.)

---
<sub>Audit: 13/13 sections · 16 rules · 6 corrections · 22 data points · secrets removed: yes · generated by active-memory</sub>
