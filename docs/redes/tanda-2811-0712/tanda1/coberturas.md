# Tanda 1 · Compara Tu Obra Social: 10 planes de reel (28/11 al 02/12)

**Estado:** especificado y validado. No se generó la voz, no se renderizó, no se programó en Metricool y no se publicó nada.
**Planes:** `.claude/referencias/redes/herramientas/historias-prototipo/atlas/planes/coberturas-<ddmm>-<a|b>.json`. Siguen `CONTRATO.md`, con una excepción (ver «Decisiones»).
**Estilo:** plastilina en stop-motion sobre la mesa menta. Personajes: Lucía (29, monotributista, Caballito) y Gabriel (44, en relación de dependencia, Villa Urquiza).

| Plan | Publica | Base | Tema | Gancho (≤ 8 palabras) | Palabra | Voz | Golpes | Momento «wow» | Personaje |
|---|---|---|---|---|---|---|---|---|---|
| coberturas-2811-a | 28/11 12:40 | coberturas-2711-1 | Preexistencia | Una enfermedad previa no te deja afuera. | PLAN | 62 | 8 | «Falso»: el sello «RECHAZADA» cae sobre la carpeta y rebota sin marcarla (rebote) | Lucía |
| coberturas-2811-b | 28/11 18:10 | coberturas-2711-2 | Aporte del recibo | Ese descuento del recibo no es plata perdida. | APORTES | 64 | 8 | «Error»: el recibo crece hasta ocupar la cocina y la línea del aporte se ilumina (lupa) | Gabriel |
| coberturas-2911-a | 29/11 12:40 | coberturas-2811-1 | Despido y cobertura | Te despiden y tu obra social sigue. | TRABAJO | 63 | 8 | «No»: la credencial apagada gira en el aire como una moneda y cae encendida (giro) | Gabriel |
| coberturas-2911-b | 29/11 22:40 | coberturas-2811-4 | 65 años y antigüedad | Cumplir 65 no siempre te sube la cuota. | 65 | 59 | 7 | «tenés»: el almanaque cuenta de uno a diez años a toda velocidad (cuenta) | Gabriel (por su mamá) |
| coberturas-3011-a | 30/11 12:40 | coberturas-2911-1 | Monotributo y obra social | Tu monotributo no es solo un impuesto. | MONO | 64 | 8 | «obra»: la línea se despega del papel y se arma como credencial verde (despiece) | Lucía |
| coberturas-3011-b | 30/11 21:40 | coberturas-2911-3 | Carencias del PMO | Cambiarte de prepaga no congela todo un año. | CARENCIAS | 65 | 8 | «Tranqui»: el reloj de arena de un año cae, se rompe y la arena dibuja «PMO» (caida) | Gabriel |
| coberturas-0112-a | 01/12 12:40 | coberturas-3011-1 | Si falta el titular | Si falta el titular, la familia sigue cubierta. | TITULAR | 58 | 8 | Cuadro 1: la cocina se apaga y solo la credencial de la familia queda encendida (apagon) | Gabriel |
| coberturas-0112-b | 01/12 22:40 | coberturas-3011-4 | Elegir por cartilla | El nombre de la prepaga no te atiende. | ELEGIR | 59 | 8 | «Lucía»: tres caminos; dos chocan contra una pared y el tercero llega a una guardia iluminada (barrido) | Lucía |
| coberturas-0212-a | 02/12 12:40 | coberturas-0112-1 | El plan se da de baja | Te asignan otro plan: no es el único. | BAJA | 60 | 8 | «esperes»: un reloj gigante cae en primer plano y la mesa tiembla como gelatina (golpe) | Lucía |
| coberturas-0212-b | 02/12 18:10 | coberturas-0112-2 | Obra social en un trabajo nuevo | La obra social del trabajo la elegís vos. | NUEVO | 61 | 8 | «podés»: un sello gigante en cámara lenta estampa «Podés elegir» y saltan migas (sello) | Gabriel |

Redes: Instagram y Facebook en los 10, igual que los guiones base. La duración estimada es de 21 a 24 s, a unas 2,7 palabras por segundo, con un golpe cada 1,5 a 4,8 s. El efecto «wow» de cada reel es distinto. La voz termina con una frase cortada que empalma con el gancho, para el bucle.

## Por qué estos guiones base

- **Turno «a»:** el único guion de cada día antes de las 14:00 es el de las 12:40, así que la hora decide la base. Las 15:10 no sirven: no es antes de las 14 ni después de las 17.
- **Turno «b»:** de los guiones de las 18:10 a las 22:40, se eligió el gancho más fuerte con dato verificado. Quedaron afuera:
  - `coberturas-2711-g2` (AUTORIZACION), que ya tiene su propio plan;
  - `coberturas-0112-3` (MONO, parte 2), porque repetiría la palabra MONO dentro de la tanda.
- **MONO:** la parte 1 (`2911-1`) se cerró en una sola pieza con la respuesta de la parte 2: «una parte del monotributo ya va a una obra social». No queda colgada.

## Decisiones y avisos

1. **El copy no lleva «El botón está en el perfil.»**, aunque el contrato lo pide. La orden vigente del 20/11 dice «Nunca "el botón está en el perfil"», porque el botón no existe (`cerebro/02-ordenes-vigentes.md`, `14-estilo-del-dueno.md`). Además, `fuente/armar.py` la tiene como prohibida. Los planes de VITA y de Autos sí la incluyen: conviene unificar antes de programar.
2. **Personaje:** el contrato pide Lucía o Gabriel, así que se cambió el de cuatro bases:
   - Elsa → Gabriel en «65 años y antigüedad» (habla por su mamá) y en «Si falta el titular»;
   - las tres siluetas → Lucía en «Elegir por cartilla»;
   - Martina → Gabriel en «Trabajo nuevo».
3. **Datos:** cada dato legal es el del guion base, con la misma `fuente`. No hay cifras de aportes ni de cuotas, ni signo $. Las coberturas que dependen del plan van con «preguntá», «revisá» o «pedilo por escrito».
4. **65:** la ley cuenta la antigüedad en una o varias prepagas. Por eso la voz dice «más de diez años de antigüedad», sin «en la misma prepaga».
5. **Horarios:** cada plan usa la hora de su guion base, que en el calendario viejo es la misma hora del mismo día. Antes de programar, hay que revisar en Metricool que no quede duplicado.

## Validación (Python, 27/11)

Los 10 planes pasan:

- JSON válido;
- cada `beats[].palabra` está en la voz, en la ocurrencia `n`, y el buscador del motor (`escenas/*.js`, «empieza con») la ubica en la misma palabra;
- la voz tiene entre 58 y 65 palabras y la primera frase es el gancho;
- la palabra clave es la del guion base, se dice en la voz y no se repite en la tanda;
- hora, redes y fuente son las del guion base;
- no hay cifras con $, «Black Friday» ni frases prohibidas;
- los objetos y efectos son los del contrato, con 7 u 8 golpes y textos de hasta 5 palabras.
