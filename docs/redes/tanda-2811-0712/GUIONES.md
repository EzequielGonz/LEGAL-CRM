# Guiones de reels · tanda del 27/11 al 06/12/2026

Por marca y por día: **6 reels**. 4 con voz ElevenLabs y 2 con voz gratis del motor (edge-tts o Piper es-AR), que son variantes recicladas con edición fuerte de un guion de la misma tanda (otra fórmula, otro gancho, otro orden, otra escena). Más 4 de reserva con ElevenLabs por marca. Horarios en hora argentina.

Se arma con `fuente/armar.py` (datos en `fuente/<marca>.py`); los JSON están en `guiones/`. En cada guion: `motor_voz` es `elevenlabs` o `gratis`, `variante_de` dice de qué guion sale la variante y `redes` dice dónde sale.

Estado: **especificado** (guiones escritos y validados por el script). No producido, no programado, no publicado.

## Horarios

| Marca | ElevenLabs | Voz gratis |
|---|---|---|
| VITA | 08:40 · 11:10 · 13:40 · 21:10 | 16:10 · 19:40 |
| Compara Tu Obra Social | 12:40 · 18:10 · 21:40 · 22:40 | 15:10 · 20:10 |
| Automotores Kocos | 09:10 · 13:10 · 17:10 · 21:30 | 11:10 · 19:10 |
| Kocos Marketing | 08:10 · 12:20 · 18:40 · 21:20 | 10:10 · 15:40 |

VITA en Instagram sube de a poco: 2 reels por día el 27 y 28/11, 3 el 29 y 30/11, 4 el 1 y 2/12, 5 el 3 y 4/12 y 6 el 5 y 6/12. Facebook lleva los 6 desde el primer día. Hasta el 03/12 ningún tema de tránsito va a Instagram, salvo el boceto del 27/11 08:40.

## Caracteres de voz ElevenLabs

| Marca | Reels ElevenLabs | Caracteres | Promedio | Reels voz gratis |
|---|---|---|---|---|
| VITA | 44 | 10.384 | 236 | 20 |
| Compara Tu Obra Social | 44 | 9.706 | 220 | 20 |
| Automotores Kocos | 44 | 8.684 | 197 | 20 |
| Kocos Marketing | 44 | 8.668 | 197 | 20 |
| **Total** | **176** | **37.442** | 212 | 80 |

Tope pedido: 38.000 caracteres (presupuesto ElevenLabs 40.000). Dentro del tope. Las voces gratis no gastan ElevenLabs.

## Reparto de fórmulas por marca (todos los reels)

- **VITA:** tres cartas cerradas 8 · segunda persona «vos» 8 · escena con hora o número 7 · contador que avanza 7 · mito roto 7 · advertencia 6 · ¿cuál sos? (identidad) 6 · pregunta con respuesta numérica 5 · loop 5 · serie (parte 1) 2 · serie (parte 2) 2 · advertencia + escena con hora + contador + loop 1
- **Compara Tu Obra Social:** mito roto 8 · segunda persona «vos» 8 · advertencia 8 · escena con hora o número 7 · contador que avanza 6 · tres cartas cerradas 6 · ¿cuál sos? (identidad) 6 · pregunta con respuesta numérica 6 · loop 5 · serie (parte 1) 2 · serie (parte 2) 2
- **Automotores Kocos:** escena con hora o número 8 · tres cartas cerradas 8 · advertencia 8 · segunda persona «vos» 8 · loop 6 · mito roto 6 · pregunta con respuesta numérica 6 · ¿cuál sos? (identidad) 6 · contador que avanza 4 · serie (parte 1) 2 · serie (parte 2) 2
- **Kocos Marketing:** segunda persona «vos» 8 · advertencia 8 · tres cartas cerradas 7 · escena con hora o número 7 · pregunta con respuesta numérica 7 · ¿cuál sos? (identidad) 6 · mito roto 6 · contador que avanza 6 · loop 5 · serie (parte 1) 2 · serie (parte 2) 2

## VITA

| Día | Hora | Voz | Fórmula | Gancho | Palabra | Redes | Caracteres |
|---|---|---|---|---|---|---|---|
| 27/11 | 08:40 | ElevenLabs | advertencia + escena con hora + contador + loop | Recién chocaste. Esta frase, nunca. | NUNCA | IG + FB | 349 |
| 27/11 | 11:10 | ElevenLabs | escena con hora o número | Viernes 18:05: te despiden y te dan un papel. | DESPIDO | FB | 242 |
| 27/11 | 13:40 | ElevenLabs | tres cartas cerradas | Te llegó una citación penal. Tres cartas. | PENAL | FB | 252 |
| 27/11 | 16:10 | gratis (de vita-2711-2) | contador que avanza | Te despidieron por WhatsApp. | CHAT | FB | 206 |
| 27/11 | 19:40 | gratis (de vita-2711-3) | advertencia | Te amenazan por mensaje: no lo borres. | AMENAZA | FB | 154 |
| 27/11 | 21:10 | ElevenLabs | segunda persona «vos» | Heredaste la casa. ¿La podés vender mañana? | HERENCIA | IG + FB | 263 |
| 28/11 | 08:40 | ElevenLabs | mito roto | «Fue mi error, la ART no me cubre.» Falso. | CULPA | IG + FB | 261 |
| 28/11 | 11:10 | ElevenLabs | contador que avanza | Te chocaron: el reloj de 3 años ya corre. | PLAZO | FB | 246 |
| 28/11 | 13:40 | ElevenLabs | ¿cuál sos? (identidad) | Te vaciaron la cuenta por un link. ¿Cuál sos? | ESTAFA | FB | 246 |
| 28/11 | 16:10 | gratis (de vita-2711-4) | tres cartas cerradas | Hermanos y herencia: tres cartas. | HERMANOS | FB | 221 |
| 28/11 | 19:40 | gratis (de vita-2811-1) | escena con hora o número | Martes 19:15: otra vez dos horas de más. | HORAEXTRA | FB | 209 |
| 28/11 | 21:10 | ElevenLabs | pregunta con respuesta numérica | Aguinaldo: ¿qué día vence la segunda cuota? | AGUINALDO | IG + FB | 229 |
| 29/11 | 08:40 | ElevenLabs | serie (parte 1) | Parte 1: salió a trabajar y no llegó. | TRAYECTO | FB | 225 |
| 29/11 | 11:10 | ElevenLabs | loop | Te llevan detenido. ¿Qué decís? | DETENIDO | IG + FB | 207 |
| 29/11 | 13:40 | ElevenLabs | advertencia | Liquidación final: no firmes sin contar. | LIQUIDACION | IG + FB | 246 |
| 29/11 | 16:10 | gratis (de vita-2811-4) | segunda persona «vos» | Vos firmás el recibo. ¿Te quedás con copia? | RECIBO | IG + FB | 184 |
| 29/11 | 19:40 | gratis (de vita-2811-2) | tres cartas cerradas | Te piden un pagaré en blanco: tres cartas. | PAGARE | FB | 212 |
| 29/11 | 21:10 | ElevenLabs | escena con hora o número | 24/12, 23:40: te chocan llegando a la cena. | FIESTAS | FB | 229 |
| 30/11 | 08:40 | ElevenLabs | tres cartas cerradas | La ART te rechazó. Tres cartas para hoy. | ART | IG + FB | 231 |
| 30/11 | 11:10 | ElevenLabs | segunda persona «vos» | Te enterás por un mensaje: te denunciaron. | DENUNCIA | IG + FB | 224 |
| 30/11 | 13:40 | ElevenLabs | contador que avanza | Te fuiste: corren 45 días hábiles. | CERTIFICADO | IG + FB | 238 |
| 30/11 | 16:10 | gratis (de vita-2911-2) | ¿cuál sos? (identidad) | Te piden que seas garante. ¿Cuál sos? | GARANTE | FB | 243 |
| 30/11 | 19:40 | gratis (de vita-2911-3) | pregunta con respuesta numérica | Te vas en julio: ¿y las vacaciones? | VACACIONES | FB | 194 |
| 30/11 | 21:10 | ElevenLabs | mito roto | «No tenía seguro, perdí.» No tan rápido. | SEGURO | FB | 219 |
| 01/12 | 08:40 | ElevenLabs | ¿cuál sos? (identidad) | Te despiden: ¿cuál de las tres sos? | COPIA | IG + FB | 245 |
| 01/12 | 11:10 | ElevenLabs | pregunta con respuesta numérica | ART: ¿cuánto puede durar la baja? | REPOSO | IG + FB | 243 |
| 01/12 | 13:40 | ElevenLabs | serie (parte 2) | Parte 2: el choque de Nico también cuenta. | TRAYECTO | FB | 232 |
| 01/12 | 16:10 | gratis (de vita-2911-4) | advertencia | No firmes un alquiler sin leer esto. | ALQUILER | IG + FB | 164 |
| 01/12 | 19:40 | gratis (de vita-3011-1) | mito roto | «Me caí en la vereda, mala suerte.» | VEREDA | FB | 191 |
| 01/12 | 21:10 | ElevenLabs | loop | Te robaron el celular. «¿Para qué denunciar?» | ROBO | IG + FB | 240 |
| 02/12 | 08:40 | ElevenLabs | advertencia | Carta documento del trabajo: no la guardes. | TELEGRAMA | IG + FB | 233 |
| 02/12 | 11:10 | ElevenLabs | escena con hora o número | Tres años trabajando y cero recibos. | REGISTRO | IG + FB | 245 |
| 02/12 | 13:40 | ElevenLabs | tres cartas cerradas | Choque con heridos: tres cartas que no ves. | HERIDOS | FB | 223 |
| 02/12 | 16:10 | gratis (de vita-3011-2) | contador que avanza | Se rompió en garantía. Día 1, 10, 30. | ROTO | IG + FB | 210 |
| 02/12 | 19:40 | gratis (de vita-3011-3) | mito roto | «Facturo, así que no soy empleado.» | ENCUBIERTO | IG + FB | 235 |
| 02/12 | 21:10 | ElevenLabs | segunda persona «vos» | Estuviste 20 días sin trabajar por un choque. | DANOS | FB | 220 |
| 03/12 | 08:40 | ElevenLabs | contador que avanza | Te fuiste en agosto: el aguinaldo suma. | PROPORCIONAL | IG + FB | 242 |
| 03/12 | 11:10 | ElevenLabs | mito roto | «Sin testamento no hay herencia.» Falso. | HEREDEROS | IG + FB | 220 |
| 03/12 | 13:40 | ElevenLabs | ¿cuál sos? (identidad) | Te citan como testigo. ¿Cuál de los tres sos? | TESTIGO | IG + FB | 226 |
| 03/12 | 16:10 | gratis (de vita-0112-2) | segunda persona «vos» | Te mudaste y no te devuelven el depósito. | DEPOSITO | IG + FB | 207 |
| 03/12 | 19:40 | gratis (de vita-3011-4) | escena con hora o número | Jueves 22:00: la humedad del vecino llegó. | HUMEDAD | FB | 201 |
| 03/12 | 21:10 | ElevenLabs | pregunta con respuesta numérica | Cambiás el camino al trabajo: ¿72 horas? | RECORRIDO | IG + FB | 244 |
| 04/12 | 08:40 | ElevenLabs | serie (parte 1) | Parte 1: le ofrecen plata rápida a Nico. | FIRMA | IG + FB | 219 |
| 04/12 | 11:10 | ElevenLabs | loop | Seis de la mañana: golpean la puerta. | PUERTA | IG + FB | 225 |
| 04/12 | 13:40 | ElevenLabs | advertencia | «Arreglemos acá»: desconfiá de esa frase. | ARREGLO | IG + FB | 213 |
| 04/12 | 16:10 | gratis (de vita-0112-4) | tres cartas cerradas | Testamento: tres cartas antes de hacerlo. | TESTAMENTO | IG + FB | 198 |
| 04/12 | 19:40 | gratis (de vita-0112-1) | segunda persona «vos» | Trabajás en una casa y sin registrar. | CASAS | FB | 192 |
| 04/12 | 21:10 | ElevenLabs | escena con hora o número | Lunes 9:00: te mandan a otra sucursal. | SUCURSAL | IG + FB | 273 |
| 05/12 | 08:40 | ElevenLabs | tres cartas cerradas | ¿Heredás las deudas? Tres cartas. | DEUDAS | IG + FB | 238 |
| 05/12 | 11:10 | ElevenLabs | segunda persona «vos» | Cargás cajas hace años. La espalda, no. | ESPALDA | IG + FB | 229 |
| 05/12 | 13:40 | ElevenLabs | contador que avanza | Compra online: día 1, día 10, día 30. | ONLINE | IG + FB | 209 |
| 05/12 | 16:10 | gratis (de vita-0212-1) | ¿cuál sos? (identidad) | Te reclaman una deuda que no es tuya. | DEUDA | IG + FB | 225 |
| 05/12 | 19:40 | gratis (de vita-0212-2) | loop | Renunciaste por WhatsApp. ¿Y ahora? | RENUNCIAR | IG + FB | 218 |
| 05/12 | 21:10 | ElevenLabs | mito roto | «Si renuncio, no cobro nada.» Falso. | RENUNCIA | IG + FB | 252 |
| 06/12 | 08:40 | ElevenLabs | ¿cuál sos? (identidad) | Te lastimás en el trabajo: ¿cuál sos? | AVISO | IG + FB | 219 |
| 06/12 | 11:10 | ElevenLabs | pregunta con respuesta numérica | Te enfermás: ¿cuántos meses te pagan? | LICENCIA | IG + FB | 257 |
| 06/12 | 13:40 | ElevenLabs | serie (parte 2) | Parte 2: lo que firmás puede cerrarlo todo. | FIRMA | IG + FB | 208 |
| 06/12 | 16:10 | gratis (de vita-0212-3) | advertencia | Te dicen que te vayas mañana: no así. | DESALOJO | IG + FB | 159 |
| 06/12 | 19:40 | gratis (de vita-0212-4) | contador que avanza | Te enfermaste: hora 1, día 1, día 2. | MEDICO | IG + FB | 180 |
| 06/12 | 21:10 | ElevenLabs | loop | Te dieron el alta. Mañana volvés. Y duele. | ALTA | IG + FB | 244 |
| reserva |  | ElevenLabs | segunda persona «vos» | Te chocaron en bici: también hay reclamo. | BICI | IG + FB | 219 |
| reserva |  | ElevenLabs | escena con hora o número | Trabajás 48 horas y el recibo dice 20. | EXTRAS | IG + FB | 214 |
| reserva |  | ElevenLabs | mito roto | «Sin contrato no tengo derechos.» Falso. | CONTRATO | IG + FB | 228 |
| reserva |  | ElevenLabs | tres cartas cerradas | Casa heredada: 3 cartas antes de escriturar. | ESCRITURA | IG + FB | 217 |

## Compara Tu Obra Social

| Día | Hora | Voz | Fórmula | Gancho | Palabra | Redes | Caracteres |
|---|---|---|---|---|---|---|---|
| 27/11 | 12:40 | ElevenLabs | mito roto | «Con una enfermedad previa no me aceptan.» | PLAN | IG + FB | 246 |
| 27/11 | 15:10 | gratis (de coberturas-2711-1) | escena con hora o número | Jueves 15:10: la farmacia pide otra receta. | RECETA | IG + FB | 235 |
| 27/11 | 18:10 | ElevenLabs | segunda persona «vos» | Tu recibo tiene una línea que es tuya. | APORTES | IG + FB | 242 |
| 27/11 | 20:10 | gratis (de coberturas-2711-2) | contador que avanza | Te piden un estudio: paso 1, 2, 3. | AUTORIZACION | IG + FB | 202 |
| 27/11 | 21:40 | ElevenLabs | advertencia | Sumar a tu mamá: no lo hagas sin preguntar. | FAMILIA | IG + FB | 232 |
| 27/11 | 22:40 | ElevenLabs | tres cartas cerradas | Antes de cambiarte de prepaga: tres cartas. | CAMBIO | IG + FB | 253 |
| 28/11 | 12:40 | ElevenLabs | escena con hora o número | Lunes 9:00: te despiden. ¿Y la obra social? | TRABAJO | IG + FB | 252 |
| 28/11 | 15:10 | gratis (de coberturas-2711-3) | segunda persona «vos» | Vos vas al dentista. ¿Qué te cubre? | DENTISTA | IG + FB | 195 |
| 28/11 | 18:10 | ElevenLabs | ¿cuál sos? (identidad) | Te llega el aumento de la prepaga. ¿Cuál sos? | COMPARAR | IG + FB | 243 |
| 28/11 | 20:10 | gratis (de coberturas-2711-4) | pregunta con respuesta numérica | Internación programada: ¿cuántas preguntas? | INTERNACION | IG + FB | 211 |
| 28/11 | 21:40 | ElevenLabs | advertencia | Declaración jurada: no la llenes apurado. | DECLARACION | IG + FB | 251 |
| 28/11 | 22:40 | ElevenLabs | contador que avanza | Diez años en la misma prepaga: contá conmigo. | 65 | IG + FB | 240 |
| 29/11 | 12:40 | ElevenLabs | serie (parte 1) | Parte 1: Lucía paga y no sabe qué. | MONO | IG + FB | 201 |
| 29/11 | 15:10 | gratis (de coberturas-2811-1) | mito roto | «Si la prepaga dice que no, se terminó.» | RECLAMO | IG + FB | 206 |
| 29/11 | 18:10 | ElevenLabs | loop | 2 de la mañana: ¿tu guardia te atiende? | CARTILLA | IG + FB | 209 |
| 29/11 | 20:10 | gratis (de coberturas-2811-2) | advertencia | No pagues la factura sin mirar adicionales. | ADICIONALES | IG + FB | 181 |
| 29/11 | 21:40 | ElevenLabs | mito roto | «Si me cambio, espero un año para todo.» | CARENCIAS | IG + FB | 218 |
| 29/11 | 22:40 | ElevenLabs | segunda persona «vos» | Te vas a la costa. ¿Tu cobertura también? | VIAJE | IG + FB | 204 |
| 30/11 | 12:40 | ElevenLabs | pregunta con respuesta numérica | Si falta el titular: ¿cuánto sigue cubierta? | TITULAR | IG + FB | 212 |
| 30/11 | 15:10 | gratis (de coberturas-2811-3) | ¿cuál sos? (identidad) | Querés empezar terapia: ¿cuál sos? | TERAPIA | IG + FB | 200 |
| 30/11 | 18:10 | ElevenLabs | tres cartas cerradas | Te mudás de barrio: tres cartas. | MUDANZA | IG + FB | 221 |
| 30/11 | 20:10 | gratis (de coberturas-2811-4) | segunda persona «vos» | Vos necesitás anteojos nuevos. | ANTEOJOS | IG + FB | 159 |
| 30/11 | 21:40 | ElevenLabs | escena con hora o número | Martes 11:20: pagaste la consulta vos. | REINTEGRO | IG + FB | 241 |
| 30/11 | 22:40 | ElevenLabs | ¿cuál sos? (identidad) | Elegís prepaga: ¿cuál de los tres sos? | ELEGIR | IG + FB | 234 |
| 01/12 | 12:40 | ElevenLabs | advertencia | Tu plan se da de baja: no esperes. | BAJA | IG + FB | 212 |
| 01/12 | 15:10 | gratis (de coberturas-2911-2) | tres cartas cerradas | Remedios todos los meses: tres cartas. | CRONICO | IG + FB | 225 |
| 01/12 | 18:10 | ElevenLabs | contador que avanza | Primer día de trabajo: ¿qué obra social? | NUEVO | IG + FB | 223 |
| 01/12 | 20:10 | gratis (de coberturas-2911-4) | escena con hora o número | Martes 20:10: te ofrecen un plan más caro. | OFERTA | IG + FB | 209 |
| 01/12 | 21:40 | ElevenLabs | serie (parte 2) | Parte 2: esa línea es tu obra social. | MONO | IG + FB | 238 |
| 01/12 | 22:40 | ElevenLabs | loop | Estás en tratamiento y te querés cambiar. | TRATAMIENTO | IG + FB | 214 |
| 02/12 | 12:40 | ElevenLabs | mito roto | «La obra social del trabajo no se cambia.» | OPCION | IG + FB | 217 |
| 02/12 | 15:10 | gratis (de coberturas-3011-2) | loop | Se debitó la cuota. ¿Cuánto fue? | DEBITO | IG + FB | 183 |
| 02/12 | 18:10 | ElevenLabs | segunda persona «vos» | ¿Encontrás tu cartilla en un minuto? | URGENCIA | IG + FB | 180 |
| 02/12 | 20:10 | gratis (de coberturas-3011-3) | mito roto | «Mi hijo sigue en mi plan para siempre.» | HIJOS | IG + FB | 202 |
| 02/12 | 21:40 | ElevenLabs | pregunta con respuesta numérica | Suspendido sin goce: ¿cuántos meses cubierto? | SUSPENSION | IG + FB | 198 |
| 02/12 | 22:40 | ElevenLabs | tres cartas cerradas | Derivar aportes: tres cartas antes. | DERIVAR | IG + FB | 231 |
| 03/12 | 12:40 | ElevenLabs | escena con hora o número | 18/12: cobrás el aguinaldo y ves esto. | SAC | IG + FB | 241 |
| 03/12 | 15:10 | gratis (de coberturas-3011-4) | pregunta con respuesta numérica | Viajás afuera: ¿cuántas cosas preguntás? | EXTERIOR | IG + FB | 192 |
| 03/12 | 18:10 | ElevenLabs | ¿cuál sos? (identidad) | Tu familia y la cobertura: ¿cuál sos? | HOGAR | IG + FB | 207 |
| 03/12 | 20:10 | gratis (de coberturas-0112-1) | contador que avanza | Segunda opinión: paso 1, 2, 3. | OPINION | IG + FB | 217 |
| 03/12 | 21:40 | ElevenLabs | advertencia | No tires la factura de esa consulta. | FACTURA | IG + FB | 194 |
| 03/12 | 22:40 | ElevenLabs | contador que avanza | Cambiarte de obra social, paso a paso. | TRAMITE | IG + FB | 216 |
| 04/12 | 12:40 | ElevenLabs | serie (parte 1) | Parte 1: Vero pide licencia sin sueldo. | SINSUELDO | IG + FB | 208 |
| 04/12 | 15:10 | gratis (de coberturas-0112-2) | segunda persona «vos» | Te fuiste a vivir en pareja. ¿Y la cobertura? | PAREJA | IG + FB | 184 |
| 04/12 | 18:10 | ElevenLabs | loop | Este mes usaste la prepaga: ¿cuántas veces? | USO | IG + FB | 222 |
| 04/12 | 20:10 | gratis (de coberturas-0112-4) | advertencia | No arranques kinesio sin la orden. | KINESIO | IG + FB | 153 |
| 04/12 | 21:40 | ElevenLabs | mito roto | «A los 65 me suben la cuota sí o sí.» | EDAD | IG + FB | 199 |
| 04/12 | 22:40 | ElevenLabs | segunda persona «vos» | Temporada: ¿y la obra social en invierno? | TEMPORADA | IG + FB | 242 |
| 05/12 | 12:40 | ElevenLabs | pregunta con respuesta numérica | Sin trabajo: ¿cuánto hay que haber trabajado? | REQUISITO | IG + FB | 196 |
| 05/12 | 15:10 | gratis (de coberturas-0212-2) | escena con hora o número | Lunes 15:10: test positivo. | EMBARAZO | IG + FB | 181 |
| 05/12 | 18:10 | ElevenLabs | tres cartas cerradas | Enfermedad previa: tres cartas. | PREVIA | IG + FB | 256 |
| 05/12 | 20:10 | gratis (de coberturas-0212-3) | ¿cuál sos? (identidad) | Consulta por videollamada: ¿cuál sos? | VIDEO | IG + FB | 197 |
| 05/12 | 21:40 | ElevenLabs | escena con hora o número | Ruta 11, 23:00: fiebre lejos de casa. | COSTA | IG + FB | 211 |
| 05/12 | 22:40 | ElevenLabs | ¿cuál sos? (identidad) | Cambio en pleno tratamiento: ¿cuál sos? | CURSO | IG + FB | 236 |
| 06/12 | 12:40 | ElevenLabs | advertencia | Monotributo: no dejes de pagar la cuota. | VENCIMIENTO | IG + FB | 224 |
| 06/12 | 15:10 | gratis (de coberturas-0212-4) | mito roto | «La cartilla es siempre la misma.» | ACTUALIZADA | IG + FB | 159 |
| 06/12 | 18:10 | ElevenLabs | contador que avanza | Mudanza: día 1, día 7, día 30. | BARRIO | IG + FB | 179 |
| 06/12 | 20:10 | gratis (de coberturas-0312-1) | pregunta con respuesta numérica | Turno médico: ¿cuántos datos a mano? | TURNOS | IG + FB | 156 |
| 06/12 | 21:40 | ElevenLabs | serie (parte 2) | Parte 2: Vero puede mantener su obra social. | SINSUELDO | IG + FB | 225 |
| 06/12 | 22:40 | ElevenLabs | loop | Somos cuatro. ¿Cuántas coberturas pagamos? | GRUPO | IG + FB | 176 |
| reserva |  | ElevenLabs | advertencia | No pagues el aumento sin leer la carta. | AUMENTO | IG + FB | 206 |
| reserva |  | ElevenLabs | mito roto | «Obra social y prepaga son lo mismo.» No. | DIFERENCIA | IG + FB | 220 |
| reserva |  | ElevenLabs | segunda persona «vos» | Tu hijo empieza a trabajar: ¿y su cobertura? | HIJO | IG + FB | 228 |
| reserva |  | ElevenLabs | tres cartas cerradas | Excedencia: tres cartas de tu obra social. | EXCEDENCIA | IG + FB | 208 |

## Automotores Kocos

| Día | Hora | Voz | Fórmula | Gancho | Palabra | Redes | Caracteres |
|---|---|---|---|---|---|---|---|
| 27/11 | 09:10 | ElevenLabs | escena con hora o número | Sábado 11:30: la lista y la sorpresa. | 0KM | IG + FB | 249 |
| 27/11 | 11:10 | gratis (de autos-2711-1) | loop | ¿Dónde está tu póliza? En el celu también. | DIGITAL | IG + FB | 171 |
| 27/11 | 13:10 | ElevenLabs | tres cartas cerradas | «Te lo damos en la cuota 2»: tres cartas. | SORTEO | IG + FB | 269 |
| 27/11 | 17:10 | ElevenLabs | advertencia | No dejes una seña sin recibo. | SENA | IG + FB | 227 |
| 27/11 | 19:10 | gratis (de autos-2711-2) | mito roto | «Todo riesgo cubre todo.» No siempre. | FRANQUICIA | IG + FB | 201 |
| 27/11 | 21:30 | ElevenLabs | segunda persona «vos» | Vos elegí la cuota antes que el auto. | CUOTA | IG + FB | 223 |
| 28/11 | 09:10 | ElevenLabs | pregunta con respuesta numérica | ¿Cuántos costos se suman al precio de lista? | COSTOS | IG + FB | 224 |
| 28/11 | 11:10 | gratis (de autos-2711-3) | escena con hora o número | Sábado 23:00: el 0 km queda en la calle. | NOCHE | IG + FB | 192 |
| 28/11 | 13:10 | ElevenLabs | ¿cuál sos? (identidad) | ¿Qué comprador de 0 km sos? | GASTOS | IG + FB | 245 |
| 28/11 | 17:10 | ElevenLabs | contador que avanza | Retiro del 0 km: 5 chequeos antes de firmar. | LLAVE | IG + FB | 232 |
| 28/11 | 19:10 | gratis (de autos-2711-4) | ¿cuál sos? (identidad) | Seguro del 0 km: ¿cuál sos? | POLIZAS | IG + FB | 197 |
| 28/11 | 21:30 | ElevenLabs | mito roto | «La cuota del plan es fija.» No. | AHORRO | IG + FB | 248 |
| 29/11 | 09:10 | ElevenLabs | serie (parte 1) | Parte 1: Mati quiere entregar «el gris». | USADO | IG + FB | 195 |
| 29/11 | 11:10 | gratis (de autos-2811-1) | advertencia | No mires solo la tasa: pedí el costo total. | CFT | IG + FB | 189 |
| 29/11 | 13:10 | ElevenLabs | loop | Diciembre o enero: ¿cuándo lo patentás? | ENERO | IG + FB | 236 |
| 29/11 | 17:10 | ElevenLabs | escena con hora o número | Sábado 17:10: lo probaste dos minutos. | PRUEBA | IG + FB | 198 |
| 29/11 | 19:10 | gratis (de autos-2811-2) | segunda persona «vos» | Vos llevás a tu sobrino de 8 adelante. | ATRAS | IG + FB | 205 |
| 29/11 | 21:30 | ElevenLabs | tres cartas cerradas | Plan de ahorro: tres cartas antes de firmar. | PREGUNTAS | IG + FB | 203 |
| 30/11 | 09:10 | ElevenLabs | advertencia | Precio de palabra: desconfiá. | PRESUPUESTO | IG + FB | 191 |
| 30/11 | 11:10 | gratis (de autos-2811-3) | tres cartas cerradas | Vendés tu usado: tres cartas. | TRANSFERENCIA | IG + FB | 202 |
| 30/11 | 13:10 | ElevenLabs | segunda persona «vos» | Vas por tu primer 0 km: llevá esto. | PRIMERO | IG + FB | 197 |
| 30/11 | 17:10 | ElevenLabs | pregunta con respuesta numérica | ¿Qué tiene que traer tu 0 km al retirarlo? | KIT | IG + FB | 177 |
| 30/11 | 19:10 | gratis (de autos-2811-4) | escena con hora o número | Lunes 9:10: te escriben por tu usado. | USADOPAGO | IG + FB | 181 |
| 30/11 | 21:30 | ElevenLabs | ¿cuál sos? (identidad) | Contado, prendario o plan: ¿cuál sos? | FORMA | IG + FB | 202 |
| 01/12 | 09:10 | ElevenLabs | contador que avanza | Kilómetro 0, 500, 1.000: el primer service. | SERVICE | IG + FB | 215 |
| 01/12 | 11:10 | gratis (de autos-2911-2) | pregunta con respuesta numérica | ¿Cuántos tienen que usar cinturón? | CINTURON | IG + FB | 186 |
| 01/12 | 13:10 | ElevenLabs | mito roto | «El seguro lo veo después.» No. | CIRCULAR | IG + FB | 209 |
| 01/12 | 17:10 | ElevenLabs | serie (parte 2) | Parte 2: así vale más «el gris». | USADO | IG + FB | 204 |
| 01/12 | 19:10 | gratis (de autos-2911-3) | ¿cuál sos? (identidad) | ¿Cómo viaja tu perro en el auto? | MASCOTA | IG + FB | 214 |
| 01/12 | 21:30 | ElevenLabs | loop | ¿Un híbrido? Primero, esto. | HIBRIDO | IG + FB | 194 |
| 02/12 | 09:10 | ElevenLabs | escena con hora o número | Viernes 6:00: primer viaje con el 0 km. | SALIDA | IG + FB | 182 |
| 02/12 | 11:10 | gratis (de autos-2911-4) | segunda persona «vos» | Vos guardás la llave de repuesto en el auto. | REPUESTO | IG + FB | 159 |
| 02/12 | 13:10 | ElevenLabs | tres cartas cerradas | Crédito prendario: tres cartas. | PRENDARIO | IG + FB | 201 |
| 02/12 | 17:10 | ElevenLabs | advertencia | No te vayas sin estos papeles. | PAPELES | IG + FB | 180 |
| 02/12 | 19:10 | gratis (de autos-3011-1) | pregunta con respuesta numérica | ¿Cuántos papeles llevás para manejar? | CIRCULACION | IG + FB | 148 |
| 02/12 | 21:30 | ElevenLabs | segunda persona «vos» | Cobrás el aguinaldo. ¿Va al anticipo? | EXTRA | IG + FB | 211 |
| 03/12 | 09:10 | ElevenLabs | pregunta con respuesta numérica | Tu cochera: ¿cuántas medidas tomás? | COCHERA | IG + FB | 210 |
| 03/12 | 11:10 | gratis (de autos-3011-4) | advertencia | No salgas con la licencia vencida. | VENCIDA | IG + FB | 171 |
| 03/12 | 13:10 | ElevenLabs | ¿cuál sos? (identidad) | En el showroom, ¿cuál de los tres sos? | SHOWROOM | IG + FB | 218 |
| 03/12 | 17:10 | ElevenLabs | contador que avanza | Faltan tres días para la entrega. | PREPARAR | IG + FB | 156 |
| 03/12 | 19:10 | gratis (de autos-3011-3) | loop | Escuchás un ruido nuevo en el 0 km. | RUIDO | IG + FB | 173 |
| 03/12 | 21:30 | ElevenLabs | mito roto | «El más barato es el que más conviene.» | BARATO | IG + FB | 179 |
| 04/12 | 09:10 | ElevenLabs | serie (parte 1) | Parte 1: Juli lo quiere antes de las fiestas. | ENTREGA | IG + FB | 184 |
| 04/12 | 11:10 | gratis (de autos-0112-2) | segunda persona «vos» | Vos querés usarlo para trabajar con apps. | APPS | IG + FB | 160 |
| 04/12 | 13:10 | ElevenLabs | loop | ¿Qué trae el 0 km? Preguntá antes. | VERSION | IG + FB | 183 |
| 04/12 | 17:10 | ElevenLabs | escena con hora o número | Viernes 17:10: el auto es de otro color. | COLOR | IG + FB | 180 |
| 04/12 | 19:10 | gratis (de autos-0212-2) | mito roto | «El auxilio viene listo, no lo reviso.» | AUXILIO | IG + FB | 174 |
| 04/12 | 21:30 | ElevenLabs | tres cartas cerradas | Garantía del 0 km: tres cartas. | GARANTIA | IG + FB | 168 |
| 05/12 | 09:10 | ElevenLabs | advertencia | No elijas la cuota sin sumar todo. | ANTICIPO | IG + FB | 199 |
| 05/12 | 11:10 | gratis (de autos-0212-4) | tres cartas cerradas | Antirrobo: tres cartas. | ANTIRROBO | IG + FB | 195 |
| 05/12 | 13:10 | ElevenLabs | segunda persona «vos» | Vos le prestás el auto a tu hermano. | CONDUCTOR | IG + FB | 190 |
| 05/12 | 17:10 | ElevenLabs | pregunta con respuesta numérica | Plan de ahorro: ¿de cuántas formas te lo dan? | LICITACION | IG + FB | 180 |
| 05/12 | 19:10 | gratis (de autos-0312-2) | escena con hora o número | Ruta 2, 14:00: tres horas al volante. | DESCANSO | IG + FB | 166 |
| 05/12 | 21:30 | ElevenLabs | ¿cuál sos? (identidad) | Primer mes con el 0 km: ¿cuál sos? | MANUAL | IG + FB | 189 |
| 06/12 | 09:10 | ElevenLabs | contador que avanza | Comprar un 0 km en cuatro pasos. | PASOS | IG + FB | 157 |
| 06/12 | 11:10 | gratis (de autos-0412-2) | tres cartas cerradas | Antes de arrancar: tres cartas. | ESPEJOS | IG + FB | 175 |
| 06/12 | 13:10 | ElevenLabs | mito roto | «Es nuevo, no reviso las cubiertas.» Error. | PRESION | IG + FB | 176 |
| 06/12 | 17:10 | ElevenLabs | serie (parte 2) | Parte 2: la fecha de entrega, por escrito. | ENTREGA | IG + FB | 165 |
| 06/12 | 19:10 | gratis (de autos-0412-4) | advertencia | No le cargues cualquier nafta. | NAFTA | IG + FB | 122 |
| 06/12 | 21:30 | ElevenLabs | loop | Se prende una luz en el tablero. | TABLERO | IG + FB | 181 |
| reserva |  | ElevenLabs | segunda persona «vos» | Querés sumarle accesorios. Antes, esto. | ACCESORIOS | IG + FB | 179 |
| reserva |  | ElevenLabs | advertencia | No firmes la orden sin leer el modelo. | COMPRA | IG + FB | 143 |
| reserva |  | ElevenLabs | escena con hora o número | Lunes 9:10: señaste el sábado. ¿Tenés recibo? | COMPROBANTE | IG + FB | 162 |
| reserva |  | ElevenLabs | tres cartas cerradas | Licitar en un plan: tres cartas. | LICITAR | IG + FB | 173 |

## Kocos Marketing

| Día | Hora | Voz | Fórmula | Gancho | Palabra | Redes | Caracteres |
|---|---|---|---|---|---|---|---|
| 27/11 | 08:10 | ElevenLabs | segunda persona «vos» | Atendés el local y el celular no para. | ORDEN | IG + FB | 216 |
| 27/11 | 10:10 | gratis (de marketing-2711-1) | tres cartas cerradas | Tiempo de entrega: tres cartas. | ENTREGA24 | IG + FB | 182 |
| 27/11 | 12:20 | ElevenLabs | escena con hora o número | 21:03: te piden precio. Contestás mañana. | CRM | IG + FB | 278 |
| 27/11 | 15:40 | gratis (de marketing-2711-2) | ¿cuál sos? (identidad) | Te piden cambiar un producto: ¿cuál sos? | CAMBIOS | IG + FB | 202 |
| 27/11 | 18:40 | ElevenLabs | mito roto | «El precio se pasa por privado.» Error. | RESPUESTAS | IG + FB | 238 |
| 27/11 | 21:20 | ElevenLabs | contador que avanza | Un segundo, dos, tres: tu cliente se fue. | WEB | IG + FB | 244 |
| 28/11 | 08:10 | ElevenLabs | tres cartas cerradas | Tres respuestas rápidas que te faltan. | RAPIDAS | IG + FB | 200 |
| 28/11 | 10:10 | gratis (de marketing-2711-3) | escena con hora o número | Lunes 10:10: piden lo que no tenés. | AGOTADO | IG + FB | 186 |
| 28/11 | 12:20 | ElevenLabs | pregunta con respuesta numérica | «Lo pienso»: ¿cuántas veces volvés? | SEGUIR | IG + FB | 229 |
| 28/11 | 15:40 | gratis (de marketing-2711-4) | segunda persona «vos» | Vos pasás el precio, pero ¿y el envío? | ENVIO | IG + FB | 168 |
| 28/11 | 18:40 | ElevenLabs | advertencia | Desconfiá de tus fotos de stock. | FOTOS | IG + FB | 243 |
| 28/11 | 21:20 | ElevenLabs | ¿cuál sos? (identidad) | ¿Qué vendedor de WhatsApp sos? | VENDEDOR | IG + FB | 227 |
| 29/11 | 08:10 | ElevenLabs | serie (parte 1) | Parte 1: 3:12 a. m., alguien quiere comprar. | MADRUGADA | IG + FB | 210 |
| 29/11 | 10:10 | gratis (de marketing-2811-1) | advertencia | No digas «llegamos a todos lados». | ZONA | IG + FB | 148 |
| 29/11 | 12:20 | ElevenLabs | loop | Tu bio tiene tres segundos. Contá. | BIO | IG + FB | 187 |
| 29/11 | 15:40 | gratis (de marketing-2811-2) | escena con hora o número | Sábado 15:40: vienen a retirar y cerraste. | RETIRO | IG + FB | 170 |
| 29/11 | 18:40 | ElevenLabs | segunda persona «vos» | Vos no sabés en qué quedó cada chat. | ETIQUETAS | IG + FB | 173 |
| 29/11 | 21:20 | ElevenLabs | escena con hora o número | Domingo 10:15: «¿abren hoy?». | HORARIO | IG + FB | 213 |
| 30/11 | 08:10 | ElevenLabs | mito roto | «Pedir reseñas queda mal.» No. | RESENAS | IG + FB | 194 |
| 30/11 | 10:10 | gratis (de marketing-2811-3) | loop | Pedido grande. ¿Pediste seña? | SENIA | IG + FB | 168 |
| 30/11 | 12:20 | ElevenLabs | contador que avanza | Diciembre: tu WhatsApp listo en cinco pasos. | CHECKLIST | IG + FB | 181 |
| 30/11 | 15:40 | gratis (de marketing-2811-4) | mito roto | «Si lo hablamos por audio, ya está.» | CONFIRMAR | IG + FB | 172 |
| 30/11 | 18:40 | ElevenLabs | tres cartas cerradas | WhatsApp común, Business o API: tres cartas. | API | IG + FB | 224 |
| 30/11 | 21:20 | ElevenLabs | pregunta con respuesta numérica | Tomi abrió Instagram: ¿cuántos sin ver? | SOLICITUDES | IG + FB | 207 |
| 01/12 | 08:10 | ElevenLabs | advertencia | No cierres por las fiestas sin este mensaje. | AUSENCIA | IG + FB | 149 |
| 01/12 | 10:10 | gratis (de marketing-2911-2) | pregunta con respuesta numérica | ¿Cuántos días antes recordás la entrega? | RECORDATORIO | IG + FB | 137 |
| 01/12 | 12:20 | ElevenLabs | ¿cuál sos? (identidad) | ¿Qué local sos en Google? | GOOGLE | IG + FB | 187 |
| 01/12 | 15:40 | gratis (de marketing-3011-1) | contador que avanza | Cliente 1, 2, 3: los de siempre. | FRECUENTE | IG + FB | 157 |
| 01/12 | 18:40 | ElevenLabs | serie (parte 2) | Parte 2: a las 3:12 contesta el automático. | MADRUGADA | IG + FB | 178 |
| 01/12 | 21:20 | ElevenLabs | loop | Abrí tu web en el celular. Ahora. | CELULAR | IG + FB | 181 |
| 02/12 | 08:10 | ElevenLabs | segunda persona «vos» | Tu catálogo de WhatsApp está vacío. | CATALOGO | IG + FB | 168 |
| 02/12 | 10:10 | gratis (de marketing-3011-2) | tres cartas cerradas | Combos: tres cartas antes de armarlos. | COMBO | IG + FB | 178 |
| 02/12 | 12:20 | ElevenLabs | escena con hora o número | 18/12: cobran el aguinaldo y te escriben. | DIECIOCHO | IG + FB | 204 |
| 02/12 | 15:40 | gratis (de marketing-3011-4) | advertencia | No pongas nombres que nadie entiende. | NOMBRES | IG + FB | 157 |
| 02/12 | 18:40 | ElevenLabs | mito roto | «Contestar rápido es de desesperado.» No. | RAPIDO | IG + FB | 206 |
| 02/12 | 21:20 | ElevenLabs | contador que avanza | La misma pregunta 10, 20, 30 veces. | FRECUENTES | IG + FB | 188 |
| 03/12 | 08:10 | ElevenLabs | tres cartas cerradas | Tus estados de WhatsApp: tres cartas. | ESTADOS | IG + FB | 170 |
| 03/12 | 10:10 | gratis (de marketing-0112-1) | segunda persona «vos» | Vos sacás fotos. ¿Probaste un video de 5 s? | VIDEO5 | IG + FB | 185 |
| 03/12 | 12:20 | ElevenLabs | pregunta con respuesta numérica | ¿Cuántos pasos para escribirte por WhatsApp? | LINK | IG + FB | 203 |
| 03/12 | 15:40 | gratis (de marketing-0112-2) | escena con hora o número | Martes 15:40: tres comentarios sin respuesta. | COMENTARIOS | IG + FB | 175 |
| 03/12 | 18:40 | ElevenLabs | advertencia | No le mandes un audio de tres minutos. | AUDIOS | IG + FB | 197 |
| 03/12 | 21:20 | ElevenLabs | ¿cuál sos? (identidad) | ¿Qué foto de producto subís? | PRODUCTO | IG + FB | 193 |
| 04/12 | 08:10 | ElevenLabs | serie (parte 1) | Parte 1: el pedido de la torta se perdió. | PEDIDOS | IG + FB | 174 |
| 04/12 | 10:10 | gratis (de marketing-0112-4) | ¿cuál sos? (identidad) | Tu perfil arriba: ¿qué tenés fijado? | FIJADAS | IG + FB | 201 |
| 04/12 | 12:20 | ElevenLabs | loop | Abrís WhatsApp: 52 chats en verde. | VERDES | IG + FB | 209 |
| 04/12 | 15:40 | gratis (de marketing-0212-2) | contador que avanza | Destacadas: 1, 2, 3, 4. | DESTACADAS | IG + FB | 136 |
| 04/12 | 18:40 | ElevenLabs | segunda persona «vos» | Vos respondés el precio y... ¿después? | PASO | IG + FB | 177 |
| 04/12 | 21:20 | ElevenLabs | escena con hora o número | Martes 16:40: un mensaje de hace 9 días. | INSTAGRAM | IG + FB | 217 |
| 05/12 | 08:10 | ElevenLabs | mito roto | «La API es solo para empresas grandes.» | VOLUMEN | IG + FB | 221 |
| 05/12 | 10:10 | gratis (de marketing-0212-3) | advertencia | No mandes un presupuesto por audio. | PRESUPUESTOS | IG + FB | 140 |
| 05/12 | 12:20 | ElevenLabs | contador que avanza | Hora 24, día 3, día 7: el seguimiento. | CALENDARIO | IG + FB | 185 |
| 05/12 | 15:40 | gratis (de marketing-0212-4) | pregunta con respuesta numérica | ¿Cuántos mensajes para explicar cómo llegar? | UBICACION | IG + FB | 173 |
| 05/12 | 18:40 | ElevenLabs | tres cartas cerradas | Te dejaron una reseña de una estrella. | ESTRELLA | IG + FB | 211 |
| 05/12 | 21:20 | ElevenLabs | pregunta con respuesta numérica | ¿Cuántos medios de pago mostrás? | PAGOS | IG + FB | 177 |
| 06/12 | 08:10 | ElevenLabs | advertencia | No pongas «consultar precio» en el catálogo. | DESDE | IG + FB | 171 |
| 06/12 | 10:10 | gratis (de marketing-0312-3) | segunda persona «vos» | Vos entregaste el pedido. ¿Y después? | GRACIAS | IG + FB | 148 |
| 06/12 | 12:20 | ElevenLabs | ¿cuál sos? (identidad) | ¿Qué tipo de estados de WhatsApp subís? | VIDRIERA | IG + FB | 184 |
| 06/12 | 15:40 | gratis (de marketing-0412-3) | mito roto | «Cuantas más opciones, más vendo.» | OPCIONES | IG + FB | 177 |
| 06/12 | 18:40 | ElevenLabs | serie (parte 2) | Parte 2: los pedidos, en un solo lugar. | PEDIDOS | IG + FB | 163 |
| 06/12 | 21:20 | ElevenLabs | loop | «¿Abren hoy?» Otra vez. | ABREN | IG + FB | 195 |
| reserva |  | ElevenLabs | advertencia | Tu foto de perfil no se entiende chiquita. | FOTO | IG + FB | 181 |
| reserva |  | ElevenLabs | tres cartas cerradas | Mensaje de bienvenida: tres cartas. | BIENVENIDA | IG + FB | 155 |
| reserva |  | ElevenLabs | pregunta con respuesta numérica | ¿A cuántos clientes les avisás de lo nuevo? | DIFUSION | IG + FB | 173 |
| reserva |  | ElevenLabs | segunda persona «vos» | Volvés de vacaciones y hay 80 chats. | VOLVIMOS | IG + FB | 187 |
