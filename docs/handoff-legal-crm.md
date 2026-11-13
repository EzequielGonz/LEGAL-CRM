# active-memory handoff: Panel LEGAL-CRM (Plan 4)

**Handoff #1** · 2026-11-13 · Lineage: #1 (2026-11-13): Plan 4 completo salvo subida de Next y fases siguientes del diseño

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: None active. If the user types /amcodeword, start every reply with the phrase they choose (default "Yes Boss!").
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** dejar el panel LEGAL-CRM (captación por WhatsApp para cuatro perfiles) sin mezcla entre rubros, con datos claros, listas que distinguen oportunidades reales de lo que no sirve, asistente que puede hacer todo, bot que entiende audios y diseño «bien llamativo».
- **Done looks like:** la responsable usa el panel y cada número, lista y pantalla es de su perfil, lleva a una acción y se ve moderno; nada se manda solo sin que ella lo haya encendido.
- **Why it matters / context:** el panel se usa todo el día para captar clientes; errores de clasificación hacen perder oportunidades.

## 2. About the user (as relevant to this work)
- Responsable del negocio (no programadora). Maneja cuatro perfiles: Jurídico (áreas civil y penal), Coberturas médicas, Autos 0 km, Marketing.
- Sigue la sesión desde la app de Claude; a veces desde el celular. Escribe corto y sin signos.
- Autorizó que Claude implemente directo (GitHub, base, configuración, despliegue) conservando pausas.

## 3. Style & communication
- **Language:** español rioplatense con voseo, en respuestas, interfaz, comentarios y documentos.
- **Tone:** directo, en palabras simples, sin jerga técnica.
- **Reply length:** corto. Informes finales breves.
- **Formatting:** títulos y listas cortas; tablas solo para datos. Sin identificadores internos en lo que lee la responsable.
- **Working style:** no frenar para pedir permiso en lo ya autorizado; avisar en una línea qué se está haciendo; delegar lo simple a un modelo intermedio y revisar el resultado.
- **Avoid:** releer todo desde cero, informes largos, hacer hincapié en un solo tema dejando otros pendientes.

## 4. Hard rules (word for word)
1. «que cada rubro sea separado eso es importante, cada uno con sus funciones y contenido, que no se mezcle nada con nada. acordate eso»
2. «no pises ni rehagas ni edites lo que ya esta hecho con meta.»
3. Código de acceso del panel: «usa el codigo [secret removed: re-enter it] para seguir trabajando, despues lo cambio» / «dejo el codigo hasta que termines todo». Solo por variable de entorno en la línea de comandos (`PANEL_PIN=...`); nunca en archivos, commits, documentos ni informes. Recordarle que lo cambie al terminar.
4. «Sin contacto real con prospectos, sin envíos de prueba a personas». Pruebas con efectos solo con casos viejos y restaurados, con registro en `ops_change_log`.
5. «Nada se borra: se archiva con motivo.» Migraciones después de comprobar el historial real de la base.
6. «Ningún secreto en el chat, el código, los registros ni los informes. No se descifran variables de entorno. No se piden tokens ni claves pegados en el chat.» Nunca listar variables de Vercel.
7. «Ningún dato personal real en pruebas, ejemplos, capturas ni corpus.» Las capturas del scratchpad tienen datos reales: no compartirlas ni subirlas.
8. «Cada informe distingue especificado, implementado, probado, publicado y habilitado.»
9. Bot: mejorar sumando, sin editar ni borrar lo actual.
10. «por ahora deja pendiente el aviso de captacion» (no tocarlo).
11. «mantene el modelo fable, solo para tareas muy muy pero muy sencillas y sin ningun margen de error utiliza algun otro modelo en tarea secundaria»; después: «para cosas sencillas como capturas de pantalla o algo muy simple, usa modelos más basicos, vos fable hace todo lo dificil» y «no tiene que ser el mas basico tampoco, pero que lo haga bien bien» (usar `sonnet` para lo delegado).
12. No crear tareas programadas nuevas sin confirmación. La que revisa la Bandeja sola: «por el momento no».
13. Asistente: «dale permisos a TODO […] que pueda hacer TODO»; después «si el asistente déjalo así» (propone y la persona confirma).
14. Caídos: «que pasen 3 dias y otro mensaje, si no responde en 24hs, a caidos».
15. Incidencias: solo «Amenaza legal o denuncia» y «Queja de un cliente captado». «la falla del sistema, intenta ubicar donde avisarnos. pero separado».
16. «ante la duda de un posible captado, agrega, posible captación a revisar».
17. No crear PR. Sin identificadores de modelo en commits ni código. El correo de la usuaria es privado.
18. La vista previa de Vercel comparte base y líneas con producción: ahí solo se mira.
19. Trailer de commits:
```
Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FuLgnjHoiZTXHqrkcEnPGW
```

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Se concentró mucho en audios | «no hagas tanto hincapie en los audios, termina tambien las tareas anteriores» |
| 2 | Esperaba la hora programada | «ya inicia no frenes» |
| 3 | Dejaba pasar pendientes del informe anterior | «acordate que aca hay cambios que estas dejando pasar...» (diseño y avisos de dependencias) |
| 4 | Iba a releer todo para el cierre | «no releas todo de 0 terminaste? hace corto el informe» |
| 5 | Preguntó por la extensión de Wasender | «yo me encargo» (no seguir con Wasender por código) |
| 6 | Comandos compuestos (commit + push a main juntos) fueron rechazados por permisos | Correr cada comando por separado |
| 7 | Intentó instalar `xlsx` desde un sitio fuera del registro (rechazado) | Usar solo paquetes del registro oficial |

## 6. Decisions
| Decision | Why |
|---|---|
| Limpieza de datos: «Reclasificar solo» | decisión de la responsable |
| Diseño: «Bien llamativo» | decisión de la responsable |
| Modo por defecto del panel sigue oscuro | falta que ella decida |
| Audios encendidos en los cuatro perfiles | ella pidió la función |
| Operaciones del asistente se ejecutan llamando a la misma ruta que la pantalla | no saltear validaciones |
| `xlsx` reemplazado por `read-excel-file` y `write-excel-file` | avisos sin arreglo en el registro |
| Optimizador de imágenes de Next apagado | mitiga los avisos críticos hasta subir Next |

## 7. Changed / rejected
- «Para recuperar» → eliminado; los que dejan de contestar pasan a Caídos (en Descartados).
- «Piden una persona» → «Oportunidades reales» (con puntaje de interés).
- Tabla «Captados y casos» → redirige a listas de Contactos.
- Cifras de la semana en Hoy → embudo en Resultados.
- Bloque H (Wasender con código de ocho caracteres) → no se hace; la responsable se encarga.
- ❌ Tarea programada que revise la Bandeja para Claude sola.
- ❌ Excel `.xls` viejo: ya no se importa (guardar como `.xlsx` o CSV).
- ❌ `npm audit fix` (rompió el build).

## 8. Data & facts (exact)
- Repo `/home/user/LEGAL-CRM`, GitHub `EzequielGonz/LEGAL-CRM`, rama `mejoras-1211`; se publica con `git push origin mejoras-1211:main` y después `git push origin mejoras-1211`.
- Último commit: `368ad82` (rama = main).
- Supabase: proyecto `enhgkeqiqcuwafsedaza`. Vercel: team `team_DGPKq7VRI79P0koUBcsxu1IH`, proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`, producción `legal-crm-nine.vercel.app`.
- Perfiles (slug): `juridico`, `coberturas_medicas`, `agencia_0km`, `marketing`.
- Migraciones aplicadas hoy: `0607`, `0608`, `0609`, `0610_audios_a_texto`, `0611_asistente_operaciones_y_menu`.
- Pruebas unitarias: 442 pasan. Avisos de dependencias: 2 (`next` 14.2.35 y su `postcss`); primera versión sin avisos: 15.5.28.
- Catálogo del asistente: 77 operaciones. Recorrido final: 146 pantallas sin problemas.
- Audios: hasta 5 minutos y 4 MB; tope de 20 segundos al recibir.
- Caídos: mensaje a las 72 h, espera de 24 h; motor encendido el 13/11.
- Tareas programadas: `trig_016fRYSEWByrNRk8BS3tfK8H` (domingo 15/11 9:00 ART, revisar primer seguimiento real), `trig_018N1mFkkgyxyFcaZuaAkkYG` (informe 20/11). La de las 14:51 ya corrió.
- Comandos: `npm run typecheck`, `npm run lint`, `npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts`, `npm run build`.

## 9. People, terms & names
- **People:** la responsable (dueña del negocio, única usuaria).
- **Terms & nicknames:** rubro = perfil; captado = aceptó el siguiente paso; derivado = pasado a quien lo atiende; Caídos = dejaron de contestar; Bandeja para Claude = tareas que Claude toma cuando ella dice «ok».
- **Names in use:** `docs/mejoras-1311/PLAN-4.md`, `AUDITORIA.md`, `BITACORA.md`, `docs/ESTADO.md`; `src/lib/audios/`, `src/lib/asistente/catalogo.ts`, `panel-operaciones.ts`, `src/lib/personalizacion/`, `src/app/vidrio.css`, `src/components/ui/efectos-vidrio.tsx`, `src/components/resultados/embudo-periodo.tsx`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| A. Rubros separados | final | publicado | — |
| B. Reglas (Caídos, incidencias, oportunidades reales) | final | publicado | sin caso real de reclamo |
| C. Limpieza de datos | final | lote `limpieza-1311` | cada movimiento se puede deshacer |
| D. Pantallas (Hoy, Resultados) | final | publicado | faltan etapas «conversaron», «oportunidad real», «ventas» en el embudo |
| E. Seguridad | parcial | `AUDITORIA.md` §5, §9 | falta subir Next a 15.5; tiempos del latido; aviso por falla del sistema |
| F. Diseño | fase 1 final | `vidrio.css` | faltan menú plegable, barra inferior en celular, gráfico grande, portada de perfiles |
| G. Asistente con permiso para todo | final | publicado y probado | — |
| H. Wasender con código | no se hace | — | la responsable se encarga |
| I. Audios | final, encendido | publicado | falta ver un audio real entrando |
| Hallazgos del inventario de rutas | sin arreglar | `AUDITORIA.md` §8.5 | agenda sin transacción, dos borrados reales |

## 11. Next steps
1. **Next action:** preguntar a la responsable las dos cosas de la sección 12 y, con su visto bueno, hacer la subida de Next a 15.5 en una rama aparte siguiendo `AUDITORIA.md` §9.
2. Fases siguientes del diseño (bloque F de `PLAN-4.md`).
3. Etapas que faltan en el embudo.
4. Arreglar los hallazgos de `AUDITORIA.md` §8.5.
5. Recordarle que cambie el código de acceso.

## 12. Open questions ⚠️
- ¿El panel pasa a modo claro por defecto o sigue oscuro?
- ¿Ya mandó un audio a una línea para ver la respuesta real del bot? ¿Qué contestó?

## 13. Re-attach checklist
Nothing to attach. (Este archivo está en el repositorio: `docs/handoff-legal-crm.md`.)

---
<sub>Audit: 13/13 sections · 19 rules · 7 corrections · 16 data points · secrets removed: yes · generated by active-memory</sub>
