# Informe del 14/11

Versión comprobada: commit `27feeaa` en `main` (despliegue de producción `dpl_fsmKVGBmyGhAxAKGyzXACCJmMKvp`, listo).

## Estado por punto

| Punto | Especificado | Implementado | Probado | Publicado | Habilitado |
|---|---|---|---|---|---|
| Ritmo humano de Wasender (plan del día, tandas, pausas, texto al azar sin repetir) | Pedido del 14/11 | Sí | 15 pruebas unitarias nuevas | Sí | Rige en cuanto haya una campaña de Wasender en curso con línea conectada. Hoy no hay ninguna línea conectada |
| Aviso de variantes casi iguales | Sí | Sí | Prueba unitaria; medido sobre las plantillas reales | Sí | Sí (pantalla de plantillas) |
| 48 plantillas nuevas para bases frías | Sí | Sí (cargadas por la API del panel) | Revisión manual de muestras; cada texto sin nombre queda bien escrito | Sí | Activas, en la rotación |
| Velocidad (sin precarga en listas, marca y menú en paralelo, `profile_metrics`) | Sí | Sí | Mismo resultado de `profile_metrics` en los cuatro perfiles (huella idéntica) | Sí | Sí |
| Bot v2: 12 fichas | Sí | Sí | Tope del bloque de conocimiento revisado | Sí | Activas en los cuatro perfiles |
| Bot v2: contestadores nuevos y stickers | Sí | Sí | 2 pruebas nuevas (12 contestadores, 11 frases de personas) | Sí | Sí |

## Verificación

- `npm run typecheck`, tipos de las pruebas y `npm run lint`: sin errores.
- Pruebas unitarias: 473 pasan (antes 456), 0 fallan.
- `npm run build`: correcto. Scripts comunes a todas las páginas: 103 kB (sin cambios).
- Producción recorrida como usuaria, solo mirando: 166 pantallas en computadora y 55 en celular, 0 con problemas. Sin errores del servidor en la última hora.

## Medidas

- `profile_metrics` (los cuatro perfiles juntos): 96 a 131 ms → 35 ms.
- Hoy (Jurídico), en el navegador: carga completa 1,9 s → 1,2 s. Los pedidos al servidor en los primeros segundos bajaron de decenas (uno por cada ficha, chat o campaña visible) a 13 (los del menú).
- Oportunidades y Chats: carga completa en 0,5 s.
- Plantillas de inicio por perfil: de 10 plantillas y 413 textos a 22 plantillas y 1.090 a 1.133 textos. Las 40 viejas tienen variantes casi iguales entre sí (el aviso nuevo las marca a todas); las 48 nuevas, ninguna.

## Qué no se probó

- Un envío real con el ritmo nuevo: no hay líneas de Wasender conectadas y no se hacen envíos de prueba a personas. El ritmo está cubierto por pruebas unitarias y se va a ver con la primera campaña en curso.
- El efecto de las fichas nuevas en conversaciones reales: se ve con las próximas respuestas (ver «Cómo saber si sirvió» en `BOT-V2-1411.md`).

## Para decidir

- Las 40 plantillas viejas funcionan, pero cada una vale como un texto solo porque sus variantes son casi iguales. Se pueden dejar (el algoritmo las reparte igual) o archivarlas con motivo para que la rotación use solo las nuevas. No se tocaron.
