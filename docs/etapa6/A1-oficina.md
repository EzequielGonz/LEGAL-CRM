# Etapa 6 · Fase A1 · Oficina y Bandeja (27/11)

Rama `p27/a1` (base `p27/f0`). Sin aplicar a la base, sin publicar. Lo integra la fase de integración.

## Qué incluye (entrega)

| Pedido | Dónde |
|---|---|
| Alcance sin límites en «Nueva tarea»: un rubro, varios (juntos o por separado), los 4 juntos, los 4 por separado o «Todo el panel» | `src/components/oficina/selector-alcance.tsx`, `src/lib/oficina/alcance-ui.ts`, `POST /api/oficina` (usa `src/lib/alcance.ts` de la fase 0) |
| «Por separado» crea una tarea por rubro con `grupo_id`; «juntos» y «panel», una sola sin rubro | `filasDeAlcance` en `src/lib/bandeja-claude.ts` |
| Departamento como destino real (primera área de la ruta) | `POST /api/oficina` (`departamento`) |
| «Arrancar» honesto: sin disparador responde **503** «Falta conectar a Claude; la tarea queda en la mesa de entrada» | `src/app/api/oficina/arrancar/route.ts`, `TEXTO_SIN_CLAUDE` |
| La Oficina dice si Claude está conectado (solo sí/no) y el gasto de Gemini del mes | `GET /api/oficina` → `disparo.conectado`, `gemini` |
| «Que lo haga Gemini» por tarea, solo por botón | `POST /api/oficina/[id]` con `{accion:"gemini", candidatos}` → `ejecutarConGemini` |
| Modo arena: N respuestas con enfoques distintos + juez; N por tarea (3 por defecto, hasta 101) con `topeDeCandidatos` | `src/lib/oficina/ejecucion.ts` (`planArena`, `correrArena`) |
| Tope único de USD 30 compartido; gasto con `uso='oficina'` y `bandeja_id` | `registrarGastoOficina` en `src/lib/oficina/servidor.ts`; también el triaje |
| «Hecho por Gemini · sin repasar»; no se aprueba hasta el repaso de Claude (409 en la API y botón bloqueado) | `puedeAprobar`, `PATCH /api/oficina/[id]` |
| Cola «Para repasar», avance y resultado por tarea, detalle con candidatos, puntajes y por qué ganó | `src/components/oficina/tablero-tareas.tsx`, `tarea-oficina.tsx` |
| Gemini nunca hace código, publicaciones ni envíos | `src/lib/oficina/clases.ts` (`claseFinal`, `puedeGemini`) |
| Bandeja dentro de un perfil: solo lo de ese perfil (lo conjunto y lo del panel, solo en la Oficina) | `src/app/bandeja/page.tsx`, `GET /api/bandeja-claude?perfil=`, `PATCH /api/bandeja-claude/[id]` con `perfil` |
| Textos unificados (sin «Cowork y decí ok», sin «Pedile algo») | `src/components/bandeja/bandeja-claude.tsx`, `src/lib/bandeja-claude.ts` |
| Skill `oficina`: alcance, repaso primero, arena con subagentes de distintos modelos y juez, registro del ganador | `.claude/skills/oficina/SKILL.md`, `.claude/referencias/bandeja-claude.md` |

Constantes que el dueño puede mover (`src/lib/oficina/ejecucion.ts`): `CANDIDATOS_POR_DEFECTO = 3`, `MAX_CANDIDATOS_OFICINA = 101` (el agente más 100), `TOPE_GASTO_POR_TAREA_USD = 1` (freno para que una sola tarea no se lleve lo de los bots; no es un subtope de la Oficina).

## Qué se probó y qué no (informe)

- Probado: `npm run typecheck`, `npx tsc -p tests/tsconfig.json --noEmit`, `npm run lint` y las pruebas unitarias (nueva: `tests/unitarias/oficina-alcance-gemini.test.ts`, 21 casos: selector, destino, filas por alcance, Bandeja por perfil, clases, tope de la arena, enfoques, prompts, juez, salida sin datos personales, arena con generador simulado, bloqueo de aprobación, avance, colas, reclamo y lectura de filas viejas y nuevas).
- No probado: `npm run build` (lo corre la integración), la pantalla en un navegador, la llamada real a Gemini (las pruebas usan un generador simulado; no se gastó nada) y las migraciones contra la base (no se aplicaron: Preview y producción comparten base). Se verificó con una consulta de solo lectura que la restricción actual de `agent_turn_logs.uso` se lee bien con la técnica de la 0652.
- Falla una prueba que ya fallaba en la base `p27/f0`: `cerebro-conocimiento.test.ts` («decisiones fechadas del 22/11»), por la fecha nueva de `02-ordenes-vigentes.md`. No es de esta fase.

## Migraciones

| Archivo | Qué hace | Revertir |
|---|---|---|
| `0651_oficina_alcance.sql` | `bandeja_claude.rubro_id` opcional, `alcance` jsonb, `grupo_id`, regla «sin rubro solo con alcance» | En el encabezado; sin borrar datos |
| `0652_oficina_gemini_arena.sql` | `ejecutor`, `clase`, `repaso`, `repaso_nota`, `repaso_at`, `resultado_gemini`, `arena`, `arena_candidatos`, `costo_usd`, `intentos`, `ultimo_error`; `agent_turn_logs.bandeja_id` y uso `'oficina'` (conserva todos los valores vigentes, también `'cerebro'` si ya está) | En el encabezado |

Orden: 0651 antes que 0652. Las dos son repetibles, con RLS, sin permisos para `anon`/`authenticated` y sin borrados. **Hay que aplicarlas antes de publicar**: la lectura de la Oficina y de la Bandeja tiene respaldo sin las columnas nuevas, pero crear tareas con alcance, correr Gemini y decidir sobre una tarea las necesitan.
