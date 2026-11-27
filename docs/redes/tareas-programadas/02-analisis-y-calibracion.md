# Análisis y calibración: antes y a mitad de cada corrida

Objetivo: subir reproducciones y seguidores. Cada corrida mide, decide y deja escrito qué cambió.

Archivo: `docs/redes/tanda-2811-0712/calibracion-<ddmm>-<hhmm>.md`, con la parte A y la parte B.

## Parte A · antes de producir (máximo 20 min)

1. **Lo publicado.** Con Metricool:
   - `getAnalyticsAvailableMetrics` una vez;
   - después, `getAnalyticsDataByMetrics` de Instagram y Facebook de las 4 marcas desde el 28/11.
   - Métricas: reproducciones, alcance, retención o tiempo medio de visualización, guardados, compartidos, comentarios, seguidores ganados y mensajes de WhatsApp si están.
   - blogId: VITA 7549864 · Coberturas 7549939 · Autos 7552104 · Marketing 7242607.
2. **Ranking.** Los 3 mejores y los 3 peores reels por marca. Para cada uno: gancho, tema, escena, duración y hora.
3. **Perfiles.** Seguidores de cada cuenta contra la corrida anterior.
4. **Competencia y tendencias**, solo con herramientas gratis:
   - `docs/redes/analisis-2026-11-20/competencia-2026-11-20.md` y `docs/redes/viral-2511/`;
   - búsqueda web (Parallel);
   - vidIQ con créditos gratis: como máximo 10 por corrida, sin comprar más.
5. **Horarios.** `getBestTimeToPostByNetwork` de cada marca. Si deja de dar 0, proponé el cambio de grilla en `01`.
6. **Decisión.** Tres líneas por marca: qué se repite (lo que rindió), qué se corta y qué se prueba en esta corrida (un solo cambio a la vez: gancho, tema, escena o duración).

## Parte B · a mitad de corrida (5 a 10 min)

Va después del primer reel de cada marca y antes del segundo.

1. De nuevo `getAnalyticsDataByMetrics`, solo de lo publicado en las últimas 24 h.
2. Si algo despegó (más del doble del promedio de su marca) o se cayó (menos de la mitad), ajustá los guiones que faltan:
   - más del formato o el gancho que despegó;
   - fuera lo que se cayó.
3. Anotá el ajuste en la parte B del mismo archivo.

## Reglas para leer los números

- Cambiar el formato pesa cientos de veces más que mover la hora: primero gancho y escena, después horario.
- Con menos de 24 h publicado, un reel no se juzga.
- Ningún tema se repite en la misma marca antes de 7 días.
- Ganchos polémicos pero verdaderos. Nunca datos inventados: si se cita una norma, va con fuente.
