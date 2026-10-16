# Etapa 3 · Documento único de implementación (13/10/2026)

Base: `main` en `fb5cdc3` (producción). Incluye **todo lo de la Etapa 2 (entrega única del 13/10) más la Etapa 3 completa**: agentes con módulos y validador de salida, simulador con herramientas simuladas, evaluación determinista con umbrales fijos, corpus revisable y exportador, trabajos de ajuste trazables, panel unificado de «Agentes IA», ejecutor de tareas del servidor con PIN, brief de marca, generador de piezas, auditoría de landings, pantalla de conexiones y correcciones del panel.

**Nada se activa.** Siguen: pausa general, agentes apagados, tarea programada inactiva, campañas pausadas, seguimiento apagado, atención 24 h apagada, publicación de contenido apagada, ejecutor de tareas apagado, ningún trabajo de ajuste en el proveedor, ninguna asignación activa. Nada se envía a prospectos, nada se publica en redes, nada se gasta.

---

## 1. Guía para el programador (5 pasos)

1. **Subí el código a una rama.** En GitHub (`EzequielGonz/LEGAL-CRM`) creá la rama `etapa3` desde `main` y subí `kocos-pipeline-etapa3-1310.zip` con «Add file → Upload files» (el flujo «Aplicar pipeline Kocos» lo descomprime). Alternativa: `git apply etapa3-1310-sobre-fb5cdc3.patch` sobre `fb5cdc3`. Comprobá antes las huellas con `SHA256SUMS.txt`. Este paquete **reemplaza** al de la Etapa 2 (`kocos-pipeline-etapa2-cierre-1310.zip`): lo contiene entero.
2. **Esperá la Preview de Vercel y confirmá que compila.** Es la primera verificación con las dependencias reales (tipos, lint y compilación). Si falla, no sigas: mandame el error. La Preview usa la base y las líneas de producción: **solo se mira**.
3. **En Supabase (SQL Editor) aplicá la carpeta `sql/` en orden**, un archivo por vez y completo, del `01` al `12`. Antes fijate qué ya existe (al 13/10 no hay ninguno aplicado). `11` es la migración `0300` de esta etapa y `12` vuelve a correr el cierre de seguridad `0207` (barrido genérico; repetirlo es lo correcto). Al final corré `13_verificar_seguridad.sql`: **las 14 cifras deben dar 0**. Reversión: `sql/revertir/LEEME.md`.
4. **Revisá la Preview solo mirando:** ingresás con el PIN; «Agentes IA» de cada perfil muestra el modelo activo, el principal y los derivados (todos apagados, sin asignación) y los botones Probar conversación / Pedir mejora / Ver resultados / Crear agente / Asignar versión; Configuración muestra «Disponibilidad para citas», «Tareas del servidor» (apagadas) y «Conexiones» (sin valores); «Contenido automático» muestra brief, generador y auditoría. Podés usar **Probar conversación** con un caso de control: es una simulación con datos ficticios y no escribe mensajes. No actives nada, no asignes, no autorices ajustes.
5. **Publicá en producción y comprobá:** pull request de `etapa3` a `main` y merge. En `legal-crm-nine.vercel.app` repetí el paso 4 y volvé a correr `13_verificar_seguridad.sql`. Sugerencia: cambiá el PIN después de publicar. Reversión del código: «Instant Rollback» en Vercel.

**El SQL va antes que el código** (paso 3 antes del 5): las pantallas nuevas leen tablas de 0300.

---

## 2. Qué incluye (por incremento)

### 3A · Agentes: contrato, módulos, contexto, asignaciones

- `src/lib/agentes/contrato.ts`: validador determinista de la salida (R07). Retiene precios, cuotas o financiación, plazos o resultados prometidos, urgencia inventada, identidad humana falsa, dictámenes y testimonios; texto vacío, largo (> 900) o varios mensajes. `normalizarSalida` descarta cualquier herramienta fuera de las permitidas. `instruccionReparacion` pide una sola corrección.
- `src/lib/agentes/modulos.ts`: instrucciones comunes del principal, seis módulos comerciales (apertura fría, escucha y memoria, descubrimiento de valor, objeciones, cierre, fronteras) y conocimiento por rubro. `detectarSenales` (precio, enojo, pide persona, audio, documento, instrucción externa…) y `seleccionarModulos` (comunes + rubro + hasta cuatro comerciales según modo y señales). Se siembran en `agent_modules` con «Sembrar» (corpus) sin pisar versiones.
- `src/lib/agentes/contexto.ts`: resumen de la oportunidad (hechos registrados, zona, captación) e instrucción del sistema armada por turno: reglas, identidad del perfil, instrucciones del principal y del derivado, límites, módulos pertinentes.
- `src/lib/agentes/modelo.ts`: informe del modelo activo (proveedor `gemini_api`, identificador desde `GEMINI_MODEL` o valor por defecto del código, clave «configurada» sin mostrarla); adaptador de Vertex **preparado y bloqueado** (sin variables → error claro; con variables → sigue sin llamar hasta el incremento 3C con la cuenta comprobada); generador simulado por guion.
- `src/lib/ai-agent/agent.ts` (integración): si hay una **asignación activa** para el área, el agente responde con el contexto de la biblioteca (principal + derivado); si no, responde exactamente como hoy. Antes de enviar, valida el texto: una reparación y, si insiste, **retiene** el mensaje y pasa a atención humana con motivo. Con la pausa general activa nada de esto sale.
- Migración `0300`: columnas de la biblioteca (`instrucciones`, `modelo_proveedor`, `modelo_identificador`, `publicacion`, `version_aprobada`, `ultima_evaluacion`, `creado_desde`), claves libres `^[a-z0-9_]{2,40}$`, tablas `agent_assignments` (única por perfil y área; `apagada/activa/pausada`), `agent_modules`, `agent_requests`.
- API: `GET /api/agentes/modelo`, `POST /api/agentes/crear` (PIN), `GET|POST /api/agentes/asignaciones` (PIN; activar exige versión publicada; el principal no se asigna; no se cruzan perfiles), `POST /api/agentes/publicar` (PIN; publicar exige evaluación sin fallos críticos y comercial ≥ 14), `GET|POST|PATCH /api/agentes/pedidos`.

### 3B · Simulador y evaluación

- `src/lib/agentes/simulador.ts`: corre una conversación con **herramientas simuladas en memoria** que aplican las mismas reglas del servidor (captar con evidencia, solo precio → persona, detener con motivo 12.2, Fase 2 no capta, ruta jurídica, ubicación). Nunca escribe mensajes, citas, captaciones ni detenciones reales. Una herramienta puede «fallar» a propósito para comprobar que no se finge éxito. Guarda la corrida en `simulation_runs` / `simulation_turns`.
- `src/lib/agentes/evaluacion.ts`: controles deterministas (captación, detención, atención, zona, ruta, cita de IA, datos registrados, texto prohibido, herramientas prohibidas, insistencia tras una baja); **fallos críticos** (baja ignorada, oferta inventada, falsa acción, captación sin aceptación, identidad falsa, contacto indebido, instrucción externa obedecida) que nunca se compensan; rúbrica comercial 0–16 y naturalidad 0–14 con heurísticas declaradas; `decidirComparacion` con umbrales fijados **antes** (comercial ≥ 14 en todos los roles, preferencia ≥ 60 %, regresión ≤ 1 punto, cero fallos críticos).
- `src/lib/agentes/casos.ts`: 16 casos de control ficticios (W01–W10 del cap. 15 y C13–C18: instrucción maliciosa, audio, documento, «mandame info», número de un tercero, apertura sin análisis), en 12 familias. Se siembran en `eval_cases`.
- API: `GET|POST /api/agentes/simulador` («Probar conversación»: caso de control o mensajes libres), `GET|POST /api/agentes/evaluacion` («Ver resultados»: corre los 16 casos, resume por rol y guarda `ultima_evaluacion`). Sin clave de proveedor se usa el generador simulado y se informa.

### 3C · Corpus, exportador y ajuste trazable

- `src/lib/agentes/corpus.ts`: partición **por familia** (70/12/18, determinista), metas 600/100/160 (150/25/40 por rubro) y piloto de 40; exportador al JSONL de ajuste supervisado de Google Cloud (`systemInstruction` + `contents` con `functionCall`/`functionResponse`, roles alternados), **solo casos aprobados**; validador estructural; hash SHA-256 del corpus; anonimización para conversaciones reales (solo con autorización).
- `src/lib/agentes/servicio.ts`: `sembrarCorpus` (16 semillas revisables, `pendiente`), `exportarCorpus`, `prepararTrabajoAjuste` (estado `preparado`, con hash y versión de instrucciones; no gasta) y `autorizarTrabajoAjuste` (PIN + límite de gasto > 0 → `autorizado`; **ninguna llamada al proveedor**). El envío real al proveedor queda para cuando la cuenta de Vertex esté configurada y la responsable autorice un trabajo concreto.
- Tablas: `training_sets`, `training_cases`, `tuning_jobs`, `model_comparisons`, `eval_cases`, `eval_results`.
- API: `GET|POST|PATCH /api/agentes/corpus` (sembrar módulos + casos + corpus; exportar; revisar), `GET|POST /api/agentes/ajuste` (preparar; autorizar con PIN).

### Panel

- **«Agentes IA» unificado** en los cuatro perfiles (`src/components/agentes/agentes-etapa3.tsx`): modelo activo, principal y derivados con publicación y última evaluación, asignaciones por área, y los botones **Probar conversación**, **Pedir mejora**, **Ver resultados**, **Crear agente**, **Asignar versión** y **Configurar** (lleva a la biblioteca). Abajo sigue la «Configuración que responde hoy» (`ai_agents`).
- **Configuración**: «Disponibilidad para citas» (movida desde Agenda), «Tareas del servidor» (citas y contenido; apagadas; cambiar pide PIN y queda en `access_events`), «Conexiones» (qué está configurado y qué falta, sin mostrar valores).
- **Agenda**: solo supervisión (hoy, próximos, pendientes); enlace a Configuración para la disponibilidad.
- **Inbox**: la cola humana muestra el **motivo** en palabras (12.2) y hay vista secundaria «Detenidos».
- **Entrada (perfiles)**: bloque «Requiere acción» por perfil (atención humana, captados sin derivar, revisión pendiente).
- **Contenido automático**: brief de marca (nombre, logo por enlace https, colores, servicios, público, zonas, tono, contacto público, afirmaciones autorizadas, frases prohibidas), **generador de piezas** (texto + imagen SVG 1080×1080 con marcador de logo si falta; calendario lunes/miércoles/viernes 11:00; vista previa sin guardar; encolar según la política del canal: lista, programada o retenida con motivo), **auditoría de landing** (solo lectura; rechaza direcciones privadas; `LANDING_HOSTS` limita a dominios propios).
- **Tick** (`/api/campaigns/tick`): ejecuta tareas de cita y publicación de contenido **solo** si `system_settings.tareas_servidor` las tiene encendidas; cada una respeta además la pausa general y su política.

### Lo que se dejó igual

Etapas 1 y 2 completas (ver `docs/etapa2/`). No se duplicó ningún módulo: la biblioteca de agentes (0205) se extiende; `ai_agents` sigue siendo lo que responde hoy hasta que exista una asignación activa.

---

## 3. Estado en cinco niveles

| Parte | Especificado | Implementado | Probado | Publicado | Habilitado |
| --- | --- | --- | --- | --- | --- |
| Etapa 2 completa (0199–0207) | sí | sí | sí, imitaciones | no | no |
| 3A contrato, módulos, contexto, asignaciones (0300) | sí | sí | sí, unitarias + integración | no | no (sin asignaciones activas) |
| 3A integración en el agente que responde | sí | sí (solo con asignación activa) | sí, unitarias del validador | no | no |
| 3B simulador y evaluación | sí | sí (proveedor simulado; Gemini real al tener clave) | sí | no | — |
| 3C corpus y exportador JSONL | sí | sí (16 semillas; metas 600/100/160 pendientes de carga) | sí | no | — |
| 3C trabajos de ajuste | sí | preparado/autorizado; **envío al proveedor no implementado** | sí (sin proveedor) | no | no |
| 3C comparación A/B/C/D | sí | decisión con umbrales; tabla `model_comparisons`; comparación ciega manual pendiente | sí (unitarias) | no | — |
| Panel: Agentes IA unificado, Configuración, Agenda, Inbox, Entrada | sí | sí | tipos con sustitutos; sin recorrido navegando | no | — |
| Contenido: brief, generador, auditoría | sí | sí (sin conexión a redes) | sí, integración | no | no (políticas apagadas) |
| Ejecutor de tareas con PIN | sí | sí | sí, integración (tick gated) | no | no (apagado) |
| Conexiones (pantalla) | sí | sí (solo lectura) | — | no | — |
| Publicación real en Instagram/Facebook | sí | no (espera cuentas y conexión) | — | no | no |

---

## 4. Pruebas (13/10, en el espacio de Claude)

- Unitarias: **116 de 116** (90 previas + 26 nuevas: `etapa3-agentes.test.ts`, `etapa3-contenido.test.ts`). Integración: **89 de 89** (80 previas + 9 nuevas: `etapa3-agentes.int.test.ts`, `etapa3-contenido.int.test.ts`) sobre PostgreSQL 16.15 + PostgREST 12.2.3 con Meta, IA y destinos simulados.
- Migraciones: desde cero con todo (0100 → 0300), `0300` aplicada dos veces sin error, revertida con `revertir_0300.sql` y vuelta a aplicar; `verificar_seguridad.sql`: **0 en los 14 controles**.
- Tipos `.ts` de `src` y pruebas: sin errores nuevos (23 preexistentes, todos por imitaciones de bibliotecas). Pantallas `.tsx`: sin errores nuevos con tipos sustitutos.
- Comprobado en pruebas: el simulador no escribe mensajes ni citas; activar exige versión publicada; publicar exige evaluación aprobada; el principal no se asigna; no se cruzan perfiles; un precio en la respuesta se repara una vez y, si insiste, se retiene y pasa a persona; herramienta fallida + confirmación = `falsa_accion`; el corpus solo exporta aprobados y el JSONL valida; autorizar un ajuste exige PIN y límite > 0 y no crea nada en el proveedor; el tick no ejecuta tareas con el ejecutor apagado y, encendido con pausa general, no envía nada; con la política apagada las piezas quedan «listas», nunca publicadas; la auditoría rechaza direcciones privadas y no sigue redirecciones a otro dominio.

**No verificado:** dependencias reales (`npm ci`, typecheck, lint, build) → paso 2 de la guía; aplicación sobre copia de la base real; recorrido navegando (teclado, teléfono); respuesta del modelo real (sin clave acá).

---

## 5. Decisiones registradas en esta entrega

1. Biblioteca unificada en «Agentes IA»; `ai_agents` responde hasta que exista una asignación activa (sin duplicar módulos).
2. Identificador del modelo: informe de solo lectura (variable `GEMINI_MODEL` o valor por defecto `gemini-3.6-flash`); el panel no lo cambia.
3. Vertex: adaptador preparado, bloqueado hasta cuenta configurada y autorización; ningún trabajo se envía desde esta entrega.
4. Ejecutor único de tareas del servidor en el tick existente, apagado por defecto, con PIN, sin agregar tareas programadas nuevas.
5. Validador de salida determinista antes de enviar (una reparación, luego retención con motivo), también en el agente actual cuando responde por asignación.
6. Umbrales de comparación fijados antes de medir: comercial ≥ 14/16 por rol, preferencia ≥ 60 %, regresión ≤ 1, cero fallos críticos.
7. Corpus: partición por familia; solo aprobados se exportan; metas 600/100/160 por carga progresiva (16 semillas ahora).
8. Contenido: el logo entra como enlace https (nunca archivo en el chat); sin logo se usa un marcador neutro y la pieza queda marcada; nada se publica sin política habilitada, cuenta conectada y ejecutor encendido.
9. Auditoría de landings: solo dominios propios (`LANDING_HOSTS`), sin direcciones privadas, sin seguir redirecciones a otro dominio.
10. Skills de terceros: no se instalan nuevas; la carpeta `.claude/skills` sigue como está.

---

## 6. Pendientes (para decidir con Vita)

- **Cuentas y activos de redes**: Instagram/Facebook por perfil (Metricool o Meta), logos por enlace, colores y nombre público; CTA real por canal. Hasta entonces, piezas «listas» y conexión «sin configurar».
- **Clave del modelo y Vertex**: `GEMINI_API_KEY` ya existe en producción (no se verificó acá); para ajuste real faltan `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_JSON` y una autorización con límite de gasto.
- **Carga del corpus**: revisar las 16 semillas y cargar los casos por familia hasta el piloto de 40 (después 600/100/160).
- **Comparación ciega** A/B/C/D: requiere evaluadores humanos y el conjunto reservado congelado.
- **Envío del trabajo de ajuste al proveedor** (incremento 3C-2): se implementa con la cuenta comprobada y un trabajo autorizado.
- **Verificación con dependencias reales** (pendiente de la Etapa 2): Preview de Vercel o un entorno aislado autorizado.
- Transcripción de audios (2.6), destinatarios de avisos, textos de fuente y localidades de AMBA: igual que en la Etapa 2.

---

## 7. Variables de entorno (nuevas; valores solo en Vercel)

| Variable | Para qué | Obligatoria |
| --- | --- | --- |
| `GEMINI_MODEL` | Identificador del modelo activo (ya existe) | no (hay valor por defecto) |
| `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_JSON` | Vertex AI (ajuste y modelo ajustado) | no (sin ellas, ajuste bloqueado) |
| `LANDING_HOSTS` | Dominios propios para auditar (separados por coma) | recomendada |
| `METRICOOL_API_TOKEN`, `METRICOOL_USER_ID` | Publicación en redes (se confirma al recibir las cuentas) | no |

Ningún valor se pega en el chat ni en el código.
