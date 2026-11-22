# Informe · arreglos 22/11

Versión comprobada: rama `arreglos/captacion-y-cifras-2211`. Estados: especificado, implementado y probado con pruebas unitarias; **no publicado ni habilitado**.

## 1. Seguimiento

- **Causa del contacto 2 que no salía**: con objetivo 72 h (= tope) la franja se programa exactamente a las 72 h; el latido corre unos minutos después y `decideAtExecution` comparaba contra el tope sin tolerancia: siempre caía en «plazo vencido» → `conflicto`.
- **Arreglo**: tolerancia de ejecución de 3 h (`FOLLOWUP_EXECUTION_GRACE_HOURS`) solo para absorber esa demora. No abre domingos ni la noche (el calendario se sigue comprobando) y no genera franjas nuevas.
- **Cierre**: al pasar a `perdido` o `captado`, `setOpportunityState` cancela las tareas programadas, pendientes o en conflicto y deja el seguimiento «completado» (`alCerrarseOportunidad`).
- Pruebas: `arreglos-2211-seguimiento`, `arreglos-2211-cierre-seguimiento`.
- No se hizo: resolver las tareas ya trabadas en `conflicto` (es dato de producción) ni reprogramar envíos.

## 2. Separación por rubro

- Retenidos: `webhook_quarantine.rubro_id` (migración 0637), guardado desde el área de la línea; Revisión, Salud y Fallas filtran por perfil con una sola regla (`definiciones/retenidos.ts`). Penal: la conexión `WHATSAPP_PENAL*` solo se ofrece y se asigna en Jurídico (también se valida en la API) y se rotula «Penal». Avisos push: `rubro_id` en el dispositivo y filtro en `sendToDevices`; crisis, calidad de línea y línea caída pasan el rubro.
- Pruebas: `arreglos-2211-retenidos`, `arreglos-2211-penal-y-lineas`, `arreglos-2211-avisos`. Se actualizaron dos pruebas que afirmaban que los retenidos eran «de todo el sistema».

## 3. Evidencia de captación

- Causa del falso captado: la «segunda llave» leía el último mensaje entrante sin saber si era de una persona o de un contestador y dejaba pasar el caso «sin texto».
- Ahora el último entrante tiene que existir, tener id y texto, no ser automático y (en `captar`) ser una aceptación real. Se guarda en `capture_events.evidence_message_id` y la evidencia lleva la frase real. Prueba: `arreglos-2211-evidencia`.

## 4. Cifras

- «Esperan a una persona»: una definición (`ESPERAN_A_UNA_PERSONA`) usada por la lista, Estadísticas (se pisa el valor de la base), Perfiles y la semana. Antes había variantes con y sin perdidos, detenidos y ventana de 7 días.
- Rótulos únicos: «En seguimiento» era tres cosas; «Perdidos» dos; «Programados» pasa a «Contactos programados».
- Contactos 7.852 vs 7.921: hoy la base da 7.852 en los tres conteos; la diferencia venía de sumar grupos que se pisan. Se agregó `coherenciaDeTotales`. **No se cambió la pantalla**: sumar grupos sigue sin ser válido.
- Campaña «enviando 0/182» vs 17 fallidos: `estadoDeCampana` usa el avance real y los fallidos de 24 h con la misma cuenta que Salud. Prueba: `arreglos-2211-cifras`.

## 5 y 6. Hoy y Salud

- Hoy lista los motivos de paro (pausa general, línea sin acceso o con calidad baja, Wasender caída, campañas pausadas con su motivo traducido, agente apagado). Chip sin estilos nuevos: **los textos largos quedan cortados por el estilo existente del chip** (no se tocó).
- Salud: nuevo control de acceso real por línea de Meta (Marketing ya no puede figurar «en orden» sin acceso); Wasender con la sesión cerrada ya no dice «puede enviar 40»; retenidos con una sola definición (pendientes, sin tope de 24 h, por perfil). Pruebas: `arreglos-2211-parado`, `-salud-acceso`, `-ritmo`.

## 7. Detalle de chat (parcial)

`estadoCorto` ya no muestra «Espera a una persona» para un perdido; `atencionVisible` oculta «Requiere atención humana» en un captado sin pedido propio. Se aplicó a la ficha. El encabezado del chat sigue mostrando `contact.status`: no se pudo confirmar de dónde salía exactamente la segunda etiqueta sin ver el chat real. Prueba: `arreglos-2211-estado-chat`.

## 8. Gravedad

`gravedadDeFila`, `etiquetaDeGravedad` y `prioridadParaPerfil` listas y probadas; sin conectar. Prueba: `arreglos-2211-gravedad`.

## Verificaciones

`npm run typecheck`, `npx tsc -p tests/tsconfig.json --noEmit`, lint (eslint con la configuración del proyecto), `npm run build` y las 653 pruebas unitarias: en verde. No se corrió `tests/integracion/correr.sh` (necesita base). No se probó nada en la Preview ni en producción.

## Qué no se hizo

Aplicar la migración, resolver tareas trabadas, reasignar dispositivos de aviso ya registrados, conectar la gravedad a campañas, cambiar el encabezado del chat, backfill del perfil en retenidos antiguos.
