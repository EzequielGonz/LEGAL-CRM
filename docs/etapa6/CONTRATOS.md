# Etapa 6 · Contratos que comparten las fases (27/11)

Fase 0. Estos contratos los usan varias tandas a la vez. **Dueño de cada archivo = la tanda que lo implementa**; las demás solo lo consumen. Si hace falta cambiar una firma, se avisa a la integración, no se cambia en silencio.

## 1. Alcance de una tarea · `src/lib/alcance.ts` (hecho en Fase 0, puro, con prueba)

Decisión del dueño (27/11): el alcance **no se limita** a tres valores.

```ts
type Slug = 'juridico' | 'coberturas_medicas' | 'agencia_0km' | 'marketing'   // SlugPerfil de src/lib/marca.ts
type Alcance =
  | { tipo: 'rubros'; rubros: Slug[]; modo: 'juntos' | 'separados' }          // uno, varios o los 4
  | { tipo: 'panel' }                                                        // mejoras al panel entero
```

- `normalizarAlcance(crudo): Alcance | null`: ordena, quita repetidos; un solo rubro es siempre `juntos`; varios sin modo van `separados` (lo más conservador); acepta los textos viejos (`'panel'`, `'cuatro_rubros'`, un slug).
- `validarAlcance(crudo): string[]`: errores en español (vacío = válido).
- `expandirTareas(alcance): { rubro: Slug | null; rubros: Slug[]; clave: string }[]`: `juntos` = una tarea con resultado conjunto (`rubro: null`); `separados` = una por rubro; `panel` = una sin rubro.
- `etiquetaAlcance(alcance): string`: «Todo el panel», «Marketing», «Los 4 rubros, juntos (un solo resultado)», etc.
- Quien guarda tareas persiste el `Alcance` normalizado (jsonb) y, para `separados`, un `grupo_id` común. Una tarea con `rubro` ve solo ese perfil; la conjunta y la del panel las ve solo el nivel general.
- Lo usan: Oficina (selector y creación), «Ordenale» del Cerebro y las herramientas de Jarvis `oficina_pedir_tarea` / `bandeja_pedir_cambio`.
- Penal ya no es un perfil ni un alcance: se unificó con Civil dentro de `juridico`.

## 2. Preguntarle al Cerebro, filtrado por rubro · `src/lib/cerebro/conocimiento-servidor.ts` (lo implementa la tanda Cerebro)

```ts
preguntarAlCerebro(
  pregunta: string,
  max = 4,
  opciones?: { rubroId?: string | null },
): Promise<SeccionCerebro[]>
```

- Hoy (`integracion/rediseno-2211`) la firma es `(pregunta, max = 4)` y `leerAprendido` no filtra por rubro: ese es el hueco.
- Con `rubroId`: se lee lo aprendido con `.or('rubro_id.is.null,rubro_id.eq.<id>')` (lo general más lo de ese rubro). Sin `rubroId` (Cerebro general): todo, etiquetado por perfil.
- Jarvis dentro de un perfil pasa siempre `ctx.rubroId`. Prueba obligatoria: lo enseñado para Coberturas no aparece al preguntar desde Autos 0 km.

## 3. Plantillas por uso, con `'reapertura'` · `src/lib/plantillas/` (lo implementa la tanda de Plantillas)

Nombres y firmas **como existen hoy**, a los que se suma el valor nuevo:

```ts
// catalogo.ts
type TemplatePurpose = 'campana' | 'seguimiento' | 'seguimiento_3' | 'recontacto'
  | 'reagendamiento' | 'inicio_cita' | 'aviso_interno' | 'formulario'
  | 'reapertura'            // NUEVO: plantilla que se envía a mano desde el chat con la ventana de 24 h cerrada
// index.ts
templateOptions(lineId: string, purpose: TemplatePurpose): Promise<TemplateOption[]>
purposeTemplateCheck(lineId, purposes: TemplatePurpose[])
```

- Se llama `templateOptions(lineId, 'reapertura')` (el `lineId` es el id de la línea, no su nombre). `TemplateOption` ya trae `usable` y `problems`: solo se ofrecen las usables.
- Hay que sumar `'reapertura'` a `TEMPLATE_PURPOSES` (habilitado), al CHECK de `template_assignments.purpose` (migración 0660) y permitir una plantilla preferida por línea y uso.
- **Reapertura (decisión del dueño 27/11):** se envía una plantilla de Meta directo desde la ventana del chat cuando la de 24 h está cerrada. **Sin tope diario y sin límite de 72 h.** El seguimiento automático de 72 h es otra función (`'recontacto'`) y no se toca. Mantiene la confirmación de siempre; **sin código de ingreso**.
- Jurídico tiene una sola línea (la de Civil): la reapertura de un contacto de Jurídico sale por esa.
- Consumen el contrato: Chats y ficha (botón en el chat) y Jarvis (`proponer_plantilla_a_persona`, con confirmación reforzada).

## 4. Destino de la lista de captados

`/contactos?perfil=<slug>&vista=captados`, con `slug` = uno de los cuatro de `SlugPerfil` (por ejemplo `/contactos?perfil=agencia_0km&vista=captados`). Es la dirección que usan Hoy, Jarvis, el Cerebro y los menús. La lista y su lectura (`listarCaptados`) las entrega la tanda Captados; la pantalla y la pestaña las monta la integración de menús. Hasta entonces la dirección debe caer en la lista de contactos del perfil sin romper. Los captados actuales **no se reclasifican solos**: se prepara la lista para que el dueño decida uno por uno.

## 5. Gasto de Gemini con un «uso» nuevo · `src/lib/presupuesto/` y `agent_turn_logs`

Lo que existe y se **reusa** (no se crea otra tabla de gasto):

- Tope: `chequearTopeGemini({ area?, rubroId? }): Promise<DecisionPresupuesto>` (`presupuesto/servidor.ts`). Si `bloquea` es true, no se llama al modelo.
- Costo estimado: `costoEstimadoUsd({ entrada, salida, razonamiento? }, config)` (`presupuesto/reglas.ts`); config con `leerConfigPresupuesto()`.
- Registro: `registrarTurno(r: RegistroTurno)` (`experimento/servicio.ts`) escribe en `agent_turn_logs` con el campo `uso`, hoy `'conversacion' | 'analisis' | 'evaluacion_plantillas' | 'recontacto'`.

Qué se suma:

- `uso` admite además `'oficina'` y `'cerebro'`: se amplía el tipo `RegistroTurno.uso` y el CHECK de la columna con la misma técnica de la `0638` (migración 0651 de la Oficina agrega `'oficina'`; la 0657 del Cerebro agrega `'cerebro'`; cada una conserva los valores que ya estén). Para que dos tandas no se pisen, cada migración **reemplaza el CHECK incluyendo todos los valores vigentes** y es repetible.
- Orden de cada llamada: `chequearTopeGemini` → si bloquea, devolver el motivo (en la Oficina, «tope del mes alcanzado», sin llamar) → llamar → `registrarTurno({ uso: 'oficina' | 'cerebro', rubroId, ... })`.
- **Un solo tope: USD 30 por mes, compartido con los bots; aviso al 80 %.** No hay subtope por área salvo que el dueño lo pida.
- Gemini en la Oficina solo corre **por botón**. Internet del Cerebro, encendido dentro del mismo tope.
- Lo hecho por Gemini se marca «hecho por Gemini, sin repasar» y Claude lo repasa después.

## 6. Modo arena de la Oficina · `src/lib/arena.ts` (hecho en Fase 0, puro, con prueba)

Decisión del dueño (27/11): cada agente resuelve con varias respuestas que compiten y un juez elige la mejor (hasta 100 más que el agente).

```ts
type CandidatoArena = { id: string; texto?: string; puntajes: { juez: string; puntaje: number /* 0..10 */ }[]; costoUsd?: number; error?: string | null }
elegirGanador(candidatos: CandidatoArena[]): { ganador; promedio; ranking: { id; promedio }[] } | null
topeDeCandidatos(presupuestoRestanteUsd: number, costoEstimadoUsd: number, opciones?: { maximo?: number; costoJuezUsd?: number }): number
MAX_CANDIDATOS_ARENA = 101
```

- `elegirGanador`: promedio de los puntajes válidos; descarta los que fallaron o no tienen puntaje; empate por menor costo y luego orden de llegada.
- `topeDeCandidatos`: cuántos candidatos se pueden correr **sin pasar el presupuesto restante** (redondea costos para arriba y el restante para abajo; con datos dudosos devuelve 0; con uno solo no cuenta el juez). El presupuesto restante sale de `evaluarPresupuesto` / `leerGastoGemini`: `config.mensualUsd - gasto.mesUsd`.
- La Oficina corre arena solo por botón y siempre pasa por `topeDeCandidatos` antes de generar.

## 7. Notas sobre los informes (desactualizados por decisiones del 27/11)

- `critica.md`, Fase 0, propone `Alcance = 'rubro' | 'cuatro_rubros' | 'panel'` y `resolverDestino()`: reemplazado por el tipo y las funciones de arriba.
- Fase A8 del mismo informe dice «límite de 72 h» y «datos sensibles detrás de ver»: ambos quedaron rechazados por el dueño; la ficha muestra los datos como hoy más las columnas del Excel y la reapertura no tiene tope.
- Cualquier «código para enviar» de los informes de Seguridad queda descartado.
