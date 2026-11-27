---
description: Traspaso de la sesión del panel del 27/11 (análisis completo, dossier de diseño, recorrido como dueño y plan). En paralelo corre la sesión de redes: no pisarla.
actualizado: 2026-11-27
---

# Traspaso · sesión del panel · 27/11

## Qué pidió el dueño (27/11)
Lista completa en `02-ordenes-vigentes.md` § «Órdenes del 27/11» y «Respuestas del dueño, 27/11». En corto: Oficina con alcance «todo el panel / 4 rubros»; Gemini ejecuta la Oficina si no hay Claude y Claude repasa; Jarvis sin límites de función (sin cambiar código); un solo asistente (Jarvis + Bandeja); Cerebro funcional y que aprenda solo; bots con rubros separados y Biblioteca/Comparar dentro de «Bot IA»; plantilla de Meta a un contacto para reabrir; ficha con todos los datos del Excel; plantillas con asignación manual; Penal unificado con Civil (queda la línea de Civil); captado solo según la regla ya escrita en chats y entrenamiento; «Hoy» compacto; rediseño premium con **muestra primero**; entrada 3D en vez de la lámpara; velocidad. Además: recorrer el panel como dueño y proponer reorganización y flujo de trabajo.

## Hecho
- Graphify en el cerebro y la memoria (`cerebro/mapa-cerebro/`), publicado.
- Órdenes y respuestas del 27/11 en `02`; resumen en Cognee.
- `.gitattributes`: la bitácora se une sola entre ramas (`merge=union`).
- Recorrido de producción (solo mirar): 70 pantallas. «Hoy» y «Salud» tardan ~12 s; el resto ~2 s.

## En curso al cerrar (resultados fuera del repo, en el scratchpad de la sesión)
- Análisis del panel con 13 subagentes (flujo `analisis-panel-2711`).
- Dossier de diseño con 9 subagentes (flujo `dossier-diseno-2711`) → va a `cerebro/23-dossier-de-diseno.md`.
- Recorrido de uso perfil por perfil y pestaña por pestaña (~160 pantallas) → propuesta de reorganización.
- Con todo eso se escribe `cerebro/22-plan-panel-2711.md` (plan por pasos, tandas que no se pisan).

## Reglas de esta vuelta
- La sesión de redes trabaja en `claude/brave-hawking-nzsr60`: no tocar `docs/redes/`, `.claude/referencias/redes/` ni sus filas de `02`/`00`. No regenerar `cerebro/mapa-cerebro/` hasta que esa rama se integre (ella también lo regeneró).
- Todavía **no se tocó código del panel**. Nada de lo pedido está implementado.
- El código de ingreso sigue sin cambiar (urgente, del dueño). No se escribe en archivos.
- Producción: solo mirar; no apretar botones que guarden o envíen.
