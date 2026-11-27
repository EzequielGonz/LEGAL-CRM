# Ritmo y horarios (vigente desde el 28/11)

## Ritmo por marca y por día

| Pieza | Por día | Redes |
|---|---|---|
| Reels | 6 | Instagram y Facebook (VITA: ver abajo) |
| Post | 1 | Instagram y Facebook |
| Carrusel | 1 | Instagram y Facebook |
| Historias | 2 | Instagram y Facebook |

- **Lo ya programado no se toca:** historias y carruseles hasta el 29/11, y la tanda base de reels.
- **De dónde salen los 6 reels de cada día:**
  - 2 de la tanda base: `atlas/planes/<marca>-<ddmm>-a|b.json` (del 28/11 al 02/12) y la tanda 2 (del 03/12 al 07/12);
  - 2 de la corrida A del día;
  - 2 de la corrida B del día.
- **VITA en Instagram, de a poco** (lo hablado con el dueño). Los reels que no entran en Instagram van solo a Facebook.

| Días | Reels de VITA en Instagram |
|---|---|
| 28 y 29/11 | 2 (08:40 y 21:10) |
| 30/11 y 01/12 | 3 (+13:40) |
| 02 y 03/12 | 4 (+11:10) |
| 04 y 05/12 | 5 (+19:40) |
| 06 y 07/12 | 6 (+10:10) |

## Grilla de horarios (Buenos Aires)

Metricool todavía no tiene datos de mejor horario para estas cuentas (al 27/11 devuelve 0 en todas las franjas). La grilla sale de lo que ya rindió, según `docs/redes/viral-2511/05-estrategia.md` y el análisis del 20/11:

- en VITA, los éxitos salieron entre 08:30 y 13:30;
- en Facebook de Autos, a las 17:00;
- en Marketing, a las 10:30 y a las 13:50;
- en Coberturas rinden la tarde y la noche;
- la competencia tiene más actividad de 19 a 21 h.

Se evitan las franjas de 16:30, 19:20 y 20:50, que en Facebook dieron 0 vistas.

| Marca | 6 reels | Post | Carrusel | 2 historias |
|---|---|---|---|---|
| VITA | 08:40 · 10:10 · 11:10 · 13:40 · 19:40 · 21:10 | 12:10 | 18:10 | 09:20 · 20:20 |
| Coberturas | 09:40 · 12:40 · 15:10 · 18:10 · 21:40 · 22:40 | 14:10 | 19:50 | 10:20 · 20:40 |
| Autos | 09:10 · 11:40 · 13:10 · 17:10 · 19:10 · 21:30 | 15:40 | 20:10 | 10:50 · 19:50 |
| Marketing | 08:10 · 10:40 · 12:20 · 13:50 · 18:40 · 21:20 | 11:40 | 17:40 | 09:50 · 20:10 |

- Los planes de la tanda base conservan su hora. Las corridas llenan los huecos libres de la grilla, del día más cercano al más lejano.
- Si una hora ya está ocupada en Metricool, se usa el hueco libre más cercano de la misma franja (±20 min).
- Domingo y lunes rinden más en el Facebook de VITA y de Autos: esos días van los guiones más fuertes.
- **Ajuste de horarios:** cuando `getBestTimeToPostByNetwork` devuelva valores distintos de 0, o haya 7 días de datos propios, la calibración (`02`) puede mover la grilla. El cambio se anota acá con la fecha y el motivo.
