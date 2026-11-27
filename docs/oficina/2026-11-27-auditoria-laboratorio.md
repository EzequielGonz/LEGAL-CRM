# Auditoría del Laboratorio de bots (27/11) · solo lectura, rama integracion/rediseno-2211 (HEAD 14e279f)

Resumen: el dueño tiene razón, y en algunos puntos el problema es más grave de lo que dice el informe anterior. Hay **cuatro simuladores distintos**. El de «Bot IA» y la «evaluación» que habilita publicar **no llaman a Gemini**: contestan siempre la misma frase fija. «Publicar un agente» y «Pedir mejora» no hacen nada en el bot real. Al revés, hay controles escondidos que **sí cambian el bot en producción sin PIN**, y algunos cambian los 4 rubros de un toque. **Ninguna prueba registra su gasto de Gemini** y casi ninguna respeta el tope de USD 30.

## 1. Mapa de pantallas y acciones

**/laboratorio, vista simple** (`src/components/laboratorio/*`)

| Pantalla o acción | Veredicto |
|---|---|
| Tablero de 4 rubros | Funciona sin impacto. «Bot activo: Versión 2» es la versión del conocimiento, no la del bot. |
| Probar en un toque (frases de ejemplo) | Funciona: solo carga el texto en el simulador. |
| Calidad del rol (revisión de 4 puntos con expresiones regulares) | Funciona sin impacto: no aplica nada. «Mejorar con Jarvis» solo abre Jarvis. |
| Cómo anda el bot | Funciona a medias: compara v1 contra v2 y la frase queda fija en «pocos datos» (hallazgo 12). |
| Roles: crear y archivar | Funciona. Solo impactan si se usan en una campaña. |
| Roles: usar en una campaña | **Bien**: cambia el bot real de esa campaña. |
| Roles: pedir mejora | **Decoración**: se guarda en una tabla que nadie lee. |
| Simulador de 1 rol o comparar 2 roles | Funciona sin impacto: Gemini real, respeta el tope, pero no guarda nada ni se puede elegir un ganador. |
| Ficha del negocio | **Bien, con riesgo**: cambia el bot real, pero pisa la ficha anterior sin historial. |
| Publicar o pausar un agente | **Decoración que dice lo contrario**: avisa que cambia el bot y no lo cambia. |
| «Qué cambió» | Funciona, pero incompleto y con mezcla de rubros. |

**/laboratorio, «Ver el detalle técnico»** (`conocimiento-bot.tsx` y `laboratorio-bot.tsx`)
- Usar v1 o v2, comparar y guardar reparto: **impacto real, sin PIN**. «Guardar reparto» no pide confirmación.
- Editar o desactivar ítems de conocimiento: **impacto real**. Puede cambiar los 4 rubros. «Desactivar» no pide confirmación.
- Versiones, prueba A/B, aplicar un rol, instrucciones del bot de base, volver atrás: **impacto real** (`agent.ts:346-380` los lee). Hoy tienen 0 filas, por eso se ven vacías.
- «Usar en los 4 perfiles» y «Crearla para los 4»: **mezcla de rubros**.
- Proveedores: decoración («preparado, sin conectar»).

**Cerebro, bloque Laboratorio** (`cerebro-vista.tsx:156` y `:415-444`)
- La cifra «4 bots en el laboratorio» está **escrita fija en el código**: decoración.
- La ventana muestra la misma vista técnica, con botones que **cambian producción**, dentro de un recuadro que parece adorno.

**Bot IA**
- Probar el bot real: **bien**, pero sin tope ni registro de gasto.
- Probar conversación y correr evaluación (dentro de lo avanzado): **rotos**, usan el generador simulado.
- Informe de mejoras: funciona, sin tope.
- Configuración que responde hoy: real.

**Biblioteca de agentes**: funciona sin impacto (0 asignaciones). **Comparar agentes**: no existe, es un redirect.

## 2. Hallazgos por gravedad

Ya vigente en `bots.md` y no lo repito: biblioteca y comparar fuera de Bot IA, `solo-avanzado`, rutas de `/api/agentes/*` sin filtrar por rubro, el agente «principal» compartido, el simulador que solo prueba `areas[0]` (Penal nunca se prueba), y 0 filas en `bot_lab_*`. Lo que sigue es nuevo.

1. **La prueba y la evaluación de Bot IA contestan una frase fija, no la IA.**
   - Dónde: `src/app/api/agentes/simulador/route.ts:31`, `evaluacion/route.ts:31` y `src/lib/agentes/servicio.ts:183`. Si no viene `proveedor`, se usa `"simulado"`, y `generadorSimulado` (`src/lib/agentes/modelo.ts:84-90`) siempre responde «Entiendo. ¿Me contás un poco más…?».
   - Cómo lo nota el dueño: todas las pruebas dicen lo mismo y la nota no tiene sentido. El texto de `agentes-etapa3.tsx:76` da a entender que con la clave cargada se usa el modelo real, y no es así.
   - Arreglo: usar Gemini real por defecto, con tope y registro de gasto, y dejar el simulado solo para las pruebas automáticas.

2. **La puerta para publicar depende de esa evaluación falsa, y además publicar no cambia el bot.**
   - Dónde: `servicio.ts:104-118`. `publicarVersion` solo escribe `agent_library.publicacion`, pero el bot real lee `agent_assignments` (`servicio.ts:99-101`, `agent.ts:319`). En el Laboratorio, `laboratorio-herramientas.tsx:174-176` pide confirmación reforzada con «puede cambiar cómo responde el bot».
   - Cómo lo nota el dueño: publica, no cambia nada, y no sabe por qué.
   - Arreglo: que «Publicar» cree la asignación activa del área (con PIN) o sacar el botón.

3. **La evaluación mezcla los 4 rubros y no termina.**
   - Dónde: `correrEvaluacion` (`servicio.ts:239-244`) corre los 16 casos de los 4 rubros, uno tras otro, para cualquier agente. La ruta no tiene `maxDuration`.
   - Cómo lo nota el dueño: el agente de Jurídico se mide con casos de Autos. Con Gemini real se cortaría por tiempo. Eso explica por qué hay 0 `eval_results`.
   - Arreglo: casos solo del rubro, en segundo plano con avance (como `prepararSimulacion`).

4. **Las pruebas no registran lo que gastan y casi todas ignoran el tope de USD 30.**
   - Dónde: solo `api/laboratorio/simular` llama a `chequearTopeGemini`. No lo hacen `api/agentes/probar-real`, `informes` (`informe-mejoras.ts:168`), la simulación masiva (`laboratorio/servicio.ts:602-716`) ni la evaluación. Ninguna escribe en `agent_turn_logs`, que es lo único que suma `gasto_gemini_resumen` (migración 0638). Los tokens quedan sueltos en `bot_lab_simulaciones` o en `simulation_runs`.
   - Cómo lo nota el dueño: el gasto que muestra Salud no incluye el Laboratorio. Si se pasa del tope, las pruebas siguen.
   - Arreglo: un helper `gastoDePrueba(rubroId, tokens)` que reuse `registrarGastoJarvis` con un uso nuevo `'laboratorio'` (ampliar el CHECK con una migración) y `chequearTopeGemini` en las 5 rutas.

5. **Cambios en producción sin PIN ni confirmación, escondidos en «Ver más» y en el Cerebro.**
   - Dónde: `conocimiento-bot.tsx:371` («Guardar reparto» directo) y `:487` («Desactivar» un ítem directo). Además, `POST /api/perfiles/conocimiento` y `aplicar_version` (`perfiles/laboratorio/route.ts:125`) no piden PIN, mientras que publicar en la biblioteca, que no hace nada, sí lo pide.
   - Cómo lo nota el dueño: puede cambiar el bot de todos por error desde el Cerebro sin darse cuenta.
   - Arreglo: confirmación reforzada en todo lo que cambia charlas reales y la misma regla de PIN que en asignaciones.

6. **Editar el conocimiento de un rubro puede cambiar los 4.**
   - Dónde: `listarItems` trae ítems con `rubro='comun'` o nulo (`conocimiento/panel.ts:75`), y `editarItem` (`:82-104`) los modifica sin aviso desde la tarjeta de un rubro.
   - Arreglo: marcar «común a los 4» en solo lectura dentro del perfil, o pedir aviso y PIN.

7. **Versiones y roles que cruzan rubros.**
   - Dónde: «Crearla para los 4 perfiles» y «Usar en los 4 perfiles» (`laboratorio-bot.tsx:238-258` y `:362`), roles generales y `copiar_rol` entre perfiles (`laboratorio/servicio.ts:406-436`).
   - Arreglo: dejar cada versión y cada rol atados a un rubro. Si hace falta en otro, se copia desde la pestaña de ese rubro.

8. **La ruta POST del Laboratorio no comprueba de qué rubro es lo que toca.**
   - Dónde: `cortar_ab`, `volver_atras`, `rol_copia_editada`, `modelo_version` y `archivar_version` (`perfiles/laboratorio/route.ts:119-170`) aceptan cualquier id sin `perfil`.
   - Arreglo: exigir `perfil` y validar que el recurso le pertenezca (403 si no).

9. **«Pedir mejora» se pierde.**
   - Dónde: se guarda en `agent_requests` con `clave:"principal"` (`vista-simple.ts:220-222`). No hay ninguna pantalla que lea esa tabla, y no llega a la Bandeja de Claude ni a la Oficina.
   - Cómo lo nota el dueño: pide y no pasa nada.
   - Arreglo: mandarlo a la Bandeja o a la Oficina con el rubro, o que Gemini proponga el texto nuevo con antes y después.

10. **«Qué cambió» no muestra lo que de verdad cambia el bot.**
    - Dónde: `api/laboratorio/historial/route.ts:67-74` solo junta roles, ficha y versiones de la biblioteca (que no responde). Faltan las instrucciones de `ai_agents`, el conocimiento, las aplicaciones y las pruebas A/B, que sí están en `ops_change_log`. Además mete la base común (`rubro_id.is.null`) y toma las últimas 60 versiones de todos los rubros antes de filtrar.
    - Arreglo: leer `ops_change_log` filtrado por rubro.

11. **La ficha se pisa sin historial.**
    - Dónde: `guardarFichaNegocio` (`ficha-negocio.ts:43-52`) hace un update directo, sin copia de la anterior, sin `ops_change_log` y sin control de quién la cambió entremedio.
    - Cómo lo nota el dueño: no hay forma de volver a la ficha de ayer. Va contra la regla «nada se borra».
    - Arreglo: guardar la versión anterior y agregar «Volver a la anterior».

12. **«Cómo anda el bot» repite siempre la misma frase.**
    - Dónde: `laboratorio-simple.tsx:190-194` compara v2 contra v1, y v1 no atiende charlas desde el 24/10. Queda fijo en «Todavía hay pocas charlas…».
    - Además: «Captados» se estima con atendidas × tasa (`vista-simple.ts:35`) y se describe como «personas que dejaron sus datos», que choca con la definición de captado del 27/11.
    - Arreglo: comparar contra los 30 días anteriores, con la cifra real de captados según la definición vigente.

13. **El simulador no es igual al bot real.**
    - Dónde: `api/laboratorio/simular` pasa `rolLaboratorio: null` y no lee `estadoLaboratorio()`, así que no aplica un rol de perfil ni la versión de prueba que sí rigen en vivo (`agent.ts:346-380`). Tampoco aplica la asignación de la biblioteca.
    - Arreglo: armar el plan de cada turno con `planDelTurno` igual que `agent.ts`.

14. **El simulador del Laboratorio se puede cortar por tiempo.**
    - Dónde: `simular/route.ts:37-41` corre las dos variantes una tras otra, cada una con hasta 4 llamadas más reparaciones, con 25 s por llamada y un máximo de 60 s por función. `probar-real` no tiene límite por llamada.
    - Cómo lo nota el dueño: ve «No se pudo completar».
    - Arreglo: correr las variantes en paralelo con `Promise.all` y fijar `timeoutMs` en `probar-real`.

15. **Mensajes de error crudos.**
    - Dónde: `probar-real/route.ts`, `ficha` y `perfiles/conocimiento` devuelven `err.message` (hasta 300 caracteres), que puede traer texto de Supabase o de Gemini.
    - Arreglo: usar `mensajeVisible` / `respuestaErrorInterno`, como ya hace la ruta del Laboratorio.

16. **«Volver a la anterior» de las instrucciones solo alterna entre dos.**
    - Dónde: `bot-base.ts:31-35` y `:94-99`. Toma la última versión distinta de la actual, así que tocarlo dos veces vuelve a donde estaba. No hay forma de ir más atrás.
    - Arreglo: lista de versiones con «Volver a esta».

17. **Carga lenta y pedidos repetidos.**
    - Al abrir /laboratorio salen unos 11 pedidos: el resumen de conocimiento de 7, 14 y 30 días (3 veces las 2 consultas pesadas, `conocimiento/panel.ts:23-24`) y 5 lecturas de historial de 4 consultas cada una.
    - `VerMas` usa `<details>` nativo y monta `ConocimientoBot` aunque esté cerrado (`ver-mas.tsx`).
    - Arreglo: un solo resumen por rubro, montar «Ver más» solo al abrirlo, y sacar «Último cambio» de una sola consulta.

18. **Textos que confunden.**
    - `herramientas-cerebro.tsx:173` dice «Se abre acá abajo» y en realidad navega a otra página.
    - `cerebro-vista.tsx:423` dice «Ningún botón envía mensajes», pero sí hay botones que cambian el bot.
    - El tablero dice «Bot activo: Versión 2», que es la versión del conocimiento, no la del bot.
    - `PublicarAgente` ofrece pausar o publicar la «base común» desde cualquier perfil.
    - Arreglo: reescribir los textos para que digan qué hace cada cosa de verdad.

19. **Accesibilidad y diseño.**
    - Bien: pestañas con `tablist` y flechas, diálogo con foco atrapado, `prefers-reduced-motion`, mensajes con `role=status/alert`.
    - Mal: el Laboratorio es siempre oscuro (`laboratorio.css:6-11`, sin modo claro), y la tarjeta técnica es blanca (`bg-white`) dentro de la escena oscura y dentro de la ventana del Cerebro. Es un salto brusco.
    - El resultado del simulador no ofrece ninguna acción después; un control que no tiene acción debería mostrarse como pendiente (regla de la skill de diseño).
    - Arreglo: retoque leve de los colores del panel y la misma superficie para todo.

20. **Los resultados del simulador no se guardan ni se pueden usar.**
    - Dónde: `laboratorio-herramientas.tsx:95-111`. No hay «Gana A / Gana B». `model_comparisons` no tiene quién escriba en ella.
    - Cómo lo nota el dueño: compara y lo pierde al recargar. Es la causa central de que lo vea como «decoración».
    - Arreglo: el flujo de la sección 3.

## 3. Cómo debería quedar (retoque leve, dentro de Bot IA de cada perfil)

Pestaña «Laboratorio» en Bot IA, solo con lo del rubro. /laboratorio y el Cerebro pasan a ser un atajo con selector de rubro, con cifras reales y sin controles de producción.

1. **Elegir qué probar.** Selector «Versión A» y «Versión B»: el bot de hoy, un rol del rubro, un borrador nuevo (tono, reglas o modelo) o una versión anterior. En Jurídico, además, tipo de consulta civil o penal.
2. **Probar.** Escribir un mensaje o tocar «Correr los casos de este rubro» (solo los del rubro). Usa Gemini real con el mismo armado que `agent.ts`, en paralelo y en segundo plano con avance. Antes de correr muestra el costo estimado, pasa por `chequearTopeGemini` y registra el gasto en `agent_turn_logs` con uso `laboratorio`.
3. **Ver el resultado.** Las dos respuestas lado a lado, más la revisión automática (validador, aceptación, no prometer) y un semáforo por caso.
4. **Elegir la ganadora.** «Gana A / Gana B / Empate» se guarda en `model_comparisons` con el rubro. Con 5 comparaciones o más se muestra «B ganó 4 de 5».
5. **Aplicar al bot real.** «Usar la ganadora en el bot de {rubro}» muestra el antes y el después, pide confirmación reforzada y PIN, y crea la asignación, el rol de perfil o la versión. Solo ese rubro: nunca «los 4».
6. **Ver el efecto.** «Cómo anda» compara los 7 días antes y después del cambio, con la definición vigente de captado.
7. **Deshacer.** Historial del rubro desde `ops_change_log` con «Volver a esta», que incluye instrucciones, ficha, conocimiento, roles y aplicaciones. Ninguna versión se borra.
8. **Pedir ayuda.** «Pedir mejora» abre una tarea en la Oficina o la Bandeja con el rubro, o Gemini propone el texto que falta y vuelve al paso 1 como borrador.

## 4. Qué revisé y qué no

**Revisé**, en código:
- `src/app/laboratorio/page.tsx` y `src/components/laboratorio/*` (completos).
- `conocimiento-bot.tsx` y `laboratorio-bot.tsx` (acciones).
- El Cerebro: `cerebro-vista.tsx` y `herramientas-cerebro.tsx`.
- Bot IA: `agentes-perfil-view.tsx`, partes de `agentes-etapa3.tsx` y `probar-bot-real.tsx`.
- `src/app/biblioteca-agentes` y `comparacion-agentes`.
- Las rutas `api/laboratorio/*`, `api/perfiles/laboratorio`, `api/perfiles/conocimiento` y `api/agentes/*` (las principales).
- `src/lib/laboratorio/{servicio,bot-base,calidad-rol,historial,en-vivo,vista-simple}`, `src/lib/agentes/{servicio,modelo,ficha-negocio}`, `src/lib/ai-agent/probar-real.ts` y `agent.ts:300-450`.
- `src/lib/presupuesto/servidor.ts` y la migración 0638.

**No revisé**:
- La base de datos: no hice ninguna consulta. Las cifras de filas vienen de `bots.md`.
- Producción y Preview: no abrí ninguna pantalla en vivo ni tomé capturas.
- `informe-mejoras` en detalle, `roles-por-base`, `piezas.tsx` y `comun.tsx`.
- Contraste medido con herramienta.
- Typecheck y pruebas: no hacían falta, no cambié código.
- Redes: fuera de alcance, como pediste.

**Herramientas usadas**:
- Skill `kocos-agentes-entrenamiento-y-evaluacion`: me dio el criterio de que guardar, probar, publicar y activar son pasos distintos, que la evaluación se hace con casos del rubro y que una prueba tiene que dejar informe con costo.
- Skill `kocos-crm-diseno-y-accesibilidad`: me dio la regla de que un control sin backend se muestra como pendiente y la lista de controles de accesibilidad.
- Bash y Read para leer el código.
- No usé agentes extra ni Supabase, porque el pedido era solo lectura y sin tocar la base.

No modifiqué ningún archivo.

---
Hecha leyendo código, sin abrir pantallas. La comprobación en navegador corre aparte (auditoría web del 27/11).
