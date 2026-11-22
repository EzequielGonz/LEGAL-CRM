# Traspaso · sesión 22/11 (sexta vuelta, cierre)

## Estado: todo publicado en `main` (último: Laboratorio, push 061479c) y desplegado en producción
Rama de trabajo `integracion/rediseno-2211` = `main`. Migración 0650 (`cerebro_conocimiento`) aplicada y verificada.

## Qué quedó hecho
- Oficina: edificio 3D con muebles, personajes, recorrido y chat por agente; selector de **departamento** al dejar tarea (Oficina y «Ordenale» del Cerebro). Modelos 3D se precargan y se cachean.
- Cerebro: barra Preguntale/Enseñale/Ordenale arriba + anillo 3D de pantallas; **solo se mueve con los botones de costado y flechas** (sin mouse/rueda).
- Hoy, Resumen, Jarvis, Chats, Resultados, «Más»: cajas en **pastel apagado con letra oscura** (tokens `--vv-*`, `--jv-*` en `src/app/vivo.css`, `jarvis-vivo.css`, `cerebro/centro.css`). Dueño: «colores simples, tranquilos, no como un juego».
- Laboratorio: tablero por perfil, «Probar en un toque», «Calidad del rol», «Mejorar con Jarvis».
- Graphify en `main` de los 5 repos (hook + skill + mapa en `cerebro/mapa-codigo/` o `mapa-codigo/`); `cache/` ignorada.
- Velocidad: `unstable_cache` 2 min en la comparación semanal; servidor <1 s en casi todo.

## Pendientes / ojo
1. **Textos encimados** (pedido del dueño): el detector `scratchpad/encimados2.js` marcó candidatos sin confirmar en: Jarvis «+53 %» vs «subió 53 %…» (es texto para lector de pantalla, probablemente falso), lista de chats en celular (nombre largo vs fecha), Configuración, Resultados en celular. Verificar con captura y corregir.
2. Lo del Laboratorio y los colores pastel **no se vieron en pantalla** (el dueño pidió ahorrar créditos). Mirar una vez.
3. La Oficina no llega al nivel del reel (modelos gratis/procedurales); mejorar requiere comprar un paquete 3D → **pedir OK** (nada se paga sin autorización).
4. Prueba intermitente: «A29/Search Console… firma alterada» (`reglas-base-captacion.test.ts`), falla a veces, no es de esta vuelta.
5. Dueño: **cambiar el código del panel (urgente, está en el historial de git)**; hacer privado el repo; OK granja de teléfonos; confirmar denominadores de anillos (Hoy / Chats «esperando»).
6. Sesiones suscriben solas esta sesión a PRs #2 de las landings: desuscribir si llegan avisos.

## Reglas permanentes
Código del panel solo como `PANEL_CODE` en env, nunca en archivos. Nada se borra. Rubros separados. Sin pagos sin OK. Sin capturas al dueño. Pocos créditos: trabajar rápido, sin revisiones largas. Preview comparte base con producción.
